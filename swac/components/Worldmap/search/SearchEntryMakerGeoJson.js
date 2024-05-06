/* 
 * SearchEntryMaker for location data deliverd in a json file according to
 * the SEGLTF-metadata standard.
 */

class SearchEntryMakerGeoJson extends SearchEntryMaker {

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
        if (searchResult.url.endsWith('.geojson')) {
            return true;
        }
        if (searchResult.result && searchResult.result.geometry && searchResult.result.properties) {
            return true;
        }
        Msg.warn('SearchEntryMakerGeoJson', 'Result with file >' + searchResult.url + '< is not renderable with this maker.');
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
        let groundModel = new GeoJson();
        let searchEntryMaker = this;

        // Check if there is a model file for the same building
        let modelFileAvailable = false;
        let searchFileName = searchResults[resultNo].url.replace('.geojson', '.glb');
        for (let result of searchResults) {
            if (result.url === searchFileName
                    && (result.status < 400 || result.status === 405)) {
                modelFileAvailable = true;
            }
        }

        let searchResult = searchResults[resultNo];
        // Check if result contains geometry
        if (searchResult.result && searchResult.result.geometry) {
            // Create sublist for locations
            let locdiv = document.createElement('div');
            locdiv.setAttribute('lon', searchResult.result.geometry.coordinates[0]);
            locdiv.setAttribute('lat', searchResult.result.geometry.coordinates[1]);
            // Pretty display if address details are available
            if (searchResult.result.properties.address) {
                if (searchResult.result.properties.address.road) {
                    locdiv.innerHTML = searchResult.result.properties.address.road;
                }
                if (searchResult.result.properties.address.house_number) {
                    locdiv.innerHTML += ' ' + searchResult.result.properties.address.house_number;
                }
                if (searchResult.result.properties.address.postcode) {
                    locdiv.innerHTML += ' ' + searchResult.result.properties.address.postcode;
                }
                if (searchResult.result.properties.address.town) {
                    locdiv.innerHTML += ' ' + searchResult.result.properties.address.town;
                }
            } else {
                locdiv.innerHTML = searchResult.result.properties.display_name;
            }
            // Add event listener
            if (typeof searchEntryMaker.onClickEventListener !== 'undefined') {
                locdiv.addEventListener('click', searchEntryMaker.onClickEventListener);
            }

            // Add list of adresses
            placeElement.appendChild(locdiv);
        } else {
            // Reference to model file
            groundModel.load(searchResult.url).then(function () {
                // Get bulding no
                let hid = searchResult.name.replace('.geojson', '');

                // Create sublist for locations
                let ul = document.createElement('ul');

                // Create result line for each submodel and its locations
                for (let submodel of groundModel.locations) {
                    let resultNameElem = document.createElement('div');
                    resultNameElem.appendChild(document.createTextNode(submodel.name));
                    if (submodel.description) {
                        resultNameElem.setAttribute('uk-tooltip', submodel.description);
                    }
                    placeElement.appendChild(resultNameElem);
                    // Check if the feature have locations
                    if (submodel.locations) {
                        for (let locationId in submodel.locations) {
                            let location = submodel.locations[locationId];

                            // Build list entry for selection list
                            var li = document.createElement('li');
                            // Adding url to file
                            li.setAttribute('url', searchResult.url);
                            // Adding hid as attribute for use when element is clicked
                            li.setAttribute('hid', hid);
                            // Adding location id as attribute for use when element is clicked
                            li.setAttribute('loc', locationId);
                            li.innerHTML = location.street + ' ' + location.house_no;

                            if (location.description) {
                                li.setAttribute('uk-tooltip', location.description);
                            }

                            if (typeof searchEntryMaker.onClickEventListener !== 'undefined') {
                                li.addEventListener('click', searchEntryMaker.onClickEventListener);
                            }
                            ul.appendChild(li);
                        }
                    } else {
                        var li = document.createElement('li');
                        li.appendChild(document.createTextNode("Zu diesem Gebäude liegt keine Adresse vor."));
                        ul.appendChild(li);
                    }
                    // Add list of adresses
                    placeElement.appendChild(ul);
                }

                // Add warning if model does not exists
                if (!modelFileAvailable) {
                    var warningElem = document.createElement('span');
                    warningElem.setAttribute('uk-icon', 'icon: warning');
                    warningElem.setAttribute('uk-tooltip', 'title: ' + SWAC.lang.dict.Worldmap.no_model);
                    placeElement.appendChild(warningElem);
                }
            });
        }
    }
}
