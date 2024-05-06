import SWAC from '../../../swac.js';
import Msg from '../../../Msg.js';

/**
 * Creates the CircleProgress visualisation
 */
export default class CircleProgress extends Diagram {
    constructor(unit, name, width, height, datadescription, diagramDef, comp) {
        super(unit, name, width, height, datadescription, diagramDef, comp);
        // Default style values
        this.circleX = 25;
        this.circleY = 115;
        this.circleR = 55;
    }

    /**
     * Draws the CircleProgress
     * 
     * @param {String} Diagrams label
     * @param {Object} value The value that should be displayed
     * @returns {Element|CircleProgress.drawDiagram.svgElement}
     */
    drawValueDiagram(name, value) {
        if (!this.datadescription) {
            Msg.error('CircleProgress', 'There is no datadescription defined.');
            return;
        }

        // Wrapper Div Element
        let wrapper = document.createElement('div');
        wrapper.style.position = 'relative';
        wrapper.style.display = 'flex';
        wrapper.style.justifyContent = 'center';
        wrapper.style.alignItems = 'center';

        // Svg Element	
        let svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svgElement.setAttribute("viewBox", "0 0 60 240");
        svgElement.setAttribute("width", this.width);
        svgElement.setAttribute("height", this.height);
        svgElement.style.position = 'relative';

        // Background Circle
        let backgroundCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        backgroundCircle.setAttribute("cx", this.circleX);
        backgroundCircle.setAttribute("cy", this.circleY);
        backgroundCircle.setAttribute("r", this.circleR);
        backgroundCircle.style.fill = 'none';
        backgroundCircle.style.strokeWidth = '10';
        backgroundCircle.style.stroke = '#000';
        backgroundCircle.style.transform = 'translate(5px, 5px)';
        backgroundCircle.style.strokeLinecap = 'round';
        backgroundCircle.style.strokeDasharray = '343';
        backgroundCircle.style.strokeDashoffset = '0';
        backgroundCircle.style.stroke = '#e0e0e0';
        svgElement.appendChild(backgroundCircle);

        let maxvalue = 100;
        let stroke = '#ff8888';
        if (this.datadescription.getMinDefinition(this.diagramDef.attr)) {
            stroke = this.datadescription.getValuesVisdata(name,value,'col');
            maxvalue = this.datadescription.getAttributeMaxValue(name);
        } else {
            Msg.warn('CircleProgress', 'There is no visualisation data for attribute >' + this.diagramDef.attr + '< in the datadescription.');
        }

        // Percentage Circle
        let percentageCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        percentageCircle.setAttribute("cx", this.circleX);
        percentageCircle.setAttribute("cy", this.circleY);
        percentageCircle.setAttribute("r", this.circleR);
        percentageCircle.style.fill = 'none';
        percentageCircle.style.strokeWidth = '10';
        percentageCircle.style.stroke = '#000';
        percentageCircle.style.transform = 'translate(5px, 5px)';
        percentageCircle.style.strokeLinecap = 'round';
        percentageCircle.style.strokeDasharray = '343';
        percentageCircle.style.strokeDashoffset = (343 - 343 * value/100);
        percentageCircle.style.stroke = stroke;
        
        svgElement.appendChild(percentageCircle);

        // Percentage Label Wrapper
        let percentageLabelWrapper = document.createElement('div');
        percentageLabelWrapper.style.position = 'absolute';
        percentageLabelWrapper.style.top = '0';
        percentageLabelWrapper.style.left = '0';
        percentageLabelWrapper.style.width = '100%';
        percentageLabelWrapper.style.height = '100%';
        percentageLabelWrapper.style.display = 'flex';
        percentageLabelWrapper.style.justifyContent = 'center';
        percentageLabelWrapper.style.alignItems = 'center';
        percentageLabelWrapper.style.color = '#999';

        // Percentage Label
        let percentageLabel = document.createElement('h2');
        percentageLabel.classList.add('swac_percentageLabel');
        
        percentageLabel.innerText = value;
        if(this.comp.options.dataUnits && this.comp.options.dataUnits[name]) {
            percentageLabel.innerText += this.comp.options.dataUnits[name];
            if(maxvalue !== 100)
                percentageLabel.innerText += ' / ' + maxvalue + ' ' + this.comp.options.dataUnits[name];
        } else
            percentageLabel.innerText += '%';
        percentageLabel.style.margin = '0'
        percentageLabel.style.color = '#888';
        percentageLabelWrapper.appendChild(percentageLabel);

        wrapper.appendChild(svgElement);
        wrapper.appendChild(percentageLabelWrapper);

        return wrapper;
    }

    /**
     * Draws the diagram for a set
     * 
     * @param {Object} set The set a diagram should be created for
     * @returns {DOMNode} A node containing the diagram (maybe svg, img,...)
     */
    drawSetDiagram(set) {
        Msg.error('Diagram', 'CircleProgress does not support visualising of datasets.');
    }
}