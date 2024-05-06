import Msg from '../../../Msg.js';
import MapModel from './MapModel.js';
import OpenWeatherMapTransformer from '../transformer/OpenWeatherMapTransformer.js';
/*
 * Class for representing geo json
 */
export default class GeoJson extends MapModel {
    /**
     * Creates a new geojson model
     *
     * @param {HTMLElement} requestor Presentation requestion element
     * @param {Object} options Visualisation options. Supported options are:
     * - extrudeHeightProperty Name of the value in the geojson object, that should be
     * used to calculate the extrusion height.
     * - fillColor Default color (css string or rgba hex code) of models (white if no setting is given)
     * - outlineColor Default color of models border (black if no setting is given)
     * - outlineWidth Width of the outline (1 if no setting is given)
     * - fillColorProperty Property from data that should be used as color for the model
     * - outlineColorProperty Property from data that should be used as color for the models outline
     * - iconPropety Property from data that contains a token used in the icon url
     * - iconBasePath Base path for icons
     * - datacaptionProperty Name of the property that's value should be used for the caption
     * - datadescription SWAC_datadescription component with descdata describing the data
     * - zoomTo If set to true zooms the map onto the added geojson object
     * If the datadescription is set all property names are evaluated against the
     * datadescription data, if this failes the fallback is to use the data from the model.
     *
     * @returns {Model}
     */
    constructor(requestor, options) {
        super(requestor, options);

        if (!this.options.datacaptionProperty)
            this.options.datacaptionProperty = 'name';

        // Internal attributes
        this._drawnref = {
            subs: []  // List of entities drawn by the last called draw()
        };
        this.featuregroup;
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
        let thisRef = this;
        return new Promise((resolve, reject) => {
            super.loadJson(filepath).then(function () {
                let lastSlashPos = filepath.lastIndexOf("/");
                let startGeoPos = filepath.indexOf('.geojson');
                let fileName = filepath.substring(lastSlashPos + 1, startGeoPos);
                thisRef._locations = [];

                // use transformation if configured
                if (filepath.startsWith('https://api.openweathermap.org/data/2.5/')) {
                    let tf = new OpenWeatherMapTransformer();
                    thisRef.file.data = tf.toGeoJSON(thisRef.file.data);
                }

                if (!thisRef.file.data.features) {
                    let msg = window.swac.lang.dict.Worldmap2d.geojson_featuresmissing;
                    UIkit.modal.alert(msg);
                    reject();
                    return;
                }

                for (let featureNo in thisRef.file.data.features) {
                    let feature = thisRef.file.data.features[featureNo];
                    // Check if the feature have locations
                    if (feature.properties && feature.properties.locations) {
                        for (let locationId in feature.properties.locations) {
                            let location = feature.properties.locations[locationId];
                            // Check if feature has a title
                            if (!location.title && feature.properties && feature.properties.title) {
                                location.title = feature.properties.title;
                            } else if (!location.title) {
                                location.title = fileName + '[' + featureNo + ']';
                            }

                            // Check if feature has a description
                            if (!location.description && feature.properties && feature.properties.description) {
                                location.description = feature.properties.description;
                            }
                            thisRef._locations.push(location);
                        }
                    }
                }

                resolve();
            }).catch(function (error) {
                Msg.error('GeoJson', 'Error occured while loading >'
                        + filepath + '< ' + error);
                reject();
            });
        });
    }

    /**
     * Draws the model to the cesium globe
     *
     * @param {CesiumViewer} viewer Viewer instance of cesium
     * @returns {Promise} Resolves with the cesium model reference when the model is drawn
     */
    draw(viewer) {
        let thisRef = this;
        return new Promise((resolve, reject) => {
            // Check if model was drawn before
            if (thisRef._drawnref.subs.length > 0) {
                resolve(thisRef._drawnref);
                return;
            }
            let layerParts = [];
            // Get datadescription component
            let datadescComp = null;
            if (thisRef.options.datadescription) {
                datadescComp = document.querySelector(thisRef.options.datadescription).swac_comp;
            } else {
                Msg.warn('GeoJson', 'There is no description component bound and no visoptions set. Model will be colored with default values.');
            }

            for (let curFeature of thisRef.file.data.features) {
                // Apply global styles
                let style = {
                    color: thisRef.options.outlineColor,
                    weight: thisRef.options.outlineWidth,
                    fillColor: thisRef.options.fillColor
                };
                // Set name of the model
                let modelName = null;
                if (thisRef.options.datacaptionProperty) {
                    let namePropParts = thisRef.options.datacaptionProperty.split('.');
                    let nameProp = curFeature.properties;
                    if (nameProp) {
                        for (let curPropPart of namePropParts) {
                            nameProp = nameProp[curPropPart];
                            if (!nameProp) {
                                break;
                            }
                        }
                    }
                    if (!nameProp && this.options.name) {
                        nameProp = this.options.name;
                    }
                    if (!nameProp) {
                        Msg.error('GeoJson', 'Property >' + thisRef.options.datacaptionProperty + '< for name of area was not found.', this._requestor);
                    } else {
                        modelName = nameProp + '';
                        if (datadescComp) {
                            let modelNamedd = datadescComp.getValueVisData(curFeature.properties, 'desc', null, nameProp + '');
                            if (modelNamedd) {
                                modelName = modelNamedd;
                            }
                        }
                    }
                }

                // Create popup
                let onEachFeature = function () {};
                if (modelName) {
                    onEachFeature = function (feature, layer) {
                        // Build popup HTML
                        let html = '<b>' + modelName + '</b>';
                        // Add values to display
                        for (let curProp in feature.properties) {
                            if (!thisRef.options.datapopupProperties || thisRef.options.datapopupProperties.includes(curProp)) {
                                if (feature.properties[curProp])
                                    html += '<br>' + curProp + ': ' + feature.properties[curProp];
                            }
                        }
                        layer.bindPopup(html);

                        // Add event listener
                        layer.on('click', function (e) {
                            let evtname = 'swac_' + thisRef._requestor.id + '_geom_click';
                            document.dispatchEvent(new CustomEvent(evtname, {detail: e}));
                            Msg.flow('Worldmap2d', 'Event >' + evtname + '<', thisRef._requestor);
                        });
                    };
                }

                // Check if property for color is defined and existing
                if (thisRef.options.fillColorProperty) {
                    let fillPropParts = thisRef.options.fillColorProperty.split('.');
                    let fillProp = curFeature.properties;
                    for (let curPropPart of fillPropParts) {
                        fillProp = fillProp[curPropPart];
                        if (!fillProp) {
                            break;
                        }
                    }
                    if (!fillProp) {
                        Msg.error('GeoJson', 'Property >' + thisRef.options.datacaptionProperty + '< for fill color of >' + modelName + '< was not found.', this._requestor);
                    } else {
                        // Use value as coloring value
                        style.fillColor = fillProp;
                        if (datadescComp) {
                            let filldd = datadescComp.getValueColor(curFeature.properties, null, thisRef.options.fillColorProperty);
                            if (filldd)
                                style.fillColor = filldd;
                        }
                    }
                }
                if (!style.fillColor && datadescComp) {
                    style.fillColor = datadescComp.getValueColor(curFeature.properties, null, null);
                }

                // Check if property for color is defined and existing
                if (thisRef.options.outlineColorProperty) {
                    let outlPropParts = thisRef.options.outlineColorProperty.split('.');
                    let outlProp = curFeature.properties;
                    for (let curPropPart of outlPropParts) {
                        outlProp = outlProp[curPropPart];
                        if (!outlProp) {
                            break;
                        }
                    }
                    if (!outlProp) {
                        Msg.error('GeoJson', 'Property >' + thisRef.options.datacaptionProperty + '< for outline color of >' + modelName + '< was not found.', this._requestor);
                    } else {
                        style.color = outlProp;
                        if (datadescComp) {
                            let outlinedd = datadescComp.getValueColor(curFeature.properties, null, thisRef.options.outlineColorProperty);
                            if (outlinedd)
                                style.color = outlinedd;
                        }
                    }
                }
                if (!style.color && datadescComp) {
                    style.color = datadescComp.getValueColor(curFeature.properties, null, null);
                }

                // Check if property for icon is defined and existing
                let icon;
                if (!modelName)
                    modelName = '';
                let iconClassName = 'marker_' + modelName.replaceAll(' ', '');
                if (thisRef.options.iconProperty) {
                    let iconPropParts = thisRef.options.iconProperty.split('.');
                    let iconProp = curFeature.properties;
                    for (let curPropPart of iconPropParts) {
                        iconProp = iconProp[curPropPart];
                        if (!iconProp) {
                            break;
                        }
                    }
                    if (!iconProp) {
                        Msg.error('GeoJson', 'Property >' + thisRef.options.iconProperty + '< for icon of >' + modelName + '< was not found.', this._requestor);
                    }

                    icon = L.divIcon({
                        html: '<img class="icon" src="' + thisRef.options.iconBasePath.replace('{iconProp}', iconProp) + '">',
                        className: "",
                        iconSize: [80, 80],
                        iconAnchor: [12, 40],
                        className: iconClassName
                    });

                } else {
                    // Default icon
                    icon = L.divIcon({
                        html: `
<svg class="icon"
  width="24"
  height="40"
  viewBox="0 0 100 100"
  version="1.1"
  preserveAspectRatio="none"
  xmlns="http://www.w3.org/2000/svg"
>
  <path d="M0 0 L50 100 L100 0 Z" fill="#7A8BE7"></path>
</svg>`,
                        className: "",
                        iconSize: [80, 80],
                        iconAnchor: [12, 40],
                        className: iconClassName
                    });
                }

                // Check if property for icon rotation exists
                let iconRotate = 0;
                if (thisRef.options.iconRotateProperty) {
                    let iconPropParts = thisRef.options.iconRotateProperty.split('.');
                    let iconProp = curFeature.properties;
                    for (let curPropPart of iconPropParts) {
                        iconProp = iconProp[curPropPart];
                        if (!iconProp) {
                            break;
                        }
                    }
                    if (!iconProp) {
                        Msg.error('GeoJson', 'Property >' + thisRef.options.iconRotateProperty + '< for icon of >' + modelName + '< was not found.', this._requestor);
                    }

                    iconRotate = iconProp;
                }

                // Check if animation speed property exists
                if (thisRef.options.iconAnimationSpeed) {
                    const matches = thisRef.options.iconAnimationSpeed.match(/\{(.*?)\}/);
                    let varname = matches[0].replace('{', '').replace('}', '');

                    let iconAnimParts = varname.split('.');
                    let animProp = curFeature.properties;
                    for (let curPropPart of iconAnimParts) {
                        animProp = animProp[curPropPart];
                        if (!animProp) {
                            break;
                        }
                    }
                    if (!animProp) {
                        Msg.error('GeoJson', 'Property >' + varname + '< for icon of >' + modelName + '< was not found.', this._requestor);
                    }

                    let animDur = eval(thisRef.options.iconAnimationSpeed.replace(matches[0], animProp));
                    let styleElem = document.createElement('style');
                    styleElem.type = 'text/css';
                    var keyFrames = '\
.marker_class .icon{\
  animation-name: animation_name;\
  animation-duration: animation_duration;\
  animation-iteration-count: infinite;\
}';
                    styleElem.innerHTML = keyFrames.replace('marker_class', iconClassName).replace('animation_name', this.options.iconAnimationName).replace('animation_duration', animDur + 's');
                    document.getElementsByTagName('head')[0].appendChild(styleElem);
                }

                // Add to map
                layerParts.push(L.geoJSON(curFeature, {
                    style: style,
                    onEachFeature: onEachFeature,
                    pointToLayer: function (feature, latlng) {
                        return L.marker(latlng, {icon: icon, rotationAngle: iconRotate});
                    }
                }));
            }
            thisRef.featuregroup = L.featureGroup(layerParts);
            this._requestor.swac_comp.layerControl.addOverlay(thisRef.featuregroup, this.options.name ? this.options.name : this.options.url);
            thisRef.featuregroup.addTo(viewer);

            // Zoom into view
            if (thisRef.options.zoomTo) {
                viewer.fitBounds(featuregroup.getBounds());
            }
        });
    }

    /**
     * Removes an ground object from the map
     *
     * @param {LeafletViewer} viewer Viewer from which to remove
     * @returns {undefined}
     */
    erase(viewer) {
        this._requestor.swac_comp.layerControl.removeLayer(this.featuregroup);
        this.featuregroup.remove();
    }
}

