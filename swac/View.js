import Component from './Component.js';
import SWAC from './swac.js';
import Msg from './Msg.js';
import BindPoint from './BindPoint.js';
import Model from './Model.js';
import WatchableSet from './WatchableSet.js';
import ViewHandler from './ViewHandler.js';

/**
 * General class for components
 */
export default class View extends Component {

    /*
     * Constructs a new component object and transfers the config to the
     * object
     */
    constructor(options = {}) {
        super(options);
        // Component description
        this.desc.text = 'View';
        this.desc.templates = [];
        this.desc.reqPerTpl = [];
        this.desc.optPerTpl = [];
        this.desc.optPerPage = [];

        this.desc.opts[1100] = {
            name: "showWhenNoData",
            desc: "Show mediaeditor even if there is not picture loaded from start.",
            example: false
        };
        if (typeof options.showWhenNoData === 'undefined')
            this.options.showWhenNoData = false;

        this.desc.opts[1101] = {
            name: "showWhenNoDataMsg",
            desc: "Custom text to show when no data is available. If set to false no information is shown, if set to true default system message is shown.",
            example: 'My data is missing'
        };
        if (!options.showWhenNoDataMsg)
            this.options.showWhenNoDataMsg = true;

        this.desc.opts[1102] = {
            name: "showNoRightsInfo",
            desc: "Show information when there is no access right. If false simply no data is shown.",
            example: true
        };
        if (typeof options.showNoRightsInfo === 'undefined')
            this.options.showNoRightsInfo = true;

        this.desc.opts[1103] = {
            name: "inViOpts",
            desc: "Options to set when swac_[requestor.id]_invi should be fired. See Present component automatic lazy loading.",
            example: {
                threshold: 0.1
            }
        };
        if (!options.inViOpts)
            this.options.inViOpts = {
                threshold: 0.1
            };

        this.desc.opts[1104] = {
            name: "lazyLoadMode",
            desc: "Mode of the lazy loading. end (Load sets when reaching end of component), none (no automatic lazy loading)",
            example: 'end'
        };
        if (!options.lazyLoadMode)
            this.options.lazyLoadMode = 'none';

        this.desc.opts[1105] = {
            name: "showAddDataInput",
            desc: "If this is set to true a input field is shown where urls to data files can be inserted.",
            example: true
        };
        if (!options.showAddDataInput)
            this.options.showAddDataInput = false;
        this.desc.opts[1106] = {
            name: "respectLoadingOrder",
            desc: "If this is set to true datasets loaded after other are placed after the previous loaded ones. Otherwise datasets are orderes after their parent relationsship regardless of loading time.",
            example: true
        };
        if (!options.respectLoadingOrder)
            this.options.respectLoadingOrder = false;
                this.desc.opts[1107] = {
            name: 'attrVisibility',
            desc: 'Visibilty definition for attributes. Allows to hide attributes with or without conditions. Use attributes: applyOnAttr, aplyOnValue and hide: [Names of input elements]',
            example: [
                {
                    applyOnAttr: 'stringval',
                    applyOnVal: 'string',
                    hide: ['id']
                }
            ]
        };
        if (!options.attrVisibility)
            this.options.attrVisibility = [];

        this.desc.funcs[2001] = {
            name: 'copy',
            desc: 'Copies the component next to the original.',
            params: [
                {
                    name: 'id',
                    desc: 'Id of the created copy, defaults to the same id as the original',
                    type: 'String'
                }
            ]
        };

        this.desc.styles = [];

        // Requestor owning this component instance
        this.requestor = null;

        // Overwrite default options with given options
        for (let attrname in options) {
            this.options[attrname] = options[attrname];
        }

        // Internal attributes
        this.repAttrs = [];
        this.subRequestors = new Map();
        // inViObserver
        this.inViOb = new IntersectionObserver(this.onInVi.bind(this), this.options.inViOpts);
        // endViObserver
        this.endViOb = new IntersectionObserver(this.onEndVi.bind(this), {threshold: 0.1});
    }

    /**
     * Initializes the component
     * 
     * @param {SWACRequestor} requestor
     * @returns {undefined}
     */
    init(requestor) {
        throw('The concrete implementation has to implement the init() method.')
    }

    //public function
    addData(fromName, data) {
        super.addData(fromName, data);
        // Insert no data information
        if (this.data && Object.keys(this.data).length === 0) {
            this.insertNoDataInformation();
        }
        // Add fromName to requestor if not exists
        if (!this.requestor.fromName)
            this.requestor.fromName = fromName;
    }

    //public function
    removeData(fromName) {
        super.removeData(fromName);
        // Get and remove all repeated elements
        let repeateds = this.requestor.querySelectorAll('[swac_fromname="' + fromName + '"]');
        for (let curRepeated of repeateds) {
            curRepeated.parentElement.removeChild(curRepeated);
        }
    }

    //public function
    addSet(fromName, set) {
        Msg.flow('View', 'addSet(' + set.swac_fromName + '[' + set.id + ']', this.requestor);
        super.addSet(fromName, set);
    }

    /**
     * Check if the set should be accepted
     * 
     * @param {WatchableSet} set Dataset to check if addable
     */
    checkAcceptSet(set) {
        // Set checking is disabled
        if (this.options.checkSets === false) {
            return true;
        }

        // Check if size exeeded
        if (!this.options.lazyLoading && this.data[set.swac_fromName].count >= this.requestor.fromWheres.size) {
            Msg.flow('View', 'Dataset >' + set.swac_fromName + '[' + set.id + ']< not accepted by size.', this.requestor);
            return false;
        }

        return super.checkAcceptSet(set);
    }

    afterAddSet(set, repeateds) {
        // Call Component.afterAddSet()
        super.afterAddSet(set, repeateds);

        // Inform plugins about added sets
        if (this.pluginsystem) {
            for (let curPlugin of this.getLoadedPlugins().values()) {
                if (curPlugin.swac_comp.afterAddSet) {
                    curPlugin.swac_comp.afterAddSet(set, repeateds);
                }
            }
        }
    }

    /**
     * Notification from WatchableSource about new sets
     * 
     * @param {WatchableSource} source Source where the set was added
     * @param {WatchableSet} set Set that was added
     */
    notifyAddSet(source, set) {
        Msg.flow('View', 'NOTIFY about added set >' + set.swac_fromName + '[' + set.id + ']< recived', this.requestor);
        // Check of modify added set to needs of the component
        set = this.beforeAddSet(set);
        // If beforeAddSet delivers no set set is not accepted
        if (!set) {
            Msg.error('Component', 'Set >' + set.swac_fromName + '[' + set.id + '] was not accepted.', this.requestor);
            return;
        }
        set.addObserver(this);

        // Remove invisibility when no data
        this.requestor.classList.remove('swac_dontdisplay');
        // Remove no data info text from loaded informations
        this.removeNoDataInformation(this.requestor);
        // Add repeateds for attr
        this.createRepeatedsForAttributes();

        // Check if childsets should be added
        let repeatableForSets;
        if (this.options.mainSource && this.options.mainSource !== set.swac_fromName) {
            let repSetElem = this.requestor.querySelector('.swac_repeatedForSet[swac_setid="' + set[this.options.parentIdAttr] + '"]');
            if (repSetElem) {
                repeatableForSets = this.findElemsRepeatableForChild(repSetElem);
            }
        } else {
            repeatableForSets = this.findElemsRepeatableForSet(this.requestor);
        }
        let repeateds = [];
        if (repeatableForSets && repeatableForSets.length > 0) {
            // Create container for set
            for (let curRepeatableForSet of repeatableForSets) {
                let repeated = this.createRepeatedForSet(set, curRepeatableForSet);
                repeateds.push(repeated);
                // Load images
                let imgs = repeated.querySelectorAll('img[data-src]');
                for (let curImg of imgs) {
                    let src = curImg.getAttribute('data-src');
                    // Set src or placeholder
                    if (!src.includes('{'))
                        curImg.src = src;
                }

                // Load sub requestors
                this.findSubRequestors(repeated);

                // Move if child element
                if (set.parent) {
                    // Find child representation
                    let childRep = repeated.querySelector('.swac_child');
                    // find parent
                    let parentElem = repeated.parentElement.querySelector('[swac_fromname="' + set.swac_fromName + '"][swac_setid="' + set.parent + '"]');
                    if (this.options.respectLoadingOrder) {
                        let setElems = this.requestor.querySelectorAll('.swac_repeatedForSet');
                        let prevElem = setElems[setElems.length - 2];
                        if (repeated.getAttribute('swac_parent') == prevElem.getAttribute('swac_setid')
                                || repeated.getAttribute('swac_parent') == prevElem.getAttribute('swac_parent')) {
                        } else {
                            parentElem = null;
                        }
                    }
                    if (parentElem) {
                        // Find place for child
                        let childsElem = parentElem.querySelector('.swac_forChilds');
                        if (childsElem) {
                            childRep.classList.remove('swac_child');
                            childRep.setAttribute('swac_fromname', set.swac_fromName);
                            childRep.setAttribute('swac_setid', set.id);
                            childRep.swac_dataset = set;
                            childsElem.appendChild(childRep);
                            repeated.remove();
                        } else
                            Msg.warn('View', 'Do not move >' + set.swac_fromName + '[' + set.id + '] to its parent: [' + set.parent + '] because parent has no place for childs. Add swac_forChilds Element to template.');
                    } else {
                        Msg.warn('View', 'Do not move >' + set.swac_fromName + '[' + set.id + '] to its parent: [' + set.parent + '] because parent is not available.');
                    }
                }
            }
        }
        // Stop search at sub repeats
        let stopAtClasses = ['swac_repeatForSet', 'swac_repeatForValue', 'swac_repeatForChild', 'swac_repeatedForSet', 'swac_repeatedForValue', 'swac_repeatedForChild'];
        let bindPoints = this.findBindPoints(
                this.requestor, stopAtClasses);
        for (let curAttr in bindPoints) {
            for (let curBindPoint of bindPoints[curAttr]) {
                curBindPoint.dataset = set;
            }
        }

        // Load sub requestors on component root level
        this.findSubRequestors(this.requestor, ['swac_repeatedForSet', 'swac_repeatForSet']);

        try {
            this.afterAddSet(set, repeateds);
        } catch (e) {
            Msg.error('View', 'Error while executing >' + this.constructor.name + '.afterAddSet(' + set.swac_fromName + '[' + set.id + ']): ' + e, this.requestor);
        }
        let thisRef = this;
        let completeEvent = new CustomEvent('swac_' + this.requestor.id + '_repeatedForSet', {
            detail: {
                requestor: thisRef.requestor,
                repeateds: repeateds,
                set: set
            }
        });
        document.dispatchEvent(completeEvent);
    }

    removeSet(fromName, id) {
        // Parentset or childsets?
//        let selector = '.swac_repeatedForSet[swac_fromname="' + fromName + '"]';
//        if (this.options.mainSource && fromName !== this.options.mainSource) {
//            selector = '.swac_repeatedForChild[swac_fromname="' + fromName + '"]';
//        }
//        selector += '[swac_setId="' + id + '"]';
//        let repeateds = this.requestor.querySelectorAll(selector);
//        for (let curRepeated of repeateds) {
//            console.log('TEST remove',curRepeated);
//            curRepeated.remove();
//        }
        let set = this.data[fromName].getSet(id);
        if (set) {
            this.data[fromName].delSet(set);
        }
        // afterRemoveSet() will be called by nofify
        // this.afterRemoveSet(set);
    }

    notifyDelSet(set) {
        Msg.flow('View', 'notifyDelSet(' + set.swac_fromName + '[' + set.id + ']', this.requestor);

        // Parentset or childsets?
        let selector = '.swac_repeatedForSet[swac_fromname="' + set.swac_fromName + '"]';
        if (this.options.mainSource && set.swac_fromName !== this.options.mainSource) {
            selector = '.swac_repeatedForChild[swac_fromname="' + set.swac_fromName + '"]';
        }
        selector += '[swac_setid="' + set.id + '"]';
        let repeateds = this.requestor.querySelectorAll(selector);
        for (let curRepeated of repeateds) {
            curRepeated.remove();
        }
        super.notifyDelSet(set);
    }

    // public function
    reload() {
        // Fix components size while reloading
        let boundingBox = this.requestor.getBoundingClientRect();
        this.requestor.style.height = boundingBox.height + 'px';
        this.requestor.style.widht = boundingBox.width + 'px';
        // Show data loading message
        this.showCoverMsg('reload');
        let thisRef = this;
        super.reload().then(function (data) {
            thisRef.remCoverMsg();
            thisRef.removeDataLoadErrorMessage('reload');
//            thisRef.redraw();
        }).catch(function (err) {
            thisRef.clear();
            thisRef.remCoverMsg();
            thisRef.insertDataLoadErrorMessage(err);
        }).finally(function () {
            // Recalculte components size
            thisRef.requestor.style.height = null;
            thisRef.requestor.style.widht = null;
        });
    }

    /**
     * Create an error message from a response from data loading
     * 
     * @param {Response} errorresponse Response object from model
     * @param {String} source Name of the datasource
     * @returns {undefined}
     */
    insertDataLoadErrorMessage(errorresponse, source) {
        let errDiv = this.requestor.querySelector('.swac_dataerrormsg');
        if (!errDiv) {
            let errDiv = document.createElement('div');
            errDiv.classList.add('swac_dataerrormsg');
            let errImg = document.createElement('img');
            errImg.height = '100';
            errImg.width = '100';
            let errMsg = '';
            // Insert information about missing login
            if (errorresponse.status === 401) {
                errImg.setAttribute('src', SWAC.config.swac_root + 'components/Icon/imgs/person_fail.svg');
                errMsg = SWAC.lang.dict.core.loadFailLogin;
            } else if (errorresponse.status === 403 && this.options.showNoRightsInfo) {
                // Insert information about missing right
                errImg.setAttribute('src', SWAC.config.swac_root + 'components/Icon/imgs/person_locked.svg');
                errMsg = SWAC.lang.dict.core.loadFailRight;
            } else {
                errImg.setAttribute('src', SWAC.config.swac_root + 'components/Icon/imgs/data/database_fail.svg');
                errMsg = SWAC.lang.dict.core.loadFailErr;
                console.error('Error while loading data: ' + errorresponse);
            }
            errMsg = SWAC.lang.replacePlaceholders(errMsg, 'source', source);
            errDiv.appendChild(errImg);
            errDiv.appendChild(document.createTextNode(errMsg));
            this.requestor.appendChild(errDiv);
        }
    }

    /**
     * Removes error messages from data loading
     * @returns {undefined}
     */
    removeDataLoadErrorMessage() {
        let errDiv = this.requestor.querySelector('.swac_dataerrormsg');
        if (errDiv)
            errDiv.parentElement.removeChild(errDiv);
        this.requestor.classList.remove('swac_errormsg');
    }

    // public function
    copy(id) {
        if (!id)
            id = this.requestor.id
        // Create a copy of the basic div
        let copyElem = document.createElement('div');
        copyElem.setAttribute('id', id);
        copyElem.setAttribute('class', this.requestor.getAttribute('class'));
        copyElem.setAttribute('swa', this.requestor.getAttribute('swa'));
        if (this.requestor.getAttribute('parentfilter'))
            copyElem.setAttribute('parentfilter', this.requestor.getAttribute('parentfilter'));
        if (this.requestor.getAttribute('childfilter'))
            copyElem.setAttribute('childfilter', this.requestor.getAttribute('childfilter'));
        this.requestor.after(copyElem);
        // Start component building
        let viewHandler = new ViewHandler();
        viewHandler.load(copyElem);
    }

    clear() {
        let repeatedForSets = this.requestor.querySelectorAll('.swac_repeatedForSet');
        for (let curRepeated of repeatedForSets) {
            curRepeated.remove();
        }
        let repeatedForValue = this.requestor.querySelectorAll('.swac_repeatedForValue');
        for (let curRepeated of repeatedForValue) {
            curRepeated.remove();
        }
        let repeatedForAttr = this.requestor.querySelectorAll('.swac_repeatedForAttribute');
        for (let curRepeated of repeatedForAttr) {
            curRepeated.remove();
        }
    }

    createRepeatedsForAttributes() {
        // Get repeatableForAttributes
        let repForAttrs = this.findRepeatableForAttribute(this.requestor);
        if (repForAttrs.length > 0) {
            // Get attributes
            let attrSourceMap = this.getAvailableAttributes();
            for (let [curAttrFromName, curAttrs] of attrSourceMap.entries()) {
                for (let curAttr of curAttrs) {
                    if (curAttr.startsWith('swac_'))
                        continue;
                    if (this.repAttrs.includes(curAttr))
                        continue;
                    this.repAttrs.push(curAttr);
                    for (let curRepForAttrs of repForAttrs) {
                        this.createRepeatedForAttribute(curAttrFromName, curAttr, curRepForAttrs);
                    }
                }
            }
        }
    }

    /**
     * Loads the template code from file or from requestor tag and inserts 
     * the template into the requestor
     * 
     * @returns {Promise} Resolves with void when templates was inserted
     */
    loadTemplate() {
        // Build component base path
        let basePath = SWAC.config.swac_root + 'components/' + this.name + "/";

        // Return promise for loading and initialising the view
        return new Promise((resolve, reject) => {
            // Check if dataload message was added
            let dataloadErrorMsg = this.requestor.querySelector('.swac_dataerrormsg');
            if (dataloadErrorMsg) {
                // Remove message
                dataloadErrorMsg.remove();
            }

            // Get template
            let template = null;
            if (this.options.templateName)
                this.requestor.templateName = this.options.templateName;
            if (typeof this.requestor.templateName !== 'undefined') {
                for (let curTemplate of this.desc.templates) {
                    if (curTemplate.name === this.requestor.templateName) {
                        template = curTemplate;
                    }
                }
                if (!template) {
                    Msg.error('View', 'Could not find template >' + this.requestor.templateName + '< for >' + this.requestor.id + '<');
                }
            } else if (typeof this.desc.templates[0] !== 'undefined') {
                template = this.desc.templates[0];
            }

            if (template) {
                // Reset information about used template
                this.requestor.templateName = template.name;
            }
            // Load css
            if (template && template.style) {
                Msg.flow('view', 'Load CSS >' + template.style + '< for >' + this.name + '<');
                let cssLinkElem = document.createElement("link");
                cssLinkElem.setAttribute("href", basePath + template.style + ".css?vers=" + SWAC.desc.version);
                cssLinkElem.setAttribute("type", "text/css");
                cssLinkElem.setAttribute("rel", "stylesheet");
                document.head.appendChild(cssLinkElem);
            }
            // If existend use template code from within requestor
            if (this.requestor.innerHTML.includes('{') || this.requestor.innerHTML.length > 10) {
                Msg.flow('View', 'Useing onpage template for >' + this.requestor.id + '<', this.requestor);
                // Remove loading information
                this.remCoverMsg();
                // Copy innerHTML as template
                // Replace special placeholder for requestor.id
                this.requestor.innerHTML = this.requestor.innerHTML.replaceAll('{requestor.id}', this.requestor.id);
                // Readd error msg
                if (dataloadErrorMsg)
                    this.requestor.appendChild(dataloadErrorMsg);
                // Add bottomInView element
                let endViElem = document.createElement('span');
                this.requestor.appendChild(endViElem);
                this.endViOb.observe(endViElem);
                resolve();
            } else if (template) {
                // Insert loading message
                this.showCoverMsg('loadingtemplate');

                let prom = null;
                if (SWAC.loadTemplates.has(basePath + template.name + ".html?vers=" + SWAC.desc.version)) {
                    prom = SWAC.loadTemplates.get(basePath + template.name + ".html?vers=" + SWAC.desc.version);
                } else {
                    prom = fetch(basePath + template.name + ".html?vers=" + SWAC.desc.version);
                    SWAC.loadTemplates.set(basePath + template.name + ".html?vers=" + SWAC.desc.version, prom);
                }

                // Load template code
                let thisRef = this;
                prom.then(function (response) {
                    let txtprom = SWAC.loadedTemplates.get(basePath + template.name + ".html?vers=" + SWAC.desc.version);
                    if (!txtprom) {
                        txtprom = response.text();
                        SWAC.loadedTemplates.set(basePath + template.name + ".html?vers=" + SWAC.desc.version, txtprom);
                    }

                    // Get content from response
                    txtprom.then(function (templatecode) {
                        // Replace special placeholder for requestor.id
                        thisRef.requestor.innerHTML = templatecode.replaceAll('{requestor.id}', thisRef.requestor.id);
                        // Add bottomInView element
                        let endViElem = document.createElement('span');
                        thisRef.requestor.appendChild(endViElem);
                        thisRef.endViOb.observe(endViElem);
                        if (thisRef.options.showAddDataInput) {
                            let datainElem = document.createElement('input');
                            datainElem.classList.add('uk-input');
                            datainElem.classList.add('uk-width-5-6');
                            datainElem.classList.add('swac_adddataurl');
                            datainElem.setAttribute('placeholder', 'url');
                            let datainBtn = document.createElement('button');
                            datainBtn.classList.add('uk-button');
                            datainBtn.classList.add('uk-width-1-6');
                            datainBtn.innerHTML = SWAC.lang.dict.core.view_adddata;
                            datainBtn.setAttribute('swac_lang', 'view_adddata');
                            datainBtn.addEventListener('click', thisRef.onAddData.bind(thisRef));
                            thisRef.requestor.appendChild(datainElem);
                            thisRef.requestor.appendChild(datainBtn);
                        }
                        // Readd error msg
                        if (dataloadErrorMsg)
                            thisRef.requestor.appendChild(dataloadErrorMsg);
                        resolve();
                    });
                }).catch(function (error) {
                    Msg.error('view', 'Could not load HTML fragment >'
                            + template.name + '< for component >' + thisRef.name + "< : " + error, thisRef.requestor);
                    reject();
                });
            } else {
                Msg.warn('view', 'There is no template for component >' + this.name + "<", this.requestor);
                resolve();
            }
        });
    }

    /**
     * Function to execute when user clicks on the add data button.
     * 
     * @param {DOMEvent} evt Event of clicking
     */
    onAddData(evt) {
        evt.preventDefault();
        let datainElem = this.requestor.querySelector('.swac_adddataurl');
        Model.load({
            fromName: datainElem.value,
            fromWheres: {}
        }, this);

    }

    /**
     * Inserts an information about loading to the requestors element
     * 
     * @param msgid message id, translated using translation files of core and component.
     * @param screencentered if true the element is centered on screen
     * @returns {undefined}
     */
    showCoverMsg(msgid = 'loading') {
        // Remove old msgs
        this.remCoverMsg();

        let txt = SWAC.lang.getTranslationForId(msgid);
        if (!txt)
            txt = msgid;

        let width = this.requestor.offsetWidth;
        let height = this.requestor.offsetHeight;
        if (height === 0)
            return;

//        this.requestor.classList.add('swac_dontdisplay'); // This line made problems on hiding empty requestors
        let loadElem = document.createElement('div');
        loadElem.classList.add('coverMsg_' + this.requestor.id);
        loadElem.classList.add('swac_coverMsg');
        let spinnerElem1 = document.createElement('span');
        spinnerElem1.setAttribute('uk-spinner', 'ratio: 1.0');
        loadElem.appendChild(spinnerElem1);
        loadElem.appendChild(document.createTextNode(txt));
        loadElem.width = width;
        loadElem.height = height;
        this.requestor.parentElement.insertBefore(loadElem, this.requestor);
    }

    /**
     * Removes the loading symbol from the requestors element
     * 
     * @returns {undefined}
     */
    remCoverMsg() {
        let loadingElems = this.requestor.parentElement.querySelectorAll('.coverMsg_' + this.requestor.id);
        for (let curElem of loadingElems) {
            curElem.remove();
        }
//        this.requestor.classList.remove('swac_dontdisplay');
    }

    /**
     * Adds the information that no data is available to the template.
     * 
     * @param {String} noDataText Text to display, when not set language entry model.nodata is used
     * @returns {undefined}
     */
    insertNoDataInformation() {
        Msg.flow('View', 'insertNoDataInformation()', this.requestor);
        let noDataText;
        if (this.requestor.swac_comp.options.showWhenNoDataMsg === false) {
            return;
        } else if (this.requestor.swac_comp.options.showWhenNoDataMsg === true) {
            noDataText = SWAC.lang.dict.core.model_nodata;
        } else {
            noDataText = this.requestor.swac_comp.options.showWhenNoDataMsg;
        }
        // Get repeatable for sets
        let repeatables = this.findElemsRepeatableForSet(this.requestor);
        let added = false;
        // Add message in repeatable
        for (let repeatableElem of repeatables) {
            if (typeof repeatableElem !== 'function') {
                let nodeName = repeatableElem.nodeName;
                // Insert information for tables
                if (nodeName === 'TR') {
                    let noTemplatesTr = repeatableElem.cloneNode(false);
                    noTemplatesTr.classList.remove('swac_repeatForSet');
                    let noOfTds = 0;
                    for (let curNode of repeatableElem.childNodes) {
                        if (curNode.nodeName === 'TD') {
                            noOfTds++;
                        }
                    }

                    let noDataTd = document.createElement('TD');
                    noDataTd.setAttribute('colspan', noOfTds);
                    noDataTd.setAttribute('swac_lang', this.requestor.id + '_nodata');
                    noDataTd.classList.add('swac_nodatainfo');
                    noDataTd.setAttribute('swac_lang', noDataText);
                    noDataTd.innerHTML = noDataText;
                    noTemplatesTr.appendChild(noDataTd);
                    repeatableElem.parentNode.appendChild(noTemplatesTr);
                } else {
                    // Show no data message
                    let noDataDiv = document.createElement('div');
                    noDataDiv.setAttribute('swac_lang', this.requestor.id + '_nodata');
                    noDataDiv.classList.add('swac_nodatainfo');
                    noDataDiv.setAttribute('swac_lang', noDataText);
                    noDataDiv.innerHTML = noDataText;
                    if (repeatableElem.parentNode !== null) {
                        repeatableElem.parentNode.appendChild(noDataDiv);
                    } else {
                        Msg.warn('view', 'The given repeatableElem has no parent.');
                    }
                }
                added = true;
            }
        }
        if (!added) {
            // Show no data message
            let noDataDiv = document.createElement('div');
            noDataDiv.classList.add('swac_nodatainfo');
            noDataDiv.setAttribute('swac_lang', noDataText);
            noDataDiv.innerHTML = noDataText;
            this.requestor.appendChild(noDataDiv);
        }
    }

    /**
     * Removes all no data text elements found in the given element.
     * 
     * @param {DOMElement} element Element where to remove information
     * @returns {undefined}
     */
    removeNoDataInformation(element) {
        let noDataElems = element.querySelectorAll('.swac_nodatainfo');
        for (let noDataElem of noDataElems) {
            noDataElem.parentNode.removeChild(noDataElem);
        }
    }

    /**
     * Finds nodes in the template that should be repeated for every dataset
     * 
     * @param {type} element Element where to begin search
     * @returns {array} Array with elements that are repeatable for sets
     */
    findElemsRepeatableForSet(element) {
        let repeatableSets = [];
        if (typeof element.nodeType === 'undefined') {
            Msg.error('view', 'The given object for findRepeatableForSet() is not an element');
            throw "The given object for findRepeatableForSet() is not an element";
        }

        if (element.classList.contains("swac_repeatForSet")) {
            // Push and do not search child sets because nested sets are not supported
            repeatableSets.push(element);
        } else {
            for (let curChild of element.children) {
                if (!curChild.hasAttribute('swa')) {
                    repeatableSets = repeatableSets.concat(this.findElemsRepeatableForSet(curChild));
                }
            }
        }
        return repeatableSets;
    }

    findElemsRepeatableForChild(element) {
        let repeatableSets = [];
        if (typeof element.nodeType === 'undefined') {
            Msg.error('view', 'The given object for findRepeatableForSet() is not an element');
            throw "The given object for findRepeatableForSet() is not an element";
        }

        if (element.classList.contains("swac_repeatForChild")) {
            // Push and do not search child sets because nested sets are not supported
            repeatableSets.push(element);
        } else {
            for (let curChild of element.children) {
                repeatableSets = repeatableSets.concat(this.findElemsRepeatableForChild(curChild));
            }
        }
        return repeatableSets;
    }

    /**
     * Finds a repeatable for set element from bottom up.
     * 
     * @param {DOMElement} element Elemetn where to start search
     * @returns {DOMElement} Element that can be repeatet for sets
     */
    findRepeatableForSet(element) {
        if (typeof element.nodeType === 'undefined') {
            Msg.error('view', 'The given object for findRepeatableForSet() is not an element');
            throw "The given object for findRepeatableForSet() is not an element";
        }

        if (element.classList.contains("swac_repeatForSet")) {
            return element;
        } else if (typeof element.parentElement !== 'undefined' && element.parentElement !== null) {
            return this.findRepeatableForSet(element.parentElement);
        }
        return null;
    }

    /**
     * Finds the dataset that fills data at the given element
     * 
     * @param {DOMElement} element Elemetn where to start search
     * @returns {WatchableSet} Set thats data is placed in the given element or null if there is no data from set
     */
    findSourceSet(element) {
        if (element.hasAttribute("swac_fromname") && element.hasAttribute("swac_setid")) {
            return this.data[element.getAttribute('swac_fromname')].getSet(parseInt(element.getAttribute('swac_setid')));
        } else if (typeof element.parentElement !== 'undefined' && element.parentElement !== null) {
            return this.findSourceSet(element.parentElement);
        }
        return null;
    }

    /**
     * Creates an html element, that could be repeated for every set
     * 
     * @param {Object} set Dataset for whch the element should be created
     * @param {DOMElement} template Element (.swac_repeatForSet) for use as template
     * @returns {DOMElement} Element with created bindpoints and inserted data
     */
    createRepeatedForSet(set, template) {
        if (!template || !template.classList) {
            Msg.error('view', 'No template given.');
            return;
        }
        let mode;
        if (template.classList.contains('swac_repeatForSet')) {
            mode = 'set';
        } else if (template.classList.contains('swac_repeatForChild')) {
            mode = 'child';
        } else {
            Msg.error('view', 'Given element is no template');
            return;
        }
        // Create clone for insertion of set
        let clone = template.cloneNode(true);
        // Workaround for uikit bug when dynamically adding tabs
        if (clone.classList.contains('uk-active')) {
            clone.classList.remove('uk-active');
            clone.removeAttribute('aria-expanded');
        }

        clone.setAttribute('swac_fromname', set.swac_fromName);
        clone.setAttribute('swac_setid', set.id);
        if (mode === 'set') {
            clone.classList.remove("swac_repeatForSet");
            clone.classList.add("swac_repeatedForSet");
            template.parentNode.appendChild(clone);
        } else {
            clone.classList.remove("swac_repeatForChild");
            clone.classList.add("swac_repeatedForChild");
            let insertBeforeElem = null;
            // Search insertion point
            let insertCandidate = template.parentNode.firstElementChild;
            while (insertCandidate) {
                if (insertCandidate.classList.contains('swac_childInsertPoint')) {
                    insertBeforeElem = insertCandidate;
                    break;
                }
                insertCandidate = insertCandidate.nextElementSibling;
            }
            if (!insertBeforeElem) {
                insertBeforeElem = template.nextSibling;
            }
            template.parentNode.insertBefore(clone, insertBeforeElem);
        }
        clone.swac_dataset = set;

        let stopAtClasses = ['swac_repeatForValue'];
        if (this.options.mainSource && set.swac_fromName === this.options.mainSource) {
            stopAtClasses = ['swac_repeatForValue', 'swac_repeatForChild'];
        }
        // Find all bindPoints in cloned node
        clone.swac_bindPoints = this.findBindPoints(clone, stopAtClasses);
        // Bind points and data
        for (let pbname in clone.swac_bindPoints) {
            for (let curBindPoint of clone.swac_bindPoints[pbname]) {
                curBindPoint.dataset = set;
            }
        }

        // Find all repeatableForValues in cloned node
        let repeatablesForValue = this.findChildsRepeatableForValue(clone, set.setNo);
        for (let curRepeatableForValue of repeatablesForValue) {
            for (let attrs of this.getAvailableAttributes().values()) {
                // Create for every value
                for (let attrid in attrs) {
                    if (typeof set[attrs[attrid]] !== 'function'
                            && typeof set[attrs[attrid]] !== 'undefined') {
                        this.createRepeatedForValue(attrs[attrid], set, curRepeatableForValue);
                    }
                }
            }
        }
        return clone;
    }

    /**
     * Finds the next element upwards in hierarchy that was repeated for set.
     * 
     * @param {DOMElement} element Element where to start the search
     * @returns {unresolved}
     */
    findRepeatedForSet(element) {
        if (element.classList.contains("swac_repeatedForSet")) {
            return element;
        } else if (typeof element.parentElement !== 'undefined' && element.parentElement !== null) {
            return this.findRepeatedForSet(element.parentElement);
        }
        return null;
    }

    /**
     * Finds the next element upwards in hierarchy that was repeated for childset.
     * 
     * @param {DOMElement} elem Element where to start the search
     * @returns {DOMElement} Element that was repeated for a child
     */
    findRepeatedForChild(elem) {
        if (elem.classList.contains("swac_repeatedForChild")) {
            return elem;
        } else if (typeof elem.parentElement !== 'undefined' && elem.parentElement !== null) {
            return this.findRepeatedForChild(elem.parentElement);
        }
        return null;
    }

    /**
     * Finds elements that are repeatable for values.
     * Does not search in repeatableForSet elements
     * 
     * @param {type} element Element where to start search
     * @param {string} setNo no of the set where this repeatableForValue is applicable to
     * @returns {array} Array with elements that are repeatable for values
     */
    findChildsRepeatableForValue(element, setNo) {
        let repeatableForVal = [];
        if (typeof element.nodeType === 'undefined') {
            Msg.error('view', 'The given object for findChildsRepeatableForValue() is not an element');
            throw "The given object for findChildsRepeatableForValue() is not an element";
        }

        if (element.classList.contains("swac_repeatForValue")) {
            // Add applicapleForSet info if setNo is given
            if (typeof setNo !== 'undefined') {
                element.setAttribute('swac_setid', setNo);
            }
            // Push and do not search child sets because nested sets are not supported
            repeatableForVal.push(element);
        } else {
            for (let curChild of element.children) {
                // Do not search within areas that are repeatable for sets
                if (!curChild.classList.contains("swac_repeatForSet")) {
                    repeatableForVal = repeatableForVal.concat(this.findChildsRepeatableForValue(curChild, setNo));
                }
            }
        }
        return repeatableForVal;
    }

    /*
     * Searches the next repeatable element in DOM hiearchy from bottom to up
     * 
     * @return element wich contains the swac_repeatForValue css-class or null if not found
     */
    findRepeatableForValue(element) {
        if (typeof element.nodeType === 'undefined') {
            Msg.error('view', 'The given object for findRepeatableForValue() is not an element');
            throw "The given object for findRepeatableForValue() is not an element";
        }

        if (element.classList.contains("swac_repeatForValue")) {
            return element;
        } else if (typeof element.parentElement !== 'undefined' && element.parentElement !== null) {
            return this.findRepeatableForValue(element.parentElement);
        }
        return null;
    }

    /**
     * Creates a new clone of the element that should be repeated for every value
     * 
     * @param {type} attr 
     * @param {type} set
     * @param {type} template
     * @returns {undefined}
     */
    createRepeatedForValue(attr, set, template) {
        Msg.flow('View', 'Create repeatForValue >' + attr + '< of set.id = >' + set.id + '<', this.requestor);
        let clone = template.cloneNode(true);
        clone.classList.remove('swac_repeatForValue');
        clone.classList.add('swac_repeatedForValue');
        clone.setAttribute('swac_fromname', set.swac_fromName);
        clone.setAttribute('swac_setid', set.id);
        clone.setAttribute('swac_attrname', attr);

        let stopAtClasses = [];
        if (this.options.mainSource && set.swac_fromName === this.options.mainSource) {
            stopAtClasses = ['swac_repeatForChild'];
        }
        // Find all bindPoints in cloned node
        clone.swac_bindPoints = this.findBindPoints(clone, stopAtClasses);
        // Do not create askerik bindpoints for metadata
        if (clone.swac_bindPoints.hasOwnProperty('*') && attr.startsWith('swac_')) {
            return;
        }

        // Bind points and data
        for (let bpname in clone.swac_bindPoints) {
            let curBindPoints = clone.swac_bindPoints[bpname];
            for (let curBindPoint of curBindPoints) {
                // Special handling for askerik placeholder
                if (curBindPoint.getAttribute('attrName') === '*') {
                    curBindPoint.setAttribute('attrName', attr);
                }
                // Special handling for attrName metadata value
                if (curBindPoint.getAttribute('attrName') === 'attrName') {
                    curBindPoint.dataset = {
                        notify: function () {},
                        addObserver: function () {}
                    };
                    curBindPoint.value = attr;
                    continue;
                }

                curBindPoint.dataset = set;
            }
        }
        template.parentElement.appendChild(clone);
    }

    /**
     * Get the element that was repeated for value
     * 
     * @param {type} element
     * @returns {unresolved}
     */
    findRepeatedForValue(element) {
        if (element.classList.contains("swac_repeatedForValue")) {
            return element;
        } else if (typeof element.parentElement !== 'undefined' && element.parentElement !== null) {
            return this.findRepeatedForValue(element.parentElement);
        }
        return null;
    }

    /**
     * Find elements that are repeatable for attributes.
     * Searches downwards
     * 
     * @param {DOMElement} element DOMElement where to start the recursive search
     * @returns {DOMElement[]} Array of DOMElements
     */
    findRepeatableForAttribute(element) {
        let repeatableForAttr = [];
        if (typeof element.nodeType === 'undefined') {
            Msg.error('view', 'The given object for findChildsRepeatableForValue() is not an element');
            throw "The given object for findChildsRepeatableForValue() is not an element";
        }

        if (element.classList.contains("swac_repeatForAttribute")) {
            // Push and do not search child sets because nested sets are not supported
            repeatableForAttr.push(element);
        } else {
            for (let curChild of element.children) {
                repeatableForAttr = repeatableForAttr.concat(this.findRepeatableForAttribute(curChild));
            }
        }
        return repeatableForAttr;
    }

    /**
     * Creates a new clone of the element that should be repeatet for every attribute
     * 
     * @param {String} attrFromName Name of the datasource the attribute comes from
     * @param {String} attrName Attributes name
     * @param {DOMElement} template Template that should be used for every attribute
     * @returns {undefined}
     */
    createRepeatedForAttribute(attrFromName, attrName, template) {
        // Check if attribute isnt generally hidden
        if (this?.options?.attrVisibility && this.options.attrVisibility[0]?.hide.includes(attrName)) {
            return;
        }
        // Create clone for insertion of set
        let clone = template.cloneNode(true);
        clone.classList.remove("swac_repeatForAttribute");
        clone.classList.add("swac_repeatedForAttribute");
        clone.setAttribute('swac_fromname', attrFromName);
        clone.setAttribute('swac_attrname', attrName);
        clone.innerHTML = attrName;
        // Replace attrname placeholder in attributes
        for (let curAttr of clone.attributes) {
            curAttr.value = curAttr.value.replace('{attrName}', attrName);
        }
        template.parentElement.appendChild(clone);
    }

    /**
     * Recursivly find all bindpoints
     * An bindpoint is a mark after the pattern {name} somewhere in attribute value
     * or text content.
     * 
     * @param {type} req  Element of the requestor with added template code
     * @param {string[]} stopAtClasses Names of classes that, if found stops the search downward in tree
     * @returns {BindPoint[]} Two dimensional Array with bindPoints orderd by bindpoint name
     */
    findBindPoints(req, stopAtClasses, lookatcontent = true) {
        if ((req.nodeName === 'CODE' && !req.hasAttribute('swac_parseBindPoints'))
                || (req.nodeName === 'PRE' && !req.hasAttribute('swac_parseBindPoints')))
            return [];

        // Create list of bindPoints for return (use in bind.js for repeatables)
        let newBindPoints = {};
        let regex = /({.*?})/g;

        // Move placeholder from textareas to value-attribute
        if (req.nodeName === 'TEXTAREA') {
            req.setAttribute('value', req.innerHTML);
        }

        // Look at attributes
        if (typeof req.attributes !== 'undefined') {
            for (var curAttr of req.attributes) {
                // Do not search in pattern
                if (curAttr.name === 'pattern')
                    continue;
                let matches = curAttr.value.match(regex);
                if (matches) {
                    for (let curMatch of matches) {
                        let markname = curMatch.replace('{', '').replace('}', '');
                        let bindPoint = new BindPoint(markname, this.requestor);
                        bindPoint.startcont = curAttr.value;
                        bindPoint.attribute = curAttr.name;
                        bindPoint.element = req;

                        if (typeof newBindPoints[markname] === 'undefined') {
                            newBindPoints[markname] = [];
                        }
                        newBindPoints[markname].push(bindPoint);
                    }
                }
            }
        }

        // Look at content
        if (req.nodeType === 3 && lookatcontent) {
            if (req.nodeName === 'STYLE')
                return;

            // Search bindpoint placeholder
            var regexp = /\{.*?\}/g;
            var matches = req.nodeValue.match(regexp);
            // Replace every found occurence
            if (matches) {
                for (let curMatch of matches) {
                    // Get start and endpos of bpexpr
                    let exprStartpos = req.nodeValue.indexOf(curMatch);
                    // Skip if placeholder is not longer present                
                    if (exprStartpos < 0)
                        continue;
                    let exprEndpos = exprStartpos + curMatch.length;
                    // Get name of the bindeable dataset attribute
                    let markname = curMatch.replace('{', '').replace('}', '');
                    // Create bind point
                    let bindPoint = new BindPoint(markname, this.requestor);
                    bindPoint.startcont = curMatch;
                    bindPoint.element = bindPoint;

                    // Content before new node
                    let contbefore = req.nodeValue.substr(0, exprStartpos);
                    let contafter = req.nodeValue.substr(exprEndpos, req.nodeValue.length);
                    // Insert bindpoint
                    req.nodeValue = contbefore;
                    req.parentNode.insertBefore(document.createTextNode(contafter), req.nextSibling);
                    req.parentNode.insertBefore(bindPoint, req.nextSibling);
                    let attrName = bindPoint.getAttribute('attrName');
                    if (typeof newBindPoints[attrName] === 'undefined') {
                        newBindPoints[attrName] = [];
                    }
                    newBindPoints[attrName].push(bindPoint);
                }
            }
        }
        // Look at child nodes
        if (req.nodeType === 1 && lookatcontent) {
            if (req.nodeName === 'svg' || req.nodeName === 'style')
                return newBindPoints;

            for (var nextChild of req.childNodes) {
                if (nextChild.nodeName === 'SWAC-BP')
                    continue;
                if (typeof stopAtClasses !== 'undefined'
                        && nextChild.nodeType === 1) {
                    let stop = false;
                    let nextlookatcontent = true;
                    if (nextChild.hasAttribute('swa')) {
                        nextlookatcontent = false;
                    }
                    for (let curStopClass of stopAtClasses) {
                        if (nextChild.classList.contains(curStopClass)) {
                            stop = true;
                        }
                    }
                    if (!stop) {
                        newBindPoints = this.concatBindPoints(newBindPoints, this.findBindPoints(nextChild, stopAtClasses, nextlookatcontent));
                    }
                } else {
                    newBindPoints = this.concatBindPoints(newBindPoints, this.findBindPoints(nextChild, stopAtClasses, lookatcontent));
                }
            }
        }
        return newBindPoints;
    }

    /**
     * Recursivly find all subrequestors
     * An subrequestor is a component embedded in another component
     * 
     * @param {DOMElement} elem  Element where to search subrequestors
     * @param {string[]} stopAtClasses Names of classes that, if found stops the search downward in tree
     * @returns {BindPoint[]} Two dimensional Array with bindPoints orderd by bindpoint name
     */
    findSubRequestors(elem, stopAtClasses = []) {
        // Check if element contains some of the stop classes
        for (let curStop of stopAtClasses) {
            if (elem.classList.contains(curStop))
                return;
        }
        // More efficent quick check on not existing subrequestors
        if (!elem.innerHTML.includes('swa="'))
            return;
        let viewHandler = new ViewHandler();
        //Look at childs
        for (let curChild of elem.children) {
            // Only work on Component-Tags that are not a template and not allready loading or loaded
            if (curChild.hasAttribute('swa') && !curChild.id.includes('{id}')
                    && !this.subRequestors.get(curChild)) {

                let subRequestorLoadProm = this.subRequestors.get(curChild);
                // Load subrequestor
                Msg.flow('View', 'Load sub requestor >' + curChild.id + '<', this.requestor);
                subRequestorLoadProm = viewHandler.load(curChild);
                this.subRequestors.set(curChild, subRequestorLoadProm);

                let thisRef = this;
                subRequestorLoadProm.then(function () {
                    // If child has no own datasource use data from parent
                    if (!curChild.fromName) {
                        thisRef.copyDataToRequestor(thisRef.requestor, curChild);
                    }
                });
            } else {
                // Look recursive
                try {
                    this.findSubRequestors(curChild, stopAtClasses);
                } catch (e) {
                    console.error(e);
                }
            }
    }
    }

    /**
     * Copy sets from one requestor to another
     * 
     * @param {SWACRequestor} source Source requestor
     * @param {SWACRequestor} target Target requestor
     */
    copyDataToRequestor(source, target) {
        for (let curSource in source.swac_comp.data) {
            Msg.flow('View', 'Use sets from >' + curSource + '(' + source.id + ')< for sub requestor >' + target.id + '<', target);
            for (let curSet of source.swac_comp.data[curSource].getSets()) {
                if (curSet) {
                    target.swac_comp.addSet(curSource, curSet);
                }
            }
        }
    }

    /**
     * Concats two lists of bindPoints
     * 
     * @param {Array} oldBindPoints List with existing bindPoints
     * @param {Array} newBindPoints List with new bindPoints
     * @returns {Array} Merged List of bindPoints
     */
    concatBindPoints(oldBindPoints, newBindPoints) {
        for (let i in newBindPoints) {
            if (typeof oldBindPoints[i] === 'undefined') {
                oldBindPoints[i] = [];
            }
            for (let k in newBindPoints[i]) {
                oldBindPoints[i].push(newBindPoints[i][k]);
            }
        }
        return oldBindPoints;
    }

    /**
     * Adds an css rule to the view
     * 
     * @param {String} selector Selector to which the rule should apply
     * @param {String} rule CSS style rule
     * @returns {undefined}
     */
    addCSSRule(selector, rule) {
        // Add style tag
        let head = document.querySelector('head');
        head.appendChild(document.createElement('style'));
        // Get added stylesheet
        let style = document.styleSheets[document.styleSheets.length - 1];

        if (style.insertRule) {
            style.insertRule(selector + ' {' + rule + '}', style.cssRules.length);
        } else if (style.addRule) {
            // IE
            style.addRule(selector, rule, style.rules.length);
        }
    }

    /**
     * Overwritten saveSet from Component. 
     * Adds functionality for updateing repeatedForSets id for the case, that 
     * the dataset id changes when saveing (can be when createing new sets, that
     * become a frontend side gernerated id)
     */
    saveSet(set, supressMessages, setupdate = true) {
        return new Promise((resolve, reject) => {
            if (!set) {
                Msg.error('View', 'Set is undefined.');
                reject('Set is undefined.');
                return;
            }
            super.saveSet(set, supressMessages, setupdate).then(function (newset) {
                resolve(newset);
            }).catch(function (err) {
                reject(err);
            });
        });
    }

    // public function
    delete() {
        super.delete();
        this.requestor.remove();
    }

    /**
     * Perforemd when the view comes is visiable to the user. Configured by the
     * inViOpts option.
     */
    onInVi(evt) {
        Msg.flow('View', 'Presentation comes in view', this.requestor);
        const myEvent = new CustomEvent("swac_" + this.requestor.id + "_invi", {
            detail: evt,
            bubbles: true,
            cancelable: true,
            composed: false,
        });
        document.dispatchEvent(myEvent);
    }

    /**
     * Performed when the end element is visible to the user.
     */
    onEndVi(evt) {
        Msg.flow('View', 'End of presentation reached', this.requestor);
        if (!this.requestor.loading && this.options.lazyLoadMode === 'end') {
            this.addDataLazy();
        }
        const myEvent = new CustomEvent("swac_" + this.requestor.id + "_endvi", {
            detail: evt,
            bubbles: true,
            cancelable: true,
            composed: false,
        });
        document.dispatchEvent(myEvent);
    }
}