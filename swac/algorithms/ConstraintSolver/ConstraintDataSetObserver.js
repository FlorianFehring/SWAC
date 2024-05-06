import SWAC from '../../swac.js';
import Msg from '../../Msg.js';

export default class ConstraintDataSetObserver {
    cs = null;
    set = null;
    requestor = null;

    constructor(cs, set) {
        this.cs = cs;
        this.set = set;
        this.requestor = cs.requestor;
        for (let curAttr in set) {
            if (!curAttr.startsWith('swac_')) {
                Msg.flow('ConstriantDataSetObserver','Registering observer for attribute >' + curAttr + '< on >' + set.swac_fromName + '[' + set.id + ']<');
                set.addObserver(this, curAttr);
            }
        }
    }

    /**
     * Gets informed about a changed value on the dataset
     * and informs the constraintsolver about that change
     */
    notifyChangedValue(set, attr, value) {
        Msg.flow('ConstraintDataSetObserver', 'Notify about changed value recived in ConstraintsDataSetObserver: ' + attr + ' is now ' + value);
        this.cs.setOccupancy(this.set.swac_fromName, this.set.id, attr, value);
    }
}
