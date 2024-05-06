import Plugin from '../../../../Plugin.js';

/* 
 * This plugin allows disabling clicking into the map.
 */
export default class ToggleClickInteractionButtonSPL extends Plugin {
  constructor(options = {}) {
    super(options);
    this.name = 'Worldmap2d/plugins/ToggleClickInteractionButton';
    this.desc.text = 'Button to toggle map interactions, like clicking on the map';
    this.desc.templates[0] = {
      name: 'toggleclickinteractionbutton',
      style: 'toggleclickinteractionbutton',
      desc: 'Default template for ToggleClickInteractionButon',
    };
    this.desc.opts = [];
    this.options = {};
    this.map = null;
    this.button = null;
    this.mapPin = null;
    this.mapPinOff = null;
  }

  init() {
    return new Promise((resolve, reject) => {
      this.map = this.requestor.parent.swac_comp;
      this.button = this.requestor.parent.querySelector('.toggleclickinteractionbutton');
      this.mapPin = this.button.querySelector('.toggleclickinteractionbutton-map-pin');
      this.mapPinOff = this.button.querySelector('.toggleclickinteractionbutton-map-pin-off');

      L.DomEvent.on(this.button, 'click', L.DomEvent.stopPropagation);
      L.DomEvent.on(this.button, 'dblclick', L.DomEvent.stopPropagation);
      this.button.onclick = () => {
        this.map.toggleMapClickInteraction();
      }

      document.addEventListener('mapClickInteractionEnabled', () => {
        this.mapPin.style.display = 'block';
        this.mapPinOff.style.display = 'none';
      })

      document.addEventListener('mapClickInteractionDisabled', () => {
        this.mapPin.style.display = 'none';
        this.mapPinOff.style.display = 'block';
      })

      resolve();
    });
  }
}
