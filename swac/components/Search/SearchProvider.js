/* 
 * Abstract class for implementing search providers.
 * A search provider overrides the search functions with special behavior
 * adressed to its needs.
 */

export default class SearchProvider {
    /**
     * Creates a new SearchProvider
     * @param {Object} searchsource Object with definition for this searchprovider
     * @returns {SearchProvider}
     */
    constructor(searchsource) {
        this.searchsource = searchsource;
        this.delay = 0; // Miliseconds to wait before sending a request
    }

    /**
     * Searches for the searchExpresseion, executes the search for its requestor.
     * The requestor has do define searchsources in its swac_comp.
     * 
     * @param {String} searchExpr   Expression to search
     * @param {URL} searchurl URL where to search with {expression} placeholder
     * @param {SWACComponent} searchcomp Component object calling the provider
     * @returns {Promise} An promise that resolves with an array of searchresults
     */
    search(searchExpr, searchurl, searchcomp) {
        throw new Exception("This method must be implemented by the extending class.");
    }
    
    /**
     * You can implement (in your derivided class) the following method to 
     * deliver a default result entry maker for a better display of your search 
     * results.
     * 
     * @returns {SearchEntryMaker} SearchEntryMaker object
     */
//    getResultEntryMaker() {
//        return new SearchEntryMakerDefault();
//    }
}