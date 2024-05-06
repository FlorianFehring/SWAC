/**
 * Represents a line as two points
 */
class Line {

    /**
     * Creates a new line
     * 
     * @param {Vertex} a Vertex of point a
     * @param {Vertex} b Vertex of point b
     * @param {HTMLColor} color Color of the line
     * @param {Long} width width of the line
     * @returns {Line}
     */
    constructor(a, b, color = '#000000', width = 1) {
        this.a = a;
        this.b = b;
        this.color = color;
        this.width = width;
    }

    /**
     * Calculates the point of intersection with a second line
     * @param {Line} that
     * @returns undefined|Vertex
     */
    getIntersectionWith(that) {
        let f1 = this.asLineFunction();
        let f2 = that.asLineFunction();

        if (f1 !== undefined && f2 !== undefined) {

            if (f1.m === f2.m) {
                if (f1.b === f2.b) {
                    return undefined;
                } else {
                    return new Vertex(null, null);
                }
            } else {
                let x = (f2.b - f1.b) / (f1.m - f2.m);
                let y = f1.m * x + f1.b;
                return new Vertex(x, y);
            }
        } else {
            if (f2 !== undefined) {
                return new Vertex(this.a.x, f2.b + f2.m * this.a.x);
            } else if (f1 !== undefined) {
                return new Vertex(this.a.x, f1.b + f1.m * that.a.x);
            } else {
                return undefined;
            }
        }
    }

    /**
     * Checks if a Vertex is on the line
     * @param {Vertex} point
     * @returns Boolean true if on line
     */
    containsPoint(point) {
        let line = this.asLineFunction();
        if (line === undefined) {
            if (this.a.x === point.x) {
                return true;
            }
        } else {
            return line.containsPoint(point);
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
     * Draws the line to the given context
     * 
     * @param {2DContext} ctx drawing context
     * @param {int} scale Scale with that the line is drawn
     * @returns {undefined}
     */
    draw(ctx, scale = 1) {
        ctx.restore();
        ctx.beginPath();        
        ctx.moveTo((this.a.x * scale), (this.a.y * scale));
        ctx.lineTo((this.b.x * scale), (this.b.y * scale));
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.width;
        ctx.stroke();
        ctx.restore();
    }
}
