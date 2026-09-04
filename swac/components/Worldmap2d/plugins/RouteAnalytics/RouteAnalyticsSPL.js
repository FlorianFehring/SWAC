import SWAC from '../../../../swac.js';
import Msg from '../../../../Msg.js';
import Plugin from '../../../../Plugin.js';
import DataAggregation from '../../../../DataAggregation.js?ver=17.08.2026.9';
import TableExport from '../../../../TableExport.js?ver=17.08.2026.9';
import {getConfiguredGuiSections} from '../../../../GuiFunctions.js?ver=17.08.2026.9';

/**
 * Filters route points and renders route statistics.
 */
export default class RouteAnalyticsSPL extends Plugin {
    constructor(options = {}) {
        super(options);
        this.name = 'Worldmap2d/plugins/RouteAnalytics';
        this.desc.text = 'Plugin to filter route points and show route statistics.';

        this.desc.templates[0] = {
            name: 'routeanalytics',
            style: 'routeanalytics',
            desc: 'Default template for RouteAnalytics',
        };

        this.desc.opts[0] = {
            name: 'routeAttr',
            desc: 'Primary attribute used to group datasets into routes.'
        };
        if (!options.routeAttr)
            this.options.routeAttr = 'route';

        this.desc.opts[1] = {
            name: 'routeKeyAttrs',
            desc: 'Additional attributes used to create unique route keys.'
        };
        if (!Array.isArray(options.routeKeyAttrs))
            this.options.routeKeyAttrs = [];

        this.desc.opts[2] = {
            name: 'routeFallbackAttrs',
            desc: 'Fallback attributes used when routeAttr is empty.'
        };
        if (!Array.isArray(options.routeFallbackAttrs))
            this.options.routeFallbackAttrs = [];

        this.desc.opts[3] = {
            name: 'valueAttrs',
            desc: 'Numeric attributes displayed in route statistics.'
        };
        if (!Array.isArray(options.valueAttrs))
            this.options.valueAttrs = [];

        this.desc.opts[4] = {
            name: 'healthAttr',
            desc: 'Numeric attribute used for route health rating.'
        };
        if (!options.healthAttr)
            this.options.healthAttr = null;

        this.desc.opts[5] = {
            name: 'healthThresholds',
            desc: 'Thresholds for good and medium route health.'
        };
        if (!options.healthThresholds)
            this.options.healthThresholds = {good: 10, medium: 25};

        this.desc.opts[6] = {
            name: 'summaryTarget',
            desc: 'CSS selector where the route summary is rendered.'
        };
        if (!options.summaryTarget)
            this.options.summaryTarget = null;

        this.desc.opts[7] = {
            name: 'tsAttr',
            desc: 'Attribute used to sort points inside a route.'
        };
        if (!options.tsAttr)
            this.options.tsAttr = 'ts';

        this.desc.opts[8] = {
            name: 'altitudeAttr',
            desc: 'Attribute used to calculate elevation gain.'
        };
        if (!options.altitudeAttr)
            this.options.altitudeAttr = null;

        this.desc.opts[9] = {
            name: 'splitByTimeGapMinutes',
            desc: 'Creates route groups from time gaps when no route attribute is available.'
        };
        if (typeof options.splitByTimeGapMinutes === 'undefined')
            this.options.splitByTimeGapMinutes = null;

        this.desc.opts[10] = {
            name: 'routeColors',
            desc: 'Colors used to draw route lines.'
        };
        if (!Array.isArray(options.routeColors) || options.routeColors.length === 0) {
            this.options.routeColors = [
                '#0072B2',
                '#D55E00',
                '#009E73',
                '#CC79A7',
                '#E69F00',
                '#56B4E9',
                '#7F7F7F'
            ];
        }

        this.desc.opts[11] = {
            name: 'fitBoundsOnLoad',
            desc: 'Fits the map bounds to the first rendered route set.'
        };
        if (typeof options.fitBoundsOnLoad === 'undefined')
            this.options.fitBoundsOnLoad = true;

        this.desc.opts[12] = {
            name: 'splitUnnamedRoutesByTimeGap',
            desc: 'Creates separate unnamed routes from time gaps.'
        };
        if (typeof options.splitUnnamedRoutesByTimeGap === 'undefined')
            this.options.splitUnnamedRoutesByTimeGap = true;

        this.desc.opts[13] = {
            name: 'ignoreUnnamedRoutesWithoutKey',
            desc: 'Ignores route rows without route name and route key values.'
        };
        if (typeof options.ignoreUnnamedRoutesWithoutKey === 'undefined')
            this.options.ignoreUnnamedRoutesWithoutKey = false;

        this.desc.opts[14] = {
            name: 'healthAttrs',
            desc: 'Numeric attributes used for route health rating.'
        };
        if (!Array.isArray(options.healthAttrs))
            this.options.healthAttrs = options.healthAttr ? [options.healthAttr] : [];

        this.desc.opts[15] = {
            name: 'healthThresholdsByAttr',
            desc: 'Thresholds per attribute used for route health rating.'
        };
        if (!options.healthThresholdsByAttr)
            this.options.healthThresholdsByAttr = {};

        this.desc.opts[16] = {
            name: 'groupBySourceWhenRouteAttrsMissing',
            desc: 'Groups a datasource as one route when configured route attributes are not available.'
        };
        if (typeof options.groupBySourceWhenRouteAttrsMissing === 'undefined')
            this.options.groupBySourceWhenRouteAttrsMissing = false;

        this.desc.opts[17] = {
            name: 'defaultAggregation',
            desc: 'Initial aggregation interval.'
        };
        if (!options.defaultAggregation)
            this.options.defaultAggregation = {amount: 0, unit: 'minutes'};

        this.desc.opts[18] = {
            name: 'selectedRoute',
            desc: 'Route selection applied when the plugin is initialized.'
        };
        if (!options.selectedRoute)
            this.options.selectedRoute = null;

        this.desc.opts[19] = {
            name: 'onRouteSelect',
            desc: 'Callback executed after a route summary row is selected.'
        };
        if (typeof options.onRouteSelect !== 'function')
            this.options.onRouteSelect = null;

        this.desc.opts[20] = {
            name: 'onRouteRender',
            desc: 'Callback executed after route groups are rendered.'
        };
        if (typeof options.onRouteRender !== 'function')
            this.options.onRouteRender = null;

        this.desc.opts[21] = {
            name: 'aggregationTarget',
            desc: 'Target for aggregation. Possible values are both, map or table.'
        };
        if (!['both', 'map', 'table'].includes(options.aggregationTarget))
            this.options.aggregationTarget = 'both';

        this.desc.opts[22] = {
            name: 'exportTableSelector',
            desc: 'Optional visible table selector preferred for table export.'
        };
        if (!options.exportTableSelector)
            this.options.exportTableSelector = null;

        this.desc.opts[23] = {
            name: 'groupUnroutedPoints',
            desc: 'Groups points without route values without drawing a connecting line.'
        };
        if (typeof options.groupUnroutedPoints === 'undefined')
            this.options.groupUnroutedPoints = false;

        this.desc.opts[24] = {
            name: 'segmentColorAttr',
            desc: 'Numeric attribute used to color individual route segments.'
        };
        if (!options.segmentColorAttr)
            this.options.segmentColorAttr = null;

        this.desc.opts[25] = {
            name: 'segmentColorThresholds',
            desc: 'Thresholds for good and medium route segment values.'
        };
        if (!options.segmentColorThresholds)
            this.options.segmentColorThresholds = null;

        this.desc.opts[26] = {
            name: 'segmentColorMode',
            desc: 'Combines endpoint values. Possible values are max and average.'
        };
        if (!['max', 'average'].includes(options.segmentColorMode))
            this.options.segmentColorMode = 'max';

        this.desc.opts[27] = {
            name: 'segmentColors',
            desc: 'Colors used for good, medium and bad route segments.'
        };
        this.options.segmentColors = {
            good: '#2EAD2E',
            medium: '#F9C80E',
            bad: '#D7374C',
            ...options.segmentColors
        };

        // Attributes for internal usage
        this.map = null;
        this.routeanalytics = null;
        this.menu = null;
        this.routeSelect = null;
        this.attributeSelect = null;
        this.operatorSelect = null;
        this.valueInput = null;
        this.healthSelect = null;
        this.fromInput = null;
        this.toInput = null;
        this.aggregationAmountInput = null;
        this.aggregationUnitSelect = null;
        this.aggregationTargetSelect = null;
        this.availableRange = null;
        this.summaryTarget = null;
        this.routeLayer = null;
        this.rows = [];
        this.hiddenRouteKeys = new Set();
        this.markerFilterActive = false;
        this.renderTimer = null;
        this.hasFittedBounds = false;
        this.columnNames = this.loadColumnNames();
        this.visibleSections = null;
    }

    init() {
        return new Promise((resolve, reject) => {
            this.map = this.requestor.parent.swac_comp;
            this.loadGuiFunctions();
            this.routeanalytics = this.requestor.parent.querySelector('.routeanalytics');
            this.buildMenu();
            this.routeSelect = this.menu.querySelector('.routeanalytics-route-select');
            this.attributeSelect = this.menu.querySelector('.routeanalytics-attribute-select');
            this.operatorSelect = this.menu.querySelector('.routeanalytics-operator-select');
            this.valueInput = this.menu.querySelector('.routeanalytics-value-input');
            this.healthSelect = this.menu.querySelector('.routeanalytics-health-select');
            this.fromInput = this.menu.querySelector('.routeanalytics-from-input');
            this.toInput = this.menu.querySelector('.routeanalytics-to-input');
            this.aggregationAmountInput = this.menu.querySelector('.routeanalytics-aggregation-amount');
            this.aggregationUnitSelect = this.menu.querySelector('.routeanalytics-aggregation-unit');
            this.aggregationTargetSelect = this.menu.querySelector('.routeanalytics-aggregation-target');
            this.availableRange = this.menu.querySelector('.routeanalytics-available-values');
            this.summaryTarget = this.findSummaryTarget();
            this.fillDefaultAggregation();

            this.routeLayer = L.layerGroup().addTo(this.map.viewer);
            if (this.map.layerControl)
                this.map.layerControl.addOverlay(this.routeLayer, this.lang('route_layer', 'Routes'));

            this.menu.querySelector('.routeanalytics-apply-button').onclick = this.applyFilter.bind(this);
            this.menu.querySelector('.routeanalytics-reset-button').onclick = this.resetFilter.bind(this);
            this.menu.querySelector('.routeanalytics-export-button').onclick = this.exportTable.bind(this);
            this.valueInput.addEventListener('keypress', (e) => {
                if (e.key == 'Enter')
                    this.applyFilter();
            });

            this.loadExistingMarkers();
            this.updateControls();
            this.render();
            resolve();
        });
    }

    /**
     * Builds the settings button and side menu.
     */
    buildMenu() {
        let host = this.requestor.parent;
        let menuId = host.id + '_routeanalytics_menu';
        let wrapper = document.createElement('div');
        wrapper.innerHTML = this.getMenuHtml(menuId);
        let toggle = wrapper.firstElementChild;
        this.menu = wrapper.lastElementChild;
        host.insertBefore(this.menu, host.firstChild);
        host.insertBefore(toggle, host.firstChild);
        SWAC.lang.translateAll(toggle);
        SWAC.lang.translateAll(this.menu);
        this.applySectionVisibility();
    }

    /**
     * Loads menu sections configured by the host component.
     *
     * @returns {undefined}
     */
    loadGuiFunctions() {
        this.visibleSections = getConfiguredGuiSections(this.map.options,
                this.map.getGuiFunctionNames?.());
    }

    /**
     * Hides route menu sections that are not enabled by GUI functions.
     *
     * @returns {undefined}
     */
    applySectionVisibility() {
        if (!Array.isArray(this.visibleSections))
            return;
        let visible = new Set(this.visibleSections);
        for (let section of ['filters', 'tableexport']) {
            if (!visible.has(section))
                this.hideMenuSection(section);
        }
        if (!visible.has('aggregation'))
            this.hideMenuSection('aggregation', false);
        if (!visible.has('filters') && !visible.has('aggregation')) {
            this.menu.querySelector('.routeanalytics-available-block').hidden = true;
            this.menu.querySelector('.routeanalytics-filter-divider').hidden = true;
        }
        this.menu.querySelector('.routeanalytics-actions').hidden
                = !visible.has('filters') && !visible.has('aggregation');
    }

    /**
     * Hides one settings menu section.
     *
     * @param {String} section Section name
     * @param {Boolean} allFollowing Hide content up to the next heading
     * @returns {undefined}
     */
    hideMenuSection(section, allFollowing = true) {
        let heading = this.menu.querySelector('h5[swac_lang="Worldmap2d_RouteAnalytics.' + section + '"]');
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
     * Gets the settings menu markup.
     *
     * @param {String} menuId Offcanvas element id
     * @returns {String} Menu markup
     */
    getMenuHtml(menuId) {
        return '<div class="routeanalytics-togglebar uk-margin-small-bottom">'
                + '<button class="uk-button uk-button-default uk-button-small" type="button" uk-toggle="target: #' + menuId + '">'
                + '<span uk-icon="icon: settings; ratio: 0.8"></span> '
                + '<span swac_lang="Worldmap2d_RouteAnalytics.menu">Filter and settings</span>'
                + '</button>'
                + '</div>'
                + '<div id="' + menuId + '" uk-offcanvas="overlay: true">'
                + '<div class="uk-offcanvas-bar swac_datafilterbar routeanalytics-menu">'
                + '<button class="uk-offcanvas-close" type="button" uk-close></button>'
                + '<div class="routeanalytics-available-block swac_dontdisplay uk-margin-small-bottom">'
                + '<span class="uk-text-bold" swac_lang="Worldmap2d_RouteAnalytics.available_range">Available time range</span><br>'
                + '<span class="routeanalytics-available-values uk-text-small"></span>'
                + '</div>'
                + '<hr class="routeanalytics-filter-divider">'
                + '<h5 swac_lang="Worldmap2d_RouteAnalytics.filters">Filters</h5>'
                + '<label class="uk-form-label uk-text-small" swac_lang="Worldmap2d_RouteAnalytics.time_range">Time range</label>'
                + '<input class="routeanalytics-from-input uk-input uk-form-small uk-margin-small-bottom" type="datetime-local">'
                + '<input class="routeanalytics-to-input uk-input uk-form-small uk-margin-small-bottom" type="datetime-local">'
                + '<label class="uk-form-label uk-text-small" swac_lang="Worldmap2d_RouteAnalytics.route">Route</label>'
                + '<select class="routeanalytics-route-select uk-select uk-form-small uk-margin-small-bottom"></select>'
                + '<label class="uk-form-label uk-text-small" swac_lang="Worldmap2d_RouteAnalytics.value">Value</label>'
                + '<div class="routeanalytics-filter-row">'
                + '<select class="routeanalytics-attribute-select uk-select uk-form-small"></select>'
                + '<select class="routeanalytics-operator-select uk-select uk-form-small">'
                + '<option value="gt">&gt;</option><option value="gte">&gt;=</option><option value="eq">=</option>'
                + '<option value="lte">&lt;=</option><option value="lt">&lt;</option>'
                + '</select>'
                + '<input class="routeanalytics-value-input uk-input uk-form-small" type="number" step="any">'
                + '</div>'
                + '<label class="uk-form-label uk-text-small uk-margin-small-top" swac_lang="Worldmap2d_RouteAnalytics.health">Health</label>'
                + '<select class="routeanalytics-health-select uk-select uk-form-small">'
                + '<option value="" swac_lang="Worldmap2d_RouteAnalytics.all_health">All ratings</option>'
                + '<option value="good" swac_lang="Worldmap2d_RouteAnalytics.health_good">Good</option>'
                + '<option value="medium" swac_lang="Worldmap2d_RouteAnalytics.health_medium">Medium</option>'
                + '<option value="bad" swac_lang="Worldmap2d_RouteAnalytics.health_bad">Bad</option>'
                + '<option value="unknown" swac_lang="Worldmap2d_RouteAnalytics.health_unknown">Unknown</option>'
                + '</select>'
                + '<h5 class="uk-margin-small-top" swac_lang="Worldmap2d_RouteAnalytics.aggregation">Aggregation</h5>'
                + '<div class="routeanalytics-aggregation-block">'
                + '<label class="uk-form-label uk-text-small" swac_lang="Worldmap2d_RouteAnalytics.target">Apply to</label>'
                + '<select class="routeanalytics-aggregation-target uk-select uk-form-small uk-margin-small-bottom">'
                + '<option value="both" swac_lang="Worldmap2d_RouteAnalytics.target_both">Map and table</option>'
                + '<option value="map" swac_lang="Worldmap2d_RouteAnalytics.target_map">Map only</option>'
                + '<option value="table" swac_lang="Worldmap2d_RouteAnalytics.target_table">Table only</option>'
                + '</select>'
                + '<div class="routeanalytics-aggregation-row">'
                + '<input class="routeanalytics-aggregation-amount uk-input uk-form-small" type="number" min="0" step="1">'
                + '<select class="routeanalytics-aggregation-unit uk-select uk-form-small">'
                + '<option value="seconds" swac_lang="Worldmap2d_RouteAnalytics.seconds">Seconds</option>'
                + '<option value="minutes" swac_lang="Worldmap2d_RouteAnalytics.minutes">Minutes</option>'
                + '<option value="hours" swac_lang="Worldmap2d_RouteAnalytics.hours">Hours</option>'
                + '<option value="days" swac_lang="Worldmap2d_RouteAnalytics.days">Days</option>'
                + '</select>'
                + '</div>'
                + '</div>'
                + '<div class="routeanalytics-actions uk-margin-small-top">'
                + '<button class="routeanalytics-apply-button uk-button uk-button-primary uk-button-small" type="button" swac_lang="Worldmap2d_RouteAnalytics.apply">Apply</button> '
                + '<button class="routeanalytics-reset-button uk-button uk-button-default uk-button-small" type="button" swac_lang="Worldmap2d_RouteAnalytics.reset">Reset</button>'
                + '</div>'
                + '<hr>'
                + '<h5 swac_lang="Worldmap2d_RouteAnalytics.tableexport">Table export</h5>'
                + '<label class="uk-form-label uk-text-small" swac_lang="Worldmap2d_RouteAnalytics.exportformat">Format</label>'
                + '<select class="routeanalytics-export-format uk-select uk-form-small uk-margin-small-bottom">'
                + '<option value="csv" swac_lang="Worldmap2d_RouteAnalytics.exportformat_csv">CSV</option>'
                + '<option value="json" swac_lang="Worldmap2d_RouteAnalytics.exportformat_json">JSON</option>'
                + '<option value="xlsx" swac_lang="Worldmap2d_RouteAnalytics.exportformat_xlsx">XLSX</option>'
                + '</select>'
                + '<button class="routeanalytics-export-button uk-button uk-button-default uk-button-small" type="button" swac_lang="Worldmap2d_RouteAnalytics.tableexportbtn">Export table</button>'
                + '</div>'
                + '</div>';
    }

    /**
     * Exports the visible point or route table.
     *
     * @returns {undefined}
     */
    exportTable() {
        let table = this.getExportTable();
        if (!TableExport.exportTable(table, this.getExportFilename(table), this.getExportFormat()))
            Msg.warn('RouteAnalytics', this.lang('tableexportempty', 'No table data is available for export.'), this.requestor);
    }

    /**
     * Gets the selected table export format.
     *
     * @returns {String} Export format
     */
    getExportFormat() {
        return this.menu.querySelector('.routeanalytics-export-format')?.value || 'csv';
    }

    /**
     * Gets the preferred visible table or the route summary table.
     *
     * @returns {HTMLTableElement|null} Table to export
     */
    getExportTable() {
        if (this.options.exportTableSelector) {
            let table = document.querySelector(this.options.exportTableSelector);
            if (this.isExportTableVisible(table))
                return table;
        }
        return this.summaryTarget?.querySelector('table.routeanalytics-table') || null;
    }

    /**
     * Checks whether a table belongs to the active map view.
     *
     * @param {HTMLTableElement|null} table Table to check
     * @returns {Boolean} True when the table is visible and contains rows
     */
    isExportTableVisible(table) {
        return table instanceof HTMLTableElement
                && !table.closest('[hidden]')
                && window.getComputedStyle(table).display !== 'none'
                && table.tBodies[0]?.rows.length > 0;
    }

    /**
     * Gets a filename based on the active map view and datasource.
     *
     * @returns {String} Download filename
     */
    getExportFilename(table) {
        let type = table?.id === this.getConfiguredTableId() ? 'route_points' : 'routes';
        return type + '_' + (this.map.options.fromName || 'data');
    }

    /**
     * Gets the id of the configured detail table.
     *
     * @returns {String|null} Table id
     */
    getConfiguredTableId() {
        if (!this.options.exportTableSelector?.startsWith('#'))
            return null;
        return this.options.exportTableSelector.substring(1);
    }

    /**
     * Loads markers that existed before plugin initialisation.
     */
    loadExistingMarkers() {
        for (let sourceName in this.map.markers) {
            for (let marker of this.map.markers[sourceName]) {
                if (!marker || !marker.feature?.set)
                    continue;
                this.addMarkerRow(marker.feature.set, marker);
            }
        }
    }

    /**
     * Adds a set to the route cache.
     *
     * @param {WatchableSet} set Dataset added
     */
    afterAddSet(set) {
        let marker = this.map.markers[set.swac_fromName]?.[set.id];
        this.addMarkerRow(set, marker);
        this.scheduleRender();
    }

    /**
     * Adds a marker row when it is not cached yet.
     *
     * @param {WatchableSet} set Dataset added
     * @param {Object} marker Leaflet marker
     */
    addMarkerRow(set, marker) {
        let position = this.getPositionFromMarker(marker);
        if (!marker || !position || this.hasRow(set))
            return;

        this.rows.push({
            set: set,
            marker: marker,
            position: position
        });
    }

    /**
     * Checks whether a set already exists in the route cache.
     *
     * @param {WatchableSet} set Dataset to check
     * @returns {Boolean} True if the set is already cached
     */
    hasRow(set) {
        return this.rows.some(row => row.set === set || (row.set.swac_fromName == set.swac_fromName && row.set.id == set.id));
    }

    /**
     * Removes a set from the route cache.
     *
     * @param {WatchableSet} set Dataset removed
     */
    afterRemoveSet(set) {
        this.rows = this.rows.filter(row => row.set !== set);
        this.scheduleRender(true);
    }

    /**
     * Schedules route rendering after burst data loading.
     *
     * @param {Boolean} fitBounds Fit map bounds after rendering
     */
    scheduleRender(fitBounds = false) {
        window.clearTimeout(this.renderTimer);
        this.renderTimer = window.setTimeout(() => {
            this.updateControls();
            this.render(fitBounds || (!this.hasFittedBounds && this.options.fitBoundsOnLoad));
        }, 250);
    }

    /**
     * Applies the current filter values.
     */
    applyFilter() {
        this.render(true);
    }

    /**
     * Clears all filter inputs.
     */
    resetFilter() {
        this.fromInput.value = '';
        this.toInput.value = '';
        this.routeSelect.value = '';
        this.attributeSelect.value = '';
        this.operatorSelect.value = 'gt';
        this.valueInput.value = '';
        this.healthSelect.value = '';
        this.fillDefaultAggregation();
        this.render(true);
    }

    /**
     * Sets the configured aggregation defaults.
     */
    fillDefaultAggregation() {
        let aggregation = this.options.defaultAggregation || {};
        this.aggregationAmountInput.value = Number(aggregation.amount) || 0;
        this.aggregationUnitSelect.value = aggregation.unit || 'minutes';
        this.aggregationTargetSelect.value = this.options.aggregationTarget;
    }

    /**
     * Reads the position from a Leaflet marker.
     *
     * @param {Object} marker Leaflet marker
     * @returns {Object|null} Position object
     */
    getPositionFromMarker(marker) {
        if (!marker || typeof marker.getLatLng !== 'function')
            return null;

        let latlng = marker.getLatLng();
        if (!latlng || !Number.isFinite(latlng.lat) || !Number.isFinite(latlng.lng))
            return null;

        let altitude = marker.feature?.geometry?.coordinates?.length > 2
                ? Number(marker.feature.geometry.coordinates[2])
                : null;

        return {
            lat: latlng.lat,
            lng: latlng.lng,
            altitude: Number.isFinite(altitude) ? altitude : null
        };
    }

    /**
     * Finds or creates the route summary container.
     *
     * @returns {HTMLElement} Summary target
     */
    findSummaryTarget() {
        if (this.options.summaryTarget) {
            let configuredTarget = document.querySelector(this.options.summaryTarget);
            if (configuredTarget)
                return configuredTarget;
        }

        let target = document.createElement('div');
        target.classList.add('routeanalytics-summary');
        this.requestor.parent.insertAdjacentElement('afterend', target);
        return target;
    }

    /**
     * Updates filter select boxes from the loaded data.
     */
    updateControls() {
        let groups = this.buildGroups(this.rows, false);
        let selectedRoute = this.routeSelect.value;
        this.routeSelect.replaceChildren(this.createOption('', this.lang('all_routes', 'All routes')));
        for (let group of groups.values()) {
            this.routeSelect.appendChild(this.createOption(group.key, group.name));
        }
        if ([...this.routeSelect.options].some(option => option.value == selectedRoute))
            this.routeSelect.value = selectedRoute;

        let selectedAttr = this.attributeSelect.value;
        let attrs = this.getNumericAttributes();
        this.attributeSelect.replaceChildren(this.createOption('', this.lang('no_attribute', 'No attribute filter')));
        for (let attr of attrs) {
            this.attributeSelect.appendChild(this.createOption(attr, attr));
        }
        if ([...this.attributeSelect.options].some(option => option.value == selectedAttr))
            this.attributeSelect.value = selectedAttr;
        else if (!selectedAttr && this.options.healthAttr && attrs.includes(this.options.healthAttr))
            this.attributeSelect.value = this.options.healthAttr;

        this.updateAvailableRange();
    }

    /**
     * Displays the available dataset time range.
     */
    updateAvailableRange() {
        let times = this.rows.map(row => this.getSetTime(row.set)).filter(time => time !== null);
        let block = this.menu.querySelector('.routeanalytics-available-block');
        let visible = !Array.isArray(this.visibleSections)
                || this.visibleSections.includes('filters')
                || this.visibleSections.includes('aggregation');
        if (!visible) {
            block.classList.add('swac_dontdisplay');
            return;
        }
        if (times.length == 0) {
            block.classList.add('swac_dontdisplay');
            return;
        }

        let min = Math.min(...times);
        let max = Math.max(...times);
        this.availableRange.textContent = this.formatDateTime(min)
                + this.lang('range_separator', ' to ') + this.formatDateTime(max);
        block.classList.remove('swac_dontdisplay');
    }

    /**
     * Redraws markers, route lines and summary information.
     *
     * @param {Boolean} fitBounds Fit the map to visible points
     */
    render(fitBounds = false) {
        let allGroups = this.buildGroups(this.rows, false);
        let mapGroups = this.buildGroups(this.rows, true, this.appliesAggregationTo('map'));
        let tableGroups = this.buildGroups(this.rows, true, this.appliesAggregationTo('table'));
        this.removeStaleHiddenRouteKeys(allGroups);
        if (mapGroups.size == 0 && !this.hasActiveFilter()) {
            if (this.options.ignoreUnnamedRoutesWithoutKey) {
                this.updateMarkerVisibility([]);
                this.markerFilterActive = this.rows.length > 0;
            } else {
                this.showAllMarkers();
                this.markerFilterActive = false;
            }
            this.drawRoutes(mapGroups);
            this.renderSummary(tableGroups, 0, 0);
            this.notifyRouteRender(tableGroups, [], mapGroups, tableGroups, allGroups);
            if (fitBounds && !this.options.ignoreUnnamedRoutesWithoutKey)
                this.fitBounds(this.rows);
            return;
        }

        let visibleMapGroups = this.getVisibleGroups(mapGroups);
        let visibleRows = this.getRowsFromGroups(visibleMapGroups);

        this.updateMarkerVisibility(visibleRows);
        this.markerFilterActive = this.hasActiveFilter() || visibleMapGroups.size != mapGroups.size;
        this.drawRoutes(visibleMapGroups);
        this.renderSummary(tableGroups, visibleRows.length, visibleMapGroups.size);
        this.notifyRouteRender(tableGroups, visibleRows, visibleMapGroups, tableGroups, allGroups);

        if (fitBounds)
            this.fitBounds(visibleRows);
    }

    /**
     * Checks if the filter form contains active filter values.
     *
     * @returns {Boolean} True if filtering is active
     */
    hasActiveFilter() {
        return this.fromInput.value !== ''
                || this.toInput.value !== ''
                || this.getAggregation() !== null
                || this.routeSelect.value !== ''
                || this.healthSelect.value !== ''
                || this.options.selectedRoute !== null
                || (this.attributeSelect.value !== '' && this.valueInput.value !== '');
    }

    /**
     * Builds route groups from rows and optional filters.
     *
     * @param {Array} rows Rows to group
     * @param {Boolean} applyFilters Apply current filter inputs
     * @param {Boolean} applyAggregation Apply the current aggregation
     * @returns {Map} Route groups
     */
    buildGroups(rows, applyFilters, applyAggregation = applyFilters) {
        let sortedRows = rows.slice().sort(this.compareRows.bind(this));
        let hasRouteAttributesBySource = this.getRouteAttributePresence(sortedRows);
        let groups = new Map();
        let segmentNumbers = new Map();
        let lastTimes = new Map();

        for (let row of sortedRows) {
            if (applyFilters && (!this.passesTimeFilter(row.set) || !this.passesPointFilter(row.set)))
                continue;

            let routeInfo = this.getRouteInfo(row, segmentNumbers, lastTimes, hasRouteAttributesBySource);
            if (!routeInfo)
                continue;
            if (!groups.has(routeInfo.key)) {
                groups.set(routeInfo.key, {
                    key: routeInfo.key,
                    name: routeInfo.name,
                    color: this.getRouteColor(groups.size),
                    connect: routeInfo.connect !== false,
                    isUnrouted: routeInfo.isUnrouted === true,
                    rows: []
                });
            }
            groups.get(routeInfo.key).rows.push(row);
        }

        for (let group of groups.values()) {
            if (applyAggregation)
                group.rows = this.aggregateRows(group.rows);
            group.stats = this.calculateStats(group.rows);
        }

        if (!applyFilters)
            return groups;

        let selectedRoute = this.routeSelect.value;
        let selectedHealth = this.healthSelect.value;
        for (let [key, group] of [...groups.entries()]) {
            if (selectedRoute && key != selectedRoute)
                groups.delete(key);
            else if (selectedHealth && group.stats.health != selectedHealth)
                groups.delete(key);
            else if (!this.matchesSelectedRoute(group))
                groups.delete(key);
        }

        return groups;
    }

    /**
     * Checks whether a group matches the configured route selection.
     *
     * @param {Object} group Route group
     * @returns {Boolean} True if the group is selected
     */
    matchesSelectedRoute(group) {
        let selection = this.options.selectedRoute;
        if (!selection || !group.rows || group.rows.length === 0)
            return true;

        let set = group.rows[0].set;
        if (Object.prototype.hasOwnProperty.call(selection, 'name')) {
            let name = this.getExplicitRouteName(set);
            if (selection.name !== name)
                return false;
        }

        let keyValues = selection.keyValues || {};
        for (let attr in keyValues) {
            let expected = keyValues[attr];
            let value = this.hasAttributeValue(set[attr]) ? String(set[attr]).trim() : null;
            if (value !== expected)
                return false;
        }
        return true;
    }

    /**
     * Checks the selected time range.
     *
     * @param {WatchableSet} set Set to check
     * @returns {Boolean} True if the set is inside the range
     */
    passesTimeFilter(set) {
        let time = this.getSetTime(set);
        let from = this.getInputTime(this.fromInput);
        let to = this.getInputTime(this.toInput);
        if (!from && !to)
            return true;
        if (time === null)
            return false;
        if (from && time < from.getTime())
            return false;
        if (to && time > to.getTime())
            return false;
        return true;
    }

    /**
     * Aggregates route rows into time intervals.
     *
     * @param {Array} rows Route rows
     * @returns {Array} Display rows
     */
    aggregateRows(rows) {
        let aggregation = this.getAggregation();
        if (!aggregation || rows.length == 0)
            return rows;

        let interval = this.getAggregationInterval(aggregation);
        let buckets = new Map();
        for (let row of rows) {
            let time = this.getSetTime(row.set);
            if (time === null)
                continue;
            let key = Math.floor(time / interval);
            if (!buckets.has(key))
                buckets.set(key, []);
            buckets.get(key).push(row);
        }

        let result = [];
        for (let bucket of buckets.values()) {
            let sets = bucket.map(row => row.set);
            let aggregatedSets = DataAggregation.aggregateSets(sets, this.options.tsAttr, aggregation);
            if (aggregatedSets.length == 0)
                continue;
            let representative = bucket[Math.floor((bucket.length - 1) / 2)];
            result.push({
                set: aggregatedSets[0],
                marker: representative.marker,
                position: representative.position
            });
        }
        return result;
    }

    /**
     * Reads the aggregation controls.
     *
     * @returns {Object|null} Aggregation settings
     */
    getAggregation() {
        let amount = Number(this.aggregationAmountInput.value);
        if (!Number.isFinite(amount) || amount <= 0)
            return null;
        return {
            amount: amount,
            unit: this.aggregationUnitSelect.value
        };
    }

    /**
     * Checks whether aggregation applies to one display target.
     *
     * @param {String} target Display target
     * @returns {Boolean} True when aggregation applies
     */
    appliesAggregationTo(target) {
        let aggregationTarget = this.aggregationTargetSelect?.value || this.options.aggregationTarget;
        return aggregationTarget === 'both' || aggregationTarget === target;
    }

    /**
     * Gets the aggregation interval in milliseconds.
     *
     * @param {Object} aggregation Aggregation settings
     * @returns {Number} Interval in milliseconds
     */
    getAggregationInterval(aggregation) {
        let unitMs = {
            seconds: 1000,
            minutes: 60000,
            hours: 3600000,
            days: 86400000
        };
        return aggregation.amount * unitMs[aggregation.unit];
    }

    /**
     * Reads a datetime input.
     *
     * @param {HTMLInputElement} input Datetime input
     * @returns {Date|null} Parsed date
     */
    getInputTime(input) {
        if (!input.value)
            return null;
        let date = new Date(input.value);
        return Number.isFinite(date.getTime()) ? date : null;
    }

    /**
     * Gets the route key and name for a row.
     *
     * @param {Object} row Cached row
     * @param {Map} segmentNumbers Segment number per datasource
     * @param {Map} lastTimes Last timestamp per datasource
     * @param {Map} hasRouteAttributesBySource Route attribute presence per datasource
     * @returns {Object} Route key and route name
     */
    getRouteInfo(row, segmentNumbers, lastTimes, hasRouteAttributesBySource) {
        let explicitName = this.getExplicitRouteName(row.set);
        let routeKeyParts = this.getRouteKeyParts(row.set);
        if (explicitName) {
            return {
                key: [row.set.swac_fromName, explicitName, ...routeKeyParts].join(':'),
                name: routeKeyParts.length > 0 ? explicitName + ' (' + routeKeyParts.join(', ') + ')' : explicitName
            };
        }

        let sourceName = row.set.swac_fromName || 'data';
        if (this.options.groupUnroutedPoints && routeKeyParts.length == 0) {
            return {
                key: sourceName + ':unrouted',
                name: this.lang('unrouted_points', 'Values without route'),
                connect: false,
                isUnrouted: true
            };
        }

        if (this.shouldGroupBySource(row.set, hasRouteAttributesBySource)) {
            return {
                key: sourceName + ':source',
                name: sourceName
            };
        }

        if (this.options.ignoreUnnamedRoutesWithoutKey && routeKeyParts.length == 0)
            return null;

        if (routeKeyParts.length > 0) {
            return {
                key: [sourceName, 'unnamed', ...routeKeyParts].join(':'),
                name: this.lang('unnamed_route', 'Unnamed route')
            };
        }

        if (!this.options.splitUnnamedRoutesByTimeGap) {
            return {
                key: sourceName + ':unnamed',
                name: this.lang('unnamed_route', 'Unnamed route')
            };
        }

        let segmentNumber = segmentNumbers.get(sourceName) || 1;
        let currentTime = this.getSetTime(row.set);
        let lastTime = lastTimes.get(sourceName);
        if (this.options.splitByTimeGapMinutes && currentTime && lastTime) {
            let gapMinutes = Math.abs(currentTime - lastTime) / 60000;
            if (gapMinutes > this.options.splitByTimeGapMinutes)
                segmentNumber++;
        }
        segmentNumbers.set(sourceName, segmentNumber);
        if (currentTime)
            lastTimes.set(sourceName, currentTime);

        return {
            key: sourceName + ':segment:' + segmentNumber,
            name: this.lang('route_prefix', 'Route') + ' ' + segmentNumber
        };
    }

    /**
     * Gets the first configured route attribute with a value.
     *
     * @param {WatchableSet} set Set to read
     * @returns {String|null} Route name
     */
    getExplicitRouteName(set) {
        if (this.hasAttributeValue(set[this.options.routeAttr]))
            return String(set[this.options.routeAttr]).trim();

        for (let attr of this.options.routeFallbackAttrs) {
            if (this.hasAttributeValue(set[attr]))
                return String(set[attr]).trim();
        }
        return null;
    }

    /**
     * Checks which datasources contain configured route attributes.
     *
     * @param {Array} rows Route rows
     * @returns {Map} Route attribute presence per datasource
     */
    getRouteAttributePresence(rows) {
        let attrs = this.getConfiguredRouteAttributes();
        let hasAttributesBySource = new Map();
        for (let row of rows) {
            let sourceName = row.set.swac_fromName || 'data';
            if (!hasAttributesBySource.has(sourceName))
                hasAttributesBySource.set(sourceName, false);
            if (hasAttributesBySource.get(sourceName))
                continue;

            for (let attr of attrs) {
                if (Object.prototype.hasOwnProperty.call(row.set, attr)) {
                    hasAttributesBySource.set(sourceName, true);
                    break;
                }
            }
        }
        return hasAttributesBySource;
    }

    /**
     * Checks if a datasource should be grouped as one route.
     *
     * @param {WatchableSet} set Set to check
     * @param {Map} hasRouteAttributesBySource Route attribute presence per datasource
     * @returns {Boolean} True if datasource fallback can be used
     */
    shouldGroupBySource(set, hasRouteAttributesBySource) {
        if (!this.options.groupBySourceWhenRouteAttrsMissing)
            return false;

        if (this.getConfiguredRouteAttributes().length == 0)
            return false;

        let sourceName = set.swac_fromName || 'data';
        return hasRouteAttributesBySource.get(sourceName) === false;
    }

    /**
     * Gets configured attributes used for route grouping.
     *
     * @returns {Array} Attribute names
     */
    getConfiguredRouteAttributes() {
        let attrs = [];
        if (this.options.routeAttr)
            attrs.push(this.options.routeAttr);
        attrs.push(...this.options.routeFallbackAttrs);
        attrs.push(...this.options.routeKeyAttrs);
        return [...new Set(attrs.filter(attr => attr))];
    }

    /**
     * Gets additional values that make a route key unique.
     *
     * @param {WatchableSet} set Set to read
     * @returns {Array} Route key values
     */
    getRouteKeyParts(set) {
        let keyParts = [];
        for (let attr of this.options.routeKeyAttrs) {
            if (this.hasAttributeValue(set[attr]))
                keyParts.push(String(set[attr]).trim());
        }
        return keyParts;
    }

    /**
     * Checks if a dataset attribute contains a usable value.
     *
     * @param {Object} value Attribute value
     * @returns {Boolean} True if the value can be used
     */
    hasAttributeValue(value) {
        if (typeof value === 'undefined' || value === null)
            return false;

        let stringValue = String(value).trim();
        return stringValue !== '' && stringValue.toLowerCase() !== 'null';
    }

    /**
     * Checks the numeric point filter.
     *
     * @param {WatchableSet} set Set to check
     * @returns {Boolean} True if the point should stay visible
     */
    passesPointFilter(set) {
        let attr = this.attributeSelect.value;
        if (!attr || this.valueInput.value === '')
            return true;

        let value = this.getNumericValue(set[attr]);
        let filterValue = this.getNumericValue(this.valueInput.value);
        if (value === null || filterValue === null)
            return false;

        switch (this.operatorSelect.value) {
            case 'lt':
                return value < filterValue;
            case 'lte':
                return value <= filterValue;
            case 'eq':
                return Math.abs(value - filterValue) < 0.000001;
            case 'gte':
                return value >= filterValue;
            case 'gt':
            default:
                return value > filterValue;
        }
    }

    /**
     * Shows only markers that match the current filters.
     *
     * @param {Array} visibleRows Rows to show
     */
    updateMarkerVisibility(visibleRows) {
        for (let row of this.rows) {
            if (row.marker?.feature)
                row.marker.feature.set = row.set;
        }

        let sourceNames = new Set(this.rows.map(row => row.set.swac_fromName));
        for (let sourceName of sourceNames) {
            if (this.map.overlayLayers[sourceName])
                this.map.overlayLayers[sourceName].clearLayers();
        }

        for (let row of visibleRows) {
            let sourceName = row.set.swac_fromName;
            if (row.marker?.feature)
                row.marker.feature.set = row.set;
            if (this.map.overlayLayers[sourceName])
                this.map.overlayLayers[sourceName].addLayer(row.marker);
        }
    }

    /**
     * Restores all cached markers to their overlay layers.
     */
    showAllMarkers() {
        for (let row of this.rows) {
            if (row.marker?.feature)
                row.marker.feature.set = row.set;
        }

        let sourceNames = new Set(this.rows.map(row => row.set.swac_fromName));
        for (let sourceName of sourceNames) {
            if (this.map.overlayLayers[sourceName])
                this.map.overlayLayers[sourceName].clearLayers();
        }

        for (let row of this.rows) {
            let sourceName = row.set.swac_fromName;
            if (this.map.overlayLayers[sourceName])
                this.map.overlayLayers[sourceName].addLayer(row.marker);
        }
    }

    /**
     * Removes hidden route keys that no longer exist in the current result.
     *
     * @param {Map} groups Current route groups
     */
    removeStaleHiddenRouteKeys(groups) {
        for (let routeKey of [...this.hiddenRouteKeys]) {
            if (!groups.has(routeKey))
                this.hiddenRouteKeys.delete(routeKey);
        }
    }

    /**
     * Gets route groups that are enabled for map display.
     *
     * @param {Map} groups Current route groups
     * @returns {Map} Visible route groups
     */
    getVisibleGroups(groups) {
        let visibleGroups = new Map();
        for (let [key, group] of groups.entries()) {
            if (!this.hiddenRouteKeys.has(key))
                visibleGroups.set(key, group);
        }
        return visibleGroups;
    }

    /**
     * Gets all rows from the given route groups.
     *
     * @param {Map} groups Route groups
     * @returns {Array} Rows inside route groups
     */
    getRowsFromGroups(groups) {
        let rows = [];
        for (let group of groups.values()) {
            rows.push(...group.rows);
        }
        return rows;
    }

    /**
     * Sets whether a route is visible on the map.
     *
     * @param {String} routeKey Route group key
     * @param {Boolean} visible Visibility state
     */
    setRouteVisibility(routeKey, visible) {
        if (visible)
            this.hiddenRouteKeys.delete(routeKey);
        else
            this.hiddenRouteKeys.add(routeKey);
        this.render(false);
    }

    /**
     * Sets visibility for a list of route keys.
     *
     * @param {Array} routeKeys Route group keys
     * @param {Boolean} visible Visibility state
     */
    setAllRouteVisibility(routeKeys, visible) {
        for (let routeKey of routeKeys) {
            if (visible)
                this.hiddenRouteKeys.delete(routeKey);
            else
                this.hiddenRouteKeys.add(routeKey);
        }
        this.render(false);
    }

    /**
     * Draws route lines for all visible route groups.
     *
     * @param {Map} groups Visible route groups
     */
    drawRoutes(groups) {
        this.routeLayer.clearLayers();
        for (let group of groups.values()) {
            if (group.connect === false || group.rows.length < 2)
                continue;

            let points = group.rows.map(row => [row.position.lat, row.position.lng]);
            L.polyline(points, {
                color: group.color,
                weight: this.options.segmentColorAttr ? 5 : 4,
                opacity: 0.85,
                interactive: false
            }).addTo(this.routeLayer);

            this.drawRouteSegments(group);
        }
    }

    /**
     * Draws colored route segments from adjacent route points.
     *
     * @param {Object} group Route group
     * @returns {undefined}
     */
    drawRouteSegments(group) {
        if (!this.options.segmentColorAttr)
            return;

        for (let index = 1; index < group.rows.length; index++) {
            let previousRow = group.rows[index - 1];
            let currentRow = group.rows[index];
            let color = this.getSegmentColor(previousRow.set, currentRow.set);
            if (!color)
                continue;

            L.polyline([
                [previousRow.position.lat, previousRow.position.lng],
                [currentRow.position.lat, currentRow.position.lng]
            ], {
                color: color,
                weight: 4,
                opacity: 1,
                interactive: false
            }).addTo(this.routeLayer);
        }
    }

    /**
     * Gets the color for a route segment from its endpoint values.
     *
     * @param {Object} previousSet Previous dataset
     * @param {Object} currentSet Current dataset
     * @returns {String|null} Segment color
     */
    getSegmentColor(previousSet, currentSet) {
        let attr = this.options.segmentColorAttr;
        let values = [
            this.getNumericValue(previousSet[attr]),
            this.getNumericValue(currentSet[attr])
        ].filter(value => value !== null);
        if (values.length == 0)
            return null;

        let value = this.options.segmentColorMode == 'average'
                ? values.reduce((sum, current) => sum + current, 0) / values.length
                : Math.max(...values);
        let thresholds = this.options.segmentColorThresholds || this.getHealthThresholds(attr);
        if (value <= thresholds.good)
            return this.options.segmentColors.good;
        if (value <= thresholds.medium)
            return this.options.segmentColors.medium;
        return this.options.segmentColors.bad;
    }

    /**
     * Renders route summary information below or next to the map.
     *
     * @param {Map} groups Visible route groups
     * @param {Number} visiblePointCount Number of visible points
     * @param {Number} visibleRouteCount Number of visible routes
     */
    renderSummary(groups, visiblePointCount, visibleRouteCount) {
        if (!this.summaryTarget)
            return;

        this.summaryTarget.classList.add('routeanalytics-summary');
        this.summaryTarget.replaceChildren();

        let header = document.createElement('div');
        header.classList.add('routeanalytics-summary-header');

        let title = document.createElement('h3');
        title.textContent = this.lang('summary_title', 'Routes');
        header.appendChild(title);

        let meta = document.createElement('span');
        meta.textContent = visibleRouteCount + ' ' + this.lang('routes_visible', 'routes visible')
                + ', ' + visiblePointCount + ' ' + this.lang('points', 'points');
        header.appendChild(meta);
        this.summaryTarget.appendChild(header);

        if (groups.size == 0) {
            let emptyInfo = document.createElement('p');
            emptyInfo.classList.add('routeanalytics-empty');
            emptyInfo.textContent = this.lang('no_routes', 'No matching routes found.');
            this.summaryTarget.appendChild(emptyInfo);
            return;
        }

        let healthiest = this.getHealthiestGroup(groups);
        if (healthiest) {
            let info = document.createElement('p');
            info.classList.add('routeanalytics-healthiest');
            let routeName = this.getExplicitRouteName(healthiest.rows[0]?.set) || healthiest.name;
            info.textContent = this.lang('healthiest_route', 'Healthiest route') + ': ' + routeName;
            this.summaryTarget.appendChild(info);
        }

        this.summaryTarget.appendChild(this.createSummaryTable(groups, healthiest?.key));
    }

    /**
     * Notifies page code about the rendered route groups.
     *
     * @param {Map} groups Table route groups
     * @param {Array} visibleRows Visible route rows
     * @param {Map} visibleGroups Visible map route groups
     * @param {Map} tableGroups Filtered table route groups
     * @param {Map} allGroups Unfiltered route groups
     * @returns {undefined}
     */
    notifyRouteRender(groups, visibleRows, visibleGroups, tableGroups, allGroups) {
        if (typeof this.options.onRouteRender === 'function') {
            this.options.onRouteRender(groups, {
                plugin: this,
                visibleRows: visibleRows,
                visibleGroups: visibleGroups,
                tableGroups: tableGroups,
                allGroups: allGroups
            });
        }
    }

    /**
     * Creates the route summary table.
     *
     * @param {Map} groups Visible route groups
     * @param {String} healthiestKey Route key of the healthiest group
     * @returns {HTMLElement} Table container
     */
    createSummaryTable(groups, healthiestKey) {
        let averageAttrs = this.getSummaryAverageAttrs(groups);
        let wrapper = document.createElement('div');
        wrapper.classList.add('routeanalytics-table-wrapper');

        let search = document.createElement('input');
        search.classList.add('uk-input', 'uk-form-small', 'routeanalytics-search');
        search.type = 'search';
        search.placeholder = this.lang('search', 'Search routes');
        wrapper.appendChild(search);

        let table = document.createElement('table');
        table.classList.add('uk-table', 'uk-table-divider', 'uk-table-striped', 'routeanalytics-table');
        wrapper.appendChild(table);

        table.appendChild(this.createSummaryTableHead(averageAttrs, groups));
        let body = document.createElement('tbody');
        for (let group of groups.values()) {
            body.appendChild(this.createSummaryTableRow(group, averageAttrs, group.key == healthiestKey));
        }
        table.appendChild(body);

        search.addEventListener('input', () => this.filterSummaryTable(table, search.value));
        for (let input of table.querySelectorAll('.routeanalytics-column-search')) {
            input.addEventListener('click', (e) => e.stopPropagation());
            input.addEventListener('input', () => this.filterSummaryTable(table, search.value));
        }
        return wrapper;
    }

    /**
     * Creates the summary table header.
     *
     * @param {Array} averageAttrs Average attribute names
     * @param {Map} groups Current route groups
     * @returns {HTMLTableSectionElement} Table head
     */
    createSummaryTableHead(averageAttrs, groups) {
        let head = document.createElement('thead');
        let labelRow = document.createElement('tr');
        let filterRow = document.createElement('tr');
        let columns = [
            ['visible', this.lang('visible', 'Visible')],
            ['route', this.lang('route', 'Route')],
            ['points', this.lang('points', 'Points')],
            ['start', this.lang('start', 'Start')],
            ['duration', this.lang('duration', 'Duration')],
            ['distance', this.lang('distance', 'Distance')],
            ['elevation', this.lang('elevation_gain', 'Elevation gain')],
            ['health', this.lang('health', 'Health')]
        ];
        for (let attr of averageAttrs) {
            columns.push(['average_' + attr, this.lang('average', 'Average') + ' ' + attr]);
        }

        for (let column of columns) {
            let cell = document.createElement('th');
            cell.dataset.sortKey = column[0];
            if (column[0] == 'visible')
                cell.dataset.tableExportSkip = 'true';
            cell.tabIndex = 0;
            let label = document.createElement('span');
            label.classList.add('routeanalytics-column-label');
            label.textContent = this.getColumnName(column[0], column[1]);
            cell.appendChild(label);
            if (column[0] == 'visible')
                cell.appendChild(this.createToggleAllCheckbox(groups));
            this.addColumnRenameControl(cell, column[0], () => this.render(false));
            cell.addEventListener('click', () => this.sortSummaryTable(cell));
            cell.addEventListener('keypress', (e) => {
                if (e.key == 'Enter')
                    this.sortSummaryTable(cell);
            });
            labelRow.appendChild(cell);

            let filterCell = document.createElement('th');
            let input = document.createElement('input');
            input.classList.add('uk-input', 'uk-form-small', 'routeanalytics-column-search');
            input.type = 'search';
            input.dataset.columnIndex = labelRow.cells.length - 1;
            input.placeholder = column[1];
            filterCell.appendChild(input);
            filterRow.appendChild(filterCell);
        }
        head.appendChild(labelRow);
        head.appendChild(filterRow);
        return head;
    }

    /**
     * Creates a checkbox to toggle all route rows.
     *
     * @param {Map} groups Current route groups
     * @returns {HTMLInputElement} Toggle checkbox
     */
    createToggleAllCheckbox(groups) {
        let routeKeys = [...groups.keys()];
        let checkbox = document.createElement('input');
        checkbox.classList.add('uk-checkbox', 'routeanalytics-toggle-all');
        checkbox.type = 'checkbox';
        checkbox.title = this.lang('toggle_all_routes', 'Toggle all routes');

        let hiddenCount = routeKeys.filter(routeKey => this.hiddenRouteKeys.has(routeKey)).length;
        checkbox.checked = hiddenCount == 0;
        checkbox.indeterminate = hiddenCount > 0 && hiddenCount < routeKeys.length;
        checkbox.addEventListener('click', (e) => e.stopPropagation());
        checkbox.addEventListener('change', () => this.setAllRouteVisibility(routeKeys, checkbox.checked));
        return checkbox;
    }

    /**
     * Creates one summary table row.
     *
     * @param {Object} group Route group
     * @param {Array} averageAttrs Average attribute names
     * @param {Boolean} isHealthiest True if row shows the healthiest route
     * @returns {HTMLTableRowElement} Table row
     */
    createSummaryTableRow(group, averageAttrs, isHealthiest) {
        let row = document.createElement('tr');
        let healthLabel = this.getHealthLabel(group.stats.health);
        if (isHealthiest)
            row.classList.add('routeanalytics-healthiest-row');

        row.appendChild(this.createRouteVisibilityCell(group));

        let routeCell = this.createSummaryCell('', group.name);
        let routeLabel = document.createElement('span');
        routeLabel.classList.add('routeanalytics-route-label');
        let swatch = document.createElement('span');
        swatch.classList.add('routeanalytics-route-color');
        swatch.style.backgroundColor = group.color;
        routeLabel.appendChild(swatch);
        routeLabel.appendChild(document.createTextNode(group.name));
        routeCell.appendChild(routeLabel);
        routeCell.classList.add('routeanalytics-route-selectable');
        routeCell.tabIndex = 0;
        routeCell.addEventListener('click', () => this.selectRoute(group));
        routeCell.addEventListener('keypress', (event) => {
            if (event.key === 'Enter')
                this.selectRoute(group);
        });
        row.appendChild(routeCell);

        row.appendChild(this.createSummaryCell(group.stats.pointCount, group.stats.pointCount));
        row.appendChild(this.createSummaryCell(this.formatDateTime(group.stats.startTime), group.stats.startTime));
        row.appendChild(this.createSummaryCell(group.isUnrouted
                ? this.lang('not_available', 'n/a') : this.formatDuration(group.stats.durationMinutes), group.stats.durationMinutes));
        row.appendChild(this.createSummaryCell(group.isUnrouted
                ? this.lang('not_available', 'n/a') : this.formatNumber(group.stats.distanceKm, 2) + ' km', group.stats.distanceKm));
        row.appendChild(this.createSummaryCell(group.isUnrouted
                ? this.lang('not_available', 'n/a') : this.formatNumber(group.stats.elevationGain, 0) + ' m', group.stats.elevationGain));
        row.appendChild(this.createSummaryCell(group.isUnrouted
                ? this.lang('not_available', 'n/a') : healthLabel,
                group.isUnrouted ? '' : group.stats.healthSortValue));

        for (let attr of averageAttrs) {
            let value = group.stats.averageValues.get(attr);
            row.appendChild(this.createSummaryCell(this.formatNumber(value, 3), value));
        }

        row.dataset.search = [...row.cells].map(cell => cell.textContent).join(' ').toLowerCase();
        return row;
    }

    /**
     * Selects a route through the configured callback or shared event.
     *
     * @param {Object} group Selected route group
     * @returns {undefined}
     */
    selectRoute(group) {
        let selection = this.getRouteSelection(group);
        if (typeof this.options.onRouteSelect === 'function') {
            this.options.onRouteSelect(group, selection, this);
            return;
        }
        document.dispatchEvent(new CustomEvent('swac_' + this.requestor.id + '_route_selected', {
            detail: {
                group: group,
                selection: selection,
                plugin: this
            }
        }));
    }

    /**
     * Gets the configured attribute values for one route group.
     *
     * @param {Object} group Route group
     * @returns {Object|null} Route selection or null
     */
    getRouteSelection(group) {
        if (!group.rows || group.rows.length === 0)
            return null;
        let set = group.rows[0].set;
        let selection = {
            name: this.getExplicitRouteName(set),
            keyValues: {}
        };
        for (let attr of this.options.routeKeyAttrs) {
            selection.keyValues[attr] = this.hasAttributeValue(set[attr])
                    ? String(set[attr]).trim() : null;
        }
        return selection;
    }

    /**
     * Creates the route visibility checkbox cell.
     *
     * @param {Object} group Route group
     * @returns {HTMLTableCellElement} Table cell
     */
    createRouteVisibilityCell(group) {
        let cell = document.createElement('td');
        cell.dataset.tableExportSkip = 'true';
        let checkbox = document.createElement('input');
        checkbox.classList.add('uk-checkbox');
        checkbox.type = 'checkbox';
        checkbox.checked = !this.hiddenRouteKeys.has(group.key);
        checkbox.title = this.lang('visible', 'Visible');
        checkbox.addEventListener('click', (event) => event.stopPropagation());
        checkbox.addEventListener('change', () => this.setRouteVisibility(group.key, checkbox.checked));
        cell.appendChild(checkbox);
        cell.dataset.sortValue = checkbox.checked ? 1 : 0;
        cell.dataset.searchValue = checkbox.checked ? this.lang('yes', 'yes') : this.lang('no', 'no');
        return cell;
    }

    /**
     * Creates one summary table cell.
     *
     * @param {String|Number} text Display value
     * @param {String|Number} sortValue Sort value
     * @returns {HTMLTableCellElement} Table cell
     */
    createSummaryCell(text, sortValue) {
        let cell = document.createElement('td');
        cell.textContent = text;
        cell.dataset.sortValue = sortValue;
        cell.dataset.searchValue = text;
        return cell;
    }

    /**
     * Gets the stored label for one table column.
     *
     * @param {String} column Column identifier
     * @param {String} fallback Default column label
     * @returns {String} Visible column label
     */
    getColumnName(column, fallback) {
        return this.columnNames[column] || fallback;
    }

    /**
     * Adds a column rename action to one table header.
     *
     * @param {HTMLTableCellElement} cell Table header cell
     * @param {String} column Column identifier
     * @param {Function} onRename Function called after renaming
     * @returns {undefined}
     */
    addColumnRenameControl(cell, column, onRename) {
        let icon = document.createElement('a');
        icon.href = '#';
        icon.classList.add('routeanalytics-rename-icon');
        icon.title = this.lang('rename_column', 'Rename column');
        icon.setAttribute('aria-label', icon.title);
        icon.innerHTML = '<span uk-icon="icon: pencil; ratio: 0.6"></span>';
        icon.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            this.renameColumn(column, onRename);
        });
        cell.appendChild(icon);
    }

    /**
     * Renames one table column and stores the label locally.
     *
     * @param {String} column Column identifier
     * @param {Function} onRename Function called after renaming
     * @returns {undefined}
     */
    renameColumn(column, onRename) {
        let current = this.getColumnName(column, column);
        let name = window.prompt(this.lang('rename_prompt', 'New column name'), current);
        if (name === null)
            return;

        name = name.trim();
        if (!name || name === column)
            delete this.columnNames[column];
        else
            this.columnNames[column] = name;
        this.saveColumnNames();
        onRename();
    }

    /**
     * Loads stored route table column names.
     *
     * @returns {Object} Column names by identifier
     */
    loadColumnNames() {
        try {
            return JSON.parse(localStorage.getItem('swac_routeanalytics_column_names')) || {};
        } catch (error) {
            return {};
        }
    }

    /**
     * Stores route table column names.
     *
     * @returns {undefined}
     */
    saveColumnNames() {
        try {
            localStorage.setItem('swac_routeanalytics_column_names', JSON.stringify(this.columnNames));
        } catch (error) {
            // Keep the current labels when browser storage is unavailable.
        }
    }

    /**
     * Gets all average columns used by the visible routes.
     *
     * @param {Map} groups Visible route groups
     * @returns {Array} Average attribute names
     */
    getSummaryAverageAttrs(groups) {
        let attrs = [];
        for (let group of groups.values()) {
            for (let attr of group.stats.averageValues.keys()) {
                if (!attrs.includes(attr))
                    attrs.push(attr);
            }
        }
        return attrs;
    }

    /**
     * Filters visible summary table rows.
     *
     * @param {HTMLTableElement} table Summary table
     * @param {String} search Search value
     */
    filterSummaryTable(table, search) {
        let value = search.trim().toLowerCase();
        let columnFilters = [...table.querySelectorAll('.routeanalytics-column-search')]
                .map(input => ({
                    index: Number(input.dataset.columnIndex),
                    value: input.value.trim().toLowerCase()
                }))
                .filter(filter => filter.value !== '');

        for (let row of table.tBodies[0].rows) {
            let matchesGlobal = value === '' || row.dataset.search.includes(value);
            let matchesColumns = columnFilters.every(filter => {
                let cell = row.cells[filter.index];
                let cellValue = String(cell?.dataset.searchValue || cell?.textContent || '').toLowerCase();
                return cellValue.includes(filter.value);
            });
            row.hidden = !matchesGlobal || !matchesColumns;
        }
    }

    /**
     * Sorts the summary table by a column.
     *
     * @param {HTMLTableCellElement} header Header cell
     */
    sortSummaryTable(header) {
        let table = header.closest('table');
        let direction = header.dataset.sortDirection == 'asc' ? 'desc' : 'asc';
        for (let curHeader of table.tHead.rows[0].cells) {
            curHeader.removeAttribute('data-sort-direction');
        }
        header.dataset.sortDirection = direction;

        let index = header.cellIndex;
        let rows = [...table.tBodies[0].rows];
        rows.sort((rowA, rowB) => this.compareSummaryCells(rowA.cells[index], rowB.cells[index], direction));
        table.tBodies[0].replaceChildren(...rows);
    }

    /**
     * Compares two summary table cells.
     *
     * @param {HTMLTableCellElement} cellA First cell
     * @param {HTMLTableCellElement} cellB Second cell
     * @param {String} direction Sort direction
     * @returns {Number} Sort result
     */
    compareSummaryCells(cellA, cellB, direction) {
        let valueA = cellA.dataset.sortValue;
        let valueB = cellB.dataset.sortValue;
        let numberA = Number(valueA);
        let numberB = Number(valueB);
        let result = Number.isFinite(numberA) && Number.isFinite(numberB)
                ? numberA - numberB
                : String(valueA).localeCompare(String(valueB));
        return direction == 'asc' ? result : -result;
    }

    /**
     * Calculates route statistics.
     *
     * @param {Array} rows Route rows
     * @returns {Object} Route statistics
     */
    calculateStats(rows) {
        let averageAttrs = this.getAverageAttributes();
        let averageValues = new Map();
        for (let attr of averageAttrs) {
            averageValues.set(attr, this.average(rows, attr));
        }

        let healthRating = this.getRouteHealth(averageValues);
        let startTime = rows.length > 0 ? this.getSetTime(rows[0].set) : null;
        let endTime = rows.length > 0 ? this.getSetTime(rows[rows.length - 1].set) : null;
        return {
            pointCount: rows.length,
            distanceKm: this.calculateDistance(rows),
            elevationGain: this.calculateElevationGain(rows),
            averageValues: averageValues,
            healthAverage: healthRating.average,
            healthScore: healthRating.score,
            healthSortValue: healthRating.sortValue,
            health: healthRating.health,
            startTime: startTime,
            endTime: endTime,
            durationMinutes: startTime !== null && endTime !== null
                    ? (endTime - startTime) / 60000 : null
        };
    }

    /**
     * Gets configured attributes that can be averaged.
     *
     * @returns {Array} Numeric attribute names
     */
    getAverageAttributes() {
        let attrs = [];
        if (Array.isArray(this.options.healthAttrs))
            attrs.push(...this.options.healthAttrs);
        if (this.options.healthAttr)
            attrs.push(this.options.healthAttr);
        attrs.push(...this.options.valueAttrs);
        return [...new Set(attrs)].filter(attr => this.rows.some(row => this.getNumericValue(row.set[attr]) !== null));
    }

    /**
     * Calculates the average value of an attribute.
     *
     * @param {Array} rows Route rows
     * @param {String} attr Attribute name
     * @returns {Number|null} Average value
     */
    average(rows, attr) {
        let values = rows.map(row => this.getNumericValue(row.set[attr])).filter(value => value !== null);
        if (values.length == 0)
            return null;

        return values.reduce((sum, value) => sum + value, 0) / values.length;
    }

    /**
     * Calculates route distance with the haversine formula.
     *
     * @param {Array} rows Ordered route rows
     * @returns {Number} Distance in kilometers
     */
    calculateDistance(rows) {
        let distance = 0;
        for (let i = 1; i < rows.length; i++) {
            distance += this.distanceBetween(rows[i - 1].position, rows[i].position);
        }
        return distance;
    }

    /**
     * Calculates positive altitude differences.
     *
     * @param {Array} rows Ordered route rows
     * @returns {Number} Elevation gain in meters
     */
    calculateElevationGain(rows) {
        let elevationGain = 0;
        for (let i = 1; i < rows.length; i++) {
            let previousAltitude = this.getAltitude(rows[i - 1]);
            let currentAltitude = this.getAltitude(rows[i]);
            if (previousAltitude === null || currentAltitude === null)
                continue;

            let difference = currentAltitude - previousAltitude;
            if (difference > 0)
                elevationGain += difference;
        }
        return elevationGain;
    }

    /**
     * Gets the altitude for a row.
     *
     * @param {Object} row Cached row
     * @returns {Number|null} Altitude in meters
     */
    getAltitude(row) {
        if (this.options.altitudeAttr && Number.isFinite(Number(row.set[this.options.altitudeAttr])))
            return Number(row.set[this.options.altitudeAttr]);
        if (row.position.altitude !== null)
            return row.position.altitude;
        return null;
    }

    /**
     * Calculates the distance between two points.
     *
     * @param {Object} pointA First position
     * @param {Object} pointB Second position
     * @returns {Number} Distance in kilometers
     */
    distanceBetween(pointA, pointB) {
        let earthRadiusKm = 6371;
        let latDelta = this.toRadians(pointB.lat - pointA.lat);
        let lngDelta = this.toRadians(pointB.lng - pointA.lng);
        let latA = this.toRadians(pointA.lat);
        let latB = this.toRadians(pointB.lat);
        let value = Math.sin(latDelta / 2) * Math.sin(latDelta / 2)
                + Math.cos(latA) * Math.cos(latB)
                * Math.sin(lngDelta / 2) * Math.sin(lngDelta / 2);

        return earthRadiusKm * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
    }

    /**
     * Converts degrees to radians.
     *
     * @param {Number} degrees Degrees
     * @returns {Number} Radians
     */
    toRadians(degrees) {
        return degrees * Math.PI / 180;
    }

    /**
     * Gets the route health rating from configured averages.
     *
     * @param {Map} averageValues Average values by attribute
     * @returns {Object} Health rating
     */
    getRouteHealth(averageValues) {
        let rating = {
            health: 'unknown',
            sortValue: 3,
            average: null,
            score: null
        };
        let attrs = this.getHealthAttributes();
        for (let attr of attrs) {
            let averageValue = averageValues.get(attr);
            if (!Number.isFinite(averageValue))
                continue;

            let health = this.getHealth(averageValue, attr);
            let sortValue = this.getHealthSortValue(health);
            let thresholds = this.getHealthThresholds(attr);
            let score = averageValue / thresholds.medium;
            if (rating.score === null || sortValue > rating.sortValue || (sortValue == rating.sortValue && score > rating.score)) {
                rating.health = health;
                rating.sortValue = sortValue;
                rating.average = averageValue;
                rating.score = score;
            }
        }
        return rating;
    }

    /**
     * Gets configured health attributes.
     *
     * @returns {Array} Health attribute names
     */
    getHealthAttributes() {
        let attrs = [];
        if (Array.isArray(this.options.healthAttrs))
            attrs.push(...this.options.healthAttrs);
        if (this.options.healthAttr)
            attrs.push(this.options.healthAttr);
        return [...new Set(attrs)];
    }

    /**
     * Gets the health rating from the configured attribute average.
     *
     * @param {Number|null} averageValue Average value
     * @param {String} attr Attribute name
     * @returns {String} Health key
     */
    getHealth(averageValue, attr) {
        if (!Number.isFinite(averageValue))
            return 'unknown';
        let thresholds = this.getHealthThresholds(attr);
        if (averageValue <= thresholds.good)
            return 'good';
        if (averageValue <= thresholds.medium)
            return 'medium';
        return 'bad';
    }

    /**
     * Gets the configured health thresholds for an attribute.
     *
     * @param {String} attr Attribute name
     * @returns {Object} Health thresholds
     */
    getHealthThresholds(attr) {
        return this.options.healthThresholdsByAttr[attr] || this.options.healthThresholds;
    }

    /**
     * Gets a sortable value for a health key.
     *
     * @param {String} health Health key
     * @returns {Number} Sort value
     */
    getHealthSortValue(health) {
        let order = {
            good: 0,
            medium: 1,
            bad: 2,
            unknown: 3
        };
        return order[health] ?? order.unknown;
    }

    /**
     * Gets the group with the lowest health attribute average.
     *
     * @param {Map} groups Route groups
     * @returns {Object|null} Healthiest route group
     */
    getHealthiestGroup(groups) {
        let healthiest = null;
        for (let group of groups.values()) {
            if (group.isUnrouted || !Number.isFinite(group.stats.healthScore))
                continue;
            if (!healthiest
                    || group.stats.healthSortValue < healthiest.stats.healthSortValue
                    || (group.stats.healthSortValue == healthiest.stats.healthSortValue && group.stats.healthScore < healthiest.stats.healthScore))
                healthiest = group;
        }
        return healthiest;
    }

    /**
     * Gets all numeric attributes from the loaded rows.
     *
     * @returns {Array} Numeric attribute names
     */
    getNumericAttributes() {
        let attrs = [];
        let configuredAttrs = [...this.options.valueAttrs];
        if (this.options.healthAttr)
            configuredAttrs.unshift(this.options.healthAttr);

        for (let attr of configuredAttrs) {
            if (!attrs.includes(attr) && this.rows.some(row => this.getNumericValue(row.set[attr]) !== null))
                attrs.push(attr);
        }

        for (let row of this.rows) {
            for (let attr in row.set) {
                if (attr.startsWith('swac_') || attrs.includes(attr))
                    continue;
                if (this.getNumericValue(row.set[attr]) !== null)
                    attrs.push(attr);
            }
        }

        return attrs;
    }

    /**
     * Converts a nonempty value to a number.
     *
     * @param {Mixed} value Value to convert
     * @returns {Number|null} Numeric value or null
     */
    getNumericValue(value) {
        if (value === null || typeof value === 'undefined' || typeof value === 'boolean' || String(value).trim() === '')
            return null;

        let number = Number(value);
        return Number.isFinite(number) ? number : null;
    }

    /**
     * Fits the map to the currently visible points.
     *
     * @param {Array} rows Visible rows
     */
    fitBounds(rows) {
        if (rows.length == 0)
            return;

        let bounds = L.latLngBounds(rows.map(row => [row.position.lat, row.position.lng]));
        this.fitMapBounds(bounds);
        this.hasFittedBounds = true;
    }

    /**
     * Fits the map to bounds after the map container has its final size.
     *
     * @param {Object} bounds Leaflet bounds
     */
    fitMapBounds(bounds) {
        if (typeof this.map.refreshMapSize === 'function')
            this.map.refreshMapSize();

        this.map.viewer.fitBounds(bounds, {
            maxZoom: this.map.options.zoom,
            padding: [30, 30]
        });

        window.setTimeout(() => {
            if (typeof this.map.refreshMapSize === 'function')
                this.map.refreshMapSize();
            this.map.viewer.fitBounds(bounds, {
                maxZoom: this.map.options.zoom,
                padding: [30, 30]
            });
        }, 100);
    }

    /**
     * Compares two rows by timestamp.
     *
     * @param {Object} rowA First row
     * @param {Object} rowB Second row
     * @returns {Number} Sort result
     */
    compareRows(rowA, rowB) {
        let timeA = this.getSetTime(rowA.set);
        let timeB = this.getSetTime(rowB.set);
        if (timeA === null || timeB === null)
            return 0;
        return timeA - timeB;
    }

    /**
     * Gets the timestamp from a set.
     *
     * @param {WatchableSet} set Set to read
     * @returns {Number|null} Timestamp in milliseconds
     */
    getSetTime(set) {
        let value = this.options.tsAttr ? set[this.options.tsAttr] : null;
        if (value === null || typeof value === 'undefined' || value === '')
            return null;

        let time = new Date(value).getTime();
        return Number.isFinite(time) ? time : null;
    }

    /**
     * Gets a route color by index.
     *
     * @param {Number} index Route index
     * @returns {String} Color value
     */
    getRouteColor(index) {
        return this.options.routeColors[index % this.options.routeColors.length];
    }

    /**
     * Creates an option element.
     *
     * @param {String} value Option value
     * @param {String} label Option label
     * @returns {HTMLOptionElement} Option element
     */
    createOption(value, label) {
        let option = document.createElement('option');
        option.value = value;
        option.textContent = label;
        return option;
    }

    /**
     * Formats numbers for route statistics.
     *
     * @param {Number|null} value Number to format
     * @param {Number} digits Maximum fraction digits
     * @returns {String} Formatted value
     */
    formatNumber(value, digits) {
        if (!Number.isFinite(value))
            return this.lang('not_available', 'n/a');
        return Number(value).toLocaleString(SWAC.lang.activeLang, {
            maximumFractionDigits: digits
        });
    }

    /**
     * Formats a timestamp for route statistics.
     *
     * @param {Number|null} value Timestamp in milliseconds
     * @returns {String} Formatted datetime
     */
    formatDateTime(value) {
        if (!Number.isFinite(value))
            return this.lang('not_available', 'n/a');
        return new Date(value).toLocaleString(SWAC.lang.activeLang);
    }

    /**
     * Formats a duration for route statistics.
     *
     * @param {Number|null} minutes Duration in minutes
     * @returns {String} Formatted duration
     */
    formatDuration(minutes) {
        if (!Number.isFinite(minutes))
            return this.lang('not_available', 'n/a');
        if (minutes < 60)
            return this.formatNumber(minutes, 0) + ' min';

        let hours = Math.floor(minutes / 60);
        let restMinutes = Math.round(minutes % 60);
        return hours + ' h ' + restMinutes + ' min';
    }

    /**
     * Gets a translated health label.
     *
     * @param {String} health Health key
     * @returns {String} Health label
     */
    getHealthLabel(health) {
        return this.lang('health_' + health, health);
    }

    /**
     * Gets a translated text.
     *
     * @param {String} key Translation key
     * @param {String} fallback Fallback text
     * @returns {String} Translation or fallback
     */
    lang(key, fallback) {
        return SWAC.lang.dict.Worldmap2d_RouteAnalytics?.[key] || fallback;
    }
}
