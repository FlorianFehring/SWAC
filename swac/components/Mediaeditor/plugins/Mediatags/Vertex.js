/**
 *  Vertex Class, represents a vertex or a point (2-dimensional)
 */
class Vertex {

    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    /**
     * Calculates distance between two vertices
     * 
     * @param {Vertex} that Other vertex
     * @returns distance
     */
    getDistanceTo(that) {
        if (this.x === that.x) {
            return Math.abs(this.y - that.y);
        } else if (this.y === that.y) {
            return Math.abs(this.x - that.x);
        } else {
            return Math.sqrt((that.x - this.x) * (that.x - this.x) + (that.y - this.y) * (that.y - this.y));
        }
    }

    /**
     * Checks if two vertices are equal
     * @param {Vertex} that Other vertex
     * @param {Number} tolerance threshold for equality
     * @returns Boolean true if equal
     */
    equals(that, tolerance = 0) {
        if (tolerance === 0)
            return this.x === that.x && this.y === that.y;
        else
            return this.getDistanceTo(that) < tolerance;
    }

    /**
     * Copies vertexobject
     * @returns Vertex
     */
    copy() {
        return new Vertex(this.x, this.y);
    }

    draw(ctx, scale = 1) {
        ctx.restore();
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.rect((this.x * scale) - 3, (this.y * scale) - 3, 6, 6);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "black";
        ctx.beginPath();
        ctx.rect((this.x * scale) - 1.5, (this.y * scale) - 1.5, 3, 3);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
}
