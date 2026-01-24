import SWAC from './swac.js';
import Msg from './Msg.js';
import Remote from './Remote.js';
import WatchableSet from './WatchableSet.js';
import WatchableSource from './WatchableSource.js';

export default class Model {

    static requestor = {id: 'Model'};
    static requests = new Map();
    static store = new Map();

    /**
     * Loads data (single or multiple) from the resource.
     * 
     * @param {DataRequest} dataRequest Object containing the request data
     * @param {SWACComponent} comp Component requesting data
     * @returns {Promise}
     */
    static load(dataRequest, comp) {
        let thisRef = this;
        return new Promise((resolve, reject) => {
            if (!dataRequest.fromName) {
                reject('DataRequest is invalid. Attribute >fromName< is missing.');
                return;
            }

            // Support filter from URL
            const urlParams = new URLSearchParams(window.location.search);
            const filter = urlParams.getAll('filter');

            for (let curFilter of filter) {
                // Check if filter is applicable for component
                let parts = curFilter.split(',');
                if (!parts[parts.length - 1].startsWith('comps:') || (comp && parts[parts.length - 1].includes(comp.requestor.id))) {
                    // Remove comps entry from filter
                    parts.pop();
                    let filteradd = parts.join(',');
                    if (dataRequest.fromWheres['filter'] && !dataRequest.fromWheres['filter'].includes(filteradd)) {
                        dataRequest.fromWheres['filter'] += '&filter=' + filteradd;
                    } else if (!dataRequest.fromWheres['filter']) {
                        dataRequest.fromWheres['filter'] = filteradd;
                    }
                }
            }

            // Calculate store and request id
            dataRequest.storeId = dataRequest.fromName;
            dataRequest.requestId = dataRequest.fromName;
            if (dataRequest.fromWheres) {
                for (let curWhere in dataRequest.fromWheres) {
                    // Size and page are not relevant for distinct datastore
                    if (curWhere !== 'size' && curWhere !== 'page') {
                        dataRequest.storeId += curWhere + '=' + dataRequest.fromWheres[curWhere];
                    }
                    dataRequest.requestId += curWhere + '=' + dataRequest.fromWheres[curWhere];
                }
            }

            // Calculate fromWheres for lazy loading
            if (comp?.options?.lazyLoading > 0) {
                dataRequest.fromWheres['size'] = comp.options.lazyLoading;
                dataRequest.fromWheres['page'] = comp.lazyLoadPage;
                comp.lastrequest = dataRequest;
            }
            // Calculate fromWheres for ecoMode
            if (comp?.options?.ecoMode?.ecoColumn) {
                let col = comp.options.ecoMode.ecoColumn;
                let ecoFilter = '';
                if (comp.ecoMode.active)
                    ecoFilter = col + ',eq,true';
                else
                    ecoFilter = col + ',eq,false';

                if (dataRequest.fromWheres['filter']) {
                    dataRequest.fromWheres['filter'] += '&' + ecoFilter;
                } else
                    dataRequest.fromWheres['filter'] = ecoFilter;
            }

            // Create datasource if not exists
            if (comp && !comp.data[dataRequest.fromName]) {
                // Create WS for component and (inside WatchableSource) if needed for Model.store
                new WatchableSource(dataRequest.fromName, comp, dataRequest.storeId);
            } else if (!comp) {
                // Create WS if data is requested without component
                new WatchableSource(dataRequest.fromName, Model, dataRequest.storeId);
            }
            
            // Add fromHeaders from comp to request
            if(comp)
                dataRequest.fromHeaders = comp.options.fromHeaders;

            // Check if data is allready loading
            let loadProm = thisRef.requests.get(dataRequest.requestId);
            let timeout = dataRequest.reloadInterval ? dataRequest.reloadInterval : 10000;
            if (!loadProm || loadProm.fromDate < Date.now() - timeout) {
                loadProm = thisRef.getData(dataRequest, comp);
                thisRef.requests.set(dataRequest.requestId, loadProm);
            }
            loadProm.then(function (data) {
                resolve(data);
            }).catch(function (err) {
                if (typeof err !== 'object')
                    Msg.error('model', err, comp);
                reject(err);
            });

        });
    }

    /**
     * Loads the data from best applicable storage.
     * This maybe a local variable, a file or a interface on a url
     * 
     * @param {DataRequest} dataRequest
     * @returns Promise<WatchableSet[]>
     */
    static getData(dataRequest, comp) {
        let thisRef = this;
        // Return promise for loading and initialising the view
        let prom = new Promise((resolve, reject) => {
            let dataCapsule;
            // Check if data is locally available
            let sourceParts = dataRequest.fromName.split('.');
            let gvar = window;
            for (let curPart of sourceParts) {
                if (!gvar[curPart])
                    break;
                gvar = gvar[curPart];
            }
            if (typeof gvar === 'object' && gvar !== window && !gvar.nodeName) {
                Msg.info('model', 'Useing data from global variable for >' + dataRequest.fromName + '<', comp);
                dataCapsule = thisRef.convertData({data: gvar, fromName: dataRequest.fromName}, dataRequest, comp);
                if (comp)
                    comp.lastloaded = dataCapsule.length - 1;
                resolve(dataCapsule);
            } else {
                let fetchUrl = dataRequest.fromName;

                // Get data from remote (fetchGet uses data from first datasource that delivers data)
                Remote.fetchGet(fetchUrl, dataRequest.fromWheres, dataRequest.fromHeaders, true).then(
                        function (dataCapsule) {
                            Msg.info('model', 'Useing data from >' + dataCapsule.fromName + '< for >' + dataRequest.fromName + '<', comp);
                            dataCapsule = thisRef.convertData(dataCapsule, dataRequest, comp);
                            if (comp)
                                comp.lastloaded = dataCapsule.length - 1;
                            resolve(dataCapsule);
                        }
                ).catch(function (e) {
                    if (typeof e.status !== 'undefined') {
                        if (dataRequest.reportErrors !== false) {
                            let errmsg = "Could not get data for >" + dataRequest.fromName + "<  Statuscode: " + e.status;
                            Msg.error('model', errmsg, comp);
                        }
                        reject(e);
                    } else if (e.toString().indexOf('NetworkError') > 0) {
                        // Try download file
                        if (SWAC.config.proxy) {
                            let corsurl = SWAC.config.proxy.replace('%url%', dataRequest.fromName);
                            // Check if file is ziped and activate unzip
                            if (dataRequest.fromName.includes('.zip') || dataRequest.fromName.includes('.gz')) {
                                corsurl += '&unzip=true';
                            }
                            fetch(corsurl, {method: "post",
                                headers: {
                                    'Accept': 'application/json'
                                }
                            }).then(function (res) {
                                // Get path to new file from answer (even if file was not stored in filespace db file is downloaded)
                                res.json().then(function (data) {
                                    if (data.errors[0].startsWith('Error downloading file')) {
                                        reject(e);
                                    }
                                    dataRequest.fromName = '/' + data.path;
                                    thisRef.getData(dataRequest, comp).then(function (dataCapsule) {
                                        resolve(dataCapsule);
                                    }).catch(function (e) {
                                        reject(e);
                                    });
                                });
                            }).catch(function (e) {
                                Msg.error('Model', 'Could not use file download to avoid cors: ' + e, requestor);
                                reject(e);
                            });
                        } else {
                            reject(e);
                        }
                    } else {
                        let errmsg = "Could not get data for >" + dataRequest.fromName + "<  Error: " + e;
                        Msg.error('model', errmsg, comp);
                        reject(e);
                    }
                });
            }
        });
        prom.fromDate = new Date();
        return prom;
    }

    /**
     * Converts the recived data into an array of WatchableSets
     * 
     * @param {Object[]} dataCapsule recived data
     * @param {DataRequest} dataRequest Object with requestdata for the object
     * @param {SWACComponent} comp Component to load data for
     * @returns {WatchableSet[]} Array of WatchableSets
     */
    static convertData(dataCapsule, dataRequest, comp) {
        // Get attribute that contains the id
        let idAttr = dataRequest.idAttr ? dataRequest.idAttr : 'id';

        let data;
        if (dataCapsule?.data?.list) {
            // Metadata support format
            data = dataCapsule.data.list;
            data.metadata = {};
            // Move other recived values to metadata
            for (let i in dataCapsule.data) {
                if (i !== 'list') {
                    data.metadata[i] = dataCapsule.data[i];
                }
            }
        } else if (dataCapsule?.data?.records) {
            // TreeQL format support
            data = dataCapsule.data.records;
        } else if (dataCapsule.data && Array.isArray(dataCapsule.data)) {
            // Raw data formats
            data = dataCapsule.data;
        } else if (dataCapsule.data) {
            data = [dataCapsule.data];
        } else if (Array.isArray(dataCapsule)) {
            data = dataCapsule;
        } else {
            data = [];
            data[0] = dataCapsule;
        }

        // Check if filter contains renamed attributes and rename attrs in filter
//        console.log('TEST comp',comp.options.attributeRenames);
//        for(let curRename of comp.options.attributeRenames) {
//            console.log('TEST rename',curRename);
////            dataRequest.fromWheres.filter = dataRequest.fromWheres.filter.replace(curRename+',',curRename+',');
//        }

        // Note highest new id
        let maxId = Math.max(...data.map(obj => obj[idAttr]));
        if(isNaN(maxId))
            maxId = 0;
        dataRequest.highestId = maxId;

        // Test and transform sets
        let genid = 0;
        let transdata = [];
        let newLoaded = 0;
        for (let i = 0; i < data.length; i++) {
            let curSet = data[i];
            if (!curSet || typeof curSet != 'object')
                continue;
            // Break for lazy loading on sources, that does not support lazy requesting
            if (comp?.options?.lazyLoading > 0 && curSet[idAttr] > comp.lastloaded) {
                if (newLoaded >= comp.options.lazyLoading) {
                    break;
                }
                newLoaded++;
            }
            // If set is included in store, use old set instead, so that observers remain on the set
            if (this.store[dataRequest.storeId]?.hasSet(curSet[idAttr])) {
                let newSet = curSet;
                curSet = this.store[dataRequest.storeId].getSet(curSet[idAttr]);
                // Transfer added information to cached object
                for (let curAttr in newSet) {
                    if (!curSet[curAttr]) {
                        curSet[curAttr] = newSet[curAttr];
                    }
                }
            }
            // Filter data that should not be shown by time
            if (curSet['swac_from']) {
                let fromDate = new Date(curSet['swac_from']);
                if ((new Date().getTime() - fromDate.getTime()) < 0) {
                    continue;
                }
            }

            if (curSet['swac_until']) {
                let untilDate = new Date(curSet['swac_until']);
                if ((new Date().getTime() - untilDate.getTime()) > 0) {
                    continue;
                }
            }
            // Filter for fromWheres (no effect on data from sources that support filtering allready)
//            if (!this.matchFilter(curSet, dataRequest.fromWheres)) {
//                continue;
//            }
            // Set default values
            if (dataRequest.attributeDefaults) {
                let defaults = dataRequest.attributeDefaults.get(dataRequest.fromName);
                let gdefaults = dataRequest.attributeDefaults.get('*');
                if (defaults && gdefaults)
                    defaults = Object.assign(defaults, gdefaults);
                else if (gdefaults)
                    defaults = gdefaults;
                if (defaults) {
                    for (let curAttr in defaults) {
                        if (typeof curSet[curAttr] === 'undefined') {
                            let curVal = defaults[curAttr];
                            // Calculate default value
                            let placeholders = curVal.match(/%\w+%/g);
                            if (placeholders && placeholders.length > 0) {
                                let eq = curVal;
                                let repall = true;
                                for (let curPlaceh of placeholders) {
                                    let curName = curPlaceh.split('%').join('');
                                    if (typeof curSet[curName] !== 'undefined')
                                        eq = eq.replace(curPlaceh, curSet[curName]);
                                    else {
                                        Msg.error('Model', 'Variable >' + curName + '< for calculation >' + eq + '< not found in set >' + dataRequest.fromName + '[' + curSet.id + ']<');
                                        repall = false;
                                        break;
                                    }
                                }
                                if (repall) {
                                    curSet[curAttr] = eval(eq);
                                }
                            } else
                                curSet[curAttr] = curVal;
                        }
                    }
                }
            }

            // Count subsets
            let joinName = dataRequest?.fromWheres?.join;
            if (curSet[joinName]) {
                curSet['swac_joinsetsCount'] = curSet[joinName].length;
                let joinSetIds = [];
                for (let joinSet of curSet[joinName]) {
                    joinSetIds.push(joinSet.id);
                }
                joinSetIds.sort(function (a, b) {
                    return a - b
                });
                curSet['joinsetsIds'] = joinSetIds.join(',');
            } else
                curSet['swac_joinsetsCount'] = 0;

            // Set attribute renameing
            if (dataRequest.attributeRenames) {
                curSet['swac_renamedAttrsByRequest'] = {};
                for (let [curAttr, curRename] of dataRequest.attributeRenames) {
                    if (typeof curSet[curAttr] !== 'undefined') {
                        curSet[curRename] = curSet[curAttr];
                        delete curSet[curAttr];
                        curSet['swac_renamedAttrsByRequest'][curAttr] = curRename;
                    }
                }
            }

            let wset;
            if (curSet.constructor.name !== 'WatchableSet') {
                // Auto generate id
                if (isNaN(curSet[idAttr])) {
                    curSet[idAttr] = ++genid;
                    dataRequest.highestId = curSet[idAttr];
                }
                curSet.swac_fromName = dataRequest.fromName;
                // Transform set
                wset = new WatchableSet(curSet);
            } else {
                wset = curSet;
            }
            wset.swac_dataRequest = dataRequest;
            transdata[curSet[idAttr]] = wset;

            // Add Data to source
            //Model.store[curSet.swac_fromName].addSet(wset);
            if (!Model.store[dataRequest.storeId]) {
                Msg.error('model', 'Model.store for >' + dataRequest.storeId + '< is missing. Autofix by createing one.');
                Model.store[dataRequest.storeId] = {};
                Model.store[dataRequest.storeId] = new WatchableSource(dataRequest.fromName, Model);
            }
            Model.store[dataRequest.storeId].addSet(wset);
        }
        return transdata;
    }

    /**
     * Gets the value definitions of the values that each dataset in the
     * datasource of this requestor can carry.
     * 
     * @param {DOMElement} defRequest Element requesting data
     * @returns {Promise<DataCapsule>} Promise that resolves to an data object with definition
     * information.
     */
    static getValueDefinitions(defRequest) {
        return new Promise((resolve, reject) => {
            if (defRequest.fromName.endsWith('.json')) {
                let lastSlashPos = defRequest.fromName.lastIndexOf('/');
                let filename = defRequest.fromName.substring(lastSlashPos + 1, defRequest.fromName.length);
                defRequest.fromName = defRequest.fromName.replace(filename, 'definition.json');
            }
            Remote.fetchDefs(defRequest.fromName, defRequest.fromWheres, defRequest.fromHeaders, true).then(function (rawCapsule) {
                resolve(rawCapsule.data.attributes);
            }).catch(function (err) {
                reject(err);
            });
        });
    }

    /**
     * Method for saveing data
     * 
     * @param {Object} dataCapsle Casple with data
     * 
     * An data capsle is an object of form;
     * {
     *   data: [
     *      {name:value},
     *      {name:value},
     *      ...
     *   ],
     *   fromName: 'path where the data was recived from'
     * }
     * @param {boolean} supressMessages Supress errormessages generated by the model
     * 
     * @returns {Promise} Returns an promise that resolves with the information
     * deliverd by the save or update REST-interface
     */
    static save(dataCapsle, supressMessages = false) {
// Return promise for loading and initialising the view
        return new Promise((resolve, reject) => {
            // Build "create" interface resource url
            if (typeof dataCapsle.fromName === 'undefined') {
                Msg.error('model', 'fromName in datacapsle is missing. Check your dataCapsle metadata.');
            }
            Remote.clearDatasourceStates();
            let saveProms = [];
            // Save every dataset
            for (let j in dataCapsle.data) {
                // Exclude non data attributes
                if (j === 'map') // || (j.startsWith('swac_') && j !== 'swac_from'))
                    continue;
                if (dataCapsle.data[j].swac_isnew) {
                    delete dataCapsle.data[j].id;
                }
                let saveObj = {};
                // Check data if it can be converted to number or booelan
                for (let attr in dataCapsle.data[j]) {
                    let curValue = dataCapsle.data[j][attr];
                    // TODO Send null values? Remove null check in component.js and edit.js
                    if (curValue === null) // || (attr.startsWith('swac_') && j !== 'swac_from'))
                        continue;
                    if (typeof curValue === 'string' && curValue !== '') {
                        let num = new Number(curValue);
                        if (!isNaN(num)) {
                            saveObj[attr] = num;
                            continue;
                        }
                    }
                    if (curValue === 'false') {
                        saveObj[attr] = false;
                    } else if (curValue === 'true') {
                        saveObj[attr] = true;
                    } else {
                        saveObj[attr] = curValue;
                    }
                }

                let remoteFunc;
                let remoteSuccMsg;
                let remoteFailMsg;
                // Check if create or update should be used
                if (typeof saveObj.id === 'undefined' || saveObj.id === '') {
                    // Create
                    remoteFunc = Remote.fetchCreate;
                    remoteSuccMsg = SWAC.lang.dict.core.savesuccsess;
                    remoteFailMsg = SWAC.lang.dict.core.saveerror;
                } else {
                    // Update
                    remoteFunc = Remote.fetchUpdate;
                    remoteSuccMsg = SWAC.lang.dict.core.updatesuccsess;
                    remoteFailMsg = SWAC.lang.dict.core.updateerror;
                }
                // Send request
                let curSaveProm = remoteFunc(dataCapsle.fromName, dataCapsle.fromWheres, dataCapsle.fromHeaders, supressMessages, saveObj).then(
                        function (dataCap) {
                            if (!supressMessages) {
                                UIkit.notification({
                                    message: remoteSuccMsg,
                                    status: 'info',
                                    timeout: SWAC.config.notifyDuration,
                                    pos: 'top-center'
                                });
                            }
                            if (dataCap?.data?.records) {
                                // Deliver records as plain array
                                dataCap.data = dataCap.data.records;
                            } else if (dataCap.data && typeof dataCap.data === 'number') {
                                // Deliver id as set
                                dataCap.data = [{id: dataCap.data}];
                            }

                            // Give the response dataCapsle to Promise.all()
                            return dataCap;
                        }
                ).catch(function (err) {
                    if (!supressMessages) {
                        UIkit.notification({
                            message: remoteFailMsg,
                            status: 'info',
                            timeout: SWAC.config.notifyDuration,
                            pos: 'top-center'
                        });
                    }
                    // Show http error response
                    if (err.statusText) {
                        Msg.error('Model', 'Error in save / update request: Status: ' + err.status + ': ' + err.statusText);
                    } else {
                        Msg.error('Model', 'Error while processing save / update request: ' + err);
                    }
                    // Give err to Promise.all()
                    reject(err);
                }
                );
                saveProms.push(curSaveProm);
            }

            // Wait for all datasets to be saved
            Promise.all(saveProms).then(function (dataCaps) {
                // Return all response dataCapsle
                resolve(dataCaps);
            });
        });
    }

    /**
     * Method for deleteing data
     * 
     * @param {Object} dataCapsle Casple with data
     * @param {boolean} supressErrorMessages If true automatic generated error messages are supressed.
     * 
     * An data capsle is an object of form;
     * {
     *   data: [
     *      {id:value},
     *      {id:value},
     *      ...
     *   ],
     *   fromName: 'path where the data was recived from'
     * }
     * 
     * @returns {Promise} Returns an promise that resolves with the information
     * deliverd by the delete REST-interface
     */
    static delete(dataCapsle, supressErrorMessages = false) {
// Return promise for loading and initialising the view
        return new Promise((resolve, reject) => {
            if (!dataCapsle.fromName) {
                Msg.error('model', 'fromName in datacapsle is missing. Check your dataCapsle metadata.');
            }
            // Delete every dataset
            for (let j in dataCapsle.data) {
                if (dataCapsle.data[j].id) {
                    // Send request
                    Remote.fetchDelete(dataCapsle.fromName + "/" + dataCapsle.data[j].id, dataCapsle.data[j], dataCapsle.fromHeaders, supressErrorMessages).then(
                            function (response) {
                                UIkit.notification({
                                    message: SWAC.lang.dict.core.deletesuccsess,
                                    status: 'info',
                                    timeout: SWAC.config.notifyDuration,
                                    pos: 'top-center'
                                });
                                resolve(response);
                            }
                    ).catch(
                            function (errors) {
                                UIkit.notification({
                                    message: SWAC.lang.dict.core.deleteerror,
                                    status: 'info',
                                    timeout: SWAC.config.notifyDuration,
                                    pos: 'top-center'
                                });
                                reject(errors);
                            }
                    );

                } else {
                    Msg.error('model', 'Dataset given to delete has no id.');
                }
            }
        });
    }

    /**
     * Resolves an reference to the single element and returns that.
     * 
     * @param {String} reference Reference url (starting with ref://)
     * @param {String} idAttr Name of the attribute used as id
     * @param {Map} attributeDefaults Default values for attributes Map<Sourcename,Object<Attribute,Value>>
     * @param {Map} attributeRenames Renameings for attributes
     * @param {int} reloadInterval Time in milliseconds after which data should no loger be used from local
     * @param {DataObserver[]} observers Objects that implement the DataObserver
     * @return {Promise<DataCapsule>} Promise that resolves to the data if succsessfull
     */
    static getFromReference(reference, idAttr, attributeDefaults, attributeRenames, reloadInterval, observers, comp) {
        Msg.flow('Model', 'getFromReference(' + reference + ')', this.requestor);
        let thisRef = this;
        return new Promise((resolve, reject) => {
            if (!reference) {
                Msg.error('Model', 'No reference given to get data from.');
                reject('No reference given to get data from.');
                return;
            }
            if (reference.indexOf('ref://') !== 0) {
                Msg.error('model', 'Given string >' + reference + '< is not a valid refernece.');
                reject('Given string >' + reference + '< is not a valid refernece.');
                return;
            }
            let dataRequest = {
                fromName: thisRef.getFromnameFromReference(reference),
                fromWheres: {},
                idAttr: idAttr,
                attributeDefaults: attributeDefaults,
                attributeRenames: attributeRenames,
                reloadInterval: reloadInterval,
                observers: observers
            };
            let setid = thisRef.getIdFromReference(reference);
            if (setid) {
                dataRequest.fromWheres['id'] = setid;
            }
            let params = thisRef.getParametersFromReference(reference);
            if (params) {
                for (let curParam of params) {
                    if (dataRequest.fromWheres[curParam.key])
                        dataRequest.fromWheres[curParam.key] = dataRequest.fromWheres[curParam.key] + '&' + curParam.key + '=' + curParam.value;
                    else
                        dataRequest.fromWheres[curParam.key] = curParam.value;
                }
            }

            thisRef.load(dataRequest, comp).then(function (data) {
                let dataCapsule = {
                    fromName: dataRequest.fromName,
                    data: data
                };
                resolve(dataCapsule);
            }).catch(function (error) {
                reject(error);
            });
        });
    }

    /**
     * Gets the id from the reference string
     * 
     * @param {String} reference Reference string
     * @returns {Long} Number of the referenced object
     */
    static getIdFromReference(reference) {
        let lastSlashPos = reference.lastIndexOf('/');
        let idrefpart = reference.substring(lastSlashPos);
        let matches = idrefpart.match(/\d+/);
        if (!matches) {
            Msg.warn("model", "Reference contains no number.");
            return null;
        }
        let numbers = matches.map(Number);
        let withoutId = idrefpart;
        for (let curNumber of numbers) {
            withoutId = withoutId.replace(curNumber, '');
        }
        if (withoutId.length > 0) {
            Msg.info('model', 'Reference >' + reference + '< contains a number at the end.');
            return null;
        }
        return numbers[0];
    }

    /**
     * Gets the fromname form the reference string
     * 
     * @param {String} reference Refernece string (ref://)
     * @returns {String} Name of the source the reference points to
     */
    static getFromnameFromReference(reference) {
        let setname = reference.replace('ref://', '');
        if (setname.includes('?')) {
            let lastaskpos = setname.lastIndexOf('?');
            setname = setname.substring(0, lastaskpos);
        } else if (setname.endsWith('.json')) {
            // Return filename
        } else if (setname.includes('.')) {
            // Leaf file as it is
            let lastSlashPos = setname.lastIndexOf('/');
            let idrefpart = reference.substring(lastSlashPos);
            let matches = idrefpart.match(/\d+/);
            if (matches)
                setname = setname.substring(0, lastSlashPos);
        } else if (setname.includes('/') && !setname.includes('?storage')) {
            let lastSlashPos = setname.lastIndexOf('/');
            let idrefpart = reference.substring(lastSlashPos);
            let matches = idrefpart.match(/\d+/);
            if (matches)
                setname = setname.substring(0, lastSlashPos);
        }
        return setname;
    }

    /**
     * Gets the params that are stored in the reference.
     * 
     * @param {String} reference String begining with ref://
     * @returns {Object[]} Objects with key and value attribute for each param
     */
    static getParametersFromReference(reference) {
        if (reference.includes('?')) {
            let firstaskpos = reference.indexOf('?');
            let paramsstr = reference.substring(firstaskpos + 1, reference.length);
            let paramsarr = paramsstr.split('&');
            let params = [];
            for (let curParam of paramsarr) {
                let param = curParam.split('=');
                params.push({
                    key: param[0],
                    value: param[1]
                });
            }
            return params;
        }
        return null;
    }

    /**
     * Copys a requestor. If given attributes from the second parameter are 
     * inserted into placeholders whithin the requestors fromWhere clauses.
     * 
     * @param {DataRequestor} dataRequestor DataRequestor source object
     * @param {DOMElement} attrElem DOM Element containing attributes that should be placed in the requestors where clauses
     * @returns {DataRequestor}
     */
    static copyDataRequestor(dataRequestor, attrElem) {
        // Copy requestor
        let newRequestor = {};
        newRequestor.fromName = dataRequestor.fromName;
        newRequestor.fromWheres = {};
        for (let attr in dataRequestor.fromWheres) {
            newRequestor.fromWheres[attr] = dataRequestor.fromWheres[attr];
        }

        // Replace palceholders in wheres
        for (let curWhereName in newRequestor.fromWheres) {
            let curWhereValue = newRequestor.fromWheres[curWhereName];
            // If its a placeholder
            if (curWhereValue.indexOf('{') === 0) {
                let attrName = curWhereValue.replace('{', '').replace('}', '');
                // Get attr value from element
                let attrValue = attrElem.getAttribute(attrName);
                // Replace placeholder
                newRequestor.fromWheres[curWhereName] = attrValue;
            }
        }

        return newRequestor;
    }

    /**
     * Add set to store bucket, when some observed WatchableSet informs about an added set
     * 
     * @param {WatchableSource} source Source where the set was added
     * @param {WatchableSet} set Added set
     */
    static notifyAddSet(source, set) {
        if (!this.store[set.swac_fromName].hasSet(set.id))
            this.store[set.swac_fromName].addSet(set);
    }

    /**
     * Delete set from store bucket when some observed WatcableSet informs about an deleted set
     * 
     * @param {WatchableSource} source Source where the set was added
     * @param {WatchableSet} set Added set
     */
    static notifyDelSet(set) {
        if (this.store[set.swac_fromName].hasSet(set.id))
            this.store[set.swac_fromName].delSet(set);
    }

    static createWatchableSource(fromName, comp) {
        return new WatchableSource(fromName, comp);
    }

    static createWatchableSet(set) {
        return new WatchableSet(set);
    }
}


