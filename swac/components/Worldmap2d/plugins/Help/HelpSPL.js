import Plugin from '../../../../Plugin.js';

/* 
 * This plugin enables a button which opens a guide to the application. Uses UI-kit in html to open and close the menu. 
 */
export default class HelpSPL extends Plugin {
    constructor(options = {}) {
        super(options);
        this.name = 'Worldmap2d/plugins/Help';
        this.desc.text = 'When the icon is clicked, a guide for the application is shown';
        
        this.desc.templates[0] = {
            name: 'help',
            style: 'help',
            desc: 'Default template for the Help plugin',
        };
        
        this.desc.opts[0] = {
            name: "onlyShowActivePlugins",
            example: true,
            desc: "If set to false Help will display exaplanations for all existing Worldmap2d plugins, including ones not active on the current site."
        };
        if (typeof this.options.onlyShowActivePlugins === 'undefined') {
            this.options.onlyShowActivePlugins = true; }
        
        // Attributes for internal usage
        this.worldmap2d = null;
        this.help = null;
        this.help_menu = null;
        this.button = null;
        this.helpOn = null;
        this.isHelpOpened = false;
    }

    init() {
        return new Promise((resolve, reject) => {
            this.worldmap2d = this.requestor.parent.swac_comp;
            //get the needed html-elements
            this.help = this.requestor.parent.querySelector(".help");
            this.helpOn = this.help.querySelector(".help-on");
            this.button = this.help.querySelector(".help-button");
            this.helpMenu = this.help.querySelector(".help-menu");
            
            //disable map interactions when help is opened
            this.helpMenu.addEventListener("beforeshow", (e) => {
                // only disable interactions when the help menu is opened, not the accordion inside the menu
                if (e.target === this.helpMenu) {
                    this.worldmap2d.disableMapInteractions();
                }                    
            });

            //enable map interactions when help is closed
            this.helpMenu.addEventListener("beforehide", (e) => {
                // only enable interactions when the help menu is closed, not the accordion inside the menu
                if (e.target === this.helpMenu) {
                    this.worldmap2d.enableMapInteractions();
                }                    
            });

            //prevent bubbling
            L.DomEvent.on(this.help, 'click', L.DomEvent.stopPropagation);
            L.DomEvent.on(this.help, 'dblclick', L.DomEvent.stopPropagation);
            
            if(this.options.onlyShowActivePlugins === true) {
                this.showActivePluginDescriptions();
            }
            resolve();
        });
    }
    
     /**
     * Unhides the help texts of all plugins that are currently active.
     * 
     * NOTE: Every <li> element corresponding to a Worldmap2d Plugin must have class = "help-entry-[id of plugin]" 
     * and style="display: none" so that it is only shown when the plugin is active on the site.
     * 
     * Possible improvement: Every Plugin carries its own multi-language help text for Help plugin to load dynamically;
     * should probably be implemented at a higher level of SWAC (not Worldmap2d only).
     * 
     * @returns {undefined}
     */
    showActivePluginDescriptions() {
        const worldmapPlugins = this.worldmap2d.options.plugins;
        for (let [key, value] of worldmapPlugins) {
            if (value.active === true) {              
                let activePlugins = this.help.getElementsByClassName("help-entry-" + value.id)
                if (activePlugins) {
                    for (let i = 0; i < activePlugins.length; i++) {
                        activePlugins[i].style.display = "";
                    }
                }
            }
        }
    }

}
