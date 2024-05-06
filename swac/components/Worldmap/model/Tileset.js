import Msg from '../../../Msg.js';
import MapModel from './MapModel.js';
/*
 * Class for representing geo json
 */
export default class Tileset extends MapModel {
    /**
     * Creates a new tileset model
     *
     * @param {HTMLElement} requestor Presentation requestion element
     * @param {Object} visoptions Visualisation options. Supported options are:
     * - extrudeHeightProperty Name of the value in the geojson object, that should be
     * used to calculate the extrusion height.
     * - fillColor Default color (css string or rgba hex code) of models (white if no setting is given)
     * - outlineColor Default color of models border (black if no setting is given)
     * - outlineWidth Width of the outline (1 if no setting is given)
     * - extrudeHeight Default height in meters
     * - fillColorProperty Property from data that should be used as color for the model
     * - outlineColorProperty Property from data that should be used as color for the models outline
     * - extrudeHeightProperty Property from data that should be used for calculating the height
     * - datacaptionProperty Name of the property that's value should be used for the caption
     * - datadescription SWAC_datadescription component with descdata describing the data
     * If the datadescription is set all property names are evaluated against the
     * datadescription data, if this failes the fallback is to use the data from the model.
     * 
     * @returns {Model}
     */
    constructor(requestor, visoptions) {
        super(requestor, visoptions);
    }

    /**
     * Gets the name of the model as it is defined inside the model data
     * Calculates the name out of the location data given.
     *
     * @return {String} Name of the model, or null if the data does not contains one
     */
    get modelname() {
        return null;
    }

    /**
     * Extended json loading for datalist and dataset oriented json data.
     *
     * @param {String} filepath Path to the file to load
     * @returns {Promise} Resolves when the model is loaded
     */
    load(filepath) {
        this._filepath = filepath;
        let thisModel = this;
        return new Promise((resolve, reject) => {
//            super.loadJson(filepath).then(function () {
//                let lastSlashPos = filepath.lastIndexOf("/");
//                let startGeoPos = filepath.indexOf('.geojson');
//                let fileName = filepath.substring(lastSlashPos + 1, startGeoPos);
//                thisModel._locations = [];
//                
//                for (let featureNo in thisModel.file.data.features) {
//                    let feature = thisModel.file.data.features[featureNo];
//                    // Check if the feature have locations
//                    if (feature.properties && feature.properties.locations) {
//                        for (let locationId in feature.properties.locations) {
//                            let location = feature.properties.locations[locationId];
//                            // Check if feature has a title
//                            if (!location.title && feature.properties && feature.properties.title) {
//                                location.title = feature.properties.title;
//                            } else if (!location.title) {
//                                location.title = fileName + '[' + featureNo + ']';
//                            }
//
//                            // Check if feature has a description
//                            if (!location.description && feature.properties && feature.properties.description) {
//                                location.description = feature.properties.description;
//                            }
//                            thisModel._locations.push(location);
//                        }
//                    }
//                }
//
//                resolve();
//            }).catch(function (error) {
//                Msg.error('GeoJson', 'Error occured while loading >'
//                        + filepath + '< ' + error);
//                reject();
//            });
            resolve();
        });
    }

    /**
     * Draws the model to the cesium globe
     *
     * @param {CesiumViewer} viewer Viewer instance of cesium
     * @returns {Promise} Resolves with the cesium model reference when the model is drawn
     */
    draw(viewer) {
        let model = this;
        return new Promise((resolve, reject) => {
            var tileset = viewer.scene.primitives.add(new Cesium.Cesium3DTileset({
                url: model._filepath
            }));
            tileset.readyPromise.then(function(tileset) {
               resolve(); 
            });
        });
    }

    /**
     * Removes an ground object from the map
     *
     * @param {CesiumViewer} viewer Viewer from which to remove
     * @returns {undefined}
     */
    erase(viewer) {
        for (let curEntityref of this._drawnref.subs) {
            viewer.entities.remove(curEntityref);
        }
        this._drawnref.subs = [];
    }
}

