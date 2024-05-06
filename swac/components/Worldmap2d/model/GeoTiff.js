import Msg from '../../../Msg.js';
import MapModel from './MapModel.js';
/*
 * Class for representing Geotiff
 */
export default class Geotiff extends MapModel {
    /**
     * Creates a new Geotiff model
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
            fetch(this._filepath)
            .then(response => response.arrayBuffer())
            .then(arrayBuffer => {
                parseGeoraster(arrayBuffer).then(georaster => {
                /*
                    GeoRasterLayer is an extension of GridLayer,
                    which means can use GridLayer options like opacity.

                    Just make sure to include the georaster option!

                    Optionally set the pixelValuesToColorFn function option to customize
                    how values for a pixel are translated to a color.

                    https://leafletjs.com/reference.html#gridlayer
                */
                const GeotiffLayer = new GeoRasterLayer({
                    georaster: georaster,
                    opacity: 0.7,
                    // pixelValuesToColorFn: values => values[0] === 42 ? '#ffffff' : '#000000',
                    resolution: 64, // optional parameter for adjusting display resolution
                });

                thisRef._requestor.swac_comp.layerControl.addOverlay(GeotiffLayer, this.options.name ? this.options.name : 'Geotiff');
                GeotiffLayer.addTo(viewer);
                viewer.fitBounds(GeotiffLayer.getBounds());

                Msg.info('Geotiff loaded.', thisRef._requestor.id);
                resolve();

                });
            })
            .catch(e => {
                Msg.error("Geotiff error.", e, thisRef._requestor.id);
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
