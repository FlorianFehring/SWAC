import SWAC from '../../../../swac.js';
import Msg from '../../../../Msg.js';
import Plugin from '../../../../Plugin.js'

export default class TableFilterSPL extends Plugin {

    constructor(pluginconf) {
        super(pluginconf);
        this.name = 'Present/plugins/TableFilter';
        this.desc.text = 'Adds input fields to headlines when useing a table based template, that allows filter for values';
        this.desc.developers = 'Florian Fehring (FH Bielefeld)';
        this.desc.license = 'GNU Lesser General Public License';
        
        // internal attributes
        this.registered = false;
    }

    init() {
        return new Promise((resolve, reject) => {
                   
            resolve();
        });
    }
    
    afterAddSet(set, repeateds) {
        if(!this.registred) {
            // Search table headers
            let ths = this.requestor.parent.querySelectorAll('th');
            for(let curTh of ths) {
                // Exclude empty headers
                if(curTh.innerHTML === '')
                    continue;
                let curFilterInp = document.createElement('input');
                curFilterInp.classList.add('uk-input');
                curFilterInp.classList.add('uk-form-small');
                let lngentr = SWAC.lang.dict['Present_TableFilter'].filterinp;
                curFilterInp.setAttribute('uk-tooltip',lngentr);
                curFilterInp.setAttribute('swac_table_filter_attrname',curTh.innerHTML);
                curFilterInp.addEventListener('input', this.onInputChange.bind(this));
                curTh.appendChild(curFilterInp);
            }
            this.registred = true;
        }
    }
    
    /**
     * Executed when an input changes in one filter field
     */
    onInputChange(evt) {
        // Reset visibility
        let alltrs = this.requestor.parent.querySelectorAll('.swac_repeatedForSet');
        for(let curTr of alltrs) {
            curTr.classList.remove('swac_dontdisplay');
        }
        
        let attrname = evt.target.getAttribute('swac_table_filter_attrname');
        // Get search expression
        let expr = evt.target.value;
        // Do not filter if expr is empty
        if(expr === '') {
            return;
        }
        // Get all elems of this attribute
        let outElems = this.requestor.parent.querySelectorAll('[attrname="' + attrname + '"]');
        for(let curOutElem of outElems) {
            // Check elements content
            let cont = curOutElem.innerHTML;
            let tr = curOutElem.parentElement;
            while(tr.nodeName !== 'TR' && tr.parentElement) {
                tr = tr.parentElement;
            }
            if(expr.startsWith('^=')) {
                let search = expr.replace('^=','');
                if(!cont.startsWith(search)) {
                    tr.classList.add('swac_dontdisplay');
                }
            } else if(expr.startsWith('$=')) {
                let search = expr.replace('$=','');
                if(!cont.endsWith(search)) {
                    tr.classList.add('swac_dontdisplay');
                }
            } else if(expr.startsWith('*=')) {
                let search = expr.replace('*=','');
                if(!cont.includes(search)) {
                    tr.classList.add('swac_dontdisplay');
                }
            } else if(expr.startsWith('=')) {
                let search = expr.replace('=','');
                if(cont !== search) {
                    tr.classList.add('swac_dontdisplay');
                }
            } else {
                if(cont !== expr) {
                    tr.classList.add('swac_dontdisplay');
                }
            }
        }
    }
}