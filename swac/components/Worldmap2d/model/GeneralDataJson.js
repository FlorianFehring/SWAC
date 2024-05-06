import Msg from '../../../Msg.js';
import MapModel from './MapModel.js';
/* 
 * Class for representing general data recived in json format
 */
export default class GeneralDataJson extends MapModel {
    /**
     * Creates a new ground model
     * 
     * @param {HTMLElement} requestor Presentation requestion element
     * @param {Object} options Options
     * @returns {Model}
     */
    constructor(requestor, options = {}) {
        super(requestor, options);
        // Name of the attribut that should be interpreted as latitude
        if (!options.latattr)
            this.options.latattr = null;
        // Name of the attribut that should be interpreted as longitude
        if (!options.lonattr)
            this.options.lonattr = null;
        // Name of the attribut that should be interpreted as height
        if (!options.lonattr)
            this.options.heightattr = null;
        // Name of the attribute that should be interpreted as timestamp
        if (!options.tsattr)
            this.options.tsattr = 'ts';
        // Basic offset of data display above ground in meter
        if (!options.baseOffset)
            this.options.baseOffset = 1.0;
        // Value in degrees that should a new dataset, that will be drawn on a allready be drawn position moved
        if (!options.datasetOffsetLat)
            this.options.datasetOffsetLat = 0;
        if (!options.datasetOffsetLon)
            this.options.datasetOffsetLon = 0;
        if (!options.datasetOffsetHeight)
            this.options.datasetOffsetHeight = 110;
        // List of attribute names that should not be visualised
        if (!options.excludeAttrs)
            this.options.excludeAttrs = ['id'];
        // Kind of visualisation (supported: cylinder and rect)
        if (!options.displayKind)
            this.options.displayKind = 'rect';
        // Radius of the visualisation on the ground
        if (!options.displayRadius)
            this.options.displayRadius = 5.0;
        if (!options.datacaptionProperty)
            this.options.datacaptionProperty = null;
        if (typeof options.showTimedDataAtOnce === 'undefined')
            this.options.showTimedDataAtOnce = true;
        if (typeof options.excludeNullSets === 'undefined')
            this.options.excludeNullSets = true;

        // Internal attributes
        this._attributeColors = new Map(); // Stores the once calculated colors of attributs
        this._valueColors = new Map(); // Stores the once calculated colors for values
        this._excludedAttrs = new Map(); // List of realy from draw excluded attrs
        this._timeddata = new Map(); // Map of data with timepoint as key

        this._timedintervals = null; // Intervals in wich data is available
        this._timeddrawn = null; // Timestamp of the drawn data
        this._drawnref = {
            subs: []  // List of entities drawn by the last called draw()
        };
        // Map of location to that was drawn and the number of draws
        this._drawnlocs = new Map();
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

    get locations() {
        // Return the locations if there are calculated previously
        if (this._locationCalculated) {
            return this._locations;
        }
        // Get mode of location calculation
        if (this.options.latattr && this.options.lonattr) {
            this.calculateLocationsFromAttributes();
            // Exclude coordinate values from draw
            this.options.excludeAttrs.push(this.options.latattr);
            this.options.excludeAttrs.push(this.options.lonattr);
            if (this.options.heightattr)
                this.options.excludeAttrs.push(this.options.heightattr);
        } else {
            let errmsg = 'Do not know which attributes contain the latitude and longitude information.';
            Msg.error('GeneralDataJson', errmsg, this._requestor);
            throw(errmsg);
        }

        return this._locations;
    }

    /**
     * Calculates the locations from two columns of the dataset
     * 
     * @returns {undefined}
     */
    calculateLocationsFromAttributes() {
        // Get attributes that should be used for locations
        let latAttr = this.options.latattr;
        let lonAttr = this.options.lonattr;
        let heightAttr = this.options.heightattr;

        let missingLatLonSets = [];
        for (let i in this.file.data.list) {
            let curSet = this.file.data.list[i];
            // Check if attributes there
            if (!curSet[latAttr] || !curSet[lonAttr]) {
                missingLatLonSets.push(i);
                continue;
            }
            // Create location
            let location = {};
            location.centre = {};
            location.centre.lat = curSet[latAttr];
            location.centre.lon = curSet[lonAttr];
            if (heightAttr)
                location.centre.height = curSet[heightAttr];
            this._locations.push(location);
        }

        if (missingLatLonSets.length > 0) {
            let setNoStr = '';
            for (let curId of missingLatLonSets) {
                setNoStr += curId + ',';
            }
            Msg.error('GeneralDataJson', 'Datasets ' + setNoStr
                    + ' does not contain the latitude and / or longitude '
                    + 'information. Can not display dataset.',
                    this._requestor);
        }
        this._locationCalculated = true;
    }

    /**
     * Extended json loading for datalist and dataset oriented json data.
     * 
     * @param {String} filepath Path to the file to load
     * @returns {Promise} Resolves when the model is loaded
     */
    load(filepath) {
        let thisRef = this;
        return new Promise((resolve, reject) => {
            super.loadJson(filepath).then(function () {
                // Handle data in list form
                if (thisRef.file.data.list) {
                    Msg.warn('GeneralJsonData', 'Detected list form data.', thisRef._requestor);
                    if (thisRef.options.showTimedDataAtOnce === false) {
                        // Store all datasets in timeddata map
                        for (let curDataset of thisRef.file.data.list) {
                            if (curDataset[thisRef.options.tsattr]) {
                                // Get timestamp
                                let setTs = curDataset[thisRef.options.tsattr];
                                // Check if there does not exists timed data
                                if (!thisRef._timeddata.has(setTs)) {
                                    // Create list entry
                                    thisRef._timeddata.set(setTs, []);
                                }
                                let tsSets = thisRef._timeddata.get(setTs);
                                tsSets.push(curDataset);
                            }
                        }
                        // Create array of dates
                        let dates = [];
                        for (let curDate of thisRef._timeddata.keys()) {
                            dates.push(curDate + 'Z');
                        }
                        // Note avaibility of data at timeinterval
                        thisRef._timedintervals = Cesium.TimeIntervalCollection.fromIso8601DateArray({
                            iso8601Dates: dates
                        });
                        // Inform worldmap component of data available in interval
                        var start = Cesium.JulianDate.fromIso8601(dates[0]);
                        var stop = Cesium.JulianDate.fromIso8601(dates[dates.length - 1]);
                        thisRef._requestor.swac_comp.setTimeddataFirstTime(start);
                        thisRef._requestor.swac_comp.setTimeddataLastTime(stop);

                        resolve();
                    } else {
                        resolve();
                    }
                } else {
                    throw 'Single datasets are not supported yet.';
                    reject();
                }
            }).catch(function (error) {
                Msg.error('GeneralDataJson', 'Error occured while loading >'
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
            if (thisRef._drawnref.subs.lenght > 0) {
                Msg.warn('GeneralDataJson', 'The model >' + thisRef + '< is allready drawn.');
                resolve(thisRef._drawnref);
                return;
            }

            // Check if datadescription is configured
            if (!thisRef.options.datadescription) {
                Msg.warn('GeneralDataJson', 'There is no datadescription bound to this data. Please take into account, that you can only bound the datadescription to the datasource, after dom was loaded completely.');
            }

            if (thisRef._timeddata.size === 0 &&
                    thisRef.options.showTimedDataAtOnce === false) {
                // Remove previous drawn data
                thisRef.erase(viewer);
                Msg.warn('GeneralDataJson', 'Earasing previous drawn data.');
            }

            // Handle data in list form
            if (typeof thisRef.file.data.list !== 'undefined') {
                if (thisRef._timeddata.size > 0
                        && thisRef.options.showTimedDataAtOnce === false) {
                    thisRef.drawDatalistTimed(viewer);
                    resolve();
                } else {
                    thisRef.drawDatalistComplete(viewer);
                    resolve();
                }
            } else {
                thisRef.drawDataset(viewer, thisRef.file.data);
                reject();
            }

            // Register function for showing tooltip
            viewer.screenSpaceEventHandler.setInputAction(thisRef.drawTooltip.bind(thisRef), Cesium.ScreenSpaceEventType.MOUSE_MOVE);

            if (this._excludedAttrs.keys().length > 0) {
                // Log information about ignored attributes
                let keynames = '';
                for (let curIgAttr of this._excludedAttrs.keys()) {
                    keynames += curIgAttr + ',';
                }
                Msg.warn('GeneralDataJson', 'The attributes >'
                        + keynames + '< were excluded from visualisation, '
                        + 'because its not numeric or contained on the exclude list.', this._requestor);
            }
        });
    }

    /**
     * Removes an ground object from the map
     *
     * @param {CesiumViewer} viewer Viewer from which to remove
     * @returns {undefined}
     */
    erase(viewer) {
        for (let curEntityref of this._drawnref.subs) {
            viewer.entities.remove(curEntityref);
        }
        this._drawnref.subs = [];
    }

    /**
     * Draws the values from a dataset to the globe
     * 
     * @param {Ceisum.Viewer} viewer Viewer on wich the data should be drawn
     * @param {Object} dataset to draw to the globe
     * @param {Integer} setno No of the dataset
     * @returns {undefined}
     */
    drawDataset(viewer, dataset, setno = 0) {
        Msg.warn('GeneralDataJson', 'Drawing dataset no >'
                + setno + '< with id >' + dataset.id + '<');

        // Calculate current lat and lon
        // Get coordinates for this dataset
        let curLat = this.locations[setno].centre.lat; //+ (j * datasetOffset);
        let curLon = this.locations[setno].centre.lon; //+ (setno * valueOffset);
        let curHeight;
        if (this.locations[setno].centre.height) {
            curHeight = this.locations[setno].centre.height;
        } else {
            curHeight = 0;
        }
        // Add base offset
        curHeight += this.options.baseOffset;

        let latlonid = curLat + '_' + curLon;
        //Check if a dataset was drawn to this location before
        let latlonDrawCount = this._drawnlocs.get(latlonid);
        if (latlonDrawCount) {
            // Add dataset offset to the coordinates
            curLat = curLat + (latlonDrawCount * this.options.datasetOffsetLat);
            curLon = curLon + (latlonDrawCount * this.options.datasetOffsetLon);
            curHeight = curHeight + (latlonDrawCount * this.options.datasetOffsetHeight);
            latlonDrawCount++;
            this._drawnlocs.set(latlonid, latlonDrawCount);
        } else {
            this._drawnlocs.set(latlonid, 1);
        }

        // Display every value
        let j = 0;
        for (let curAttr in dataset) {
            j++;
            // Get current value
            let curValue = dataset[curAttr];
            // Exclude not displayable values
            if (!isNaN(curValue) 
                    && !this.options.excludeAttrs.includes(curAttr)
                    && !(curValue === 0 && this.options.excludeNullSets)) {
                this.drawAttribute(viewer, curAttr, dataset, curLat, curLon, curHeight);
            } else {
                this._excludedAttrs.set(curAttr, 1);
                j--;
            }
        }

        // Draw datasetlabel
        if (this.options.datacaptionProperty) {
            let labelref = viewer.entities.add({
                position: Cesium.Cartesian3.fromDegrees(curLon, curLat, curHeight),
                label: {
                    text: dataset[this.options.datacaptionProperty] + ''
                }
            });
            this._drawnref.subs.push(labelref);
    }
    }

    drawAttribute(viewer, attr, dataset, lat, lon, height) {
        let value = dataset[attr];

        // Get color for attribute
        let curAttrColor = this._attributeColors.get(attr);
        if (typeof curAttrColor === 'undefined') {
            // Get color from datadescription if available
            if (this.options.datadescription) {
                let col = this.options.datadescription.swac_comp.getAttributeColor(attr);
                if (col.startsWith('0x')) {
                    curAttrColor = Cesium.Color.fromRgba(col);
                } else {
                    curAttrColor = Cesium.Color.fromCssColorString(col);
                }
            } else {
                curAttrColor = Cesium.Color.fromRandom({alpha: 1.0});
            }
            this._attributeColors.set(attr, curAttrColor);
        }

        // Get color for value
        let curValueColor = this._valueColors.get(value);
        if (typeof curValueColor === 'undefined') {
            // Get color from datadescription if available
            if (this.options.datadescription) {
                let col = this.options.datadescription.swac_comp.getValueColor(value);
                if (col.startsWith('0x')) {
                    curValueColor = Cesium.Color.fromRgba(col);
                } else {
                    curValueColor = Cesium.Color.fromCssColorString(col);
                }
            } else {
                curValueColor = Cesium.Color.fromRandom({alpha: 1.0});
            }
            this._valueColors.set(value, curValueColor);
        }

        // Norm current value if there is a normation
        if (this.options.datadescription) {
            let normval = this.options.datadescription.swac_comp.getNormedValue(value, null, attr);
            if (normval !== null) {
                value = normval;
            }
        }

        let drawid = 'data_' + dataset.id + '_' + attr;
        // Select draw mode
        if (this.options.displayKind === 'cylinder') {
            this.drawAsCylinder(viewer, drawid, value, lat, lon, height, curValueColor, curAttrColor);
        } else if (this.options.displayKind === 'rect') {
            this.drawAsRect(viewer, drawid, value, lat, lon, height, curValueColor, curAttrColor);
        } else {
            Msg.error('GeneralDataJson',
                    'The visualisation kind >'
                    + this.options.displayKind
                    + '< is not supported.', this._requestor);
        }
    }

    /**
     * Draws a value as cylinder.
     * 
     * @param {type} viewer
     * @param {type} drawid
     * @param {type} value
     * @param {type} lat
     * @param {type} lon
     * @param {type} height
     * @param {type} valueColor
     * @param {type} attrColor
     * @returns {undefined}
     */
    drawAsCylinder(viewer, drawid, value, lat, lon, height, valueColor, attrColor) {
        let entityref = viewer.entities.add({
            id: drawid,
            position: Cesium.Cartesian3.fromDegrees(lon, lat, height),
            cylinder: {
                length: value,
                topRadius: this.options.displayRadius,
                bottomRadius: this.options.displayRadius,
                outline: false,
                outlineColor: attrColor,
                outlineWidth: 4,
                material: valueColor,
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
            }
        });
        this._drawnref.subs.push(entityref);
    }

    /**
     * Draws a value as rect
     * 
     * @param {type} viewer
     * @param {type} drawid
     * @param {type} value
     * @param {type} lat
     * @param {type} lon
     * @param {type} height
     * @param {type} valueColor
     * @param {type} attrColor
     * @returns {undefined}
     */
    drawAsRect(viewer, drawid, value, lat, lon, height, valueColor, attrColor) {
        // Calculate degres from meters
        // This calculation is not correct and only views correct at latitude 52.x
        let deg = Cesium.Math.toRadians(this.options.displayRadius / 1000);
//        console.log('long deg: ' + deg);
        let halfdeg = deg / 2;
//        console.log('half deg: ' + halfdeg);

        let west = (lon - deg);
        let south = (lat - deg);
        let east = (lon + deg);
        let north = (lat + deg);
//        console.log('west: ' + west);
//        console.log('south: ' + south);
//        console.log('east: ' + east);
//        console.log('north: ' + north);
//        console.log('value: ' + value);
//        console.log('height: ' + height);

        let entityref = viewer.entities.add({
            id: drawid,
            name: 'example rect',
            position: Cesium.Cartesian3.fromDegrees(lon, lat, height),
            rectangle: {
                coordinates: Cesium.Rectangle.fromDegrees(west, south, east, north),
                material: valueColor,
                extrudedHeight: height + value,
                height: height, // height above ground
                outline: true, // height must be set for outline to display
                outlineColor: attrColor
            }
        });
        this._drawnref.subs.push(entityref);
    }

    /**
     * Completely displays all datasets at once. 
     * Displays the datasets with offset for every set in longitude and offset
     * for every value in latitude.
     * 
     * @param {Cesium.Viewer} viewer Viewer on wich the data should be drawn
     */
    drawDatalistComplete(viewer) {
        if (this._drawnref.subs.length === 0) {
            // Remove previous drawn data
            this.erase(viewer);
            // Display every dataset
            let i = 0;
            for (let curDataset of this.file.data.list) {
                this.drawDataset(viewer, curDataset, i);
                i++;
            }
        }
    }

    /**
     * Draws the data timed to the globe.
     * 
     * @param {Cesium.Viewer} viewer Viewer where to show the data
     * @returns {undefined}
     */
    drawDatalistTimed(viewer) {
        // Get current time
        let curTime = viewer.clock.currentTime;
        let dataInterval = this._timedintervals.findIntervalContainingDate(curTime);
        if (dataInterval) {
            let dataIsoTime = Cesium.JulianDate.toIso8601(dataInterval.start, 0);
            let dataTime = dataIsoTime.replace('Z', '');
            // Get matching dataset
            let datasets = this._timeddata.get(dataTime);
            if (this._timeddrawn !== dataTime) {
                // Remove previous drawn data
                this.erase(viewer);
                // Draw datasets
                for (let i in datasets) {
                    let curSet = datasets[i];
                    this.drawDataset(viewer, curSet, i);
                }
                this._timeddrawn = dataTime;
            } else {
                Msg.warn('GeneralDataJson', 'Dataset for >' + dataIsoTime + '< is allready drawn. Skipping draw.');
            }
        } else {
            Msg.warn('GeneralDataJson', 'Did not found data for >' + curTime + '<', this._requestor);
        }
    }

    /**
     * Draws a tooltip with the data contained in the dataset that is responsable
     * for the visualisation where is mouse moves over.
     * 
     * @param {Cesium.Movement} movement Movement information from cesium
     * @returns {undefined}
     */
    drawTooltip(movement) {
        let viewer = this._requestor.swac_comp.viewer;
        // Information about the currently highlighted feature
        var highlighted = {
            feature: undefined,
            originalColor: new Cesium.Color()
        };

        let datalist = this.file.data.list;
        // Get the tooltip box
        let tooltipbox = document.querySelector('.swac_worldmap_tooltip');

        // If a feature was previously highlighted, undo the highlight
        if (Cesium.defined(highlighted.feature)) {
            highlighted.feature.color = highlighted.originalColor;
            highlighted.feature = undefined;
        }
        // Pick a new feature
        let pickedFeature = viewer.scene.pick(movement.endPosition);
        // Return if there is no feature
        if (!Cesium.defined(pickedFeature)) {
            let tooltipValElem = tooltipbox.querySelector('.swac_worldmap_tooltip_value');
            tooltipValElem.classList.add('swac_dontdisplay');
            return;
        }

        // Get parts of value identifier
        let valueIdentifier = pickedFeature.id._id.split('_', 3);
        // Get name of the value
        let valueDatasetId = parseInt(valueIdentifier[1]);
        let dataset;
        // Search dataset
        for (let curDataset of datalist) {
            if (curDataset.id === valueDatasetId) {
                dataset = curDataset;
                break;
            }
        }
        // Do not display when there is no generaldatajson descriptor
        if (typeof valueIdentifier[2] !== 'undefined') {
            let valueName = valueIdentifier[2];
            let value = dataset[valueName];
            // A feature was picked, so show it's overlay content
            tooltipbox.classList.remove('swac_dontdisplay');
            tooltipbox.style.bottom = viewer.canvas.clientHeight - (movement.endPosition.y + 5) + 'px';
            tooltipbox.style.left = (movement.endPosition.x + 5) + 'px';

            // Show position area
            let valElem = tooltipbox.querySelector('.swac_worldmap_tooltip_value');
            valElem.classList.remove('swac_dontdisplay');

            let valueNameElem = tooltipbox.querySelector('.swac_worldmap_valuename');
            valueNameElem.innerHTML = valueName;
            let valueElem = tooltipbox.querySelector('.swac_worldmap_value');
            valueElem.innerHTML = value;
            // Add time information if available
            if (this.options.tsattr && dataset[this.options.tsattr]) {
                let tsElem = tooltipbox.querySelector('.swac_worldmap_ts');
                tsElem.innerHTML = SWAC.lang.dict.Worldmap.datafrom + ' '
                        + dataset[this.options.tsattr];
            }
            let setidElem = tooltipbox.querySelector('.swac_worldmap_setid');
            setidElem.innerHTML = dataset['id'];
            // Highlight the feature
            highlighted.feature = pickedFeature;
            Cesium.Color.clone(pickedFeature.color, highlighted.originalColor);
            pickedFeature.color = Cesium.Color.YELLOW;
        }
    }
}

