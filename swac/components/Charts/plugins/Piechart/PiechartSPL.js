import SWAC from '../../../../swac.js';
import Msg from '../../../../Msg.js';
import Plugin from '../../../../Plugin.js'

export default class PiechartSPL extends Plugin {

    constructor(opts = {}) {
        super(opts);
        this.name = 'Charts/plugins/Piechart';
        this.desc.templates[0] = {
            name: 'piechart',
            style: false,
            desc: 'Default template createing a chartjs instance for piechart'
        };
        this.desc.opts[5000] = {
            name: 'cutout',
            desc: 'Name of the attribute that specifies the cutout.'
        };
        if (!this.options.cutout)
            this.options.cutout = 'cutout';
    }

    init() {
        return new Promise((resolve, reject) => {
            // Check if content area is available
            if (!this.contElements || this.contElements.length === 0) {
                Msg.error('PiechartSPL', 'This plugin needs a contElement to insert the chart.', this.requestor);
            }
            resolve();
        });
    }

    afterAddSet(set, repeateds) {
        if (!this.chart) {
            this.initChart(set);
            return;
        }

        // Get component where this plugin instance belongs to
        let comp = this.requestor.parent.swac_comp;

        let rsName = comp.getReadableSourceName(set.swac_fromName);
        let sourceFound = false;
        for (let curSets of this.chart.data.datasets) {
            // Add new dataset to the correct chart datasets
            if (curSets.label[0].startsWith(rsName + '.')) {
                sourceFound = true;
                let lastDotPos = curSets.label[0].lastIndexOf('.');
                let attrName = curSets.label[0].substring(lastDotPos + 1);
                // Add value
                curSets.data.push(set[attrName]);
                // Add color
                if (comp.datadescription)
                    curSets.backgroundColor.push(comp.datadescription.getValueColor(set, null, attrName));
            }
        }

        if(!sourceFound) {
            Msg.error('PiechartSPL','You tried to add a dataset from another source to the pie chart. This is currently not supported.',comp.requestor);
        }

        this.chart.update();
        this.chart.update();
    }

    /**
     * Initilises the charttype based on the given set
     * 
     * @param {WatchableSet} set Representative dataset for chart data
     */
    initChart(set) {
        // Get component where this plugin instance belongs to
        let comp = this.requestor.parent.swac_comp;
        // Get draw area (only one contElement supported)
        var ctx = this.contElements[0].querySelector('canvas');

        // Fill datasets
        let datasets = [];
        if (comp.options.xAxisAttrName) {
            datasets.push(this.createSet(set, comp.options.xAxisAttrName));
        }
        // Create for y axis
        for (let curYAttr of comp.options.yAxisAttrNames) {
            datasets.push(this.createSet(set, curYAttr));
        }

        this.chart = new Chart(ctx, {
            type: 'pie',
            data: {
                datasets: datasets
            },
            options: {
                responsive: true
            }
        });
    }

    /**
     * Create chart set for dataset and attribute
     * 
     * @param {WatchableSet} set Dataset to create chart set for
     * @param {String} attrname Name of the attribute to create chart set for
     * @returns {Object} Chart set
     */
    createSet(set, attrName) {
        // Get component where this plugin instance belongs to
        let comp = this.requestor.parent.swac_comp;
        let rsName = comp.getReadableSourceName(set.swac_fromName);

        let dataset = {
            label: [rsName + '.' + attrName],
            data: [set[attrName]]
        }
        if (comp.datadescription)
            dataset.backgroundColor = [comp.datadescription.getValueColor(set, null, attrName)];
        dataset.cutout = set[this.options.cutout] ? set[this.options.cutout] : 0;
        return dataset;
    }

    afterRemoveSet(set) {
        // Look at each source (datasets array entry in chart.js)
        for (let curSets of this.chart.data.datasets) {
            if (curSets.label === set.swac_fromName) {
                // Look at each set
                for (let i in curSets.data) {
                    if (curSets.data[i].id === set.id) {
                        curSets.data.splice(i, 1);
                        break;
                    }
                }
            }
        }
        this.chart.update();
    }
}