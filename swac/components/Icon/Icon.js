import SWAC from '../../swac.js';
import View from '../../View.js';
import Msg from '../../Msg.js';

export default class Icon extends View {

    constructor(options = {}) {
        super(options);
        this.name = 'Icon';
        this.desc.text = 'Displays icons for keywords and mimetypes';
        this.desc.developers = 'Florian Fehring (FH Bielefeld)';
        this.desc.license = 'GNU Lesser General Public License';

        this.desc.templates[0] = {
            name: 'default',
            desc: 'Default template for presenting datasets as icons'
        };
        this.desc.optPerTpl[0] = {
            selc: '.attr_{attrName}',
            desc: 'Class where attrName is replaced by the attribute name visualised. This allows attribut depended styling. Datadescription component uses this information if available.'
        };
        this.desc.opts[0] = {
            name: 'iconsHeight',
            desc: 'The height of the icons'
        };
        if (!options.iconsHeight)
            this.options.iconsHeight = '50px';
        this.desc.opts[1] = {
            name: 'iconsWidth',
            desc: 'The width of the icons'
        };
        if (!options.iconsWidth)
            this.options.iconsWidth = '50px';
        this.desc.opts[2] = {
            name: 'showAttributes',
            desc: 'Array of attribute names that should be iconized. If the list is empty, all attributes will be iconized.',
            example: ['temp', 'windspeed']
        };
        if (!options.showAttributes)
            this.options.showAttributes = [];

        this.desc.funcs[0] = {
            name: 'getIconElement',
            desc: 'Gets the DOMElement displaying a icon for the given search expression.',
            params: [
                {
                    name: 'iconSearchExpression',
                    desc: 'iconSearchExpression Expression to search icon for.'
                }
            ]
        };
        this.desc.funcs[1] = {
            name: 'getIconFilePath',
            desc: 'Gets the path to the icon file matching the search expression',
            params: [
                {
                    name: 'iconSearchExpression',
                    desc: 'iconSearchExpression Expression to search icon for.'
                }
            ]
        };
        this.desc.funcs[2] = {
            name: 'getIconFileName',
            desc: 'Gets the filename of the icon file matching the searchExpression',
            params: [
                {
                    name: 'iconSearchExpression',
                    desc: 'iconSearchExpression Expression to search icon for.'
                }
            ]
        };

        // Internal attributes
        this.iconMap = new Map();
        // Number icons
        this.iconMap.set(0, 'numbers/0.svg');
        this.iconMap.set(1, 'numbers/1.svg');
        this.iconMap.set(2, 'numbers/2.svg');
        this.iconMap.set(3, 'numbers/3.svg');
        this.iconMap.set(4, 'numbers/4.svg');
        this.iconMap.set(5, 'numbers/5.svg');
        this.iconMap.set(6, 'numbers/6.svg');
        this.iconMap.set(7, 'numbers/7.svg');
        this.iconMap.set(8, 'numbers/8.svg');
        this.iconMap.set(9, 'numbers/9.svg');

        // Image icons
        this.iconMap.set('image/avif', 'filetypes/image/avif.svg');
        this.iconMap.set('image/webp', 'filetypes/image/webp.svg');
        this.iconMap.set('image/gif', 'filetypes/image/gif.svg');
        this.iconMap.set('image/jpg', 'filetypes/image/jpg.svg');
        this.iconMap.set('image/jpeg', 'filetypes/image/jpg.svg');
        this.iconMap.set('image/svg', 'filetypes/image/svg.svg');
        this.iconMap.set('image/tif', 'filetypes/image/tif.svg');
        this.iconMap.set('image/ai', 'filetypes/image/ai.svg');
        this.iconMap.set('image/x-3ds', 'filetypes/image/3ds.svg');
        this.iconMap.set('image/bmp', 'filetypes/image/bmp.svg');
        this.iconMap.set('image/bmp', 'filetypes/image/cad.svg');
        this.iconMap.set('application/photoshop ', 'filetypes/image/ps.svg');
        this.iconMap.set('image/vnd.adobe.photoshop ', 'filetypes/image/psd.svg');
        this.iconMap.set('image/png', 'filetypes/image/png.svg');

        // Audio icons
        this.iconMap.set('audio/mpeg', 'filetypes/audio/mp3.svg');
        this.iconMap.set('audio/mp3', 'filetypes/audio/mp3.svg');
        this.iconMap.set('audio/x-aac', 'filetypes/audio/aac.svg');
        this.iconMap.set('audio/midi', 'filetypes/audio/midi.svg');
        this.iconMap.set('audio/*', 'filetypes/audio/audio.svg');

        // Video icons
        this.iconMap.set('video/mpeg', 'filetypes/video/mpg.svg');
        this.iconMap.set('video/avi', 'filetypes/video/avi.svg');
        this.iconMap.set('video/mp4', 'filetypes/video/mp4.svg');
        this.iconMap.set('video/mov', 'filetypes/video/mov.svg');
        this.iconMap.set('video/wmv', 'filetypes/video/wmv.svg');

        // Office document icons
        this.iconMap.set('application/pdf', 'filetypes/documents/pdf.svg');
        this.iconMap.set('application/vnd.ms-excel', 'filetypes/documents/xls.svg');
        this.iconMap.set('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'filetypes/documents/xls.svg');
        this.iconMap.set('application/vnd.ms-powerpoint', 'filetypes/documents/ppt.svg');
        this.iconMap.set('application/msword', 'filetypes/documents/doc.svg');
        this.iconMap.set('application/rtf', 'filetypes/documents/rtf.svg');
        this.iconMap.set('text/plain', 'filetypes/documents/txt.svg');

        // Data document icons
        this.iconMap.set('text/csv', 'filetypes/data/csv.svg');
        this.iconMap.set('application/dbf', 'filetypes/data/dbf.svg');
        this.iconMap.set('application/x-iso9660-image ', 'filetypes/data/iso.svg');
        this.iconMap.set('application/json', 'filetypes/data/json.svg');
        this.iconMap.set('application/xml', 'filetypes/data/xml.svg');

        // Compressed files icons
        this.iconMap.set('application/x-zip-compressed', 'filetypes/compressed/zip.svg');
        this.iconMap.set('application/zip', 'filetypes/compressed/zip.svg');

        // Programming icons
        this.iconMap.set('text/css', 'filetypes/programming/css.svg');
        this.iconMap.set('text/html', 'filetypes/programming/html.svg');
        this.iconMap.set('application/javascript', 'filetypes/programming/js.svg');
        this.iconMap.set('application/x-httpd-php', 'filetypes/programming/php.svg');
        this.iconMap.set('text/x-sql', 'filetypes/programming/sql.svg');

        // Program files
        this.iconMap.set('application/exe', 'filetypes/software/exe.svg');
    }

    init() {
        return new Promise((resolve, reject) => {
            resolve();
        });
    }

    afterAddSet(set, repeateds) {
        for (let attr in set) {
            // Exclude internal attributes
            if (attr.startsWith('swac_'))
                continue;
            // Check if attr should be iconized
            if (this.options.showAttributes.length === 0
                    || this.options.showAttributes.includes(attr)) {
                let iconElem = this.getIconElement(set[attr]);
                let bpElem = this.requestor.querySelector('[swac_fromname="' + set.swac_fromName + '"][swac_setid="' + set.id + '"] [attrname="' + attr + '"]');
                bpElem.innerHTML = '';
                bpElem.appendChild(iconElem);
                //TODO add listener for datachange and update icon on change
            }
        }
    }

    /**
     * Gets the DOMElement displaying a icon for the given search expression.
     * 
     * @param {String} iconSearchExpression Expression to search icon for.
     * @returns {Element|this.getIconElement.icoElem} DOMElement with icon
     */
    getIconElement(iconSearchExpression) {
        let icoFilePath = this.getIconFilePath(iconSearchExpression);

        let icoElem = document.createElement("img");
        icoElem.setAttribute("width", this.options.iconsWidth);
        icoElem.setAttribute("height", this.options.iconsHeight);
        icoElem.setAttribute("src", icoFilePath);
        icoElem.setAttribute("alt", iconSearchExpression);
        if (icoFilePath.endsWith('unknown.svg')) {
            if (SWAC.lang.dict.Icon) {
                let msg = SWAC.lang.dict.Icon.noIconFor.replace('%iconSearchExpression%', iconSearchExpression);
                icoElem.setAttribute('uk-tooltip', msg);
            }
        }
        return icoElem;
    }

    /**
     * Gets the path to the icon file matching the search expression
     * 
     * @param {String} iconSearchExpression Expression to search matching path for
     * @returns {String} Path to the found icon
     */
    getIconFilePath(iconSearchExpression) {
        let icoFileName = this.getIconFileName(iconSearchExpression);
        let icoFilePath = SWAC.config.swac_root + 'components/Icon/imgs/' + icoFileName;
        return icoFilePath;
    }

    /**
     * Gets the filename of the icon file matching the searchExpression
     * 
     * @param {String} iconSearchExpression Expression to search matching icon with.
     * @returns {Object|String} Name of the matching icon file.
     */
    getIconFileName(iconSearchExpression) {
        let iconFileName = this.iconMap.get(iconSearchExpression);
        if (!iconFileName) {
            // Check if there is a type fallback
            if (iconSearchExpression.indexOf) {
                let slashpos = iconSearchExpression.indexOf('/');
                let fallbackExpression = iconSearchExpression.substring(0, slashpos);
                iconFileName = this.iconMap.get(fallbackExpression + '/*');
            }
            if (!iconFileName) {
                Msg.error('icon', 'There is no icon for >' + iconSearchExpression + '<');
                iconFileName = 'unknown.svg';
            }
        }
        return iconFileName;
    }
}