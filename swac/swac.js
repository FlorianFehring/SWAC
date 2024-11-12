import Msg from './Msg.js';
import Language from './Language.js';
import OnlineReactions from './OnlineReactions.js';
import ViewHandler from './ViewHandler.js';
import Reactions from './Reactions.js';
import Model from './Model.js';

/* 
 * This is the SmartWebApp entry points. It automatically detects, what 
 * components are used on the page and loads the needed component files.
 */
var SWAC = {
    desc: {
        name: 'core',
        version: '12.11.2024'
    },
    config: {},
    msgs: new Map(),
    lang: null,
    reactions: null,
    loadedComponents: new Map(),
    loadingdependencies: [],
    loadeddependencies: [],
    loadedAlgorithms: {},
    loadTemplates: new Map(),
    loadedTemplates: new Map(),
    storage: {},
    waitingModal: false
};
SWAC.storage.files = {};
export default SWAC;

window.swac = SWAC;
document.addEventListener("DOMContentLoaded", function () {
    SWAC.init();
});

SWAC.init = function () {
    this.lang = new Language();
    this.reactions = new Reactions();
    // Init global storage
    this.msgs.set(undefined, {
        errors: [],
        warnings: [],
        infos: [],
        flows: [],
        hints: []
    });
    this.msgs.set(Model.requestor, {
        errors: [],
        warnings: [],
        infos: [],
        flows: [],
        hints: []
    });
    this.Msg = Msg;
    this.Model = Model;

    // Locate swac
    let auto_swac_root;
    let scriptTags = document.getElementsByTagName('script');
    for (let curScript of scriptTags) {
        let swacPos = curScript.src.indexOf('swac/swac.js');
        if (swacPos >= 0) {
            auto_swac_root = curScript.src.substr(0, swacPos);
            auto_swac_root = auto_swac_root.replace(window.location.protocol + '//' + window.location.host, '');
            auto_swac_root += 'swac/';
            break;
        }
    }
    // Locate app
    let siteFoldPos = window.location.pathname.indexOf("/sites/");
    let app_root;
    if (siteFoldPos > -1) {
        app_root = window.location.pathname.substr(0, siteFoldPos);
    } else if (window.location.pathname.includes('/index.html')) {
        app_root = window.location.pathname.replace('/index.html', '');
    } else {
        app_root = window.location.pathname.substr(0, window.location.pathname.length - 1);
    }
    if (app_root === '/')
        app_root = '';
    if (window.location.pathname.includes('/swac/offline/sites/')) {
        app_root = app_root.replace('/swac/offline', '');
    }
    // Load configuration
    let thisRef = this;
    let scriptElem = document.createElement('script');
    scriptElem.setAttribute('src', app_root + '/configuration.js');
    scriptElem.addEventListener('load', function () {
        thisRef.config = SWAC_config;
        thisRef.config.app_root = app_root;
        if (!thisRef.config.swac_root) {
            thisRef.config.swac_root = auto_swac_root;
        }
        if (thisRef.config.debugmode || SWAC.getParameterFromURL('debug', window.location)) {
            thisRef.config.debugmode = true;
            let devhelperRequestor = document.createElement('div');
            devhelperRequestor.id = 'swac_devhelper';
            devhelperRequestor.setAttribute('swa', 'Devhelper');
            document.body.appendChild(devhelperRequestor);
            let vers = document.createElement('span');
            vers.classList.add('swac_version');
            vers.innerHTML = SWAC.desc.version;
            vers.style = 'z-index:99;position:fixed;bottom:0px;right:0px;';
            document.body.appendChild(vers);
        }
        SWAC.replaceGlobalPlaceholders();
        SWAC.loadGlobalComponents();
        document.dispatchEvent(new CustomEvent('swac_ready'));
    });
    scriptElem.addEventListener('error', function () {
        console.error('Could not load >' + scriptElem.src + '<');
        alert("configuration.js could not be found. It is expected in " + app_root + '/configuration.js');
    });
    document.head.appendChild(scriptElem);
};

/**
 * Loads the global components
 * 
 * @returns {undefined}
 */
SWAC.loadGlobalComponents = function () {
    // Add "add to homescreen" functionality
    if (this.config.progressive.active || this.config.installable) {
        let linkElem = document.createElement('link');
        linkElem.setAttribute('rel', 'manifest');
        linkElem.setAttribute('href', this.config.app_root + '/manifest.json');
        document.head.appendChild(linkElem);
    }
    // Load and start serviceworker
    if (this.config.progressive.active && 'serviceWorker' in navigator) {
        Msg.flow('SWACProgressive', 'Try registering ServiceWorker >' + this.config.app_root + 'serviceworker.js< For details what the ServiceWorker does and debugging look at the ServiceWorker console. (Firefox: about:debugging#/runtime/this-firefox)');
        let thisRef = this;
        // Register swac serviceworker
        navigator.serviceWorker.register(this.config.app_root + '/serviceworker.js')
                .then(function (registration) {
                    if (registration.installing) {
                        thisRef.serviceWorker = registration.installing;
                        Msg.flow('SWACProgressive', 'ServiceWorker is now installing');
                    }
                    if (registration.waiting) {
                        thisRef.serviceWorker = registration.waiting;
                        Msg.flow('SWACProgressive', 'ServiceWorker is now waiting');
                        // Wait for language lodade
                        document.addEventListener('uiComplete', function (evt) {
                            UIkit.notification({
                                message: '<span uk-icon=\'icon: info\'></span> ' + SWAC.lang.dict.core.updateavail,
                                status: 'primary',
                                timeout: 0
                            });
                        });
                    }
                    if (registration.active) {
                        thisRef.serviceWorker = registration.active;
                        Msg.flow('SWACProgressive', 'ServiceWorker is now active');
                        thisRef.serviceWorker.postMessage('{"action":"setAppRoot","value": "' + thisRef.config.app_root + '"}');
                    }
                    registration.addEventListener("updatefound", () => {
                        Msg.flow('SWACProgressive', 'ServiceWorker is now installing update');
                    });
                    if (thisRef.serviceWorker) {
                        // logState(serviceWorker.state);
                        thisRef.serviceWorker.addEventListener('statechange', function (e) {
                            Msg.flow('SWACProgressive', 'ServiceWorker is now ' + e.target.state);
                            if (e.target.state === 'activated') {
                                thisRef.serviceWorker.postMessage('{"action":"setAppRoot","value": "' + thisRef.config.app_root + '"}');
                                if (thisRef.config.progressive.cachefiles)
                                    thisRef.serviceWorker.postMessage('{"action":"setCacheFiles","value": ' + JSON.stringify(thisRef.config.progressive.cachefiles) + '}');
                                else
                                    Msg.info('Got not files from config.progressive.cachefiles for cacheing.');
                                // Cache version depending files
                                thisRef.serviceWorker.postMessage('{"action":"cacheSWACVersion","value": "' + SWAC.desc.version + '"}');
                                // Cache the page and its components over that the app was entered
                                thisRef.serviceWorker.postMessage('{"action":"cacheEnterPage","value": "' + window.location.href + '"}');
                            }
                        });
                    }
                }).catch(function (err) {
            Msg.error('ServiceWorker', 'ServiceWorker script >' + thisRef.config.app_root + '/serviceworker.js could not be loaded. Error occured: ' + err);
            // Something went wrong during registration. The service-worker.js file
            // might be unavailable or contain a syntax error.
        });
        navigator.serviceWorker.addEventListener("message", (evt) => {
            Msg.info('SWACProgressive', `Dispatch ServiceWorker send message: ${ evt.data }`);
            let msgEvent = new CustomEvent('swac_serviceworker_msg', {detail: evt.data});
            document.dispatchEvent(msgEvent);
        });
    }

    let dependencyStack = [
        {path: this.config.swac_root + "swac.css"}
    ];
    if (this.config.progressive.supportpush) {
        dependencyStack.push({path: this.config.swac_root + "swac.css"});
    }

    let thisRef = this;
    thisRef.swac_comp = this;
    SWAC.loadDependenciesStack(dependencyStack, {name: 'SWAC_core'}).then(
            function () {
                // Load core language
                SWAC.lang.loadTranslationFile('./langs/', 'core').then(function () {
                    // Inform about finished loading
                    let completeEvent = new CustomEvent('uiComplete', {});
                    document.dispatchEvent(completeEvent);
                    // Start onlineReactions
                    SWAC.onlineReactions = new OnlineReactions(thisRef.config);
                    // Check if datasources are available
                    if (thisRef.config.datasourcescheck && thisRef.config.datasources.length > 0) {
                        let fetchproms = [];
                        for (let curSource of thisRef.config.datasources) {
                            let ki = curSource.url.indexOf('[');
                            let url = curSource.url.substring(0, ki);
                            url = url.replace('/smartdata/', '/');
                            let fetchsource = fetch(url, {mode: 'cors'});
                            fetchproms.push(fetchsource);
                            fetchsource.then(function (res) {
                                if (!res.ok) {
                                    let msg = SWAC.lang.dict.core.sourceerror.replace('%source%', url);
                                    UIkit.modal.alert(msg);
                                }
                            });
                        }

                        Promise.all(fetchproms).then(function () {
                            SWAC.waitForStartup();
                        });
                    } else {
                        SWAC.waitForStartup();
                    }
                });
            }
    );
};

SWAC.waitForStartup = function () {
    if (!SWAC.config.startuptests || SWAC.config.startuptests.length === 0) {
        SWAC.detectRequestors();
        return;
    }

    let tests = [];
    for (let curStartupTest of SWAC.config.startuptests) {
        let test = fetch(curStartupTest);
        tests.push(test);
    }
    Promise.all(tests).then(function (results) {
        for (let curRes of results) {
            if (curRes.status >= 400)
                throw 'status: ' + curRes.status;
        }
        if (SWAC.waitingModal) {
            SWAC.waitingModal.hide();
            SWAC.waitingModal = false;
        }
        SWAC.detectRequestors();
    }).catch(function () {
        Msg.error('SWAC', 'Not all startuptests are succsessfull. Wait 5 seconds for retry.');
        if (!SWAC.waitingModal)
            SWAC.waitingModal = UIkit.modal.dialog('<video autoplay muted loop><source src="' + SWAC.config.app_root + '/content/startup.mp4" type="video/mp4">Your browser does not support the video tag.</video><br><img class="uk-align-center" src="' + SWAC.config.app_root + '/content/startup.png"><br>' + SWAC.lang.dict.core.waitingbackend);

        setTimeout(SWAC.waitForStartup, 5000);
    });
};

/**
 * Detects requestors and builds up their information and instantiates their
 * component.
 * 
 * @returns {undefined}
 */
SWAC.detectRequestors = function (elem = document) {
    let requestors = elem.querySelectorAll("[swa]");
    // ng
    let viewHandler = new ViewHandler();
    let compproms = [];
    for (let requestor of requestors) {
        // load component
        if (!requestor.id.includes('{id}') && !requestor.getAttribute('swa').startsWith('{'))
            compproms.push(viewHandler.load(requestor));
    }
    Promise.allSettled(compproms).then(function () {
        document.dispatchEvent(new CustomEvent('swac_components_complete'));
    });
};

/**
 * Loads a dependency from the stack and continues with the next stack element
 * 
 * @param {object[]} dependenciesStack Dependency definitions (debugonly,path,description)
 * @param {SWACcomponent} component Component which needs the dependency
 * @returns {Promise} Promise that resolves if the dependency was loaded
 */
SWAC.loadDependenciesStack = function (dependenciesStack, component) {
    return new Promise((resolve, reject) => {

        // Get first dependency on stack
        let dependency = dependenciesStack.shift();
        // Avoid failing on empty array slots
        if (typeof dependency !== 'undefined') {
            // Skip if debugmode is off and this is a debugonly requirement
            let skipImport = false;
            if (dependency.debugonly && !this.config.debugmode) {
                skipImport = true;
            }

            // Create id for dependency
            let depid = dependency.component ? dependency.component : dependency.path;
            // Skip if file was imported before (globaly check over all loaded components)
            if (SWAC.loadeddependencies.includes(depid)) {
                dependency.loaded = true;
                skipImport = true;
            }

            if (!skipImport) {
                // If dependency is currently loading wait for loading
                if (SWAC.loadingdependencies.includes(depid)) {
                    Msg.flow('SWAC', 'Waiting for loading dependency >' + depid + '<');
                    // Waiting for dependency loaded event
                    document.addEventListener('swac_' + depid + '_dependency_loaded', function () {
                        dependency.loaded = true;
                        if (dependenciesStack.length > 0) {
                            SWAC.loadDependenciesStack(dependenciesStack).then(
                                    function () {
                                        resolve();
                                    }
                            );
                        } else {
                            resolve();
                        }
                    });
                    return;
                } else {
                    SWAC.loadingdependencies.push(depid);
                }

                let addPromResolve = resolve;
                let addPromReject = reject;
                if (dependency.algorithm) {
                    // Load Algorithm
                    SWAC.loadAlgorithm(dependency.algorithm, dependency.algorithm).then(function (requestor) {
                        // Set data of the algorithm to that of the component
                        if (component) {
                            requestor.swac_comp.data = component.data;
                            component.algorithms[dependency.algorithm] = requestor.swac_comp;
                        }
                        SWAC.loadedAlgorithms[dependency.algorithm] = Object.getPrototypeOf(requestor.swac_comp);
                        SWAC.onDependencyLoaded(depid, dependency, dependenciesStack, addPromResolve);
                    });
                } else if (dependency.path.endsWith('.js')) {
                    var scriptElem = document.createElement('script');
                    scriptElem.src = dependency.path + '?ver=' + SWAC.desc.version;
                    scriptElem.type = "text/javascript";
                    scriptElem.async = false;
                    scriptElem.setAttribute('depid', depid);

                    document.getElementsByTagName('head')[0].appendChild(scriptElem);
                    scriptElem.addEventListener('load', function () {
                        SWAC.onDependencyLoaded(depid, dependency, dependenciesStack, addPromResolve);
                    });
                    scriptElem.addEventListener('error', function () {
                        addPromReject('Could not load >' + scriptElem.src + '<');
                    });
                } else if (dependency.path.endsWith('.css')) {
                    // Load needed style
                    var cssElem = document.createElement('link');
                    cssElem.setAttribute('rel', 'stylesheet');
                    cssElem.setAttribute('type', 'text/css');
                    cssElem.setAttribute('href', dependency.path);

                    document.head.appendChild(cssElem);
                    // Css counts as loaded imideatly after inserting
                    SWAC.onDependencyLoaded(depid, dependency, dependenciesStack, addPromResolve);
                } else {
                    Msg.error('swac.js', 'Dependency >' + dependency.name + '< for >' + component.name + '< has unkown type and cannot be included.');
                    reject('Unknown dependencies');
                }
            } else {
                // If import is skiped continue to import from stack
                if (dependenciesStack.length > 0) {
                    SWAC.loadDependenciesStack(dependenciesStack).then(
                            function () {
                                resolve();
                            }
                    ).catch(function (error) {
                        reject(error);
                    });
                } else {
                    resolve();
                }
            }
        }
    });
};

/**
 * Performs all actions neccessery after a dependency was loaded. Like change
 * load state and dispatch event to notify waiting scripts
 * 
 * @param {String} loadid Id of the load process
 * @param {Object} dependency Dependencies information
 * @returns {undefined}
 */
SWAC.onDependencyLoaded = function (loadid, dependency, dependenciesStack, addPromResolve) {
    dependency.loaded = true;
    delete SWAC.loadingdependencies[loadid];
    SWAC.loadeddependencies.push(loadid);

    let depName = dependency.name;
    if (!depName) {
        depName = dependency.path;
    }
    Msg.flow('swac.js', 'Loaded dependency >' + depName + '<');

    let event = new CustomEvent("swac_" + loadid + "_dependency_loaded");
    document.dispatchEvent(event);

    // Load next dependency or resolve
    if (dependenciesStack.length > 0) {
        SWAC.loadDependenciesStack(dependenciesStack).then(
                function () {
                    addPromResolve();
                }
        );
    } else {
        addPromResolve();
    }
};

/**
 * Method for checking if an string is an valid IP
 * 
 * @param {type} str
 * @returns {Boolean}
 */
SWAC.isValidIP = function (str) {
    return (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(str));
};

/**
 * Method for checking if an string is an valid url
 * 
 * @param {type} str
 * @returns {Boolean}
 */
SWAC.isValidURL = function (str) {
    var pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
            '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name and extension
            '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
            '(\\:\\d+)?' + // port
            '(\\/[-a-z\\d%@_.~+&:]*)*' + // path
            '(\\?[;&a-z\\d%@_.,~+&:=-]*)?' + // query string
            '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
    return pattern.test(str);
};

/**
 * Gets the value of an parameter from URL
 * 
 * @param {String} param_name Name of the parameter to read value from
 * @param {String} url URL to read parameter from, if not given defaults to location.href
 * @returns {String} Value of the parameter or undefined if not exists
 */
SWAC.getParameterFromURL = function (param_name, url = location.href) {
    param_name = param_name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regexS = "[\\?&]" + param_name + "=([^&#]*)";
    var regex = new RegExp(regexS);
    var results = regex.exec(url);
    return results === null ? null : results[1];
};

SWAC.replaceGlobalPlaceholders = function () {
    let params = (new URL(document.location)).searchParams;
    for (const [key, value] of params.entries()) {
        SWAC.searchAndReplace('{{' + key + '}}', value, document);
    }
    for (const key in this.config.globalparams) {
        SWAC.searchAndReplace('{{' + key + '}}', this.config.globalparams[key], document);
    }
    // Replace special placeholders
    const sps = [...document.body.innerHTML.matchAll(/{{date:([^}]*)}}/g)];
    for (let curSps of sps) {
        let val;
        if (curSps[0].startsWith('{{date:')) {
            val = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60 * 1000);
            if (curSps[1].startsWith('m-')) {
                let diff = parseInt(curSps[1].replace('m-', ''));
                diff = diff * 60000;
                val = new Date(val - diff);
            }
            if (curSps[1].startsWith('m+')) {
                let diff = parseInt(curSps[1].replace('m+', ''));
                diff = diff * 60000;
                val = new Date(val + diff);
            }
            //Format datetime to iso
            try {
                val = val.toISOString();
            } catch (e) {

            }
        }
        SWAC.searchAndReplace(curSps[0], val, document);
    }

    // Remove placeholders that can not be filled
    let unreplaced = document.body.innerHTML.match(/\{\{(.+?)\}\}/g);
    if (unreplaced) {
        for (let curUnreplaced of unreplaced) {
            SWAC.searchAndReplace(curUnreplaced, '', document);
        }
    }
};

/**
 * Searches and replaces an expression inside an element and it's hierarchy.
 * Respects the DOM hierarhy and does not midify it. There is no support for bind mechanism or
 * repeatables with this.
 * 
 * @param {String} search Search expression
 * @param {String} replace The replacement
 * @param {HTMLElement} elem Element where to replace (and childs) 
 * @returns {undefined}
 */
SWAC.searchAndReplace = function (search, replace, elem) {
    // Exclude pre elements
    if (elem.nodeName === 'PRE' && !elem.hasAttribute('swac_allowReplace')) {
        return;
    }
    // Look at attributes
    if (typeof elem.attributes !== 'undefined') {
        for (var curAttr of elem.attributes) {
            curAttr.value = curAttr.value.replaceAll(search, replace);
        }
    }
    if (typeof elem.nodeValue !== 'undefined' && elem.nodeValue !== null) {
        elem.nodeValue = elem.nodeValue.replaceAll(search, replace);
    }
    // Look at child nodes
    if (elem.nodeType === 1 || elem.nodeType === 9) {
        for (var nextChild of elem.childNodes) {
            this.searchAndReplace(search, replace, nextChild);
        }
    }
};

/**
 * Load an algorithm
 * 
 * @param {String} requestor_id Id the requestor that is generated while loading should get
 * @param {String} name Name of the algorithm to load
 * @returns {Promise} Promise that resolves with the loaded requestor or throws error
 */
SWAC.loadAlgorithm = function (requestor_id, name) {
    return new Promise((resolve, reject) => {
        if (!name) {
            Msg.error('SWAC', 'Could not load algorithm, no algorithm name given');
            reject();
        }
        // Load AlgorithmHandler
        import('./AlgorithmHandler.js?vers=' + SWAC.desc.version).then(function (module) {
            let AlgorithmHandler = module.default;
            let ah = new AlgorithmHandler();
            ah.load({id: requestor_id, componentname: name}).then(function (requestor) {
                resolve(requestor);
            });
        });
    });
};

/**
 * Convert base64 encoded to Uint8Array
 * 
 * @param {String} base64String
 * @returns {Uint8Array}
 */
SWAC.urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
};
