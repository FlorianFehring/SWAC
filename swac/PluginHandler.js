import SWAC from './swac.js';
import Msg from './Msg.js';
import ComponentHandler from './ComponentHandler.js';

/**
 * Handler for component plugins. This is automatically instantiated and added
 * to requestors, where the attribute "plugins" is available.
 * 
 * The plugins attribut should have the following form:
 * 
 * plugins = new Map();
 * plugins.set('pluginname', {
 *      active: true,
 *      template: 'Name of the template file. Defaults to the plugins name'
 * });
 * 
 * @type type
 */
export default class PluginHandler extends ComponentHandler {

    constructor() {
        super();
    }

    /**
     * Loads a plugin
     * 
     * @param {Object} options defining the Plugin to load
     * @param {SWACRequestor} HTML element requestion the plugin 
     * Needs: requestor.id, requestor.parent, requestor.pluginname
     * @returns {Promise} Resolvse to an algorithm object with at least init(data)-function
     */
    load(options, requestor) {
        return new Promise((resolve, reject) => {
            Msg.createStore(requestor);
            Msg.flow('PluginHandler', 'Loading plugin >' + options.pluginname + '< for >' + requestor.id + '<', requestor);
            let thisRef = this;
            let req = {
                id: options.id + '_' + requestor.id,
                title: options.title,
                active: options.active,
                pluginname: options.pluginname,
                componentPath: './components/' + requestor.swac_comp.name + '/plugins/' + options.pluginname + '/' + options.pluginname + 'SPL.js'
            };
            
            super.load(req).then(function (plugin) {
                if (!plugin) {
                    resolve();
                    return;
                }
                plugin.parent = requestor;
                plugin.swac_comp.data = requestor.swac_comp.data;
                plugin.swac_comp.loadTemplate().then(function (state) {
                    if (state) {
                        // Check if repeatForPluginNav is nested in repeatForSet
                        const nested = requestor.querySelector('.swac_repeatForSet .swac_repeatForPluginNav')
                        if (nested) {
                            // Handled in Plugin.js afterAddSet
                            document.addEventListener('swac_' + requestor.id + '_repeatedForSet', (e) => {
                                plugin.swac_comp.addNavigationEntry(e.detail.repeateds, e.detail.set.id);
                                plugin.swac_comp.addContentEntry(e.detail.repeateds, e.detail.set.id);
                            })
                        } else {
                            plugin.swac_comp.addNavigationEntry([requestor]);
                            plugin.swac_comp.addContentEntry([requestor]);
                        }
                        // Load subrequestors in plugins
                        plugin.parent.swac_comp.findSubRequestors(plugin.parent);
                    }
                    thisRef.init(plugin).then(function () {
                        resolve(plugin);
                    }).catch(function (err) {
                        reject(err);
                    });
                });
            });
        });
    }
}