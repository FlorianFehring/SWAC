import SWAC from './swac.js';

export default class Msg {

    /**
     * Create a message storage for a requestor
     * 
     * @param {SWAC requestor} requestor Requestor to create storage for
     * @returns {undefined}
     */
    static createStore(requestor) {
        SWAC.msgs.set(requestor, {
            errors: [],
            warnings: [],
            infos: [],
            flows: [],
            hints: []
        });
    }

    /**
     * Adds a message to the message store
     * @param {type} component Component which reports
     * @param {type} message Message reported
     * @param {type} element Element the message belongs to (usualy a SWAC requestor)
     * @param {type} level Messages level (error, debug, hint)
     * @returns {undefined}
     */
    static message(component, message, element, level) {
        if (element && element.requestor) {
            element = element.requestor;
        } else if (element && !element.swac_comp && !element.id) {
            console.error('Given element for message should be an SWAC requestor (DOM Element) but is ' + typeof element);
            console.log('message; ' + message);
            console.log('component: ' + component);
            return;
        }
        SWAC.msgs.get(element)[level + 's'].push({
            component: component,
            message: message
        });
        let msg = 'SWAC(' + component + '): ' + message;
        if (element) {
            msg = msg + ' for requestor: >' + element.id + '<';
        }
        switch (level) {
            case 'error':
                console.error(msg);
                break;
            case 'warning':
                console.warn(msg);
                break;
            default:
                console.info(msg);
        }
        let event = new CustomEvent("swac_msg", {
            "detail": {level: level, msg: msg}
        });
        document.dispatchEvent(event);
    }

    /**
     * Adds an error message to console and to the effected element if given.
     * 
     * @param {String} component Name of the component where to log from 
     * @param {String} message Message to display
     * @param {DOMElement} element Element the error is realated to
     * @returns {undefined}
     */
    static error(component, message, element) {
        Msg.message(component, message, element, 'error');
    }

    /**
     * Adds an debug message to console and to the effected element if given.
     * 
     * @param {String} component Name of the component where to log from 
     * @param {String} message Message to display
     * @param {DOMElement} element Element the error is realated to
     * @returns {undefined}
     */
    static warn(component, message, element) {
        if (SWAC.config.debugmode)
            Msg.message(component, message, element, 'warning');
    }
    /**
     * Adds an message with general information
     * 
     * @param {String} component Name of the component where to log from 
     * @param {String} message Message to display
     * @param {DOMElement} element Element the error is realated to
     * @returns {undefined}
     */
    static info(component, message, element) {
        if (SWAC.config.debugmode)
            Msg.message(component, message, element, 'info');
    }
    /**
     * Adds an message describing a point in processing
     * 
     * @param {String} component Name of the component where to log from 
     * @param {String} message Message to display
     * @param {DOMElement} element Element the error is realated to
     * @returns {undefined}
     */
    static flow(component, message, element) {
        if (SWAC.config.debugmode) {
            Msg.message(component, message, element, 'flow');
            performance.mark(message);
        }
    }
    /**
     * Adds an hint message to console and to the effected element if given.
     * 
     * @param {String} component Name of the component where to log from 
     * @param {String} message Message to display
     * @param {DOMElement} element Element the error is realated to
     * @returns {undefined}
     */
    static hint(component, message, element) {
        if (SWAC.config.debugmode)
            Msg.message(component, message, element, 'hint');
    }

    /**
     * Create a message that is shown on the element
     * 
     * @param {String} component Name of the component where to log from 
     * @param {String} message Message to display
     * @param {DOMElement} element Element the error is realated to
     * @param {String} kind Kind of the message
     */
    static view(component, message, element, kind) {
        let msgelem = document.createElement('div');
        msgelem.setAttribute('uk-alert', '');
        let closeelem = document.createElement('a');
        closeelem.setAttribute('uk-close', '');
        closeelem.classList.add('uk-alert-close');
        msgelem.appendChild(closeelem);
        let txtelem = document.createElement('p');
        txtelem.innerHTML = message;
        switch (kind) {
            case 'error':
                msgelem.classList.add('uk-alert-danger');
                Msg.error(component, message, element);
                break;
            case 'warn':
                msgelem.classList.add('uk-alert-warning');
                Msg.warn(component, message, element);
                break;
            case 'info':
                msgelem.classList.add('uk-alert-primary');
                Msg.info(component, message, element);
                break;
            case 'flow':
                msgelem.classList.add('uk-alert-success');
                Msg.flow(component, message, element);
                break;
            case 'hint':
                msgelem.classList.add('uk-alert-primary');
                Msg.hint(component, message, element);
                break;
        }
        msgelem.appendChild(txtelem);
        element.appendChild(msgelem);
    }
}