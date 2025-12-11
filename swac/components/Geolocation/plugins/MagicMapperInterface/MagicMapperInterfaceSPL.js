import SWAC from '../../../../swac.js';
import Msg from '../../../../Msg.js';
import Plugin from '../../../../Plugin.js';

export default class MagicMapperInterfaceSPL extends Plugin {

    constructor(options = {}) {
        super(options);
        this.name = 'Geolocation/plugins/MagicMapperInterface';
        this.desc.text = 'Interface to interact with the MagicMapper';

        this.desc.templates[0] = {
            name: 'default',
            style: 'default',
            desc: 'default template',
        };

        this.desc.opts[0] = {
            name: "watchInterval",
            example: 5000,
            desc: "Interval in ms to check if the MagicMapper is still connected"
        };
        if (typeof this.options.watchInterval === 'undefined') {
            this.options.watchInterval = 5000
        }

        // Attributes for internal usage
        this.mapperURL = null;
        this.mapperPort = 3000;
        this.watchingMapper = null;
    }

    init() {
        return new Promise((resolve, reject) => {
            let mapperBtn = this.requestor.parent.querySelector('.swac_geolocation_magicmapperiface_btn');
            mapperBtn.onclick = this.onMagicMapperBtnClick.bind(this);
            let conBtn = document.querySelector('.swac_geolocation_magicmapperiface_conbtn');
            conBtn.addEventListener('click', this.onConnectButtonClick.bind(this));
            resolve();
        });
    }

    onMagicMapperBtnClick() {
        if (this.watchingMapper) {
            this.turnOffConnection();
        } else {
            let modalElem = document.querySelector('.swac_geolocation_magicmapperiface_modal');
            UIkit.modal(modalElem).show();
        }
    }

    /**
     * Start connection to magic mapper server
     * @returns {undefined}
     */
    onConnectButtonClick() {
        let ipElem = document.querySelector('.swac_geolocation_magicmapperiface_ipinput');

        // check format of ip else show error
        if (!SWAC.isValidIP(ipElem.value)) {
            // show notification message
            UIkit.notification({
                message: SWAC.lang.dict.Geolocation_MagicMapperInterface.wrongip,
                status: 'error',
                timeout: SWAC.config.notifyDuration,
                pos: 'top-center'
            });
            return false;
        }

        this.mapperURL = ipElem.value;
        // Change icon
        let mapperBtn = this.requestor.parent.querySelector('.swac_geolocation_magicmapperiface_btn');
        mapperBtn.setAttribute('src', '/SWAC/swac/components/Icon/imgs/map/worldmap2d/hourglass.svg');

        this.turnOnConnection();
        // Close modal
        let modalElem = document.querySelector('.swac_geolocation_magicmapperiface_modal');
        UIkit.modal(modalElem).hide();

        // Hide start button
        let startElem = document.querySelector('.swac_geolocation_start');
        startElem.classList.add('swac_dontdisplay');
        // Show stop button
        let stopElem = document.querySelector('.swac_geolocation_stop');
        stopElem.classList.add('swac_dontdisplay');
        // Set icon color and info text
        let icoElem = document.querySelector('.swac_geolocation_icon');
        icoElem.style.color = 'red';
        icoElem.setAttribute('uk-tooltip', SWAC.lang.dict.Geolocation_MagicMapperInterface.watchlocated);
        // Set state
        let stateElem = document.querySelector('.swac_geolocation_info');
        stateElem.innerHTML = window.swac.lang.dict.Geolocation_MagicMapperInterface.watchlocated;
        stateElem.setAttribute('swac_lang', 'Geolocation_MagicMapperInterface.watchlocated');
    }

    /**
     * Turns the connection and regular fetch call to the Pi on. 
     */
    turnOnConnection() {
        this.watchingMapper = true;
        this.startWatchingMapper();
    }

    /**
     * Turns the connection and regular fetch call to the Pi off. 
     */
    turnOffConnection() {
        // Change icon
        let mapperBtn = this.requestor.parent.querySelector('.swac_geolocation_magicmapperiface_btn');
        mapperBtn.setAttribute('src', '/SWAC/swac/components/Icon/imgs/map/worldmap2d/wand-off.svg');
        this.stopWatchingMapper();
        
        // Hide start button
        let startElem = document.querySelector('.swac_geolocation_start');
        startElem.classList.remove('swac_dontdisplay');
        // Show stop button
        let stopElem = document.querySelector('.swac_geolocation_stop');
        stopElem.classList.add('swac_dontdisplay');
        // Set icon color and info text
        let icoElem = document.querySelector('.swac_geolocation_icon');
        icoElem.style.color = 'grey';
        icoElem.setAttribute('uk-tooltip', SWAC.lang.dict.Geolocation.notstarted);
        // Set state
        let stateElem = document.querySelector('.swac_geolocation_info');
        stateElem.innerHTML = window.swac.lang.dict.Geolocation.notstarted;
        stateElem.setAttribute('swac_lang', 'Geolocation.notstarted');
    }

    /**
     * Gets the Data from the given URL. Regularly called when the connection is turned on.
     * 
     */
    async getMapperData() {
        const url = "https://" + this.mapperURL + ":" + this.mapperPort + "/";

        try {
            // Using fetch to force fetching the datasource every time.
            const data = await this.fetchGetJSON(url);
            //Connection to API successful but API has no connection to MagicMapper
            if (!data.connected) {
                // Change icon
                let mapperBtn = this.requestor.parent.querySelector('.swac_geolocation_magicmapperiface_btn');
                mapperBtn.setAttribute('src', '/SWAC/swac/components/Icon/imgs/map/worldmap2d/wand-off.svg');
            }
            //Connection to API and MagicMapper successful, data receive successfully
            else {
                let locationData = {
                    coords: {
                        latitude: this.convertLatitudeFormat(data.data_json.latitude),
                        longitude: this.convertLongitudeFormat(data.data_json.longitude),
                    },

                    timestamp: data.data_json.utc_time
                };
                this.requestor.parent.swac_comp.located(locationData);

                // Change icon
                let mapperBtn = this.requestor.parent.querySelector('.swac_geolocation_magicmapperiface_btn');
                mapperBtn.setAttribute('src', '/SWAC/swac/components/Icon/imgs/map/worldmap2d/wand.svg');
            }
        } catch (err) {
            UIkit.notification({
                message: SWAC.lang.dict.Geolocation_MagicMapperInterface.conerr,
                status: 'error',
                timeout: SWAC.config.notifyDuration,
                pos: 'top-center'
            });
            this.turnOffConnection()
            if (err instanceof Error) {
                throw new Error(err.message);
            }
            throw err;
        }
    }

    /**
     * Convert latitude format from degrees to decimal format
     * @param {*} lat latitude in degrees
     * @returns latitude in decimal
     */
    convertLatitudeFormat(lat) {
        try {
            return (Number(lat.slice(0, 2)) + (Number(lat.slice(2, 9)) / 60))
        } catch (err) {
            if (err instanceof Error) {
                throw new Error(err.message);
            }
            throw err;
        }

    }

    /**
     * Convert longitude format from degrees to decimal format
     * @param {*} long longitude in degrees
     * @returns longitude in decimal format
     */
    convertLongitudeFormat(long) {
        try {
            return (Number(long.slice(0, 3)) + (Number(long.slice(3, 10)) / 60))
        } catch (err) {
            if (err instanceof Error) {
                throw new Error(err.message);
            }
            throw err;
        }
    }

    /**
     * Starts the interval in which the data from MagicMapper is fetched.
     */
    async startWatchingMapper() {
        try {
            while (this.watchingMapper) {
                await this.getMapperData()
                await this.sleep(this.options.watchInterval)
            }
        } catch (err) {
            Msg.error("Error with MagicMapper", err);
        }
    }

    /**
     * Ends the interval in which the data from MagicMapper is fetched.
     */
    stopWatchingMapper() {
        this.watchingMapper = false;
    }

    /**
     * Waits for the given amount of milliseconds.
     * @param {*} ms milliseconds to wait
     * @return {Promise}
     */
    async sleep(ms) {
        return new Promise((resolve, reject) => setTimeout(resolve, ms));
    }

    /**
     * Wrapper class for fetch api
     * @param {*} url request url
     * @returns {Object} the requested data
     */
    async fetchGetJSON(url) {
        try {
            return await fetch(url).then((res) => res.json());
        } catch (err) {
            throw err;
        }
    }
}