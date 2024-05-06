/**
 * PREMIUM component
 * 
 * This SWAC component is NOT open source.
 * Copyright 2020 by Florian Fehring
 * 
 * @type type
 */
import SWAC from '../../swac.js';
import View from '../../View.js';
import Msg from '../../Msg.js';

export default class Events extends View {

    constructor(options = {}) {
        super(options);
        this.name = 'Events';
        this.desc.text = 'Component for showing events and calendars.';
        this.desc.developers = 'Florian Fehring';
        this.desc.license = '(c) by Florian Fehring';

        this.desc.templates[0] = {
            name: 'calendar',
            style: 'calendar',
            desc: 'Show events in a monthly calendar.'
        };
        this.desc.templates[1] = {
            name: 'list',
            style: 'list',
            desc: 'Shows upcomming events in a list.'
        };
        this.desc.templates[2] = {
            name: 'timeline',
            style: 'timeline',
            desc: 'Shows upcomming events in a timeline.'
        };

        this.desc.optPerTpl[0] = {
            selc: '.swac_events_day',
            desc: 'Element that contains the visualisation for a day'
        };
        this.desc.optPerTpl[1] = {
            selc: '.swac_events_month',
            desc: 'Header for viewing and selecting the actual showed month'
        };
        this.desc.optPerTpl[2] = {
            selc: '.swac_events_prevmonth',
            desc: 'Element that, when clicked, shows the prev month.'
        };
        this.desc.optPerTpl[3] = {
            selc: '.swac_events_nextmonth',
            desc: 'Element that, when clicked, shows the next month.'
        };
        this.desc.optPerTpl[4] = {
            selc: '.swac_events_monthname',
            desc: 'Element in which the name of the actual shown month sould be displayed.'
        };
        this.desc.optPerTpl[5] = {
            selc: '.swac_events_year',
            desc: 'Element in which the actual shown year sould be displayed.'
        };
        this.desc.optPerTpl[6] = {
            selc: '.swac_events_weekdays',
            desc: 'Element that contains the list of weekdays.'
        };
        this.desc.optPerTpl[7] = {
            selc: '.swac_events_days',
            desc: 'Element that contains the list of days.'
        };
        this.desc.optPerTpl[8] = {
            selc: '.swac_events_curday',
            desc: 'Element that is the current day.'
        };
        this.desc.optPerTpl[9] = {
            selc: '.swac_events_premday',
            desc: 'Element that marks a day shown in calendar but in prev month than the selected.'
        };
        this.desc.optPerTpl[10] = {
            selc: '.swac_events_nexmday',
            desc: 'Element that marks a day shown in calendar but in next month than the selected.'
        };
        this.desc.optPerTpl[11] = {
            selc: '.swac_events_eventlist',
            desc: 'Element that contains the list of events.'
        };
        this.desc.optPerTpl[12] = {
            selc: '.swac_events_event',
            desc: 'Element that contains an event.'
        };
        this.desc.optPerTpl[13] = {
            selc: '.swac_events_start',
            desc: 'Element that contains the startdate of an event'
        };
        this.desc.optPerTpl[14] = {
            selc: '.swac_events_end',
            desc: 'Element that contains the enddate of an event'
        };
        this.desc.optPerTpl[15] = {
            selc: '.swac_events_title',
            desc: 'Element that contains the title of an event'
        };
        this.desc.optPerTpl[16] = {
            selc: '.swac_events_timeline',
            desc: 'Element that contains the timeline'
        };
        this.desc.optPerTpl[17] = {
            selc: '.swac_events_timepoint',
            desc: 'Element that should be positioned on the timeline.'
        };
        this.desc.optPerTpl[18] = {
            selc: '.swac_events_starttime',
            desc: 'Element that displays the event starttime.'
        };
        this.desc.optPerTpl[19] = {
            selc: '.swac_events_container',
            desc: 'Container element for events timeline.'
        };

        this.desc.reqPerSet[0] = {
            name: 'id',
            desc: 'The attribute id is required for the component to work properly.'
        };
        this.desc.reqPerSet[1] = {
            name: 'title',
            desc: 'The title of the event.'
        };
        this.desc.reqPerSet[2] = {
            name: 'desc',
            desc: 'A description of the event.'
        };
        this.desc.reqPerSet[3] = {
            name: 'start',
            desc: 'Events startdate.'
        };
        this.desc.reqPerSet[4] = {
            name: 'end',
            desc: 'Events enddate.'
        };
        this.desc.optPerSet[0] = {
            name: 'picture',
            desc: 'A picture for the event.'
        };
        // Sample for useing the general option showWhenNoData
        if (!options.showWhenNoData)
            this.options.showWhenNoData = true;
        // function ids over 1000 are reserved for Component independend functions
        this.desc.funcs[0] = {
            name: 'name of the function',
            desc: 'Functions description',
            params: [
                {
                    name: 'name of the parameter',
                    desc: 'Description of the parameter'
                }
            ]
        };

        // Internal values from here
        this.actualDate = new Date();
        this.shownYear = this.actualDate.getFullYear();
        this.shownMonth = this.actualDate.getMonth();
        this.shownDay = this.actualDate.getDate();
    }

    /*
     * This method will be called when the component is complete loaded
     * At this thime the template code is loaded, the data inserted into the 
     * template and even plugins are ready to use.
     */
    init() {
        return new Promise((resolve, reject) => {

            // Set start values
            this.buildMonthControl();
            this.buildAllDaysCalendar();
            this.cloneEventsToDates();
            this.positionTimelineElements();
            this.formatDates();

            // Register prev / next month functions
            let prevMButton = this.requestor.querySelector('.swac_events_prevmonth');
            if (prevMButton) {
                prevMButton.addEventListener('click', this.showPrevMonth.bind(this));
            }

            let nexMButton = this.requestor.querySelector('.swac_events_nextmonth');
            if (nexMButton) {
                nexMButton.addEventListener('click', this.showNextMonth.bind(this));
            }
            resolve();
        });
    }

    /**
     * Builds the header and controls for a month view
     * 
     * @returns {undefined}
     */
    buildMonthControl() {
        let yearElems = this.requestor.querySelectorAll('.swac_events_year');
        for (let curYearElem of yearElems) {
            curYearElem.innerHTML = this.shownYear;
        }
        let monthElems = this.requestor.querySelectorAll('.swac_events_monthname');
        for (let curMonthElem of monthElems) {
            curMonthElem.innerHTML = SWAC.lang.dict.Events['month_' + this.shownMonth];
        }
    }

    /**
     * Shows the calendar or events from the prev month
     * 
     * @returns {undefined}
     */
    showPrevMonth() {
        if (this.shownMonth > 0) {
            this.shownMonth--;
        } else {
            this.shownMonth = 11;
            this.shownYear--;
        }
        this.clearAllDaysCalendar();
        this.buildMonthControl();
        this.buildAllDaysCalendar();
        this.cloneEventsToDates();
        this.positionTimelineElements();
        this.formatDates();
    }

    /**
     * Shows the calendar or events from the next month
     * 
     * @returns {undefined}
     */
    showNextMonth() {
        if (this.shownMonth > 10) {
            this.shownMonth = 0;
            this.shownYear++;
        } else {
            this.shownMonth++;
        }
        this.clearAllDaysCalendar();
        this.buildMonthControl();
        this.buildAllDaysCalendar();
        this.cloneEventsToDates();
        this.positionTimelineElements();
        this.formatDates();
    }

    /**
     * Builds a calendar with all days of a month included, even those where no
     * event is sheduled.
     * 
     * @returns {undefined}
     */
    buildAllDaysCalendar() {
        // Check if prev month days should be created
        let prevDayElem = this.requestor.querySelector('.swac_events_premday');
        if (prevDayElem) {
            // Get last day of the prev month
            let lastDate = new Date(this.shownYear, this.shownMonth, 0);
            let lastWeekDay = lastDate.getDay();
            let noOfDaysPreMonth = lastDate.getDate();
            let lastMonday = noOfDaysPreMonth - lastWeekDay;
            // Clone prevdaynode for every weekday
            for (let i = (lastMonday + 1); i <= noOfDaysPreMonth; i++) {
                let prevDayClone = prevDayElem.cloneNode(true);
                prevDayClone.classList.remove('swac_dontdisplay');
                prevDayClone.innerHTML = i;
                let dateid = lastDate.getFullYear() + '_' + lastDate.getMonth() + '_' + i;
                prevDayClone.setAttribute('date', dateid);
                prevDayElem.parentNode.insertBefore(prevDayClone, prevDayElem);
            }
        }

        // Generate days of month
        let dayElem = this.requestor.querySelector('.swac_events_day');
        if (dayElem) {
            let lastDateOfMonth = new Date(this.shownYear, this.shownMonth + 1, 0);
            let lastDayOfMonth = lastDateOfMonth.getDate();
            for (let i = 1; i <= lastDayOfMonth; i++) {
                let curDayElem = dayElem.cloneNode(true);
                curDayElem.classList.remove('swac_dontdisplay');
                //TODO gibts was seo optimiertes um Datumsangaben hier zu notieren?
                let dateid = this.shownYear + '_' + this.shownMonth + '_' + i;
                curDayElem.setAttribute('date', dateid);
                curDayElem.innerHTML = i;
                dayElem.parentNode.insertBefore(curDayElem, dayElem);
            }
        }

        // Check if next month days should be created
        let nextDayElem = this.requestor.querySelector('.swac_events_nexmday');
        if (nextDayElem) {
            let firstDateNextMonth = new Date(this.shownYear, this.shownMonth + 1, 1);
            let firstWeekday = firstDateNextMonth.getDay();
            let daysLeft;
            if (firstWeekday === 0) {
                daysLeft = 1;
            } else {
                daysLeft = 8 - firstWeekday;
            }

            for (let i = 1; i <= daysLeft; i++) {
                let nextDayClone = nextDayElem.cloneNode(true);
                nextDayClone.classList.remove('swac_dontdisplay');
                nextDayClone.innerHTML = i;
                let dateid = firstDateNextMonth.getFullYear() + '_' + firstDateNextMonth.getMonth() + '_' + i;
                nextDayClone.setAttribute('date', dateid);
                nextDayElem.parentNode.insertBefore(nextDayClone, nextDayElem);
            }
        }

        this.markToday();
    }

    /**
     * Clears the days in an calendar that shows all days.
     * 
     * @returns {undefined}
     */
    clearAllDaysCalendar() {
        // Get all day elements
        let dayElems = this.requestor.querySelectorAll('.swac_events_premday, .swac_events_day, .swac_events_nexmday');
        for (let curDayElem of dayElems) {
            if (!curDayElem.classList.contains('swac_dontdisplay')) {
                curDayElem.parentNode.removeChild(curDayElem);
            }
        }
    }

    /**
     * Moves generated event representations to the date they belong to
     */
    cloneEventsToDates() {
        // Get event presentations
        let eventNodes = this.requestor.querySelectorAll('.swac_events_event');
        for (let curEventNode of eventNodes) {
            let eventClone = curEventNode.cloneNode(true);
            // Get setid from node
            let setname = eventClone.getAttribute('swac_fromname');
            // Exclude template
            if (setname) {
                let setid = eventClone.getAttribute('swac_setid');
                let eventdata = this.data[setname].getSet(setid);
                let startDate = new Date(eventdata.start);
                let endDate = new Date(eventdata.end);
                let startid = startDate.getFullYear() + '_' + startDate.getMonth() + '_' + startDate.getDate();
                let dateElem = this.requestor.querySelector('[date="' + startid + '"]');
                if (dateElem) {
                    dateElem.appendChild(eventClone);

                    // Add starttime if requested
                    let starttimeElem = eventClone.querySelector('.swac_events_starttime');
                    if (starttimeElem) {
                        let minutes = startDate.getMinutes() < 10 ? '0' + startDate.getMinutes() : startDate.getMinutes();
                        starttimeElem.innerHTML = startDate.getHours() + ':' + minutes;
                    }
                }
            }
        }
    }

    /**
     * Position elements in a timeline
     * 
     * @returns {undefined}
     */
    positionTimelineElements() {
        let timelineElems = this.requestor.querySelectorAll('.swac_events_container');
        let i = 0;
        for (let curTimelineElem of timelineElems) {
            let mod = i % 2;
            if (mod === 0) {
                curTimelineElem.classList.add('swac_events_contleft');
            } else {
                curTimelineElem.classList.add('swac_events_contright');
            }
            i++;
        }
    }

    /**
     * Marks the current day
     * 
     * @returns {undefined}
     */
    markToday() {
        let dateid = this.actualDate.getFullYear() + '_'
                + this.actualDate.getMonth() + '_'
                + this.actualDate.getDate();
        let dateElem = this.requestor.querySelector('[date="' + dateid + '"]');
        if (dateElem) {
            dateElem.classList.add('swac_events_actualday');
        }
    }

    /**
     * Formats date occurences to a more readable layout
     * 
     * @returns {undefined}
     */
    formatDates() {
        let eventElems = this.requestor.querySelectorAll('.swac_repeatedForSet');
        for (let curEventElem of eventElems) {
            let curDateElems = curEventElem.querySelectorAll('.swac_events_start, .swac_events_end');
            if (curDateElems) {
                let setname = curEventElem.getAttribute('swac_fromname');
                let setno = curEventElem.getAttribute('swac_setid');
                let set = this.data[setname].getSet(setno);
                for (let curDateElem of curDateElems) {
                    if (curDateElem.classList.contains('swac_events_start')) {
                        let date = new Date(set.start);
                        curDateElem.innerHTML = this.formatDate(date);
                    } else {
                        let date = new Date(set.end);
                        curDateElem.innerHTML = this.formatDate(date);
                    }
                }
            }
        }
    }

    formatDate(date) {
        let month = date.getMonth() < 10 ? '0' + (date.getMonth() + 1) : (date.getMonth() + 1);
        let day = date.getDate() < 10 ? '0' + date.getDate() : date.getDate();
        let minutes = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes();
        return day + '.' + month + '.'
                + date.getFullYear() + ' ' + date.getHours() + ':' + minutes;
    }
}


