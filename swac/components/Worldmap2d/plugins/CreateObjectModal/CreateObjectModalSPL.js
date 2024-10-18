import SWAC from '../../../../swac.js';
import Msg from '../../../../Msg.js';
import Plugin from '../../../../Plugin.js';
import ViewHandler from '../../../../ViewHandler.js';
import Model from '../../../../Model.js';

export default class CreateObjectModalSPL extends Plugin {
    constructor(options = {}) {
        super(options);
        this.name = 'Worldmap2d/plugins/CreateObjectModal';
        this.desc.text = 'When clicked on the map, this plugin shows the menu to create a new object.';

        this.desc.templates[0] = {
            name: 'default',
            style: 'default',
            desc: 'Default template',
        };

        this.desc.opts[0] = {
            name: 'objectRequestor',
            desc: 'Requestor where objects should be loaded from and added to.',
            example: {
                fromName: 'tbl_observedobject'
            }
        };
        if (!options.objectRequestor)
            this.options.objectRequestor = null;

        this.desc.opts[1] = {
            name: 'locationRequestor',
            desc: 'Requestor that gets the locations. May be omitted if location and object are stored in same table.',
            example: {
                fromName: 'tbl_location'
            }
        };
        if (!options.locationRequestor)
            this.options.locationRequestor = null;

        this.desc.opts[2] = {
            name: 'joinRequestor',
            desc: 'Requestor that gets the joins between locations and objects. May be omitted if location and object are stored in same table.',
            example: {
                fromName: 'tbl_location_join_oo'
            }
        };
        if (!options.joinRequestor)
            this.options.joinRequestor = null;

        this.desc.opts[3] = {
            name: 'typesRequestor',
            desc: 'Requestor that gets the types that should be selectable in type definition. If is null, no selection is available.',
            example: {
                fromName: 'tbl_ootype'
            }
        };
        if (!options.typesRequestor)
            this.options.typesRequestor = null;

        this.desc.opts[4] = {
            name: 'saveMapping',
            desc: 'Specifies the mapping from the input fields to the attributes in datasource'
        };
        if (!options.saveMapping)
            this.options.saveMapping = {
                ooNameAttr: 'name',
                ooDescriptionAttr: 'description',
                ooTypeAttr: 'ootype_id',
                ooParentAttr: 'parent_id',
                ooCompletedAttr: 'complete',
                ooDataCollectionAttr: 'data_collection',
                ooMetaCollectionAttr: 'meta_collection',
                locLatAttr: 'lat',
                locLonAttr: 'lon',
                locLatLonAttr: 'coordinates',
                locNameAttr: 'name',
                locDescriptionAttr: 'description',
                joinOoIdAttr: 'oo_id',
                joinLocIdAttr: 'loc_id'
            };

        this.desc.opts[5] = {
            name: 'requiredAttrs',
            desc: 'Map of attribute names as array entry that are requried by type. Can use map entry >default<.'
        };
        if (!options.requiredAttrs) {
            this.options.requiredAttrs = new Map();
            this.options.requiredAttrs.set('default', ['']);
        }

        this.desc.opts[6] = {
            name: 'parentRequestor',
            desc: 'Requestor for getting possible parents for the new created object. Null value disables the selection of parent object.',
            example: {
                fromName: 'tbl_observedobject'
            }
        };
        if (!options.parentRequestor)
            this.options.parentRequestor = null;

        this.desc.opts[7] = {
            name: 'dataTablesRequestors',
            desc: 'Requestors for getting possible data tables. Requestors are organised in a map, where the type name is the key. Requestors can use placeholder {typeId}'
        };
        if (!options.dataTablesRequestors) {
            this.options.dataTablesRequestors = new Map();
            this.options.dataTablesRequestors.set('default', {
                fromName: 'tbl_datatype',
                fromWheres: {
                    filter: 'ootype_id,eq,{typeId}',
                }
            });
        }

        this.desc.opts[8] = {
            name: 'metaTablesRequestors',
            desc: 'Requestors for getting possible meta tables. Requestors are organised in a map, where the type name is the key. Requestors can use placeholder {typeId}'
        };
        if (!options.metaTablesRequestors) {
            this.options.metaTablesRequestors = new Map();
            this.options.metaTablesRequestors.set('default', {
                fromName: 'tbl_metatype',
                fromWheres: {
                    filter: 'ootype_id,eq,{typeId}',
                }
            });
        }

        // Attributes for internal usage
        this.com = null;
        this.buttonCloseMeasurementmodal = null;
        this.marker = null;
        this.input_lat = null;
        this.input_lng = null;
        this.input_name = null;
        this.input_description = null;
        this.select_status = null;
        this.select_type = null;
        this.select_parent = null;
        this.map = null;
    }

    init() {
        return new Promise((resolve, reject) => {
            this.com = this.requestor.parent.querySelector('.com');
            // hide modal initially
            this.com.style.display = 'none';
            L.DomEvent.on(this.com, 'click', L.DomEvent.stopPropagation);

            // check preconditions
            if (!this.options.saveMapping) {
                Msg.error('CreateObjectModalSPL','Needed option >saveMapping< is not defined, so this component does not know where to save new objects.', this.requestor.parent);
                return;
            }
            if (!this.options.objectRequestor) {
                Msg.error('CreateObjectModalSPL','Needed option >objectRequestor< is not defined, so this component does not know where to save new objects.', this.requestor.parent);
                return;
            }

            this.map = this.requestor.parent.swac_comp;

            L.Control.CreateObjectModal = L.Control.extend({
                onAdd: function (map) {

                    let div = document.createElement('div');
                    div.classList.add('leaflet-bar');
                    div.classList.add('leaflet-control');
                    let a = document.createElement('a');
                    a.classList.add('swac_worldmap2d_com_toolbtn');
                    a.setAttribute('uk-icon', 'plus');
                    a.setAttribute('uk-tooltip', SWAC.lang.dict.Worldmap2d_CreateObjectModal.object_add);
                    a.addEventListener('click', function (evt) {
                        evt.preventDefault();
                        evt.stopPropagation();
                        // Toggle object creation mode
                        if (thisRef.createMode) {
                            thisRef.createMode = false;
                            a.setAttribute('style', 'color: black;');
                        } else {
                            thisRef.createMode = true;
                            a.style.color = 'red';
                        }
                    });
                    div.appendChild(a);
                    return div;
                },

                onRemove: function (map) {
                    // Nothing to do here
                }
            });
            L.control.createobjectmodal = function (opts) {
                return new L.Control.CreateObjectModal(opts);
            }
            L.control.createobjectmodal({position: 'topleft'}).addTo(this.map.viewer);

            document.addEventListener('swac_' + this.requestor.parent.id + '_map_click', (e) => {
                if (thisRef.createMode)
                    this.onMapClick(e);
            })

            this.input_lat = this.com.querySelector('.com-lat');
            this.input_lng = this.com.querySelector('.com-lng');
            this.input_name = this.com.querySelector('.com-name');
            this.input_description = this.com.querySelector('.com-description');
            this.input_data_collection = this.com.querySelector('.com-datacollection');
            this.input_meta_collection = this.com.querySelector('.com-metacollection');
            this.select_status = this.com.querySelector('.com-status');

            // get close measurementmodal menu button
            this.buttonCloseMeasurementmodal = this.com.querySelector('.com-button-close');
            let thisRef = this;
            this.buttonCloseMeasurementmodal.addEventListener('click', function (evt) {
                evt.stopPropagation();
                evt.preventDefault();
                thisRef.closeModal();
            });

            //when window is opened, a click outside of the window should close it and remove the temporary marker.
            this.com.onclick = (e) => {
                e.stopPropagation();
                e.preventDefault();
                if (e.target.closest('.com-box') == null) {
                    this.closeModal();
                    this.clearInputs();
                }
            };

            //when changing the input fields, the temporary marker is replaced to match new coordinates.
            this.input_lat.onchange = this.updateMarker.bind(this);
            this.input_lng.onchange = this.updateMarker.bind(this);

            //the back button closes the window and removes the temporary marker
            const backbutton = this.com.querySelector('.com-back-button');
            backbutton.onclick = () => {
                this.closeModal();
                this.clearInputs();
            };

            const saveBtn = this.com.querySelector('.com-save-button');
            saveBtn.addEventListener('click', function (evt) {
                evt.preventDefault();
                thisRef.map.enableMapInteractions();
                thisRef.save();
                thisRef.com.style.display = 'none';
            });
            resolve();
        });
    }

    // handler fn for map click event
    onMapClick(e) {
        if (this.options.objectRequestor) {
            const ed = e.detail
            this.map.disableMapInteractions();
            this.input_lat.value = ed.latlng.lat;
            this.input_lng.value = ed.latlng.lng;
            this.marker = this.map.addMarker(
                    {
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: [ed.latlng.lng, ed.latlng.lat],
                        },
                        set: {swac_fromName: this.options.objectRequestor.fromName, id: -1},
                    }
            );

            // Show up modal
            this.com.style.display = 'flex';

            // dynmically import type selection with select comp for measurement point based on datasource
            const type_placeholder = this.com.querySelector('.com-type-placeholder');
            if (!type_placeholder.querySelector('#com_type')) {
                if (this.options.typesRequestor) {
                    this.select_type = document.createElement('div');
                    this.select_type.setAttribute('id', 'com_type');
                    this.select_type.setAttribute('class', 'com-type uk-margin-small-bottom');
                    this.select_type.setAttribute('swa', 'Select FROM ' + this.options.typesRequestor.fromName + ' TEMPLATE datalist');
                    this.select_type.setAttribute('required', true);
                    type_placeholder.appendChild(this.select_type);
                    let viewHandler = new ViewHandler();
                    let thisRef = this;
                    viewHandler.load(this.select_type).then(function () {
                        thisRef.select_type.querySelector('input').addEventListener('input', thisRef.onChangeType.bind(thisRef));
                    });
                } else {
                    let type_label = this.com.querySelector('.com-type-label');
                    type_label.classList.add('swac_dontdisplay');
                }
            }

            // Load possible parents
            const parent_placeholder = this.com.querySelector('.com-parent-placeholder');
            if (!parent_placeholder.querySelector('#com_parent')) {
                if (this.options.parentRequestor) {
                    this.select_parent = document.createElement('div');
                    this.select_parent.setAttribute('id', 'com_parent');
                    this.select_parent.setAttribute('class', 'com-parent uk-margin-small-bottom');
                    this.select_parent.setAttribute('swa', 'Select FROM ' + this.options.parentRequestor.fromName + ' TEMPLATE datalist');
                    this.select_parent.setAttribute('required', true);
                    parent_placeholder.appendChild(this.select_parent);
                    let viewHandler = new ViewHandler()
                    viewHandler.load(this.select_parent);
                } else {
                    let parent_label = this.com.querySelector('.com-parent-label');
                    parent_label.classList.add('swac_dontdisplay');
                }
            }
        } else {
            Msg.info('CreateObjectModalSPL', 'Required requestor for creating an object is not in ' + this.requestor.id + ' options defined. Define >objectRequestor<');
        }
    }

    /**
     * Will be executed, if the type of the new object was changed.
     */
    onChangeType() {
        // clear last values
        this.dataTableDef = null;
        this.metaTableDef = null;

        // Check if input is empty
        if (!this.select_type.swac_comp.getInputs())
            return;

        // Get typeId
        let typeId = this.select_type.swac_comp.getInputs()[0].value;
        let typeName = this.select_type.swac_comp.getInputs()[0].name;

        let thisRef = this;
        // Get dataTableRequestor for selected type
        let dtr = this.options.dataTablesRequestors.get(typeName);
        if (!dtr) {
            Msg.info('CreateObjectModalSPL', 'There is no dataTabelRequestor defined for >' + typeName + '< useing >default>', this.requestor.parent);
            dtr = this.options.dataTablesRequestors.get('default');
        }
        let jdtr = Object.assign({}, dtr);
        jdtr.fromWheres = JSON.parse(JSON.stringify(jdtr.fromWheres).replaceAll('{typeId}', typeId));

        // Load possibile data attributes
        Model.load(jdtr).then(function (colDefs) {
            thisRef.dataTableDef = colDefs;
            let labelElem = thisRef.requestor.parent.querySelector('.com-datacollection_label');
            let inputElem = thisRef.requestor.parent.querySelector('.com-datacollection');
            if (!colDefs || colDefs.length === 0) {
                labelElem.classList.add('swac_dontdisplay');
                inputElem.classList.add('swac_dontdisplay');
            } else {
                labelElem.classList.remove('swac_dontdisplay');
                inputElem.classList.remove('swac_dontdisplay');
            }
        });

        let mtr = this.options.metaTablesRequestors.get(typeName);
        if (!mtr) {
            Msg.info('CreateObjectModalSPL', 'There is no metaTabelRequestor defined for >' + typeName + '< useing >default>', this.requestor.parent);
            mtr = this.options.metaTablesRequestors.get('default');
        }
        let jmtr = Object.assign({}, mtr);
        jmtr.fromWheres = JSON.parse(JSON.stringify(jmtr.fromWheres).replaceAll('{typeId}', typeId));
        // Load possible meta attributes
        Model.load(jmtr).then(function (colDefs) {
            thisRef.metaTableDef = colDefs;
            let labelElem = thisRef.requestor.parent.querySelector('.com-metacollection_label');
            let inputElem = thisRef.requestor.parent.querySelector('.com-metacollection');
            if (!colDefs || colDefs.length === 0) {
                labelElem.classList.add('swac_dontdisplay');
                inputElem.classList.add('swac_dontdisplay');
            } else {
                labelElem.classList.remove('swac_dontdisplay');
                inputElem.classList.remove('swac_dontdisplay');
            }
        });
    }

    /**
     * updates the marker to the current longitude/latitude from the input fields
     * moves the map to the new marker position
     */
    updateMarker() {
        this.marker.setLatLng([this.input_lat.value, this.input_lng.value]);
        this.marker.feature.geometry.coordinates = [this.input_lng.value, this.input_lat.value];
        this.map.viewer.panTo({lat: this.input_lat.value, lng: this.input_lng.value});
    }

    // save new object to database
    async save() {
        Msg.flow('CreateObjectModalSPL', 'save() called', this.requestor.parent);
        let Model = window.swac.Model;
        let typeId = null;
        if (this.select_type && this.select_type.swac_comp.getInputs()[0]) {
            typeId = this.select_type.swac_comp.getInputs()[0].value;
        }

        let data_col_name = this.input_data_collection.value.toLowerCase();
        let thisRef = this;
        if (data_col_name) {
            thisRef.createTableForObject(data_col_name, this.dataTableDef);
        }

        let meta_col_name = this.input_meta_collection.value.toLowerCase();
        if (meta_col_name) {
            thisRef.createTableForObject(meta_col_name, this.metaTableDef);
        }

        // Save object
        let lastres = await Model.save({
            fromName: this.options.objectRequestor.fromName,
            data: [{
                    [this.options.saveMapping.ooNameAttr]: this.input_name.value,
                    [this.options.saveMapping.ooDescriptionAttr]: this.input_description.value,
                    [this.options.saveMapping.ooTypeAttr]: typeId,
                    [this.options.saveMapping.ooParentAttr]: this.select_parent.value,
                    [this.options.saveMapping.ooCompletedAttr]: this.select_status.value,
                    [this.options.saveMapping.ooDataCollectionAttr]: data_col_name,
                    [this.options.saveMapping.ooMetaCollectionAttr]: meta_col_name,
                    [this.options.saveMapping.locLatAttr]: this.input_lat.value,
                    [this.options.saveMapping.locLonAttr]: this.input_lng.value,
                    [this.options.saveMapping.locLatLonAttr]: 'POINT( ' + this.input_lng.value + ' ' + this.input_lat.value + ')',
                    [this.options.saveMapping.locNameAttr]: this.input_name.value,
                    [this.options.saveMapping.locDescriptionAttr]: this.input_description.value
                }],
        }, true)
        // Search for oid in response
        let oid = this.searchAttrInStruct('id', lastres);
        // If oid could not extracted try useing the whole answer (may is the id)
        if (!oid)
            oid = parseInt(lastres[0].origresponse);

        // Save location
        if (this.options.locationRequestor) {
            lastres = await Model.save({
                fromName: this.options.locationRequestor.fromName,
                data: [{
                        [this.options.saveMapping.ooNameAttr]: this.input_name.value,
                        [this.options.saveMapping.ooDescriptionAttr]: this.input_description.value,
                        [this.options.saveMapping.ooTypeAttr]: typeId,
                        [this.options.saveMapping.ooParentAttr]: this.select_parent.value,
                        [this.options.saveMapping.ooCompletedAttr]: this.select_status.value,
                        [this.options.saveMapping.ooDataCollectionAttr]: data_col_name,
                        [this.options.saveMapping.ooMetaCollectionAttr]: meta_col_name,
                        [this.options.saveMapping.locLatAttr]: this.input_lat.value,
                        [this.options.saveMapping.locLonAttr]: this.input_lng.value,
                        [this.options.saveMapping.locLatLonAttr]: 'POINT( ' + this.input_lng.value + ' ' + this.input_lat.value + ')',
                        [this.options.saveMapping.locNameAttr]: this.input_name.value,
                        [this.options.saveMapping.locDescriptionAttr]: this.input_description.value
                    }],
            }, true)
            // Search for oid in response
            let locid = this.searchAttrInStruct('id', lastres);
            // If locid could not extracted try useing the whole answer (may is the id)
            if (!locid)
                locid = parseInt(lastres[0].origresponse);
            // Save join
            if (this.options.joinRequestor) {
                if (oid == null || locid === null) {
                    Msg.error('CreateObjectModalSPL', 'Could not save joiner for location and object, because either oid or locid is null. oid: >' + oid + '<, locid: >' + locid + '<');
                    return;
                }

                lastres = await Model.save({
                    fromName: this.options.joinRequestor.fromName,
                    data: [{
                            [this.options.saveMapping.joinOoIdAttr]: oid,
                            [this.options.saveMapping.joinLocIdAttr]: locid
                        }],
                }, true);
            }
        }

        // Check if save was succsessfull
        if (lastres) {
            UIkit.notification({
                message: SWAC.lang.dict.Worldmap2d_CreateObjectModal.createsuc,
                status: 'primary',
                pos: 'top-center',
                timeout: SWAC.config.notifyDuration
            });
        }

        this.clearInputs();
    }

    /**
     * Creates a table for an object, useing given datadefinition (SmartDataDDL)
     *
     * @param {String} tableName Name of the table to create
     * @param {Object[]} colDefs Column definitions @see at SmartDataDDL
     */
    createTableForObject(tableName, colDefs) {
        // If there are no colDefs no table should be generated
        if (!colDefs || colDefs.length === 0) {
            Msg.info('CreateObjectModalSPL', 'There is no definitions for coloumns of a datatabel. No datatable will be created for >' + this.input_name.value + '<', this.requestor.parent);
            return;
        }

        // Get SmartData datasource
        let csource, storage;
        for (let curSource of window.swac.config.datasources) {
            let urlstartIndex = curSource.url.indexOf('/smartdata/');
            if (urlstartIndex > 0) {
                csource = curSource.url.substring(0, urlstartIndex + 11);
            }
            let storagestartIndex = curSource.url.indexOf('?storage=');
            if (storagestartIndex > 0) {
                storage = curSource.url.substring(storagestartIndex);
            }
            if (csource)
                break;
        }
        if (!csource) {
            Msg.warn('CreateObjectModalSPL', 'There is no datasource available for createing new tables.', this.requestor.parent);
            return;
        }

        let body = {
            name: tableName,
            attributes: []
        };
        for (let curDef of colDefs) {
            if (!curDef)
                continue;
            let colDef = {
                name: curDef.name,
                type: curDef.type,
                isNullable: curDef.isnullable,
                isIdentity: curDef.isidentity,
                isAutoIncrement: curDef.isautoincrement,
                refCollection: curDef.refcollection,
                refAttribute: curDef.refattribute,
                refStorage: curDef.refstorage,
                refOnDelete: curDef.refondelete,
                refOnUpdate: curDef.refonupdate
            }
            body.attributes.push(colDef);
        }

        let url = csource + 'collection/' + tableName;
        if (storage)
            url += storage;

        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
    }

    /**
     * Searches an attribute in a struct (object, array) and returns it's value.
     *
     * @param {String} attr Attribute to search
     * @param {Array | Object} struct Array or object to search in
     * @returns {Mixed} Value of that attribute or null if not found
     */
    searchAttrInStruct(attr, struct) {
        // Check if struct is iterable
        if (struct === null)
            return null;
        if (!struct || typeof struct === 'string' || !isNaN(struct) || (typeof struct !== 'object' && typeof struct[Symbol.iterator] !== 'function')) {
            return null;
        }

        let res = null;
        // Iterate and check entries
        for (let i in struct) {
            if (i === attr) {
                res = struct[i];
            } else if (typeof struct === 'object') {
                let nres = this.searchAttrInStruct(attr, struct[i]);
                if (nres != null)
                    res = nres;
            }
        }
        return res;
    }

    clearInputs() {
        this.input_name.value = '';
        this.input_description.value = '';
        this.input_data_collection.value = '';
        this.input_meta_collection.value = '';
        this.select_status.value = 'false';
        if (this.select_type)
            this.select_type.value = 0;
        if (this.select_parent)
            this.select_parent.value = 0;
    }

    closeModal() {
        this.map.removeMarker(this.marker);
        this.map.enableMapInteractions();
        this.com.style.display = 'none';
    }

}

