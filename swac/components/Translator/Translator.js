import SWAC from '../../swac.js';
import View from '../../View.js';
import Msg from '../../Msg.js';

export default class Translator extends View {

    constructor(options = {}) {
        super(options);
        this.name = 'Translator';
        this.desc.text = 'Component for translation of website contents';
        this.desc.developers = 'Florian Fehring (FH Bielefeld)';
        this.desc.license = 'GNU Lesser General Public License';
        
        this.desc.templates[0] = {
            name: 'translatetools',
            desc: 'Template with tools for translation.'
        };
        this.desc.reqPerTpl[0] = {
            selc: '.swac_translator_lngsel',
            desc: 'Language selection element'
        };
        this.desc.reqPerSet[0] = {
            name: 'swac_lng',
            desc: 'International identifyer of the language (e.g. de-de, en-us)'
        };
        this.desc.optPerSet[0] = {
            name: 'swac_file',
            desc: 'Path to the file with language entries. If this is set the contents of the language are loaded only if needed.'
        };

        this.desc.opts[0] = {
            name: 'lang',
            desc: 'Identifier of the language to show'
        };
        if (!options.lang) {
            this.options.lang = navigator.language || navigator.userLanguage;
        }
        this.desc.opts[1] = {
            name: 'contentlang',
            desc: 'Identifier of the content language in the document.',
            example: 'en'
        };
        if (!options.contentlang)
            this.options.contentlang = null;

        this.desc.opts[2] = {
            name: 'translateAttrs',
            desc: 'When true also attribute names are translated. This deactivates automatic synching of changed attribute names.'
        };
        if (typeof options.translateAttrs === 'undefined')
            this.options.translateAttrs = true;

        this.desc.opts[3] = {
            name: 'showInNav',
            desc: 'If set to true, and the nav component is used. The translator will be shown in the navs addons section.'
        };
        if (typeof options.showInNav === 'undefined')
            this.options.showInNav = true;

        this.desc.opts[4] = {
            name: 'formatLocale',
            desc: 'If set to true numbers and dates are formatted to their locale representation.'
        };
        if (typeof options.formatLocale === 'undefined')
            this.options.formatLocale = true;

        if (typeof options.showWhenNoData === 'undefined')
            this.options.showWhenNoData = true;

        // Internal values
        this.browserlng;
        this.curlng;
        this.lngdefs = {};
    }

    init() {
        return new Promise((resolve, reject) => {

            window.swac.lang.translateAttrnames = this.options.translateAttrnames;
            window.swac.lang.formatLocale = this.options.formatLocale;

            // Register event handler for language change
            let selElem = document.querySelector('.swac_translator_lngsel');
            selElem.addEventListener('change', this.onLngChange.bind(this));

            // Check if lng is set in localStorage
            let lng = localStorage.getItem('swac_translator_lng');
            if (lng) {
                this.options.lang = lng;
            }

            this.browserlng = navigator.language || navigator.userLanguage;
            if (this.browserlng.includes('-')) {
                this.browserlng = this.browserlng.split('-')[0];
            }
            if (this.options.lang.includes('-')) {
                this.options.lang = this.options.lang.split('-')[0];
            }

            // Move to navs addonsection
            if (this.options.showInNav) {
                let navElem = document.querySelector('[swa^="Navigation"]');
                if (navElem) {
                    window.swac.reactions.addReaction(function () {
                        let adonPlace = document.querySelector('.swac_nav_addons')
                        if (adonPlace) {
                            let lngSel = document.querySelector('.swac_translator_lngsel');
                            if (lngSel)
                                adonPlace.appendChild(lngSel);
                        }
                    }, navElem.id, this.requestor.id);
                }
            }

            // Wait for component to load and than do initial translation
            let thisRef = this;
            window.swac.reactions.addReaction(function (requestors) {
                // Initial translation
                thisRef.translate();
            }, this.requestor.id);

            resolve();
        });
    }

    afterAddSet(set, repeateds) {
        let selElem = document.querySelector('.swac_translator_lngsel');
        // Create lngdef
        this.lngdefs[set.swac_lng] = {
            source: set.swac_fromName,
            setno: set.id
        };
        // Create select option
        let lngopt = selElem.querySelector('option.swac_dontdisplay').cloneNode(true);
        lngopt.classList.remove('swac_dontdisplay');
        lngopt.value = set.swac_lng;
        let lngtit = SWAC.lang.dict.Translator[set.swac_lng];
        if (set.swac_lng === this.browserlng) {
            lngtit += ' (' + SWAC.lang.dict.Translator.browserlang + ')';
        }
        // Set active
        if (set.swac_lng === this.options.lang) {
            lngopt.setAttribute('selected', 'selected');
        }
        lngopt.innerHTML = lngtit;
        selElem.appendChild(lngopt);
    }

    /**
     * Method executed when the selected language changes.
     * 
     * @param {DOMEvent} evt Change event
     * @returns {undefined}
     */
    onLngChange(evt) {
        Msg.flow('Translator','onLngChange()',this.requestor);
        let selElem = document.querySelector('.swac_translator_lngsel');
        let lngName = selElem.options[selElem.selectedIndex].value;
        localStorage.setItem('swac_translator_lng', lngName);
        this.translate();
    }

    /**
     * Performs the translation by use of the language methods from SWAC core
     * 
     */
    async translate() {
        Msg.flow('Translator','translate()',this.requestor);
        // Get selected language
        let selElem = document.querySelector('.swac_translator_lngsel');
        let lngName = selElem.options[selElem.selectedIndex].value;
        if (!this.lngdefs[lngName]) {
            UIkit.modal.alert('Sorry your language >' + this.options.lang + '< is currently not supported. You will continue in english.');
            lngName = 'en';
        }
        this.curlng = this.data[this.lngdefs[lngName].source].getSet(this.lngdefs[lngName].setno);
        for (let curLngFile of this.curlng.swac_files) {
            curLngFile = window.location.href + '/' + curLngFile;
//curLngFile = SWAC.config.app_root + '/' + curLngFile;
            // Load translation if not loaded yet
            Msg.flow('Translator', 'Try to load file >' + curLngFile + '<');
            let lngfile = curLngFile.replace('_' + this.curlng.swac_lng + '.js', '');
            let lngcodeparts = lngfile.split('/');
            let lngcode = lngcodeparts[lngcodeparts.length - 1];
            await window.swac.lang.loadTranslationFile(lngfile, lngcode, this.curlng.swac_lng);
        }
        window.swac.lang.setActiveLang(this.curlng.swac_lng);
    }
}
