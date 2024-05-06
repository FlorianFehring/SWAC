import SWAC from '../../swac.js';
import View from '../../View.js';
import Msg from '../../Msg.js';

export default class Privacypopup extends View {

    constructor(options = {}) {
        super(options);
        this.name = 'Privacypopup';
        this.desc.text = 'Shows a popup with privacy information';
        this.desc.developers = 'Florian Fehring';
        this.desc.license = '(c) by Florian Fehring';

        this.desc.templates[0] = {
            name: 'privacypopup',
            desc: 'Default template.'
        };

        if (!options.showWhenNoData)
            this.options.showWhenNoData = true;
    }

    init() {
        return new Promise((resolve, reject) => {
            let state = localStorage.getItem('swac_privacypopup');
            if (!state) {
                let popElem = this.requestor.querySelector('#privacypopup');
                UIkit.modal(popElem).show().then(function (e) {
                    localStorage.setItem('swac_privacypopup',true);
                });
            }
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

    afterAddSet(set, repeateds) {
        return;
    }
}


