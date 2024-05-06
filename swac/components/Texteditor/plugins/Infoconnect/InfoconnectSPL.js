import SWAC from '../../../../swac.js';
import Msg from '../../../../Msg.js';
import Plugin from '../../../../Plugin.js'

export default class InfoconnectSPL extends Plugin {

    constructor(pluginconf) {
        super(pluginconf);
        this.name = 'texteditor/plugins/Infoconnect';
        this.desc.depends[0] = {
            name: 'TextAnalysis.js',
            path: SWAC.config.swac_root + 'algorithms/TextAnalysis.js',
            desc: 'Class with algorithms for text analysis'
        };
        this.desc.depends[1] = {
            name: 'HelperNodeWorks.js',
            path: SWAC.config.swac_root + 'components/Texteditor/libs/tinymce/plugins/gim/HelperNodeWorks.js',
            desc: 'TinyMCE editor library'
        };
        this.desc.templates[0] = {
            name: 'infoconnect',
            style: false,
            desc: 'Default template for infoconnect controls'
        };
        // Set default options
//        this.desc.opts[0] = {
//            name: 'showdatalabels',
//            desc: 'If true the values of the data points are shown in the diagram'
//        };
//        this.options.showdatalabels = false;

        // Internal attributes

    }

    init() {
        return new Promise((resolve, reject) => {
// Check if content area is available
            if (!this.contElements || this.contElements.length === 0) {
                Msg.error('infoconnectSPL', 'This plugin needs a contElement to insert the chart.', this.requestor);
            }

            for (let contElement of this.contElements) {
                console.log("contelem:");
                console.log(contElement);
            }

            // Get component where this plugin instance belongs to
            let component = this.requestor.parent.swac_comp;

            // Register event handlers for updateing displays when typing
            let thisRef = this;
            for (let curEd of tinymce.editors) {
                curEd.on('KeyUp', function (e) {
                    console.log('keyup!');
                });
                curEd.on('click', function (e) {
                    console.log('click!');

                    console.log(tinymce.activeEditor);
                });
            }
            resolve();
        });
    }

}