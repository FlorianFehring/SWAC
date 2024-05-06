import SWAC from '../../swac.js';
import View from '../../View.js';
import Msg from '../../Msg.js';
import Icon from '../../components/Icon/Icon.js';

export default class Download extends View {

    constructor(options = {}) {
        super(options);
        this.name = 'Download';
        this.desc.text = 'Creates download areas for files';
        this.desc.developers = 'Florian Fehring (FH Bielefeld)';
        this.desc.license = 'GNU Lesser General Public License';

        this.desc.depends[0] = {
            name: 'Icon component',
            path: SWAC.config.swac_root + 'components/Icon/Icon.js',
            desc: 'SWAC Icon component'
        };
        this.desc.templates[0] = {
            name: 'block',
            style: 'block',
            desc: 'Shows a block with files title and download icon.'
        };
        this.desc.templates[1] = {
            name: 'table',
            style: false,
            desc: 'Shows a table that lists all downloads.'
        };
        this.desc.reqPerTpl[0] = {
            selc: '.swac_downloadIco',
            desc: 'img element where to show the icon.'
        };
        this.desc.reqPerSet[0] = {
            name: 'path',
            desc: 'Path to the downloadable file.'
        };
        this.desc.reqPerSet[1] = {
            name: 'mimetype',
            desc: 'Downloadable files mimetype.'
        };
        this.desc.optPerSet[0] = {
            name: 'title',
            desc: 'Title of the file'
        };
        this.desc.optPerSet[1] = {
            name: 'description',
            desc: 'Description for the file'
        };
        this.desc.optPerSet[2] = {
            name: 'ico',
            desc: 'Path or base64 coded binary for the icon of the file. If not set a default ico depending on the filetype will be used.'
        };
    }

    init() {
        return new Promise((resolve, reject) => {
            resolve();

        });
    }

    afterAddSet(set, repeateds) {
        for (let curRep of repeateds) {
            // Find ico placeholder without icon
            let withoutIcoElems = curRep.querySelectorAll('.swac_downloadIco');
            for (let withoutIcoElem of withoutIcoElems) {
                // Get icon filename from mime-type
                let iconComp = new Icon();
                let iconfilepath = iconComp.getIconFilePath(set.mimetype);
                if (iconfilepath === 'unkown.svg') {
                    withoutIcoElem.parentNode.removeChild(withoutIcoElem);
                } else {
                    withoutIcoElem.setAttribute("src", iconfilepath);
                }
            }
        }
    }
}