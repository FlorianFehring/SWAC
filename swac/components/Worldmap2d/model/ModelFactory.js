import SWAC from '../../../swac.js';
import Msg from '../../../Msg.js';
import Worldmap2d from './../Worldmap2d.js';
//import SEGLTF from './SEGLTF.js';
//import Tileset from './Tileset.js';
import GeoJson from './GeoJson.js';
import Shapefile from './Shapefile.js';
import GeneralDataJson from './GeneralDataJson.js';
import GeoTiff from './GeoTiff.js';
import WMS from './WMS.js';

/* 
 * Function for createing a model from url.
 * The model factory keeps care about loading efficent models, avoiding to
 * load the same model multiple times.
 */

var modelFactory = {};
// List of loaded models their filename is the index
modelFactory.loadedModels = {};

/** Loads a model with its load function 
 * 
 * @param {String} url URL to models file
 * @param {HTMLElement} requestor Element requestion the visualisation
 * @param {Object} visoptions Object with visualisation options (possible options
 * depending on the Model class)
 * @returns {Promise} Promise that returns a Model object on succsess
 */
modelFactory.loadModel = function (url, requestor, visoptions) {
    let thisRef = this;
    return new Promise((resolve, reject) => {
        // Check if model was loaded before
        if (typeof modelFactory.loadedModels[url] !== 'undefined') {
            Msg.warn('ModelFactory', 'Useing model >' + url + '< from previous load.');
            resolve(modelFactory.loadedModels[url]);
            return;
        }

        // Determine type
        if (!visoptions.type) {
            visoptions.type = 'unknown';
            if (url.endsWith('.geojson'))
                visoptions.type = 'GEOJSON';
            else if (url.includes('geojson')) {
                visoptions.type = 'GEOJSON';
            } else if (url.endsWith('.json')) {
                visoptions.type = 'JSON';
            } else if (url.endsWith('.tif')) {
                visoptions.type = 'GEOTIFF';
            } else if (url.toLowerCase().includes('service=wms') || url.toLowerCase().includes('request=getcapabilities')) {
                visoptions.type = 'WMS';
            }
        }

        let model = null;
        if (visoptions.type.toUpperCase() === 'GEOJSON') {
            model = new GeoJson(requestor, visoptions);
        } else if (visoptions.type.toUpperCase() === 'SHAPEFILE' || visoptions.type.toUpperCase() === 'SHAPE') {
            model = new Shapefile(requestor, visoptions);
        } else if (visoptions.type.toUpperCase() === 'JSON') {
            model = new GeneralDataJson(requestor, visoptions);
        } else if (visoptions.type.toUpperCase() === 'GEOTIFF') {
            model = new GeoTiff(requestor, visoptions);
        } else if (visoptions.type.toUpperCase() === 'WMS') {
            model = new WMS(requestor, visoptions);
            model.name = visoptions.name;
            model.load(url);
            modelFactory.loadedModels[url] = model;
            resolve(model);
            return;
        } else {
            let modalElem = document.querySelector('.swac_worldmap2d_addModelDialog');
            let typeSelElem = document.querySelector('.swac_worldmap2d_typeselect');
            typeSelElem.value = 'none';
            UIkit.modal(modalElem).show();
            typeSelElem.addEventListener('change', function (e) {
                // Do not go forward if the entry "select type" was selected
                if (typeSelElem.value === 'none')
                    return;
                // Use type to load file
                visoptions.type = typeSelElem.value;
                thisRef.loadModel(url, requestor, visoptions).then(function (m) {
                    resolve(m);
                });
                UIkit.modal(modalElem).hide();
            });
            return;
        }
        model.name = visoptions.name;
        fetch(url).then(function () {
            model.load(url).then(function () {
                modelFactory.loadedModels[url] = model;
                resolve(model);
            }).catch(function (e) {
                reject(e);
            });
        }).catch(function (e) {
            if (e.toString().indexOf('NetworkError') > 0) {
                // Try download file
                if (requestor.swac_comp.options.corsavoidurl) {
                    Msg.flow('ModelFactory', 'Try to download file >' + url + '< to avoid CORS.', requestor);
                    let corsurl = requestor.swac_comp.options.corsavoidurl.replace('%url%', url);
                    fetch(corsurl, {method: "post",
                        headers: {
                            'Accept': 'application/json'
                        }
                    }).then(function (res) {
                        // Get path to new file from answer (even if file was not stored in filespace db file is downloaded)
                        res.json().then(function (data) {
                            if (data.mimetype === 'text/html') {
                                UIkit.modal.alert(SWAC.lang.dict.Worldmap2d.fileurl_html.replace('%url%', url));
                                reject();
                                return;
                            }
                            if (data.errors[0].startsWith('Error downloading file')) {
                                UIkit.modal.alert(SWAC.lang.dict.Worldmap2d.fileurl_error);
                                reject(e);
                            }
                            model.load('/' + data.path).then(function () {
                                modelFactory.loadedModels['/' + data.path] = model;
                                resolve(model);
                            }).catch(function (e) {
                                reject(e);
                            });
                        });
                    }).catch(function (e) {
                        Msg.error('ModelFactory', 'Could not use file download to avoid cors: ' + e, requestor);
                        UIkit.modal.alert(SWAC.lang.dict.Worldmap2d.fileurl_error);
                        reject(e);
                    });
                }
            } else {
                Msg.error('ModelFactory', 'Could not download file: ' + e, requestor);
                UIkit.modal.alert(SWAC.lang.dict.Worldmap2d.fileurl_error);
            }
        });
    });
};

/**
 * Loads the model with the highest level from the model given by url.
 * The level is calculated from priority pattern list.
 * Worldmap.options.model_priorities
 * 
 * @param {String} url URL to the known modelfile
 * @param {SWACRequestor} requestor DOMElement requesting the globe
 * @returns {Promise} Promise that resolves with the model file which has the highest priority.
 */
modelFactory.loadHighestLevelModel = function (url, requestor) {
    return new Promise((resolve, reject) => {
        // Get file ending from url
        let filenameEndPos = url.lastIndexOf('.');
        let filepath = url.substring(0, filenameEndPos);
        let priorityFileUrl = url;
        let priorityFound = false;
        // Look at each priority from top (0) to low (n)
        for (let pattern of Worldmap2d.options.model_priorities) {
            let searchFilePath = pattern.replace('{filepath}', filepath);
            // Look at SWAC storage if there is such a file (should be there once it was searched)
            for (let file in window.swac.storage.files) {
                if (file === searchFilePath && window.swac.storage.files[file].filestatus < 400) {
                    priorityFileUrl = searchFilePath;
                    priorityFound = true;
                    break;
                }
            }
            if (priorityFound) {
                break;
            }
        }

        this.loadModel(priorityFileUrl, requestor)
                .then(function (model) {
                    resolve(model);
                })
                .catch(function (error) {
                    reject(error);
                });
    });
};
export default modelFactory;