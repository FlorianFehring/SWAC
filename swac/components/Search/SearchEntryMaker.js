/* 
 * Abstract class that gives the basic requirements for an class, that has 
 * functions to create a searchresult entry.
 */

class SearchEntryMaker {
    constructor(options = {}) {
        this.options = options;
    }

    /**
     * Registeres a event listener that should be called, when user clicks on
     * one generated result entry.
     * 
     * @param {EventListener} evtListener Eventlistener to execute on click
     * @returns {undefined}
     */
    setOnClickEventListener(evtListener) {
        this.onClickEventListener = evtListener;
    }

    /**
     * Checks if this SearchEntryMaker is applicable to build a entry from the 
     * given result.
     * 
     * @param {Object} searchResult Result of search that should be checked if this SearchEntryMaker is applicable
     * @param {DOMElement} resultElem Element where the result should be placed. the maker can check here if his prequsits are meet.
     * @returns {boolean} true if this maker can be used
     */
    isApplicable(searchResult, resultElem) {
        throw new Exception("This method must be implemented by the extending class.");
    }
    
    /**
     * Creates a search result entry html element.
     * 
     * @param {Object} searchResults Array of objects with search results
     * @param {Integer} resultNo No of the result to show
     * @param {DOMElement} placeElement Element where to place the result entry
     * 
     * @returns {DOMElement} HTML Element that presents the search result
     */
    make(searchResults, resultNo, placeElement) {
        throw new Exception("This method must be implemented by the extending class.");
    }
}
