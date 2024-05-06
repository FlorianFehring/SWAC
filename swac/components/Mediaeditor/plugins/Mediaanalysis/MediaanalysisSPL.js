import SWAC from '../../../../swac.js';
import Msg from '../../../../Msg.js';
import Plugin from '../../../../Plugin.js'

export default class MediaanalysisSPL extends Plugin {

    constructor(pluginconf) {
        super(pluginconf);
        this.name = 'Mediaeditor/plugins/Mediaanalysis';
        this.desc.templates[0] = {
            name: 'mediaanalysis',
            desc: 'Default template createing gui elements for analysis'
        };

        this.desc.opts[0] = {
            name: 'analysisrequestor',
            desc: 'A datarequestor that specifies where the pictrue should be \n\
send to for analysis. All data from all form fields in the template will be \n\
added to that requestor as data payload. {media.id} can be used as placeholder\n\
for the id of the media. If id is send the picture itself will not be send.'
        };
        if (!this.options.analysisrequestor)
            this.options.analysisrequestor = null;

        this.canvas = null;
        this.usedThreshold = null;
        this.detectedHeatbridges = [];
        this.currentTags = [];
        this.detectBtnPressed = false;
    }

    init() {
        return new Promise((resolve, reject) => {
            // Check if tag plugin is active
            if (!this.requestor.parent.swac_comp.pluginHandler.loadedPlugins.includes('mediatags')) {
                Msg.error('MediaanalysisSPL', 'This plugin requires the mediatags plugin loaded too.', this.requestor);
                return;
            }
            if (!this.options.analysisrequestor) {
                Msg.error('MediaanalysisSPL', 'The option >analysisrequestor< is not set, cant run a analysis.', this.requestor);
                return;
            }

            // Register analyse function
            let startButtons = this.requestor.parent.querySelectorAll(".swac_mediaanalysis_start");
            for (let curStartButton of startButtons) {
                curStartButton.addEventListener('click', this.startAnalysis.bind(this));
            }
            resolve();
        });
    }

    /**
     * Starts the analysis on the configured analysis requestor
     * 
     * @param {DOMEvent} evt Event that calls the analysis start
     * @returns {Promise}
     */
    startAnalysis(evt) {
        evt.preventDefault();

        let setElem = this.requestor.parent.findRepeatedForSet(evt.target);
        let setid = setElem.getAttribute('swac_setid');
        let setname = setElem.getAttribute('swac_fromname');

        let requestor = Object.assign({}, this.options.analysisrequestor);
        // Replace placeholder
        for (let curAttr in requestor) {
            if (typeof requestor[curAttr] === 'string') {
                requestor[curAttr] = requestor[curAttr].replace('{media.id}', setid);
            } else if (typeof requestor[curAttr] === 'object') {
                requestor[curAttr] = Object.assign({}, requestor[curAttr]);
                for (let curSubAttr in requestor[curAttr]) {
                    if (typeof requestor[curAttr][curSubAttr] === 'string') {
                        requestor[curAttr][curSubAttr] = requestor[curAttr][curSubAttr].replace('{media.id}', setid);
                    }
                }
            }
        }

        // Get plugincontenArea
        let pluginContArea = evt.target;
        while (pluginContArea.parentElement) {
            if (pluginContArea.classList.contains('swac_plugin_content')) {
                break;
            }
            pluginContArea = pluginContArea.parentElement;
        }

        // Add data from form elements
        requestor.fromWheres = {};
        let form = pluginContArea.querySelector('form');
        for (let curElem of form.elements) {
            if (curElem.hasAttribute('name')) {
                let name = curElem.getAttribute('name');
                let value = curElem.value;
                requestor.fromWheres[name] = value;
            }
        }

        // Get mediatagsSPL
        let mediatagsSPL = this.requestor.parent.swac_comp.pluginHandler.plugins.get('mediatags');

        // Execute analysis
        let thisRef = this;
        Model.load(requestor).then(
                function (response) {

                    let tags = response.data;
                    let scale = null;
                    for (let i = 0; i < tags.length; i++) {
                        let curTag = tags[i];
                        // Note media the analysis ran for
                        if (!curTag.media)
                            curTag.media = 'ref://' + setname + '/' + setid;
                        // Create drawing canvas
                        let drawlayer = thisRef.requestor.swac_comp.createDrawingLayer(setname, setid);
                        drawlayer.swac_polygons = [];
                        let ctx = drawlayer.getContext('2d');
                        if (!scale) {
                            // Get drawing scale
                            let medialayer = drawlayer.parentElement.querySelector('.swac_medialayer');
                            scale = medialayer.getAttribute('scale');
                        }

                        // Get polygons
                        let polygons = curTag.polygons;
                        if (!polygons) {
                            Msg.error('MediaanalysisSPL', 'The >polygons< attribute is missing in the analysis result >' + i + '<', thisRef.requestor);
                        } else if (typeof polygons === 'string') {
                            Msg.warn('MediaanalysisSPL', 'The >polygons< attribute in result >' + i + '< has string format. Please consider to change the used interface to deliver json.', thisRef.requestor);
                            polygons = JSON.parse(polygons);
                        }
                        // Draw each polygon
                        for (let curPolygon of polygons) {
                            let polygon = new Polygon();
                            // Convert point data to polygons
                            curPolygon.vertices.forEach(point => {
                                polygon.addVertex(new Vertex(point.x * scale, point.y * scale));
                            });
                            polygon.draw(ctx);
                            drawlayer.swac_polygons.push(polygon);
                        }
                        // Create list entry for new tag
                        mediatagsSPL.createMediaTagListEntry(curTag, {id: setid}, drawlayer);
                    }
                }
        ).catch(
                function (error) {
                    Msg.error('MediaanalysisSPL', 'Error analyising the media: ' + error);
                    UIkit.notification({
                        message: SWAC.lang.dict.Mediaeditor.mediaanalysis.analysiserror,
                        status: 'info',
                        timeout: SWAC.config.notifyDuration,
                        pos: 'top-center'
                    });
                }
        );
    }
}