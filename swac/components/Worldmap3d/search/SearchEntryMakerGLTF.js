/* 
 * SearchEntryMaker for location data deliverd in a json file according to
 * the SEGLTF-metadata standard.
 */

class SearchEntryMakerGLTF extends SearchEntryMaker {
    constructor() {
        super();
    }

    /**
     * Checks if this SearchEntryMaker is applicable to build a entry from the 
     * given result.
     * 
     * @param {Object} searchResult Result of search that should be checked if this SearchEntryMaker is applicable
     * @returns {boolean} true if this maker can be used
     */
    isApplicable(searchResult) {
        if (searchResult.url.endsWith('.glb')) {
            return true;
        }
        Msg.warn('SearchEntryMakerGLTF', 'Result with file >' + searchResult.url + '< is not renderable with this maker.');
        return false;
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
        // Check if there is a json metadata file for the same building
        let metaFileAvailable = false;
        let searchFileName = searchResults[resultNo].url.replace('.glb', '.geojson');
        for (let result of searchResults) {
            if (result.url === searchFileName 
                    && (result.status < 400 || result.status === 405)) {
                metaFileAvailable = true;
            }
        }
        
        // Only show entry if no metadata is available
        if (!metaFileAvailable) {
            let hid = searchResults[resultNo].name.replace('.glb', '');
            let resultName = 'Gebäude ' + hid;
            let resultNameElem = document.createTextNode(resultName);
            placeElement.appendChild(resultNameElem);
            placeElement.setAttribute('hid',hid);
            placeElement.setAttribute('url',searchResults[resultNo].url);
            if (typeof this.onClickEventListener !== 'undefined') {
                placeElement.addEventListener('click', this.onClickEventListener);
            }
            var warningElem = document.createElement('span');
            warningElem.setAttribute('uk-icon', 'icon: warning');
            warningElem.setAttribute('uk-tooltip', 'title: ' + SWAC.lang.dict.Worldmap3d.no_grounddata);
            placeElement.appendChild(warningElem);
        }
    }
}
