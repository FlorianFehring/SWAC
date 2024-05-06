import SWAC from '../../../swac.js';
import Msg from '../../../Msg.js';

/**
 * Class for createing Hygrometer diagrams
 */
export default class Hygrometer extends Diagram {
    constructor(unit, name, width, height, datadescription, diagramDef, comp) {
        super(unit, name, width, height, datadescription, diagramDef, comp);
    }

    /**
     * Draws the Hygrometer
     * 
     * @param {String} name Diagrams label
     * @param {Object} value The value that should be displayed
     * @returns {Element|Hygrometer.drawDiagram.svgViewBox} svg viewbox with the diagram
     */
    drawValueDiagram(name, value) {
        if (!this.datadescription) {
            Msg.error('Thermometer', 'There is no datadescription defined.');
            return;
        }
        
        let minValue = this.datadescription.getAttributeMinValue(this.diagramDef.attr);
        let maxValue = this.datadescription.getAttributeMaxValue(this.diagramDef.attr);
        
        // Calculate pointer line
        let line = this.calculatePointer(value, 160, minValue, maxValue);

        //creates the svg viewbox
        let svgViewBox = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svgViewBox.setAttribute("viewBox","0 0 400 400");
        svgViewBox.setAttribute("width",this.width);
        svgViewBox.setAttribute("height",this.height);

        // outer circle
        let svgCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        svgCircle.setAttribute("style","fill: rgb(202, 202, 202);");
        svgCircle.setAttribute("cx","200");
        svgCircle.setAttribute("cy","200");
        svgCircle.setAttribute("r","200");
        svgViewBox.appendChild(svgCircle);

        let definitions = this.datadescription.getDefinitions(this.diagramDef.attr);
        if(!definitions) {
            Msg.error('Hygrometer','There are not definitions for >' + this.diagramDef.attr + '< in the datadescription.');
            return document.createElement('span');
        }
        for (let curDef of definitions) {
            let svgPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
            let coordinate1 = this.calculatePointer(curDef.minValue, 170, minValue, maxValue);
            let coordinate2 = this.calculatePointer(curDef.maxValue, 170, minValue, maxValue);
            let coordinate3 = this.calculatePointer(curDef.maxValue, 145, minValue, maxValue);
            let coordinate4 = this.calculatePointer(curDef.minValue, 145, minValue, maxValue);
            svgPath.setAttribute("style", "fill: " + curDef.col);
            svgPath.setAttribute("d","M " + coordinate1[0] + " " + coordinate1[1] + " A 170 170 0 0 1 " + coordinate2[0] + " " + coordinate2[1] + " L " + coordinate3[0] + " " + coordinate3[1] + " A 145 145 0 0 0 " + coordinate4[0] + " " + coordinate4[1] + " Z");
            svgViewBox.appendChild(svgPath);
        }

        //creates the pointer
        let svgLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
        svgLine.setAttribute("style","stroke:rgb(0,0,0);stroke-width:2");
        svgLine.setAttribute("x1","200");
        svgLine.setAttribute("y1","200");
        svgLine.setAttribute("x2", line[0]);
        svgLine.setAttribute("y2", line[1]);

        //name of the diagram 
       let svgDiagramName = document.createElementNS("http://www.w3.org/2000/svg", "text");
        svgDiagramName.setAttribute("fill","black");
        svgDiagramName.setAttribute("x","200");
        svgDiagramName.setAttribute("y","290");
        svgDiagramName.setAttribute("text-anchor", "middle");
        svgDiagramName.setAttribute("font-size", "30");
        svgDiagramName.innerHTML = this.name;

        //displays the unit
        let svgDiagramUnit = document.createElementNS("http://www.w3.org/2000/svg", "text");
        svgDiagramUnit.setAttribute("fill","black");
        svgDiagramUnit.setAttribute("x","200");
        svgDiagramUnit.setAttribute("y","255");
        svgDiagramUnit.setAttribute("text-anchor", "middle");
        svgDiagramUnit.setAttribute("font-size", "50");
        svgDiagramUnit.innerHTML = value + " " + this.unit;

        //calculates the scala
        let step_count = 10;
        let stepWidth = (maxValue - minValue) / step_count;
        let valueList = [];
        let counter = -1;
        do {
            counter++;
            let next = Math.round(stepWidth) * counter + minValue;
            if (next < maxValue) {
                valueList[counter] = next;
            } else {
               valueList[counter] = maxValue; 
            }
        } while (valueList[counter] < maxValue)
        
        // creates the scala
        for (let i in valueList){
            let coordinate1 = this.calculatePointer(valueList[i], 165, minValue, maxValue);
            let coordinate2 = this.calculatePointer(valueList[i], 175, minValue, maxValue);
            
            let svgScala = document.createElementNS("http://www.w3.org/2000/svg", "line");
            svgScala.setAttribute("style","stroke:rgb(0,0,0);stroke-width:1");
            svgScala.setAttribute("x1", coordinate1[0]);
            svgScala.setAttribute("y1", coordinate1[1]);
            svgScala.setAttribute("x2", coordinate2[0]);
            svgScala.setAttribute("y2", coordinate2[1]);

            let svgScalaTxt = document.createElementNS("http://www.w3.org/2000/svg", "text");
            svgScalaTxt.setAttribute("fill","black");
            svgScalaTxt.setAttribute("x", coordinate2[0]);
            svgScalaTxt.setAttribute("y", coordinate2[1]);
            if (valueList[i] > ((maxValue-minValue)/3)*2+minValue) {
                svgScalaTxt.setAttribute("text-anchor", "start");
            } else if (valueList[i] < (((maxValue-minValue)/3)*2)+minValue && valueList[i] > ((maxValue-minValue)/3)+minValue) {
                svgScalaTxt.setAttribute("text-anchor", "middle");
            } else {
                svgScalaTxt.setAttribute("text-anchor", "end");				
            }
            if (valueList[i] >= 1000) {
                svgScalaTxt.setAttribute("text-anchor", "middle");
            }
            svgScalaTxt.innerHTML = valueList[i];
            
            svgViewBox.appendChild(svgScala);
            svgViewBox.appendChild(svgScalaTxt);
        }
        svgViewBox.appendChild(svgLine);
        svgViewBox.appendChild(svgDiagramName);
        svgViewBox.appendChild(svgDiagramUnit);

        return svgViewBox;
    }
    
    /**
     * Draws the diagram for a set
     * 
     * @param {Object} set The set a diagram should be created for
     * @returns {DOMNode} A node containing the diagram (maybe svg, img,...)
     */
    drawSetDiagram(set) {
        Msg.error('Diagram', 'Hygrometer does not support visualising datasets.');
    }

    /**
     * Calculates the position for the pointer
     * 
     * @param {float} value for the pointer
     * @param {float} r radius of the pointer
     * @param {float} absoluteMin
     * @param {float} absoluteMax
     * @returns {Array} coordinates for the pointer
     */
    calculatePointer(value, r, absoluteMin, absoluteMax) {
        let degree;
        let coordinates;
        degree = ((value-absoluteMin)/(absoluteMax-absoluteMin))*180;
        degree = degree * (Math.PI/180);
        //if (degree > 90) {
                //degree = 90 - (degree - 90);
                //coordinates = [200+(Math.cos(degree)*r), 200-(Math.sin(degree)*r)];
        //} else {		
                coordinates = [200-(Math.cos(degree)*r), 200-(Math.sin(degree)*r)];
        //}
        return coordinates;
    }
}