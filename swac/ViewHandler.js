import SWAC from './swac.js';
import Msg from './Msg.js';
import Language from './Language.js';
import Model from './Model.js';
import ComponentHandler from './ComponentHandler.js';

/* 
 * Class for handling components
 */
export default class ViewHandler extends ComponentHandler {
    constructor() {
        super();
        if (!window['loadingrequestors'])
            window['loadingrequestors'] = [];
    }

    /**
     * Loads a component
     * 
     * @param {DOMElement} domrequestor DOM Element requesting a component
     * @returns {Promise} 
     */
    load(domrequestor) {
        return new Promise((resolve, reject) => {
            if (window['loadingrequestors'].includes(domrequestor.id)) {
                Msg.error('ViewHandler', 'Duplicate loading requestor >' + domrequestor.id + '<. Please check if you use the id more than once or a subrequestor is not useing {id}.');
                return;
            }
            window['loadingrequestors'].push(domrequestor.id);

            Msg.createStore(domrequestor);
            let thisRef = this;
            // Parse the declaration and make attributes on the element out of it
            domrequestor = this.parseDeclaration(domrequestor);
            // Create component path
            domrequestor.componentPath = './components/' + domrequestor.componentname + '/' + domrequestor.componentname + '.js'
            super.load(domrequestor, false).then(function (requestor) {
                domrequestor.swac_comp.loadTemplate().then(function () {
                    // Register observer for detecting when element comes in view
                    requestor.swac_comp.inViOb.observe(requestor);
                    thisRef.init(domrequestor, false).then(function () {
                        thisRef.loadData(requestor, requestor.swac_comp).then(function (dataCapsule) {
                            SWAC.lang.translateAll();
                            thisRef.afterLoad(domrequestor).then(function () {
                                // Call customAfterLoad function
                                if (requestor.swac_comp.options.customAfterLoad) {
                                    requestor.swac_comp.options.customAfterLoad(requestor);
                                }
                                resolve(requestor);
                            });
                        }).catch(function (err) {
                            reject(err);
                        })
                    });
                });
            }).catch(function (err) {
                if (domrequestor.swac_comp && domrequestor.swac_comp.loadTemplate) {
                    domrequestor.swac_comp.loadTemplate().then(function () {
                        SWAC.lang.translateAll(domrequestor);
                        thisRef.init(domrequestor, false).then(function () {
                            thisRef.afterLoad(domrequestor).then(function () {
                                resolve();
                            });
                        });
                    })
                } else {
                    reject(err);
                }
            })
        });
    }

    /**
     * Performs actions after load
     */
    afterLoad(domrequestor) {
        return new Promise((resolve, reject) => {
            SWAC.loadedComponents.set(domrequestor.id, domrequestor);
            // Build complete event
            let completeEvent = new CustomEvent('swac_' + domrequestor.id + '_complete', {
                detail: {
                    requestor_id: domrequestor.id
                }
            });
            document.dispatchEvent(completeEvent);
            Msg.flow('ViewHandler', 'Dispatched event >' + 'swac_' + domrequestor.id + '_complete' + '<', domrequestor);
            SWAC.reactions.performReactions();
            resolve();
        });
    }

    /**
     * Parses the swa statement and attatches the statement attributes to the
     * requestor object.
     * 
     * @param {DOMElement} requestor DOM Element requesting a component
     * @returns {DOMEleent} modified requestor element
     */
    parseDeclaration(requestor) {
        // Get swa config tag
        let component_config = requestor.getAttribute("swa");

        // Create loading component
        requestor.swac_comp = {};
        requestor.componentname = component_config.split(" ")[0];
        requestor.swac_comp.state = 'loading';

        // Positions and options stack
        let clauseMap = new Map();
        // parse request options and set them as attributes to the requestor
        clauseMap.set(component_config.indexOf(" FROM "), 'FROM');
        clauseMap.set(component_config.indexOf(" WHERE "), 'WHERE');
        clauseMap.set(component_config.indexOf(" OPTIONS "), 'OPTIONS');
        clauseMap.set(component_config.indexOf(" TEMPLATE "), 'TEMPLATE');
        // Sort
        clauseMap = new Map([...clauseMap.entries()].sort(function (a, b) {
            return a[0] - b[0];
        }));

        // Declare attributes
        requestor.fromWheres = {};

        //Go trough clauses
        let keys = clauseMap.keys();
        let curEntry = keys.next();
        while (typeof curEntry.value !== 'undefined') {
            let pos = curEntry.value;
            // Load next entry
            curEntry = keys.next();
            if (pos > 0) {
                let clausName = clauseMap.get(pos);
                let clausContStart = pos + clausName.length + 2;
                // Calculate endpos of clause
                let clausContEnd = component_config.length;
                if (typeof curEntry.value !== 'undefined') {
                    clausContEnd = curEntry.value;
                }
                let clausCont = component_config.substring(clausContStart, clausContEnd);
                switch (clausName) {
                    case 'FROM':
                        requestor.fromName = clausCont;
                        // Do not check existence of data here, because it can be loaded
                        // after loading of components code    
                        break;
                    case 'WHERE' :
                        let wheres = clausCont.split(' AND ');
                        // parse each where
                        for (let wherestr of wheres) {
                            let where = wherestr.split('=');
                            let wherekey = where[0];
                            let whereval = where[1];
                            // Check if whereval is a variable
                            let varmatches = whereval.match(/[^{}]+(?=\})/g);
                            if (varmatches !== null && varmatches.length > 0) {
                                for (let i in varmatches) {
                                    let param = SWAC.getParameterFromURL(varmatches[i], window.location);
                                    if (param === null) {
                                        Msg.warn('swac', 'Parameter >'
                                                + varmatches[i] + '< used in WHERE for >'
                                                + requestor.id + '< not found.', requestor);
                                        whereval = whereval.replace('{' + varmatches[i] + '}', '');
                                    } else {
                                        whereval = whereval.replace('{' + varmatches[i] + '}', param);
                                    }
                                }
                            }
                            if (whereval) {
                                if (requestor.fromWheres[wherekey]) {
                                    requestor.fromWheres[wherekey] += '&' + wherekey + '=' + whereval;
                                } else {
                                    requestor.fromWheres[wherekey] = whereval;
                                }
                            } else {
                                Msg.warn('swac', 'Parameter >' + wherekey + '< for >' + requestor.id + '< has null value.', requestor);
                            }
                        }
                        break;
                    case 'OPTIONS':
                        requestor.optionsName = clausCont;
                        break;
                    case 'TEMPLATE':
                        requestor.templateName = clausCont;
                        break;
                }
            }
        }

        return requestor;
    }

    /**
     * Adds show loading messages to the inherited loadData()
     * 
     * @param {DOMElement} domrequestor DOM Element requesting a component
     * @returns {Promise} 
     */
    loadData(requestor) {
        return new Promise((resolve, reject) => {
            // Insert loading data text
            let loadtext = SWAC.lang.dict.core.loadingdata.replace(new RegExp('%requestorid%', 'g'), requestor.id);
            requestor.swac_comp.showCoverMsg(loadtext);
            super.loadData(requestor).then(function (dataCapsule) {
                // Check if should not be shown when empty
                if (requestor.swac_comp.countSets() < 1
                        && requestor.getAttribute('swa').includes('FROM')) {
                    if (!requestor.swac_comp.options.showWhenNoData) {
                        // Hide component if there is no data
                        requestor.classList.add('swac_dontdisplay');

                        // Do not remove node, because component can be reactivated
                        // if there is data a a later time
                        Msg.hint('ViewHandler', 'There is no data requested so this '
                                + 'component is not shown. If you want this component to '
                                + 'show up on no data add the option showWhenNoData=true '
                                + 'to the global variable >' + requestor.id
                                + '_options<', requestor);
                    } else if (requestor.swac_comp.options.showWhenNoData) {
                        requestor.swac_comp.insertNoDataInformation();
                    }
                }
                requestor.swac_comp.remCoverMsg(loadtext);
                resolve(dataCapsule);
            }).catch(function (err) {
                requestor.swac_comp.remCoverMsg(loadtext);
                requestor.swac_comp.insertDataLoadErrorMessage(err, requestor.fromName);
                reject(err);
            });
        });
    }

    /**
     * Calls the init function of the component
     * @param {DOMElement} requestor Requestor whichs component should be initilized
     * @returns {Promise} Promise from the component init function
     */
    init(requestor) {
        return new Promise((resolve, reject) => {
            super.init(requestor).then(function (requestor) {
                requestor.swac_comp.remCoverMsg();
                resolve(requestor);
            }).catch(function (err) {
                reject(err);
            });
        });
    }
}
