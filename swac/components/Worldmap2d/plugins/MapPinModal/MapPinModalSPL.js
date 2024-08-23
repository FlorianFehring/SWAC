import Msg from '../../../../Msg.js';
import Plugin from '../../../../Plugin.js';
import ViewHandler from '../../../../ViewHandler.js';

export default class MapPinModalSPL extends Plugin {
    constructor(options = {}) {
        super(options);
        this.name = 'Worldmap2d/plugins/MapPinModal';
        this.desc.text = 'Displays the data when clicking on a map pin';

        this.desc.templates[0] = {
            name: 'mappinmodal',
            style: 'mappinmodal',
            desc: 'Default template for MapPinModal, shows data of a map pin',
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
                    },
                    file_table: {
                        table_name: '',
                        idAttr: ''
                    },
                    file_join_oo_table: {
                        table_name: '',
                        idAttr: '',
                        file_id: '',
                        oo_id: ''
                    },
                    uploadfile_options: {
                        uploadTargetURL: '',
                        docroot: ''
                    }
                },
            }
        };
        if (!options.table_names) {
            this.options.table_names = {};
        }

        this.desc.opts[1] = {
            name: 'data_size',
            desc: 'Number of datasets that should be displayed in the data view.'
        };
        if (typeof options.data_size === 'undefined')
            this.options.data_size = 10;

        this.desc.opts[2] = {
            name: 'data_iframelink',
            desc: 'Link to the page embedding the data.'
        };
        if (!options.data_iframelink)
            this.options.data_iframelink = null;

        this.desc.opts[3] = {
            name: 'meta_iframelink',
            desc: 'Link to the page embedding the meta data.'
        };
        if (!options.meta_iframelink)
            this.options.meta_iframelink = null;

        this.desc.opts[4] = {
            name: 'media_iframelink',
            desc: 'Link to the page embedding the media page.'
        };
        if (!options.media_iframelink)
            this.options.media_iframelink = null;

        // Internal useage attributes
        this.lastClickedMarker = null;



        // Attributes for internal usage
        this.mappinmodal = null;
        this.marker = null;
        this.map = null;
        this.edit = null;
        this.selectStatus = null;
        this.content = null;
        this.gallery = null;
        this.uploadfile = null;
        this.uploadfileAddButton = null;
        this.updateLocationButton = null;
        this.buttonCloseMappindata = null;

        // TAB
        this.tabShowMeasurements = null;
        this.tabShowGallery = null;
        this.tabShowUpload = null;

        // SLIDESHOW
        this.slideshowCurrentSilde = null;
        this.slideshowSlides = null;
        this.slideshowPrev = null;
        this.slideshowNext = null;

    }

    init() {
        return new Promise((resolve, reject) => {
            //check if all needed table_names and file spaces are defined
            if (typeof this.options.table_names === 'undefined'
                    || typeof this.options.table_names.oo_table === 'undefined'
                    || typeof this.options.table_names.locations_table === 'undefined'
                    || typeof this.options.table_names.file_table === 'undefined'
                    || typeof this.options.table_names.file_join_oo_table === 'undefined'
                    || typeof this.options.table_names.uploadfile_options === 'undefined') {
                Msg.warn("MapPinModalSPL", "Required table names not in worldmap2d options defined");
                resolve();
                return;
            }

            this.map = this.requestor.parent.swac_comp;

            // add event listener for mapMarkerClick
            document.addEventListener('swac_' + this.requestor.parent.id + '_marker_click', this.onClickPin.bind(this));

            // Add event listener for location input
            let lonElem = document.querySelector('.swac_worldmap2d_mappinmodal_lon');
            lonElem.addEventListener('change', this.onChangeGPS.bind(this));
            let latElem = document.querySelector('.swac_worldmap2d_mappinmodal_lat');
            latElem.addEventListener('change', this.onChangeGPS.bind(this));

            // add event listener for update location click
            document.querySelector('.swac_worldmap2d_mappinmodal_upd').addEventListener('click', this.onClickGPSUpdate.bind(this));
            document.querySelector('.swac_worldmap2d_mappinmodal_sav').addEventListener('click', this.onClickGPSSave.bind(this));

            resolve();
//return;
//this.mappinmodal = this.requestor.parent.querySelector('.mappinmodal');
//            L.DomEvent.on(mappinmodal, 'click', L.DomEvent.stopPropagation);
//
//
//
//
//            // get select element and add event listener
//            this.selectStatus = this.mappinmodal.querySelector('.mappinmodal-select_status');
//            this.selectStatus.onchange = this.updateStatus.bind(this);
//
//            this.mappinmodalTitle = this.mappinmodal.querySelector('.mappinmodal-title');
//
//            // get content element
//            this.content = this.mappinmodal.querySelector('.mappinmodal-content');
//            this.content.style.display = 'block';
//
//            // get gallery
//            this.gallery = this.mappinmodal.querySelector('.mappinmodal-gallery-box');
//            this.gallery.style.display = 'none';
//
//            // get upload file
//            this.uploadfile = this.mappinmodal.querySelector('.mappinmodal-uploadfile-component');
//            this.uploadfile.style.display = 'none';
//
//            // get label
//            this.label = this.mappinmodal.querySelector('.mappinmodal-labels-box');
//            this.label.style.display = 'none';
//
//            // get tab showMeasurements
//            this.tabShowMeasurements = this.mappinmodal.querySelector('.mappinmodal-tabShowMeasurements');
//            this.tabShowMeasurements.onclick = this.show_mapPinData.bind(this);
//
//            // get tab showMapPinData showGallery
//            this.tabShowGallery = this.mappinmodal.querySelector('.mappinmodal-tabShowGallery');
//            this.tabShowGallery.onclick = this.show_gallery.bind(this);
//
//            // get tab showMapPinData showUpload
//            this.tabShowUpload = this.mappinmodal.querySelector('.mappinmodal-tabShowUpload');
//            this.tabShowUpload.onclick = this.show_uploadFile.bind(this);
//
//            // get tab label
//            this.tabShowLabels = this.mappinmodal.querySelector('.mappinmodal-tabShowLabels');
//            this.tabShowLabels.onclick = this.show_labels.bind(this);
//            this.tabShowLabels.style.display = 'none';
//
//            // get update position button
//            this.updateLocationButton = this.mappinmodal.querySelector('.mappinmodal-updateLocationButton');
//            this.updateLocationButton.onclick = this.updateLocation.bind(this)
//            this.updateLocationButton.style.display = 'none';
//
//            // get close mappinmodal menu button
//            this.buttonCloseMappindata = this.mappinmodal.querySelector('.mappinmodal-button-close');
//            this.buttonCloseMappindata.onclick = this.closeMapPinData.bind(this)
//
//            // hide element
//            this.mappinmodal.style.display = 'none';
//
//            // saves images to slideshow and database when all files are uploaded
//            document.addEventListener('swac_mappinmodal_uploadfile_files_uploaded', (allFiles) => {
//                this.addImageToSlideshow(allFiles);
//            });
//
//            // SLIDESHOW
//            this.slideshowPrev = this.mappinmodal.querySelector(".mappinmodal-prev");
//            this.slideshowNext = this.mappinmodal.querySelector(".mappinmodal-next");
//            this.slideshowSlides = this.mappinmodal.getElementsByClassName("mappinmodal-slide");
//
//            // next slide
//            this.slideshowNext.addEventListener("click", (e) => {
//                if (this.slideshowSlides.length == 0)
//                    return;
//                this.slideshowSlides[this.slideshowCurrentSlide].classList.remove("active");
//                this.slideshowCurrentSlide++;
//                if (this.slideshowCurrentSlide === this.slideshowSlides.length)
//                    this.slideshowCurrentSlide = 0;
//                this.slideshowSlides[this.slideshowCurrentSlide].classList.add("active");
//            });
//
//            // previous slide
//            this.slideshowPrev.addEventListener("click", (e) => {
//                if (this.slideshowSlides.length == 0)
//                    return;
//                this.slideshowSlides[this.slideshowCurrentSlide].classList.remove("active");
//                this.slideshowCurrentSlide--;
//                if (this.slideshowCurrentSlide < 0)
//                    this.slideshowCurrentSlide = (this.slideshowSlides.length - 1);
//                this.slideshowSlides[this.slideshowCurrentSlide].classList.add("active");
//            });
//
//            // set media query for images
//            const mediaQuery = window.matchMedia('(min-width: 992px)')
//            mediaQuery.addEventListener('change', (e) => {
//                if (this.slideshowSlides.length == 0)
//                    return;
//                if (e.matches) {
//                    for (var i = 0; i < this.slideshowSlides.length; i++) {
//                        this.slideshowSlides[i].style = "width: 500px; object-fit: scale-down";
//                    }
//                } else {
//                    for (var i = 0; i < this.slideshowSlides.length; i++) {
//                        this.slideshowSlides[i].style = "width: 300px; object-fit: scale-down";
//                    }
//                }
//            });
//
//            resolve();
        });
    }

    onClickPin(e) {
        // get mappinmodal element
        let pinmodal = document.querySelector('#swac_worldmap2d_mappinmondal_modal');
        UIkit.modal(pinmodal).show();
        let set = e.detail.target.feature.set;
        pinmodal.setAttribute('swac_setid', set.id);
        console.log('TEST pinMarker: ', e);
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
        if (set.description) {
            let descElem = pinmodal.querySelector('.swac_worldmap2d_mappinmodal_locdesc');
            descElem.innerHTML += set.description;
        }
        if (set[ootableName][0].description && set[ootableName][0].name !== set.description) {
            let descElem = pinmodal.querySelector('.swac_worldmap2d_mappinmodal_oodesc');
            descElem.innerHTML = set[ootableName][0].description;
        }
        // Show latitude and longitude
        let lonElem = document.querySelector('.swac_worldmap2d_mappinmodal_lon');
        lonElem.value = set.coordinates.coordinates[0];
        let latElem = document.querySelector('.swac_worldmap2d_mappinmodal_lat');
        latElem.value = set.coordinates.coordinates[1];

        // Show labels if active
        const labelElem = document.querySelector('#mappinmodal_labels');
        if (labelElem != null && labelElem.swac_comp) {
            labelElem.swac_comp.removeAllData();
            labelElem.swac_comp.addDataFromReference('ref://label_observedobject?filter=oo_id,eq,' + set[ootableName][0].id);
        }

        let switcher = document.querySelector('.swac_worldmap2d_mappinmodal_datatabs');
        // Fist visible tab activated
        let tab_actived = false;

        // Hide metadata tab if there is no metadata table
        let metaTabElem = pinmodal.querySelector('.set_metadata');
        if (!set[ootableName][0].meta_collection || !this.options.meta_iframelink) {
            Msg.warn('MapPinModal', 'Metadata tab will be hidden. There is no meta_collection defined or no meta_iframelink in the options.');
            metaTabElem.classList.add('swac_dontdisplay');
        } else {
            console.log('TEST mata to display');
            metaTabElem.classList.remove('swac_dontdisplay');
            tab_actived = true;
            let iframeElem = pinmodal.querySelector('.swac_worldmap2d_mappinmodal_meta_iframe');
            iframeElem.src = this.options.meta_iframelink.replace('{id}', set.id).replace('{meta_collection}', set[ootableName][0].meta_collection);
        }

        // Hide data tab if there is no data table
        let dataTabElem = pinmodal.querySelector('.set_data');
        if (!set[ootableName][0].data_collection || !this.options.data_iframelink) {
            dataTabElem.classList.add('swac_dontdisplay');
        } else {
            dataTabElem.classList.remove('swac_dontdisplay');
            if (!tab_actived) {
                console.log('switch 1');
                UIkit.switcher(switcher).show(1);
                tab_actived = true;
            }
            console.log('TEST data iframelink: ', this.options.data_iframelink);
            let iframeElem = pinmodal.querySelector('.swac_worldmap2d_mappinmodal_data_iframe');
            iframeElem.src = this.options.data_iframelink.replace('{id}', set.id).replace('{data_collection}', set[ootableName][0].data_collection);
        }

        // Hide media tab if there is no media table
        let mediaTabElem = pinmodal.querySelector('.set_media');
        console.log('TEST before media_iframelink', this.options.media_iframelink);
        if (!this.options.media_iframelink) {
            mediaTabElem.classList.add('swac_dontdisplay');
        } else {
            console.log('TEST media_iframelink from opts: ' + this.options.media_iframelink);
            mediaTabElem.classList.remove('swac_dontdisplay');
            if (!tab_actived) {
                UIkit.switcher(switcher).show(3);
                tab_actived = true;
            }
            let iframeElem = pinmodal.querySelector('.swac_worldmap2d_mappinmodal_media_iframe');
            iframeElem.src = this.options.media_iframelink.replace('{id}', set.id).replace('{media_collection}', set[ootableName][0].media_collection);
            console.log('TEST update iframe link for media: ' + iframeElem.src);
        }

        // Redo translation
//        window.swac.lang.translateAll(pinmodal);
    }

    /**
     * Executed when the gps position should be updated
     * 
     * @param {DOMEvent} evt Event requesting the update
     */
    async onClickGPSUpdate(evt) {
        // Check if a position is available
        if (!this.map.lastReceivedPosition) {
            // Try get geolocation component
            let geoLocElem = document.querySelector('[swa="Geolocation"]');
            try {
                let location = await geoLocElem.swac_comp.getCurrentLocation();
            } catch (e) {
                UIkit.modal.alert(e.msg);
                return;
            }
            console.log('TEST geoElem:', location);
        }

        const lat = this.map.lastReceivedPosition.latitude;
        const lng = this.map.lastReceivedPosition.longitude;
        // Update in dialog
        let latElem = document.querySelector('.swac_worldmap2d_mappinmodal_lat');
        latElem.value = lat;
        let lonElem = document.querySelector('.swac_worldmap2d_mappinmodal_lon');
        lonElem.value = lng;

        this.onClickGPSSave(evt);
    }

    /**
     * Executed when the gps position should be saved
     * 
     * @param {DOMEvent} evt Event requesting the save
     */
    async onClickGPSSave(evt) {
        const lat = document.querySelector('.swac_worldmap2d_mappinmodal_lat').value;
        const lng = document.querySelector('.swac_worldmap2d_mappinmodal_lon').value;

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

    deleteMetadataComponent() {
        // get mappinmodal element
        let pinmodal = document.querySelector('#swac_worldmap2d_mappinmondal_modal');
        let metaElem = pinmodal.querySelector('.swac_worldmap2d_mappinmodal_metatable');
        if (metaElem != null && metaElem.swac_comp && metaElem.swac_comp.removeAllData) {
            console.log('TEST existing comp: ', metaElem.swac_comp);
            metaElem.swac_comp.removeAllData();
        }
    }

    createMetadataComponent(set) {
        let metaId = 'meta_' + set.id;
        // get mappinmodal element
        let pinmodal = document.querySelector('#swac_worldmap2d_mappinmondal_modal');
        let metaElem = pinmodal.querySelector('.swac_worldmap2d_mappinmodal_metatable');
        metaElem.setAttribute('id', metaId);
        let metaSwa = 'Edit FROM ' + set.meta_collection + ' WHERE filter=oo_id,eq,' + set.id;
        metaElem.setAttribute('swa', metaSwa);
        // render edit component
        let viewHandler = new ViewHandler();
        viewHandler.load(metaElem);
    }

    deleteDataComponent() {
        // get mappinmodal element
        let pinmodal = document.querySelector('#swac_worldmap2d_mappinmondal_modal');
        let metaElem = pinmodal.querySelector('.datalist');
        if (metaElem != null && metaElem.swac_comp)
            metaElem.swac_comp.delete();
    }

    createDataComponent(set) {
        let dataId = 'data_' + set.id;
        // get mappinmodal element
        let pinmodal = document.querySelector('#swac_worldmap2d_mappinmondal_modal');
        let dataElem = pinmodal.querySelector('.datalist');
        dataElem.setAttribute('id', dataId);
        let dataSwa = 'Present FROM {data_collection} WHERE geotransform=latlon TEMPLATE table_for_all_datasets';
        dataSwa = dataSwa.replace('{data_collection}', set.data_collection).replace('{id}', set.id);
        dataElem.setAttribute('swa', dataSwa);
        dataElem.innerHTML = '<table id="datatable" class="uk-table uk-table-divider uk-table-striped"><tr><th class="func_labels" swac_lang="data_list_labels"></th><th class="swac_repeatForAttribute">{attrName}</th></tr><tr class="swac_repeatForSet"><td class="func_labels"><div id="labels_{id}" swa="Labeling FROM label_datasets WHERE filter=set_id,eq,{id} AND filter=data_collection,eq,{{data_collection}} OPTIONS labels_options"></div></td><td class="swac_repeatForValue"><span uk-tooltip="title: {attrName}">{*}</span></td></tr></table>';
        // render edit component
        let viewHandler = new ViewHandler()
        viewHandler.load(dataElem);
    }

    /**
     * Handles click on map pin marker.
     * 
     * Gets the data of the marker, loads it, and displays it in the mappinmodal.
     * Initializes uploadfile component.
     * Initializes edit component.
     * 
     * @param {*} event 
     * @returns {undefined}
     */
    async onMarkerClick(event) {
        console.log('TEST onMarkerClick');
        const e = event.detail;
        // disable map interactions
        this.map.disableMapInteractions();

        // diplay drawer
        this.mappinmodal.style.display = 'flex';
        this.show_mapPinData();

        // store marker from event
        this.marker = e.target;

        // set select status
        if (this.marker.feature.set.completed) {
            this.mappinmodal.querySelector(".mappinmodal-select_status_true").setAttribute('selected', true);
            this.mappinmodal.querySelector(".mappinmodal-select_status_false").removeAttribute('selected');
        } else {
            this.mappinmodal.querySelector(".mappinmodal-select_status_false").setAttribute('selected', true);
            this.mappinmodal.querySelector(".mappinmodal-select_status_true").removeAttribute('selected');
        }

        //set the name of the observedobject as title
        if (this.marker.feature.set.name !== "") {
            this.changeTitlesToOOName();
        }

        this.createEditComponent();
        if (this.map.plugins.get('Labels'))
            this.createLabelComponent();
        this.createUploadFileComponent();
        this.checkForLocationUpdate();
    }

    /**
     * Update the completed state of the observed object
     * @returns {undefined}
     */
    async updateStatus() {
        let Model = window.swac.Model;
        let dataCapsule = {
            fromName: this.options.table_names.oo_table.table_name,
            idAttr: this.options.table_names.oo_table.idAttr, // Name of sets attribute that contains the id
            data: [{
                    [this.options.table_names.oo_table.idAttr]: this.marker.feature.set.id,
                    [this.options.table_names.oo_table.completed]: this.selectStatus.value,
                }],
        }
        try {
            await Model.save(dataCapsule);
            this.map.removeMarker(this.marker);
            this.marker.feature.set.completed = this.selectStatus.value == "true" ? true : false;
            this.marker = this.map.addMarker(this.marker.feature);
        } catch (e) {
            Msg.error("Error loading data", e)
        }
    }

    /**
     * Changes all of mappinmodal's titles to dynamically loaded observedobject's name
     * @returns {undefined}
     */
    changeTitlesToOOName() {
        let mappinmodalTitles = this.mappinmodal.getElementsByClassName('title');
        for (let i = 0; i < mappinmodalTitles.length; i++) {
            mappinmodalTitles[i].textContent = this.marker.feature.set.name;
        }
    }

    /**
     * Displays upload file
     * @returns {undefined}}
     */
    show_uploadFile() {
        this.content.style.display = "none";
        this.gallery.style.display = "none";
        this.uploadfile.style.display = "flex";
        this.label.style.display = "none";
    }

    /**
     * Displays measurements
     * @returns {undefined}
     */
    show_mapPinData() {
        this.content.style.display = "block";
        this.gallery.style.display = "none";
        this.uploadfile.style.display = "none";
        this.label.style.display = "none";
    }

    /**
     * Displays map pin data
     * @returns {undefined}
     */
    show_gallery() {
        this.content.style.display = "none";
        this.gallery.style.display = "block";
        this.uploadfile.style.display = "none";
        this.label.style.display = "none";
    }

    show_labels() {
        this.content.style.display = "none";
        this.gallery.style.display = "none";
        this.uploadfile.style.display = "none";
        this.label.style.display = "block";
    }

    /**
     * Displays update location button if location tracking is allowed
     * @returns {undefined}
     */
    checkForLocationUpdate() {
        if (this.map.lastReceivedPosition !== null) {
            this.updateLocationButton.style.display = 'block';
        }
    }

    /**
     * Dynamically create edit component 
     */
    async createEditComponent() {
        // create new edit swac component
        const edit = document.createElement('div');
        edit.id = 'mappinmodal_swac_edit_marker_data';
        edit.classList.add('mappinmodal_swac_edit_marker_data');
        edit.setAttribute('swa', 'Edit FROM ' + this.marker.feature.set.collection + ' WHERE size=' + this.options.data_size + ' TEMPLATE accordion_worldmap2d');
        window.mappinmodal_swac_edit_marker_data_options = {
            mainSource: this.marker.feature.set.collection,
            notShownAttrs: {[this.marker.feature.set.collection]: ['id', 'name']},
            allowAdd: true,
            showWhenNoData: true,
            definitions: new Map(),
        }
        // load definitions
        let Model = window.swac.Model;
        let definitionsData;
        try {
            definitionsData = await Model.getValueDefinitions({fromName: this.marker.feature.set.collection});
        } catch (e) {
            Msg.error("Error loading data", e)
        }
        const definitions = [];
        for (let curSet of definitionsData) {
            if (curSet !== null) {
                if (curSet.isIdentity === false) {
                    definitions.push({
                        name: curSet.name,
                        type: curSet.type,
                        isNullable: curSet.isNullable,
                    });
                }
            }
        }
        window.mappinmodal_swac_edit_marker_data_options.definitions.set(this.marker.feature.set.collection, definitions);

        this.mappinmodal.querySelector('.data').appendChild(edit);
        // detect requestor and load component
        let viewHandler = new ViewHandler()
        viewHandler.load(edit);
    }

    /**
     * Dynamically create upload component and slideshow
     */
    async createUploadFileComponent() {
        // create new upload swac component
        const upload = document.createElement('div');
        upload.id = 'mappinmodal_uploadfile';
        upload.classList.add('mappinmodal_uploadfile');
        upload.setAttribute('swa', `Upload`);
        window.mappinmodal_uploadfile_options = {
            uploadTargetURL: this.options.table_names.uploadfile_options.uploadTargetURL,
            docroot: this.options.table_names.uploadfile_options.docroot
        }
        this.mappinmodal.querySelector('.mappinmodal-uploadfiledata').appendChild(upload);
        // detect requestor and load component
        let viewHandler = new ViewHandler()
        viewHandler.load(upload);

        // load images for the slideshow
        try {
            const data = await this.loadFileData(this.marker.feature.set.id);
            for (let curSet of data) {
                if (curSet != undefined) {
                    // gets images linked to the current observed_object
                    let file_data = await this.getFileData(curSet.file_id);
                    for (let file of file_data) {
                        if (file != undefined) {
                            // adds all images stored in the database to the slideshow
                            this.createImageElement(file.path);
                        }
                    }
                }
            }
            const list = document.getElementsByClassName('mappinmodal-slide');
            if (list.length > 0) {
                // set first image to active
                list[0].setAttribute('class', 'mappinmodal-slide active');
            }
            // show prev and next buttons if more than one image
            if (list.length < 2) {
                this.mappinmodal.querySelector('.mappinmodal-button-box').style.display = 'none';
            } else {
                this.mappinmodal.querySelector('.mappinmodal-button-box').style.display = 'flex';
            }
            // set active image index
            this.slideshowCurrentSlide = 0;

        } catch (e) {
            // hide tabs gallery and upload if error occurs while loading
            this.tabShowGallery.style.display = 'none';
            this.tabShowUpload.style.display = 'none';
            Msg.error("Error loading images", e)
        }
    }

    /**
     * Create image element for slideshow
     * @param {*} image_path 
     */
    createImageElement(image_path) {
        let list_element = document.createElement('li');
        let image_element = document.createElement('img')
        image_element.src = window.mappinmodal_uploadfile_options.docroot + image_path;
        image_element.alt = ""
        list_element.style = "width: 300px; object-fit: scale-down";
        if (window.matchMedia('(min-width: 992px)').matches) {
            list_element.style = "width: 500px; object-fit: scale-down";
        }
        list_element.setAttribute('class', 'mappinmodal-slide');
        list_element.appendChild(image_element)
        this.mappinmodal.querySelector('.mappinmodal-slideshow-list').appendChild(list_element);
    }

    /**
     * Gets the file data from the database
     * @param {*} file_id 
     * @returns {file_data} file data
     */
    async getFileData(file_id) {
        let Model = window.swac.Model;

        let dataCapsuleFileOO = {
            fromName: this.options.table_names.file_table.table_name, // Name of the datatable
            fromWheres: {
                filter: this.options.table_names.file_table.idAttr + ',eq,' + file_id
            },
            idAttr: this.options.table_names.file_table.idAttr, // Name of sets attribute that contains the id
            attributeDefaults: new Map(), // Map of attributname / value for default values when the attribute is missing
            attributeRenames: new Map(), // Map of set attributename / wished attributename for renameing attributes
            reloadInterval: 10000, // Time in milliseconds after that the data should be refetched from source
        }
        try {
            // load data from OO table
            let file_data = await Model.load(dataCapsuleFileOO);
            return file_data
        } catch (err) {
            throw new Error("Error loading file data", err);
        }
    }

    /**
     * adds previously uploaded images to the database and slideshow 
     */
    addImageToSlideshow(allFiles) {
        // gets uploaded files from event in the swac upload component
        for (let file of allFiles.detail) {
            if (file.id != undefined) {
                this.saveFile_OO(this.marker.feature.set.id, file.id)
                        .then(() => {
                            // adds uploaded photo to the slideshow
                            this.createImageElement(file.path);
                            const list = document.getElementsByClassName('mappinmodal-slide');
                            if (list.length == 1) {
                                // set uploaded image to active
                                list[0].setAttribute('class', 'mappinmodal-slide active');
                            }
                            // show prev and next buttons if more than one image
                            if (list.length < 2) {
                                this.mappinmodal.querySelector('.mappinmodal-button-box').style.display = 'none';
                            } else {
                                this.mappinmodal.querySelector('.mappinmodal-button-box').style.display = 'flex';
                            }
                            // clears index db
                            this.clearIndexDBData();
                        }).catch(error => {
                    Msg.error('MapPinModalSPL', 'Could not add image to the slideshow >: ' + error);
                });
            }
        }
    }

    /**
     * Gets file reference from joined table
     * @param {*} oo_id 
     * @returns {*} file_oo_data
     */
    async loadFileData(oo_id) {
        // Get the model
        let Model = window.swac.Model;

        let dataCapsuleFileOO = {
            fromName: this.options.table_names.file_join_oo_table.table_name, // Name of the datatable
            fromWheres: {
                filter: this.options.table_names.file_join_oo_table.oo_id + ',eq,' + oo_id
            },
            idAttr: this.options.table_names.file_join_oo_table.idAttr, // Name of sets attribute that contains the id
            attributeDefaults: new Map(), // Map of attributname / value for default values when the attribute is missing
            attributeRenames: new Map(), // Map of set attributename / wished attributename for renameing attributes
            reloadInterval: 10000, // Time in milliseconds after that the data should be refetched from source
        }
        try {
            // load data from file_oo table
            let file_oo_data = await Model.load(dataCapsuleFileOO);
            return file_oo_data
        } catch (err) {
            throw new Error("Error loading file data", err);
        }
    }
    /**
     * Saves file data to database
     * @param {*} oo_id, file_id 
     */
    async saveFile_OO(oo_id, file_id) {
        // Get the model
        let Model = window.swac.Model;

        let dataCapsuleFileOO = {
            fromName: this.options.table_names.file_join_oo_table.table_name,
            data: [{
                    [this.options.table_names.file_join_oo_table.file_id]: file_id,
                    [this.options.table_names.file_join_oo_table.oo_id]: oo_id
                }]
        }
        await Model.save(dataCapsuleFileOO);
    }
    /**
     * clears upload data from index database
     */
    clearIndexDBData() {
        // opens database
        const DBOpenRequest = window.indexedDB.open("upload", 1);
        DBOpenRequest.onsuccess = (event) => {
            // result of opening the database
            let db = DBOpenRequest.result;
            // read/write db transaction
            const transaction = db.transaction(["files"], "readwrite");

            // creates an object store on the transaction
            const objectStore = transaction.objectStore("files");

            // request to clear all the data out of the object store
            const objectStoreRequest = objectStore.clear();
        };
    }
    ;
            /**
             * Close map pin modal.
             * @returns {undefined}
             */
            closeMapPinData() {
        // reset active tab
        this.tabShowMeasurements.classList.add("uk-active");
        this.tabShowGallery.classList.remove("uk-active");
        this.tabShowUpload.classList.remove("uk-active");

        this.map.enableMapInteractions();
        this.mappinmodal.style.display = 'none';
        this.uploadfile.style.display = 'none';

        // delete edit swac component
        const edit = this.mappinmodal.querySelector('.mappinmodal_swac_edit_marker_data');
        if (edit != null)
            edit.swac_comp.delete();
        // delete upload swac component
        const uploadFile = this.mappinmodal.querySelector('.mappinmodal_uploadfile');
        if (uploadFile != null)
            uploadFile.swac_comp.delete();
        // delete slideshow images
        const slideshowImages = this.mappinmodal.querySelector('.mappinmodal-slideshow-list');
        slideshowImages.innerHTML = '';



        // const parent = mappinmodal.parentNode;
        // this.mappinmodal.remove();
        // parent.appendChild(this.mappinmodal);

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
        if(isNaN(inputFloat)) {
            UIkit.modal.alert(window.swac.lang.dict.Worldmap2d_MapPinModal.gps_inputerr);
        }
    }
}