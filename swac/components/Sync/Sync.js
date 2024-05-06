import SWAC from '../../swac.js';
import View from '../../View.js';
import Msg from '../../Msg.js';

export default class Sync extends View {

    constructor(options = {}) {
        super(options);
        this.name = 'Sync';
        this.desc.text = 'Component for syncronising data from a source to another.';
        this.desc.developers = 'Florian Fehring (FH Bielefeld)';
        this.desc.license = 'GNU Lesser General Public License';

        this.desc.templates[0] = {
            name: 'simple',
            style: 'simple',
            desc: 'Simple synchronisation dialog.'
        };
        this.desc.reqPerTpl[0] = {
            selc: '[name="swac_sync_done"]',
            desc: 'Shows the number of allready synced datasets.'
        };
        this.desc.reqPerTpl[1] = {
            selc: '[name="swac_sync_avail"]',
            desc: 'Shows the number of available datasets.'
        };
        this.desc.reqPerTpl[2] = {
            selc: '.swac_sync_chart',
            desc: 'Shows the syncronisation progress.'
        };
        this.desc.reqPerTpl[3] = {
            selc: '.swac_sync_startbtn',
            desc: 'Button to start syncronisation.'
        };
        this.desc.optPerTpl[0] = {
            selc: '.swac_sync_repeatForError',
            desc: 'Aera to repeat for every error.'
        };

        this.desc.opts[0] = {
            name: "syncTest",
            desc: "URL to get status of synctarget. Awaits a state below 400."
        };
        if (!options.syncTest)
            this.options.syncTest = null;

        this.desc.opts[1] = {
            name: "syncTarget",
            desc: "URL where to send the datasets"
        };
        if (!options.syncTarget)
            this.options.syncTarget = null;

        this.desc.opts[2] = {
            name: "transformFuncs",
            desc: "Map for attribute names (keys) with a function that transforms the data"
        };
        if (!options.transformFuncs)
            this.options.transformFuncs = new Map();

        if (!options.showWhenNoData)
            this.options.showWhenNoData = true;

        // Internal attributes
        this.availSets = 0;
    }

    init() {
        return new Promise((resolve, reject) => {

            let startBtn = this.requestor.querySelector('.swac_sync_startbtn');
            startBtn.setAttribute('disabled', 'disabled');
            if (this.options.syncTarget) {
                startBtn.addEventListener('click', this.onClickStart.bind(this));
            } else {
                Msg.error('Sync', 'There is no option syncTarget specified, do not know where to sync.', this.requestor);
                resolve();
                return;
            }

            // Test if sync-target is reachable
            fetch(this.options.syncTest, {method: 'HEAD'}).then(function (res) {
                if (res.status < 400)
                    startBtn.removeAttribute('disabled');
                else
                    startBtn.parentElement.appendChild(document.createTextNode(SWAC.lang.dict.Sync.notavail));
            });
            this.drawProgress();
            resolve();
        });
    }

    afterAddSet(set, repeateds) {
        this.availSets++;
        // Update avail counter
        let availOut = this.requestor.querySelector('[name="swac_sync_avail"]');
        availOut.innerHTML = this.availSets;
        return;
    }

    /**
     * Executed when user clicks on the sync start button
     * 
     * @param {DOMEvent} evt Click event
     */
    onClickStart(evt) {
        evt.preventDefault();

        let el = this.requestor.querySelector('.swac_sync_chart');
        let done = parseInt(el.getAttribute('data-percent'));
        let doneOut = this.requestor.querySelector('[name="swac_sync_done"]');
        let repForErr = this.requestor.querySelector('.swac_sync_repeatForError');
        let startBtn = this.requestor.querySelector('.swac_sync_startbtn');
        startBtn.setAttribute('disabled', 'disabled');

        let thisRef = this;
        let sendProms = [];
        for (let source in this.data) {
            for (let set of this.data[source].getSets()) {
                if (!set)
                    continue;
                let syncSet = {};
                for (let attr in set) {
                    if (attr.startsWith('swac_'))
                        continue;
                    // Transform if configured
                    if (this.options.transformFuncs.has(attr)) {
                        let transfunc = this.options.transformFuncs.get(attr);
                        syncSet[attr] = transfunc(set);
                    } else {
                        syncSet[attr] = set[attr];
                    }
                }

                let sendProm = fetch(this.options.syncTarget, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(syncSet),
                });
                sendProm.then(function (res) {
                    // Delegate error responses to catch
                    if (!res.ok)
                        throw res;
                    // Update progress bar
                    done++;
                    doneOut.innerHTML = done;
                    let percent = done / thisRef.availSets * 100;
                    el.setAttribute('data-percent', percent.toFixed(2));
                    thisRef.drawProgress();
                    // Update local dataset
                    syncSet.synced = true;
                    SWAC.Model.save({
                        data: [syncSet],
                        fromName: set.swac_fromName
                    }, true).catch(function (err) {
                        Msg.error('Sync', 'Error marking dataset as synced.', thisRef.requestor);
                    });
                }).catch(function (err) {
                    if (!repForErr) {
                        Msg.error('Sync', 'Error syncronising data.', thisRef.requestor);
                        return;
                    }
                    let error = true;
                    let repeated = repForErr.cloneNode(true);
                    repeated.classList.remove('swac_sync_repeatForError');
                    repeated.classList.add('swac_sync_repeatedForError');
                    repeated.querySelector('.uk-accordion-title').innerHTML = SWAC.lang.dict.Sync.error_title + ' ' + syncSet.id;
                    if (err.status === 404)
                        repeated.querySelector('.uk-accordion-content').innerHTML = SWAC.lang.dict.Sync.error_404;
                    else if (err.status === 409) {
                        // Mark set as allready synced
                        syncSet.synced = true;
                        SWAC.Model.save({
                            data: [syncSet],
                            fromName: set.swac_fromName
                        }, true).then(function () {
                            // Update progress bar
                            done++;
                            doneOut.innerHTML = done;
                            let percent = done / thisRef.availSets * 100;
                            el.setAttribute('data-percent', percent.toFixed(2));
                            thisRef.drawProgress();
                        }).catch(function (err) {
                            Msg.error('Sync', 'Error marking dataset as synced.', thisRef.requestor);
                            err.text().then(text => {
                                repeated.querySelector('.uk-accordion-content').innerHTML = SWAC.lang.dict.Sync.error_409 + ' ' + text;
                            });
                        });
                        error = false;
                    } else if (err.status === 500)
                        repeated.querySelector('.uk-accordion-content').innerHTML = SWAC.lang.dict.Sync.error_500;
                    else {
                        repeated.querySelector('.uk-accordion-content').innerHTML = SWAC.lang.dict.Sync.error_unknown;
                        console.log(err);
                    }
                    if (error)
                        repForErr.parentNode.appendChild(repeated);
                });
                sendProms.push(sendProm);
            }
        }
        Promise.all(sendProms).then(function () {
            startBtn.removeAttribute('disabled');
        });
    }

    drawProgress() {
        var el = this.requestor.querySelector('.swac_sync_chart'); // get canvas

        var options = {
            percent: el.getAttribute('data-percent') || 25,
            size: el.getAttribute('data-size') || 220,
            lineWidth: el.getAttribute('data-line') || 15,
            rotate: el.getAttribute('data-rotate') || 0
        }

        // Create text element
        let txt = el.querySelector('.percTxt');
        if (!txt) {
            txt = document.createElement('span');
            txt.classList.add('percTxt');
            el.appendChild(txt);
        }
        txt.textContent = options.percent + '%';

        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');
        canvas.width = canvas.height = options.size;


        el.appendChild(canvas);

        ctx.translate(options.size / 2, options.size / 2); // change center
        ctx.rotate((-1 / 2 + options.rotate / 180) * Math.PI); // rotate -90 deg

        var radius = (options.size - options.lineWidth) / 2;

        var drawCircle = function (color, lineWidth, percent) {
            percent = Math.min(Math.max(0, percent), 1);
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI * 2 * percent, false);
            ctx.strokeStyle = color;
            ctx.lineCap = 'round'; // butt, round or square
            ctx.lineWidth = lineWidth
            ctx.stroke();
        };

        drawCircle('#efefef', options.lineWidth, 100 / 100);
        drawCircle('#555555', options.lineWidth, options.percent / 100);
    }
}


