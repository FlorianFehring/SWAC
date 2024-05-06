import Component from './Component.js';
import SWAC from './swac.js';
import Msg from './Msg.js';

/**
 * Plugin for chart component to create barcharts
 */
export default class Plugin extends Component {

    /*
     * Constructs a new component plugin object and transfers the config to the
     * object
     */
    constructor(options) {
        super(options);
        // Plugin description
        this.desc.text = 'ComponentPlugin';
        this.desc.templates = [];
        this.desc.reqPerTpl = [];
        this.desc.optPerTpl = [];
        this.desc.optPerPage = [];
        this.desc.reqPerSet = [];
        this.desc.optPerSet = [];
        this.options = options;

        // Overwrite default options with given options
        for (let attrname in options) {
            this.options[attrname] = options[attrname];
        }

        this.content = null;
        this.template = null;

        this.navElements = []; // List of navigation elements (index = dataset id or 0 if dataset independend)
        this.contElements = []; // List of content elements (index = dataset id or 0 if dataset independend)
    }

    init(requestor) {
        throw('The concrete implementation has to implement the init() method.');
    }

    /**
     * Loads the template code for that plugin
     * 
     * @param {String} pluginname Name of the plugin where to load template for
     * @returns {Promise} Promise that resolves when template code was loaded and
     * inserted to pluginarea. Returns with a list of all inserted dom nodes.
     */
    loadTemplate() {
        // Build component base path
        let basePath = SWAC.config.swac_root + 'components/' + this.name + "/";

        return new Promise((resolve, reject) => {
            // Set default template
            this.template = this.desc.templates[0];
            // Check if plugin has a template matching the name of the template used at parent component
            for (let curTemplate of this.desc.templates) {
                if (curTemplate.name === this.requestor.parent.templateName) {
                    this.template = curTemplate;
                }
            }

            // Load css
            if (this.template && this.template.style) {
                Msg.flow('view', 'Load CSS >' + this.template.style + '< for plugin >' + this.name + '<', this.requestor);
                let cssLinkElem = document.createElement("link");
                cssLinkElem.setAttribute("href", basePath + this.template.style + ".css");
                cssLinkElem.setAttribute("type", "text/css");
                cssLinkElem.setAttribute("rel", "stylesheet");
                document.head.appendChild(cssLinkElem);
            }

            let thisRef = this;
            if (!this.template) {
                resolve(false);
                return;
            }
            // Load html
            fetch(basePath + this.template.name + ".html")
                    .then(function (response) {
                        response.text().then(function (content) {
                            thisRef.content = content;
                            resolve(content);
                        });
                    }).catch(function (error) {
                let errMsg = 'Could not load html template for plugin >' + thisRef.name + '<: ' + error;
                Msg.error('Plugin', errMsg, thisRef.requestor);
                reject(errMsg);
            });
        });
    }

    /**
     * Adds a navigation entry to the plugin navigation
     * @param repeateds Array of repeated dom elements
     * @param setid Id of the set where to add the navigation entry
     */
    addNavigationEntry(repeateds, setid = 0) {
        for (let repeated of repeateds) {

            // Find area template where to store plugin navigation
            let plugNavTempls = repeated.querySelectorAll('.swac_repeatForPluginNav');
            if (plugNavTempls === null) {
                Msg.warn('Plugin', 'There was no navigation area '
                        + 'template found for plugin >' + this.name + '< Add an html element '
                        + 'with class="swac_repeatForPluginNav" to your template', this.requestor);
                this.navElement = null;
                return;
            }
            let i = 0;


            for (let plugNavTempl of plugNavTempls) {
                let pluginnavElem = plugNavTempl.cloneNode(true);
                pluginnavElem.classList.remove('swac_repeatForPluginNav');
                pluginnavElem.classList.add('swac_repeatedForPluginNav');
                pluginnavElem.id = this.requestor.parent.id + '_' + this.requestor.id + '_nav_' + i + '_' + setid;

                pluginnavElem.addEventListener('click', this.onNavigationEntryClick);
                // Workaround for dynamically adding tabs
                if (pluginnavElem.classList.contains('uk-active')) {
                    pluginnavElem.classList.remove('uk-active');
                    pluginnavElem.removeAttribute('aria-expanded');
                }
                let pluginnavAElem = pluginnavElem.querySelector('a');
                if (!pluginnavAElem) {
                    Msg.error('Plugin', 'The components template must contain an a-element within the swac_repeatedForPluginNav.', this.requestor);
                    return;
                }

                pluginnavAElem.setAttribute('swac_lang', this.requestor.pluginname);
                pluginnavAElem.innerHTML = this.requestor.pluginname;
                SWAC.lang.translateAll(pluginnavElem);
                plugNavTempl.parentNode.appendChild(pluginnavElem);
                this.navElements[setid] = pluginnavElem;
                // this.navElement = pluginnavElem;
                i++;
            }
    }
    }

    addContentEntry(repeateds, setid = 0) {
        for (let repeated of repeateds) {

            let pluginaratpls = repeated.querySelectorAll('.swac_repeatForPluginCont');
            if (pluginaratpls === null) {
                Msg.warn('Plugin', 'There was no area template '
                        + 'found for plugin >' + this.name + '<. Add an html element '
                        + 'with class="swac_repeatForPluginCont" to your template.', this.requestor);
                return;
            }

            let i = 0;
            for (let pluginareatpl of pluginaratpls) {
                // Clone contentarea for plugin
                let pluginarea = pluginareatpl.cloneNode(true);
                pluginarea.id = this.requestor.parent.id + '_' + this.requestor.id + '_cont_' + i + '_' + setid;
                pluginarea.classList.remove('swac_repeatForPluginCont');
                pluginarea.classList.add('swac_repeatedForPluginCont');
                // Workaround for dynamically adding tabs
                if (pluginarea.classList.contains('uk-active')) {
                    pluginarea.classList.remove('uk-active');
                }
                // Find insertion point for pluginname
                let pluginNameElem = pluginarea.querySelector('.swac_plugin_name');
                if (pluginNameElem)
                    pluginNameElem.innerHTML = this.requestor.pluginname;
                // Find point for insertion of plugincontent
                let pluginContElem = pluginarea.querySelector('.swac_plugin_content');
                if (pluginContElem === null) {
                    pluginContElem = pluginarea;
                }
                pluginContElem.innerHTML = this.content;

                pluginarea.swac_comp = this;
                pluginarea.templateName = this.template.name;
                SWAC.lang.translateAll(pluginarea);
                pluginareatpl.parentNode.appendChild(pluginarea);
                this.contElements[setid] = pluginarea;
                i++;
            }
    }
    }

    /**
     * Method to execute after a dataset was removed
     * 
     * @param {WatchableSet} set Set that was added
     */
    afterAddSet(set) {

    }

    /**
     * Method to execute after a dataset was removed
     * 
     * @param {WatchableSet} set Set that was removed
     */
    afterRemoveSet(set) {

    }

    onNavigationEntryClick(e) {
        let pluginNavElem = e.target;
        while (!pluginNavElem.classList.contains('swac_repeatedForPluginNav')) {
            pluginNavElem = pluginNavElem.parentNode;
        }
        let pluginContElem = document.getElementById(pluginNavElem.id.replace('_nav_', '_cont_'));

        if (pluginContElem) {
            for (let child of pluginContElem.parentElement.children) {
                child.classList.add('swac_dontdisplay');
            }
            pluginContElem.classList.remove('swac_dontdisplay');
        }

    }
}
