import Msg from '../../../Msg.js';
import MapModel from './MapModel.js';

export default class TrianglesJson extends MapModel {
    constructor(filepath) {
        super(filepath);
    }

    draw(viewer) {
        console.log("triangles:");
        console.log(data.triangles);

        let rgb = [1, 1, 1, 1.0];

        for (let trianglenr in data.triangles) {
            console.log("triangle " + trianglenr + ":");
            console.log(data.triangles[trianglenr]);

            rgb[0] += 2;
            rgb[1] += 3;
            rgb[2] += 2;
            console.log("color: " + rgb);
            let color = new Cesium.Color(rgb[0], rgb[1], rgb[2], 0.5);
            color = Cesium.Color.fromRandom();
            console.log("cesium color: " + color);
            for (let pointnr in data.triangles[trianglenr]) {
                console.log("point: " + pointnr + ' color: ' + color);
                console.log(data.triangles[trianglenr][pointnr].x);

                let cart3Point = new Cesium.Cartesian3(
                        data.triangles[trianglenr][pointnr].x,
                        data.triangles[trianglenr][pointnr].y,
                        data.triangles[trianglenr][pointnr].z);
                var redSphere = SAFE_globe.viewer.entities.add({
                    name: 'Point ' + pointnr + ' of ' + trianglenr,
                    position: cart3Point,
                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                    ellipsoid: {
                        radii: new Cesium.Cartesian3(0.5, 0.5, 0.5),
                        material: color,
                        outline: true,
                        outlineColor: Cesium.Color.BLACK
                    }
                });
            }
        }
    }
}
