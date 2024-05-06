import SWAC from '../../../../swac.js';
import Msg from '../../../../Msg.js';
import Plugin from '../../../../Plugin.js';

/* 
 * ENUM for the different Buttonstates.
 */
const BUTTONSTATES = {
    OFF: "off",
    STARTING_CONNECTION: "starting connection",
    ON_NOTCONNECTED: "on, not connected",
    ON_CONNECTED: "on, connected"
};


/* 
 * This plugin manages the connection and regular data requests to the MagicMapper.
 */

export default class InterfaceMagicMapperSPL extends Plugin {

    constructor(options = {}) {
        super(options);
        this.name = 'Worldmap2d/plugins/InterfaceMagicMapper';
        this.desc.text = 'Interface to interact with the MagicMapper';

        this.desc.templates[0] = {
            name: 'interfacemagicmapper',
            style: 'interfacemagicmapper',
            desc: 'default template for InterfaceMagicMapper',
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
        this.worldmap2d = null;

        this.button = null;
        this.interfaceMagicMapperOnConnected = null;
        this.interfaceMagicMapperOnNotConnected = null;
        this.interfaceMagicMapperOff = null;
        this.interfaceMagicMapperStartingConnection = null;
        this.buttonState = BUTTONSTATES.OFF;

        this.ipWrapper = null;
        this.ipinput = null;
        this.connectButton = null;
        this.acceptCertificateButton = null;

        this.mapperOn = null;
        this.mapperURL = null;
        this.mapperPort = 3000;

        this.currentWindowInterval = null;

        this.watchingMapper = null;
    }

    init() {
        return new Promise((resolve, reject) => {
            this.worldmap2d = this.requestor.parent.swac_comp;
            //getting all needed html-elements
            const interfacemagicmapper = this.requestor.parent.querySelector('.interfacemagicmapper');
            this.button = interfacemagicmapper.querySelector('.interfacemagicmapper-button');
            this.interfaceMagicMapperOnConnected = interfacemagicmapper.querySelector('.interfacemagicmapper-on-connected');
            this.interfaceMagicMapperOnNotConnected = interfacemagicmapper.querySelector('.interfacemagicmapper-on-not-connected');
            this.interfaceMagicMapperOff = interfacemagicmapper.querySelector('.interfacemagicmapper-off');
            this.interfaceMagicMapperStartingConnection = interfacemagicmapper.querySelector('.interfacemagicmapper-starting-connection');
            this.ipWrapper = interfacemagicmapper.querySelector('.interfacemagicmapper-ip-wrapper');
            this.ipinput = interfacemagicmapper.querySelector('.interfacemagicmapper-ip-input');
            this.connectButton = interfacemagicmapper.querySelector('.interfacemagicmapper-connect-button');
            this.acceptCertificateButton = interfacemagicmapper.querySelector('.interfacemagicmapper-accept-certificate-button');
            //prevents bubbling
            L.DomEvent.on(interfacemagicmapper, 'click', L.DomEvent.stopPropagation);
            L.DomEvent.on(interfacemagicmapper, 'dblclick', L.DomEvent.stopPropagation);

            //hide ip modal
            this.ipWrapper.style.display = 'none';

            //ip modal closes when pressing X button
            interfacemagicmapper.querySelector('.interfacemagicmapper-button-close').onclick = this.closeModal.bind(this);

            this.ipWrapper.onclick = (e) => {
                if (e.target.closest('.interfacemagicmapper-ip-box') == null) {
                    this.closeModal();
                }
            };


            this.button.onclick = (e) => {
                if (this.buttonState === BUTTONSTATES.OFF) {
                    this.ipWrapper.style.display = 'flex';
                    this.worldmap2d.disableMapInteractions();
                } else {
                    this.turnOffConnection();
                }
            }

            //on click attempts to establish connect to API
            this.connectButton.onclick = (e) => {
                this.onConnectButtonClick();    
            }

            this.acceptCertificateButton.onclick = (e) => {
                if (!this.checkIPAddress()) {
                    this.ipinput.value = '';
                    return;
                }
                this.mapperURL = this.ipinput.value;
                const url = "https://" + this.mapperURL + ":" + this.mapperPort + "/accept";
                window.open(url, "_blank").focus();
            }
            // connect with enter
            this.ipinput.addEventListener('keypress', (e) => {
                if (e.key == 'Enter') this.onConnectButtonClick();
            });

            resolve();
        });
    }

    /**
     * Start connection to magic mapper server
     * @returns {undefined}
     */
    onConnectButtonClick() {
        // check format of ip else show error
        if (!this.checkIPAddress()) {
            this.ipinput.value = "";
            return;
        }
        this.mapperURL = this.ipinput.value;
        this.setInterfaceButton(BUTTONSTATES.STARTING_CONNECTION)
        this.turnOnConnection();
        this.worldmap2d.enableMapInteractions();
        this.ipWrapper.style.display = 'none';
    }

    /**
     * Turns the connection and regular fetch call to the Pi on. 
     * 
     */
    turnOnConnection() {
        this.worldmap2d.setPreciseLocationPlugin(this);
        this.watchingMapper = true;
        this.startWatchingMapper();

    }
    /**
     * Turns the connection and regular fetch call to the Pi off. 
     * 
     */
    turnOffConnection() {
        this.setInterfaceButton(BUTTONSTATES.OFF)
        this.worldmap2d.removePreciseLocationPlugin(this);
        this.stopWatchingMapper();
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
                this.setInterfaceButton(BUTTONSTATES.ON_NOTCONNECTED);
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

                this.worldmap2d.saveUserLocation(locationData);

                this.setInterfaceButton(BUTTONSTATES.ON_CONNECTED)
            }
        } catch (err) {
            UIkit.notification({
                message: "Magic Mapper server nicht erreichbar oder das Zertifikat wurde noch nicht akzeptiert.",
                status: 'info',
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
     * Sets the status of the button according to the actual status of the connection.
     * @param {*} status button state of the connection
     */
    setInterfaceButton(status) {
        switch (status) {
            case BUTTONSTATES.OFF:
                this.interfaceMagicMapperOnNotConnected.style.display = 'none';
                this.interfaceMagicMapperOnConnected.style.display = 'none';
                this.interfaceMagicMapperOff.style.display = 'block';
                this.interfaceMagicMapperStartingConnection.style.display = 'none';
                this.buttonState = BUTTONSTATES.OFF;
                break;
            case BUTTONSTATES.ON_CONNECTED:
                this.interfaceMagicMapperOnNotConnected.style.display = 'none';
                this.interfaceMagicMapperOnConnected.style.display = 'block';
                this.interfaceMagicMapperOff.style.display = 'none';
                this.interfaceMagicMapperStartingConnection.style.display = 'none';
                this.buttonState = BUTTONSTATES.ON_CONNECTED;
                break;
            case BUTTONSTATES.ON_NOTCONNECTED:
                this.interfaceMagicMapperOnNotConnected.style.display = 'block';
                this.interfaceMagicMapperOnConnected.style.display = 'none';
                this.interfaceMagicMapperOff.style.display = 'none';
                this.interfaceMagicMapperStartingConnection.style.display = 'none';
                this.buttonState = BUTTONSTATES.ON_NOTCONNECTED;
                break;
            case BUTTONSTATES.STARTING_CONNECTION:
                this.interfaceMagicMapperOnNotConnected.style.display = 'none';
                this.interfaceMagicMapperOnConnected.style.display = 'none';
                this.interfaceMagicMapperOff.style.display = 'none';
                this.interfaceMagicMapperStartingConnection.style.display = 'block';
                this.buttonState = BUTTONSTATES.STARTING_CONNECTION;
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
        }
        catch (err) {
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
     * Checks if the given string is in a valid IPv4 format.
     */
    checkIPv4Format(str) {
        if (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(str)) {
            return true
        }
        return false;
    }

    /**
     * Checks for valid ip address in the ip input field.
     * @returns {boolean}
     */
    checkIPAddress() {
        if (!this.checkIPv4Format(this.ipinput.value)) {
            // show notification message
            UIkit.notification({
                message: "Bitte eine gültige IP Adresse eingeben",
                status: 'info',
                timeout: SWAC.config.notifyDuration,
                pos: 'top-center'
            }); 
            return false;
        }
        return true;
    }

    closeModal() {
        this.ipWrapper.style.display = 'none';
        this.worldmap2d.enableMapInteractions();
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
          const data = await fetch(url).then((res) => res.json());
          return data;
        } catch (err) {
            throw err;
        }
      }

}