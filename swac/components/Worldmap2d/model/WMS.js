import Msg from '../../../Msg.js';
import MapModel from './MapModel.js';
/*
 * Class for representing WMS
 */
export default class WMS extends MapModel {
    /**
     * Creates a new WMS model
     *
     * @param {HTMLElement} requestor Presentation requestion element
     * @param {Object} options Visualisation options. Supported options are:
     * - layers         Comma separated list of layer names to show
     * - format         Format of the data to show (default: image/png)
     * - transparent    Bollean value if images should be transparent (default: true)
     * - name           Name of the layer on the map (default: name(s) of the selected WMS Layers)
     * - wmsparameters  Object with parameters that should be send to the WMS API
     *
     * @returns {Model}
     */
    constructor(requestor, options) {
        super(requestor, options);
        this._drawnref = {
            subs: []  // List of entities drawn by the last called draw()
        };

        // Set default values for options
        if (!options.format)
            this.options.format = 'image/png';
        if (!options.transparent)
            this.options.transparent = true;
        if (!options.wmsparameter)
            this.options.wmsparameters = {};
        this.tileErrReported = false;
    }

    /**
     * Gets the name of the model as it is defined inside the model data
     * Calculates the name out of the location data given.
     *
     * @return {String} Name of the model, or null if the data does not contains one
     */
    get modelname() {
        return null;
    }

    /**
     * Extended json loading for datalist and dataset oriented json data.
     *
     * @param {String} filepath Path to the file to load
     * @returns {Promise} Resolves when the model is loaded
     */
    load(filepath) {
        this._filepath = filepath;
        this.tileErrReported = false;
        return new Promise((resolve, reject) => {
            // Nothing todo here
            resolve();
        });
    }

    /**
     * Draws the model to the cesium globe
     *
     * @param {CesiumViewer} viewer Viewer instance of cesium
     * @returns {Promise} Resolves when the model is drawn
     */
    draw(viewer) {
        this.viewer = viewer;
        let thisRef = this;
        return new Promise((resolve, reject) => {
            // Check if filepath must be changed leaflet accepts format: http://ows.mundialis.de/services/service?
            this.apipath = thisRef._filepath;
            let askPos = this.apipath.indexOf('?');
            if (askPos > 0)
                this.apipath = this.apipath.substring(0, askPos);

            // If filepath is concrete sample url
            if (thisRef._filepath.toLowerCase().includes('&layers')) {
                let url = new URL(thisRef._filepath);
                // Build WMS base url
                this.apipath = url.protocol + '//' + url.hostname + url.pathname;
                // Walk trough parameters
                let layers = '';
                url.searchParams.forEach((value, key) => {
                    if (key === 'layers' || key === 'LAYERS') {
                        layers = value;
                    }
                    if (key === 'bbox' || key === 'imageSR' || key === 'bboxSR' || key === 'size') {
                        // Ignore entry
                        // Note: imageSR is no default paramete for WMS. Should be parameter srs
                    } else {
                        thisRef.options.wmsparameters[key] = value;
                    }
                });

                thisRef.putOnMap(layers, layers);
            } else
            // If filepath is identical it's allready the root path for map
            if (this.apipath === thisRef._filepath) {
                let msg = window.swac.lang.dict.Worldmap2d.wms_baseurlentered;
                UIkit.modal.prompt(msg, 'Layer').then(function (input) {
                    if (!input) {
                        reject();
                        return;
                    }
                    thisRef.putOnMap(input, input);
                });
                resolve();
            } else
            // If no layers is specified, get Capabilities
            if (!thisRef.options.layers) {
                fetch(thisRef._filepath).then(function (res) {
                    let contentType = res.headers.get("content-type");
                    if (contentType.includes('json')) {
                        res.json().then(json => thisRef.parseJSONdef(json));
                    } else if(contentType.includes('text/plain')) {
                        res.json().then(json => thisRef.parseJSONdef(json));
                    } else if (contentType.includes('xml')) {
                        res.text().then(xml => thisRef.parseXMLdef(xml));
                    } else {
                        Msg.error('WMS', 'Content-type >' + contentType + '< is not supported for be interpreted as WMS definition.', thisRef.requestor);
                    }
                }).catch(function (e) {
                    console.error('Error fetching WMS file: ' + e);
                    reject(e);
                });
            } else {
                // If layers are predifined do not ask user
                thisRef.putOnMap(thisRef.options.layers, this.options.name);
                resolve();
            }
        });
    }

    parseJSONdef(json) {
        // Redefine layers for selection
        let sellayers = [];
        for (let curLayer of json.layers) {
            sellayers.push({
                name: 'show:' + curLayer.id,
                title: curLayer.name
            });
        }
        this.showSubtypeSelection(sellayers);
    }

    parseXMLdef(xml) {
        let data = new window.DOMParser().parseFromString(xml, "text/xml");
        // Redefine layers for selection
        let layersroot = data.querySelector('Layer');
        if (!layersroot) {
            Msg.error('WMS', 'Did not find Layers Element. Is recived file a valid WMS description file?', this._requestor);
            return;
        }
        let sellayers = [];
        let layers = layersroot.querySelectorAll('Layer');
        for (let curLayer of layers) {
            let title = curLayer.querySelector('Title').textContent;
            if (curLayer.getAttribute('queryable') && curLayer.getAttribute('queryable') === "1") {
                sellayers.push({
                    name: curLayer.querySelector('Name').textContent,
                    title: title
                });
            } else {
                Msg.warn('WMS', 'Layer >' + title + '< is not queryable', this._requestor);
            }
        }
        this.showSubtypeSelection(sellayers);
    }

    showSubtypeSelection(layers) {
        // Remove old generated checkboxes
        let boxes = this._requestor.querySelectorAll('.swac_worldmap2d_repeatedForSubSelect');
        for (let curBox of boxes) {
            curBox.remove();
        }
        // Get template for checkboxes element
        let checkboxtpl = this._requestor.querySelector('.swac_worldmap2d_repeatableForSubSelect');

        // Build select entry for each layer
        for (let curLayer of layers) {
            let checkbox = checkboxtpl.cloneNode(true);
            checkbox.classList.remove('swac_worldmap2d_repeatableForSubSelect');
            checkbox.classList.add('swac_worldmap2d_repeatedForSubSelect');
            checkbox.querySelector('input').setAttribute('value', curLayer.name);
            checkbox.querySelector('.swac_worldmap2d_subselect_displayname').innerHTML = curLayer.title;
            checkboxtpl.parentElement.appendChild(checkbox);
        }

        // Open modal for selection
        let modalElem = this._requestor.querySelector('.swac_worldmap2d_selectSubModel');
        UIkit.modal(modalElem).show();

        // Register event handler for after choosing
        let btn = modalElem.querySelector('.swac_worldmap2d_subselectbtn');
        let thisRef = this;
        btn.addEventListener('click', function (evt) {
            evt.preventDefault();
            UIkit.modal(modalElem).hide();
            // Create layers text
            let layernames = '';
            let leyerscount = 0;
            // Get seperate option
            let sep = false;
            let sepElem = modalElem.querySelector('.swac_worldmap2d_subSelectSeparate');

            if (sepElem.checked)
                sep = true;

            // Get all checkboxes
            let form = modalElem.querySelector('.swac_worldmap2d_subselect');
            let boxes = form.querySelectorAll('input:checked');
            for (let curBox of boxes) {
                if (leyerscount > 0)
                    layernames += ',';
                layernames += curBox.getAttribute('value');
                let displayname = curBox.parentElement.querySelector('.swac_worldmap2d_subselect_displayname').innerHTML;
                leyerscount++;
                if (sep)
                    thisRef.putOnMap(curBox.getAttribute('value'), displayname);
            }
            if (!sep)
                thisRef.putOnMap(layernames, layernames);
        });
    }

    /**
     * Puts a WMS layer onto the map
     * 
     * @param {String} layers List of comma separated Names of tiles to fetch combined by server
     * @param {String} displayname Name of the leaflet layer
     */
    putOnMap(layers, displayname) {
        // Get configured parameters
        let params = this.options.wmsparameters;
        params.layers = layers;
        params.format = this.options.format;
        params.transparent = this.options.transparent;

        // Modification for specific APIs
        if (this.apipath.includes('https://www.gis.nrw.de')) {
            // Note: bboxSR is no default parameter for WMS. This seems optionaly to some WMS implementations.
            params.bboxSR = 3857;
            // Note: size is no default parameter for WMS. Should be parameters height and widht
            params.size = '256,256';
            // Note: f is not default parameter for WMS. Should be format
            params.f = 'image';
            params.format = 'png';
            params.dpi = 96;
            params.LANGUAGE = 'ger';
            params.imageSR = 3857;
            this.apipath = this.apipath + '/export';
        }

        this.apipath = this.apipath + '?';

        let wmsLayer = L.tileLayer.wms(this.apipath, params);

        this._requestor.swac_comp.layerControl.addOverlay(wmsLayer, displayname);
        wmsLayer.addTo(this.viewer);

        wmsLayer.addEventListener('tileerror', function (e) {
            if (!this.tileErrReported) {
                // Get the tile url
                let tileurl = e.tile.getAttribute('src');
                // Create message
                let msg = window.swac.lang.dict.Worldmap2d.wms_tileerror;
                msg = window.swac.lang.replacePlaceholders(msg, 'url', tileurl);
                UIkit.modal.alert(msg);
                this.tileErrReported = true;
            }
        });

        // Auto correctior for specific services (I don't like to implement this. Maybe there is a more general solution?)
        let llayers;
        if (this.apipath.includes('maps.dwd.de')) {
            let layerparts = layers.split(',');
            // Use only last part
            llayers = layerparts[layerparts.length - 1];
        } else {
            llayers = layers;
        }

        // Build legend path
        let lpath = this.apipath + 'service=WMS&request=GetLegendGraphic&format=image%2Fpng&width=20&height=20&layer=' + llayers;

        let thisRef = this;
        let legend = L.control({position: 'bottomright'});
        let lid = 'legend_' + layers.replaceAll(':', '').replaceAll(',', '');
        legend.onAdd = function (map) {
            // Create legend element
            let div = L.DomUtil.create('div', lid);
            let imgElem = document.createElement('img');
            imgElem.src = lpath;
            // Remove legend element if legend graphich could not be loaded
            imgElem.addEventListener('error', function (e) {
                Msg.error('WMS', 'Could not load legend grafic >' + lpath + '<', thisRef._requestor);
                div.remove();
            });
            // When image loaded add image to map and register event handler so it blends out when layer gets hidden
            imgElem.addEventListener('load', function () {
                div.appendChild(imgElem);

                thisRef.viewer.on({
                    overlayadd: function (e) {
                        let lElem = thisRef._requestor.querySelector('.' + lid);
                        lElem.classList.remove('swac_dontdisplay');
                    },
                    overlayremove: function (e) {
                        let lElem = thisRef._requestor.querySelector('.' + lid);
                        lElem.classList.add('swac_dontdisplay');
                    }
                });
            });

            return div;
        };
        legend.addTo(this.viewer);
    }

    /**
     * Removes an ground object from the map
     *
     * @param {LeafletViewer} viewer Viewer from which to remove
     * @returns {undefined}
     */
    erase(viewer) {
        for (let curEntityref of this._drawnref.subs) {
            viewer.removeLayer(curEntityref);
        }
        this._drawnref.subs = [];
    }
}

