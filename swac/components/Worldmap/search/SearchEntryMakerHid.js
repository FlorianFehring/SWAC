/* 
 * SearchEntryMaker for building hids
 */

class SearchEntryMakerHid extends SearchEntryMaker {
    constructor() {
        super();
        this.groundpath = null;
        this.groundfound = false;
        this.grounddata = null;
        this.modelpath = null;
        this.modelfound = false;
        this.placeElement = null;
    }

    /**
     * Checks if this SearchEntryMaker is applicable to build a entry from the 
     * given result.
     * 
     * @param {Object} searchResult Result of search that should be checked if this SearchEntryMaker is applicable
     * @returns {boolean} true if this maker can be used
     */
    isApplicable(searchResult) {
        if (Number.isInteger(searchResult.result)) {
            return true;
        }
        Msg.warn('SearchEntryMakerHid', 'Result with hid >' + searchResult.result + '< is not renderable with this maker.');
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
        this.placeElement = placeElement;
        let hid = searchResults[resultNo]['result'];
        // Check if a ground json file exists
        this.groundpath = this.groundpath.replace('{hid}', hid);
        let refCaller = this;
        fetch(this.groundpath).then(
                function (response) {
                    if (response.status < 400) {
                        refCaller.groundfound = true;
                        return response.json();
                    }
                }).then(function (json) {
            refCaller.grounddata = json;
            refCaller.searchModel(hid);
        }).catch(function (error) {
            Msg.error('SearchEntryMakerHid', 'A error occured searching: ' + error);
            refCaller.searchModel(hid);
        });
    }

    /**
     * Searches the model matching the hid on the server
     * @param {Number} hid hid of the building to load
     * @returns {undefined}
     */
    searchModel(hid) {
        let refCaller = this;
        let modelpath = this.groundpath.replace('{hid}', hid);
        fetch(modelpath, {method: 'HEAD'}).then(
                function (response) {
                    if (response.status < 400 || response.status === 405) {
                        refCaller.modelfound = true;
                    } else {
                        Msg.warn('SearchEntryMakerHid', 
                        'There is no building model available for hid >' + hid + '<');
                    }
                    refCaller.createEntry(hid);
                }).catch(function (error) {
            Msg.error('SearchProviderFile', 'A error occured searching: ' + error);
        });
    }

/**
 * Creates an entry for the given hid based on the ground data.
 * 
 * @param {number} hid Buildings hid
 * @returns {undefined}
 */
    createEntry(hid) {
        // Create no entry if there is no grounddata
        if (typeof this.grounddata === 'undefined' || this.groundfound === null) {
            Msg.warn('SearchEntryMakerHid', 
                        'There is no grounddata available for hid >' + hid + '<');
            return;
        }
        // Create sublist for locations
        let ul = document.createElement('ul');
        console.log("SearchEntryMakerHid before grounddata");
        // Build entry for each adress of this building
        if (this.grounddata.locations.length > 1) {
            for (var i in this.grounddata.locations) {
                // Build list entry for selection list
                var li = document.createElement('li');
                // Adding url to file
                li.setAttribute('url', this.groundpath);
                // Adding hid as attribute for use when element is clicked
                li.setAttribute('hid', hid);
                // Adding location id as attribute for use when element is clicked
                li.setAttribute('loc', i);
                li.innerHTML = this.grounddata.locations[i].street + ' ' + this.grounddata.locations[i].house_no;

                if (typeof this.onClickEventListener !== 'undefined') {
                    li.addEventListener('click', this.onClickEventListener);
                }
                ul.appendChild(li);
            }
        }

        let resultName = this.grounddata.locations[0].street + ' ' + this.grounddata.locations[0].house_no;
        let resultNameElem = document.createTextNode(resultName);
        if (this.grounddata.locations.length === 1) {
            let resultspanElem = document.createElement('span');
            // Adding url to file
            resultspanElem.setAttribute('url', this.groundpath);
            // Adding hid as attribute for use when element is clicked
            resultspanElem.setAttribute('hid', hid);
            // Adding location id as attribute for use when element is clicked
            resultspanElem.setAttribute('loc', 0);
            resultspanElem.appendChild(resultNameElem);

            if (typeof this.onClickEventListener !== 'undefined') {
                resultspanElem.addEventListener('click', this.onClickEventListener);
            }
            this.placeElement.appendChild(resultspanElem);
        } else {
            this.placeElement.appendChild(resultNameElem);
        }
        // Add warning if model does not exists
        if (!this.modelfound) {
            var warningElem = document.createElement('span');
            warningElem.setAttribute('uk-icon', 'icon: warning');
            warningElem.setAttribute('uk-tooltip', 'title: ' + SWAC.lang.dict.Worldmap.no_model);
            this.placeElement.appendChild(warningElem);
        }
        // Add list of adresses
        this.placeElement.appendChild(ul);
    }
}
