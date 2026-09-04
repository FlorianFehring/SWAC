import SWAC from '../../../../swac.js';
import Msg from '../../../../Msg.js';
import Plugin from '../../../../Plugin.js';

/**
 * Manages chart series, colors and axis settings.
 */
export default class DataManagerSPL extends Plugin {

    constructor(opts = {}) {
        super(opts);
        this.name = 'Charts/plugins/DataManager';
        this.desc.text = 'Settings bar to choose the displayed data series and their colors.';
        this.desc.developers = 'Maczap (HSBI)';
        this.desc.license = 'GNU Lesser General Public License';

        this.desc.opts[0] = {
            name: 'defaultAttrs',
            desc: 'Attributes shown at start. If not set the most common numeric attribute is used.',
            example: ['value']
        };
        if (!opts.defaultAttrs)
            this.options.defaultAttrs = null;

        this.desc.opts[1] = {
            name: 'excludeAttrs',
            desc: 'Attributes that are never offered for display.',
            example: ['id', 'synced']
        };
        if (!opts.excludeAttrs)
            this.options.excludeAttrs = ['id'];

        this.desc.opts[2] = {
            name: 'attributeFilter',
            desc: 'Optional function that decides whether an attribute is offered as a data series.',
            example: function (attr, set) {
                return attr !== 'internal_value';
            }
        };
        if (!opts.attributeFilter)
            this.options.attributeFilter = null;

        this.desc.opts[3] = {
            name: 'chartPlugin',
            desc: 'Name of the chart drawing plugin that is controlled.',
            example: 'Linechart'
        };
        if (!opts.chartPlugin)
            this.options.chartPlugin = 'Linechart';

        this.desc.opts[4] = {
            name: 'showAxisSelectors',
            desc: 'Shows optional controls for choosing the x and y axis attributes.',
            example: true
        };
        if (typeof opts.showAxisSelectors === 'undefined')
            this.options.showAxisSelectors = false;

        this.desc.opts[5] = {
            name: 'displayNames',
            desc: 'Display names for attributes used in controls, legends and axis titles.',
            example: {pm2_5: 'PM2,5'}
        };
        if (!opts.displayNames)
            this.options.displayNames = {};

        this.desc.opts[6] = {
            name: 'showSourceNames',
            desc: 'Shows the datasource name before the attribute in chart legends.',
            example: false
        };
        if (typeof opts.showSourceNames === 'undefined')
            this.options.showSourceNames = true;

        // Internal state
        this.knownAttrs = new Set();    // all numeric attributes found in data
        this.attrCounts = new Map();    // number of datasets containing each numeric attribute
        this.axisAttrs = new Set();     // scalar attributes available for the x axis
        this.activeAttrs = [];          // attributes currently shown
        this.attrColors = {};           // chosen color per attribute
        this.allSets = [];              // all sets received, used for redraw
        this.initialised = false;       // bar built and defaults set
        this.bar = null;                // the settings bar dom element
        this.filterPredicate = null;    // optional external filter for drawn sets
        this.displaySets = null;        // optional external sets to draw instead of allSets
        this.displayNames = Object.assign({}, this.options.displayNames); // attribute name -> display name
        this.mutedHooks = null;         // stored drawing plugin hooks while muted
        this.rebuildTimeout = null;     // combines consecutive dataset updates
    }

    init() {
        this.loadConfiguredDefaults();
        return new Promise((resolve, reject) => {
            // No template and no contElement needed, the bar is built directly
            // into the chart requestor in buildBar()
            resolve();
        });
    }

    /**
     * Loads page defaults after the plugin requestor is available.
     *
     * @returns {undefined}
     */
    loadConfiguredDefaults() {
        let config = window[this.requestor.id + '_options'] || {};
        let host = this.requestor.parent && this.requestor.parent.swac_comp;
        if (host && host.options.plugins) {
            let pluginConfig = host.options.plugins.get(this.requestor.pluginname);
            if (pluginConfig)
                config = Object.assign({}, config, pluginConfig);
        }
        let optionNames = [
            'defaultAttrs', 'excludeAttrs', 'attributeFilter', 'chartPlugin',
            'showAxisSelectors', 'displayNames', 'showSourceNames'
        ];
        for (let optionName of optionNames) {
            if (typeof config[optionName] !== 'undefined')
                this.options[optionName] = config[optionName];
        }
        this.displayNames = Object.assign({}, this.options.displayNames || {});
    }

    /**
     * Called by SWAC for every dataset. Collects the sets, detects the available
     * attributes and triggers a single redraw after the last set of a request.
     *
     * @param {WatchableSet} set Dataset
     * @param {Array} repeateds Repeated dom elements (unused here)
     * @returns {undefined}
     */
    afterAddSet(set, repeateds) {
        // Ignore transformed sets from the Datafilterbar plugin
        if (set.swac_datafilterbar_artificial)
            return;
        // Collect the set for later redraw
        this.allSets.push(set);

        // Detect numeric attributes
        for (let curAttr in set) {
            if (curAttr.startsWith('swac_'))
                continue;
            if (this.isExcludedAttr(curAttr, set))
                continue;
            if (this.isAxisValue(set[curAttr]))
                this.axisAttrs.add(curAttr);
            if (!this.isNumericValue(set[curAttr]))
                continue;
            this.knownAttrs.add(curAttr);
            this.attrCounts.set(curAttr, (this.attrCounts.get(curAttr) || 0) + 1);
        }

        // Build the bar once after the first set arrived
        if (!this.initialised) {
            this.initialised = true;
            this.buildBar();
            if (this.options.defaultAttrs || !set.swac_dataRequest)
                this.setDefaultAttrs(set);
        }

        this.scheduleRebuild(set);
    }

    /**
     * Combines consecutive dataset updates into one chart rebuild.
     *
     * @param {WatchableSet} set Last received dataset
     * @returns {undefined}
     */
    scheduleRebuild(set) {
        window.clearTimeout(this.rebuildTimeout);
        this.rebuildTimeout = window.setTimeout(() => {
            if (this.activeAttrs.length === 0)
                this.setDefaultAttrs(set);
            this.refreshAttrDropdown();
            this.refreshTags();
            this.rebuildChart();
        }, 0);
    }

    /**
     * Called by SWAC when a dataset was removed.
     *
     * @param {WatchableSet} set Dataset that was removed
     * @returns {undefined}
     */
    afterRemoveSet(set) {
        this.allSets = this.allSets.filter(curSet => curSet.id !== set.id);
        this.rebuildChart();
    }

    /**
     * Determines the attributes shown at start and stores their colors.
     *
     * @param {WatchableSet} set Representative dataset
     * @returns {undefined}
     */
    setDefaultAttrs(set) {
        let startAttrs = this.options.defaultAttrs;
        if (!startAttrs) {
            let first = this.mostCommonNumericAttr() || this.firstNumericAttr(set);
            startAttrs = first ? [first] : [];
        }
        for (let curAttr of startAttrs) {
            if (!this.activeAttrs.includes(curAttr)) {
                this.activeAttrs.push(curAttr);
                this.attrColors[curAttr] = this.generateColor(this.activeAttrs.length - 1);
            }
        }
    }

    /**
     * Builds the chart settings bar.
     *
     * @returns {undefined}
     */
    buildBar() {
        let comp = this.requestor.parent.swac_comp;
        let chartReq = comp.requestor;

        // Insert only once
        if (chartReq.querySelector('.swac_datamanager_bar'))
            return;

        let barWrapper = document.createElement('div');
        barWrapper.innerHTML = this.getBarHtml();
        let bar = barWrapper.firstElementChild;
        // Place the bar above the chart navigation
        chartReq.insertBefore(bar, chartReq.firstChild);
        this.bar = bar;

        if (this.options.showAxisSelectors) {
            let xSelect = bar.querySelector('.swac_datamanager_xaxis');
            let ySelect = bar.querySelector('.swac_datamanager_yaxis');
            let applyButton = bar.querySelector('.swac_datamanager_axisapply');
            applyButton.addEventListener('click', () => {
                this.applyAxisSelection(xSelect.value, ySelect.value);
            });
        }

        // Build the language prefix the same way SWAC does: the component name
        // with /plugins/ removed and / replaced by _ (e.g. Charts_DataManager).
        // The bar html uses the short id 'DataManager.key', here it is expanded
        // to the full key so the translation is found.
        let langPrefix = this.name.replace('/plugins/', '/').replace('/', '_');
        let langElems = bar.querySelectorAll('[swac_lang]');
        for (let curElem of langElems) {
            let key = curElem.getAttribute('swac_lang');
            if (key.startsWith('DataManager.'))
                curElem.setAttribute('swac_lang', langPrefix + '.' + key.substring('DataManager.'.length));
        }

        // Translate the inserted bar
        SWAC.lang.translateAll(bar);
    }

    /**
     * Returns the html for the settings bar.
     *
     * @returns {String} The bar markup
     */
    getBarHtml() {
        let axisControls = '';
        if (this.options.showAxisSelectors) {
            axisControls = '<div class="uk-width-1-1">'
                    + '<div class="uk-grid-small uk-child-width-1-2@s" uk-grid>'
                    + '<label><span class="uk-text-small" swac_lang="DataManager.xaxis">X axis</span>'
                    + '<select class="swac_datamanager_xaxis uk-select uk-form-small"></select></label>'
                    + '<label><span class="uk-text-small" swac_lang="DataManager.yaxis">Y axis</span>'
                    + '<select class="swac_datamanager_yaxis uk-select uk-form-small"></select></label>'
                    + '</div>'
                    + '<div class="uk-margin-small-top">'
                    + '<button class="swac_datamanager_axisapply uk-button uk-button-primary uk-button-small" type="button" swac_lang="DataManager.apply">Apply</button>'
                    + '</div>'
                    + '</div>';
        }
        return '<div class="swac_datamanager_bar uk-card uk-card-default uk-card-small uk-card-body uk-margin-small-bottom">'
                + '<div uk-grid class="uk-grid-small uk-flex-middle">'
                + '<div class="uk-width-auto">'
                + '<span class="uk-text-bold uk-text-small" swac_lang="DataManager.series">Data series:</span>'
                + '</div>'
                + '<div class="uk-width-expand">'
                + '<div class="swac_datamanager_activetags uk-flex uk-flex-wrap"></div>'
                + '</div>'
                + '<div class="uk-width-auto">'
                + '<div class="uk-inline">'
                + '<button class="uk-button uk-button-default uk-button-small" type="button">'
                + '<span uk-icon="icon: plus; ratio: 0.8"></span> '
                + '<span swac_lang="DataManager.add">Add</span>'
                + '</button>'
                + '<div uk-dropdown="mode: click; pos: bottom-left">'
                + '<ul class="swac_datamanager_attrlist uk-nav uk-dropdown-nav"></ul>'
                + '</div>'
                + '</div>'
                + '</div>'
                + axisControls
                + '</div>'
                + '</div>';
    }

    /**
     * Fills the add dropdown with all known attributes that are not active yet.
     *
     * @returns {undefined}
     */
    refreshAttrDropdown() {
        let thisRef = this;
        if (!this.bar)
            return;

        let list = this.bar.querySelector('.swac_datamanager_attrlist');
        list.innerHTML = '';

        for (let curAttr of this.knownAttrs) {
            // Offer only attributes that are not displayed yet
            if (this.activeAttrs.includes(curAttr))
                continue;
            let li = document.createElement('li');
            let a = document.createElement('a');
            a.href = '#';
            a.textContent = this.displayName(curAttr);
            a.addEventListener('click', function (evt) {
                evt.preventDefault();
                thisRef.activateAttr(curAttr);
            });
            li.appendChild(a);
            list.appendChild(li);
        }

        // Show a hint when every attribute is already active
        if (list.children.length === 0) {
            let li = document.createElement('li');
            li.classList.add('uk-nav-header');
            let langPrefix = this.name.replace('/plugins/', '/').replace('/', '_');
            li.setAttribute('swac_lang', langPrefix + '.allactive');
            li.textContent = 'All series shown';
            list.appendChild(li);
            SWAC.lang.translateAll(list);
        }
        this.refreshAxisSelectors();
    }

    /**
     * Updates the optional axis controls from the detected attributes.
     *
     * @returns {undefined}
     */
    refreshAxisSelectors() {
        if (!this.options.showAxisSelectors || !this.bar)
            return;
        let comp = this.requestor.parent.swac_comp;
        if (!this.axisAttrs.has(comp.options.xAxisAttrName) && this.axisAttrs.size > 0)
            comp.options.xAxisAttrName = this.axisAttrs.values().next().value;
        let xSelect = this.bar.querySelector('.swac_datamanager_xaxis');
        let ySelect = this.bar.querySelector('.swac_datamanager_yaxis');
        this.fillAxisSelect(xSelect, this.axisAttrs, comp.options.xAxisAttrName);
        this.fillAxisSelect(ySelect, this.knownAttrs, this.activeAttrs[0]);
    }

    /**
     * Fills one axis selector and keeps its current value.
     *
     * @param {HTMLElement} select Axis selector
     * @param {Set} attributes Available attributes
     * @param {String} selected Selected attribute
     * @returns {undefined}
     */
    fillAxisSelect(select, attributes, selected) {
        if (!select)
            return;
        select.innerHTML = '';
        for (let curAttr of attributes) {
            let option = document.createElement('option');
            option.value = curAttr;
            option.textContent = this.displayName(curAttr);
            option.selected = curAttr === selected;
            select.appendChild(option);
        }
    }

    /**
     * Returns the numeric attribute found in the most datasets.
     *
     * @returns {String|null} Attribute name
     */
    mostCommonNumericAttr() {
        let selected = null;
        let highestCount = 0;
        for (let [attr, count] of this.attrCounts) {
            if (count > highestCount) {
                selected = attr;
                highestCount = count;
            }
        }
        return selected;
    }

    /**
     * Applies both selected axis attributes and redraws once.
     *
     * @param {String} xAttr X axis attribute
     * @param {String} yAttr Y axis attribute
     * @returns {undefined}
     */
    applyAxisSelection(xAttr, yAttr) {
        let comp = this.requestor.parent.swac_comp;
        if (xAttr)
            comp.options.xAxisAttrName = xAttr;
        if (yAttr) {
            this.activeAttrs = [yAttr];
            if (!this.attrColors[yAttr])
                this.attrColors[yAttr] = this.generateColor(0);
        }
        this.refreshAttrDropdown();
        this.refreshTags();
        this.rebuildChart();
    }

    /**
     * Rebuilds the tags for all active attributes.
     *
     * @returns {undefined}
     */
    refreshTags() {
        if (!this.bar)
            return;
        let tagContainer = this.bar.querySelector('.swac_datamanager_activetags');
        tagContainer.innerHTML = '';
        for (let curAttr of this.activeAttrs) {
            this.buildTag(curAttr, this.attrColors[curAttr]);
        }
    }

    /**
     * Activates an attribute for display and redraws the chart.
     *
     * @param {String} attr Attribute name
     * @returns {undefined}
     */
    activateAttr(attr) {
        if (this.activeAttrs.includes(attr))
            return;
        if (!this.attrColors[attr])
            this.attrColors[attr] = this.generateColor(this.activeAttrs.length);
        this.activeAttrs.push(attr);
        this.refreshAttrDropdown();
        this.refreshTags();
        this.rebuildChart();
    }

    /**
     * Deactivates an attribute and redraws the chart.
     *
     * @param {String} attr Attribute name
     * @returns {undefined}
     */
    deactivateAttr(attr) {
        this.activeAttrs = this.activeAttrs.filter(curAttr => curAttr !== attr);
        this.refreshAttrDropdown();
        this.refreshTags();
        this.rebuildChart();
    }

    /**
     * Creates a tag for an active attribute with a color picker and a remove button.
     *
     * @param {String} attr Attribute name
     * @param {String} color Hex color value
     * @returns {undefined}
     */
    buildTag(attr, color) {
        let thisRef = this;
        let tagContainer = this.bar.querySelector('.swac_datamanager_activetags');

        let tag = document.createElement('div');
        tag.classList.add('swac_datamanager_tag', 'uk-flex', 'uk-flex-middle');
        tag.setAttribute('swac_attrname', attr);
        tag.style.cssText = 'background:' + color + '22; border:1px solid ' + color
                + '; border-radius:4px; padding:2px 8px; margin:2px; gap:4px;';

        // Color picker
        let colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.value = color;
        colorInput.title = attr;
        colorInput.style.cssText = 'width:20px; height:20px; border:none; padding:0; cursor:pointer; background:none;';
        colorInput.addEventListener('input', function () {
            thisRef.attrColors[attr] = colorInput.value;
            tag.style.background = colorInput.value + '22';
            tag.style.borderColor = colorInput.value;
            thisRef.rebuildChart();
        });

        // Label
        let label = document.createElement('span');
        label.textContent = this.displayName(attr);
        label.style.fontSize = '0.85rem';

        // Remove button
        let removeBtn = document.createElement('a');
        removeBtn.href = '#';
        removeBtn.innerHTML = '<span uk-icon="icon: close; ratio: 0.7"></span>';
        removeBtn.title = attr;
        removeBtn.addEventListener('click', function (evt) {
            evt.preventDefault();
            thisRef.deactivateAttr(attr);
        });

        tag.appendChild(colorInput);
        tag.appendChild(label);
        tag.appendChild(removeBtn);
        tagContainer.appendChild(tag);
    }

    /**
     * Rebuilds the chart based on the active attributes and their colors.
     * Sets the options of the Charts component and controls the chart plugin.
     *
     * @returns {undefined}
     */
    rebuildChart() {
        let comp = this.requestor.parent.swac_comp;
        if (!this.initialised)
            return;

        // Set the displayed attributes
        comp.options.yAxisAttrNames = this.activeAttrs.slice();

        // Get the chart drawing plugin
        let chartPlugin = this.getChartPlugin();
        if (!chartPlugin) {
            Msg.warn('DataManagerSPL', 'Chart plugin >' + this.options.chartPlugin + '< not found.', this.requestor);
            return;
        }

        // Reactivate the drawing plugin in case it was muted and remove the
        // existing chart completely before redrawing
        this.unmuteChartPlugin();
        this.clearChart(chartPlugin);

        // Nothing to draw when no attribute is active
        if (this.activeAttrs.length === 0)
            return;

        // Build the list of sets to draw: apply the external filter predicate
        // and sort by the x axis attribute so the line connects the points in
        // the right order (avoids lines crossing the diagram)
        let xAttr = comp.options.xAxisAttrName;
        let drawSets = [];
        if (this.displaySets) {
            // Draw externally provided sets (filtered/transformed elsewhere)
            drawSets = this.displaySets.filter(curSet => typeof curSet[xAttr] !== 'undefined'
                        && curSet[xAttr] !== null);
        } else {
            for (let curSet of this.allSets) {
                if (this.filterPredicate && !this.filterPredicate(curSet))
                    continue;
                if (typeof curSet[xAttr] === 'undefined' || curSet[xAttr] === null)
                    continue;
                drawSets.push(curSet);
            }
        }
        this.updateSourceColors(comp, drawSets);
        drawSets.sort(function (a, b) {
            let av = a[xAttr];
            let bv = b[xAttr];
            if (av < bv)
                return -1;
            if (av > bv)
                return 1;
            return 0;
        });

        // Feed the sorted, filtered sets to the chart plugin using its hooks
        let first = true;
        for (let curSet of drawSets) {
            if (first) {
                chartPlugin.initChart(curSet);
                first = false;
            } else {
                chartPlugin.afterAddSet(curSet, []);
            }
        }

        // Apply display names to legend and axis titles
        this.patchDatasetLabels();
    }

    /**
     * Writes colors into sourceColors for all sources that are drawn.
     *
     * @param {Charts} comp Charts component
     * @param {Array} drawSets Sets that will be drawn
     * @returns {undefined}
     */
    updateSourceColors(comp, drawSets) {
        if (!comp.options.sourceColors)
            comp.options.sourceColors = {};
        let sources = new Set();
        for (let curSource in comp.data) {
            sources.add(curSource);
        }
        for (let curSet of drawSets) {
            if (curSet && curSet.swac_fromName)
                sources.add(curSet.swac_fromName);
        }
        for (let curSource of sources) {
            for (let curAttr of this.activeAttrs) {
                if (!this.attrColors[curAttr])
                    this.attrColors[curAttr] = this.generateColor(this.activeAttrs.indexOf(curAttr));
                comp.options.sourceColors[curSource + '_' + curAttr] = this.attrColors[curAttr];
            }
        }
    }

    /**
     * Sets display names (renames) for attributes. They are used in the tags,
     * the dropdown, the chart legend and the axis titles, the data itself is
     * not changed.
     *
     * @param {Object|null} names Map attribute name to display name
     * @returns {undefined}
     */
    setDisplayNames(names) {
        this.displayNames = Object.assign({}, this.options.displayNames || {}, names || {});
        this.refreshAttrDropdown();
        this.refreshTags();
        this.refreshAxisSelectors();
        this.patchDatasetLabels();
    }

    /**
     * Returns the display name of an attribute.
     *
     * @param {String} attr Attribute name
     * @returns {String} Display name
     */
    displayName(attr) {
        return this.displayNames[attr] || attr;
    }

    /**
     * Replaces attribute names in the chart legend and the axis titles by
     * their display names.
     *
     * @returns {undefined}
     */
    patchDatasetLabels() {
        let chartPlugin = this.getChartPlugin();
        if (!chartPlugin || !chartPlugin.chart)
            return;
        let changed = false;
        let attributes = new Set([...this.knownAttrs, ...Object.keys(this.displayNames)]);
        for (let oldName of attributes) {
            let newName = this.displayName(oldName);
            // Legend entries end with _attribute
            let suffix = '_' + oldName;
            for (let curDs of chartPlugin.chart.data.datasets) {
                if (curDs.label && curDs.label.endsWith(suffix)) {
                    if (this.options.showSourceNames)
                        curDs.label = curDs.label.substring(0, curDs.label.length - suffix.length) + '_' + newName;
                    else
                        curDs.label = newName;
                    changed = true;
                }
            }
            // Axis titles
            let scales = chartPlugin.chart.options.scales || {};
            let yScale = scales['y_' + oldName];
            if (yScale && yScale.title && yScale.title.text === oldName) {
                yScale.title.text = newName;
                changed = true;
            }
            if (scales.x && scales.x.title && scales.x.title.text === oldName) {
                scales.x.title.text = newName;
                changed = true;
            }
        }
        if (changed)
            chartPlugin.chart.update('none');
    }

    /**
     * Sets a filter predicate that decides which sets are drawn, and redraws.
     * This keeps filtering separate from series and color handling.
     *
     * @param {Function|null} predicate Function (set) => boolean, or null for all
     * @returns {undefined}
     */
    setFilterPredicate(predicate) {
        this.filterPredicate = predicate;
        this.rebuildChart();
    }

    /**
     * Removes the existing chart completely: destroys the chart.js instance,
     * resets the axis definitions the drawing plugin collected (otherwise axes
     * of removed series stay visible) and replaces the canvas by a fresh one
     * (a reused canvas keeps a broken size after destroy and the chart ends up
     * tiny in a corner).
     *
     * @param {Plugin} chartPlugin The chart drawing plugin
     * @returns {undefined}
     */
    clearChart(chartPlugin) {
        if (!chartPlugin)
            return;
        if (chartPlugin.chart) {
            chartPlugin.chart.destroy();
            chartPlugin.chart = null;
        }
        if (chartPlugin.options && chartPlugin.options.scales)
            chartPlugin.options.scales = {};
        if (chartPlugin.contElements && chartPlugin.contElements[0]) {
            let oldCanvas = chartPlugin.contElements[0].querySelector('canvas');
            if (oldCanvas) {
                let freshCanvas = document.createElement('canvas');
                oldCanvas.replaceWith(freshCanvas);
            }
        }
    }

    /**
     * Prepares a rebuild triggered by external display sets. The drawing hooks
     * are muted until rebuildChart draws the final set list once.
     *
     * @returns {undefined}
     */
    prepareRebuild() {
        let chartPlugin = this.getChartPlugin();
        if (!chartPlugin)
            return;
        this.clearChart(chartPlugin);
        if (!this.mutedHooks) {
            this.mutedHooks = {
                afterAddSet: chartPlugin.afterAddSet,
                afterRemoveSet: chartPlugin.afterRemoveSet
            };
            chartPlugin.afterAddSet = function () {};
            chartPlugin.afterRemoveSet = function () {};
        }
    }

    /**
     * Restores the muted hooks of the drawing plugin.
     *
     * @returns {undefined}
     */
    unmuteChartPlugin() {
        if (!this.mutedHooks)
            return;
        let chartPlugin = this.getChartPlugin();
        if (chartPlugin) {
            chartPlugin.afterAddSet = this.mutedHooks.afterAddSet;
            chartPlugin.afterRemoveSet = this.mutedHooks.afterRemoveSet;
        }
        this.mutedHooks = null;
    }

    /**
     * Sets external display sets that are drawn instead of the collected sets.
     * Attribute renames are applied to the active series and the x axis. Pass
     * null to return to the own collected sets.
     *
     * @param {Array|null} sets Sets to draw, or null
     * @param {Object|null} renameMap Map old attribute name to new name
     * @returns {undefined}
     */
    setDisplaySets(sets, renameMap) {
        let comp = this.requestor.parent.swac_comp;
        this.displaySets = sets;
        if (sets && renameMap) {
            // Follow renames in the active series, their colors and the x axis
            this.activeAttrs = this.activeAttrs.map(a => renameMap[a] || a);
            for (let oldName in renameMap) {
                if (this.attrColors[oldName]) {
                    this.attrColors[renameMap[oldName]] = this.attrColors[oldName];
                    delete this.attrColors[oldName];
                }
            }
            if (renameMap[comp.options.xAxisAttrName])
                comp.options.xAxisAttrName = renameMap[comp.options.xAxisAttrName];
        }
        if (sets) {
            // Rebuild the known attributes from the display sets
            this.knownAttrs = new Set();
            this.axisAttrs = new Set();
            for (let curSet of sets) {
                for (let curAttr in curSet) {
                    if (curAttr.startsWith('swac_'))
                        continue;
                    if (this.isExcludedAttr(curAttr, curSet))
                        continue;
                    if (this.isAxisValue(curSet[curAttr]))
                        this.axisAttrs.add(curAttr);
                    if (this.isNumericValue(curSet[curAttr]))
                        this.knownAttrs.add(curAttr);
                }
            }
            // Drop active series that no longer exist
            this.activeAttrs = this.activeAttrs.filter(a => this.knownAttrs.has(a));
            if (this.activeAttrs.length === 0 && sets.length > 0) {
                let first = this.firstNumericAttr(sets[0]);
                if (first)
                    this.activeAttrs.push(first);
            }
            for (let curAttr of this.activeAttrs) {
                if (!this.attrColors[curAttr])
                    this.attrColors[curAttr] = this.generateColor(this.activeAttrs.indexOf(curAttr));
            }
        }
        this.refreshAttrDropdown();
        this.refreshTags();
        this.rebuildChart();
    }

    /**
     * Gets the current data series settings.
     *
     * @returns {Object} Settings with active attributes and colors
     */
    getDisplaySettings() {
        let colors = {};
        for (let curAttr in this.attrColors) {
            colors[curAttr] = this.attrColors[curAttr];
        }
        return {
            activeAttrs: this.activeAttrs.slice(),
            attrColors: colors,
            xAxisAttrName: this.requestor.parent.swac_comp.options.xAxisAttrName
        };
    }

    /**
     * Applies data series settings and redraws the chart.
     *
     * @param {Object|null} settings Settings with active attributes and colors
     * @returns {undefined}
     */
    setDisplaySettings(settings) {
        if (!settings)
            return;
        let comp = this.requestor.parent.swac_comp;
        if (settings.xAxisAttrName && this.axisAttrs.has(settings.xAxisAttrName))
            comp.options.xAxisAttrName = settings.xAxisAttrName;
        if (settings.attrColors) {
            for (let curAttr in settings.attrColors) {
                this.attrColors[curAttr] = settings.attrColors[curAttr];
            }
        }
        if (Array.isArray(settings.activeAttrs)) {
            let attrs = [];
            for (let curAttr of settings.activeAttrs) {
                if (this.knownAttrs.has(curAttr))
                    attrs.push(curAttr);
            }
            this.activeAttrs = attrs;
            if (this.activeAttrs.length === 0) {
                let sample = this.displaySets && this.displaySets.length > 0
                        ? this.displaySets[0] : this.allSets[0];
                let first = sample ? this.firstNumericAttr(sample) : null;
                if (first)
                    this.activeAttrs.push(first);
            }
            for (let curAttr of this.activeAttrs) {
                if (!this.attrColors[curAttr])
                    this.attrColors[curAttr] = this.generateColor(this.activeAttrs.indexOf(curAttr));
            }
        }
        this.refreshAttrDropdown();
        this.refreshTags();
        this.refreshAxisSelectors();
        this.rebuildChart();
    }

    /**
     * Returns the instance of the controlled chart drawing plugin.
     *
     * @returns {Plugin|null} The plugin instance or null when not loaded
     */
    getChartPlugin() {
        let comp = this.requestor.parent.swac_comp;
        if (!comp.plugins)
            return null;
        let plugin = comp.plugins.get(this.options.chartPlugin);
        if (!plugin || !plugin.swac_comp)
            return null;
        return plugin.swac_comp;
    }

    /**
     * Returns the first numeric attribute of a set.
     *
     * @param {WatchableSet} set Dataset
     * @returns {String|null} Attribute name or null when none found
     */
    firstNumericAttr(set) {
        for (let curAttr in set) {
            if (curAttr.startsWith('swac_'))
                continue;
            if (this.isExcludedAttr(curAttr, set))
                continue;
            if (this.isNumericValue(set[curAttr]))
                return curAttr;
        }
        return null;
    }

    /**
     * Checks whether an attribute must be hidden from the series selection.
     *
     * @param {String} attr Attribute name
     * @param {WatchableSet} set Dataset containing the attribute
     * @returns {Boolean} True when the attribute must be excluded
     */
    isExcludedAttr(attr, set) {
        if (this.options.excludeAttrs.includes(attr))
            return true;
        if (attr.startsWith('pos_'))
            return true;
        if (this.options.attributeFilter)
            return this.options.attributeFilter(attr, set) !== true;
        return false;
    }

    /**
     * Checks whether a value can be used on a chart axis.
     *
     * @param {*} value Attribute value
     * @returns {Boolean} True for scalar values
     */
    isAxisValue(value) {
        return value !== null && typeof value !== 'undefined'
                && (typeof value === 'string' || typeof value === 'number');
    }

    /**
     * Checks if a value counts as a number for display. Real numbers (int and
     * double) and numeric strings are accepted. Booleans, dates, timestamps and
     * other strings are rejected.
     *
     * @param {*} val Value to check
     * @returns {Boolean} True when the value is usable as a number
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
     * Checks if a value looks like a parseable date string.
     *
     * @param {*} val Value to check
     * @returns {Boolean} True when the value parses as a date
     */
    looksLikeDate(val) {
        if (typeof val !== 'string')
            return false;
        // Require a real date pattern (ISO or german format) at the start of
        // the string. A plain parse check is too loose, texts like 'Test 01'
        // would otherwise be treated as dates by some engines.
        if (!/^\d{4}-\d{2}-\d{2}/.test(val) && !/^\d{1,2}\.\d{1,2}\.\d{4}/.test(val))
            return false;
        let d = new Date(val);
        return !isNaN(d.valueOf());
    }

    /**
     * Generates a color based on the index of the data series.
     *
     * @param {Number} index Index in the list of active attributes
     * @returns {String} Hex color value
     */
    generateColor(index) {
        const colors = ['#1a73e8', '#e53935', '#43a047', '#fb8c00', '#8e24aa',
            '#00acc1', '#6d4c41', '#546e7a', '#f4511e', '#039be5'];
        return colors[index % colors.length];
    }
}
