import Msg from '../../Msg.js';

export default class DomainCollection {

    constraintsolver = null;
    origin = null; // DomainCollection this collection is copied from
    collection_type = null; // Type of the collection (from type attribute from csp definiton)
    domains = new Map();
    constraints = new Map();
    observers = new Map();
    set = null; // Dataset with occupancy that belongs to this domaincollection

    constructor(constraintsolver) {
        this.constraintsolver = constraintsolver;
    }

    getDomains() {

    }

    setDomain(attr, values) {
//        console.log('NOTIFICATION OF CHANGED DOMAIN: ' + attr);
//        console.log(values);
//        console.log(this.domains.get(attr));
        this.domains.set(attr, values);
        this.notifyObservers(attr);
    }

    getVarDomains() {

    }

    recive() {}

    /**
     * Reset the domain of the given attribute
     */
    reset(attr) {
        let copyDomVals = [];
        console.log('RESET copies:');
        for (let curDomVal of this.origin.domains.get(attr)) {
            console.log(curDomVal);
            copyDomVals.push(curDomVal.copy());
        }
        this.domains.set(attr, copyDomVals);
        console.log('RESET ' + attr);
        console.log(copyDomVals);
    }

    /**
     * Checks if the occupancy is complete
     */
    isComplete() {
        for (let curVariable of this.domains.keys()) {
            if (this.set[curVariable] === null || typeof this.set[curVariable] === 'undefined')
                return false;
        }
        return true;
    }

    /**
     * Gets the names of the variables that have no value
     */
    getIncomplete() {
        let incomplete = [];
        for (let curVariable of this.domains.keys()) {
            if (this.set[curVariable] === null || typeof this.set[curVariable] === 'undefined')
                incomplete.push(curVariable);
        }
        return incomplete;
    }

    /**
     * Adds an observer
     */
    addObserver(attr, observer) {
        if (!this.observers.has(attr))
            this.observers.set(attr, []);
        this.observers.get(attr).push(observer);
    }

    /**
     * Notify the observers
     */
    notifyObservers(attr) {
        Msg.flow('DomainCollection', 'Notify observers for >' + this.set.swac_fromName + '[' + this.set.id + '].' + attr + '<');
        let newdef = this.constraintsolver.getDataDefinitionsForSetAttr(this.set.swac_fromName, this.set.id, attr);
        // notify observers
        let obs = this.observers.get(attr);
        if (newdef && obs) {
            for (let curObs of obs) {
                curObs.notify(attr, newdef);
            }
        }
    }

    /**
     * Creates a deep copy of this DomainCollection
     * 
     * @return {DomainCollection} Deep copy of this collection
     */
    copy() {
        let copy = new DomainCollection();
        copy.origin = this;
        copy.constraintsolver = this.constraintsolver;
        copy.collection_type = this.collection_type;
        // Copy domains
        for (let [curVar, curValues] of this.domains) {
            let values = [];
            for (let curDomainValue of curValues) {
                values.push(curDomainValue.copy());
            }
            copy.domains.set(curVar, values);
        }
        // Copy constriants
        copy.constraints = this.constraints;
        // Copy observer
        copy.observers = this.observers;

        return copy;
    }
}
