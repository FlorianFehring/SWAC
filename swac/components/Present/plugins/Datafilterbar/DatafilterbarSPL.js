import SWAC from '../../../../swac.js';
import Msg from '../../../../Msg.js';
import Plugin from '../../../../Plugin.js';
import Remote from '../../../../Remote.js';
import AIDataSourceAdapter from '../../../../AIDataSourceAdapter.js?ver=07.08.2026.3';
import ExternalDataSource from '../../../../ExternalDataSource.js?ver=07.08.2026.3';
import DataAggregation from '../../../../DataAggregation.js';
import MathJsonFormula from '../../../../MathJsonFormula.js';
import TableExport from '../../../../TableExport.js?ver=08.08.2026.6';
import TextTransfer from '../../../../TextTransfer.js?ver=10.08.2026.1';

/**
 * Adds a side menu for data filters and transformations.
 */
export default class DatafilterbarSPL extends Plugin {

    constructor(opts = {}) {
        super(opts);
        this.name = 'Present/plugins/Datafilterbar';
        this.desc.text = 'Side menu with filters, aggregation, computed columns and datasource management.';
        this.desc.developers = 'Maczap (HSBI)';
        this.desc.license = 'GNU Lesser General Public License';

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

        this.desc.opts[5] = {
            name: 'filterTarget',
            desc: 'Target for filters and aggregation. Possible values are both, chart or table.',
            example: 'both'
        };
        if (!opts.filterTarget)
            this.options.filterTarget = 'both';

        this.desc.opts[6] = {
            name: 'enableMathlive',
            desc: 'Enables MathLive and MathJSON for calculated columns.',
            example: true
        };
        if (typeof opts.enableMathlive === 'undefined')
            this.options.enableMathlive = false;

        this.desc.opts[7] = {
            name: 'visibleSections',
            desc: 'Optional list of menu sections to show.',
            example: ['filters', 'aggregation']
        };
        if (!Array.isArray(opts.visibleSections))
            this.options.visibleSections = null;

        // Filter and transformation state
        this.fromFilter = null;
        this.toFilter = null;
        this.valueFilter = null;
        this.aggregation = null;
        this.filterTarget = this.normalizeFilterTarget(this.options.filterTarget);
        this.renames = {};
        this.computedColumns = [];
        this.seriesSettings = null;
        this.altSource = null;
        this.datasourceToLoad = null;
        this.adaptationMode = 'auto';
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
        this.mathliveReady = false;
        this.mathlivePromise = null;
        this.MathfieldElement = null;
        this.mathVariables = {};
    }

    init() {
        this.loadConfiguredDefaults();
        this.loadMathlive();
        return new Promise((resolve, reject) => {
            resolve();
        });
    }

    /**
     * Loads page defaults after the plugin requestor is available.
     *
     * @returns {undefined}
     */
    loadConfiguredDefaults() {
        let config = window[this.requestor.id + '_options'];
        if (config && typeof config.enableMathlive === 'boolean')
            this.options.enableMathlive = config.enableMathlive;
        if (config && Array.isArray(config.visibleSections))
            this.options.visibleSections = config.visibleSections;
    }

    /**
     * Hides menu sections that are not configured for the current use case.
     *
     * @returns {undefined}
     */
    applySectionVisibility() {
        if (!Array.isArray(this.options.visibleSections))
            return;
        let visible = new Set(this.options.visibleSections);
        let target = this.menu.querySelector('.swac_datafilterbar_target');
        if (!visible.has('target') && target) {
            target.previousElementSibling.hidden = true;
            target.hidden = true;
        }
        for (let section of ['series', 'computed', 'datasource', 'settings', 'requestor', 'tableexport']) {
            if (!visible.has(section))
                this.hideMenuSection(section);
        }
        if (!visible.has('aggregation'))
            this.hideMenuSection('aggregation', false);
    }

    /**
     * Checks whether a menu section is enabled by the page configuration.
     *
     * @param {String} section Section name
     * @returns {Boolean} True if the section is visible
     */
    isSectionVisible(section) {
        return !Array.isArray(this.options.visibleSections)
                || this.options.visibleSections.includes(section);
    }

    /**
     * Hides a menu section beginning with its heading.
     *
     * @param {String} section Section name
     * @param {Boolean} allFollowing Hide content up to the next heading
     * @returns {undefined}
     */
    hideMenuSection(section, allFollowing = true) {
        let heading = this.menu.querySelector('h5[swac_lang="Datafilterbar.' + section + '"]');
        if (!heading)
            return;
        heading.hidden = true;
        let element = heading.nextElementSibling;
        while (element && (!allFollowing || element.tagName !== 'H5')) {
            element.hidden = true;
            if (!allFollowing)
                return;
            element = element.nextElementSibling;
        }
    }

    /**
     * Loads the optional MathLive editor for calculated columns.
     *
     * @returns {undefined}
     */
    loadMathlive() {
        if (!this.options.enableMathlive || this.mathlivePromise)
            return;
        this.mathlivePromise = import('../../../../libs/mathlive/MathLiveLoader.js?ver=11.08.2026.3')
                .then((MathLiveLoader) => MathLiveLoader.loadMathLive())
                .then((MathfieldElement) => {
                    this.MathfieldElement = MathfieldElement;
                    this.mathliveReady = true;
                    this.initializeMathfield();
                }).catch((error) => {
                    this.mathliveReady = false;
                    Msg.warn('Datafilterbar', this.translate('mathliveerror', 'MathLive could not be loaded.') + ' ' + error.message, this.requestor);
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
        this.applySectionVisibility();

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
        menu.querySelector('.swac_datafilterbar_insertmathattr').addEventListener('click', function () {
            thisRef.insertMathAttribute();
        });
        menu.querySelector('.swac_datafilterbar_loadsource').addEventListener('click', function () {
            thisRef.onClickLoadSource();
        });
        menu.querySelector('.swac_datafilterbar_sourcefile').addEventListener('change', function (evt) {
            thisRef.onChangeSourceFile(evt);
        });
        menu.querySelector('.swac_datafilterbar_adaptationmode').addEventListener('change', function (evt) {
            thisRef.adaptationMode = thisRef.normalizeAdaptationMode(evt.target.value);
            thisRef.saveSettings();
        });
        menu.querySelector('.swac_datafilterbar_removesource').addEventListener('click', function () {
            thisRef.onClickRemoveSource();
        });
        menu.querySelector('.swac_datafilterbar_tableexport').addEventListener('click', function () {
            thisRef.onClickTableExport();
        });
        menu.querySelector('.swac_datafilterbar_settingsdownload').addEventListener('click', function () {
            thisRef.onClickSettingsDownload();
        });
        menu.querySelector('.swac_datafilterbar_settingscopy').addEventListener('click', function () {
            thisRef.onClickSettingsCopy();
        });
        menu.querySelector('.swac_datafilterbar_importbtn').addEventListener('click', function () {
            thisRef.onClickImport();
        });
        menu.querySelector('.swac_datafilterbar_settingsfile').addEventListener('change', function (evt) {
            thisRef.onSelectSettingsFile(evt);
        });

        SWAC.lang.translateAll(toggle);
        SWAC.lang.translateAll(menu);
        this.initializeMathfield();
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
                + '<label class="uk-form-label uk-text-small" swac_lang="Datafilterbar.target">Apply to</label>'
                + '<select class="swac_datafilterbar_target uk-select uk-form-small uk-margin-small-bottom">'
                + '<option value="both" swac_lang="Datafilterbar.target_both">Chart and table</option>'
                + '<option value="chart" swac_lang="Datafilterbar.target_chart">Chart only</option>'
                + '<option value="table" swac_lang="Datafilterbar.target_table">Table only</option>'
                + '</select>'
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
                + '<hr class="swac_datafilterbar_seriesdivider">'
                + '<h5 class="swac_datafilterbar_serieshead" swac_lang="Datafilterbar.series">Data series</h5>'
                + '<div class="swac_datafilterbar_seriescont"></div>'
                + '<hr class="swac_datafilterbar_seriesdivider">'
                + '<h5 swac_lang="Datafilterbar.computed">Computed column</h5>'
                + '<input class="swac_datafilterbar_colname uk-input uk-form-small uk-margin-small-bottom" type="text" placeholder="name">'
                + '<div class="swac_datafilterbar_mathliveblock swac_dontdisplay">'
                + '<label class="uk-form-label uk-text-small" swac_lang="Datafilterbar.formula">Formula</label>'
                + '<div class="swac_datafilterbar_mathfieldcont"></div>'
                + '<div class="uk-flex uk-flex-middle uk-margin-small-top" style="gap:4px;">'
                + '<select class="swac_datafilterbar_mathattr uk-select uk-form-small"><option value="" swac_lang="Datafilterbar.attr">Attribute</option></select>'
                + '<button class="swac_datafilterbar_insertmathattr uk-button uk-button-default uk-button-small" type="button" swac_lang="Datafilterbar.insertattr">Insert</button>'
                + '</div>'
                + '<div class="swac_datafilterbar_mathvariables uk-text-small uk-text-muted uk-margin-small-top"></div>'
                + '</div>'
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
                + '<label class="uk-form-label uk-text-small" swac_lang="Datafilterbar.adaptation">Adaptation</label>'
                + '<select class="swac_datafilterbar_adaptationmode uk-select uk-form-small uk-margin-small-bottom">'
                + '<option value="auto" swac_lang="Datafilterbar.adaptation_auto">Automatic</option>'
                + '<option value="deterministic" swac_lang="Datafilterbar.adaptation_deterministic">Rules</option>'
                + '<option value="ai" swac_lang="Datafilterbar.adaptation_ai">AI</option>'
                + '</select>'
                + '<input class="swac_datafilterbar_sourceurl uk-input uk-form-small uk-margin-small-bottom" type="url" placeholder="https://example.org/data.json">'
                + '<button class="swac_datafilterbar_loadsource uk-button uk-button-default uk-button-small" type="button" swac_lang="Datafilterbar.loadsource">Load</button> '
                + '<button class="swac_datafilterbar_removesource uk-button uk-button-default uk-button-small" type="button" swac_lang="Datafilterbar.removesource">Remove</button>'
                + '<input class="swac_datafilterbar_sourcefile uk-input uk-form-small uk-margin-small-top" type="file" accept="application/json,.json">'
                + '<div class="swac_datafilterbar_sourcestate uk-text-small uk-text-muted uk-margin-small-top"></div>'
                + '<hr>'
                + '<h5 swac_lang="Datafilterbar.tableexport">Table export</h5>'
                + '<label class="uk-form-label uk-text-small" swac_lang="Datafilterbar.exportformat">Format</label>'
                + '<select class="swac_datafilterbar_tableexportformat uk-select uk-form-small uk-margin-small-bottom">'
                + '<option value="csv" swac_lang="Datafilterbar.exportformat_csv">CSV</option>'
                + '<option value="json" swac_lang="Datafilterbar.exportformat_json">JSON</option>'
                + '<option value="xlsx" swac_lang="Datafilterbar.exportformat_xlsx">XLSX</option>'
                + '</select>'
                + '<button class="swac_datafilterbar_tableexport uk-button uk-button-default uk-button-small" type="button" swac_lang="Datafilterbar.tableexportbtn">Export table</button>'
                + '<hr>'
                + '<h5 swac_lang="Datafilterbar.settings">Settings</h5>'
                + '<p class="uk-text-small uk-text-muted" swac_lang="Datafilterbar.settingshint">Current page settings can be saved and reused here.</p>'
                + '<div class="uk-grid-small uk-child-width-1-1" uk-grid>'
                + '<div><button class="swac_datafilterbar_importbtn uk-button uk-button-default uk-button-small uk-width-1-1" type="button" swac_lang="Datafilterbar.importbtn">Import</button>'
                + '<input class="swac_datafilterbar_settingsfile swac_dontdisplay" type="file" accept="application/json,.json"></div>'
                + '<div><button class="swac_datafilterbar_settingscopy uk-button uk-button-default uk-button-small uk-width-1-1" type="button" swac_lang="Datafilterbar.settingscopy">Copy</button></div>'
                + '<div><button class="swac_datafilterbar_settingsdownload uk-button uk-button-default uk-button-small uk-width-1-1" type="button" swac_lang="Datafilterbar.settingstxt">Download as TXT</button></div>'
                + '</div>'
                + '<hr>'
                + '<h5 swac_lang="Datafilterbar.requestor">Resulting dataRequestor</h5>'
                + '<label class="swac_datafilterbar_requestorurllabel uk-form-label uk-text-small" swac_lang="Datafilterbar.requestorurl">Request URL</label>'
                + '<a class="swac_datafilterbar_requestorurl uk-text-small uk-display-block uk-margin-small-bottom" target="_blank" rel="noopener" style="word-break:break-all;"></a>'
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
        let visible = this.isSectionVisible('series') && !!dmBar && !!cont;
        this.menu.querySelector('.swac_datafilterbar_serieshead').hidden = !visible;
        cont.hidden = !visible;
        for (let divider of this.menu.querySelectorAll('.swac_datafilterbar_seriesdivider'))
            divider.hidden = !visible;
        if (!visible)
            return;
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
        this.refreshMathfieldAttributes();
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
     * Activates the MathLive formula editor after it has been loaded.
     *
     * @returns {undefined}
     */
    initializeMathfield() {
        if (!this.menu || !this.mathliveReady)
            return;
        let mathBlock = this.menu.querySelector('.swac_datafilterbar_mathliveblock');
        let formulaRows = this.menu.querySelector('.swac_datafilterbar_formularows');
        let addRow = this.menu.querySelector('.swac_datafilterbar_addrow');
        let fieldCont = this.menu.querySelector('.swac_datafilterbar_mathfieldcont');
        if (fieldCont && !fieldCont.querySelector('math-field')) {
            let mathfield = new this.MathfieldElement();
            mathfield.classList.add('swac_datafilterbar_mathfield', 'uk-form-small');
            mathfield.virtualKeyboardMode = 'manual';
            mathfield.style.width = '100%';
            mathfield.style.minHeight = '38px';
            fieldCont.appendChild(mathfield);
        }
        if (mathBlock)
            mathBlock.classList.remove('swac_dontdisplay');
        if (formulaRows)
            formulaRows.classList.add('swac_dontdisplay');
        if (addRow)
            addRow.classList.add('swac_dontdisplay');
        this.refreshMathfieldAttributes();
    }

    /**
     * Builds MathJSON variables for the selectable attributes.
     *
     * @returns {undefined}
     */
    refreshMathfieldAttributes() {
        if (!this.menu || !this.mathliveReady)
            return;
        let select = this.menu.querySelector('.swac_datafilterbar_mathattr');
        this.fillAttrSelect(select, this.allAttrs);
        let variableData = MathJsonFormula.createVariables(this.allAttrs);
        this.mathVariables = variableData.variables;
        let info = this.menu.querySelector('.swac_datafilterbar_mathvariables');
        if (info) {
            info.textContent = this.translate('formulahint', 'Insert attributes using the selection.');
            if (variableData.aliases.length > 0) {
                info.textContent += ' ' + variableData.aliases
                        .map((alias) => alias.symbol + ' = ' + alias.attr).join(', ');
            }
        }
    }

    /**
     * Inserts the selected attribute into the MathLive field.
     *
     * @returns {undefined}
     */
    insertMathAttribute() {
        if (!this.menu || !this.mathliveReady)
            return;
        let attr = this.menu.querySelector('.swac_datafilterbar_mathattr').value;
        let symbol = Object.entries(this.mathVariables)
                .find(([, value]) => value === attr)?.[0];
        let field = this.menu.querySelector('.swac_datafilterbar_mathfield');
        if (!symbol || !field || typeof field.insert !== 'function')
            return;
        field.insert('\\operatorname{' + symbol.replace(/_/g, '\\_') + '}');
        field.focus();
    }

    /**
     * Reads a safe formula and its MathJSON representation from MathLive.
     *
     * @returns {Object|null} Formula definition or null
     */
    getMathfieldFormula() {
        let field = this.menu?.querySelector('.swac_datafilterbar_mathfield');
        if (!field || typeof field.getValue !== 'function')
            return null;
        let mathJson = MathJsonFormula.fromLatex(
                field.getValue('latex-unstyled'), this.MathfieldElement.computeEngine)
                || MathJsonFormula.parse(field.getValue('math-json'));
        let formula = MathJsonFormula.toFormula(mathJson, this.mathVariables);
        if (!formula) {
            Msg.warn('Datafilterbar', this.translate('formulaerror', 'The formula contains unsupported values.'), this.requestor);
            return null;
        }
        return {
            formula: formula,
            mathJson: mathJson,
            mathVariables: Object.assign({}, this.mathVariables),
            latex: field.value
        };
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
        let mathfield = this.menu.querySelector('.swac_datafilterbar_mathfield');
        if (mathfield && this.mathliveReady)
            mathfield.value = '';
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
     * Updates the available time range display
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
        this.filterTarget = this.normalizeFilterTarget(
                this.menu.querySelector('.swac_datafilterbar_target').value);

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
     * @param {Boolean} useAggregation True when aggregation applies to the table
     * @returns {Boolean} True when aggregation or an alternative source is active
     */
    tableTransformActive(useAggregation = true) {
        return this.altSource !== null
                || (useAggregation && this.aggregation !== null);
    }

    /**
     * Builds the sets to display: filtered, extended by computed columns and
     * aggregated. Original sets are never changed, copies are used as soon as
     * a transformation is active.
     *
     * @param {Object} opts Build options
     * @returns {Array} Sets to display
     */
    buildDisplaySets(opts = {}) {
        let useFilters = opts.useFilters !== false;
        let useAggregation = opts.useAggregation !== false;
        let sets = [];
        for (let curSet of this.sourceSets()) {
            if (!useFilters || this.passesFilters(curSet))
                sets.push(curSet);
        }
        let needCopies = this.altSource !== null
                || (useAggregation && this.aggregation !== null)
                || this.computedColumns.length > 0;
        if (!needCopies) {
            this.sortByTime(sets);
            return sets;
        }
        sets = sets.map(s => this.copySet(s));
        // Computed columns before aggregation, so intervals average the results
        for (let curCol of this.computedColumns) {
            for (let curSet of sets) {
                curSet[curCol.name] = this.evaluateComputedColumn(curCol, curSet);
            }
        }
        if (useAggregation && this.aggregation)
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
     * Aggregates sets into time intervals. Sets are grouped into buckets
     * of the chosen length, every numeric attribute is averaged per bucket and
     * the time attribute is set to the bucket start.
     *
     * @param {Array} sets Copied sets to aggregate
     * @returns {Array} Aggregated sets, one per interval
     */
    aggregateSets(sets) {
        return DataAggregation.aggregateSets(sets, this.timeAttrName, this.aggregation);
    }

    /**
     * Evaluates a computed column formula for one set. Attribute names are
     * replaced by values, afterwards only numbers and basic math are allowed.
     *
     * @param {String} formula Formula like value_a + value_b
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
     * Gets the safe formula string for a computed column.
     *
     * @param {Object} column Computed column definition
     * @returns {String|null} Formula string or null
     */
    getComputedFormula(column) {
        if (column?.mathJson)
            return MathJsonFormula.toFormula(column.mathJson, column.mathVariables || {});
        return column?.formula || null;
    }

    /**
     * Evaluates one computed column for a dataset.
     *
     * @param {Object} column Computed column definition
     * @param {Object} set Dataset values
     * @returns {Number|null} Computed value or null
     */
    evaluateComputedColumn(column, set) {
        let formula = this.getComputedFormula(column);
        return formula ? this.evaluateFormula(formula, set) : null;
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
        for (let curTarget of this.findTargets()) {
            let useEffects = this.filterTargetApplies(curTarget);
            let displaySets = this.buildDisplaySets({
                useFilters: useEffects,
                useAggregation: useEffects
            });
            if (curTarget.dataManager) {
                let dm = curTarget.dataManager;
                if (typeof dm.setDisplayNames === 'function')
                    dm.setDisplayNames(this.renames);
                if (typeof dm.setDisplaySets === 'function') {
                    dm.setDisplaySets(displaySets, null);
                    if (this.seriesSettings && !this.datasourceToLoad
                            && typeof dm.setDisplaySettings === 'function') {
                        dm.setDisplaySettings(this.seriesSettings);
                        this.seriesSettings = null;
                    }
                } else {
                    Msg.warn('Datafilterbar', 'The DataManager plugin is outdated, please update it.', this.requestor);
                    dm.setFilterPredicate(function (set) {
                        return thisRef.passesFilters(set);
                    });
                }
                continue;
            }
            this.updateTableHeaders(curTarget.comp);
            this.updateRowVisibility(curTarget.comp, useEffects);
            this.updateSourceColumns(curTarget.comp);
            this.updateComputedColumns(curTarget.comp, displaySets);
            this.renderDisplayRows(curTarget.comp, displaySets, useEffects);
        }
    }

    /**
     * Shows and hides the table rows in the dom. With an active
     * transformation only the display rows stay visible, otherwise the rows
     * are toggled by the filters.
     *
     * @param {View} comp Target component
     * @param {Boolean} useEffects True when filters apply to the table
     * @returns {undefined}
     */
    updateRowVisibility(comp, useEffects = true) {
        let transformed = this.tableTransformActive(useEffects);
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
                show = set ? ((!useEffects || this.passesFilters(set))
                        && this.matchesColumnFilters(set)) : true;
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
     * @param {Boolean} useEffects True when aggregation applies to the table
     * @returns {undefined}
     */
    renderDisplayRows(comp, displaySets, useEffects = true) {
        let req = comp.requestor;
        for (let curRow of req.querySelectorAll('.swac_datafilterbar_displayrow')) {
            curRow.remove();
        }
        if (!this.tableTransformActive(useEffects))
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
            if (this.altSource)
                this.prepareSourceDisplayRow(tr, curSet);
            for (let curCell of tr.children) {
                // Computed cells carry the column name
                let colName = curCell.getAttribute('swac_datafilterbar_col');
                if (colName) {
                    let val = curSet[colName];
                    curCell.textContent = (val === null || val === undefined) ? 'NaN' : val;
                    continue;
                }
                // Attribute cells use their own name or the tooltip fallback
                let attr = curCell.getAttribute('swac_attrname')
                        || curCell.getAttribute('attrname');
                if (attr && !this.allAttrs.has(attr))
                    attr = null;
                let tipElem = curCell.querySelector('[uk-tooltip]');
                if (!attr && tipElem) {
                    let match = /title:\s*([^;]+)/.exec(tipElem.getAttribute('uk-tooltip'));
                    if (match && this.allAttrs.has(match[1].trim()))
                        attr = match[1].trim();
                }
                if (attr) {
                    let val = curSet[attr];
                    curCell.textContent = this.displaySourceValue(val);
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
                let td = this.findComputedCell(curRow, curName);
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
            let val = this.evaluateComputedColumn(col, set);
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
                for (let curCell of this.findComputedCells(req, name)) {
                    curCell.remove();
                }
            }
        }
        for (let curRow of req.querySelectorAll('.swac_repeatedForSet')) {
            for (let curCell of curRow.querySelectorAll('td[swac_datafilterbar_col]')) {
                let name = curCell.getAttribute('swac_datafilterbar_col');
                if (!this.computedColumns.find(c => c.name === name))
                    curCell.remove();
            }
            for (let curCol of this.computedColumns) {
                let found = false;
                for (let curCell of this.findComputedCellCandidates(curRow, curCol.name)) {
                    if (found) {
                        curCell.remove();
                        continue;
                    }
                    found = true;
                }
            }
        }

        // Ensure a header per column with rename icon, remove icon and a
        // search field like the other columns have
        let thisRef = this;
        for (let curCol of this.computedColumns) {
            if (!this.findComputedHead(req, curCol.name)) {
                let th = document.createElement('th');
                th.classList.add('swac_datafilterbar_colhead');
                th.setAttribute('swac_datafilterbar_col', curCol.name);
                th.setAttribute('swac_attrname', curCol.name);
                let label = document.createElement('span');
                label.classList.add('swac_datafilterbar_colname');
                label.setAttribute('swac_datafilterbar_attr', curCol.name);
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
            let head = this.findComputedHead(req, curCol.name);
            if (head) {
                head.setAttribute('swac_attrname', curCol.name);
                let label = head.querySelector('.swac_datafilterbar_colname');
                if (!label) {
                    label = head.querySelector('span');
                    if (label)
                        label.classList.add('swac_datafilterbar_colname');
                }
                if (label) {
                    label.setAttribute('swac_datafilterbar_attr', curCol.name);
                    label.textContent = this.renames[curCol.name] || curCol.name;
                }
                let filter = head.querySelector('.swac_datafilterbar_colfilter');
                if (filter)
                    filter.value = this.columnFilters[curCol.name] || '';
            }
        }
        if (this.computedColumns.length === 0)
            return;
        let headerPositions = this.computedHeaderPositions(headRow);

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
                let td = this.findComputedCell(curRow, curCol.name);
                if (!td) {
                    let valueCells = curRow.querySelectorAll('.swac_repeatedForValue');
                    let tplCell = valueCells.length > 0 ? valueCells[valueCells.length - 1] : null;
                    td = tplCell ? tplCell.cloneNode(true) : document.createElement('td');
                    curRow.appendChild(td);
                }
                this.prepareComputedCell(td, curCol.name, sfn, sid);
                this.placeComputedCell(curRow, td, headerPositions[curCol.name]);
                let val = null;
                if (set) {
                    val = (set[curCol.name] !== undefined && set[curCol.name] !== null)
                            ? set[curCol.name]
                            : this.evaluateComputedColumn(curCol, set);
                }
                // Not computable combinations (dates, booleans, texts) show NaN
                this.fillComputedCell(td, curCol.name, val);
            }
        }
    }

    /**
     * Finds the table header for one computed column.
     *
     * @param {HTMLElement} root Search root
     * @param {String} name Computed column name
     * @returns {HTMLElement|null} Header element or null
     */
    findComputedHead(root, name) {
        for (let curHead of root.querySelectorAll('.swac_datafilterbar_colhead')) {
            if (curHead.getAttribute('swac_datafilterbar_col') === name)
                return curHead;
        }
        return null;
    }

    /**
     * Finds the table cell for one computed column in a row.
     *
     * @param {HTMLElement} row Table row
     * @param {String} name Computed column name
     * @returns {HTMLElement|null} Cell element or null
     */
    findComputedCell(row, name) {
        let cells = this.findComputedCellCandidates(row, name);
        return cells.length > 0 ? cells[0] : null;
    }

    /**
     * Finds all candidate cells for one computed column in a row.
     *
     * @param {HTMLElement} row Table row
     * @param {String} name Computed column name
     * @returns {Array} Candidate cell elements
     */
    findComputedCellCandidates(row, name) {
        let cells = [];
        for (let curCell of row.querySelectorAll('td')) {
            if (curCell.getAttribute('swac_datafilterbar_col') === name
                    || curCell.getAttribute('swac_attrname') === name
                    || curCell.getAttribute('attrname') === name)
                cells.push(curCell);
        }
        return cells;
    }

    /**
     * Finds all table cells for one computed column.
     *
     * @param {HTMLElement} root Search root
     * @param {String} name Computed column name
     * @returns {Array} Cell elements
     */
    findComputedCells(root, name) {
        let cells = [];
        for (let curCell of root.querySelectorAll('td[swac_datafilterbar_col]')) {
            if (curCell.getAttribute('swac_datafilterbar_col') === name)
                cells.push(curCell);
        }
        return cells;
    }

    /**
     * Updates table headers for an alternative datasource.
     *
     * @param {View} comp Target component
     * @returns {undefined}
     */
    updateSourceColumns(comp) {
        let req = comp.requestor;
        if (!this.altSource) {
            for (let curHead of req.querySelectorAll('.swac_datafilterbar_sourcehead')) {
                curHead.remove();
            }
            for (let curHead of req.querySelectorAll('.swac_repeatedForAttribute')) {
                curHead.classList.remove('swac_dontdisplay');
            }
            return;
        }

        let firstTh = req.querySelector('th');
        if (!firstTh)
            return;
        let headRow = firstTh.parentNode;
        let attrs = this.sourceDisplayAttrs();
        for (let curHead of req.querySelectorAll('.swac_repeatedForAttribute')) {
            if (!curHead.classList.contains('swac_datafilterbar_sourcehead'))
                curHead.classList.add('swac_dontdisplay');
        }
        for (let curHead of req.querySelectorAll('.swac_datafilterbar_sourcehead')) {
            let attr = curHead.getAttribute('swac_attrname');
            if (!attrs.includes(attr))
                curHead.remove();
        }
        let before = headRow.querySelector('.swac_datafilterbar_colhead');
        for (let curAttr of attrs) {
            if (headRow.querySelector('.swac_datafilterbar_sourcehead[swac_attrname="' + curAttr + '"]'))
                continue;
            let th = document.createElement('th');
            th.classList.add('swac_repeatedForAttribute', 'swac_datafilterbar_sourcehead');
            th.setAttribute('swac_attrname', curAttr);
            th.textContent = this.renames[curAttr] || curAttr;
            if (before)
                headRow.insertBefore(th, before);
            else
                headRow.appendChild(th);
        }
    }

    /**
     * Gets attributes to show for the alternative datasource.
     *
     * @returns {Array} Attribute names
     */
    sourceDisplayAttrs() {
        let attrs = [];
        for (let curAttr of this.allAttrs) {
            if (curAttr.startsWith('swac_'))
                continue;
            attrs.push(curAttr);
        }
        return attrs;
    }

    /**
     * Prepares a display row for an alternative datasource.
     *
     * @param {HTMLElement} row Display row
     * @param {Object} set Dataset
     * @returns {undefined}
     */
    prepareSourceDisplayRow(row, set) {
        for (let curCell of Array.from(row.children)) {
            if (curCell.classList.contains('swac_repeatedForValue')
                    && !curCell.getAttribute('swac_datafilterbar_col')) {
                curCell.remove();
            }
        }
        let before = row.querySelector('td[swac_datafilterbar_col]');
        for (let curAttr of this.sourceDisplayAttrs()) {
            let td = document.createElement('td');
            td.classList.add('swac_repeatedForValue', 'swac_datafilterbar_sourcecell');
            td.setAttribute('swac_attrname', curAttr);
            td.setAttribute('attrname', curAttr);
            td.textContent = this.displaySourceValue(set[curAttr]);
            if (before)
                row.insertBefore(td, before);
            else
                row.appendChild(td);
        }
    }

    /**
     * Formats a source value for table output.
     *
     * @param {*} value Source value
     * @returns {*} Value or null text
     */
    displaySourceValue(value) {
        return (value === null || value === undefined) ? 'null' : value;
    }

    /**
     * Gets visible table cells of a row, ignoring SWAC template cells.
     *
     * @param {HTMLElement} row Table row
     * @returns {Array} Visible table cells
     */
    visibleTableCells(row) {
        let cells = [];
        for (let curCell of row.children) {
            if (curCell.nodeName !== 'TD' && curCell.nodeName !== 'TH')
                continue;
            if (curCell.classList.contains('swac_repeatForValue')
                    || curCell.classList.contains('swac_repeatForAttribute'))
                continue;
            if (curCell.classList.contains('swac_dontdisplay'))
                continue;
            if (curCell.style && curCell.style.display === 'none')
                continue;
            cells.push(curCell);
        }
        return cells;
    }

    /**
     * Gets visible header positions for computed columns.
     *
     * @param {HTMLElement} headRow Header row
     * @returns {Object} Column name to visible position
     */
    computedHeaderPositions(headRow) {
        let positions = {};
        let headers = this.visibleTableCells(headRow);
        for (let curCol of this.computedColumns) {
            let head = this.findComputedHead(headRow, curCol.name);
            positions[curCol.name] = headers.indexOf(head);
        }
        return positions;
    }

    /**
     * Places a computed cell at the same visible position as its header.
     *
     * @param {HTMLElement} row Table row
     * @param {HTMLElement} cell Computed cell
     * @param {Number} visibleIndex Visible header index
     * @returns {undefined}
     */
    placeComputedCell(row, cell, visibleIndex) {
        if (visibleIndex < 0)
            return;
        let cells = this.visibleTableCells(row).filter(curCell => curCell !== cell);
        let before = cells[visibleIndex] || null;
        if (before)
            row.insertBefore(cell, before);
        else
            row.appendChild(cell);
    }

    /**
     * Prepares a cell for a computed column.
     *
     * @param {HTMLElement} cell Table cell
     * @param {String} attr Attribute name
     * @param {String} sourceName Source name
     * @param {String} setId Set id
     * @returns {undefined}
     */
    prepareComputedCell(cell, attr, sourceName, setId) {
        cell.classList.remove('swac_repeatForValue');
        cell.classList.add('swac_repeatedForValue');
        cell.setAttribute('swac_fromname', sourceName);
        cell.setAttribute('swac_setid', setId);
        cell.setAttribute('swac_datafilterbar_col', attr);
        cell.setAttribute('swac_attrname', attr);
        cell.setAttribute('attrname', attr);
    }

    /**
     * Fills a computed table cell while keeping its layout structure.
     *
     * @param {HTMLElement} cell Table cell
     * @param {String} attr Attribute name
     * @param {*} val Computed value
     * @returns {undefined}
     */
    fillComputedCell(cell, attr, val) {
        let text = (val === null || val === undefined) ? 'NaN' : val;
        let tooltip = cell.querySelector('[uk-tooltip]');
        if (tooltip) {
            tooltip.setAttribute('uk-tooltip', 'title: ' + attr);
            tooltip.textContent = text;
            return;
        }
        cell.textContent = text;
    }

    /**
     * Adds a rename icon behind every column title of a table target.
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
     * Gets the current chart series settings.
     *
     * @returns {Object|null} Series settings or null
     */
    getSeriesSettings() {
        if (this.seriesSettings)
            return this.seriesSettings;
        for (let curTarget of this.findTargets()) {
            if (curTarget.dataManager && typeof curTarget.dataManager.getDisplaySettings === 'function')
                return curTarget.dataManager.getDisplaySettings();
        }
        return null;
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
     * Normalizes the filter target selection.
     *
     * @param {String} target Target value
     * @returns {String} Normalized target value
     */
    normalizeFilterTarget(target) {
        let value = String(target || 'both').toLowerCase();
        return ['both', 'chart', 'table'].includes(value) ? value : 'both';
    }

    /**
     * Checks if filters and aggregation apply to a target.
     *
     * @param {Object} target Target descriptor
     * @returns {Boolean} True when the target should get filter effects
     */
    filterTargetApplies(target) {
        let targetType = target.dataManager ? 'chart' : 'table';
        return this.filterTarget === 'both' || this.filterTarget === targetType;
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
        if (this.mathliveReady) {
            let mathFormula = this.getMathfieldFormula();
            if (!mathFormula)
                return;
            this.computedColumns = this.computedColumns.filter(c => c.name !== name);
            this.computedColumns.push(Object.assign({name: name}, mathFormula));
            this.saveSettings();
            this.refreshComputedList();
            this.resetFormulaRows();
            this.applyAll();
            return;
        }
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
            label.textContent = curCol.name + ' = ' + (curCol.latex || curCol.formula) + ' ';
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
     * Builds a short status text for a loaded datasource.
     *
     * @param {String} url Datasource url
     * @param {Number} count Number of loaded sets
     * @param {Object|null} adapter Adapter result
     * @returns {String} Status text
     */
    buildSourceStateText(url, count, adapter) {
        let text = url + ' (' + count + ')';
        if (adapter && adapter.rowPath)
            text += ' adapted from ' + adapter.rowPath;
        if (adapter && adapter.timeAttr)
            text += ', time: ' + adapter.timeAttr;
        if (adapter && adapter.adaptation)
            text += ', Adaption: ' + (adapter.adaptation === 'ai' ? 'KI' : 'regelbasiert');
        if (adapter && adapter.numericAttrs && adapter.numericAttrs.length > 0)
            text += ', numeric: ' + adapter.numericAttrs.length;
        if (adapter && adapter.warnings && adapter.warnings.length > 0)
            text += ', ' + adapter.warnings.join(', ');
        return text;
    }

    /**
     * Normalizes an external datasource link.
     *
     * @param {String} link External datasource link
     * @returns {String|null} Normalized link or null
     */
    normalizeSourceLink(link) {
        return ExternalDataSource.normalizeLink(link);
    }

    /**
     * Loads json from an external link without SWAC backend request headers.
     *
     * @param {String} url Json source url
     * @returns {Promise} Promise with parsed json
     */
    loadExternalJson(url) {
        return ExternalDataSource.loadJson(url);
    }

    /**
     * Applies loaded sets as alternative datasource.
     *
     * @param {String} sourceName Source name
     * @param {Array} sets Loaded sets
     * @param {Object|null} adapter Adapter result
     * @param {Boolean} saveable True if the source can be loaded again
     * @returns {Boolean} True if the source was applied
     */
    applyAlternativeSource(sourceName, sets, adapter, saveable) {
        if ((adapter && !adapter.usable) || sets.length === 0) {
            this.altSource = null;
            this.datasourceToLoad = null;
            let reason = adapter && adapter.reason
                    ? adapter.reason : 'JSON not suitable.';
            this.menu.querySelector('.swac_datafilterbar_sourcestate').textContent
                    = 'Error: ' + reason;
            Msg.warn('Datafilterbar', reason, this.requestor);
            return false;
        }
        for (let curSet of sets) {
            if (!curSet.swac_fromName)
                curSet.swac_fromName = sourceName;
        }
        this.altSource = {
            url: sourceName,
            sets: sets,
            adapter: adapter,
            local: !saveable
        };
        this.menu.querySelector('.swac_datafilterbar_sourcestate').textContent
                = this.buildSourceStateText(sourceName, sets.length, adapter);
        this.redetectAttributes();
        this.chooseTimeAttr();
        this.updateTimeBlockVisibility();
        this.refreshAttrOptions();
        this.updateAvailableRange();
        this.datasourceToLoad = null;
        if (saveable)
            this.saveSettings();
        this.updateRequestorDisplay();
        this.applyAll();
        return true;
    }

    /**
     * Adapts a source with the selected deterministic or AI method.
     *
     * @param {Object} json Source JSON
     * @param {String} sourceName Source identifier
     * @returns {Promise<Object>} Adaptation result
     */
    adaptExternalSource(json, sourceName) {
        return ExternalDataSource.adapt(json, sourceName, this.adaptationMode);
    }

    /**
     * Normalizes the selected datasource adaptation mode.
     *
     * @param {String} mode Selected mode
     * @returns {String} Supported mode
     */
    normalizeAdaptationMode(mode) {
        return AIDataSourceAdapter.normalizeMode(mode);
    }

    /**
     * Loads an alternative datasource that replaces the shown data
     *
     * @returns {undefined}
     */
    onClickLoadSource() {
        let thisRef = this;
        let input = this.menu.querySelector('.swac_datafilterbar_sourceurl');
        let url = this.normalizeSourceLink(input.value);
        if (!input.value.trim())
            return;
        if (!url) {
            this.menu.querySelector('.swac_datafilterbar_sourcestate').textContent
                    = 'Please enter an http or https link.';
            Msg.warn('Datafilterbar', 'Datasource must be an http or https link.', this.requestor);
            return;
        }
        input.value = url;
        this.menu.querySelector('.swac_datafilterbar_sourcestate').textContent
                = 'Loading: ' + url;
        this.loadExternalJson(url).then(function (json) {
            return thisRef.adaptExternalSource(json, url);
        }).then(function (adapter) {
            thisRef.applyAlternativeSource(url, adapter.sets || [], adapter, true);
        }).catch(function (err) {
            thisRef.datasourceToLoad = null;
            let message = err && err.message ? err.message : err;
            Msg.error('Datafilterbar', 'Could not load datasource >' + url + '<: ' + message, thisRef.requestor);
            thisRef.menu.querySelector('.swac_datafilterbar_sourcestate').textContent
                    = 'Error: ' + message;
        });
    }

    /**
     * Loads an alternative datasource from a local json file.
     *
     * @param {Event} evt Change event
     * @returns {undefined}
     */
    onChangeSourceFile(evt) {
        let thisRef = this;
        let file = evt.target.files && evt.target.files.length > 0
                ? evt.target.files[0] : null;
        if (!file)
            return;
        let sourceName = 'localfile:' + file.name;
        this.menu.querySelector('.swac_datafilterbar_sourcestate').textContent
                = this.adaptationMode === 'ai'
                ? 'Adapting with AI: ' + file.name : 'Adapting: ' + file.name;
        ExternalDataSource.readJsonFile(file).then(function (json) {
            return thisRef.adaptExternalSource(json, sourceName);
        }).then(function (adapter) {
            thisRef.applyAlternativeSource(sourceName, adapter.sets || [], adapter, false);
        }).catch(function (err) {
            let message = err && err.message ? err.message : err;
            Msg.error('Datafilterbar', 'Could not adapt selected file: ' + message, thisRef.requestor);
            thisRef.menu.querySelector('.swac_datafilterbar_sourcestate').textContent
                    = 'Error: ' + message;
        });
    }

    /**
     * Removes the alternative datasource and shows the original data again
     *
     * @returns {undefined}
     */
    onClickRemoveSource() {
        this.altSource = null;
        this.datasourceToLoad = null;
        this.menu.querySelector('.swac_datafilterbar_sourcestate').textContent = '';
        this.menu.querySelector('.swac_datafilterbar_sourceurl').value = '';
        this.menu.querySelector('.swac_datafilterbar_sourcefile').value = '';
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
     * Downloads the current settings as a JSON file.
     *
     * @returns {undefined}
     */
    onClickSettingsDownload() {
        let text = this.getSettingsText();
        TableExport.download(new Blob([text], {type: 'application/json;charset=utf-8'}), this.getSettingsFilename());
    }

    /**
     * Copies the current settings to the clipboard.
     *
     * @returns {Promise<void>}
     */
    async onClickSettingsCopy() {
        let text = this.getSettingsText();
        if (await TextTransfer.copy(text)) {
            this.showSettingsCopyFeedback();
            Msg.info('Datafilterbar', this.translate('settingscopied', 'Settings copied.'), this.requestor);
            return;
        }
        Msg.warn('Datafilterbar', this.translate('settingscopyfailed', 'Settings could not be copied.'), this.requestor);
    }

    /**
     * Shows a successful copy operation on the settings button.
     *
     * @returns {undefined}
     */
    showSettingsCopyFeedback() {
        let button = this.menu.querySelector('.swac_datafilterbar_settingscopy');
        if (!button)
            return;
        button.textContent = this.translate('settingscopydone', 'Copied');
        button.classList.add('uk-button-primary');
        window.setTimeout(() => {
            button.textContent = this.translate('settingscopy', 'Copy JSON');
            button.classList.remove('uk-button-primary');
        }, 2000);
    }

    /**
     * Gets the current settings as formatted JSON.
     *
     * @returns {String} Settings JSON
     */
    getSettingsText() {
        return JSON.stringify(this.settingsToObject(), null, 2);
    }

    /**
     * Gets a safe filename for a settings download.
     *
     * @returns {String} Download filename
     */
    getSettingsFilename() {
        let source = this.altSource?.name || this.altSource?.url
                || this.getHost().options.fromName || 'data';
        return 'settings_' + String(source).replace(/[^a-z0-9_-]+/gi, '_') + '.json';
    }

    /**
     * Exports the visible table with the current display values.
     *
     * @returns {undefined}
     */
    onClickTableExport() {
        let table = this.getTableExportTarget();
        if (!TableExport.exportTable(table, this.getTableExportFilename(), this.getTableExportFormat()))
            Msg.warn('Datafilterbar', this.translate('tableexportempty', 'No table data is available for export.'), this.requestor);
    }

    /**
     * Gets the selected table export format.
     *
     * @returns {String} Export format
     */
    getTableExportFormat() {
        return this.menu.querySelector('.swac_datafilterbar_tableexportformat')?.value || 'csv';
    }

    /**
     * Gets the table target that shares the current datasource.
     *
     * @returns {HTMLTableElement|null} Table to export
     */
    getTableExportTarget() {
        for (let target of this.findTargets()) {
            if (target.dataManager)
                continue;
            let table = target.comp.requestor.querySelector('table');
            if (table)
                return table;
        }
        return null;
    }

    /**
     * Gets a filename based on the current datasource.
     *
     * @returns {String} Download filename
     */
    getTableExportFilename() {
        let source = this.altSource?.name || this.altSource?.url
                || this.getHost().options.fromName || 'data';
        return 'table_' + source;
    }

    /**
     * Opens the selection for a settings JSON file.
     *
     * @returns {undefined}
     */
    onClickImport() {
        this.menu.querySelector('.swac_datafilterbar_settingsfile').click();
    }

    /**
     * Reads and applies a selected settings JSON file.
     *
     * @param {Event} evt File selection event
     * @returns {Promise<void>}
     */
    async onSelectSettingsFile(evt) {
        let file = evt.target.files[0];
        evt.target.value = '';
        if (!file)
            return;
        try {
            this.applySettingsText(await file.text());
        } catch (error) {
            Msg.error('Datafilterbar', this.translate('settingsreaderror', 'Settings file could not be read.'), this.requestor);
        }
    }

    /**
     * Applies settings from a JSON string.
     *
     * @param {String} raw Settings JSON
     * @returns {undefined}
     */
    applySettingsText(raw) {
        let obj;
        try {
            obj = JSON.parse(raw);
        } catch (e) {
            Msg.error('Datafilterbar', this.translate('settingsinvalid', 'Settings file is no valid JSON.'), this.requestor);
            return;
        }
        this.settingsFromObject(obj);
        this.saveSettings();
        this.fillInputsFromState();
        this.refreshComputedList();
        this.updateRequestorDisplay();
        if (this.datasourceToLoad) {
            this.onClickLoadSource();
            return;
        }
        this.applyAll();
    }

    /**
     * Collects all settings into one plain object
     *
     * @returns {Object} Settings object
     */
    settingsToObject() {
        let settings = {
            filterTarget: this.filterTarget,
            renames: this.renames,
            computedColumns: this.computedColumns,
            columnFilters: this.columnFilters,
        };
        if (this.fromFilter)
            settings.timeFrom = this.fromFilter.toISOString();
        if (this.toFilter)
            settings.timeTo = this.toFilter.toISOString();
        if (this.valueFilter)
            settings.valueFilter = this.valueFilter;
        if (this.aggregation)
            settings.aggregation = this.aggregation;
        let series = this.getSeriesSettings();
        if (series)
            settings.series = series;
        if (this.adaptationMode !== 'auto')
            settings.adaptationMode = this.adaptationMode;
        let datasource = this.altSource && !this.altSource.local
                ? this.altSource.url : this.datasourceToLoad;
        if (datasource)
            settings.datasource = datasource;
        return settings;
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
        this.filterTarget = this.normalizeFilterTarget(obj.filterTarget);
        this.renames = obj.renames || {};
        this.computedColumns = obj.computedColumns || [];
        this.columnFilters = obj.columnFilters || {};
        this.seriesSettings = obj.series || null;
        this.adaptationMode = this.normalizeAdaptationMode(obj.adaptationMode);
        if (obj.datasource) {
            this.altSource = null;
            this.datasourceToLoad = obj.datasource;
            this.menu.querySelector('.swac_datafilterbar_sourceurl').value = obj.datasource;
        } else {
            this.altSource = null;
            this.datasourceToLoad = null;
            this.menu.querySelector('.swac_datafilterbar_sourceurl').value = '';
            this.menu.querySelector('.swac_datafilterbar_sourcestate').textContent = '';
        }
    }

    /**
     * Fills the menu inputs from the current state
     *
     * @returns {undefined}
     */
    fillInputsFromState() {
        this.menu.querySelector('.swac_datafilterbar_target').value = this.filterTarget;
        this.menu.querySelector('.swac_datafilterbar_adaptationmode').value = this.adaptationMode;
        this.menu.querySelector('.swac_datafilterbar_from').value
                = this.fromFilter ? this.toInputValue(this.fromFilter) : '';
        this.menu.querySelector('.swac_datafilterbar_to').value
                = this.toFilter ? this.toInputValue(this.toFilter) : '';
        if (this.valueFilter) {
            this.menu.querySelector('.swac_datafilterbar_attr').value = this.valueFilter.attr;
            this.menu.querySelector('.swac_datafilterbar_op').value = this.valueFilter.op;
            this.menu.querySelector('.swac_datafilterbar_val').value = this.valueFilter.val;
        } else {
            this.menu.querySelector('.swac_datafilterbar_attr').value = '';
            this.menu.querySelector('.swac_datafilterbar_op').value = 'gt';
            this.menu.querySelector('.swac_datafilterbar_val').value = '';
        }
        if (this.aggregation) {
            this.menu.querySelector('.swac_datafilterbar_aggamount').value = this.aggregation.amount;
            this.menu.querySelector('.swac_datafilterbar_aggunit').value = this.aggregation.unit;
        } else {
            this.menu.querySelector('.swac_datafilterbar_aggamount').value = '';
            this.menu.querySelector('.swac_datafilterbar_aggunit').value = 'minutes';
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
        let link = this.getRequestorLink(requestor);
        let linkElement = this.menu.querySelector('.swac_datafilterbar_requestorurl');
        this.menu.querySelector('.swac_datafilterbar_requestorurllabel').hidden = !link;
        linkElement.hidden = !link;
        linkElement.href = link || '';
        linkElement.textContent = link || '';
        this.menu.querySelector('.swac_datafilterbar_requestor').textContent
                = JSON.stringify(requestor, null, 2);
    }

    /**
     * Builds the request URL for the current dataRequestor.
     *
     * @param {Object} requestor Data request definition
     * @returns {String|null} Request URL or null
     */
    getRequestorLink(requestor) {
        if (!requestor.fromName || requestor.fromName.startsWith('localfile:'))
            return null;
        let resource = Remote.determineMatchingResource(requestor.fromName, 'get');
        if (!resource)
            return null;
        let link = resource.url;
        for (let curWhere in requestor.fromWheres) {
            link += link.includes('?') ? '&' : '?';
            link += curWhere + '=' + requestor.fromWheres[curWhere];
        }
        return link;
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
     * so they apply to all compatible displays.
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
        if (obj.datasource)
            this.seriesSettings = null;
        this.fillInputsFromState();
        this.datasourceToLoad = null;
        this.menu.querySelector('.swac_datafilterbar_sourceurl').value = '';
        this.menu.querySelector('.swac_datafilterbar_sourcestate').textContent = '';
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
