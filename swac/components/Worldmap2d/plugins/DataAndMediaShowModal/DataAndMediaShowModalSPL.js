import Msg from '../../../../Msg.js';
import Plugin from '../../../../Plugin.js';
import ViewHandler from '../../../../ViewHandler.js';

export default class DataAndMediaShowModalSPL extends Plugin {
    constructor(options = {}) {
        super(options);
        this.name = 'Worldmap2d/plugins/DataAndMediaShowModal';
        this.desc.text = 'Shows data, metadata and media in a modal opening when clicking on a location.';

        this.desc.templates[0] = {
            name: 'default',
            desc: 'Default template for DataAndMediaShowModal, shows data of a map pin',
        };

        this.desc.opts[0] = {
            name: 'table_names',
            desc: 'Table names of database',
            example: {
                table_names: {
                    locations_table: {
                        table_name: '',
                        idAttr: '',
                        geojsonattr: '',
                    },
                    oo_table: {
                        table_name: '',
                        idAttr: '',
                        completed: '',
                    }
                },
            }
        };
        if (!options.table_names) {
            this.options.table_names = {};
        }

        this.desc.opts[1] = {
            name: 'data_iframelink',
            desc: 'Link to the page embedding the data.'
        };
        if (!options.data_iframelink)
            this.options.data_iframelink = null;

        this.desc.opts[2] = {
            name: 'meta_iframelink',
            desc: 'Link to the page embedding the meta data.'
        };
        if (!options.meta_iframelink)
            this.options.meta_iframelink = null;

        this.desc.opts[3] = {
            name: 'media_iframelink',
            desc: 'Link to the page embedding the media page.'
        };
        if (!options.media_iframelink)
            this.options.media_iframelink = null;

        // Internal useage attributes
        this.map = null;
        this.lastClickedMarker = null;
    }

    init() {
        return new Promise((resolve, reject) => {
            //check if all needed table_names and file spaces are defined
            if (typeof this.options.table_names === 'undefined'
                    || typeof this.options.table_names.oo_table === 'undefined'
                    || typeof this.options.table_names.locations_table === 'undefined') {
                Msg.warn("DataAndMediaShowModalSPL", "Required table names not in worldmap2d options defined");
                resolve();
                return;
            }

            this.map = this.requestor.parent.swac_comp;

            // add event listener for mapMarkerClick
            document.addEventListener('swac_' + this.requestor.parent.id + '_marker_click', this.onClickPin.bind(this));

            // Add event listener for location input
            let lonElem = document.querySelector('.swac_worldmap2d_dataandmediashowmodal_lon');
            lonElem.addEventListener('change', this.onChangeGPS.bind(this));
            let latElem = document.querySelector('.swac_worldmap2d_dataandmediashowmodal_lat');
            latElem.addEventListener('change', this.onChangeGPS.bind(this));

            // add event listener for update location click
            document.querySelector('.swac_worldmap2d_dataandmediashowmodal_upd').addEventListener('click', this.onClickGPSUpdate.bind(this));
            document.querySelector('.swac_worldmap2d_dataandmediashowmodal_sav').addEventListener('click', this.onClickGPSSave.bind(this));

            resolve();
        });
    }

    /**
     * Handles click on map pin marker.
     * 
     * Gets the data of the marker, loads it, and displays it in the dataandmediashowmodal.
     * Initializes uploadfile component.
     * Initializes edit component.
     * 
     * @param {DOMEvent} event 
     * @returns {undefined}
     */
    onClickPin(e) {
        let set = e.detail.target.feature.set;
        Msg.flow('Worldmap2d DataAndMediaShowModalSPL', 'User clicked on mappin for location >'+ set.id + ']', this.requestor);
        
        // get dataandmediashowmodal element
        let pinmodal = document.querySelector('#swac_worldmap2d_mappinmondal_modal');
        UIkit.modal(pinmodal).show();
        pinmodal.setAttribute('swac_setid', set.id);
        this.lastClickedMarker = e.detail.target;
        // Get name of table for object information
        let ootableName = this.options.table_names.oo_table.table_name;

        // Add location name
        let titleElem = pinmodal.querySelector('.uk-modal-title');
        titleElem.innerHTML = '';
        if (set.name)
            titleElem.innerHTML += set.name;
        if (set[ootableName][0].name && set[ootableName][0].name !== set.name)
            titleElem.innerHTML += ' (' + set[ootableName][0].name + ')';
        // Add description
        let ldescElem = pinmodal.querySelector('.swac_worldmap2d_dataandmediashowmodal_locdesc');
        ldescElem.setAttribute('uk-tooltip', 'Location-Id ' + set.id);
        if (set.description)
            ldescElem.innerHTML += set.description;
        let odescElem = pinmodal.querySelector('.swac_worldmap2d_dataandmediashowmodal_oodesc');
        odescElem.setAttribute('uk-tooltip', 'Object-Id ' + set[ootableName][0].id);
        if (set[ootableName][0].description && set[ootableName][0].name !== set.description)
            odescElem.innerHTML = set[ootableName][0].description;
        // Show latitude and longitude
        let lonElem = document.querySelector('.swac_worldmap2d_dataandmediashowmodal_lon');
        lonElem.value = set.coordinates.coordinates[0];
        let latElem = document.querySelector('.swac_worldmap2d_dataandmediashowmodal_lat');
        latElem.value = set.coordinates.coordinates[1];

        // Show labels if active
        const labelElem = document.querySelector('#dataandmediashowmodal_labels');
        if (labelElem != null && labelElem.swac_comp) {
            labelElem.swac_comp.removeAllData();
            labelElem.swac_comp.addDataFromReference('ref://label_observedobject?filter=oo_id,eq,' + set[ootableName][0].id);
        }

        let switcher = document.querySelector('.swac_worldmap2d_dataandmediashowmodal_datatabs');
        // Fist visible tab activated
        let tab_actived = false;

        // Hide metadata tab if there is no metadata table
        let metaTabElem = pinmodal.querySelector('.set_metadata');
        if (!set[ootableName][0].meta_collection || !this.options.meta_iframelink) {
            Msg.warn('DataAndMediaShowModalSPL', 'Metadata tab will be hidden. There is no meta_collection defined or no meta_iframelink in the options.');
            metaTabElem.classList.add('swac_dontdisplay');
        } else {
            metaTabElem.classList.remove('swac_dontdisplay');
            tab_actived = true;
            let iframeElem = pinmodal.querySelector('.swac_worldmap2d_dataandmediashowmodal_meta_iframe');
            iframeElem.src = this.options.meta_iframelink.replace('{oo_id}', set[ootableName][0].id).replace('{id}', set.id).replace('{meta_collection}', set[ootableName][0].meta_collection);
        }

        // Hide data tab if there is no data table
        let dataTabElem = pinmodal.querySelector('.set_data');
        if (!set[ootableName][0].data_collection || !this.options.data_iframelink) {
            Msg.info('DataAndMediaShowModalSPL', 'There is no data_collection attribute for set >' + set.swac_fromname + '[' + set.id + ']< or data_iframelink is not set. Data tab deactivated.', this.requestor);
            dataTabElem.classList.add('swac_dontdisplay');
        } else {
            dataTabElem.classList.remove('swac_dontdisplay');
            if (!tab_actived) {
                UIkit.switcher(switcher).show(1);
                tab_actived = true;
            }
            let iframeElem = pinmodal.querySelector('.swac_worldmap2d_dataandmediashowmodal_data_iframe');
            iframeElem.src = this.options.data_iframelink.replace('{oo_id}', set[ootableName][0].id).replace('{id}', set.id).replace('{data_collection}', set[ootableName][0].data_collection);
        }

        // Hide media tab if there is no media table
        let mediaTabElem = pinmodal.querySelector('.set_media');
        if (!this.options.media_iframelink) {
            mediaTabElem.classList.add('swac_dontdisplay');
        } else {
            mediaTabElem.classList.remove('swac_dontdisplay');
            if (!tab_actived) {
                UIkit.switcher(switcher).show(3);
                tab_actived = true;
            }
            let iframeElem = pinmodal.querySelector('.swac_worldmap2d_dataandmediashowmodal_media_iframe');
            iframeElem.src = this.options.media_iframelink.replace('{oo_id}', set[ootableName][0].id).replace('{id}', set.id).replace('{media_collection}', set[ootableName][0].media_collection);
        }
    }

    /**
     * Executed when the gps position should be updated
     * 
     * @param {DOMEvent} evt Event requesting the update
     */
    async onClickGPSUpdate(evt) {
        Msg.flow('Worldmap2d DataAndMediaShowModalSPL', 'User clicked for gps location update.', this.requestor);
        
        // Check if a position is available
        if (!this.map.lastReceivedPosition) {
            // Try get geolocation component
            let geoLocElem = document.querySelector('[swa="Geolocation"]');
            try {
                // Wait for updated location (updates location in man too)
                await geoLocElem.swac_comp.getCurrentLocation();
            } catch (e) {
                // Possible outdated location do not continue to save
                UIkit.modal.alert(e.msg);
                return;
            }
        }

        const lat = this.map.lastReceivedPosition.latitude;
        const lng = this.map.lastReceivedPosition.longitude;
        // Update in dialog
        let latElem = document.querySelector('.swac_worldmap2d_dataandmediashowmodal_lat');
        latElem.value = lat;
        let lonElem = document.querySelector('.swac_worldmap2d_dataandmediashowmodal_lon');
        lonElem.value = lng;
        // Update in database
        this.onClickGPSSave(evt);
    }

    /**
     * Executed when the gps position should be saved
     * 
     * @param {DOMEvent} evt Event requesting the save
     */
    async onClickGPSSave(evt) {
        Msg.flow('Worldmap2d DataAndMediaShowModalSPL', 'Save location coordinates called.', this.requestor);
        
        const lat = document.querySelector('.swac_worldmap2d_dataandmediashowmodal_lat').value;
        const lng = document.querySelector('.swac_worldmap2d_dataandmediashowmodal_lon').value;

        // Update marker position
        let newLatLng = new L.LatLng(lat, lng);
        this.lastClickedMarker.setLatLng(newLatLng);

        // Update in database
        const dataCapsule = {
            fromName: this.options.table_names.locations_table.table_name,
            idAttr: this.options.table_names.locations_table.idAttr,
            data: [{
                    [this.options.table_names.locations_table.idAttr]: this.lastClickedMarker.feature.set.id,
                    [this.options.table_names.locations_table.geojsonattr]: `POINT(${lng} ${lat})`
                }]
        }

        try {
            let Model = window.swac.Model;
            Model.save(dataCapsule, true)
        } catch (e) {
            Msg.error("Error updating position", e)
        }
    }

    /**
     * Called when a GPS input has changed
     * 
     * @param {DOMEvent} evt Change event
     */
    onChangeGPS(evt) {
        let input = evt.target.value;
        // Check if input is DMS format
        if (input.includes('°') && input.includes('\'')) {
            const [degrees, minutes, seconds] = input.split(/[^\d]+/).map(Number);
            // degrees, minutes, seconds
            let dd = degrees + minutes / 60 + seconds / (60 * 60);
            if (input.includes('W') || input.includes('S'))
                dd *= -1
            evt.target.value = dd;
        }
        // Chek input
        let inputFloat = parseFloat(evt.target.value);
        if (isNaN(inputFloat)) {
            UIkit.modal.alert(window.swac.lang.dict.Worldmap2d_DataAndMediaShowModal.gps_inputerr);
        }
    }
}