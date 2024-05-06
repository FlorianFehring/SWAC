import SWAC from '../../../swac.js';
import Msg from '../../../Msg.js';

/**
 * Creates icons for values
 */
export default class Iconized extends Diagram {

    constructor(value, unit, name, width, height, datadescription, diagramDef, comp) {
        super(value, unit, name, width, height, datadescription, diagramDef, comp);
    }

    /**
     * Draws the diagram for a value
     * 
     * @param {String} name Name of the value
     * @param {Object} value The value that should be displayed
     * @returns {DOMNode} A node containing the diagram (maybe svg, img,...)
     */
    drawValueDiagram(name, value) {
        Msg.error('Iconized', 'The Iconized Diagram does not support single values.');
    }

    /**
     * Draw icons for dataset values
     * 
     * @param {Object} set The set a diagram should be created for
     * @returns {Element|Iconized.drawDiagram.svgViewBox} svg viewbox with the diagram
     */
    drawSetDiagram(set) {
        // Get icon definitions
        let icons = this.diagramDef.icons;

        // Go trough definitions and find matching
        let bestMatching = {
            curIcon: null,
            matchPoints: 0,
            usedVars: []
        };
        for (let curIcon of icons) {
            let allConditions = 0;
            let matchingConds = 0;
            let usedVars = [];
            // Check rules
            if (curIcon.conditions) {
                allConditions = curIcon.conditions.length;
                for (let curRule of curIcon.conditions) {
                    let parts = curRule.split(' ');
                    if(!usedVars.includes(parts[0]))
                        usedVars.push(parts[0]);
                    if (set[parts[0]]) {
                        let value = set[parts[0]];
                        // Swtich test method
                        switch (parts[1]) {
                            case '=':
                                if (value == parts[2]) {
                                    matchingConds++;
                                }
                                break;
                            case '<':
                                if (value < parts[2]) {
                                    matchingConds++;
                                }
                                break;
                            case '>':
                                if (value > parts[2]) {
                                    matchingConds++;
                                }
                                break;
                            case '<=':
                                if (value <= parts[2]) {
                                    matchingConds++;
                                }
                                break;
                            case '>=':
                                if (value >= parts[2]) {
                                    matchingConds++;
                                }
                                break;
                            default:
                                Msg.warn('Iconized', 'There is no test method for >' + parts[1] + '<');
                        }
                    }
                }
            }
            // Check if rule was fullfilled
            if (matchingConds === allConditions
                    && matchingConds >= bestMatching.matchPoints) {
                bestMatching.matchPoints = matchingConds;
                bestMatching.curIcon = curIcon;
                bestMatching.usedVars = usedVars;
            }
        }

        let iconPath;
        // Check if icon was found
        if (!bestMatching.curIcon) {
            iconPath = '/SWAC/swac/components/Icon/imgs/unknown.svg';
            Msg.warn('Iconized', 'Found no icon for set >' + set.id + '<');
        } else {
            iconPath = bestMatching.curIcon.path;
        }
        let lastSlashPos = iconPath.lastIndexOf('/');
        let path = iconPath.substring(0, lastSlashPos + 1);
        if (!this.comp.options.attributions.has(path)) {
            this.comp.options.attributions.set(path,[]);
        }
        this.comp.options.attributions.get(path).push(iconPath);
        
        let iconElem = document.createElement('img');
        iconElem.setAttribute('src', iconPath);
        iconElem.setAttribute('alt', 'place');
        iconElem.setAttribute('height', 100);
        iconElem.setAttribute('width', 100);

        this.bestMatching = bestMatching;
        return iconElem;
    }

    getAffectedAttributes() {
        return this.bestMatching.usedVars;
    }
}