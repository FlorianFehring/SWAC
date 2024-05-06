import SWAC from '../../swac.js';
import Msg from '../../Msg.js';
import Algorithm from '../../Algorithm.js';
import WatchableSource from '../../WatchableSource.js';
import WatchableSet from '../../WatchableSet.js';
import Model from '../../Model.js';

export default class DataCalculator extends Algorithm {

    constructor(options) {
        super(options);
        this.name = 'DataCalculator';
        this.desc.text = 'DataCalculation methods';


        this.desc.opts[0] = {
            name: "calculations",
            desc: "Definitions of calculations. These are objects with the attributes: formular (formular with names of the dataset attributes) and target (name of the attribute where the result will be stored)"
        };
        if (!options.calculations)
            this.options.calculations = [];

        this.desc.opts[1] = {
            name: "sourceAttr",
            desc: "Name of the attribute that contains a url to get a dataset to calculate with. Allows the calculation over multiple datasources."
        };
        if (!options.sourceAttr)
            this.options.sourceAttr = null;

        this.desc.opts[2] = {
            name: "roundResults",
            desc: "Digits to round results to."
        };
        if (typeof options.roundResults === 'undefined')
            this.options.roundResults = 2;

        this.desc.opts[3] = {
            name: "targetSource",
            desc: "Name of the datasource result should be stored."
        };
        if (!options.targetSource)
            this.options.targetSource = null;

        this.desc.opts[4] = {
            name: "statsSource",
            desc: "Name of the datasource stats should be stored."
        };
        if (!options.statsSource)
            this.options.statsSource = null;

        // Internal attributes
        this.targetsource = null;
        this.statssource = null;
        this.statsset = null;
    }

    init() {
        return new Promise((resolve, reject) => {

            // Create target datasource
            if (this.options.targetSource) {
                if (Model.store[this.options.targetSource])
                    this.targetsource = Model.store[this.options.targetSource];
                else
                    this.targetsource = new WatchableSource(this.options.targetSource, Model);
            }

            // Create stats datasource
            if (this.options.statsSource) {
                if (Model.store[this.options.statsSource])
                    this.statssource = Model.store[this.options.statsSource];
                else
                    this.statssource = new WatchableSource(this.options.statsSource, Model);

                this.statsset = this.statssource.getSet(1);
                if (!this.statsset) {
                    this.statsset = new WatchableSet({id: 1, swac_fromName: this.options.statsSource});
                    this.statssource.addSet(this.statsset);
                }
                this.statsset.addObserver(this);
            }

            resolve();
        });
    }

    async afterAddSet(set) {
        let dataset = set;

        // Get values to calc with
        if (set[this.options.sourceAttr]) {
            const response = await fetch(set[this.options.sourceAttr]);
            dataset = await response.json();
            if (dataset['records'])
                dataset = dataset['records'][0];
        }

        // Check if resultset allready exists
        let resultset;
        if (this.targetsource?.getSet(dataset.id)) {
            resultset = this.targetsource.getSet(dataset.id);
        } else {
            Msg.flow('DataCalculator', 'Create new result dataset for calculation from >' + dataset.swac_fromName + '[' + dataset.id + ']< into source >' + this.options.targetSource + '<', this.requestor);
            resultset = new WatchableSet({
                id: dataset.id,
                swac_fromName: this.options.targetSource
            });
        }

        // Get calculations
        for (let curCalc of this.options.calculations) {
            let formular = curCalc.formular;
            // Walk trough sets attributes
            for (let curAttr in dataset) {
                formular = formular.replace(curAttr, dataset[curAttr]);
            }
            let result = 0;
            try {
                result = eval(formular);
                resultset[curCalc.target] = result;
                // Add result to stats set
                if (this.options.statsSource) {
                    if (!this.statsset[curCalc.target + '_sum'])
                        this.statsset[curCalc.target + '_sum'] = 0.0;
                    this.statsset[curCalc.target + '_sum'] += result;
                }
            } catch (e) {
                Msg.error('Calculate', 'Could not perform calculation for set >' + set.swac_fromName + '[' + set.id + ']<: ' + e, this.requestor);
            }
        }

        // Add resultset to target source
        if (this.targetsource && !this.targetsource.getSet(dataset.id)) {
            this.targetsource.addSet(resultset);
        }
    }
}