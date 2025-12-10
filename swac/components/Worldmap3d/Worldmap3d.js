import SWAC from '../../swac.js';
import View from '../../View.js';
import Msg from '../../Msg.js';
import Worldmap3dViewport from './Worldmap3dViewport.js';
import Worldmap3dNavigation from './Worldmap3dNavigation.js';
import ModelFactory from './model/ModelFactory.js';

export default class Worldmap extends View {

    constructor(options = {}) {
        super(options);
        this.name = 'Worldmap3d';
        this.desc.text = '3D Worldmap component for displaying data on a globe. Useable for geojson data, gltf 3D models and plain datasets as well.';
        this.desc.developers = 'Florian Fehring (HSBI)';
        this.desc.license = 'GNU Lesser General Public License';

        this.desc.depends[0] = {
            name: 'Cesium.js',
            path: '/Cesium/Cesium.js',
            desc: 'Cesium framework main js file.'
        };
        this.desc.depends[1] = {
            name: 'Cesium Widget CSS',
            path: '/Cesium/Widgets/widgets.css',
            desc: 'Style file for the cesium widget'
        };
        this.desc.depends[2] = {
            debugonly: true,
            name: 'Worldmap3dDebug Class',
            path: SWAC.config.swac_root + 'components/Worldmap3d/Worldmap3dDebug.js',
            desc: 'Class containing methods for debugging'
        };
        this.desc.depends[10] = {
            name: 'SearchEntryMaker Class',
            path: SWAC.config.swac_root + 'components/Search/SearchEntryMaker.js',
            desc: 'Class for creating own SearchEntryMakers'
        };
        this.desc.depends[11] = {
            name: 'SearchEntryMakerGeoJson Class',
            path: SWAC.config.swac_root + 'components/Worldmap3d/search/SearchEntryMakerGeoJson.js',
            desc: 'Class for creating SearchResultEntries from a geojson model'
        };
        this.desc.depends[12] = {
            name: 'SearchEntryMakerGLTF Class',
            path: SWAC.config.swac_root + 'components/Worldmap3d/search/SearchEntryMakerGLTF.js',
            desc: 'Class for creating SearchResultEntries from GLTF models.'
        };
        this.desc.depends[13] = {
            name: 'SearchEntryMakerHid Class',
            path: SWAC.config.swac_root + 'components/Worldmap3d/search/SearchEntryMakerHid.js',
            desc: 'Class for creating SearchResultEntries from hid of buildings.'
        };

        this.desc.templates[0] = {
            name: 'Worldmap3d',
            style: 'Worldmap3d',
            desc: 'Template with area for plugins'
        };

        this.desc.reqPerTpl[0] = {
            selc: '.swac_worldmap3d_tooltip',
            desc: 'Area that contains the tooltip informations.'
        };
        this.desc.reqPerTpl[1] = {
            selc: '.swac_worldmap3d_tooltip_value',
            desc: 'Element where to show the value for the position the tooltip belongs to.'
        };
        this.desc.reqPerTpl[2] = {
            selc: '.swac_worldmap3d_valuename',
            desc: 'Element where to show values name for the position the tooltip belongs to.'
        };
        this.desc.reqPerTpl[3] = {
            selc: '.swac_worldmap3d_valuename',
            desc: 'Element where to show values name for the position the tooltip belongs to.'
        };
        this.desc.reqPerTpl[4] = {
            selc: '.swac_worldmap3d_value',
            desc: 'Element where to show attributes value.'
        };
        this.desc.reqPerTpl[5] = {
            selc: '.swac_worldmap3d_ts',
            desc: 'Element where to show datasets timestamp.'
        };
        this.desc.reqPerTpl[6] = {
            selc: '.swac_worldmap3d_setid',
            desc: 'Element where to show datasets id.'
        };
        this.desc.reqPerTpl[7] = {
            selc: '.swac_worldmap3d_tooltip_position',
            desc: 'Element that contains the position of the dataset.'
        };
        this.desc.reqPerTpl[8] = {
            selc: '.swac_worldmap3d_latout',
            desc: 'Element where to show the latitude.'
        };
        this.desc.reqPerTpl[9] = {
            selc: '.swac_worldmap3d_lonout',
            desc: 'Element where to show the longitude.'
        };
        this.desc.reqPerTpl[10] = {
            selc: '.swac_worldmap3d_heightout',
            desc: 'Element where to show the height.'
        };


        this.options.showWhenNoData = true;
        //*************
        // Data sources
        //*************
        this.desc.opts[0] = {
            name: "ionAccessToken",
            desc: "Access token to cesium ION tile service"
        };
        if (!options.ionAccessToken)
            this.options.ionAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJhMzJiZjEzOS05ZWI0LTRhMzEtOGQyZC05ZGQzYzIwY2EzMDIiLCJpZCI6MTUxNSwiaWF0IjoxNTI4ODA0Mzg1fQ.xHuoWaJsRIuvXJ7_-bxVoGVxDgilCddv0jz8ajltRNI';

        // IDs for assets stroed at cesium ion
        this.desc.opts[1] = {
            name: "ionassets",
            desc: "Array of ion asset ids that should be displayed.",
            example: [10000]
        };
        if (!options.ionassets)
            this.options.ionassets = [];

        this.desc.opts[2] = {
            name: "datasources",
            desc: "Links to datasources that should be available from start. Here only\n\
directly useable datasources should be given, no search interfaces.\n\
Each datasource is an object with at least the 'url' attribute.\n\
There are some optional attributes:\n\
- zoomTo: If it is true the map will be zoomed to that data.\n\
- datadescription: Reference to a datadescription component. Colors model parts depending on the data\n\
- stroke: Color of the stroke around the model (will be overwritten when datadescription is used)\n\
- strokeWidth: Width of the stroke (will be overwritten when datadescription is used)\n\
- fill: Color of the area (css string or rgba hex code) (will be overwritten when datadescription is used)\n\
- extrudeHeight: let you set a height of flat ground data. (will be overwritten when datadescription is used)",
            example: [{url: 'mymodeldata.json'}]};
        if (!options.datasources)
            this.options.datasources = [];

// General look and feel options
        this.desc.opts[3] = {
            name: "mapProviderURL",
            desc: "URL to map provider (currently only openstreetmap suported)"
        };
        if (!options.mapProviderURL)
              this.options.mapProviderURL = 'https://tile.openstreetmap.org/';

        this.desc.opts[4] = {
            name: "enableTerrain",
            desc: "Set true to enable terain display"
        };
        if (!options.enableTerrain)
            this.options.enableTerrain = false;
        this.desc.opts[5] = {
            name: "terrainURL",
            desc: "URL to the terrain provider. At the given url there must be a layer.json file. If not given the default terrain provider from cesium ion will be used.",
            example: 'https://my.tarrain'
        };
        if (!options.terrainURL)
            this.options.terrainURL = null;

//*********************
// Start view options
//*********************
        this.desc.opts[6] = {
            name: "startPointLon",
            desc: "Positions longitude of the point to look at when page loads"
        };
        if (!options.startPointLon)
            this.options.startPointLon = 10.416667;
        this.desc.opts[7] = {
            name: "startPointLat",
            desc: "Positions latitude of the point to look at when page loads"
        };
        if (!options.startPointLat)
            this.options.startPointLat = 51.133333;
        this.desc.opts[8] = {
            name: "startHeading",
            desc: "Heading of the look direction when page loads. 0.0 is north."
        };
        if (!options.startHeading)
            this.options.startHeading = 0.0;
        this.desc.opts[9] = {
            name: "startPitch",
            desc: "Pitch of the look when page loads"
        };
        if (!options.startPitch)
            this.options.startPitch = -60.0;
        this.desc.opts[10] = {
            name: "startheight",
            desc: "Height in meter to look from when page loads"
        };
        if (!options.startheight)
            this.options.startheight = 1900000.0;
        this.desc.opts[11] = {
            name: "startAnimation",
            desc: "Set true to activate a start animation that flys to the above specified start point"
        };
        if (!options.startAnimation)
            this.options.startAnimation = false;

// Navigation options
        this.desc.opts[12] = {
            name: "flyToModelAnimations",
            desc: "If activated every action that goes to a model will be animated"
        };
        if (!options.flyToModelAnimations)
            this.options.flyToModelAnimations = false;

// Appeareance
        this.desc.opts[13] = {
            name: "modelheading",
            desc: "Heading to wich the look on a model goes. 0.0 is look to north"
        };
        if (!options.modelheading)
            this.options.modelheading = 0.0;
        this.desc.opts[14] = {
            name: "modelpitch",
            desc: "Pitch to show from upside to building (with negative values)"
        };
        if (!options.modelpitch)
            this.options.modelpitch = -40.0;
        this.desc.opts[15] = {
            name: "lod2FromSourceface",
            desc: "When enabled ground models that has an height are transformed to lod2 models"
        };
        if (!options.lod2FromSourceface)
            this.options.lod2FromSourceface = true;
// DEVnote: Models that lay complete inside earth are not rendered
        this.desc.opts[16] = {
            name: "enableLookIntoEarth",
            desc: "For debugging purposes. If set to true some parts of the globe are not \n\
shown and allow a look inside earth"
        };
        if (!options.enableLookIntoEarth)
            this.options.enableLookIntoEarth = false;
        this.desc.opts[17] = {
            name: "enablePhotomap",
            desc: "If true sattelitephotos will be displayed"
        };
        if (!options.enablePhotomap)
            this.options.enablePhotomap = false;
// Enables the atmosphere and stars
        this.desc.opts[18] = {
            name: "enableAtmosphere",
            desc: "True enables rendering of atmosphere"
        };
        if (!options.enableAtmosphere)
            this.options.enableAtmosphere = true;

// Component for performing search
        this.desc.opts[19] = {
            name: "searchComp",
            desc: "Sets the search component. This must be a instantiated SWAC_search component.",
            example: '#mysearch'
        };
        if (!options.searchComp)
            this.options.searchComp = null;
// Priority list for displaying models
        this.desc.opts[20] = {
            name: "model_priorities",
            desc: "Array with file patterns. The heigher the pattern is defined in array, \n\
the heigher is its display priority. Data with heigher priority will be displayed \n\
instead of data with lower priority."
        };
        if (!options.model_priorities) {
            this.options.model_priorities = [];
            this.options.model_priorities[0] = '{filepath}.glb';
            this.options.model_priorities[1] = '{filepath}.json';
        }
// Definition of APIs that are called, when the distance to the ground is below
// the given value "below" in meters
// API urls can contain placeholders {northlat}, {southlat}, {eastlon} and {westlon}
// those are replaced by the actual borders of the viewport
        this.desc.opts[21] = {
            name: "model_zoomlevels",
            desc: "Array of objects with zoom-level definitions. Those have three attibutes \n\
below: Height in meter below wich those models should be loaded.\n\
hidurl: url under wich the hids can be recived. With placeholders {northlat},\n\
{southlat},{eastlon},{westlon}.\n\
modelurl: url where to find the models. With {hid} as placeholder.",
            example: [{below: 100, hidurl: 'myurl', modelurl: 'path/to/modelfile'}]
        };
        if (!options.model_zoomlevels)
            this.options.model_zoomlevels = [];

// Functions that are executed, when the viewer goes to a model
        this.desc.opts[22] = {
            name: "onGoToModelFunctions",
            desc: "Array of custom functions to execute, when the viewer goes to a model.",
            example: [function () {}]
        };
        if (!options.onGoToModelFunctions)
            this.options.onGoToModelFunctions = [];

        this.desc.opts[23] = {
            name: 'showTimedDataAtOnce',
            desc: 'If set to true the datasets (if they have time information) will \n\
displayed on the time. Otherwise all informations will displayed at once.'
        };
        if (!options.showTimedDataAtOnce)
            this.options.showTimedDataAtOnce = false;

        this.desc.opts[24] = {
            name: 'showTimedDataAnimation',
            desc: 'If set to true the datasets will be shown animated.'
        };
        if (!options.showTimedDataAnimation)
            this.options.showTimedDataAnimation = false;
        this.desc.optPerSet[0] = {
            name: 'ts',
            desc: 'Timestamp the dataset belongs to. (Format: 2019-06-27T12:12:02.668)'
        };

        // Plugin for barcharts
        if (!options.plugins) {
            this.options.plugins = new Map();
            this.options.plugins.set('modelmenue', {
                id: 'modelmenue',
                active: false
            });
        }

        // Internal attributes
        this.viewer;
        this.mapProvider;
        this.cesiumviewport = null;
        this.cesiumnavigation = null;
        this.view = {};
        this.view.heading = 0.0;
        this.view.pitch = 0.0;
        this.view.optdistances = {}; // Optimal view distances calculated when jumping to an building

        this.drawn = {};
        this.drawn.grounds = {};
        this.drawn.models = {};
// Array containing all models loaded at least from json (must not visible in sczene)
        this.models = [];
        this.failedmodels = [];

// Timed data
        this.timeddata = {};
        this.timeddata.firstTime = null;
        this.timeddata.lastTime = null;
        this.timeddata.datamap = new Map();
        this.timeddata.lastrendered = null;

    }

    init() {
        return new Promise((resolve, reject) => {
            // Init dependend classes
            this.cesiumviewport = new Worldmap3dViewport(this);
            this.cesiumnavigation = new Worldmap3dNavigation(this);

            // For fitting to the available space height between header and footer
            document.getElementById(this.requestor.id).style.height = '80vh';

            // Set accessToken for ion
            Cesium.Ion.defaultAccessToken = this.options.ionAccessToken;

            // Build viewer configuration WITHOUT Cesium Ion
            let viewerconf = {
                imageryProvider: this.buildImageryProvider(),
                baseLayerPicker: false,
                homeButton: false,
                sceneModePicker: false,
                navigationHelpButton: false,
                animation: this.options.showTimedDataAnimation,
                timeline: true,
                geocoder: false,
                shouldAnimate: this.options.showTimedDataAnimation
            };

            // Enable terrain
            if (this.options.enableTerrain) {
                if (this.options.terrainURL) {
                    viewerconf.terrainProvider = new Cesium.CesiumTerrainProvider({
                        url: this.options.terrainURL
                    });
                } else {
                    //viewerconf.terrainProvider = Cesium.createWorldTerrain();
                    viewerconf.terrainProvider = new Cesium.EllipsoidTerrainProvider();
                }
            }

            // Build up viewer
            this.viewer = new Cesium.Viewer('swac_worldmap3d_map', viewerconf);

            // Include ion assets
            for (let assetid of this.options.ionassets) {
                Msg.warn('Worldmap3d', 'Loading CesiumIon asset >' + assetid + '<', this.requestor);
                this.viewer.scene.primitives.add(
                        new Cesium.Cesium3DTileset({
                            url: Cesium.IonResource.fromAssetId(assetid)
                        })
                        );
            }

            Msg.warn('Worldmap', 'running on Cesium ' + Cesium.VERSION, this.requestor);

            // Adding attribution
            let credit = new Cesium.Credit('OpenStreetMap.org', '', 'http://www.openstreetmap.org');
            this.viewer.creditDisplay.addStaticCredit(credit);

            // Enable lighting
            this.viewer.scene.globe.enableLighting = true;

            // Enable foto map
            if (this.options.enablePhotomap) {
                this.viewer.imageryLayers.addImageryProvider(
                        new Cesium.IonImageryProvider({assetId: 3})
                        );
            }
            console.log("Photomap enabled:", this.options.enablePhotomap);
            console.log("ION Token:", this.options.ionAccessToken);

            if (this.options.enableLookIntoEarth) {
                //  Cut of top and buttom of world sphere, so we can look inside
                var coffeeBeltRectangle = Cesium.Rectangle.fromDegrees(-180.0, -23.43687, 180.0, 23.43687);
                this.viewer.scene.globe.cartographicLimitRectangle = coffeeBeltRectangle;
            }

            if (!this.options.enableAtmosphere) {
                // Deactivate skyBox (do not display stars and space)
                this.viewer.scene.skyBox = null;
                // Set background color to gray
                this.viewer.scene.backgroundColor = Cesium.Color.GRAY;

                // Deactivate atmoshphere glow
                this.viewer.scene.skyAtmosphere.show = false;
            }

            // Enable debug tool
            if (SWAC.config.debugmode) {
                let worldmap3dDebug = new Worldmap3dDebug(this);
                worldmap3dDebug.togglePositionLabel();
            }

            // Startanimation or start view
            // Get hid from url
            let hid = SWAC.getParameterFromURL('hid', window.location);
            let loc = SWAC.getParameterFromURL('loc', window.location);
            if (hid !== null) {
                let thisRef = this;
                // Wait a little bit before search
                setTimeout(function () {
                    // Search model by hid and loc
                    let modelPromise = this.searchModel(hid, loc);
                    modelPromise.then(function (searchresult) {
                        // Create model from result
                        // Get Model
                        ModelFactory.loadModel(searchresult.url).then(function (model) {
                            thisRef.models.push(model);
                            // Draw model
                            model.draw(this.viewer).then(function (entityref) {
                                thisRef.cesiumnavigation.gotoModel(model);
                            });
                        });
                    }).catch(function (error) {
                        Msg.error('cesium', 'Could not load model: ' + error);
                        UIkit.modal.alert(SWAC.lang.dict.cesium.errorloadingmodel);
                    });
                }, 500);

            } else if (typeof this.options.startPointLat !== 'undefined'
                    && typeof this.options.startPointLon !== 'undefined') {

                if (this.options.startAnimation === true) {
                    setTimeout(this.cesiumnavigation.flyToStartView, 1500);
                } else {
                    this.cesiumnavigation.jumpToStartView();
                }
            }

            let handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
            // Register handler for moveing
//            handler.setInputAction(this.onMapMove, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
            // Register handler for zooming
            handler.setInputAction(this.onZoom.bind(this), Cesium.ScreenSpaceEventType.WHEEL);

            // Register camera handler
            var camera = this.viewer.camera;
            camera.moveEnd.addEventListener(this.afterMapMove.bind(this));

            // Register time handling functions
            this.viewer.timeline.addEventListener('settime', this.onTimeChange.bind(this), false);

//            var tickfuncref = this.viewer.clock.onTick.addEventListener(this.onTimeChange.bind(this));
//             DEBUG
//            setTimeout(function () {
//                tickfuncref();
//            }, 9000);

            // Loading data
            this.loadStartData();

            // Inform about finished bind
            resolve();
        });
    }

    /**
     * Builds an map provider
     *
     * @returns {undefined}
     */
    
    buildImageryProvider() {
    let imageryProvider;

    // Standard OpenStreetMap
    const osmUrl = this.options.mapProviderURL || 'https://tile.openstreetmap.org/';

    imageryProvider = new Cesium.OpenStreetMapImageryProvider({
        url: osmUrl,
        credit: new Cesium.Credit("© OpenStreetMap contributors")
    });

    console.log("OpenStreetMap Provider initialized:", imageryProvider);

    return imageryProvider;
}

    
    /*
    buildImageryProvider() {
        var imageryProvider;
        // Automatic create image provider for openstreetmap
        if (this.options.mapProviderURL?.includes('openstreetmap.org')) {
            imageryProvider = new Cesium.OpenStreetMapImageryProvider({
                url: this.options.mapProviderURL
            });
            console.log("provider: ")
            console.log(imageryProvider)
        }
        return imageryProvider;
    }
*/

    /**
     * Load the data from the datasources option.
     * 
     * @returns {undefined}
     */
    loadStartData() {
        for (let i in this.options.datasources) {
            let datasource = this.options.datasources[i];
//console.log("TESTHERE!");
//var entity = this.viewer.entities.add({
//    position : Cesium.Cartesian3.fromDegrees(52.080842, 45.002073),
//    model : {
//        uri : '/SWAC/data/cesium_example6.glb'
//    }
//});
//this.viewer.trackedEntity = entity;


//        var wyoming = this.viewer.entities.add({
//            polygon: {
//                hierarchy: Cesium.Cartesian3.fromDegreesArray([
//                    -109.080842, 45.002073,
//                    -105.91517, 45.002073,
//                    -104.058488, 44.996596,
//                    -104.053011, 43.002989,
//                    -104.053011, 41.003906,
//                    -105.728954, 40.998429,
//                    -107.919731, 41.003906,
//                    -109.04798, 40.998429,
//                    -111.047063, 40.998429,
//                    -111.047063, 42.000709,
//                    -111.047063, 44.476286,
//                    -111.05254, 45.002073]),
//                height: 0,
//                material: Cesium.Color.RED.withAlpha(0.5),
//                outline: true,
//                outlineColor: Cesium.Color.BLACK
//            }
//        });
//
//        this.viewer.zoomTo(entity);
//console.log("TESTTHERE!");

            let thisRef = this;
            // Load model
            ModelFactory.loadModel(datasource.url, this.requestor, datasource).then(
                    function (model) {
                        thisRef.models.push(model);
                        // Draw model
                        model.draw(thisRef.viewer).then(function (entityref) {
                            if (datasource.zoomTo) {
                                let zoomRes = thisRef.viewer.zoomTo(entityref);
                                zoomRes.then(function (res) {
                                    console.log('zoom done');
                                    console.log(res);
                                }).otherwise(function (err) {
                                    console.log('zoom err');
                                    console.log(err);
                                });
                            }
                        }).catch(function (error) {
                            Msg.error('cesium', 'Error drawing model >'
                                    + datasource.url + '<: ' + error);
                        });
                    }
            ).catch(function (error) {
                Msg.error('cesium', 'Error loading model >'
                        + datasource.url + '<: ' + error);
            });
        }
    }

    /**********************
     * Event handlers for zooming
     *********************/

    /**
     * Executed when map is zoomed.
     *
     * @param {type} movement
     * @returns {undefined}
     */
    onZoom(movement) {
        this.findAndDrawModelsInViewport();
    }

    /**********************
     * Event handlers for moveing over map
     **********************/

    /**
     * Executed when the map is moved
     *
     * @param {type} movement
     * @returns {undefined}
     */
    onMapMove(movement) {
        //Nothing todo here
    }

    /**
     * Executed after the map was moved.
     * Checks the viewport for new models to load.
     * 
     * @returns {undefined}
     */
    afterMapMove() {
        this.findAndDrawModelsInViewport();
    }

    /******************************************
     *
     * Event handler for user interactions on bound components
     ******************************************/

    /**
     * Event handler for reacting on clicking a search result.
     * This method should be registered to the setOnClickEventListener of
     * SearchEntryMaker-Objects
     *
     * @param {Event} evt Event fired when calling the handler
     * @returns {undefined}
     */
    onClickSearchResult(evt) {
        // Hide search menue
        SWAC_search.hide();

        // Get lat and lon
        let lat = evt.target.getAttribute('lat');
        let lon = evt.target.getAttribute('lon');
        if (lat && lon) {
            let position = {
                coords: {
                    longitude: lon,
                    latitude: lat
                }
            };

            // Draw marker
            this.viewer.entities.add({
                name: evt.target.innerHTML,
                position: Cesium.Cartesian3.fromDegrees(lon, lat),
                point: {
                    pixelSize: 5,
                    color: Cesium.Color.RED,
                    outlineColor: Cesium.Color.WHITE,
                    outlineWidth: 2
                },
                label: {
                    text: evt.target.innerHTML,
                    font: '14pt monospace',
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    outlineWidth: 2,
                    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                    pixelOffset: new Cesium.Cartesian2(0, -9)
                }
            });

            this.cesiumnavigation.gotoPosition(position);
            return;
        }

        // Get location
        let loc = evt.target.getAttribute('loc');
        // Get MapModel
        ModelFactory.loadHighestLevelModel(evt.target.getAttribute('url'), this.requestor).then(function (model) {
            this.models.push(model);
            // Draw model
            model.draw(this.viewer).then(function (entityref) {
                this.cesiumnavigation.gotoModel(model, loc);
            });
        });
    }

    /**
     * Executed when clicked the visualisation kind title
     * Should redraw ground based on the now open visualisation kind
     *
     * @param {type} evt Event that occured
     * @returns {undefined}
     */
    onVisTitleClick(evt) {
        this.options.visualisedValue = evt.target.getAttribute('vis_kind');
        // Check if accordion area is now open
        if (!evt.target.parentElement.classList.contains('uk-open')) {
            this.redrawGrounds();
        }
    }

    /*************************
     * Model file searching based on viewport
     ************************/

    /**
     * Finds and then draws the models for the actual viewport
     *
     * @returns {undefined}
     */
    findAndDrawModelsInViewport() {
        let thisRef = this;
        this.findModelsInViewport().then(function (models) {
            let distance = thisRef.cesiumviewport.getDistanceToGround();
            //TODO check if this loop is neccessery
            for (let viewportdef of thisRef.options.model_zoomlevels) {
                if (distance <= viewportdef.below) {
                    for (let modelhid of models) {
                        let modelurl = viewportdef.modelurl.replace('{hid}', modelhid);
                        if (!thisRef.failedmodels.includes(modelurl)) {
                            ModelFactory.loadModel(modelurl, thisRef.requestor, viewportdef).then(function (model) {
                                thisRef.models.push(model);
                                model.draw(thisRef.viewer).then(function () {

                                }).catch(function (error) {
                                    Msg.error('cesium', error);
                                });
                            }).catch(function (error) {
                                thisRef.failedmodels.push(modelurl);
                                Msg.error('cesium', error);
                            });
                        }
                    }
                }
            }
        }).catch(function (error) {
            Msg.error('cesium', 'Error while searching models in viewport: ' + error, this.requestor);
        });
    }

    /**
     * Finds models from the defines apis for the actual viewport.
     *
     * @returns {Promise} Promise that resolves to an array of urls to model files.
     */
    findModelsInViewport() {
        return new Promise((resolve, reject) => {
            let distance = this.cesiumviewport.getDistanceToGround();
            let viewport = null;

            let foundModels = [];
            let returnedApis = 0;
            for (let viewportapi of this.options.model_zoomlevels) {
                if (distance <= viewportapi.below && !viewportapi.unreachable) {
                    // Get viewport if not existend
                    if (viewport === null) {
                        viewport = this.cesiumviewport.getViewport();
                    }
                    let apiurl = viewportapi.hidurl;
                    apiurl = apiurl.replace('{northlat}', viewport.north);
                    apiurl = apiurl.replace('{southlat}', viewport.south);
                    apiurl = apiurl.replace('{eastlon}', viewport.east);
                    apiurl = apiurl.replace('{westlon}', viewport.west);
                    // Get model adresses from api
                    fetch(apiurl).then(function (response) {
                        if (response.status === 404) {
                            Msg.error('cesium', 'viewport api >'
                                    + apiurl + '< is not reachable. Access will be disabled for this page load.');
                            viewportapi.unreachable = true;
                        } else {
                            response.json().then(function (data) {
                                returnedApis++;
                                foundModels = foundModels.concat(data.list);

                                if (returnedApis === this.options.model_zoomlevels.length) {
                                    resolve(foundModels);
                                }
                            }).catch(function (error) {
                                returnedApis++;
                                Msg.error('cesium', 'Could not parse data from viewport model request: ' + error);
                                if (returnedApis === this.options.model_zoomlevels.length) {
                                    resolve(foundModels);
                                }
                            });
                        }
                    }).catch(function (error) {
                        returnedApis++;
                        Msg.error('cesium', 'Could not get models for viewport from >' + apiurl + '<: ' + error);
                        if (returnedApis === this.options.model_zoomlevels.length) {
                            resolve(foundModels);
                        }
                    });
                } else {
                    // Count api that is not called
                    returnedApis++;
                }
            }
        });
    }

    /**
     * Function for executing when the users position is recived (by SWAC_geolocation or other mechanism)
     * 
     * @param {HTMLgeolocation} position
     * @returns {undefined}
     */
    onUserLocation(position) {
        this.cesiumnavigation.flyToPosition(position);
    }

    /**
     * Sets or updates the timepoint on which the first data is available
     * 
     * @param {JulianDate} firsttime
     * @returns {undefined}
     */
    setTimeddataFirstTime(firsttime) {
        // set new firsttime
        if (this.timeddata.firstTime === null
                || Cesium.JulianDate.lessThan(firsttime, this.timeddata.firstTime)) {
            this.timeddata.firstTime = firsttime;
            var clock = this.viewer.clock;
            clock.startTime = this.timeddata.firstTime;
            // Set lastTime to current time if it is null
            if (this.timeddata.lastTime === null) {
                this.setTimeddataLastTime(Cesium.JulianDate.fromDate(new Date()));
            }
            this.viewer.timeline.zoomTo(this.timeddata.firstTime, this.timeddata.lastTime);
        }
    }

    /**
     * Sets or updates the timepoint on which the last data is available
     * 
     * @param {JulianDate} lasttime
     * @returns {undefined}
     */
    setTimeddataLastTime(lasttime) {
        if (this.timeddata.lastTime === null
                || Cesium.JulianDate.greaterThan(this.timeddata.lastTime, lasttime)) {
            this.timeddata.lastTime = lasttime;
            var clock = this.viewer.clock;
            clock.stopTime = this.timeddata.lastTime;
            // Set lastTime to current time if it is null
            if (this.timeddata.firstTime === null) {
                this.setTimeddataFirsttTime(Cesium.JulianDate.fromDate(new Date()));
            }
            this.viewer.timeline.zoomTo(this.timeddata.firstTime, this.timeddata.lastTime);
        }
    }

    /**
     * Function executed on a time tick for displaying time dynamic data
     * 
     * @param {Cesium.TimeEvent} evt Cesium time event
     * @returns {undefined}
     */
    onTimeChange(evt) {
        // Get current time
        let currentTime;
        if (typeof evt.clock !== 'undefined') {
            // from timeline click event
            currentTime = evt.clock._currentTime;
        } else {
            // from tick event
            currentTime = evt._currentTime;
        }
//    console.log('timedif:');
//    console.log('last rendered: ' + this.timeddata.lastrendered);
//    console.log(' current: ' + currentTime);
//    console.log(Cesium.JulianDate.equalsEpsilon(this.timeddata.lastrendered, currentTime,1));
        // Check if time has changed
        if (this.timeddata.lastrendered === null
                || !Cesium.JulianDate.equalsEpsilon(this.timeddata.lastrendered, currentTime, 1)) {
            Msg.warn('cesium', 'Time changed to: ' + currentTime);

            for (let curMapModel of this.models) {
                curMapModel.draw(this.viewer);
            }
            this.timeddata.lastrendered = currentTime;
        }
    }
}