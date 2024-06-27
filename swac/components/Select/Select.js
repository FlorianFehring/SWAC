import SWAC from '../../swac.js';
import View from '../../View.js';
import Msg from '../../Msg.js';
import Model from '../../Model.js';

export default class Select extends View {

    constructor(options = {}) {
        super(options);
        this.name = 'Select';
        this.desc.text = "Creates a flexible selectbox. Can use checkboxes, selectbox, multiselect and datalist for selection and allows getting and setting selected ones over a unified interface.";
        this.desc.developers = 'Florian Fehring (FH Bielefeld)';
        this.desc.license = 'GNU Lesser General Public License';

        this.desc.templates[0] = {
            name: 'selectbox',
            desc: 'Creates a selectbox for each dataset.'
        };
        this.desc.templates[1] = {
            name: 'multiselectbox',
            desc: 'Creates a multiselectbox for each dataset.'
        };
        this.desc.templates[2] = {
            name: 'checkboxes',
            desc: 'Creates a list of checkboxes for selection.'
        };
        this.desc.templates[3] = {
            name: 'datalist',
            desc: 'Creates a datalist for each dataset.'
        };
        this.desc.templates[4] = {
            name: 'dropdown',
            desc: 'Show a icon with select possibilities as dropdown.'
        };
        this.desc.optPerTpl[0] = {
            selc: '.swac_forChilds',
            desc: 'Area for the ObservedObject childen to create a hierarchical structure.'
        };
        this.desc.optPerTpl[1] = {
            selc: '.expand_input',
            desc: 'Marks the input for an Expand children.'
        };
        this.desc.optPerTpl[2] = {
            selc: '.swac_select_clickentry',
            desc: 'Marked entry that, when clicked calls the onClickEntry() function.'
        };
        this.desc.optPerTpl[3] = {
            selc: '.swac_select_expandbutton',
            desc: 'Button where, on click sub selectable sets are expanded. Triggers a request to the subsets. Needs the >expandSources< option to be set.'
        };
        this.desc.optPerTpl[4] = {
            selc: '.swac_child',
            desc: 'Element that encapsulates an aera that contains a representation of a child dataset. The attribute swac_.'
        };

        this.desc.reqPerSet[0] = {
            name: "id",
            desc: "Id that identifies the selection."
        };
        this.desc.reqPerSet[1] = {
            name: "name",
            desc: "Name of the selection."
        };
        this.desc.optPerSet[0] = {
            name: "parent",
            desc: "ID or reference to the parent dataset. Used to order selectable entries in trees (only in supporting select elements like select box)"
        };
        this.desc.opts[0] = {
            name: "onChange",
            desc: "A function that is executed when an selection is changed"
        };
        if (!options.onChange)
            this.options.onChange = function () {};
        this.desc.opts[1] = {
            name: "onSelect",
            desc: "A function that is executed when selection was changed. Executed in the component context. Gets the event and the selected value."
        };
        if (!options.onSelect)
            this.options.onSelect = function () {};
        this.desc.opts[2] = {
            name: "onUnselect",
            desc: "A function that is executed when an element is unselected"
        };
        if (!options.onUnselect)
            this.options.onUnselect = function () {};
        this.desc.opts[3] = {
            name: "selectedsSource",
            desc: "Requestor where to get the selected elements",
            example: {
                fromName: '../../data/input/select/exampleSelecteds.json'
            }
        };
        if (!options.selectedsSource)
            this.options.selectedsSource = null;
        this.desc.opts[4] = {
            name: "expandSources",
            desc: "Map of key (= name of the source where a click on should request for sub selections), value = (DataRequestor where subentries can get)"
        };
        if (!options.expandSources)
            this.options.expandSources = new Map();
        this.desc.opts[5] = {
            name: "onClickEntry",
            desc: "Function to be executed when clicking an select entry that is marked with class swac_select_clickentry."
        };
        if (!options.onClickEntry)
            this.options.onClickEntry = function () {};

        this.desc.funcs[0] = {
            name: 'getInputs',
            desc: 'Returns the key and value pairs from this input component in a object'
        };
        this.desc.funcs[1] = {
            name: 'setInputs',
            desc: 'Sets the selected or checked items on the component after the given data.',
            params: [
                {
                    name: 'inputs',
                    desc: '{Object{}} inputs Object with attribut (value) and its selectstate (true, false) \n\
Example parameter:\n\
 {\n\
 option1: true,\n\
  option2: false\n\
}\n\
 Each option that is not given in the parameter remains at its previous state'
                }
            ]
        };
        this.desc.funcs[2] = {
            name: 'simulateClick',
            desc: 'Simulate a click event on a option.',
            params: [
                {
                    name: 'id',
                    desc: 'id of the element to simulate a click on'
                }
            ]
        };
        this.desc.funcs[3] = {
            name: 'countOptions',
            desc: 'Counts the number of available options',
            return: 'Number of available options'
        };
        this.desc.funcs[4] = {
            name: 'addOptions',
            desc: 'Adds a list of possible options to the select element',
            params: [
                {
                    name: 'options',
                    desc: 'options List of objects for selection'
                }
            ]
        };
        this.desc.funcs[5] = {
            name: 'clearOptions',
            desc: 'Removes all options from the select element'
        };
        this.options.plugins = new Map();
    }

    init() {
        return new Promise((resolve, reject) => {

            this.registerBehaviors(this.requestor);
            // Wait for component to load than look at selecteds
            let thisRef = this;
            window.swac.reactions.addReaction(function () {
                // Get selected data
                let dataRequest = thisRef.options.selectedsSource;
                if (dataRequest !== null) {
                    Model.load(dataRequest).then(function (data) {
                        for (let i in data) {
                            thisRef.setInputs(data[i]);
                        }
                        resolve();
                    }).catch(function (err) {
                        Msg.error('Select', 'Error requesting the selecteds from >' + thisRef.options.selectedsSource + '<: ' + err, thisRef);
                    });
                }
            }, this.requestor.id);

            // Transfer required attribute from SWA-Statement to input element (allows browser check of required inputs)
            if (this.requestor.getAttribute('required')) {
                let selectElem = this.requestor.querySelector('select');
                if (selectElem) {
                    selectElem.setAttribute('required', true);
                }
                let inputElem = this.requestor.querySelector('input');
                if (inputElem) {
                    inputElem.setAttribute('required', true);
                }
            }

            resolve();
        });
    }

    /**
     * Register event listeners on input elements after a new set was added.
     * 
     * @param {WatchableSet} set Set that was added
     * @param {DOMElement[]} repeateds New created repeated elements for the dataset
     */
    afterAddSet(set, repeateds) {
        // Create select behavior on all occurences
        for (let curElem of repeateds) {
            this.registerOnActions(set, curElem);
        }
    }

    /**
     * Register on-actions for single input elements
     * 
     * @param {WatchableSet} set Set to register action for
     * @param {DOMElement} elem Element created for set
     */
    registerOnActions(set, elem) {
        // Register onClickEntry
        let markedElems = elem.querySelectorAll('.swac_select_clickentry');
        for (let curMarkedElem of markedElems) {
            curMarkedElem.addEventListener('click', this.options.onClickEntry.bind(this));
        }

        // Get input elements from requestor
        let inputElems = elem.querySelectorAll('input');
        for (let curInputElem of inputElems) {
            if (curInputElem.type === 'checkbox')
                curInputElem.addEventListener('change', this.onChangeCheckbox.bind(this));
            else {
                curInputElem.addEventListener('change', this.onChangeInput.bind(this));
            }
        }

        if (this.options.expandSources.size > 0) {
            this.registerExpandfunctions();
        } else {
            // Remove expand elements
            let expandButtons = elem.querySelectorAll('.swac_select_expandbutton');
            for (let expandElem of expandButtons) {
                expandElem.parentNode.removeChild(expandElem);
            }
        }
    }

// Deprecated use registerBehavior instead
    registerBehaviors(elem) {
        let datalistElem = elem.querySelector('datalist');
        if (datalistElem) {
            let inputElems = elem.querySelectorAll('input');
            for (let curInputElem of inputElems) {
                curInputElem.addEventListener('input', this.onChangeDatalist.bind(this));
            }
        } else {
            // Get select form element (for form-select based selection)
            let selectElem = elem.querySelector('select');
            if (selectElem !== null) {
                selectElem.addEventListener('change', this.onChangeSelect.bind(this));
            }
        }
    }

    /**
     * Function executed onChange event if there are an onSelect and / or an
     * onUnselect function in options.
     * 
     * @param {type} evt
     * @returns {undefined}
     */
    onChangeSelect(evt) {
        Msg.flow('Select', 'onChange occured at select', this.requestor);
        // Get effected element
        let elem = evt.target;
        // Set selection for direct access
        this.requestor.value = elem.value;
        // Call onChange function
        this.onChange = this.options.onChange;
        this.onChange(evt, elem.value);
    }

    /**
     * Function executed onChange event if there are an onSelect and / or an
     * onUnselect function in options.
     * 
     * @param {type} evt
     * @returns {undefined}
     */
    onChangeCheckbox(evt) {
        Msg.flow('Select', 'onChange occured at checkbox', this.requestor);
        // Get effected element
        let elem = evt.target;
        // Get checkbox state
        if (elem.checked === true) {
            // Now element is checked
            if (this.options.onSelect !== null) {
                this.options.onSelect(evt, elem.value);
                // Set selection for direct access
                if (this.requestor.value.length < 1)
                    this.requestor.value = elem.value;
                else
                    this.requestor.value += ',' + elem.value;
            }
        } else {
            // Now element is not longer checked
            if (this.options.onUnselect !== null) {
                this.options.onUnselect(evt, elem.value);
                // Set selection for direct access
                this.requestor.value = this.requestor.value.replace(',' + elem.value, '').replace(elem.value);
            }
        }
        // Call onChange function
        this.onChange = this.options.onChange;
        this.onChange(evt, elem.value);
    }

    /**
     * Method executed on change if the datalist template is used.
     * 
     * @param {type} evt Chang event
     * @returns {undefined}
     */
    onChangeDatalist(evt) {
        Msg.flow('Select', 'onChange occured at datalist', this.requestor);
        // Get value from input
        let inputElem = this.requestor.querySelector('input');
        let value = inputElem.value;
        // Reset last viewed elements
        let listElems = this.requestor.querySelectorAll('[swac_datalistvalue]');
        for (let curElem of listElems) {
            curElem.classList.add('swac_dontdisplay');
        }

        // Search for element with that swac_datalistvalue
        let valueElems = this.requestor.querySelectorAll('[swac_datalistvalue="' + value + '"]');
        for (let curElem of valueElems) {
            curElem.classList.remove('swac_dontdisplay');
        }
        // Get effected element
        let elem = evt.target;
        // Set selection for direct access
        this.requestor.value = elem.value;
        // Call option onChange
        this.onChange = this.options.onChange;
        this.onChange(evt, elem.value);
    }

    /**
     * Function executed onChange event if there are an onSelect and / or an
     * onUnselect function in options.
     * 
     * @param {type} evt
     * @returns {undefined}
     */
    onChangeInput(evt) {
        Msg.flow('Select', 'onChange occured at input', this.requestor);
        // Get effected element
        let elem = evt.target;
        // Set selection for direct access
        this.requestor.value = elem.value;
        // Call onChange option
        this.options.onChange(evt, elem.value);
    }

    /**
     * Returns the key and value pairs from this input component in a object
     * 
     * @returns {Object} Object with name (attributnames) and values
     */
    getInputs() {
        let inputs = [];
        // Get inputs from checkboxes
        let checkboxElems = this.requestor.querySelectorAll('[type="checkbox"]');
        for (let curInputElem of checkboxElems) {
            if (curInputElem.checked) {
                let selected = {
                    name: curInputElem.name,
                    value: curInputElem.value
                };
                inputs.push(selected);
            }
        }

        // Get inputs from single or multiple select box
        let selectElems = this.requestor.querySelectorAll('select');
        for (let selectElem of selectElems) {
            for (var i = 0; i < selectElem.length; i++) {
                let value = selectElem.options[i].value;
                if (selectElem.options[i].selected
                        && value !== '') {
                    let selected = {
                        name: selectElem.options[i].getAttribute('name'),
                        value: value
                    };
                    inputs.push(selected);
                }
            }
        }

        // Get inputs from input with datalist
        let datalistElem = this.requestor.querySelector('datalist');
        if (datalistElem !== null) {
            let inputElem = this.requestor.querySelector('input');
            let value = inputElem.value;
            let listElem = this.requestor.querySelector('[value="' + value + '"]');
            if (listElem) {
                let selected = {
                    name: listElem.getAttribute('name'),
                    value: value
                };
                inputs.push(selected);
            }
        }

        return inputs;
    }

    /**
     * Sets the selected or checked items on the component
     * after the given data.
     * 
     * @param {Object{}} inputs Object with attribut (value) and its selectstate (true, false)
     * Example parameter:
     * {
     *  value1: true,
     *  value2: false,
     *  ...
     *  valueN: false
     * }
     * Each option that is not given in the parameter remains at its previous state
     * @returns {undefined}
     */
    setInputs(inputs) {
        for (let attr in inputs) {
            // Exclude internal attributes
            if (attr.startsWith('swac_'))
                continue;
            let datalistElem = this.requestor.querySelector('datalist');
            if (datalistElem === null) {
                // Select in single or multiselect
                let selectedElem = this.requestor.querySelector('[value="' + attr + '"]');
                // Only select if there is a elem with that value
                if (selectedElem !== null) {
                    if (inputs[attr] === true) {
                        selectedElem.selected = 'selected';
                    } else {
                        selectedElem.removeAttribute('selected');
                    }
                    selectedElem.checked = inputs[attr];
                } else {
                    Msg.warn('select', 'There is no option with the value >' + attr + "< that could be selected.");
                }
            } else {
                // Set inputs for datalist
                // Get selected option from datalist
                let selectedListElem = datalistElem.querySelector('[swac_setid="' + attr + '"]');
                if (selectedListElem !== null) {
                    let inputElem = this.requestor.querySelector('input');
                    inputElem.value = selectedListElem.value;
                } else if (attr != 'id') {
                    Msg.error('select', 'There is no datalist entry for the selection of attribute >' + attr + '<');
                }
            }
        }
    }

    simulateClick(id) {
        let selectedElem = this.requestor.querySelector('#' + id);

        var evt = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
        });
        // If cancelled, don't dispatch our event
        !selectedElem.dispatchEvent(evt);

        return evt;
    }

    countOptions() {
        // Select in single, multiselect, checkbox or datalist
        let optionElems = this.requestor.querySelectorAll('[value]');
        return optionElems.length;
    }

    addOptions(options) {
        let requestor = this.requestor;
        // Get template from requestor
        let templateElems = requestor.querySelectorAll('.swac_repeatForSet');
        for (let curTemplateElem of templateElems) {
            let valueName;
            if (curTemplateElem.nodeName === 'OPTION') {
                valueName = curTemplateElem.value;
            } else if (curTemplateElem.hasAttribute('swac_datalistvalue')) {
                valueName = curTemplateElem.getAttribute('swac_datalistvalue');
            } else {
                valueName = curTemplateElem.querySelector('input').getAttribute('name');
            }
            valueName = valueName.replace('{', '').replace('}', '');

            // Delete unused elements with the class swac_select_delAddAttOpt
            let deleteList = curTemplateElem.querySelectorAll(".swac_select_delAddAtOpt");
            for (let elem of deleteList) {
                elem.parentNode.removeChild(elem);
            }

            // For each dataset
            for (let curOption of options) {
                // Check if option has needed value attribute
                if (typeof curOption[valueName] !== 'undefined') {
                    let newElem = curTemplateElem.cloneNode(true);
                    newElem.classList.remove('swac_repeatForSet');
                    newElem.classList.add('swac_repeatedForSet');
                    newElem.setAttribute('swac_datalistvalue', curOption[valueName]);
                    newElem.setAttribute('swac_fromname', curOption.swac_fromname);
                    newElem.setAttribute('swac_setid', curOption.id);

                    for (let curAttr in curOption) {
                        SWAC.searchAndReplace('\{' + curAttr + '\}', curOption[curAttr], newElem);
                    }
                    // Check if there is a repeatForValue area
                    let repeatForValElem = newElem.querySelector('.swac_repeatForValue');
                    if (repeatForValElem !== null) {
                        // Go trough each value
                        for (let curVal in curOption) {
                            let newValElem = repeatForValElem.cloneNode(true);
                            newValElem.classList.remove('swac_repeatForValue');
                            newValElem.classList.add('swac_repeatedForValue');
                            SWAC.searchAndReplace('{attrName}', curVal, newValElem);
                            SWAC.searchAndReplace('{*}', curOption[curVal], newValElem);
                            repeatForValElem.parentNode.appendChild(newValElem);
                        }
                    }
                    this.registerBehaviors(newElem);
                    curTemplateElem.parentNode.appendChild(newElem);
                } else {
                    Msg.warn('select', 'Could not add option, because the required attribute >' + valueName + '< is missing.');
                }
            }
        }
    }

    clearOptions() {
        // Get all options
        let options = this.requestor.querySelectorAll('.swac_repeatedForSet');
        for (let curOption of options) {
            curOption.parentElement.removeChild(curOption);
        }
    }

    /**
     * Toggles the display of the lazy loaded sub elements.
     * 
     * @param {DOMEvent} evt Event fired when clicking on a expand node
     * @returns {undefined}
     */
    toggleExpandDatasets(evt) {
        let expandElem = evt.target;
        if (expandElem.innerHTML === "+") {
            expandElem.innerHTML = "-";
            let childAreas = expandElem.parentNode.querySelectorAll(".swac_forChilds");
            for (let curChildArea of childAreas) {
                curChildArea.classList.remove('swac_dontdisplay');
            }
            if (!expandElem.expanded) {
                let availSets = expandElem.getAttribute('swac_select_availSets');
                this.showExpandDatasets(expandElem.parentNode, availSets);
                expandElem.expanded = true;
            }
        } else {
            expandElem.innerHTML = "+";
            this.hideExpandDatasets(expandElem.parentNode);
        }
    }

    /**
     * Shows the sub datasets
     * 
     * @param {DOMElement} expandableElem Element wichs sub datasets should be shown
     * @param {Long} dataLength The length of the data to be extended
     */
    showExpandDatasets(expandableElem, dataLength) {
        let parentId = expandableElem.getAttribute("swac_id");
        let parentSetname = expandableElem.getAttribute('swac_fromname');
        // If setname is not on the expandableElem search at parent
        if (parentSetname === null)
            parentSetname = expandableElem.parentNode.getAttribute('swac_fromname');
        // Create parent ref for fetched data
        let parentRef;
        if (parentSetname.includes('.json')) {
            parentRef = 'ref://' + parentSetname + '/' + parentId;
        } else {
            parentRef = 'ref://' + parentSetname + '/' + parentId;
        }

        let expandConf = this.options.expandSources.get(parentSetname);
        // Check if should be clusterd
        if (expandConf.clusterMinimum && dataLength >= expandConf.clusterMinimum) {
            this.showClusteredExpandDatasets(expandConf, dataLength, parentRef);
        } else {
            let expandElem = expandableElem.querySelector('.swac_select_expandbutton');
            // Get dataRequestor for sup datasets
            if (!expandConf.dataRequestor) {
                expandElem.classList.add('swac_select_notexpandable');
                expandElem.setAttribute('uk-tooltip', SWAC.lang.dict.Select.notexpandable);
                Msg.warn('Select',
                        'Cant load sub datasets because there is no dataRequestor configured '
                        + 'in the expandSources option for >' + parentSetname + '<');
            } else {
                let dataRequestor = Model.copyDataRequestor(expandConf.dataRequestor, expandElem);
                let thisRef = this;
                Model.load(dataRequestor)
                        .then(function (resolveObj) {
                            let newOpts = resolveObj.data;
                            // Add parent if no one exists
                            for (let curOption of newOpts) {
                                if (!curOption.parent)
                                    curOption.parent = parentRef;
                                curOption.swac_fromname = dataRequestor.fromName;
                            }

                            //TODO change this to use addData()
                            thisRef.addOptions(newOpts);
                        }).catch(function (error) {
                    expandElem.classList.add('swac_select_notexpandable');
                    expandElem.setAttribute('uk-tooltip', SWAC.lang.dict.Select.notexpandable);
                    Msg.warn('Select',
                            'Could not fetch subElements for '
                            + expandableElem.getAttribute('swac_fromname')
                            + '[' + expandableElem.getAttribute('swac_setid') + ']: '
                            + error);
                });
            }
        }
    }

    /**
     * Creates and shows clusters for subsets.
     * 
     * @param {Object} expandConf Configuration for expanding
     * @param {Long} dataLength Size of subsets
     * @param {String} parentRef Reference to the parent element
     * @returns {undefined}
     */
    showClusteredExpandDatasets(expandConf, dataLength, parentRef) {
        // Calculate cluster size
        let clusterPercentage = expandConf.clusterPercentage;

        // Calculates the limit rounded up 
        let clusterSize = Math.ceil(dataLength / 100 * clusterPercentage);
        let clusterCount = dataLength / clusterSize;
        let options = [];

        // Creates the individual options for the Extendedarea
        for (let i = 0; i < clusterCount; i++) {
            let option = {};
            option.id = (i + 1);
            option.name = "Datenset: " + (clusterSize * i) + " bis " + ((clusterSize * i) + clusterSize);
            option.swac_fromname = expandConf.dataRequestor.fromName;
            option.parent = parentRef;
            option.limit = clusterSize;
            option.startset = clusterSize * i;
            options.push(option);
        }
        // Add the options
        this.addOptions(options);
    }

    /**
     * Deletes the ExpandArea under a specific element.
     * 
     * @param {parentElem} expandableElem the element that contains the extended ChildArea.
     * @returns {undefined}
     */
    hideExpandDatasets(expandableElem) {
        let childAreas = expandableElem.querySelectorAll(".swac_forChilds");
        for (let curChildArea of childAreas) {
            curChildArea.classList.add('swac_dontdisplay');
        }
    }

    /**
     * Register functions for lazy loading of sub entries
     * 
     * @returns {undefined}
     */
    registerExpandfunctions() {
        // Check if there are expandSources for the sources in data
        for (let sourceName in this.data) {
            if (this.options.expandSources.has(sourceName)) {
                let expandableElems = this.requestor.querySelectorAll('[swac_fromname="' + sourceName + '"]');
                for (let curExpandableElem of expandableElems) {
                    this.registerExpandfunction(curExpandableElem, sourceName);
                }
            }
        }
    }

    /**
     * Register a expand function for one expandable element.
     * This method runs concurrent
     * 
     * @param {DOMElement} curExpandableElem Element that can be extended
     * @param {String} sourceName Name of the source the expandable element is from
     * @returns {undefined}
     */
    registerExpandfunction(curExpandableElem, sourceName) {
        let thisRef = this;
        // Get expand button
        let expandButton = curExpandableElem.querySelector('.swac_select_expandbutton');
        if (!expandButton) {
            Msg.error('Select', 'options.expandSources is set, but there is no >swac_select_expandbutton< in the template.', this.requestor);
            return;
        }


        // Request size of possible expands
        this.getExpandableSize(curExpandableElem, sourceName).then(function (availSets) {
            // Register expand function
            if (availSets === null || availSets > 0) {
                if (availSets > 0)
                    expandButton.setAttribute('uk-tooltip', SWAC.lang.dict.Select.loadSubs.replace('%availSets%', availSets));
                if (availSets === null)
                    expandButton.setAttribute('uk-tooltip', SWAC.lang.dict.Select.loadMore);
                expandButton.addEventListener("click", thisRef.toggleExpandDatasets.bind(thisRef));
                expandButton.setAttribute('swac_select_availSets', availSets);
            } else {
                // Remove expand function
                expandButton.parentNode.removeChild(expandButton);
            }
        }).catch(function (reject) {
            // Remove expand function
            expandButton.remove();
        });
    }

    /**
     * Gets the count of datasets that must be fetched when the expand button
     * is pressed.
     * 
     * @param {DOMElement} curExpandableElem Element that can be extended
     * @param {String} sourceName Name of the source the expandable element is from
     * @returns {Promise} Promise that resolves with the number of sets fetchable 
     * or null if there is no configuration for fetching the size
     */
    getExpandableSize(curExpandableElem, sourceName) {
        return new Promise((resolve, reject) => {
            // Get expand configuration
            let expandConf = this.options.expandSources.get(sourceName);
            if (!expandConf.sizeRequestor) {
                resolve(null);
                return;
            }

            // Copy requestor
            let sizeRequestor = Model.copyDataRequestor(expandConf.sizeRequestor, curExpandableElem);

            Model.load(sizeRequestor)
                    .then(function (resolveObj) {
                        resolve(resolveObj.size);
                    }).catch(function (error) {
                Msg.error('Select',
                        'Could not fetch size for subElements for '
                        + curExpandableElem.getAttribute('swac_fromname')
                        + '[' + curExpandableElem.getAttribute('swac_setid') + ']: '
                        + error);
                resolve();
            });
        });
    }
}