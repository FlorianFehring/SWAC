import SWAC from '../../../swac.js';
import Msg from '../../../Msg.js';

/**
 * @class
 * Creates the StatusDisplay
 */
export default class StatusDisplay extends Diagram {
    constructor(unit, name, width, height, datadescription, diagramDef, comp) {
        super(unit, name, width, height, datadescription, diagramDef, comp);
        // Default style values
        this.barXPos = -80;
        this.barTopPos = 110;
        this.barHeight = 20;
        this.barWidth = 220;
    }

    /**
     * Creates a stauts diagram for one dataset based on a specific value
     */
    drawValueDiagram(name, value) {
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

        let grey = "fill: rgb(54, 54, 54);";

        // Black Bar 
        let svgRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        svgRect.setAttribute("x", this.barXPos);
        svgRect.setAttribute("y", this.barTopPos);
        svgRect.setAttribute("width", this.barWidth);
        svgRect.setAttribute("height", this.barHeight);
        svgRect.setAttribute("style", grey);
        svgElement.appendChild(svgRect);

        if (!Array.isArray(value)) {
            value = value.split(',');
        }

        // Create bar with 220px width
        var br_w = (220 / value.length);
        // Equidistant area for every dataentry
        for (let i = 0; i < value.length; i++) {
            var br_x_p = -80 + ((220 / value.length) * i);
            var br_t_p = 110;
            var br_h = 20;
            var br_color = "";
            // Get color for 
            if (this.datadescription?.getMinDefinition(this.diagramDef.attr)) {
                br_color = this.datadescription.getValuesVisdata(name, value[i], 'col');
            } else {
                Msg.warn('StatusDisplay', 'There is no data for attribute >' + this.diagramDef.attr + '< in the datadescription.');
                br_color = '#ff8888'
            }
            let c_Rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            c_Rect.setAttribute("x", br_x_p);
            c_Rect.setAttribute("y", br_t_p);
            c_Rect.setAttribute("width", br_w);
            c_Rect.setAttribute("height", br_h);
            c_Rect.setAttribute("style", 'fill: ' + br_color + '; border: 1px solid #000');
            svgElement.appendChild(c_Rect);
        }

        wrapper.appendChild(svgElement);
        return wrapper;
    }

    drawSetDiagram(set) {
        Msg.error('Diagram', 'StatusDisplay does not support visualising of datasets.');
    }
}