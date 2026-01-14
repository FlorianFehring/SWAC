import SWAC from '../../swac.js';
import View from '../../View.js';
import Msg from '../../Msg.js';

export default class Datadescription extends View {

    constructor(options = {}) {
        super(options);
        this.name = 'Datadescription';
        this.desc.text = 'Describe your data with text and colors. This component makes it possible to describe data. So a simple analysis is possible.';
        this.desc.developers = 'Florian Fehring (HSBI)';
        this.desc.license = 'GNU Lesser General Public License';

        this.desc.depends[0] = {
            name: 'Colorcalculations.js',
            path: SWAC.config.swac_root + 'algorithms/Colorcalculations.js',
            desc: 'Algorithms for color calculations'
        };
        this.desc.depends[1] = {
            name: 'UIKit Icons',
            path: SWAC.config.swac_root + 'libs/uikit/js/uikit-icons.min.js',
            desc: 'Icons used in the component'
        }
        this.desc.templates[0] = {
            name: 'datadescription',
            style: 'datadescription',
            desc: 'Shows the legend of the data'
        };

        this.desc.reqPerTpl[0] = {
            selc: '.swac_repeatForLegend',
            desc: 'Element that is repeated for each legend.'
        };
        this.desc.optPerTpl[0] = {
            selc: '.swac_datadescription_legendtitle',
            desc: 'Element where to insert the legends title'
        };
        this.desc.optPerTpl[1] = {
            selc: '.swac_datadescription_datatitle',
            desc: 'Element where to insert the datas title'
        };
        this.desc.optPerTpl[2] = {
            selc: '.swac_datadescription_datadesc',
            desc: 'Element where to insert the description of the data'
        };
        this.desc.optPerTpl[3] = {
            selc: '.swac_datadescription_attribution',
            desc: 'Element where to insert the attribution.'
        };

        this.desc.optPerSet[0] = {
            name: 'sourcename',
            desc: 'Name to display below the legend as attribution.'
        };
        this.desc.optPerSet[1] = {
            name: 'sourcelink',
            desc: 'Link to show in the attribution.'
        };
        this.desc.optPerSet[2] = {
            name: 'ATTRIBUTENAME.txt_title',
            desc: 'Title of the attribute as shown in the legend.'
        };
        this.desc.optPerSet[3] = {
            name: 'ATTRIBUTENAME.txt_desc',
            desc: 'Description of the attribute.'
        };
        this.desc.optPerSet[4] = {
            name: 'ATTRIBUTENAME.txt_uknw',
            desc: 'Default text for display, when no value is presend.'
        };
        this.desc.optPerSet[5] = {
            name: 'ATTRIBUTENAME.col',
            desc: 'Color to use for visualising the attribute. (Supports css color names, css hex codes and RGBA values)'
        };
        this.desc.optPerSet[6] = {
            name: 'ATTRIBUTENAME.minValue',
            desc: 'Estimated minimum value for this attribute. Used for normalizing the data.'
        };
        this.desc.optPerSet[7] = {
            name: 'ATTRIBUTENAME.maxValue',
            desc: 'Estimated maximum value for this attribute. Used for normalizing the data.'
        };
        this.desc.optPerSet[8] = {
            name: 'ATTRIBUTENAME.calcmode',
            desc: 'Mode the values (like color, text) will be calculated. Default is = (equality check on the values under ATTRIBUTENAME.values[VALUE]. Other supported: <'
        };
        this.desc.optPerSet[9] = {
            name: 'ATTRIBUTENAME.values',
            desc: 'Object containing the values that should be visualized as attributes with objects holding visualisation information, as described below.'
        };
        this.desc.optPerSet[10] = {
            name: 'ATTRIBUTENAME.scale',
            desc: 'Factor with wich the value should be scaled for presentation.'
        };
        this.desc.optPerSet[11] = {
            name: 'ATTRIBUTENAME.values[VALUE].col',
            desc: 'Color that should be used to visualise this value. (Supports css color names, css hex codes and RGBA values)'
        };
        this.desc.optPerSet[12] = {
            name: 'ATTRIBUTENAME.values[VALUE].txt',
            desc: 'Text describing this value. Used in legend and as vocable in description texts.'
        };
        this.desc.opts[0] = {
            name: 'visuDataset',
            desc: 'Name or id of the dataset that should be described. \n\
Searches the dataset in the given data. Example: var obj[0]={..}, obj[1]={...} \n\
can be accessed with visuDataset=1. Single objects can be accessed by setting \n\
this option to null.',
            example: 1
        };
        if (!options.visuDataset)
            this.options.visuDataset = null;
        this.desc.opts[1] = {
            name: 'visuAttribute',
            desc: 'Name of the attribute that should be visualised by default.\n\
Example: in obj[0] = { attr1=1, attr2=2} can the second attribute be accessed with visuAttribute=attr2.',
            example: 'attr2'
        };
        if (!options.visuAttribute)
            this.options.visuAttribute = null;
// Options for setting event handlers
        this.desc.opts[2] = {
            name: 'onLegendEntryClick',
            desc: 'Function to execute, if the user clicks on a legend entry',
            example: function (evt) {
                console.log('User clicked on legend entry.')
            }
        };
        if (!options.onLegendEntryClick)
            this.options.onLegendEntryClick = null;
        this.desc.opts[3] = {
            name: 'showLegend',
            desc: 'If true the legend is shown in the requestors area.'
        };
        if (options.showLegend !== false)
            this.options.showLegend = true;

        // For further development only internal used yet
        this.desc.opts[4] = {
            name: 'activeSource',
            desc: 'Name of the source the description is used from.',
            example: 'mysource'
        };
        if (!options.activeSource)
            this.options.activeSource = null;

        this.desc.opts[5] = {
            name: 'activeSet',
            desc: 'Id of the set the description is used from.',
            example: 1
        };
        if (!options.activeSet)
            this.options.activeSet = null;

        this.desc.opts[6] = {
            name: 'predefinedColors',
            desc: 'List of predefined colors that can be used in the legend. If not set, the all colors are used.',
            exmaple: ['#ffffff', '#000000']
        }
        this.desc.funcs[0] = {
            name: 'getLegend',
            desc: 'Builds a legend container',
            parameter: [
                {
                    name: 'requestor',
                    desc: 'SWAC Requestor'
                }
            ]
        };
        this.desc.funcs[1] = {
            name: 'getValuesVisdata',
            desc: 'Gets a specific visdata (e.g. col, name, etc.) representing a value on a specified attribute.',
            parameter: [
                {
                    name: 'attr',
                    desc: 'Attributes name'
                },
                {
                    name: 'value',
                    desc: 'Value to get color for'
                },
                {
                    name: 'visdataname',
                    desc: 'Name of the visdata to get'
                }
            ]
        };

        this.desc.events[0] = {
            name: 'swac_Datadescription_REQUESTOR_ID_changed',
            desc: 'Event is fired, when user edits a value in the legend. The event is fired on the document.',
            data: 'No data send, because components need to hold a reference to the Datadescription component and trigger the function to update their data depending on the datadescription.'
        };

        // Internal attributes
        this.msged_normedValues = new Map();
        this.msged_nodescValues = new Map();
        this.msged_nodescValue = new Map();

        // Formated data elements
        this.formatedDataElements = [];
    }

    init() {
        return new Promise((resolve, reject) => {
            let thisRef = this;
            document.addEventListener('swac_' + this.requestor.id + '_complete', function () {
                if (thisRef.options.showLegend) {
                    thisRef.getLegend();
                } else {
                    thisRef.requestor.classList.add('swac_dontdisplay');
                }
            });

            // Get all available requestors
            let requestorList = [this.requestor.id];
            let requestors = document.querySelectorAll('[swa]');
            for (let curRequestor of requestors) {
                requestorList.push(curRequestor.id);
            }
            // When loaded use datadescription on all requestors
            window.swac.reactions.addReaction(function (requestors) {
                // Format all data
                thisRef.formatAll();
            }, ...requestorList);

            resolve();
        });
    }

    afterAddSet(set, repeateds) {
        // Set first available source as active if no one is given
        if (!this.options.activeSource) {
            this.options.activeSource = set.swac_fromName;
            // Set first available set as active if no one is given
            if (!this.options.activeSet) {
                this.options.activeSet = set.id;
            }
        }
        super.afterAddSet(set, repeateds);
    }

    /**
     * Gets the descripted data from given data. Therefore it uses the 
     * options.visuDataset and options.visuAttribute option
     * 
     * @param {Object} data Object with data, may be with subdata or an array
     * @param {String} visuDataset Name or id of the dataset to visualize, overwrites the components option visuDataset for this call.
     * @returns {this.getDescribedDataset.dataset} The dataset that should be described.
     */
    getDescribedDataset(data, visuDataset = null) {
        if (typeof data === ' undefined' || data === null) {
            return [];
        }
        // Get default from datadescription_options
        let visuDatasetFromOpts = false;
        if (visuDataset === null && this.options.visuDataset) {
            visuDataset = this.options.visuDataset;
            visuDatasetFromOpts = true;
        }

        if (visuDataset === null && this.options.visuDataset) {

            Msg.warn('datadescription', 'There was nor a visuDataset or a datadescription_options.visuDataset option set. Will use whole given data');
            return data;
        } else if (visuDataset !== null
                && (typeof data[visuDataset] === 'undefined'
                        || data[visuDataset] === null)) {
            let msg = 'The visuDataset >' + visuDataset + '< was not found in data.';
            if (visuDatasetFromOpts) {
                msg += ' visuDataset was set by datadescription_optiom variable.';
            }
            Msg.warn('datadescription', msg);
            return [];
        } else if (visuDataset !== null) {
            data = data[visuDataset];
        }
        return data;
    }

    /**
     * Returns the described data from a single dataset.
     * 
     * @param {Object} set Dataset containing the data to describe
     * @param {String} visuAttribute Name of the attribute to visualize. Overwrites the components option visuAttribute for this call.
     * @returns {this.getDescribedValue.dataset} Value of the dataset
     */
    getDescribedValue(set, visuAttribute = null) {
        if (set === 'undefined' || set === null) {
            return null;
        }
        let visuAttributeFromOpts = false;
        if (visuAttribute === null
                && this.options.visuDataset) {
            visuAttribute = this.options.visuAttribute;
            visuAttributeFromOpts = true;
        }

        if (typeof set === 'object') {
            // Search in object
            let dProps = visuAttribute.split('.');
            let dProp = set;
            for (let curProp of dProps) {
                dProp = dProp[curProp];
                if (!dProp)
                    break;
            }
            if (dProp) {
                return dProp;
            } else {
                let msg = 'visuAttribute >' + visuAttribute + '< was not found in dataset.';
                if (visuAttributeFromOpts) {
                    msg += ' visuAttribute was defined in datadescription_options variable.';
                }
                Msg.warn('datadescription', msg, this.requestor);
            }
        } else {
            return set;
        }
        return null;
    }

    /**
     * Creates a description for the given dataset.
     *
     * @param {object[]} set The dataset to describe. Supported dataset DATALAYOUT:
     * data.ATTRIBUTENAME = VALUE
     * or
     * data[DATASETNO].ATTRIBUTENAME = VALUE
     * or
     * data.DATASETNAME.ATTRIBUTENAME = VALUE
     * @param {String} visuDataset Name or id of the dataset to visualize, overwrites the components option visuDataset for this call.
     * @returns {String} Description of the dataset
     */
    getDatasetDescription(set, visuDataset = null) {
        set = this.getDescribedDataset(set, visuDataset);
        if (set.length === 0) {
            return SWAC.lang.dict.Datadescription.nodata;
        }
        // Check if datadescription is available
        if (!this.data[this.options.activeSource])
            Msg.error('Datadescription', 'There is no description definition for >' + this.options.activeSource + '<', this.requestor);

        let legenddata = this.data[this.options.activeSource].getSet(this.options.activeSet);

        var desc = '';
        for (var attribute in set) {
            var voc = this.getVocable(set, visuDataset, attribute);
            var desctpl;
            if (typeof legenddata[attribute] === 'undefined') {
                desctpl = SWAC.lang.dict.Datadescription.nodescription;
            } else if (typeof voc !== 'undefined' && voc !== null) {
                desctpl = legenddata[attribute].txt_desc;
            } else {
                desctpl = legenddata[attribute].txt_uknw;
            }
            desc += desctpl.replace('{voc}', voc);
            desc += '<br>';
        }
        return desc;
    }

    /**
     * Gets the vocable that descripes the value
     *
     *@param {Object} data Data where to get a vocable from.
     * @param {String} visuDataset Name or id of the dataset to visualize, overwrites the components option visuDataset for this call.
     * @param {String} visuAttribute Name of the attribute to visualize, overwrites the components option visuAttribute for this call.
     * @returns vocable A desc description for the value or null, if not available
     */
    getVocable(data, visuDataset = null, visuAttribute = null) {
        let dataset = this.getDescribedDataset(data, visuDataset);
        if (visuAttribute === null
                && typeof this.options.visuAttribute !== 'undefined') {
            visuAttribute = this.options.visuAttribute;
        }
        // Get value
        let value = this.getDescribedValue(dataset, visuAttribute);

        let legenddata = this.data[this.options.activeSource].getSet(this.options.activeSet);

        if (typeof legenddata[visuAttribute] === 'undefined'
                || typeof legenddata[visuAttribute].values === 'undefined') {
            Msg.warn('datadescription', 'There is no ' + visuAttribute + '.values with description information in the data.');
        } else if (typeof legenddata[visuAttribute].values[value].txt !== 'undefined') {
            return legenddata[visuAttribute].values[value].txt;
        } else {
            Msg.warn('datadescription', 'For value >' + value + '< in >' + visuAttribute + '< is no vocable defined.');
        }
        return null;
    }

    /**
     * Calculates the value normed to minValue and maxValue attributes of the visudata.
     * 
     * @param {Object} data Data where to get the norm value from.
     * @param {String} visuDataset Name or id of the dataset to visualize, overwrites the components option visuDataset for this call.
     * @param {String} visuAttribute Name of the attribute to visualize, overwrites the components option visuAttribute for this call.
     * @returns {Number} Normed value between 0-100%, of original value, if no normation information is given
     */
    getNormedValue(data, visuDataset = null, visuAttribute = null) {
        // Get value
        let value = this.getScaledValue(data, visuDataset, visuAttribute);
        let legenddate = this.data[this.options.activeSource].getSet(this.options.activeSet);

        if (typeof legenddate[visuAttribute] === 'undefined'
                || typeof legenddate[visuAttribute].minValue === 'undefined'
                || typeof legenddate[visuAttribute].maxValue === 'undefined') {
            if (!this.msged_normedValues.has(visuAttribute)) {
                Msg.warn('datadescription', 'There are no >' + visuAttribute + '.minValue< or >' + visuAttribute + '.maxValue<.');
                this.msged_normedValues.set(visuAttribute, true);
            }

            return value;
        } else {
            let range = legenddate[visuAttribute].maxValue - legenddate[visuAttribute].minValue;
            let rangeValue = value - legenddate[visuAttribute].minValue;
            let normValue = (rangeValue / range) * 100;

            return normValue;
    }
    }

    /**
     * Calculates the scaled value.
     * 
     * @param {Object} data Data where to get the norm value from.
     * @param {String} visuDataset Name or id of the dataset to visualize, overwrites the components option visuDataset for this call.
     * @param {String} visuAttribute Name of the attribute to visualize, overwrites the components option visuAttribute for this call.
     * @returns {Number} Scaled value if a scale is given, the original value otherwise
     */
    getScaledValue(data, visuDataset = null, visuAttribute = null) {
        let dataset = this.getDescribedDataset(data, visuDataset);
        if (visuAttribute === null
                && typeof this.options.visuAttribute !== 'undefined') {
            visuAttribute = this.options.visuAttribute;
        }
        // Get value
        let value = this.getDescribedValue(dataset, visuAttribute);
        let legenddata = this.data[this.options.activeSource].getSet(this.options.activeSet);
        if (!legenddata[visuAttribute] || !legenddata[visuAttribute].scale) {
            Msg.warn('Datadescription', 'There is no >' + visuAttribute + '.scale< defined');
            return value;
        } else {
            return value * legenddata[visuAttribute].scale;
    }
    }

    /**
     * Gets the color for an attribute name.
     * 
     * @param {String} visuAttribute Name of the attribute to get the color for. Defaults to null and then uses the visuAttribute option.
     * @returns {String} Color value for attribute
     */
    getAttributeColor(visuAttribute = null) {
        if (visuAttribute === null
                && typeof this.options.visuAttribute !== 'undefined') {
            visuAttribute = this.options.visuAttribute;
        }
        let legenddata = this.data[this.options.activeSource].getSet(this.options.activeSet);

        if (typeof legenddata[visuAttribute] !== 'undefined'
                && typeof legenddata[visuAttribute].col !== 'undefined') {
            Msg.warn('datadescription', 'Get color for attribute name >' + visuAttribute + '<');
            return legenddata[visuAttribute].col;
        } else {
            return '#808080'; // Grey
    }
    }

    /**
     * Gets the color that visualises the data from the dataset.
     * Uses the options.visuAttribute option to choose the attribute to get color for.
     *
     * @param {Object} set A dataset with values to get color for or the name of an attribute.
     * @param {String} visuDataset Name or id of the dataset to visualize, overwrites the components option visuDataset for this call.
     * @param {String} visuAttribute Name of the attribute to visualize, overwrites the components option visuAttribute for this call.
     * @returns {String} Name of the color
     */
    getValueColor(set, visuDataset = null, visuAttribute = null) {

        let color = this.getValueVisData(set, 'col', visuDataset, visuAttribute);
        if (color === null) {
            color = '#808080';
        }
        return color;
    }

    /**
     * Gets the color that visualises the data from the dataset.
     * Uses the options.visuAttribute option to choose the attribute to get color for.
     *
     * @param {Object} data A dataset with values to get color for or the name of an attribute.
     * @param {String} visdataname Name of the visualisation attribute to get
     * @param {String} visuDataset Name or id of the dataset to visualize, overwrites the components option visuDataset for this call.
     * @param {String} visuAttribute Name of the attribute to visualize, overwrites the components option visuAttribute for this call.
     * @returns {String} Name of the color
     */
    getValueVisData(data, visdataname, visuDataset = null, visuAttribute = null) {
        if (visuAttribute === null
                && typeof this.options.visuAttribute !== 'undefined') {
            visuAttribute = this.options.visuAttribute;
        }

        if (!visuAttribute || visuAttribute === null) {
            // Automatic detect attribute to visualise
            for (let curSet of this.getMainSourceData().getSets()) {
                if (visuAttribute)
                    break;
                if (curSet) {
                    for (let attr in curSet) {
                        if (attr !== 'id' && !attr.startsWith('swac_')) {
                            visuAttribute = attr;
                            this.options.visuAttribute = attr;
                            break;
                        }
                    }
                }
            }
            Msg.info('datadescription', 'Automatic choosen visualising attribute >' + visuAttribute + '<. Set options.visuAttribute if you want to change.');
        }

        if (!visdataname || visdataname === null) {
            Msg.error('datadescription', 'Do not know which attribute should be used from >' + visuAttribute + '<');
            return null;
        }

        let value;
        if (typeof data === 'object') {
            let dataset = this.getDescribedDataset(data, visuDataset);
            value = this.getDescribedValue(dataset, visuAttribute);
        } else {
            value = data;
        }

        if (!value || value === null) {
            Msg.warn('Datadescription', 'There is no value for attribute >' + visuAttribute + '<.', this.requestor);
            return null;
        }
        return this.getValuesVisdata(visuAttribute, value, visdataname);
    }

    // public function
    getValuesVisdata(attr, value, visdataname) {
        // Get matching legends data
        let legenddata = this.data[this.options.activeSource].getSet(this.options.activeSet);
        if (typeof legenddata[attr] === 'undefined') {
            Msg.warn('Datadescription', 'There is no visudata for attribute >' + attr + '<', this.requestor);
            return null;
        } else if (!legenddata[attr].values) {
            if (!this.msged_nodescValues.has(attr)) {
                Msg.warn('Datadescription', 'There is no >'
                        + attr + '.values< in the data describing how data should be visualised.', this.requestor);
                this.msged_nodescValues.set(attr, true);
            }
            return null;
        }

        // Get calculation mode
        let calcMode = legenddata[attr].calcmode;
        if (!calcMode || calcMode === '=') {
            if (!legenddata[attr].values[value]) {
                if (!this.msged_nodescValue.has(value)) {
                    Msg.warn('Datadescription',
                            'There is no >' + attr + '.values[' + value
                            + ']< in the data describing how data should be visualised.');
                    this.msged_nodescValue.set(value, true);
                }
                return null;
            }
            // Get color by direct equality
            return legenddata[attr].values[value][visdataname];
        } else if (calcMode === '<') {
            // Get attributes into array
            let vals = Object.keys(legenddata[attr].values);
            for (let curVal of vals) {
                let curValNumber = new Number(curVal);
                if (value >= curValNumber) {

                } else {
                    return legenddata[attr].values[curVal][visdataname];
                }
            }
        } else if (calcMode === 'gradient') {
            // Get attributes into array
            let vals = Object.keys(legenddata[attr].values);
            let prevVal = null;
            for (let curVal of vals) {
                let curValNumber = new Number(curVal);
                if (value <= curValNumber) {
                    // If is below any specified color use first color
                    if (!prevVal)
                        return legenddata[attr].values[curVal][visdataname];
                    // Else calculate from distances
                    const f = (value - prevVal) / (curValNumber - prevVal);
                    let rgb = this.hexToRgb(legenddata[attr].values[curVal][visdataname]);
                    let rgbPrev = this.hexToRgb(legenddata[attr].values[prevVal][visdataname]);
                    let rgbres = {
                        r: rgb.r * f + (1 - f) * rgbPrev.r,
                        g: rgb.g * f + (1 - f) * rgbPrev.g,
                        b: rgb.b * f + (1 - f) * rgbPrev.b
                    };
                    return Colorcalculations.rgbToHex(rgbres);
                }
                prevVal = curValNumber;
            }
        } else if (calcMode === '>') {
            console.error('calcMode > not implemented yet');
        } else {
            Msg.warn('Datadescription', 'Calculation mode >' + attr + '.calcmode = "' + calcMode + '< is not supported.');
        }
        return null;
    }

    /**
     * Builds a legend element (DIV Container) 
     * 
     * @returns {DOMElement} HTML DIV Element containing the legend
     */
    getLegend() {
        let requestor = this.requestor;

        // setup border Color input in modal
        const borderColor = this.requestor.querySelector('.swac_datadescription_modal_border_col')
        borderColor.addEventListener('input', () => {
            borderColor.style.setProperty('--color', borderColor.value);
        })

        // Get repeatable element
        const attributeTemplate = requestor.querySelector('.swac_repeatForLegend');
        if (!attributeTemplate) {
            // If there is no legend code
            Msg.error('Datadescription', 'No legend code found.', this.requestor);
            return;
        }
        let legenddata = this.data[this.options.activeSource].getSet(this.options.activeSet);
        for (const attribute in legenddata) {
            // Exclude functions
            if (typeof legenddata[attribute] !== 'object' || attribute.startsWith('swac_')) {
                continue;
            }
            this.addNewAttributeElementToLegend(attributeTemplate, legenddata, attribute);
        }

        // Add attribution
        if (!legenddata.sourcename) {
            let sourceElem = this.requestor.querySelector(".swac_datadescrpiton_attribution");
            if (sourceElem)
                sourceElem.classList.add("swac_dontdisplay");
        }

        // add new attribute
        const newAttrModal = this.requestor.querySelector('.swac_datadescription_modal');
        const addAttrBtn = newAttrModal.querySelector('.swac_datadescription_new_attribute_button');
        const attrNameElem = newAttrModal.querySelector('.swac_datadescription_modal_attribute_name');
        const borderColElem = newAttrModal.querySelector('.swac_datadescription_modal_border_col');
        const visualiseElem = newAttrModal.querySelector('.swac_datadescription_modal_visualise');
        newAttrModal.addEventListener('beforeshow', () => {
            attrNameElem.value = '';
        });
        addAttrBtn.addEventListener('click', () => {
            if (legenddata[attrNameElem.value]) {
                Msg.error('Datadescription', 'Attribute with name >' + attrNameElem.value + '< already exists.', this.requestor);
                UIkit.notification({
                    message: SWAC.lang.dict.Datadescription.attributeexists + " (" + attrNameElem.value + ")",
                    status: 'info',
                    timeout: SWAC.config.notifyDuration,
                    pos: 'top-center'
                });
                return;
            }
            legenddata[attrNameElem.value] = {
                col: borderColElem.value,
                visualise: visualiseElem.checked,
                txt_title: '',
                txt_desc: '',
                values: {}
            }
            this.addNewAttributeElementToLegend(attributeTemplate, legenddata, attrNameElem.value);
            UIkit.modal(newAttrModal).hide();
        });

        return requestor;
    }

    /**
     * Adds an attribute to the legend
     * @param {HTMLElement} attributeTemplate HTML Template Element
     * @param {Object} legenddata data
     * @param {String} attribute attribute name
     */
    addNewAttributeElementToLegend(attributeTemplate, legenddata, attribute) {
        const requestor = this.requestor;
        // Create element copy
        const attributeElem = attributeTemplate.cloneNode(true);
        var desc = legenddata[attribute];
        attributeElem.classList.remove('swac_repeatForLegend');
        attributeElem.classList.add('swac_repeatedForLegend');
        // attributeElem.innerHTML = attributeElem.innerHTML.replace(new RegExp('{txt_desc}', 'g'), desc.txt_desc);

        // Title Element
        const titleElem = attributeElem.querySelector('.swac_datadescription_datatitle');
        titleElem.value = desc.txt_title;
        titleElem.setAttribute('swac_langattr','value:'+desc.txt_title);
        titleElem.placeholder = 'Datadescription.txt_titlePlaceholder';
        titleElem.style.width = titleElem.value.length > 0 ? titleElem.value.length + 'ch' : titleElem.placeholder.length + 'ch';
        titleElem.addEventListener('input', () => {
            if (titleElem.value.length < 1) {
                titleElem.style.width = titleElem.placeholder.length + 'ch';
                return;
            }
            titleElem.style.width = titleElem.value.length + 'ch';
        });
        titleElem.addEventListener('keydown', (e) => {
            if (e.keyCode === 13) {
                e.preventDefault();
                titleElem.blur();
            }
        })
        titleElem.addEventListener('focusout', () => {
            legenddata[attribute].txt_title = titleElem.value;
        });

        //Title Wrapper and settings
        const wrapperTitleElem = attributeElem.querySelector('.swac_datadescription_wrapper_title');
        const borderColorAttributeElem = attributeElem.querySelector('.swac_datadescription_attribute_border_color');
        borderColorAttributeElem.setAttribute('uk-tooltip', 'Datadescription.borderColorTooltip');
        const deleteAttributeElem = attributeElem.querySelector('.swac_datadescription_attribute_delete');
        deleteAttributeElem.setAttribute('uk-tooltip', 'Datadescription.attributeDeleteTooltip');
        if (desc.col) {
            desc.col = Colorcalculations.stringToHex(desc.col);
            borderColorAttributeElem.value = desc.col;

            borderColorAttributeElem.style.setProperty('--color', desc.col);
        }
        borderColorAttributeElem.addEventListener('input', () => {
            borderColorAttributeElem.style.setProperty('--color', borderColorAttributeElem.value);
        })
        borderColorAttributeElem.addEventListener('focusout', () => {
            legenddata[attribute].col = borderColorAttributeElem.value;
            this.renderFormatedDataElements();
        })
        wrapperTitleElem.addEventListener('mouseover', () => {
            borderColorAttributeElem.style.display = 'block'
            deleteAttributeElem.style.display = 'block'
        });
        wrapperTitleElem.addEventListener('mouseout', () => {
            borderColorAttributeElem.style.display = 'none'
            deleteAttributeElem.style.display = 'none'
        });

        deleteAttributeElem.addEventListener('click', () => {
            legenddata[attribute].visualise = false;
            this.renderFormatedDataElements();
            delete legenddata[attribute];
            attributeElem.remove();
        });

        // Description Element
        const descElem = attributeElem.querySelector('.swac_datadescription_datadesc');
        descElem.value = desc.txt_desc;
        descElem.setAttribute('swac_langattr','value:'+desc.txt_desc);
        descElem.placeholder = 'Datadescription.txt_descPlaceholder';
        descElem.style.width = descElem.value.length > 0 ? descElem.value.length + 'ch' : descElem.placeholder.length + 'ch';
        descElem.addEventListener('input', () => {
            if (descElem.value.length < 1) {
                descElem.style.width = descElem.placeholder.length + 'ch';
                return;
            }
            descElem.style.width = descElem.value.length + 'ch';
        });
        descElem.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                descElem.blur();
            }
        })
        descElem.addEventListener('focusout', () => {
            legenddata[attribute].txt_desc = descElem.value;
        });

        // Visualise Check Element
        const checkElem = attributeElem.querySelector('.swac_datadescription_datacheck');
        // Activate visualising when attribute for visualising is set
        //TODO replace visuAttribute with an array of names of attributes that should be visualised
        if (this.options.visuAttribute && this.options.visuAttribute === attribute) {
            checkElem.setAttribute('checked', 'checked');
            legenddata[attribute].visualise = true;
        } else if (!this.options.visuAttribute) {
            checkElem.setAttribute('checked', 'checked');
            legenddata[attribute].visualise = true;
        }
        // Add eventlistener for visualisation changes
        checkElem.addEventListener('change', () => {
            legenddata[attribute].visualise = checkElem.checked;
            this.renderFormatedDataElements();
        })

        if (this.options.onLegendEntryClick !== null) {
            titleElem.addEventListener('click', this.options.onLegendEntryClick);
        }

        // Accordion content
        const addButton = attributeElem.querySelector('.swac_datadescription_addbutton');
        const acordCont = attributeElem.querySelector('.swac_datadescription_attribution');
        if (legenddata[attribute].calcmode === 'gradient') {
            const wrapper = document.createElement('div');
            wrapper.style = 'display: flex;';

            const gradientWrapper = document.createElement('div');
            const gradientElement = this.newGradientElement(legenddata, attribute);
            gradientWrapper.appendChild(gradientElement);
            document.addEventListener('swac_Datadescription_' + requestor.id + '_changed', () => {
                gradientWrapper.innerHTML = '';
                const gradientElement = this.newGradientElement(legenddata, attribute);
                gradientWrapper.appendChild(gradientElement);
            });

            // values
            const valueWrapper = document.createElement('div');
            valueWrapper.style.marginLeft = '50px';
            for (var i in legenddata[attribute].values) {
                const option = legenddata[attribute].values[i];
                option.col = Colorcalculations.stringToHex(option.col);
                const valueElem = this.newValueElement(legenddata, attribute, i, option.col, option.txt);
                valueWrapper.appendChild(valueElem);
            }
            addButton.addEventListener('click', () => {
                const valueElem = this.newValueElement(legenddata, attribute, '', '#FFFFFF', '');
                valueWrapper.appendChild(valueElem);
            });

            wrapper.appendChild(gradientWrapper);
            wrapper.appendChild(valueWrapper);
            acordCont.appendChild(wrapper);
        } else {
            // Add legend for color meanings
            for (var i in legenddata[attribute].values) {
                const option = legenddata[attribute].values[i];
                option.col = Colorcalculations.stringToHex(option.col);
                const valueElem = this.newValueElement(legenddata, attribute, i, option.col, option.txt);
                acordCont.appendChild(valueElem);
            }
            addButton.addEventListener('click', () => {
                const valueElem = this.newValueElement(legenddata, attribute, '', '#FFFFFF', '');
                acordCont.appendChild(valueElem);
            });
        }
        attributeTemplate.parentNode.appendChild(attributeElem);
        this.formatAll();
    }

    newGradientElement(legenddata, attribute) {
        const gradientElement = document.createElement('div');
        const canvas = document.createElement('canvas');
        canvas.id = "CursorLayer";
        canvas.width = 25;
        canvas.height = 100;
        canvas.style.border = "1px solid";

        let ctx = canvas.getContext("2d");
        // Create gradient
        var grd = ctx.createLinearGradient(0, 100, 0, 0);

        // Get min and max values
        let minVal = null;
        let maxVal = null;
        for (var i in legenddata[attribute].values) {
            let iNum = new Number(i);
            if (minVal === null || iNum < minVal)
                minVal = iNum;
            if (maxVal === null || iNum > maxVal)
                maxVal = iNum;
        }

        for (var i in legenddata[attribute].values) {
            let option = legenddata[attribute].values[i];
            let iNum = new Number(i);
            grd.addColorStop((iNum - minVal) / (maxVal - minVal), option.col);
        }

        // Fill with gradient
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, 100, 250);
        let highElem = document.createElement('div');
        highElem.innerHTML = maxVal;
        gradientElement.appendChild(highElem);
        gradientElement.appendChild(canvas);
        let lowElem = document.createElement('div');
        lowElem.innerHTML = minVal;
        gradientElement.appendChild(lowElem);
        return gradientElement;
    }

    /**
     *  Create new Option Element for an attribute in the legend 
     * @param {Object} legenddata data
     * @param {String} attribute attribute name
     * @param {Number} i index of a attribtue value
     * @param {String} col color of a value
     * @param {String} txt text of a value
     * @returns 
     */
    newValueElement(legenddata, attribute, i, col, txt) {
        const requestor = this.requestor;
        // Add not existing values to data
        if (!legenddata[attribute].values[i]) {
            legenddata[attribute].values[i] = {
                col: col,
                txt: txt
            };
        }

        // valueColor
        const valueElem = document.createElement('div');
        valueElem.style.display = 'flex';
        valueElem.style.marginBottom = '10px';
        const colorBtn = document.createElement('input');
        colorBtn.classList.add('swac_datadescription_value_col');
        colorBtn.type = 'color';
        colorBtn.value = col;
        colorBtn.style.setProperty('--color', colorBtn.value);
        valueElem.appendChild(colorBtn);

        // predefined colors
        if (this.options.predefinedColors) {
            colorBtn.setAttribute('list', 'predefinedColors');
            const predefinedColorsElem = document.createElement('datalist');
            predefinedColorsElem.id = 'predefinedColors';
            for (let color of this.options.predefinedColors) {
                const option = document.createElement('option');
                option.innerHTML = color.toLowerCase();
                predefinedColorsElem.appendChild(option);
            }
            valueElem.appendChild(predefinedColorsElem);
        }

        // valueTxt
        const valueTxt = document.createElement('input');
        valueTxt.classList.add('input_nostyle')
        valueTxt.classList.add('swac_datadescription_value_txt')
        valueTxt.setAttribute('value', txt);
        valueTxt.setAttribute('swac_langattr','value:'+txt);
        valueTxt.style.marginLeft = '10px';
        valueTxt.placeholder = 'Datadescription.valueTxtPlaceholder';
        valueTxt.style.width = valueTxt.value.length > 0 ? valueTxt.value.length + 'ch' : valueTxt.placeholder.length + 'ch';
        valueElem.appendChild(valueTxt);

        // value data
        const valueData = document.createElement('input');
        valueData.value = i;
        valueData.classList.add('input_nostyle');
        valueData.classList.add('swac_datadescription_value_value');
        valueData.placeholder = 'Datadescription.valuePlaceholder';
        valueData.style.width = valueData.value.length > 0 ? valueData.value.length + 'ch' : valueData.placeholder.length + 'ch';
        valueData.style.display = 'none';
        valueElem.appendChild(valueData);

        // Remove button
        const removeBtn = document.createElement('span');
        removeBtn.setAttribute('uk-icon', 'icon: trash; ratio: 1');
        removeBtn.classList.add('swac_datadescription_removebutton');
        valueElem.appendChild(removeBtn);


        // Event Listeners
        removeBtn.addEventListener('click', () => {
            valueElem.remove();
            delete legenddata[attribute].values[valueData.value];
            this.renderFormatedDataElements();
        })

        valueElem.addEventListener('mouseover', () => {
            removeBtn.style.display = 'block';
            valueData.style.display = 'block';
        });
        valueElem.addEventListener('mouseleave', () => {
            removeBtn.style.display = 'none';
            valueData.style.display = 'none';
        });

        colorBtn.addEventListener('input', (e) => {
            colorBtn.style.setProperty('--color', colorBtn.value);
            if (this.options.predefinedColors) {
                // fire event only for the selected visuAttribute
                legenddata[attribute].values[valueData.value].col = colorBtn.value;
                this.renderFormatedDataElements();
            }
        });
        colorBtn.addEventListener('focusout', () => {
            if (!this.options.predefinedColors) {
                legenddata[attribute].values[valueData.value].col = colorBtn.value;
                this.renderFormatedDataElements();
            }
        });

        valueTxt.addEventListener('input', () => {
            if (valueTxt.value.length < 1) {
                valueTxt.style.width = valueTxt.placeholder.length + 'ch';
                return;
            }
            valueTxt.style.width = valueTxt.value.length + 'ch';
        })
        valueTxt.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                valueTxt.blur();
            }
        });
        valueTxt.addEventListener('focusout', () => {
            legenddata[attribute].values[valueData.value].txt = valueTxt.value;
        });
        valueData.addEventListener('input', () => {
            if (valueData.value.length < 1) {
                valueData.style.width = valueData.placeholder.length + 'ch';
                return;
            }
            valueData.style.width = valueData.value.length + 'ch';
        });
        valueData.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                valueData.blur();
            }
        });
        let valueDataOld = valueData.value;
        valueData.addEventListener('focusin', () => {
            valueDataOld = valueData.value;
        });
        valueData.addEventListener('focusout', () => {
            if (valueData.value === valueDataOld) {
                return;
            }
            if (legenddata[attribute].values[valueData.value]) {
                UIkit.notification({
                    message: SWAC.lang.dict.Datadescription.valueexists + " (" + valueData.value + ")",
                    status: 'info',
                    timeout: SWAC.config.notifyDuration,
                    pos: 'top-center'
                });
                valueData.value = valueDataOld;
                return;
            }
            legenddata[attribute].values[valueData.value] = {
                col: colorBtn.value,
                txt: valueTxt.value
            };
            delete legenddata[attribute].values[valueDataOld];
            this.renderFormatedDataElements();
        });

        return valueElem;
    }

    formatAll() {
        Msg.flow('Datadescription', 'formatAll()', this.requestor);
        let thisRef = this;
        // Find requestors on page and wait for them to load, than format
        let requestors = document.querySelectorAll('[swa]');
        for (let curRequestor of requestors) {
            // Direclty format if possible
            thisRef.formatDataElement(curRequestor);
        }
    }

    /**
     * Format all contents of an element by the datadescription.
     * This searches for elements with the class swac_attrname (that is automaticaly
     * added by the bind) and formats the containers with border color (for attribute
     * color) and background color (for value color)
     * @param {DOMElement} element Element which contents should be formated
     * @returns {undefined}
     */
    formatDataElement(element) {
        Msg.flow('Datadescription', 'formatDataElement(' + element.id + ')', this.requestor);
        // store formated elements
        let elementInStorage = false;
        for (let curElem of this.formatedDataElements) {
            if (curElem.id === element.id) {
                elementInStorage = true;
                break;
            }
            ;
        }
        if (!elementInStorage) {
            this.formatedDataElements.push(element);
        }
        let legenddata = this.data[this.options.activeSource].getSet(this.options.activeSet);
        for (var attribute in legenddata) {
            // Exclude swac internal attributes
            if (attribute.startsWith('swac_'))
                continue;
            // Check if attribute should be visualised
            if (typeof legenddata[attribute] === 'object') {
                // Select all alements for attribute
                let elemsForAttr = element.querySelectorAll('[swac_attrname=' + attribute + ']');

                // Walk trough every element
                for (let curElemForAttr of elemsForAttr) {
                    // Exclude attr elements
                    if (curElemForAttr.classList.contains('swac_repeatedForAttribute')) {
                        continue;
                    }
                    // Remove old visualisations
                    curElemForAttr.style.border = 'none';
                    curElemForAttr.style.backgroundColor = 'transparent';
                    curElemForAttr.style.color = 'inherit';
                    // If attribute should be visualised
                    if (legenddata[attribute].visualise) {
                        let attrCol = this.getAttributeColor(attribute);
                        // Add bordercolor for attribute
                        if (attrCol !== '#808080') {
                            curElemForAttr.style.border = '1px solid ' + attrCol;
                        }
                    }
                }
            }
        }
    }

    renderFormatedDataElements() {
        for (let curElem of this.formatedDataElements) {
            this.formatDataElement(curElem);
        }
        document.dispatchEvent(new CustomEvent('swac_Datadescription_' + this.requestor.id + '_changed', {
        }));
    }

    getAttributeMinValue(visuAttribute = null) {
        if (visuAttribute === null
                && typeof this.options.visuAttribute !== 'undefined') {
            visuAttribute = this.options.visuAttribute;
        }
        let legenddata = this.data[this.options.activeSource].getSet(this.options.activeSet);
        if (typeof legenddata[visuAttribute] !== 'undefined'
                && typeof legenddata[visuAttribute].minValue !== 'undefined') {
            Msg.warn('datadescription', 'Get minValue for attribute name >' + visuAttribute + '<');
            return legenddata[visuAttribute].minValue;
        } else {
            Msg.warn('Datadescription', 'Could not get minValue for attribute >' + visuAttribute + '<');
            return null;
    }
    }

    getAttributeMaxValue(visuAttribute = null) {
        if (visuAttribute === null
                && typeof this.options.visuAttribute !== 'undefined') {
            visuAttribute = this.options.visuAttribute;
        }
        let legenddata = this.data[this.options.activeSource].getSet(this.options.activeSet);

        if (typeof legenddata[visuAttribute] !== 'undefined'
                && typeof legenddata[visuAttribute].maxValue !== 'undefined') {
            Msg.warn('datadescription', 'Get maxValue for attribute name >' + visuAttribute + '<');
            return legenddata[visuAttribute].maxValue;
        } else {
            Msg.warn('Datadescription', 'Could not get maxValue for attribute >' + visuAttribute + '<');
            return null;
    }
    }

    /**
     * Gets the description definition for the minimum value
     *  
     * @param {String} visuAttribute
     * @returns {Datadescription.getMinDefinition.block-27901.block-28300.sortedDefs|Array}
     */
    getMinDefinition(visuAttribute = this.options.visuAttribute) {
        if (visuAttribute === null
                && typeof this.options.visuAttribute !== 'undefined') {
            visuAttribute = this.options.visuAttribute;
        }
        let legenddata = this.data[this.options.activeSource].getSet(this.options.activeSet);
        if (typeof legenddata[visuAttribute] !== 'undefined'
                && typeof legenddata[visuAttribute].values !== 'undefined') {
            Msg.warn('datadescription', 'Get minimum description definition of attribute name >' + visuAttribute + '<');
            let defValues = [];
            for (let curAttr in legenddata[visuAttribute].values) {
                defValues.push(curAttr);
            }
            // Sort values
            let sortedDefs = defValues.sort();
            let lastDef = sortedDefs[0];

            return legenddata[visuAttribute].values[lastDef];
        } else {
            Msg.warn('Datadescription',
                    'Could not get minimum defined value for attribute >'
                    + visuAttribute + '< because there a no values defined.');
            return null;
    }
    }

    getMaxDefinition(visuAttribute = null) {
        if (visuAttribute === null
                && typeof this.options.visuAttribute !== 'undefined') {
            visuAttribute = this.options.visuAttribute;
        }
        let legenddata = this.data[this.options.activeSource].getSet(this.options.activeSet);
        if (typeof legenddata[visuAttribute] !== 'undefined'
                && typeof legenddata[visuAttribute].values !== 'undefined') {
            Msg.warn('datadescription', 'Get maximum description definition of attribute name >' + visuAttribute + '<');
            let defValues = [];
            for (let curAttr in legenddata[visuAttribute].values) {
                defValues.push(curAttr);
            }
            // Sort values
            let sortedDefs = defValues.sort();
            let lastDef = sortedDefs[sortedDefs.length - 1];

            return legenddata[visuAttribute].values[lastDef];
        } else {
            Msg.warn('Datadescription',
                    'Could not get minimum defined value for attribute >'
                    + visuAttribute + '< because there a no values defined.');
            return null;
    }
    }

    /**
     * Gets an array of definitions with all given attributes
     * 
     * @param {String} visuAttribute Attribute which definitions should be get
     * @returns {Object[]} Array of definitions
     */
    getDefinitions(visuAttribute = null) {
        if (visuAttribute === null
                && typeof this.options.visuAttribute !== 'undefined') {
            visuAttribute = this.options.visuAttribute;
        }
        let legenddata = this.data[this.options.activeSource].getSet(this.options.activeSet);
        if (typeof legenddata[visuAttribute] !== 'undefined'
                && typeof legenddata[visuAttribute].values !== 'undefined') {

            let definitions = [];

            for (let curDefValue in legenddata[visuAttribute].values) {
                definitions.push(legenddata[visuAttribute].values[curDefValue]);
                // Add value
                definitions[definitions.length - 1].value = curDefValue;
            }

            for (let i = 0; i < definitions.length; i++) {
                let curDef = definitions[i];
                // Get calculation mode
                let calcMode = legenddata[visuAttribute].calcmode;
                if (!calcMode || calcMode === '=') {
                    curDef.minValue = Number(curDef.value);
                    curDef.maxValue = Number(curDef.value);
                } else if (calcMode === '<') {
                    let prvDef = definitions[i - 1];
                    if (prvDef) {
                        curDef.minValue = prvDef.value;
                    } else if (legenddata[visuAttribute].minValue
                            && legenddata[visuAttribute].minValue < Number(curDef.value)) {
                        curDef.minValue = legenddata[visuAttribute].minValue;
                    } else {
                        curDef.minValue = 0;
                    }
                    curDef.maxValue = Number(curDef.value);
                } else if (calcMode === '>') {
                    curDef.minValue = Number(curDef.value);
                    let nxtDef = definitions[i + 1];
                    if (nxtDef) {
                        curDef.maxValue = nxtDef.value;
                    } else if (legenddata[visuAttribute].maxValue
                            && legenddata[visuAttribute].maxValue > Number(curDef.value)) {
                        curDef.maxValue = legenddata[visuAttribute].maxValue;
                    } else {
                        curDef.maxValue = 100;
                    }
                } else {
                    Msg.warn('Datadescription', 'Calculation mode >' + visuAttribute + '.calcmode = "' + calcMode + '< is not supported.');
                }
            }
            return definitions;
    }
    }

    /**
     * Converts a hex color into its rgb
     * 
     * @param {Hexcode} hex Hex color value
     * @returns {Object} Object with r,g,b values
     */
    hexToRgb(hex) {
        if (!hex.startsWith('#'))
            Msg.error('Datadescription', 'Given color value >' + hex + '< is not in hex. This mode only supports hex values', this.requestor);
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }
}