import SWAC from '../../../../swac.js';
import Plugin from '../../../../Plugin.js';
import Msg from '../../../../Msg.js';

export default class NavigationSPL extends Plugin {
    constructor(options = {}) {
        super(options);
        this.name = 'Worldmap2d/plugins/Navigation';
        this.desc.text = 'Plugin to navigate on map.';

        this.desc.depends[0] = {
            name: 'leaflet-routing-maschine.js',
            path: SWAC.config.swac_root + 'libs/leaflet/leaflet-routing-maschine.js',
            desc: 'Style file for leaflet'
        };
        this.desc.depends[1] = {
            name: 'leaflet-routing-maschine CSS',
            path: SWAC.config.swac_root + 'libs/leaflet/leaflet-routing-maschine.css',
            desc: 'Style file for leaflet'
        };

        this.desc.templates[0] = {
            name: 'navigation',
            style: 'navigation',
            desc: 'Default template for Navigation',
        };

        this.desc.opts[0] = {
            name: "createRouteFromData",
            desc: "If true every dataset added creates a route from last dataset"
        };
        if (typeof options.createRouteFromData !== 'boolean')
            this.options.createRouteFromData = false;

        this.desc.opts[1] = {
            name: "minDistanceBetweenTwoPoints",
            desc: "Minimum distance between two points to create a route. Distance is in meters."
        }
        if (!options.minDistanceBetweenTwoPoints)
            this.options.minDistanceBetweenTwoPoints = 50;

        this.desc.opts[2] = {
            name: "searchurl",
            desc: "URL where to send the search request. Be aware that most APIs do not allow CORS requests. So you have to use a proxy.",
            example: 'https://photon.komoot.io/api/'
        }
        if (!options.searchurl)
            this.options.searchurl = 'http://localhost:8080/SmartData/smartdata/proxy/get?url=https://nominatim.openstreetmap.org/search';


        // Attributes for internal usage
        this.map = null;
        this.navigationMenu = null;
        this.menuOpened = false;
        this.lastaddedset = null;
        this.navigationobj = {
            start: null,
            destination: null,
            route: null,
        }
        this.startInput = null;
        this.destinationInput = null;
        this.destinationIcon = null;
        this.navigation_click_evts = null;
        this.instructionsElem = null;
    }

    init() {
        return new Promise((resolve, reject) => {
            this.map = this.requestor.parent.swac_comp.viewer;

            //get all html-elements
            let pluginArea = this.requestor.parent.querySelector('.navigation');
            let sidebarButton = pluginArea.querySelector('.sidebar-button');
            this.navigationMenu = this.requestor.parent.querySelector('.navigation-menu');
            this.startInput = this.navigationMenu.querySelector('.navigation-start-input');
            this.destinationInput = this.navigationMenu.querySelector('.navigation-destination-input');
            let userLocationButton = this.navigationMenu.querySelector('.navigation-user-location-button');
            let startRoutingButton = this.navigationMenu.querySelector('.navigation-routing-start-button');
            let endRoutingButton = this.navigationMenu.querySelector('.navigation-routing-end-button');
            let siwtchStartDestinationButton = this.navigationMenu.querySelector('.navigation-switch-button');
            this.instructionsElem = this.navigationMenu.querySelector('.navigation-instructions');

            // initialize all html-elements
            this.navigationMenu.style.display = 'none';

            this.startInput.addEventListener('change', (e) => {
                if (e.target.value == "") {
                    this.navigationobj.start = null;
                    return;
                }
                this.name2Coordinates(e.target.value)
                        .then((feature) => {
                            this.navigationobj.start = {
                                lat: feature.geometry.coordinates[1],
                                lng: feature.geometry.coordinates[0]
                            }
                        })
                        .catch((err) => {
                            this.navigationobj.start = null;
                        });
            });

            this.destinationInput.addEventListener('change', (e) => {
                if (e.target.value == "") {
                    this.navigationobj.destination = null;
                    return;
                }
                this.name2Coordinates(e.target.value)
                        .then((feature) => {
                            this.navigationobj.destination = {
                                lat: feature.geometry.coordinates[1],
                                lng: feature.geometry.coordinates[0]
                            }
                        })
                        .catch((err) => {
                            this.navigationobj.destination = null;
                        });
            });

            userLocationButton.addEventListener('click', (e) => {
                const swac_worldmap2d = this.requestor.parent.swac_comp;
                if (!swac_worldmap2d.lastReceivedPosition) {
                    UIkit.notification({
                        message: 'Bitte erlaube die Nutzung deiner Geolocation',
                        status: 'info',
                        timeout: SWAC.config.notifyDuration,
                        pos: 'top-center'
                    });
                    return;
                }
                this.navigationobj.start = {
                    lat: swac_worldmap2d.lastReceivedPosition.latitude,
                    lng: swac_worldmap2d.lastReceivedPosition.longitude,
                }
                this.startInput.value = "Mein Standort";
                return;
            });

            this.startInput.addEventListener('focusin', (e) => {
                this.lastFocusedInput = this.startInput;
                userLocationButton.style.display = 'block';
            })
            this.destinationInput.addEventListener('focusin', (e) => {
                this.lastFocusedInput = this.destinationInput;
                userLocationButton.style.display = 'block';
            })

            startRoutingButton.addEventListener('click', (e) => {
                this.startNavigation();
            });
            endRoutingButton.addEventListener('click', (e) => {
                this.stopNavigation();
            });

            siwtchStartDestinationButton.addEventListener('click', (e) => {
                let tmp = this.navigationobj.start;
                this.navigationobj.start = this.navigationobj.destination;
                this.navigationobj.destination = tmp;
                tmp = this.startInput.value;
                this.startInput.value = this.destinationInput.value;
                this.destinationInput.value = tmp;
            });

            //disable map interactions
            L.DomEvent.disableClickPropagation(pluginArea, 'click', L.DomEvent.stopPropagation);
            L.DomEvent.disableClickPropagation(pluginArea, 'dblclick', L.DomEvent.stopPropagation);

            //plugin menu closes when pressing X button
            this.navigationMenu.querySelector('.navigation-button-close').onclick = this.toggleMenu.bind(this);

            //setup button for opening and closing the menu
            sidebarButton.onclick = this.toggleMenu.bind(this);

            // click events for navigation plugin
            this.navigation_click_evts = {
                'click': (e) => {
                    if (!this.navigationobj.start && !this.navigationobj.destination) {
                        this.navigationobj.start = e.latlng;
                        this.startInput.value = e.latlng.lat + ', ' + e.latlng.lat;
                        this.coordinates2Name(e.latlng.lat, e.latlng.lng)
                                .then((name) => this.startInput.value = name);
                        return;
                    }
                    if (!this.navigationobj.start) {
                        this.navigationobj.start = e.latlng;
                        this.startInput.value = e.latlng.lat + ', ' + e.latlng.lat;
                        this.coordinates2Name(e.latlng.lat, e.latlng.lng)
                                .then((name) => this.startInput.value = name);
                        return;
                    }
                    if (!this.navigationobj.destination) {
                        this.navigationobj.destination = e.latlng;
                        this.destinationInput.value = e.latlng.lat + ', ' + e.latlng.lat;
                        this.coordinates2Name(e.latlng.lat, e.latlng.lng)
                                .then((name) => this.destinationInput.value = name);
                        return;
                    }
                },
                'markerclick': (e) => {
                    // marker -> e.target
                    const name = e.target.feature.set?.name ? e.target.feature.set.name : 'Map Pin';
                    const latlng = {lat: e.target.feature?.geometry?.coordinates[1], lng: e.target.feature?.geometry?.coordinates[0]};
                    if (!this.navigationobj.start && !this.navigationobj.destination) {
                        this.navigationobj.start = latlng;
                        this.startInput.value = name;
                        return;
                    }
                    if (!this.navigationobj.start) {
                        this.navigationobj.start = latlng;
                        this.startInput.value = name;
                        return;
                    }
                    if (!this.navigationobj.destination) {
                        this.navigationobj.destination = latlng;
                        this.destinationInput.value = name;
                        return;
                    }
                },
            }

            /*
            document.addEventListener(
                `swac_Component_${this.requestor.parent.id}_lastSetFromRequestAdded`,
                () => {

                    // Wie viele Punkte überspringen?
                    // Example: 5 = nur jeder 5. Marker wird gesendet
                    const datapointDensity = 5;

                    setTimeout(() => {

                        console.warn("NavigationSPL — ALL DATA LOADED EVENT FIRED");

                        const comp = this.requestor.parent.swac_comp;

                        // Snapshot
                        const markers = [...comp.markersArray];
                        console.warn("Marker gesamt:", markers.length);

                        const waypoints = [];

                        for (let i = 0; i < markers.length; i++) {
                            const marker = markers[i];

                            // --- Dichtefilter ---
                            if (i % datapointDensity !== 0) continue;

                            if (!marker?._latlng) {
                                console.warn("Marker ohne LatLng übersprungen:", marker);
                                continue;
                            }

                            waypoints.push(
                                L.latLng(marker._latlng.lat, marker._latlng.lng)
                            );
                        }

                        console.warn(`Waypoints nach Dichtefilter (${datapointDensity}):`, waypoints.length);
                        console.warn(waypoints);

                        if (waypoints.length < 2) {
                            console.error("Nicht genug Waypoints für Routing.");
                            return;
                        }

                        L.Routing.control({
                            waypoints,
                            router: L.routing.osrmv1({
                                serviceUrl: 'https://router.project-osrm.org/route/v1',
                                profile: 'foot'   // 'car', 'bike', 'foot'
                            }),
                            draggableWaypoints: false,
                            addWaypoints: false,
                            show: false,
                            createMarker: () => null
                        }).addTo(comp.viewer);

                    }, 2000);
                }
            );
            */
            resolve();
        });
    }

    afterAddSet(set, repeateds) {
        // 0 = Classic, 1 = Polyline, 2 = Fast Route
        let routingMethod = 1;

        // if routingMethod is classic use this
        if (this.options.createRouteFromData && routingMethod === 0) {
            if (!this.lastaddedset) {
                // On first added set do not create route, notice only
                this.lastaddedset = set;
            } else {
                let comp = this.requestor.parent.swac_comp;
                let route = [];
                route.push(L.latLng(this.lastaddedset[comp.options.latAttr],this.lastaddedset[comp.options.lonAttr]))
                route.push(L.latLng(set[comp.options.latAttr], set[comp.options.lonAttr]))
                L.Routing.control({
                    waypoints: route,
                    draggableWaypoints: false,
                    addWaypoints: false,
                    show: false,
                    createMarker: () => {
                        return null;
                    }
                }).addTo(comp.viewer);
            }
        }

        // if routingMethod is polyline use this
        if (!this.options.createRouteFromData || routingMethod !== 1)
            return;

        let comp = this.requestor.parent.swac_comp;

        // Erste Punkt -> nur speichern
        if (!this.lastaddedset) {
            this.lastaddedset = set;
            return;
        }

        // Koordinaten ermitteln
        const lat1 = this.lastaddedset[comp.options.latAttr];
        const lon1 = this.lastaddedset[comp.options.lonAttr];

        const lat2 = set[comp.options.latAttr];
        const lon2 = set[comp.options.lonAttr];

        // Validierung
        if (!lat1 || !lon1 || !lat2 || !lon2) {
            console.warn("Polyline skipped — invalid coordinates:", { lat1, lon1, lat2, lon2 });
            this.lastaddedset = set;
            return;
        }

        // Polyline erstellen anstatt RoutingMachine
        const poly = L.polyline(
            [
                [lat1, lon1],
                [lat2, lon2]
            ],
            {
                color: "red",
                weight: 4,
                opacity: 0.9
            }
        );

        poly.addTo(comp.viewer);

        // Letzten Punkt aktualisieren
        this.lastaddedset = set;
    }

    /**
     * Toggles the menu
     */
    toggleMenu() {
        if (this.menuOpened) {
            this.navigationMenu.style.display = "none";
        } else {
            this.navigationMenu.style.removeProperty('display');
        }
        this.menuOpened = !this.menuOpened;
        this.overwriteLeafletEvents();
    }

    /**
     * Starts the routing
     */
    startNavigation() {
        if (!this.navigationobj.start || !this.navigationobj.destination || this.navigationobj.route) {
            return;
        }
        if (this.options.minDistanceBetweenTwoPoints >= this.calculateDistance(this.navigationobj.start.lat, this.navigationobj.start.lng, this.navigationobj.destination.lat, this.navigationobj.destination.lng) * 1000) {
            UIkit.notification({
                message: `Punkte müssen über ${this.options.minDistanceBetweenTwoPoints} Meter entfernt sein, um Navigation zu starten.`,
                status: 'info',
                timeout: SWAC.config.notifyDuration,
                pos: 'top-center'
            });
            return;
        }
        let route = [];
        route.push(L.latLng(this.navigationobj.start.lat, this.navigationobj.start.lng));
        route.push(L.latLng(this.navigationobj.destination.lat, this.navigationobj.destination.lng));
        this.navigationobj.route = L.Routing.control({
            formatter: new L.Routing.Formatter(),
            waypoints: route,
            draggableWaypoints: false,
            addWaypoints: false,
            show: false,
            language: swac.lang.activeLang,
            createMarker: () => {
                return null;
            }
        })
                .on('routeselected', (e) => {
                    e.route.instructions.forEach((i) => {
                        const instruction = document.createElement('tr');
                        const td = document.createElement('td');
                        td.innerHTML = this.navigationobj.route.options.formatter.formatInstruction(i);
                        instruction.appendChild(td);
                        this.instructionsElem.appendChild(instruction);
                    })
                })
                .addTo(this.map);

        this.destinationIcon = L.marker(this.navigationobj.destination, {
            icon: L.divIcon({
                html: '<div class="pulse"></div>',
                className: 'css-icon',
                iconSize: [22, 22],
                iconAnchor: [15, 15],
            }),
            zIndexOffset: 1000,
        }).addTo(this.map);
    }

    /**
     * Disables any active navigation.
     */
    stopNavigation() {
        if (this.navigationobj.route) {
            this.navigationobj.route.remove();
            this.navigationobj.route = null;
        }
        this.navigationobj.start = null;
        this.navigationobj.destination = null;
        this.startInput.value = "";
        this.destinationInput.value = "";
        if (this.destinationIcon) {
            this.destinationIcon.remove();
            this.destinationIcon = null;
        }
        this.instructionsElem.innerHTML = "";
    }

    /**
     * Overrides leaflet events to use maps clicks when navigation menu state is open
     */
    overwriteLeafletEvents() {
        const swac_worldmap2d = this.requestor.parent.swac_comp;
        if (this.menuOpened) {
            swac_worldmap2d.viewer.off('click', swac_worldmap2d.map_click_evts.click)
            swac_worldmap2d.viewer.on('click', this.navigation_click_evts.click)
            const sets = Object.keys(swac_worldmap2d.markers)
            sets.forEach((key) => {
                const markers = swac_worldmap2d.markers[key]
                markers.forEach((marker) => {
                    marker.off('click', swac_worldmap2d.map_click_evts.markerclick)
                    marker.on('click', this.navigation_click_evts.markerclick)
                })
            })
        } else {
            swac_worldmap2d.viewer.off('click', this.navigation_click_evts.click)
            swac_worldmap2d.viewer.on('click', swac_worldmap2d.map_click_evts.click)
            const sets = Object.keys(swac_worldmap2d.markers)
            sets.forEach((key) => {
                const markers = swac_worldmap2d.markers[key]
                markers.forEach((marker) => {
                    marker.off('click', this.navigation_click_evts.markerclick)
                    marker.on('click', swac_worldmap2d.map_click_evts.markerclick)
                })
            })
        }
    }

    /* 
     * Calls the API to find a place with given name.
     * @param {String} searchValue Name that will be searched for
     */
    async name2Coordinates(searchValue) {
        return new Promise((resolve, reject) => {
            searchValue = encodeURIComponent(searchValue);
            let Model = window.swac.Model;
            let dataCapsule = {
                fromName: this.options.searchurl,
                fromWheres: {
                    q: searchValue,
                    format: 'geojson',
                    limit: 1
                }
            };
            Model.load(dataCapsule).then((data) => {
                for (let curSet of data) {
                    if (curSet !== undefined) {
                        let features = curSet.features;
                        if (features.length > 0) {
                            let feature = features[0];
                            resolve(feature);
                        } else {
                            reject("no results found");
                        }
                    }
                }
            }).catch((error) => {
                reject(error);
            });
        });
    }

    /* 
     * Calls the API to find a place with given latlng.
     * @param {float} lat Latitude of the location
     * @param {float} lng Longitude of the location
     */
    async coordinates2Name(lat, lng) {
        return new Promise((resolve, reject) => {
            let Model = window.swac.Model;
            let dataCapsule = {
                fromName: "https://nominatim.openstreetmap.org/reverse",
                fromWheres: {
                    lat: lat,
                    lon: lng,
                    format: 'json',
                }
            };
            Model.load(dataCapsule).then((data) => {
                for (let curSet of data) {
                    if (curSet !== undefined) {
                        resolve(curSet.display_name)
                    }
                }
            }).catch((error) => {
                reject(error);
            });
        });
    }

    /**
     * Sets the navigation target to the new target object.
     * @param {number} id ID of the target object.
     */
    setNavigationTargetObject(id) {
        //TODO this method has to be rewritten useing a marking select on map
        // Activate location service if not active
        if (objectmap.currentLocationMarker === null) {
            document.querySelector('#watchPosition').checked = true;
            objectmap.toggleWatchPosition();
        }

        let targetObject = objectMapWithLocation.get(id);
        objectmap.currentTargetMarker = targetObject.getMarker();
        let navigationInfo = document.querySelector('#navigationInfo');
        navigationInfo.classList.remove('display-none');
        navigationInfo.setAttribute('uk-tooltip', 'title: Sie navigieren zu: >' + targetObject.getName() + '<. Klicken Sie hier um die Navigation zu beenden; pos: bottom-right');
        navigationInfo.addEventListener('click', objectmap.disableActiveNavigation);

        objectmap.map.closePopup();
    }

    /**
     *	Rotates the arrow towards the target.
     * @param  {Object} startlocation LatLng of the starting location
     * @param  {number} startlocation.lat Latitude
     * @param  {number} startlocation.lng Longitude
     * @param  {Object} targetlocation LatLng of the target location
     * @param  {number} targetlocation.lat Latitude
     * @param  {number} targetlocation.lng Longitude
     */
    calculateArrowRotation(startlocation, targetlocation) {
        let currentLatitude = startlocation.lat;
        let currentLongitude = startlocation.lng;

        let destinationLatitude = targetlocation.lat;
        let destinationLongitude = targetlocation.lng;

        let arrowAngle = this.calculateBearing(currentLatitude, currentLongitude, destinationLatitude, destinationLongitude);

        // Legenden Pfeil
        let arrowElem = this.requestor.parent.querySelector('navigation-arrow');
        arrowElem.style['transform'] = 'rotate(' + arrowAngle + 'deg)';
    }

    /**
     *	Calculates the direction(Degree 0 - 360) between two locations
     *
     * @param  {float} lat1 - Latitude of the first Location
     * @param  {float} lng1 - Longitude of the first Location
     * @param  {float} lat2 - Latitude of the second Location
     * @param  {float} lng2 - Longitude of the second Location
     * @return {float} Degree
     */
    calculateBearing(lat1, lng1, lat2, lng2) {
        function toRad(deg) {
            return deg * Math.PI / 180;
        }

        function toDeg(rad) {
            return rad * 180 / Math.PI;
        }

        let dLon = toRad(lng2 - lng1);
        lat1 = toRad(lat1);
        lat2 = toRad(lat2);
        let y = Math.sin(dLon) * Math.cos(lat2);
        let x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
        let rad = Math.atan2(y, x);
        let brng = toDeg(rad);
        return (brng + 360) % 360;
    }

    /**
     * Calculates the distance between two points
     * 
     * @param  {float} lat1 - Latitude of the first Location
     * @param  {float} lng1 - Longitude of the first Location
     * @param  {float} lat2 - Latitude of the second Location
     * @param  {float} lng2 - Longitude of the second Location
     * @return {float} Distance in km
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
        function toRad(deg) {
            return deg * (Math.PI / 180)
        }

        let R = 6371; // Radius of the earth in km
        let dLat = toRad(lat2 - lat1);
        let dLon = toRad(lon2 - lon1);
        let a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        let d = R * c;
        return d;
    }

    /**
     * Draws a line from a startposition to a targetposition
     */
    drawConnectionLine(startpos, targetpos) {
        //TODO has to be rewritten
        let pointList = [startpos, targetpos];

        objectmap.line = new L.Polyline(pointList, objectmap.lineOptions);
        let arrowHead = {
            patterns: [
                {offset: '100%', repeat: 0, symbol: L.Symbol.arrowHead({pixelSize: 20, polygon: false, pathOptions: {stroke: true}})}
            ]
        };

        objectmap.arrow = L.polylineDecorator(objectmap.line, arrowHead);
        objectmap.line.addTo(objectmap.map);
        objectmap.arrow.addTo(objectmap.map);

        let distance = startpos.distanceTo(targetpos);
        if (distance < 1000) {
            document.getElementById('navigationDistance').innerHTML = distance.toFixed(0) + " m";
        } else {
            distance = distance / 1000;
            document.getElementById('navigationDistance').innerHTML = distance.toFixed(2) + " km";
        }
        calculateArrowRotation(startpos, targetpos);
    }

    /**
     * Draws the navigation as route calculated from internet service
     */
    drawRoute(startpos, targetpos) {

    }

    /**
     * Gets the route from internet service
     */
    async getRoute() {

    }
}