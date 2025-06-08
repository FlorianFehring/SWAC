import SWAC from './swac.js';
import Msg from './Msg.js';
import Model from './Model.js';

/* 
 * Class for handling DataWorkers
 */
export default class ComponentHandler {
    constructor() {
    }

    /**
     * Loads a DataWorker
     * 
     * @param {Requestor} requestor defining the Component to load
     * Needs: requestor.id, requestor.componentPath
     * 
     * @returns {Promise<Requestor>} 
     */
    load(requestor) {
        let thisRef = this;
        return new Promise((resolve, reject) => {
            Msg.createStore(requestor);

            if (!requestor.id) {
                Msg.error('ComponentHandler', 'Requestor does not have id attribute.', requestor);
                reject();
                return;
            }
            Msg.flow('ComponentHandler', 'Loading component', requestor);

            this.loadOptions(requestor).then(function (options) {
                // Check if component has activeOn
                thisRef.checkActiveOn(options, requestor).then(function (active) {
                    if (!active) {
                        let inactiveEvent = new CustomEvent('swac_' + requestor.id + '_inactive', {
                            detail: {
                                requestor: requestor
                            }
                        })
                        document.dispatchEvent(inactiveEvent);
                        Msg.info('ComponentHandler','Requestor >' + requestor.id + '< is not active. Check your application configuration to activate it',requestor);
                        resolve();
                        return;
                    }
                    thisRef.loadObject(requestor, options).then(function (comp) {
                        requestor.swac_comp = comp;
                        requestor.observers = [comp];
                        SWAC.lang.loadComponentTranslation(requestor).then(function () {
                            resolve(requestor);
                        }).catch(function (err) {
                            Msg.error('ComponentHandler', 'Could not load translation for >' + requestor.id + '<: ' + err);
                            reject(err);
                        });
                    }).catch(function (err) {
                        Msg.error('ComponentHandler', 'Could not load object code for >' + requestor.id + '<: ' + err);
                        reject(err);
                    });
                }).catch(function (err) {
                    Msg.error('ComponentHandler', 'Could not load object code for >' + requestor.id + '<: ' + err);
                    reject(err);
                });
            }).catch(function (err) {
                if (err)
                    Msg.error('ComponentHandler', 'Could not load options for >' + requestor.id + '<: ' + err);
                reject(err);
            }).finally(function () {
//                let completeEvent = new CustomEvent('swac_component_loaded', {
//                    detail: {
//                        requestor: requestor
//                    }
//                });
//                document.dispatchEvent(completeEvent);
            });
        });
    }

    /**
     * Checks dependend on the existence of a dataset, if the component should be
     * loaded or not.
     * 
     * @param {Object} options Options object of the component
     * @param {SWACRequestor} requestor Requestor that should be shown
     */
    checkActiveOn(options, requestor) {
        return new Promise((resolve, reject) => {
            if (!options.activeOn) {
                resolve(true);
            } else {
                Model.load(options.activeOn).then(function (res) {
                    if (res.find(set => set)) {
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                }).catch(function (err) {
                    Msg.error('ComponentHandler', 'Could not check active state for >' + requestor.id + '<: ' + err);
                    reject(err);
                });
            }
        });
    }

    /**
     * Loads the options from the variable whose name is given with OPTIONS
     * keyword in swac statement, from global variable [requestor_name]_options or
     * from backend useing the OPTIONS value as source interface.
     * 
     * @param {Requestor} requestor Requestor for wich options should be loaded
     * Needs: requestor.id, requestor.optionsName
     * Sets: requestor.optionsSource (local | model)
     * @returns {Promise<ComponentOptions>}
     */
    loadOptions(requestor) {
        return new Promise((resolve, reject) => {
            // Create options store in loading component
            let options = {};
            Msg.flow('ComponentHandler', 'Load options for >' + requestor.id + '<', requestor);
            if (window[requestor.optionsName]) {
                // Inject options from global variable if exists
                options = window[requestor.optionsName];
                Msg.info('ComponentHandler',
                        '>' + requestor.id + '< runs with custom options from variable >' + requestor.optionsName + '<', requestor);
                options.optionsSource = 'local';
                this.updateOptsFromURL(options, requestor, resolve)
            } else if (window[requestor.id + '_options']) {
                options = window[requestor.id + '_options'];
                requestor.optionsSource = '_options variable';
                Msg.info('ComponentHandler',
                        '>' + requestor.id + '< runs with custom options from variable >' + requestor.id + '_options' + '<', requestor);
                this.updateOptsFromURL(options, requestor, resolve)
            } else if (requestor.optionsName) {
                let optionsRequestor = {
                    fromName: requestor.optionsName
                };
                let thisRef = this;
                // Get options from datasource
                Model.load(optionsRequestor).then(function (optionsdata) {
                    options = optionsdata;
                    Msg.info('ComponentHandler',
                            '>' + requestor.id + '< runs with custom options from datasource >' + requestor.optionsName + '<', requestor);
                    options.optionsSource = 'model';
                    thisRef.updateOptsFromURL(options, requestor, resolve)
                }).catch(function (error) {
                    Msg.error('ComponentHandler',
                            'Could not load options for >' + requestor.id + '<: ' + error, requestor);
                    reject();
                });
            } else {
                this.updateOptsFromURL(options, requestor, resolve);
            }
        });
    }

    updateOptsFromURL(options, requestor, resolve) {
        // check options in url params
        let urlParams = new URLSearchParams(window.location.search);
        for (let [key, value] of urlParams) {
            if (key.startsWith(requestor.id + '_')) {
                options[key.replace(requestor.id + '_', '')] = value;
            }
        }

        if (Object.keys(options).length === 0 && options.constructor === Object) {
            Msg.hint('ComponentHandler', 'There are no custom options. '
                    + 'Useing defaults. You can specify options by defining '
                    + 'window["' + requestor.id + '_options"] = {}', requestor);
        }
        resolve(options);
    }

    /**
     * Loads the DataWorkers class and creates a new instance of the DataWorker
     * 
     * @param {Requestor} requestor Requestor for wich options should be loaded
     * Needs: requestor.componentPath, 
     * Sets: requestor.swac_comp
     * @param {Object} options Options for the DataWorker
     * @returns {Promise<Requestor>}
     */
    loadObject(requestor, options) {
        return new Promise((resolve, reject) => {
            let thisRef = this;
            if (!requestor.componentPath) {
                Msg.error('ComponentHandler', 'requestor.componentPath is missing for requestor: ' + requestor.id, requestor);
                reject('requestor.componentPath is missing');
                return;
            }
            // Load component script
            import(requestor.componentPath + '?ver=' + SWAC.desc.version)
                    .then(module => {
                        // Check if object is available
                        if (module.default) {
                            if(module.default.name && module.default.name === 'OfflineComponent') {
                                Msg.error('ComponentHandler','Component >' + requestor.componentPath + '< is offline not available.');
                            }
                            // Create component to load dependencies
                            let comp = Reflect.construct(module.default, [options]);
                            comp.requestor = requestor;
                            // Load dependencies
                            thisRef.loadDependencies(comp).then(function () {
                                resolve(comp);
                            }).catch(function (err) {
                                reject(err);
                            });
                        } else {
                            Msg.error('ComponentHandler',
                                    '>export default< for >' + requestor.componentPath
                                    + '< could not be found.', requestor);
                            reject();
                        }
                    });
        });
    }

    /**
     * Loads all dependencies for the given compoennt.
     * 
     * @returns {Promise<void>} Promise that resolves, when all dependencies are loaded
     */
    loadDependencies(comp) {
        return new Promise((resolve, reject) => {
            Msg.flow('ComponentHandler', 'Load dependencies for >'
                    + comp.name + '< from requestor >'
                    + comp.requestor.id + '<', comp.requestor);

            // Check if component has dependencies
            if (typeof comp.desc === 'undefined'
                    || typeof comp.desc.depends === 'undefined'
                    || comp.desc.depends.length <= 0) {
                resolve();
                return;
            }

            // put all dependency on the stack
            let dependencyStack = [];
            for (let depNo in comp.desc.depends) {
                if(typeof comp.desc.depends[depNo].loadon === 'undefined' || comp.desc.depends[depNo].loadon)
                    dependencyStack.push(comp.desc.depends[depNo]);
            }
            SWAC.loadDependenciesStack(dependencyStack, comp).then(function () {
                if (comp.dependenciesLoaded()) {
                    resolve();
                } else {
                    Msg.error('ComponentHandler',
                            'Could not load all dependencies from >'
                            + comp.name + '<', comp.requestor);
                    reject();
                }
            });
        });
    }

    /**
     * Loads the data for a DataWorker
     * 
     * @param {Requestor} requestor Requestor for wich data should be loaded
     * @returns {Promise<Object>}
     */
    loadData(requestor) {
        return new Promise((resolve, reject) => {
            // Get fromName from URL if available
            let dataurlParam = requestor.swac_comp.options.dataurlparam;
            if(!dataurlParam) {
                dataurlParam = requestor.id+'_data';
            }
            let fromNameURL = SWAC.getParameterFromURL(dataurlParam);
            if(fromNameURL)
                requestor.fromName = fromNameURL;
            // Resolve if no data is requested
            if (!requestor.fromName || requestor.fromName === 'none') {
                Msg.info('ComponentHandler', 'No data requested', requestor);
                resolve(null);
                return;
            }
            // Set default mainSource
            //TODO unify this with other ways adding data
            requestor.swac_comp.options.mainSource = requestor.fromName;
            // Load the data
            Model.load(requestor, requestor.swac_comp).then(function (dataCapsule) {
                resolve(dataCapsule);
            }).catch(function (err) {
                reject(err);
            });
        });
    }

    /**
     * Initialise
     * 
     * @param {Requestor} requestor Requestor whichs component should be initilized
     * Requiers: requestor.swac_comp, requestor.id 
     * @returns {Promise<Requestor>} Promise from the component init function
     */
    init(requestor, performreact = true) {
        return new Promise((resolve, reject) => {
            Msg.flow('ComponentHandler', 'Initilising component', requestor);
            // Check if init function is available
            if (typeof requestor.swac_comp.init === 'function') {
                requestor.swac_comp.init().then(function () {
                    if (performreact)
                        SWAC.reactions.performReactions();
                    requestor.swac_comp.initPluginSystem().then(function () {
                        resolve(requestor);
                    }).catch(function (err) {
                        reject(err);
                    });
                }).finally(function () {
                    let completeEvent = new CustomEvent('swac_component_loaded', {
                        detail: {
                            requestor: requestor
                        }
                    });
                    document.dispatchEvent(completeEvent);
                });
            } else {
                Msg.warn('ComponentHandler', "Component >" + requestor.dataworkername + "< has no initiliser.");
                resolve(requestor);
            }
//        }).catch(function (error) {
//            Msg.error('ComponentHandler',
//                    'Could not init for requestor >' + requestor.id + '<: '
//                    + error, requestor);
//            reject();
        });
    }
}
