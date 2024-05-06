import SWAC from '../../../../swac.js';
import Plugin from '../../../../Plugin.js';
import Msg from '../../../../Msg.js';

export default class TimelineSPL extends Plugin {
    constructor(options = {}) {
        super(options);
        this.name = 'Worldmap2d/plugins/Timeline';
        this.desc.text = 'Plugin to navigate though data with a timeline.';

        this.desc.templates[0] = {
            name: 'timeline',
            style: 'timeline',
            desc: 'Default template for Timeline',
        };

        this.desc.opts[0] = {
            name: "startTS",
            desc: "Date and time the timeline starts with"
        };
        if (!options.startTS) {
            this.options.startTS = new Date();
            this.options.startTS.setDate(this.options.startTS.getDate() - 30);
        }

        this.desc.opts[1] = {
            name: "endTS",
            desc: "Date and time the timeline ends with"
        };
        if (!options.endTS)
            this.options.endTS = new Date();

        this.desc.opts[2] = {
            name: "tsAttr",
            desc: "Name of the attribute containing time information"
        };
        if (!options.tsAttr)
            this.options.tsAttr = 'ts';

        this.desc.opts[3] = {
            name: "outOfTimeOpacity",
            desc: "Sets the opacity of markers that are out of the time range."
        };
        if (!options.outOfTimeOpacity)
            this.options.outOfTimeOpacity = 0.0;

        this.desc.opts[4] = {
            name: "animationStepSize",
            desc: "Size of one step in seconds when playing the timeline animation"
        };
        if (!options.animationStepSize)
            this.options.animationStepSize = 60 * 60 * 24;

        this.desc.opts[5] = {
            name: "animationSpeed",
            desc: "Milliseconds after that should the next animation step performed"
        };
        if (!options.animationSpeed)
            this.options.animationSpeed = 1000;

        this.desc.opts[6] = {
            name: "animationTimeRange",
            desc: "Timerange around the actual shown date from which sets should be shown."
        };
        if (!options.animationTimeRange)
            this.options.animationTimeRange = 60 * 60 * 24;

        // Attributes for internal usage
        this.date_mark_maping = {};
        this.map = null;
        this.percentStep = 0;
        this.interval;
    }

    init() {
        return new Promise((resolve, reject) => {
            this.map = this.requestor.parent.swac_comp.viewer;

            // Move timeline control on top of map
            let timelineElem = this.requestor.parent.querySelector('.swac_worldmap2d_timeline');
            // disable map interactions
            L.DomEvent.disableClickPropagation(timelineElem, 'click', L.DomEvent.stopPropagation);
            L.DomEvent.disableClickPropagation(timelineElem, 'dblclick', L.DomEvent.stopPropagation);

            // Register button action
            let playBtn = this.requestor.parent.querySelector('.swac_worldmap2d_playBtn');
            playBtn.addEventListener('click', this.onTogglePlay.bind(this));
            timelineElem.addEventListener('click', this.onClickTimeline.bind(this));
            let downlBtn = this.requestor.parent.querySelector('.swac_worldmap2d_downloadBtn');
            downlBtn.addEventListener('click', this.onClickDownload.bind(this));

            // Set initial values of the timeline
            this.updateTimeline();

            // Calculate percentage for animation step
            this.percentStep = this.calculateStepSizePercentage();

            // Create CSS rules
            var style = document.createElement('style');
            style.innerHTML = '.outoftimeIcon { opacity: ' + this.options.outOfTimeOpacity + '; }';
            document.head.appendChild(style);

            // Set change listener for datetime selector
            let timeInfoElem = this.requestor.parent.querySelector('.swac_worldmap2d_timeline_viewdate');
            timeInfoElem.addEventListener('change', this.onDateTimeChanged.bind(this));

            resolve();
        });
    }

    /**
     * Check if the added set lies in the actual displayed range.
     * Hides sets that are not in range
     *
     * @param {WatchableSet} set Dataset added
     */
    afterAddSet(set, repeateds) {
        let setDate = new Date(set[this.options.tsAttr]);

        if (setDate < this.options.startTS) {
            this.options.startTS = setDate;
            this.updateTimeline();
        }

        if (setDate > this.options.endTS) {
            this.options.endTS = setDate;
            this.updateTimeline();
        }

        let marker = this.requestor.parent.swac_comp.markers[set.swac_fromName][set.id];

        let timeInfoElem = this.requestor.parent.querySelector('.swac_worldmap2d_timeline_viewdate');

        if (timeInfoElem.value && (setDate < this.options.startTS || setDate > this.options.endTS)) {
            marker._icon.classList.add('outoftimeIcon');
            marker._shadow.style['opacity'] = 0.0;
        }
        marker._icon.setAttribute('uk-tooltip', set.id);
        // Add to date_mark_maping (for efficent access on timeline change)
        if (!this.date_mark_maping[set.swac_fromName])
            this.date_mark_maping[set.swac_fromName] = [];
        this.date_mark_maping[set.swac_fromName].push({date: setDate, marker: marker});
    }

    /**
     * When timeline was clicked
     */
    onClickTimeline(evt) {
        this.showDataFrom(this.calcDateFromTimeline());
    }

    /**
     * Toggle the play function
     */
    onTogglePlay(evt) {
        evt.preventDefault();
        let timelineElem = this.requestor.parent.querySelector('.swac_worldmap2d_timeline_progress');
        // Reset to start if animation was completed
        if (parseFloat(timelineElem.value) >= 100) {
            timelineElem.value = 0;
            clearInterval(this.interval);
            this.interval = false;
        }

        if (!this.interval) {
            this.interval = setInterval(this.playNextStep.bind(this), this.options.animationSpeed);
        } else {
            clearInterval(this.interval);
            this.interval = false;
        }
    }

    /**
     * Reaction to changes in the datetime input field. Executes a change of viewd data
     * 
     */
    onDateTimeChanged(evt) {
        evt.preventDefault();
        let timeInfoElem = this.requestor.parent.querySelector('.swac_worldmap2d_timeline_viewdate');
        let date = new Date(timeInfoElem.value);
        this.showDataFrom(date);
        this.updateTimepointer(date);
    }

    /**
     * Calculates the position on the timeline for the next animation step and calls
     * data show for this position
     */
    playNextStep() {
        let timelineElem = this.requestor.parent.querySelector('.swac_worldmap2d_timeline_progress');
        let newval = parseFloat(timelineElem.value) + this.percentStep;
        // Stop at 100%
        if (newval >= 100) {
            clearInterval(this.interval);
            this.interval = false;
            newval = 100;
        }
        timelineElem.value = newval;
        this.showDataFrom(this.calcDateFromTimeline());
    }

    /**
     * Download currently shown data
     */
    onClickDownload(evt) {
        evt.preventDefault();
        let date = this.calcDateFromTimeline()
        let sd = date.getTime() - (this.options.animationTimeRange * 1000);
        let ed = date.getTime() + (this.options.animationTimeRange * 1000);

        let data = [];
        for (let curSource in this.date_mark_maping) {
            this.date_mark_maping[curSource].forEach((d) => {
                let time = d.date.getTime();
                if (sd < time && time < ed) {
                    data.push(d.marker.feature.set.set_json);
                }
            });
        }

        let dataURL = 'data:application/json,' + data;
        var link = document.createElement('a');
        let month = ('0' + (date.getMonth() + 1)).slice(-2);
        let day = ('0' + date.getDate()).slice(-2);
        let filename = date.getFullYear() + '_' + month + '_' + day;
        link.download = filename + '_timedata.json';
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /**
     * Calculates the time corosponding to the current position of the timeline marker
     *
     * @returns {Date} Date object of the timeline timestamp
     */
    calcDateFromTimeline() {
        let timelineElem = this.requestor.parent.querySelector('.swac_worldmap2d_timeline_progress');
        let startTS = this.options.startTS.getTime();
        let endTS = this.options.endTS.getTime();
        let diffTS = (endTS - startTS) / 100 * timelineElem.value;
        let curTS = startTS + diffTS;
        let timelineDate = new Date(curTS);
        return timelineDate;
    }

    /**
     * Calculates the percentage that corosponds with the stepsize given in the options
     *
     * @returns {Float} Percentage value of timeline
     */
    calculateStepSizePercentage() {
        let startTS = this.options.startTS.getTime();
        let endTS = this.options.endTS.getTime();
        let diff = endTS - startTS;
        // Calculate percentage from seconds stepSize and milliseconds diff
        return (this.options.animationStepSize * 1000) / diff * 100;
    }

    /**
     * Shows the available data from, or around the given date.
     *
     * @param {Date} date Date to show data from
     */
    showDataFrom(date) {
        // Get data
        let sd = date.getTime() - (this.options.animationTimeRange * 1000);
        let ed = date.getTime() + (this.options.animationTimeRange * 1000);

        let sets = 0;
        for (let curSource in this.date_mark_maping) {
            this.date_mark_maping[curSource].forEach(async (d) => {
                let time = d.date.getTime();
                if (sd < time && time < ed) {
                    // In range
                    d.marker._icon.classList.remove('outoftimeIcon');
                    d.marker._shadow.style['opacity'] = 100.0;
                    sets++;
                } else {
                    // out of range
                    d.marker._icon.classList.add('outoftimeIcon');
                    d.marker._shadow.style['opacity'] = 0.0;
                }
            });
        }

        // Get modelFiles with time info
        for (let curModel of this.requestor.parent.swac_comp.options.modelFiles) {
            // Get start time object
            let msd = new Date(curModel.swac_from).getTime();
            let med = new Date(curModel.swac_until).getTime();
            if (msd <= date.getTime() && med >= date.getTime()) {
                // In range
                this.requestor.parent.swac_comp.loadModelFile(curModel);
            } else {
                // out of range
                this.requestor.parent.swac_comp.removeModelFile(curModel.name);
            }
        }


        // Set time info
        let timeInfoElem = this.requestor.parent.querySelector('.swac_worldmap2d_timeline_viewdate');
        let diff = date.getTimezoneOffset() * -1;
        date = new Date(date.getTime() + diff * 60000);
        let isodate = date.toISOString();
        let lastdd = isodate.lastIndexOf(':');
        isodate = isodate.substring(0, lastdd);
        timeInfoElem.value = isodate;

        // Set sets info
        let setscountElem = this.requestor.parent.querySelector('.swac_worldmap2d_timeline_setscount');
        setscountElem.innerHTML = sets;
        let setsfromElem = this.requestor.parent.querySelector('.swac_worldmap2d_timeline_setsfrom');
        setsfromElem.innerHTML = new Date(sd).toLocaleString();
        let setsuntilElem = this.requestor.parent.querySelector('.swac_worldmap2d_timeline_setsuntil');
        setsuntilElem.innerHTML = new Date(ed).toLocaleString();
    }

    /**
     * Updates the value of the timepointer with the corosponding value to the given date
     * 
     * @param {Date} date Date to show on timeline
     */
    updateTimepointer(date) {
        let startTS = this.options.startTS.getTime();
        let endTS = this.options.endTS.getTime();
        let diffTS = (endTS - startTS);
        let curTS = date.getTime() - startTS;
        let percentage = curTS / diffTS * 100;
        let timelineElem = this.requestor.parent.querySelector('.swac_worldmap2d_timeline_progress');
        timelineElem.value = percentage;
    }

    /**
     * Updates the value of the timeline with the corosponding values of the option startTS and endTS
     * 
     */
    updateTimeline() {
        // Set information of start and endTS
        let startTSelem = this.requestor.parent.querySelector('.swac_worldmap2d_timeline_startTS');
        startTSelem.innerHTML = this.options.startTS;
        SWAC.lang.translateFormatLocale(startTSelem);
        let endTSelem = this.requestor.parent.querySelector('.swac_worldmap2d_timeline_endTS');
        endTSelem.innerHTML = this.options.endTS;
        SWAC.lang.translateFormatLocale(endTSelem);

        // Set max and min value for datetime selector
        let timeInfoElem = this.requestor.parent.querySelector('.swac_worldmap2d_timeline_viewdate');
        let isodate1 = this.options.startTS.toISOString();
        let lastdd1 = isodate1.lastIndexOf(':');
        isodate1 = isodate1.substring(0, lastdd1);
        timeInfoElem.min = isodate1;
        let isodate2 = this.options.endTS.toISOString();
        let lastdd2 = isodate2.lastIndexOf(':');
        isodate2 = isodate2.substring(0, lastdd2);
        timeInfoElem.max = isodate2;
    }

}