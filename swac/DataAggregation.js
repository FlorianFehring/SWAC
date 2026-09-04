/**
 * Provides reusable time filtering and interval aggregation for datasets.
 */
export default class DataAggregation {

    constructor() {
        this.name = 'DataAggregation';
        this.options = {};
        this.desc = {
            text: 'Filters time series and groups values into configurable intervals.',
            developers: 'Florian Fehring (HSBI)',
            license: 'GNU Lesser General Public License',
            depends: [], reqPerSet: [], optPerSet: [], opts: [], events: [],
            funcs: [], templates: [], styles: [], reqPerTpl: [], optPerTpl: []
        };
        this.desc.funcs[0] = {
            name: 'filterByTime',
            desc: 'Filters datasets by a time range.',
            params: [
                {name: 'sets', type: 'Array', desc: 'Datasets to filter.'},
                {name: 'timeAttr', type: 'String', desc: 'Timestamp attribute.'},
                {name: 'from', type: 'Date|null', desc: 'Start of the range.'},
                {name: 'to', type: 'Date|null', desc: 'End of the range.'}
            ],
            returns: {type: 'Array', desc: 'Filtered datasets.'}
        };
        this.desc.funcs[1] = {
            name: 'aggregateSets',
            desc: 'Aggregates numeric attributes and retains representative values for other attributes.',
            params: [
                {name: 'sets', type: 'Array', desc: 'Datasets to aggregate.'},
                {name: 'timeAttr', type: 'String', desc: 'Timestamp attribute.'},
                {name: 'aggregation', type: 'Object', desc: 'Interval amount and unit.'}
            ],
            returns: {type: 'Array', desc: 'Aggregated datasets.'}
        };
        this.desc.funcs[2] = {
            name: 'mostFrequentValue',
            desc: 'Gets the most frequent value from an array.',
            params: [{name: 'values', type: 'Array', desc: 'Values to evaluate.'}],
            returns: {type: 'Any', desc: 'Most frequent value or null.'}
        };
    }

    /**
     * Filters datasets by a time range.
     *
     * @param {Array} sets Datasets to filter
     * @param {String} timeAttr Attribute containing the timestamp
     * @param {Date|null} from Start of the range
     * @param {Date|null} to End of the range
     * @returns {Array} Filtered datasets
     */
    static filterByTime(sets, timeAttr, from = null, to = null) {
        if (!timeAttr || (!from && !to))
            return sets.slice();

        return sets.filter(function (set) {
            let date = new Date(set[timeAttr]);
            if (isNaN(date.valueOf()))
                return false;
            if (from && date < from)
                return false;
            if (to && date > to)
                return false;
            return true;
        });
    }

    /**
     * Aggregates numeric attributes into time intervals.
     *
     * @param {Array} sets Datasets to aggregate
     * @param {String} timeAttr Attribute containing the timestamp
     * @param {Object} aggregation Interval amount and unit
     * @returns {Array} Aggregated datasets
     */
    static aggregateSets(sets, timeAttr, aggregation) {
        if (!timeAttr || !aggregation)
            return sets;

        let unitMs = {
            seconds: 1000,
            minutes: 60000,
            hours: 3600000,
            days: 86400000
        };
        let bucketMs = aggregation.amount * unitMs[aggregation.unit];
        if (!Number.isFinite(bucketMs) || bucketMs <= 0)
            return sets;

        let buckets = new Map();
        for (let set of sets) {
            let date = new Date(set[timeAttr]);
            if (isNaN(date.valueOf()))
                continue;
            let key = Math.floor(date.getTime() / bucketMs);
            if (!buckets.has(key))
                buckets.set(key, []);
            buckets.get(key).push(set);
        }

        let result = [];
        for (let [key, group] of buckets) {
            let aggregated = Object.assign({}, group[0]);
            let attrs = new Set();
            for (let set of group) {
                for (let attr in set) {
                    if (attr.startsWith('swac_') || attr === 'id' || attr === timeAttr)
                        continue;
                    attrs.add(attr);
                }
            }

            for (let attr of attrs) {
                let sum = 0;
                let count = 0;
                let values = [];
                for (let set of group) {
                    if (set[attr] !== null && set[attr] !== undefined)
                        values.push(set[attr]);
                    let value = this.toNumber(set[attr]);
                    if (value === null)
                        continue;
                    sum += value;
                    count++;
                }
                if (count > 0)
                    aggregated[attr] = Math.round((sum / count) * 1000) / 1000;
                else if (values.length > 0)
                    aggregated[attr] = this.mostFrequentValue(values);
            }
            aggregated[timeAttr] = this.toIsoLocal(new Date(key * bucketMs));
            aggregated.swac_aggregateCount = group.length;
            result.push(aggregated);
        }
        return result;
    }

    /**
     * Gets the most frequent value while retaining the first value on ties.
     *
     * @param {Array} values Values to evaluate
     * @returns {*} Most frequent value or null
     */
    static mostFrequentValue(values) {
        let counts = new Map();
        let result = null;
        let highestCount = 0;
        for (let value of values) {
            let key = this.valueKey(value);
            let count = (counts.get(key) || 0) + 1;
            counts.set(key, count);
            if (count > highestCount) {
                highestCount = count;
                result = value;
            }
        }
        return result;
    }

    /**
     * Creates a comparable key for a dataset value.
     *
     * @param {*} value Dataset value
     * @returns {String} Value key
     */
    static valueKey(value) {
        if (value && typeof value === 'object') {
            try {
                return typeof value + ':' + JSON.stringify(value);
            } catch (e) {
                return typeof value + ':' + String(value);
            }
        }
        return typeof value + ':' + String(value);
    }

    /**
     * Checks if a value can be used as a number.
     *
     * @param {*} value Value to check
     * @returns {Boolean} True for finite numbers and numeric strings
     */
    static isNumericValue(value) {
        return this.toNumber(value) !== null;
    }

    /**
     * Converts a numeric value into a number.
     *
     * @param {*} value Value to convert
     * @returns {Number|null} Converted number
     */
    static toNumber(value) {
        if (typeof value === 'number')
            return Number.isFinite(value) ? value : null;
        if (typeof value !== 'string' || value.trim() === '' || this.looksLikeDate(value))
            return null;
        let number = Number(value);
        return Number.isFinite(number) ? number : null;
    }

    /**
     * Checks if a string contains a date.
     *
     * @param {*} value Value to check
     * @returns {Boolean} True for supported date strings
     */
    static looksLikeDate(value) {
        if (typeof value !== 'string')
            return false;
        if (!/^\d{4}-\d{2}-\d{2}/.test(value) && !/^\d{1,2}\.\d{1,2}\.\d{4}/.test(value))
            return false;
        return !isNaN(new Date(value).valueOf());
    }

    /**
     * Converts a date to a local ISO like string.
     *
     * @param {Date} date Date to convert
     * @returns {String} Local timestamp
     */
    static toIsoLocal(date) {
        let pad = number => (number < 10 ? '0' + number : '' + number);
        return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate())
                + 'T' + pad(date.getHours()) + ':' + pad(date.getMinutes()) + ':' + pad(date.getSeconds());
    }
}
