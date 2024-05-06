import SWAC from '../../swac.js';
import View from '../../View.js';
import Msg from '../../Msg.js';

export default class Ecomode extends View {

    constructor(options = {}) {
        super(options);
        this.name = 'Ecomode';
        this.desc.text = 'Displays a switch to activte eco mode with more energy save useings.';
        this.desc.developers = 'Florian Fehring';
        this.desc.license = '(c) by Florian Fehring';

        this.desc.templates[0] = {
            name: 'ecomode',
            style: 'ecomode',
            desc: 'Default template.'
        };
        this.desc.reqPerTpl[0] = {
            selc: '.ecobtn',
            desc: 'Button to avtivate or deactivate the eco mode.'
        };

        if (!options.showWhenNoData)
            this.options.showWhenNoData = true;
    }

    init() {
        return new Promise((resolve, reject) => {
            // Register function for click on eco mode btn
            let ecoBtns = document.querySelectorAll('.swac_ecomode_btn');
            for (let ecoBtn of ecoBtns) {
                ecoBtn.style.filter = 'grayscale(100%)';
                ecoBtn.addEventListener('click', this.toggleecomode.bind(this));
            }
            resolve();
        });
    }

    /** Toggles the eco mode 
     * 
     * @param {DOMEvent} evt Event when user press the eco mode button
     **/
    toggleecomode(evt) {
        evt.preventDefault();

        // Get all components on page
        let comps = document.querySelectorAll('[swa]');
        for (let curComp of comps) {
            curComp.swac_comp.toggleEcoMode();
        }

        let ecoBtns = document.querySelectorAll('.swac_ecomode_btn');
        for (let ecoBtn of ecoBtns) {
            if(ecoBtn.style.filter === 'grayscale(100%)')
                ecoBtn.style.filter = 'grayscale(0%)';
            else
                ecoBtn.style.filter = 'grayscale(100%)';
        }

        return;
    }
}


