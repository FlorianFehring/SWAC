import SWAC from '../../swac.js';
import View from '../../View.js';
import Msg from '../../Msg.js';

export default class Visualise extends View {

    constructor(options = {}) {
        super(options);
        this.name = 'Visualise';
        this.desc.text = "This components visualises the data given. It uses thermometer, hydrometer or icon representation. This component is not finished yet.";
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
            desc: 'Array of visualisation definitions with "attr", "type" and "datadescription" attributes.',
            example: [
                {
                    attr: 'temp',
                    type: 'Thermometer',
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
    }

    init() {
        return new Promise((resolve, reject) => {
            resolve();
        });
    }

    afterAddSet(set, repeateds) {
        Msg.flow('Visualise', 'afterAddSet() called for set ' + set.swac_fromName + '[' + set.id + ']', this.requestor);
        let repeatedForSets = this.requestor.querySelectorAll('.swac_repeatedForSet[swac_fromname="' + set.swac_fromName + '"][swac_setid="' + set.id + '"]');
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
                for (let curDef of this.options.visus) {
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
     * Creates a diagram for a single value
     * 
     * @param {String} fromName         Name of the datasource
     * @param {Object} set              Dataset object
     * @param {Object} diagramdef       Diagram options
     * @param {DOMElement} valueArea    Element where the diagram should be placed
     * @returns {undefined}
     */
    createDiagram(fromName, set, diagramdef, valueArea) {
        let thisRef = this;
        // Search diagram class
        import('./diagrams/' + diagramdef.type + '.js?vers=' + SWAC.desc.version).then(function (module) {
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
            let datadescription = null;
            if (diagramdef.datadescription) {
                let ddElem = document.querySelector(diagramdef.datadescription);
                if (!ddElem) {
                    Msg.error('Visualise', 'Legend >' + diagramdef.datadescription + '< was not found.', thisRef.requestor);
                    return;
                }
                datadescription = ddElem.swac_comp;
            }

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
                //creates the diagram
                diagram = new diagramClass(unit, name, width, height, datadescription, diagramdef, thisRef);
                diagramElem = diagram.drawValueDiagram(name, value);
                let vdattrElem = valueArea.querySelector('.swac_visualise_diagram_attr');
                if (vdattrElem) {
                    vdattrElem.appendChild(diagramElem);
                }
            }
            thisRef.createAttribution();
        }).catch(function (err) {
            Msg.error('Visualise', 'Error createing diagram >' + diagramdef.type + '<: ' + err, thisRef.requestor);
            return;
        });
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