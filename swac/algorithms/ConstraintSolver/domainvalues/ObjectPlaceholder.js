import DomainValue from './DomainValue.js';

export default class ObjectPlaceholder extends DomainValue {
    
    constructor(def) {
        super();
        this.def = def;
        this.type = 'ObjectPlaceholder';
    }
    
    toString() {
        let rep = 'Object with ';
        let i=0;
        for(let curKey of Object.keys(this.def)) {
            if(i > 0)
                rep += ', ';
            rep += curKey + ' = ' + this.def[curKey];
            i++;
        }
        return rep;
    }
    
    copy() {
        return new ObjectPlaceholder(this.def);
    }
}