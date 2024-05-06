import Msg from '../../../Msg.js';
import MapModel from './MapModel.js';
/*
 * Class for representing shapefile
 */
export default class Shapefile extends MapModel {
    /**
     * Creates a new shapefile model
     *
     * @param {HTMLElement} requestor Presentation requestion element
     * @param {Object} options Visualisation options. Supported options are:
     * - extrudeHeightProperty Name of the value in the geojson object, that should be
     * used to calculate the extrusion height.
     * - fillColor Default color (css string or rgba hex code) of models (white if no setting is given)
     * - outlineColor Default color of models border (black if no setting is given)
     * - outlineWidth Width of the outline (1 if no setting is given)
     * - fillColorProperty Property from data that should be used as color for the model
     * - outlineColorProperty Property from data that should be used as color for the models outline
     * - datacaptionProperty Name of the property that's value should be used for the caption
     * - datadescription SWAC_datadescription component with descdata describing the data
     * If the datadescription is set all property names are evaluated against the
     * datadescription data, if this failes the fallback is to use the data from the model.
     * 
     * @returns {Model}
     */
    constructor(requestor, options) {
        super(requestor, options);
        this._drawnref = {
            subs: []  // List of entities drawn by the last called draw()
        };
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
        return new Promise((resolve, reject) => {
            resolve();
        });
    }

    /**
     * Draws the model to the map
     *
     * @param {Viewer} viewer Viewer instance
     * @returns {Promise} Resolves with the cesium model reference when the model is drawn
     */
    draw(viewer) {
        let thisRef = this;
        return new Promise((resolve, reject) => {
            let shapefileLayer = new L.Shapefile(this._filepath, {
                onEachFeature: (feature, layer) => {
                    if (feature.properties) {
                        layer.bindPopup(Object.keys(feature.properties).map(k => k + ": " + feature.properties[k]).join("<br />"), {
                            maxHeight: 200
                        });
                    }
                },
                // important to use the correct importURL for the shp.js library
                importUrl: '/SWAC/swac/libs/leaflet/shapefile/shp.js'
            });
            thisRef._requestor.swac_comp.layerControl.addOverlay(shapefileLayer, this.options.shapefileName ? this.options.shapefileName : 'Shapefile');
            shapefileLayer.addTo(viewer);

            shapefileLayer.once("data:loaded", () => {
                Msg.info('Shapefile loaded.', this.requestor);
                resolve();
            });
            shapefileLayer.once("data:error", (e) => {
                Msg.error("Shapfile error", e, this.requestor);
                reject(e);
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

