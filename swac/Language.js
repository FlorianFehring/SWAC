import SWAC from './swac.js';
import Msg from './Msg.js';

/* 
 * Loads and manages languages, do translates
 */
export default class Language {

    constructor() {
        this.availLangs = {};
        this.activeLang = 'en';
        this.dict = {};
        this.translatedComps = [];
        this.translateAttrnames = true;
        this.formatLocale = true;

        // Check if language was choosen
        if (typeof SWAC.config.lang !== 'undefined') {
            this.activeLang = SWAC.config.lang;
        } else {
            this.activeLang = navigator.language || navigator.userLanguage;
            let bindStrPos = this.activeLang.indexOf('-');
            if (bindStrPos > 0) {
                this.activeLang = this.activeLang.substring(0, bindStrPos);
            }
            Msg.warn('swac', 'There is no language configured in configuration. Automatic choosen >' + this.activeLang + '< from browser.');
        }
    }

    /**
     * Sets the active language
     * 
     * @param {String} lang ISO language term
     */
    setActiveLang(lang) {
        this.activeLang = lang;
        if (this.availLangs[lang]) {
            this.dict = this.availLangs[lang];
        } else {
            this.availLangs[lang] = {};
            this.dict = this.availLangs[lang];
        }

        // Load language files
        let thisRef = this;
        this.loadTranslationFile('./langs/', 'core').then(function () {
            // Load translations for components if not loaded yet
            let loadProms = [];
            let forRequestors = [];
            for (let curRequestor of thisRef.translatedComps) {
                loadProms.push(thisRef.loadComponentTranslation(curRequestor));
                forRequestors.push(curRequestor);
            }
            Promise.all(loadProms).then(function () {
                thisRef.translateAll(document);
                let completeEvent = new CustomEvent('swac_lang_loaded', {
                    detail: {
                        lang: lang,
                        requestors: forRequestors
                    }
                });
                document.dispatchEvent(completeEvent);
            });

        });
    }

    /**
     * Loads a components language file.
     * 
     * @param {SWACrequestor} requestor Requestor for which language should be loaded
     * @param {String} lang Language to load
     * 
     * @returns {Promise}
     */
    loadComponentTranslation(requestor, lang) {
        let thisRef = this;
        return new Promise((resolve, reject) => {
            let compDirPathPos = requestor.componentPath.lastIndexOf('/');
            let compDirPath = requestor.componentPath.substring(0, compDirPathPos);
            let langfile_url = compDirPath + '/langs/';
            let objectname = requestor.swac_comp.name;
            objectname = objectname.replace('/plugins/', '/');
            objectname = objectname.replace('/', '_');

            if (langfile_url.startsWith('app_')) {
                langfile_url = window.location.href + langfile_url;
            }

            thisRef.loadTranslationFile(langfile_url, objectname, lang).then(function () {
                if (!thisRef.translatedComps.includes(requestor)) {
                    thisRef.translatedComps.push(requestor);
                }
                resolve();
            }).catch(function (err) {
                Msg.error('language', 'Could not load component language file >'
                        + thisRef.activeLang + '< for component >'
                        + requestor.swac_comp.name + '<: ' + err);
                reject();
            });
        });
    }

    /**
     * Loads a translation file. (javascript object file)
     * 
     * @param {String} filepath Path to the translation file without language information
     * @param {String} objectname Name of the object within the language file
     * @param {String} lang Language to load
     * @returns {Promise}
     */
    loadTranslationFile(filepath, objectname, lang) {
        let thisRef = this;
        return new Promise((resolve, reject) => {
            if (!lang)
                lang = thisRef.activeLang;
            // Autodetect requested language
            if (!filepath.endsWith('/')) {
                filepath += '_';
            }
            let filep = filepath + lang + '.js?vers=' + SWAC.desc.version;
            Msg.flow('Language', 'Try to load language file >' + filep + '<');
            import(filep).then(module => {
                if (module.default) {
                    thisRef.addTranslation(module.default, objectname, lang);
                    resolve();
                } else
                    reject('Language file >' + filep + '< has no export default.');
            }).catch(err => {
                Msg.error('language', 'Could not load language file >'
                        + thisRef.activeLang + '< for: ' + objectname + '<: ' + err);
                // try load english instead
                let filep2 = filepath + 'en.js?vers=' + SWAC.desc.version;
                import(filep2).then(module => {
                    if (module.default) {
                        thisRef.addTranslation(module.default, objectname, lang);
                        resolve();
                    } else
                        reject('Language file >' + filep + '< has no export default.');
                }).catch(function (err2) {
                    Msg.error('language', 'Could not load english fallback language file for >'
                            + thisRef.activeLang + '<: ' + err2);
                    reject();
                });
            });
        });
    }

    /**
     * Adds the contents of a given object given by its global name to the language
     * store.
     * 
     * @param {Object} langObj      Object with language attributes
     * @param {String} objectname   Name under which the lang should be accessabile
     * @param {String} lang         Shorthand language identifier
     * @returns {undefined}
     */
    addTranslation(langObj, objectname, lang) {
        if (!this.availLangs[lang])
            this.availLangs[lang] = {};
        this.availLangs[lang][objectname] = langObj;
        if (lang === this.activeLang) {
            this.dict = this.availLangs[lang];
        }
    }

    /**
     * Execute all translations
     * 
     * @param {DOMElement} elem elem where to translate
     * @returns {undefined}
     */
    translateAll(elem = document) {
        Msg.flow('Language', 'translateAll()');
        this.translateTexts(elem);
        this.translateInAttributes(elem);
        this.translateInElements(elem);
        this.translateAttributes(elem);
        this.translateInButtons(elem);
        this.translateAttributenames(elem);
        this.translateFormatLocale(elem);
    }

    /**
     * Translate text block contents
     * 
     * @param {DOMElement} elem elem where to translate
     * @returns {undefined}
     */
    translateTexts(elem = document) {
        Msg.flow('Language', 'translateTexts()');
        // Translate texts
        let allblocks = elem.querySelectorAll("[swac_lang]");
        for (let block of allblocks) {
            let langWordId = block.getAttribute('swac_lang');
            let translation = this.getTranslationForId(langWordId);
            if (translation) {
                block.innerHTML = translation;
            }
    }
    }

    /**
     * Translate in placeholders
     * 
     * @param {DOMElement} elem elem where to translate
     */
    translateInAttributes(elem = document) {
        let supported = ['placeholder', 'title', 'uk-tooltip', 'alt', 'data-label'];
        for (let curSup of supported) {
            let allplaceh = elem.querySelectorAll('[' + curSup + ']');
            for (var placeh of allplaceh) {
                let langWordId = placeh.getAttribute('swac_lang_id_' + curSup);
                if (!langWordId) {
                    langWordId = placeh.getAttribute(curSup);
                    placeh.setAttribute('swac_lang_id_' + curSup, langWordId);
                }
                let translation = this.getTranslationForId(langWordId);
                if (translation) {
                    placeh.attributes.getNamedItem(curSup).value = translation;
                }
            }
    }
    }

    /**
     * Translate all buttons
     * 
     * @param {DOMElement} elem elem where to translate
     */
    translateInElements(elem = document) {
        let elems = [];
        elems.push(...elem.querySelectorAll('button').values());
        elems.push(...elem.querySelectorAll('label').values());
        elems.push(...elem.querySelectorAll('legend').values());
        elems.push(...elem.querySelectorAll('option').values());
        elems.push(...elem.querySelectorAll('a').values());
        elems.push(...elem.querySelectorAll('li').values());
        elems.push(...elem.querySelectorAll('dd').values());
        elems.push(...elem.querySelectorAll('th').values());

        for (let curElem of elems) {
            //Do not translate elements with html content
            if (curElem.firstElementChild)
                continue;
            //Do not translate elements that have no lang_id and no content
            let langWordId = curElem.getAttribute('swac_lang_id');
            if ((!langWordId && !curElem.innerHTML))
                continue;

            if (!langWordId) {
                langWordId = curElem.innerHTML;
                curElem.setAttribute('swac_lang_id', langWordId);
            }
            let translation = this.getTranslationForId(langWordId);
            if (translation) {
                curElem.innerHTML = translation;
            }
    }
    }

    /**
     * Translate all buttons
     * 
     * @param {DOMElement} elem elem where to translate
     */
    translateInButtons(elem = document) {
        let buttons = [];
        buttons.push(...elem.querySelectorAll('input[type="submit"]').values());
        buttons.push(...elem.querySelectorAll('input[type="button"]').values());

        for (let curButton of buttons) {
            let langWordId = curButton.getAttribute('swac_lang_id');
            //No translation for elements conaining subs
            if (curButton.childElementCount > 0)
                continue;
            if (!langWordId) {
                langWordId = curButton.value;
                curButton.setAttribute('swac_lang_id', langWordId);
            }
            let translation = this.getTranslationForId(langWordId);
            if (translation) {
                curButton.value = translation;
            }
    }
    }

    /**
     * Translate attributes useing the swac_langattr attribute
     * 
     * @param {DOMElement} elem elem where to translate
     */
    translateAttributes(elem = document) {
        let allattr = elem.querySelectorAll("[swac_langattr]");
        for (var attrdefelem of allattr) {
            // Get attrdef
            let attrdef = attrdefelem.getAttribute("swac_langattr");
            let attrdefs = attrdef.split(' ');
            for (let curAttrdef of attrdefs) {
                let ids = curAttrdef.split(':');
                let translation = this.getTranslationForId(ids[1]);
                if (translation) {
                    attrdefelem.setAttribute(ids[0], translation);
                    if (ids[0] in attrdefelem) {
                        attrdefelem[ids[0]] = translation;
                    }
                }
            }
        }
    }

    /**
     * Translates names of attributes
     * 
     * @param {DOMElement} elem where to translate 
     */
    translateAttributenames(elem = document) {
        let attrBPs = elem.querySelectorAll('swac-bp[attrname="attrName"]');
        for (let curbp of attrBPs) {
            if (!curbp.hasAttribute('swac_lang_id')) {
                curbp.setAttribute('swac_lang_id', curbp.innerHTML);
                let translation = this.getTranslationForId(curbp.innerHTML);
                if (translation) {
                    curbp.innerHTML = translation;
                }
            }
    }
    }

    /**
     * Formats decimals, dates and times by locales matching the choosen language
     * 
     * @param {DOMElement} elem where to format
     */
    translateFormatLocale(elem = document) {
        let decimalElems = [];
        decimalElems.push(...elem.querySelectorAll('[swac_lang_format="decimal"]').values());
        decimalElems.push(...elem.querySelectorAll('[itemprop="price"]').values());
        for (let curElem of decimalElems) {
            if (curElem.innerHTML.startsWith('{'))
                continue;
            if (curElem.children.length === 0) {
                this.localiseDecimal(curElem);
            } else {
                for (let curChild of curElem.children) {
                    this.localiseDecimal(curChild);
                }
            }
        }
        let datetimeElems = elem.querySelectorAll('[swac_lang_format="datetime"]');
        for (let curElem of datetimeElems) {
            if (curElem.children.length === 0) {
                this.localiseDate(curElem, 'toLocaleString');
            } else {
                for (let curChild of curElem.children) {
                    this.localiseDate(curChild, 'toLocaleString');
                }
            }
        }
        let dateElems = elem.querySelectorAll('[swac_lang_format="date"]');
        for (let curElem of dateElems) {
            if (curElem.children.length === 0) {
                this.localiseDate(curElem, 'toLocaleDateString');
            } else {
                for (let curChild of curElem.children) {
                    this.localiseDate(curChild, 'toLocaleDateString');
                }
            }
        }
        let timeElems = elem.querySelectorAll('[swac_lang_format="time"]');
        for (let curElem of timeElems) {
            if (curElem.children.length === 0) {
                this.localiseDate(curElem, 'toLocaleTimeString');
            } else {
                for (let curChild of curElem.children) {
                    this.localiseDate(curChild, 'toLocaleTimeString');
                }
            }
        }
        let dayElems = elem.querySelectorAll('[swac_lang_format="day"]');
        for (let curElem of dayElems) {
            if (curElem.children.length === 0) {
                this.localiseDate(curElem, 'toLocaleDateString', {weekday: 'short'});
            } else {
                for (let curChild of curElem.children) {
                    this.localiseDate(curChild, 'toLocaleDateString', {weekday: 'short'});
                }
            }
    }
    }

    /**
     * Localise decimal content
     */
    localiseDecimal(elem) {
        // Do not parse placeholders
        if (elem.innerHTML.startsWith('{'))
            return;
        let value = elem.getAttribute('swac_lang_localeorig');
        if (!value) {
            value = elem.innerHTML;
            elem.setAttribute('swac_lang_localeorig', elem.innerHTML);
        }
        let parsed = Number.parseFloat(value);
        if (parsed) {
            let decPlaces = elem.getAttribute('swac_round');
            if (decPlaces)
                parsed = parsed.toFixed(decPlaces);
            else if (elem.parentElement.hasAttribute("itemprop") && elem.parentElement.getAttribute("itemprop") === 'price')
                parsed = parsed.toFixed(2);
            elem.innerHTML = parsed.toLocaleString(this.activeLang);
        }
    }

    /**
     * Localise a date content
     * 
     * @param {DOMElement} elem Element to format contents
     * @param {String} func Name of the date object function to use
     */
    localiseDate(elem, func, params) {
        // Do not parse placeholders
        if (elem.innerHTML.startsWith('{'))
            return;
        let value = elem.getAttribute('swac_lang_localeorig');
        if (!value) {
            value = elem.innerHTML;
            elem.setAttribute('swac_lang_localeorig', elem.innerHTML);
        }
        let parsed = Date.parse(value);
        if (parsed) {
            let date = new Date(parsed);
            elem.innerHTML = date[func](this.activeLang, params);
        }
    }

    /**
     * Gets the translation for the given id
     * 
     * @param {String} id Translation key (Component.Expression)
     * @returns {String} Translation
     */
    getTranslationForId(id) {
        // exclude placeholder
        if (!id || id.startsWith('{'))
            return null;
        // get from app level
        if (this.dict.app && this.dict.app[id])
            return this.dict.app[id];

        let lngPath = id.split('.');
        // Search language entry
        let dict = this.dict;
        for (let j in lngPath) {
            let lngPathAdd = lngPath[j];
            // Check if langpath is followable
            if (dict[lngPathAdd]) {
                dict = dict[lngPathAdd];
            } else if (SWAC.config.debug.includes('lang') || SWAC.config.debug === 'all') {
                Msg.warn('view', 'Language entry >' + lngPathAdd + '< not found.');
                break;
            }
            // Break if langpath reached an String
            if (typeof dict === 'string') {
                return dict;
            }
        }
        return null;
    }

    /**
     * Replaces text in element
     * 
     * @param {DOMElement} element Element where to replace
     * @param {String} pattern Pattern to replace
     * @param {String} replacement Replacement for pattern matching parts
     */
    replaceInText(element, pattern, replacement) {
        for (let node of element.childNodes) {
            switch (node.nodeType) {
                case Node.ELEMENT_NODE:
                    this.replaceInText(node, pattern, replacement);
                    break;
                case Node.TEXT_NODE:
                    node.textContent = node.textContent.replace(pattern, replacement);
                    break;
                case Node.DOCUMENT_NODE:
                    this.replaceInText(node, pattern, replacement);
            }
        }
    }

    /**
     * Gets the given phrase returned with replaced placeholder.
     * 
     * @param {String} phrase Phrase where to replace
     * @param {String} placeholder Id of the placeholder
     * @param {String} value Value to insert
     * @returns {String} Phrase with replaced placeholder
     */
    replacePlaceholders(phrase, placeholder, value) {
        return phrase.replace(new RegExp('%' + placeholder + '%', 'g'), value);
    }
}