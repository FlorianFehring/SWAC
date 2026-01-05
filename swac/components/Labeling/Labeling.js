import SWAC from '../../swac.js';
import View from '../../View.js';
import Msg from '../../Msg.js';

export default class Labeling extends View {

    constructor(options = {}) {
        super(options);
        this.name = 'Labeling';
        this.desc.text = 'Component for labeling';
        this.desc.developers = 'Florian Fehring (HSBI)';
        this.desc.license = 'GNU Lesser General Public License';

        this.desc.templates[0] = {
            name: 'dropdown',
            desc: 'Default template.'
        };
        this.desc.templates[1] = {
            name: 'datalist',
            desc: 'Datalist template.'
        };
        this.desc.styles[0] = {
            selc: 'cssSelectorForTheStyle',
            desc: 'Description of the provided style.'
        };
        this.desc.reqPerTpl[0] = {
            selc: '.swac_repeatForAddLabel',
            desc: 'Element that should be repeated for every possible label.'
        };
        this.desc.reqPerTpl[1] = {
            selc: '.uk-label',
            desc: 'Element where the name of a selected label should be shown.'
        };
        this.desc.reqPerSet[0] = {
            name: 'id',
            desc: 'The attribute id is required for the component to work properly.'
        };
        this.desc.reqPerSet[1] = {
            name: 'label_id',
            desc: 'Labels id to retrive information from.'
        };
        this.desc.optPerSet[0] = {
            name: 'label.class',
            desc: 'Labels class. Added to the labeltags classList property.'
        };
        this.desc.optPerSet[1] = {
            name: 'label.name',
            desc: 'Labels name'
        };

        this.desc.opts[0] = {
            name: "labelSource",
            desc: "Name of the source where to find information about labels."
        };
        if (!options.labelSource) {
            this.options.labelSource = {
                fromName: 'label_labels'
            };
        }

        this.desc.opts[1] = {
            name: "labelidAttr",
            desc: "Name of the attributes that holds the labels id."
        };
        if (!options.labelidAttr)
            this.options.labelidAttr = 'label_id';

        this.desc.opts[2] = {
            name: "labeledidAttr",
            desc: "Name of the attributes that holds the id of the dataset that is labeld."
        };
        if (!options.labeledidAttr)
            this.options.labeledidAttr = 'labeled_id';

        this.desc.opts[3] = {
            name: 'sendAlongData',
            type: 'function',
            desc: 'Object with attributes that should be send everytime when saveing a label'
        };
        if (!options.sendAlongData)
            this.options.sendAlongData = null;

        if (typeof options.showWhenNoData === 'undefined')
            this.options.showWhenNoData = true;

        //Internal attributes
        this.repForElem;
        this.usableLabels = [];

        this.desc.optPerTpl[0] = {
            selc: '.label-wrapper',
            desc: 'Main wrapper that contains the label display, toggle button, and label management controls.'
        };
        this.desc.optPerTpl[1] = {
            selc: '.label-toggle-btn',
            desc: 'Button to open or close the label management controls.'
        };
        this.desc.optPerTpl[2] = {
            selc: '.label-container',
            desc: 'Container that displays all currently active labels.'
        };
        this.desc.optPerTpl[3] = {
            selc: '.label-controls',
            desc: 'Control panel for adding and removing labels, shown when the toggle button is activated.'
        };
        this.desc.optPerTpl[4] = {
            selc: '.label-add-input',
            desc: 'Input field with datalist to select an existing label to add.'
        };
        this.desc.optPerTpl[5] = {
            selc: '.label-add-btn',
            desc: 'Button that adds the selected label to the active labels.'
        };
        this.desc.optPerTpl[6] = {
            selc: '.label-remove-input',
            desc: 'Input field with datalist to select an active label to remove.'
        };
        this.desc.optPerTpl[7] = {
            selc: '.swac_repeatForDelLabel',
            desc: 'Template element that provides selectable labels for removal.'
        };
        this.desc.optPerTpl[8] = {
            selc: '.label-remove-btn',
            desc: 'Button that removes the selected label from the active labels.'
        };

    }

    init() {
        return new Promise((resolve, reject) => {

            this.repForElem = this.requestor.querySelector('.swac_repeatForSet');
            this.datalistElem = this.requestor.querySelector('#label-datalist');
            this.addInputElem = this.requestor.querySelector('.label-add-input');
            this.addBtnElem = this.requestor.querySelector('.label-add-btn');
//            this.removeSelectElem = this.requestor.querySelector('.label-remove-select');
            this.removeInputElem = this.requestor.querySelector('.label-remove-input');
            this.removeBtnElem = this.requestor.querySelector('.label-remove-btn');
            this.labelContainer = this.requestor.querySelector('.label-container');
            this.labelControls = this.requestor.querySelector('.label-controls');
            this.labelToggleBtn = this.requestor.querySelector('.label-toggle-btn');

            this.activeLabels = new Map();

            // Event listeners for adding/removing labels
            if (this.addBtnElem) {
                this.addBtnElem.addEventListener('click', this.onAddFromInput.bind(this));
            }
            if (this.removeBtnElem) {
                this.removeBtnElem.addEventListener('click', this.onRemoveFromInput.bind(this));
            }
            if (this.labelToggleBtn) {
                // Toggle + / − button to show/hide controls
                this.labelToggleBtn.style.marginTop = '3px';
                this.labelToggleBtn.addEventListener('click', () => {
                    const isVisible = this.labelControls.style.display === 'block';
                    this.labelControls.style.display = isVisible ? 'none' : 'block';
                    this.labelToggleBtn.textContent = isVisible ? '+' : '−';
                });
            }

            let thisRef = this;
            let Model = window.swac.Model;
            Model.load(this.options.labelSource).then(function (data) {
                thisRef.usableLabels = data;
                // Insert labels into gui
                for (let curLabel of data) {
                    if (!curLabel)
                        continue;
                    thisRef.addLabelToAddDatalist(curLabel);
                }
                resolve();
            }).catch(e => {
                Msg.error('Labeling', 'Error loading labels: ' + e, this.requestor);
                reject();
            });
        });
    }

    /**
     * Ensures that the label set has the required 'label.name' attribute for SWAC.
     * @param {Object} set Label set to be added
     * @returns {Object} The updated label set
     */
    beforeAddSet(set) {
        let labelId = set[this.options.labelidAttr];
        if (labelId != null && this.usableLabels[labelId]) {
            set['label.name'] = this.usableLabels[labelId].name;
        } else {
            console.warn('beforeAddSet: Label mit id', labelId, 'nicht gefunden');
        }
        return set;
    }

    /**
     * Method thats called before adding a dataset
     * This overrides the method from View.js
     * 
     * @param {Object} set Object with attributes to add
     * @returns {Object} (modified) set
     */

    afterAddSet(set, repeateds) {
        // Remove added active label from list of chooseable labels
        let repForElem = this.requestor.querySelector('.swac_repeatForAddLabel');
        let labelElem = repForElem.parentElement.querySelector('[swac_setid="' + set[this.options.labelidAttr] + '"]');
//        if (labelElem) {
//            labelElem.remove();
//        }

        let labelid = set[this.options.labelidAttr];
        if (!this.usableLabels[labelid]) {
            Msg.error('Labeling', 'Label with id >' + labelid + '< was not found.', this.requestor);
            return;
        }
        for (let curRepeated of repeateds) {

            // Add label translated name
            let nameElem = curRepeated.querySelector('.uk-label');
            nameElem.innerHTML = this.usableLabels[labelid].name;
            nameElem.setAttribute('swac_lang', this.usableLabels[labelid].name);
            if (this.usableLabels[labelid].color) {
                nameElem.style.background = this.usableLabels[labelid].color;
            }

            // Add remove function
            //curRepeated.addEventListener('click', this.onClickDelLabel.bind(this));
            this.removeLabelFromAddDatalist(labelid);
        }
    }

    addLabel(labelid) {
        // Get the model
        let Model = window.swac.Model;
        let newset = {};

        // Add saveAlongData
        if (this.options.sendAlongData) {
            newset = Object.assign({}, this.options.sendAlongData);
        }
        newset[this.options.labelidAttr] = labelid;
        newset[this.options.labeledidAttr] = labelid;

        // Build dataCapsule
        let dataCapsule = {
            fromName: this.getMainSourceName(),
            data: [newset]
        };

        // Request data (returns promise)
        let thisRef = this;
        Model.save(dataCapsule, true).then(function (datacaps) {
            // Add label to display
            if (datacaps[0].data) {
                newset.id = datacaps[0].data[0].id;
            } else {
                newset.id = parseInt(datacaps[0].origresponse);
            }
            newset.swac_fromName = thisRef.getMainSourceName();
            if (thisRef.getMainSourceName().endsWith(".json")) {
                let newId = thisRef.data[thisRef.getMainSourceName()].getSets().lenght;
                newset.id = newId;
            }
            thisRef.addSet(thisRef.getMainSourceName(), newset);

            // Remove label from chooseable label list
            //thisRef.removeLabelFromAddDatalist(labelid);
            //labelElem.remove();
        }).catch(function (e) {
            UIkit.modal.alert(window.swac.lang.dict.Labeling.addfailed);
        });
    }

    delLabel(conid) {
        let Model = window.swac.Model;
        let dataCapsule = {
            fromName: this.getMainSourceName()
        };
        dataCapsule.data = [{
                id: conid
            }];

        // Get label dataset
        let conSet = this.getMainSourceData().getSet(conid);
        let labelSet = this.usableLabels[conSet[this.options.labelidAttr]];

        let thisRef = this;
        Model.delete(dataCapsule).then(function () {
            // Remove from label display
            thisRef.removeSet(thisRef.getMainSourceName(), conid);
            // Read to select display
            thisRef.removeLabelFromDeleteDatalist(labelSet);
        }).catch();
    }

    /**
     * Executed when an label entry is clicked for add label
     */
    onClickAddLabel(evt) {
        let labelElem = evt.target;
        while (!labelElem.hasAttribute('swac_setid') && labelElem.parentNode) {
            labelElem = labelElem.parentNode;
        }
        let labelid = labelElem.getAttribute('swac_setid');
        labelid = parseInt(labelid);

//        // Get id of the object to label
//        let labeledId;
//
//        // Get set information in case Labeling is used as subrequestor
//        let setElem = this.requestor;
//        while (!setElem.hasAttribute('swac_setid') && setElem.parentElement) {
//            setElem = setElem.parentElement;
//        }
//        if (setElem.hasAttribute('swac_setid')) {
//            labeledId = setElem.getAttribute('swac_setid');
//        } else {
//            labeledId = window.swac.getParameterFromURL('id');
//        }
//        labeledId = parseInt(labeledId);

        this.addLabel(labelid);
    }

    /**
     * Executed when an label entry is clicked for removeing label
     */
    onClickDelLabel(evt) {
        let conElem = evt.target;
        while (!conElem.hasAttribute('swac_setid') && conElem.parentNode) {
            conElem = conElem.parentNode;
        }
        let conid = conElem.getAttribute('swac_setid');
        conid = parseInt(conid);

        this.delLabel(conid);
    }

    // *** Datalist functions ***

    /**
     * Handles input from the add label text field and triggers saving the label.
     */
    onAddFromInput() {
        let labelId = this.addInputElem.value.trim();
        this.addLabel(labelId);
        this.addInputElem.value = '';
    }

    /**
     * Handles the removal of a label from the dropdown and updates the UI accordingly.
     */
    onRemoveFromInput() {
        let labelId = this.removeInputElem.value.trim();
        let conId;
        for (let curSet of this.data[this.getMainSourceName()].getSets()) {
            if (!curSet) {
                continue;
            }
            if (curSet[this.options.labelidAttr] = labelId) {
                conId = curSet.id;
            }
        }
        this.delLabel(conId);
        this.removeInputElem.value = '';
    }

    /**
     * Adds an entry for the given label dataset to the list of selectable labels.
     * 
     * @param {WatchableSet} labelSet Set with label information
     */
    addLabelToAddDatalist(labelSet) {
        let tplElem = this.requestor.querySelector('.swac_repeatForAddLabel');
        let labelElem = tplElem.cloneNode(true);
        labelElem.classList.remove('swac_repeatForAddLabel');
        labelElem.classList.add('swac_repeatedForAddLabel');
        labelElem.setAttribute('swac_fromName', this.options.labelsource);
        labelElem.setAttribute('swac_setid', labelSet.id);
        labelElem.setAttribute('value', labelSet.id);
        labelElem.innerHTML = labelSet.name;
        tplElem.parentElement.appendChild(labelElem);
        labelElem.addEventListener('click', this.onClickAddLabel.bind(this));
    }

    addLabelToDetelteDatalist(labelSet) {
        let tplElem = this.requestor.querySelector('.swac_repeatForDelLabel');
        if (tplElem) {
            let labelElem = tplElem.cloneNode(true);
            labelElem.classList.remove('swac_repeatForDelLabel');
            labelElem.classList.add('swac_repeatedForDelLabel');
            labelElem.setAttribute('swac_fromName', this.options.labelsource);
            labelElem.setAttribute('swac_setid', labelSet.id);
            labelElem.setAttribute('value', labelSet.id);
            labelElem.innerHTML = labelSet.name;
            tplElem.parentElement.appendChild(labelElem);
            labelElem.addEventListener('click', this.onClickAddLabel.bind(this));
        }
    }

    removeLabelFromAddDatalist(labelid) {
        let repForElem = this.requestor.querySelector('.swac_repeatForAddLabel');
        // swac_setid="2"
        let labelElem = repForElem.parentElement.querySelector('[swac_setid="' + labelid + '"]');
        labelElem.remove();
        if (this.usableLabels[labelid]) {
            this.addLabelToDetelteDatalist(this.usableLabels[labelid]);
        }
    }

    removeLabelFromDeleteDatalist(labelid) {
        let repForElem = this.requestor.querySelector('.swac_repeatForDelLabel');
        let labelElem = repForElem.parentElement.querySelector('[swac_setid="' + labelid + '"]');
        labelElem.remove();

        if (this.usableLabels[labelid]) {
            this.addLabelToAddDatalist(this.usableLabels[labelid]);
        }
    }
}