import Msg from '../../../Msg.js';
import MapModel from './MapModel.js';
/*
 * Class for representing geo json
 */
export default class GeoJson extends MapModel {
    /**
     * Creates a new geojson model
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
        let thisModel = this;
        return new Promise((resolve, reject) => {
            super.loadJson(filepath).then(function () {
                let lastSlashPos = filepath.lastIndexOf("/");
                let startGeoPos = filepath.indexOf('.geojson');
                let fileName = filepath.substring(lastSlashPos + 1, startGeoPos);
                thisModel._locations = [];

                for (let featureNo in thisModel.file.data.features) {
                    let feature = thisModel.file.data.features[featureNo];
                    // Check if the feature have locations
                    if (feature.properties && feature.properties.locations) {
                        for (let locationId in feature.properties.locations) {
                            let location = feature.properties.locations[locationId];
                            // Check if feature has a title
                            if (!location.title && feature.properties && feature.properties.title) {
                                location.title = feature.properties.title;
                            } else if (!location.title) {
                                location.title = fileName + '[' + featureNo + ']';
                            }

                            // Check if feature has a description
                            if (!location.description && feature.properties && feature.properties.description) {
                                location.description = feature.properties.description;
                            }
                            thisModel._locations.push(location);
                        }
                    }
                }

                resolve();
            }).catch(function (error) {
                Msg.error('GeoJson', 'Error occured while loading >'
                        + filepath + '< ' + error);
                reject();
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
        let model = this;
        return new Promise((resolve, reject) => {
            // Check if model was drawn before
            if (model._drawnref.subs.length > 0) {
                resolve(model._drawnref);
                return;
            }

            Cesium.GeoJsonDataSource.load(model._filepath, {
                markerSymbol: '?',
                clampToGround: false
            }).then(
                    function (dataSource) {
                        model._drawnref = dataSource;
                        model._drawnref.subs = [];
                        let subModels = dataSource.entities.values;
                        let datadescComp = null;
                        if (model.options.datadescription) {
                            datadescComp = model.options.datadescription.swac_comp;
                        } else {
                            Msg.warn('GeoJson', 'There is no description component bound and no visoptions set. Model will be colored with default values.');
                        }

                        for (var j = 0; j < subModels.length; j++) {
                            subModels[j].groundmodel = model;
                            model._drawnref.subs.push(subModels[j]);
                            // Default values
                            let fill = model.options.fillColor;
                            let outline = model.options.outlineColor;
                            let extrudeHeight = model.options.extrudeHeight;
                            let modelName = model._filepath;

                            // Check if property for color is defined and existing
                            if (model.options.fillColorProperty
                                    && model.options.fillColorProperty !== null
                                    && subModels[j]._properties[model.options.fillColorProperty]) {
                                if (datadescComp) {
                                    fill = datadescComp.getValueColor(subModels[j]._properties, null, model.options.fillColorProperty);
                                } else {
                                    // Use value as coloring value
                                    fill = subModels[j]._properties[model.options.fillColorProperty];
                                }
                            } else if (datadescComp) {
                                fill = datadescComp.getValueColor(subModels[j]._properties, null, null);
                            }
//                            console.log('TEST in draw ' + model._filepath);
//                            console.log('fillcol: ' + fill);
                            // check if it is a rgba value
                            if (fill.startsWith('0x')) {
                                subModels[j].polygon.material = Cesium.Color.fromRgba(fill);
                            } else {
                                subModels[j].polygon.material = Cesium.Color.fromCssColorString(fill);
                            }

                            // Check if property for color is defined and existing
                            if (model.options.outlineColorProperty
                                    && model.options.outlineColorProperty !== null
                                    && subModels[j]._properties[model.options.outlineColorProperty]) {
                                outline = subModels[j]._properties[model.options.outlineColorProperty];
                                if (datadescComp) {
                                    let outlinedd = datadescComp.getValueColor(subModels[j]._properties, null, model.options.outlineColorProperty);
                                    if (outlinedd !== null) {
                                        outline = outlinedd;
                                    }
                                }
                            } else if (datadescComp) {
                                outline = datadescComp.getValueColor(subModels[j]._properties, null, null);
                            }

                            // check if it is a rgba value
                            if (outline.startsWith('0x')) {
                                subModels[j].polygon.outline = true;
                                subModels[j].polygon.outlineColor = Cesium.Color.fromRgba(outline);
                                subModels[j].polygon.outlineWidth = model.options.outlineWidth;
                            } else if (outline && outline !== null) {
                                subModels[j].polygon.outline = true;
                                subModels[j].polygon.outlineColor = Cesium.Color.fromCssColorString(outline);
                                subModels[j].polygon.outlineWidth = model.options.outlineWidth;
                                subModels[j].polygon.height = 0.1;
                            }

                            // Check if property for heigh is defined and existing
                            if (model.options.extrudeHeightProperty
                                    && model.options.extrudeHeightProperty !== null
                                    && subModels[j]._properties[model.options.extrudeHeightProperty]) {
                                extrudeHeight = subModels[j]._properties[model.options.extrudeHeightProperty];
                                if (datadescComp) {
                                    let extrudeHeightdd = datadescComp.getValueVisData(subModels[j]._properties, 'extrudeHeight', null, model.options.extrudeHeightProperty);
                                    if (extrudeHeightdd !== null) {
                                        extrudeHeight = extrudeHeightdd;
                                    }
                                }
                            }
                            // Use default extrudeHeight
                            subModels[j].polygon.extrudedHeight = extrudeHeight;


                            // Set name of the model
                            if (model.options.datacaptionProperty
                                    && model.options.datacaptionProperty !== null
                                    && subModels[j]._properties[model.options.datacaptionProperty]) {
                                modelName = subModels[j]._properties[model.options.datacaptionProperty];
                                if (datadescComp) {
                                    let modelNamedd = datadescComp.getValueVisData(subModels[j]._properties, 'desc', null, model.options.extrudeHeightProperty);
                                    if (modelNamedd !== null) {
                                        modelName = modelNamedd;
                                    }
                                }
                            }
                            subModels[j].name = modelName;
                        }
                        viewer.dataSources.add(dataSource);
                        resolve(dataSource);
                    }
            );
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

