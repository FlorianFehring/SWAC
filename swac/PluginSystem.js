import PluginHandler from './PluginHandler.js';
export default class PluginSystem {

    constructor() {}

    init(comp) {
        let thisRef = this;
        return new Promise((resolve, reject) => {
            comp.plugins = new Map();
            // Add plugin methods to component
            comp.getAvailablePlugins = thisRef.getAvailablePlugins;
            comp.getPlugin = thisRef.getPlugin;
            comp.loadPlugins = thisRef.loadPlugins;
            comp.loadPlugin = thisRef.loadPlugin;
            //comp.afterPluginsLoaded = this.afterPluginsLoaded;
            comp.getLoadedPlugins = thisRef.getLoadedPlugins;
            comp.unloadPlugins = thisRef.unloadPlugins;
            comp.unloadPlugin = thisRef.unloadPlugin;
            resolve();
        });
    }

    /**
     * Gets a map of all available plugins. With their name as key and their definition as value.
     * 
     * @returns {Map[String,Object{}]}
     */
    getAvailablePlugins() {
        return this.options.plugins;
    }

    /**
     * Get a plugin by name
     * 
     * @param {String} name Plugins name
     * @returns {unresolved}
     */
    getPlugin(name) {
        let plugin = this.plugins.get(name);
        if (!plugin) {
            let errMsg = 'Plugin >' + name
                    + '< cannot be loaded because there is no plugin with that name'
            Msg.error('PluginSystem', errMsg, this.requestor);
            throw(errMsg);
        }
        return plugin;
    }

    /**
     * Loads all activated plugins
     */
    loadPlugins() {
        let thisRef = this;
        return new Promise((resolve, reject) => {
            if (!thisRef.options.plugins) {
                resolve();
                return;
            }
            let pluginProms = [];
            let loadedPlugins = [];
            for (let [curPluginName, curPluginRequestor] of thisRef.options.plugins) {
                if (curPluginRequestor.active) {
                    curPluginRequestor.pluginname = curPluginName;
                    pluginProms.push(thisRef.loadPlugin(curPluginName));
                    loadedPlugins.push(curPluginName);
                }
            }
            // Wait for all plugins
            Promise.allSettled(pluginProms).then(function () {
                if (thisRef.afterPluginsLoaded) {
                    thisRef.afterPluginsLoaded(loadedPlugins);
                }
                resolve();
            })
        });
    }

    /**
     * Loads a plugin to the component.
     * 
     * @param {String} name Name of the plugin to load
     */
    loadPlugin(name) {
        return new Promise((resolve, reject) => {
            let thisRef = this;
            let pluginOpts = this.options.plugins.get(name);            
            let curHandler = new PluginHandler();
            curHandler.load(pluginOpts, this.requestor).then(function (plugin) {
                thisRef.plugins.set(name,plugin);
                resolve(plugin);
            }).catch(function (err) {
                reject(err);
            });
        });
    }

    /**
     * Method to be executed after plugins where be loaded.
     * Default implementation does nothing.
     * 
     * @returns {undefined}
     */
    afterPluginsLoaded() {
        //This method has to be implemented by the component
    }

    /**
     * Gets a map of all loaded plugins with pluginname as key and plugindefinition as value.
     * 
     * @returns {Map<String,PluginRequestor>}
     */
    getLoadedPlugins() {
        let loadedPlugins = new Map();
        for (let [curPluginName, curPluginRequestor] of this.plugins.entries()) {
            if (!curPluginRequestor) continue;
            if (curPluginRequestor.swac_comp)
                loadedPlugins.set(curPluginName, curPluginRequestor);
        }
        return loadedPlugins;
    }

    /**
     * Unloads all plugins and removes their contents from the requestor
     * NOTE: This will not unload the loaded script files
     * 
     * @returns {undefined}
     */
    unloadPlugins() {
        for (let curName of this.getLoadedPlugins().keys()) {
            this.unloadPlugin(curName);
        }
    }

    /**
     * Unloads a single plugin.
     * 
     * @param {String} name name of the plugin to unload
     * @returns {undefined}
     */
    unloadPlugin(name) {
        let pluginElemIdPrefix = this.requestor.id + '_' + name;
        // Remove page contents
        let navareas = this.requestor.querySelectorAll('[id^="' + pluginElemIdPrefix + '_nav"]');
        for (let navarea of navareas) {
            navarea.parentNode.removeChild(navarea);
        }
        let contareas = this.requestor.querySelectorAll('[id^="' + pluginElemIdPrefix + '_cont"]');
        for (let contarea of contareas) {
            contarea.parentNode.removeChild(contarea);
        }
        // Get plugin object
        let plugin = this.plugins.get(name);
        // Set plugin to not loaded
        delete plugin.swac_comp;
    }
}