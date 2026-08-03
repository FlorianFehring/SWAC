/**
 * Adapts unknown json structures into flat SWAC compatible datasets.
 *
 * The adapter is deterministic and does not know domain specific sources. It
 * searches for table like object lists, flattens nested objects and converts
 * numeric strings into numbers. A later AI based adapter can use the same
 * result structure.
 */
export default class DataSourceAdapter {

    /**
     * Adapts a data capsule into flat datasets.
     *
     * @param {Object} dataCapsule Data capsule with a data attribute
     * @param {Object} options Adapter options
     * @returns {Object} Adaptation result
     */
    static adaptCapsule(dataCapsule, options = {}) {
        let source = dataCapsule && typeof dataCapsule === 'object'
                && typeof dataCapsule.data !== 'undefined'
                ? dataCapsule.data
                : dataCapsule;
        let candidate = this.findBestArray(source);
        if (!candidate) {
            return this.emptyResult('Json not suitable. No table like object list found.');
        }

        let attrMap = {};
        let usedAttrs = {};
        let attrLabels = {};
        let sets = [];
        for (let i = 0; i < candidate.rows.length; i++) {
            let curRow = this.toRowObject(candidate.rows[i]);
            if (!curRow)
                continue;
            let flat = {};
            this.flattenObject(curRow, '', flat);
            let set = this.normalizeSet(flat, i + 1, attrMap, usedAttrs, attrLabels);
            if (Object.keys(set).length > 1)
                sets.push(set);
        }

        if (sets.length === 0)
            return this.emptyResult('Json not suitable. No usable row values found.');

        let numericAttrs = this.detectNumericAttrs(sets);
        let dateAttrs = this.detectDateAttrs(sets);
        let timeAttr = this.chooseTimeAttr(dateAttrs);
        if (timeAttr && timeAttr !== 'ts' && !this.hasAttribute(sets, 'ts')) {
            for (let curSet of sets) {
                if (typeof curSet[timeAttr] !== 'undefined')
                    curSet.ts = curSet[timeAttr];
            }
            attrLabels.ts = attrLabels[timeAttr] || timeAttr;
            dateAttrs.push('ts');
            timeAttr = 'ts';
        }

        return {
            usable: true,
            sets: sets,
            rowPath: candidate.path,
            rowCount: sets.length,
            attrLabels: attrLabels,
            numericAttrs: numericAttrs,
            dateAttrs: dateAttrs,
            timeAttr: timeAttr,
            warnings: numericAttrs.length === 0 ? ['No numeric attributes detected.'] : []
        };
    }

    /**
     * Creates an empty adaptation result.
     *
     * @param {String} reason Reason why adaptation failed
     * @returns {Object} Empty result
     */
    static emptyResult(reason) {
        return {
            usable: false,
            sets: [],
            rowPath: null,
            rowCount: 0,
            attrLabels: {},
            numericAttrs: [],
            dateAttrs: [],
            timeAttr: null,
            warnings: [reason],
            reason: reason
        };
    }

    /**
     * Finds the best table like array inside a json value.
     *
     * @param {*} source Json value
     * @returns {Object|null} Candidate with path and rows
     */
    static findBestArray(source) {
        let candidates = [];
        this.collectArrayCandidates(source, '', candidates, 0, []);
        candidates = candidates.filter(curCandidate => curCandidate.score > 0);
        candidates.sort((a, b) => b.score - a.score);
        return candidates.length > 0 ? candidates[0] : null;
    }

    /**
     * Collects array candidates recursively.
     *
     * @param {*} value Current value
     * @param {String} path Current path
     * @param {Array} candidates Found candidates
     * @param {Number} depth Current depth
     * @param {Array} seen Already visited objects
     * @returns {undefined}
     */
    static collectArrayCandidates(value, path, candidates, depth, seen) {
        if (!value || typeof value !== 'object' || seen.includes(value) || depth > 8)
            return;
        seen.push(value);

        if (Array.isArray(value)) {
            let score = this.scoreArray(value, path);
            if (score > 0)
                candidates.push({path: path || '$', rows: value, score: score});
            for (let i = 0; i < Math.min(value.length, 10); i++)
                this.collectArrayCandidates(value[i], path + '[' + i + ']', candidates, depth + 1, seen);
            return;
        }

        let keys = Object.keys(value);
        keys.sort((a, b) => this.keyPriority(a) - this.keyPriority(b));
        for (let curKey of keys) {
            let curPath = path ? path + '.' + curKey : curKey;
            this.collectArrayCandidates(value[curKey], curPath, candidates, depth + 1, seen);
        }
    }

    /**
     * Scores an array by its usefulness as tabular data.
     *
     * @param {Array} rows Candidate rows
     * @param {String} path Candidate path
     * @returns {Number} Score
     */
    static scoreArray(rows, path) {
        if (!rows || rows.length === 0)
            return 0;
        let sampleSize = Math.min(rows.length, 30);
        let objectCount = 0;
        let leafCount = 0;
        let numericCount = 0;
        let dateCount = 0;
        for (let i = 0; i < sampleSize; i++) {
            let curRow = this.toRowObject(rows[i]);
            if (!curRow)
                continue;
            objectCount++;
            let flat = {};
            this.flattenObject(curRow, '', flat);
            for (let curPath in flat) {
                leafCount++;
                if (this.parseNumber(flat[curPath]) !== null)
                    numericCount++;
                if (this.looksLikeDate(flat[curPath]))
                    dateCount++;
            }
        }
        if (objectCount === 0)
            return 0;
        let pathBonus = this.keyPriority(path.split('.').pop()) === 0 ? 20 : 0;
        return objectCount * 10 + Math.min(rows.length, 100)
                + leafCount + numericCount * 3 + dateCount * 4 + pathBonus;
    }

    /**
     * Gives known collection keys a higher priority.
     *
     * @param {String} key Json key
     * @returns {Number} Priority
     */
    static keyPriority(key) {
        let normalized = String(key || '').toLowerCase();
        let known = ['records', 'features', 'items', 'results', 'result', 'list',
            'data', 'value', 'values', 'observations', 'measurements'];
        return known.includes(normalized) ? 0 : 1;
    }

    /**
     * Converts a source row into an object.
     *
     * @param {*} row Source row
     * @returns {Object|null} Row object
     */
    static toRowObject(row) {
        if (!row || typeof row !== 'object' || Array.isArray(row))
            return null;
        if (row.type === 'Feature' && row.properties && typeof row.properties === 'object') {
            let feature = Object.assign({}, row.properties);
            for (let curKey of Object.keys(row)) {
                if (curKey !== 'properties' && curKey !== 'geometry' && this.isPrimitive(row[curKey]))
                    feature[curKey] = row[curKey];
            }
            if (row.geometry && Array.isArray(row.geometry.coordinates)) {
                feature.geometry_type = row.geometry.type || null;
                if (row.geometry.type === 'Point') {
                    feature.lon = row.geometry.coordinates[0];
                    feature.lat = row.geometry.coordinates[1];
                } else {
                    feature.geometry_coordinates = JSON.stringify(row.geometry.coordinates);
                }
            }
            return feature;
        }
        return row;
    }

    /**
     * Flattens nested objects into path based attributes.
     *
     * @param {*} value Current value
     * @param {String} path Current path
     * @param {Object} out Flat output
     * @returns {undefined}
     */
    static flattenObject(value, path, out) {
        if (this.isPrimitive(value)) {
            if (path)
                out[path] = value;
            return;
        }
        if (Array.isArray(value)) {
            this.flattenArray(value, path, out);
            return;
        }
        if (!value || typeof value !== 'object')
            return;
        for (let curKey of Object.keys(value)) {
            let curPath = path ? path + '_' + curKey : curKey;
            this.flattenObject(value[curKey], curPath, out);
        }
    }

    /**
     * Flattens arrays into scalar values or indexed object values.
     *
     * @param {Array} value Source array
     * @param {String} path Current path
     * @param {Object} out Flat output
     * @returns {undefined}
     */
    static flattenArray(value, path, out) {
        if (!path || value.length === 0)
            return;
        let primitive = value.every(curVal => this.isPrimitive(curVal));
        if (primitive) {
            out[path] = value.join('; ');
            return;
        }
        if (value.length === 1 && value[0] && typeof value[0] === 'object') {
            this.flattenObject(value[0], path, out);
            return;
        }
        for (let i = 0; i < Math.min(value.length, 3); i++) {
            if (value[i] && typeof value[i] === 'object')
                this.flattenObject(value[i], path + '_' + i, out);
        }
    }

    /**
     * Normalizes flat values into one SWAC dataset.
     *
     * @param {Object} flat Flat source row
     * @param {Number} fallbackId Fallback id
     * @param {Object} attrMap Source path to attribute name
     * @param {Object} usedAttrs Used attribute names
     * @param {Object} attrLabels Attribute labels
     * @returns {Object} SWAC compatible dataset
     */
    static normalizeSet(flat, fallbackId, attrMap, usedAttrs, attrLabels) {
        let set = {};
        for (let curPath of Object.keys(flat)) {
            let attr = this.mapAttribute(curPath, attrMap, usedAttrs);
            attrLabels[attr] = curPath;
            set[attr] = this.coerceValue(flat[curPath]);
        }
        if (typeof set.id === 'undefined' || set.id === null || set.id === '')
            set.id = fallbackId;
        return set;
    }

    /**
     * Maps a source path to a stable attribute name.
     *
     * @param {String} path Source path
     * @param {Object} attrMap Source path to attribute name
     * @param {Object} usedAttrs Used attribute names
     * @returns {String} Attribute name
     */
    static mapAttribute(path, attrMap, usedAttrs) {
        if (attrMap[path])
            return attrMap[path];
        let base = this.normalizeAttributeName(path);
        let attr = base;
        let index = 2;
        while (usedAttrs[attr] && usedAttrs[attr] !== path) {
            attr = base + '_' + index;
            index++;
        }
        usedAttrs[attr] = path;
        attrMap[path] = attr;
        return attr;
    }

    /**
     * Normalizes a source path into a technical attribute name.
     *
     * @param {String} path Source path
     * @returns {String} Normalized attribute name
     */
    static normalizeAttributeName(path) {
        let name = String(path || 'value').trim();
        name = name.replace(/\u00b5/g, 'u').replace(/\u00b2/g, '2').replace(/\u00b3/g, '3');
        name = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        name = name.replace(/\u00df/g, 'ss');
        name = name.replace(/[^A-Za-z0-9]+/g, '_');
        name = name.replace(/^_+|_+$/g, '').toLowerCase();
        if (!name)
            name = 'value';
        if (/^[0-9]/.test(name))
            name = 'attr_' + name;
        return name;
    }

    /**
     * Converts string values into useful primitive values.
     *
     * @param {*} value Source value
     * @returns {*} Converted value
     */
    static coerceValue(value) {
        if (typeof value !== 'string')
            return value;
        let trimmed = value.trim();
        if (trimmed === '')
            return null;
        if (this.looksLikeDate(trimmed))
            return trimmed;
        if (trimmed.toLowerCase() === 'true')
            return true;
        if (trimmed.toLowerCase() === 'false')
            return false;
        let parsed = this.parseNumber(trimmed);
        return parsed !== null ? parsed : trimmed;
    }

    /**
     * Parses a localized number from a value.
     *
     * @param {*} value Source value
     * @returns {Number|null} Parsed number or null
     */
    static parseNumber(value) {
        if (typeof value === 'number')
            return isFinite(value) ? value : null;
        if (typeof value !== 'string')
            return null;
        let text = value.trim();
        if (!text || this.looksLikeDate(text))
            return null;
        let match = text.match(/^[-+]?[0-9][0-9., ]*/);
        if (!match)
            return null;
        let num = match[0].replace(/\s/g, '');
        if (num.includes(',') && num.includes('.')) {
            if (num.lastIndexOf(',') > num.lastIndexOf('.'))
                num = num.replace(/\./g, '').replace(',', '.');
            else
                num = num.replace(/,/g, '');
        } else if (num.includes(',')) {
            num = num.replace(',', '.');
        }
        let parsed = Number(num);
        return isFinite(parsed) ? parsed : null;
    }

    /**
     * Checks if a value looks like a date or timestamp.
     *
     * @param {*} value Source value
     * @returns {Boolean} True if the value looks like a date
     */
    static looksLikeDate(value) {
        if (value instanceof Date)
            return !isNaN(value.valueOf());
        if (typeof value !== 'string')
            return false;
        let text = value.trim();
        if (!text)
            return false;
        if (/^[-+]?[0-9]+[.,][0-9]+$/.test(text))
            return false;
        if (!/[T:]/.test(text)
                && !/[0-9]{4}[-\/.][0-9]{1,2}/.test(text)
                && !/[0-9]{1,2}[-\/.][0-9]{1,2}[-\/.][0-9]{2,4}/.test(text))
            return false;
        let time = Date.parse(text);
        return !isNaN(time);
    }

    /**
     * Detects numeric attributes from adapted sets.
     *
     * @param {Array} sets Adapted sets
     * @returns {Array} Numeric attribute names
     */
    static detectNumericAttrs(sets) {
        let counts = {};
        for (let curSet of sets) {
            for (let curAttr in curSet) {
                if (curAttr === 'id' || curAttr.startsWith('swac_'))
                    continue;
                if (typeof curSet[curAttr] === 'number' && isFinite(curSet[curAttr]))
                    counts[curAttr] = (counts[curAttr] || 0) + 1;
            }
        }
        return Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
    }

    /**
     * Detects date attributes from adapted sets.
     *
     * @param {Array} sets Adapted sets
     * @returns {Array} Date attribute names
     */
    static detectDateAttrs(sets) {
        let counts = {};
        for (let curSet of sets) {
            for (let curAttr in curSet) {
                if (curAttr.startsWith('swac_'))
                    continue;
                if (this.looksLikeDate(curSet[curAttr]))
                    counts[curAttr] = (counts[curAttr] || 0) + 1;
            }
        }
        return Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
    }

    /**
     * Chooses the best time attribute from detected date attributes.
     *
     * @param {Array} dateAttrs Date attribute names
     * @returns {String|null} Time attribute or null
     */
    static chooseTimeAttr(dateAttrs) {
        if (!dateAttrs || dateAttrs.length === 0)
            return null;
        let preferred = ['ts', 'timestamp', 'time', 'date', 'datetime',
            'datum', 'zeit', 'messzeit', 'phenomenontime', 'observed'];
        for (let curPreferred of preferred) {
            let match = dateAttrs.find(attr => attr.toLowerCase() === curPreferred);
            if (match)
                return match;
        }
        for (let curPreferred of preferred) {
            let match = dateAttrs.find(attr => attr.toLowerCase().includes(curPreferred));
            if (match)
                return match;
        }
        return dateAttrs[0];
    }

    /**
     * Checks if at least one set has the attribute.
     *
     * @param {Array} sets Datasets
     * @param {String} attr Attribute name
     * @returns {Boolean} True if the attribute exists
     */
    static hasAttribute(sets, attr) {
        for (let curSet of sets) {
            if (typeof curSet[attr] !== 'undefined')
                return true;
        }
        return false;
    }

    /**
     * Checks if a value is primitive.
     *
     * @param {*} value Source value
     * @returns {Boolean} True if primitive
     */
    static isPrimitive(value) {
        return value === null || ['string', 'number', 'boolean'].includes(typeof value);
    }
}
