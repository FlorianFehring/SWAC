import SWAC from '../../swac.js';
import View from '../../View.js';
import Msg from '../../Msg.js';

export default class Form extends View {

    constructor(options = {}) {
        super(options);
        this.name = 'Form';
        this.desc.text = 'A customisable form component. Easier to use than the complex Edit component. Focosing on get data from form elements and send them.';
        this.desc.developers = 'Florian Fehring (HSBI)';
        this.desc.license = 'GNU Lesser General Public License';

        this.desc.templates[0] = {
            name: 'default',
            desc: 'Default template.'
        };
        this.desc.templates[1] = {
            name: 'form_webPush_notifications',
            style: 'form_webPush',
            desc: 'Form to create new notification'
        };
        this.desc.templates[2] = {
            name: 'form_webPush_trigger',
            style: 'form_webPush',
            desc: 'Form to create new trigger'
        };
        this.desc.reqPerTpl[0] = {
            selc: 'form',
            desc: 'Form element with input elements. Any input element value will be send with the name from the input elemtns name attribute.'
        };

        this.desc.opts[0] = {
            name: "target",
            desc: "Target URL or sourcename where to send form data. Data is send to this URL with POST method and JSON payload. Note: If this options is not set and a FROM clause is defined data will be send to that source.",
            example: {
                name: "My Name",
                message: "My message"
            }
        };
        if (!options.target)
            this.options.target = null;

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
        // Set configured target
        if (this.options.target) {
            dataCapsule.fromName = this.options.target;
        }
        if (!dataCapsule.fromName) {
            UIkit.modal.alert(SWAC.lang.dict.Form.target_missing);
        }

        let dataset = {};
        if (this.options.saveAlongData !== null) {
            dataset = Object.assign({}, this.options.saveAlongData);
        }

        // Get any input field
        for (let curInput of formElem.elements) {
            if (!curInput.name) continue;
            if (curInput.type === 'checkbox') {
                dataset[curInput.name] = curInput.checked;
                continue;
            }
            if (curInput.tagName === 'SELECT' && curInput.multiple) {
                const selectedValues = Array.from(curInput.options)
                    .filter(opt => opt.selected)
                    .map(opt => opt.value);
                dataset[curInput.name] = selectedValues;
                continue;
            }
            if (curInput.value !== undefined && curInput.value !== '') {
                dataset[curInput.name] = curInput.value;
            }
        }
        dataCapsule.data = [dataset];
        console.log(dataCapsule.data)
        let thisRef = this;
        Model.save(dataCapsule).then(function (data) {
            thisRef.afterSave(dataCapsule);
            if (thisRef.options.customAfterSave) {
                thisRef.options.customAfterSave.bind(thisRef);
                try {
                    thisRef.options.customAfterSave(data);
                } catch (e) {
                    Msg.error('Component', 'Error execution options.customAfterSave(): ' + e, this.requestor);
                }
            }
        }).catch(function (error) {
            UIkit.modal.alert(SWAC.lang.dict.core.model_saveerror);
            Msg.error('Component', 'Could not save because of: ' + error);
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
        super.afterAddSet(set, repeateds);

        return;
    }
}


