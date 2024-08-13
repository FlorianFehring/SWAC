import SWAC from '../../swac.js';
import View from '../../View.js';
import Msg from '../../Msg.js';

export default class Devicestates extends View {

    constructor(options = {}) {
        super(options);
        this.name = 'Devicestates';
        this.desc.text = 'Devicestates shows the status of devices from device informations';
        this.desc.developers = 'Florian Fehring (FH Bielefeld)';
        this.desc.license = 'GNU Lesser General Public License';
        
        this.desc.templates[0] = {
            name: 'simple',
            style: 'simple',
            desc: 'Simple Devicestates'
        };
        this.desc.reqPerTpl[0] = {
            selc: '.swac_devicestates_ownActivityTS',
            desc: 'Element where the timestamp is noted, that is the last activity date/time'
        };
        this.desc.reqPerTpl[1] = {
            selc: '.swac_devicestates_oldestSubActivityTS',
            desc: 'Element where the timestamp is noted, that is oldest activity date/time from this and all subcomponents'
        };
        this.desc.reqPerTpl[2] = {
            selc: '.swac_devicestates_newestSubActivityTS',
            desc: 'Element where the timestamp is noted, that is the newest activity date/time from this and all subcomponents'
        };
        this.desc.reqPerTpl[3] = {
            selc: '.swac_devicestates_acticityState',
            desc: 'Element where the state of collection is noted. If its value contains true the device collects data'
        };
        this.desc.reqPerTpl[4] = {
            selc: '.swac_devicestates_overall',
            desc: 'Element where the overall state of the listed devices is noted.'
        };
        this.desc.reqPerTpl[5] = {
            selc: '.swac_dashbord_activeTimeout',
            desc: 'Input element where user gives the timeout in seconds.'
        };
        this.desc.reqPerTpl[6] = {
            selc: '.swac_devicestates_calculateActivityStates',
            desc: 'Button to start calculation of activity state.'
        };
        this.desc.reqPerTpl[7] = {
            selc: '.swac_devicestates',
            desc: 'List where the device states are presented.'
        };
        this.desc.reqPerTpl[8] = {
            selc: '.swac_devicestates_overCur',
            desc: 'Element where to display percentage of activity.'
        };
        this.desc.reqPerTpl[9] = {
            selc: '.swac_devicestates_offScince',
            desc: 'Element where to display the date and time scince the device is offline.'
        };
        this.desc.reqPerTpl[10] = {
            selc: '.swac_devicestates_inactiveCur',
            desc: 'Element where to show the number of inactive devices.'
        };
        this.desc.reqPerTpl[11] = {
            selc: '.swac_devicestates_availCur',
            desc: 'Element where to show the number of active devices.'
        };
        
        
        
        this.desc.reqPerSet[0] = {
            name: 'id',
            desc: 'Device id'
        };
        this.desc.reqPerSet[1] = {
            name: 'name',
            desc: 'Name of the device'
        };
        this.desc.reqPerSet[2] = {
            name: 'collectsData',
            desc: 'Indicates if the device collects data.',
            example: true
        };
        this.desc.optPerSet[0] = {
            name: 'lastSetFrom', //TODO rename to ts and create possibility for rename in dataset
            desc: 'This is the description of an option'
        };
        this.desc.optPerSet[1] = {
            name: 'parent',
            desc: 'Parents dataset id for ordering.',
            example: 1
        };
        this.options.showWhenNoData = true;
        this.desc.opts[0] = {
            name: "activeTimeout",
            desc: "Seconds after which the device is noted as inactive"
        };
        this.options.activeTimeout = 600;
    }

    init() {
        return new Promise((resolve, reject) => {
            let activeTimeoutElem = this.requestor.querySelector('.swac_dashbord_activeTimeout');
            activeTimeoutElem.value = this.options.activeTimeout;

            this.calculateActivityStates();
            resolve();
        });
    }

    /**
     * Calculates the acitivity states for each device
     * 
     * @returns {undefined}
     */
    calculateActivityStates() {
        // Inform about running calculation
        this.showCoverMsg('calculate');

        // Get output elems
        let overallElem = this.requestor.querySelector('.swac_devicestates_overall');
        let availElems = this.requestor.querySelectorAll('.swac_devicestates_availCur');
        let inactiveElems = this.requestor.querySelectorAll('.swac_devicestates_inactiveCur');
        // Reset values
        overallElem.innerHTML = '';
        for (let curAvailElem of availElems) {
            curAvailElem.innerHTML = '';
        }
        for (let curInactiveElem of inactiveElems) {
            curInactiveElem.innerHTML = '';
        }

        let overallCollecting = 0;
        let overallInactive = 0;
        // Get repeated elements
        for (let curElem of this.requestor.querySelectorAll('[swac_setid]')) {
            // Get element with collection state
            let collectStateElem = curElem.querySelector('.swac_devicestates_acticityState');
            if (collectStateElem.getAttribute('shouldActive') === 'true') {
                this.addAvailableDevice(curElem.getAttribute('swac_setid'), curElem.getAttribute('swac_setid'));
                overallCollecting++;
                // Get element with calculation base
                let calcBaseElem = curElem.querySelector('.swac_devicestates_ownActivityTS bp');
                if (calcBaseElem) {
                    this.addActivityTS(curElem.getAttribute('swac_setid'), curElem.getAttribute('swac_setid'), calcBaseElem.innerHTML);
                    let setDate = new Date(calcBaseElem.innerHTML);
                    let curDate = new Date();
                    // Calculate difference
                    let timediff = curDate.getTime() - setDate.getTime();
                    // use timeout
                    timediff = timediff - (this.options.activeTimeout * 1000);
                    if (timediff > 0) {
                        overallInactive++;
                        this.addInactiveDevice(curElem.getAttribute('swac_setid'), curElem.getAttribute('swac_setid'));
                        let offSinceElem = curElem.querySelector('.swac_devicestates_offScince');
                        offSinceElem.innerHTML = SWAC.lang.dict.Devicestates.offlineSince + ' ';
                        let timediffSeconds = timediff / 1000;
                        if (timediffSeconds > 120) {
                            let timediffMinutes = timediffSeconds / 60;
                            if (timediffMinutes > 60) {
                                let timediffHours = timediffMinutes / 60;
                                if (timediffHours > 24) {
                                    let timediffDays = timediffHours / 24;
                                    offSinceElem.innerHTML += Math.round(timediffDays) + ' ' + SWAC.lang.dict.Devicestates.days;
                                } else {
                                    offSinceElem.innerHTML += Math.round(timediffHours) + ' ' + SWAC.lang.dict.Devicestates.hours;
                                }
                            } else {
                                offSinceElem.innerHTML += Math.round(timediffMinutes) + ' ' + SWAC.lang.dict.Devicestates.minutes;
                            }
                        } else {
                            offSinceElem.innerHTML += Math.round(timediffSeconds)
                                    + ' ' + SWAC.lang.dict.Devicestates.seconds;
                        }
                    }
                } else {
                    overallInactive++;
                    this.addInactiveDevice(curElem.getAttribute('swac_setid'), curElem.getAttribute('swac_setid'));
                }
            }
        }
        if (overallCollecting === 0) {
            overallElem.innerHTML = SWAC.lang.dict.Devicestates.nocollectingdevices;
        } else {
            let overallPercentage = 100 - (overallInactive / overallCollecting) * 100;
            let overallPercentageF = Math.round(overallPercentage * 100) / 100;
            overallElem.innerHTML = overallPercentageF + ' %';
        }

        this.calculatePercentages();
        this.remCoverMsg();
    }

    /**
     * Adds an available (sub) device
     * 
     * @param {type} addToId    Id of the device where to add
     * @param {type} deviceId   Id of the device that is added
     * @returns {undefined}
     */
    addAvailableDevice(addToId, deviceId) {
        // Get parent ids elem
        let curElem = this.requestor.querySelector('[swac_setid="' + addToId + '"]');
        if (curElem) {
            let availCurElem = curElem.querySelector('.swac_devicestates_availCur');
            let curCount = availCurElem.innerHTML;
            curCount++;
            availCurElem.innerHTML = curCount;
            // Get parent of parent
            let parentParentId = curElem.getAttribute('swac_parent_setid');
            this.addAvailableDevice(parentParentId, deviceId);
        }
    }

    /**
     * Adds an inactive (sub) device
     * 
     * @param {type} addToId    Id of the device where to add
     * @param {type} deviceId   Id of the device that is added
     * @returns {undefined}
     */
    addInactiveDevice(addToId, deviceId) {
        // Get parent ids elem
        let curElem = this.requestor.querySelector('[swac_setid="' + addToId + '"]');
        if (curElem) {
            let inactiveCurElem = curElem.querySelector('.swac_devicestates_inactiveCur');
            let curCount = inactiveCurElem.innerHTML;
            curCount++;
            inactiveCurElem.innerHTML = curCount;
            // Get parent of parent
            let parentParentId = curElem.getAttribute('swac_parent_setid');
            this.addInactiveDevice(parentParentId, deviceId);
        }
    }

    addActivityTS(addToId, deviceId, lastActivityTS) {
        let curElem = this.requestor.querySelector('[swac_setid="' + addToId + '"]');
        if (curElem !== null) {
            let newKnownDate = new Date(lastActivityTS);
            // Set the oldest subactivity
            let oldestSubActivityTSElem = this.requestor.querySelector('[swac_setid="' + addToId + '"] > .swac_devicestates_oldestSubActivityTS');
            if (oldestSubActivityTSElem === null) {
                oldestSubActivityTSElem = document.createElement('span');
                oldestSubActivityTSElem.classList.add('swac_devicestates_oldestSubActivityTS');
                oldestSubActivityTSElem.innerHTML = lastActivityTS;
                curElem.appendChild(oldestSubActivityTSElem);
            } else if (oldestSubActivityTSElem.innerHTML === '') {
                // If there is no content
                oldestSubActivityTSElem.innerHTML = lastActivityTS;
            } else {
                let lowestKnownDate = new Date(oldestSubActivityTSElem.innerHTML);
                // Compere dates
                if (newKnownDate < lowestKnownDate) {
                    oldestSubActivityTSElem.innerHTML = lastActivityTS;
                }
            }
            // Set the newest subactivity
            let newestSubActivityTSElem = this.requestor.querySelector('[swac_setid="' + addToId + '"] > .swac_devicestates_newestSubActivityTS');
            if (newestSubActivityTSElem === null) {
                newestSubActivityTSElem = document.createElement('span');
                newestSubActivityTSElem.classList.add('swac_devicestates_newestSubActivityTS');
                newestSubActivityTSElem.innerHTML = lastActivityTS;
                curElem.appendChild(newestSubActivityTSElem);
            } else if (newestSubActivityTSElem.innerHTML === '') {
                // If there is no content
                newestSubActivityTSElem.innerHTML = lastActivityTS;
            } else {
                let heighestKnownDate = new Date(newestSubActivityTSElem.innerHTML);
                // Compere dates
                if (newKnownDate > heighestKnownDate) {
                    newestSubActivityTSElem.innerHTML = lastActivityTS;
                }
            }
            // Get parent of parent
            let parentId = curElem.getAttribute('swac_parent_setid');
            if (parentId !== null) {
                this.addActivityTS(parentId, deviceId, oldestSubActivityTSElem.innerHTML);
            }
        }
    }

    /**
     * Calculates the percentages of activity based on the previous calculated
     * active states.
     * 
     * @returns {undefined}
     */
    calculatePercentages() {
        // Get repeated elements
        for (let curElem of this.requestor.querySelectorAll('[swac_setid]')) {
            // Get input and output elements
            let availCurElem = curElem.querySelector('.swac_devicestates_availCur');
            let inactiveCurElem = curElem.querySelector('.swac_devicestates_inactiveCur');
            let curPercentElem = curElem.querySelector('.swac_devicestates_overCur');
            if (availCurElem.innerHTML === '' || availCurElem.innerHTML === '0') {
                curPercentElem.innerHTML = '';
            } else {
                if (availCurElem && inactiveCurElem) {
                    let percentage = 100 - (inactiveCurElem.innerHTML / availCurElem.innerHTML) * 100;
                    let percentageF = Math.round(percentage * 100) / 100;
                    curPercentElem.innerHTML = percentageF;
                }
            }
        }
    }
}