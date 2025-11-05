import SWAC from '../../../../swac.js'
import Plugin from '../../../../Plugin.js'
import Model from '../../../../Model.js';

export default class AreaMarkerSPL extends Plugin {
    constructor(options = {}) {
        super(options)
        this.name = 'Worldmap2d/plugins/AreaMarker'
        this.desc.text = 'Markeable Map'
        this.desc.depends = []
        this.desc.templates = []
        this.desc.templates[0] = {
            name: 'areamarker',
            style: 'areamarker',
            desc: 'Default template for AreaMarker',
        }
        this.desc.opts[0] = {
            name: "areaRequestor",
            desc: "Requestor that gets the areas that should be displayed.",
            example: {
                fromName: 'tbl_area',
                fromWheres: {
                    join: 'tbl_location_join_oo_a,tbl_location'
                }
            }
        };
        if (!options.areaRequestor) {
            this.options.areaRequestor = {
                fromName: 'tbl_area',
                fromWheres: {
                    join: 'tbl_location_join_oo_a,tbl_location'
                }
            };
        }
        this.desc.opts[1] = {
            name: "locationRequestor",
            desc: "Requestor that gets the locations that should be displayed.",
            example: {
                fromName: 'tbl_location'
            }
        };
        if (!options.locationRequestor) {
            this.options.locationRequestor = {
                fromName: 'tbl_location',
                idAttr: 'id'
            };
        }
        this.desc.opts[2] = {
            name: "joinRequestor",
            desc: "Requestor that specifies where the join beween locations and objects can be found .",
            example: {
                fromName: 'tbl_location_join_oo'
            }
        };
        if (!options.joinRequestor) {
            this.options.joinRequestor = {
                fromName: 'tbl_location_join_oo'
            };
        }

        // Internal attributes
        this.save_button = null
        this.toggle_button = null
        this.example_button = null
        this.buttonCloseAreamodal = null;
        this.map = null
        this.mapPin = null
        this.toggleMapPin = null
        this.input_lat = null
        this.input_lng = null
        this.markers = []
        this.markers_feature = []
        this.area_feature = null
        this.createareamodel = null
        this.status = "active"
        this.colors = ["red", "blue", "green"]
    }
    init() {
        return new Promise((resolve, reject) => {
            this.map = this.requestor.parent.swac_comp

            this.save_button = this.requestor.parent.querySelector(
                    '.savebutton'
                    )
            this.mapPin = this.save_button.querySelector(
                    '.savebutton-map-pin'
                    )
            L.DomEvent.on(this.save_button, 'click', L.DomEvent.stopPropagation)

            this.save_button.onclick = () => {
                this.save_modal()
            }

            this.toggle_button = this.requestor.parent.querySelector(
                    '.toggleeditorbutton'
                    )
            this.toggleMapPin = this.toggle_button.querySelector(
                    '.toggleeditorbutton-map-pin'
                    )
            L.DomEvent.on(this.toggle_button, 'click', L.DomEvent.stopPropagation)

            this.toggle_button.onclick = () => {
                this.toggle()
            }
            this.example_button = this.requestor.parent.querySelector(
                    '.examplebutton'
                    )
            L.DomEvent.on(this.example_button, 'click', L.DomEvent.stopPropagation)
            this.example_button.onclick = () => {
                this.example()
            }
            document.addEventListener(
                    'swac_' + this.requestor.parent.id + '_map_click',
                    (e) => {
                this.onMapClick(e)
            }
            )
            document.addEventListener('swac_' + this.requestor.parent.id + '_marker_click', (e) => {
                this.onMarkerClick(e)
            });
            this.createareamodal = this.requestor.parent.querySelector('.createareamodal');
            this.input_name = this.createareamodal.querySelector('.createareamodal-name');
            this.input_description = this.createareamodal.querySelector('.createareamodal-description');
            this.select_color = this.createareamodal.querySelector('.createareamodal-color');


            // get close areamodal menu button
            this.buttonCloseAreamodal = this.createareamodal.querySelector('.createareamodal-button-close');
            this.buttonCloseAreamodal.onclick = () => this.closeModal();
            L.DomEvent.on(this.buttonCloseAreamodal, 'click', L.DomEvent.stopPropagation);


            // hide modal initially
            this.createareamodal.style.display = 'none';

            this.createareamodal.onclick = (e) => {
                if (e.target.closest('.createareamodal-box') == null) {
                    this.closeModal();
                    this.clearInputs();
                }
            };
            //the back button closes the window and removes the temporary marker
            const backbutton = this.createareamodal.querySelector('.createareamodal-back-button');
            backbutton.onclick = () => {
                this.closeModal();
                this.clearInputs();
            };

            const form = this.createareamodal.querySelector('.createareamodal-form');
            form.onsubmit = (e) => {
                e.preventDefault();
                this.save()

                this.map.enableMapInteractions();
                this.createareamodal.style.display = 'none';
            };

            this.buttonCloseAreamodal = this.createareamodal.querySelector('.createareamodal-button-close');
            this.buttonCloseAreamodal.onclick = () => this.closeModal();
            L.DomEvent.on(this.buttonCloseAreamodal, 'click', L.DomEvent.stopPropagation);

            L.DomEvent.on(this.createareamodal, 'click', L.DomEvent.stopPropagation);

            this.createAreas_from_data()
            //this.deleteArea(20)
            resolve()
        })
    }
    /**
     * Load the Areas from the datasources option.
     */
    async createAreas_from_data() {
        console.log('------- Create Areas from data')
        let Model = window.swac.Model;
        let map = this.map;
        let marker = this.marker
        let markers = []
        let area = this.area
        //TODO Load Data oder getData
        let dataPromise = Model.load(this.options.areaRequestor)
        await dataPromise.then(function (data) {
            for (let curData of data) {
                if (!curData)
                    continue
                for (let loc of curData.tbl_location) {
                    marker = map.addMarker({
                        type: "Feature",
                        geometry: {
                            type: "Point",
                            coordinates: [parseFloat(loc.longitude), parseFloat(loc.latitude)]
                        },
                        set: {swac_fromName: curData.name, id: loc.id}
                    })
                    markers.push([marker._latlng.lat, marker._latlng.lng])
                }
                markers = Array.from(new Set(markers.map(JSON.stringify))).map(
                        JSON.parse
                        )
                let color = "blue"
                if (curData.color) {
                    color = curData.color
                }
                area = map.addArea({
                    type: 'Feature',
                    geometry: {
                        type: 'Area',
                        coordinates: markers
                    },
                    set: {swac_fromName: curData.name + '_area', id: -1 * curData.id},
                }, color)
                markers = []
            }
        }).catch(function (err) {
            console.log("Fehler")
            console.log(err)
        })
    }
    /**
     * Handles Click on Map. Marker are set and Area is (re)calculated if more than two markers are set.
     * @param {*} event 
     * @returns 
     */
    onMapClick(event) {
        const e = event.detail
        this.input_lat = e.latlng.lat
        this.input_lng = e.latlng.lng
        this.marker = this.map.addMarker({
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [e.latlng.lng, e.latlng.lat],
            },
            set: {swac_fromName: 'unsaved_points', id: this.markers.length},
        })
        this.markers_feature.push(this.marker)
        this.markers.push([this.input_lat, this.input_lng])
        if (this.markers.length < 3)
            return
        this.markers = Array.from(new Set(this.markers.map(JSON.stringify))).map(
                JSON.parse
                )

        this.area_feature = this.map.addArea({
            type: 'Feature',
            geometry: {
                type: 'Area',
                coordinates: this.markers,
            },
            set: {swac_fromName: 'unsaved_area', id: -1},
        }, "blue")
    }
    /**
     * Enables the Area Save Modal if more than 2 Markers are set.
     */
    async save_modal() {
        if (this.markers.length < 3) {
            console.log('Zu wenige Marker')
            return
        }
        this.createareamodal.style.display = 'flex';
    }
    async save() {
        console.log("save")
        let Model = window.swac.Model
        /*
         let dataPromise = Model.load(this.options.areaRequestor)
         let areaId = await dataPromise.then(function(data) {
         let tmpId = 0
         for (let curData of data) {
         if (!curData)
         continue
         if (curData.id > tmpId) {
         tmpId = curData.id
         }
         }
         return tmpId
         })
         dataPromise = Model.load(this.options.datasources.get("tbl_location").datacapsule)
         let locationId = await dataPromise.then(function(data) {
         let tmpId = 0
         for (let curData of data) {
         if (!curData)
         continue
         if (curData.id > tmpId) {
         tmpId = curData.id
         }
         }
         return tmpId
         })
         dataPromise = Model.load(this.options.datasources.get("tbl_location_join_oo_a").datacapsule)
         let locationOOId = await dataPromise.then(function(data) {
         let tmpId = 0
         for (let curData of data) {
         if (!curData)
         continue
         if (curData.id > tmpId) {
         tmpId = curData.id
         }
         }
         return tmpId
         })*/

        if (!(this.select_color in this.select_color)) {
            this.select_color = "red"
        }

        let areaId = await Model.save({
            fromName: this.options.areaRequestor.fromName,
            data: [{
                    //"id":areaId+1,
                    "name": this.input_name.value,
                    "description": this.input_description.value,
                    "color": this.select_color
                }]
        })
        let locationId = -1
        for (let marker of this.markers) {
            locationId = await Model.save({
                fromName: this.options.locationRequestor.fromName,
                data: [{
                        "name": this.input_name.value,
                        "latitude": marker[0],
                        "longitude": marker[1]
                    }]
            })
            await Model.save({
                fromName: this.options.joinRequestor.fromName,
                data: [{
                        "loc_id": locationId[0].data[0].id,
                        "oo_id": areaId[0].data[0].id
                    }]
            })
        }
    }

    async toggle() {
        console.log('toggle')
        if (this.status == "active") {
            this.status = "inactive"
            this.map.disableMapInteractions();
        } else if (this.status == "inactive") {
            this.status = "active"
            this.map.enableMapInteractions()
        }
    }

    clearInputs() {
        this.input_name.value = '';
        this.input_description.value = '';
        this.select_type.swac_comp.setInputs({"": true});
    }

    closeModal() {
        this.map.removeArea(this.markers_feature, this.area_feature)
        this.markers = []
        this.map.enableMapInteractions();
        this.createareamodal.style.display = 'none';
    }
    async onMarkerClick(event) {
        console.log("Marker, but not area Click")
    }
    async deleteArea(id) {
        let dataPromise = Model.load(this.options.joinRequestor)

        await dataPromise.then(function (data) {
            for (let curData of data) {
                if (!curData)
                    continue
                if (curData.oo_id != id)
                    continue
                Model.delete({
                    data: [{"id": curData.id}],
                    fromName: "tbl_location_join_oo_a"
                })
            }
            Model.delete({
                data: [{"id": id}],
                fromName: this.options.areaReqeustor.fromName
            })
        })
    }
    /**
     * Example Function for Custom Functions to divide the Polygons
     */
    async example() {
        let sumLat = 0;
        let sumLong = 0;

        let dataPromise = Model.load(this.options.areaRequestor)
        let markers = await dataPromise.then(function (data) {
            data = data.filter(function (element) {
                return element !== undefined;
            });
            return data[0].tbl_location
        })

        for (let i = 0; i < markers.length; i++) {
            sumLat += parseFloat(markers[i].latitude); // Latitude
            sumLong += parseFloat(markers[i].longitude); // Longitude
        }

        const averageLat = sumLat / markers.length;
        const averageLong = sumLong / markers.length;

        this.map.addMarker({
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [parseFloat(averageLong), parseFloat(averageLat)]
            },
            set: {swac_fromName: "center", id: -999}
        })
    }
}