import Msg from '../../../Msg.js';
import Worldmap3d from './../Worldmap3d.js';
import SEGLTF from './SEGLTF.js';
import Tileset from './Tileset.js';
import GeoJson from './GeoJson.js';
import GeneralDataJson from './GeneralDataJson.js';

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
    return new Promise((resolve, reject) => {
        // Check if model was loaded before
        if (typeof modelFactory.loadedModels[url] !== 'undefined') {
            Msg.warn('ModelFactory', 'Useing model >' + url + '< from previous load.');
            resolve(modelFactory.loadedModels[url]);
            return;
        }

        let model = null;
        if (url.endsWith('.glb')) {
            model = new SEGLTF(requestor, visoptions);
        } else if (url.endsWith('tileset.json')) {
            model = new Tileset(requestor, visoptions);
        } else if (url.endsWith('.geojson')) {
            model = new GeoJson(requestor, visoptions);
        } else {
            model = new GeneralDataJson(requestor, visoptions);
            //reject('Not supported filetype');
        }
        model.load(url).then(function () {
            modelFactory.loadedModels[url] = model;
            resolve(model);
        }).catch(function (error) {
            reject(error);
        });
    });
};

/**
 * Loads the model with the highest level from the model given by url.
 * The level is calculated from priority pattern list.
 * Worldmap3d.options.model_priorities
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
        for (let pattern of Worldmap3d.options.model_priorities) {
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