import SWAC from '../../swac.js';
import Msg from '../../Msg.js';
import Model from '../../Model.js';
import Algorithm from '../../Algorithm.js';

export default class DataCompare extends Algorithm {

    constructor(options = {}) {
        super(options);
        this.name = 'DataCompare';
        this.desc.text = 'DataCompare for comperation of datasources and datasets';

        this.desc.opts[1] = {
            name: 'excludeCompareAttrs',
            desc: 'Attributes that should be excluded from compare. Default: id'
        };
        if (!options.excludeCompareAttrs)
            this.options.excludeCompareAttrs = ['id'];
    }

    init() {
        return new Promise((resolve, reject) => {
            resolve();
        });
    }

    compareSources(fromName1, fromName2) {
        Msg.error('DataCompare', 'Sorry this function is not implemented yet. '
                + 'If you need this consider to make a donation.', this.requestor);
    }

    compareSets(set1, set2) {
        let diff = {
            missAttrs: [],
            missCont: [],
            childsCount: 0,
            childsCont: false,
            addedAttrs: [],
            isDiff: function () {
                return this.missAttrs.length !== 0 || this.missCont.length !== 0 || this.childsCount !== 0 || this.childsCont || this.addedAttrs.length !== 0;
            }
        };
        for (let curAttr in set1) {
            // Exclude internal attributes
            if (curAttr.startsWith('swac_'))
                continue;
            // Exclude attrs from exclude option
            if (this.options.excludeCompareAttrs.includes(curAttr))
                continue;
            // Get missing attributes
            if (typeof set2[curAttr] === 'undefined') {
                diff.missAttrs.push(curAttr);
                continue;
            }
            // Get mismatching values
            if (set1[curAttr] !== set2[curAttr]) {
//                console.log(curAttr + ': ' + set1[curAttr] + ' !== ' + set2[curAttr]);
                diff.missCont.push(curAttr);
            }
        }
        // Check child datasets
        // Only get childs from main source
        if (set1.swac_fromName === this.options.mainSource) {
            let set1childs = this.getChilds(set1);
            let set2childs = this.getChilds(set2)
            // Check count
            if (set1childs.length !== set2childs.length) {
                diff.childsCount = set2childs.length - set1childs.length;
            } else {
                // Check every child
                for (let i in set1childs) {
                    let cDiff = this.compareSets(set1childs[i], set2childs[i]);
                    if (cDiff.isDiff()) {
                        diff.childsCont = true;
                    }
                }
            }
        }

        // Get attributes in set2 that are not present in set2
        for (let curAttr in set2) {
            if (!curAttr.includes('_prev_') && typeof set1[curAttr] === 'undefined')
                diff.addedAttrs.push(curAttr);
        }
//        console.log('diff:');
//        console.log(diff);
        return diff;
    }

    findDuplicates(fromName) {
        let duplicates = [];
        if (!this.data[fromName]) {
            Msg.error('DataCompare', 'There is no datasource with name >' + fromName + '<', this.requestor);
            return duplicates;
        }
        let checked = [];
        for (let curSet of this.data[fromName].getSets()) {
            if(!curSet)
                continue;
            checked.push(curSet.id);
            for (let curCSet of this.data[fromName].getSets()) {
                if(!curCSet)
                    continue;
                // Prevent double check
                if (checked.includes(curCSet.id))
                    continue;
                let diff = this.compareSets(curSet, curCSet);
                if (diff.isDiff() === false) {
                    duplicates.push({
                        curSet, curCSet
                    });
                }
            }
        }
        return duplicates;
    }
}
