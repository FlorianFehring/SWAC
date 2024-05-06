import SWAC from '../../../../swac.js';
import Msg from '../../../../Msg.js';
import Plugin from '../../../../Plugin.js'

export default class ObjectreferneceSPL extends Plugin {

    constructor(pluginconf) {
        super(pluginconf);
        this.name = 'mediaeditor/plugins/Objectrefernece';
        this.desc.templates[0] = {
            name: 'objectreference',
            style: 'objectreference',
            desc: 'Default template createing gui elements for createing media and object referneces'
        };
        this.options = {};
        this.options.linkedData = 'observedobject';
    }

    init() {
        return new Promise((resolve, reject) => {
            var epl_objectreference_options = {};
            epl_objectreference_options.linkedData = objectreferenceSPL.options.linkedData;
            // Set eventhandler for changes
            epl_objectreference_options.onChange = function (evt) {
                let targetElem = evt.target;
                if (targetElem.nodeName === 'SELECT') {
                    let objRefId = targetElem.options[targetElem.selectedIndex].value;

                    let querydata = {};
                    querydata.id = set.id;
                    querydata[epl_objectreference_options.linkedData] = 'ref://' + objRefId;

                    remoteHandler.fetchUpdate("media/updateOoLink", querydata, false).then(
                            function (result) {
                                console.log('REST');
                                console.log(result);
                            });
                }
            };
            window["epl_objectreference_options"] = epl_objectreference_options;

            let requestor = pluginarea.querySelector('.swac_plugin_content');
            requestor.id = 'epl_objectreference';

            // Wait for component to be inserted
            $(document).on('swac_' + requestor.id + '_complete', function (evt) {
                let objRefId = null;
                // Check if media is referenced whith curData
                if (typeof set[requestor.swac_comp.options.linkedData] !== 'undefined') {
                    let refStr = set[requestor.swac_comp.options.linkedData];
                    let idStartPos = refStr.lastIndexOf('/');
                    // Get id 
                    objRefId = refStr.substring(idStartPos + 1);
                }

                let targetElem = requestor.querySelector('select');
                // Find option with selected value
                let optionIndex = -1;
                for (let i in targetElem.options) {
                    if (targetElem.options[i].value === objRefId) {
                        optionIndex = i;
                        break;
                    }
                }

                targetElem.selectedIndex = optionIndex;
            });

//        requestor.fromName = objectreferenceSPL.options.linkedData + '/'
//                + SWAC.config.interfaces.list;
            SWAC.loadComponent('SWAC_select', requestor);
            resolve();
        });
    }
}