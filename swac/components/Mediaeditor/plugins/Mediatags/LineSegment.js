/**
 * Represents a linesegment between two points
 */
class LineSegment {

    constructor(a, b) {
        this.a = a;
        this.b = b;
    }

    /**
     * Checks if seggment intersects with another one
     * @param {LineSegment} that
     * @returns Boolean
     */
    doesIntersectWith(that) {
        let nenner, zaehler1, zaehler2, r, s;

        nenner = (this.b.x - this.a.x) * (that.b.y - that.a.y) - (this.b.y - this.a.y) * (that.b.x - that.a.x);

        if (nenner === 0) {
            return false;
        }

        zaehler1 = (this.a.y - that.a.y) * (that.b.x - that.a.x) - (this.a.x - that.a.x) * (that.b.y - that.a.y);

        if (zaehler1 === 0) {
            return false;
        }

        zaehler2 = (this.a.y - that.a.y) * (this.b.x - this.a.x) - (this.a.x - that.a.x) * (this.b.y - this.a.y);

        if (zaehler2 === 0) {
            return false;
        }

        r = zaehler1 / nenner;
        s = zaehler2 / nenner;

        return r > 0 && r < 1 && s > 0 && s < 1;
    }

    /**
     * Checks if an other linesegment starts at one of the ends of this one
     * @param {LineSegment} that
     * @returns Boolean
     */
    sharesVertexWith(that) {
        if (this.a.equals(that.a) || this.a.equals(that.b) || this.b.equals(that.a) || this.b.equals(that.b)) {
            return true;
        }
        return false;
    }

    /**
     * Checks if a Vertex is on the linesegment
     * @param {Vertex} point
     * @returns Boolean true if on linesegment
     */
    containsPoint(point) {
        let line = this.asLineFunction();
        if (line === undefined) {
            // Strecke ist parallel zu y-Achse
            if (this.a.x === point.x && this.a.y <= point.y && point.y <= this.b.y || this.b.y <= point.y && point.y <= this.a.y) {
                return true;
            }
        } else {
            if (Math.min(this.a.x, this.b.x) < point.x && point.x < Math.max(this.a.x, this.b.x) && Math.min(this.a.y, this.b.y) < point.y && point.y < Math.max(this.a.y, this.b.y)) {
                if (this.asLine().containsPoint(point)) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Returns the point on the segment that has the shortest
     * distance to a given point
     * @param {Vetrex} point
     * @returns Vertex
     */
    getClosestPointTo(point) {
        if (this.containsPoint(point)) {
            return point;
        } else {
            let g = this.asLineFunction();
            let go = {};

            if (g === undefined) {
                // Strecke ist parallel zu y-Achse
                if (point.y < this.a.y && point.y > this.b.y || point.y > this.a.y && point.y < this.b.y) { // Kann eine Orthogonale gezogen werden
                    return new Vertex(this.a.x, point.y);
                } else {
                    if (this.a.getDistanceTo(point) < this.b.getDistanceTo(point)) {
                        return this.a;
                    } else {
                        return this.b;
                    }
                }
            } else if (g.m === 0) {
                // Strecke ist parallel zu x-Achse
                if (point.x < this.a.x && point.x > this.b.x || point.x > this.a.x && point.x < this.b.x) {
                    return new Vertex(point.x, this.a.y);
                } else {
                    if (this.a.getDistanceTo(point) < this.b.getDistanceTo(point)) {
                        return this.a;
                    } else {
                        return this.b;
                    }
                }
            } else {
                go.m = -(1 / g.m);
                go.b = point.y - go.m * point.x;

                let sp = this.asLine().getIntersectionWith(new Line(point, new Vertex(point.x + 10, go.m * (point.x + 10) + go.b)));

                if (this.containsPoint(sp)) {
                    return sp;
                } else {
                    if (this.a.getDistanceTo(point) < this.b.getDistanceTo(point)) {
                        return this.a;
                    } else {
                        return this.b;
                    }
                }
            }
        }
    }

    /**
     * Returns the line converted to a linefunctionobject
     * @returns undefined|LineFunction undefined if vertical
     */
    asLineFunction() {
        if (this.a.x === this.b.x) {
            return undefined;
        } else {
            let m = (this.b.y - this.a.y) / (this.b.x - this.a.x);
            let n = (-1) * m * this.a.x + this.a.y;
            return new LineFunction(m, n);
        }
    }

    /**
     * Returns the line converted to a lineobject
     * @returns Line 
     */
    asLine() {
        return new Line(this.a, this.b);
    }

    /**
     * Returns distance between the two ends of the segment
     * @returns Number
     */
    length() {
        return this.a.getDistanceTo(this.b);
    }

    /**
     * Copies vertexobject
     * @returns LineSegment
     */
    copy() {
        return new LineSegment(this.a.copy, this.b.copy);
    }

    /**
     * Returns midpoint of linesegment
     * @returns Vertex
     */
    getCenter() {
        return new Vertex(0.5 * (this.a.x + this.b.x), 0.5 * (this.a.y + this.b.y));
    }

    /**
     * Checks if two linesegments are equal
     * @param {LineSegment} that Other linesegment
     * @param {Number} tolerance threshold for equality
     * @returns Boolean true if equal
     */
    equals(that, tolerance = 0) {
        return this.a.equals(that.a, tolerance) && this.b.equals(that.b, tolerance) || this.a.equals(that.b, tolerance) && this.b.equals(that.a, tolerance);
    }
}
