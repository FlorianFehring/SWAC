import SWAC from '../../swac.js';
import View from '../../View.js';
import Msg from '../../Msg.js';

export default class Dataanalyser extends View {

    constructor(options = {}) {
        super(options);
        this.name = 'Dataanalyser';
        this.desc.text = 'Data analysis tools';
        this.desc.developers = 'Florian Fehring (HSBI)';
        this.desc.license = 'GNU Lesser General Public License';
        
        this.desc.depends[0] = {
            name: 'Algorithm.js',
            path: SWAC.config.swac_root + 'Algorithm.js',
            desc: 'Base functions for algorithms'
        };
        this.desc.depends[1] = {
            name: 'DataAnalysis.js',
            path: SWAC.config.swac_root + 'algorithms/dataanalysis/DataAnalysis.js',
            desc: 'Deta analysis algorithms'
        };
        //TODO move this dependency to Algorithm
        this.desc.depends[2] = {
            name: 'NumericRange.js',
            path: SWAC.config.swac_root + 'algorithms/dataanalysis/NumericRange.js',
            desc: 'Representation class for NumericRange'
        };
        //TODO move this dependency to Algorithm
        this.desc.depends[3] = {
            name: 'Constraint.js',
            path: SWAC.config.swac_root + 'algorithms/dataanalysis/Constraint.js',
            desc: 'Representation class for Constraint'
        };
        this.desc.templates[0] = {
            name: 'default',
            style: 'default',
            desc: 'Default template.'
        };
        this.desc.reqPerTpl[0] = {
            selc: '.swac_dataanalyser_domains',
            desc: 'Area where to show the domains'
        };
        this.desc.reqPerTpl[1] = {
            selc: '.swac_dataanalyser_domainobject',
            desc: 'Area where to show the name of the domain object'
        };
        this.desc.reqPerTpl[2] = {
            selc: '.swac_dataanalyser_domain',
            desc: 'Area to repeat for every found domain'
        };
        this.desc.reqPerTpl[3] = {
            selc: '.swac_dataanalyser_variable',
            desc: 'Place where to show the variable name'
        };
        this.desc.reqPerTpl[4] = {
            selc: '.swac_dataanalyser_domains',
            desc: 'Place where do thow the domains possible values'
        };
        this.desc.optPerTpl[0] = {
            selc: 'cssSelectorForOptionalElement',
            desc: 'Description what is the expected effect, when this element is in the template.'
        };
        this.desc.optPerPage[0] = {
            selc: 'cssSelectorForOptionalElement',
            desc: 'Description what the component does with the element if its there.'
        };
        this.desc.reqPerSet[0] = {
            name: 'id',
            desc: 'The attribute id is required for the component to work properly.'
        };
        this.desc.optPerSet[0] = {
            name: 'nameOfTheAttributeOptionalInEachSet',
            desc: 'Description what is the expected effect, when this attribute is in the set.'
        };
        // opts ids over 1000 are reserved for Component independend options
        this.desc.opts[0] = {
            name: "OptionsName",
            desc: "This is the description of an option"
        };
        // Setting a default value, only applying when the options parameter does not contain this option
        if (!options.OptionsName)
            this.options.OptionsName = 'defaultvalue';
        // Sample for useing the general option showWhenNoData
        if (!options.showWhenNoData)
            this.options.showWhenNoData = true;
        // function ids over 1000 are reserved for Component independend functions
        this.desc.funcs[0] = {
            name: 'name of the function',
            desc: 'Functions description',
            params: [
                {
                    name: 'name of the parameter',
                    desc: 'Description of the parameter'
                }
            ]
        };

        // Internal attributes
        this.da;
    }

    /*
     * This method will be called when the component is complete loaded
     * At this thime the template code is loaded, the data inserted into the 
     * template and even plugins are ready to use.
     */
    init() {
        return new Promise((resolve, reject) => {

            // Run dataanalysis
            this.da = new DataAnalysis();
            this.da.init(this.data);
            this.da.calcCollections();
            this.da.calcAllDomains();

            this.showDomains();

            resolve();
        });
    }

    /**
     * Method thats called before adding a dataset
     * This overrides the method from View.js
     * 
     * @param {String} fromName Name of the resource, where the set comes from
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
        // Load templates
        let colTempl = this.requestor.querySelector('.swac_dataanalyser_col');

        console.log('show domains:');
        console.log(this.da.colDomains);
        for (let [curColName, curDomainMap] of this.da.colDomains.entries()) {
            console.log('cur domains:');
            console.log(curDomainMap);
            // Create domain information
            let curColArea = colTempl.cloneNode(true);
            curColArea.classList.remove('swac_dontdisplay');
            curColArea.querySelector('.swac_dataanalyser_colname').innerHTML = curColName;
            let domainTempl = curColArea.querySelector('.swac_dataanalyser_domain');
            for (let [curVarName, curVarValues] of curDomainMap) {
                console.log('curVarVls:');
                console.log(curVarValues);
                let curDomainArea = domainTempl.cloneNode(true);
                curDomainArea.querySelector('.swac_dataanalyser_variable').innerHTML = curVarName;
                let curVarValuesTxt = curVarValues;
                if(curVarValues.toString) 
                    curVarValuesTxt = curVarValues.toString();
                curDomainArea.querySelector('.swac_dataanalyser_values').innerHTML = curVarValuesTxt;
                domainTempl.parentNode.appendChild(curDomainArea);
            }
            // Create constrant information
            let conTempl = curColArea.querySelector('.swac_dataanalyser_constraint');
            let constraints = this.da.colConstraints.get(curColName);
            for(let [ curConName, curCon] of constraints.entries()) {
                let curConArea = conTempl.cloneNode(true);
                curConArea.querySelector('.swac_dataanalyser_constraint_var0').innerHTML = curCon.getVariable(0);
                curConArea.querySelector('.swac_dataanalyser_constraint_var1').innerHTML = curCon.getVariable(1);
                curConArea.querySelector('.swac_dataanalyser_constraint_func').innerHTML = curCon.toFuncString();
                conTempl.parentNode.appendChild(curConArea);
            }
            // Add col information
            colTempl.parentNode.appendChild(curColArea);
        }
    }
}


