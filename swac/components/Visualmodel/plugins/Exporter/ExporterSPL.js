import SWAC from '../../../../swac.js';
import Msg from '../../../../Msg.js';
import Plugin from '../../../../Plugin.js'

export default class ExporterSPL extends Plugin {

    constructor(pluginconf) {
        super(pluginconf);
        this.name = 'Visualmodel/plugins/Exporter';
        this.desc.templates[0] = {
            name: 'exporter',
            desc: 'Default template for show export buttons'
        };
        this.desc.reqPerTpl[0] = {
            selc: '.swac_visualmodel_saveasimage',
            desc: 'Button that can be clicked to export as image'
        };
        // Internal attributes
        this.stage = null;
        this.layer = null;
    }

    init() {
        return new Promise((resolve, reject) => {
            // Get stage from  requestors component
            this.stage = this.requestor.parent.swac_comp.stage;
            this.layer = this.requestor.parent.swac_comp.layer;
            // Register event handling
            let thisRef = this;
            let export_asimageElem = this.requestor.parent.querySelector('.swac_visualmodel_saveasimage');
            export_asimageElem.addEventListener('click', function () {
                let dataURL = thisRef.stage.toDataURL({pixelRatio: 3});
                var link = document.createElement('a');
                link.download = 'stage.png';
                link.href = dataURL;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            });
            resolve();
        });
    }
}