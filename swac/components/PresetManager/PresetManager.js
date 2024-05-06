import SWAC from '../../swac.js';
import View from '../../View.js';
import Msg from '../../Msg.js';

/**
 * Sample component for development of own components
 */
export default class PresetManager extends View {

    /*
     * Constructs a new component object and transfers the config to the
     * object
     */
    constructor(options = {}) {
        super(options);
        this.name = 'PresetManager';
        this.desc.text = 'Manage presets for database objects like tables and datasets.';
        this.desc.developers = 'Florian Fehring (FH Bielefeld)';
        this.desc.license = 'GNU Lesser General Public License';

        this.desc.templates[0] = {
            name: 'default',
            style: 'default',
            desc: 'Default template.'
        };
        this.desc.reqPerTpl[0] = {
            selc: 'cssSelectorForRequiredElement',
            desc: 'Description why the element is expected in the template'
        };
        this.desc.optPerTpl[0] = {
            selc: 'cssSelectorForOptionalElement',
            desc: 'Description what is the expected effect, when this element is in the template.'
        };
        this.desc.optPerPage[0] = {
            selc: 'cssSelectorForOptionalElement',
            desc: 'Description what the component does with the element if its there.'
        };
        this.desc.reqPerSet[0] = {
            name: 'id',
            desc: 'The attribute id is required for the component to work properly.'
        };
        this.desc.reqPerSet[1] = {
            name: 'name',
            desc: 'Preset name'
        };
        this.desc.reqPerSet[2] = {
            name: 'desc',
            desc: 'Preset description'
        };
        this.desc.reqPerSet[3] = {
            name: 'version',
            desc: 'Preset version'
        };
        this.desc.optPerSet[0] = {
            name: 'nameOfTheAttributeOptionalInEachSet',
            desc: 'Description what is the expected effect, when this attribute is in the set.'
        };


        this.desc.opts[0] = {
            name: "targetSource",
            desc: "Source definition (like in configuration.js) to the source that should be used to install the presets. If no one is given it uses the first one configured in applications configuration.js.",
            example: {
                url: "/SmartData/smartdata/[iface]/[fromName]?storage=smartmonitoring",
                interfaces: {
                    get: ['GET', 'records'],
                    list: ['GET', 'records'],
                    defs: ['GET', 'collection'],
                    create: ['POST', 'records'],
                    update: ['PUT', 'records'],
                    delete: ['DELETE', 'records']
                }
            }
        };
        if (!options.targetSource)
            this.options.targetSource = null;

        if (!options.showWhenNoData)
            this.options.showWhenNoData = true;

        // Internal attributes
        this.installstates = new Map();
        this.updateable = new Map();
    }

    init() {
        return new Promise((resolve, reject) => {

            // Get SmartData datasource
            for (let curSource of window.swac.config.datasources) {
                let index = curSource.url.indexOf('/smartdata/');
                if (index > 0) {
                    this.options.targetSource = curSource;
                    break;
                }
            }

            resolve();
        });
    }

    afterAddSet(set, repeateds) {
        Msg.flow('PresetManager', 'afterAddSet()', this.requestor);
        let partTpl = repeateds[0].querySelector('.swac_presetmanager_repeatForPart');
        let thisRef = this;
        let stateProms = [];
        // Call each state function
        for (let curState of set.state) {
            let stateProm = new Promise((resolve, reject) => {
                // Create detail entry
                let partElem = partTpl.cloneNode(true);
                partElem.classList.remove('swac_presetmanager_repeatForPart');
                let partAElem = partElem.querySelector('.swac_presetmanager_partname');
                partAElem.innerHTML = curState.name;
                partAElem.href = '#';
                partTpl.parentElement.appendChild(partElem);

                let stateInst = true;
                let stateTxt = 'installed';
                if (curState.type === 'rest') {
                    let url = this.options.targetSource.url.replace('[fromName]', curState.fromName);
                    let fetchopts = {};
                    if (this.options.targetSource.interfaces) {
                        url = url.replace('[iface]', this.options.targetSource.interfaces[curState.method][1]);
                        fetchopts.method = this.options.targetSource.interfaces[curState.method][0];
                    }
                    if (curState.filter) {
                        if (url.includes('?'))
                            url += '&';
                        else
                            url += '?';
                        url += 'filter=' + curState.filter;
                    }
                    // Set url to info output
                    partAElem.href = url;
                    // Fetch test request
                    fetch(url, fetchopts).then(function (res) {
                        res.json().then(function (json) {
                            // Look at first (and should be the only one) result object if response is from TreeQL api.
                            let data;
                            if (json.records) {
                                data = json.records[0];
                            }
                            // Do checks if needed
                            if (curState.check) {
                                let checks = curState.check.split(';');
                                for (let curCheck of checks) {
                                    let checkparts = curCheck.split('=');
                                    if ((data[checkparts[0]] + '') != checkparts[1]) {
                                        stateInst = false;
                                        stateTxt = 'check failed';
                                        break;
                                    }
                                }
                            } else if (!res.ok) {
                                stateInst = false;
                                stateTxt = 'API responded with ' + res.status;
                                if (json.errors) {
                                    stateTxt += ' ' + json.errors[0];
                                }
                            } else {
                                stateTxt = 'reachable';
                                // Check if there is a data entry matching the collection check
                                if (set.data) {
                                    let dataProms = [];
                                    for (let curData of set.data) {
                                        if (curData.fromName === curState.fromName && curData.body && curData.checkfor) {
                                            let checkFors = curData.checkfor.split(',');
                                            console.log('TEST checkFors', checkFors);
                                            // Look at each data entry
                                            for (let curBodyEntry of curData.body) {
                                                console.log('TEST curBody', curBodyEntry);
                                                let url = thisRef.options.targetSource.url.replace('[fromName]', curState.fromName);

                                                let fetchopts = {};
                                                console.log('TEST here 1', thisRef.options.targetSource.interfaces['get']);
                                                if (thisRef.options.targetSource.interfaces) {
                                                    url = url.replace('[iface]', thisRef.options.targetSource.interfaces['get'][1]);
                                                    fetchopts.method = thisRef.options.targetSource.interfaces['get'][0];
                                                }
                                                console.log('TEST here 2');
                                                let searchedSet = {};
                                                for (let curCheckFor of checkFors) {
                                                    console.log('TEST checkFor', curCheckFor);
                                                    if (!curBodyEntry[curCheckFor]) {
                                                        console.log('TEST not found!', curCheckFor);
                                                        continue;
                                                    }
                                                    searchedSet[curCheckFor] = curBodyEntry[curCheckFor];
                                                    if (!url.includes('?'))
                                                        url += '?';
                                                    else
                                                        url += '&';
                                                    url += 'filter=' + curCheckFor + ',eq,' + curBodyEntry[curCheckFor];
                                                }
                                                console.log('TEST url', url);
                                                let dataFetch = fetch(url, fetchopts);
                                                dataFetch.then(function (res) {
                                                    res.json().then(function (j) {
                                                        console.log('TEST json ', j, j.records.length);
                                                        if (j.records.length > 0) {
                                                            partElem.querySelector('.swac_presetmanager_partinst').innerHTML += JSON.stringify(searchedSet) + ',';
                                                        } else {
                                                            partElem.querySelector('.swac_presetmanager_partmiss').innerHTML += JSON.stringify(searchedSet) + ',';
                                                            if (!thisRef.updateable.has(set.fromName + '_' + set.id)) {
                                                                thisRef.updateable.set(set.fromName + '_' + set.id, {
                                                                    name: curData.name + '_update',
                                                                    fromName: curData.fromName,
                                                                    method: curData.method,
                                                                    body: [curBodyEntry]
                                                                });
                                                            } else {
                                                                thisRef.updateable.get(set.fromName + '_' + set.id).body.push(curBodyEntry);
                                                            }
                                                            repeateds[0].querySelector('.swac_presetmanager_updates').innerHTML = thisRef.updateable.get(set.fromName + '_' + set.id).body.length;
                                                            repeateds[0].querySelector('.swac_presetmanager_update').removeAttribute('disabled');
                                                        }
                                                    });
                                                    console.log('TEST fetch suc', res);

                                                }).catch(function (err) {
                                                    console.log('TEST fetch err', err);
                                                });
                                                dataProms.push(dataFetch);
                                            }
                                        }
                                    }
                                    Promise.all(dataProms).then(function (res) {

                                    }).catch(function (err) {
                                        UIkit.modal.alert(window.swac.lang.dict.PresetManager.datacheckerr + ': ' + err);
                                    });
                                }
                            }
                            thisRef.installstates.set(set.name + '_' + curState.name, stateInst);
                            // Set state txt
                            partElem.querySelector('.swac_presetmanager_partstate').innerHTML = stateTxt;

                            resolve({curState, stateInst});
                        }).catch(function (err) {
                            if (res.status === 404) {
                                partElem.querySelector('.swac_presetmanager_partstate').innerHTML = 'API is not reachable.';
                            } else {
                                partElem.querySelector('.swac_presetmanager_partstate').innerHTML = err;
                            }
                        });
                    }).catch(function (err) {
                        Msg.error('PresetManager', 'Error fetching response: ' + err, thisRef.requestor);
                        reject(err);
                    });
                } else {
                    reject("Type >" + curState.type + "< for checking functions state is currently not supported.");
                }
            });
            stateProms.push(stateProm);
        }

        let funcElem = repeateds[0];

        // Wait until all state checks have a result
        Promise.all(stateProms).then(function (results) {
            let itrue = 0;
            let ifalse = 0;
            for (let curRes of results) {
                if (curRes.stateInst)
                    itrue++;
                else
                    ifalse++;
            }

            // Hide or show button
            if (itrue === results.length) {
                funcElem.querySelector('.install').classList.add('swac_dontdisplay');
                funcElem.querySelector('.uninstall').classList.remove('swac_dontdisplay');
            } else if (ifalse === results.length) {
                funcElem.querySelector('.install').classList.remove('swac_dontdisplay');
                funcElem.querySelector('.uninstall').classList.add('swac_dontdisplay');
            } else {
                funcElem.querySelector('.install').classList.remove('swac_dontdisplay');
                funcElem.querySelector('.uninstall').classList.remove('swac_dontdisplay');
                funcElem.querySelector('.notice').innerHTML = window.swac.lang.dict.PresetManager.statesome;
            }
        }).catch(function (err) {
            funcElem.querySelector('.install').classList.add('swac_dontdisplay');
            funcElem.querySelector('.uninstall').classList.add('swac_dontdisplay');
            funcElem.querySelector('.notice').innerHTML = window.swac.lang.dict.PresetManager.stateerr + ' ' + err;
        });

        // Register event listener to buttons
        let activateBtns = funcElem.querySelectorAll('.install, .uninstall');
        for (let curBtn of activateBtns) {
            curBtn.addEventListener('click', thisRef.onUnInstall.bind(thisRef));
        }
        let updateBtns = funcElem.querySelectorAll('.swac_presetmanager_update');
        for (let curBtn of updateBtns) {
            curBtn.addEventListener('click', thisRef.onUpdate.bind(thisRef));
        }
    }

    onUnInstall(evt) {
        evt.preventDefault();
        let setElem = evt.target;
        while (!setElem.classList.contains('swac_repeatedForSet') && setElem.parentElement) {
            setElem = setElem.parentElement;
        }

        let set = setElem.swac_dataset;
        let mode = 'install';
        if (evt.target.classList.contains('uninstall')) {
            mode = 'uninstall';
        }

        if (set.collections)
            this.unInstallCollections(set, mode);
        else if (set.data)
            this.unInstallData(set, mode);

    }

    /**
     * Create or delete collections
     * 
     * @param {WatchableSet} set    Set with collection definition
     * @param {String} mode     install or uninstall
     * @returns {undefined}
     */
    unInstallCollections(set, mode) {
        let thisRef = this;
        this.unInstall(set, set.collections, mode).then(function (res) {
            if (!set.data) {
                let suTxt = window.swac.lang.dict.PresetManager.uninstalled;
                if (mode === 'install')
                    suTxt = window.swac.lang.dict.PresetManager.installed;

                let modal = UIkit.modal.alert(suTxt);
                modal.then(function () {
                    location.reload();
                });
            } else {
                thisRef.unInstallData(set, mode);
            }
        }).catch(function (err) {
            let suTxt;
            if (mode === 'install') {
                suTxt = window.swac.lang.dict.PresetManager.installerr;
            } else {
                suTxt = window.swac.lang.dict.PresetManager.uninstallerr;
            }
            let modal = UIkit.modal.alert(suTxt + ': ' + err);
            modal.then(function () {
                location.reload();
            });
        });
    }

    /**
     * Create or delete data
     * 
     * @param {WatchableSet} set    Set with data definition
     * @param {String} mode     install or uninstall
     * @returns {undefined}
     */
    unInstallData(set, mode) {
        if (mode === 'uninstall') {
            let modal = UIkit.modal.alert(window.swac.lang.dict.PresetManager.uuninstalled + "Datensätze können in dieser Version nicht deinstalliert werden. Bitte deinstallieren Sie diese manuell.");
            modal.then(function () {
                location.reload();
            });
        }

        this.unInstall(set, set.data, mode).then(function (res) {
            if (mode === 'install') {
                let modal = UIkit.modal.alert(window.swac.lang.dict.PresetManager.installed);
                modal.then(function () {
                    location.reload();
                });
            } else {
                // mode == 'uninstall
                if (res.every(result => result === true)) {
                    let modal = UIkit.modal.alert(window.swac.lang.dict.PresetManager.uninstalled);
                    modal.then(function () {
                        location.reload();
                    });
                } else {
                    let modal = UIkit.modal.alert(window.swac.lang.dict.PresetManager.uuninstalled + "Datensätze können in dieser Version nicht deinstalliert werden. Bitte deinstallieren Sie diese manuell.");
                    modal.then(function () {
                        location.reload();
                    });
                }
            }
        }).catch(function (err) {
            let msg;
            if (mode === 'install') {
                msg = window.swac.lang.dict.PresetManager.installdataerr;
            } else {
                msg = window.swac.lang.dict.PresetManager.uninstalldataerr;
            }

            err.json().then(function (j) {
                if (j.errors) {
                    let modal = UIkit.modal.alert(msg += ' ' + j.errors[0]);
                    modal.then(function () {
                        location.reload();
                    });
                } else {
                    let modal = UIkit.modal.alert(msg += ' ' + err);
                    modal.then(function () {
                        location.reload();
                    });
                }
            }).catch(function (err) {
                let modal = UIkit.modal.alert(msg += ' ' + err);
                modal.then(function () {
                    location.reload();
                });
            });
        });
    }

    /**
     * Action when user clicks on update button
     */
    onUpdate(evt) {
        evt.preventDefault();
        // Get set element
        let setElem = this.findRepeatedForSet(evt.target);
        let set = setElem.swac_dataset;
        let updates = this.updateable.get(set.fromName + '_' + set.id);

        this.unInstall(set, [updates], 'install').then(function (res) {
            let modal = UIkit.modal.alert(window.swac.lang.dict.PresetManager.updated);
            modal.then(function () {
                location.reload();
            });
        }).catch(function (err) {
            let msg = window.swac.lang.dict.PresetManager.updateerr;
            err.json().then(function (j) {
                if (j.errors) {
                    let modal = UIkit.modal.alert(msg += ' ' + j.errors[0]);
                    modal.then(function () {
                        location.reload();
                    });
                } else {
                    let modal = UIkit.modal.alert(msg += ' ' + err);
                    modal.then(function () {
                        location.reload();
                    });
                }
            }).catch(function (err) {
                let modal = UIkit.modal.alert(msg += ' ' + err);
                modal.then(function () {
                    location.reload();
                });
            });
        });
    }

    /**
     * Install or uninstall database objects
     * 
     * @param {WatchableSet} set    Set with database object definitions
     * @param {Object[]} parts      Array of object definitions
     * @param {String} mode         install or uninstall
     * @returns {undefined}
     */
    unInstall(set, parts, mode) {
        return new Promise((resolve, reject) => {
            let fetches = [];
            // Create needed tables
            for (let curPart of parts) {

                // Build request url
                let url = this.options.targetSource.url.replace('[fromName]', curPart.fromName);
                let fetchopts = {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                };
                if (this.options.targetSource.interfaces) {
                    if (!this.options.targetSource.interfaces[curPart.method]) {
                        let msg = window.swac.lang.replacePlaceholders(window.swac.lang.dict.PresetManager.interfaceerr, 'interface', curPart.method);
                        UIkit.modal.alert(msg);
                        return;
                    }
                    url = url.replace('[iface]', this.options.targetSource.interfaces[curPart.method][1]);
                    fetchopts.method = this.options.targetSource.interfaces[curPart.method][0];
                }
                if (curPart.filter) {
                    if (url.includes('?'))
                        url += '&';
                    else
                        url += '?';
                    url += 'filter=' + curPart.filter;
                }
                // Install
                if (mode === 'install') {
                    // Ignore if allready installed
                    if (this.installstates.has(set.name + '_' + curPart.name) && this.installstates.get(set.name + '_' + curPart.name)) {
                        continue;
                    }
                    fetchopts.body = curPart.body;
                    if (typeof curPart.body === 'object')
                        fetchopts.body = JSON.stringify(curPart.body);

                    let curFetch = fetch(url, fetchopts);
                    fetches.push(curFetch);
                    curFetch.then(function (res) {
                        if (!res.ok) {
                            reject(res);
                        }
                    }).catch(function (err) {
                        reject(err);
                    });
                } else {
                    let curFetch = fetch(url, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                    fetches.push(curFetch);
                    curFetch.then(function (res) {
                        if (!res.ok) {
                            reject(res);
                        }
                    }).catch(function (err) {
                        reject(err);
                    });
                }
            }

            Promise.all(fetches).then(function (res) {
                resolve(res);
            }).catch(function (err) {
                reject(err);
            });
        });
    }
}


