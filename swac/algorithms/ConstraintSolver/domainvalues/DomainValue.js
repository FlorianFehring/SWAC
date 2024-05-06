export default class DomainValue {
    
    toString() {
        return this.value;
    }
    
    copy() {
        throw 'Subclasses of DomainValue have to implement copy()';
    }
}
