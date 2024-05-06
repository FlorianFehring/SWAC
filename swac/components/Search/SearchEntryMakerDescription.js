/* 
 * A search entry maker for data responses with configurable title, description
 * and link field.
 */

class SearchEntryMakerDescription extends SearchEntryMaker {
    constructor() {
        super();
        this.titleattr = 'title';
        this.descattr = 'desc';
        this.linkattr = 'link';
        this.linknameattr = null;
        this.linkurl = null;
        this.linktitle = null;
    }

    /**
     * Checks if this SearchEntryMaker is applicable to build a entry from the 
     * given result.
     * 
     * @param {Object} searchResult Result of search that should be checked if this SearchEntryMaker is applicable
     * @returns {boolean} true if this maker can be used
     */
    isApplicable(searchResult) {
        if (typeof searchResult.result[this.titleattr] !== 'undefined') {
            return true;
        } else {
            window.swac.Msg.warn('SearchEntryMakerDescription', 'Result >' + searchResult.name + '< is not renderable with this maker.');
            return false;
        }
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
        // Get current searchResult
        let result = searchResults[resultNo];
        let newentry = document.createElement('div');
        // Create title
        let newtitle = document.createElement('div');
        newtitle.classList.add('search_resulttitle');
        // Use language entry if exists
        let tlng = window.swac.lang.dict.app[result.result[this.titleattr]];
        if (tlng) {
            newtitle.innerHTML = tlng;
        } else {
            newtitle.innerHTML = result.result[this.titleattr];
        }
        newentry.appendChild(newtitle);
        // Create desc
        if (this.descattr && result.result[this.descattr]) {
            let newdesc = document.createElement('div');
            newdesc.innerHTML = result.result[this.descattr];
            newentry.appendChild(newdesc);
        }
        // Create link
        if (result.result[this.linktitleattr]) {
            let newlink = document.createElement('a');
            newlink.setAttribute('href', result[this.linkattr]);
            let newlinktitle;
            if (this.linktitleattr) {
                newlinktitle = result.result[this.linktitleattr];
            } else {
                newlinktitle = window.swac.lang.dict.Search.gotoresult;
            }
            newlink.innerHTML = newlinktitle;
            newentry.appendChild(newlink);
        } else if (this.linkurl) {
            let newlink = document.createElement('a');
            let link = this.linkurl;
            for (let attr in result.result) {
                link = link.replace('{' + attr + '}', result.result[attr]);
            }

            newlink.setAttribute('href', link);
            let newlinktitle;
            if (this.linktitle && window.swac.lang.dict.app[this.linktitle]) {
                // Use link text from app language file
                newlinktitle = window.swac.lang.dict.app[this.linktitle];
            } else {
                newlinktitle = window.swac.lang.dict.Search.gotoresult;
            }
            newlink.innerHTML = newlinktitle;
            newentry.appendChild(newlink);
        }

        // Add to resultlist
        placeElement.appendChild(newentry);
    }
}