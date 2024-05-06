export default class Constraint {

    constructor(id) {
        this.id = id;
        this.variables = [];
        this.pc = null; // Partcollection this Constraint is bound to
    }

    /**
     * Get name of the variable at given position
     * 
     * @param {int} num Variables position in constraint
     * @returns {String} Name of the variable
     */
    getVariable(num) {
        return this.variables[num];
    }

    toString() {
        // Has to be implemented by subclasses
    }
    
    copy() {
        console.log('TEST here!');
        // Has to be implemented by subclasses
    }
}