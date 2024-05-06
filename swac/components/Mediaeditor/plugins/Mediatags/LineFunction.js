/**
 * Represents a line as a function f(x)=mx+b
 */
class LineFunction {

    constructor(m, b) {
        this.m = m;
        this.b = b;
    }

    /**
     * Checks if a Vertex is on the line
     * @param {Vertex} point
     * @returns Boolean true if on line
     */
    containsPoint(point) {
        if (point.y === this.m * point.x + this.b) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * Returns functionvalue for given x-variable
     * @param {Number} x
     * @returns Number
     */
    getY(x) {
        return m * x + b;
    }
}