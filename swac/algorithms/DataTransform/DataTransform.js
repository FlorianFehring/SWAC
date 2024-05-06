import SWAC from '../../swac.js';
import Msg from '../../Msg.js';
import Model from '../../Model.js';
import WatchableSource from '../../WatchableSource.js';
import WatchableSet from '../../WatchableSet.js';
import Algorithm from '../../Algorithm.js';

export default class DataTransformation extends Algorithm {

    /**
     * Constructs a new DataTransformation
     * 
     * @param {Object} options Object with options for data transformation
     * 
     * @returns {DataAnalysis}
     */
    constructor(options = {}) {
        super(options);
        this.name = 'DataTransformation';
        this.desc.text = 'Transformates data from one data layout to another';

        this.desc.opts[1] = {
            name: "ignoredAttributes",
            desc: "Array of attributes that should not be transformed or transfered to the transformed set"
        };
        if (!options.ignoredAttributes)
            this.options.ignoredAttributes = [];

        this.desc.opts[2] = {
            name: "transforms",
            desc: "Object with key: fromName, value: Object(key: attribute, value: function OR Object{key: sourcevalue, value: newvalue}}}"
        };

        if (!options.transforms)
            this.options.transforms = {};
        this.desc.opts[3] = {
            name: "transformTarget",
            desc: "Name of the datasource the transformed data should be safed in. Datasets from original get the same id in target. Existing datesets will be overwritten. If source was not loaded previous it will be new created."
        };
        if (!options.transformTarget)
            this.options.transformTarget = 'transformed_data';

        this.desc.funcs[0] = {
            name: 'transform',
            desc: 'Transform all datasets of a specific resource',
            params: [
                {
                    name: 'fromName',
                    desc: 'Name of the source'
                }
            ],
            returns: {
                type: 'WatchableSource',
                desc: 'Target datasource with transformed sets'
            }
        };
        this.desc.funcs[1] = {
            name: 'transformSet',
            desc: 'Transform the given dataset',
            params: [
                {
                    name: 'fromName',
                    desc: 'Name of the source'
                },
                {
                    name: 'set',
                    desc: 'WatchableSet or object to transform'
                }
            ],
            returns: {
                type: 'WatchableSet',
                desc: 'Dataset containing the result after transformation'
            }
        };
    }

    init() {
        return new Promise((resolve, reject) => {
            // Create target source if not exists
            if (!this.data[this.options.transformTarget]) {
                this.data[this.options.transformTarget] = new WatchableSource(this.options.transformTarget, this);
                this.data[this.options.transformTarget].addObserver(this);
            }
            resolve();
        });
    }

    afterAddSet(set) {
        // Do not transform allready transformed
        if (set.swac_fromName !== this.options.transformTarget) {
            this.transformSet(set);
        }
    }

    // public function
    transform(fromName) {
        Msg.flow('DataTransform', 'Transform for >' + fromName + '<', this.requestor);
        // Do not transform on transfomed target
        if (fromName === this.options.transformTarget)
            return null;
        for (let curSet of this.data[fromName].getSets()) {
            if (curSet) {
                this.transformSet(curSet);
            }
        }
        return this.data[this.options.transformTarget];
    }

    // public function
    transformSet(set) {
        Msg.flow('DataTransform', 'Transform for >' + set.swac_fromName + '[' + set.id + ']<', this.requestor);
        // Do not transform on transfomed target
        if (set.swac_fromName === this.options.transformTarget)
            return null;
        // Get transforms for source
        let strans = this.options.transforms[set.swac_fromName];
        if (!strans) {
            Msg.error('DataTransform', 'There are no transforms specified for source >' + set.swac_fromName + '<', this.requestor);
            return set;
        }
        let transset = this.data[this.options.transformTarget].getSet(set.id);
        if (!transset) {
            transset = new WatchableSet();
            transset.id = set.id;
            transset.swac_fromName = this.options.transformTarget;
            if (this.options.parentIdAttr)
                transset[this.options.parentIdAttr] = set[this.options.parentIdAttr];
        }

        for (let curAttr in strans) {
            let newval = this.transformAttribute(set.swac_fromName, set, curAttr, transset);
            transset[curAttr] = newval;
        }
        // Everything else leave untransformed
        for (let curAttr in set) {
            if (curAttr.startsWith('swac_') || this.options.ignoredAttributes.includes(curAttr))
                continue;
            if (typeof transset[curAttr] === 'undefined')
                transset[curAttr] = set[curAttr];
        }
        transset.addObserver(this);
        this.data[this.options.transformTarget].addSet(transset);
        return transset;
    }

    // public function
    transformAttribute(fromName, set, attr, transset) {
        // Do not transform on transfomed target
        if (fromName === this.options.transformTarget)
            return;
        // Get transforms for source
        let strans = this.options.transforms[fromName];
        if (!strans) {
            Msg.error('DataTransform', 'Could not find transforms for >' + fromName + '<');
            return;
        }
        // Break if this attribute should not be transformed
        if (this.options.ignoredAttributes.includes(attr))
            return set[attr];
        let curVal = set[attr];
        let newVal = set[attr];
        // Transform with function
        if (typeof strans[attr] === 'function') {
            newVal = strans[attr](set, transset);
        }
        // Transform with map
        else if (typeof strans[attr] === 'object' && typeof strans[attr][curVal] !== 'undefined') {
            newVal = strans[attr][curVal];
        }
        // Transform with value
        else if (typeof strans[attr] !== 'undefined' && typeof strans[attr] !== 'object') {
            newVal = strans[attr];
        }
        return newVal;
    }

    // public function
    getTransformedSource() {
        return this.data[this.options.transformTarget];
    }

    notifyChangedValue(set, name, value) {
        if (set.swac_fromName === this.options.transformTarget)
            return;
        Msg.flow('DataTransform', 'Transform changed value for >' + set.swac_fromName + '[' + set.id + '].' + name + '< = ' + value, this.requestor);
        let transset = this.data[this.options.transformTarget].getSet(set.id);
        transset[name] = this.transformAttribute(set.swac_fromName, set, name, transset);
    }

    notifyCommit(set) {
        let transset = this.data[this.options.transformTarget].getSet(set.id);
        for (let curAttr in set) {
            if (!curAttr.startsWith('swac_')) {
                transset[curAttr] = this.transformAttribute(set.swac_fromName, set, curAttr, transset);
            }
        }
    }

    notifyAddedValue(set, name, value) {
        Msg.flow('DataTransform', 'Transform added value for >' + set.swac_fromName + '[' + set.id + '].' + name + '< = ' + value, this.requestor);
        let transset = this.data[this.options.transformTarget].getSet(set.id);
        //TODO why is this neccessery?
        if (transset)
            transset[name] = this.transformAttribute(set.swac_fromName, set, name, transset);
    }

    notifyAddSet(watchablesource, set) {
        // Check if allready transformed
        if (set.swac_fromName === this.options.transformTarget)
            return;
        Msg.flow('DataTransform', 'NOTIFY about added set >' + set.swac_fromName + '[' + set.id + ']< recived', this.requestor);
        this.afterAddSet(set);
    }
};