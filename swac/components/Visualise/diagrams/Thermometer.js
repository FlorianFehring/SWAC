import SWAC from '../../../swac.js';
import Msg from '../../../Msg.js';

/**
 * Creates the thermometer visualisation
 */
export default class Thermometer extends Diagram {
    constructor(unit, name, width, height, datadescription, diagramDef, comp) {
        super(unit, name, width, height, datadescription, diagramDef, comp);
        // Default style values
        this.barXPos = 15;      // Bar begins 15px from left border
        this.barTopPos = 20;    // Bar begins 20px from top
        this.barHeight = 150;   // Bars height
        this.barWidth = 30;     // Bars width

        this.barPartXPos = 20;  // Barparts begin 20px from left border
        this.barPartWidth = 20; // Barparts width

        // Value display
        this.valueLineXPos = 35;
        this.valueLineWidth = 40;

        this.stepNumberXPos = 5;// Numbers are displayed 5px from left border
        this.stepLineXPos = 10; // Steplines are displayed 10px from the left border
        this.stepLineWidth = 20; // Steplines width

        this.labelXPos = 220;
        this.labelTopPos = 30;

        this.lowerCircleRadius = 25;
        this.lowerCircleInnerRadius = 20;

        this.upperCircleRadius = 15;
        this.upperCircleInnerRadius = 10;
    }

    /**
     * Draws the thermometer visualisation
     * 
     * @param {String} name Datas label
     * @param {Object} value The value that should be displayed
     * @returns {Element|Thermometer.drawDiagram.svgElement}
     */
    drawValueDiagram(name, value) {
        if (!this.datadescription) {
            Msg.error('Thermometer', 'There is no datadescription defined.');
            return;
        }
        
        if (!this.datadescription.getMinDefinition(this.diagramDef.attr)) {
            Msg.error('Thermometer', 'There is no >visualise_legend_data< for attribute >' + this.diagramDef.attr + '<');
            return;
        }

        let grey = "fill: rgb(54, 54, 54);";
        let textColor = "fill: rgb(128, 128, 128);";        // Font Color
        let blackLine = "stroke: rgb(0, 0, 0);";

        let minValue = this.datadescription.getAttributeMinValue(this.diagramDef.attr);
        let maxValue = this.datadescription.getAttributeMaxValue(this.diagramDef.attr);
        let diffValue = maxValue - minValue;

        // Svg Element	
        var svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svgElement.setAttribute("viewBox", "0 0 60 240");
        svgElement.setAttribute("width", this.width);
        svgElement.setAttribute("height", this.height);

        // Black Bar 
        let svgRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        svgRect.setAttribute("x", this.barXPos);
        svgRect.setAttribute("y", this.barTopPos);
        svgRect.setAttribute("width", this.barWidth);
        svgRect.setAttribute("height", this.barHeight);
        svgRect.setAttribute("style", grey);
        svgElement.appendChild(svgRect);

        // Black lower Circle
        let svgCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        svgCircle.setAttribute("style", grey);
        svgCircle.setAttribute("cx", this.barXPos + (this.barWidth / 2));
        svgCircle.setAttribute("cy", this.barTopPos + this.barHeight + (this.lowerCircleRadius / 2));
        svgCircle.setAttribute("r", this.lowerCircleRadius);
        svgElement.appendChild(svgCircle);

        // Colored lower Circle
        let svgCircle3 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        if (!this.datadescription.getMinDefinition(this.diagramDef.attr)) {
            Msg.error('Thermometer', 'Thre is no >visualise_legend_data< for attribute >' + this.diagramDef.attr + '<');
            return;
        }

        svgCircle3.setAttribute("style", "fill:" + this.datadescription.getMinDefinition(this.diagramDef.attr).col + ";");
        svgCircle3.setAttribute("cx", this.barXPos + (this.barWidth / 2));
        svgCircle3.setAttribute("cy", this.barTopPos + this.barHeight + (this.lowerCircleInnerRadius / 2));
        svgCircle3.setAttribute("r", this.lowerCircleInnerRadius);
        svgElement.appendChild(svgCircle3);

        // Black upper Circle
        let svgCircle2 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        svgCircle2.setAttribute("style", grey);
        svgCircle2.setAttribute("cx", this.barXPos + (this.barWidth / 2));
        svgCircle2.setAttribute("cy", this.barTopPos + (this.upperCircleRadius / 2));
        svgCircle2.setAttribute("r", this.upperCircleRadius);
        svgElement.appendChild(svgCircle2);

        // Colored upper Circle
        let svgCircle4 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        svgCircle4.setAttribute("style", "fill:" + this.datadescription.getMaxDefinition(this.diagramDef.attr).col + ";");
        svgCircle4.setAttribute("cx", this.barXPos + (this.barWidth / 2));
        svgCircle4.setAttribute("cy", this.barTopPos + (this.upperCircleInnerRadius / 2));
        svgCircle4.setAttribute("r", this.upperCircleInnerRadius);
        svgElement.appendChild(svgCircle4);

        // Calculate Colorranges
        let definitions = this.datadescription.getDefinitions(this.diagramDef.attr);
        for (let curDef of definitions) {
            // Position percentages within the min max range
            let percMaxValue = ((curDef.maxValue - minValue) / diffValue);
            if (curDef.maxValue > maxValue) {
                Msg.warn('Thermometer', 'Definitions maxValue >'
                        + curDef.maxValue + '< is heigher than the attribute maxValue >'
                        + maxValue + '<');
                percMaxValue = 1;
            }
            let percMinValue = ((curDef.minValue - minValue) / diffValue);
            if (curDef.minValue < minValue) {
                Msg.warn('Thermometer', 'Definitions minValue >'
                        + curDef.minValue + '< is lower than the attribute minValue >'
                        + minValue + '<');
                percMinValue = 0;
            }

            let topPosOnBar = this.barHeight - (this.barHeight * percMaxValue);
            let lowPosOnBar = this.barHeight - (this.barHeight * percMinValue);

            let barpartTopPos = topPosOnBar + this.barTopPos;
//            let barpartLowPos = lowPosOnBar + this.barTopPos;

            let barpartHeight = lowPosOnBar - topPosOnBar;

            let svgRect2 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            svgRect2.setAttribute("x", this.barPartXPos);
            svgRect2.setAttribute("y", barpartTopPos);
            svgRect2.setAttribute("width", this.barPartWidth);
            svgRect2.setAttribute("height", barpartHeight);
            svgRect2.setAttribute("style", "fill:" + curDef.col + ";");
            svgElement.appendChild(svgRect2);
        }

        // Position percentages within the min max range
        let percValue = ((value - minValue) / diffValue);
        if (value > maxValue) {
            Msg.warn('Thermometer', 'Value >'
                    + value + '< is heigher than the attribute maxValue >'
                    + maxValue + '<');
            percValue = 1;
        }
        if (value < minValue) {
            Msg.warn('Thermometer', 'Value >'
                    + value + '< is lower than the attribute minValue >'
                    + minValue + '<');
            percValue = 0;
        }
        let valuePos = this.barHeight - (this.barHeight * percValue);
        // Add padding on top
        let valueTopPos = valuePos + this.barTopPos;

        // Temperatur Line
        let svgLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
        svgLine.setAttribute("style", blackLine);
        svgLine.setAttribute("x1", this.valueLineXPos);
        svgLine.setAttribute("y1", valueTopPos);
        svgLine.setAttribute("x2", this.valueLineXPos + this.valueLineWidth);
        svgLine.setAttribute("y2", valueTopPos);
        svgElement.appendChild(svgLine);

        // Themperatur display
        let svgText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        svgText.setAttribute("style", textColor + " font-size: 10px; white-space: pre;");
        svgText.setAttribute("x", this.valueLineXPos + this.valueLineWidth - 20);
        svgText.setAttribute("y", valueTopPos - 2.25);
        // Round value to 2 digits
        let precision = Math.pow(10, 2)
        value = Math.ceil(value * precision) / precision
        svgText.innerHTML = value + " " + this.unit;
        svgElement.appendChild(svgText);

        let stepCount = 5;
        let tenPercent = diffValue / stepCount;
        let stepps = [1, 2, 5, 10, 20, 50, 100, 250, 500];
        let minDiff = 1000;
        let usedStep = tenPercent;
        stepps.forEach(function (step) {
            if (minDiff > (step - tenPercent) && (step - tenPercent) >= 0) {
                minDiff = step - tenPercent;
                usedStep = step;
            }
        });

        // generate Scale
        let stepValue = minValue;
        for (var k = 0; k < diffValue / usedStep + 1; k++) {
            // Only draw between min and max value
            if (stepValue => minValue && stepValue <= maxValue) {
                // Position percentages within the min max range
                let percStepValue = ((stepValue - minValue) / diffValue);
                let stepPos = this.barHeight - (this.barHeight * percStepValue);
                // Add padding on top
                let stepTopPos = stepPos + this.barTopPos;

                let svgLine2 = document.createElementNS("http://www.w3.org/2000/svg", "line");
                svgLine2.setAttribute("style", blackLine);
                svgLine2.setAttribute("x1", this.stepLineXPos);
                svgLine2.setAttribute("y1", stepTopPos);
                svgLine2.setAttribute("x2", this.stepLineXPos + this.stepLineWidth);
                svgLine2.setAttribute("y2", stepTopPos);
                svgElement.appendChild(svgLine2);

                // lower Themperatur display
                let svgText2 = document.createElementNS("http://www.w3.org/2000/svg", "text");
                svgText2.setAttribute("style", textColor + " font-size: 8px; white-space: pre;");
                svgText2.setAttribute("x", this.stepNumberXPos);
                svgText2.setAttribute("y", stepTopPos + 2);
                svgText2.innerHTML = stepValue + " " + this.unit;
                svgText2.setAttribute("text-anchor", "end");
                svgElement.appendChild(svgText2);
            }
            stepValue += usedStep;
        }

        // Adding label
        let svgLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
        svgLabel.setAttribute("style", textColor + " font-size: 16px; white-space: pre;");
        svgLabel.setAttribute("x", this.labelTopPos);
        svgLabel.setAttribute("y", this.labelXPos);
        svgLabel.innerHTML = this.name;
        svgLabel.setAttribute("text-anchor", "middle");
        svgElement.appendChild(svgLabel);

        return svgElement;
    }

    /**
     * Draws the diagram for a set
     * 
     * @param {Object} set The set a diagram should be created for
     * @returns {DOMNode} A node containing the diagram (maybe svg, img,...)
     */
    drawSetDiagram(set) {
        Msg.error('Diagram', 'Thermometer does not support visualising of datasets.');
    }
}