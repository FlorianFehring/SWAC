import Msg from './Msg.js';
/* 
 * Makes data watchable for changes
 */
export default class WatchableSet {

    constructor(set) {
        this.swac_childs = [];
        this.swac_observers = new Map();
        this.swac_allobservers = [];
        this.swac_attrobservers = [];
        this.swac_types = new Map();
        this.swac_transaction = false;
        this.swac_transmods = [];
        this.swac_latschanged = null;
        this.swac_proxy = new Proxy(this, {
            get(target, name, handler) {
                return Reflect.get(target, name, handler);
            },
            set(target, name, value, handler) {
                if (name === 'set_json')
                    return this.setJson(target, value, handler);
                if (value != null && !target.swac_types.get(name) && typeof value !== 'undefined') {
                    target.swac_types.set(name, typeof value)
                    // Ensure type security for numbers
                } else if (target.swac_types.get(name) === 'number' && isNaN(value)) {
                    value = parseInt(value);
                    if (isNaN(value))
                        value = 0;
                } else if (target.swac_types.get(name) === 'boolean' && typeof value !== 'boolean') {
                    if (value === 'true')
                        value = true;
                    else
                        value = false;
                }
                // Check if value has changed
                let oldval = Reflect.get(target, name, handler);
                let t = Reflect.set(target, name, value, handler);
                if (oldval !== value) {
                    target.swac_latschanged = name;
                    Reflect.set(target, 'swac_prev_' + name, oldval, handler);
                    if (target.swac_transaction) {
                        target.swac_transmods.push(name);
                        return t;
                    }
                    target.notifyObservers(name, value, oldval);
                }
                return t;
            },
            setJson(target, json, receiver) {
                try {
                    let jsonobj = JSON.parse(json);
                    // Set new attribute values
                    for (let curAttr in jsonobj) {
                        this.set(target, curAttr, jsonobj[curAttr], receiver);
                    }
                    // Detect removed attributes in 
                    for (let curAttr in target) {
                        // Ignore internal
                        if (curAttr.startsWith('swac_'))
                            continue;
                        if (!jsonobj[curAttr]) {
                            this.set(target, curAttr, null, receiver);
                        }
                    }
                } catch (err) {
                    // While input not always parseable, but no problem
                }
                return true;
            }
        });
        // Setting attribute values
        for (let curAttr in set) {
            this.swac_proxy[curAttr] = set[curAttr];
        }
        //IMPORTANT: Return of proxy routes every attribute sets (e.g. set.value = 100) 
        // over the above declared set(target, name, value, handler) method
        // this allows capture of changes and informing of observers
        return this.swac_proxy;
    }

    /**
     * Adds an observer that will be informed on data changes
     * 
     * @param {Object} observer Object that has a notify(attrName,value) function
     * @param {String} attrName Name of the attribute the observer wants to observe
     * @returns {undefined}
     */
    addObserver(observer, attrName) {
        if (typeof observer.notifyChangedValue !== 'function') {
            Msg.error('WatchableSet', 'The object added has no notifyChangedValue() function.');
            return;
        }
        // Add general observer
        if (!attrName) {
            if (!this.swac_allobservers.includes(observer))
                this.swac_allobservers.push(observer);
        } else {
            // Create observers array for attr when needed
            if (!this.swac_observers.has(attrName)) {
                this.swac_observers.set(attrName, []);
            }
            // Prevent use observer more than one time
            if (!this.swac_observers.get(attrName).includes(observer)) {
                this.swac_observers.get(attrName).push(observer);
            }
        }
    }

    /**
     * Deletes an observer
     * 
     * @param {Object} observer Object that has a notify(attrName,value) function
     * @returns {undefined}
     */
    delObserver(observer) {
        let pos_all = this.swac_allobservers.indexOf(observer);
        if (pos_all >= 0)
            delete this.swac_allobservers[pos_all];
    }

    /**
     * Adds an observer that will be informed if attributes where added or removed
     * 
     * @param {Object} observer Object that has a notify(set, attrName,value) function
     * @returns {undefined}
     */
    addObserverForAttr(observer) {
        if (typeof observer.notifyAddedValue !== 'function') {
            Msg.error('WatchableSet', 'The object added has no notifyAddedValue() function.');
            return;
        }
        // Prevent use observer more than one time
        if (!this.swac_attrobservers.includes(observer)) {
            this.swac_attrobservers.push(observer);
        }
    }
    /**
     * Recives a notification about a change of data in a object that
     * uses the data
     * 
     * @param {String} attrName Name of the attribut that changes
     * @param {Object} value New value
     * @returns {undefined}
     */
    notify(attrName, value) {
        // Update data
        if (this[attrName] !== value) {
            this[attrName] = value;
        }
    }

    /**
     * Get the json representation of the dataset
     */
    get set_json() {
        let json = JSON.stringify(this, (key, value) => {
            if (typeof value !== 'undefined' && value !== null && !key.startsWith('swac_'))
                return value;
        }, 2);
        json = json.replaceAll('null,\n', '');
        return json;
    }

    /**
     * Set the data in dataset from json
     */
    set set_json(json) {
        //TODO set values from json and inform observers
    }

    copy() {
        let newSet = {};
        for (let curAttr in this) {
            if (!curAttr.startsWith('swac_') && curAttr !== 'id') {
                newSet[curAttr] = this[curAttr];
            }
        }
        return new WatchableSet(newSet);
    }

    /**
     * Opens a transaction. Does not inform observers for attributes on changes
     */
    transaction() {
        this.swac_transaction = true;
        this.swac_transmods = [];
    }

    /**
     * Closes a transaction. Informs all observes one time
     */
    commit() {
        Msg.flow('WatchableSet', 'Commit changes of >' + this.swac_fromName + '[' + this.id + ']<');
        let informed = [];
        let infobservers = this.swac_allobservers;
        for (let curModAttr of this.swac_transmods) {
            let modObs = this.swac_observers.get(curModAttr);
            if (modObs) {
                infobservers = infobservers.concat(modObs);
            }
        }

        for (let curObserver of infobservers) {
            if (curObserver.notifyCommit && !informed.includes(curObserver)) {
                curObserver.notifyCommit(this);
                informed.push(curObserver);
            }
        }
        this.swac_transaction = false;
    }

    /**
     * Notify all observers about changed or added values
     * 
     * @param {String} name Attributes name that changed
     * @param {Object} value Attributes new value
     * @param {Object} oldval Attributes previous value
     */
    notifyObservers(name, value, oldval) {
        if (name.startsWith('swac_'))
            return;
        // Value change observers
        let set = this.swac_proxy;
//        Msg.flow('WatchableSet','Notify observers about changed value: ' + value + ' was ' + oldval + ' on attribute: ' + name, this.requestor);
        // Attribute modify observers
        if (value !== null && typeof oldval === 'undefined') {
            let attrobservers = this.swac_allobservers;
            if (set.swac_attrobservers)
                attrobservers = attrobservers.concat(set.swac_attrobservers);
            for (let curObserver of attrobservers) {
                if(!curObserver)
                    continue;
                Msg.flow('WatchableSet', 'Notify >' + curObserver.requestor.id + '< about new attribute >' + set.swac_fromName + '[' + set.id + '].' + name + '< =' + value);
                if (curObserver.notifyAddedValue)
                    curObserver.notifyAddedValue(set, name, value);
            }
        } else {
            let valobservers = set.swac_allobservers;
            if (set.swac_observers.has(name))
                valobservers = valobservers.concat(set.swac_observers.get(name));
            let informed = [];
            for (let curObserver of valobservers) {
                if(!curObserver)
                    continue;
                if(curObserver.nodeType === 1 && !curObserver.parentNode) {
                    this.delObserver(curObserver);
                    continue;
                }
                //TODO Workaround do not inform bindPoint duplicates
                if (curObserver.elem && informed.includes(curObserver.elem)) {
                    continue;
                }
                Msg.flow('WatchableSet', 'Notify >' + curObserver.requestor.id + '< about changed value for >' + set.swac_fromName + '[' + set.id + '].' + name + '< now: ' + value + ' was: ' + oldval);
                if (curObserver.notifyChangedValue(set, name, value) === false)
                    break;
                informed.push(curObserver.elem);
            }
        }
    }

    /**
     * Creates a string representation of this WatchableSet
     * 
     * @return {String} WatchableSets String representation 
     */
    toString() {
        let setstr = '{';
        let i = 0;
        for (let curAttr in this) {
            if (!curAttr.startsWith('swac_')) {
                if (i > 0)
                    setstr += ', ';
                setstr += curAttr + ' = ' + this[curAttr];
                i++;
            }
        }
        setstr += '}';
        return setstr;
    }
}
