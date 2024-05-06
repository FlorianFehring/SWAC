import SWAC from '../../swac.js';
import View from '../../View.js';
import Msg from '../../Msg.js';

export default class Loadingbar extends View {

    constructor(options = {}) {
        super(options);
        this.name = 'Loadingbar';
        this.desc.text = 'Create a loadingbar with possibility to update status from other components or code.';
        this.desc.developers = 'Florian Fehring (FH Bielefeld)';
        this.desc.license = 'GNU Lesser General Public License';
        
        this.desc.templates[0] = {
            name: 'loadingbar',
            style: 'loadingbar',
            desc: 'Contains the visual progress element.'
        };
        this.desc.reqPerTpl[0] = {
            selc: '.swac_loadingbar_elem',
            desc: 'HTML progress element that would be modified to show the progress of an operation.'
        };

        this.options.showWhenNoData = true;
        this.desc.opts[0] = {
            name: 'value',
            desc: 'DEPREACTED The value for the loading bar',
            example: 75
        };
        if (!options.value)
            this.options.value = null;
        this.desc.opts[1] = {
            name: 'max',
            desc: 'The maximum that can be reached by the value',
            example: 100
        };
        if (!options.max)
            this.options.max = null;

        this.desc.funcs[0] = {
            name: 'addValue',
            desc: 'Adds a value to the current value and hide all element if the value reach the max value.',
            params: [
                {
                    name: 'value',
                    desc: 'Value to add to loadingbar'
                }
            ]
        };
        this.desc.funcs[0] = {
            name: 'errorState',
            desc: 'Sets the loading bar to the error status and colors it red.'
        };
        this.desc.funcs[0] = {
            name: 'clearErrorState',
            desc: 'Clears the error status'
        };
    }
    init() {
        return new Promise((resolve, reject) => {
            let loadingbar_elem = this.requestor.querySelector('.swac_loadingbar_elem');
            // Register value and max
            if (this.options.max !== null) {
                loadingbar_elem.setAttribute("max", this.options.max);

                if (this.options.value !== null) {
                    loadingbar_elem.setAttribute("value", this.options.value);
                } else {
                    this.options.value = 0;
                    loadingbar_elem.setAttribute("value", this.options.value);
                }

                this.hideAll();
                resolve();
            } else {
                Msg.error('Loadingbar', 'The option max is missing.', this.requestor);
                reject();
            }
        });
    }

    addValue(value = 1) {
        if (value > 0) {
            let loadingbar_elem = this.requestor.querySelector('.swac_loadingbar_elem');
            this.options.value += value;
            loadingbar_elem.setAttribute("value", this.options.value);
            if (this.options.value >= this.options.max) {
                this.hideAll();
            }
        }
    }

    errorState() {
        let loadingbar_elem = this.requestor.querySelector('.swac_loadingbar_elem');
        loadingbar_elem.classList.add("uk-progress-danger");
    }

    clearErrorState() {
        let loadingbar_elem = this.requestor.querySelector('.swac_loadingbar_elem');
        loadingbar_elem.classList.remove("uk-progress-danger");
    }

    /**
     * Removes the class "swac_dontdisplay" to show all elements.
     */
    showAll() {
        this.requestor.classList.remove("swac_dontdisplay");
    }

    /**
     * Adds the class "swac_dontdisplay" to hide all elements.
     */
    hideAll() {
        this.requestor.classList.add("swac_dontdisplay");
    }

    /**
     * Resets the loading bar 
     */
    reset() {
        this.options.value = 0;
        this.requestor.classList.remove("swac_dontdisplay");
    }
}