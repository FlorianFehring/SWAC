import SWAC from './swac.js';
import Msg from './Msg.js';
import Model from './Model.js';
import View from './View.js';
import WatchableSource from './WatchableSource.js';
import WatchableSet from './WatchableSet.js';

/**
 * General class for all components and algorithms that work with data
 */
export default class Component {

    /*
     * Constructs a new Module and transfers the config to the
     * object
     */
    constructor(options = {}) {
        this.name;
        // Reference to requesting object
        this.requestor;
        // Component description
        this.desc = {};
        this.desc.text = 'A Component';
        this.desc.depends = [];
        this.desc.reqPerSet = [];
        this.desc.optPerSet = [];
        this.desc.opts = [];

        // Set options
        this.options = options;
        this.desc.opts[1000] = {
            name: "attributeOrder",
            desc: "Establish the order of the attributes from datasets. Attributes that are not in dataset will be not added.",
            example: ["id", "title", "name"]
        };
        if (!this.options.attributeOrder)
            this.options.attributeOrder = ["id", "title", "name"];
        this.desc.opts[1001] = {
            name: "attributeDefaults",
            desc: "Default data values for attributes in datasts, when they are not existing. Defined per datasource.",
            example: new Map([['../../data/exampledata_list.json', {job: 'programmer'}]])
        };
        if (!this.options.attributeDefaults)
            this.options.attributeDefaults = new Map();
        this.desc.opts[1002] = {
            name: "attributeRenames",
            desc: "Renameing of attributes. Define incoming attribute name as key and target name as value",
            example: new Map([['doubleval', 'float'], ['intval', 'long']])
        };
        if (!this.options.attributeRenames)
            this.options.attributeRenames = new Map();
        this.desc.opts[1003] = {
            name: "reloadInterval",
            desc: "Interval in which the component automaticaly reloads its data (-1 to deactivate)",
            example: 30
        };
        if (typeof this.options.reloadInterval === 'undefined')
            this.options.reloadInterval = -1;
        this.desc.opts[1004] = {
            name: "plugins",
            desc: "Configurations for plugins",
            type: 'Map',
            example: 'See plugins help page'
        };
        if (!this.options.plugins)
            this.options.plugins = null;
        this.desc.opts[1005] = {
            name: "saveAlongData",
            desc: "Data that shold be send to the API along with every saveDataset call.",
            example: {someattr: 'with some value'}
        };
        if (!this.options.saveAlongData)
            this.options.saveAlongData = null;

        this.desc.opts[1006] = {
            name: "mainSource",
            desc: "Name / Path of the source that contains the main datasets",
            example: 'mydata.json'
        };
        if (!this.options.mainSource)
            this.options.mainSource = null;

        this.desc.opts[1007] = {
            name: 'parentIdAttr',
            desc: 'Name of the attribute that stores the reference to the parent dataset in child datasets',
            example: 'parent_id'
        };
        if (!options.parentIdAttr)
            this.options.parentIdAttr = 'parent';

        this.desc.opts[1008] = {
            name: "customAfterLoad",
            desc: "Function to execute after components load. Executed in Component context.",
            params: [
                {
                    name: 'requestor',
                    desc: 'Requetor requesting the component',
                    type: 'Requestor'
                }
            ]
        };
        if (!options.customAfterLoad)
            this.options.customAfterLoad = function () {};
        this.desc.opts[1009] = {
            name: 'customBeforeAddSet',
            desc: 'Function to execute before a set is added. Executed in Component context.',
            params: [
                {
                    name: 'set',
                    desc: 'Set going to save',
                    type: 'WatchableSet'
                }
            ]
        };
        if (!options.customBeforeAddSet)
            this.options.customBeforeAddSet = function () {};
        this.desc.opts[1010] = {
            name: 'customAfterAddSet',
            desc: 'Function to execute after a set was added. Executed in Component context.',
            params: [
                {
                    name: 'set',
                    desc: 'Set going to save',
                    type: 'WatchableSet'
                }
            ]
        };
        if (!options.customAfterAddSet)
            this.options.customAfterAddSet = function () {};
        this.desc.opts[1011] = {
            name: 'customAfterRemoveSet',
            desc: 'Function to execute after a set was removed. Executed in Component context.',
            params: [
                {
                    name: 'set',
                    desc: 'Set going to save',
                    type: 'WatchableSet'
                }
            ]
        };
        if (!options.customAfterRemoveSet)
            this.options.customAfterRemoveSet = function () {};
        this.desc.opts[1012] = {
            name: 'customBeforeSave',
            desc: 'Method that should be executed before save. Executed in Component context. \n\
                    If it returns false the save process is stopped.',
            params: [
                {
                    name: 'set',
                    desc: 'Set going to save',
                    type: 'WatchableSet'
                }
            ],
            returns: {
                desc: 'False if the save process should be stoped',
                type: 'bool'
            }
        };
        if (!options.customBeforeSave)
            this.options.customBeforeSave = function () {};
        this.desc.opts[1013] = {
            name: 'customAfterSave',
            desc: 'Method that should be executed after succsessfull save. Executed in Component context.',
            params: [
                {
                    name: 'sets',
                    desc: 'Sets that where saved',
                    type: 'WatchableSet[]'
                }
            ],
        };
        if (!options.customAfterSave)
            this.options.customAfterSave = function () {};

        this.desc.opts[1014] = {
            name: 'supressChildMessages',
            desc: 'If true messages from saveing childs are not shown.',
        };
        if (!options.supressChildMessages)
            this.options.supressChildMessages = true;

        this.desc.opts[1015] = {
            name: 'makereadableDatesFrom',
            desc: 'Makes user readable dates from ISO Dates of the given attributes if present.',
            example: ['ts', 'date']
        };
        if (!options.makereadableDatesFrom)
            this.options.makereadableDatesFrom = [];

        this.desc.opts[1016] = {
            name: 'hideAfter',
            desc: 'Makes the dataset is hidden, after the date stated in the given attribute.',
        };
        if (!options.hideAfter)
            this.options.hideAfter = 'swac_until';

        this.desc.opts[1017] = {
            name: 'checkSets',
            desc: 'If true sets are checked on matching fromWheres before adding them. Setting nothing lets automatic determine right mode.',
            example: true
        };
        if (!options.checkSets)
            this.options.checkSets = null;

        this.desc.opts[1018] = {
            name: 'definitions',
            desc: 'Map of definitions about expected data in the component. The key is the name of the datasource the definitions apply to and the value is an arraylist of objects with name, type, required attributes.',
        };
        if (!options.definitions)
            this.options.definitions = new Map();

        this.desc.opts[1019] = {
            name: 'lazyLoading',
            desc: 'The number of sets that should be lazy loaded on lazy load events. If 0 all data is loaded at once.',
            example: 10
        };
        if (!options.lazyLoading)
            this.options.lazyLoading = 0;

        this.desc.opts[1020] = {
            name: 'lazyOrder',
            desc: 'Name of the attribute to order by when useing lazy fetching, and type of ordering e.g. DESC|ASC.'
        };
        if (!options.lazyOrder)
            this.options.lazyOrder = 'id,DESC';

        this.desc.opts[1021] = {
            name: 'activeOn',
            desc: 'A datarequestor that indicates if the component should be shown or not. If the request returns with at least one dataset, the component is shown, otherwise it is not loaded.',
            example: {
                fromName: 'tbl_systemconfiguration', // Name of the datatable
                fromWheres: {
                    filter: 'ckey,eq,FUNCTIONNAME&filter=active,eq,true'
                }
            }
        };
        if (!options.activeOn)
            this.options.activeOn = null;

        this.desc.opts[1022] = {
            name: 'fetchNewSetsEvery',
            desc: 'In live mode the component fetches new data (with higher ids) periodically. Timespan is given in seconds.',
            example: 10
        };
        if (!options.fetchNewSetsEvery)
            this.options.fetchNewSetsEvery = null;

        this.desc.opts[1023] = {
            name: 'ecoMode',
            desc: 'Options for ecoMode. {fetchNewSetsEvery= Seconds for fetchNewSetsEvery update in ecoMode, reloadinterval= Seconds for reload in ecoMode, ecoColumn= Name of the column identifying sets for ecoMode}'
        };
        if (!options.ecoMode)
            this.options.ecoMode = false;

        this.desc.opts[1024] = {
            name: 'apiActualUrlAttr',
            desc: 'Name of the attribute that holds an url to an api that delivers actual data for a set',
            example: 'link'
        };
        if (!options.apiActualUrlAttr)
            this.options.apiActualUrlAttr = null;
        
        this.desc.opts[1025] = {
            name: 'useProxy',
            desc: 'If you want to use the globally configured proxy (configuration.js) set this value to true.',
            example: true
        };
        if (!options.useProxy)
            this.options.useProxy = false;

        this.desc.funcs = [];
        this.desc.funcs[1000] = {
            name: 'addData',
            desc: 'Adds an array with datasets (dataobjects) to the given resource. If the resource does not exists, if will be created',
            params: [
                {
                    name: 'fromName',
                    desc: 'Name of the datasource',
                    type: 'SourceName'
                },
                {
                    name: 'data',
                    desc: 'Data to add. Given as WatchableSource, Array of WatchableSets or Array of JS objects(array[{attr1:val1,attr2:val2},{attr1:val1,attr2:val2}])',
                    type: 'WatchableSource / WatchableSet[] / plain JS object'
                }
            ]
        };
        this.desc.funcs[1001] = {
            name: 'addDataFromReference',
            desc: 'Adds the data that could be recived from a reference link.',
            params: [
                {
                    name: 'reference',
                    desc: 'Reference link of a object where to recive data from. (form: ref://)',
                    type: 'SourceReference'
                }
            ]
        };
        this.desc.funcs[1002] = {
            name: 'getParent',
            desc: 'Gets the parent for the given dataset if it is registred in the component. But only if it is available in component.',
            params: [
                {
                    name: 'set',
                    desc: 'One dataset from the component.',
                    type: 'WatchableSet'
                }
            ],
            returns: {
                desc: 'The dataset that is parent of the given dataset.',
                type: 'WatchableSet'
            }
        };
        this.desc.funcs[1003] = {
            name: 'getChilds',
            desc: 'Gets all child datasets that are related to the given dataset.',
            params: [
                {
                    name: 'set',
                    desc: 'Child datasets',
                    type: 'WatchableSet'
                }
            ],
            returns: {
                desc: 'Array of datasets that are child datasets to the main datasets.',
                type: 'WatchableSet[]'
            }
        };
        this.desc.funcs[1004] = {
            name: 'getDataSorted',
            desc: 'Gets a copy of the data sorted after the given attribute.',
            params: [
                {
                    name: 'sortAfter',
                    desc: 'Name of the attribute to sort after',
                    type: 'SourceAttribute'
                }
            ],
            returns: {
                desc: 'Components data sorted by value, organised by datasource',
                type: 'String[WatchableSet[]]'
            }
        };
        this.desc.funcs[1005] = {
            name: 'removeData',
            desc: 'Removes the data with the given source (fromName)',
            params: [
                {
                    name: 'fromName',
                    desc: 'Name of the datasource',
                    type: 'SourceName'
                }
            ]
        };
        this.desc.funcs[1006] = {
            name: 'removeAllData',
            desc: 'Removes all data from component'
        };
        this.desc.funcs[1007] = {
            name: 'addSet',
            desc: 'Adds an single dataset. Updates set if allready exists.',
            params: [
                {
                    name: 'fromName',
                    desc: 'DEPRECATED Name of the datasource (fromName is also delivered in set.swac_fromName)',
                    type: 'SourceName'
                },
                {
                    name: 'set',
                    desc: 'Set with information (can be every kind of object with any number of attributes) \n\
DEFINTION of SET:\n\
- required: set.id = id of the dataset (unique across the given fromname)\n\
- required: at least one value as an attribute (named whatever you want)\n\
- optional: n values as attributes (named whatever you want)\n\
- optional: functions are ignored\n\
- optional: objects in attributes are ignored\n\
- optional: arrays in attributes are ignored',
                    type: 'WatchableSet'
                }
            ],
            returns: {
                desc: 'Dataset added',
                type: 'WatchableSet'
            }
        };
        this.desc.funcs[1009] = {
            name: 'removeSets',
            desc: 'Removes data from the chart',
            params: [
                {
                    name: 'fromName',
                    desc: 'Name of the datasource',
                    type: 'SourceName'
                },
                {
                    name: 'startSetId',
                    desc: 'Id of the set where to start remove, if undefined, all data from datasource will be removed',
                    type: 'SetId'
                },
                {
                    name: 'removeCount',
                    desc: 'Number of sets that should be removed, if undefined only one will be removed',
                    type: 'int'
                }
            ]
        };
        this.desc.funcs[1010] = {
            name: 'removeNullDatasets',
            desc: 'Removes all datasets from all datasources that contain null values'
        };
        this.desc.funcs[1011] = {
            name: 'getAvailableAttributes',
            desc: 'Gets all occuring attributes and their number of occurence over all loaded datasources.',
            returns: {
                desc: 'Map of all attributes for every datasource.',
                type: 'Map<String,String[]>'
            }
        };
        this.desc.funcs[1012] = {
            name: 'getAvailableAttributesForDatasource',
            desc: 'Gets all occuring attributes and their number of occurence for a specific datasources.',
            params: [
                {
                    name: 'fromName',
                    desc: 'Datasource name',
                    type: 'SourceName'
                }
            ],
            returns: {
                desc: 'List of all attributes fot the datasource.',
                type: 'String[]',
            }
        };
        this.desc.funcs[1013] = {
            name: 'reload',
            desc: 'Reloads the data from the datasource and updates the component.',
            returns: {
                desc: 'Promise that resolves when the reload process is done.',
                type: 'Promise'
            }
        };
        this.desc.funcs[1015] = {
            name: 'exportJson',
            desc: 'Exports the current state of components data to a json file.',
            params: [
                {
                    name: 'fromName',
                    desc: 'Name of the datasource. If not given uses all data.',
                    type: 'SourceName'
                },
                {
                    name: 'indent',
                    desc: 'Number of space chars used for auto indent formating.',
                    type: 'int'
                }
            ]
        };
        this.desc.funcs[1016] = {
            name: 'getJson',
            desc: 'Get the current state of components data into json string.',
            params: [
                {
                    name: 'fromName',
                    desc: 'Name of the datasource. If not given uses all data.',
                    type: 'SourceName'
                },
                {
                    name: 'indent',
                    desc: 'Number of space chars used for auto indent formating.',
                    type: 'int'
                }
            ],
            returns: {
                desc: 'JSON representation of components data.',
                type: 'String'
            }
        };
        this.desc.funcs[1017] = {
            name: 'saveData',
            desc: 'Saves the datasets state to their datasources.'
        };
        this.desc.funcs[1018] = {
            name: 'saveState',
            desc: 'Saves the current state of this.data to a list of last states.'
        };
        this.desc.funcs[1019] = {
            name: 'getState',
            desc: 'Get a saved state of this.data',
            params: [
                {
                    name: 'stateno',
                    desc: 'States number',
                    type: 'int'
                }
            ]
        };
        this.desc.funcs[1020] = {
            name: 'undoState',
            desc: 'Removes the last state and resets this.data to that state.'
        };
        this.desc.funcs[1021] = {
            name: 'saveSet',
            desc: 'Save a dataset that resides in the component',
            params: [
                {
                    name: 'set',
                    desc: 'Dataset to save',
                    type: 'WatchableSet'
                },
                {
                    name: 'supressMessages',
                    desc: 'If true no messages are generated, on saveing succsess or fail.',
                    type: 'bool'
                }
            ],
            returns: {
                desc: 'The saved dataset',
                type: 'WatchableSet'
            }
        };
        this.desc.funcs[1022] = {
            name: 'saveChilds',
            desc: 'Saves all childs from one dataset as childs of another or the same.',
            params: [
                {
                    name: 'oldParentSetId',
                    desc: 'Old id of the parent',
                    type: 'SetId'
                },
                {
                    name: 'newParentSetId',
                    desc: 'New id of the parent',
                    type: 'SetId'
                }
            ]
        };
        this.desc.funcs[1023] = {
            name: 'copySet',
            desc: 'Copies one dataset.',
            params: [
                {
                    name: 'set',
                    desc: 'Dataset to copy',
                    type: 'WatchableSet'
                }
            ]
        };
        this.desc.funcs[1024] = {
            name: 'copyChilds',
            desc: 'Copies all child datasets of the given dataset as childs to the new set.',
            params: [
                {
                    name: 'oldParentSetId',
                    desc: 'Old id of the parent',
                    type: 'SetId'
                },
                {
                    name: 'newParentSetId',
                    desc: 'New id of the parent',
                    type: 'SetId'
                }
            ]
        };

        this.desc.funcs[1025] = {
            name: 'dependenciesLoaded',
            desc: 'Checks if all dependencies from the given component are loaded.',
            returns: {
                desc: 'true if all dependencies are loaded, false otherwise',
                type: 'boolean'
            }
        }

        this.desc.funcs[1026] = {
            name: 'getData',
            desc: 'Gets all datasources, with all data accessable by the component.',
            returns: {
                desc: 'Object with watchable sources. With key is the name of the source. Containing WatchableSets accessable with .getSets()',
                type: 'WatchableSource{}'
            }
        }

        // Documentation for events
        this.desc.events = [];

        // Component data
        // key = fromName = Sooure of the data
        // value = array of objects (sets) with attributes
        this.data = {};
        // Notice of last fetched set for lazy loading
        this.lastrequest = null;
        this.lastloaded = 0;
        this.lazyLoadPage = 1;
        // Component data states
        // List of component data snapshots
        this.states = [];
        // Algorithms loaded for this component
        this.algorithms = [];
        // PluginSystem
        this.pluginsystem = null;
        // Eco mode
        this.ecoMode = {active: false, defaults: {fetchNewSetsEvery: null, fromWheres: null}};

        // Init automatic reload
        this.startReloadInterval();
        // Init live mode
        this.startFetchNewSetsEvery();
    }

    startReloadInterval() {
        if (this.options.reloadInterval > 0) {
            this.reloadInterval = setInterval(this.reload.bind(this), this.options.reloadInterval * 1000);
        }
    }

    stopReloadInterval() {
        if (this.reloadInterval) {
            clearInterval(this.reloadInterval);
            delete this.reloadInterval;
        }
    }

    startFetchNewSetsEvery() {
        if (this.options.fetchNewSetsEvery) {
            this.liveInterval = setInterval(this.liveData.bind(this), this.options.fetchNewSetsEvery * 1000);
        }
    }

    stopFetchNewSetsEvery() {
        if (this.liveInterval) {
            clearInterval(this.liveInterval);
            delete this.liveInterval;
        }
    }

    /**
     * Initializes the component
     * 
     * @returns {Promise<void>}
     */
    init() {
        throw('The concrete implementation has to implement the init() method.')
    }

    //public function
    addData(fromName, data) {
        if (!data) {
            Msg.error('Component', 'Empty data given.', this.requestor);
            return;
        }
        Msg.flow('Component', 'addData(' + fromName + ',' + data.length + ')', this.requestor);

        // Use watchablesource so that component gets informed about new datasets
        if (!this.data[fromName]) {
            this.data[fromName] = new WatchableSource(fromName, this);
        }
        if (!this.options.mainSource) {
            this.options.mainSource = fromName;
        }
        // If data is WatchableSource use only sets array
        if (data.getSets) {
            data = data.getSets();
        }

        // Add data to source
        for (let curSet of data) {
            if (!curSet)
                continue;
            // If given set is no WatchableSet create one
            if (!curSet.addObserver) {
                curSet = window.swac.Model.createWatchableSet(curSet);
                curSet.swac_fromName = fromName;
            }
            // Add set to the watchable source -> this informs the view about the added set
            this.data[fromName].addSet(curSet);
        }
    }

    getData() {
        return this.data;
    }

    // public function
    addDataFromReference(reference, idAttr, attributeDefaults, attributeRenames, reloadInterval) {
        return new Promise((resolve, reject) => {
            Model.getFromReference(reference, idAttr, attributeDefaults, attributeRenames, reloadInterval, [this], this).then(function (dataCapsule) {
                resolve(dataCapsule.data);
            }).catch(function (err) {
                reject(err);
            });
        });
    }

    addDataLazy() {
        return new Promise((resolve, reject) => {
            if (this.lastrequest) {
                this.lazyLoadPage++;
                Model.load(this.lastrequest, this).then(function (data) {
                    // Do not add data here, adding of sets is done in Model.load() because this is given as parameter
                    resolve(data);
                }).catch(function (err) {
                    reject(err);
                });
            } else {
                resolve();
            }
        });
    }

    // public function
    getChilds(set) {
        let childs = [];
        for (let curSource in this.data) {
            for (let curSet of this.data[curSource].getSets()) {
                if (!curSet)
                    continue;
                if (curSet[this.options.parentIdAttr] === set.id
                        || curSet[this.options.parentIdAttr] === 'ref://' + set.fromName + '/' + set.id) {
                    childs.push(curSet);
                }
            }
        }
        return childs;
    }

    // public function
    getParent(set) {
        if (this.data[this.options.mainSource])
            return this.data[this.options.mainSource].getSet(set[this.options['parentIdAttr']]);
    }

    // public function
    getDataSorted(orderBy) {
        let sortoptions = {
            sortAfter: orderBy
        };
        let sorteddata = {};
        // Sort at each datasource
        for (let datasource in this.data) {
            // Create a map of position and value to sort
            let mapped = this.data[datasource].getSets().map(function (set, position) {
                return {
                    index: position,
                    value: set[this.sortAfter]
                };
            }, sortoptions);

            // Sort after value
            mapped.sort(function (a, b) {
                if (a.value < b.value) {
                    return -1;
                }
                if (a.value > b.value) {
                    return 1;
                }
                return 0;
            });

            // Now get for each sorted object the set from the sort position
            sorteddata[datasource] = mapped.map(function (el) {
                return this.data[datasource].getSet(el.index);
            }, this);
        }
        return sorteddata;
    }

    // public function - created by the opendata group
    getDataSortedReversed(orderBy) {
        let sortoptions = {
            sortAfter: orderBy
        };
        let sorteddata = {};
        // Sort at each datasource
        for (let datasource in this.data) {
            // Create a map of position and value to sort
            let mapped = this.data[datasource].getSets().map(function (set, position) {
                return {
                    index: position,
                    value: set[this.sortAfter]
                };
            }, sortoptions);

            // Sort after value
            mapped.sort(function (a, b) {
                if (a.value < b.value) {
                    return 1;
                }
                if (a.value > b.value) {
                    return -1;
                }
                return 0;
            });

            // Now get for each sorted object the set from the sort position
            sorteddata[datasource] = mapped.map(function (el) {
                return this.data[datasource].getSet(el.index);
            }, this);
        }
        return sorteddata;
    }

    //public function
    removeData(fromName) {
        if (!this.data[fromName]) {
            Msg.warn('Component', 'Datasource >' + fromName + '< does not exists.');
            return;
        }

        Msg.flow('Component', 'Remove all data from datasource >' + fromName + '<', this.requestor);
        for (let curSet of this.data[fromName].getSets()) {
            if (!curSet)
                continue;
            this.data[fromName].delSet(curSet);
        }
        // Reset lazyloading values
        this.lastrequest = null;
        this.lastloaded = 0;
        this.requestor.fromWheres = {};
    }

    //public function
    removeAllData() {
        for (let curRemSource in this.data) {
            this.removeData(curRemSource);
        }
    }

    /**
     * Method that should be executed before a dataset is added.
     * This can be overwritten in components to check or modify recived
     * datasets.
     * The default implementation does nothing other than returning the set
     * 
     * @param {Object} set Object with attributes to add
     * @returns {Object} (modified) set
     */
    beforeAddSet(set) {
        // Make readable dates
        if (this.options.makereadableDatesFrom) {
            for (let curAttr of this.options.makereadableDatesFrom) {
                if (!set[curAttr])
                    continue;
                let curDate = new Date(set[curAttr]);
                set[curAttr + '_date'] = curDate.toLocaleDateString();
                set[curAttr + '_time'] = curDate.toLocaleTimeString();
                set[curAttr + '_datetime'] = curDate.toLocaleString();
                set[curAttr + '_day'] = SWAC.lang.dict.core['day_' + curDate.getDay()];
            }
        }
        // Hide datasets that contain the hideAfter attribute and when its over
        if (this.options.hideAfter && set[this.options.hideAfter]) {
            let date = new Date(set[this.options.hideAfter]);
            date.setDate(date.getDate() + 1);
            if ((new Date().getTime() - date.getTime()) > 0) {
                return null;
            }
        }

        // Set default values
        let defaults = this.options.attributeDefaults.get(set.swac_fromName);
        let gdefaults = this.options.attributeDefaults.get('*');
        if (defaults && gdefaults)
            defaults = Object.assign(defaults, gdefaults);
        else if (gdefaults)
            defaults = gdefaults;
        if (this.options.attributeDefaults) {
            for (let curAttr in defaults) {
                if (typeof set[curAttr] === 'undefined') {
                    let curVal = defaults[curAttr];
                    // Calculate default value
                    let placeholders = curVal.match(/%\w+%/g);
                    if (placeholders && placeholders.length > 0) {
                        let eq = curVal;
                        let repall = true;
                        for (let curPlaceh of placeholders) {
                            let curName = curPlaceh.split('%').join('');
                            if (typeof set[curName] !== 'undefined')
                                eq = eq.replace(curPlaceh, set[curName]);
                            else {
                                Msg.error('Model', 'Variable >' + curName + '< for calculation >' + eq + '< not found in set >' + dataRequest.fromName + '[' + set.id + ']<');
                                repall = false;
                                break;
                            }
                        }
                        if (repall) {
                            set[curAttr] = eval(eq);
                        }
                    } else
                        set[curAttr] = curVal;
                }
            }
        }

        // Set attribute renameing
        if (this.options?.attributeRenames.size > 0) {
            set['swac_renamedAttrsByComp'] = {};
            for (let [curAttr, curRename] of this.options.attributeRenames) {
                if (typeof set[curAttr] !== 'undefined') {
                    set[curRename] = set[curAttr];
                    delete set[curAttr];
                    set['swac_renamedAttrsByComp'][curAttr] = curRename;
                }
            }
        }

        // Fetch data from api for actual data if url is configured
//        if (this.options.apiActualUrlAttr) {
//            let actualurl = this.getDataValue(set, this.options.apiActualUrlAttr);
//            if (actualurl != null) {
//                console.log('fetch data ' + set.id);
//                const response = await fetch(actualurl);
//                const data = await response.json();
//                console.log('TEST after fetch' + set.id);
//                // Merge the data into the given object
//                set = {...set, ...data};
//            }
//        }
//console.log('TEST added fetched data:',set);

        this.customBeforeAddSet = this.options.customBeforeAddSet;
        this.customBeforeAddSet(set);

        return set;
    }

    //public function
    //@deprecated fromName should be given within set as set.swac_fromName
    async addSet(fromName, set) {
        if (!fromName) {
            Msg.error('Component', 'Try to add set without fromName', this.requestor);
            return;
        }
        // Auto set mainSource
        if (!this.options.mainSource) {
            this.options.mainSource = fromName;
        }

        if (!set) {
            Msg.error('Component', 'Try to add undefined as set', this.requestor);
            return;
        }
        if (!this.requestor) {
            Msg.error('Component', 'addSet() called on component class instead on component instance', this.requestor);
            return;
        }
        if (Array.isArray(set)) {
            Msg.error('Component', 'Given array as set. Use only single sets on addSet()', this.requestor);
            return;
        }
        console.log('TEST addSet');
        // Use watchablesource so that component gets informed about new datasets
        if (!this.data[fromName]) {
            this.data[fromName] = new WatchableSource(fromName, this);
            this.data[fromName].addObserver(this);
        } else if (this.data[fromName].getSet(set.id)) {
            Msg.warn('Component', 'Set >' + fromName + '[' + set.id + ']< allready exists.', this.requestor);
            return;
        }

        set.swac_fromName = fromName;

        // Add automatic set.id if there is no one
        if (typeof set.id === 'undefined') {
            set.id = this.data[fromName].count();
            set.swac_isnew = true;
        }

        // Create WatchableSet if is not
        if (set.constructor.name !== 'WatchableSet') {
            Msg.warn('Component', 'Given set >' + set.id + '< was no WatchableSet. Created WatchableSet. If this makes problems please create a bug report.', this.requestor);
            set = new WatchableSet(set);
        }
        // Check if set can be used here
        if (!this.checkAcceptSet(set))
            return;

        set = this.beforeAddSet(set);
        if (!set)
            return set;
        set.addObserver(this);
        this.data[fromName].addSet(set);
        // afterAddSet is called by the WatchableSource -> this.notifyData()

        // Add set to childs list if it is child of some parent
        if (this.options.mainSource && set.swac_fromName !== this.options.mainSource) {
            // Get parent
            let parentId = set[this.options.parentIdAttr];
            let parent = this.data[this.options.mainSource].getSets()[parentId];
            // Only add as child if there is a parent and if the parent does not include that child
            // (because components share a WatchableSet the child list can duplicate even if
            // component checks on duplicates on itself)
            if (parent && !parent.swac_childs.includes(set))
                parent.swac_childs.push(set);
        }
        Msg.flow('Component', 'Set >' + fromName + '[' + set.id + ']< added.', this.requestor);
//        }
        return set;
    }

    /*
     * Check if the set can be accepted. Checks the filters in fromWheres
     * 
     * @param {WatchableSet} set Set that should be added
     * @returns {boolean} true if set can be acceppted
     */
    checkAcceptSet(set) {
        // Set checking is disabled
        if (this.options.checkSets === false)
            return true;
        // update filter for ecoMode
        if (this.ecoMode.active)
            this.requestor.fromWheres.filter = this.requestor.fromWheres.filter.replace('ecomode,eq,false', 'ecomode,eq,true');

        // If there is no mainSource or given set is of mainSource, check match filter
        if (this.requestor.fromWheres && Object.keys(this.requestor.fromWheres).length > 0
                && (!this.options.mainSource || this.options.mainSource === set.swac_fromName)) {
            if (this.matchFilter(set, this.requestor.fromWheres)) {
                Msg.flow('Component', 'Dataset >' + set.swac_fromName + '[' + set.id + ']< accepted by filter.', this.requestor);
                return true;
            } else {
                Msg.flow('Component', 'Dataset >' + set.swac_fromName + '[' + set.id + ']< not accepted by filter.', this.requestor);
                return false;
            }
        } else if (this.options.mainSource === set.swac_fromName) {
            if (this.requestor.getAttribute) {
                let pfilter = this.requestor.getAttribute('parentFilter');
                if (pfilter && !this.matchFilter(set, {filter: pfilter})) {
                    return false;
                }
            }
        } else {
            if (this.requestor.getAttribute) {
                let cfilter = this.requestor.getAttribute('childFilter');
                if (cfilter && !this.matchFilter(set, {filter: cfilter})) {
                    return false;
                }
            }
        }
        Msg.flow('Component', 'Dataset >' + set.swac_fromName + '[' + set.id + ']< accepted.', this.requestor);
        return true;
    }

    /**
     * Check if the given set matches the fromWheres.
     * Note: Currently only supports eq-filter
     * 
     * @param {WatchableSet} set    Dataset
     * @param {Object} fromWheres   Object with fromWheres as attributes
     * @returns {Boolean}   True if the set matches the fromWheres
     */
    matchFilter(set, fromWheres) {
        if (!set)
            return false;
        if (!fromWheres || set.id === 0 || Object.keys(fromWheres).length === 0)
            return true;
        for (let curWhere in fromWheres) {
            // Only need todo filter if filter is string
            if (!fromWheres[curWhere].split)
                continue;
            for (let curPart of fromWheres[curWhere].split('&')) {
                curPart = curPart.replace(curWhere + '=', '');
                if (curWhere.startsWith('filter')) {
                    let parts = curPart.split(',');
                    // Check if requested parameter is renamed in component
                    let paramName = parts[0];
                    if (this.options.attributeRenames.has(paramName)) {
                        paramName = this.options.attributeRenames.get(paramName);
                    }
                    // eq-filter
                    if (curPart.includes(',eq,')) {
                        // Saw equal needed here because numbers are strings in fromWheres
                        if (set[paramName] != parts[2] && set[paramName] + '' != parts[2] + '') {
                            Msg.warn('Model', 'Set >' + set.swac_fromName + '[' + set.id + ']< not accepted because of eq-filter. set.' + paramName + ' is not ' + parts[2] + ' but is ' + set[paramName], this.requestor);
                            return false;
                        }
                    } else if (curPart.includes(',neq,')) {
                        // Saw equal needed here because numbers are strings in fromWheres
                        if (set[paramName] == parts[2] && set[paramName] + '' == parts[2] + '') {
                            Msg.warn('Model', 'Set >' + set.swac_fromName + '[' + set.id + ']< not accepted because of neq-filter. set.' + paramName + ' is ' + parts[2] + ' but should not.', this.requestor);
                            return false;
                        }
                    } else if (curPart.includes(',gt,')) {
                        // gt-filter
                        let setdate = new Date(set[parts[0]]);
                        // Date compare
                        if (isNaN(set[parts[0]]) && !isNaN(setdate.valueOf())) {
                            let compDate = new Date(parts[2]);
                            if (setdate <= compDate) {
                                Msg.warn('Model', 'Set >' + set.swac_fromName + '[' + set.id + ']< not accepted because of gt-filter date compare. set.' + parts[0] + ' is not ' + parts[2] + ' but is ' + set[parts[0]]);
                                return false;
                            }
                            continue;
                        }

                        // Number compare
                        let setnum = new Number(set[parts[0]]);
                        if (!isNaN(setnum)) {
                            let compNum = new Number(parts[2]);
                            if (setnum <= compNum) {
                                Msg.warn('Model', 'Set >' + set.swac_fromName + '[' + set.id + ']< not accepted because of gt-filter number compare. set.' + parts[0] + ' is not ' + parts[2] + ' but is ' + set[parts[0]]);
                                return false;
                            }
                            continue;
                        }
                    } else if (curPart.includes(',lt,')) {
                        // lt-filter
                        let setdate = new Date(set[parts[0]]);
                        // Date compare
                        if (isNaN(set[parts[0]]) && !isNaN(setdate.valueOf())) {
                            let compDate = new Date(parts[2]);
                            if (setdate.getTime() >= compDate.getTime()) {
                                Msg.warn('Model', 'Set >' + set.swac_fromName + '[' + set.id + ']< not accepted because of lt-filter date compare. set.' + parts[0] + ' is >' + set[parts[0]] + '< but shold not be grater than >' + parts[2] + '<');
                                return false;
                            }
                            continue;
                        }

                        // Number compare
                        let setnum = new Number(set[parts[0]]);
                        if (!isNaN(setnum)) {
                            let compNum = new Number(parts[2]);
                            if (setnum >= compNum) {
                                Msg.warn('Model', 'Set >' + set.swac_fromName + '[' + set.id + ']< not accepted because of lt-filter number compare. set.' + parts[0] + ' is >' + set[parts[0]] + '< but shold not be grater than >' + parts[2] + '<');
                                return false;
                            }
                            continue;
                        }
                    }
                }
            }
        }
        return true;
    }

    /**
     * Method that should be executed after a dataset is added.
     * This can be overwritten in component.
     * Note that when you overwrite this method, also afterAddSet() on plugins is no longer executed.
     * 
     * @param {Object} set Object with attributes to add
     * @param {Mixed} data Data elements that should be deliverd to the customAfterAddSet() and Plugin.afterAddSet() calls
     * @returns {undefined}
     */
    async afterAddSet(set, data) {
        Msg.flow('Component', 'afterAddSet()', this.requestor);

        // Execute custom afterAddSet
        if (this.options.customAfterAddSet) {
            // Set method to this to use context of component in method
            this.customAfterAddSet = this.options.customAfterAddSet;
            try {
                this.customAfterAddSet(set, data);
            } catch (e) {
                Msg.error('Component', 'Error while executeing >.customAfterAddSet(' + set.swac_fromName + '[' + set.id + ']: ' + e, this.requestor);
            }
        }
        // Inform plugins about added sets / Plugins from views are informed by view
        if (this.pluginsystem && !this.constructor.prototype instanceof View) {
            for (let curPlugin of this.getLoadedPlugins().values()) {
                if (curPlugin.swac_comp.afterAddSet) {
                    curPlugin.swac_comp.afterAddSet(set, data);
                }
            }
        }
    }

    //public function
    removeSets(fromName, startSetId = null, removeCount = 1) {
        if (typeof this.data[fromName] !== 'undefined') {
            for (let i = startSetId; i < (startSetId + removeCount); i++) {
                this.removeSet(fromName, i);
            }
        } else {
            Msg.warn('component', 'There is no datasource with name >' + fromName + '< so there is nothing to remove', this.requestor);
    }
    }

    // public function
    removeSet(fromName, id) {
        let set = this.data[fromName].getSet(id);
        if (set) {
            this.data[fromName].delSet(set);
            // Delete childs
            for (let curSource in this.data) {
                for (let curSet of this.data[curSource].getSets()) {
                    if (curSet.parent && (curSet.parent === id || curSet.parent === 'ref://' + fromName + '/' + id)) {
                        this.removeSet(curSet);
                    }
                }
            }
            // Called by notifyDelSet which is called by the WatchableSource after remove from source
            // this.afterRemoveSet(set);
        }
    }

    /**
     * Method executed after sets were removed
     * 
     * @param {WatchableSet} set St that was removed
     * @returns {undefined}
     */
    afterRemoveSet(set) {
        // Execute custom afterAddSet
        if (this.options.customAfterRemoveSet) {
            // Set method to this to use context of component in method
            this.customAfterRemoveSet = this.options.customAfterRemoveSet;
            this.customAfterRemoveSet(set);
        }
        // Inform plugins about added sets
        if (this.pluginsystem) {
            for (let curPlugin of this.getLoadedPlugins().values()) {
                if (curPlugin.swac_comp.afterRemoveSet) {
                    curPlugin.swac_comp.afterRemoveSet(set);
                }
            }
        }
    }

    /**
     * Get notification about changed values
     * 
     * @param {WatchableSet} set Set wichs content has changed
     * @param {String} name Name of the attribute that changed
     * @param {type} value New value
     */
    notifyChangedValue(set, name, value) {
        return;
    }

    /**
     * Get notification about added values
     * 
     * @param {WatchableSet} set Set wichs content has changed
     * @param {String} name Name of the attribute that was added
     * @param {type} value New value
     */
    notifyAddedValue(set, name, value) {
        return;
    }

    /**
     * Notification from WatchableSource about new sets
     * 
     * @param {WatchableSource} source Source where the set was added
     * @param {WatchableSet} set Set that was added
     */
    notifyAddSet(source, set) {
        Msg.flow('Component', 'NOTIFY about added set >' + set.swac_fromName + '[' + set.id + ']< recived', this.requestor);
        // Check of modify added set to needs of the component
        set = this.beforeAddSet(set);
        // If beforeAddSet delivers no set set is not accepted
        if (!set) {
            Msg.error('Component', 'Set >' + set.swac_fromName + '[' + set.id + '] was not accepted.', this.requestor);
            return;
        }
        set.addObserver(this);
        try {
            this.afterAddSet(set);
        } catch (e) {
            Msg.error('Component', 'Error while executing >.afterAddSet(' + set.swac_fromName + '[' + set.id + ']): ' + e, this.requestor);
        }
    }

    /**
     * Notification from WatchableSource about deleted sets
     * 
     * @param {WatchableSource} source Source where the set was added
     * @param {WatchableSet} set Set that was added
     */
    notifyDelSet(set) {
        Msg.flow('Component', 'NOTIFY about deleted set >' + set.swac_fromName + '[' + set.id + ']< recived', this.requestor);
        set.id = parseInt(set.id);
        this.afterRemoveSet(set);
    }

    //public function
    removeNullDatasets() {
        for (let curSourceName in this.data) {
            let sets = this.data[curSourceName].getSets();
            // Check each set
            for (let i = 0; i < sets.length; i++) {
                let isNull = false;
                // Check each set on null
                for (let value in sets[i])
                    if (sets[i][value] === null) {
                        isNull = true;
                    }
                if (isNull) {
                    delete sets[i];
                }
            }
            sets.length = Object.keys(sets).length;
        }
    }

    // public function
    getAvailableAttributes() {
        let columnsmap = new Map();

        // Look at each datasource
        for (let datasource in this.data) {
            let columnoccurences = this.getAvailableAttributesForDatasource(datasource);
            columnsmap.set(datasource, columnoccurences);
        }

        return columnsmap;
    }

    //public function
    getAvailableAttributesForDatasource(fromName) {
        if (!this.data[fromName]) {
            Msg.error('Component', 'Datasource >' + fromName + '< not found.');
            return;
        }
        let attrs = [];
        // Add attributes from definitions
        if (this.options.definitions && this.options.definitions.size > 0) {
            let defs = this.options.definitions.get(fromName);
            if (defs) {
                for (let curDef of defs) {
                    attrs.push(curDef.name);
                }
            }
        } else {
            // Add attributes from sets
            for (let set of this.data[fromName].getSets()) {
                if (!set)
                    continue;
                // Look at each attribute
                for (let attr in set) {
                    if (!attrs.includes(attr) && !attr.startsWith('swac_')) {
                        attrs.push(attr);
                    }
                }
            }
        }
        // Reorder attributes with fixed position
        let newAttrStart = [];
        for (let orderAttr of this.options.attributeOrder) {
            let pos = attrs.indexOf(orderAttr);
            if (pos >= 0) {
                let reorderAttr = attrs.splice(pos, 1);
                newAttrStart.push(reorderAttr[0]);
            }
        }
        attrs = newAttrStart.concat(attrs);

        return attrs;
    }

    /**
     * Gets useage information about the attributes available in data
     * 
     * @return {Map<String,{type,count}} Useage information
     */
    getAttributeUseage() {
        let thisRef = this;
        return new Promise((resolve, reject) => {
            this.getDatatypeReflection().then(function (dtr) {
                let attrs = new Map();
                for (let source in thisRef.data) {
                    for (let set of thisRef.data[source].getSets()) {
                        for (let attr in set) {
                            // Exclude attributes on ignore list
                            if (!attr.startsWith('swac_')) {
                                let curVal = set[attr];
                                // Note as candidate and count canditates occurences
                                if (!attrs.has(attr)) {
                                    attrs.set(attr, {
                                        name: attr,
                                        type: dtr.determineDataType(curVal),
                                        count: 1
                                    });
                                } else {
                                    attrs.get(attr).count++;
                                }
                            }
                        }
                    }
                }
                resolve(attrs);
            });
        });
    }

    /**
     * Detects the attribute from data, that is best suited to be used for x-axis (labels)
     * 
     * @param {Object[]} data Object with datasources[datasets[dataobjects{}]]
     * @param {Type} preferType Name of the datatype prefered for useage
     * @param {String[]} ignore List of attribute names that should be ignored
     * @returns {String} Name of the attribute to use for x-axis
     */
    getAllOverAvailableAttr(ignore = ['id'], typeOrder = ['timestamp', 'date', 'time', 'int8', 'int4', 'float8', 'float4']) {
        let thisRef = this;
        return new Promise((resolve, reject) => {
            thisRef.getAttributeUseage().then(function (candidates) {
                let allDatasetsCount = thisRef.countSets();
                let candSorted = new Map();

                // Sort after type
                for (let curCandidate of candidates.values()) {
                    if (!candSorted.has(curCandidate.type))
                        candSorted.set(curCandidate.type, []);
                    candSorted.get(curCandidate.type).push(curCandidate);
                }
                // Use first matching type
                let firstMatch = null;
                for (let curType of typeOrder) {
                    let curCandidates = candSorted.get(curType);
                    if (!curCandidates)
                        continue;
                    for (let curCand of curCandidates) {
                        if (!ignore.includes(curCand.name) && curCand.count === allDatasetsCount) {
                            firstMatch = curCand.name;
                            break;
                        }
                    }
                    if (firstMatch)
                        break;
                }
                resolve(firstMatch);
            });
        });
    }

    countSets(fromName) {
        let count = 0;
        for (let source in this.data) {
            if (!fromName || source === fromName) {
                count += this.data[source].getSets().length;
            }
        }

        return count;
    }

    /**
     * Creates definitions based on the available data
     * 
     * @returns {Map<String,Definition[]>} Map with definitions for eacht datasource
     */
    async getDataDefinitions() {
        let deflistmap = new Map();

        // Look at each datasource
        for (let datasource in this.data) {
            let sourcedeflist = await this.getDataDefinitionsForDatasource(datasource);
            deflistmap.set(datasource, sourcedeflist);
        }

        return deflistmap;
    }

    /**
     * Creates definitions bases on the available data for a specific datasource
     * 
     * @param {String} fromName Datasource name
     * @returns {Promise<Map<String,Definition>>} 
     */
    getDataDefinitionsForDatasource(fromName) {
        return new Promise((resolve, reject) => {
            if (!this.data[fromName]) {
                reject();
                return;
            }

            let thisRef = this;
            // Load DatatypeReflection
            this.getDatatypeReflection().then(function (dtr) {
                let defmap = new Map();
                // Look at each set
                for (let set of thisRef.data[fromName].getSets()) {
                    // Look at each attribute
                    for (let attr in set) {
                        // Exclude swac_observers
                        if (attr.startsWith('swac_'))
                            continue;
                        let value = set[attr];
                        if (defmap.has(attr)) {
                            let def = defmap.get(attr);
                            if (value === null) {
                                def.isNullable = true;
                            } else {
                                let newtype = dtr.determineDataType(value);
                                if (newtype !== def.type) {
                                    def.type = 'String';
                                }
                            }
                            defmap.set(attr, def);
                        } else {
                            // Create definition
                            let def = {};
                            def.name = attr;
                            def.source = fromName;
                            if (value === null) {
                                def.isNullable = true;
                            } else {
                                def.type = dtr.determineDataType(value);
                            }
                            defmap.set(attr, def);
                        }
                    }
                }
                resolve(Array.from(defmap.values()));
            }).catch(function (err) {
                Msg.error('Component', 'Could not load DatatypeReflection algorithm: ' + err, thisRef.requestor);
                reject(err);
            });
        });
    }

    getDatatypeReflection() {
        return new Promise((resolve, reject) => {
            // Load DatatypeReflection
            SWAC.loadAlgorithm('DatatypeReflection', 'DatatypeReflection').then(function (requestor) {
                resolve(requestor.swac_comp);
            });
        });
    }

    /**
     * Gets a value out of set with given attribute path
     * 
     * @param {Object} set Dataset to find value in
     * @param {String} attrpath Path to attribute (e.g. attribute.0.name)
     * @returns {Mixed} Value of the attribute or null if not found
     */
    getDataValue(set, attrpath) {
        let datapath = attrpath.split('.');
        let value = set;
        for (let i = 0; i < datapath.length; i++) {
            if (typeof value[datapath[i]] == 'undefined') {
                return null;
            }
            value = value[datapath[i]];
        }
        return value;
    }

    // public function
    exportJson(fromName, indent) {
        let data = this.getJson(fromName, indent);
        let dataURL = 'data:application/json,' + data;
        var link = document.createElement('a');
        link.download = 'calculation_result.json';
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // public function
    getJson(fromName, indent) {
        let data = (fromName) ? this.data[fromName] : this.data;
        let json = JSON.stringify(data, (key, value) => {
            if (typeof value !== 'undefined' && value !== null && !key.startsWith('swac_'))
                return value;
        }, indent);
        if (!json)
            return '{}';
        json = json.replaceAll('null,\n', '');
        return json;
    }

    // public function
    saveData() {
        Msg.flow('Component', 'saveData()', this.requestor);
        // Execute custom customBeforeSave()
        if (this.options.customBeforeSave) {
            this.options.customBeforeSave.bind(this);
            if (this.options.customBeforeSave(null) === false) {
                Msg.warn('Edit', 'customBeforeSave() returned false');
                return;
            }
        }

        let thisRef = this;
        for (let curFromName in this.data) {
            // Check if data come from file
            if (curFromName.endsWith('.json')) {
                UIkit.modal.alert(SWAC.lang.dict.core.savetofileerr);
                continue;
            }
            // Build datacapsle
            let dataCapsle = {
                fromName: curFromName
            };
            // Add saveAlongData to every dataset if defined
            if (this.options.saveAlongData) {
                dataCapsle.data = [];
                for (let curSet of this.data[curFromName].getSets()) {
                    let saveset = curSet.copy();
                    for (let curAttr in this.options.saveAlongData) {
                        saveset[curAttr] = this.options.saveAlongData[curAttr];
                    }
                    dataCapsle.data.push(saveset);
                }
            } else {
                dataCapsle.data = this.data[curFromName].getSets();
            }

            // Save data
            Model.save(dataCapsle).then(function (data) {
                thisRef.afterSave(dataCapsle);
                if (thisRef.options.customAfterSave) {
                    thisRef.options.customAfterSave.bind(thisRef);
                    try {
                        thisRef.options.customAfterSave(data);
                    } catch (e) {
                        Msg.error('Component', 'Error execution options.customAfterSave(): ' + e, this.requestor);
                    }
                }
            }).catch(function (error) {
                UIkit.modal.alert(SWAC.lang.dict.core.model_saveerror);
                Msg.error('Component', 'Could not save because of: ' + error);
            });
        }
    }

    afterSave(dataCapsule) {
        // Nothing todo here for component implementations
    }

    // public function
    async saveSet(set, supressMessages, setupdate = true) {
        Msg.flow('Component', 'saveSet()', this.requestor);
        let thisRef = this;
        return new Promise((resolve, reject) => {
            // Execute custom customBeforeSave()
            if (this.options.customBeforeSave) {
                this.customBeforeSave = this.options.customBeforeSave;
                if (this.customBeforeSave(set) === false) {
                    Msg.warn('Edit', 'customBeforeSave() returned false');
                    return;
                }
            }
            // Reset id if dataset is marked as new
            let oldId = set.id;
            let saveset = null;
            if (set.swac_isnew) {
                saveset = set.copy();
                saveset.swac_fromName = set.swac_fromName;
            } else {
                saveset = set;
            }
            if (this.options.saveAlongData !== null) {
                for (let curAttr in this.options.saveAlongData) {
                    saveset[curAttr] = this.options.saveAlongData[curAttr];
                }
            }
            // Set fromName if not given
            if (!saveset.swac_fromName) {
                saveset.swac_fromName = this.options.mainSource ? this.options.mainSource : this.requestor.fromName;
            }

            let dataCapsule = {
                data: [saveset],
                fromName: saveset.swac_fromName
            };
            Model.save(dataCapsule, supressMessages).then(function (dataCaps) {
                // Get first dataset
                let savedSet;
                for (let curSet of dataCaps) {
                    if (!curSet)
                        continue;
                    savedSet = curSet;
                    break;
                }

                // Reorder when id has changed
                // Following line is old implementation that made error: dataCaps[0].data[0] is null
//                let newId = parseInt(dataCaps[0].data[0].id);
                let newId = savedSet.id;
                // There is no id deliverd on update
                if (setupdate && !isNaN(newId) && newId !== oldId) {
                    saveset.id = newId;
                    thisRef.removeSet(savedSet.swac_fromName, oldId);
                    thisRef.addSet(saveset.swac_fromName, saveset);
                } else {
                    newId = oldId;
                }
                // Save childs if there
                if (thisRef.options.mainSource === savedSet.swac_fromName) {
                    thisRef.saveChilds(oldId, newId).then(function (savedChilds) {
                        thisRef.afterSave(dataCapsule);
                        if (thisRef.options.customAfterSave) {
                            thisRef.options.customAfterSave.bind(thisRef);
                            try {
                                thisRef.options.customAfterSave(savedSet);
                            } catch (e) {
                                Msg.error('Component', 'Error execution options.customAfterSave(); ' + e, thisRef.requestor);
                            }
                        }
                        resolve(saveset);
                    });
                } else {
                    thisRef.afterSave(dataCapsule);
                    if (thisRef.options.customAfterSave) {
                        Msg.flow('Component', 'Calling customAfterSave() from ' + thisRef.requestor.id + '_options', thisRef.requestor);
                        thisRef.options.customAfterSave.bind(thisRef);
                        try {
                            thisRef.options.customAfterSave(savedSet);
                        } catch (e) {
                            Msg.error('Component', 'Error executing options.customAfterSave(): ' + e, thisRef.requestor);
                        }
                    }
                    resolve(saveset);
                }
            }).catch(function (err) {
                reject(err);
            })
        });
    }

    // public function
    async saveChilds(oldParentId, newParentId, supressMessages) {
        Msg.flow('Component', 'saveChilds()', this.requestor);
        if (typeof supressMessages === 'undefined')
            supressMessages = this.options.supressChildMessages;
        let savedChilds = 0;
        for (let source in this.data) {
            // If a main source is set there are no childs within mainsource
            if (this.options.mainSource && this.options.mainSource === source)
                continue;
            for (let curSet of this.data[source].getSets()) {
                if (curSet && typeof curSet[this.options.parentIdAttr] !== 'undefined' && curSet[this.options.parentIdAttr] === oldParentId) {
                    // Update parent reference before save
                    if (newParentId && oldParentId !== newParentId) {
                        curSet[this.options.parentIdAttr] = newParentId;
                    }
                    await this.saveSet(curSet, supressMessages);
                    savedChilds++;
                }
            }
        }
        return savedChilds;
    }

    // public function
    copySet(set) {
        if (!set) {
            Msg.error('Component', 'No set given.');
            return;
        }
        let copy = set.copy();
        // Set needed information and isnew flag
        copy.swac_fromName = set.swac_fromName;
        copy.swac_isnew = true;
        copy.id = 0;
        // Add new set
        this.addSet(copy.swac_fromName, copy);
        this.copyChilds(set.id, copy.id);
    }

    // public function
    copyChilds(oldParentId, newParentId) {
        if (!this.data[this.options.mainSource]) {
            Msg.error('Component', 'Could not copy childs. MainSource >' + this.options.mainSource + '< does not exists.');
            return;
        }
        let childs = this.getChilds(this.data[this.options.mainSource].getSet(oldParentId));
        for (let curChild of childs) {
            let curCopy = curChild.copy();
            // Set needed information and isnew flag
            curCopy.swac_fromName = curChild.swac_fromName;
            curCopy.swac_isnew = true;
            // Set new parent id
            if (this.options.parentIdAttr) {
                curCopy[this.options.parentIdAttr] = newParentId;
            }
            this.addSet(curCopy.swac_fromName, curCopy);
        }
    }

    // public function
    reload() {
        Msg.flow('Component', 'Component reloaded', this.requestor);
        return new Promise((resolve, reject) => {
            // Get used sources
            let oldSources = [];
            let oldSetCount = 0;
            for (let curSource in this.data) {
                oldSources.push(curSource);
                oldSetCount += this.data[curSource].count;
            }
            let thisRef = this;
            // If there where no sources try again with source from requestor element
            if (oldSources.length < 1) {
                oldSources.push(this.requestor.fromName);
            }
            // Unload subrequestors
            let subReqs = this.requestor.querySelectorAll('[swa]');
            for (let curSub of subReqs) {
                let i = window['loadingrequestors'].indexOf(curSub.id);
                window['loadingrequestors'].splice(i, 1);
            }
            // Delete old data
            this.removeAllData();
            // Get new data
            for (let curSource of oldSources) {
                Model.getFromReference('ref://' + curSource, null, null, null, 0, null, this).then(function (dataCapsule) {
                    thisRef.addData(curSource, dataCapsule.data);
                    // Send reload event
                    let event = new CustomEvent("swac_" + thisRef.requestor.id + "_reloaded", {
                        "detail": thisRef.requestor
                    });
                    document.dispatchEvent(event);
                    resolve(dataCapsule);
                }).catch(function (error) {
                    reject(error);
                });
            }
        });
    }

    /**
     * Get the name of the main source
     */
    getMainSourceName() {
        if (this.options.mainSource)
            return this.options.mainSource;
        for (let curSource in this.data) {
            return curSource;
        }
    }

    /**
     * Gets the data of the main source
     */
    getMainSourceData() {
        return this.data[this.getMainSourceName()];
    }

    //public function
    saveState() {
        Msg.info('Component', 'This function is not implemented yet.');
    }

    //public function
    getState(stateno) {
        Msg.info('Component', 'This function is not implemented yet.');
    }

    //public function
    undoState() {
        Msg.info('Component', 'This function is not implemented yet.');
    }

    /**
     * Initilises the plugin system if neccessery
     * 
     * @returns {Promise<void>} 
     */
    initPluginSystem() {
        let thisRef = this;
        return new Promise((resolve, reject) => {
            if (!this.options.plugins || this.options.plugins.size === 0) {
                resolve();
                return;
            }
            // Load ComponentHandler
            import('./PluginSystem.js?vers=' + SWAC.desc.version).then(module => {
                Msg.flow('Component', 'Loaded plugin system', this.requestor);
                thisRef.pluginsystem = new module.default();
                thisRef.pluginsystem.init(thisRef).then(function () {
                    thisRef.loadPlugins().then(function () {
                        Msg.flow('Component', 'Event: >swac_' + thisRef.requestor.id + '_plugins_loaded<', thisRef);
                        // Send reload event
                        let event = new CustomEvent('swac_' + thisRef.requestor.id + '_plugins_loaded', {
                            "detail": thisRef.requestor
                        });
                        document.dispatchEvent(event);
                        resolve();
                    }).catch(function (err) {
                        Msg.error('Component', 'Could not load plugins: ' + err, thisRef);
                        reject();
                    })
                }).catch(function (err) {
                    reject(err);
                });
            });
        });
    }

    // public function
    delete() {
        // Stop observing
        for (let i in this.data) {
            let curSource = this.data[i];
            curSource.delObserver(this);
        }
        // Unload plugins
        if (this.unloadPlugins)
            this.unloadPlugins();
        // Remove component from loading requestors list
        const index = window['loadingrequestors'].indexOf(this.requestor.id);
        window['loadingrequestors'].splice(index, 1);

    }

    // public function
    dependenciesLoaded() {
        // Check if component has dependencies
        if (typeof this.desc.depends === 'undefined' || this.desc.depends.length <= 0) {
            return;
        }

        // Get components dependencies
        for (let depNo in this.desc.depends) {
            let dependency = this.desc.depends[depNo];
            // Ignore if debugonly and no debugmode
            if (dependency.debugonly && !this.config.debugmode)
                continue;
            if (typeof dependency.loaded === 'undefined' || dependency.loaded === false) {
                return false;
            }
        }
        return true;
    }

    liveData() {
        for (let curSource in this.data) {
            // Last set id
            let lastId = 0;
            for (let curSet of this.data[curSource].getSets()) {
                if (curSet && curSet.id > lastId)
                    lastId = curSet.id;
            }

            let dataPromise = Model.load({
                fromName: curSource,
                fromWheres: {
                    filter: 'id,gt,' + lastId
                },
                idAttr: 'id'
            }, this);
        }
    }

    /**
     * Tries to execute the command given peer speach
     *
     * @param(String) Spoken command
     * @returns Word to be spoken
     **/
    speechCommand(cmd) {
        return '';
    }

    /**
     * Toggles components eco mode
     * If the component has an eco mode it is de/activated by calling this function
     * 
     * May reduce reload interval and / or fetches special eco datasets
     */
    toggleEcoMode() {
        if (this.ecoMode.active) {
            // Deactivate ecoMode
            this.ecoMode.active = false;
            if (this.options.ecoMode.fetchNewSetsEvery) {
                this.options.fetchNewSetsEvery = this.options.ecoMode.fetchNewSetsEveryOrig;
                this.stopFetchNewSetsEvery();
                this.startFetchNewSetsEvery();
            }
            if (this.options.ecoMode.reloadInterval) {
                this.options.reloadInterval = this.options.ecoMode.reloadIntervalOrig;
                this.stopReloadInterval();
                this.startReloadInterval();
            }
            if (this.options.ecoMode.ecoColumn) {
                this.reload();
            }
        } else {
            this.ecoMode.active = true;
            // activate ecoMode
            if (this.options.ecoMode.fetchNewSetsEvery) {
                this.options.ecoMode.fetchNewSetsEveryOrig = this.options.fetchNewSetsEvery;
                this.options.fetchNewSetsEvery = this.options.ecoMode.fetchNewSetsEvery;
                this.stopFetchNewSetsEvery();
                this.startFetchNewSetsEvery();
            }
            if (this.options.ecoMode.reloadInterval) {
                this.options.ecoMode.reloadIntervalOrig = this.options.reloadInterval;
                this.options.reloadInterval = this.options.ecoMode.reloadInterval;
                this.stopReloadInterval();
                this.startReloadInterval();
            }
            if (this.options.ecoMode.ecoColumn) {
                this.reload();
            }
        }
    }
}