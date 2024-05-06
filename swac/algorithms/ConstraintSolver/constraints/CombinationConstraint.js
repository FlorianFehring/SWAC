import Constraint from './Constraint.js';

export default class CombinationConstraint extends Constraint {

    constructor(id, combi) {
        super(id);
        this.combinations = [];
        this.addCombination(combi);
    }
    
    addCombination(combi) {
        this.combinations.push(combi);
        for(let curVar of Object.keys(combi)) {
            if(!this.variables.includes(curVar))
                this.variables.push(curVar);
        }
    }

    removeDuplicateCombinations() {
        for (let curCombiNo in this.combinations) {
            let curCombi = this.combinations[curCombiNo];
            for (let curCompareCombi of this.combinations) {
                let isSame = true;
                for(let curKey of Object.keys(curCompareCombi)) {
                    if(!curCombi[curKey]) {
                        isSame = false;
                        break;
                    }
                    if(curCombi[curKey] !== curCompareCombi[curKey]) {
                        isSame = false;
                        break;
                    }
                }
                // Remove duplicate
                if(isSame) {
                    delete this.combinations[curCombiNo];
                }
            }
        }
    }

    toString() {
        let postxt = '';
        let i = 0;
//        console.log('all combis:');
//        console.log(this.combinations);
        for (let varName in this.combinations) {
            let combis = this.combinations[varName];
//            console.log('####combis: ' + varName);
//            console.log(combis);
            if (i > 0)
                postxt += ' OR ';
            postxt += '(';
            let j = 0;
            for (let curKey of Object.keys(combis)) {
//                console.log('tst key');
//                console.log(curKey);
                if (j > 0)
                    postxt += ' AND ';
//                console.log(combis[curKey]);
                if (combis[curKey].min && combis[curKey].max) {
//                    console.log('has toSting()');
//                    console.log(combis[curKey] instanceof NumericRange);
//                    console.log(combis[curKey]);
                    postxt += curKey + ' = ' + combis[curKey].toString();
                } else {
                    postxt += curKey + ' oneOf: [' + combis[curKey] + ']';
                }
                j++;
            }
            postxt += ')';
            i++;
        }
        return postxt;
    }
    
    copy() {
        let copy = new CombinationConstraint(this.id,this.combinations[0]);
        copy.combinations = [];
        copy.combinations = this.combinations;
        copy.pc = this.pc;
        return copy;
    }
}