/**
 * Represents a Polygon as set of vertices
 */
class Polygon {

    constructor(listOfVertices = []) {
        this.vertices = listOfVertices;
    }

    /**
     * Fills this polygon from point list data
     * 
     * @param {Array} pointlist Array containing objects with x and y attribute.
     * @returns {undefined}
     */
    addPoints(pointlist) {
        for(let curPoint of pointlist) {
            this.vertices.push(new Vertex(curPoint.x,curPoint.y));
        }
    }

    /**
     * Returns a Vertex
     * 
     * @param {Number} index
     * @returns Vertex
     */
    getVertex(index) {
        return this.vertices[index];
    }

    /**
     * Returns the last vertex of the polygon
     * 
     * @returns {@var;listOfVertices|Array}
     */
    getLastVertex() {
        return this.vertices[this.vertices.length - 1];
    }

    /**
     * Checks if polygonobject has a given vertex
     * 
     * @param {Vertex} vertex
     * @returns Boolean true if Vertex is in polygon
     */
    containsVertex(vertex) {
        return this.vertices.find(v => {
            return v === vertex;
        });
    }

    /**
     * Checks if a given point is inside the polygon
     * 
     * @param {Vertex} point
     * @returns Boolean
     */
    containsPoint(point) {
        for (var c = false, i = -1, l = this.numberOfVertices(), j = l - 1; ++i < l; j = i) {
            ((this.getVertex(i).y <= point.y && point.y < this.getVertex(j).y) || (this.getVertex(j).y <= point.y && point.y < this.getVertex(i).y)) && (point.x < (this.getVertex(j).x - this.getVertex(i).x) * (point.y - this.getVertex(i).y) / (this.getVertex(j).y - this.getVertex(i).y) + this.getVertex(i).x) && (c = !c);
        }
        return c;
    }

    /**
     * Checks if this polygon is closed, e.g. if the first and last point are
     * identically.
     * 
     * @returns {boolean} true if the polygon is closed
     */
    isClosed() {
        let lastVertex = this.vertices[this.vertices.length-1];
        return this.vertices[0].equals(lastVertex);
    }

    /**
     * Checks if a given point is on the linesegments of the polygon
     * 
     * @param {Vertex} point
     * @param {Number} tolerance
     * @returns Boolean
     */
    isPointOnEdges(point, tolerance = 0) {
        const closestPoint = this.getClosestPointOnEdgesTo(point).vertex;
        return closestPoint.equals(point, tolerance);
    }

    /**
     * Calculates the point inside the polygon with the shortest 
     * distance to a given point
     * 
     * @param {type} point
     * @returns Vertex
     */
    getClosestPointTo(point) {
        if (this.containsPoint(point)) {
            return point;
        } else {
            return this.getClosestPointOnEdgesTo(point).vertex;
        }
    }

    /**
     * Calculates the point on the segments of the polygon with the shortest 
     * distance to a given point
     * 
     * @param {Vertex} point
     * @returns Vertex
     */
    getClosestPointOnEdgesTo(point) {
        let retVal = undefined;
        this.listOfLineSegments().forEach(lineSegment => {
            let pointOnLineSegment = lineSegment.getClosestPointTo(point);
            let distance = pointOnLineSegment.getDistanceTo(point);
            if (retVal === undefined || distance < retVal.dist) {
                retVal = {vertex: pointOnLineSegment, dist: distance, segment: lineSegment};
            }
        });
        return retVal;
    }

    /**
     * Returns the vertex of the polygon with the shortest 
     * distance to a given point
     * 
     * @param {Vertex} point
     * @returns Vertex
     */
    getClosestVertexTo(point) {
        let min = Number.MAX_SAFE_INTEGER;
        let vertex;

        this.vertices.forEach(v => {
            if (v.getDistanceTo(point) < min) {
                min = v.getDistanceTo(point);
                vertex = v;
            }
        });

        return vertex;
    }

    /**
     * Adds the vertex to the polygon after a given one
     * 
     * @param {Vertex} prev
     * @param {Vertex} newVertex
     * @returns Boolean
     */
    addVertexAfter(prev, newVertex) {
        for (let i = 0, l = this.numberOfVertices(); i < l; i += 1) {
            if (this.vertices[i].equals(prev)) {
                this.vertices.splice(i + 1, 0, newVertex);
                return true;
            }
        }
        return false;
    }

    /**
     * Adds the vertex to the polygon after the last on
     * 
     * @param {Vertex} vertex
     */
    addVertex(vertex) {
        this.vertices.push(vertex);
    }

    /**
     * Returns the number of the polygons vertices
     * 
     * @returns Number
     */
    numberOfVertices() {
        return this.vertices.length;
    }

    /**
     * Returns a list of linesegments that construct the polygon
     * 
     * @returns Array
     */
    listOfLineSegments() {
        const list = [];
        for (let i = 0, l = this.vertices.length; i < l; i += 1) {
            list[i] = new LineSegment(this.vertices[i], this.vertices[(i + 1) % l]);
        }
        return list;
    }

    /**
     * Copies polygonobject
     * 
     * @returns Polyon
     */
    copy() {
        const copyList = [];
        this.vertices.forEach(vertex => {
            copyList.push(vertex.copy());
        });
        return new Polygon(copyList);
    }

    /**
     * Draws polygon on the canvas of a given context
     * 
     * @param {Object} ctx Context where to draw on
     * @param {integer} scale Factor to scale the draw with
     * @param {boolean} highlighted
     */
    draw(ctx, scale = 1, highlighted = false) {

        if (highlighted) {
            this.fill(ctx);
        }
        // Draw vertices
        for (let i = 0; i < this.vertices.length; i++) {
            let curVertex = this.vertices[i];
            let nextVertex = this.vertices[i+1];
            // Draw actual vertex
            curVertex.draw(ctx, scale);
            // Create line
            if(nextVertex) {
                let line = new Line(curVertex,nextVertex);
                line.draw(ctx, scale);
            }
    }
//
//        ctx.restore();
//        ctx.setLineDash([0]);
//        ctx.strokeStyle = "white";
//        ctx.lineWidth = "2.5";
//
//        ctx.beginPath();
//        ctx.moveTo(this.getVertex(0).x, this.getVertex(0).y);
//        for (let i = 1, l = this.numberOfVertices(); i < l; i += 1) {
//            ctx.lineTo(this.getVertex(i).x, this.getVertex(i).y);
//        }
//        ctx.closePath();
//        ctx.stroke();
//        ctx.setLineDash([4, 6]);
//        ctx.strokeStyle = "black";
//        ctx.lineWidth = "2.5";
//        ctx.lineDashOffset = 4;
//
//        ctx.beginPath();
//        ctx.moveTo(this.getVertex(0).x, this.getVertex(0).y);
//        for (let i = 1, l = this.numberOfVertices(); i < l; i += 1) {
//            ctx.lineTo(this.getVertex(i).x, this.getVertex(i).y);
//        }
//        ctx.closePath();
//        ctx.stroke();
//
//        this.vertices.forEach(v => {
//            ctx.fillStyle = "white";
//            ctx.beginPath();
//            ctx.rect(v.x - 3, v.y - 3, 6, 6);
//            ctx.closePath();
//            ctx.fill();
//            ctx.fillStyle = "black";
//            ctx.beginPath();
//            ctx.rect(v.x - 1.5, v.y - 1.5, 3, 3);
//            ctx.closePath();
//            ctx.fill();
//        });
//
//        ctx.restore();
    }

    /**
     * Fills polygon on the canvas of a given context
     * 
     * @param {Object} ctx
     */
    fill(ctx) {
        ctx.restore();
        ctx.fillStyle = "rgba(100, 100, 100, 0.5)";
        ctx.beginPath();
        ctx.moveTo(this.vertices[0].x, this.vertices[0].y);

        for (let i = 1, l = this.numberOfVertices(); i < l; i += 1) {
            ctx.lineTo(this.vertices[i].x, this.vertices[i].y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    equals(that) {
        let equal = true;
        for (let i = 0; i < that.vertices.length; i++) {
            if (!(this.vertices[i].x === that.vertices[i].x) && !(this.vertices[i].y === that.vertices[i].y)) {
                equal = false;
                break
            }
        }
        return equal;
    }
}