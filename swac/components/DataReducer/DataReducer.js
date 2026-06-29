import SWAC from '../../swac.js';
import View from '../../View.js';
import Msg from '../../Msg.js';

/**
 * DataReducer component.
 *
 * Shows a filter sidebar (in the style of online shops) that reduces the data
 * shown in one or more target components on the client side. All data is loaded
 * first by the target components, the DataReducer then hides the sets that do
 * not pass the filters and shows them again when the filters change. No data is
 * reloaded from the server.
 *
 * Because chart and table read the same source, a filter applied here affects
 * both of them at the same time.
 *
 * The filters are stored in localStorage and restored automatically, so they
 * survive a page reload and can be reused when the user switches to another
 * table. The page starts without any filter, the user creates all filters
 * himself and can remove single filters to get all data back.
 *
 * The selectable attributes are detected from the data of the targets, so the
 * component works with any datasource (sensor data, water data, ...) without
 * configuration.
 */
export default class DataReducer extends View {

    constructor(options = {}) {
        super(options);
        this.name = 'DataReducer';
        this.desc.text = 'Sidebar that reduces the data shown in other components by client side filters.';
        this.desc.developers = 'Maczap (HSBI)';
        this.desc.license = 'GNU Lesser General Public License';

        this.desc.templates[0] = {
            name: 'datareducer',
            style: false,
            desc: 'Default template with the filter sidebar.'
        };

        this.desc.opts[0] = {
            name: 'targetComponents',
            desc: 'Selectors of the components whose data should be reduced.',
            example: ['#datachart', '#datalist']
        };
        if (!options.targetComponents)
            this.options.targetComponents = [];

        this.desc.opts[1] = {
            name: 'timeAttr',
            desc: 'Name of the date/time attribute used for the time range filter. If not set it is detected from the data.',
            example: 'ts'
        };
        if (!options.timeAttr)
            this.options.timeAttr = null;

        this.desc.opts[2] = {
            name: 'excludeAttrs',
            desc: 'Attributes that are not offered for value filtering.',
            example: ['id', 'synced']
        };
        if (!options.excludeAttrs)
            this.options.excludeAttrs = ['id', 'synced', 'pos', 'pos_accuracy', 'pos_altitude',
                'pos_altitude_accuracy', 'pos_heading', 'pos_speed', 'measurement_process',
                'measurement_name'];

        this.desc.opts[3] = {
            name: 'storageKey',
            desc: 'Key for storing the filters in localStorage. If not set a key is built from the target selectors.',
            example: 'myfilters'
        };
        if (!options.storageKey)
            this.options.storageKey = null;

        this.desc.opts[4] = {
            name: 'sharedStorageKey',
            desc: 'If true all pages share the same filters. If false a key built from the target selectors is used.',
            example: false
        };
        if (typeof options.sharedStorageKey === 'undefined')
            this.options.sharedStorageKey = false;

        if (!options.showWhenNoData)
            this.options.showWhenNoData = true;

        // Internal state
        this.targets = [];              // resolved target component instances
        this.numericAttrs = new Set();  // numeric attributes for value filter
        this.timeAttrName = null;       // resolved time attribute
        this.hiddenSets = new Map();    // target id -> array of hidden sets
        this.fromFilter = null;         // Date or null
        this.toFilter = null;           // Date or null
        this.valueFilter = null;        // {attr, op, val} or null
    }

    init() {
        let thisRef = this;
        return new Promise((resolve, reject) => {
            // Resolve targets and build the controls after all components loaded
            document.addEventListener('swac_components_complete', function onReady() {
                document.removeEventListener('swac_components_complete', onReady);
                thisRef.resolveTargets();
                thisRef.detectAttributes();
                thisRef.buildControls();
                thisRef.restoreStoredFilters();
                thisRef.applyFilters();
            });
            resolve();
        });
    }

    /**
     * Resolves the target component instances from their selectors. Chart
     * targets that have a DataManager plugin are controlled through that plugin
     * (fast and sorted redraw), all other targets are filtered by hiding and
     * showing single sets.
     *
     * @returns {undefined}
     */
    resolveTargets() {
        for (let curSelector of this.options.targetComponents) {
            let elem = document.querySelector(curSelector);
            if (!elem || !elem.swac_comp) {
                Msg.warn('DataReducer', 'Target component >' + curSelector + '< not found.', this.requestor);
                continue;
            }
            let comp = elem.swac_comp;
            // Check for a DataManager plugin that can redraw with a predicate
            let dataManager = null;
            if (comp.plugins && comp.plugins.get('DataManager')) {
                let dmReq = comp.plugins.get('DataManager');
                if (dmReq && dmReq.swac_comp && dmReq.swac_comp.setFilterPredicate)
                    dataManager = dmReq.swac_comp;
            }
            this.targets.push({comp: comp, dataManager: dataManager});
            this.hiddenSets.set(elem.id, []);
        }
    }

    /**
     * Detects the numeric and time attributes from the data of all targets.
     *
     * @returns {undefined}
     */
    detectAttributes() {
        for (let curTarget of this.targets) {
            let comp = curTarget.comp;
            for (let curSource in comp.data) {
                for (let curSet of comp.data[curSource].getSets()) {
                    if (!curSet)
                        continue;
                    for (let curAttr in curSet) {
                        if (curAttr.startsWith('swac_'))
                            continue;
                        if (this.options.excludeAttrs.includes(curAttr))
                            continue;
                        let val = curSet[curAttr];
                        // Detect the time attribute by trying to parse a date
                        if (!this.timeAttrName && this.options.timeAttr === null && this.looksLikeDate(val))
                            this.timeAttrName = curAttr;
                        // Collect numeric attributes
                        if (typeof val === 'number')
                            this.numericAttrs.add(curAttr);
                    }
                }
            }
        }
        // Use the configured time attribute if given
        if (this.options.timeAttr)
            this.timeAttrName = this.options.timeAttr;
    }

    /**
     * Builds the filter controls and binds their events.
     *
     * @returns {undefined}
     */
    buildControls() {
        let thisRef = this;

        // Fill the value filter attribute select
        let filterSelect = this.requestor.querySelector('.swac_datareducer_attr');
        if (filterSelect) {
            for (let curAttr of this.numericAttrs) {
                let opt = document.createElement('option');
                opt.value = curAttr;
                opt.textContent = curAttr;
                filterSelect.appendChild(opt);
            }
        }

        // Time range block is hidden when there is no time attribute. There can
        // be several elements marked as time block, hide all of them.
        if (!this.timeAttrName) {
            let timeBlocks = this.requestor.querySelectorAll('.swac_datareducer_timeblock');
            for (let curBlock of timeBlocks)
                curBlock.classList.add('swac_dontdisplay');
        }

        // One apply button for all filters
        let applyBtn = this.requestor.querySelector('.swac_datareducer_apply');
        if (applyBtn)
            applyBtn.addEventListener('click', function () {
                thisRef.applyAllFilters();
            });
        // One reset button for all filters
        let resetBtn = this.requestor.querySelector('.swac_datareducer_reset');
        if (resetBtn)
            resetBtn.addEventListener('click', function () {
                thisRef.resetAllFilters();
            });
    }

    /**
     * Builds the key under which the filters are stored.
     *
     * @returns {String} The storage key
     */
    buildStorageKey() {
        if (this.options.storageKey)
            return this.options.storageKey;
        let base = 'swac_datareducer';
        if (!this.options.sharedStorageKey)
            return base + '_' + this.options.targetComponents.join('_');
        return base;
    }

    /**
     * Stores the current filter state in localStorage.
     *
     * @returns {undefined}
     */
    saveFilters() {
        let state = {
            from: this.fromFilter ? this.fromFilter.toISOString() : null,
            to: this.toFilter ? this.toFilter.toISOString() : null,
            value: this.valueFilter
        };
        try {
            localStorage.setItem(this.buildStorageKey(), JSON.stringify(state));
        } catch (e) {
            Msg.error('DataReducer', 'Could not store filters: ' + e, this.requestor);
        }
    }

    /**
     * Restores the filter state from localStorage and fills the inputs.
     *
     * @returns {undefined}
     */
    restoreStoredFilters() {
        let raw;
        try {
            raw = localStorage.getItem(this.buildStorageKey());
        } catch (e) {
            return;
        }
        if (!raw)
            return;
        let state;
        try {
            state = JSON.parse(raw);
        } catch (e) {
            return;
        }

        // Restore time range
        if (state.from) {
            this.fromFilter = new Date(state.from);
            let fromInput = this.requestor.querySelector('.swac_datareducer_from');
            if (fromInput)
                fromInput.value = this.toInputValue(this.fromFilter);
        }
        if (state.to) {
            this.toFilter = new Date(state.to);
            let toInput = this.requestor.querySelector('.swac_datareducer_to');
            if (toInput)
                toInput.value = this.toInputValue(this.toFilter);
        }

        // Restore value filter
        if (state.value) {
            this.valueFilter = state.value;
            let attrSelect = this.requestor.querySelector('.swac_datareducer_attr');
            let opSelect = this.requestor.querySelector('.swac_datareducer_op');
            let valInput = this.requestor.querySelector('.swac_datareducer_val');
            if (attrSelect)
                attrSelect.value = state.value.attr;
            if (opSelect)
                opSelect.value = state.value.op;
            if (valInput)
                valInput.value = state.value.val;
        }
    }

    /**
     * Reads all filter inputs (time range and value) and applies them together.
     *
     * @returns {undefined}
     */
    applyAllFilters() {
        // Time range
        let fromVal = this.requestor.querySelector('.swac_datareducer_from').value;
        let toVal = this.requestor.querySelector('.swac_datareducer_to').value;
        this.fromFilter = fromVal ? new Date(fromVal) : null;
        this.toFilter = toVal ? new Date(toVal) : null;

        // Value
        let attr = this.requestor.querySelector('.swac_datareducer_attr').value;
        let op = this.requestor.querySelector('.swac_datareducer_op').value;
        let val = parseFloat(this.requestor.querySelector('.swac_datareducer_val').value);
        if (!attr || isNaN(val))
            this.valueFilter = null;
        else
            this.valueFilter = {attr: attr, op: op, val: val};

        this.saveFilters();
        this.applyFilters();
    }

    /**
     * Resets all filters (time range and value) and shows all data again.
     *
     * @returns {undefined}
     */
    resetAllFilters() {
        this.fromFilter = null;
        this.toFilter = null;
        this.valueFilter = null;
        this.requestor.querySelector('.swac_datareducer_from').value = '';
        this.requestor.querySelector('.swac_datareducer_to').value = '';
        this.requestor.querySelector('.swac_datareducer_val').value = '';
        this.saveFilters();
        this.applyFilters();
    }

    /**
     * Applies all active filters to every target. Chart targets with a
     * DataManager are redrawn once with a filter predicate (fast and sorted).
     * Other targets are filtered by hiding and showing single sets.
     *
     * @returns {undefined}
     */
    applyFilters() {
        let thisRef = this;
        for (let curTarget of this.targets) {
            // Chart target with DataManager: redraw once with the predicate
            if (curTarget.dataManager) {
                curTarget.dataManager.setFilterPredicate(function (set) {
                    return thisRef.passesFilters(set);
                });
                continue;
            }

            // Other target (e.g. table): hide and show single sets
            let comp = curTarget.comp;
            let targetId = comp.requestor.id;
            let hidden = this.hiddenSets.get(targetId);

            // Bring back hidden sets that pass the filter again
            let stillHidden = [];
            for (let curSet of hidden) {
                if (this.passesFilters(curSet)) {
                    comp.addSet(curSet.swac_fromName, curSet);
                } else {
                    stillHidden.push(curSet);
                }
            }

            // Hide currently shown sets that no longer pass
            for (let curSource in comp.data) {
                let sets = comp.data[curSource].getSets().slice();
                for (let curSet of sets) {
                    if (!curSet)
                        continue;
                    if (!this.passesFilters(curSet)) {
                        stillHidden.push(curSet);
                        comp.removeSet(curSource, curSet.id);
                    }
                }
            }

            this.hiddenSets.set(targetId, stillHidden);
        }
    }

    /**
     * Checks if a set passes all active filters.
     *
     * @param {WatchableSet} set Dataset
     * @returns {Boolean} True if the set should be shown
     */
    passesFilters(set) {
        // Time range filter
        if ((this.fromFilter || this.toFilter) && this.timeAttrName) {
            let tsVal = set[this.timeAttrName];
            if (tsVal) {
                let ts = new Date(tsVal);
                if (this.fromFilter && ts < this.fromFilter)
                    return false;
                if (this.toFilter && ts > this.toFilter)
                    return false;
            }
        }

        // Value filter
        if (this.valueFilter) {
            let v = set[this.valueFilter.attr];
            if (v === null || v === undefined)
                return false;
            switch (this.valueFilter.op) {
                case 'gt':  if (!(v > this.valueFilter.val))  return false; break;
                case 'lt':  if (!(v < this.valueFilter.val))  return false; break;
                case 'eq':  if (!(v === this.valueFilter.val)) return false; break;
                case 'gte': if (!(v >= this.valueFilter.val)) return false; break;
                case 'lte': if (!(v <= this.valueFilter.val)) return false; break;
            }
        }

        return true;
    }

    /**
     * Checks if a value looks like a parseable date string.
     *
     * @param {*} val Value to check
     * @returns {Boolean} True when the value parses as a date
     */
    looksLikeDate(val) {
        if (typeof val !== 'string')
            return false;
        // Avoid treating plain numbers in strings as dates
        if (!/[-:T]/.test(val))
            return false;
        let d = new Date(val);
        return !isNaN(d.valueOf());
    }

    /**
     * Converts a date to the value format of a datetime-local input.
     *
     * @param {Date} date Date to convert
     * @returns {String} Value usable in a datetime-local input
     */
    toInputValue(date) {
        let pad = n => (n < 10 ? '0' + n : '' + n);
        return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate())
                + 'T' + pad(date.getHours()) + ':' + pad(date.getMinutes());
    }
}
