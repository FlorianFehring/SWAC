import SWAC from '../../../../swac.js';
import Msg from '../../../../Msg.js';
import Plugin from '../../../../Plugin.js';

/**
 * DataManager plugin for the Charts component.
 *
 * Provides a settings bar above the chart that lets the user control how the
 * data is displayed:
 * - add and remove data series (attributes)
 * - assign a color to each data series
 *
 * The plugin detects the available numeric attributes automatically from the
 * data, so it works with any datasource (sensor data, water data, ...) without
 * configuration.
 *
 * Drawing is delegated to a chart drawing plugin (Linechart by default). The
 * DataManager controls that plugin through its official hooks (initChart,
 * afterAddSet, afterRemoveSet). The drawing plugin must be active in the options
 * so it gets loaded, the DataManager then keeps it in sync with the chosen
 * series and colors.
 *
 * Filtering of the data (time range, value) is not done here. Filtering also
 * affects the table and is therefore handled by the separate DataFilterStored
 * component.
 */
export default class DataManagerSPL extends Plugin {

    constructor(opts = {}) {
        super(opts);
        this.name = 'Charts/plugins/DataManager';
        this.desc.text = 'Settings bar to choose the displayed data series and their colors.';
        this.desc.developers = 'Maczap (HSBI)';
        this.desc.license = 'GNU Lesser General Public License';

        // No template is registered on purpose. A plugin that loads a template
        // gets its own tab in the chart navigation. The DataManager must not be
        // a tab, its settings bar is always visible above the chart. Without a
        // template the chart drawing plugin (Linechart) stays the first tab.

        this.desc.opts[0] = {
            name: 'defaultAttrs',
            desc: 'Attributes shown at start. If not set the first numeric attribute is used.',
            example: ['temp1']
        };
        if (!opts.defaultAttrs)
            this.options.defaultAttrs = null;

        this.desc.opts[1] = {
            name: 'excludeAttrs',
            desc: 'Attributes that are never offered for display.',
            example: ['id', 'synced']
        };
        if (!opts.excludeAttrs)
            this.options.excludeAttrs = ['id', 'synced', 'pos', 'pos_accuracy', 'pos_altitude',
                'pos_altitude_accuracy', 'pos_heading', 'pos_speed', 'measurement_process',
                'measurement_name'];

        this.desc.opts[2] = {
            name: 'chartPlugin',
            desc: 'Name of the chart drawing plugin that is controlled.',
            example: 'Linechart'
        };
        if (!opts.chartPlugin)
            this.options.chartPlugin = 'Linechart';

        // Internal state
        this.knownAttrs = new Set();    // all numeric attributes found in data
        this.activeAttrs = [];          // attributes currently shown
        this.attrColors = {};           // chosen color per attribute
        this.allSets = [];              // all sets received, used for redraw
        this.initialised = false;       // bar built and defaults set
        this.bar = null;                // the settings bar dom element
        this.filterPredicate = null;    // optional external filter for drawn sets
    }

    init() {
        let thisRef = this;
        return new Promise((resolve, reject) => {
            // No template and no contElement needed, the bar is built directly
            // into the chart requestor in buildBar()
            resolve();
        });
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
        // Collect the set for later redraw
        this.allSets.push(set);

        // Detect numeric attributes
        for (let curAttr in set) {
            if (curAttr.startsWith('swac_'))
                continue;
            if (this.options.excludeAttrs.includes(curAttr))
                continue;
            if (typeof set[curAttr] !== 'number')
                continue;
            this.knownAttrs.add(curAttr);
        }

        // Build the bar once after the first set arrived
        if (!this.initialised) {
            this.initialised = true;
            this.buildBar();
            this.setDefaultAttrs(set);
        }

        // Redraw once when the last set of the request was added
        if (set.swac_dataRequest && set.id === set.swac_dataRequest.highestId) {
            this.refreshAttrDropdown();
            this.refreshTags();
            this.rebuildChart();
        }
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
            let first = this.firstNumericAttr(set);
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
     * Builds the settings bar and inserts it above the chart navigation, so it
     * is always visible regardless of the active tab. Inserted only once.
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

        // Translate the inserted bar
        SWAC.lang.translateAll(bar);
    }

    /**
     * Returns the html for the settings bar.
     *
     * @returns {String} The bar markup
     */
    getBarHtml() {
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
            a.textContent = curAttr;
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
            li.setAttribute('swac_lang', 'DataManager.allactive');
            li.textContent = 'All series shown';
            list.appendChild(li);
        }
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
        label.textContent = attr;
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

        // Write the colors into sourceColors for every datasource
        if (!comp.options.sourceColors)
            comp.options.sourceColors = {};
        for (let curSource in comp.data) {
            for (let curAttr of this.activeAttrs) {
                comp.options.sourceColors[curSource + '_' + curAttr] = this.attrColors[curAttr];
            }
        }

        // Get the chart drawing plugin
        let chartPlugin = this.getChartPlugin();
        if (!chartPlugin) {
            Msg.warn('DataManagerSPL', 'Chart plugin >' + this.options.chartPlugin + '< not found.', this.requestor);
            return;
        }

        // Remove the existing chart
        if (chartPlugin.chart) {
            chartPlugin.chart.destroy();
            chartPlugin.chart = null;
        }

        // Nothing to draw when no attribute is active
        if (this.activeAttrs.length === 0)
            return;

        // Build the list of sets to draw: apply the external filter predicate
        // and sort by the x axis attribute so the line connects the points in
        // the right order (avoids lines crossing the diagram)
        let xAttr = comp.options.xAxisAttrName;
        let drawSets = [];
        for (let curSet of this.allSets) {
            if (this.filterPredicate && !this.filterPredicate(curSet))
                continue;
            drawSets.push(curSet);
        }
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
    }

    /**
     * Sets a filter predicate that decides which sets are drawn, and redraws.
     * Used by an external filter component (DataReducer) so the chart stays
     * sorted and is redrawn only once per filter change.
     *
     * @param {Function|null} predicate Function (set) => boolean, or null for all
     * @returns {undefined}
     */
    setFilterPredicate(predicate) {
        this.filterPredicate = predicate;
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
            if (this.options.excludeAttrs.includes(curAttr))
                continue;
            if (typeof set[curAttr] === 'number')
                return curAttr;
        }
        return null;
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
