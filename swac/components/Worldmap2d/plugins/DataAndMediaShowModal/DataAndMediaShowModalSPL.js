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
            style: 'default',
            desc: 'Default template for DataAndMediaShowModal, shows data of a map pin',
        };

        this.desc.reqPerSet[0] = {
            name: "id",
            desc: "Id that identifies the dataset",
            type: "long"
        };


        this.desc.optPerSet[1] = {
            name: "name",
            alt: "title",
            desc: "Datasets name or title",
            type: "String"
        };
        this.desc.optPerSet[1] = {
            name: "desc",
            alt: "description",
            desc: "Datasets description",
            type: "String"
        };

        this.desc.opts[0] = {
            name: 'subdesc_attr',
            desc: 'Attribute where to find an aditional description. (Maybe from a related dataset)',
            example: 'desc'
        };
        if (!options.subdesc_attr)
            this.options.subdesc_attr = 'locations[0].desc';

        this.desc.opts[1] = {
            name: 'longitude_attr',
            desc: 'Source where to find the available labels. This can be any SWAC compatible datasource.',
            example: 'locations[0].coordinates.longitude'
        };
        if (!options.longitude_attr)
            this.options.longitude_attr = 'longitude';

        this.desc.opts[2] = {
            name: 'lattitude_attr',
            desc: 'Source where to find the available labels. This can be any SWAC compatible datasource.',
            example: 'locations[0].coordinates.latitude'
        };
        if (!options.lattitude_attr)
            this.options.latitude_attr = 'latitude';

        this.desc.opts[3] = {
            name: 'custom_tabs',
            desc: 'Define tabs to show',
            example: [
                {
                    title: 'tabs title',
                    type: 'iframe',
                    url: '/myiframe-url'
                },
                {
                    title: 'data title',
                    type: 'data-table',
                    url: '/my-data-url'
                }]
        }
        if (!options.custom_tabs)
            this.options.custom_tabs = [];

        this.desc.opts[4] = {
            name: 'label_source',
            desc: 'Source where to find the available labels. This can be any SWAC compatible datasource.',
            type: 'url'
        };
        if (!options.label_source)
            this.options.label_source = null;

        this.desc.opts[5] = {
            name: 'appliedlabels_source',
            desc: 'Source where to find labels that belong to the dataset. Placeholders {{globalplaceholders}} and {{dataplaceholders}} allowed.',
            type: 'url'
        };
        if (!options.appliedlabels_source)
            this.options.appliedlabels_source = null;

        this.desc.opts[6] = {
            name: 'media_source',
            desc: 'Source where to find the available medias. This can be any SWAC compatible datasource.',
            type: 'url'
        };
        if (!options.media_source)
            this.options.media_source = null;

        this.desc.opts[7] = {
            name: 'media_target',
            desc: 'Target where to send the media upload to.',
            type: 'url'
        };
        if (!options.media_target)
            this.options.media_target = null;

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
            let lonElem = document.querySelector('.swac_worldmap2d_dataandmediashow_lon');
            lonElem.addEventListener('change', this.onChangeGPS.bind(this));
            let latElem = document.querySelector('.swac_worldmap2d_dataandmediashow_lat');
            latElem.addEventListener('change', this.onChangeGPS.bind(this));

            // add event listener for update location click
            document.querySelector('.swac_worldmap2d_dataandmediashow_upd').addEventListener('click', this.onClickGPSUpdate.bind(this));
            document.querySelector('.swac_worldmap2d_dataandmediashow_sav').addEventListener('click', this.onClickGPSSave.bind(this));

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
        Msg.flow('Worldmap2d DataAndMediaShowModalSPL', 'User clicked on mappin for location >' + set.id + ']', this.requestor);

        // get dataandmediashowmodal element
        let modalElem = document.querySelector('#swac_worldmap2d_dataandmediashow_modal');
        UIkit.modal(modalElem).show();
        modalElem.setAttribute('swac_setid', set.id);
        this.lastClickedMarker = e.detail.target;

        // set modal back to initial state
        let labelTabMenueElem = modalElem.querySelector('.set_label');
        labelTabMenueElem.classList.add('swac_dontdisplay');
        let mediaTabMenueElem = modalElem.querySelector('.set_media');
        mediaTabMenueElem.classList.add('swac_dontdisplay');
        // Remove configured tabs
        let customTabNavElms = modalElem.querySelectorAll('.swac_worldmap2d_dataandmediashow_customnav');
        for (let curCustomtTabNav of customTabNavElms) {
            curCustomtTabNav.remove();
        }
        let customTabElms = modalElem.querySelectorAll('.swac_worldmap2d_dataandmediashow_customtab');
        for (let curCustomTab of customTabElms) {
            curCustomTab.remove();
        }

        // Build up tabs
        // Build up main tab
        this.showMainTab(set, modalElem);
        // Build up label tab
        if (this.options.label_source) {
            this.showLabelTab(set, labelTabMenueElem);
        }

        // Build up media tab
        if (this.options.media_source || this.options.media_target) {
            this.showMediaTab(set, mediaTabMenueElem);
        }

        // Build up configured tabs
        if (this.options.custom_tabs) {
            this.showCustomTabs(set);
        }

        // Add location name
        let titleElem = modalElem.querySelector('.uk-modal-title');
        titleElem.innerHTML = '';
        if (set.name)
            titleElem.innerHTML += set.name;
    }

    /**
     * Show the main tab and fill it with data.
     */
    showMainTab(set, modalElem) {

        // Add description
        let ldescElem = modalElem.querySelector('.swac_worldmap2d_dataandmediashow_setdesc');
        if (set.desc) {
            ldescElem.classList.remove('swac_dontdisplay');
            ldescElem.setAttribute('uk-tooltip', 'Dataset-Id ' + set.id);
            ldescElem.innerHTML += set.description;
        } else {
            ldescElem.classList.add('swac_dontdisplay');
        }

        // Show subdesc
        const partsSubDesc = this.options.subdesc_attr.replace(/\[(\d+)\]/g, '.$1').split('.');
        let subDescValue = partsSubDesc.reduce((acc, key) => acc?.[key], set);
        let subDescElem = document.querySelector('.swac_worldmap2d_dataandmediashow_subdesc');
        if (subDescValue) {
            subDescElem.classList.remove('swac_dontdisplay');
            subDescElem.innerHTML += subDescValue;
        } else {
            subDescElem.classList.add('swac_dontdisplay');
        }

        // Show longitude
        const partsLon = this.options.longitude_attr.replace(/\[(\d+)\]/g, '.$1').split('.');
        let lonValue = partsLon.reduce((acc, key) => acc?.[key], set);
        let lonElem = document.querySelector('.swac_worldmap2d_dataandmediashow_lon');
        lonElem.value = lonValue;

        // Show latitude
        const partsLat = this.options.latitude_attr.replace(/\[(\d+)\]/g, '.$1').split('.');
        let latValue = partsLat.reduce((acc, key) => acc?.[key], set);
        let latElem = document.querySelector('.swac_worldmap2d_dataandmediashow_lat');
        latElem.value = latValue;

        let mainDataElem = modalElem.querySelector('.swac_worldmap2d_dataandmediashow_maindata');
        let rowTplElem = mainDataElem.querySelector('.swac_worldmap2d_dataandmediashow_repeatForMainValue');

        // Remove old main data
        let oldMainDataRows = mainDataElem.querySelectorAll('.swac_worldmap2d_dataandmediashow_repeatedForMainValue');
        for (let curOldMainDataRow of oldMainDataRows) {
            curOldMainDataRow.remove();
        }

        // Normalisierte Schlüssel für Latitude und Longitude
        const subDescKey = this.options.subdesc_attr.replace(/\[(\d+)\]/g, '.$1');
        const latKey = this.options.latitude_attr.replace(/\[(\d+)\]/g, '.$1');
        const lonKey = this.options.longitude_attr.replace(/\[(\d+)\]/g, '.$1');

        // Show main data
        let flat = this.flattenObject(set);
        let sortedEntries = Object.entries(flat).sort(([keyA], [keyB]) => keyA.localeCompare(keyB));
        for (const [key, value] of sortedEntries) {
            if (key.startsWith('swac_') || key === latKey || key === lonKey || key === subDescKey || key === 'desc' || key === 'name')
                continue;
            let curRowElem = rowTplElem.cloneNode(true);
            curRowElem.classList.remove('swac_worldmap2d_dataandmediashow_repeatForMainValue');
            curRowElem.classList.remove('swac_dontdisplay');
            curRowElem.classList.add('swac_worldmap2d_dataandmediashow_repeatedForMainValue');
            curRowElem.querySelector('.key').innerHTML = key;
            curRowElem.querySelector('.key').setAttribute('swac_lang', key);
            curRowElem.querySelector('.value').innerHTML = value;
            rowTplElem.parentNode.appendChild(curRowElem);
        }
    }

    flattenObject(obj) {
        const result = {};
        const stack = [{current: obj, path: ''}];
        const seen = new WeakSet();

        while (stack.length > 0) {
            const {current, path} = stack.pop();

            if (seen.has(current))
                continue;
            if (typeof current === 'object' && current !== null) {
                seen.add(current);
            }

            for (const key in current) {
                if (!Object.prototype.hasOwnProperty.call(current, key))
                    continue;

                const value = current[key];
                const newPath = path ? `${path}.${key}` : key;

                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                    stack.push({current: value, path: newPath});
                } else {
                    result[newPath] = value;
                }
            }
        }

        return result;
    }

    /**
     * Show the label tab and fill it with data.
     */
    showLabelTab(set, tabMenueElem) {
        // Show tab in menue
        tabMenueElem.classList.remove('swac_dontdisplay');
        let tabElem = document.querySelector('.tab_label');

        // Replace placeholders in sources
        let labelSource = this.replacePlaceholders(this.options.label_source, set);
        let belongingLabelSource = this.replacePlaceholders(this.options.appliedlabels_source, set);

        // Build label configuration
        window['worldmap2d_dataandmediashow_label_options'] = {
            labelSource: {
                fromName: labelSource
            },
        };

        let labeling = document.createElement('div');
        labeling.setAttribute('id', 'worldmap2d_dataandmediashow_label');
        labeling.setAttribute('swa', 'Labeling FROM ' + belongingLabelSource);
        tabElem.appendChild(labeling);

        let viewHandler = new ViewHandler();
        viewHandler.load(labeling).then(function () {
        });
    }

    /**
     * Show the media tab and fill it with data.
     */
    showMediaTab(set, tabMenueElem) {
        // Show tab in menue
        tabMenueElem.classList.remove('swac_dontdisplay');
        let tabElem = document.querySelector('.tab_media');
        // Show upload area for media
        if (this.options.media_target) {
            let mediaTarget = this.replacePlaceholders(this.options.media_target, set);
            // Create configuration
            window['worldmap2d_dataandmediashow_mediaupload_options'] = {
                uploadTargetURL: mediaTarget
            };

            let mediaUpload = document.createElement('div');
            mediaUpload.setAttribute('id', 'worldmap2d_dataandmediashow_mediaupload');
            mediaUpload.setAttribute('swa', 'Upload TEMPLATE single_upload');
            tabElem.appendChild(mediaUpload);

            let viewHandler = new ViewHandler();
            viewHandler.load(mediaUpload).then(function () {
            });
        }

        // Show media galery
        if (this.options.media_source) {
            // Create configuration
            window['worldmap2d_dataandmediashow_mediapreview_options'] = {
                showWhenNoData: true
            };
            
            let mediaSource = this.replacePlaceholders(this.options.media_source, set);
            let mediaGalery = document.createElement('div');
            mediaGalery.setAttribute('id', 'worldmap2d_dataandmediashow_mediapreview');
            mediaGalery.setAttribute('swa', 'Mediapreview FROM ' + mediaSource);
            tabElem.appendChild(mediaGalery);

            let viewHandler = new ViewHandler();
            viewHandler.load(mediaGalery).then(function () {
            });
        }
    }

    /**
     * Create custom tabs from configuration
     */
    showCustomTabs(set) {
        let navAreaElem = document.querySelector('.swac_worldmap2d_dataandmediashow_body ul');
        let tabAreaElem = document.querySelector('.swac_worldmap2d_dataandmediashow_tabs');

        for (let curCustomTab of this.options.custom_tabs) {
            // Create navigation entry
            let curCustomTabNavElem = document.createElement('li');
            curCustomTabNavElem.classList.add('swac_worldmap2d_dataandmediashow_customnav');
            let curCustomTabNavAElem = document.createElement('a');
            curCustomTabNavAElem.href = '#';
            curCustomTabNavAElem.setAttribute('swac_lang', curCustomTab.title);
            curCustomTabNavAElem.innerHTML = curCustomTab.title;
            curCustomTabNavElem.appendChild(curCustomTabNavAElem);
            navAreaElem.appendChild(curCustomTabNavElem);
            // Create content area
            let curCustomTabElem = document.createElement('div');
            curCustomTabElem.classList.add('swac_worldmap2d_dataandmediashow_customtab');
            let curCustomTabHElem = document.createElement('h1');
            curCustomTabHElem.setAttribute('swac_lang', curCustomTab.title);
            curCustomTabHElem.innerHTML = curCustomTab.title;
            curCustomTabElem.appendChild(curCustomTabHElem);

            // Replace global placeholders in link
            let link = curCustomTab.url;
            let gparams = SWAC_config.globalparams;
            // Get url params
            const urlParams = new URLSearchParams(window.location.search);
            for (const [key, value] of urlParams.entries()) {
                gparams[key] = value;
            }
            link = link.replace(/{{(.*?)}}/g, (_, key) => gparams[key] ?? `{{${key}}}`);
            link = link.replace(/{(.*?)}/g, (_, key) => {
                // Ausschließen: null-Werte oder Schlüssel, die mit "swac_" beginnen
                if (set[key] == null || key.startsWith("swac_")) {
                    return `{${key}}`; // Platzhalter bleibt erhalten
                }
                return set[key];
            });

            // Switch tab mode
            if (curCustomTab.type === 'iframe') {
                let iframe = document.createElement('iframe');
                iframe.src = curCustomTab.url;

                curCustomTabElem.appendChild(iframe);
            }
            // Create table view
            if (curCustomTab.type === 'data-table') {
                let present = document.createElement('div');
                present.setAttribute('id', curCustomTab.title + '_table');
                present.setAttribute('swa', 'Present FROM ' + link);
                curCustomTabElem.appendChild(present);

                let viewHandler = new ViewHandler();
                viewHandler.load(present).then(function () {
                });
            }
            // Create chart view
            if (curCustomTab.type === 'data-chart') {
                let chart = document.createElement('div');
                chart.setAttribute('id', curCustomTab.title + '_chart');
                chart.setAttribute('swa', 'Charts FROM ' + link);
                curCustomTabElem.appendChild(chart);

                let viewHandler = new ViewHandler();
                viewHandler.load(chart).then(function () {
                });
            }

            tabAreaElem.appendChild(curCustomTabElem);
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

    replacePlaceholders(string, set) {
        let gparams = SWAC_config.globalparams;
        // Get url params
        const urlParams = new URLSearchParams(window.location.search);
        for (const [key, value] of urlParams.entries()) {
            gparams[key] = value;
        }
        string = string.replace(/{{(.*?)}}/g, (_, key) => gparams[key] ?? `{{${key}}}`);
        string = string.replace(/{(.*?)}/g, (_, key) => {
            // Ausschließen: null-Werte oder Schlüssel, die mit "swac_" beginnen
            if (set[key] == null || key.startsWith("swac_")) {
                return `{${key}}`; // Platzhalter bleibt erhalten
            }
            return set[key];
        });
        return string;
    }
}