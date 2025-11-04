import SWAC from '../../swac.js';
import View from '../../View.js';
import Msg from '../../Msg.js';

export default class Surfbar extends View {

    constructor(options = {}) {
        super(options);
        this.name = 'Surfbar';
        this.desc.text = 'With Surfbar you can create automatic calling of webpages for showcases.';
        this.desc.developers = 'Florian Fehring';
        this.desc.license = '(c) by Florian Fehring';

        this.desc.templates[0] = {
            name: 'default',
            desc: 'Default surfbar template.'
        };
        this.desc.reqPerTpl[0] = {
            selc: '.swac_surfbar_startstopbtn',
            desc: 'Button to start or stop surfbar running.'
        };
        this.desc.reqPerTpl[1] = {
            selc: '.swac_surfbar_counter',
            desc: 'Place where to show the visit counter.'
        };
        this.desc.reqPerSet[0] = {
            name: 'id',
            desc: 'Datasets id. Required for ordering.'
        };
        this.desc.reqPerSet[1] = {
            name: 'link',
            desc: 'HTTP link to a page or document.'
        };
        this.desc.reqPerSet[2] = {
            name: 'ma',
            desc: 'Visits duration in seconds.'
        };
        this.desc.optPerSet[0] = {
            name: 'reload',
            desc: 'Time until page or document is viewd again in hours.'
        };

        if (!options.plugins) {
            this.options.plugins = new Map();
        }

        // Internal attributes
        this.currentSet = 0;
        this.interval = null;
        this.second = 0;
        this.hits = null;
    }

    init() {
        return new Promise((resolve, reject) => {

            // Init start button
            let startstopBtn = this.requestor.querySelector('.swac_surfbar_startstopbtn');
            startstopBtn.addEventListener('click', this.onClickStartStopButton.bind(this));

            // Page calls
            let hits = localStorage.getItem('swac_surfbar_hits');
            if (hits) {
                this.hits = JSON.parse(hits);
            } else {
                this.hits = [];
            }
            resolve();
        });
    }

    afterAddSet(set, repeateds) {
        // Get repeateds if they are unkown
        if (!repeateds) {
            repeateds = this.requestor.querySelectorAll('[swac_setid="' + set.id + '"][swac_fromName="' + set.swac_fromName + '"]');
        }
        super.afterAddSet(set, repeateds);
    }

    onClickStartStopButton(evt) {
        evt.preventDefault();
        if (this.interval) {
            clearInterval(this.interval);
        } else {
            this.nextPage();
            let counterElem = this.requestor.querySelector('.swac_surfbar_counter');
            let thisRef = this;
            this.interval = setInterval(function () {
                thisRef.second--;
                counterElem.innerHTML = thisRef.second;
            }, 1000);
        }
    }

    nextPage() {
        let thisRef = this;

        // Get next id
        this.currentSet++;
        // Loop over empty entries
        let set = this.data[this.options.mainSource].sets[this.currentSet];
        while (!set) {
            // Reset counter if there is no more set
            if (this.currentSet >= this.data[this.options.mainSource].sets.length) {
                this.currentSet = 0;
                return;
            }
            this.currentSet++;
            set = this.data[this.options.mainSource].sets[this.currentSet];
        }

        // Search link in hits for avoid reshow before time
        if (set.ts) {
            for (let curHit of this.hits) {
                if (curHit.link === set.link) {
                    let pastTime = (Date.now() - curHit.ts) / 1000;
                    let leftTime = (set.reload * 60 * 60) - pastTime;
                    if (leftTime > 0) {
                        return;
                    }
                }
            }
        }

        // Calculate time on page
        let timeOnPage = 30;
        if (set.ma) {
            timeOnPage = set.ma + 3;
        }
        this.second = timeOnPage;
        // open page
        let adpage = window.open(set.link, "adpage");
        // close page after time
        window.setTimeout(function () {
            adpage.close();

            // Notice click after timeout
            thisRef.hits.push({
                link: set.link,
                ts: Date.now()
            });
            // Save clicks to localStorage
            localStorage.setItem('swac_surfbar_hits', JSON.stringify(thisRef.hits));

            thisRef.nextPage();
        }, timeOnPage * 1000);
    }
}