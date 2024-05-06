import SWAC from '../../../../swac.js';
import Msg from '../../../../Msg.js';
import Plugin from '../../../../Plugin.js';
import ViewHandler from '../../../../ViewHandler.js';

/* 
 * This plugin allows to create measurement points by clicking into the map.
 */
export default class CreateMeasurementModalSPL extends Plugin {
    constructor(options = {}) {
        super(options);
        this.name = 'Worldmap2d/plugins/CreateMeasurementModal';
        this.desc.text = 'When clicked on the map, this plugin shows the menu to create a new measurement point.';

        this.desc.templates[0] = {
            name: 'createmeasurementmodal',
            style: 'createmeasurementmodal',
            desc: 'Default template for CreateMeasurementModal',
        };

        this.desc.opts[0] = {
            name: 'datacapsuleLoad',
            desc: 'Data to load new added marker',
            example: {
                datacapsule: {
                    fromName: '',
                    fromWheres: {
                        join: '',
                    },
                },
            }
        };
        if (!options.datacapsuleLoad)
            this.options.datacapsuleLoad = null;

        this.desc.opts[1] = {
            name: 'createOoWithLocation',
            desc: 'Data to save new added marker in database',
            example: {
                createOoWithLocation: {
                    fromName: '',
                    responseIdAttr: '',
                    ooName: '',
                    ooDescription: '',
                    ooType: '',
                    ooCompleted: '',
                    ooCollection: '',
                    locLatitude: '',
                    locLongitude: '',
                    locName: '',
                    locDescription: '',
                }
            }
        };
        if (!options.createOoWithLocation)
            this.options.createOoWithLocation = null;

        this.desc.opts[2] = {
            name: 'typeDatasource',
            desc: 'Filter options as json object',
            example: [
                {
                    id: 1,
                    name: 'option1,'
                },
                {
                    id: 2,
                    name: 'option2,'
                },
                {
                    id: 3,
                    name: 'option3,'
                }
            ]
            
        };

        if (!options.typeDatasource)
            this.options.typeDatasource = 'observedobjecttype/listMeasureing';

        
        // Attributes for internal usage
        this.createmeasurementmodal = null;
        this.buttonCloseMeasurementmodal = null;
        this.marker = null;
        this.input_lat = null;
        this.input_lng = null;
        this.input_name = null;
        this.input_description = null;
        this.select_status = null;
        this.select_type = null;
        this.map = null;
    }

    init() {
        return new Promise((resolve, reject) => {
            this.map = this.requestor.parent.swac_comp;

            document.addEventListener('swac_' + this.requestor.parent.id + '_map_click', (e) => {
            this.onMapClick(e);
            })

            this.createmeasurementmodal = this.requestor.parent.querySelector('.createmeasurementmodal');
            this.input_lat = this.createmeasurementmodal.querySelector('.createmeasurementmodal-lat');
            this.input_lng = this.createmeasurementmodal.querySelector('.createmeasurementmodal-lng');
            this.input_name = this.createmeasurementmodal.querySelector('.createmeasurementmodal-name');
            this.input_description = this.createmeasurementmodal.querySelector('.createmeasurementmodal-description');
            this.input_collection = this.createmeasurementmodal.querySelector('.createmeasurementmodal-collection');
            this.select_status = this.createmeasurementmodal.querySelector('.createmeasurementmodal-status');

            // dynmically import type selection with select comp for measurement point based on datasource
            const type_placeholder = this.createmeasurementmodal.querySelector('.createmeasurementmodal-type-placeholder');
            this.select_type = document.createElement('div');
            this.select_type.setAttribute('id', 'createmeasurementmodal-type');
            this.select_type.setAttribute('class', 'createmeasurementmodal-type swac_select uk-margin-small-bottom');
            this.select_type.setAttribute('swa', 'Select FROM ' + this.options.typeDatasource);
            type_placeholder.appendChild(this.select_type);
            let viewHandler = new ViewHandler()
            viewHandler.load(this.select_type);

            // get close measurementmodal menu button
            this.buttonCloseMeasurementmodal = this.createmeasurementmodal.querySelector('.createmeasurementmodal-button-close');
            this.buttonCloseMeasurementmodal.onclick = () => this.closeModal(); 
            L.DomEvent.on(this.buttonCloseMeasurementmodal, 'click', L.DomEvent.stopPropagation);


            // hide modal initially
            this.createmeasurementmodal.style.display = 'none';
            L.DomEvent.on(this.createmeasurementmodal, 'click', L.DomEvent.stopPropagation);


            //when window is opened, a click outside of the window should close it and remove the temporary marker.
            this.createmeasurementmodal.onclick = (e) => {
                if (e.target.closest('.createmeasurementmodal-box') == null) {
                    this.closeModal();
                    this.clearInputs();
                }
            };

            //when changing the input fields, the temporary marker is replaced to match new coordinates.
            this.input_lat.onchange = this.updateMarker.bind(this);
            this.input_lng.onchange = this.updateMarker.bind(this);

            //the back button closes the window and removes the temporary marker
            const backbutton = this.createmeasurementmodal.querySelector('.createmeasurementmodal-back-button');
            backbutton.onclick = () => {
                this.closeModal();
                this.clearInputs();
            }; 

            const form = this.createmeasurementmodal.querySelector('.createmeasurementmodal-form');
            form.onsubmit = (e) => {
                e.preventDefault();
                this.map.enableMapInteractions();
                //if needed table names not defined, point cannot be saved and thus not created
                if(this.options.createOoWithLocation && this.options.datacapsuleLoad) {
                    this.save();
                } else {
                     Msg.info(`CreateMeasurementModalSPL","Required table name for creating a measurement point not in ${this.requestor.id} options defined`);
                }
                
                this.createmeasurementmodal.style.display = 'none';
            };
            resolve();
        });
    }

    // handler fn for map click event
    onMapClick(e) {
        if(this.options.datacapsuleLoad) {
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
                set: {swac_fromName: this.options.datacapsuleLoad.fromName, id: -1},
            }
            );
            this.createmeasurementmodal.style.display = 'flex';
        } else {
                Msg.info(`CreateMeasurementModalSPL","Required datacapsule for creating a measurement point not in ${this.requestor.id} options defined. Define 'datacapsuleLoad'`);
        }
    }

    /**
     * updates the marker to the current longitude/latitude from the input fields
     * moves the map to the new marker position
     */
    updateMarker() {
        this.marker.setLatLng([this.input_lat.value, this.input_lng.value]);
        this.marker.feature.geometry.coordinates = [this.input_lng.value, this.input_lat.value];
        this.map.viewer.panTo({ lat: this.input_lat.value, lng: this.input_lng.value });
    }

    // save new measurement point to database
    async save() {
        let Model = window.swac.Model;
        const typeId = this.select_type.swac_comp.getInputs();
        if (typeId.length != 1) {
            // remove tempory marker
            this.map.removeMarker(this.marker);
            UIkit.notification({
                message: "Fehler: Bitte einen Messpunkttypen auswählen",
                status: 'info',
                timeout: SWAC.config.notifyDuration,
                pos: 'top-center'
            });
            return;
        }

        await Model.save({
            fromName: this.options.createOoWithLocation.fromName,
            data: [{
                    [this.options.createOoWithLocation.ooName]: this.input_name.value,
                    [this.options.createOoWithLocation.ooDescription]: this.input_description.value,
                    [this.options.createOoWithLocation.ooType]: typeId[0].value,
                    [this.options.createOoWithLocation.ooCompleted]: this.select_status.value,
                    [this.options.createOoWithLocation.ooCollection]: this.input_collection.value.toLowerCase(),
                    [this.options.createOoWithLocation.locLatitude]: this.input_lat.value,
                    [this.options.createOoWithLocation.locLongitude]: this.input_lng.value,
                    [this.options.createOoWithLocation.locName]: this.input_name.value,
                    [this.options.createOoWithLocation.locDescription]: this.input_description.value
                }],
        })
        .then((res) => {
            // remove tempory marker
            this.map.removeMarker(this.marker);

            // TODO JOIN + FILTER does not work
            // const data = {...this.options.datacapsuleLoad};
            // data.fromWheres.filter = 'id,eq,' + res[0]?.data[this.options.createOoWithLocation.responseIdAttr]

            // load new inserted data to add marker to map
            Model.load(this.options.datacapsuleLoad, this);
        })
        .catch((e) => {
            Msg.error('Error saving measurement point', e)
            // remove tempory marker
            this.map.removeMarker(this.marker);
        });
        this.clearInputs();
    }

    clearInputs() {
        this.input_name.value = '';
        this.input_description.value = '';
        this.input_collection.value = '';
        this.select_status.value = 'false';
        this.select_type.swac_comp.setInputs({"": true});
    }

    closeModal() {
        this.map.removeMarker(this.marker);
        this.map.enableMapInteractions();
        this.createmeasurementmodal.style.display = 'none';
    }

}

