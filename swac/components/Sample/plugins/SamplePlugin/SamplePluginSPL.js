import SWAC from '../../../../swac.js';
import Msg from '../../../../Msg.js';
import Plugin from '../../../../Plugin.js'

export default class SamplePluginSPL extends Plugin {

    constructor(options) {
        super(options);
        this.name = 'Sample/plugins/SamplePlugin';
        this.desc.templates[0] = {
            name: 'sampleplugin',
            desc: 'Default template with select sub component'
        };
        
        this.desc.opts[0] = {
            name: "modaloption",
            desc: "Example for a simple option of a plugin. Activates the opening of a modal on load.",
        };
        // Setting a default value, only applying when the options parameter does not contain this option
        if (!options.modaloption)
            this.options.modaloption = false;
    }

    init() {
        return new Promise((resolve, reject) => {
            // Do what you need here
            // Use sample option
            if(this.options.modaloption) {
                alert('This is the modal activated by the example modaloption!');
            }
            resolve();
        });
    }
    
    /**
     * Called when a new set was added to the component
     * 
     * @param {WatchableSet} set Dataset added
     */
    afterAddSet(set, repeateds) {
        console.log('Set was added to component',set);
    }
}