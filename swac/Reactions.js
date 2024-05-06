import SWAC from './swac.js';
import Msg from './Msg.js';

/* 
 * Class for registering and handling reactions
 */
export default class Reactions {
    constructor() {
        this.reactions = [];
    }

    /**
     * Registers a reaction to requestor loads. Those can be bound to more than one 
     * requestor.
     * 
     * @param {Function} reactionfunction Function to execute, when all given requestors are loaded
     * @param {String[]} Single requestor_id or multiple requestor_ids as single parameters or one array
     * @returns {undefined}
     */
    addReaction(reactionfunction, ...requestor_id) {
        let reaction = {};
        reaction.function = reactionfunction;
        reaction.requiredRequestors = [];
        // If requestors are given as array
        if(Array.isArray(requestor_id[0])) {
            requestor_id = requestor_id[0];
        }
        for (let curRequestorId of requestor_id) {
            reaction.requiredRequestors.push(curRequestorId);
        }
        this.reactions.push(reaction);
        // Perform if components are allready loaded
        this.performReactions();
    }

    /**
     * Performs the registred reactions to requestor loads
     * This calls the registred function, if all required requestors are loaded.
     * The called method becomes a object with references to all required requestors.
     * 
     * @returns {undefined}
     */
    performReactions() {
        let remaining = [];
        for (let i in this.reactions) {
            let curReaction = this.reactions[i];
            // Check if all required requestors are loaded
            let allLoaded = true;
            let requestors = {};
            for (let requiredRequestor of curReaction.requiredRequestors) {
                if (!SWAC.loadedComponents.has(requiredRequestor)) {
                    allLoaded = false;
                    break;
                }
                let requestor = document.getElementById(requiredRequestor);
                if (requestor === null) {
                    Msg.error('swac.js', 'The requestor >' + requiredRequestor
                            + '< was not found in document. These means usually that another script has removed it.'
                            + ' Therefore the reaction to >' + curReaction.requiredRequestors + '< could not be performed.');
                    allLoaded = false;
                    break;
                }
                if(requestor.swac_comp.state === 'loading') {
                    allLoaded = false;
                    break;
                }
                // Put requstor to requestors array
                requestors[requiredRequestor] = requestor;
            }
            // If all loaded execute function
            if (allLoaded) {
                curReaction.function(requestors);
            } else {
                remaining.push(curReaction);
            }
        }

        // Remove reaction to avoid double execution
        this.reactions = remaining;
    }
}