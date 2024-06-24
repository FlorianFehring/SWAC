import SWAC from '../../swac.js';
import View from '../../View.js';
import Msg from '../../Msg.js';
import ModelFactory from './model/ModelFactory.js';

export default class Worldmap2d extends View {
    constructor(options = {}) {
        super(options);
        this.name = 'Worldmap2d';

        //component description
        this.desc.text = '2D Worldmap component for displaying data on a canvas. Useable for geojson data and plain datasets as well.';
        this.desc.developers = 'Florian Fehring (FH Bielefeld)';
        this.desc.license = 'GNU Lesser General Public License';

        //load dependencies
        this.desc.depends[0] = {
            name: 'leaflet.js',
            path: SWAC.config.swac_root + 'libs/leaflet/leaflet.js',
            desc: 'leaflet framework main js file.'
        };
        this.desc.depends[1] = {
            name: 'leaflet CSS',
            path: SWAC.config.swac_root + 'libs/leaflet/leaflet.css',
            desc: 'Style file for leaflet'
        };
        // load these dependencies only if clusterMarkers option is enabled

        this.desc.depends[2] = {
            name: 'MarkerCluster.css',
            path: SWAC.config.swac_root + 'libs/leaflet/markercluster/MarkerCluster.css',
            desc: 'Style file for leaflet markercluster plugin',
            loadon: this.options.clusterMarkers
        };
        this.desc.depends[3] = {
            name: 'MarkerCluster.Default.css',
            path: SWAC.config.swac_root + 'libs/leaflet/markercluster/MarkerCluster.Default.css',
            desc: 'Default style file for leaflet markercluster plugin',
            loadon: this.options.clusterMarkers
        };

        this.desc.depends[4] = {
            name: 'leaflet.markercluster.js',
            path: SWAC.config.swac_root + 'libs/leaflet/markercluster/leaflet.markercluster.js',
            desc: 'leaflet markercluster plugin main js file.',
            loadon: this.options.clusterMarkers
        };
        // Dependencies for shapefile support
        this.desc.depends[5] = {
            name: 'leaflet.shpfile.js',
            path: SWAC.config.swac_root + 'libs/leaflet/shapefile/leaflet.shpfile.js',
            desc: 'leaflet shpfile plugin, depends on shp.js file'
        }
        this.desc.depends[6] = {
            name: 'cataline.js',
            path: SWAC.config.swac_root + 'libs/leaflet/shapefile/cataline.js',
            desc: 'cataline is a dependency for leaflet shpfile plugin'
        }
        // Dependencies for geotiff support (EPSG:4326)
        this.desc.depends[7] = {
            name: 'georaster.browser.bundle.min.js',
            path: SWAC.config.swac_root + 'libs/leaflet/geotiff/georaster.browser.bundle.min.js',
            desc: 'georaster library'
        }
        this.desc.depends[8] = {
            name: 'georaster-layer-for-leaflet.min.js',
            path: SWAC.config.swac_root + 'libs/leaflet/geotiff/georaster-layer-for-leaflet.min.js',
            desc: 'leaflet georaster plugin'
        }
        this.desc.depends[9] = {
            name: 'leaflet-rotatedMarker.js',
            path: SWAC.config.swac_root + 'libs/leaflet/leaflet-rotatedMarker.js',
            desc: 'leaflet rotatedMarker plugin'
        }
        this.desc.depends[10] = {
            name: 'turf.js',
            path: SWAC.config.swac_root + 'libs/turf/turf.min.js',
            desc: 'turf geospatial algorithms'
        }

        this.desc.templates[0] = {
            name: 'Worldmap2d',
            style: 'Worldmap2d',
            desc: 'Template with area for plugins'
        };

        this.desc.reqPerSet[0] = {
            name: "id",
            desc: "Id that identifies the dataset.",
            type: "long"
        };
        this.desc.reqPerSet[1] = {
            name: "name",
            alt: "title",
            desc: "Name or title of the selection.",
            type: "String"
        };

        this.desc.optPerSet[0] = {
            name: 'geoJSON',
            desc: 'GeoJSON formatted JSON to display on the map',
            type: 'application/geojson'
        };

        this.options.showWhenNoData = true;

        //*********************
        // Start view options
        //*********************
        this.desc.opts[0] = {
            name: "startPointLon",
            example: 8.905,
            desc: "Positions longitude of the point to look at when page loads"
        };
        if (typeof options.startPointLon === 'undefined')
            this.options.startPointLon = 8.905;

        this.desc.opts[1] = {
            name: "startPointLat",
            example: 52.296,
            desc: "Positions latitude of the point to look at when page loads"
        };
        if (typeof options.startPointLat === 'undefined')
            this.options.startPointLat = 52.296;

        this.desc.opts[2] = {
            name: "zoom",
            example: 17,
            desc: "Initial map zoom level"
        };
        if (typeof options.zoom === 'undefined')
            this.options.zoom = 15;

        this.desc.opts[3] = {
            name: "maxZoom",
            example: 18,
            desc: "Map's max zoom level (needed for clustering feature). Value > 18 leads to issues loading/displaying the map."
        };
        if (typeof options.maxZoom === 'undefined')
            this.options.maxZoom = 18;

        this.desc.opts[4] = {
            name: "zoomControl",
            example: true,
            desc: "Whether a zoom control is added to the map by default."
        };
        if (typeof options.zoomControl === 'undefined')
            this.options.zoomControl = true;

        this.desc.opts[5] = {
            name: "zoomControlPosition",
            example: "topright",
            desc: "Position of the zoom control element. topleft / topright"
        };
        if (!options.zoomControlPosition)
            this.options.zoomControlPosition = "topleft";

        this.desc.opts[6] = {
            name: "attributionControl",
            example: true,
            desc: "Whether a attribution control is added to the map by default."
        };
        if (typeof options.attributionControl === 'undefined')
            this.options.attributionControl = true;

        this.desc.opts[7] = {
            name: "mapProviderURL",
            example: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            desc: "URL of the map provider"
        };
        if (typeof options.mapProviderURL === 'undefined')
            this.options.mapProviderURL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'; // Defaults to OpenStreetMap

        this.desc.opts[8] = {
            name: "mapAttribution",
            example: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            desc: "Attribution of the map provider"
        };
        if (typeof options.mapAttribution === 'undefined')
            this.options.mapAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

        this.desc.opts[9] = {
            name: "latAttr",
            example: "lat",
            desc: "Name of datas attribute containing the latitude information"
        };
        if (!options.latAttr)
            this.options.latAttr = 'latitude';

        this.desc.opts[10] = {
            name: "lonAttr",
            example: "lon",
            desc: "Name of datas attribute containing the longitude information"
        };
        if (!options.lonAttr)
            this.options.lonAttr = 'longitude';

        this.desc.opts[11] = {
            name: "clusterMarkers",
            example: true,
            desc: "Whether or not the map should cluster markers"
        };
        if (typeof options.clusterMarkers === 'undefined' || options.clusterMarkers === "false")
            this.options.clusterMarkers = false;

        this.desc.opts[12] = {
            name: "modelFiles",
            desc: "List of files with geo informations. Each entry is an object with url, layername and filetype (shapefile / geojson)",
            example: [{
                    url: '../../data/worldmap2d/shapefiles/congress.zip',
                    name: 'CongressionalDistricts',
                    type: 'shapefile'
                }]
        };
        if (!options.modelFiles)
            this.options.modelFiles = [];

        this.desc.opts[13] = {
            name: "idGeolocationComponent",
            example: "geolocation",
            desc: "(optional) If provided, the map will search for a geolocation component with the given id, and register itself as a listener for position updates."
        };
        if (typeof options.idGeolocationComponent === 'undefined')
            this.options.idGeolocationComponent = null;

        this.desc.opts[14] = {
            name: "latchOnLocation",
            example: "false",
            desc: "If true, the map will latch on the user's location, i.e. the map will move with the user's location."
        };
        if (typeof options.latchOnLocation === 'undefined') {
            //when no option provided, enable latchOnLocation by default if idGeolocationComponent is provided
            this.options.latchOnLocation = (typeof this.options.idGeolocationComponent === 'string' && this.options.idGeolocationComponent.length > 0);
        }

        this.desc.opts[15] = {
            name: "customIconOptions",
            example: {
                shadowUrl: '../../swac/libs/leaflet/images/marker-shadow.png',
                iconSize: [60, 60],
                shadowSize: [60, 60],
                shadowAnchor: [30, 56],
                iconAnchor: [30, 56]
            },
            desc: "Custom icon options for the markers"
        };
        if (typeof options.customIconOptions === 'undefined')
            this.options.customIconOptions = null;

        this.desc.opts[16] = {
            name: "userIcon",
            example: {
                iconUrl: '../../swac/libs/leaflet/images/marker_person.png',
                iconSize: [25, 50],
                iconAnchor: [12, 50]
            },
            desc: "places a marker with given icon on user location if geolocation is activated"
        };
        if (typeof options.userIcon === 'undefined')
            this.options.userIcon = null;

        this.desc.opts[17] = {
            name: "customIconVisited",
            example: {iconUrl: '../../swac/libs/leaflet/images/marker_icon_custom_visited.svg'},
            desc: "Custom icon for visited positions, only used if 'customCircleMarkerOptions' is not set"
        };
        if (typeof options.customIconVisited === 'undefined')
            this.options.customIconVisited = null;

        this.desc.opts[18] = {
            name: "customIconUnvisited",
            example: {iconUrl: '../../swac/libs/leaflet/images/marker_icon_custom_unvisited.svg'},
            desc: "Custom icon for unvisited positions, only used if 'customCircleMarkerOptions' is not set"
        };
        if (typeof options.customIconUnvisited === 'undefined')
            this.options.customIconUnvisited = null;

        this.desc.opts[19] = {
            name: "customCircleMarkerOptions",
            example: {
                radius: 8, fillColor: "#ff7800", color: "#000",
                weight: 1, opacity: 1, fillOpacity: 0.8
            },
            desc: "options for the circle markers"
        };
        if (typeof options.customCircleMarkerOptions === 'undefined')
            this.options.customCircleMarkerOptions = null;

        this.desc.opts[20] = {
            name: 'datadescription',
            desc: 'Selector of the datadescription component that should be used.',
            example: '#my_datadesc'
        };
        if (!options.datadescription)
            this.options.datadescription = null;

        this.desc.opts[22] = {
            name: 'baseLayers',
            desc: 'Map to add different base layers to the map.'
        };
        if (!options.baseLayers) {
            this.options.baseLayers = new Map();
            this.options.baseLayers.set("OpenStreetMaps", {
                mapProviderURL: 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                mapProviderAttribution: 'Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
                active: true});
        }

        this.desc.opts[23] = {
            name: 'baseLayerInit',
            desc: 'Name of the base layer used on inital loading.',
            example: 'baselayer'
        };
        if (!options.baseLayerInit)
            this.options.baseLayerInit = null;

        this.desc.opts[24] = {
            name: 'geoJSONAttr',
            desc: 'Name of the attribute that contains a geoJSON object.',
            example: 'point'
        }
        if (!options.geoJSONAttr)
            this.options.geoJSONAttr = null;

        this.desc.opts[25] = {
            name: 'allowAddModels',
            desc: 'If true shows the add model dialog.'
        }
        if (!options.allowAddModels)
            this.options.allowAddModels = false;

        this.desc.opts[26] = {
            name: 'corsavoidurl',
            desc: 'URL to SmartFile that downloads the model file and allows on this way access to cors protected files. Includes %url% placeholder for original file url.',
            example: '/SmartFile'
        }
        if (!options.corsavoidurl)
            this.options.corsavoidurl = null;

        // document plugins
        if (!options.plugins) {
            this.options.plugins = new Map();
            this.options.plugins.set('DataShowModal', {id: 'DataShowModal', active: false});
            this.options.plugins.set('DataAPIShowModal', {id: 'DataAPIShowModal', active: false});
            this.options.plugins.set('CreateMeasurementModal', {id: 'CreateMeasurementModal', active: false});
            this.options.plugins.set('FilterMeasurementPoints', {id: 'FilterMeasurementPoints', active: false});
            this.options.plugins.set('Help', {id: 'Help', active: false});
            this.options.plugins.set('InterfaceMagicMapper', {id: 'InterfaceMagicMapper', active: false});
            this.options.plugins.set('MapPinModal', {id: 'MapPinModal', active: false});
            this.options.plugins.set('SearchPlaces', {id: 'SearchPlaces', active: false});
            this.options.plugins.set('ToggleClickInteractionButton', {id: 'ToggleClickInteractionButton', active: false});
            this.options.plugins.set('ToggleLatchOnLocation', {id: 'ToggleLatchOnLocation', active: false});
            this.options.plugins.set('Navigation', {id: 'Navigation', active: false});
            this.options.plugins.set('Timeline', {id: 'Timeline', active: false});
            this.options.plugins.set('Interpolator', {id: 'Interpolator', active: false});
            this.options.plugins.set('AreaMarker', {id: 'AreaMarker', active: false});
        }

        this.desc.funcs[0] = {
            name: 'loadModelFile',
            desc: 'Adds a model file to the map.',
            params: [
                {
                    name: 'modelfile',
                    desc: 'Object with at least url parameter containing the url to the model file. Can have name and type [gejson,json,shapefile]',
                    type: 'URL'
                }
            ]
        };

        this.desc.funcs[1] = {
            name: 'removeModelFile',
            desc: 'Removes a model file to the map.',
            params: [
                {
                    name: 'modelfile',
                    desc: 'Object with at least url parameter containing the url to the model file. Can have name and type [gejson,json,shapefile]',
                    type: 'URL'
                }
            ]
        };

        this.desc.events[0] = {
            name: 'swac_REQUESTOR_ID_map_click',
            desc: 'Event is fired, when a user clicks somewhere on the map (not on markers).',
            data: 'Delivers the Leaflet onClickMap data in parameter e. Coordinates could be found in: e.detail.latlng.lat and e.detail.latlng.lon.'
        };
        this.desc.events[1] = {
            name: 'swac_REQUESTOR_ID_marker_click',
            desc: 'Event is fired, when a user clicks somewhere on a marker.',
            data: 'Delivers the Leaflet onClickMarker data in parameter e. Dataset could be found in: e.detail.target.feature.set'
        };
        this.desc.events[2] = {
            name: 'swac_REQUESTOR_ID_map_moved',
            desc: 'Event when the user moved on map.',
            data: 'Delivers the Leaflet movend data. See leflet documentation for details.'
        };


        // Attributes for internal usage
        this.viewer = null;      // Leaflet base layer
        this.layerControl = null;
        this.baseLayers = {};
        this.overlayLayers = {};
        this.markers = {};

        this.view = {};
        this.tile = null;
        this.lastReceivedPosition = null;  // Last received position from external source (e.g. GeoLocationComponent)
        this.userLocationMarker = null;

        // Array containing all models loaded at least from json (must not visible in sczene)
        this.models = [];
        this.failedmodels = [];

        this.preciseLocationPlugin = null;

        this.state = {
            mapInteractions: true,
            mapClickInteraction: true,
        };
    }

    init() {
        return new Promise((resolve, reject) => {
            // Activate addModel
            if (this.options.allowAddModels) {
                let addModelElem = this.requestor.querySelector('.swac_worldmap2d_addmodel');
                addModelElem.classList.remove('swac_dontdisplay');
                let addBtn = addModelElem.querySelector('button');
                addBtn.addEventListener('click', this.onAddModel.bind(this));
            }

            // For fitting on page, relative position
            document.getElementById(this.requestor.id).classList.add('swac_worldmap2d');

            this.detectComponents();
            this.initMap();
            this.initEventListeners();
            this.prepareIcons();
            this.preparePluginMenuBar();
            this.loadModelFiles();
            this.loadModelFileFromParameter();

            if (this.options.datasources) {
                document.addEventListener('swac_' + this.requestor.id + '_complete', () => {
                    this.loadDatasourcesFromOptions();
                })
            }

            resolve();
        });
    }

    /**
     * Initialize the map
     * - setup map
     * - adding control layers
     * - setup zoom
     */
    initMap() {
        // Create new map
        this.viewer = L.map(this.requestor.firstChild.querySelector('.swac_worldmap_map').id, {
            // Set latitude and longitude of the map center (required)
            center: [this.options.startPointLat, this.options.startPointLon],
            zoom: this.options.zoom,
            attributionControl: this.options.attributionControl,
            zoomControl: false,
        });

        // Add base layers
        for (let [key, value] of this.options.baseLayers) {
            this.baseLayers[key] = new L.tileLayer(value.mapProviderURL, {
                attribution: value.mapProviderAttribution,
                maxZoom: this.options.maxZoom,
                maxNativeZoom: 19,
            });
            if (value.active)
                this.baseLayers[key].addTo(this.viewer);
        }
        // Add base layers to layer control
        this.layerControl = L.control.layers(this.baseLayers).addTo(this.viewer);

        // Set position of zoom control
        if (this.options.zoomControl === true) {
            L.control.zoom({
                position: this.options.zoomControlPosition
            }).addTo(this.viewer);
        }

        // Register on bounds change listener
        let thisRef = this;
        this.viewer.on('moveend', function (e) {
            document.dispatchEvent(new CustomEvent(thisRef.requestor.id + '_map_moved', {detail: e}));
            thisRef.onViewportChange(e);
        });
    }

    /**
     * Prepares the plugin menu bar on the map
     */
    preparePluginMenuBar() {
        L.DomEvent.on(this.requestor.querySelector('.plugins'), 'click', L.DomEvent.stopPropagation);
    }

    afterAddSet(set, repeateds) {
        Msg.flow('Worldmap2d', 'afterAddSet(' + set.swac_fromName + '[' + set.id + '])', this.requestor);
        const geoJSON = {type: "Feature", geometry: {type: 'Point'}};
        // check config for datasources
        let datasource = this.options.datasources?.get(set.swac_fromName);
        if (datasource && datasource.latitudeAttr && datasource.longitudeAttr) {
            try {
                geoJSON.geometry.coordinates = [eval('set.' + datasource.latitudeAttr), eval('set.' + datasource.longitudeAttr)]
            } catch (e) {
                Msg.error('Worldmap2d', 'Configured latitude attribute >' + datasource.latitudeAttr 
                        + '< or longitude attribute >' + datasource.longitudeAttr + '< where not found in set >' + set.swac_fromName + '[' + set.id + ']<.', this.requestor);
                return;
            }
        } else if (this.options.geoJSONAttr) {
            geoJSON.geometry.coordinates = set[this.options.geoJSONAttr].coordinates;
        } else {
            geoJSON.geometry.coordinates = [set[this.options.lonAttr], set[this.options.latAttr]]
        }
        // Add complete dataset, important to keep data at marker up to date at external changes!
        geoJSON.set = set;
        // Zoom to a certain point
        let zoomToSource = SWAC.getParameterFromURL('zoomSource');
        let zoomToSet = SWAC.getParameterFromURL('zoomSet');
        if (zoomToSource && zoomToSource === set.swac_fromName && zoomToSet && parseInt(zoomToSet) === set.id) {
            this.zoomToSet(set);
        }
        this.addMarker(geoJSON);
        super.afterAddSet(set);
    }

    afterRemoveSet(set) {
        // Search marker and remove
        this.removeMarker(this.markers[set.swac_fromName][set.id]);
    }

    /**
     * Creates a marker from the given geoJSON feature.
     * 
     * @param {geoJSON} geoJSON Object in geoJSON style
     * @param {String} icon Path to the icon that should be used
     * 
     * @returns {Object} The marker that was added to the map.
     */
    addMarker(geoJSON, icon) {
        if (!geoJSON.geometry) {
            Msg.error('Worldmap2d', 'Feature does not contain a geometry can not create marker.', this.requestor);
            return;
        }
        let marker;
        const latlng = L.latLng(geoJSON.geometry.coordinates[1], geoJSON.geometry.coordinates[0])
        if (!latlng) {
            Msg.warn('Worldmap2d', 'Could not create marker for set >' + geoJSON.set.swac_fromName + '[' + geoJSON.set.id + ']<: Geocoordinates are missing or invalid.', this.requestor);
            return;
        }
        if (this.options.customCircleMarkerOptions) {
            //TODO unify with marker creation below, create option for circle marker
            marker = L.circleMarker(latlng, this.options.geojsonCircleMarkerOptions);
        } else {
            // Create markeropts
            let markeropts = {};
            if (this.options.customMarkerOptions)
                markeropts = this.options.customMarkerOptions;

            // Create icon
            //TODO unify with property depedendend icons
            if (geoJSON.properties && geoJSON.properties.completed == true) {
                icon = this.visitedIcon;
            } else if (geoJSON.properties) {
                icon = this.unvisitedIcon;
            }
            // Use icon from datadescription
            if (this.options.datadescription && geoJSON.set) {
                // Get color
                let col = this.datadescription.getValueColor(geoJSON.set);
                // If color is hex value remove sharp because its not allowed in file URL
                col = col.replace('#', '');
                col = col.replace('GREY', '7B7B7B')
                icon = new L.Icon({
                    iconUrl: '/SWAC/swac/components/Icon/imgs/map/marker-icon-' + col + '.png',
                    shadowUrl: '/SWAC/swac/components/Icon/imgs/map/marker-shadow.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowSize: [41, 41],
                    color: col
                });
            }
            if (icon)
                markeropts.icon = icon;

            // Create marker
            marker = L.marker(latlng, markeropts)
        }
        // Add eventhandler and feature to marker and marker to map
        marker.on('click', this.map_click_evts.markerclick);
        marker.feature = geoJSON;

        // Save in markers storage
        if (!this.markers[geoJSON.set.swac_fromName])
            this.markers[geoJSON.set.swac_fromName] = [];
        this.markers[geoJSON.set.swac_fromName][geoJSON.set.id] = marker;
        // check if overlay layer already exists
        if (!this.overlayLayers[geoJSON.set.swac_fromName]) {
            // check if datasource should be displayed
            if (this.options.datasources?.get(geoJSON.set.swac_fromName) && this.options.datasources?.get(geoJSON.set.swac_fromName).displayed == false)
                this.overlayLayers[geoJSON.set.swac_fromName] = this.options.clusterMarkers ? new L.markerClusterGroup({animateAddingMarkers: true}) : new L.layerGroup();
            else
                this.overlayLayers[geoJSON.set.swac_fromName] = this.options.clusterMarkers ? new L.markerClusterGroup({animateAddingMarkers: true}).addTo(this.viewer) : new L.layerGroup().addTo(this.viewer);
            // Add overlay layer to layer control
            this.layerControl.addOverlay(this.overlayLayers[geoJSON.set.swac_fromName], geoJSON.set.swac_fromName);
        }
        // add marker to layer
        this.overlayLayers[geoJSON.set.swac_fromName].addLayer(marker);

        return marker;
    }
    /**
     * Creates a Area from the given geoJSON feature.
     * 
     * @param {geoJSON} geoJSON Object in geoJSON style
     * @param {String} color String for the color of the displayed area
     * 
     * @returns {Object} The Area that was added to the map.
     */
  addArea(geoJSON, color="red") {
    if (!geoJSON.geometry) {
      Msg.error(
        'Worldmap2d',
        'Feature does not contain a geometry can not create Area.',
        this.requestor
      )
      return
    }
    let lines_arr = []
    geoJSON.geometry.coordinates.forEach((coordinate) => {
      const latlng = L.latLng(coordinate[1], coordinate[0])
      if (!latlng) {
        Msg.warn(
          'Worldmap2d',
          'Could not create area for set >' +
            geoJSON.set.swac_fromName +
            '[' +
            geoJSON.set.id +
            ']<: Geocoordinates are missing or invalid.',
          this.requestor
        )
        return
      }
      lines_arr.push([latlng.lng, latlng.lat])
    })
    let lines = L.polygon(lines_arr,{color: color})
    lines.feature = geoJSON
    if (!this.areas[geoJSON.set.swac_fromName])
      this.areas[geoJSON.set.swac_fromName] = []
    this.areas[geoJSON.set.swac_fromName][geoJSON.set.id] = lines
    if (!this.overlayLayers[geoJSON.set.swac_fromName]) {
      this.overlayLayers[geoJSON.set.swac_fromName] = new L.layerGroup().addTo(
        this.viewer
      )
      this.layerControl.addOverlay(
        this.overlayLayers[geoJSON.set.swac_fromName],
        geoJSON.set.swac_fromName
      )
    } else {
      this.overlayLayers[geoJSON.set.swac_fromName].clearLayers()
    }
    this.overlayLayers[geoJSON.set.swac_fromName].addLayer(lines)
    return lines
  }
  /**
     * Removes given marker from the map.
     * @param {Object} marker The marker that will be removed
     */
    removeMarker(marker) {
        this.overlayLayers[marker.feature.set.swac_fromName].removeLayer(marker);
        delete this.markers[marker.feature.set.swac_fromName][marker.feature.set.id];
    }
  /**
   * Removes given markers and Area from the map.
   * @param {Object} marker The markers that will be removed
   * @param {Object} area The Area that will be removed
   */
  removeArea(markers,area) {
    for (let marker of markers) {
      this.overlayLayers[marker.feature.set.swac_fromName].removeLayer(marker)
      delete this.markers[marker.feature.set.swac_fromName][marker.feature.set.id]
    }
    this.overlayLayers[area.feature.set.swac_fromName].removeLayer(area)
  }

    /**
     * Load the data from the datasources option.
     * 
     * @param {float} southWest_lon longitude of the southwest corner
     * @param {float} southWest_lat latitude of the southwest corner
     * @param {float} northEast_lon longitude of the northeast corner
     * @param {float} nothEast_lat latitude of the northeast corner
     * @returns {undefined}
     */
    loadModelFiles(southWest_lon, southWest_lat, northEast_lon, northEast_lat) {
        Msg.flow('Worldmap2d', 'loadModelFiles()', this.requestor);
        for (let curModel of this.options.modelFiles) {
            this.loadModelFile(curModel, southWest_lon, southWest_lat, northEast_lon, northEast_lat);
        }
    }

    // public function
    loadModelFile(modelFile, southWest_lon, southWest_lat, northEast_lon, northEast_lat) {
        Msg.flow('Worldmap2d', 'loadModelFile()', this.requestor);
        let thisRef = this;

        let uModelFile = modelFile;
        // If modelfile is viewport based
        if (modelFile.url.includes('{lon-left}') || modelFile.url.includes('{lon-right}')) {
            // Remove old model file
            this.removeModelFile(modelFile.name);
            // Clone model for request
            uModelFile = structuredClone(modelFile);
            let bounds = this.viewer.getBounds();
            // Build apiurl
            uModelFile.url = uModelFile.url
                    .replace('{lon-left}', (southWest_lon) ? southWest_lon : bounds._southWest.lng)
                    .replace('{lat-bottom}', (southWest_lat) ? southWest_lat : bounds._southWest.lat)
                    .replace('{lon-right}', (northEast_lon) ? northEast_lon : bounds._northEast.lng)
                    .replace('{lat-top}', (southWest_lat) ? southWest_lat : bounds._northEast.lat)
                    .replace('{zoom}', this.viewer.getZoom());
        } else if (uModelFile.loaded) {
            // No need to reload
            return;
        }

        // Load model
        ModelFactory.loadModel(uModelFile.url, this.requestor, uModelFile).then(
                function (model) {
                    thisRef.models.push(model);
                    // Note state
                    modelFile.loaded = true;
                    modelFile.type = uModelFile.type;
                    // Draw model
                    model.draw(thisRef.viewer).then(function (entityref) {
                        // Zoom done in Model because it depends on type
                    }).catch(function (error) {
                        Msg.error('Worldmap2d', 'Error drawing model >'
                                + modelFile.url + '<: ' + error);
                    });
                }
        ).catch(function (error) {
            Msg.error('Worldmap2d', 'Error loading model >'
                    + modelFile.url + '<: ' + error);
        });
    }

    // public function
    removeModelFile(modelName) {
        Msg.flow('Worldmap2d', 'removeModelFile(' + modelName + ')', this.requestor);
        for (let i in this.models) {
            let curModel = this.models[i];
            if (curModel) {
                if (curModel && curModel.name === modelName) {
                    curModel.erase(this.viewer);
                    delete this.models[i];
                    break;
                }
            }
        }
    }

    onAddModel(evt) {
        evt.preventDefault();
        let inputElem = this.requestor.querySelector('.swac_worldmap2d_addmodel input');
        // Get model URL
        let url = inputElem.value;
        let modelFile = {
            url: url,
            name: url
        };
        this.options.modelFiles.push(modelFile);
        this.loadModelFile(modelFile);
        inputElem.value = '';
    }

    /**
     * Loads a modelfile from a url parameter
     */
    loadModelFileFromParameter() {
        let urlpos = window.location.href.indexOf('modelurl=');
        if (urlpos < 0)
            return;
        let url = window.location.href.substr(urlpos + 9);
        let type = SWAC.getParameterFromURL('type');
        let name = SWAC.getParameterFromURL('name');
        if (!name)
            name = url;
        if (url) {
            url = decodeURIComponent(url);
            let modelFile = {
                url: url,
                name: name,
                type: type
            };
            this.options.modelFiles.push(modelFile);
            this.loadModelFile(modelFile);
        }
    }

    /**
     * Load the data from datasources option.
     * 
     * @returns {undefined}
     */
    async loadDatasourcesFromOptions() {
        for (let [key, value] of this.options.datasources) {
            await window.swac.Model.load(value.datacapsule, this)
        }
    }

    /**
     * Executed when the user moves the map
     * 
     * @param {LeafletEvent} evt fired by leaflet
     */
    onViewportChange(evt) {
        Msg.flow('Worldmap2d', 'onViewportChange()', this.requestor);
        // Actual viewport is used within loadModelFile()
        this.loadModelFiles();
    }

    /**
     * Load icons from options.
     * 
     * @returns {undefined}
     */
    prepareIcons() {
        // Custom icon logic

        if (this.options.customMarkerOptions && this.options.customIconOptions) {
            if (this.options.customIconOptions.iconUrl) {
                this.options.customMarkerOptions.icon = L.icon(this.options.customIconOptions);
            } else if (this.options.customIconVisited && this.options.customIconUnvisited) {
                let LeafIcon = L.Icon.extend({
                    options: this.options.customIconOptions
                });
                this.visitedIcon = new LeafIcon({iconUrl: this.options.customIconVisited.iconUrl})
                this.unvisitedIcon = new LeafIcon({iconUrl: this.options.customIconUnvisited.iconUrl})
            }
        }
        if (this.options.userIcon) {
            if (this.options.customIconOptions) {
                let LeafIcon = L.Icon.extend({
                    options: this.options.customIconOptions
                });
                this.userIcon = new LeafIcon(this.options.userIcon)
            } else {
                this.userIcon = L.icon(this.options.userIcon);
            }
        }
    }

    /**
     * Filters the markers with the given typeID. 
     * @param {int} typeID The ID of teh observedObjectType that the marker will be filtered with.
     * @returns {undefined} 
     */
    filterMarker(typeId) {
        Object.keys(this.overlayLayers).forEach(key => this.overlayLayers[key].clearLayers());
        if (typeId == null) {
            Object.keys(this.markers).forEach(key =>
                this.markers[key].forEach(marker => this.overlayLayers[marker.feature.set.swac_fromName].addLayer(marker))
            )
            return;
        }
        const filteredMarkers = [];
        // TODO add worldmap option for type_id attribute so can use different attributes to filter
        Object.keys(this.markers).forEach(key =>
            this.markers[key].forEach(marker => marker.feature.set.type_id == typeId && filteredMarkers.push(marker))
        )
        filteredMarkers.forEach(fm => this.overlayLayers[fm.feature.set.swac_fromName].addLayer(fm))
    }

    /**
     * SECTION for map interactions
     */

    /**
     * Creates and registeres custom this.map_click_evts. 
     */
    initEventListeners() {
        // Build custom events
        this.map_click_evts = {
            // extend the event with this https://leafletjs.com/reference.html#map-event
            // interaction events
            'click': (e) => {
                let evtname = 'swac_' + this.requestor.id + '_map_click';
                document.dispatchEvent(new CustomEvent(evtname, {detail: e}));
                Msg.flow('Worldmap2d', 'Event >' + evtname + '<', this.requestor);
            },
            'markerclick': (e) => {
                let evtname = 'swac_' + this.requestor.id + '_marker_click';
                document.dispatchEvent(new CustomEvent(evtname, {detail: e}));
                Msg.flow('Worldmap2d', 'Event >' + evtname + '<', this.requestor);
            },
        };

        // leaflet events
        this.viewer.on(this.map_click_evts);
    }

    /**
     * Toggles whether a click into the map is registered. Controls evaluation of custom this.map_click_evts.
     */
    toggleMapClickInteraction() {
        this.state.mapClickInteraction ? this.disableMapClickInteraction() : this.enableMapClickInteraction();
    }

    /**
     * Disables the registration of clicks into the map.
     */
    disableMapClickInteraction() {
        this.viewer.off('click');
        this.state.mapClickInteraction = false;
        document.dispatchEvent(new CustomEvent('mapClickInteractionDisabled'))
    }

    /**
     * Enables the registration of clicks into the map.
     */
    enableMapClickInteraction() {
        this.viewer.on('click', this.map_click_evts.click);
        this.state.mapClickInteraction = true;
        document.dispatchEvent(new CustomEvent('mapClickInteractionEnabled'))
    }

    /**
     * Disables all map interactions (dragging, zooming, etc.).
     */
    disableMapInteractions() {
        this.disableMapClickInteraction();
        this.viewer.dragging.disable();
        this.viewer.touchZoom.disable();
        this.viewer.doubleClickZoom.disable();
        this.viewer.scrollWheelZoom.disable();
        this.viewer.boxZoom.disable();
        this.viewer.keyboard.disable();
        if (this.viewer.tap) {
            this.viewer.tap.disable();
        }
        this.state.mapInteractions = false;
        document.dispatchEvent(new CustomEvent('mapInteractionDisabled'))
        document.getElementById(this.requestor.id).style.cursor = 'default';
    }

    /**
     * Enables all map interactions (dragging, zooming, etc.)
     */
    enableMapInteractions() {
        this.enableMapClickInteraction();
        this.viewer.dragging.enable();
        this.viewer.touchZoom.enable();
        this.viewer.doubleClickZoom.enable();
        this.viewer.scrollWheelZoom.enable();
        this.viewer.boxZoom.enable();
        this.viewer.keyboard.enable();
        if (this.viewer.tap) {
            this.viewer.tap.enable();
        }
        this.state.mapInteractions = true;
        document.dispatchEvent(new CustomEvent('mapInteractionEnabled'))
        document.getElementById(this.requestor.id).style.cursor = 'grab';
    }

    /**
     * Zooms the map to the given set
     * 
     * @param {WatchableSet} set Set to show in the center of the map 
     */
    zoomToSet(set) {
        this.viewer.panTo({lat: set[this.options.latAttr], lng: set[this.options.lonAttr]});
    }

    /**
     * SECTION for geolocation functions
     */

    /*
     * Registeres the Plugin that will be used for receiving the users location.
     * @param {Object} plugin The plugin that is about to be registered.
     */
    setPreciseLocationPlugin(plugin) {
        this.preciseLocationPlugin = plugin;
    }

    /*
     * Removes the Plugin that is currently used for receiving the users location.
     * @param {Object} plugin The plugin that is about to be unregistered. Functions as a key to avoid the accidental removal by another unregistered plugin.
     */
    removePreciseLocationPlugin(plugin) {
        if (this.preciseLocationPlugin === plugin) {
            this.preciseLocationPlugin = null;
        }
    }

    /*
     * Used by the navigators geolocation. 
     * Functions as a check if a more precise plugin for geolocation is activated so that the navigator does not override the more precise data.
     * @param {Object} position The Position of the user
     */
    onUserLocation(position) {
        if (!this.preciseLocationPlugin) {
            this.saveUserLocation(position);
        }
    }

    /**
     * Saves the users location in the worldmap2d and places a marker at their position. 
     * If the option latchOnLocaton is turned on, the viewer pans to the users location on a location update.
     * @param {Object} position Contains the coordinates and the timestamp
     */
    saveUserLocation(position) {
        this.lastReceivedPosition = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            timestamp: position.timestamp
        };
        if (this.options.latchOnLocation) {
            this.viewer.panTo({lat: position.coords.latitude, lng: position.coords.longitude});
        }


        if (!this.options.userIcon) {
            const degree = position.coords.heading ? position.coords.heading : 0;
            this.userIcon = L.divIcon({
                html: `
                ${position.coords.heading ?
                        `
                    <div class="user-location-outer-circle">
                        <div class="user-location-inner-circle"></div>
                        <div class="user-location-direction" style="transform: rotate(${degree}deg);"></div>
                    </div>
                    `
                        :
                        `
                    <div class="user-location-outer-circle">
                        <div class="user-location-inner-circle"></div>
                    </div>

                    `}
                `,
                className: '',
                iconSize: [22, 22],
                iconAnchor: [25, 25]
            });

        }
        if (this.userLocationMarker) {
            this.userLocationMarker.remove();
        }
        let feature = {
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [this.lastReceivedPosition.longitude, this.lastReceivedPosition.latitude],
            },
        }
        const latlng = L.latLng(this.lastReceivedPosition.latitude, this.lastReceivedPosition.longitude)
        this.userLocationMarker = L.marker(latlng, {icon: this.userIcon, zIndexOffset: 1000}).addTo(this.viewer)
        this.userLocationMarker.feature = feature;

    }

    /*
     * Detects other components of the requestor parent
     * - geolocation component
     * - datadescription component
     */
    detectComponents() {
        // Get geolocation component
        const geoLocationComp = document.querySelector('[swa^="Geolocation"]')?.swac_comp;
        if (geoLocationComp) {
            //link the onLocateFunction with the onUserLocation
            geoLocationComp.options.onLocateFunctions.push(this.onUserLocation.bind(this))
        }

        // Get datadescription component
        if (this.options.datadescription) {
            let dd = document.querySelector(this.options.datadescription);
            if (dd)
                this.datadescription = dd.swac_comp;
            else
                Msg.error('Worldmap2d', 'Datadescription component >' + this.options.datadescription + '< not found.', this.requestor);

            // register event listener for datadescription
            document.addEventListener('swac_Datadescription_' + this.datadescription.requestor.id + '_changed', () => {
                this.rerenderIcons();
            });
        }
    }

    /**
     * Rerenders Icon on the map based on the datadescription.
     */
    rerenderIcons() {
        for (let key in this.markers) {
            for (let marker of this.markers[key]) {
                if (typeof marker !== 'undefined') {
                    // Get color
                    let col = this.datadescription.getValueColor(marker.feature.set);
                    if (col === '#808080') {
                        col = '#7B7B7B';
                    }
                    // If color is hex value remove sharp because its not allowed in file URL
                    col = col.replace('#', '');
                    col = col.replace('GREY', '7B7B7B')
                    col = col.toUpperCase();
                    if (marker.options.icon.options.color === col) {
                        // do not rerender if color is the same
                        continue;
                    }
                    const icon = new L.Icon({
                        iconUrl: '/SWAC/swac/components/Icon/imgs/map/marker-icon-' + col + '.png',
                        shadowUrl: '/SWAC/swac/components/Icon/imgs/map/marker-shadow.png',
                        iconSize: [25, 41],
                        iconAnchor: [12, 41],
                        popupAnchor: [1, -34],
                        shadowSize: [41, 41],
                        color: col
                    });
                    marker.setIcon(icon);
                }
            }
        }
    }
}
