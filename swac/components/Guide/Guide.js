import SWAC from '../../swac.js';
import View from '../../View.js';
import Msg from '../../Msg.js';

export default class Guid extends View {

    constructor(options) {
        super(options);
        this.name = 'Guide';
        this.desc.text = 'This component makes it easy to create presentations and guides of your page. Simply define what message should occure on which item or start the presentation when the page loads.';
        this.desc.developers = 'Florian Fehring';
        this.desc.license = '(c) by Florian Fehring';
            
        this.desc.templates[0] = {
            name: 'guide',
            style: 'guide',
            desc: 'Template with area for display guide messages.'
        };
        this.desc.reqPerTpl[0] = {
            selc: '.swac_guide_message',
            desc: 'Element for placeing the messages content.'
        };
        this.desc.optPerTpl[0] = {
            selc: '.swac_guide_step',
            desc: 'Element where to insert the number of the current guide step'
        };
        this.desc.optPerTpl[1] = {
            selc: '.swac_guide_title',
            desc: 'Element where to insert the current step title'
        };
        this.desc.reqPerSet[0] = {
            name: 'type',
            desc: 'Steps type: "message" shows a messagebox, "display" shows an element'
        };
        this.desc.reqPerSet[1] = {
            name: 'title',
            desc: 'Steps title'
        };
        this.desc.optPerSet[0] = {
            name: 'onevt',
            desc: 'javascript evt for calling the step.'
        };
        this.desc.optPerSet[1] = {
            name: 'onelement',
            desc: 'element the listener is bound to.'
        };
        this.desc.optPerSet[2] = {
            name: 'handler',
            desc: 'A custom handler function to be performed when the event occured.'
        };
        this.desc.optPerSet[3] = {
            name: 'message',
            desc: 'Message to show up (evtl. with html code]'
        };
        this.desc.optPerSet[4] = {
            name: 'tooltip',
            desc: 'Message to show up, when hovering the element or the step marker'
        };
        this.desc.optPerSet[5] = {
            name: 'startfunc',
            desc: 'Javascript function to execute when the step is starting.'
        };

        // Internal attributes
        this.endstep = {
            onevt: "step",
            type: "message",
            title: 'Das war die Präsentation',
            message: 'Vielen Dank für Ihre Aufmerksamkeit'
        };
        // No of avail steps
        this.steps = 0;
        // States while presenting
        this.guidestates = {};
        this.guidestates.source = null;
        this.guidestates.step = 0;
        this.guidestates.lastevt = null;
    }

    init() {
        return new Promise((resolve, reject) => {
            resolve();
        });
    }

    // Inheritted
    afterAddSet(set, repeateds) {
        // Get elements the event is bound to
        let elems = [];
        if (set.onelement === 'document') {
            elems[0] = document;
        } else {
            // Get element to register event listener on
            elems = document.querySelectorAll(set.onelement);
        }

        // Create badage
        let badageElem = document.createElement("span");
        badageElem.classList.add('uk-badge');
        badageElem.innerHTML = this.steps++;
        ;
        badageElem.setAttribute('swac_guide_source', set.swac_fromName);
        badageElem.setAttribute('swac_guide_step', this.steps);
        badageElem.addEventListener('click', this.handle.bind(this));
        if (typeof set.tooltip !== 'undefined') {
            badageElem.setAttribute('uk-tooltip', set.tooltip);
        }

        // Create event handler
        let evthandler = this.handle.bind(this);
        let evthandlername = 'handle()';
        // Register custom event handler function
        if (set.handler) {
            evthandler = set.handler;
            evthandlername = 'custom from id ' + set.id;
        }

        // Add badage and handlers to each effected element
        for (let elem of elems) {
            // Add information about bound step
            if (elem instanceof HTMLDocument === false) {
                elem.setAttribute('swac_guide_source', set.swac_fromName);
                elem.setAttribute('swac_guide_step', this.steps);
            }
            // Add badage
            if (elem !== document) {
                elem.parentNode.insertBefore(badageElem, elem.nextSibling);
            } else {
                let bodybadage = document.createElement('div');
                bodybadage.classList.add('bodybadage');
                bodybadage.appendChild(badageElem);
                document.body.appendChild(bodybadage);
            }
            // Add tooltip if an tooltip is given
            if (typeof set.tooltip !== 'undefined') {
                let newTip = set.tooltip;
                let existingTip = elem.getAttribute('uk-tooltip');
                if (existingTip !== null) {
                    newTip = existingTip + newTip;
                }
                elem.setAttribute('uk-tooltip', newTip);
            }

            // Add event listener
            Msg.warn('Guide', 'Added listener for'
                    + ' event >' + set.onevt + '< with handler: '
                    + evthandlername, this.requestor);
            elem.addEventListener(set.onevt, evthandler);
        }
    }

    /**
     * Handles an event and
     * 
     * @param {type} evt
     * @returns {undefined}
     */
    handle(evt) {
        // Check if target has information about which step to execute
        if (evt.target.hasAttribute('swac_guide_step')) {
            this.guidestates.source = evt.target.getAttribute('swac_guide_source');
            this.guidestates.step = evt.target.getAttribute('swac_guide_step');
        } else {
            // Use first source if no one is defined
            for (let curSource in this.data) {
                this.guidestates.source = curSource;
                break;
            }
            // Use next step if no one is defined
            this.guidestates.step++;
        }
        Msg.warn('Guide', 'Now executeing step >'
                + this.guidestates.step + '<', this.requestor);

        // Find event
        let appEvt = this.data[this.guidestates.source].getSet(this.guidestates.step);
        if (!appEvt) {
            for (let i = this.guidestates.step + 1; i < this.data[this.guidestates.source].count(); i++) {
                appEvt = this.data[this.guidestates.source].getSet(i);
                this.guidestates.step++;
                if (appEvt)
                    break;
            }
            // If there is no next event
            if (!appEvt) {
                Msg.warn('Guide', 'Found no next step ending presentation.', this.requestor);
                appEvt = this.endstep;
            }
        }

        if (appEvt.onevt !== 'step' && appEvt.onevt !== evt.type) {
            // Do not execute step
            Msg.warn('Guide', 'Do not execute step because event is not matching.', this.requestor);
            this.guidestates.step--;
            return;
        } else if (appEvt.onevt !== 'step' && appEvt.onelement !== 'document') {
            // Get elems that could be effected
            let efelems = document.querySelectorAll(appEvt.onelement);
            let found = false;
            for (let curElem of efelems) {
                if (curElem === evt.target)
                    found = true;
            }
            if (!found) {
                Msg.warn('Guide', 'Do not execute step because '
                        + 'element is not matching. Expected >' + appEvt.onelement
                        + '<', this.requestor);
                this.guidestates.step--;
                return;
            }
        }

        // Close previous event
        if (this.guidestates.lastevt) {
            // Remove previous highlight effect
            if (this.guidestates.lastevt.onelement) {
                let appElems = document.querySelectorAll(this.guidestates.lastevt.onelement);
                for (let appElem of appElems) {
                    appElem.classList.remove('swac_guide_highlight');
                }
            }
            // Execute type dependend clean
            switch (this.guidestates.lastevt.type) {
                case 'message':
                    this.closeMessage();
                    break;
            }
            // Exit here if it was the last one
            if (this.guidestates.step > this.data[this.guidestates.source].count()) {
                return;
            }
        }

        // Execute start event function
        if (typeof appEvt.startfunc !== 'undefined') {
            appEvt.startfunc();
        }

        // Highlight element if there is one
        if (typeof appEvt.onelement !== 'undefined') {
            let appElems = document.querySelectorAll(appEvt.onelement);
            for (let appElem of appElems) {
                appElem.classList.add('swac_guide_highlight');
            }
        }

        // Execute event
        switch (appEvt.type) {
            case "message":
                this.showMessage(appEvt.title, appEvt.message);
                break;
        }
        // Set event as last executed
        this.guidestates.lastevt = appEvt;
    }

    /**
     * Displays an message on screen
     * 
     * @param {String} title Title of the message block
     * @param {String} message message to show
     * @returns {undefined}
     */
    showMessage(title, message) {
        let titleElem = document.querySelector('.swac_guide_title');
        titleElem.innerHTML = title;
        let messageElem = document.querySelector('.swac_guide_message');
        messageElem.innerHTML = message;
        let badgeElem = document.querySelector('.swac_guide_step');
        badgeElem.innerHTML = this.guidestates.step;
        // Get output area
        let outputElem = document.querySelector('#swac_guide_message');
        outputElem.classList.remove("swac_dontdisplay");
    }

    /**
     * Closes the open message dialog
     * 
     * @returns {undefined}
     */
    closeMessage() {
        // Get output area
        let outputElem = document.querySelector('#swac_guide_message');
        outputElem.classList.add("swac_dontdisplay");
    }

    /**
     * Tests if the given element is selectable by the given targetselector.
     * 
     * @param {type} targetselector
     * @param {type} element
     * @returns {Boolean}
     */
    isReferenceToElement(targetselector, element) {
        // Reselect element
        let elems = document.querySelectorAll(targetselector);
        for (let elem of elems) {
            if (elem === element) {
                return true;
            }
        }
        return false;
    }
}