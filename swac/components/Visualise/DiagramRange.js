/**
 * @class Diagramrange
 */
class DiagramRange {
    constructor() {
        this.colorRanges = [];
    }

    /**
     * @function
     * Adds a ColorRange
     * @param {colorRange} colorRange to add
     */
    addColorRange(colorRange) {
        this.colorRanges.push(colorRange);
    }

    /**
     * @function
     * returns the min value of the colorranges
     * @returns {Number|Number.MAX_VALUE}
     */
    getAbsoluteMinValue() {
        let minVal = Number.MAX_VALUE;
        this.colorRanges.forEach((colorRange) => {
            if (colorRange.minValue < minVal) {
                minVal = colorRange.minValue;
            }
        });
        return minVal;
    }

    /**
     * @function
     * returns the max value of the colorranges
     * @returns {Number|Number.MAX_VALUE}
     */
    getAbsoluteMaxValue() {
        let maxVal = Number.MIN_VALUE;
        this.colorRanges.forEach((colorRange) => {
            if (colorRange.maxValue > maxVal) {
                maxVal = colorRange.maxValue;
            }
        });
        return maxVal;
    }

    /**
     * @function
     * corrects the ColorRanges in DiagramRange 
     */
    calculateValidColorRanges() {
        this.colorRanges.sort(compareColorRanges);
        if (!this.isValidColorRange()) {
            let testVal = this.colorRanges[0].minValue;
            this.colorRanges.forEach((colorRange) => {
                if (colorRange.minValue !== testVal) {
                    colorRange.minValue = testVal;
                }
                testVal = colorRange.maxValue;
            });
        }
    }
    
    /**
     * @function
     * tests the ColorRanges in DiagramRange
     */
    isValidColorRange() {
        let valid = true;
        this.colorRanges.sort(compareColorRanges);
        let testVal = this.colorRanges[0].minValue;
        this.colorRanges.forEach((colorRange) => {
            if (colorRange.minValue !== testVal) {
                valid = false;
            }
            testVal = colorRange.maxValue;
        });
        return valid;
    }

}