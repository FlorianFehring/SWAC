/* 
 * A search entry maker for data tables. Configurable with titles for column captions
 * and attributes to show.
 */
class SearchEntryMakerTable extends SearchEntryMaker {
    constructor() {
        super();
        this.titles = [];
        this.attrs = [];
        this.resulturl = null;
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
        let resultTable = resultElem.querySelector('table');
        if (!resultTable) {
            window.swac.Msg.warn('SearchEntryMakerTable', 'This resultEntryMaker can not be applied because there is no table in the template.');
            return false;
        }
        return true;
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
        // Check if placeElement contains a table template
        let resultTable = placeElement.querySelector('table');
        if (!resultTable) {
            window.swac.Msg.error('SearchEntryMakerTable', 'There was no table found in template part for results.');
            return;
        }
        // Create table head
        let thead = resultTable.querySelector('thead');
        let th = thead.querySelector('th');
        // Check if header is allready generated
        if (!thead.querySelector('.swac_search_added')) {
            for (let curCaption of this.titles) {
                // Clone theadline
                let thclone = th.cloneNode(true);
                thclone.classList.add('swac_search_added');
                thclone.innerHTML = curCaption;
                thead.appendChild(thclone);
            }
        }
        // Create table row
        let tbody = resultTable.querySelector('tbody');
        let trtpl = tbody.querySelector('.swac_search_repeatForResult');
        let searchSource = searchResults[resultNo].provider.searchsource;
        let searchSourceName;
        if (searchSource.name) {
            searchSourceName = searchSource.name;
        } else {
            searchSourceName = searchSource.url;
        }
        if (!tbody.querySelector('.swac_search_' + searchSourceName)) {
            let trhclone = trtpl.cloneNode(true);
            trhclone.classList.add('swac_search_resultcategory');
            trhclone.classList.add('swac_search_' + searchSourceName);
            trhclone.classList.add('swac_search_added');
            let trhtd = trhclone.querySelector('td');
            trhtd.setAttribute('colspan', '42');
            if (searchSource.name) {
                trhtd.innerHTML = searchSource.name;
            } else {
                trhtd.innerHTML = searchSource.url;
            }
            trtpl.parentNode.appendChild(trhclone);
        }
        let trclone = trtpl.cloneNode();
        trclone.classList.remove('swac_search_forResult');
        let td = trtpl.querySelector('td');

        for (let curAttr of this.attrs) {
            // Clone td
            let tdclone = td.cloneNode(true);
            tdclone.classList.add('swac_search_added');
            let curVal = searchResults[resultNo].result[curAttr];

            if (typeof curVal !== 'undefined') {
                tdclone.innerHTML = curVal;
            }
            trclone.appendChild(tdclone);
        }
        // Build up result link
        if (this.resulturl) {
            let curResulturl = this.resulturl;
            for(let curAttr in searchResults[resultNo].result) {
                // Replace placeholder in resultlink
                curResulturl = curResulturl.replace('{' + curAttr + '}', searchResults[resultNo].result[curAttr]);
            }

            // Add event listener for click on result
            trclone.addEventListener('click', function (evt) {
                evt.preventDefault();
                location.href = curResulturl;
            });
        }

        tbody.appendChild(trclone);

        // Add to resultlist
        placeElement.appendChild(resultTable);
    }
}