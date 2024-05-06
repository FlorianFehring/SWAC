import Plugin from '../../../../Plugin.js';


/* 
 * This plugin allows to toggle whether the map follows the users location if geolocation is activated.
 */
export default class ToggleLatchOnLocationSPL extends Plugin {
    constructor(options = {}) {
        super(options);
        this.name = 'Worldmap2d/plugins/ToggleLatchOnLocation';
        this.desc.text = 'Button that toggles whether the map pans to the users location on a location update';

        this.desc.templates[0] = {
            name: 'togglelatchonlocation',
            style: 'togglelatchonlocation',
            desc: 'Default template for ToggleLatchOnLocation',
        };
        
        // Attributes for internal usage
        this.button = null;
        this.locationOn = null;
        this.locationOff = null;
        this.worldmap2d = null;
    }

    init() {
        return new Promise((resolve, reject) => {
            this.worldmap2d = this.requestor.parent.swac_comp;
            //get needed html-elements
            this.button = this.requestor.parent.querySelector('.togglelatchonlocation');
            this.locationOn = this.button.querySelector('.togglelatchonlocation-location-on');
            this.locationOff = this.button.querySelector('.togglelatchonlocation-location-off');

            //disable icon depending on whether latchOnLocation is on or off
            if (this.worldmap2d.options.latchOnLocation) {
                this.locationOff.style.display = "none"
                this.locationOn.style.display = "block"
            }
            L.DomEvent.on(this.button, 'click', L.DomEvent.stopPropagation);
            L.DomEvent.on(this.button, 'dblclick', L.DomEvent.stopPropagation);
            //button toggles whether the users location is followed or not
            this.button.onclick = (e) => {
                this.toggleButton();
            }
            resolve();
        });
    }

    /*
     * Toggles whether the users location is followed or not.
     */
    toggleButton() {
        if (this.worldmap2d.options.latchOnLocation) {
            this.worldmap2d.options.latchOnLocation = false;
            this.locationOn.style.display = "none";
            this.locationOff.style.display = "block";
        } else {
            this.worldmap2d.options.latchOnLocation = true;
            this.locationOn.style.display = "block"
            this.locationOff.style.display = "none"
        }
    }

}
