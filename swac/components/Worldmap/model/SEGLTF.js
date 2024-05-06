import Msg from '../../../Msg.js';
import MapModel from './MapModel.js';
/* 
 * Class for representing segltf files.
 */

export default class SEGLTF extends MapModel {
    constructor(requestor, visoptions) {
        super(requestor, visoptions);
        this.modelScale = 1;
        this.debugShowBoundingVolume = false;
        this.debugWireframe = false;
    }

    /**
     * Loads the model from file. The recived data will be the models data.
     * 
     * @param {String} filepath Path to the file
     * @returns {Promise}
     */
    load(filepath) {
        let modelobj = this;
        return new Promise((resolve, reject) => {
            this.preLoad(filepath).then(function (data) {
                // Only load if it isnt allready loaded
                if (typeof data === 'undefined') {
                    let gltfRequestor = {
                        url: filepath,
                        modelMatrix: Cesium.Matrix4.IDENTITY, // This is the default value
                        upAxis: Cesium.Axis.Z, // This avoids recalculation of coordinates (important for models with geocentric coordinates)
                        forwardAxis: Cesium.Axis.X, // This avoids recalculation of coordinates
                        scale: modelobj.modelScale,
                        debugShowBoundingVolume: modelobj.debugShowBoundingVolume,
                        debugWireframe: modelobj.debugWireframe
                    };
                    // Create model and store it
                    window.swac.storage.files[modelobj._filepath].data = Cesium.Model.fromGltf(gltfRequestor);

                    Msg.warn('SEGLTF', 'Model >'
                            + modelobj._filepath + '< succsessfull loaded.');

                    // Get url of groundjson
                    let geojsonurl = window.swac.storage.files[modelobj._filepath].url.replace('.glb', '.geojson');

                    modelFactory.loadModel(geojsonurl).then(function (geojson) {
                        Msg.warn('SEGLTF', 'Loaded geojson with metadata for ' + filepath);
                        modelobj._locations = geojson.locations;
                        modelobj._geojson = geojson;
                        resolve();
                    }).catch(function (error) {
                        Msg.error('SEGLTF', 'Could not load metadata for ' + filepath + ' error: ' + error);
                        resolve();
                    });
                }
            }).catch(function (error) {
                reject(error);
            });
        });
    }

    /**
     * Draws the model to the cesium globe
     * 
     * @param {CesiumViewer} viewer Viewer instance of cesium
     * @returns {Promise} Resolves with the cesium model reference when the model is drawn
     */
    draw(viewer) {
        let thisModel = this;
        return new Promise((resolve, reject) => {
            // Check if model was drawn before
            if (this._drawnref !== null) {
                resolve(this._drawnref);
                return;
            }

            // Check if model was loaded succsessfull
            if (typeof window.swac.storage.files[this._filepath] === 'undefined') {
                reject('Could not draw SEGLTF model >' + this._filepath + ' because it was not loaded.');
                return;
            }

            // Add model to globe
            let modelReference = viewer.scene.primitives.add(window.swac.storage.files[this._filepath].data);
            thisModel._drawnref = modelReference;
            // Wait for model to be ready
            modelReference.readyPromise.then(function (loadedmodel) {
                Msg.warn('SEGLTF', 'Model >' + loadedmodel._resource._url + '< succsessfull drawn.');
                loadedmodel._swacmodel = thisModel;

                thisModel.colorFromGeojson();

                resolve(modelReference);
            });
            // React on errors
            modelReference.readyPromise.otherwise(function (error) {
                Msg.error('SEGLTF', 'The following error occured while trying to render the model: ' + error);
                reject('The following error occured while trying to render the model: ' + error);
            });
        });
    }

    /**
     * Colors this model based on data from the refrenced geojson
     * 
     * @returns {undefined}
     */
    colorFromGeojson() {
        // Get properties (first feature set only)
        let props = this._geojson.data.features[0].properties;
        let visualValues = this.getVisualValues(props);
        this._drawnref.color = visualValues.fill;
        if (visualValues.outline) {
            this._drawnref.silhouetteColor = visualValues.outlineColor;
            this._drawnref.silhouetteSize = visualValues.outlineWidth;
            this._drawnref.height = 1;
        }
        this._drawnref.id = visualValues.name;
    }

    /**
     * Parses the segltf content and associates it with the descriptor in the
     * models storage
     *
     * @param {type} hid building number
     * @param {type} segltf content of the model file
     * @returns {undefined}
     */
//    parseSEGLTF = function (hid, segltf) {
//        var jsonStartPos = segltf.indexOf('JSON{');
//        var binStartPos = segltf.indexOf('BIN');
//        var segltfjson = segltf.substring(jsonStartPos + 4, binStartPos);
//        // Get end position of json
//        var jsonEndPos = segltfjson.lastIndexOf('}');
//        segltfjson = segltfjson.substring(0, jsonEndPos + 1);
//        Worldmap.models[hid] = {};
//        Worldmap.models[hid].descriptor = JSON.parse(segltfjson);
//    }
}
