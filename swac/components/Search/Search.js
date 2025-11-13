import SWAC from '../../swac.js';
import View from '../../View.js';
import Msg from '../../Msg.js';
import SearchProviderFile from './SearchProviderFile.js';
import SearchProviderRest from './SearchProviderRest.js';
import SearchProviderGeoRest from './SearchProviderGeoREST.js';

export default class Search extends View {

    constructor(options = {}) {
        super(options);
        this.name = 'Search';
        this.desc.text = 'Create a flexible search box with extended features like autocompletition.';
        this.desc.developers = 'Florian Fehring (HSBI)';
        this.desc.license = 'GNU Lesser General Public License';

        this.desc.depends[0] = {
            name: 'SearchEntryMaker Class',
            path: SWAC.config.swac_root + 'components/Search/SearchEntryMaker.js',
            desc: 'Class for creating own SearchEntryMakers'
        };
        this.desc.depends[1] = {
            name: 'SearchEntryMakerDescription Class',
            path: SWAC.config.swac_root + 'components/Search/SearchEntryMakerDescription.js',
            desc: 'Class for creating search results for data responses with configurable title, description and link field.'
        };
        this.desc.depends[2] = {
            name: 'SearchEntryMakerTable Class',
            path: SWAC.config.swac_root + 'components/Search/SearchEntryMakerTable.js',
            desc: 'Class for creating search results for data responses with predefined table.'
        };
        this.desc.depends[3] = {
            name: 'SearchEntryMakerDatasource Class',
            path: SWAC.config.swac_root + 'components/Search/SearchEntryMakerDatasource.js',
            desc: 'Class for creating search results for data sources.'
        };
        this.desc.templates[0] = {
            name: 'simple',
            style: 'simple',
            desc: 'Shows a simple search input field.'
        };
        this.desc.templates[1] = {
            name: 'sidebar',
            style: 'sidebar',
            desc: 'Shows a search sidebar with input area and result preview area.'
        };
        this.desc.templates[2] = {
            name: 'advanced',
            style: 'advanced',
            desc: 'Advanced search that allows choosing from preloaded results'
        };
        this.desc.reqPerTpl[0] = {
            selc: '.swac_search_input',
            desc: 'Input element where the search expression is entered.'
        };
        this.desc.reqPerTpl[1] = {
            selc: '.swac_search_results',
            desc: 'Area where search results should be displayed.'
        };
        this.desc.reqPerTpl[2] = {
            selc: '.swac_search_repeatForResult',
            desc: 'Element repeated for every search result. If it contains an a-Element this is used for display a link to the result.'
        };
        
        
        this.desc.optPerTpl[0] = {
            selc: '.swac_search_repeatForSource',
            desc: 'Element that will be repeated for every searchsource.'
        };
        this.desc.optPerTpl[1] = {
            selc: '.swac_search_legend',
            desc: 'Element where another component can place a legend to descripe the search results.'
        };
        this.desc.optPerTpl[2] = {
            selc: '.swac_searchbar',
            desc: 'Container containing the search area. Needed for show and hiding search area functions.'
        };
        this.desc.optPerTpl[3] = {
            selc: '.swac_search_info',
            desc: 'Element where to place actual informations about the search progress.'
        };
        this.desc.optPerTpl[4] = {
            selc: '.swac_searchbar_toggle',
            desc: 'Link for toggeling the visibility of the search area.'
        };
        this.desc.optPerTpl[5] = {
            selc: '.swac_searchbar_offcanvas',
            desc: 'Container holding the elements that should be disapear on hiding the search area.'
        };
        this.desc.optPerTpl[6] = {
            selc: '.swac_search_indextoggle',
            desc: 'Button that toggles the view of the indexed search. Only available in template advanced.'
        };
        this.desc.optPerTpl[7] = {
            selc: '.swac_search_index',
            desc: 'Aera that shows the index of the search.'
        };
        this.desc.optPerTpl[8] = {
            selc: '.swac_search_indexletters',
            desc: 'Element that contains the letter of the index and its contentaera.'
        };
        this.desc.optPerTpl[9] = {
            selc: '.swac_index_results',
            desc: 'Area where to place the results of the index search.'
        };
        this.desc.optPerTpl[10] = {
            selc: '.swac_search_typepic',
            desc: 'img element where to show a picture of the result type.'
        };
        
        this.desc.optPerTpl[11] = {
            selc: '.swac_search_sourceEntry_name',
            desc: 'Element to show the datasource name.'
        };
        this.desc.optPerTpl[12] = {
            selc: '.swac_search_sourceEntry_author',
            desc: 'Element to show the authors name.'
        };
        this.desc.optPerTpl[13] = {
            selc: '.swac_search_sourceEntry_url',
            desc: 'Element to show search results url.'
        };
        this.desc.optPerTpl[14] = {
            selc: '.swac_search_sourceEntry_mapurl',
            desc: 'Element to show url to a map.'
        };
        this.desc.optPerTpl[15] = {
            selc: '.swac_search_sourceEntry_listurl',
            desc: 'Element to show url to a list.'
        };
        this.desc.optPerTpl[16] = {
            selc: '.swac_search_sourceEntry_importurl',
            desc: 'Element to show url to a list.'
        };
        this.desc.optPerTpl[17] = {
            selc: '.swac_search_sourceEntry_desc',
            desc: 'Element to place a result description.'
        };
        
        
        this.options.showWhenNoData = true;
        this.desc.opts[1] = {
            name: "showNotAccessable",
            desc: "If set to true search results will be shown of results that are known not accessabile"
        };
        if (!options.showNotAccessable)
            this.options.showNotAccessable = false;
        this.desc.opts[2] = {
            name: "searchsources",
            desc: "Array of objects defining search sources with url and type (Name of a SearchProvider implementation class)",
            example: [
                {
                    type: 'SearchProviderRest',
                    url: '/SWAC/data/search/search.json?query={expression}'
                },
                {
                    type: 'SearchProviderRest',
                    url: '/SWAC/data/search/a.json?query={expression}'
                }
            ]
        };
        if (!options.searchsources)
            this.options.searchsources = [];
        this.desc.opts[3] = {
            name: "searchresultentrymakers",
            desc: "Array with instantiated SearchResultEntryMaker",
            type: 'SearchEntryMakerTable[]'
        };
        if (!options.searchresultentrymakers)
            this.options.searchresultentrymakers = []; // List of instantieded entry generators
        this.desc.opts[4] = {
            name: "indexSearchsources",
            desc: "Search sources that are used when clicking on an index element (only if template supports index)",
            example: [
                {
                    type: 'SearchProviderRest',
                    url: '/SWAC/data/search/{expression}.json',
                    name: 'Obst',
                    options: {
                        minchars: 1
                    }
                }
            ]
        };
        if (!options.indexSearchsources)
            this.options.indexSearchsources = [];



        // Internal attributes
        this.searchFor = null;
        this.searchproviders = []; // List of instantiated search providers
        this.searchedSources = {};
    }

    init() {
        return new Promise((resolve, reject) => {
            // Check if there is data
            let hasSource = false;
            for (let curSource in this.data) {
                hasSource = true;
                break;
            }

            // Check if there are searchsources
            if (!hasSource && this.options.searchsources.length === 0) {
                Msg.warn('Search', 'There are no searchsources defined', this.requestor);
                this.requestor.classList.add('swac_dontdisplay');
            }

            // Register search input handler
            let searchinput = this.requestor.querySelector('.swac_search_input');
            searchinput.addEventListener('keyup', this.onSearchInput.bind(this));

            // Init specials for styles
            switch (this.requestor.templateName) {
                case 'advanced':
                    this.initAdvancedTemplate();
                    break;
                case 'offcanvas':
                    this.initOffcanvasTemplate();
                    break;
            }
            resolve();
        });
    }

    /**
     * Hides the search menue
     * 
     * @returns {undefined}
     */
    hide() {
        UIkit.offcanvas(".swac_searchbar_offcanvas").hide();
    }

    /**
     * Adds an searchsource to the component.
     * 
     * @param {type} searchsource
     * @returns {undefined}
     */
    addSearchsource(searchsource) {
        this.options.searchsources.push(searchsource);
        this.requestor.classList.remove('swac_dontdisplay');
    }

    /**
     * Default search handling function for searches over an event with search
     * expression given in the event targets element.
     * This clears previous search results, executes search and inserts the 
     * search results into the output element.
     *
     * @param {event} evt Evt occured on entering something into the search field
     * @returns {undefined}
     */
    onSearchInput(evt) {
        // Clear previous search results
        this.clearResultList(this.requestor);

        var searchExpr = evt.target.value;

        // Only search if min one char is given
        if (searchExpr.length > 0) {

            this.searchFor = searchExpr;

            // Show search in progress info
            this.toggleSearchInProgressInfo();

            // Perform search
            let thisRef = this;
            this.search(searchExpr, this.options.searchsources).then(function (results) {
                // Do not create entries if something else is searched in meantime
                // or when there are no results
                if (thisRef.searchFor === searchExpr && results.length > 0) {
                    let resultElem = thisRef.requestor.querySelector('.swac_search_results');
                    thisRef.createSearchResultEntries(results, resultElem);
                    thisRef.toggleSearchInProgressInfo();
                } else if (results.length === 0) {
                    // Show error message to user
                    let infoElem = thisRef.requestor.querySelector('.swac_search_info');
                    if (infoElem.innerHTML === SWAC.lang.dict.Search.running) {
                        infoElem.innerHTML = SWAC.lang.dict.Search.nothingfound;
                    }
                }
            }).catch(function (error) {
                Msg.error('search', 'Could not perform search: ' + error);
                // Show error message to user
                let infoElem = thisRef.requestor.querySelector('.swac_search_info');
                infoElem.innerHTML = SWAC.lang.dict.Search.searcherror;
            });
        }
    }

    /**
     * Performs the search with the SearchProviders configured within the options
     * and returns an array of search results.
     * DATALAYOUT (searchresult):
     * + name:  Name of the result
     * + url:   URL that should be followed when searchresult is clicked
     * - status: HTTP Statuscode that says if the result is accessable (200 = yes)
     * + provider: Reference to the SearchProvider that deliverd the result
     * 
     * @param {String} searchExpression Expression that should be searched
     * @param {SearchSource[]} searchSources List of SearchSource definitions
     * @returns {Promise} Promise that returns with a list of searchresults once all
     * SearchProviders have finished.
     */
    search(searchExpression, searchSources) {
        let searchcomp = this;
        Msg.flow('search', ' Perform search for >' + searchExpression + '<', searchcomp.requestor);

        return new Promise((resolve, reject) => {
            searchcomp.searchFor = searchExpression;
            let searchresults = [];
            searchcomp.searchedSources[searchExpression] = 0;
            let searchablesources = searchSources.length;

            // Search with every registered search provider
            for (let searchsource of searchSources) {
                if (typeof searchsource === 'undefined') {
                    searchablesources--;
                    continue;
                }
                // Get Searchprovider
                let searchprovider = null;
                switch (searchsource.type) {
                    case "SearchProviderFile":
                        searchprovider = new SearchProviderFile(searchsource);
                        break;
                    case "SearchProviderRest" :
                        searchprovider = new SearchProviderRest(searchsource);
                        break;
                    case "SearchProviderGeoREST" :
                        searchprovider = new SearchProviderGeoREST(searchsource);
                        break;
                    default :
                        searchprovider = null;
                        Msg.error('search', 'SearchProviderType >' + searchsource.type + '< unknown.', searchcomp);
                        searchcomp.searchedSources[searchExpression]++;
                        continue;
                }

                if (searchprovider.delay > 0) {
                    let delayresolve = resolve;
                    setTimeout(function () {
                        // Call search provider and wait for response
                        let searchPromise = searchprovider.search(searchExpression, searchsource.url, searchcomp);
                        searchPromise.then(function (searchresult) {
                            if (typeof searchresult !== 'undefined')
                                searchresults = searchresults.concat(searchresult);
                            searchcomp.searchedSources[searchExpression]++;
                            // Check if all search providers have answered
                            if (searchcomp.searchedSources[searchExpression] === searchablesources) {
                                delayresolve(searchresults);
                            }
                        }).catch(function (error) {
                            searchcomp.searchedSources[searchExpression]++;
                            Msg.error('search', 'Search error' + error);
                            // Check if all search providers have answered
                            if (searchcomp.searchedSources[searchExpression] === searchablesources) {
                                resolve(searchresults);
                            }
                        });
                    }, searchprovider.delay);
                } else {
                    // Call search provider and wait for response
                    let searchPromise = searchprovider.search(searchExpression, searchsource.url, searchcomp);
                    searchPromise.then(function (searchresult) {
                        if (typeof searchresult !== 'undefined')
                            searchresults = searchresults.concat(searchresult);
                        searchcomp.searchedSources[searchExpression]++;
                        // Check if all search providers have answered
                        if (searchcomp.searchedSources[searchExpression] === searchablesources) {
                            resolve(searchresults);
                        }
                    }).catch(function (error) {
                        searchcomp.searchedSources[searchExpression]++;
                        Msg.error('search', 'Search error: ' + error);
                        // Check if all search providers have answered
                        if (searchcomp.searchedSources[searchExpression] === searchablesources) {
                            resolve(searchresults);
                        }
                    });
                }
            }
        });
    }

    /**
     * Clears the result list for new search results
     *
     * @param {DOMElement} requestor Element containing the search
     * @returns {undefined}
     */
    clearResultList(requestor) {
        var sresultsElem = requestor.querySelector('.swac_search_results');
        sresultsElem.innerHTML = '';
    }

    /*
     * Shows or hides the information about running search.
     *
     * @returns {undefined}
     */
    toggleSearchInProgressInfo() {
        // Get notification element
        let infoElem = this.requestor.querySelector('.swac_search_info');
        if (infoElem === null) {
            infoElem = document.createElement('span');
            infoElem.classList.add('swac_search_info');
            infoElem.innerHTML = SWAC.lang.dict.Search.running;
        } else {
            infoElem.innerHTML = '';
        }
    }

    /**
     * Creates and inserts search result entries for all given results.
     * 
     * @param {Object[]} results List of search results
     * @param {DOMElement} resultElem Element where to show the results
     * @returns {undefined}
     */
    createSearchResultEntries(results, resultElem) {
        let created = 0;
        for (let i in results) {
            if (results[i].status < 400
                    || results[i].status === 405
                    || this.options.showNotAccessable
                    || typeof results[i].status === 'undefined') {
                // Build list entry for result list
                let entryElem = null;
                let resultentrymaker = this.getResultEntryMaker(results[i], resultElem);
                if (typeof resultentrymaker !== 'undefined') {
                    // Registred search result entry generation
                    entryElem = resultentrymaker.make(results, i, resultElem);
                } else if (typeof results[i].provider.getResultEntryMaker !== 'undefined') {
                    // If SearchProvider has its own visualisation implementation
                    entryElem = results[i].provider.getResultEntryMaker.make(results, i, resultElem);
                } else {
                    // Default search result entry generation
                    let repForRes = resultElem.querySelector('.swac_search_repeatForResult');
                    let newForRes = repForRes.cloneNode(true);
                    newForRes.classList.remove('swac_search_repeatForResult');
                    let resLink = newForRes.querySelector('a');
                    resLink.setAttribute('href', results[i].url);
                    resLink.innerHTML = results[i].name;
                    resultElem.appendChild(newForRes);
                }
                created++;
            }
        }
        // Generate not found message
        if (created === 0) {
            let noresultli = document.createElement('li');
            noresultli.innerHTML = SWAC.lang.dict.Search.nothingfound;
            resultElem.appendChild(noresultli);
        }
    }

    /**
     * Searches a matching result entry maker. Delivers the first found one.
     * 
     * @param {Object} result Object with search result data
     * @param {DOMElement} resultElem Element where the result should be placed
     * @returns {this.getResultEntryMaker.searchResultMaker}
     */
    getResultEntryMaker(result, resultElem) {
        for (let searchResultMaker of this.options.searchresultentrymakers) {
            if (searchResultMaker.isApplicable(result, resultElem)) {
                return searchResultMaker;
            }
        }
    }

    /**
     * Adds the dropdown function to the modulesearch component.
     */
    initAdvancedTemplate() {
        let indexToggleElem = this.requestor.querySelector('.swac_search_indextoggle');
        let thisRef = this;
        indexToggleElem.addEventListener('click', function (evt) {
            evt.preventDefault();
            let indexElem = thisRef.requestor.querySelector('.swac_search_index');
            if (indexElem.classList.contains('swac_dontdisplay')) {
                indexToggleElem.setAttribute('uk-icon', 'icon: chevron-up; ratio: 2');
                indexElem.classList.remove('swac_dontdisplay');
            } else {
                indexToggleElem.setAttribute('uk-icon', 'icon: chevron-down; ratio: 2');
                indexElem.classList.add('swac_dontdisplay');
            }
        });

        /**
         * Adds the letters A-Z to the modulesearch component.
         * Adds listeners to every letter for manufacturer search.
         */
        let letter, button;
        let container = this.requestor.querySelector('.swac_search_indexletters');
        for (let i = 65; i <= 90; i++) {
            letter = String.fromCharCode(i);
            button = document.createElement('button');
            button.classList.add('uk-button');
            button.classList.add('uk-button-default');
            button.classList.add('uk-button-small');
            button.innerHTML = letter;
            button.setAttribute('data-letter', letter);
            container.appendChild(button);
            button.addEventListener('click', this.indexLetterPressed.bind(this));
        }
    }

    /**
     * Method that should be executed, when a letter from index is pressed
     * 
     * @param {DOMEvent} evt Event calling this method
     * @returns {undefined}
     */
    indexLetterPressed(evt) {
        // Get pressed letter
        let letter = evt.target.getAttribute('data-letter');
        // Empty result area
        let resultElem = this.requestor.querySelector('.swac_index_results');
        let infoElem = resultElem.querySelector('.swac_search_info');
        infoElem.innerHTML = SWAC.lang.dict.Search.performingIndexSearch;
        // Remove old results
        let oldResults = resultElem.querySelectorAll('.swac_search_added');
        for (let curOldResult of oldResults) {
            curOldResult.parentElement.removeChild(curOldResult);
        }

        // Perform search
        let thisRef = this;
        this.search(letter, this.options.indexSearchsources).then(function (results) {
            infoElem.innerHTML = '';
            // Do not create entries if something else is searched in meantime
            // or when there are no results
            if (thisRef.searchFor === letter && results.length > 0) {
                thisRef.createSearchResultEntries(results, resultElem);
            } else if (results.length === 0) {
                // Show error message to user
                infoElem.innerHTML = SWAC.lang.dict.Search.nothingfound;
            }
        }).catch(function (error) {
            Msg.error('search', 'Could not perform index search: ' + error);
            // Show error message to user
            infoElem.innerHTML = SWAC.lang.dict.Search.indexSearcherror;
        });
    }

    /**
     * Adds functions to the view for the offcanvas template
     * 
     * @returns {undefined}
     */
    initOffcanvasTemplate() {
        UIkit.offcanvas(".swac_searchbar_offcanvas").show();
    }
}