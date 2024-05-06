/**
 * @class
 * ColorRanges
 */
class ColorRange {
    constructor(minValue, maxValue, color) {
        this.minValue = minValue;
        this.maxValue = maxValue;
        this.color = color;
    }
}

/**
 * @function
 * compares two ColorRanges
 * @param {colorRange} rangeA
 * @param {colorRange} rangeB
 */
function compareColorRanges(rangeA, rangeB) {
    if (rangeA.minValue < rangeB.minValue)
        return -1;
    if (rangeA.minValue > rangeB.minValue)
        return 1;
    return 0;
}

/**
 * @function
 * compares two ColorRanges backwards
 * @param {colorRange} rangeA
 * @param {colorRange} rangeB
 */
function compareColorRangesBackward(rangeA, rangeB) {
    if (rangeA.minValue < rangeB.minValue)
        return 1;
    if (rangeA.minValue > rangeB.minValue)
        return -1;
    return 0;
}