import SWAC from '../../../../swac.js';
import Msg from '../../../../Msg.js';
import Plugin from '../../../../Plugin.js';

/**
 * Shared base of the Datafilterbar plugin. Adds a side menu with general data
 * management to the host component: available time range, filters,
 * aggregation, computed columns, datasource switch and settings export.
 * Column renaming is offered directly at the table headers. All functions
 * also apply to every component on the page that reads the same datasource.
 * Attributes are detected from the data, so the plugin works with any source.
 */
export default class DatafilterbarSPL extends Plugin {

    constructor(opts = {}) {
        super(opts);
        this.name = 'Present/plugins/Datafilterbar';
        this.desc.text = 'Side menu with filters, aggregation, computed columns and datasource management.';
        this.desc.developers = 'Maczap (HSBI)';
        this.desc.license = 'GNU Lesser General Public License';

        // No template on purpose: a plugin with template gets an own tab

        this.desc.opts[0] = {
            name: 'timeAttr',
            desc: 'Name of the date/time attribute. Detected from the data if not set, ts is preferred.',
            example: 'ts'
        };
        if (!opts.timeAttr)
            this.options.timeAttr = null;

        this.desc.opts[1] = {
            name: 'excludeAttrs',
            desc: 'Attributes not offered for filtering.',
            example: ['id']
        };
        if (!opts.excludeAttrs)
            this.options.excludeAttrs = ['id'];

        this.desc.opts[2] = {
            name: 'storeFilters',
            desc: 'If true the settings are stored in localStorage and restored on load.',
            example: true
        };
        if (typeof opts.storeFilters === 'undefined')
            this.options.storeFilters = true;

        this.desc.opts[3] = {
            name: 'storageKey',
            desc: 'Storage key. Built from the host datasource if not set.',
            example: 'mysettings'
        };
        if (!opts.storageKey)
            this.options.storageKey = null;

        this.desc.opts[4] = {
            name: 'filterSameSource',
            desc: 'If true (default) the settings also affect other components with the same datasource.',
            example: true
        };
        if (typeof opts.filterSameSource === 'undefined')
            this.options.filterSameSource = true;

        // Filter and transformation state
        this.fromFilter = null;
        this.toFilter = null;
        this.valueFilter = null;
        this.aggregation = null;
        this.renames = {};
        this.computedColumns = [];
        this.altSource = null;
        // Attribute detection
        this.knownAttrs = new Set();
        this.allAttrs = new Set();
        this.dateAttrs = new Set();
        this.timeAttrName = null;
        this.allSets = [];
        // Working state
        this.menu = null;
        this.built = false;
        this.restored = false;
        this.watchedTargets = [];
        this.applyTimeout = null;
        this.columnFilters = {};
    }

    init() {
        return new Promise((resolve, reject) => {
            resolve();
        });
    }

    /**
     * Gets the host component this plugin is attached to
     *
     * @returns {View} Host component
     */
    getHost() {
        return this.requestor.parent.swac_comp;
    }

    /**
     * Collects sets, detects attributes and refreshes after the last set
     *
     * @param {WatchableSet} set Dataset
     * @param {Array} repeateds Repeated elements (unused)
     * @returns {undefined}
     */
    afterAddSet(set, repeateds) {
        this.allSets.push(set);
        this.detectFromSet(set);
        if (!this.built) {
            this.built = true;
            this.buildMenu();
        }
        if (set.swac_dataRequest && set.id === set.swac_dataRequest.highestId) {
            this.refreshAll();
        }
    }

    /**
     * Removes a set from the collected sets
     *
     * @param {WatchableSet} set Removed dataset
     * @returns {undefined}
     */
    afterRemoveSet(set) {
        this.allSets = this.allSets.filter(curSet => curSet.id !== set.id);
    }

    /**
     * Detects date and numeric attributes from one set
     *
     * @param {Object} set Dataset
     * @returns {undefined}
     */
    detectFromSet(set) {
        for (let curAttr in set) {
            if (curAttr.startsWith('swac_'))
                continue;
            this.allAttrs.add(curAttr);
            if (this.options.excludeAttrs.includes(curAttr))
                continue;
            let val = set[curAttr];
            if (this.looksLikeDate(val))
                this.dateAttrs.add(curAttr);
            if (this.isNumericValue(val))
                this.knownAttrs.add(curAttr);
        }
    }

    /**
     * Rebuilds the attribute detection from the current source sets
     *
     * @returns {undefined}
     */
    redetectAttributes() {
        this.knownAttrs = new Set();
        this.allAttrs = new Set();
        this.dateAttrs = new Set();
        this.timeAttrName = null;
        for (let curSet of this.sourceSets()) {
            this.detectFromSet(curSet);
        }
    }

    /**
     * Gets the sets the display is built from
     *
     * @returns {Array} Sets of the alternative source or the original sets
     */
    sourceSets() {
        if (this.altSource)
            return this.altSource.sets;
        return this.allSets;
    }

    /**
     * Refreshes controls and display and applies the settings
     *
     * @returns {undefined}
     */
    refreshAll() {
        this.chooseTimeAttr();
        this.updateTimeBlockVisibility();
        this.refreshAttrOptions();
        this.updateAvailableRange();
        this.moveDataManagerBar();
        if (!this.restored && this.options.storeFilters) {
            this.restored = true;
            this.restoreStoredSettings();
        }
        this.refreshComputedList();
        this.updateRequestorDisplay();
        this.applyAll();
    }

    /**
     * Chooses the time attribute, prefering common names like ts
     *
     * @returns {undefined}
     */
    chooseTimeAttr() {
        if (this.options.timeAttr) {
            this.timeAttrName = this.options.timeAttr;
            return;
        }
        let attrs = Array.from(this.dateAttrs);
        if (attrs.length === 0) {
            this.timeAttrName = null;
            return;
        }
        let preferred = attrs.find(a => a.toLowerCase() === 'ts')
                || attrs.find(a => a.toLowerCase().includes('timestamp'))
                || attrs.find(a => a.toLowerCase().includes('time'))
                || attrs.find(a => a.toLowerCase().includes('date'));
        this.timeAttrName = preferred || attrs[0];
    }

    /**
     * Builds the toggle button and the side menu once
     *
     * @returns {undefined}
     */
    buildMenu() {
        let thisRef = this;
        let hostReq = this.getHost().requestor;
        if (hostReq.querySelector('.swac_datafilterbar_togglebar'))
            return;

        let menuId = hostReq.id + '_datafilterbar_menu';
        let wrapper = document.createElement('div');
        wrapper.innerHTML = this.getMenuHtml(menuId);
        let toggle = wrapper.firstElementChild;
        let menu = wrapper.lastElementChild;
        hostReq.insertBefore(menu, hostReq.firstChild);
        hostReq.insertBefore(toggle, hostReq.firstChild);
        this.menu = menu;

        // Expand the short translation keys to the full plugin key
        let langPrefix = this.name.replace('/plugins/', '/').replace('/', '_');
        for (let curRoot of [toggle, menu]) {
            for (let curElem of curRoot.querySelectorAll('[swac_lang]')) {
                let key = curElem.getAttribute('swac_lang');
                if (key.startsWith('Datafilterbar.'))
                    curElem.setAttribute('swac_lang', langPrefix + '.' + key.substring('Datafilterbar.'.length));
            }
        }

        menu.querySelector('.swac_datafilterbar_apply').addEventListener('click', function () {
            thisRef.applyAllFilters();
        });
        menu.querySelector('.swac_datafilterbar_reset').addEventListener('click', function () {
            thisRef.resetAllFilters();
        });
        menu.querySelector('.swac_datafilterbar_addrow').addEventListener('click', function () {
            thisRef.addFormulaRow();
        });
        menu.querySelector('.swac_datafilterbar_addcolumn').addEventListener('click', function () {
            thisRef.onClickAddColumn();
        });
        menu.querySelector('.swac_datafilterbar_loadsource').addEventListener('click', function () {
            thisRef.onClickLoadSource();
        });
        menu.querySelector('.swac_datafilterbar_removesource').addEventListener('click', function () {
            thisRef.onClickRemoveSource();
        });
        menu.querySelector('.swac_datafilterbar_exportbtn').addEventListener('click', function () {
            thisRef.onClickExport();
        });
        menu.querySelector('.swac_datafilterbar_importbtn').addEventListener('click', function () {
            thisRef.onClickImport();
        });

        SWAC.lang.translateAll(toggle);
        SWAC.lang.translateAll(menu);
    }

    /**
     * Gets the html of toggle bar and side menu
     *
     * @param {String} menuId Id for the offcanvas element
     * @returns {String} Menu markup
     */
    getMenuHtml(menuId) {
        return '<div class="swac_datafilterbar_togglebar uk-margin-small-bottom">'
                + '<button class="uk-button uk-button-default uk-button-small" type="button" uk-toggle="target: #' + menuId + '">'
                + '<span uk-icon="icon: settings; ratio: 0.8"></span> '
                + '<span swac_lang="Datafilterbar.menu">Filter and settings</span>'
                + '</button>'
                + '</div>'
                + '<div id="' + menuId + '" uk-offcanvas="overlay: true">'
                + '<div class="uk-offcanvas-bar swac_datafilterbar">'
                + '<button class="uk-offcanvas-close" type="button" uk-close></button>'
                + '<div class="swac_datafilterbar_availblock swac_dontdisplay uk-margin-small-bottom">'
                + '<span class="uk-text-bold" swac_lang="Datafilterbar.availrange">Available time range</span><br>'
                + '<span class="swac_datafilterbar_availvalues uk-text-small"></span>'
                + '</div>'
                + '<hr>'
                + '<h5 swac_lang="Datafilterbar.filters">Filters</h5>'
                + '<div class="swac_datafilterbar_timeblock">'
                + '<label class="uk-form-label uk-text-small" swac_lang="Datafilterbar.timerange">Time range</label>'
                + '<input class="swac_datafilterbar_from uk-input uk-form-small uk-margin-small-bottom" type="datetime-local">'
                + '<input class="swac_datafilterbar_to uk-input uk-form-small uk-margin-small-bottom" type="datetime-local">'
                + '</div>'
                + '<label class="uk-form-label uk-text-small" swac_lang="Datafilterbar.value">Value</label>'
                + '<div class="uk-flex uk-flex-middle" style="gap:4px;">'
                + '<select class="swac_datafilterbar_attr uk-select uk-form-small"><option value="" swac_lang="Datafilterbar.attr">Attribute</option></select>'
                + '<select class="swac_datafilterbar_op uk-select uk-form-small" style="width:70px;"><option value="gt">&gt;</option><option value="lt">&lt;</option><option value="eq">=</option><option value="gte">&gt;=</option><option value="lte">&lt;=</option></select>'
                + '<input class="swac_datafilterbar_val uk-input uk-form-small" type="number" placeholder="0" style="width:80px;">'
                + '</div>'
                + '<h5 class="uk-margin-small-top" swac_lang="Datafilterbar.aggregation">Aggregation</h5>'
                + '<div class="uk-flex uk-flex-middle" style="gap:4px;">'
                + '<input class="swac_datafilterbar_aggamount uk-input uk-form-small" type="number" min="0" placeholder="0" style="width:80px;">'
                + '<select class="swac_datafilterbar_aggunit uk-select uk-form-small">'
                + '<option value="seconds" swac_lang="Datafilterbar.unit_seconds">Seconds</option>'
                + '<option value="minutes" selected swac_lang="Datafilterbar.unit_minutes">Minutes</option>'
                + '<option value="hours" swac_lang="Datafilterbar.unit_hours">Hours</option>'
                + '<option value="days" swac_lang="Datafilterbar.unit_days">Days</option>'
                + '</select>'
                + '</div>'
                + '<div class="uk-margin-small-top">'
                + '<button class="swac_datafilterbar_apply uk-button uk-button-primary uk-button-small" type="button" swac_lang="Datafilterbar.apply">Apply</button> '
                + '<button class="swac_datafilterbar_reset uk-button uk-button-default uk-button-small" type="button" swac_lang="Datafilterbar.reset">Reset</button>'
                + '</div>'
                + '<hr>'
                + '<h5 swac_lang="Datafilterbar.series">Data series</h5>'
                + '<div class="swac_datafilterbar_seriescont"></div>'
                + '<hr>'
                + '<h5 swac_lang="Datafilterbar.computed">Computed column</h5>'
                + '<input class="swac_datafilterbar_colname uk-input uk-form-small uk-margin-small-bottom" type="text" placeholder="name">'
                + '<div class="swac_datafilterbar_formularows">'
                + '<div class="uk-flex uk-flex-middle uk-margin-small-bottom" style="gap:4px;">'
                + '<select class="swac_datafilterbar_formulaattr uk-select uk-form-small"><option value="" swac_lang="Datafilterbar.attr">Attribute</option></select>'
                + '</div>'
                + '</div>'
                + '<div class="uk-margin-small-bottom">'
                + '<button class="swac_datafilterbar_addrow uk-button uk-button-default uk-button-small" type="button"><span uk-icon="icon: plus; ratio: 0.7"></span></button> '
                + '<button class="swac_datafilterbar_addcolumn uk-button uk-button-default uk-button-small" type="button" swac_lang="Datafilterbar.addcolumn">Add column</button>'
                + '</div>'
                + '<div class="swac_datafilterbar_computedlist uk-text-small uk-margin-small-top"></div>'
                + '<hr>'
                + '<h5 swac_lang="Datafilterbar.datasource">Datasource</h5>'
                + '<input class="swac_datafilterbar_sourceurl uk-input uk-form-small uk-margin-small-bottom" type="text" placeholder="../../data/mydata.json">'
                + '<button class="swac_datafilterbar_loadsource uk-button uk-button-default uk-button-small" type="button" swac_lang="Datafilterbar.loadsource">Load</button> '
                + '<button class="swac_datafilterbar_removesource uk-button uk-button-default uk-button-small" type="button" swac_lang="Datafilterbar.removesource">Remove</button>'
                + '<div class="swac_datafilterbar_sourcestate uk-text-small uk-text-muted uk-margin-small-top"></div>'
                + '<hr>'
                + '<h5 swac_lang="Datafilterbar.settings">Settings</h5>'
                + '<textarea class="swac_datafilterbar_settingsio uk-textarea uk-form-small uk-margin-small-bottom" rows="4"></textarea>'
                + '<button class="swac_datafilterbar_exportbtn uk-button uk-button-default uk-button-small" type="button" swac_lang="Datafilterbar.exportbtn">Export</button> '
                + '<button class="swac_datafilterbar_importbtn uk-button uk-button-default uk-button-small" type="button" swac_lang="Datafilterbar.importbtn">Import</button>'
                + '<hr>'
                + '<h5 swac_lang="Datafilterbar.requestor">Resulting dataRequestor</h5>'
                + '<pre class="swac_datafilterbar_requestor uk-text-small" style="white-space:pre-wrap;"></pre>'
                + '</div>'
                + '</div>';
    }

    /**
     * Moves the DataManager bar into the menu and restyles it
     *
     * @returns {undefined}
     */
    moveDataManagerBar() {
        if (!this.menu)
            return;
        let dmBar = this.getHost().requestor.querySelector('.swac_datamanager_bar');
        let cont = this.menu.querySelector('.swac_datafilterbar_seriescont');
        if (dmBar && cont && !cont.contains(dmBar)) {
            cont.appendChild(dmBar);
            dmBar.classList.remove('uk-card', 'uk-card-default', 'uk-card-small',
                    'uk-card-body', 'uk-margin-small-bottom');
            let grid = dmBar.querySelector('.uk-grid-small');
            if (grid) {
                grid.removeAttribute('uk-grid');
                grid.classList.remove('uk-grid-small', 'uk-grid', 'uk-flex-middle');
                grid.classList.add('uk-flex', 'uk-flex-column');
                grid.style.gap = '6px';
                grid.style.margin = '0';
            }
            let label = dmBar.querySelector('[swac_lang$=".series"]');
            if (label && label.parentNode)
                label.parentNode.classList.add('swac_dontdisplay');
        }
    }

    /**
     * Shows or hides the time inputs depending on the time attribute
     *
     * @returns {undefined}
     */
    updateTimeBlockVisibility() {
        if (!this.menu)
            return;
        for (let curBlock of this.menu.querySelectorAll('.swac_datafilterbar_timeblock')) {
            if (this.timeAttrName)
                curBlock.classList.remove('swac_dontdisplay');
            else
                curBlock.classList.add('swac_dontdisplay');
        }
    }

    /**
     * Fills the value filter attribute select
     *
     * @returns {undefined}
     */
    refreshAttrOptions() {
        if (!this.menu)
            return;
        this.fillAttrSelect(this.menu.querySelector('.swac_datafilterbar_attr'), this.knownAttrs);
        // The formula builder offers every column, results that make no
        // sense simply show NaN
        for (let curSel of this.menu.querySelectorAll('.swac_datafilterbar_formulaattr')) {
            this.fillAttrSelect(curSel, this.allAttrs);
        }
    }

    /**
     * Fills a select with the given attribute names
     *
     * @param {HTMLElement} select Select element to fill
     * @param {Set} attrs Attribute names
     * @returns {undefined}
     */
    fillAttrSelect(select, attrs) {
        if (!select)
            return;
        let existing = Array.prototype.map.call(select.options, o => o.value);
        for (let curAttr of attrs) {
            if (existing.includes(curAttr))
                continue;
            let opt = document.createElement('option');
            opt.value = curAttr;
            opt.textContent = curAttr;
            select.appendChild(opt);
        }
    }

    /**
     * Adds an operator and column row to the formula builder
     *
     * @returns {undefined}
     */
    addFormulaRow() {
        let rows = this.menu.querySelector('.swac_datafilterbar_formularows');
        let row = document.createElement('div');
        row.classList.add('uk-flex', 'uk-flex-middle', 'uk-margin-small-bottom');
        row.style.gap = '4px';
        let op = document.createElement('input');
        op.classList.add('swac_datafilterbar_formulaop', 'uk-input', 'uk-form-small');
        op.type = 'text';
        op.placeholder = '+';
        op.style.width = '50px';
        let select = document.createElement('select');
        select.classList.add('swac_datafilterbar_formulaattr', 'uk-select', 'uk-form-small');
        let placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = '';
        select.appendChild(placeholder);
        this.fillAttrSelect(select, this.allAttrs);
        let del = document.createElement('a');
        del.href = '#';
        del.innerHTML = '<span uk-icon="icon: close; ratio: 0.7"></span>';
        del.addEventListener('click', function (evt) {
            evt.preventDefault();
            row.remove();
        });
        row.appendChild(op);
        row.appendChild(select);
        row.appendChild(del);
        rows.appendChild(row);
    }

    /**
     * Clears the formula builder inputs and removes the extra rows
     *
     * @returns {undefined}
     */
    resetFormulaRows() {
        this.menu.querySelector('.swac_datafilterbar_colname').value = '';
        let rows = this.menu.querySelector('.swac_datafilterbar_formularows');
        let allRows = rows.querySelectorAll(':scope > div');
        for (let i = 1; i < allRows.length; i++) {
            allRows[i].remove();
        }
        let firstSel = rows.querySelector('.swac_datafilterbar_formulaattr');
        if (firstSel)
            firstSel.value = '';
    }

    /**
     * Updates the available time range display (#61)
     *
     * @returns {undefined}
     */
    updateAvailableRange() {
        if (!this.menu)
            return;
        let block = this.menu.querySelector('.swac_datafilterbar_availblock');
        if (!this.timeAttrName || this.sourceSets().length === 0) {
            block.classList.add('swac_dontdisplay');
            return;
        }
        let min = null;
        let max = null;
        for (let curSet of this.sourceSets()) {
            let raw = curSet[this.timeAttrName];
            if (!raw)
                continue;
            let d = new Date(raw);
            if (isNaN(d.valueOf()))
                continue;
            if (min === null || d < min)
                min = d;
            if (max === null || d > max)
                max = d;
        }
        if (min === null) {
            block.classList.add('swac_dontdisplay');
            return;
        }
        block.classList.remove('swac_dontdisplay');
        this.menu.querySelector('.swac_datafilterbar_availvalues').textContent
                = this.formatDateTime(min) + ' - ' + this.formatDateTime(max);
    }

    /**
     * Reads filter and aggregation inputs, stores and applies them
     *
     * @returns {undefined}
     */
    applyAllFilters() {
        let fromVal = this.menu.querySelector('.swac_datafilterbar_from').value;
        let toVal = this.menu.querySelector('.swac_datafilterbar_to').value;
        this.fromFilter = fromVal ? new Date(fromVal) : null;
        this.toFilter = toVal ? new Date(toVal) : null;

        let attr = this.menu.querySelector('.swac_datafilterbar_attr').value;
        let op = this.menu.querySelector('.swac_datafilterbar_op').value;
        let val = parseFloat(this.menu.querySelector('.swac_datafilterbar_val').value);
        this.valueFilter = (!attr || isNaN(val)) ? null : {attr: attr, op: op, val: val};

        let amount = parseFloat(this.menu.querySelector('.swac_datafilterbar_aggamount').value);
        let unit = this.menu.querySelector('.swac_datafilterbar_aggunit').value;
        this.aggregation = (isNaN(amount) || amount <= 0) ? null : {amount: amount, unit: unit};

        this.saveSettings();
        this.updateRequestorDisplay();
        this.applyAll();
    }

    /**
     * Clears filters and aggregation and shows all data again
     *
     * @returns {undefined}
     */
    resetAllFilters() {
        this.fromFilter = null;
        this.toFilter = null;
        this.valueFilter = null;
        this.aggregation = null;
        this.menu.querySelector('.swac_datafilterbar_from').value = '';
        this.menu.querySelector('.swac_datafilterbar_to').value = '';
        this.menu.querySelector('.swac_datafilterbar_val').value = '';
        this.menu.querySelector('.swac_datafilterbar_aggamount').value = '';
        this.saveSettings();
        this.updateRequestorDisplay();
        this.applyAll();
    }

    /**
     * Checks if the table needs replaced display sets
     *
     * @returns {Boolean} True when aggregation or an alternative source is active
     */
    tableTransformActive() {
        return this.altSource !== null || this.aggregation !== null;
    }

    /**
     * Builds the sets to display: filtered, extended by computed columns and
     * aggregated. Original sets are never changed, copies are used as soon as
     * a transformation is active.
     *
     * @returns {Array} Sets to display
     */
    buildDisplaySets() {
        let sets = [];
        for (let curSet of this.sourceSets()) {
            if (this.passesFilters(curSet))
                sets.push(curSet);
        }
        let needCopies = this.altSource !== null || this.aggregation !== null
                || this.computedColumns.length > 0;
        if (!needCopies) {
            this.sortByTime(sets);
            return sets;
        }
        sets = sets.map(s => this.copySet(s));
        // Computed columns before aggregation, so intervals average the results
        for (let curCol of this.computedColumns) {
            for (let curSet of sets) {
                curSet[curCol.name] = this.evaluateFormula(curCol.formula, curSet);
            }
        }
        if (this.aggregation)
            sets = this.aggregateSets(sets);
        // Every display set needs a source name for the chart labels
        let fallbackName = this.altSource
                ? this.altSource.url
                : (this.getHost().options.fromName || 'data');
        for (let curSet of sets) {
            if (!curSet.swac_fromName)
                curSet.swac_fromName = fallbackName;
        }
        this.sortByTime(sets);
        return sets;
    }

    /**
     * Creates a plain copy of a set, keeping the source name
     *
     * @param {Object} set Set to copy
     * @returns {Object} Copy
     */
    copySet(set) {
        let copy = {};
        for (let curAttr in set) {
            if (curAttr.startsWith('swac_'))
                continue;
            copy[curAttr] = set[curAttr];
        }
        copy.swac_fromName = set.swac_fromName;
        return copy;
    }

    /**
     * Aggregates sets into time intervals (#59). Sets are grouped into buckets
     * of the chosen length, every numeric attribute is averaged per bucket and
     * the time attribute is set to the bucket start.
     *
     * @param {Array} sets Copied sets to aggregate
     * @returns {Array} Aggregated sets, one per interval
     */
    aggregateSets(sets) {
        if (!this.timeAttrName)
            return sets;
        let unitMs = {seconds: 1000, minutes: 60000, hours: 3600000, days: 86400000};
        let bucketMs = this.aggregation.amount * unitMs[this.aggregation.unit];
        if (!bucketMs || bucketMs <= 0 || isNaN(bucketMs))
            return sets;

        let buckets = new Map();
        for (let curSet of sets) {
            let d = new Date(curSet[this.timeAttrName]);
            if (isNaN(d.valueOf()))
                continue;
            let key = Math.floor(d.getTime() / bucketMs);
            if (!buckets.has(key))
                buckets.set(key, []);
            buckets.get(key).push(curSet);
        }

        let result = [];
        for (let [key, group] of buckets) {
            let agg = {};
            for (let curAttr in group[0]) {
                agg[curAttr] = group[0][curAttr];
            }
            // Average every numeric attribute found in the group
            let numAttrs = new Set();
            for (let curSet of group) {
                for (let curAttr in curSet) {
                    if (curAttr.startsWith('swac_') || curAttr === 'id'
                            || curAttr === this.timeAttrName)
                        continue;
                    if (this.isNumericValue(curSet[curAttr]))
                        numAttrs.add(curAttr);
                }
            }
            for (let curAttr of numAttrs) {
                let sum = 0;
                let count = 0;
                for (let curSet of group) {
                    let v = curSet[curAttr];
                    if (typeof v === 'string')
                        v = Number(v);
                    if (typeof v === 'number' && isFinite(v)) {
                        sum += v;
                        count++;
                    }
                }
                if (count > 0)
                    agg[curAttr] = Math.round((sum / count) * 1000) / 1000;
            }
            agg[this.timeAttrName] = this.toIsoLocal(new Date(key * bucketMs));
            result.push(agg);
        }
        return result;
    }

    /**
     * Evaluates a computed column formula for one set. Attribute names are
     * replaced by values, afterwards only numbers and basic math are allowed.
     *
     * @param {String} formula Formula like temp1 + co2
     * @param {Object} set Set with the values
     * @returns {Number|null} Result or null
     */
    evaluateFormula(formula, set) {
        let expr = formula;
        let attrs = Object.keys(set).sort((a, b) => b.length - a.length);
        for (let curAttr of attrs) {
            if (curAttr.startsWith('swac_') || !expr.includes(curAttr))
                continue;
            let v = set[curAttr];
            if (typeof v === 'string')
                v = Number(v);
            if (typeof v !== 'number' || !isFinite(v))
                v = NaN;
            expr = expr.split(curAttr).join('(' + v + ')');
        }
        if (!/^[0-9+\-*/(). NaN]+$/.test(expr))
            return null;
        try {
            let result = new Function('return (' + expr + ');')();
            if (typeof result !== 'number' || !isFinite(result))
                return null;
            return Math.round(result * 1000) / 1000;
        } catch (e) {
            return null;
        }
    }

    /**
     * Applies the settings to all targets. The charts get the display sets
     * for one redraw, tables toggle their rows in the dom and show own
     * display rows when a transformation is active. The datastore is never
     * touched, so no reload cycles can occur.
     *
     * @returns {undefined}
     */
    applyAll() {
        let thisRef = this;
        let displaySets = this.buildDisplaySets();
        for (let curTarget of this.findTargets()) {
            if (curTarget.dataManager) {
                let dm = curTarget.dataManager;
                if (typeof dm.setDisplayNames === 'function')
                    dm.setDisplayNames(this.renames);
                if (typeof dm.setDisplaySets === 'function') {
                    dm.setDisplaySets(displaySets, null);
                } else {
                    Msg.warn('Datafilterbar', 'The DataManager plugin is outdated, please update it.', this.requestor);
                    dm.setFilterPredicate(function (set) {
                        return thisRef.passesFilters(set);
                    });
                }
                continue;
            }
            this.updateTableHeaders(curTarget.comp);
            this.updateRowVisibility(curTarget.comp);
            this.updateComputedColumns(curTarget.comp, displaySets);
            this.renderDisplayRows(curTarget.comp, displaySets);
        }
    }

    /**
     * Shows and hides the table rows in the dom. With an active
     * transformation only the display rows stay visible, otherwise the rows
     * are toggled by the filters.
     *
     * @param {View} comp Target component
     * @returns {undefined}
     */
    updateRowVisibility(comp) {
        let transformed = this.tableTransformActive();
        let byKey = new Map();
        for (let curSet of this.sourceSets()) {
            byKey.set(curSet.swac_fromName + '|' + curSet.id, curSet);
        }
        for (let curRow of comp.requestor.querySelectorAll('.swac_repeatedForSet')) {
            let show;
            if (transformed) {
                show = false;
            } else {
                let sfn = curRow.getAttribute('swac_fromname');
                let sid = curRow.getAttribute('swac_setid');
                let set = byKey.get(sfn + '|' + sid) || byKey.get(sfn + '|' + Number(sid));
                show = set ? (this.passesFilters(set) && this.matchesColumnFilters(set)) : true;
            }
            if (show)
                curRow.classList.remove('swac_dontdisplay');
            else
                curRow.classList.add('swac_dontdisplay');
        }
    }

    /**
     * Renders the display rows (e.g. aggregates) directly into the table dom.
     * Every display row is a clone of a rendered original row with replaced
     * cell values, so the cells always align exactly with the table columns.
     * No sets are added to the datastore, so lazy loading tables cannot start
     * reload cycles.
     *
     * @param {View} comp Target component
     * @param {Array} displaySets Sets to display
     * @returns {undefined}
     */
    renderDisplayRows(comp, displaySets) {
        let req = comp.requestor;
        for (let curRow of req.querySelectorAll('.swac_datafilterbar_displayrow')) {
            curRow.remove();
        }
        if (!this.tableTransformActive())
            return;
        let sample = req.querySelector('.swac_repeatedForSet');
        if (!sample)
            return;

        let parent = sample.parentNode;
        for (let curSet of displaySets) {
            let tr = sample.cloneNode(true);
            tr.className = 'swac_datafilterbar_displayrow';
            tr.removeAttribute('swac_setid');
            tr.removeAttribute('swac_fromname');
            for (let curCell of tr.children) {
                // Computed cells carry the column name
                let colName = curCell.getAttribute('swac_datafilterbar_col');
                if (colName) {
                    let val = curSet[colName];
                    curCell.textContent = (val === null || val === undefined) ? 'NaN' : val;
                    continue;
                }
                // Attribute cells carry their attribute in the tooltip
                let attr = null;
                let tipElem = curCell.querySelector('[uk-tooltip]');
                if (tipElem) {
                    let match = /title:\s*([^;]+)/.exec(tipElem.getAttribute('uk-tooltip'));
                    if (match && this.allAttrs.has(match[1].trim()))
                        attr = match[1].trim();
                }
                if (attr) {
                    let val = curSet[attr];
                    curCell.textContent = (val === null || val === undefined) ? 'NaN' : val;
                } else {
                    // Cells like labels or map links make no sense on
                    // aggregated rows, clear them including subcomponents
                    curCell.textContent = '';
                }
            }
            parent.appendChild(tr);
        }
        this.toggleDisplayRows(comp);
    }

    /**
     * Shows and hides the display rows by the computed column filters
     *
     * @param {View} comp Target component
     * @returns {undefined}
     */
    toggleDisplayRows(comp) {
        for (let curRow of comp.requestor.querySelectorAll('.swac_datafilterbar_displayrow')) {
            let show = true;
            for (let curName in this.columnFilters) {
                let text = this.columnFilters[curName];
                if (!text)
                    continue;
                let td = curRow.querySelector('td[swac_datafilterbar_col="' + curName + '"]');
                if (td && !td.textContent.includes(text)) {
                    show = false;
                    break;
                }
            }
            curRow.classList.toggle('swac_dontdisplay', !show);
        }
    }

    /**
     * Checks if a set passes the computed column filters
     *
     * @param {Object} set Dataset
     * @returns {Boolean} True if the set matches all column filters
     */
    matchesColumnFilters(set) {
        for (let curName in this.columnFilters) {
            let text = this.columnFilters[curName];
            if (!text)
                continue;
            let col = this.computedColumns.find(c => c.name === curName);
            if (!col)
                continue;
            let val = this.evaluateFormula(col.formula, set);
            let str = (val === null || val === undefined) ? 'NaN' : String(val);
            if (!str.includes(text))
                return false;
        }
        return true;
    }

    /**
     * Asks for a new name for a computed column and renames it
     *
     * @param {String} oldName Current column name
     * @returns {undefined}
     */
    onClickRenameComputed(oldName) {
        let input = window.prompt(this.translate('renameprompt', 'New column name'), oldName);
        if (input === null)
            return;
        input = input.trim();
        if (!input || input === oldName)
            return;
        let col = this.computedColumns.find(c => c.name === oldName);
        if (!col)
            return;
        this.computedColumns = this.computedColumns.filter(c => c.name !== input);
        col.name = input;
        if (this.columnFilters[oldName] !== undefined) {
            this.columnFilters[input] = this.columnFilters[oldName];
            delete this.columnFilters[oldName];
        }
        this.saveSettings();
        this.refreshComputedList();
        this.applyAll();
    }

    /**
     * Renders the computed columns into a table target (own header and cells,
     * matched to the rows over the swac_setid attribute)
     *
     * @param {View} comp Target component
     * @param {Array} displaySets Current display sets
     * @returns {undefined}
     */
    updateComputedColumns(comp, displaySets) {
        let req = comp.requestor;
        let firstTh = req.querySelector('th');
        if (!firstTh)
            return;
        let headRow = firstTh.parentNode;

        // Remove headers and cells of no longer existing columns
        for (let curHead of req.querySelectorAll('.swac_datafilterbar_colhead')) {
            let name = curHead.getAttribute('swac_datafilterbar_col');
            if (!this.computedColumns.find(c => c.name === name)) {
                curHead.remove();
                for (let curCell of req.querySelectorAll('td[swac_datafilterbar_col="' + name + '"]')) {
                    curCell.remove();
                }
            }
        }

        // Ensure a header per column with rename icon, remove icon and a
        // search field like the other columns have
        let thisRef = this;
        for (let curCol of this.computedColumns) {
            if (!req.querySelector('.swac_datafilterbar_colhead[swac_datafilterbar_col="' + curCol.name + '"]')) {
                let th = document.createElement('th');
                th.classList.add('swac_datafilterbar_colhead');
                th.setAttribute('swac_datafilterbar_col', curCol.name);
                let label = document.createElement('span');
                label.textContent = curCol.name;
                let ren = document.createElement('a');
                ren.href = '#';
                ren.innerHTML = '<span uk-icon="icon: pencil; ratio: 0.6"></span>';
                ren.style.marginLeft = '4px';
                ren.addEventListener('click', (function (colName) {
                    return function (evt) {
                        evt.preventDefault();
                        evt.stopPropagation();
                        thisRef.onClickRenameComputed(colName);
                    };
                })(curCol.name));
                let del = document.createElement('a');
                del.href = '#';
                del.innerHTML = '<span uk-icon="icon: close; ratio: 0.6"></span>';
                del.style.marginLeft = '4px';
                del.addEventListener('click', (function (colName) {
                    return function (evt) {
                        evt.preventDefault();
                        evt.stopPropagation();
                        thisRef.computedColumns = thisRef.computedColumns.filter(c => c.name !== colName);
                        delete thisRef.columnFilters[colName];
                        thisRef.saveSettings();
                        thisRef.refreshComputedList();
                        thisRef.applyAll();
                    };
                })(curCol.name));
                let filter = document.createElement('input');
                filter.classList.add('swac_datafilterbar_colfilter', 'uk-input', 'uk-form-small');
                filter.type = 'text';
                filter.value = this.columnFilters[curCol.name] || '';
                filter.addEventListener('click', function (evt) {
                    evt.stopPropagation();
                });
                filter.addEventListener('input', (function (colName, comp2) {
                    return function (evt) {
                        thisRef.columnFilters[colName] = evt.target.value.trim();
                        thisRef.updateRowVisibility(comp2);
                        thisRef.toggleDisplayRows(comp2);
                    };
                })(curCol.name, comp));
                th.appendChild(label);
                th.appendChild(ren);
                th.appendChild(del);
                th.appendChild(document.createElement('br'));
                th.appendChild(filter);
                headRow.appendChild(th);
            }
        }
        if (this.computedColumns.length === 0)
            return;

        // Index the source sets for the row matching
        let byKey = new Map();
        for (let curSet of this.sourceSets()) {
            byKey.set(curSet.swac_fromName + '|' + curSet.id, curSet);
        }

        // Ensure a cell per row and column
        for (let curRow of req.querySelectorAll('.swac_repeatedForSet')) {
            let sid = curRow.getAttribute('swac_setid');
            let sfn = curRow.getAttribute('swac_fromname');
            let set = byKey.get(sfn + '|' + sid) || byKey.get(sfn + '|' + Number(sid));
            for (let curCol of this.computedColumns) {
                let td = curRow.querySelector('td[swac_datafilterbar_col="' + curCol.name + '"]');
                if (!td) {
                    td = document.createElement('td');
                    td.setAttribute('swac_datafilterbar_col', curCol.name);
                    curRow.appendChild(td);
                }
                let val = null;
                if (set) {
                    val = (set[curCol.name] !== undefined && set[curCol.name] !== null)
                            ? set[curCol.name]
                            : this.evaluateFormula(curCol.formula, set);
                }
                // Not computable combinations (dates, booleans, texts) show NaN
                td.textContent = (val === null || val === undefined) ? 'NaN' : val;
            }
        }
    }

    /**
     * Adds a rename icon behind every column title of a table target (#70).
     * A click on the icon asks for the new name, the rename is stored
     * globally in localStorage and applied to tables and charts.
     *
     * @param {View} comp Target component
     * @returns {undefined}
     */
    updateTableHeaders(comp) {
        let thisRef = this;
        for (let curTh of comp.requestor.querySelectorAll('th')) {
            if (curTh.classList.contains('swac_datafilterbar_colhead'))
                continue;
            let span = curTh.querySelector('.swac_datafilterbar_colname');
            if (!span) {
                for (let curNode of curTh.childNodes) {
                    if (curNode.nodeType !== 3)
                        continue;
                    let text = curNode.textContent.trim();
                    if (!text || !this.allAttrs.has(text))
                        continue;
                    span = document.createElement('span');
                    span.classList.add('swac_datafilterbar_colname');
                    span.setAttribute('swac_datafilterbar_attr', text);
                    span.textContent = text;
                    let icon = document.createElement('a');
                    icon.href = '#';
                    icon.classList.add('swac_datafilterbar_renameicon');
                    icon.innerHTML = '<span uk-icon="icon: pencil; ratio: 0.6"></span>';
                    icon.style.marginLeft = '4px';
                    icon.addEventListener('click', function (evt) {
                        evt.preventDefault();
                        evt.stopPropagation();
                        thisRef.onClickRenameAttr(span.getAttribute('swac_datafilterbar_attr'));
                    });
                    curTh.replaceChild(span, curNode);
                    span.after(icon);
                    break;
                }
            }
            if (span) {
                let orig = span.getAttribute('swac_datafilterbar_attr');
                span.textContent = this.renames[orig] || orig;
            }
        }
    }

    /**
     * Asks for a new column name and stores the rename globally
     *
     * @param {String} orig Original attribute name
     * @returns {undefined}
     */
    onClickRenameAttr(orig) {
        let current = this.renames[orig] || orig;
        let input = window.prompt(this.translate('renameprompt', 'New column name'), current);
        if (input === null)
            return;
        input = input.trim();
        if (!input || input === orig)
            delete this.renames[orig];
        else
            this.renames[orig] = input;
        this.saveSettings();
        // Renaming is display only, just refresh headers and chart names
        for (let curTarget of this.findTargets()) {
            if (curTarget.dataManager) {
                if (typeof curTarget.dataManager.setDisplayNames === 'function')
                    curTarget.dataManager.setDisplayNames(this.renames);
            } else {
                this.updateTableHeaders(curTarget.comp);
            }
        }
    }

    /**
     * Gets a plugin translation with fallback
     *
     * @param {String} key Translation key
     * @param {String} fallback Fallback text
     * @returns {String} Translated text
     */
    translate(key, fallback) {
        try {
            let prefix = this.name.replace('/plugins/', '/').replace('/', '_');
            let text = SWAC.lang.getTranslationForId(prefix + '.' + key);
            if (text)
                return text;
        } catch (e) {
            // No translation available, use the fallback
        }
        return fallback;
    }

    /**
     * Finds the host and every component with a shared datasource
     *
     * @returns {Array} Objects with comp and dataManager
     */
    findTargets() {
        let host = this.getHost();
        let targets = [this.describeTarget(host)];
        this.watchTarget(host);
        if (!this.options.filterSameSource)
            return targets;
        let hostSources = Object.keys(host.data);
        for (let curElem of document.querySelectorAll('[swa]')) {
            if (!curElem.swac_comp || curElem.swac_comp === host)
                continue;
            let comp = curElem.swac_comp;
            let sharesSource = false;
            for (let curSource in comp.data) {
                if (hostSources.includes(curSource)) {
                    sharesSource = true;
                    break;
                }
            }
            if (sharesSource) {
                targets.push(this.describeTarget(comp));
                this.watchTarget(comp);
            }
        }
        return targets;
    }

    /**
     * Describes a target and its DataManager plugin if available
     *
     * @param {View} comp Component
     * @returns {Object} Object with comp and dataManager
     */
    describeTarget(comp) {
        let dataManager = null;
        if (comp.plugins) {
            let dmReq = comp.plugins.get('DataManager');
            if (dmReq && dmReq.swac_comp && typeof dmReq.swac_comp.setFilterPredicate === 'function')
                dataManager = dmReq.swac_comp;
        }
        return {comp: comp, dataManager: dataManager};
    }

    /**
     * Reapplies the settings when a target loads more data
     *
     * @param {View} comp Target component
     * @returns {undefined}
     */
    watchTarget(comp) {
        let thisRef = this;
        let targetId = comp.requestor.id;
        if (this.watchedTargets.includes(targetId))
            return;
        this.watchedTargets.push(targetId);
        document.addEventListener('swac_Component_' + targetId + '_lastSetFromRequestAdded', function () {
            // Debounce: lazy loading fires once per loaded block
            if (thisRef.applyTimeout)
                clearTimeout(thisRef.applyTimeout);
            thisRef.applyTimeout = setTimeout(function () {
                thisRef.applyTimeout = null;
                thisRef.applyAll();
            }, 200);
        });
    }

    /**
     * Checks if a set passes the time range and value filters
     *
     * @param {Object} set Dataset
     * @returns {Boolean} True if the set should be shown
     */
    passesFilters(set) {
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
        if (this.valueFilter) {
            let v = set[this.valueFilter.attr];
            if (v === null || v === undefined)
                return false;
            if (typeof v === 'string')
                v = Number(v);
            if (isNaN(v))
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
     * Adds a computed column from the menu inputs
     *
     * @returns {undefined}
     */
    onClickAddColumn() {
        let name = this.menu.querySelector('.swac_datafilterbar_colname').value.trim();
        if (!name)
            return;
        // Build the formula from the row inputs: column, operator, column, ...
        let parts = [];
        for (let curRow of this.menu.querySelectorAll('.swac_datafilterbar_formularows > div')) {
            let sel = curRow.querySelector('.swac_datafilterbar_formulaattr');
            if (!sel || !sel.value)
                continue;
            if (parts.length > 0) {
                let op = curRow.querySelector('.swac_datafilterbar_formulaop');
                parts.push(op && op.value.trim() ? op.value.trim() : '+');
            }
            parts.push(sel.value);
        }
        if (parts.length === 0)
            return;
        let formula = parts.join(' ');
        this.computedColumns = this.computedColumns.filter(c => c.name !== name);
        this.computedColumns.push({name: name, formula: formula});
        this.saveSettings();
        this.refreshComputedList();
        this.resetFormulaRows();
        this.applyAll();
    }

    /**
     * Rebuilds the list of computed columns with remove links
     *
     * @returns {undefined}
     */
    refreshComputedList() {
        let thisRef = this;
        let list = this.menu.querySelector('.swac_datafilterbar_computedlist');
        list.innerHTML = '';
        for (let curCol of this.computedColumns) {
            let row = document.createElement('div');
            let label = document.createElement('span');
            label.textContent = curCol.name + ' = ' + curCol.formula + ' ';
            let del = document.createElement('a');
            del.href = '#';
            del.innerHTML = '<span uk-icon="icon: close; ratio: 0.7"></span>';
            del.addEventListener('click', function (evt) {
                evt.preventDefault();
                thisRef.computedColumns = thisRef.computedColumns.filter(c => c.name !== curCol.name);
                thisRef.saveSettings();
                thisRef.refreshComputedList();
                thisRef.applyAll();
            });
            row.appendChild(label);
            row.appendChild(del);
            list.appendChild(row);
        }
    }

    /**
     * Loads an alternative datasource that replaces the shown data (#64)
     *
     * @returns {undefined}
     */
    onClickLoadSource() {
        let thisRef = this;
        let url = this.menu.querySelector('.swac_datafilterbar_sourceurl').value.trim();
        if (!url)
            return;
        window.swac.Model.load({fromName: url}).then(function (res) {
            let sets = [];
            for (let curSet of res) {
                if (curSet)
                    sets.push(curSet);
            }
            thisRef.altSource = {url: url, sets: sets};
            thisRef.menu.querySelector('.swac_datafilterbar_sourcestate').textContent = url + ' (' + sets.length + ')';
            thisRef.redetectAttributes();
            thisRef.chooseTimeAttr();
            thisRef.updateTimeBlockVisibility();
            thisRef.refreshAttrOptions();
            thisRef.updateAvailableRange();
            thisRef.saveSettings();
            thisRef.updateRequestorDisplay();
            thisRef.applyAll();
        }).catch(function (err) {
            Msg.error('Datafilterbar', 'Could not load datasource >' + url + '<: ' + err, thisRef.requestor);
            thisRef.menu.querySelector('.swac_datafilterbar_sourcestate').textContent = 'Error: ' + url;
        });
    }

    /**
     * Removes the alternative datasource and shows the original data again
     *
     * @returns {undefined}
     */
    onClickRemoveSource() {
        this.altSource = null;
        this.menu.querySelector('.swac_datafilterbar_sourcestate').textContent = '';
        this.menu.querySelector('.swac_datafilterbar_sourceurl').value = '';
        this.redetectAttributes();
        this.chooseTimeAttr();
        this.updateTimeBlockVisibility();
        this.refreshAttrOptions();
        this.updateAvailableRange();
        this.saveSettings();
        this.updateRequestorDisplay();
        this.applyAll();
    }

    /**
     * Writes all settings as json into the textarea
     *
     * @returns {undefined}
     */
    onClickExport() {
        this.menu.querySelector('.swac_datafilterbar_settingsio').value
                = JSON.stringify(this.settingsToObject(), null, 2);
    }

    /**
     * Reads settings json from the textarea and applies it
     *
     * @returns {undefined}
     */
    onClickImport() {
        let raw = this.menu.querySelector('.swac_datafilterbar_settingsio').value;
        let obj;
        try {
            obj = JSON.parse(raw);
        } catch (e) {
            Msg.error('Datafilterbar', 'Import is no valid json.', this.requestor);
            return;
        }
        this.settingsFromObject(obj);
        this.saveSettings();
        this.fillInputsFromState();
        this.refreshComputedList();
        this.updateRequestorDisplay();
        this.applyAll();
    }

    /**
     * Collects all settings into one plain object
     *
     * @returns {Object} Settings object
     */
    settingsToObject() {
        return {
            timeFrom: this.fromFilter ? this.fromFilter.toISOString() : null,
            timeTo: this.toFilter ? this.toFilter.toISOString() : null,
            valueFilter: this.valueFilter,
            aggregation: this.aggregation,
            renames: this.renames,
            computedColumns: this.computedColumns,
            datasource: this.altSource ? this.altSource.url : null
        };
    }

    /**
     * Applies a settings object to the state
     *
     * @param {Object} obj Settings object
     * @returns {undefined}
     */
    settingsFromObject(obj) {
        this.fromFilter = obj.timeFrom ? new Date(obj.timeFrom) : null;
        this.toFilter = obj.timeTo ? new Date(obj.timeTo) : null;
        this.valueFilter = obj.valueFilter || null;
        this.aggregation = obj.aggregation || null;
        this.renames = obj.renames || {};
        this.computedColumns = obj.computedColumns || [];
        if (obj.datasource) {
            this.menu.querySelector('.swac_datafilterbar_sourceurl').value = obj.datasource;
            this.onClickLoadSource();
        }
    }

    /**
     * Fills the menu inputs from the current state
     *
     * @returns {undefined}
     */
    fillInputsFromState() {
        if (this.fromFilter)
            this.menu.querySelector('.swac_datafilterbar_from').value = this.toInputValue(this.fromFilter);
        if (this.toFilter)
            this.menu.querySelector('.swac_datafilterbar_to').value = this.toInputValue(this.toFilter);
        if (this.valueFilter) {
            this.menu.querySelector('.swac_datafilterbar_attr').value = this.valueFilter.attr;
            this.menu.querySelector('.swac_datafilterbar_op').value = this.valueFilter.op;
            this.menu.querySelector('.swac_datafilterbar_val').value = this.valueFilter.val;
        }
        if (this.aggregation) {
            this.menu.querySelector('.swac_datafilterbar_aggamount').value = this.aggregation.amount;
            this.menu.querySelector('.swac_datafilterbar_aggunit').value = this.aggregation.unit;
        }
    }

    /**
     * Shows the dataRequestor resulting from the settings for reuse
     *
     * @returns {undefined}
     */
    updateRequestorDisplay() {
        if (!this.menu)
            return;
        let host = this.getHost();
        let requestor = {
            fromName: this.altSource ? this.altSource.url : (host.options.fromName || null),
            fromWheres: {}
        };
        if (host.options.fromWheres) {
            for (let curWhere in host.options.fromWheres) {
                requestor.fromWheres[curWhere] = host.options.fromWheres[curWhere];
            }
        }
        let filters = [];
        if (requestor.fromWheres.filter)
            filters.push(requestor.fromWheres.filter);
        let opMap = {gt: 'gt', lt: 'lt', eq: 'eq', gte: 'ge', lte: 'le'};
        if (this.fromFilter && this.timeAttrName)
            filters.push(this.timeAttrName + ',ge,' + this.fromFilter.toISOString());
        if (this.toFilter && this.timeAttrName)
            filters.push(this.timeAttrName + ',le,' + this.toFilter.toISOString());
        if (this.valueFilter)
            filters.push(this.valueFilter.attr + ',' + opMap[this.valueFilter.op] + ',' + this.valueFilter.val);
        if (filters.length > 0)
            requestor.fromWheres.filter = filters.join('&filter=');
        this.menu.querySelector('.swac_datafilterbar_requestor').textContent
                = JSON.stringify(requestor, null, 2);
    }

    /**
     * Builds the storage key for the source bound settings
     *
     * @returns {String} Storage key
     */
    buildStorageKey() {
        if (this.options.storageKey)
            return this.options.storageKey;
        let host = this.getHost();
        let source = host.options && host.options.fromName ? host.options.fromName : 'data';
        return 'swac_datafilterbar_' + this.requestor.parent.id + '_' + source;
    }

    /**
     * Stores the settings. Renames and computed columns are stored globally
     * so they apply to all stations (#70).
     *
     * @returns {undefined}
     */
    saveSettings() {
        if (!this.options.storeFilters)
            return;
        let local = this.settingsToObject();
        let global = {renames: local.renames, computedColumns: local.computedColumns};
        delete local.renames;
        delete local.computedColumns;
        try {
            localStorage.setItem(this.buildStorageKey(), JSON.stringify(local));
            localStorage.setItem('swac_datafilterbar_global', JSON.stringify(global));
        } catch (e) {
            Msg.error('Datafilterbar', 'Could not store settings: ' + e, this.requestor);
        }
    }

    /**
     * Restores the stored settings and fills the inputs
     *
     * @returns {undefined}
     */
    restoreStoredSettings() {
        let local = null;
        let global = null;
        try {
            local = JSON.parse(localStorage.getItem(this.buildStorageKey()));
            global = JSON.parse(localStorage.getItem('swac_datafilterbar_global'));
        } catch (e) {
            return;
        }
        let obj = local || {};
        if (global) {
            obj.renames = global.renames || {};
            obj.computedColumns = global.computedColumns || [];
        }
        this.settingsFromObject(obj);
        this.fillInputsFromState();
    }

    /**
     * Sorts sets by the time attribute
     *
     * @param {Array} sets Sets to sort in place
     * @returns {undefined}
     */
    sortByTime(sets) {
        let attr = this.timeAttrName;
        if (!attr)
            return;
        sets.sort(function (a, b) {
            if (a[attr] < b[attr])
                return -1;
            if (a[attr] > b[attr])
                return 1;
            return 0;
        });
    }

    /**
     * Checks if a value counts as number (int, double or numeric string)
     *
     * @param {*} val Value to check
     * @returns {Boolean} True when usable as number
     */
    isNumericValue(val) {
        if (typeof val === 'number')
            return isFinite(val);
        if (typeof val === 'string') {
            if (val.trim() === '')
                return false;
            if (this.looksLikeDate(val))
                return false;
            let num = Number(val);
            return !isNaN(num) && isFinite(num);
        }
        return false;
    }

    /**
     * Checks if a value is a date string (real date pattern required)
     *
     * @param {*} val Value to check
     * @returns {Boolean} True when the value is a date
     */
    looksLikeDate(val) {
        if (typeof val !== 'string')
            return false;
        if (!/^\d{4}-\d{2}-\d{2}/.test(val) && !/^\d{1,2}\.\d{1,2}\.\d{4}/.test(val))
            return false;
        let d = new Date(val);
        return !isNaN(d.valueOf());
    }

    /**
     * Formats a date as dd.mm.yyyy hh:mm
     *
     * @param {Date} date Date to format
     * @returns {String} Formatted date
     */
    formatDateTime(date) {
        let pad = n => (n < 10 ? '0' + n : '' + n);
        return pad(date.getDate()) + '.' + pad(date.getMonth() + 1) + '.' + date.getFullYear()
                + ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes());
    }

    /**
     * Converts a date to a datetime-local input value
     *
     * @param {Date} date Date to convert
     * @returns {String} Input value
     */
    toInputValue(date) {
        let pad = n => (n < 10 ? '0' + n : '' + n);
        return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate())
                + 'T' + pad(date.getHours()) + ':' + pad(date.getMinutes());
    }

    /**
     * Converts a date to a local iso like string without timezone
     *
     * @param {Date} date Date to convert
     * @returns {String} Iso like string
     */
    toIsoLocal(date) {
        let pad = n => (n < 10 ? '0' + n : '' + n);
        return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate())
                + 'T' + pad(date.getHours()) + ':' + pad(date.getMinutes()) + ':' + pad(date.getSeconds());
    }
}
