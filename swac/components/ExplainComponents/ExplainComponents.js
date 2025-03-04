import SWAC from '../../swac.js';
import View from '../../View.js';
import Msg from '../../Msg.js';

export default class ExplainComponents extends View {
    constructor(options = {}) {
        super(options);
        this.name = 'ExplainComponents';
        this.desc.text = 'Generates explanations of SWAC components.';
        this.desc.developers = 'Florian Fehring (FH Bielefeld)';
        this.desc.license = 'GNU Lesser General Public License';

        this.desc.depends[0] = {
            name: 'he.js',
            path: SWAC.config.swac_root + 'libs/he/he.min.js',
            desc: 'Library for HTML entity decoding / encodeing'
        };
        this.desc.depends[1] = {
            name: 'highlight.js',
            path: SWAC.config.swac_root + 'libs/highlight/highlight.min.js',
            desc: 'Syntax hightlighting'
        };
        this.desc.depends[2] = {
            name: 'highlight.js style',
            path: SWAC.config.swac_root + 'libs/highlight/styles/default.min.css',
            desc: 'Syntax hightlighting'
        };

        this.desc.templates[0] = {
            name: 'accordion',
            style: 'accordion',
            desc: 'Shows the explanations in an accordion.'
        };

        this.options.showWhenNoData = true;

        this.desc.opts[0] = {
            name: 'componentName',
            desc: 'Name of the component that should be explained.'
        };
        if (!this.options.componentName)
            this.options.componentName = null;

        // Internal data
        this.hilighteds = [];
        this.compPlugins = [];
    }

    init() {
        return new Promise((resolve, reject) => {

            let componentName = this.options.componentName;
            if (!componentName) {
                let msgElem = document.createTextNode(SWAC.lang.dict.ExplainComponents.noComponentSelected);
                this.requestor.appendChild(msgElem);
                resolve();
                return;
            }

            let thisRef = this;
            // Load component script
            import(SWAC.config.swac_root + 'components/' + componentName + '/' + componentName + '.js?vers=' + SWAC.desc.version)
                    .then(module => {
                        // Check if object is available
                        if (module.default) {
                            // Construct the component with default options
                            let explObj = Reflect.construct(module.default, []);
                            // Load plugins
                            let pluginPromises = [];
                            if (explObj.options && explObj.options.plugins) {
                                for (let [pluginname, curPlugin] of explObj.options.plugins) {
                                    let plugLoadProm = new Promise((resolve, reject) => {
                                        // Load component script
                                        import(SWAC.config.swac_root + 'components/' + explObj.name + '/plugins/' + curPlugin.id + '/' + curPlugin.id + 'SPL.js?vers=' + SWAC.desc.version)
                                                .then(module => {
                                                    // Check if object is available
                                                    if (module.default) {
                                                        // Construct the component with default options
                                                        let pluginObj = Reflect.construct(module.default, []);
                                                        thisRef.compPlugins.push(pluginObj);
                                                        resolve();
                                                    }
                                                });
                                    });
                                    pluginPromises.push(plugLoadProm);
                                    plugLoadProm.catch(function (e) {
                                        Msg.error('ExplainComponents', 'Error loading plugin >' + explObj.name + '<: ' + e, thisRef.requestor);
                                    });
                                }
                            }
                            Promise.all(pluginPromises).then(function () {
                                thisRef.explainAll(explObj);
                            }).catch(function (err) {
                                Msg.error('ExplainComponents', 'Could not load component plugins: ' + err, thisRef.requestor);
                            });

                            resolve();
                        }
                    });
        });
    }

    /**
     * Creates a explanation in html about all areas.
     * 
     * @param {SWACComponent} component Component to explain
     * @returns undefined
     */
    explainAll(component) {
        // Set component name
        let comNameElem = this.requestor.querySelector('.swac_expl_compname');
        comNameElem.innerHTML = component.name;

        // Add developer names
        if (component.desc.developers) {
            let devElem = this.requestor.querySelector('.swac_expl_forDeveloper');
            devElem.innerHTML = component.desc.developers;
        }

        // Add component description text
        let descElem = this.requestor.querySelector('.swac_expl_desc');
        descElem.innerHTML = component.desc.text;

        // Add component license
        if (component.desc.license) {
            let licElem = this.requestor.querySelector('.swac_expl_lic');
            licElem.innerHTML = component.desc.license;
        }

        // Add dataset requirements
        let dataReqElem = this.requestor.querySelector('.dataReqDiv');
        let dataReqDiv = this.explainDataRequirements(component);
        dataReqElem.appendChild(dataReqDiv);

        // Add options explanaition
        let optDivTpl = this.requestor.querySelector('.swac_repeatForOption');
        this.explainOptions(component, optDivTpl);

        // Add template requirements
        this.explainTplRequirements(component);

        // Add templates documentation
        this.explainAllTemplates(component);

        // Add styles documentation
        let stylesElem = this.requestor.querySelector('.stylesDiv');
        let stylesDiv = this.explainStyles(component);
        stylesElem.appendChild(stylesDiv);

        // Add functions documentation
        let funcsElem = this.requestor.querySelector('.functionsDiv');
        let functionsDiv = this.explainFunctions(component);
        funcsElem.appendChild(functionsDiv);

        // Add dependency documentation
        let depElem = this.requestor.querySelector('.dependenciesDiv');
        let dependenciesDiv = this.explainDependencies(component);
        depElem.appendChild(dependenciesDiv);

        // Add event documentation
        this.explainEvents(component);

        // Add plugins doc
        if (!component.name.includes('/plugins/')) {
            this.explainPlugins(component);
        }
    }

    /**
     * Creates a explanation in html about the data requirements.
     * 
     * @param {SWACComponent} component Component to explain
     * @returns {Element|this.explainDataRequirements.reqDiv}
     */
    explainDataRequirements(component) {
        let reqDiv = document.createElement('div');

        // Create table
        let table = document.createElement('table');
        table.setAttribute('class', 'uk-table');
        let th = document.createElement('tr');
        let th1 = document.createElement('th');
        th1.innerHTML = SWAC.lang.dict.ExplainComponents.attributeName;
        th.appendChild(th1);
        let th2 = document.createElement('th');
        th2.innerHTML = SWAC.lang.dict.ExplainComponents.attributeDesc;
        th.appendChild(th2);
        let th3 = document.createElement('th');
        th3.innerHTML = SWAC.lang.dict.ExplainComponents.attributeReq;
        th.appendChild(th3);
        table.appendChild(th);

        if (typeof component.desc === 'undefined') {
            let tr = document.createElement("tr");
            let td = document.creeateElement("td");
            td.setAttribute('colspan', '2');
            td.innerHTML = SWAC.lang.dict.ExplainComponents.noDescription;
            tr.appendChild(td);
            table.appendChild(tr);
            reqDiv.appendChild(table);
            return reqDiv;
        }

        if (typeof component.desc.reqPerSet === 'undefined' || component.desc.reqPerSet.length === 0) {
            let tr = document.createElement("tr");
            let td = document.createElement("td");
            td.setAttribute('colspan', '2');
            td.innerHTML = SWAC.lang.dict.ExplainComponents.attributesNone;
            tr.appendChild(td);
            table.appendChild(tr);
        }

        if (component.desc.reqPerSet) {
            // Create tablerow for each required attribute
            for (let curReq of component.desc.reqPerSet) {
                let tr = document.createElement("tr");
                let td1 = document.createElement("td");
                td1.innerHTML = curReq.name;
                tr.appendChild(td1);
                let td2 = document.createElement("td");
                td2.innerHTML = curReq.desc;
                tr.appendChild(td2);
                let td3 = document.createElement("td");
                let checkbox = document.createElement('input');
                checkbox.setAttribute('type', 'checkbox');
                checkbox.setAttribute('checked', 'checked');
                checkbox.setAttribute('disabled', 'disabled');
                checkbox.classList.add('uk-checkbox');
                td3.appendChild(checkbox);
                tr.appendChild(td3);
                table.appendChild(tr);
            }
        }

        if (component.desc.optPerSet) {
            // Create tablerow for each optional attribute
            for (let curOpt of component.desc.optPerSet) {
                let tr = document.createElement("tr");
                let td1 = document.createElement("td");
                td1.innerHTML = curOpt.name;
                tr.appendChild(td1);
                let td2 = document.createElement("td");
                td2.innerHTML = curOpt.desc;
                tr.appendChild(td2);
                let td3 = document.createElement("td");
                let checkbox = document.createElement('input');
                checkbox.setAttribute('type', 'checkbox');
                checkbox.setAttribute('disabled', 'disabled');
                checkbox.classList.add('uk-checkbox');
                td3.appendChild(checkbox);
                tr.appendChild(td3);
                table.appendChild(tr);
            }
        }
        reqDiv.appendChild(table);
        return reqDiv;
    }

    /**
     * Creates a explanation about dependencies of this component.
     * 
     * @param {SWACComponent} component Component to explain
     * @returns {Element|this.explainDependencies.depDiv}
     */
    explainDependencies(component) {
        let depDiv = document.createElement('div');

        // Create table
        let table = document.createElement('table');
        table.setAttribute('class', 'uk-table');
        let th = document.createElement('tr');
        let th1 = document.createElement('th');
        th1.innerHTML = SWAC.lang.dict.ExplainComponents.dependenciesName;
        th.appendChild(th1);
        let th2 = document.createElement('th');
        th2.innerHTML = SWAC.lang.dict.ExplainComponents.dependenciesDesc;
        th.appendChild(th2);
        let th3 = document.createElement('th');
        th3.innerHTML = SWAC.lang.dict.ExplainComponents.dependenciesPath;
        th.appendChild(th3);
        table.appendChild(th);

        if (typeof component.desc === 'undefined') {
            let tr = document.createElement("tr");
            let td = document.creeateElement("td");
            td.setAttribute('colspan', '2');
            td.innerHTML = SWAC.lang.dict.ExplainComponents.noDescription;
            tr.appendChild(td);
            table.appendChild(tr);
            depDiv.appendChild(table);
            return depDiv;
        }

        if (typeof component.desc.depends === 'undefined' || component.desc.depends.length === 0) {
            let tr = document.createElement("tr");
            let td = document.createElement("td");
            td.setAttribute('colspan', '2');
            td.innerHTML = SWAC.lang.dict.ExplainComponents.dependenciesNone;
            tr.appendChild(td);
            table.appendChild(tr);
        }
        if (typeof component.desc.depends !== 'undefined') {
            // Create tablerow for each required attribute
            let i = 0;
            for (let curDependency of component.desc.depends) {
                if (!curDependency) {
                    this.addDocumentationError('Error in dependency declaration dependency ' + i + ' is missing.');
                    i++;
                    continue;
                }
                let tr = document.createElement("tr");
                let td1 = document.createElement("td");
                td1.innerHTML = curDependency.name;
                tr.appendChild(td1);
                let td2 = document.createElement("td");
                td2.innerHTML = curDependency.desc;
                tr.appendChild(td2);
                let td3 = document.createElement("td");
                td3.innerHTML = curDependency.path;
                tr.appendChild(td3);
                table.appendChild(tr);
                i++;
            }
        }

        depDiv.appendChild(table);
        return depDiv;
    }

    /**
     * Explains the requirements on the template.
     * 
     * @param {SWACComponent} component Component to explain
     */
    explainTplRequirements(component) {
        let repForTplElem = this.requestor.querySelector('.swac_repeatForTplElem');

        // Message if there is no description
        if (typeof component.desc === 'undefined') {
            let repForNoElem = repForTplElem.cloneNode();
            repForNoElem.classList.remove('swac_repeatForTplElem');
            let td = document.creeateElement("td");
            td.setAttribute('colspan', '2');
            td.innerHTML = SWAC.lang.dict.ExplainComponents.noDescription;
            repForTplElem.parentElement.appendChild(td);
            return;
        }

        let docCount = 0;
        if (typeof component.desc.reqPerTpl !== 'undefined') {
            // Create tablerow for each required attribute
            for (let curReq of component.desc.reqPerTpl) {
                let repForElem = repForTplElem.cloneNode(true);
                repForElem.classList.remove('swac_repeatForTplElem');
                repForElem.querySelector('.swac_expl_sel').innerHTML = curReq.selc;
                repForElem.querySelector('.swac_expl_desc').innerHTML = curReq.desc;
                repForElem.querySelector('.swac_expl_req').setAttribute('checked', 'checked');
                repForTplElem.parentElement.appendChild(repForElem);
                docCount++;
            }
        }
        // Look at plugins for requirements for template
        for (let curPlugin of this.compPlugins) {
            if(!curPlugin.desc.reqPerTpl)
                continue;
            try {
                // Create tablerow for each required attribute
                for (let curReq of curPlugin.desc.reqPerTpl) {
                    let repForElem = repForTplElem.cloneNode(true);
                    repForElem.classList.remove('swac_repeatForTplElem');
                    repForElem.querySelector('.swac_expl_sel').innerHTML = curReq.selc;
                    repForElem.querySelector('.swac_expl_desc').innerHTML = curReq.desc + ' From >' + curPlugin.name + '< plugin';
                    repForElem.querySelector('.swac_expl_req').setAttribute('checked', 'checked');
                    repForTplElem.parentElement.appendChild(repForElem);
                    docCount++;
                }
            } catch (e) {
                Msg.error('ExplainComponents', 'Plugin >' + curPlugin.name + '< reqPerTpl causes error: ' + e, this.requestor);
            }
        }

        if (typeof component.desc.optPerTpl !== 'undefined') {
            // Create tablerow for each optional attribute
            for (let curOpt of component.desc.optPerTpl) {
                let repForElem = repForTplElem.cloneNode(true);
                repForElem.classList.remove('swac_repeatForTplElem');
                repForElem.querySelector('.swac_expl_sel').innerHTML = curOpt.selc;
                repForElem.querySelector('.swac_expl_desc').innerHTML = curOpt.desc;
                repForTplElem.parentElement.appendChild(repForElem);
                docCount++;
            }
        }
        // Look at plugins for requirements for template
        for (let curPlugin of this.compPlugins) {
            if(!curPlugin.desc.optPerTpl)
                continue;
            // Create tablerow for each optional attribute
            for (let curOpt of curPlugin.desc.optPerTpl) {
                let repForElem = repForTplElem.cloneNode(true);
                repForElem.classList.remove('swac_repeatForTplElem');
                repForElem.querySelector('.swac_expl_sel').innerHTML = curOpt.selc;
                repForElem.querySelector('.swac_expl_desc').innerHTML = curOpt.desc + ' From >' + curPlugin.name + '< plugin';
                repForTplElem.parentElement.appendChild(repForElem);
                docCount++;
            }
        }

        // Mesage if there are no required elements
        if (docCount === 0) {
            let repForNoElem = repForTplElem.cloneNode();
            repForNoElem.classList.remove('swac_repeatForTplElem');
            let td = document.createElement("td");
            td.setAttribute('colspan', '2');
            td.innerHTML = SWAC.lang.dict.ExplainComponents.tmplelemsNone;
            repForTplElem.parentElement.appendChild(td);
        }
    }

    /**
     * Explains all available templates for the given component
     * 
     * @param {SWACComponent} component SWAC component to explain fragment with
     * @returns {undefined}
     */
    explainAllTemplates(component) {
        // Get available templates
        let templates = [];
        if (typeof component.desc !== 'undefined'
                && typeof component.desc.templates !== 'undefined') {
            templates = component.desc.templates;
        } else {
            templates[0] = {
                name: component.name,
                desc: 'Default template for ' + component.name
            };
        }

        // Get template element
        let tplTplElem = this.requestor.querySelector('.swac_expl_repForTpl');

        let notemplates = 0;
        for (let curTemplate of templates) {
            notemplates++;
            let tplElem = tplTplElem.cloneNode(true);
            tplElem.classList.remove('swac_expl_repForTpl');
            tplElem.querySelector('.swac_expl_tplname').innerHTML = 'Template "' + curTemplate.name + '"';
            tplElem.querySelector('.swac_expl_desc').innerHTML = curTemplate.desc;
            let explDivTmpl = document.createElement('div');
            tplElem.appendChild(explDivTmpl);
            tplTplElem.parentElement.appendChild(tplElem);

            let htmlfragment_url = SWAC.config.swac_root + 'components/' + component.name + '/' + curTemplate.name + '.html';
            let thisRef = this;
            // Get component sourcecode
            fetch(htmlfragment_url, {
                // Data in url params not here
                cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
                credentials: 'same-origin', // include, *omit
                headers: {
                    'user-agent': 'SWAC/1.0 fetch',
                    'content-type': 'application/json'
                },
                method: 'GET', // *GET, DELETE
                mode: 'cors', // no-cors, *same-origin
                redirect: 'follow', // *manual, error
                referrer: 'no-referrer' // *client
            }).then(function (response) {
                response.text().then(function (htmlfragment) {
                    thisRef.explainHTMLFragment(htmlfragment, component, explDivTmpl);
                    let deElem = thisRef.requestor.querySelector('.swac_explain_forDocErr');

                    let placeHldrs = htmlfragment.match(/\{(.*?)\}/g);
                    if (placeHldrs) {
                        placeHldrs = placeHldrs.filter(onlyUnique);
                        function onlyUnique(value, index, array) {
                            return array.indexOf(value) === index;
                        }

                        for (let curPlaceHldr of placeHldrs) {
                            let curName = curPlaceHldr.replace('{', '').replace('}', '');
                            // Exclude default
                            if (curName === '*') {
                                explDivTmpl.innerHTML = explDivTmpl.innerHTML.replace('{' + curName + '}', '<span uk-tooltip="Placeholder for any attribute value. Use within swac_repeatForValue.">{' + curName + '}</span>');
                                continue;
                            } else if (curName === 'attrName') {
                                explDivTmpl.innerHTML = explDivTmpl.innerHTML.replace('{' + curName + '}', '<span uk-tooltip="Placeholder for attributes name. Use within swac_repeatForValue.">{' + curName + '}</span>');
                                continue;
                            } else if (curName === 'requestor.id') {
                                explDivTmpl.innerHTML = explDivTmpl.innerHTML.replace('{' + curName + '}', '<span uk-tooltip="Placeholder for the id of the component.">{' + curName + '}</span>');
                                continue;
                            }

                            let found = false;

                            // Check if it is required
                            for (let curReq of component.desc.reqPerSet) {
                                if (curName === curReq.name) {
                                    found = true;
                                    // Description tag for template
                                    explDivTmpl.innerHTML = explDivTmpl.innerHTML.replace('{' + curName + '}', '<span uk-tooltip="' + curReq.desc + '">{' + curName + '}</span>');
                                }
                            }
                            // Check if it is optional
                            for (let curReq of component.desc.optPerSet) {
                                if (curName === curReq.name) {
                                    found = true;
                                    // Description tag for template
                                    explDivTmpl.innerHTML = explDivTmpl.innerHTML.replace('{' + curName + '}', '<span uk-tooltip="' + curReq.desc + '">{' + curName + '}</span>');
                                }
                            }
                            // Check if placehlolder isn't documented
                            if (!found) {
                                let ndeElem = deElem.cloneNode(true);
                                ndeElem.classList.remove('swac_explain_forDocErr');
                                ndeElem.innerHTML = 'Placeholder >' + curName + '< from template >' + curTemplate.name + '< is not documented.';
                                deElem.parentElement.appendChild(ndeElem);
                            }
                        }
                    }

                    // Create template element
                    let div = document.createElement('div');
                    div.innerHTML = htmlfragment;

                    // List all required classes
                    let requiredClasses = new Map();
                    for (let curReqPerTpl of component.desc.reqPerTpl) {
                        // Check if required is id instead of class and warn
                        if (curReqPerTpl.selc.startsWith('#')) {
                            let ndeElem = deElem.cloneNode(true);
                            ndeElem.classList.remove('swac_explain_forDocErr');
                            ndeElem.innerHTML = 'Required template element >' + curReqPerTpl.selc + '< from template >' + curTemplate.name + '< has an id selector. You should use class selectors instead to avoid problems with multiple component useages on one page.';
                            deElem.parentElement.appendChild(ndeElem);
                        } else if (!curReqPerTpl.selc.startsWith('.')) {
                            let found = div.querySelector(curReqPerTpl.selc);
                            if (!found) {
                                requiredClasses.set(curReqPerTpl.selc, curReqPerTpl.selc);
                            }
                        } else {
                            requiredClasses.set(curReqPerTpl.selc, curReqPerTpl.selc);
                        }
                    }
                    for (let curOptPerTpl of component.desc.optPerTpl) {
                        // Check if required is id instead of class and warn
                        if (curOptPerTpl.selc.startsWith('#')) {
                            let ndeElem = deElem.cloneNode(true);
                            ndeElem.classList.remove('swac_explain_forDocErr');
                            ndeElem.innerHTML = 'Required template element >' + curOptPerTpl.selc + '< from template >' + curTemplate.name + '< has an id selector. You should use class selectors instead to avoid problems with multiple component useages on one page.';
                            deElem.parentElement.appendChild(ndeElem);
                        }
                    }

                    // Check classes
                    let clsElems = div.querySelectorAll('[class]');
                    for (let curClsElem of clsElems) {
                        for (let curCls of curClsElem.classList) {
                            // If class is a uikit class
                            if (curCls.startsWith('uk-')) {
                                var re = new RegExp(curCls, 'g');
                                explDivTmpl.innerHTML = explDivTmpl.innerHTML.replace(re, '<span uk-tooltip="This is a ui-kit styling instruction">' + curCls + '</span>');
                                requiredClasses.delete('.' + curCls);
                                continue;
                            }
                            if (curCls.startsWith('swac_format')) {
                                // Formating classes for templates without functional meaning
                                var re = new RegExp(curCls, 'g');
                                explDivTmpl.innerHTML = explDivTmpl.innerHTML.replace(re, '<span uk-tooltip="This is a formating only class. See ' + curTemplate.name + '.css">' + curCls + '</span>');
                                continue;
                            }
                            if (curCls.startsWith('swac_onscreen')) {
                                // Special formating for show content only on screen
                                var re = new RegExp(curCls, 'g');
                                explDivTmpl.innerHTML = explDivTmpl.innerHTML.replace(re, '<span uk-tooltip="This element is shown only on screens.">' + curCls + '</span>');
                                continue;
                            }
                            if (curCls.startsWith('swac_onprint')) {
                                // Special formating for show content only on prints
                                var re = new RegExp(curCls, 'g');
                                explDivTmpl.innerHTML = explDivTmpl.innerHTML.replace(re, '<span uk-tooltip="This element is shown only when page is printed.">' + curCls + '</span>');
                                continue;
                            }

                            if (curCls === 'swac_repeatForSet') {
                                var re = new RegExp(curCls, 'g');
                                explDivTmpl.innerHTML = explDivTmpl.innerHTML.replace(re, '<span uk-tooltip="This element is repeated for every dataset added to the component.">' + curCls + '</span>');
                                continue;
                            }
                            if (curCls === 'swac_repeatForValue') {
                                var re = new RegExp(curCls, 'g');
                                explDivTmpl.innerHTML = explDivTmpl.innerHTML.replace(re, '<span uk-tooltip="This element is repeated for every value available in a dataset.">' + curCls + '</span>');
                                continue;
                            }
                            if (curCls === 'swac_repeatForAttribute') {
                                var re = new RegExp(curCls, 'g');
                                explDivTmpl.innerHTML = explDivTmpl.innerHTML.replace(re, '<span uk-tooltip="This element is repeated for every value attribute name in a dataset.">' + curCls + '</span>');
                                continue;
                            }
                            if (curCls === 'swac_dontdisplay') {
                                var re = new RegExp(curCls, 'g');
                                explDivTmpl.innerHTML = explDivTmpl.innerHTML.replace(re, '<span uk-tooltip="This element is hidden. It may be displayed be removeing the class.">' + curCls + '</span>');
                                continue;
                            }
                            if (curCls === 'swac_forChilds') {
                                var re = new RegExp(curCls, 'g');
                                explDivTmpl.innerHTML = explDivTmpl.innerHTML.replace(re, '<span uk-tooltip="This element is the place in the parent dataset visualisation, where childs are shown.">' + curCls + '</span>');
                                continue;
                            }
                            if (curCls === 'swac_child') {
                                var re = new RegExp(curCls, 'g');
                                explDivTmpl.innerHTML = explDivTmpl.innerHTML.replace(re, '<span uk-tooltip="This element contains the representation for the dataset as it is when used as a child element of some other dataset.">' + curCls + '</span>');
                                continue;
                            }
                            if (curCls === 'swac_repeatForPluginNav') {
                                var re = new RegExp(curCls, 'g');
                                explDivTmpl.innerHTML = explDivTmpl.innerHTML.replace(re, '<span uk-tooltip="This element is repeated for every plugin and contains its navigation entry.">' + curCls + '</span>');
                                continue;
                            }
                            if (curCls === 'swac_plugin_name') {
                                var re = new RegExp(curCls, 'g');
                                explDivTmpl.innerHTML = explDivTmpl.innerHTML.replace(re, '<span uk-tooltip="This element will be filled with the plugins name.">' + curCls + '</span>');
                                continue;
                            }
                            if (curCls === 'swac_repeatForPluginCont') {
                                var re = new RegExp(curCls, 'g');
                                explDivTmpl.innerHTML = explDivTmpl.innerHTML.replace(re, '<span uk-tooltip="This element is repeated for every plugin and contains its content.">' + curCls + '</span>');
                                continue;
                            }

                            // Search in descriptions
                            let found = false;
                            for (let curReqPerTpl of component.desc.reqPerTpl) {
                                if (curReqPerTpl.selc === '.' + curCls) {
                                    var re = new RegExp(curCls, 'g');
                                    explDivTmpl.innerHTML = explDivTmpl.innerHTML.replace(re, '<span uk-tooltip="(required) ' + curReqPerTpl.desc + '">' + curCls + '</span>');
                                    found = true;
                                    requiredClasses.delete(curReqPerTpl.selc);
                                    break;
                                }
                            }
                            // Search descriptions in plugins
                            for (let curPlugin of thisRef.compPlugins) {
                                if(!curPlugin.desc.reqPerTpl)
                                    continue;
                                for (let curOptPerTpl of curPlugin.desc.reqPerTpl) {
                                    if (curOptPerTpl.selc === '.' + curCls) {
                                        var re = new RegExp(curCls, 'g');
                                        explDivTmpl.innerHTML = explDivTmpl.innerHTML.replace(re, '<span uk-tooltip="(required for plugin ' + curPlugin.name + ') ' + curOptPerTpl.desc + '">' + curCls + '</span>');
                                        found = true;
                                        break;
                                    }
                                }
                            }

                            // Search descs for optional template elmements
                            for (let curOptPerTpl of component.desc.optPerTpl) {
                                if (curOptPerTpl.selc === '.' + curCls) {
                                    var re = new RegExp(curCls, 'g');
                                    explDivTmpl.innerHTML = explDivTmpl.innerHTML.replace(re, '<span uk-tooltip="(optional) ' + curOptPerTpl.desc + '">' + curCls + '</span>');
                                    found = true;
                                    break;
                                }
                            }
                            // Search descriptions in plugins
                            for (let curPlugin of thisRef.compPlugins) {
                                if(!curPlugin.desc.optPerTpl)
                                    continue;
                                for (let curOptPerTpl of curPlugin.desc.optPerTpl) {
                                    if (curOptPerTpl.selc === '.' + curCls) {
                                        var re = new RegExp(curCls, 'g');
                                        explDivTmpl.innerHTML = explDivTmpl.innerHTML.replace(re, '<span uk-tooltip="(optional for plugin ' + curPlugin.name + ') ' + curOptPerTpl.desc + '">' + curCls + '</span>');
                                        found = true;
                                        break;
                                    }
                                }
                            }

                            // Info when cls not found
                            if (!found) {
                                if (deElem) {
                                    let ndeElem = deElem.cloneNode(true);
                                    ndeElem.classList.remove('swac_explain_forDocErr');
                                    ndeElem.innerHTML = 'Used class >' + curCls + '< in template >' + curTemplate.name + '< is not documented.';
                                    deElem.parentElement.appendChild(ndeElem);
                                }
                            }
                        }
                    }

                    // Check if some required classes are not found
                    if (requiredClasses.size > 0) {
                        let ndeElem = deElem.cloneNode(true);
                        ndeElem.classList.remove('swac_explain_forDocErr');
                        let missingnames = Array.from(requiredClasses.keys()).join(', ');
                        ndeElem.innerHTML = 'The required elements with class(es) >' + missingnames + '< were not found in template >' + curTemplate.name + '<.';
                        deElem.parentElement.appendChild(ndeElem);
                    }
                });
            });
        }

        if (notemplates === 0) {
            let tplElem = tplTplElem.cloneNode(true);
            tplElem.classList.remove('swac_expl_repForTpl');
            tplElem.querySelector('.swac_expl_desc').innerHTML = SWAC.lang.dict.ExplainComponents.tplsNone;
            tplTplElem.parentElement.appendChild(tplElem);
        }
    }

    /**
     * Creates a description of the options available in the component.
     * 
     * @param {SWAC component} component
     * @param {DOMElement} optDivTpl Template to use for option display
     * @returns {undefined}
     */
    explainOptions(component, optDivTpl) {
        // Build up description map
        let descmap = new Map();
        if (component.desc && component.desc.opts) {
            for (let curOptDesc of component.desc.opts) {
                if (!curOptDesc)
                    continue;
                descmap.set(curOptDesc.name, curOptDesc);
            }
        }
        // Create description table
        for (let curOption in component.options) {
            let optDiv = optDivTpl.cloneNode(true);
            optDiv.classList.remove('swac_repeatForOption');
            optDiv.querySelector('.swac_explain_option_name').innerHTML = curOption;
            // Default value
            optDiv.querySelector('.swac_explain_option_default').innerHTML = this.convertToText(component.options[curOption]);
            // Type calculation
            let type;
            let dval = component.options[curOption];

            // Add description
            let desc = descmap.get(curOption);
            let deElem = this.requestor.querySelector('.swac_explain_forDocErr');
            if (typeof desc !== 'undefined') {
                // Description text
                optDiv.querySelector('.swac_explain_option_desc').innerHTML = desc.desc;
                // Example
                optDiv.querySelector('.swac_explain_option_example').innerHTML = this.convertToText(desc.example);
                // Update type
                if (desc.type) {
                    type = desc.type;
                } else if (desc.example)
                    dval = desc.example;
            } else {
                optDiv.querySelector('.swac_explain_option_desc').innerHTML = SWAC.lang.dict.ExplainComponents.optionsNodesc;
                if (deElem) {
                    let ndeElem = deElem.cloneNode(true);
                    ndeElem.classList.remove('swac_explain_forDocErr');
                    ndeElem.innerHTML = 'Option >' + curOption + '< is not documented.';
                    deElem.parentElement.appendChild(ndeElem);
                }
            }
            if (!type && typeof dval !== 'undefined' && dval != null) {
                type = typeof dval;
                if (dval.constructor === Array) {
                    const first = dval.find(e => typeof e !== 'undefined');
                    type = typeof first;
                    type += '[]';
                } else if (dval.constructor === Map) {
                    type = 'Map<>';
                }
            }

            if (typeof type === 'undefined' || type.startsWith('undefined')) {
                let ndeElem = deElem.cloneNode(true);
                ndeElem.classList.remove('swac_explain_forDocErr');
                ndeElem.innerHTML = 'Option >' + curOption + '< has no valid type information. Either add a default value, a example value, or a type name.';
                deElem.parentElement.appendChild(ndeElem);
            }

            // Datatype
            optDiv.querySelector('.swac_explain_option_type').innerHTML = type;

            optDivTpl.parentElement.appendChild(optDiv);
        }
    }

    /**
     * Creates a description of the functions that the component has.
     * 
     * @param {SWACcomponent} component component to describe
     * @returns {HTMLElement} HTML Element with the description
     */
    explainFunctions(component) {
        let explDiv = document.createElement('div');

        if (typeof component.desc.funcs === 'undefined' || component.desc.funcs.length === 0) {
            explDiv.appendChild(document.createTextNode(SWAC.lang.dict.ExplainComponents.noFunctions));
            return explDiv;
        }

        for (let curFunc of component.desc.funcs) {
            // Exclude holes in array
            if (!curFunc)
                continue;
            let funcArea = document.createElement('div');
            let funcExplHead = document.createElement('h3');
            funcExplHead.appendChild(document.createTextNode(curFunc.name));
            funcArea.appendChild(funcExplHead);
            let funcExplText = document.createTextNode(curFunc.desc);
            funcArea.appendChild(funcExplText);
            // Table for params
            let paramTable = document.createElement('table');
            paramTable.classList.add('uk-table');
            let paramTableCapt = document.createElement('caption');
            paramTableCapt.innerHTML = SWAC.lang.dict.ExplainComponents.params;
            paramTable.appendChild(paramTableCapt);
            let paramTableHead = document.createElement('tr');
            let paramNameCaption = document.createElement('th');
            paramNameCaption.appendChild(document.createTextNode(SWAC.lang.dict.ExplainComponents.paramName));
            paramTableHead.appendChild(paramNameCaption);
            let paramTypeCaption = document.createElement('th');
            paramTypeCaption.appendChild(document.createTextNode(SWAC.lang.dict.ExplainComponents.paramType));
            paramTableHead.appendChild(paramTypeCaption);
            let paramDescCaption = document.createElement('th');
            paramDescCaption.appendChild(document.createTextNode(SWAC.lang.dict.ExplainComponents.paramDesc));
            paramTableHead.appendChild(paramDescCaption);
            paramTable.appendChild(paramTableHead);

            if (curFunc.params && curFunc.params.length > 0) {
                // List params
                for (let param of curFunc.params) {
                    let paramTableRow = document.createElement('tr');
                    let paramName = document.createElement('td');
                    paramName.appendChild(document.createTextNode(param.name));
                    paramTableRow.appendChild(paramName);
                    let paramType = document.createElement('td');
                    paramType.appendChild(document.createTextNode(param.type));
                    paramTableRow.appendChild(paramType);
                    let paramDesc = document.createElement('td');
                    paramDesc.appendChild(document.createTextNode(param.desc));
                    paramTableRow.appendChild(paramDesc);
                    paramTable.appendChild(paramTableRow);
                }
            } else {
                // Message about no params
                let paramTableRow = document.createElement('tr');
                let paramMsg = document.createElement('td');
                paramMsg.setAttribute('rowspan', '3');
                paramMsg.appendChild(document.createTextNode(SWAC.lang.dict.ExplainComponents.noParams));
                paramTableRow.appendChild(paramMsg);
                paramTable.appendChild(paramTableRow);
            }
            funcArea.appendChild(paramTable);

            // Documentation for return type
            let retTableHead = document.createElement('tr');
            let retNameCaption = document.createElement('th');
            retTableHead.appendChild(retNameCaption);
            let retTypeCaption = document.createElement('th');
            retTypeCaption.appendChild(document.createTextNode(SWAC.lang.dict.ExplainComponents.returnType));
            retTableHead.appendChild(retTypeCaption);
            let retDescCaption = document.createElement('th');
            retDescCaption.appendChild(document.createTextNode(SWAC.lang.dict.ExplainComponents.returnDesc));
            retTableHead.appendChild(retDescCaption);
            paramTable.appendChild(retTableHead);
            if (curFunc.returns) {
                let retTableRow = document.createElement('tr');
                let retName = document.createElement('td');
                retTableRow.appendChild(retName);
                let retType = document.createElement('td');
                retType.appendChild(document.createTextNode(curFunc.returns.type));
                retTableRow.appendChild(retType);
                let retDesc = document.createElement('td');
                retDesc.appendChild(document.createTextNode(curFunc.returns.desc));
                retTableRow.appendChild(retDesc);
                paramTable.appendChild(retTableRow);
            } else {
                // Message about no return value
                let paramTableRow = document.createElement('tr');
                let paramMsg = document.createElement('td');
                paramMsg.setAttribute('rowspan', '3');
                paramMsg.appendChild(document.createTextNode(SWAC.lang.dict.ExplainComponents.noReturn));
                paramTableRow.appendChild(paramMsg);
                paramTable.appendChild(paramTableRow);
            }

            explDiv.appendChild(funcArea);
        }

        return explDiv;
    }

    /**
     * Converts a object to its text representation
     * 
     * @param {Object} obj Object
     * @returns {String} Text representation
     */
    convertToText(obj) {
        if (typeof obj === 'undefined')
            return '';
        if (obj === null)
            return 'null';

        //create an array that will later be joined into a string.
        var string = [];

        //is object
        //    Both arrays and objects seem to return "object"
        //    when typeof(obj) is applied to them. So instead
        //    I am checking to see if they have the property
        //    join, which normal objects don't have but
        //    arrays do.
        if (obj.constructor === Array) {
            string.push("[");
            let substr = [];
            for (let prop in obj) {
                substr.push(this.convertToText(obj[prop]));
            }
            string.push(substr.join(','));
            string.push("]");

            //is function
        } else if (obj.constructor === Map) {
            string.push('new Map(');
            let fent = obj.entries().next().value;
            if (fent)
                string.push(this.convertToText(obj.entries().next().value));
            string.push(')');
        } else if (typeof (obj) == "object" && (obj.join == undefined)) {
            string.push("{\n");
            let substr = [];
            for (let prop in obj) {
                substr.push(prop + ": " + this.convertToText(obj[prop]));
            }
            string.push(substr.join(",\n"));
            string.push("\n}");

            //is array
        } else if (typeof (obj) == "function") {
            string.push(obj.toString())

            //all other values can be done with JSON.stringify
        } else {
            string.push(JSON.stringify(obj))
        }

        return string.join("")
    }

    /**
     * Creates a description of the given HTMlfragment acordingly
     * 
     * @param {String} htmlfragment HTMLfragment to explain
     * @param {SWACComponent} component SWAC component to explain fragment with
     * @param {DOMElement} reqDiv DOM element where to add the explanation
     * @returns {undefined}
     */
    explainHTMLFragment(htmlfragment, component, reqDiv) {
        // Insert code from template and highlight
        let encodedhtml = he.encode(htmlfragment);
        let codeElem = document.createElement('code');
        codeElem.innerHTML = encodedhtml;
        let preElem = document.createElement('pre');
        preElem.appendChild(codeElem);
        reqDiv.appendChild(preElem);

        this.encodeHTML().then(function (codeElem) {


            //TODO insert highlights with popup that descripes the highlighted element
        });
    }

    /**
     * Explains the styles this component offers
     * 
     * @param {SWACComponent} component Component to explain
     * @returns {Element|this.explainTplRequirements.reqDiv}
     */
    explainStyles(component) {
        let stylesDiv = document.createElement('div');

        // Create table
        let table = document.createElement('table');
        table.setAttribute('class', 'uk-table');
        let th = document.createElement('tr');
        let th1 = document.createElement('th');
        th1.innerHTML = SWAC.lang.dict.ExplainComponents.styleSelector;
        th.appendChild(th1);
        let th2 = document.createElement('th');
        th2.innerHTML = SWAC.lang.dict.ExplainComponents.styleDesc;
        th.appendChild(th2);
        table.appendChild(th);

        if (!component.desc) {
            let tr = document.createElement("tr");
            let td = document.creeateElement("td");
            td.setAttribute('colspan', '2');
            td.innerHTML = SWAC.lang.dict.ExplainComponents.noDescription;
            tr.appendChild(td);
            table.appendChild(tr);
            stylesDiv.appendChild(table);
            return stylesDiv;
        }

        if (!component.desc.styles || component.desc.styles.length === 0) {
            let tr = document.createElement("tr");
            let td = document.createElement("td");
            td.setAttribute('colspan', '2');
            td.innerHTML = SWAC.lang.dict.ExplainComponents.stylesNone;
            tr.appendChild(td);
            table.appendChild(tr);
        } else {
            // Create tablerow for each optional attribute
            for (let curStyle of component.desc.styles) {
                let tr = document.createElement("tr");
                let td1 = document.createElement("td");
                td1.innerHTML = curStyle.selc;
                tr.appendChild(td1);
                let td2 = document.createElement("td");
                td2.innerHTML = curStyle.desc;
                tr.appendChild(td2);
                table.appendChild(tr);
            }
        }
        stylesDiv.appendChild(table);

        return stylesDiv;
    }

    /**
     * Explains available plguins
     * 
     * @param {SWACComponent} component Component where plugins should be explained from
     */
    explainPlugins(component) {
        Msg.flow('ExplainComponents','explainPlugins()',this.requestor);
        let pldocElem = this.requestor.querySelector('.swac_explaincomponents_plugins');
        if(!component.options.plugins) {
            pldocElem.innerHTML = SWAC.lang.dict.ExplainComponents.pluginsNone;
            return;
        }

        for (let [pluginname, curPlugin] of component.options.plugins) {
            let pldocNElem = pldocElem.cloneNode(true);
            pldocNElem.classList.remove('swac_dontdisplay');
            pldocElem.parentElement.appendChild(pldocNElem);
            pldocNElem.querySelector('.swac_plugin_name').innerHTML = SWAC.lang.dict.ExplainComponents.plugins + ': ' + pluginname;
            
            let thisRef = this;
            // Load component script
            import(SWAC.config.swac_root + 'components/' + component.name + '/plugins/' + curPlugin.id + '/' + curPlugin.id + 'SPL.js?vers=' + SWAC.desc.version)
                    .then(module => {
                        // Check if object is available
                        if (module.default) {
                            // Construct the component with default options
                            let explObj = Reflect.construct(module.default, []);
                            pldocNElem.querySelector('.swac_plugin_desc').innerHTML = explObj.desc.text;
                            // Explain options
                            let optDivTpl = pldocNElem.querySelector('.swac_repeatForOption');
                            thisRef.explainOptions(explObj,optDivTpl);
                        }
                    });
        }
    }

    /**
     * Explains the events that the component defines
     * 
     * @param {Component} component 
     */
    explainEvents(component) {
        let evtDivTpl = this.requestor.querySelector('.swac_expl_repForEvt');
        for (let curEvt of component.desc.events) {
            let evtDiv = evtDivTpl.cloneNode(true);
            evtDiv.classList.remove('swac_expl_repForEvt');
            evtDiv.querySelector('.swac_expl_name').innerHTML = curEvt.name;
            evtDiv.querySelector('.swac_expl_desc').innerHTML = curEvt.desc;
            evtDiv.querySelector('.swac_expl_data').innerHTML = curEvt.data;
            evtDivTpl.parentElement.appendChild(evtDiv);
        }
    }

    /**
     * Encodes a htmlfragment string and highlights it.
     * 
     * @returns {Promise} Promise that resolves to an DOMElement with htmlfragment as text
     */
    encodeHTML() {
        let thisRef = this;
        return new Promise((resolve, reject) => {
            // Highlight code elements allready existing on page
            let codeElems = document.querySelectorAll('pre code');
            for (let codeElem of codeElems) {
                if (!thisRef.hilighteds.includes(codeElem)) {
                    hljs.highlightElement(codeElem);
                    thisRef.hilighteds.push(codeElem);
                }
            }
            resolve();
        });
    }

    /**
     * Adds an error message to the page
     */
    addDocumentationError(e) {
        let forErrElem = this.requestor.querySelector('.swac_explain_forError');
        let errElem = forErrElem.cloneNode(true);
        errElem.querySelector('.swac_explain_errorMsg').innerHTML = e;
        errElem.classList.remove('swac_dontdisplay');
        this.requestor.appendChild(errElem);
    }
}