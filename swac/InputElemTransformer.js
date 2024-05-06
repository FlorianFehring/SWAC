import SWAC from './swac.js';
import Msg from './Msg.js';
import Model from './Model.js';
import BindPoint from './BindPoint.js';

/* 
 * Class for transformn input elements depending on the type of data 
 */
export default class InputElemTransformer {

    /**
     * Create new transformer
     * 
     * @param {type} name 
     */
    constructor(comp, definitions = new Map()) {
        this.comp = comp;
        this.definitions = definitions;
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
                thisRef.definitions.set(datasource, defs);
                resolve();
            }).catch(function (error) {
                thisRef.definitions.set(datasource, []);
                reject(error);
            });
        });
    }

    /**
     * Gets the definitions from analysing the data
     */
    fetchDefinitionsFromData(set) {
        Msg.flow('InputElemTransformer', 'fetchDefintionsFromData()');
        let thisRef = this;
        return new Promise((resolve, reject) => {
            this.comp.getDataDefinitionsForDatasource(set.swac_fromName).then(function (defs) {
                thisRef.definitions.set(set.swac_fromName, defs);
                resolve();
            }).catch(function () {
                // No possibility to get from datasource, try on set only
                let defmap = new Map();
                // Load DatatypeReflection
                thisRef.getDatatypeReflection().then(function (dtr) {
                    // Look at each attribute
                    for (let attr in set) {
                        // Exclude swac_observers
                        if (attr.startsWith('swac_'))
                            continue;
                        let value = set[attr];
                        if (defmap.has(attr)) {
                            let def = defmap.get(attr);
                            if (value === null) {
                                def.isNullable = true;
                            } else {
                                let newtype = dtr.determineDataType(value);
                                if (newtype !== def.type) {
                                    def.type = 'String';
                                }
                            }
                            defmap.set(attr, def);
                        } else {
                            // Create definition
                            let def = {};
                            def.name = attr;
                            def.source = set.swac_fromName;
                            if (value === null) {
                                def.isNullable = true;
                            } else {
                                def.type = dtr.determineDataType(value);
                            }
                            defmap.set(attr, def);
                        }
                    }
                    resolve(Array.from(defmap.values()));
                });
            });
        });
    }

    getDatatypeReflection() {
        return new Promise((resolve, reject) => {
            // Load DatatypeReflection
            SWAC.loadAlgorithm('DatatypeReflection', 'DatatypeReflection').then(function (requestor) {
                resolve(requestor.swac_comp);
            });
        });
    }

    /**
     * Modifies the inputArea. Adds missing input fields after definition and
     * change input fields according to the data type.
     * 
     * @param {DOMElement} inputAreaElem Element that should be modified
     * @param {Object} set Object with dataset if the inputs should be filled.
     * @returns {undefined}
     */
    async modifyInputArea(inputAreaElem, set = {}) {
        let curDefs = this.definitions.get(set.swac_fromName);
        if (!curDefs) {
            curDefs = await this.fetchDefinitionsFromData(set);
        }
        if (!curDefs) {
            Msg.warn('Edit', 'Definitions for >' + set.swac_fromName + '< not found.', this.requestor);
            return;
        }
        // Go trough awaited input fields
        let hasAutoData = false;
        console.log('TEST curDefs:',curDefs);
        for (let curDef of curDefs) {
            // Exclude empty definitions or metadata
            if (!curDef /*|| curDef.name.startsWith('swac_')*/ || curDef.name.startsWith('{')) {
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
        } else if (attrDef.type === 'int8' || attrDef.type === 'int4' || attrDef.type === 'float4' || attrDef.type === 'float8') {
            inElem.classList.add('uk-input');
            inElem.classList.add('uk-form-width-small');
            inElem.setAttribute('type', 'number');
            if (attrDef.type === 'float8' || attrDef.type === 'float8') {
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
        } else if (attrDef.type === 'url') {
            inElem.classList.add('uk-input');
            inElem.classList.add('uk-form-width-small');
            inElem.setAttribute('type', 'url');
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
            if (attrDef.generated) {
                inElem.setAttribute('disabled', 'disabled');
            }
        }

        // Add required information if applicable
        if (attrDef.isNullable === false && !attrDef.defaultvalue) {
            inElem.setAttribute('required', 'required');
        }

        inElem.getValue = function () {
            let type = inElem.getAttribute('type');
            switch (type) {
                case 'checkbox':
                case 'radio':
                    return parseBoolean(inElem.value);
                case 'password':
                    return inElem.value;
                case 'number':
                    return Number(inElem.value);
                case 'date':
                case 'datetime-local':
                case 'time':
                case 'color':
                    return inElem.value;
                default:
                    Msg.warn("InputElemTransformer", 'Input type >' + type + '< has currently no special implementation. String value is returend.');
                    return inElem.value;
            }
        };

        // Add onChange listener
//        if (this.options.singleInputChange)
//            inElem.addEventListener('focus', this.onElemClick.bind(this));
//        inElem.addEventListener('input', this.onElemInput.bind(this));
//        inElem.addEventListener('change', this.onElemChanged.bind(this));
//        inElem.addEventListener('invalid', this.onInvalidInput.bind(this));
    }
}


