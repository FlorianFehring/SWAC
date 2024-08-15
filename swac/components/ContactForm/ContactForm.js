import SWAC from '../../swac.js';
import View from '../../View.js';
import Msg from '../../Msg.js';

export default class ContactForm extends View {

    constructor(options = {}) {
        super(options);
        this.name = 'ContactForm';
        this.desc.text = 'A customisable contact form';
        this.desc.developers = 'Florian Fehring';
        this.desc.license = '(c) by Florian Fehring';

        this.desc.templates[0] = {
            name: 'default',
            desc: 'Default template.'
        };
        this.desc.reqPerTpl[0] = {
            selc: 'form',
            desc: 'Form element with input elements. Any input element value will be send with the name from the input elemtns name attribute.'
        };
        if (!options.showWhenNoData)
            this.options.showWhenNoData = true;
    }

    init() {
        return new Promise((resolve, reject) => {

            // Register event handler on form submit
            let formElem = this.requestor.querySelector('form');
            formElem.addEventListener('submit', this.onSubmit.bind(this));

            resolve();
        });
    }

    /**
     * Executed when submitting the form
     */
    onSubmit(evt) {
        // Do not submit per HTML (would reload page)
        evt.preventDefault();
        
        // Get form
        let formElem = this.requestor.querySelector('form');

        // Get the model
        let Model = window.swac.Model;
        // Build dataCapsule
        let dataCapsule = {
            fromName: this.getMainSourceName()
        };
        let dataset = {};
        if (this.options.saveAlongData !== null) {
            dataset = Object.assign({}, this.options.saveAlongData);
        }
        
        // Get any input field
        for(let curInput of formElem.elements) {
            // use only those with name and value
            if(curInput.name && curInput.value) {
                dataset[curInput.name] = curInput.value;
            }
        }
        dataCapsule.data = [dataset];

        // Request data (returns promise)
        Model.save(dataCapsule).then(function (dataCaps) {

        }).catch();
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
        super.afterAddSet(set, repeateds);

        return;
    }
}


