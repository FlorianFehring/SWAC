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
        this.desc.styles[0] = {
            selc: 'cssSelectorForTheStyle',
            desc: 'Description of the provided style.'
        };
        this.desc.reqPerTpl[0] = {
            selc: '.swac_repeatForLabel',
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
        this.desc.reqPerSet[2] = {
            name: 'label.name',
            desc: 'Labels name'
        };
        this.desc.optPerSet[0] = {
            name: 'label.class',
            desc: 'Labels class. Added to the labeltags classList property.'
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
        this.labels = [];
    }

    init() {
        return new Promise((resolve, reject) => {
            this.repForElem = this.requestor.querySelector('.swac_repeatForLabel');

            // Load label informations
            let thisRef = this;
            let Model = window.swac.Model;
            Model.load(this.options.labelSource).then(function (data) {
                thisRef.labels = data;
                // Insert labels into gui
                for (let curLabel of data) {
                    if (!curLabel)
                        continue;
                    thisRef.addLabelToSelectable(curLabel);
                }
            }).catch(function (e) {
                Msg.error('Labeling', 'Error loading available labels: ' + e, thisRef.requestor);
            });
            resolve();
        });
    }

    /**
     * Adds an entry for the given label dataset to the list of selectable labels.
     * 
     * @param {WatchableSet} labelSet Set with label information
     */
    addLabelToSelectable(labelSet) {
        let labelElem = this.repForElem.cloneNode(true);
        labelElem.classList.remove('swac_repeatForLabel');
        labelElem.classList.add('swac_repeatedForLabel');
        labelElem.setAttribute('swac_fromName', this.options.labelsource);
        labelElem.setAttribute('swac_setid', labelSet.id);
        labelElem.innerHTML = labelSet.name;
        this.repForElem.parentElement.appendChild(labelElem);
        labelElem.addEventListener('click', this.onClickAddLabel.bind(this));
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
        // Remove added active label from list of chooseable labels
        let repForElem = this.requestor.querySelector('.swac_repeatForLabel');
        let labelElem = repForElem.parentElement.querySelector('[swac_setid="' + set[this.options.labelidAttr] + '"]');
        if (labelElem) {
            labelElem.remove();
        }

        let labelid = set[this.options.labelidAttr];
        if (!this.labels[labelid]) {
            Msg.error('Labeling', 'Label with id >' + labelid + '< was not found.', this.requestor);
            return;
        }
        for (let curRepeated of repeateds) {
            // Add label translated name
            let nameElem = curRepeated.querySelector('.uk-label');
            nameElem.innerHTML = this.labels[labelid].name;
            nameElem.setAttribute('swac_lang', this.labels[labelid].name);
            if (this.labels[labelid].color) {
                nameElem.style.background = this.labels[labelid].color;
            }

            // Add remove function
            curRepeated.addEventListener('click', this.onClickDelLabel.bind(this));
        }
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
        // Get id of the object to label
        let labeledId;
        // Get set information in case Labeling is used as subrequestor
        let setElem = this.requestor;
        while (!setElem.hasAttribute('swac_setid') && setElem.parentElement) {
            setElem = setElem.parentElement;
        }
        if (setElem.hasAttribute('swac_setid')) {
            labeledId = setElem.getAttribute('swac_setid');
        } else {
            labeledId = window.swac.getParameterFromURL('id');
        }
        labeledId = parseInt(labeledId);
        // Get the model
        let Model = window.swac.Model;
        let newset = {};
        // Add saveAlongData
        if (this.options.sendAlongData) {
            newset = Object.assign({}, this.options.sendAlongData);
        }
        newset[this.options.labelidAttr] = labelid;
        newset[this.options.labeledidAttr] = labeledId;
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
            thisRef.addSet(thisRef.getMainSourceName(), newset);
            // Remove label from chooseable label list
            labelElem.remove();
        }).catch(function (e) {
            console.log('TEST e:', e);
            UIkit.modal.alert(window.swac.lang.dict.Labeling.addfailed);
        });
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
        let Model = window.swac.Model;
        let dataCapsule = {
            fromName: this.getMainSourceName()
        };
        dataCapsule.data = [{
                id: conid
            }];

        // Get label dataset
        let conSet = this.getMainSourceData().getSet(conid);
        if (!conSet) {
            console.log('test', conid);
            console.log('test', this.getMainSourceData());
        }
        let labelSet = this.labels[conSet[this.options.labelidAttr]];

        let thisRef = this;
        Model.delete(dataCapsule).then(function () {
            // Remove from label display
            thisRef.removeSet(thisRef.getMainSourceName(), conid);
            // Readd to select display
            thisRef.addLabelToSelectable(labelSet);
        }).catch();
    }
}


