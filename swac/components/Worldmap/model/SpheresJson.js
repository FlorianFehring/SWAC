import Msg from '../../../Msg.js';
import MapModel from './MapModel.js';

export default class SpheresJson extends MapModel {
    constructor(filepath) {
        super(filepath);
    }

    draw(viewer) {
        for (let pointno in data.points) {
            let cart3Point = new Cesium.Cartesian3(
                    data.points[pointno].x,
                    data.points[pointno].y,
                    data.points[pointno].z);
            var redSphere = SAFE_globe.viewer.entities.add({
                name: 'Red sphere with black outline',
                position: cart3Point,
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                ellipsoid: {
                    radii: new Cesium.Cartesian3(1.0, 1.0, 1.0),
                    material: Cesium.Color.RED.withAlpha(0.5),
                    outline: true,
                    outlineColor: Cesium.Color.BLACK
                }
            });
        }
    }
}
