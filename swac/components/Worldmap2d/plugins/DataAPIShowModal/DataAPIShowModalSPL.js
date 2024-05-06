import SWAC from '../../../../swac.js';
import Msg from '../../../../Msg.js';
import Plugin from '../../../../Plugin.js'
import ViewHandler from '../../../../ViewHandler.js';

export default class DataAPIShowModalSPL extends Plugin {

    constructor(options = {}) {
        super(options);
        this.name = 'Worldmap2d/plugins/DataAPIShowModal';
        this.desc.text = 'Plugin to fetch data over a API with sending the clicked coordinates and show the data.';

        this.desc.templates[0] = {
            name: 'datashowmodal',
            style: 'datashowmodal',
            desc: 'Default modal dialog for showing data'
        };

        this.desc.opts[0] = {
            name: "apis",
            desc: "URL of the API. Can contain placeholders {lng}, {lat}, {datetime} and {date}. Date and time are provided in ISO8601.",
            example: [{url: 'https://url1.de', timeattr: 'hourly.time'}]
        };
        if (!options.apis)
            this.options.apis = [];

        this.desc.opts[1] = {
            name: "attrsShown",
            desc: "List of attribute names that should be shown. Give the attribute names in the order, they should appear.",
            example: ['attr1', 'attr2']
        };
        if (!options.attrsShown)
            this.options.attrsShown = [];

        this.desc.opts[2] = {
            name: "attrsFormat",
            desc: "Map of swac_lang_format instructions for attribute names. attrsFormat.set('measuredate','datetime')",
        };
        if (!options.attrsFormat)
            this.options.attrsFormat = new Map();

        // Internal attributes
        this.modal = null;
    }

    init() {
        return new Promise((resolve, reject) => {
            // add event listener for mapClick
            let evtname = 'swac_' + this.requestor.parent.id + '_map_click';
            document.addEventListener(evtname, this.onMapClick.bind(this));
            // Get modal template
            this.modal = this.contElements[0].querySelector('.worldmap2d_dataapimodal');
            resolve();
        });
    }

    /**
     * Function executed when a click on a map occured
     * 
     * @param {DOMEvent} e Map click event
     */
    onMapClick(e) {
        // Remove old data
        let olddata = this.modal.querySelectorAll('.worldmap2d_repeatedForValue');
        for (let curData of olddata) {
            curData.remove();
        }
        // Remove old label heading
        let oldLabelHeading = this.modal.querySelector('.labeling-heading')
        if (oldLabelHeading != null)
            oldLabelHeading.remove();

        // Remove old label
        let oldlabel = this.modal.querySelector('.labeling');
        if (oldlabel != null)
            oldlabel.swac_comp.delete();

        // Check if timeline plugin is available and get selected time
        let dateElem = document.querySelector('.swac_worldmap2d_timeline_viewdate');
        let selDatetime;
        if(dateElem && dateElem.value)
            selDatetime = new Date(dateElem.value);

        // For all apis
        for (let curAPI of this.options.apis) {
            // Build api link
            let apiurl = curAPI.url.replace('{lat}', e.detail.latlng.lat).replace('{lng}', e.detail.latlng.lng);
            if (apiurl.includes('{date}') && dateElem && dateElem.value) {
                let date = dateElem.value.split('T');
                apiurl = apiurl.replaceAll('{date}', date[0]);
            } else if (apiurl.includes('datetime') & dateElem && dateElem.value) {
                apiurl = apiurl.replaceAll('{datetime}', dateElem.value);
            } else if (apiurl.includes('{date}') || apiurl.includes('datetime')) {
                Msg.info('DataAPIShowModal', 'Timed url is ignored because there is no time information', this.requestor.parent);
                continue;
            } else if (dateElem && dateElem.value && !apiurl.includes('{date}') && !apiurl.includes('datetime')) {
                Msg.info('DataAPIShowModal', 'Non timed url is ignored because there is time information', this.requestor.parent);
                continue;
            }

            // Get data from API
            let thisRef = this;

            fetch(apiurl).then(function (res) {
                res.json().then(function (json) {
                    // Find next time index
                    let datetimeindex;
                    let nearest_diff;
                    if (curAPI.timeattr) {
                        let parts = curAPI.timeattr.split('.');
                        let times = json;
                        for (let i = 0; i < parts.length; i++) {
                            if (times[parts[i]]) {
                                times = times[parts[i]];
                            }
                        }
                        if(!times) {
                            Msg.error('DataAPIShowModal','Timeseries >' + curAPI.timeattr + '< could not be found.',this.requestor.parent);
                        } else {
                            for(let i=0; i < times.length; i++) {
                                let curDatetime = new Date(times[i]);
                                // Calculate diff between selected date and curDate
                                let diff = Math.abs(curDatetime - selDatetime);
                                if(!nearest_diff || diff < nearest_diff) {
                                    nearest_diff = diff;
                                    datetimeindex = i;
                                }
                            }
                        }
                    }

                    // Add new data
                    let contElem = thisRef.modal.querySelector('.worldmap2d_repeatForValue');
                    if (curAPI.attrs) {
                        for (let curAttr of curAPI.attrs) {
                            // Search attribute
                            let parts = curAttr.split('.');
                            let value = json;
                            for (let i = 0; i < parts.length; i++) {
                                if (value[parts[i]]) {
                                    value = value[parts[i]];
                                }
                            }
                            // If there is a timeindex use it
                            if(datetimeindex)
                                value = value[datetimeindex];
                            
                            if (value && typeof value !== 'object')
                                thisRef.modifyModalContent(contElem, curAttr, value);
                        }
                    } else {
                        for (let curAttr in json) {
                            // Exclude swac_ attributes
                            if (curAttr.startsWith('swac_'))
                                continue;
                            thisRef.modifyModalContent(contElem, curAttr, json[curAttr]);
                        }
                    }
                });
            }).catch(function (e) {
                Msg.error('DataAPIShowModal', 'Could not get data from API >' + apiurl + '< error: ' + e, thisRef.requestor.parent);
            });
        }

        // Translate modal
        window.swac.lang.translateAll(this.modal);
        UIkit.modal(this.modal).show();
    }

    /**
     * Modifies the modals content for each attribute
     *
     * @param {DOMElement} contElem Element where content is placed
     * @param {String} attr Attribute to create entry for
     * @param {String} value Value to create entry for
     */
    modifyModalContent(contElem, attr, value) {
        // Create modal content
        let contCopy = contElem.cloneNode(true);
        let attrElem = contCopy.querySelector('.worldmap2d_attr');
        attrElem.innerHTML = attr;
        attrElem.setAttribute('swac_lang', attr);
        let valElem = contCopy.querySelector('.worldmap2d_val');
        valElem.innerHTML = value;
        if (this.options.attrsFormat.has(attr))
            valElem.setAttribute('swac_lang_format', this.options.attrsFormat.get(attr));
        contCopy.classList.remove('worldmap2d_repeatForValue');
        contCopy.classList.add('worldmap2d_repeatedForValue');
        contElem.parentNode.appendChild(contCopy);

        // Check if Datadescription component is used
        let dd = this.requestor.parent.swac_comp.datadescription;
        if (dd) {
            let col = dd.getValueColor(value, null, attr);
            valElem.setAttribute('style', 'color:' + col);
        }
    }

}