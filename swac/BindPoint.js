import Msg from './Msg.js';
export default class BindPoint extends HTMLElement {
    constructor(attrName, requestor) {
        super();
        if (!attrName && !this.getAttribute('attrName')) {
            Msg.error('BindPoint', 'BindPoint needs a attrName!', requestor);
        }
        if (attrName) {
            this.setAttribute('attrName', attrName);  // Name of the bindpoint (e.g. the values name)
        }
        this.elem = null;    // Element this bindpoint belongs to (only if not self element)
        this.attribute = null;  // Name of the attribute this bindpoint belongs to
        this.val = null;        // Value that the bindpoint displays
        this.startcont = null;  // Content before first insert
        this.set = null;        // Dataset this bindpoint belongs to
        this.requestor = requestor;
    }

    /**
     * Recives notifications from the dataset if that changes
     * 
     * @param {WatchableSet} set Set whichs value has changed
     * @param {String} attr Name of the attribute that changes
     * @param {Object} value Value of the changed attribute
     * @returns {undefined}
     */
    notifyChangedValue(set, attr, value) {
        Msg.flow('BindPoint',
                'Notification about new value >' + set.swac_fromName + '[' + set.id + '].' + attr + '< =' + value
                + ' recived.', this.requestor);
        //Update displayed data
        if (this.val !== value) {
            this.value = value;
        }
    }

    /**
     * Recive notification after commit change of dataset
     * 
     * @param {WatchableSet} set WatchableSet that was changed by commit
     */
    notifyCommit(set) {
//        Msg.flow('BindPoint', 'Notified about commit for >' + set.swac_fromName + '[' + set.id + ']<');
        let attrName = this.getAttribute('attrName');
        //Update displayed data
        if (this.val !== set[attrName]) {
            this.value = set[attrName];
        }
    }

    /**
     * Seter for lazy-databinding, should be placed on each data-object for databinding
     * 
     * @param {Object} value    New value of the attribute
     * @returns {undefined}
     */
    set value(value) {
        // Avoid resetting same value
        if (this.val === value) {
            return;
        }
        let attrName = this.getAttribute('attrName');
//        console.log('BindPoint.set value(): Value for >' + attrName
//                + '< was changed from >' + this.val + '< to: >' + value + '<');
        this.val = value;
        // Update value in dataset
        if (this.set[attrName] !== value) {
            this.set[attrName] = value;
        }
        // Insert initial placeholder as content
        let cont = this.startcont;
        if (!cont)
            cont = '';
        // Search each placeholder
        let regex = /({.*?})/g;
        let matches = cont.match(regex);
        if (matches) {
            for (let curMatch of matches) {
                let curAttrName = curMatch.replace('{', '').replace('}', '');
                let curAttrData = this.set[curAttrName];
                if (curMatch === '{*}' && typeof this.val === 'object')
                    cont = JSON.stringify(this.val);
                else if (curMatch === '{*}')
                    cont = this.val;
                else if (typeof curAttrData === 'undefined' || curAttrData === null)
                    cont = cont.replace(curMatch, '');
                else if (typeof curAttrData === 'object') {
                    cont = cont.replace(curMatch, JSON.stringify(curAttrData));
                } else
                    cont = cont.replace(curMatch, curAttrData);
            }
            // Set values depending of element or attribute
            if (this.attribute && this.elem.nodeName !== 'TEXTAREA')
                this.elem.setAttribute(this.attribute, cont);
            else
                this.elem.innerHTML = cont;
        }
    }

    get value() {
        return this.val;
    }

    /**
     * Sets the dataset for this bindpoint. Also sets the value from the dataset.
     * 
     * @param {Object} dataset Object containing the data for this bindpoint
     * @type type
     */
    set dataset(dataset) {
        let attrName = this.getAttribute('attrName');

        // Make dataset watchable if not allready so
        if (!dataset.notify) {
            throw('Given dataset is not observeable. Could not create BindPoint.');
        }
        dataset.addObserver(this, attrName);

        this.set = dataset;
        let val = dataset[attrName];
        if (attrName.includes('.')) {
            let nameParts = attrName.split('.');
            val = dataset;
            for (let curPart of nameParts) {
                if (!val[curPart]) {
                    val = null;
                    break;
                }
                val = val[curPart];
            }
        }
        if (typeof val !== 'undefined') {
            this.value = val;
        } else if (attrName !== 'attrName') {
            Msg.warn('BindPoint', 'There is no data for attribute >' + attrName
                    + '< of set >' + dataset.id + '<', this.requestor);
            this.value = undefined;
        }
    }

    get dataset() {
        return this.set;
    }

    set element(elem) {
        this.elem = elem;
        elem.swac_bp = this;
        let attrName = this.getAttribute('attrName');
        if (attrName === 'attrName')
            return;
        // Checkboxes can't be used for bindPoints
        if (elem.swac_bp.attribute && elem.swac_bp.attribute !== 'value' || elem.type === 'checkbox')
            return;

        // Needed when element is exchanged so that the event can be transfered to the new element
        elem.swac_inputListener = this.onValueChanged.bind(this);
        // Get change listener mode
        let changeMode;
        switch (elem.nodeName) {
            case 'INPUT':
            case 'TEXTAREA':
                changeMode = 'input';
                break;
            case 'SELECT':
            case 'DATALIST':
                changeMode = 'change';
                break;
            default:
                return;
        }
        elem.addEventListener(changeMode, this.onValueChanged.bind(this), false);
    }

    get element() {
        return this.elem;
    }

    /**
     * Called when value was changed on element
     * @type DOMEvent change event
     */
    onValueChanged(evt) {
        console.log('BindPoint.onValueChanged(): Value for >'
                + this.getAttribute('attrName') + '< was changed from >'
                + this.value + '< to >' + evt.target.value + '<'
                + ' on input element: >' + evt.target.id + '< with an >' + evt.type + '< event.', evt.target, this);
        this.value = evt.target.value;
    }
}
// Register bindpoint element
customElements.define('swac-bp', BindPoint);