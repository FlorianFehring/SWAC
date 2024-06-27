import SWAC from '../../../../swac.js';
import Msg from '../../../../Msg.js';
import Plugin from '../../../../Plugin.js';
import ViewHandler from '../../../../ViewHandler.js';

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
            if (!this.options.saveMapping || !this.options.objectRequestor) {
                Msg.error(`CreateObjectModalSPL','Needed option >saveMapping< is not defined, so this component does not know where to save new objects.`, this.requestor.parent);
                return;
            }

            this.map = this.requestor.parent.swac_comp;
            document.addEventListener('swac_' + this.requestor.parent.id + '_map_click', (e) => {
                this.onMapClick(e);
            })

            this.input_lat = this.com.querySelector('.com-lat');
            this.input_lng = this.com.querySelector('.com-lng');
            this.input_name = this.com.querySelector('.com-name');
            this.input_description = this.com.querySelector('.com-description');
            this.input_data_collection = this.com.querySelector('.com-datacollection');
            this.input_meta_collection = this.com.querySelector('.com-metacollection');
            this.select_status = this.com.querySelector('.com-status');

            // dynmically import type selection with select comp for measurement point based on datasource
            const type_placeholder = this.com.querySelector('.com-type-placeholder');
            if (this.options.typesRequestor) {
                this.select_type = document.createElement('div');
                this.select_type.setAttribute('id', 'com_type');
                this.select_type.setAttribute('class', 'com-type uk-margin-small-bottom');
                this.select_type.setAttribute('swa', 'Select FROM ' + this.options.typesRequestor.fromName + ' TEMPLATE datalist');
                this.select_type.setAttribute('required', true);
                type_placeholder.appendChild(this.select_type);
                let viewHandler = new ViewHandler()
                viewHandler.load(this.select_type);
            } else {
                let type_label = this.com.querySelector('.com-type-label');
                type_label.classList.add('swac_dontdisplay');
            }

            const parent_placeholder = this.com.querySelector('.com-parent-placeholder');
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

            // get close measurementmodal menu button
            this.buttonCloseMeasurementmodal = this.com.querySelector('.com-button-close');
            this.buttonCloseMeasurementmodal.onclick = () => this.closeModal();
            L.DomEvent.on(this.buttonCloseMeasurementmodal, 'click', L.DomEvent.stopPropagation);

            //when window is opened, a click outside of the window should close it and remove the temporary marker.
            this.com.onclick = (e) => {
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

            const form = this.com.querySelector('.com-form');
            form.onsubmit = (e) => {
                e.preventDefault();
                this.map.enableMapInteractions();
                this.save();
                this.com.style.display = 'none';
            };
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
        } else {
            Msg.info('CreateObjectModalSPL', 'Required requestor for creating an object is not in ' + this.requestor.id + ' options defined. Define >objectRequestor<');
        }
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

    // save new measurement point to database
    async save() {
        let Model = window.swac.Model;
        let typeId = null;
        if (this.select_type) {
            typeId = this.select_type.swac_comp.getInputs()[0].value;
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
                    [this.options.saveMapping.ooDataCollectionAttr]: this.input_data_collection.value.toLowerCase(),
                    [this.options.saveMapping.ooMetaCollectionAttr]: this.input_meta_collection.value.toLowerCase(),
                    [this.options.saveMapping.locLatAttr]: this.input_lat.value,
                    [this.options.saveMapping.locLonAttr]: this.input_lng.value,
                    [this.options.saveMapping.locLatLonAttr]: 'POINT( ' + this.input_lng.value + ' ' + this.input_lat.value + ')',
                    [this.options.saveMapping.locNameAttr]: this.input_name.value,
                    [this.options.saveMapping.locDescriptionAttr]: this.input_description.value
                }],
        }, true)
        // Search for oid in response
        let oid = this.searchAttrInStruct('id', lastres);

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
                        [this.options.saveMapping.ooDataCollectionAttr]: this.input_data_collection.value.toLowerCase(),
                        [this.options.saveMapping.ooMetaCollectionAttr]: this.input_meta_collection.value.toLowerCase(),
                        [this.options.saveMapping.locLatAttr]: this.input_lat.value,
                        [this.options.saveMapping.locLonAttr]: this.input_lng.value,
                        [this.options.saveMapping.locLatLonAttr]: 'POINT( ' + this.input_lng.value + ' ' + this.input_lat.value + ')',
                        [this.options.saveMapping.locNameAttr]: this.input_name.value,
                        [this.options.saveMapping.locDescriptionAttr]: this.input_description.value
                    }],
            }, true)
            // Search for oid in response
            let locid = this.searchAttrInStruct('id', lastres);

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

