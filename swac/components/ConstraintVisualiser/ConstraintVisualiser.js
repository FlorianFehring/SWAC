import SWAC from '../../swac.js';
import View from '../../View.js';
import Msg from '../../Msg.js';

export default class ConstraintVisualiser extends View {

    constructor(options = {}) {
        super(options);
        this.name = 'ConstraintVisualiser';
        this.desc.text = 'Component for visualising constraint solveing';
        this.desc.developers = 'Florian Fehring (HSBI)';
        this.desc.license = 'GNU Lesser General Public License';
        
        this.desc.depends[0] = {
            name: 'ConstraintSolver',
            algorithm: 'ConstraintSolver',
            desc: 'ConstraintSolver algorithm'
        };

        this.desc.templates[0] = {
            name: 'default',
            style: 'default',
            desc: 'Default template.'
        };

        this.desc.reqPerTpl[0] = {
            selc: 'swac_convisu_col',
            desc: 'Element to use for display of one domain-collection.'
        };
        this.desc.reqPerTpl[1] = {
            selc: 'swac_convisu_colname',
            desc: 'Element where to display the name of the domain-collection.'
        };
        this.desc.reqPerTpl[2] = {
            selc: 'swac_convisu_domain',
            desc: 'Element to repeat for every domain.'
        };
        this.desc.reqPerTpl[3] = {
            selc: 'swac_convisu_variable',
            desc: 'Element where to place the variable name.'
        };
        this.desc.reqPerTpl[4] = {
            selc: 'swac_convisu_values',
            desc: 'Element where to place the variable values.'
        };
        this.desc.reqPerTpl[5] = {
            selc: 'swac_convisu_constraint',
            desc: 'Element to repeat for every constraing.'
        };
        this.desc.reqPerTpl[6] = {
            selc: 'swac_convisu_constraint_var0',
            desc: 'Element where to place the name of the first constraint variable'
        };
        this.desc.reqPerTpl[7] = {
            selc: 'swac_convisu_constraint_var1',
            desc: 'Element where to place the name of the second constraint variable'
        };
        this.desc.reqPerTpl[8] = {
            selc: 'swac_convisu_constraint_func',
            desc: 'Element where to place the constraint function description.'
        };

        if (!options.showWhenNoData)
            this.options.showWhenNoData = true;

        this.desc.opts[0] = {
            name: "typeDefs",
            desc: "Definition of the datatypes that are available on the attributes."
        };
        if (!options.typeDefs)
            this.options.typeDefs = new Map();
        this.desc.opts[1] = {
            name: "domainDefs",
            desc: "Definition of the domains including constraint definitions."
        };
        if (!options.domainDefs)
            this.options.domainDefs = [];

        // Internal attributes
        this.solver;
    }

    /*
     * This method will be called when the component is complete loaded
     * At this thime the template code is loaded, the data inserted into the 
     * template and even plugins are ready to use.
     */
    init() {
        return new Promise((resolve, reject) => {
//            this.calculateCollections();
            resolve();
        });
    }

    // public function
    calculateCollections() {
        Msg.flow('ConstraintVisualiser', 'Begin calculate domains', this.requestor);
        // Accessing ConstraintSolver loaded by dependency
        this.solver = this.algorithms['ConstraintSolver'];
        this.solver.options.typeDefs = this.options.typeDefs;
        this.solver.options.domainDefs = this.options.domainDefs;
        this.solver.calcCollections();
        this.solver.calcAllDomainCollections();
        this.showDomains();
    }

    /**
     * Method thats called before adding a dataset
     * This overrides the method from View.js
     * 
     * @param {Object} set Object with attributes to add
     * @returns {Object} (modified) set
     */
    beforeAddSet(set) {
        // You can check or transform the dataset here
        return set;
    }

    /**
     * Method thats called after a dataset was added.
     * This overrides the method from View.js
     * 
     * @param {Object} set Object with attributes to add
     * @param {DOMElement[]} repeateds Elements that where created as representation for the set
     * @returns {undefined}
     */
    afterAddSet(set, repeateds) {
        // You can do after adding actions here. At this timepoint the template
        // repeatForSet is also repeated and accessable.
        // e.g. generate a custom view for the data.
        return;
    }

    showDomains() {
        Msg.flow('ConstraintVisualiser', 'Begin show domains', this.requestor);
        // Load templates
        let colTempl = this.requestor.querySelector('.swac_convisu_col');
        for (let [curColName, curDomainMap] of this.solver.domainCollections.entries()) {
            // Create domain information
            let curColArea = colTempl.cloneNode(true);
            curColArea.classList.remove('swac_dontdisplay');
            curColArea.querySelector('.swac_convisu_colname').innerHTML = curColName;
            let domainTempl = curColArea.querySelector('.swac_convisu_domain');
            for (let [curVarName, curVarValues] of curDomainMap.domains) {
                let curDomainArea = domainTempl.cloneNode(true);
                curDomainArea.querySelector('.swac_convisu_variable').innerHTML = curVarName;
                let curVarValuesTxt = '';
                let i = 0;
                for (let curVarValue of curVarValues) {
                    if (i > 0)
                        curVarValuesTxt += ', ';
                    if (curVarValue.toString) {
                        curVarValuesTxt += curVarValue.toString();
                    } else {
                        curVarValuesTxt += curVarValue.value;
                    }
                    i++;
                }
                curDomainArea.querySelector('.swac_convisu_values').innerHTML = curVarValuesTxt;
                domainTempl.parentNode.appendChild(curDomainArea);
            }
            // Create constrant information
            let conTempl = curColArea.querySelector('.swac_convisu_constraint');
            for (let [curName, curCons] of curDomainMap.constraints.entries()) {
                for (let curCon of curCons) {
                    let curConArea = conTempl.cloneNode(true);
                    curConArea.querySelector('.swac_convisu_constraint_var0').innerHTML = curCon.getVariable(0);
                    curConArea.querySelector('.swac_convisu_constraint_var1').innerHTML = curCon.getVariable(1);
                    curConArea.querySelector('.swac_convisu_constraint_func').innerHTML = curCon.toString();
                    conTempl.parentNode.appendChild(curConArea);
                }
            }
            // Add col information
            colTempl.parentNode.appendChild(curColArea);
        }
    }
}


