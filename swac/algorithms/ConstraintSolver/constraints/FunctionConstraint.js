import Constraint from './Constraint.js';

export default class FunctionConstraint extends Constraint {

    constructor(id, funcobj) {
        super(id);
        this.func = funcobj.func;
        this.variables = funcobj.vars;
        // Get names of variables
//        let str = '' + func;
//        str = str.split('{',1)[0];
//        str = str.replace('function (','');
//        str = str.replace(')','');
//        this.variables = str.split(',');
    }

    toString() {
        return this.func.toString();
    }
    
    copy() {
        let funcobj = {
            func: this.func,
            vars: []
        }
        for(let curVar of this.variables) {
            funcobj.vars.push(curVar);
        }
        let copy = new FunctionConstraint(this.id,funcobj);
        copy.pc = this.pc;
        return copy;
    }
}