import SWAC from '../../swac.js';
import View from '../../View.js';
import Msg from '../../Msg.js';

/**
 * Sample component for development of own components
 */
export default class Sample extends View {

    /*
     * Constructs a new component object and transfers the config to the
     * object
     */
    constructor(options = {}) {
        super(options);
        this.name = 'Sample';
        this.desc.text = 'Description of this component for documentation.';
        this.desc.developers = 'Florian Fehring (FH Bielefeld)';
        this.desc.license = 'GNU Lesser General Public License';
        
        // Include an external library that does not use export
        // Include files that use export by import statement at start of the file
        this.desc.depends[0] = {
            name: 'dependency.js',
            path: SWAC.config.swac_root + 'components/Sample/libs/dependency.js',
            desc: 'Description for what the file is required.',
            loadon: this.options.loaddependency     // Only load if this evaluates to true or is complely missing
        };
//        this.desc.depends[1] = {
//            name: 'NameOfTheAlgorithmComponent',
//            algorithm: 'NameOfTheAlgorithmComponent',
//            desc: 'Description why this algorithm is needed.'
//        };
        this.desc.templates[0] = {
            name: 'templatefilename',
            style: 'stylefilename',
            desc: 'Description of the template.'
        };
        this.desc.styles[0] = {
            selc: 'cssSelectorForTheStyle',
            desc: 'Description of the provided style.'
        };
        this.desc.reqPerTpl[0] = {
            selc: 'cssSelectorForRequiredElement',
            desc: 'Description why the element is expected in the template'
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
            desc: "This is the description of an option",
            example: {
                some1: "This is an example config for configuration",
                some2: "It can be any object / string / value",
                func1: function(t) { t.do(); }
            }
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
            ],
            returns: {
                desc: 'Describes the return value and the expected datatype.',
                type: 'String'
            }
        };
        
        //Documentation for events the component can fire
        this.desc.events[0] = {
            name: 'swac_REQUESTOR_ID_sample_click',
            desc: 'An event fired when the user clicks on the component.',
            data: 'Delivers the JS event object of the click event.'
        }
        
        // Definition of available plugins
        if (!options.plugins) {
            this.options.plugins = new Map();
            // Every plugin is a map entry
            this.options.plugins.set('SamplePlugin', {
                id: 'SamplePlugin',
                active: false       // On by default?
            });
        }
    }

    /*
     * This method will be called when the component is complete loaded
     * At this thime the template code is loaded, the data inserted into the 
     * template and even plugins are ready to use.
     */
    init() {
        return new Promise((resolve, reject) => {

            // here we can do what we want with the data and template.

            // we can access the data over the data attrbute
            console.log('Data inside the sample component:',this.data);
            Msg.flow('Sample', 'Flow messages symbolise a important waypoint in the programm', this.requestor);
            Msg.hint('Sample', 'With hint messages you can give developers help how to use your component', this.requestor);
            Msg.warn('Sample', 'Give warnings for example when an element in the template is missing', this.requestor);
            Msg.error('Sample', 'This is a sample of createing an error message', this.requestor);
            
            // Custom event
            this.requestor.addEventListener('click',function(e) {
                // Create and fire custom event
                document.dispatchEvent(new CustomEvent('swac_' + this.requestor.id + '_sample_click', {detail: e}))
            });
            resolve();
        });
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
        
        // Call Components afterAddSet and plugins afterAddSet
        super.afterAddSet(set,repeateds);
        
        return;
    }
}


