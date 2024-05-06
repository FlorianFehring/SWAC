import SWAC from '../../swac.js';
import View from '../../View.js';
import Msg from '../../Msg.js';

export default class Mapselect extends View {

    constructor(options = {}) {
        super(options);
        this.name = 'Mapselect';
        this.desc.text = 'DEPRECATED! This component allows to select an area on map. It can'
                + ' be used define areas or request data from an source that '
                + 'contains geo data.';
        this.desc.developers = 'Lukas von der Heide';
        this.desc.license = 'GNU Lesser General Public License';
        
        this.desc.depends[0] = {
            name: 'leaflet.js',
            path: SWAC.config.swac_root + 'components/Mapselect/libs/leaflet.js',
            desc: 'Leaflet library for viewing maps.'
        };
        this.desc.depends[1] = {
            name: 'leaflet.css',
            path: SWAC.config.swac_root + 'components/Mapselect/libs/leaflet.css',
            desc: 'Style for leafelet maps.'
        };
        this.desc.depends[2] = {
            name: 'leaflet.draw.js',
            path: SWAC.config.swac_root + 'components/Mapselect/libs/leaflet.draw.js',
            desc: 'Extension for leaflet that allows drawing on the map.'
        };
        this.desc.depends[3] = {
            name: 'leaflet.draw.css',
            path: SWAC.config.swac_root + 'components/Mapselect/libs/leaflet.draw.css/leaflet.draw.css',
            desc: 'Styles for drawing on leaflet maps.'
        };
        this.desc.templates[0] = {
            name: 'map',
            style: 'map',
            desc: 'Default template showing a simple map.'
        };
        this.desc.reqPerTpl[0] = {
            selc: '.swac_mapselect_map',
            desc: 'DIV Element where the map should be placed'
        };
        this.desc.reqPerSet[0] = {
            name: 'id',
            desc: 'The attribute id is required for the component to work properly.'
        };
        this.desc.optPerSet[0] = {
            name: 'nameOfTheAttributeOptionalInEachSet',
            desc: 'Description what is the expected effect, when this attribute is in the set.'
        };
        // opts ids over 1000 are reserved for Component independend options
        if (!options.showWhenNoData)
            this.options.showWhenNoData = true;

        this.desc.opts[0] = {
            name: "multiple",
            desc: "If true multiple areas can be selected at once."
        };
        if (!options.multiple)
            this.options.multiple = false;

        this.desc.opts[1] = {
            name: "onSelectMethod",
            desc: "Method that should be executed if a selection is made. The event data is given as parameter."
        };
        if (!options.onSelectMethod)
            this.options.onSelectMethod = this.onSelectCollect;

        this.desc.opts[2] = {
            name: "dataRequestor",
            desc: "DataRequestor for use with the onSelectFetch event handler. "
                    + "Must give the URL to the REST interface where data can be fetched."
        };
        if (!options.dataRequestor)
            this.options.dataRequestor = null;

        this.desc.funcs[0] = {
            name: 'getInputs',
            desc: 'Delivers the selections on map as geoJSON'
        };

        this.desc.funcs[1] = {
            name: 'onSelectCollect',
            desc: 'Default onSelect handler puts the selection into the components data.'
        };
        this.desc.funcs[2] = {
            name: 'onSelectFetch',
            desc: 'Handler for fetching Data from an geo rest interface. Can be used as parameter on onSelectMethod.'
        };

        // Internal values
        this.activeSource;  // Datasource that is currently used
        this.map;           // Reference to the map
        this.selgroup;      // Leaflet feature group with selected layer
    }

    init() {
        return new Promise((resolve, reject) => {
            // Create map at map divs
            let mapdiv = this.requestor.querySelector('.swac_mapselect_map');
            this.map = L.map(mapdiv).setView([55, 30], 4);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
                maxZoom: 18,
                id: 'mapbox/streets-v11',
                tileSize: 512,
                zoomOffset: -1,
                accessToken: 'your.mapbox.access.token'
            }).addTo(this.map);

            this.selgroup = new L.FeatureGroup();
            this.map.addLayer(this.selgroup);

            // Go trough data
            for (let curSource in this.data) {
                this.activeSource = curSource;
                // Go trough each dataset and search for map selection information
                for (let curSet of this.data[curSource].getSets()) {
                    if (curSet)
                        this.afterAddSet(curSet);
                }
            }
            // Craeate a resource if no exists
            if (!this.activeSource) {
                this.activeSource = 'new';
                this.data['new'] = [];
            }

            // Add draw functionality
            var drawControl = new L.Control.Draw({
                draw: {
                    polyline: false,
                    polygon: false,
                    circle: false,
                    marker: false
                }
            });
            this.map.addControl(drawControl);

            // Register reaction for selection
            if (this.options.dataRequestor) {
                this.map.on(L.Draw.Event.CREATED, this.onSelectFetch.bind(this));
            } else {
                this.map.on(L.Draw.Event.CREATED, this.options.onSelectMethod.bind(this));
            }
            resolve();
        });
    }

    /**
     * Method thats called before adding a dataset
     * This overrides the method from View.js
     * 
     * @param {Object} set Object with attributes to add
     * @returns {Object} (modified) set
     */
    beforeAddSet(set) {
        // You can check or transform the dataset here
        return set;
    }

    /**
     * Method thats called after a dataset was added.
     * This overrides the method from View.js
     * 
     * @param {Object} set Object with attributes to add
     * @returns {undefined}
     */
    afterAddSet(set) {
        L.geoJSON(set).addTo(this.map);
        return;
    }

    /**
     * Gets the selected areas as geoJSON array
     * @returns {geoJSON[]}
     */
    getInputs() {
        return this.data[this.activeSource];
    }

    /**
     * Simples reaction on selecting an area on map. 
     * 
     * @param {type} evt
     * @returns {undefined}
     */
    onSelectCollect(evt) {
        // Delete previous selection
        if (!this.options.multiple) {
            this.selgroup.clearLayers();
            this.data[this.activeSource] = [];
        }

        var layer = evt.layer;
        this.selgroup.addLayer(layer);
        this.data[this.activeSource].push(layer.toGeoJSON());
    }

    /**
     * Fetches data with an data requestor when an area is selected
     * 
     * @param {type} evt
     * @returns {undefined}
     */
    onSelectFetch(evt) {
        //                if (column_array.length <= 0) {
//                    UIkit.modal.alert("Bitte wählen Sie eine Tabelle mit Einträgen aus!");
//                    return;
//                }
//                if (!column_array.includes(col_name_ref)) {
//                    UIkit.modal.alert("Die ausgewählte Tabelle besitzt die Spalte   " + col_name_ref + "   nicht! Bitte wählen Sie eine andere Tabelle.");
//                    return;
//                }

        // Delete previous selection
        this.selgroup.clearLayers();
        this.data[this.activeSource] = [];
        // Add visual selection
        var layer = evt.layer;
        this.selgroup.addLayer(layer);

        // Get the requestor template
        let requestor = JSON.parse(JSON.stringify(this.options.dataRequestor));

        // Get data that can be inserted
        let replaces = new Map();
        replaces.set('{min_x}', 9999999999);
        replaces.set('{min_y}', 9999999999);
        replaces.set('{max_x}', -999999999);
        replaces.set('{max_y}', -999999999);
        replaces.set('{min_lat}', 100);
        replaces.set('{min_lng}', 200);
        replaces.set('{max_lat}', -100);
        replaces.set('{max_lng}', -200);

        for (let curLatLngSet of layer.getLatLngs()) {
            for (let curLatLng of curLatLngSet) {
                if (curLatLng.lat < replaces.get('{min_lat}')) {
                    replaces.set('{min_lat}', curLatLng.lat);
                    replaces.set('{min_x}', L.Projection.Mercator.project(curLatLng).x);
                }
                if (curLatLng.lat > replaces.get('{max_lat}')) {
                    replaces.set('{max_lat}', curLatLng.lat);
                    replaces.set('{max_x}', L.Projection.Mercator.project(curLatLng).x);
                }
                if (curLatLng.lng < replaces.get('{min_lng}')) {
                    replaces.set('{min_lng}', curLatLng.lng);
                    replaces.set('{min_y}', L.Projection.Mercator.project(curLatLng).y);
                }
                if (curLatLng.lng > replaces.get('{max_lng}')) {
                    replaces.set('{max_lng}', curLatLng.lng);
                    replaces.set('{max_y}', L.Projection.Mercator.project(curLatLng).y);
                }
            }
        }

        // Search and replace placeholders
        let placeholders = requestor.fromName.match(/{([^}]+)}/g);
        if (placeholders) {
            for (const match of placeholders) {
                if (replaces.has(match)) {
                    requestor.fromName.replace(match, replaces.get(match));
                } else {
                    Msg.error('Mapselect', 'Unkown placeholder >'
                            + match + '< see documentation for allowed placeholders.', this.requestor);
                }
            }
        }
        // Search placeholders in wheres
        if (requestor.fromWheres) {
            for (let curWhere in requestor.fromWheres) {
                placeholders = requestor.fromWheres[curWhere].match(/{([^}]+)}/g);
                if (placeholders) {
                    for (const match of placeholders) {
                        if (replaces.has(match)) {
                            requestor.fromWheres[curWhere] = requestor.fromWheres[curWhere].replace(match, replaces.get(match));
                        } else {
                            Msg.error('Mapselect', 'Unkown placeholder >'
                                    + match + '< see documentation for allowed placeholders.', this.requestor);
                        }
                    }
                }
            }
        }

        // Fetch data
        var thisRef = this;
        Model.load(requestor).then(
                function (response) {
                    thisRef.saveText(JSON.stringify(response.data), "mapselect.json");
                }).catch(function (error) {
            UIkit.modal.alert("Fehler beim abrufen der Daten. Statuscode: " + error.status);
        });
    }

    /**
     * Save data as text file
     * @param {type} text
     * @param {type} filename
     * @returns {undefined}
     */
    saveText(text, filename) {
        var a = document.createElement('a');
        a.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        a.setAttribute('download', filename);
        a.click();
    }
}