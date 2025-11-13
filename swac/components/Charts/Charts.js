
import SWAC from '../../swac.js';
import View from '../../View.js';
import Msg from '../../Msg.js';

export default class Charts extends View {

    constructor(options = {}) {
        super(options);
        this.name = 'Charts';
        this.desc.text = "Show bar- line or pie-chart and datatable for every data.";
        this.desc.developers = 'Florian Fehring (HSBI)';
        this.desc.license = 'GNU Lesser General Public License';

        this.desc.depends[0] = {
            name: 'Chartjs Class',
            path: SWAC.config.swac_root + 'components/Charts/libs/chartjs/Chart.min.js',
            desc: 'Class containing the ChartJs functions.'
        };
        this.desc.depends[1] = {
            name: 'DatatypeReflection',
            algorithm: 'DatatypeReflection',
            desc: 'Algorithm with methods to determine date and time values'
        };
        this.desc.depends[2] = {
            name: 'Chartjs datetime adapter',
            path: SWAC.config.swac_root + 'components/Charts/libs/chartjs/chartjs-adapter-date-fns.bundle.min.js',
            desc: 'Class with adapter for datetime conversion.'
        };
        this.desc.depends[3] = {
            name: 'HammerJS for zoom plugin',
            path: SWAC.config.swac_root + 'components/Charts/libs/chartjs/hammerjs.js',
            desc: 'Needed for zoom plugin.'
        };


//        this.desc.depends[3] = {
//            name: 'Chartjs datalables Plugin',
//            path: SWAC.config.swac_root + 'components/Charts/libs/chartjs/chartjs-plugin-datalabels.min.js',
//            desc: 'Extension for chartjs to display datalables.'
//        };

        this.desc.templates[0] = {
            name: 'chart',
            style: false,
            desc: 'Template with area for plugins and pluginnavigation'
        };
        this.desc.reqPerTpl[0] = {
            selc: '.swac_chart_nav',
            desc: 'Element where the chart navigation is placed'
        };
        this.desc.reqPerTpl[1] = {
            selc: '.swac_chart_tabs',
            desc: 'Element where the chart plugins create tabs'
        };
        this.desc.optPerTpl[0] = {
            selc: '.swac_chart_msgs',
            desc: 'A area where error messages could be placed'
        };
        this.desc.reqPerSet[0] = {
            name: 'id',
            desc: 'Dataset id used for indexing, sorting and performance optimization. (unique per datasource)'
        };
        this.desc.reqPerSet[1] = {
            name: '*',
            desc: 'at least one value as an attribute (named whatever you want)'
        };
        this.desc.optPerSet[0] = {
            name: '*',
            desc: 'n values as attributes (named whatever you want). The first attribute is placed on x-axis per default, the second one is placed on y-axis. All other are not displayed until selected (selection not implemented yet)'
        };
        if (!options.showWhenNoData)
            this.options.showWhenNoData = true;
        this.desc.opts[0] = {
            name: 'xAxisAttrName',
            desc: 'Name of the attribut to show on xAxis. If not set the fist attribute with timestamp data will be used. If there is no timestampdata the first other attribute will be used.',
            example: 'x'
        };
        if (!options.xAxisAttrName)
            this.options.xAxisAttrName = null;
        this.desc.opts[1] = {
            name: 'yAxisAttrNames',
            desc: 'Array with names of attributes that should be placed on the y axis.',
            example: ['a','b']
        };
        if (!options.yAxisAttrNames)
            this.options.yAxisAttrNames = null;
        
        this.desc.opts[2] = {
            name: 'sourceColors',
            desc: 'Definition of colors for datasources. Will be overwritten when useing datadescription.',
            example: {
                '../../data/visualisation/charts/example7_series2.json_temp': 'blue'
            }
        };
        if (!options.sourceColors)
            this.options.sourceColors = {
                '../../data/visualisation/charts/example7_series2.json_temp': 'red'
            };
        
        this.desc.opts[3] = {
            name: 'datadescription',
            desc: 'Selector of the datadescription component that should be used.',
            example: '#mydatadescription'
        };
        if (!options.datadescription)
            this.options.datadescription = null;
        if (!options.plugins) {
            this.options.plugins = new Map();
            // Plugin for barcharts
            this.options.plugins.set('Barchart', {
                id: 'Barchart',
                active: true
            });
            // Plugin for linecharts
            this.options.plugins.set('Linechart', {
                id: 'Linechart',
                active: true
            });
            //Plugin for piecharts
            this.options.plugins.set('Piechart', {
                id: 'Piechart',
                active: true
            });
        }

        this.desc.funcs[0] = {
            name: 'redrawCharts',
            desc: 'Redraws the charts useing the available and activated plugins. If charts are allready drawn redraws the charts completely new.'
        };

        // internal avalues
        this.attributes = new Map();

        // old ones
        this.chartjsdata = null; // Stores data in chartjs compatible form (DEPRECATED)
        this.chartdata = null; // Stores data in chartjs compatible form (new implementation)
        this.datadescription = null; // Stores the reference to the datadescription component
    }

    init() {
        return new Promise((resolve, reject) => {
            if (this.options.plugins.size === 0)
                Msg.warn('Chart', 'No plugin active, there will be nothing to see', this.requestor);

            if (this.options.datadescription) {
                let dd = document.querySelector(this.options.datadescription);
                if (dd)
                    this.datadescription = dd.swac_comp;
                else
                    Msg.error('Charts', 'Datadescription component >' + this.options.datadescription + '< not found.', this.requestor);
            }
            resolve();
        });
    }

    beforeAddSet(set) {
        this.analyseSet(set);
        return set;
    }

    afterAddSet(set, repeateds) {
        super.afterAddSet(set, repeateds);
        
    }

    afterRemoveSet(set) {
        super.afterRemoveSet(set);
    }

    // public function
    redrawCharts() {
        return new Promise((resolve, reject) => {
            // Clear chart areas
            this.unloadPlugins();
            // Redraw chart areas
            this.loadPlugins();
        });
    }

    /**
     * Analyses the set. Determines the xAttribute, and yAttributes
     * 
     * @param {WatchableSet} set Dataset to analyse
     */
    analyseSet(set) {
        let dtr = SWAC.loadedAlgorithms['DatatypeReflection'];
        let firstAttr;

        for (let curAttr in set) {
            if (curAttr.startsWith('swac_'))
                continue;
            if (!this.attributes.has(curAttr)) {
                // Get datatype if unknown attr
                let dtype = dtr.determineDataType(set[curAttr]);
                this.attributes.set(curAttr, {
                    type: dtype,
                    min: set[curAttr],
                    max: set[curAttr]
                });
                // Autoconfigure xAxis to a timestamp if no option given
                if (!this.options.xAxisAttrName && (dtype === 'date' || dtype === 'timestamp')) {
                    this.options.xAxisAttrName = curAttr;
                    Msg.info('Charts', 'Automatic detected to use >' + curAttr + '< on xAxis', this.requestor);
                } else if (curAttr !== 'id' && !this.options.yAxisAttrNames && dtype !== 'varchar' && dtype !== 'bool') {
                    this.options.yAxisAttrNames = [curAttr];
                    Msg.info('Charts', 'Automatic detected to use >' + curAttr + '< on yAxis', this.requestor);
                } else if (!firstAttr && curAttr !== 'id') {

                    firstAttr = curAttr;
                }
            } else {
                let cur = this.attributes.get(curAttr);
                // Update min value
                if (cur.min > set[curAttr])
                    cur.min = set[curAttr];
                // Update max value
                if (cur.max < set[curAttr])
                    cur.max = set[curAttr];
            }
        }
        // Set xAxis to first attribute if no time information present
        if (!this.options.xAxisAttrName) {
            this.options.xAxisAttrName = firstAttr;
        }
        // Set visualised attribute for datadescription
        if (this.datadescription && !this.datadescription.options.visuAttribute) {
            Msg.info('Charts', 'Automatic setting descriped attribute to >' + this.options.yAxisAttrNames[0] + '< to datadescription.');
            this.datadescription.options.visuAttribute = this.options.yAxisAttrNames[0];
        }
    }    

    /**
     * Select the first chart tab
     */
    selectFirstChartTab() {
        let chartNav = this.requestor.querySelector(".swac_chart_nav");
        UIkit.tab(chartNav).show(1);
    }

    /**
     * Hides the tabs and shows the first tab content
     */
    hideChartTab() {
        let chartNav = this.requestor.querySelector(".swac_chart_nav");
        chartNav.style.visibility = "hidden";
        let chartTabs = this.requestor.querySelector(".swac_chart_tabs");
        chartTabs.querySelector('.swac_repeatedForPluginCont').setAttribute('style', 'display: block');
    }

    /**
     * Shows a errormessage to the user. Does nothing if there is no element with
     * class swac_chart_msgs
     * 
     * @param {String} message Message to show
     * @returns {undefined}
     */
    showErrorMessage(message) {
        // Get error message place
        let errAreas = this.requestor.querySelectorAll('.swac_chart_msgs');
        for (let errArea of errAreas) {
            let errMsgElem = document.createElement('div');
            errMsgElem.innerHTML = message;
            errArea.appendChild(errMsgElem);
        }
    }

    /**
     * Removes the tab navigation if there is only one plugin active and opens the
     * first tab.
     * 
     * @param {String[]} loadedPlugins
     * @returns {undefined}
     */
    afterPluginsLoaded(loadedPlugins) {
        if (loadedPlugins.length < 2)
            this.hideChartTab();
        else
            this.selectFirstChartTab();
    }

    /**
     * Gets a human readable name from a source name
     * 
     * @param {String} fromName Full qualified fromName
     * @returns {String} Short readable name
     */
    getReadableSourceName(fromName) {
        let rsName = fromName;
        let lastPos = rsName.lastIndexOf('/');
        if (lastPos > 0) {
            rsName = rsName.substring(lastPos, rsName.length);
        }
        return rsName;
    }

    /**
     * Get the chart.js scale type for an attribute
     * 
     * @param {String} Attribut name
     * @return {String} Matching scale type
     */
    getScaleTypeForAttr(attr) {
        if (!this.attributes.get(attr)) {
            Msg.warn('Charts', 'There is no attributes def for ' + attr, this.requestor);
            return 'category';
        }
        switch (this.attributes.get(attr).type) {
            case 'timestamp':
                return 'time';
            default:
                return 'category'
        }
    }
}