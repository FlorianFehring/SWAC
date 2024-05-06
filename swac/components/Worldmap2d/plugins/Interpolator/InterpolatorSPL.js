import SWAC from '../../../../swac.js';
import Msg from '../../../../Msg.js';
import Plugin from '../../../../Plugin.js'

export default class InterpolatorSPL extends Plugin {

    constructor(options = {}) {
        super(options);
        this.name = 'Worldmap2d/plugins/Interpolator';
        this.desc.templates[0] = {
            name: 'datashowmodal',
            style: 'datashowmodal',
            desc: 'Default modal dialog for showing data'
        };

        this.desc.opts[0] = {
            name: "attrsShown",
            desc: "List of attribute names that should be shown. Give the attribute names in the order, they should appear.",
            example: ['attr1', 'attr2']
        };
        if (!options.attrsShown)
            this.options.attrsShown = [];

        this.desc.opts[1] = {
            name: "attrsFormat",
            desc: "Map of swac_lang_format instructions for attribute names. attrsFormat.set('measuredate','datetime')",
        };
        if (!options.attrsFormat)
            this.options.attrsFormat = new Map();

        // Internal attributes
        this.modal = null;
    }

    init() {
        return new Promise((resolve, reject) => {
            // add event listener for mapMarkerClick
            let evtname1 = 'swac_' + this.requestor.parent.id + '_map_click';
            document.addEventListener(evtname1, this.onMapClick.bind(this));
            let evtname2 = 'swac_' + this.requestor.parent.id + '_geom_click';
            document.addEventListener(evtname2, this.onMapClick.bind(this));
            // Get modal template
            this.modal = this.contElements[0].querySelector('.worldmap2d_interpolator_modal');
            resolve();
        });
    }

    onMapClick(evt) {
        Msg.flow('Interpolator', 'onMapClick()', this.requestor.parent);

        // Remove old data
        let olddata = this.modal.querySelectorAll('.worldmap2d_repeatedForValue');
        for (let curData of olddata) {
            curData.remove();
        }
        // Remove old label heading
        let oldLabelHeading = this.modal.querySelector('.labeling-heading')
        if (oldLabelHeading != null)
            oldLabelHeading.remove();

        // Remove old label
        let oldlabel = this.modal.querySelector('.labeling');
        if (oldlabel != null)
            oldlabel.swac_comp.delete();


        let lng = evt.detail.latlng.lng;
        let lat = evt.detail.latlng.lat;
        // Data storage for all models
        let data = {};
        // Create turf point
        const point = turf.point([lng, lat]);
        // Look at each model to find matching polygon
        for (let curModel of this.requestor.parent.swac_comp.models) {
            // If model is geojson
            if (curModel.options.type.toUpperCase() === 'GEOJSON') {
                // Look at each feature
                for (let curFeature of curModel.data.features) {
                    // Check for polygons
                    if (curFeature.geometry.type === 'Polygon') {
                        // Check if event is within polygon
                        if (turf.booleanPointInPolygon(point, curFeature)) {
                            let points = this.polygonFindPoints(curFeature, curModel.data.features);
                            let values = this.idw(lng, lat, points, 2);
                            data = {...data, ...values};
                        }
                    }
                    // Check for points
                    if (curFeature.geometry.type === 'Point') {
                        let curLng = curFeature.geometry.coordinates[0];
                        let curLat = curFeature.geometry.coordinates[1];
                        // Check if event is on point
                        if ((lng + 0.1) <= curLng && (lng - 0.1) >= curLng
                                && (lat + 0.1) <= curLat && (lat - 0.1) >= curLat) {
                            console.log('clicked on point');
                        }
                    }
                }
            }
        }

        if (data) {
            let contElem = this.modal.querySelector('.worldmap2d_repeatForValue');
            for (let curAttr in data) {
                // Exclude swac_ attributes
                if (curAttr.startsWith('swac_'))
                    continue;
                this.modifyModalContent(contElem, curAttr, data[curAttr]);
            }
        }

        // Translate modal
        window.swac.lang.translateAll(this.modal);
        UIkit.modal(this.modal).show();
    }

    /**
     * Finds the points in the given features list, that are matching the points in the given polygon.
     * 
     * @param {Feature} polygon Polygon feature where to fint the matching point for
     * @param {Feature[]} features List of features where to search the points in
     */
    polygonFindPoints(polygon, features) {
        let points = [];
        for (let curCoords of polygon.geometry.coordinates[0]) {
            let searchLng = curCoords[0];
            let searchLat = curCoords[1];
            // Search in points
            let foundPoint;
            for (let curFeature of features) {
                if (curFeature.geometry.type === 'Point') {
                    if (curFeature.geometry.coordinates[0] === searchLng
                            && curFeature.geometry.coordinates[1] === searchLat) {
                        foundPoint = curFeature;
                        points.push(foundPoint);
                    }
                }
            }
            // Give warning if no point found
            if (!foundPoint) {
                Msg.warn('Interpolation', 'No pointdata found for location >' + searchLng + ',' + searchLat + '<.', this.requestor.parent);
            }
        }
        return points;
    }

    /**
     * Inverse distance wightning
     * 
     * @param {float} lng Longitude of point where to interpolate
     * @param {float} lat Latitude of point where to interpolate
     * @param {Feature[]} points geoJSON Points
     * 
     * @returns {Object} Object with interpolated values, each attribute
     */
    idw(lng, lat, points, power) {
        let lngLat = turf.point([lng, lat]);
        // power ist ein Parameter, der die Gewichtung beeinflusst
        let numerators = {};
        let values = {};
        let denominator = 0;
        for (let curPoint of points) {
            let lng = curPoint.geometry.coordinates[0];
            let lat = curPoint.geometry.coordinates[1];
            let curLngLat = turf.point([lng, lat]);
            // Calculate distance
            let d = turf.distance(lngLat, curLngLat);
            // Calculate wight
            let w = 1 / Math.pow(d, power);
            // Get points value
            for (let curProp of this.options.attrsShown) {
                // If no numerator for props exists
                if (!numerators[curProp])
                    numerators[curProp] = 0;
                let propParts = curProp.split('.');
                let outlProp = curPoint.properties;
                for (let curPropPart of propParts) {
                    outlProp = outlProp[curPropPart];
                    if (!outlProp) {
                        break;
                    }
                }
                if (!outlProp) {
                    Msg.error('GeoJson', 'Property >' + curProp + '< for interpolation was not found at point >' + lng + ',' + lat + '<.', this.requestor.parent);
                    continue;
                }
                numerators[curProp] += w * outlProp;
            }
            // Update value
            denominator += w;
        }
        // Calculate interpolated value for each prop
        for (let curProp in numerators) {
            values[curProp] = numerators[curProp] / denominator;
        }
        return values;
    }

    /**
     * Modifies the modals content for each attribute
     *
     * @param {DOMElement} contElem Element where content is placed
     * @param {String} attr Attribute to create entry for
     * @param {String} value Value to create entry for
     */
    modifyModalContent(contElem, attr, value) {
        // Create modal content
        let contCopy = contElem.cloneNode(true);
        let attrElem = contCopy.querySelector('.worldmap2d_attr');
        attrElem.innerHTML = attr;
        attrElem.setAttribute('swac_lang', attr);
        let valElem = contCopy.querySelector('.worldmap2d_val');
        valElem.innerHTML = value;
        if (this.options.attrsFormat.has(attr))
            valElem.setAttribute('swac_lang_format', this.options.attrsFormat.get(attr));
        contCopy.classList.remove('worldmap2d_repeatForValue');
        contCopy.classList.add('worldmap2d_repeatedForValue');
        contElem.parentNode.appendChild(contCopy);

        // Check if Datadescription component is used
        let dd = this.requestor.parent.swac_comp.datadescription;
        if (dd) {
            let col = dd.getValueColor(value, null, attr);
            valElem.setAttribute('style', 'color:' + col);
        }
    }
}