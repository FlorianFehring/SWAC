import SWAC from '../../swac.js';
import View from '../../View.js';
import Msg from '../../Msg.js';

export default class Screenboard extends View {

    constructor(options = {}) {
        super(options);
        this.name = 'Screenboard';
        this.desc.text = 'Create a responsive onscreen keyboard. This component does not work with data.';
        this.desc.developers = 'Florian Fehring (HSBI)';
        this.desc.license = 'GNU Lesser General Public License';

        this.desc.templates[0] = {
            name: 'screenboard',
            style: 'screenboard',
            desc: 'Shows the screenboard with touchable keys.'
        };
        
        this.desc.reqPerTpl[0] = {
            selc: '.swac_screenboard_hidden',
            desc: 'Element that contains the virutal keys and is hidden per default.'
        };
        this.desc.reqPerTpl[1] = {
            selc: '.swac_screenboard_enterbutton',
            desc: 'Element that is used as enter button.'
        };
        
        this.options.showWhenNoData = true;
        this.desc.opts[0] = {
            name: 'for',
            desc: 'CSS Selectors for elements on which the screenboad should be '
                    + 'activated. If not given screenboard will be activated on all textual input elements.',
            example: '.myinputelement'
        };
        if (!options.for)
            this.options.for = [];
        this.desc.opts[1] = {
            name: 'specialButtons',
            desc: 'List of special buttons (objects with "key" = value contained '
                    + 'in button, "func" = function to execute on click)'
                    + 'If attribute processfurther is set the button press is executed further.',
            example: {
                key: 'icon: sign-in',
                func: function (evt) {
                    alert('Special button pressed = custom function executed!');
                }
            }
        };
        if (!options.specialButtons)
            this.options.specialButtons = [];
        this.desc.opts[2] = {
            name: 'onlyOnTouch',
            desc: 'If true the screenboard key is only displayed on touch displays.'
        };
        if (!options.onlyOnTouch)
            this.options.onlyOnTouch = false;

        // Internal attributes
        this.touchmode = false;
        this.touchscreen = false;
        this.inputelement = null;
        this.keyboardLayouts = [];
        this.keyboardLayouts[0] =
                ['^', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'ß', '<span uk-icon="icon: arrow-left; ratio: 2"></span>',
                    'q', 'w', 'e', 'r', 't', 'z', 'u', 'i', 'o', 'p', 'ü', '+', '<span uk-icon="icon: sign-in; ratio: 2"></span>',
                    'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'ö', 'ä', '#',
                    '&lt;', 'y', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '-', ' ', '<span uk-icon="icon: triangle-up; ratio: 2"></span>'];
        this.keyboardLayouts[1] =
                ['°', '!', '"', '§', '$', '%', '&amp;', '/', '(', ')', '=', '?', '<span uk-icon="icon: arrow-left; ratio: 2"></span>',
                    'Q', 'W', 'E', 'R', 'T', 'Z', 'U', 'I', 'O', 'P', 'Ü', '*', '<span uk-icon="icon: sign-in; ratio: 2"></span>',
                    'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ö', 'Ä', "'",
                    '&gt;', 'Y', 'X', 'C', 'V', 'B', 'N', 'M', ';', ':', '_', ' ', '<span uk-icon="icon: triangle-up; ratio: 2"></span>'];
        this.currentLayout = 0;
    }

    init() {
        return new Promise((resolve, reject) => {
            let thisRef = this;
            document.addEventListener('swac_components_complete', function (evt) {
                thisRef.registerListener();
            });
            resolve();
        });
    }

    /**
     * Register listener on input elements
     */
    registerListener() {
        // Detect if this is a touchscreen (NOTE not every browser supports this event even if the screen is touchable)
        this.touchscreen = this.isEventSupported('ontouchstart');
        // Note when touched
        window.addEventListener('touchstart', function (evt) {
            this.touchmode = true;
        });

        // Hide screenboard if clicked elsewhere but not in input field
        window.addEventListener('mousedown', this.onMousedown.bind(this), false);
        // Detect keyboard keypress
        window.addEventListener('keyup', this.onKeyup.bind(this));

        // Bind event listener to input fields
        if (this.options.for.length > 0) {
            for (let i in this.options.for) {
                let inputFields = document.querySelectorAll(this.options.for[i]);
                if (inputFields.length == 0) {
                    Msg.error('Screenboard', 'Could not find element >' + this.options.for[i] + '< to register screenboard on.', this.requestor);
                    continue;
                }
                for (let curInputField of inputFields) {
                    curInputField.addEventListener('focus', this.onFocus.bind(this));
                }
            }
        } else {
            // Register on all texutal input elements
            let textFields = document.querySelectorAll('input[type="text"]');
            for (let curInputField of textFields) {
                curInputField.addEventListener('focus', this.onFocus.bind(this));
            }
            let numberFields = document.querySelectorAll('input[type="number"]');
            for (let curInputField of numberFields) {
                curInputField.addEventListener('focus', this.onFocus.bind(this));
            }
            let textareaFields = document.querySelectorAll('textarea');
            for (let curInputField of textareaFields) {
                curInputField.addEventListener('focus', this.onFocus.bind(this));
            }
        }

        // Eventlistener for screenboard keys
        let keylist = document.querySelectorAll('.swac_screenboard_hidden div');
        for (let i = 0; i < keylist.length; i++) {
            keylist[i].addEventListener('click', this.onKeyTipp.bind(this));
        }
    }

    /**
     * Checks if an element is within an screenboard
     * 
     * @param {type} element
     * @returns {undefined}
     */
    isWithinScreenboard(element) {
        if (element.classList.contains('swac_screenboard')) {
            return true;
        } else if (element.parentElement) {
            return this.isWithinScreenboard(element.parentElement);
        }
        return false;
    }

    /**
     * Method to be executed when an input element becomes the focus
     * 
     * @param {DOMEvent} evt Focus event
     * @returns {undefined}
     */
    onFocus(evt) {
        // Only show up when touch detected
        if (this.touchmode || this.options.onlyOnTouch === false) {
            this.show(evt.target);
        } else {
            Msg.warn('Screenboard',
                    'Screenboard is not shown because the element was not focused with '
                    + 'touch and the onlyOnTouch option is true.');
        }
    }

    /** Executed when an input element has lost the focus
     * 
     * @param {DOMEvent} evt Blur event
     * @returns {undefined}
     */
    OnFocusout(evt) {
        this.hide();
    }

    onKeyup(evt) {
        this.hide();
    }

    /**
     * Function for handling an tipp on a screen key. This inserts the content
     * of the underliing div element into the currently active input element.
     * 
     * @param {type} evt
     * @returns {undefined}
     */
    onKeyTipp(evt) {
        // Get value from clicked
        let val = evt.currentTarget.innerHTML;

        // Capture special keys
        if (val.indexOf('icon: arrow-left') > -1) {
            // Delete last char
            this.inputelement.value = this.inputelement.value.substring(0, this.inputelement.value.length - 1);
            return;
        } else if (val.indexOf('icon: triangle-up') > -1) {
            // Toggle keyboardlayout
            this.toggleKeyboardLayout();
            return;
        }

        // Check registred special keys
        let specialPressed = false;
        for (let curSpecialButton of this.options.specialButtons) {
            if (val.indexOf(curSpecialButton.key) !== -1) {
                curSpecialButton.func(evt);
                specialPressed = true;
                if (!curSpecialButton.processfurther) {
                    return;
                }
            }
        }

        // Check on iconized key without buttonHandling
        if (!specialPressed && val.indexOf('icon:') > -1) {
            Msg.warn('Screenboard', 'Pressed a button with icon but no special handling.');
            UIkit.notification({
                message: SWAC.lang.dict.Screenboard.nofunction,
                status: 'error',
                timeout: SWAC.config.notifyDuration,
                pos: 'top-center'
            });
            return;
        }

        // Replace masked values
        switch (val) {
            case '&lt;':
                val = '<';
                break;
            case '&gt;' :
                val = '>';
                break;
            case '&amp;' :
                val = '&';
                break;
        }

        // Add content of the clicked into the input element
        this.inputelement.value = this.inputelement.value + val;
    }

    /**
     * Switches the keyboardlayout to the next available
     */
    toggleKeyboardLayout() {
        this.currentLayout++;
        // Reset to 0 if next not exists
        if (typeof this.keyboardLayouts[this.currentLayout] === 'undefined') {
            this.currentLayout = 0;
        }

        let keylist = document.querySelectorAll('.swac_screenboard div');
        for (let i = 0; i < keylist.length; i++) {
            keylist[i].innerHTML = this.keyboardLayouts[this.currentLayout][i];
        }
    }

    /**
     * Method to be executed when the mouse goes down anywhere on page.
     * Hides the page if the click was outside the screenboard area.
     * 
     * @param {DOMEvent} evt Event of the moudedown
     * @returns {undefined}
     */
    onMousedown(evt) {
        if (this.inputelement !== null && !this.isWithinScreenboard(evt.target)) {
            // Avoid reaction on scrollbar
            if (evt.target.nodeName !== 'HTML') {
                this.hide();
            }
        }
    }

    /**
     * Shows up the screenboard
     * 
     * @param {DOMElement} inputElem Input element for wich the screenboard will be active
     * @returns {undefined}
     */
    show(inputElem) {
        let screenboard = document.querySelector('.swac_screenboard_hidden');
        // If screenboard is currently hidden
        if (screenboard !== null) {
            screenboard.classList.remove('swac_screenboard_hidden');
            screenboard.classList.add('swac_screenboard');
        } else {
            screenboard = document.querySelector('.swac_screenboard');
        }
        // Remove mark on prev active inputelement
        if (this.inputelement !== null) {
            this.inputelement.classList.remove('swac_screenboard-activeelement');
        }
        // Move screenboard below input elem
        let inputElemBox = inputElem.getBoundingClientRect();
        let inputElemTopPos = inputElemBox.top + window.pageYOffset + inputElem.offsetHeight;
        screenboard.style.top = inputElemTopPos + 'px';

        // Note input element
        this.inputelement = inputElem;
        // Mark active input element
        this.inputelement.classList.add('swac_screenboard-activeelement');
    }

    /**
     * Hides the screenboard
     * 
     * @returns {undefined}
     */
    hide() {
        if (this.inputelement) {
            // Remove mark of the active input element
            this.inputelement.classList.remove('swac_screenboard-activeelement');
            this.inputelement = null;
            let screenboard = document.querySelector('.swac_screenboard');
            // If screenboard is currently shown
            screenboard.classList.remove('swac_screenboard');
            screenboard.classList.add('swac_screenboard_hidden');
        }
    }

    /**
     * Method for checking if an event is supported by browser
     * 
     * @param {String} eventName Name of the event to check
     * Source: http://perfectionkills.com/detecting-event-support-without-browser-sniffing/
     * @type screenboardisEventSupported.isEventSupported
     */
    isEventSupported(eventName) {
        let TAGNAMES = {
            'select': 'input', 'change': 'input',
            'submit': 'form', 'reset': 'form',
            'error': 'img', 'load': 'img', 'abort': 'img'
        };
        let el = document.createElement(TAGNAMES[eventName] || 'div');
        eventName = 'on' + eventName;
        var isSupported = (eventName in el);
        if (!isSupported) {
            el.setAttribute(eventName, 'return;');
            isSupported = typeof el[eventName] === 'function';
        }
        el = null;
        return isSupported;
    }
}