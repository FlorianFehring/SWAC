import SWAC from '../../../../swac.js';
import Plugin from '../../../../Plugin.js';
import Msg from '../../../../Msg.js';

/* 
 * This plugin allows searching for places. Uses the openstreetmap-API.
 */
export default class SearchPlacesSPL extends Plugin {
    constructor(options = {}) {
        super(options);
        this.name = 'Worldmap2d/plugins/SearchPlaces';
        this.desc.text = 'Plugin to search for places and move the map to them';

        this.desc.templates[0] = {
            name: 'searchplaces',
            style: 'searchplaces',
            desc: 'Default template for SearchPlaces',
        };
        
        this.desc.opts[1] = {
            name: "searchurl",
            desc: "URL where to send the search request. Be aware that most APIs do not allow CORS requests. So you have to use a proxy.",
            example: 'https://photon.komoot.io/api/'
        }
        if (!options.searchurl)
            this.options.searchurl = 'http://localhost:8080/SmartData/smartdata/proxy/get?url=https://nominatim.openstreetmap.org/search'; 
        
        // Attributes for internal usage
        this.searchplaces = null;
        this.modalOpenButton = null;
        this.modal = null;
        this.map = null;
        this.searchButton = null;
        this.searchField = null;
        this.menuOpened = false;
    }

    init() {
        return new Promise((resolve, reject) => {
            this.map = this.requestor.parent.swac_comp;
            //get all needed html-elements
            this.searchplaces = this.requestor.parent.querySelector('.searchplaces');
            this.modalOpenButton = this.searchplaces.querySelector('.searchplaces-button');
            this.modal = this.searchplaces.querySelector('.searchplaces-menu-wrapper');
            this.searchButton = this.searchplaces.querySelector('.searchplaces-search-button');
            this.searchField = this.searchplaces.querySelector('.searchplaces-search-field');
            this.modal.style.display = 'none';

            //disable map interactions
            L.DomEvent.disableClickPropagation(this.searchplaces, 'click', L.DomEvent.stopPropagation);
            L.DomEvent.disableClickPropagation(this.searchplaces, 'dblclick', L.DomEvent.stopPropagation);

            //plugin menu closes when pressing X button
            document.getElementById('button-close-searchplaces').onclick = this.closeModal.bind(this);

            //plugin menu closes when not clicking on an input component
            this.modal.onclick = (e) => {
                if (e.target.closest('#searchplaces-menu') == null) {
                    this.closeModal();
                }
            }


            //setup button for opening and closing the menu
            this.modalOpenButton.onclick = (e) => {
                if (this.menuOpened) {
                    this.map.enableMapInteractions();
                    this.modal.style.display = "none";
                } else {
                    this.map.disableMapInteractions();
                    this.modal.style.removeProperty('display');
                }
                this.menuOpened = !this.menuOpened;
            }

            //setup search button
            this.searchButton.addEventListener('click', this.onButtonClick.bind(this));
            resolve();
            // search with enter
            this.searchField.addEventListener('keypress', (e) => {
                if (e.key == 'Enter') this.onButtonClick();
            });
        });
    }
    /* 
     * Searches a place matching with the given value and if successful, moves the map to found place.
     */
    async onButtonClick() {
        let searchValue = this.searchField.value;
        if (searchValue != "") {
            this._searchNominatim(searchValue).then((feature) => {
                //move to location
                let lat = feature.geometry.coordinates[1];
                let lon = feature.geometry.coordinates[0];
                this.map.viewer.panTo([lat, lon]);
                //adjust zoom level
                this.map.viewer.fitBounds([[feature.bbox[1], feature.bbox[0]], [feature.bbox[3], feature.bbox[2]]]);
                //close menu
                this.map.enableMapInteractions();
                this.modal.style.display = "none";
                this.menuOpened = false;
                //clear search field
                this.searchField.value = "";
            }).catch((error) => {
                Msg.error(error);
                UIkit.notification({
                    message: 'Es ist ein Fehler bei folgenden Suchbegriff >' + searchValue + '< aufgetreten.',
                    status: 'info',
                    timeout: SWAC.config.notifyDuration,
                    pos: 'top-center'
                });
            });
        }
    }
    /* 
     * Calls the API to find a place with given name.
     * @param {String} searchValue Name that will be searched for
     */
    async _searchNominatim(searchValue) {
        return new Promise((resolve, reject) => {
            searchValue = encodeURIComponent(searchValue);
            let Model = window.swac.Model;
    
            let dataCapsule = {
                fromName: this.options.searchurl,
                fromWheres: {
                    q: searchValue,
                    format: 'geojson',
                    limit: 1
                }
            };
            Model.load(dataCapsule).then((data) => {
                for (let curSet of data) {
                    if (curSet !== undefined) {
                        let features = curSet.features;
                        if (features.length > 0) {
                            let feature = features[0];
                            resolve(feature);
                        } else {
                            reject("no results found");
                        }
                    }
                }
            }).catch((error) => {
                console.log("10000")
                reject(error);
            });
        });
    }

    closeModal() {
        this.map.enableMapInteractions();
        this.modal.style.display = "none";
        this.menuOpened = false;
    }
    
}