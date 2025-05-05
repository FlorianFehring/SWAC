import SWAC from '../../swac.js';
import View from '../../View.js';
import Msg from '../../Msg.js';
import Model from '../../Model.js';
import WatchableSet from '../../WatchableSet.js';
import BindPoint from '../../BindPoint.js';
//TODO import Observer only if constraintsolver is used
import EditDomainObserver from './EditDomainObserver.js';

export default class Edit extends View {

    constructor(options = {}) {
        super(options);
        this.name = 'Edit';
        this.desc.text = "Edit any contents of any javascript object";
        this.desc.developers = 'Florian Fehring (FH Bielefeld), Timon Buschendorf';
        this.desc.license = 'GNU Lesser General Public License';

        this.desc.templates[0] = {
            name: 'accordion',
            style: 'accordion',
            desc: 'Shows datasets in a accordion style with edit possibilities within the opend accordion.'
        };
        this.desc.templates[1] = {
            name: 'list',
            style: 'list',
            desc: 'Shows the names of the datasets in a list. The form is hidden inside but not intended to show there.'
        };
        this.desc.templates[2] = {
            name: 'table',
            style: 'table',
            desc: 'Shows the datasets in table form and makes the values editable.'
        };
        this.desc.templates[3] = {
            name: 'fulllist',
            style: 'fulllist',
            desc: 'Shows one single dataset.'
        };
        this.desc.templates[4] = {
            name: 'autocollect',
            desc: 'Optimized layout for autocollection of data.'
        };

        this.desc.reqPerTpl[0] = {
            selc: '.swac_editForm',
            desc: 'Form element used to created new or edit existing dataset'
        };
        this.desc.reqPerTpl[1] = {
            selc: '.swac_editSaveButton',
            desc: 'Button that saves an single dataset'
        };
        this.desc.reqPerTpl[2] = {
            selc: '.swac_editNotify',
            desc: 'Place where to place notifications from edit'
        };

        this.desc.optPerTpl[0] = {
            selc: '.swac_editDelButton',
            desc: 'Button that deletes an single dataset'
        };
        this.desc.optPerTpl[1] = {
            selc: '.swac_editCopyButton',
            desc: 'Button that copies an single dataset'
        };
        this.desc.optPerTpl[2] = {
            selc: '.swac_editSaveAllButton',
            desc: 'Button that saves all datasets'
        };
        this.desc.optPerTpl[3] = {
            selc: '.swac_editAddSetButton',
            desc: 'Button that opens the dialog for adding a dataset.'
        };
        this.desc.optPerTpl[4] = {
            selc: '.swac_editForm',
            desc: 'The form where the inputs are placed. There can be one for each dataset or one for all datasets.'
        };
        this.desc.optPerTpl[5] = {
            selc: '.swac_editLegendElem',
            desc: 'Legend element for caption of edit forms.'
        };
        this.desc.optPerTpl[6] = {
            selc: '.swac_repeatForValue input',
            desc: 'Default input element for data. This can be replaced by a generated specific input element.'
        };
        this.desc.optPerTpl[7] = {
            selc: '.swac_edit_repeatForReftable',
            desc: 'Element that should be used for display references.'
        };
        this.desc.optPerTpl[8] = {
            selc: '.swac_edit_repeatForRef',
            desc: 'Element that should be repeated for every reference. Can contain bindpoints for data from the referenced object (default: name)'
        };
        this.desc.optPerTpl[9] = {
            selc: '.swac_edit_deleteref',
            desc: 'Button for delteing references.'
        };
        this.desc.optPerTpl[10] = {
            selc: '.swac_editAddChildButton',
            desc: 'Button for adding a new child dataset.'
        };
        this.desc.optPerTpl[11] = {
            selc: '.swac_editDelChildButton',
            desc: 'Button for deleteing a child dataset.'
        };
        this.desc.optPerTpl[12] = {
            selc: '.swac_editGroupModeButton',
            desc: 'Button to toggle state of the group edit mode.'
        };
        this.desc.optPerTpl[13] = {
            selc: '.swac_editFormLegend',
            desc: 'Element where the title or name of the dataset is placed.'
        };
        this.desc.optPerTpl[14] = {
            selc: '.swac_editAutoDataButton',
            desc: 'Button that toggles the autodata grabbing mode.'
        };
        this.desc.optPerTpl[15] = {
            selc: '.swac_editThirdButton',
            desc: '(deprecated) Optional thrid button, that calls the options.thirdButtonAction() on click. Custom emplate or modification of template with elem.appendChild() should be used instead.'
        };
        this.desc.optPerTpl[16] = {
            selc: '.swac_edit_formToggle',
            desc: 'Toggles the display of the input form for a dataset.'
        };
        this.desc.optPerTpl[16] = {
            selc: '.swac_edit_formToggle',
            desc: 'Toggles the display of the input form for a dataset.'
        };
        this.desc.optPerTpl[17] = {
            selc: '.swac_edit_name',
            desc: 'Element that contains the dataset name. If used a click on this element fires the swac_REQUESTOR_ID_name_click event.'
        };


        this.desc.reqPerSet[0] = {
            name: 'id',
            desc: 'Id for identifying the dataset.'
        };

        this.desc.optPerSet[0] = {
            name: 'parent',
            desc: 'Reference to a parent dataset'
        };

        this.desc.optPerSet[1] = {
            name: 'name',
            desc: 'Name of the reference'
        };

        if (options.showWhenNoData !== false)
            this.options.showWhenNoData = true;
        this.desc.opts[1] = {
            name: 'editorTargetElement',
            desc: 'CSS Selector to the element where the editor form should be shown.',
            example: '#myeditorarea'
        };
        if (!options.editorTargetElement)
            this.options.editorTargetElement = null;
        this.desc.opts[2] = {
            name: 'allowAdd',
            desc: 'Boolean that indicates if new datasets can be created.'
        };
        if (!options.allowAdd)
            this.options.allowAdd = false;
        this.desc.opts[3] = {
            name: 'allowCopy',
            desc: 'Boolean that indicates if new datasets can be copied.'
        };
        if (!options.allowCopy)
            this.options.allowCopy = false;
        this.desc.opts[4] = {
            name: 'allowDel',
            desc: 'Boolean that indicates if new datasets can be deleted.'
        };
        if (!options.allowDel)
            this.options.allowDel = false;
        this.desc.opts[5] = {
            name: 'allowDrag',
            desc: 'If true the listed datasets can be dragged with the mouse. key: "myattr", value: ["val1","val2",...]'
        };
        if (options.allowDrag !== false)
            this.options.allowDrag = true;
        this.desc.opts[6] = {
            name: 'dropAccepts',
            desc: 'Map of attrName and regex to determine which set is accepted to a drop field.'
        };
        if (!options.dropAccepts)
            this.options.dropAccepts = new Map();
        this.desc.opts[7] = {
            name: 'dropFunctions',
            desc: 'Map of attrName and function to execute if an element was dropped on the attrName dropzone.\n\
The function gets the droped dataset and the dropzone element.'
        };
        if (!options.dropFunctions)
            this.options.dropFunctions = new Map();
        this.desc.opts[8] = {
            name: 'dropJoinerTargets',
            desc: 'Map of attrName and configuration object that defines where (attribute targetSetName) and how (attributes referenceFronName and referenceDropName) a joiner information could be created.'
        };
        if (!options.dropJoinerTargets)
            this.options.dropJoinerTargets = new Map();

        this.desc.opts[9] = {
            name: 'fetchDefinitions',
            desc: 'If true the definition interface /source/definition will be used to fetch definitions for building forms.'
        };
        if (!options.fetchDefinitions)
            this.options.fetchDefinitions = false;

        this.desc.opts[10] = {
            name: 'directOpenNew',
            desc: 'If set to true the dialog to add a new dataset is opend at load.'
        };
        if (!options.directOpenNew)
            this.options.directOpenNew = false;

        this.desc.opts[11] = {
            name: 'allowAddChild',
            desc: 'If set to true child objects can be added'
        };
        if (!options.allowAddChild)
            this.options.allowAddChild = false;
        this.desc.opts[12] = {
            name: 'allowDelChild',
            desc: 'If set to true child objects can be deleted'
        };
        if (!options.allowDelChild)
            this.options.allowDelChild = false;
        this.desc.opts[13] = {
            name: 'thirdButtonAction',
            desc: 'Function to execute, when the third button is clicked.',
            example: function (evt) {
                console.log('event: ', evt);
            }
        };
        if (!options.thirdButtonAction)
            this.options.thirdButtonAction = null;
        this.desc.opts[14] = {
            name: 'thirdButtonCaption',
            desc: 'Caption to show for the third button.',
            example: 'Programmable button'
        };
        if (!options.thirdButtonCaption)
            this.options.thirdButtonCaption = null;
        this.desc.opts[15] = {
            name: 'notShownAttrs',
            desc: 'List of attribute names that should not be shown. Note in form of data {[fromName]: [attr1Name, attr2Name]',
            example: {
                ['../../data/exampledata_list.json']: ['id', 'dateval']
            }
        };
        if (!options.notShownAttrs)
            this.options.notShownAttrs = [];
        this.desc.opts[16] = {
            name: 'customDefaultSet',
            desc: 'Default dataset to add when clicking add-Button',
            example: {name: 'MyDefaultEntry', value: 'MyDefaultVaue'}
        };
        if (!options.customDefaultSet)
            this.options.customDefaultSet = null;
        this.desc.opts[17] = {
            name: 'customCheckAddChildAlowed',
            desc: 'Function to execute before opening the new child dialog. If function return false no child can be added.',
            example: function (parent) {}
        };
        if (!options.customCheckAddChildAlowed)
            this.options.customCheckAddChildAlowed = null;
        this.desc.opts[18] = {
            name: 'customDefaultChildSets',
            desc: 'Default child datasets to add when clicking add-Button',
            example: [{name: 'Childset1'}, {name: 'Childset2'}]
        };
        if (!options.customDefaultChildSets)
            this.options.customDefaultChildSets = [];
        this.desc.opts[19] = {
            name: 'childSourceSelectAttribute',
            desc: 'Name of the attribute that should be selectable when createing a new child source',
            example: 'title'
        };
        if (!options.childSourceSelectAttribute)
            this.options.childSourceSelectAttribute = null;
        this.desc.opts[20] = {
            name: 'childSourceSelectExclude',
            desc: 'List of options to exclude from selection posibilities for new child dataset',
            example: ['NotSelectableValue1', 'NotSelectableValue2']
        };
        if (!options.childSourceSelectExclude)
            this.options.childSourceSelectExclude = [];
        this.desc.opts[21] = {
            name: 'inputsVisibility',
            desc: 'Definition of input fields that should be shown or hidden depending on a certain value. Use attributes: applyOnAttr, aplyOnValue and hide: [Names of input elements]',
            example: [
                {
                    applyOnAttr: 'stringval',
                    applyOnVal: 'string',
                    hide: ['id']
                }
            ]
        };
        if (!options.inputsVisibility)
            this.options.inputsVisibility = [];
        this.desc.opts[22] = {
            name: 'customAfterInput',
            desc: 'Function that should be executed, after input was done.',
            example: function (attr, newval, set) {},
            params: [
                {
                    name: 'attr',
                    desc: 'Name of the changed attribute',
                    type: 'String'
                },
                {
                    name: 'newval',
                    desc: 'New value',
                    type: 'mixed'
                },
                {
                    name: 'set',
                    desc: 'Set where the change was made',
                    type: 'WatchableSet'
                }
            ]
        };
        if (!options.customAfterInput)
            this.options.customAfterInput = null;
        this.desc.opts[23] = {
            name: 'customAfterInputChanged',
            desc: 'Function that should be executed, after the input changed.',
            example: function (attr, newval, set) {},
            params: [
                {
                    name: 'attr',
                    desc: 'Name of the changed attribute',
                    type: 'String'
                },
                {
                    name: 'newval',
                    desc: 'New value',
                    type: 'mixed'
                },
                {
                    name: 'set',
                    desc: 'Set where the change was made',
                    type: 'WatchableSet'
                }
            ]
        };
        if (!options.customAfterInputChanged)
            this.options.customAfterInputChanged = null;
        this.desc.opts[24] = {
            name: 'sendAlongData',
            desc: 'Object with attributes that should be send everytime when saveing a dataset',
            example: {attr1: 'A dataset with attributes to send'}
        };
        if (!options.sendAlongData)
            this.options.sendAlongData = null;
        this.desc.opts[25] = {
            name: 'newdatasetname',
            desc: 'Language entry that is used for the name of a new dataset'
        };
        if (!options.newdatasetname)
            this.options.newdatasetname = 'Edit.newdataset';
        this.desc.opts[26] = {
            name: 'newdatasetbtn',
            desc: 'Language entry that is used on the add new button',
            example: 'edit_newcar'
        };
        if (!options.newdatasetbtn)
            this.options.newdatasetbtn = null;
        this.desc.opts[27] = {
            name: 'singleInputChange',
            desc: 'If true input is only computed when input in field is completed by user and not on every keypress.'
        };
        if (!options.singleInputChange)
            this.options.singleInputChange = false;
        this.desc.opts[28] = {
            name: 'completeDefinitionsFromHTML',
            desc: 'If true the component searches for input fields in template code and creates (additional) definitions from them.'
        };
        if (!options.completeDefinitionsFromHTML)
            this.options.completeDefinitionsFromHTML = false;
        this.desc.opts[29] = {
            name: 'customOnStartAutoData',
            desc: 'Function to be executed, right before startAutoData is executed.'
        };
        if (!options.customOnStartAutoData)
            this.options.customOnStartAutoData;

        this.desc.events[0] = {
            name: 'swac_REQUESTOR_ID_name_click',
            desc: 'An event fired when the user clicks on the name of a dataset.',
            data: 'Delivers the JS event object of the click event.'
        }

        // Internal attributes
        this.lastClickedAddChildBtn = null;
        this.groupedit = false;
        this.constraintsolver = null;
        this.inputremoveds = []; // Names of the attrs where a "removed from display" message was given
        this.autointervals = []; // Intervals for auto updateing data in fields
    }

    init() {
        return new Promise((resolve, reject) => {
            // If there is no repForSet the template is static defined (for input only), and message about missing repeateds is not neccessery
            let repForSets = this.requestor.querySelector('.swac_repeatForSet');
            if (!repForSets) {
                Msg.error('Edit', 'No .swac_repeatedForSet found in template. Use repeatForSet even for forms that are only for input of new datasets.', this.requestor);
            }

            let addElem = this.requestor.querySelector('.swac_editAddSetButton');
            if (addElem !== null) {
                if (this.options.allowAdd && this.options.mainSource) {
                    addElem.classList.remove('swac_dontdisplay');
                    // Register event handler for add new object button
                    addElem.addEventListener('click', this.onClickAdd.bind(this));
                } else if (this.options.allowAdd && !this.options.mainSource && this.requestor.fromName) {
                    this.options.mainSource = this.requestor.fromName;
                    // Register event handler for add new object button
                    addElem.addEventListener('click', this.onClickAdd.bind(this));
                } else if (this.options.allowAdd) {
                    addElem.classList.add('swac_dontdisplay');
                    Msg.warn('Edit', 'You have to set >options.mainSource< in order to activate adding new sets.', this.requestor);
                } else {
                    addElem.classList.add('swac_dontdisplay');
                    Msg.warn('Edit', 'Adding new objects is not permitted for >'
                            + this.requestor.id + '<. Deactivateing add button. You can activate '
                            + 'the button by adding allowAdd=true to the options.',
                            this.requestor);
                }
            } else {
                Msg.warn('Edit', 'There is no add button >.swac_editAddSetButton< in the template. Users can not create new sets, except that were static input fields are coded in the template.', this.requestor);
            }

            // Add handler for saveall button
            let saveAllButtons = this.requestor.querySelectorAll('.swac_editSaveAllButton');
            for (let saveAllButton of saveAllButtons) {
                saveAllButton.addEventListener('click', this.onClickSaveAll.bind(this));
            }

            // Directly add a new dataset for editing
            if (this.options.directOpenNew) {
                this.onClickAdd();
            }

            // Add function to save button
            let saveBtn = this.requestor.querySelector('.swac_editSaveButton');
            if (saveBtn)
                saveBtn.addEventListener('click', this.onClickSave.bind(this));

            // Add eventlistener for special key press
            window.addEventListener('keypress', this.onKeyPress.bind(this));
            resolve();

            // Change caption of add dataset button
            if (this.options.newdatasetbtn) {
                let newBtn = this.requestor.querySelector('[swac_lang="Edit.adddataset"]');
                newBtn.setAttribute('swac_lang', this.options.newdatasetbtn);
            }
        });
    }

    // inheritted
    afterAddSet(set, repeateds) {
        let repeatedForSets = [];
        if (this.options.mainSource && this.options.mainSource !== set.swac_fromName) {
            repeatedForSets = this.requestor.querySelectorAll('.swac_repeatedForChild[swac_fromname="' + set.swac_fromName + '"][swac_setid="' + set.id + '"]');
        } else {
            repeatedForSets = this.requestor.querySelectorAll('.swac_repeatedForSet[swac_fromname="' + set.swac_fromName + '"][swac_setid="' + set.id + '"]');
        }

        if (repeatedForSets.length === 0) {
            Msg.error('Edit', 'There was the following set added, but no repeatedForSets for this dataset >' + set.swac_fromName + '[' + set.id + ']< found.', this.requestor);
            console.log(set);
            return;
        }
        // Load definitions if neccessery
        if (!this.options.definitions.has(set.swac_fromName) && !this.defLoadProm) {
            Msg.warn('Edit', 'There are no definitions for >' + set.swac_fromName + '< in the options. Try getting definitions.', this.requestor);
            if (this.options.fetchDefinitions) {
                this.defLoadProm = this.fetchDefinitionsFromREST(set.swac_fromName);
            } else {
                this.defLoadProm = this.fetchDefinitionsFromData(set.swac_fromName);
            }
        }
        if (this.defLoadProm) {
            let thisRef = this;
            this.defLoadProm.then(function () {
                // For every repeatableArea
                for (let curRepeatedElem of repeatedForSets) {
                    // Get defs from HTML that are not in def
                    if (thisRef.options.completeDefinitionsFromHTML === true)
                        thisRef.completeDefinitionsFromHTML(set.swac_fromName, curRepeatedElem);
                    thisRef.transformRepForSet(curRepeatedElem);
                    thisRef.removeNotShownAttrs(set.swac_fromName, curRepeatedElem);
                }
                // Hide input fields
                thisRef.modifyInputVisability(set.swac_fromName, set);
                // Execute custom customAfterAddSet
                if (thisRef.options.customAfterAddSet) {
                    // Bind to component
                    thisRef.customAfterAddSet = thisRef.options.customAfterAddSet;
                    thisRef.customAfterAddSet(set);
                }
            });
        } else {
            // For every repeatableArea
            for (let curRepeatedElem of repeatedForSets) {
                this.transformRepForSet(curRepeatedElem);
                this.removeNotShownAttrs(set.swac_fromName, curRepeatedElem);
            }
            // Hide input fields
            this.modifyInputVisability(set.swac_fromName, set);
            // Execute custom afterAddSet
            if (this.options.customAfterAddSet) {
                // Bind to component
                this.customAfterAddSet = this.options.customAfterAddSet;
                this.customAfterAddSet(set);
            }
        }
        // Create DomainObserver at ConstraintSolver if is there
        if (this.constraintsolver) {
            this.constraintsolver.addSet(set.swac_fromName, set);
            this.createDomainObserver(set.swac_fromName, set);
        }
        // Bind onClickGroupEdit() to every groupedit checkbox
        for (let repeatedForSet of repeatedForSets) {
            let groupEditElems = repeatedForSet.querySelectorAll('.swac_editGroupModeButton');
            for (let curGroupEditElem of groupEditElems) {
                curGroupEditElem.addEventListener('click', this.onClickGroupEdit.bind(this));
            }
        }
        
        // Bind event handler for onClickName
        let thisRef = this;
        for(let curRepeated of repeateds) {
            let nameElems = curRepeated.querySelectorAll('.swac_edit_name');
            for(let curNameElem of nameElems) {
                curNameElem.addEventListener('click',function(e) {
                    // Create and fire custom event
                    document.dispatchEvent(new CustomEvent('swac_' + thisRef.requestor.id + '_name_click', {detail: e}))
                });
            }
        }
    }

    /**
     * Remove input areas that should not be shown (not editable data)
     * 
     * @param {String} fromName Name of the datasource
     * @param {DOMElement} setElem repeatedForSet where to remove the input
     */
    removeNotShownAttrs(fromName, setElem) {
        // Hide input fields as requested
        if (this.options.notShownAttrs[fromName]) {
            for (let curAttr of this.options.notShownAttrs[fromName]) {
                // Find and remove input field
                let attrElem = setElem.querySelector('[swac_fromname="' + fromName + '"] [swac_attrname="' + curAttr + '"]');
                if (attrElem) {
                    attrElem.remove();
                    if (!this.inputremoveds.includes(curAttr)) {
                        Msg.info('Edit', 'Removed input fields for >' + curAttr + '<. Change notShownAttrs option to modify this.', this.requestor);
                        this.inputremoveds.push(curAttr);
                    }
                }
                // If there is a default value, set it to the dataset
                let defs = this.options.definitions.get(fromName);
                if (!setElem.swac_dataset[curAttr] && defs && defs[curAttr] && defs[curAttr].defaultvalue) {
                    setElem.swac_dataset[curAttr] = defs[curAttr].defaultvalue;
                }
            }
        }
    }

    /**
     * When event is triggert to highlight a child dataset
     */
    onMouseoverChild(evt) {
        evt.preventDefault();
        let repeatedForChild = this.findRepeatedForChild(evt.target);
        // Get setname and id from repeated
        let childSource = repeatedForChild.getAttribute('swac_fromname');
        let childId = repeatedForChild.getAttribute('swac_setid');
        this.highlightChildSet(childSource, childId);
    }

    /**
     * Highlights the input fields that are related to given child dataset
     */
    highlightChildSet(fromName, setid) {
        // Select all repeateds for that child
        let childRepeateds = this.requestor.querySelectorAll('[swac_fromname="' + fromName + '"][swac_setid="' + setid + '"]');
        for (let curRepeated of childRepeateds) {
            if (curRepeated.nodeName !== 'TH')
                curRepeated.classList.add('swac_edit_highlightChild');
        }
    }

    /*
     * When event is triggert to remove highlight from child dataset
     */
    onMouseoutChild(evt) {
        evt.preventDefault();
        let childRepeateds = this.requestor.querySelectorAll('.swac_edit_highlightChild');
        for (let curRepeated of childRepeateds) {
            curRepeated.classList.remove('swac_edit_highlightChild');
        }
    }

    /**
     * Transform the repeated element given. This means all contained input fields 
     * are transformed to matching types (if definition exists), missing fields
     * are added and input functions are added.
     * 
     * @param {DOMElement} repForSet Element with input elements for one dataset
     * @returns {undefined}
     */
    transformRepForSet(repForSet) {
        // Register formToggel if marked
        if (repForSet.classList.contains('swac_edit_formToggle')) {
            repForSet.addEventListener('click', this.onFormToggle.bind(this));
        }
        // Check if template supports drag & drop and if it is active
        if (this.options.allowDrag) {
            let draggableElem;
            // Check if curRepeated is draggable itself
            if (repForSet.getAttribute('draggable')) {
                draggableElem = repForSet;
            } else {
                draggableElem = repForSet.querySelector('[draggable="true"]');
            }
            if (draggableElem) {
                draggableElem.addEventListener('dragstart', this.onDragStart.bind(this));
            }
        }
        // Add function to save button
        let saveBtn = repForSet.querySelector('.swac_editSaveButton');
        if (saveBtn)
            saveBtn.addEventListener('click', this.onClickSave.bind(this));
        // Add function to delete button
        let delBtn = repForSet.querySelector('.swac_editDelButton');
        if (this.options.allowDel && delBtn) {
            delBtn.addEventListener('click', this.onClickDel.bind(this));
        } else if (delBtn) {
            delBtn.parentElement.removeChild(delBtn);
        }
        // Add function to copy button
        let copyBtn = repForSet.querySelector('.swac_editCopyButton');
        if (this.options.allowCopy && copyBtn) {
            copyBtn.addEventListener('click', this.onClickCopy.bind(this));
        } else if (copyBtn) {
            copyBtn.parentElement.removeChild(copyBtn);
        }

        // Add function for opening modal to add child
        let modalChildBtn = repForSet.querySelector('.swac_openModal')
        if (this.options.allowAddChild && modalChildBtn) {
            modalChildBtn.addEventListener('click', this.onClickAddChildDialog.bind(this));
        } else if (modalChildBtn) {
            modalChildBtn.parentElement.removeChild(modalChildBtn);
        }
        // Add function to delete child button
        let delChildBtn = repForSet.querySelector('.swac_editDelChildButton');
        if (this.options.allowDelChild && delChildBtn) {
            delChildBtn.addEventListener('click', this.onClickDelChild.bind(this));
            delChildBtn.addEventListener('mouseover', this.onMouseoverChild.bind(this));
            delChildBtn.addEventListener('mouseout', this.onMouseoutChild.bind(this));
        }

        // Add function to copy child button
        let copyChildBtn = repForSet.querySelector('.swac_editCopyChildButton');
        if (this.options.allowDelChild && copyChildBtn) {
            copyChildBtn.addEventListener('click', this.onClickCopyChild.bind(this));
            copyChildBtn.addEventListener('mouseover', this.onMouseoverChild.bind(this));
            copyChildBtn.addEventListener('mouseout', this.onMouseoutChild.bind(this));
        } else if (copyChildBtn) {
            delChildBtn.parentElement.removeChild(copyChildBtn);
        }

        // Show thirdButton if function is defined
        let tbtn = repForSet.querySelector('.swac_editThirdButton');
        if (this.options.thirdButtonAction && tbtn) {
            tbtn.classList.remove('swac_dontdisplay');
            tbtn.setAttribute('swac_lang', this.options.thirdButtonCaption);
            let lngParts = this.options.thirdButtonCaption.split('.');
            let lngTrans = SWAC.lang.dict;
            for (let lngPart of lngParts) {
                if (lngTrans[lngPart])
                    lngTrans = lngTrans[lngPart];
            }
            //Set translation if translation allready loaded
            if (typeof lngTrans === 'string')
                tbtn.innerHTML = lngTrans;
            else
                tbtn.innerHTML = this.options.thirdButtonCaption;
            tbtn.addEventListener('click', this.options.thirdButtonAction.bind(this));
        } else if (tbtn) {
            tbtn.parentElement.removeChild(tbtn);
        }
        let fromName = repForSet.getAttribute('swac_fromname');
        // Modify input area if there are definitions
        if (this.options.definitions.get(fromName)) {
            // Get dataset that should be edited
            let editSetId = repForSet.getAttribute('swac_setid');
            let set = this.data[fromName].getSet(editSetId);
            // Modify input area
            this.modifyInputArea(repForSet, set);
        } else {
            Msg.warn('Edit', 'Useing plain text inputs, because there are no definitions.', this.requestor);
        }
    }

    /**
     * Modifies the inputArea. Adds missing input fields after definition and
     * change input fields according to the data type.
     * 
     * @param {DOMElement} inputAreaElem Element that should be modified
     * @param {Object} set Object with dataset if the inputs should be filled.
     * @returns {undefined}
     */
    modifyInputArea(inputAreaElem, set = {}) {
        let curDefs = this.options.definitions.get(set.swac_fromName);
        if (!curDefs) {
            Msg.warn('Edit', 'Definitions for >' + set.swac_fromName + '< not found.', this.requestor);
            return;
        }
        // Go trough awaited input fields
        let hasAutoData = false;
        for (let curDef of curDefs) {
            // Exclude empty definitions or metadata
            if (!curDef || curDef.name.startsWith('swac_') || curDef.name.startsWith('{')) {
                continue;
            }
            // Check if there is an input element for that input
            let inputElem = inputAreaElem.querySelector('[name="' + curDef.name + '"]');
            if (inputElem && !curDef.auto) {
                this.modifyInputElem(inputElem, curDef, set);
            } else if (inputAreaElem.querySelector('.swac_repeatForValue')) {
                // Get template for input
                let inputTpl = inputAreaElem.querySelector('.swac_repeatForValue');
                // clone forValue template
                let newInput = inputTpl.cloneNode(true);
                newInput.classList.remove('swac_repeatForValue');
                newInput.classList.add('swac_repeatedForValue');
                newInput.setAttribute('swac_fromname', set.swac_fromName);
                newInput.setAttribute('swac_setid', set.id);
                newInput.setAttribute('swac_attrname', curDef.name);
                newInput.innerHTML = newInput.innerHTML
                        .replaceAll('{attrName}', curDef.name)
                        .replaceAll('{*}', '');
                inputTpl.parentNode.appendChild(newInput);
                inputElem = newInput.querySelector('input');
                if (!curDef.auto)
                    this.modifyInputElem(inputElem, curDef, set);
//                } else {
//                    Msg.warn('Edit','Input element for >' + set.swac_fromName 
//                            + '/' + curDef.name + '< is missing in template.',this.requestor);
            }
            if (curDef.auto) {
                inputElem.setAttribute('readonly', 'readonly');
                hasAutoData = true;
            }
        }

        let autoElem = inputAreaElem.querySelector('.swac_editAutoDataButton');
        if (autoElem && hasAutoData) {
            autoElem.classList.remove('swac_dontdisplay');
            autoElem.addEventListener('click', this.onClickToggleAutoData.bind(this));
        }
        window.swac.lang.translateAll(inputAreaElem);
//    }
    }

    /**
     * Modifies the inputElement for better user expierience
     * 
     * @param {DOMElement} inElem Existing input element
     * @param {Object} Definition of attribute 
     * @param {WatschableSet} set Dataset the value came from
     */
    modifyInputElem(inElem, attrDef, set) {
        // Get value if exists
        let value = null;
        if (set && typeof set[attrDef.name] !== 'undefined') {
            value = set[attrDef.name];
        }
        // Create bindpoint if missing
        if (!inElem.swac_bp) {
            let bp = new BindPoint(attrDef.name, this.requestor);
            bp.dataset = set;
            inElem.swac_bp = bp;
            inElem.addEventListener('change', bp.onValueChanged.bind(bp));
        }

        if (attrDef.type === 'bool') {
            inElem.classList.add('uk-checkbox');
            inElem.setAttribute('type', 'checkbox');
            if (value === true) {
                inElem.setAttribute('checked', 'checked');
            } else if (value === null && typeof attrDef.defaultvalue != 'undefined'
                    && attrDef.defaultvalue === true) {
                set[attrDef.name] = attrDef.defaultvalue;
                inElem.setAttribute('checked', 'checked');
            } else {
                inElem.removeAttribute('checked');
            }
        } else if (attrDef.type === 'password') {
            inElem.classList.add('uk-input');
            inElem.setAttribute('type', 'password');
            // No defaltvalue here
        } else if (attrDef.type === 'int8' || attrDef.type === 'int4' || attrDef.type === 'float8') {
            inElem.classList.add('uk-input');
            inElem.classList.add('uk-form-width-small');
            inElem.setAttribute('type', 'number');
            if (attrDef.type === 'float8') {
                inElem.setAttribute('step', 'any');
            } else {
                inElem.setAttribute('step', '1');
            }
            if (value) {
                inElem.setAttribute('value', value);
            } else if (attrDef.defaultvalue) {
                set[attrDef.name] = attrDef.defaultvalue;
                inElem.setAttribute('value', attrDef.defaultvalue);
            }
            if (typeof attrDef.min !== 'undefined') {
                inElem.setAttribute('min', attrDef.min);
            }
            if (attrDef.max) {
                inElem.setAttribute('max', attrDef.max);
            }
            if (attrDef.generated) {
                inElem.setAttribute('disabled', 'disabled');
            }
        } else if (attrDef.type === 'date') {
            inElem.classList.add('uk-input');
            inElem.classList.add('uk-form-width-small');
            inElem.setAttribute('type', 'date');
            if (value) {
                inElem.setAttribute('value', value);
            } else if (attrDef.defaultvalue) {
                set[attrDef.name] = attrDef.defaultvalue;
                inElem.setAttribute('value', attrDef.defaultvalue);
            }
            if (attrDef.min) {
                inElem.setAttribute('min', attrDef.min);
            }
            if (attrDef.max) {
                inElem.setAttribute('max', attrDef.max);
            }
            if (attrDef.generated) {
                inElem.setAttribute('disabled', 'disabled');
            }
        } else if (attrDef.type === 'timestamp') {
            inElem.classList.add('uk-input');
            inElem.classList.add('uk-form-width-medium');
            inElem.setAttribute('type', 'datetime-local');
            inElem.setAttribute('step', '1');
            if (value) {
                inElem.setAttribute('value', value);
            } else if (attrDef.defaultvalue) {
                set[attrDef.name] = attrDef.defaultvalue;
                inElem.setAttribute('value', attrDef.defaultvalue);
            }
            if (attrDef.generated) {
                inElem.setAttribute('disabled', 'disabled');
            }
        } else if (attrDef.type === 'time') {
            inElem.classList.add('uk-input');
            inElem.classList.add('uk-form-width-medium');
            inElem.setAttribute('type', 'time');
            if (value) {
                inElem.setAttribute('value', value);
            } else if (attrDef.defaultvalue) {
                set[attrDef.name] = attrDef.defaultvalue;
                inElem.setAttribute('value', attrDef.defaultvalue);
            }
            if (attrDef.generated) {
                inElem.setAttribute('disabled', 'disabled');
            }
        } else if (attrDef.type === 'color') {
            inElem.classList.add('uk-input');
            inElem.classList.add('uk-form-width-small');
            inElem.setAttribute('type', 'color');
            if (value) {
                inElem.setAttribute('value', value);
            } else if (attrDef.defaultvalue) {
                set[attrDef.name] = attrDef.defaultvalue;
                inElem.setAttribute('value', attrDef.defaultvalue);
            }
            if (attrDef.generated) {
                inElem.setAttribute('disabled', 'disabled');
            }
        } else if (attrDef.type === 'reference' || attrDef.type === 'Collection') {
            inElem = document.createElement('div');
            // Create drop area
            let dropzone = document.createElement('div');
            dropzone.classList.add('swac_edit_dropzone');
            dropzone.setAttribute('name', attrDef.name);
            dropzone.addEventListener('drop', this.onDrop.bind(this));
            dropzone.addEventListener('dragover', this.onDragover.bind(this));
            dropzone.innerHTML = SWAC.lang.dict.Edit.drophere;
            dropzone.requestor = this.requestor;
            inElem.appendChild(dropzone);
            // Get display area for refenreces
            let reftableTpl = this.requestor.querySelector('.swac_edit_repeatForReftable');
            let reftableElem = reftableTpl.cloneNode(true);
            reftableElem.classList.remove('swac_edit_repeatForReftable');
            reftableElem.setAttribute('swac_edit_reftable', attrDef.name);
            inElem.appendChild(reftableElem);

            if (value) {
                // If its a list of references
                if (Array.isArray(value)) {
                    reftableElem.classList.add('swac_edit_multiref');
                    for (let curRef of value) {
                        this.createReferenceDisplay(curRef, reftableElem);
                    }
                } else {
                    reftableElem.classList.add('swac_edit_singleref');
                    this.createReferenceDisplay(value, reftableElem);
                }
            } else if (attrDef.defaultvalue) {
                //Default values for refs are not supported
            }
        } else if (attrDef.possibleValues) {
            let selElem = document.createElement('select');
            // Set the element as to the bindpoint belonging
            selElem.swac_bp = inElem.swac_bp;
            if (selElem.swac_bp) {
                selElem.swac_bp.element = selElem;
            }
            selElem.id = inElem.id;
            selElem.classList.add('uk-select');
            selElem.classList.add('uk-form-width-small');
            selElem.setAttribute('name', attrDef.name);

            let options = attrDef.possibleValues;
            if (typeof options === 'string' && options.startsWith('ref://')) {
                let optValue = attrDef.possibleValueAttr ? attrDef.possibleValueAttr : 'id';
                let optName = attrDef.possibleValueName ? attrDef.possibleValueName : 'name';
                // Try load options from database
                Model.getFromReference(options).then(function (source) {
                    for (let curOption of source.data) {
                        if (!curOption)
                            continue;
                        let optNode = document.createElement('option');
                        optNode.value = curOption[optValue];
                        optNode.setAttribute('swac_lang', curOption[optName]);
                        optNode.innerHTML = curOption[optName];
                        selElem.appendChild(optNode);
                        if (value && value !== null
                                && value === curOption) {
                            optNode.selected = 'selected';
                            valFound = true;
                        } else if (attrDef.defaultvalue && attrDef.defaultvalue === curOption) {
                            optNode.selected = 'selected';
                        }
                    }
                }).catch(function (err) {
                    Msg.error('Edit', 'Could not get options for >' + attrDef.name + '< from reference: >' + options + '<: ' + err);
                    UIkit.modal.alert(SWAC.lang.dict.Edit.errorgetoptions);
                });
                options = [];
            }
            if (!Array.isArray(options)) {
                options = options.split(',');
            }
            if (inElem.nodeName === 'SELECT') {
                Msg.warn('Edit', 'Your template contains a SELECT-Element. Use INPUT-Element instead with a bindpoint mark <input value="{bindpointname}"> and definitions with possibleValues to be able to use bindpoint mechanism.', this.requestor);
            }

            // Add select information
            let noSelectionNode = document.createElement('option');
            noSelectionNode.value = '';
            noSelectionNode.innerHTML = SWAC.lang.dict.Edit.noselection;
            selElem.appendChild(noSelectionNode);
            // Add bindpoint listener
            selElem.addEventListener('change', inElem.swac_inputListener);
//            selElem.swac_bp = inElem.swac_bp;
//            selElem.swac_bp.elem = selElem;
            // Add options
            let valFound = false;
            for (let curOption of options) {
                let optNode = document.createElement('option');
                optNode.value = curOption;
                optNode.setAttribute('swac_lang', curOption);
                optNode.innerHTML = curOption;
                selElem.appendChild(optNode);
                if (value && value !== null
                        && value === curOption) {
                    optNode.selected = 'selected';
                    valFound = true;
                } else if (attrDef.defaultvalue && attrDef.defaultvalue === curOption) {
                    optNode.selected = 'selected';
                }
            }
            // Report when value in dataset is not in the possible options
            if (value && !valFound) {
                Msg.error('Edit', 'Datasets >' + set.swac_fromName + '[' + set.id + ']< value >' + value + '< for >' + attrDef.name + '< was not found in the list of possible values.');
                console.log(options);
            }
            // Replace old element with new one
            inElem.parentNode.replaceChild(selElem, inElem);
            inElem = selElem;
        } else {
            inElem.classList.add('uk-input');
            inElem.setAttribute('type', 'text');
            if (value && value !== null) {
                inElem.setAttribute('value', value);
            } else if (attrDef.defaultvalue) {
                set[attrDef.name] = attrDef.defaultvalue;
                inElem.setAttribute('value', attrDef.defaultvalue);
            }
        }

        // Add required information if applicable
        if (attrDef.isNullable === false && !attrDef.defaultvalue) {
            inElem.setAttribute('required', 'required');
        }
        // Add onChange listener
        if (this.options.singleInputChange)
            inElem.addEventListener('focus', this.onElemClick.bind(this));
        inElem.addEventListener('input', this.onElemInput.bind(this));
        inElem.addEventListener('change', this.onElemChanged.bind(this));
        inElem.addEventListener('invalid', this.onInvalidInput.bind(this));
    }

    /**
     * Executed when clicking an input element
     * 
     * @param {DOMEvent} evt Event for the click
     */
    onElemClick(evt) {
        let evtElem = evt.target;

        // Get set that should be edited
        let repForElem = this.findRepeatedForChild(evtElem);
        // If child set is edited
        if (!repForElem) {
            repForElem = this.findRepeatedForSet(evtElem);
        }
        let set = repForElem.swac_dataset;
        let attr = evtElem.getAttribute('name');

        // Create overlayinput
        if (evtElem.nodeName === 'INPUT' && (evtElem.type === 'number' || evtElem.type === 'text')) {
            let inElem = document.createElement('INPUT');
            inElem.setAttribute('class', evtElem.getAttribute('class'));
            inElem.setAttribute('type', evtElem.getAttribute('type'));
            inElem.value = evtElem.value;
            evtElem.after(inElem);
            inElem.focus();
            evtElem.style.display = 'none';

            let thisRef = this;
            inElem.addEventListener('change', function () {
                // Set new value to dataset
                set[attr] = inElem.value;
                thisRef.onElemInput(evt);
                thisRef.onElemChanged(evt);
            });
            inElem.addEventListener('blur', function () {
                // Remove overlay input and show original
                inElem.remove();
                evtElem.style.display = '';
            });
        }
    }

    /**
     * Updates the visibility of input fields based on the configuration in 
     * options.inputsVisibilty
     */
    modifyInputVisability(fromName, set) {
        if (!this.options.inputsVisibility || this.options.inputsVisibility.length === 0)
            return;

        let named = [];
        if (this.options.mainSource && this.options.mainSource !== fromName) {
            // Change visibility for child sets
            named = this.requestor.querySelectorAll('.swac_repeatedForChild[swac_fromname="' + fromName + '"][swac_setid="' + set.id + '"] [name]');
        } else {
            named = this.requestor.querySelectorAll('.swac_repeatedForSet[swac_fromname="' + fromName + '"][swac_setid="' + set.id + '"] [name]');
        }

        let toHide = [];
        for (let curDef of this.options.inputsVisibility) {
            if (typeof set[curDef.applyOnAttr] !== 'undefined' && set[curDef.applyOnAttr] === curDef.applyOnVal) {
                toHide = toHide.concat(curDef.hide);
            } else if (!curDef.applyOnAttr) {
                toHide = toHide.concat(curDef.hide);
            }
        }

        // Set new visibility
        for (let curNamed of named) {
            let name = curNamed.getAttribute('name');
            // Check if repeatedForValue is used for this
            let repForVal = curNamed;
            while (!repForVal.classList.contains('swac_repeatedForValue') && repForVal.parentElement) {
                repForVal = repForVal.parentElement;
            }
            if (repForVal.classList.contains('swac_repeatedForValue'))
                curNamed = repForVal;
            if (toHide.includes(name)) {
                curNamed.classList.add('swac_dontdisplay');
            } else {
                curNamed.classList.remove('swac_dontdisplay');
            }
        }
    }

    onInvalidInput(evt) {
        let elem = evt.target;
        // Make input visible if its hidden normally
        elem.classList.remove('swac_dontdisplay');
        Msg.error('Edit', 'Invalid input on ' + elem.name, this.requestor);
    }

    /**
     * Creates a reference display element in the given reftable.
     * 
     * @param {String} ref Reference to other information (ref://)
     * @param {DOMElement} reftableElem Element where the reference display should be placed
     * @returns {undefined}
     */
    createReferenceDisplay(ref, reftableElem) {
        let repeatForRefElem = reftableElem.querySelector('.swac_edit_repeatForRef');
        let thisRef = this;
        // Load data from reference
        Model.getFromReference(ref).then(function (dataCapsule) {
            // Get dataset id
            let setid = Model.getIdFromReference(ref);
            // Create row
            let refRow = repeatForRefElem.cloneNode(true);
            refRow.classList.remove('swac_edit_repeatForRef');
            refRow.classList.remove('swac_edit_repeatedForRef');
            refRow.setAttribute('swac_fromname', Model.getFromnameFromReference(ref));
            refRow.setAttribute('swac_setid', setid);
            repeatForRefElem.parentNode.appendChild(refRow);
            // The dataset should be contained within the recived data
            let refset = dataCapsule.data[setid];
            if (!refset) {
                Msg.error('Edit', 'Referenced dataset >' + ref + '< does not exists.', thisRef);
                return;
            }
            // Search placeholders (created as bindPoints)
            let refBps = refRow.querySelectorAll('swac-bp');
            for (let curRefBp of refBps) {
                let refAttrName = curRefBp.getAttribute('attrName');
                // Check if there is a value for this attr
                if (refset[refAttrName]) {
                    //TODO create new bindpoint instead of textnode
                    let newAttrOut = document.createTextNode(refset[refAttrName]);
                    curRefBp.parentNode.replaceChild(newAttrOut, curRefBp);
                } else {
                    let newAttrOut = document.createTextNode('');
                    curRefBp.parentNode.replaceChild(newAttrOut, curRefBp);
                }
            }

            // Register delete function
            let deleteElem = refRow.querySelector('.swac_edit_deleteref');
            deleteElem.addEventListener('click', thisRef.onClickDelRef.bind(thisRef));
        }).catch(function (error) {
            Msg.error('Edit', 'Could not get data for ref >' + ref + '<: ' + error, thisRef);
        });
    }

    /**
     * Shows the editor form belonging to the clicked element.
     * 
     * @param {DOMEvent} evt Event that calls the toggle.
     * @returns {undefined}
     */
    onFormToggle(evt) {
        evt.preventDefault();
        // Find element repeated for set
        let inputAreaElem = this.findRepeatedForSet(evt.target);
        // Search form within repeated for set
        let formElem = inputAreaElem.querySelector('form');
        if (formElem) {
            inputAreaElem = formElem;
        }

        this.showInputArea(inputAreaElem, inputAreaElem.parentElement);
    }

    /**
     * Performed when click the add button
     * 
     * @param {Event} evt Event that called the addButton action
     * @returns {undefined}
     */
    onClickAdd(evt) {
        if (evt)
            evt.preventDefault();
        // Create new set
        let set;
        if (this.options.customDefaultSet) {
            // From template
            set = this.options.customDefaultSet;
        } else {
            // or default empty
            let nameparts = this.options.newdatasetname.split('.');
            let newname = SWAC.lang.dict;
            if (newname) {
                for (let curNamepart of nameparts) {
                    newname = newname[curNamepart];
                }
            } else {
                newname = 'new';
            }

            set = {
                id: 0,
                name: newname
            };
        }

        // Get datasource name
        let fromName = this.options.mainSource;
        if (!fromName)
            fromName = this.requestor.fromName;
        if (!fromName) {
            Msg.error('Edit', 'Could not create a new set because the mainSource is unknown. Add configuration >options.mainSource<', this.requestor);
            return;
        }
        // Check if set allready exists
        if (this.data[fromName] && this.data[fromName].getSet(0)) {
            UIkit.modal.alert(SWAC.lang.dict.Edit.addsavefirst);
            return;
        }
        set.swac_fromName = fromName;
        set.swac_isnew = true;
        this.addSet(fromName, set);

        let newElem = this.requestor.querySelector('[swac_fromname="' + fromName + '"][swac_setid="' + set.id + '"]');
        if (newElem) {
            newElem.classList.add('uk-open');
        }

        if (this.options.customDefaultChildSets) {
            for (let curChild of this.options.customDefaultChildSets) {
                curChild[this.options.parentIdAttr] = set.id;
                curChild.swac_isnew = true;
                this.addSet(curChild.swac_fromName, curChild);
            }
        }
    }

    /**
     * Shows the input area, depending on the element and options:
     * - if options.editorTargetElemnt is set the area is puted into the target
     * - if there is no target and the inputAreaElem is not in DOM it's added at the end of the requestor
     * - if the inputAreaElem is allready in DOM and invisible, it's made visible
     * - if the inputAreaElem is allready in DOM and visible, nothing is modified. 
     * 
     * @param {DOMElement} inputAreaElem Element containing input elements
     * @param {DOMElement} appendToElem Element where to append the input area
     * @returns {undefined}
     */
    showInputArea(inputAreaElem, appendToElem) {
        let editorTarget = document.querySelector(this.options.editorTargetElement);
        // Reset and insert editor form
        if (editorTarget !== null) {
            this.hideInputArea();
            Msg.warn('Edit', 'Insert edit inputs into target >' + this.options.editorTargetElement + '<');
            // Note displaystate
            if (inputAreaElem.classList.contains('swac_dontdisplay')) {
                inputAreaElem.classList.remove('swac_dontdisplay');
                editorTarget.reappendHide = true;
            }
            // Note spring element if there is one
            if (inputAreaElem.parentElement) {
                editorTarget.reappendTo = inputAreaElem.parentElement;
            }

            editorTarget.appendChild(inputAreaElem);
        } else if (!inputAreaElem.parentElement && appendToElem) {
            Msg.warn('Edit', 'Append edit input to given element because \n\
                there is no options.editorTargetElement specified.');
            inputAreaElem.classList.remove('swac_dontdisplay');
            appendToElem.appendChild(inputAreaElem);
        } else if (!inputAreaElem.parentElement && appendToElem) {
            Msg.warn('Edit', 'Append edit input to requestor because \n\
                there is no options.editorTargetElement specified.');
            this.requestor.appendChild(inputAreaElem);
        } else if (inputAreaElem.classList.contains('swac_dontdisplay')) {
            Msg.warn('Edit', 'Makeing edit input visible at the place its defined in template.');
            inputAreaElem.classList.remove('swac_dontdisplay');
        } else {
            Msg.warn('Edit', 'Edit input is allready visible.');
        }
    }

    /**
     * Hides the input area.
     * 
     * @returns {undefined}
     */
    hideInputArea() {
        let editorTarget = document.querySelector(this.options.editorTargetElement);
        // Reset and insert editor form
        if (editorTarget !== null) {
            Msg.warn('Edit', 'Remove inputs from target >' + this.options.editorTargetElement + '<');
            // Make content again invisable
            if (editorTarget.reappendHide) {
                editorTarget.firstChild.classList.add('swac_dontdisplay');
            }
            // Move content back to its origin
            if (editorTarget.reappendTo) {
                editorTarget.reappendTo.appendChild(editorTarget.firstChild);
            } else {
                editorTarget.innerHTML = '';
            }
        }
    }

    /**
     * Function executed when the user clicks on the delete button of a dataset.
     * 
     * @param {DOMEvent} evt Event calling the function
     * @returns {undefined}
     */
    onClickDel(evt) {
        evt.preventDefault();
        // Search clicked form element
        let formElem = evt.target;
        while (formElem.parentNode !== null) {
            formElem = formElem.parentNode;
            if (formElem.nodeName === 'FORM') {
                break;
            }
        }

        // Report missing form elem
        if (formElem.nodeName !== 'FORM') {
            Msg.error('Edit', 'There is no FORM element in Editor template above the delete button.', this.requestor);
            return;
        }

        // Get affected set
        let setElem = formElem.querySelector('[swac_fromname]');
        let set = this.data[setElem.getAttribute('swac_fromname')].getSet(setElem.getAttribute('swac_setid'));

        // Check if dataset that should be deleted is a new added one
        if (set.swac_isnew) {
            this.removeSets(this.requestor.fromName, set.id);
            return;
        }

        // Check if datasource is a file
        if (this.requestor.fromName.endsWith('.json')) {
            Msg.error('Edit', 'Datasets from files can not be deleted.', this.requestor);
            UIkit.modal.alert(SWAC.lang.dict.Edit.filesourcenotsupported);
            return;
        }

        let dataCapsle = {
            data: [],
            fromName: this.requestor.fromName
        };
        if (this.options.sendAlongData !== null) {
            dataCapsle.data[0] = Object.assign({}, this.options.sendAlongData);
        } else {
            dataCapsle.data[0] = {};
        }

        // Get id and set it to the datacapsle
        dataCapsle.data[0].id = set.id;

        // Delete dataset with model
        let thisRef = this;
        let delPromise = Model.delete(dataCapsle);
        delPromise.then(function (results) {
            thisRef.hideInputArea();
            thisRef.removeSets(thisRef.requestor.fromName, set.id);
        });
        //Implementation note: If child datasets should be deleted also, this 
        //should be archived by useing CASECADE in database
    }

    /**
     * Function executed when the user clicks on the copy button of a dataset.
     * 
     * @param {DOMEvent} evt Event calling the function
     * @returns {undefined}
     */
    onClickCopy(evt) {
        evt.preventDefault();
        let set = this.findRepeatedForSet(evt.target).swac_dataset;
        this.copySet(set);
    }

    /**
     * Function executed when the user clicks the button to add a child.
     */
    onClickAddChild(evt) {
        evt.preventDefault();

        // Get new childs source and default value
        let childidElem = document.querySelector(".swac_edit_newchildid");
        let childid = childidElem.options[childidElem.selectedIndex].value;
        let childidparts = childid.split('|');
        let childsource = childidparts[0];
        let childselectattr = this.options.childSourceSelectAttribute;
        let childselectvalue = childidparts[1];

        // Create child dataset
        let set = {};
        let reftype = 'int4';
        // Set available attribute from definition
        for (let curDef of this.options.definitions.get(childsource)) {
            if (typeof curDef.defaultvalue !== 'undefined') {
                set[curDef.name] = curDef.defaultvalue;
            } else {
                set[curDef.name] = null;
            }
            // Notice type of parent reference
            if (curDef.name === this.options.parentIdAttr)
                reftype = curDef.type;
        }

        // Set the in modal prev selected value
        set[childselectattr] = childselectvalue;
        // Set the parent of this child
        let repForSet = this.lastClickedAddChildBtn;
        while (repForSet && !repForSet.classList.contains('swac_repeatedForSet')) {
            repForSet = repForSet.parentElement;
        }
        let parentid = repForSet.getAttribute('swac_setid');
        if (reftype === 'int4' || reftype === 'int8') {
            parentid = parseInt(parentid);
        }
        if (reftype === 'float4' || reftype === 'float8') {
            parentid = parseFloat(parentid);
        }
        set[this.options.parentIdAttr] = parentid;

        if (this.options.customOnClickAddChild)
            set = this.options.customOnClickAddChild(set);

        this.addSet(childsource, set);
    }

    /**
     * Function executed when the user clicks the button to open a modal
     * @param evt
     */
    onClickAddChildDialog(evt) {
        evt.preventDefault();

        let repForSet = this.findRepeatedForSet(evt.target);
        let parent = repForSet.swac_dataset;

        if (this.options.customCheckAddChildAlowed) {
            if (!this.options.customCheckAddChildAlowed(parent)) {
                return;
            }
        }

        this.lastClickedAddChildBtn = evt.target;

        let modal = document.querySelector(".swac_addChildModal");
        let addChildBtn = modal.querySelector(".swac_editAddChildButton");
        let select = modal.querySelector('.swac_edit_newchildid');
        if (select.options.length === 0) {
            if (!this.options.childSourceSelectAttribute) {
                Msg.error('Edit', 'Option >childSourceSelectAttribute< not set. Set it to make a child value selectable.', this.requestor);
                return;
            }
            // Search definitions from possible child sources
            for (let [curDefSource, curDefs] of this.options.definitions) {
                // Exclude main source
                if (curDefSource === this.options.mainSource)
                    continue;
                // Search attribute
                for (let curDef of curDefs) {
                    if (curDef.name === this.options.childSourceSelectAttribute) {
                        for (let curOption of curDef.possibleValues) {
                            if (!this.options.childSourceSelectExclude.includes(curOption)) {
                                let opt = document.createElement('option');
                                opt.setAttribute('swac_lang', curOption);
                                opt.value = curDefSource + '|' + curOption;
                                opt.innerHTML = curOption;
                                if (this.options.definitions.length > 2) {
                                    opt.innerHTML += ' (' + curDefSource + ')';
                                }
                                select.appendChild(opt);
                            }
                        }
                        break;
                    }
                }
            }
            // Add function to add child button
            addChildBtn.addEventListener('click', this.onClickAddChild.bind(this));
            // Translation required
            let translateElem = document.querySelector('[swa^="Translator"]');
            if (translateElem) {
                translateElem.swac_comp.translate();
            }
        }
        UIkit.modal(modal).show();
    }

    /**
     * Function executed when the user clicks the button to delete a child.
     * 
     * @param {DOMEvent} evt Event that calls the click
     */
    onClickDelChild(evt) {
        evt.preventDefault();
        // Search repeatedForSet
        let repeated = this.findRepeatedForChild(evt.target);
        let fromName = repeated.getAttribute('swac_fromname');
        let setid = parseInt(repeated.getAttribute('swac_setid'));

        // Get set
        let set = this.data[fromName].getSet(setid);
        // Check if dataset that should be deleted is a new added one
        if (set.swac_isnew) {
            this.removeSets(fromName, setid);
            return;
        }

        let dataCapsle = {
            data: [],
            fromName: fromName
        };
        if (this.options.sendAlongData !== null) {
            dataCapsle.data[0] = Object.assign({}, this.options.sendAlongData);
        } else {
            dataCapsle.data[0] = {};
        }

        // Get id and set it to the datacapsle
        dataCapsle.data[0].id = setid;
        // Delete dataset with model
        let thisRef = this;
        let delPromise = Model.delete(dataCapsle);
        delPromise.then(function (results) {
            thisRef.removeSets(fromName, setid);
        });
    }

    /**
     * Function executed when the user clicks the button to copy a child
     *
     * @param evt Event that calls the click
     */
    onClickCopyChild(evt) {
        evt.preventDefault();
        let repeated = this.findRepeatedForChild(evt.target);
        let fromName = repeated.getAttribute('swac_fromname');
        let proxySet = this.data[fromName].getSet(repeated.getAttribute('swac_setid'));
        let newset = {};
        for (let attr in proxySet) {
            if (attr.startsWith('swac_'))
                continue;
            newset[attr] = proxySet[attr];
        }
        delete newset.id;
        this.addSet(fromName, newset)
    }

    /**
     * Function for saveing object from form
     * 
     * @param {DOMElement} formElem Form to save values from
     * @param {boolean} showMessages if true succsess or fail messages are displayed
     * @returns {undefined}
     * @deprecated Should be no longer used
     */
    saveFormInput(formElem, supressMessages, setupdate = true) {
        let repForSet = this.findRepeatedForSet(formElem);
        let fromName = repForSet.getAttribute('swac_fromname');
        let setid = repForSet.getAttribute('swac_setid');

        // Do not save if form is invalid
        if (!formElem.checkValidity()) {
            Msg.warn('Edit', 'Do not save information from form because input is invalid', this.requestor);
            return;
        }

        Msg.flow('edit', 'Save information from form for set >' + fromName + '<[' + setid + ']', this.requestor);

        if (!this.data[fromName]) {
            Msg.error('Edit', 'Datasource >' + fromName + '< does not exists.', this.requestor);
            return;
        }

        // Search dataset
        let set = this.data[fromName].getSet(setid);
        if (!set) {
            Msg.error('Edit', 'Could not find dataset >' + fromName + '<[' + setid + ']', this.requestor);
            return;
        }

        // Get attribute values from form elements
        for (let i in formElem.elements) {
            let name = formElem.elements[i].name;
            let value;
            if (typeof formElem.elements[i] !== 'function'
                    && name && name !== ''
                    && this.findRepeatableForValue(formElem.elements[i]) === null) {

                if (formElem.elements[i].nodeName === 'INPUT') {
                    // Get value for checkbox
                    if (formElem.elements[i].type === 'checkbox') {
                        if (formElem.elements[i].checked) {
                            value = true;
                        } else {
                            value = false;
                        }
                        // Get value for normal input
                    } else {
                        value = formElem.elements[i].value;
                    }
                } else if (formElem.elements[i].nodeName === 'SELECT') {
                    // Get value for select
                    value = formElem.elements[i].options[formElem.elements[i].selectedIndex].value;
                } else {
                    Msg.error('Edit', 'Support for ' + formElem.elements[i].nodeName + " not implemented yet.");
                }
                if (value !== null) {
                    set[name] = value;
                }
            } else if (!name || name === '') {
                let nodeName = formElem.elements[i].nodeName;
                if (nodeName !== 'BUTTON'
                        && nodeName !== 'FIELDSET'
                        && i !== 'length') {
                    Msg.warn('Edit',
                            'There is no name for the input element >'
                            + i + '<', this.requestor);
                }
                continue;
            }
        }
        // Get reference areas
        let refAreas = formElem.querySelectorAll('[swac_edit_reftable]');
        for (let curRefArea of refAreas) {
            let attrName = curRefArea.getAttribute('swac_edit_reftable');
            let isMultiRefArea = curRefArea.classList.contains('swac_edit_multiref');
            if (isMultiRefArea) {
                if (!set[attrName]) {
                    set[attrName] = [];
                }
            }

            // Find references in area
            let refElems = curRefArea.querySelectorAll('[swac_fromname]');
            for (let curRefElem of refElems) {
                let curRef = 'ref://' + curRefElem.getAttribute('swac_fromname') + '/' + curRefElem.getAttribute('swac_setid');
                if (isMultiRefArea) {
                    set[attrName].push(curRef);
                } else {
                    set[attrName] = curRef;
                    break;
                }
            }
        }

        // Call saveSets from component
        let thisRef = this;
        this.saveSet(set, supressMessages, setupdate).then(function (set) {

        }).catch(function (err) {
            Msg.error('Edit', err, thisRef.requestor);
        });
    }

    /**
     * Save the current new dataset and creates a new one
     * 
     */
    saveAndNew() {
        let formElem = this.requestor.querySelector('form[swac_setid="0"]');
        this.saveFormInput(formElem, true, false);
    }

    /**
     * Execute when button saveAll is clicked
     * 
     * @param {Event} evt Event that called the action
     * @returns {undefined}
     */
    onClickSaveAll(evt) {
        evt.preventDefault();
        this.saveData();
    }

    /**
     * Executed when an single form should be saved
     */
    onClickSave(evt) {
        Msg.flow('Edit', 'onClickSave()', this.requestor);
        evt.preventDefault();
        // Find form for validation
        let formElem = evt.target;
        while (!formElem.classList.contains('swac_editForm') && formElem.parentElement) {
            formElem = formElem.parentElement;
        }
        // validate form
        if (formElem.reportValidity()) {
            Msg.info('edit', 'Input in form was validated succsessfully.');
        } else {
            UIkit.modal.alert(SWAC.lang.dict.Edit.forgotteninput);
            return;
        }

        // Get set from sets element
        let setElem = this.findRepeatedForSet(evt.target);
        let set = {};
        if (setElem?.hasAttribute('swac_fromname')) {
        } else if (formElem.querySelector('[swac_fromname]')) {
            setElem = formElem.querySelector('[swac_fromname]');
            set = this.data[setElem.getAttribute('swac_fromname')].getSet(setElem.getAttribute('swac_setid'));
        } else {
            // Single input form (for forms with only add new but no editing of existing sets)
            setElem = formElem;
        }

        // Update set from input fields
        let inputElems = setElem.querySelectorAll('input');
        for (let curInputElem of inputElems) {
            let curName = curInputElem.name;
            if (curInputElem.checked)
                set[curName] = true;
            else if (curInputElem.value)
                set[curName] = curInputElem.value;
            else
                Msg.error('Edit', 'Input field >' + curName + '< not supported. Please contact support.', this.requestor);
        }
        let selectElems = setElem.querySelectorAll('select');
        for (let curSelElem of selectElems) {
            let curName = curSelElem.name;
            set[curName] = curSelElem.value;
        }

        // Call saveSets from component
        let thisRef = this;
        let setid_old = set.id;
        this.saveSet(set, true).then(function (set) {
            UIkit.modal.alert(SWAC.lang.dict.Edit.saved);
            // Open dialog again and jump to it if set was saved with new id (so redras was done)
            if (set.id !== setid_old) {
                let oldSetElem = thisRef.requestor.querySelector('[swac_fromname="' + set.swac_fromName + '"][swac_setid="' + setid_old + '"]');
                if (oldSetElem)
                    oldSetElem.remove();
                thisRef.addSet(set.swac_fromName, set);
                let newSetElem = thisRef.requestor.querySelector('[swac_fromname="' + set.swac_fromName + '"][swac_setid="' + set.id + '"]');
                if (newSetElem) {
                    newSetElem.classList.add('uk-open');
                    newSetElem.scrollIntoView();
                }
            }
        }).catch(function (err) {
            Msg.error('Edit', err, thisRef.requestor);
            UIkit.modal.alert(SWAC.lang.dict.Edit.couldnotsave);
        });
    }

    /**
     * Eventhandler executed when an list element was dragged.
     * 
     * @param {DOMEvent} evt Drag event
     * @returns {undefined}
     */
    onDragStart(evt) {
        evt.dataTransfer.setData("setname", evt.target.getAttribute('swac_fromname'));
        evt.dataTransfer.setData("setid", evt.target.getAttribute('swac_setid'));
    }

    /**
     * Eventhandler executed when something was dropped
     * 
     * @param {DOMEvent} evt Drop event
     * @returns {undefined}
     */
    onDrop(evt) {
        evt.preventDefault();
        // Search form elem
        let formElem = evt.target;
        while (formElem.parentNode !== null) {
            formElem = formElem.parentNode;
            if (formElem.nodeName === 'FORM') {
                break;
            }
        }
        // validate form
        if (formElem.reportValidity()) {
            Msg.info('edit', 'Input in form >' + formElem.getAttribute('id') + '< was validated succsessfully.');
            this.saveFormInput(formElem, true);
        } else {
            UIkit.modal.alert(SWAC.lang.dict.Edit.forgotteninput);
            return;
        }
        // Check if there is a acceptance regex
        let attrName = evt.target.getAttribute('name');
        let dropAccepts = this.options.dropAccepts.get(attrName);
        // Get transfered data
        let setname = evt.dataTransfer.getData("setname");
        let setid = evt.dataTransfer.getData("setid");

        // Check if drop is accepted
        if (setname.indexOf(dropAccepts + '/') === -1
                || (!dropAccepts && setname.indexOf(attrName) === -1)) {
            UIkit.modal.alert(SWAC.lang.dict.Edit.dropNotAccepted);
            return;
        }

        // Get data of the dropped element from reference
        let ref = 'ref://' + setname.replace('/list', '/get') + '?id=' + setid;
        let thisRef = this;
        Model.getFromReference(ref).then(function (set) {
            // Check if there is a special handling function
            let joinerTarget = thisRef.options.dropJoinerTargets.get(attrName);
            let dropfunc = thisRef.options.dropFunctions.get(attrName);
            if (dropfunc) {
                // Execute special handling function
                try {
                    dropfunc(set, evt.target, formElem);
                } catch (error) {
                    Msg.error('edit', 'Could not execute external drop-function >' + dropfunc.name + '< for ref >' + ref + '<: ' + error);
                }
            } else if (joinerTarget) {
                thisRef.createJoiner(set, joinerTarget, evt.target, formElem);
            } else {
                // Create list entry
                Msg.error('edit', 'Default drop generation is not implemented yet.');
            }
        }).catch(function (error) {
            Msg.error('edit', 'Could not fetch data for reference >' + ref + '<: ' + error);
            UIkit.modal.alert(SWAC.lang.dict.Edit.dropFetchError);
        });
    }

    onDragover(evt) {
        evt.preventDefault();
        //TOOO highligh drop area if dragged element could be dropped here
    }

    /**
     * Create a joiner between two datasets.
     * This is a default implementation for handling onDrop events. It can be
     * configured with a joinertarget.
     * 
     * @param {Object} set Data of the droppend element
     * @param {Object} joinerDef Definition of the joiner that should be created.
     * @param {DOMElement} dropzoneElem Element where the drop occured
     * @param {DOMElement} formElem Form element where the drop is referneced to
     * @returns {undefined}
     */
    createJoiner(set, joinerDef, dropzoneElem, formElem) {
        // Get dataset reference target
        let refTargetSetName = formElem.swac_fromname.replace('/list', '');
        let refTargetSetId = formElem.swac_setid;

        // Create joiner
        let dataCapsle = {
            data: [],
            fromName: joinerDef.targetSetName
        };
        dataCapsle.data[0] = {};
        dataCapsle.data[0][joinerDef.referenceFromName] = 'ref://' + refTargetSetName + '/' + refTargetSetId;
        dataCapsle.data[0][joinerDef.referenceDropName] = set.referencedBy.replace('get?id=', '');
        Msg.warn('Edit', 'Send data to source >' + joinerDef.targetSetName + '<', this.requestor);
        // Save joiner
        let thisRef = this;
        Model.save(dataCapsle).then(function (joiner) {
//            let ref = 'ref://' + joinerDef.targetSetName
//                    + '/' + SWAC.config.interfaces.get + "?id=" + joiner.id;
            let refTableElem = formElem.querySelector('[swac_edit_reftable="' + dropzoneElem.getAttribute('name') + '"]');
            // Create list entry
            thisRef.createReferenceDisplay(ref, refTableElem);
        }).catch(function (error) {
            UIkit.modal.alert(SWAC.lang.dict.Edit.couldnotsave + ' ' + error);
        });
    }

    /**
     * Method to execute if a reference should be deleted.
     * 
     * @param {DOMEvent} evt Event that is triggering the action
     * @returns {undefined}
     */
    onClickDelRef(evt) {
        evt.preventDefault();
        UIkit.modal.alert('Deletion of references is not implemented yet.');
    }

    /**
     * Method to be executed, when a input was made to an element
     */
    onElemInput(evt) {
        Msg.flow('Edit', 'Input to >' + evt.target.name + '<', this.requestor);
        evt.target.setCustomValidity("");
        let newVal;
        if (evt.target.nodeName === 'SELECT') {
            newVal = evt.target.options[evt.target.selectedIndex].value;
        } else {
            newVal = evt.target.value;
        }

        // Get affected set
        let set = this.findSourceSet(evt.target);

        let repForChild = this.findRepeatedForChild(evt.target);
        if (repForChild) {
            let fromName = repForChild.getAttribute('swac_fromname');
            set = this.data[fromName].getSet(repForChild.getAttribute('swac_setid'));
//            set[evt.target.name] = newVal;    //TODO Should be set by bindpoint
            // Check if multichange mode
            if (this.groupedit) {
                // Get repeatedForSet
                let repForSet = this.findRepeatedForSet(repForChild);
                let groupChilds = repForSet.querySelectorAll('.swac_repeatedForChild[swac_group="' + repForChild.getAttribute('swac_group') + '"] [name="' + evt.target.name + '"]');
                for (let curChild of groupChilds) {
                    if (curChild === evt.target) {
                        continue;
                    }
                    let curSet = this.findRepeatedForChild(curChild).swac_dataset;
                    if (evt.target.nodeName === 'SELECT') {
                        curSet[evt.target.name] = evt.target.options[evt.target.selectedIndex].value;
                        curChild.selectedIndex = evt.target.selectedIndex;
                    } else {
                        curSet[evt.target.name] = evt.target.value;
                    }
                }
            }
        } else {
//            set[evt.target.name] = newVal;    //TODO Should be set by bindpoint
            // Check if multichange mode
            if (this.groupedit) {
                let sets;
                if (this.options.mainSource) {
                    sets = this.data[this.options.mainSource];
                } else {
                    for (let curSource in this.data) {
                        sets = this.data[curSource].getSets();
                        break;
                    }
                }
                for (let curSet of sets) {
                    // Do not reset changed one
                    if (curSet === set)
                        continue;
                    if (evt.target.nodeName === 'SELECT') {
                        curSet[evt.target.name] = evt.target.options[evt.target.selectedIndex].value;
                        // Find select element
                        let selElem = this.requestor.querySelector('.swac_repeatedForSet[swac_setid="' + curSet.id + '"] [name="' + evt.target.name + '"]');

                        selElem.selectedIndex = evt.target.selectedIndex;
                    } else {
                        curSet[evt.target.name] = evt.target.value;
                    }
                }
            }
        }
        // Custom after input
        if (this.options.customAfterInput) {
            // Put function to internal to give possibility to use "this" in method
            this.customAfterInput = this.options.customAfterInput;
            this.customAfterInput(evt.target.name, newVal, set, this.data);
        }
    }

    /**
     * Method to be executed, when the value of any element has changed
     */
    onElemChanged(evt) {
        Msg.flow('Edit', 'Change to >' + evt.target.name + '<', this.requestor);
        // Get affected set
        let set = this.findSourceSet(evt.target);
        // Update childs
        let repForChild = this.findRepeatedForChild(evt.target);
        if (repForChild) {
            // Childset was edited - Update inputs visibility
            let fromName = repForChild.getAttribute('swac_fromname');
            set = this.data[fromName].getSet(repForChild.getAttribute('swac_setid'));
            this.modifyInputVisability(fromName, set);
        }

        evt.target.setCustomValidity("");
        // Custom after afterInputChanged
        if (this.options.customAfterInputChanged) {
            let newVal;
            if (evt.target.nodeName === 'SELECT') {
                newVal = evt.target.options[evt.target.selectedIndex].value;
            } else {
                newVal = evt.target.value;
            }
            // Put function to internal to give possibility to use "this" in method
            this.customAfterInputChanged = this.options.customAfterInputChanged;
            this.customAfterInputChanged(evt.target.name, newVal, set, this.data);
        }
    }

    /**
     * Activate special behaviors on special key pressed
     */
    onKeyPress(evt) {
        switch (evt.charCode) {
            case 42:
                evt.preventDefault();
                this.toggleGroupEdit();
                break;
        }
    }

    /**
     * When group edit button is clicked
     */
    onClickGroupEdit(evt) {
        evt.preventDefault();
        this.toggleGroupEdit();
    }

    /**
     * Toggles the gorup edit mode
     */
    toggleGroupEdit() {
        // Toggle group edit mode
        this.groupedit = (this.groupedit) ? false : true;
        if (this.groupedit) {
            this.showNotify(SWAC.lang.dict.Edit.groupedit);
        } else {
            this.showNotify();
        }
        let groupEditElems = this.requestor.querySelectorAll('.swac_editGroupModeButton');
        for (let curGroupEditElem of groupEditElems) {
            if (this.groupedit)
                curGroupEditElem.classList.add('uk-button-secondary');
            else
                curGroupEditElem.classList.remove('uk-button-secondary');
        }
    }

    /**
     * Gets the definitions from REST interface
     * 
     * @param {String} datasource Name of the datasource to get defiitions for
     */
    fetchDefinitionsFromREST(datasource) {
        return new Promise((resolve, reject) => {
            // Create requestor for definitons
            let defRequestor = {fromName: datasource};
            // Get definitions of createable object
            let thisRef = this;
            Model.getValueDefinitions(defRequestor).then(function (defs) {
                thisRef.options.definitions.set(datasource, defs);
                resolve();
            }).catch(function (error) {
                thisRef.options.definitions.set(datasource, []);
                reject(error);
            });
        });
    }

    /**
     * Gets the definitions from analysing the data
     */
    fetchDefinitionsFromData(datasource) {
        let thisRef = this;
        return new Promise((resolve, reject) => {
            this.getDataDefinitionsForDatasource(datasource).then(function (defs) {
                thisRef.options.definitions.set(datasource, defs);
                resolve();
            });
        });
    }

    /**
     * Gets definitions for attributes from pre defined HTML code (custom template code)
     * 
     * @param {String} datasource Name of the datasource the definitions should belong to
     * @param {DOMElement} repForSet Element that is repeated for sets and contains the input fields
     */
    completeDefinitionsFromHTML(datasource, repForSet) {
        let curDefs = this.options.definitions.get(datasource);
        if (!curDefs)
            curDefs = [];
        // Create def from available input fields
        let inputElems = repForSet.querySelectorAll('input');
        for (let curInputElem of inputElems) {
            // Check if def allready exists or its a bindpoint mark
            if (curDefs.find(def => def.name === curInputElem.name) || curInputElem.name.startsWith('{'))
                continue;
            let curDef = {
                name: curInputElem.name,
                source: datasource
            };
            switch (curInputElem.type) {
                case 'checkbox':
                    curDef.type = 'bool';
                    break;
                case 'password':
                    curDef.type = 'password';
                    break;
                case 'number':
                    curDef.type = 'float8';
                    break;
                case 'date':
                    curDef.type = 'date';
                    break;
                case 'datetime-local':
                    curDef.type = 'timestamp';
                    break;
                case 'time':
                    curDef.type = 'time';
                    break;
                case 'color':
                    curDef.type = 'color';
                    break;
            }
            curDefs.push(curDef);
        }
        let selectElems = repForSet.querySelectorAll('select');
        for (let curSelElem of selectElems) {
            // Check if def allready exists or its a bindpoint mark
            if (curDefs.find(def => def.name === curSelElem.name) || curSelElem.name.startsWith('{'))
                continue;
            let curDef = {
                name: curSelElem.name,
                source: datasource,
                type: 'select',
                possibleValues: []
            };
            let opts = curSelElem.querySelectorAll('option');
            for (let curOpt of opts) {
                curDef.possibleValues.push(curOpt.value);
            }
            curDefs.push(curDef);
        }
    }

    /**
     * Shows or hides a notify message
     */
    showNotify(msg) {
        let nElems = this.requestor.querySelectorAll('.swac_editNotify');
        for (let nElem of nElems) {
            if (msg && msg !== '') {
                nElem.classList.remove('swac_dontdisplay');
                nElem.innerHTML = msg;
            } else {
                nElem.classList.add('swac_dontdisplay');
            }
        }
    }

    /**
     * Shows a message near an input element
     *
     * @param {String} fromName Name of the datasource
     * @param {int} setId Id of the dataset
     * @param {String} attr Attribute to show message at
     * @param {String} msg Message to show
     */
    showNotifyToInput(fromName, setId, attr, msg) {
        Msg.flow('Edit', 'showNotifyToInput ' + fromName + ' ' + setId + ' = ' + msg, this.requestor);
        // Search input elem
        let inputElem = this.requestor.querySelector('[swac_fromname="' + fromName + '"][swac_setid="' + setId + '"] [name="' + attr + '"]');
        if (!inputElem) {
            Msg.warn('Edit', 'Notify >' + msg + '< could not be shown because element for >' + fromName + '[' + setId + '].' + attr + '< was not found.');
        } else {
            inputElem.reportValidity();
            inputElem.setCustomValidity(msg);
        }
    }

    /**
     * ConstraintSolver integration
     */
    setConstraintSolver(cs) {
        this.constraintsolver = cs;
        // Create observer for each dataset
        for (let curSource in this.data) {
            for (let curSet of this.data[curSource].getSets()) {
                if (!curSet)
                    continue;
                Msg.flow('Edit', 'Create DomainObserver for ' + curSource + ' ' + curSet.id, this.requestor);
                this.createDomainObserver(curSource, curSet);
            }
        }
    }

    /**
     * Creates a new EditDomainObserver that should be informed, when the
     * domain has changed.
     */
    createDomainObserver(source, set) {
        let pc = this.constraintsolver.partCollections.get(source);
        // If no partCollection exists create
        if (!pc) {
            Msg.warn('Edit', 'No ConstraintSolving for dataset >' + source + '[' + set.id + ']<.'
                    + 'The dataset does not exists in ConstraintSolver. Please add data before setting '
                    + 'ConstraintSolver.');
            return;
        }
        let defs = this.options.definitions.get(source);

        // Create one observer for each possible attribute
        for (let curDef of defs) {
            let curAttr = curDef.name;
            let edo = new EditDomainObserver(source, set.id, curAttr, this.requestor);
            let dc = pc[set.id];
            if (!dc) {
                Msg.error('Edit', 'No domainCollection found for >' + source + '[' + set.id + ']');
                console.log(pc);
                break;
            }
            dc.addObserver(curAttr, edo);
            dc.notifyObservers(curAttr);
        }
    }

    afterSave(dataCapsule) {
        //Currently nothing todo here
    }

    /**
     * Toggles the autodata function. If autodata is activated the component automatically fetches data as given in the configuration
     * and fills in the form fields and creates new datasets.
     * 
     * @param {DOMEvent} evt Click event on button
     */
    onClickToggleAutoData(evt) {
        evt.preventDefault();
        // Get set element
        let setElem = evt.target;
        while (!setElem.classList.contains('swac_repeatedForSet') && setElem.parentElement) {
            setElem = setElem.parentElement;
        }
        // Change button
        let autoElem = setElem.querySelector('.swac_editAutoDataButton');
        autoElem.setAttribute('swac_lang', 'autodata_start');
        if (this.autointervals.length === 0) {
            if (this.options.customOnStartAutoData)
                this.options.customOnStartAutoData();
            this.startAutoData(setElem);
            autoElem.innerHTML = SWAC.lang.dict.Edit.autodata_stop;
        } else {
            this.stopAutoData(setElem);
            autoElem.innerHTML = SWAC.lang.dict.Edit.autodata_start;
        }
    }

    /**
     * Starts the automatically filling with data acording the definitions
     */
    startAutoData(setElem) {
        let set = setElem.swac_dataset;
        let curDefs = this.options.definitions.get(set.swac_fromName);
        if (!curDefs) {
            Msg.warn('Edit', 'Definitions for >' + set.swac_fromName + '< not found.', this.requestor);
            return;
        }
        // Go trough awaited input fields
        for (let curDef of curDefs) {
            // Create auto update value if defined
            if (curDef.auto) {
                // Get input element
                let inputElem = setElem.querySelector('[name="' + curDef.name + '"]');
                if (curDef.auto.script) {
                    let intv = setInterval(function () {
                        try {
                            curDef.auto.script(inputElem);
                            inputElem.checkValidity();
                        } catch (e) {
                            inputElem.setCustomValidity(SWAC.lang.dict.Edit.autodata_script_err);
                        }
                    }, curDef.auto.update * 1000);
                    this.autointervals.push(intv);
                }
                if (curDef.auto.requestor) {
                    let intv = setInterval(function () {
                        Model.load(curDef.auto.requestor).then(function (data) {
                            let set;
                            for (let curSet of data) {
                                if (curSet) {
                                    set = curSet;
                                    break;
                                }
                            }
                            if (set[inputElem.name]) {
                                inputElem.value = set[inputElem.name];
                            } else if (set.result) {
                                inputElem.value = set.result;
                            } else if (set.value) {
                                inputElem.value = set.value;
                            } else {
                                Msg.warn('Edit', 'There is no value for >' + inputElem.name + '< in result.', this.requestor);
                                inputElem.setCustomValidity(SWAC.lang.dict.Edit.autodata_requestor_nodata);
                            }
                            inputElem.checkValidity();
                        }).catch(function (err) {
                            // Add error message from autodata to inputElem
                            inputElem.setCustomValidity(SWAC.lang.dict.Edit.autodata_requestor_err);
                        });
                    }, curDef.auto.update * 1000);
                    this.autointervals.push(intv);
                }
            }
        }
    }

    /**
     * Stops the automatically filling data
     */
    stopAutoData(setElem) {
        // Stop intervals
        for (let curInterval of this.autointervals) {
            clearInterval(curInterval);
        }
        this.autointervals = [];
    }
}