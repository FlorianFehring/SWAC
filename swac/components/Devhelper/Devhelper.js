import SWAC from '../../swac.js';
import View from '../../View.js';
import Msg from '../../Msg.js';

export default class Devhelper extends View {

    constructor(options = {}) {
        super(options);
        this.name = 'Devhelper';
        this.desc.text = 'Helping tools for developing with SWAC.';
        this.desc.developers = 'Florian Fehring (FH Bielefeld)';
        this.desc.license = 'GNU Lesser General Public License';
        
        this.desc.templates[0] = {
            name: 'sideboard',
            style: 'sideboard',
            desc: 'Shows the helper tools in a sideboard.'
        };
        this.desc.reqPerTpl[0] = {
            selc: 'cssSelectorForRequiredElement',
            desc: 'Description why the element is expected in the template'
        };
        // opts ids over 1000 are reserved for Component independend options
        this.desc.opts[0] = {
            name: "toolspinned",
            desc: "If true the tools are pinned to the bottom of the viewport."
        };
        // Setting a default value, only applying when the options parameter does not contain this option
        if (!options.toolspinned)
            this.options.toolspinned = true;
        // Sample for useing the general option showWhenNoData
        if (!options.showWhenNoData)
            this.options.showWhenNoData = true;
    }

    /*
     * This method will be called when the component is complete loaded
     * At this thime the template code is loaded, the data inserted into the 
     * template and even plugins are ready to use.
     */
    init() {
        let thisRef = this;
        return new Promise((resolve, reject) => {
            // Show SWAC Version information
            Msg.info('swac', 'Running on SWAC ' + SWAC.desc.version);

            document.addEventListener(
                    'swac_components_complete',
                    thisRef.registerComponentHelperFunctions.bind(thisRef));

            if (thisRef.options.toolspinned) {
                let toolbar = thisRef.requestor.querySelector('.devhelper_tools');
                toolbar.classList.add('devhelper_pinned');
            }

            resolve();
        });
    }

    /**
     * Register functions to requestors to view helptools
     * 
     * @returns {undefined}
     */
    registerComponentHelperFunctions() {
        // Add "show in debug sidebar" function to each swac requestor
        let requestors = document.querySelectorAll('[swa]');
        for (let curRequestor of requestors) {
            // Exclude template subcomponents
            if (curRequestor.id.includes('{id}'))
                continue;
            // Get requestors messages
            let msgs = SWAC.msgs.get(curRequestor);
            if (!msgs) {
                Msg.error('Devhelper', 'No messages found for requestor >' + curRequestor.id + '<');
                return;
            }
            // Create inspector pin
            let pinBtn = document.createElement('a');
            pinBtn.classList.add('devhelper_pin');
            pinBtn.setAttribute('href', '#');
            let statustxt = SWAC.lang.dict.Devhelper.status_ok;
            let statuscls = 'devhelper_ok';
            let statushide = true;
            if (msgs.errors.length > 0) {
                statuscls = 'devhelper_error';
                statustxt = SWAC.lang.dict.Devhelper.status_error;
                statushide = false;
            } else if (msgs.warnings.length > 0) {
                statuscls = 'devhelper_warn';
                statustxt = SWAC.lang.dict.Devhelper.status_warn;
            } else if (msgs.hints.length > 0) {
                statuscls = 'devhelper_hints';
                statustxt = SWAC.lang.dict.Devhelper.status_hint;
            }
            pinBtn.setAttribute('uk-tooltip', statustxt);
            pinBtn.classList.add(statuscls);
            if (statushide)
                pinBtn.classList.add('swac_dontdisplay');
            pinBtn.appendChild(document.createTextNode('<\>'));
            curRequestor.appendChild(pinBtn);

            curRequestor.addEventListener('mouseover', this.onMouseOverRequestor.bind(this));
            curRequestor.addEventListener('mouseleave', this.onMouseLeaveRequestor.bind(this));
            pinBtn.addEventListener('click', this.showDevhelper.bind(this));
            let closeBtn = this.requestor.querySelector('.devhelper_close');
            closeBtn.addEventListener('click', this.closeDevhelper.bind(this));
        }
    }

    /**
     * Analyses a requestor and generates informations and hints about extended functions
     * 
     * @param {SWACrequestor} requestor Requestor to analyse
     * @returns {undefined}
     */
    analyseRequestor(requestor) {
        // Check if supports plugins
        if (requestor.swac_comp.options.plugins && requestor.swac_comp.options.plugins.size > 0) {
            Msg.hint('Devhelper',
                    'The component >' + requestor.swac_comp.name
                    + '< supports plugins. You can set plugin options by adding the attribute plugins = new Map() to the requestors options.', requestor);

            // Show plugins
            let plTpl = this.requestor.querySelector('.repeatForPlugin');
            for (let curPlugin in requestor.swac_comp.options.plugins) {
                // Show source name
                let plElem = plTpl.cloneNode(true);
                plElem.classList.remove('repeatForPlugin');
                let ptElem = plElem.querySelector('.swac_devhelper_pluginname');
                ptElem.innerHTML = curPlugin;
                // Show datasets
                let pluginElem = plElem.querySelector('.swac_devhelper_plugininfo');

                plTpl.parentElement.appendChild(pluginElem);
            }
        } else {
            let plTpl = this.requestor.querySelector('.repeatForPlugin');
            plTpl.parentElement.appendChild(document.createTextNode(SWAC.lang.dict.Devhelper.plugins_none));
        }

        // Show datasources
        let dsTpl = this.requestor.querySelector('.repeatForDataSource');
        for (let curSource in requestor.swac_comp.data) {
            // Show source name
            let dsElem = dsTpl.cloneNode(true);
            dsElem.classList.remove('repeatForDataSource');
            let sElem = dsElem.querySelector('.swac_devhelper_sourcename');
            sElem.innerHTML = curSource;
            // Show datasets
            let setsElem = dsElem.querySelector('.swac_devhelper_sets');

            dsTpl.parentElement.appendChild(dsElem);
        }

        //TODO check if there is a unused bindpoint and an attribut with similar name exists
        //TODO check if there is a condition unfilled and an attribute with similar name exists
        //TODO report unused data
        //TODO implement automatic narrow datarequest based on found bindpoints
        //TODO create information about available options
        //TODO create dialog for visual choosing options and generate code
    }

    afterAddSet(set, repeateds) {
        return;
    }

    /**
     * Function for executing when hovering a requestor. Shows up the debug area.
     * 
     * @param {type} evt
     * @returns {undefined}
     */
    onMouseOverRequestor(evt) {
        let requestor = evt.target;
        while (!requestor.hasAttribute('swa') && requestor.parentElement) {
            requestor = requestor.parentElement;
        }
        if(requestor.nodeName == 'HTML') {
            Msg.error('Devhelper','Could not find requestor! Check if requestor contains swa. If not check if you use the correct replacementmrks. {{urlvar}}',this.requestor);
        }

        // Make pin visable
        let pin = requestor.querySelector('.devhelper_pin');
        if (pin) {
            pin.classList.remove('swac_dontdisplay');
            requestor.classList.add('devhelper_ok_border');
        }
    }

    /**
     * Hides the devhelper toolbar when mouse leaves requstor
     * 
     * @param {DOMevent} evt Mouseleave event
     * @returns {undefined}
     */
    onMouseLeaveRequestor(evt) {
        let requestor = evt.target;
        while (!requestor.hasAttribute('swa') && requestor.parentElement) {
            requestor = requestor.parentElement;
        }

        // Make pin invisable
        let pin = requestor.querySelector('.devhelper_pin');
        if (pin && !pin.classList.contains('devhelper_error')) {
            pin.classList.add('swac_dontdisplay');
        }
        requestor.classList.remove('devhelper_ok_border');
    }

    /**
     * Shows the devhelper toolbar
     * @param {DOMEvent} evt Event calling
     * @returns {undefined}
     */
    showDevhelper(evt) {
        evt.preventDefault();
        let requestor = evt.target;
        while (!requestor.hasAttribute('swa')) {
            requestor = requestor.parentElement;
        }

        let toolbar = this.requestor.querySelector('.devhelper_tools');
        toolbar.classList.remove('swac_dontdisplay');

        // Get requestors messages
        let msgs = SWAC.msgs.get(requestor);
        for (let curMsgArea in msgs) {
            let curMsgElem = this.requestor.querySelector('.devhelper_' + curMsgArea);
            // Remove old messages
            curMsgElem.innerHTML = '';
            // Add new messages
            for (let curMsg of msgs[curMsgArea]) {
                let errorsMsg = document.createElement('li');
                errorsMsg.appendChild(document.createTextNode(' ' + curMsg.message));
                curMsgElem.appendChild(errorsMsg);
            }
        }

        // Basic analysis
        this.analyseRequestor(requestor);
    }

    closeDevhelper(evt) {
        evt.preventDefault();
        let toolbar = this.requestor.querySelector('.devhelper_tools');
        toolbar.classList.add('swac_dontdisplay');
    }

    /**
     * Checks all requirements
     * 
     * @param {DOMElement} requestor SWAC requestor for checking
     * @returns Array with violated requirements
     */
    static checkRequirements(requestor) {
        let comp = requestor.swac_comp;
        // check if component has description
        if (typeof comp.desc === 'undefined') {
            Msg.warn(comp.name, 'The component >'
                    + comp.name + ' does not have SWAC descriptions. '
                    + 'Can not check requirements.', requestor);
            return;
        }

        let violations = this.checkDataRequirements(requestor);
        violations = this.checkTplRequirements(requestor, violations);

        return violations;
    }
    /**
     * Checks if the requestor violats template requirements
     * 
     * @param {DOMElement} requestor SWAC requestor element
     * @param {Array} violations Array where to store violations
     * @returns Array with all violations
     */
    checkDataRequirements(requestor, violations = []) {
        let comp = requestor.swac_comp;
        // check if component has description
        if (typeof comp.desc === 'undefined' || typeof comp.desc.reqPerSet === 'undefined') {
            // Component does not have data requirements
            return violations;
        }

        let data = requestor.swac_comp.data;

        // Check if there are requirements for datasets
        if (typeof comp.desc.reqPerSet !== 'undefined') {
            for (let curReq of comp.desc.reqPerSet) {
                // check each dataset
                for (let i in data) {
                    let curSet = data[i];
                    //TODO check on * that means: a non previous used attribute must be there
                    if (curReq.name !== '*' && typeof curSet[curReq.name] === 'undefined') {
                        // Add requirement validation
                        let violation = {
                            setno: i,
                            req: curReq
                        };
                        violations.push(violation);
                        // Add violation message
                        Msg.error(comp.name,
                                'The required attribute >' + curReq.name
                                + '< is missing in datasource >' + requestor.fromName
                                + '<'
                                , requestor);
                    }
                }
            }
        }
        return violations;
    }
    /**
     * Checks if the requestor violats template requirements
     * 
     * @param {DOMElement} requestor SWAC requestor element
     * @param {Array} violations Array where to store violations
     * @returns Array with all violations
     */
    checkTplRequirements(requestor, violations = []) {
        let comp = requestor.swac_comp;
        // check if component has description
        if (typeof comp.desc === 'undefined') {
            Msg.warn(comp.name, 'The component >'
                    + comp.name + ' does not have SWAC descriptions. '
                    + 'Can not check requirements.', requestor);
            return violations;
        }

        // Check if there are requirements for templates
        if (typeof comp.desc.reqPerTpl !== 'undefined') {
            for (let curReq of comp.desc.reqPerTpl) {
                let selectedElem = requestor.querySelector(curReq.selc);
                if (selectedElem === null) {
                    violations.push(curReq);
                }
            }
        }
        return violations;
    }

    /**
     * Prints an hint message, that shows the available options for that component
     * 
     * @param {DOMElement} requestor
     * @returns {undefined}
     */
    static addOptionsHintMessage(requestor) {
        // Check if custom options are used
        if (requestor.options.optionsSource) {
            Msg.warn('debug',
                    requestor.swac_comp.name + ' for ' + requestor.id
                    + ' runs with custom options', requestor);
            return;
        }

        // Create example configuration
        let globalOptionsVarName = requestor.id + '_options';
        let optionsDescription = '<pre><code class="lang-javascript">';
        optionsDescription += 'var ' + globalOptionsVarName + ' = {';
        let count = 0;
        for (let i in requestor.swac_comp.options) {
            let curOption = requestor.swac_comp.options[i];
            optionsDescription += "\r\n  " + i + ' : ';
            if (typeof curOption === "boolean"
                    || typeof curOption === "numeric") {
                optionsDescription += curOption + ',';
            } else if (Array.isArray(curOption)) {
                optionsDescription += "[";
                for (let j in curOption) {
                    optionsDescription += curOption[j];
                    if (j < curOption.length - 1)
                        optionsDescription += ",";
                }
                optionsDescription += "],";
            } else if (typeof curOption === "object") {
                optionsDescription += "{";
                for (let attr in curOption) {
                    optionsDescription += "\r\n  " + attr + ":" + curOption + ",";
                }
                optionsDescription += "\r\n  },";
            } else {
                optionsDescription += "'" + curOption + "',";
            }
            count++;
        }
        optionsDescription += '\r\n\};</code></pre>';
        if (count > 0) {
            let msg = 'You can set custom options for >' + requestor.id
                    + '< by defining a global object named >' + globalOptionsVarName
                    + '<'
                    + '<br> example:'
                    + optionsDescription;

            Msg.message('debug', msg, requestor, 'hint');
        }
    }
}


