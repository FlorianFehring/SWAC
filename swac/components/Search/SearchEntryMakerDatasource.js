/* 
 * A search entry maker for data sources. Detects sources in the results and creates
 * links that allos visualisation.
 */
class SearchEntryMakerDatasource extends SearchEntryMaker {
    constructor(options = {}) {
        super(options);
        // Supported filetypes for showing in components
        if (!options.types) {
            this.options.types = new Map();
            this.options.types.set('GEOJSON', { views: ['map']});
            this.options.types.set('JSON', { views: ['list','import']});
            this.options.types.set('CSV', { views: ['list','import']});
            this.options.types.set('SHAPE', { views: ['map']});
        }

        // Show only results with filetypes identified and supported
        if (typeof options.knowntypesonly === 'undefined') {
            this.options.knowntypesonly = true;
        }

        // Attribute names where to find specific information
        if (!options.nameAttrs)
            this.options.nameAttrs = ['name', 'title'];
        if (!options.descAttrs)
            this.options.descAttrs = ['description', 'desc'];
        if (!options.authorAttrs)
            this.options.authorAttrs = ['author'];
        if (!options.urlAttrs)
            this.options.urlAttrs = ['url'];

        // Links to pages where data can be shown
        if (!options.importurl)
            this.options.importurl = null;
        if (!options.mapurl)
            this.options.mapurl = null;
        if (!options.listurl)
            this.options.listurl = null;

        // Internal attributes
        this.typenames = [...this.options.types.keys()];
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
        // Get current searchResult
        let result = searchResults[resultNo];
        let resources = this.findResources(result);

        let repElem = placeElement.parentElement.querySelector('.swac_search_repeatForSource');

        for (let curRes of resources) {
            // Do not create entry when there is no url
            if (!curRes.url)
                continue;
            if (this.options.knowntypesonly && !curRes.type)
                continue;
            let curType = this.options.types.get(curRes.type);
            
            let entry = repElem.cloneNode(true);
            entry.classList.remove('swac_dontdisplay');
            entry.classList.remove('swac_search_repeatForSource');
            entry.querySelector('.swac_search_sourceEntry_name').innerHTML = curRes.name;
            entry.querySelector('.url').href = curRes.url;

            if (curRes.desc)
                entry.querySelector('.swac_search_sourceEntry_desc').innerHTML = curRes.desc;
            if (curRes.author)
                entry.querySelector('.swac_search_sourceEntry_author').innerHTML = curRes.author;
            let picElem = entry.querySelector('.swac_search_typepic');
            let src = picElem.getAttribute('src');
            if (curRes.type)
                picElem.setAttribute('src', src.replace('[TYPE]', curRes.type.toLowerCase()));
            else
                picElem.setAttribute('src', src.replace('[TYPE]', '../unknown'));

            let importElem = entry.querySelector('.swac_search_sourceEntry_importurl');
            if (this.options.importurl && curType && curType.views.includes('import')) {
                importElem.href = this.options.importurl.replace('%url%', encodeURIComponent(curRes.url)).replace('%type%',curRes.type);
            } else {
                importElem.remove();
            }

            let mapElem = entry.querySelector('.swac_search_sourceEntry_mapurl');
            if (this.options.mapurl && curType && curType.views.includes('map')) {
                mapElem.href = this.options.mapurl.replace('%url%', encodeURIComponent(curRes.url)).replace('%type%',curRes.type);
            } else {
                mapElem.remove();
            }

            let listElem = entry.querySelector('.swac_search_sourceEntry_listurl');
            if (this.options.listurl && curType && curType.views.includes('list')) {
                listElem.href = this.options.listurl.replace('%url%', encodeURIComponent(curRes.url)).replace('%type%',curRes.type);
            } else {
                listElem.remove();
            }

            placeElement.appendChild(entry);
        }
    }

    /**
     * Find resources in set
     * 
     * @param {Object} result Search result object
     * @param {Object} parentset Parent object when deep search
     * @returns {resources}
     */
    findResources(result, parentset = {}) {
        let resources = [];
        let nset = {};

        // Check for name info
        for (let curAttr of this.options.nameAttrs) {
            if (result[curAttr]) {
                nset.name = result[curAttr];
                if (!nset.type) {
                    for (let curTypeInfo of this.typenames) {
                        if (nset.name.toUpperCase().indexOf(curTypeInfo) >= 0) {
                            nset.type = curTypeInfo;
                            break;
                        }
                    }
                }
            }
        }
        // Check for description info
        for (let curAttr of this.options.descAttrs) {
            if (result[curAttr]) {
                nset.desc = result[curAttr];
            }
        }
        // Check for author info
        for (let curAttr of this.options.authorAttrs) {
            if (result[curAttr]) {
                nset.author = result[curAttr];
            }
        }

        // Check for url info
        for (let curAttr of this.options.urlAttrs) {
            if (result[curAttr] && this.isValidURL(result[curAttr])) {
                nset.url = result[curAttr];
                for (let curTypeInfo of this.typenames) {
                    if (nset.url && nset.url.toUpperCase().indexOf(curTypeInfo) >= 0) {
                        nset.type = curTypeInfo;
                        break;
                    }
                }
            }
        }

        // Integrate information from higher level
        for (let curAttr in parentset) {
            if (!nset[curAttr]) {
                nset[curAttr] = parentset[curAttr];
            }
        }

        // Try find recursive
        if (!nset.url || !nset.type) {
            for (let curAttr in result) {
                // Check on deep structure
                if (result[curAttr] instanceof Array) {
                    for (let curSet of result[curAttr]) {
                        resources = resources.concat(this.findResources(curSet, nset));
                    }
                } else if (result[curAttr] instanceof Object) {
                    resources = resources.concat(this.findResources(result[curAttr], nset));
                }
            }
        }
        resources.push(nset);

        return resources;
    }

    isValidURL = function (str) {
        return /^(?:\w+:)?\/\/([^\s\.]+\.\S{2}|localhost[\:?\d]*)\S*$/.test(str);
    }
}