import DomainValue from './DomainValue.js';

/**
 * Represents a simple selectable entry
 */
export default class SelectEntry extends DomainValue {

    value = null

    constructor(value) {
        super();
        this.value = value;
        this.type = 'SelectEntry';
    }

    copy() {
        return new SelectEntry(this.value);
    }
    
    startsWith(string) {
        return this.value.startsWith(string);
    }
    
    endsWith(string) {
        return this.value.endsWith(string);
    }
}

