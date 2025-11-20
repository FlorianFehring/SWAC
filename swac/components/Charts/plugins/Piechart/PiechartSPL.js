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

        // Internal attributes
        this.pie_set_labels = [];       // One label for each dataset
        this.pie_namedsets = new Map(); // Per attribute one entry with attribute values from all sets
    }

    init() {
        return new Promise((resolve, reject) => {
            // Check if content area is available
            if (!this.contElements || this.contElements.length === 0) {
                Msg.error('PiechartSPL', 'This plugin needs a contElement to insert the chart.', this.requestor);
            }

            // Get draw area (only one contElement supported)
            var ctx = this.contElements[0].querySelector('canvas');

            this.chart = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: [],
                    datasets: []
                },
                options: {
                    responsive: true
                }
            });

            resolve();
        });
    }

    afterAddSet(set, repeateds) {
        let comp = this.requestor.parent.swac_comp;
        let rsName = comp.getReadableSourceName(set.swac_fromName);
        // Add pie label
        if(set.name)
            this.pie_set_labels[set.id] = set.name + '(' + rsName + ')';
        else if(set.title)
            this.pie_set_labels[set.id] = set.title + '(' + rsName + ')';
        else 
            this.pie_set_labels[set.id] = set.id + '(' + rsName + ')';

        // Create an chart dataset entry for each attribute in set
        for (let curAttr in set) {
            // Exclude swac internal attributes and id
            if (!curAttr.startsWith('swac_') && curAttr !== 'id') {
                // Exclude NaN values
                if (!isNaN(set[curAttr])) {
                    // Search if pie_set exists (one pie_set has all data for one piechart)
                    let pie_set = this.pie_namedsets.get(curAttr);
                    // Create new pie_set if not exists
                    if (!pie_set) {
                        let curSet = this.createSet(set, curAttr);
                        this.pie_namedsets.set(curAttr, curSet);
                    } else {
                        pie_set.data[set.id] = set[curAttr];
                    }
                }
            }
        }

        this.updateDraw();
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
        let dataarr = [];
        dataarr[set.id] = set[attrName];
        let dataset = {
            label: attrName,
            data: dataarr
        }
        if (comp.datadescription)
            dataset.backgroundColor = [comp.datadescription.getValueColor(set, null, attrName)];
        dataset.cutout = set[this.options.cutout] ? set[this.options.cutout] : 0;
        return dataset;
    }

    afterRemoveSet(set) {
        // Remove entry from labels
        this.pie_set_labels[set.id] = null;

        // Look at each parameter
        for (const namedSet of this.pie_namedsets.values()) {
            if (Array.isArray(namedSet.data)) {
                namedSet.data[set.id] = null;
            }
        }

        this.updateDraw();
    }

    /**
     * Updates the chart drawing
     */
    updateDraw() {
        // Get component where this plugin instance belongs to
        let comp = this.requestor.parent.swac_comp;

        // Update labels
        this.chart.data.labels = this.pie_set_labels.filter(v => v != null);

        // Update data
        let curNamedSet = this.pie_namedsets.get(comp.options.xAxisAttrName);
        if (!curNamedSet) {
            let applicableKey = this.pie_namedsets.keys().next().value;
            curNamedSet = this.pie_namedsets.get(applicableKey);
        }
        // Build datasets object for chartjs
        this.chart.data.datasets = [{
                label: curNamedSet.label,
                data: curNamedSet.data.filter(v => v != null)
            }];

        this.chart.update();
    }
}