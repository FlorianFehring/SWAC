import SWAC from '../../swac.js';
import Msg from '../../Msg.js';
import DomainObserver from '../../algorithms/ConstraintSolver/DomainObserver.js';

/* 
 * DomianObserver for edit fields
 */
export default class EditDomainObserver extends DomainObserver {

    fromName = null;
    setid = null;
    attr = null;
    requestor = null;
    
    constructor(fromName,setid,attr,requestor) {
        super();
        this.fromName = fromName;
        this.setid = setid;
        this.attr = attr;
        this.requestor = requestor;
    }

    /**
     * Gets notified by the DomainCollection
     * Exchanges the actual with the new available select options or limits
     * 
     * @param {String} attr Name of the attribute
     * @param {Definition} def Definition for the attribute incl. possible values or min / max
     */
    notify(attr, def) {
        // Check matching attr
        if (attr !== this.attr) {
            Msg.error('EditDomainObserver', 'Delivered definition for attribute >' + attr + '< does not match the expected >' + name + '<', this.requestor);
            return;
        }
        // Get input elements
        let repForSets;
        if(this.requestor.swac_comp.options.mainSource && this.requestor.swac_comp.options.mainSource !== this.fromName) {
            repForSets = this.requestor.querySelectorAll('.swac_repeatedForChild[swac_fromname="'+this.fromName+'"][swac_setid="'+this.setid+'"]');
        } else {
            repForSets = this.requestor.querySelectorAll('.swac_repeatedForSet[swac_fromname="'+this.fromName+'"][swac_setid="'+this.setid+'"]');
        }
        
        //TODO use multiple elements
        let elem = null;
        for(let curRepFor of repForSets) {
            elem = curRepFor.querySelector('[name="'+this.attr+'"]');
            if(elem)
                break;
        }
        if(!elem) {
            Msg.error('EditDomainObserver','Could not find input element for >' + this.fromName + '[' + this.setid + '].' + attr +'<', this.requestor);
            return;
        }
        
        if (elem.nodeName === 'SELECT') {
            // Get selected option
            let selValue = elem.options[elem.selectedIndex].value;
            // Delete old options
            for (let curOpt of elem.querySelectorAll('option')) {
                curOpt.remove();
            }
            // Add default option
            let noSelectionNode = document.createElement('option');
            noSelectionNode.value = '';
            noSelectionNode.innerHTML = SWAC.lang.dict.Edit.noselection;
            elem.appendChild(noSelectionNode);
            // Add actual options
            for (let curOpt of def.possibleValues) {
                let optNode = document.createElement('option');
                optNode.value = curOpt;
                optNode.innerHTML = curOpt;
                elem.appendChild(optNode);
                if (selValue && selValue === curOpt) {
                    optNode.selected = 'selected';
                } else if (def.defaultvalue && def.defaultvalue === curOpt) {
                    optNode.selected = 'selected';
                }
            }
        } else if (elem.nodeName === 'INPUT') {
            if (def.min) {
                elem.setAttribute('min', def.min);
            }
            if (def.max) {
                elem.setAttribute('max', def.max);
            }
        } else {
            Msg.error('EditDomainObserver', 'Notify with changed definitions for not supported nodeName >' + elem.nodeName + '< recived.');
        }
    }
}
