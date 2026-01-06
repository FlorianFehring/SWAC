import Msg from '../../Msg.js';
/* 
 * Class with collection of methods for navigation within cesium
 */
export default class Worldmap3dNavigation {
    constructor(worldmap3d) {
        this.worldmap3d = worldmap3d;
    }

    /**
     * Moves to the startview defined by the startPontLon, startPointLat, start...
     * parameters.
     *
     * @returns {undefined}
     */
    jumpToStartView() {
        // Setting startpoint of view
        var center = Cesium.Cartesian3.fromDegrees(
                this.worldmap3d.options.startPointLon,
                this.worldmap3d.options.startPointLat
                );
        var heading = Cesium.Math.toRadians(this.worldmap3d.options.startHeading);
        var pitch = Cesium.Math.toRadians(this.worldmap3d.options.startPitch);
        var range = this.worldmap3d.options.startheight;
        this.worldmap3d.viewer.camera.lookAt(center, new Cesium.HeadingPitchRange(heading, pitch, range));

        // Reset view, so that users can move over map instead of rotating arount an point
        this.worldmap3d.viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
    }

    /**
     * Startanimation to fly from start position to start position
     * Startposition is given by the options: startPointLon and startPointLat
     * 
     * @returns {undefined}
     */
    flyToStartView() {
        // Setting startpoint of view
        var center = Cesium.Cartesian3.fromDegrees(
                this.worldmap3d.options.startPointLon - 6,
                this.worldmap3d.options.startPointLat - 6,
                this.worldmap3d.options.startheight
                );

        this.worldmap3d.viewer.camera.flyTo({
            destination: center,
            duration: 20,
            orientation: {
                heading: Cesium.Math.toRadians(this.worldmap3d.options.startHeading),
                pitch: Cesium.Math.toRadians(this.worldmap3d.options.startPitch),
                roll: 0.0
            }
        });
        var heading = Cesium.Math.toRadians(this.worldmap3d.options.startHeading);
        var pitch = Cesium.Math.toRadians(this.worldmap3d.options.startPitch);
        var range = this.worldmap3d.options.startheight;
        this.worldmap3d.viewer.camera.lookAt(center, new Cesium.HeadingPitchRange(heading, pitch, range));

        // Reset view, so that users can move over map instead of rotating arount an point
        this.worldmap3d.viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
    }

    /**
     * Goes to the model. Jumps or flys depending on the Worldmap3d option
     * flyToModelAnimations. Executes all functions registred on the
     * executeOnGoToModelFunctions option.
     * 
     * @param {Model} model (Worldmap3d) Model object
     * @param {Integer} loc Location id to goto
     * @returns {undefined}
     */
    gotoModel(model, loc) {
        if (this.worldmap3d.options.flyToModelAnimations) {
            // Fly to building
            this.flyToModel(model);
        } else {
            this.jumpToModel(model);
        }

        // Execute registred function for onGoToModel
        for (let onGoToModelFunc of this.worldmap3d.options.onGoToModelFunctions) {
            onGoToModelFunc(model, loc);
        }
    }

    /**
     * Jumps the view to the model.
     * 
     * @param {Model} model object from Worldmap3d
     * @returns {undefined}
     */
    jumpToModel(model) {
        if (typeof model === 'undefined') {
            Msg.error('CesiumNavigation', 'jumpToModel called without a model.');
            return;
        }
        // Get default look angles
        let heading = Cesium.Math.toRadians(this.worldmap3d.options.modelheading);
        let pitch = Cesium.Math.toRadians(this.worldmap3d.options.modelpitch);
        // Set current values of SWAC_cesiuSm
        this.worldmap3d.view.heading = this.worldmap3d.options.modelheading;
        this.worldmap3d.view.pitch = this.worldmap3d.options.modelpitch;

        // Zoom for primitive or entity
        if (typeof model.drawnref.boundingSphere !== 'undefined') {
            // Zoom to primitive
            let camera = this.worldmap3d.viewer.camera;
            let controller = this.worldmap3d.viewer.scene.screenSpaceCameraController;
            let r = 2.0 * Math.max(model.drawnref.boundingSphere.radius, camera.frustum.near);
            controller.minimumZoomDistance = r * 0.5;
            let center = Cesium.Matrix4.multiplyByPoint(model.drawnref.modelMatrix, model.drawnref.boundingSphere.center, new Cesium.Cartesian3());
            // Calculate optimal view distance
            this.worldmap3d.view.optdistances[model.file.url] = r * 2.0;
            camera.lookAt(center, new Cesium.HeadingPitchRange(heading, pitch, this.worldmap3d.view.optdistances[model.file.url]));
        } else {
            this.worldmap3d.view.optdistances[model.file.url] = 120;
            if (model.drawnref.subs) {
                this.worldmap3d.viewer.zoomTo(model.drawnref.subs[0], new Cesium.HeadingPitchRange(
                        heading,
                        pitch));
            } else {
                // Zoom to entity
                this.worldmap3d.viewer.zoomTo(model.drawnref, new Cesium.HeadingPitchRange(
                        heading,
                        pitch));
            }
        }
    }

    flyToModel(model) {
        //TODO Muss noch ueberarbeitet werden
        // Get metadata
        this.worldmap3d.getMetadata(hid).then(function (metadata) {
            // Get center of building
            var lon = metadata.locations[loc].centre.lon;
            var lat = metadata.locations[loc].centre.lat;
            var height = metadata.locations[loc].centre.height;

            // Reset heading to near south
            this.worldmap3d.view.heading = 0.0;
            this.worldmap3d.view.pitch = -33.0;

            // Fly to center
            //TODO optimize orientation
            this.worldmap3d.viewer.camera.flyTo({
                duration: 4,
                destination: Cesium.Cartesian3.fromDegrees(lon, lat, 50)
//            orientation: {
//                heading: Cesium.Math.toRadians(175.0),
//                pitch: Cesium.Math.toRadians(-35.0),
//                roll: 0.0
//            }
            });

//        var center = Cesium.Cartesian3.fromDegrees(lon, lat);
//        Worldmap3d.viewer.camera.lookAt(center, new Cesium.Cartesian3(10.0, -10.0, 10.0));

            this.worldmap3d.jumpToBuilding(hid, loc);
        }).catch(function (error) {
            console.error('ERROR (cesium): Could not load metadata for building >' + hid + '< because of: ' + error);
        });

        // Load and draw ground and infos
        this.worldmap3d.drawGround(hid, loc);

        // Load and draw model
        var modelPromise = this.worldmap3d.drawModel(hid);
        modelPromise.then(function (model) {

        });
    }

    /**
     * Gos to a position given in naviagtor.geolocation format
     * If animation is actived the goto will be animated.
     * 
     * @param {type} position
     * @returns {undefined}
     */
    gotoPosition(position) {
        if (this.worldmap3d.options.flyToPositionAnimations) {
            this.flyToPosition(position);
        } else {
            this.jumpToPosition(position);
        }
    }

    /**
     * Jumps to a position given in navigator.geolocation format
     * So position must have: coords.longitude, coords.latitude
     * 
     * @param {type} position
     * @returns {undefined}
     */
    jumpToPosition(position) {
        var center = Cesium.Cartesian3.fromDegrees(position.coords.longitude, position.coords.latitude);
        this.worldmap3d.viewer.camera.lookAt(center, new Cesium.Cartesian3(0.0, 0.0, 1005.0));
    }

    /**
     * Flies to a position given in navigator.geolocation format
     * So position must have: coords.longitude, coords.latitude
     * 
     * @param {type} position
     * @returns {undefined}
     */
    flyToPosition(position) {
        this.worldmap3d.viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(position.coords.longitude, position.coords.latitude, 1005.0)
        });
    }
}
