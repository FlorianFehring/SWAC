import DomainValue from './DomainValue.js';

export default class NumericRange extends DomainValue {
    
    constructor(min, max) {
        super();
        this.min = min;
        this.max = max;
        this.type = 'NumericRange';
    }

    update(num) {
        this.updateMin(num);
        this.updateMax(num);
    }

    updateMin(num) {
        if (!this.min || num < this.min)
            this.min = num;
    }

    updateMax(num) {
        if (!this.max || num > this.max)
            this.max = num;
    }

    /**
     * Checks if the given value is within this range
     * 
     * @param {type} num
     * @returns {Boolean}
     */
    isInRange(num) {
        if (num > min && num < max)
            return true;
        return false;
    }
    
    toString() {
        return '[' + this.min + ' - ' + this.max + ']';
    }
    
    copy() {
        return new NumericRange(this.min,this.max);
    }
}


