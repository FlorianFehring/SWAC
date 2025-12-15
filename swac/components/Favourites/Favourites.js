import SWAC from '../../swac.js';
import View from '../../View.js';
import Msg from '../../Msg.js';

export default class Favourites extends View {

    constructor(options = {}) {
        super(options);
        this.name = 'Favourites';
        this.desc.text = 'Create and manage favourites and app useage history.';
        this.desc.developers = 'Florian Fehring (HSBI)';
        this.desc.license = 'GNU Lesser General Public License';

        this.desc.templates[0] = {
            name: 'default',
            style: 'default',
            desc: 'Default template.'
        };
        this.desc.reqPerTpl[0] = {
            selc: '.swac_favs_favbtn',
            desc: 'Button to set the page as fav'
        };
        this.desc.reqPerTpl[1] = {
            selc: '.swac_favs_listfavs',
            desc: 'Element where to list the favs.'
        };

        this.desc.reqPerSet[0] = {
            name: 'id',
            desc: 'The attribute id is required for the component to work properly.'
        };
        this.desc.reqPerSet[1] = {
            name: 'link',
            desc: 'URL to the favourite'
        };
        this.desc.reqPerSet[2] = {
            name: 'name',
            desc: 'Favourites name'
        };
        this.desc.optPerSet[0] = {
            name: 'icon',
            desc: 'Path to a icon file or icon base64 encoded string.'
        };
        this.desc.optPerSet[1] = {
            name: 'visits',
            desc: 'Number of past visits.'
        };

        this.desc.opts[0] = {
            name: "showFavIcon",
            desc: "Show the fav icon",
        };
        if (typeof options.showFavIcon === 'undefined')
            this.options.showFavIcon = true;
        this.desc.opts[1] = {
            name: "showFavList",
            desc: "Show the fav list",
        };
        if (typeof options.showFavList === 'undefined')
            this.options.showFavList = true;
        this.desc.opts[2] = {
            name: "showHistList",
            desc: "Show the history list",
        };
        if (typeof options.showHistList === 'undefined')
            this.options.showHistList = true;
        this.desc.opts[3] = {
            name: "logToHist",
            desc: "If false the page with this configuration will not be logged in history.",
        };
        if (typeof options.logToHist === 'undefined')
            this.options.logToHist = true;

        if (!options.showWhenNoData)
            this.options.showWhenNoData = true;

        // Internal attributes
        this.favs = {};
    }

    init() {
        return new Promise((resolve, reject) => {

            // Register fav button function
            let favBtnElem = document.querySelector('.swac_favs_favbtn');
            favBtnElem.addEventListener('click', this.onClickFavBtn.bind(this));

            // Load from local storage
            let favsStore = localStorage.getItem("swac_favourites");
            if (favsStore)
                this.favs = JSON.parse(favsStore);

            // Start of link
            let lsePos = window.location.pathname.indexOf('/sites/');
            let lse = window.location.pathname.substr('0', lsePos) + '/sites/';

            // Set index no over all sets of favs and history
            let i = 0;
            // Check userfavs
            if (this.options.showFavList && this.favs.usersfavs) {
                for (let curFav in this.favs.usersfavs) {
                    if (!curFav)
                        continue;
                    i++;
                    this.favs.usersfavs[curFav].id = i;
                    // Mark page as allready in fav
                    if (curFav === window.location.pathname) {
                        favBtnElem.classList.add("swac_favs_favstar");
                        favBtnElem.setAttribute('ui-tooltip', SWAC.lang.dict.Favourites.star_tooltip_rem);
                    }

                    // Check if entry is from same application
                    if (curFav.startsWith(lse))
                        this.addSet('localStorage', this.favs.usersfavs[curFav]);
                }
            }

            // Log history
            if (!this.favs.usershistory)
                this.favs.usershistory = {};
            // Check if page is allready in history
            if (this.options.logToHist) {
                if (this.favs.usershistory[window.location.pathname])
                    this.favs.usershistory[window.location.pathname].visits++;
                else {
                    let newHist = {
                        link: window.location.pathname,
                        name: document.querySelector('title').innerHTML,
                        icon: 'history',
                        visits: 1
                    }
                    // Log title translation if exists
                    if (document.querySelector('title').hasAttribute('swac_lang'))
                        newHist.name = document.querySelector('title').getAttribute('swac_lang');
                    this.favs.usershistory[window.location.pathname] = newHist;
                }
            }

            if (this.options.showHistList) {
                let histkeys = Object.keys(this.favs.usershistory);
                let histarr = [];

                for (let curKey of histkeys) {
                    let curhist = this.favs.usershistory[curKey];
                    // Check if entry is from same application
                    if (curhist.link.startsWith(lse))
                        histarr.push(this.favs.usershistory[curKey]);
                }
                // Sort history
                histarr = histarr.sort(function (a, b) {
                    return b.visits - a.visits;
                });

                for (let curHist of histarr) {
                    if (!curHist)
                        continue;
                    i++;
                    curHist.id = i;

                    // Add favs from local storage to list
                    this.addSet('localStorage', curHist);
                }
            }

            // Save change
            localStorage.setItem('swac_favourites', JSON.stringify(this.favs));
            resolve();
        });
    }

    afterAddSet(set, repeateds) {

        // Call Components afterAddSet and plugins afterAddSet
        super.afterAddSet(set, repeateds);

        return;
    }

    /**
     * Executed when user clicks the fav button. Makes the page a fav or if it 
     * is allready removes the fav.
     */
    onClickFavBtn(evt) {
        evt.preventDefault();
        let path = window.location.pathname;
        let pagename = document.querySelector('title').innerHTML;
        // Log title translation if exists
        if (document.querySelector('title').hasAttribute('swac_lang'))
            pagename = document.querySelector('title').getAttribute('swac_lang');

        // Load from local storage (reload here to prevent dataloss if user clicks in other window)
        let favsStore = localStorage.getItem("swac_favourites");
        if (favsStore)
            this.favs = JSON.parse(favsStore);

        // Get button element
        let btnElem = evt.target;
        while (!btnElem.classList.contains('uk-icon-button') && btnElem.parentElement) {
            btnElem = btnElem.parentElement;
        }

        if (btnElem.classList.contains('swac_favs_favstar')) {
            // Remove fav
            btnElem.classList.remove('swac_favs_favstar');
            btnElem.setAttribute('ui-tooltip', SWAC.lang.dict.Favourites.star_tooltip_add);
            delete this.favs.usersfavs[path];
        } else {
            // Add fav
            btnElem.classList.add('swac_favs_favstar');
            if (!this.favs.usersfavs) {
                this.favs.usersfavs = {};
            }
            this.favs.usersfavs[path] = {
                link: path,
                name: pagename,
                icon: 'star'
            };
        }

        localStorage.setItem('swac_favourites', JSON.stringify(this.favs));
    }
}


