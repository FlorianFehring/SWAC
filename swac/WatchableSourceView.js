import Msg from './Msg.js';
import Model from './Model.js';

/* 
 * Makes datasource watchable for changes
 */
export default class WatchableSourceView {

    constructor(watchablesource, comp) {
        Msg.flow('WatchableSourceView', 'Create WatchableSourceView for >' + watchablesource.swac_fromName + '< for requestor >' + comp.requestor.id + '<');
        this.requestor = comp.requestor;
        
        this.sets = [];
        this.swac_fromName = watchablesource.swac_fromName;
        this.swac_createTime = Date.now();
        this.swac_updateTime = Date.now();
        this.swac_observers = new Map();
        this.sname = comp.requestor.id + ' WatchableSourceView';
        this.count = 0;

        // Set WatchableSourceView into components data storage
        comp.data[this.swac_fromName] = this;
        // Watch the Model.store for changes in the Source there (central store)
        watchablesource.addObserver(this);
        // Let the requesting component watch the source to get informed about data changes
        this.addObserver(comp);
    }

    /**
     * Returns the number of sets available in this WatchableSourceView
     * 
     * @return {int} Number of WatchableSets
     */
    count() {
        return this.count;
    }

    hasSet(id) {
        return typeof this.sets[id] !== 'undefined' && this.sets[id] !== null;
    }

    getSet(id) {
        return this.sets[id];
    }

    getSets() {
        return this.sets;
    }

    addSet(set) {
        // Auto add id if no one is given
        if(!set.id)
            set.id = this.sets.length;
        this.count++;
        Msg.flow('WatchableSourceView', 'Dataset >' + set.swac_fromName + '[' + set.id + ']< added.', this.requestor);
        this.sets[set.id] = set;
        for (let curObserver of this.swac_observers.keys()) {
            curObserver.notifyAddSet(this, set);
        }
    }

    delSet(set) {
        Msg.flow('WatchableSourceView', 'Dataset >' + set.swac_fromName + '[' + set.id + ']< deleted.', this.requestor);
        delete this.sets[set.id];
        this.count--;
        for (let curObserver of this.swac_observers.keys()) {
            curObserver.notifyDelSet(set);
        }
    }

    /**
     * Adds an observer that will be informed on data changes
     * 
     * @param {Object} observer Object that has a notifyData(WatchableSourceView,set.id,set) function
     * @returns {undefined}
     */
    addObserver(observer) {
        // Prevent use observer more than one time
        if (!this.swac_observers.has(observer)) {
            let req = observer.sname ? observer.sname : observer.requestor.id;
            Msg.flow('WatchableSourceView', 'Added observer >' + req + '< for source >' + this.swac_fromName + '(' + this.sname + ')<');
            // Check observer
            if (typeof observer.notifyAddSet !== 'function') {
                Msg.error('WatchableSourceView', 'The object added has no notifyAddSet(WatchableSourceView,WatchableSet) function.');
                console.log(observer);
                return;
            }
            if (typeof observer.notifyDelSet !== 'function') {
                Msg.error('WatchableSourceView', 'The object added has no notifyDelSet() function.');
                console.log(observer);
                return;
            }
            // Inform of existing sets
            for (let curSet of this.sets) {
                if (curSet)
                    observer.notifyAddSet(this, curSet);
            }
            this.swac_observers.set(observer, 1);
        }
    }

    /**
     * Deletes an observer
     * 
     * @param {Object} observer Object that has a notifyData(WatchableSourceView,set.id,set) function
     * @returns {undefined}
     */
    delObserver(observer) {
        if (this.swac_observers.has(observer)) {
            this.swac_observers.delete(observer);
            // Also delete from sets
            for (let curSet of this.getSets()) {
                if (!curSet)
                    continue;
                curSet.delObserver(observer);
            }
        }
    }

    /**
     * Recive notify from another WatchableSource
     * 
     * @param {WatchableSource} source Source where set was added
     * @param {WatchableSet} set Set to add 
     */
    notifyAddSet(source, set) {
        console.log('TEST WatchableSourceView source: ' + source);
        Msg.flow('WatchableSource', 'NOTIFY about added set >' + set.swac_fromName + '[' + set.id + ']< in >' + source.swac_fromName + '(' + this.requestor.id + ')< recived for Source >' + this.swac_fromName + '(' + this.requestor.id + ')<', this.requestor);
        // Check if set is accepted by requestor
        if (!this?.requestor?.swac_comp.checkAcceptSet(set))
            return;
        
        this.addSet(set);
    }

    /**
     * Recive notify from another WatchableSource of a deleted set. Delets the set in this WatchableSet if it is there.
     * 
     * @param {WatchableSet} set Set to delete 
     */
    notifyDelSet(set) {
        Msg.flow('WatchableSourceView', 'NOTIFY about deleted set >' + set.swac_fromName + '[' + set.id + ']< recived for Source >' + this.swac_fromName + '(' + this.requestor.id + ')<', this.requestor);
        if (!this.sets[set.id]) {
            return;
        }
        this.delSet(set);
    }

    toString() {
        return 'WatchableSourceView(' + this.swac_fromName + ')';
    }
}
