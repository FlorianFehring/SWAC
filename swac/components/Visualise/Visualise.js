import SWAC from '../../swac.js';
import View from '../../View.js';
import Msg from '../../Msg.js';

export default class Visualise extends View {

    constructor(options = {}) {
        super(options);
        this.name = 'Visualise';
        this.desc.text = "This components visualises the data given. It uses thermometer, hydrometer, circlevalue or icon representation. This component is not finished yet.";
        this.desc.developers = 'Florian Fehring (HSBI), Jonas Ahrend, Stephan Dresselmann';
        this.desc.license = 'GNU Lesser General Public License';

        this.desc.depends[0] = {
            name: 'Diagram.js',
            path: SWAC.config.swac_root + 'components/Visualise/Diagram.js',
            desc: 'Class representing diagrams'
        };
        this.desc.depends[1] = {
            name: 'DiagramRange.js',
            path: SWAC.config.swac_root + 'components/Visualise/DiagramRange.js',
            desc: 'Class representing diagrams ranges'
        };
        this.desc.depends[2] = {
            name: 'ColorRange.js',
            path: SWAC.config.swac_root + 'components/Visualise/ColorRange.js',
            desc: 'Class representing color ranges'
        };

        this.desc.optPerSet[0] = {
            name: 'ts',
            desc: 'Timestamp information',
            type: 'Datetime'
        };

        this.desc.templates[0] = {
            name: 'visualise',
            style: 'visualise',
            desc: 'Shows a visualisation of the data.'
        };
        this.desc.templates[1] = {
            name: 'visualise_without_state',
            style: 'visualise',
            desc: 'Shows a visualisation of the data without state information.'
        };
        this.desc.templates[2] = {
            name: 'visualise_without_datatxt',
            style: 'visualise',
            desc: 'Shows a visualisation of the data without text info.'
        };

        this.desc.optPerTpl[0] = {
            selc: '.swac_visualise_diagram_set',
            desc: 'Element where to place diagram for set visualisations in'
        };
        this.desc.optPerTpl[1] = {
            selc: '.swac_visualise_diagram_attr',
            desc: 'Element where to place the diagram for attributes in'
        };
        this.desc.optPerTpl[2] = {
            selc: '.swac_visualise_legend_set',
            desc: 'Element where the legend of the diagram for set is defined'
        };
        this.desc.optPerTpl[3] = {
            selc: '.swac_visualise_legend_attr',
            desc: 'Element where the legend of the diagram for attr is defined'
        };
        this.desc.optPerTpl[4] = {
            selc: '.swac_visualise_attributions',
            desc: 'Element where attributions should be placed'
        };
        this.desc.optPerTpl[5] = {
            selc: '.swac_visualise_ts',
            desc: 'Element where the timestamp of the data is displayed.'
        };
        this.desc.optPerTpl[6] = {
            selc: '.swac_visualise_repeatForAttr',
            desc: '(deprecated) Element repeated for every attribute of an dataset'
        }
        this.desc.optPerTpl[7] = {
            selc: '.swac_visualise_legend_name',
            desc: '(deprecated) Element where to insert the name of an attribute.'
        }
        this.desc.optPerTpl[8] = {
            selc: '.swac_visualise_legend_value',
            desc: '(deprecated) Element where to insert the value of an attribute.'
        }
        this.desc.optPerPage[0] = {
            selc: '.swac_visualise_attributions',
            desc: 'Element where attributions should be placed'
        };

        this.desc.opts[0] = {
            name: 'visus',
            desc: 'Array of visualisation definitions with "attr", "type" and "datadescription" attributes. '
                    + 'Available diagram types: Thermometer, Hygrometer, CircleValue, Iconized. '
                    + 'CircleValue displays a single value centered in a colored circle, '
                    + 'where the background color is determined by the matching legend/definition range.',
            example: [
                {
                    attr: 'temp',
                    type: 'Thermometer',
                    datadescription: '#visualise_legend'
                },
                {
                    attr: 'humidity',
                    type: 'Hygrometer',
                    datadescription: '#visualise_legend'
                },
                {
                    attr: 'humidity',
                    type: 'CircleValue',
                    datadescription: '#visualise_legend'
                }
            ]
        };
        if (!options.visus)
            this.options.visus = [];

        this.desc.opts[1] = {
            name: 'attributions',
            desc: 'Attributions to show'
        };
        if (!options.attributions)
            this.options.attributions = new Map();

        this.desc.opts[2] = {
            name: 'showAttributions',
            desc: 'Can be set to false to hide attributions'
        };
        if (typeof options.showAttributions === 'undefined')
            this.options.showAttributions = true;

        this.desc.opts[3] = {
            name: 'dataUnits',
            desc: 'Units for attributes. Diagram implementations can use them and add them to the value display.',
            example: {
                voltage: 'V',
                power: 'W'
            }
        };
        if (!options.dataUnits)
            this.options.dataUnits = null;

        this.desc.opts[4] = {
            name: 'autoVisus',
            desc: 'Automatically creates visualisations for numeric attributes. Optional resolvers can define diagram types and ranges for project specific attributes.',
            example: {
                mode: 'automatic',
                attributeFilter: function (attr, set) {
                    return attr !== 'id';
                },
                definitionResolver: function (attr, set, type) {
                    return {unit: '', type: type};
                }
            }
        };
        if (!options.autoVisus)
            this.options.autoVisus = null;
    }

    init() {
        return new Promise((resolve, reject) => {
            resolve();
        });
    }

    afterAddSet(set, repeateds) {
        Msg.flow('Visualise', 'afterAddSet() called for set ' + set.swac_fromName + '[' + set.id + ']', this.requestor);
        let repeatedForSets = this.requestor.querySelectorAll('.swac_repeatedForSet[swac_fromname="' + set.swac_fromName + '"][swac_setid="' + set.id + '"]');
        let visus = this.getVisus(set);
        let foundVisus = 0;
        // For every repeatableArea
        for (let curRepeatedElem of repeatedForSets) {
            // Get areas for values
            let forSetDefs = new Map();
            for (let curValueArea of curRepeatedElem.querySelectorAll('.swac_repeatedForValue')) {
                // Get the displayed attribute
                let attr = curValueArea.getAttribute('swac_attrname');
                // Search diagram definition
                let def = null;
                for (let curDef of visus) {
                    if (curDef.attr === attr) {
                        def = curDef;
                    } else if (curDef.attr === '*') {
                        forSetDefs.set(curDef, '1');
                    }
                }
                // Check if there is a diagram defined for that attribute
                if (def) {
                    // Add list entry functions
                    this.createDiagram(set.swac_fromName, set, def, curValueArea);
                    foundVisus++;
                } else {
                    // Remove display because there is no visualisation defined
                    curValueArea.parentNode.removeChild(curValueArea);
                }
            }
            // Work on forSetDefs
            for (let curSetDef of forSetDefs.keys()) {
                this.createDiagram(set.swac_fromName, set, curSetDef, curRepeatedElem);
                foundVisus++;
            }
            // Check if there is a set visualisation
            if (foundVisus === 0) {
                Msg.warn('Visualise', 'There is no visualisation for set >' + set.swac_fromName + '[' + set.id + ']<', this.requestor);
            }
        }
    }

    /**
     * Gets configured and automatically detected visualisations for a set.
     *
     * @param {WatchableSet} set Dataset to analyse
     * @returns {Object[]} Diagram definitions
     */
    getVisus(set) {
        let visus = this.options.visus.slice();
        let autoOpts = this.options.autoVisus;
        if (!autoOpts || autoOpts.mode === 'chart')
            return visus;

        for (let curAttr in set) {
            if (!this.isAutomaticAttribute(curAttr, set, autoOpts))
                continue;
            if (visus.some(curDef => curDef.attr === curAttr))
                continue;

            let type = this.getAutomaticType(curAttr, set, autoOpts);
            let def = this.getAutomaticDefinition(curAttr, set, type, autoOpts);
            if (def)
                visus.push(def);
        }
        return visus;
    }

    /**
     * Checks whether an attribute can be shown as an automatic diagram.
     *
     * @param {String} attr Attribute name
     * @param {WatchableSet} set Dataset to analyse
     * @param {Object} autoOpts Automatic visualisation options
     * @returns {Boolean} True when the attribute is numeric and allowed
     */
    isAutomaticAttribute(attr, set, autoOpts) {
        if (attr.startsWith('swac_') || attr === 'id')
            return false;
        if (autoOpts.excludeAttrs && autoOpts.excludeAttrs.includes(attr))
            return false;
        if (!this.isNumericValue(set[attr]))
            return false;
        if (autoOpts.attributeFilter)
            return autoOpts.attributeFilter(attr, set) === true;
        return true;
    }

    /**
     * Checks whether a value can be represented by a number diagram.
     *
     * @param {*} value Value to check
     * @returns {Boolean} True when the value is numeric
     */
    isNumericValue(value) {
        if (typeof value === 'number')
            return isFinite(value);
        if (typeof value !== 'string' || value.trim() === '')
            return false;
        return !isNaN(Number(value)) && isFinite(Number(value));
    }

    /**
     * Resolves the diagram type from an attribute name.
     *
     * @param {String} attr Attribute name
     * @param {WatchableSet} set Dataset to analyse
     * @param {Object} autoOpts Automatic visualisation options
     * @returns {String} Diagram type
     */
    getAutomaticType(attr, set, autoOpts) {
        if (autoOpts.mode && autoOpts.mode !== 'automatic')
            return this.getModeDiagramType(autoOpts.mode);

        if (autoOpts.typeResolver) {
            let resolvedType = autoOpts.typeResolver(attr, set, autoOpts.mode);
            if (resolvedType)
                return resolvedType;
        }

        let attrName = attr.toLowerCase();
        if (/(temp|temperature)/.test(attrName))
            return 'Thermometer';
        if (/(humid|humidity|feuchte)/.test(attrName))
            return 'Hygrometer';
        if (/(percent|percentage|battery|charge)/.test(attrName))
            return 'CircleProgress';
        return 'CircleValue';
    }

    /**
     * Maps a selected display mode to a diagram type.
     *
     * @param {String} mode Selected display mode
     * @returns {String} Diagram type
     */
    getModeDiagramType(mode) {
        let types = {
            circle: 'CircleValue',
            thermometer: 'Thermometer',
            hygrometer: 'Hygrometer',
            progress: 'CircleProgress'
        };
        return types[mode] || 'CircleValue';
    }

    /**
     * Creates a diagram definition for a detected numeric attribute.
     *
     * @param {String} attr Attribute name
     * @param {WatchableSet} set Dataset to analyse
     * @param {String} type Diagram type
     * @param {Object} autoOpts Automatic visualisation options
     * @returns {Object|null} Diagram definition
     */
    getAutomaticDefinition(attr, set, type, autoOpts) {
        let def = {
            attr: attr,
            type: type,
            name: attr,
            width: 180,
            height: 180,
            range: this.getDefaultRange(type, set[attr])
        };
        if (autoOpts.definitionResolver) {
            let resolvedDef = autoOpts.definitionResolver(attr, set, type);
            if (resolvedDef === null)
                return null;
            if (resolvedDef)
                Object.assign(def, resolvedDef);
        }
        return def;
    }

    /**
     * Gets a neutral range for automatic diagrams without project settings.
     *
     * @param {String} type Diagram type
     * @param {*} value Current value
     * @returns {Object} Range definition
     */
    getDefaultRange(type, value) {
        if (type === 'Thermometer') {
            return {
                minValue: -20,
                maxValue: 50,
                values: [
                    {maxValue: 10, col: '#56B4E9'},
                    {maxValue: 30, col: '#009E73'},
                    {maxValue: 50, col: '#D55E00'}
                ]
            };
        }
        if (type === 'Hygrometer' || type === 'CircleProgress') {
            return {
                minValue: 0,
                maxValue: 100,
                values: [
                    {maxValue: 33, col: '#56B4E9'},
                    {maxValue: 66, col: '#009E73'},
                    {maxValue: 100, col: '#E69F00'}
                ]
            };
        }
        let maxValue = Math.max(10, Math.abs(Number(value)) * 2);
        return {
            minValue: Math.min(0, Number(value)),
            maxValue: maxValue,
            values: [{maxValue: maxValue, col: '#56B4E9'}]
        };
    }

    /**
     * Creates a diagram for a single value.
     * The diagram type is resolved dynamically from the diagrams/ folder,
     * so any type placed there (e.g. CircleValue.js) is available automatically.
     * 
     * @param {String} fromName         Name of the datasource
     * @param {Object} set              Dataset object
     * @param {Object} diagramdef       Diagram options
     * @param {DOMElement} valueArea    Element where the diagram should be placed
     * @returns {undefined}
     */
    createDiagram(fromName, set, diagramdef, valueArea) {
        let thisRef = this;
        // Dynamically import the diagram class by type name (e.g. 'CircleValue' → CircleValue.js)
        import('./diagrams/' + diagramdef.type + '.js?vers=' + SWAC.desc.version).then(function (module) {

            let datadescription = null;
            if (diagramdef.datadescription) {
                let ddElem = document.querySelector(diagramdef.datadescription);
                if (!ddElem) {
                    Msg.error('Visualise', 'Legend >' + diagramdef.datadescription + '< was not found.', thisRef.requestor);
                    return;
                } else {
                    window.swac.reactions.addReaction(function () {
                        datadescription = ddElem.swac_comp;
                        thisRef.calculateDiagram(set, diagramdef, valueArea, module, datadescription)
                    }, ddElem.id);
                }
            } else {
                thisRef.calculateDiagram(set, diagramdef, valueArea, module, datadescription)
            }
        }).catch(function (err) {
            Msg.error('Visualise', 'Error creating diagram >' + diagramdef.type + '<: ' + err, thisRef.requestor);
            return;
        });
    }

    calculateDiagram(set, diagramdef, valueArea, module, datadescription) {
        let thisRef = this;

        if (!datadescription && diagramdef.range)
            datadescription = new VisualiseRange(diagramdef.range);

        let diagramClass = module.default;
        // Get attribute name
        let attr = diagramdef.attr;
        let value = set[attr];
        let unit = diagramdef.unit;
        if (!unit)
            unit = '';
        let name = diagramdef.name;
        if (!name)
            name = attr;
        let width = diagramdef.width;
        if (!width)
            width = window.innerHeight / 2;
        let height = diagramdef.height;
        if (!height)
            height = window.innerHeight / 2;

        let diagram;
        let diagramElem;
        if (diagramdef.attr === '*') {
            diagram = new diagramClass(unit, name, width, height, datadescription, diagramdef, thisRef);
            diagramElem = diagram.drawSetDiagram(set);
            let vdsetElem = valueArea.querySelector('.swac_visualise_diagram_set');
            if (vdsetElem) {
                vdsetElem.appendChild(diagramElem);
            }
            let legsetElem = valueArea.querySelector('.swac_visualise_legend_set');
            if (legsetElem) {
                let legTplElem = legsetElem.querySelector('.swac_visualise_repeatForAttr');
                if (legTplElem) {
                    for (let curAttr of diagram.getAffectedAttributes()) {
                        let curLeg = legTplElem.cloneNode(true);
                        curLeg.classList.remove('swac_dontdisplay');
                        let nameElem = curLeg.querySelector('.swac_visualise_legend_name');
                        nameElem.innerHTML = curAttr;
                        nameElem.setAttribute('swac_lang', curAttr);
                        curLeg.querySelector('.swac_visualise_legend_value').innerHTML = set[curAttr];
                        legTplElem.parentNode.appendChild(curLeg);
                    }
                }
            }
            // Update translation if present
            let transElem = document.querySelector('[swa^="Translator"]');
            if (transElem) {
                transElem.swac_comp.translate();
            }
        } else {
            // Creates the diagram using the resolved diagram class (e.g. CircleValue)
            diagram = new diagramClass(unit, name, width, height, datadescription, diagramdef, thisRef);
            diagramElem = diagram.drawValueDiagram(name, value);
            let vdattrElem = valueArea.querySelector('.swac_visualise_diagram_attr');
            if (vdattrElem) {
                vdattrElem.appendChild(diagramElem);
            }
        }
        thisRef.createAttribution();
    }

    /**
     * Creates the output for the attributions
     */
    createAttribution() {
        if (!this.options.showAttributions)
            return;

        // Get element where to place attributions
        let attrElem = this.requestor.querySelector('.swac_visualise_attributions');
        // If there is no element at requestor search on whole page
        if (!attrElem) {
            attrElem = document.querySelector('.swac_visualise_attributions');
        }
        for (let [curAttribution, curFiles] of this.options.attributions) {
            let attrId = curAttribution.replaceAll('.', '').replaceAll('/', '_');
            // Check if attribution element exists
            let curAttrElem = attrElem.querySelector('.' + attrId);
            if (!curAttrElem) {
                curAttrElem = document.createElement('div');
                curAttrElem.classList.add(attrId);
                attrElem.appendChild(curAttrElem);
                fetch(curAttribution + 'attribution.txt').then(function (res) {
                    res.text().then(function (txt) {
                        curAttrElem.innerHTML = txt;
                    });
                }).catch(function (err) {
                    Msg.error('Iconized', 'Could not load attribution file.');
                });
            }
        }
    }
}

/**
 * Provides range data to diagrams without a Datadescription component.
 */
class VisualiseRange {
    constructor(range) {
        this.range = range;
        this.definitions = this.createDefinitions(range);
    }

    createDefinitions(range) {
        let minValue = Number(range.minValue);
        let values = range.values || [];
        let definitions = [];
        for (let curValue of values) {
            let maxValue = Number(curValue.maxValue);
            definitions.push({
                minValue: typeof curValue.minValue === 'number' ? curValue.minValue : minValue,
                maxValue: maxValue,
                col: curValue.col || '#7B7B7B',
                txt: curValue.txt || ''
            });
            minValue = maxValue;
        }
        if (definitions.length === 0) {
            definitions.push({
                minValue: Number(range.minValue),
                maxValue: Number(range.maxValue),
                col: '#7B7B7B',
                txt: ''
            });
        }
        return definitions;
    }

    getDefinitions() {
        return this.definitions;
    }

    getMinDefinition() {
        return this.definitions[0];
    }

    getMaxDefinition() {
        return this.definitions[this.definitions.length - 1];
    }

    getAttributeMinValue() {
        return Number(this.range.minValue);
    }

    getAttributeMaxValue() {
        return Number(this.range.maxValue);
    }

    getValuesVisdata(name, value, property) {
        for (let curDef of this.definitions) {
            if (value >= curDef.minValue && value <= curDef.maxValue)
                return curDef[property];
        }
        return this.getMaxDefinition()[property];
    }
}
