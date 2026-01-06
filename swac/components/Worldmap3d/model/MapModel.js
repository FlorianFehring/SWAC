import Msg from '../../../Msg.js';

/* 
 * Superclass of all models that can be shown in cesium
 */
export default class MapModel {

    /**
     * Creates a new model
     * 
     * @param {HTMLElement} requestor Presentation requestion element
     * @param {Object} options Options (possible options depend
     * on the concrete class implementation)
     * @returns {MapModel}
     */
    constructor(requestor, options = {}) {
        this._requestor = requestor;
        this.options = options;
        // Default values
        if (!options || typeof options.fillColor === 'undefined') {
            this.options.fillColor = 'white';
        }
        if (!options || typeof options.outlineColor === 'undefined') {
            this.options.outlineColor = 'black';
        }
        if (!options || typeof options.outlineWidth === 'undefined') {
            this.options.outlineWidth = 10;
        }
        this._filepath = null;
        this._drawnref = null;
        this._locations = [];
        this._locationCalculated = false;
    }

    /**
     * Loads the model from file. The recived data will be the models data.
     * 
     * @param {String} filepath Path to the file
     * @returns {Promise} Resolves when the model is loaded
     */
    load(filepath) {
        return this.loadJson(filepath);
    }

    /**
     * Default load implementation for loading json files.
     * 
     * @param {String} filepath Path to the json file to load
     * @returns {Promise} Resolves when the model is loaded
     */
    loadJson(filepath) {
        this._filepath = filepath;
        return new Promise((resolve, reject) => {
            let data = this.getFromStorage();
            if (data !== null) {
                resolve();
            }
            let modelobj = this;

            // Load file
            fetch(this._filepath).then(
                    function (response) {
                        // Check if place for metadata of file exists                          
                        if (typeof window.swac.storage.files[modelobj._filepath].metainfo === 'undefined') {
                            window.swac.storage.files[modelobj._filepath].metainfo = {};
                        }

                        window.swac.storage.files[modelobj._filepath].metainfo.filestatus = response.status;
                        if (response.status >= 400 && response.status < 600) {
                            reject("MapModel >" + modelobj._filepath + "< not accessable.");
                        } else {
                            response.json().then(function (data) {
                                window.swac.storage.files[modelobj._filepath].data = data;
                                Msg.warn('MapModel', 'Model >'
                                        + modelobj._filepath + '< succsessfull loaded.');
                                resolve();
                            }).catch(function (error) {
                                reject("Data for Model >" + modelobj._filepath + "< could not be parsed: " + error);
                            });
                        }
                    }).catch(function (error) {
                reject('Model >' + modelobj._filepath + '< could not be loaded: ' + error);
            });
        });
    }

    preLoad(filepath) {
        this._filepath = filepath;
        return new Promise((resolve, reject) => {
            let data = this.getFromStorage();
            if (data !== null) {
                resolve(data);
            }
            let modelobj = this;

            // Load file
            fetch(this._filepath, {method: 'HEAD'}).then(
                    function (response) {
                        // Check if place for metadata of file exists                          
                        if (typeof window.swac.storage.files[modelobj._filepath].metainfo === 'undefined') {
                            window.swac.storage.files[modelobj._filepath].metainfo = {};
                        }

                        window.swac.storage.files[modelobj._filepath].metainfo.filestatus = response.status;
                        if (response.status >= 400 && response.status < 600) {
                            reject("Model >" + modelobj._filepath + "< not acessable.");
                        } else {
                            resolve();
                        }
                    }).catch(function (error) {
                reject('Model >' + modelobj._filepath + '< is not accessable: ' + error);
            });
        });
    }

    /**
     * Gets the data of this model.
     * 
     * @return Object model json data
     */
    get data() {
        return this.file.data;
    }

    /**
     * Gets the path to the file backing this model
     * 
     * @return String path to the file
     */
    get filepath() {
        return this.file.data.filepath;
    }

    /**
     * Gets the name of the model as it is defined inside the model data
     * 
     * @return {String} Name of the model, or null if the data does not contains one
     */
    get modelname() {
        throw new Error("Subclasses have to implement this method");
    }

    /**
     * Gets an array of locations belonging to this model.
     * 
     * @return Object[Object[]] with location objects within objects representing one submodel. 
     * ["name": "submodelname", "locations" : [
     * {
     * "city":{"zip":"33689","name":"Bielefeld / Sennestadt","ags":"5711000"},
     * "street":"Elbeallee",
     * "house_no":136,
     * "centre":{"lon":8.592942059003976,"lat":51.949036307298314},
     * "relative_importance":1
     * }
     * ,
     * {
     * "city":{"zip":"33689","name":"Bielefeld / Sennestadt","ags":"5711000"},
     * "street":"Elbeallee",
     * "house_no":138,
     * "relative_importance":0
     * }
     * ]]
     */
    get locations() {
        return this._locations;
    }

    /**
     * Gets the cesium entity reference (may be primitve or entity)
     * 
     * @return {Object} Cesium entity reference, null if not drawn
     */
    get drawnref() {
        return this._drawnref;
    }

    /** 
     * Checks if the model is allready drawn.
     * 
     * @return boolean True if the model is allready drawn, false otherwise
     */
    get isDrawn() {
        if (this._drawnref !== null) {
            return true;
        }
        return false;
    }

    /**
     * Draws the model to the cesium globe
     * 
     * @param {CesiumViewer} viewer Viewer instance of cesium
     * @returns {Promise} Resolves with the cesium model reference when the model is drawn
     */
    draw(viewer) {
        throw new Error("Subclasses have to implement this method");
    }

    /**
     * Erases the model from the cesium clobe
     * 
     * @param {CiesiumViewer} viewer Viewer instance of cesium
     * @returns {undefined}
     */
    erase(viewer) {
        throw new Error("Subclasses have to implement this method");
    }

    /**
     * Gets the model from SWAC storage.
     * 
     * @returns {Object} Dataobject representing the models data
     */
    getFromStorage() {
        // Bind to storage
        if (typeof window.swac.storage.files[this._filepath] === 'undefined') {
            window.swac.storage.files[this._filepath] = {};
            window.swac.storage.files[this._filepath].url = this._filepath;
        }
        this.file = window.swac.storage.files[this._filepath];

        // Prevent model from loading more than once
        if (typeof window.swac.storage.files[this._filepath].data !== 'undefined') {
            return window.swac.storage.files[this._filepath].data;
        }
        return null;
    }

    getVisualValues(modeldata) {
        let datadescComp = null;
        if (this.options.datadescription) {
            datadescComp = this.options.datadescription.swac_comp;
        }

        // Start with default values
        let visualValues = {
            fill: this.options.fillColor,
            outline: false,
            outlineColor: this.options.outlineColor,
            outlineWidth: 1,
            extrudeHeight: this.options.extrudeHeight,
            modelName: this._filepath
        };

        // Check if property for color is defined and existing
        if (this.options.fillColorProperty
                && this.options.fillColorProperty !== null
                && modeldata[this.options.fillColorProperty]) {
            if (datadescComp) {
                visualValues.fill = datadescComp.getValueColor(modeldata, null, this.options.fillColorProperty);
            } else {
                // Use value as coloring value
                visualValues.fill = modeldata[this.options.fillColorProperty];
            }
        } else if (datadescComp) {
            visualValues.fill = datadescComp.getValueColor(modeldata, null, null);
        } else {
            Msg.warn('MapModel', 'There is no description component bound and no visoptions set. Model will be colored with default values.');
        }
        
        // check if it is a rgba value
        if (visualValues.fill.startsWith('0x')) {
            visualValues.fill = Cesium.Color.fromRgba(visualValues.fill);
        } else {
            visualValues.fill = Cesium.Color.fromCssColorString(visualValues.fill);
        }

        // Check if property for color is defined and existing
        if (this.options.outlineColorProperty
                && this.options.outlineColorProperty !== null
                && modeldata[this.options.outlineColorProperty]) {
            visualValues.outline = modeldata[this.options.outlineColorProperty];
            if (datadescComp) {
                let outlinedd = datadescComp.getValueColor(modeldata, null, this.options.outlineColorProperty);
                if (outlinedd !== null) {
                    visualValues.outline = outlinedd;
                }
            }
        } else if (datadescComp) {
            visualValues.outline = datadescComp.getValueColor(modeldata, null, null);
        }
        
        // check if it is a rgba value
        if (visualValues.outlineColor.startsWith('0x')) {
            visualValues.outline = true;
            visualValues.outlineColor = Cesium.Color.fromRgba(visualValues.outlineColor);
            visualValues.outlineWidth = this.options.outlineWidth;
        } else if (visualValues.outlineColor && visualValues.outlineColor !== null) {
            visualValues.outline = true;
            visualValues.outlineColor = Cesium.Color.fromCssColorString(visualValues.outlineColor);
            visualValues.outlineWidth = this.options.outlineWidth;
        }

        // Check if property for heigh is defined and existing
        if (this.options.extrudeHeightProperty
                && this.options.extrudeHeightProperty !== null
                && modeldata[this.options.extrudeHeightProperty]) {
            visualValues.extrudeHeight = modeldata[this.options.extrudeHeightProperty];
            if (datadescComp) {
                let extrudeHeightdd = datadescComp.getValueVisData(modeldata, 'extrudeHeight', null, this.options.extrudeHeightProperty);
                if (extrudeHeightdd !== null) {
                    visualValues.extrudeHeight = extrudeHeightdd;
                }
            }
        } else if (datadescComp) {
            visualValues.extrudeHeight = datadescComp.getValueVisData(modeldata, 'extrudeHeight', null);
        }
        
        // Set name of the model
        if (this.options.datacaptionProperty
                && this.options.datacaptionProperty !== null
                && modeldata[this.options.datacaptionProperty]) {
            visualValues.modelName = modeldata[this.options.datacaptionProperty];
            if (datadescComp) {
                let modelNamedd = datadescComp.getValueVisData(modeldata, 'desc', null, this.options.datacaptionProperty);
                if (modelNamedd !== null) {
                    visualValues.modelName = modelNamedd;
                }
            }
        } else if (datadescComp) {
            visualValues.modelName = datadescComp.getValueVisData(modeldata, 'desc', null);
        }
        return visualValues;
    }
}
