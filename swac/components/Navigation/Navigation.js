import SWAC from '../../swac.js';
import View from '../../View.js';
import Msg from '../../Msg.js';

/* 
 * This component realises an navigation and it's navigation layout elements
 */
export default class Navigation extends View {

    constructor(options = {}) {
        super(options);
        this.name = 'Navigation';
        this.desc.text = 'The nav component gives you the possibility to simply create a navigation toolbar from data. But not only a toolbar is provied, it also gives methods for building links and navigation calls that can carry parameters and are only displayed on matching conditions.';
        this.desc.developers = 'Florian Fehring (HSBI)';
        this.desc.license = 'GNU Lesser General Public License';

        this.desc.templates[0] = {
            name: 'nav',
            style: 'nav',
            desc: 'Responsive navigation menue for big and small screens. Awaits a logo.png/avif in ../files/icons/'
        };
        this.desc.templates[1] = {
            name: 'nav_nologo',
            style: 'nav_nologo',
            desc: 'Responsive navigation menue with logo for big and small screens. Without logo.'
        };
        this.desc.templates[2] = {
            name: 'sitemap',
            style: 'sitemap',
            desc: 'Simple sitemap generated from the navigation data.'
        };
        this.desc.templates[3] = {
            name: 'webPush',
            style: 'webPush',
            desc: 'Simple sitemap generated from the navigation data.'
        };
        this.desc.styles[0] = {
            selc: ".swac_navigation_head",
            desc: "Makes the navigation a head navigation that stays sticky in its position on scrolling."
        };
        this.desc.styles[1] = {
            selc: ".swac_navigation_foot",
            desc: "Makes the navigation a foot navigation, that is displayed below the pages content, at least at the end of the page."
        };

        this.desc.optPerTpl[0] = {
            selc: '.swac_nav_addons',
            desc: 'Place where to add addons to the navigation. (User, language selection, ...)'
        }
        this.desc.optPerTpl[1] = {
            selc: '.swac_nav_sitemap',
            desc: 'Element where to place a sitemap.'
        }
        this.desc.optPerTpl[2] = {
            selc: '.swac_navigation_sitemapsave',
            desc: 'Button to save the sitemap.'
        }

        this.desc.reqPerSet[0] = {
            name: 'id',
            desc: 'Id of the navigation dataset used for building hierarchies'
        };
        this.desc.reqPerSet[1] = {
            name: 'rfrom',
            desc: 'Regular expression from which sites this navigation rule shold apply. (* = from all; -m not from menue)'
        };
        this.desc.reqPerSet[2] = {
            name: 'rto',
            desc: 'Path to the target'
        };
        this.desc.reqPerSet[3] = {
            name: 'name',
            desc: 'Name of the navigation entry when shown in menue'
        };

        this.desc.optPerSet[0] = {
            name: 'parent',
            desc: 'Reference path ref:// to the parent navigation entry.'
        };

        this.desc.opts[0] = {
            name: "logoName",
            desc: "Name of the logo as it is available within /files/icons/ directory. Without fileending."
        };
        if (!options.logoName)
            this.options.logoName = 'logo';
        this.desc.opts[1] = {
            name: "logoLink",
            desc: "Link a click on logo should lead to"
        };
        if (!options.logoLink)
            this.options.logoLink = '../index.html';

        this.desc.funcs[0] = {
            name: 'routeTo',
            desc: 'Routes the user to the page with the given name or file',
            params: [
                {
                    name: 'fileOrName',
                    desc: 'File or name of the target'
                },
                {
                    name: 'param_value',
                    desc: 'Value of the parameter to send with the call'
                },
                {
                    name: 'param_name',
                    desc: 'Name of the parameter to send with the call, "id" per default'
                }
            ]
        };
    }

    /**
     * Creates an new navigation instance
     * 
     */
    init() {
        return new Promise((resolve, reject) => {
            // Create routings for tags
            this.registerRouteToElems();
            // Register sitemap export function
            let exportBtn = this.requestor.querySelector('.swac_navigation_sitemapsave');
            if (exportBtn) {
                exportBtn.addEventListener('click', this.exportSitemapCode.bind(this));
            }

            let srcsets = this.requestor.querySelectorAll('[data-srcset]');
            for (let curImg of srcsets) {
                let imgsrc = curImg.getAttribute('data-srcset').replace('logo', this.options.logoName);
                curImg.setAttribute('srcset', SWAC.config.app_root + imgsrc);
            }
            let srcs = this.requestor.querySelectorAll('[data-src]');
            for (let curImg of srcs) {
                let imgsrc = curImg.getAttribute('data-src').replace('logo', this.options.logoName);
                curImg.setAttribute('src', SWAC.config.app_root + imgsrc);
            }

            // Set logo link with url from options
            let alogolinks = this.requestor.querySelectorAll('a.uk-logo');
            for (let alogolink of alogolinks) {
                let link = SWAC.config.app_root + '/sites/' + this.options.logoLink;
                alogolink.setAttribute('href', link);
            }

            resolve();
        });
    }

    // Inheritted
    afterAddSet(set, repeateds) {
        let repForSets = this.requestor.querySelectorAll('[swac_fromname="' + set.swac_fromName + '"][swac_setid="' + set.id + '"]');
        for (let curRepForSet of repForSets) {
            // Look at each link
            let as = curRepForSet.querySelectorAll('a');
            for (let curA of as) {
                let curHref = curA.getAttribute('href');
                if (!curHref.startsWith('#') && !curHref.startsWith('http')) {
                    curA.setAttribute('href', SWAC.config.app_root + '/sites/' + curHref);
                }
            }
        }
    }

    /**
     * Finds all HTML Elements with routeTo class and activates routing functionallity
     * on them
     * 
     * @returns {undefined}
     */
    registerRouteToElems() {
        let routeElems = document.querySelectorAll('[routeTo]');
        for (let routeElem of routeElems) {
            routeElem.addEventListener("click", this.routeToFromElem);
        }
    }

    /**
     * Function for handling events and transform them into an routing action.
     * 
     * @param {type} evt Event where the action occured
     * @returns {undefined}
     */
    routeToFromElem(evt) {
        let attrStr = evt.target.getAttribute('routeTo');
        if (attrStr !== null) {
            let attrParts = attrStr.split(',');
            this.routeTo(attrParts[0], attrParts[1], attrParts[2]);
        }
    }

    /**
     * Routes the user to a page with the given name or address
     *
     * @return true if target was found
     **/
    routeTo(fileOrName, params = null) {
        let found = false;
        for (let curSource in this.data) {
            for (let curSet of this.data[curSource].getSets()) {
                if (!curSet)
                    continue;
                // Check if matching
                if (curSet.rto.indexOf(fileOrName) > -1 || curSet.name.indexOf(fileOrName) > -1) {
                    // Build target url
                    let url = SWAC.config.app_root + '/sites/' + curSet.rto;
                    if (params !== null) {
                        url += '?';
                        let i = 0;
                        for (let curParamName in params) {
                            if (i > 0)
                                url += '&';
                            url += curParamName + '=' + params[curParamName];
                            // save used param as last used param
                            if (typeof (Storage) !== "undefined") {
                                localStorage.setItem(curParamName, params[curParamName]);
                            }
                            i++;
                        }
                    }
                    window.location.href = url;
                    found = true;
                    break;
                }
            }
        }

        if (!found) {
            // If this code is reached, there is no route to the given fileOrName
            // Create notification popup
            UIkit.notification({
                message: SWAC.lang.dict.Navigation.noroute,
                status: 'error',
                timeout: SWAC.config.notifyDuration,
                pos: 'top-center'
            });
            Msg.error('nav', 'There was no route to page or file >' + fileOrName + '< found.');
        }
        return found;
    }

    /**
     * Gets an navigation param that is requested useing an route.
     * If local storage is available uses the last requested param even if there
     * is no param given in the current route call.
     * 
     * @param {String} param_name Name of the id wantet (default is id)
     * 
     * @returns {undefined}
     */
    getRequestedParam(param_name = "id") {
        let id = undefined;
        // Load last used id
        if (typeof (Storage) !== "undefined") {
            id = localStorage.getItem(param_name);
        }
        // Get current requested id
        id = SWAC.getParameterFromURL(param_name, window.location);
        return parseInt(id);
    }

    exportSitemapCode() {
        let sitemapElem = this.requestor.querySelector('.swac_nav_sitemap');
        if (!sitemapElem) {
            alert('Could not find sitemap element');
            return;
        }
        let repeatForSets = sitemapElem.querySelectorAll('.swac_repeatForSet');
        for (let curRepForSet of repeatForSets) {
            curRepForSet.parentElement.removeChild(curRepForSet);
        }
        let sitemapCode = sitemapElem.outerHTML;
        // Remove not needed code fragments
        sitemapCode = sitemapCode.replace(new RegExp('<swac-bp attrname="name">', 'g'), '');
        sitemapCode = sitemapCode.replace(new RegExp('</swac-bp>', 'g'), '');
        sitemapCode = sitemapCode.replace(new RegExp(' <div class="swac_forChilds"> </div>', 'g'), '');
        // Create display element
        let sitemapCodeElem = document.createElement('div');
        sitemapCodeElem.innerHTML = this.encode(sitemapCode);
        //        this.requestor.appendChild(sitemapCodeElem);
        UIkit.modal.alert(sitemapCodeElem)
    }

    /**
     * Converts a string to its html characters completely.
     *
     * @param {String} str String with unescaped HTML characters
     **/
    encode(str) {
        var buf = [];

        for (var i = str.length - 1; i >= 0; i--) {
            buf.unshift(['&#', str[i].charCodeAt(), ';'].join(''));
        }

        return buf.join('');
    }
    /**
     * Converts an html characterSet into its original character.
     *
     * @param {String} str htmlSet entities
     **/
    decode(str) {
        return str.replace(/&#(\d+);/g, function (match, dec) {
            return String.fromCharCode(dec);
        });
    }

    /**
     * Tries to execute the command given peer speach
     *
     * @param(String) Spoken command
     **/
    speechCommand(cmd) {
        if (cmd.includes(SWAC.lang.dict.Navigation.goto)) {
            // Get target
            let target = cmd.replace(SWAC.lang.dict.Navigation.goto, '').trim();
            // Find target in sets
            if (!this.routeTo(target)) {
                target = target.replace(/\s/g, '');
                if (!this.routeTo(target)) {
                    return SWAC.lang.dict.Navigation.goto_notfound;
                }
            }
            return '';
        }
        return null;
    }
}