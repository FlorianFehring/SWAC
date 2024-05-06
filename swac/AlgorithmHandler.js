import SWAC from './swac.js';
import Msg from './Msg.js';
import ComponentHandler from './ComponentHandler.js';

/* 
 * Class for handling algorithms
 */
export default class AlgorithmHandler extends ComponentHandler {
    constructor() {
        super();
    }

    /**
     * Loads an algorithm
     * 
     * @param {Requestor} requestor defining the Component to load
     * Needs: requestor.id, requestor.componentname
     * @returns {Promise} Resolvse with the requestor with added swac_comp attibut that contains the Algorithm class
     */
    load(requestor) {
        return new Promise((resolve, reject) => {
            Msg.createStore(requestor);
            Msg.flow('AlgorithmHandler', 'Loading algorithm', requestor);
            let thisRef = this;
            // Create component path
            requestor.componentPath = './algorithms/' + requestor.componentname + '/' + requestor.componentname + '.js'
            super.load(requestor).then(function (requestor) {
                thisRef.init(requestor).then(function () {
                    thisRef.afterLoad(requestor).then(function () {
                        resolve(requestor);
                    });
                });
            });
        });
    }

    /**
     * Performs actions after load
     */
    afterLoad(requestor) {
        return new Promise((resolve, reject) => {
            SWAC.loadedComponents.set(requestor.id, requestor);
            // Build complete event
            let completeEvent = new CustomEvent('swac_' + requestor.id + '_complete', {
                detail: {
                    requestor_id: requestor.id
                }
            });
            document.dispatchEvent(completeEvent);
            SWAC.reactions.performReactions();
            resolve();
        });
    }
}