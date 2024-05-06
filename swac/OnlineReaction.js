/* 
 * Abstract class for implementing OnlineReactions.
 */
class OnlineReaction {
    constructor(config) {
        this.config = config;
    }
    
    /**
     * Function to execute when client goes online.
     * 
     * @param {DOMEvent} evt Event that says online state
     * @returns {undefined}
     */
    onOnline(evt) {
        throw 'OnlineReaction','Extending class must implement the onOnline function.';
    }
    
    /**
     * Function to execute when client goes offline.
     * 
     * @param {DOMEvent} evt Event that says offline state
     * @returns {undefined}
     */
    onOffline(evt) {
        throw 'OnlineReaction','Extending class must implement the onOffline function.';
    }
    
    /**
     * Function to execute when client notes backend is unreachable
     * 
     * @param {DOMEvent} evt Event that is fired on unreachable
     * @returns {undefined}
     */
    onUnreachable(evt) {
        throw 'OnlineReaction','Extending class must implement the onUnreachable function.';
    }
}
