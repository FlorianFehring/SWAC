import SWAC from '../../swac.js';
import View from '../../View.js';
import Msg from '../../Msg.js';

export default class Present extends View {

    constructor(options = {}) {
        super(options);
        this.name = 'Present';
        this.desc.text = 'Presents two dimensional datasets no matter of the number or names of columns. There are different templates for default presentation.';
        this.desc.developers = 'Florian Fehring (FH Bielefeld)';
        this.desc.license = 'GNU Lesser General Public License';

        this.desc.templates[0] = {
            name: 'table_per_dataset',
            desc: 'Creates a table for each dataset.'
        };
        this.desc.templates[1] = {
            name: 'card_per_dataset',
            desc: 'Creates a card for each dataset.'
        };
        this.desc.templates[2] = {
            name: 'table_for_all_datasets',
            desc: 'Creates a table which displays all datasets.'
        };
        this.desc.templates[2] = {
            name: 'webPush',
            desc: 'Display for webPush application.'
        };

        this.desc.reqPerSet[0] = {
            name: '*',
            desc: 'at least one value as an attribute (named whatever you want)'
        };

        this.desc.optPerSet[0] = {
            name: 'id',
            desc: 'Datasets id. Required for ordering.'
        };

        this.desc.optPerSet[1] = {
            name: 'parent',
            desc: 'Parent set id. Required for ordering.'
        };

        this.desc.opts[0] = {
            name: 'arangeable',
            desc: 'If true makes the presented data arangeable'
        };
        if (typeof options.arangeable === 'undefined')
            this.options.arangeable = false;

        if (!options.plugins) {
            this.options.plugins = new Map();
            this.options.plugins.set('TableSort', {
                id: 'TableSort',
                active: false
            });
            this.options.plugins.set('TableFilter', {
                id: 'TableFilter',
                active: false
            });
            this.options.plugins.set('FilterSort', {
                id: 'FilterSort',
                active: false
            });
        }
    }

    init() {
        return new Promise((resolve, reject) => {
            // Add arangeable mechanism
            if (this.options.arangeable) {
                let gridelem = document.querySelector('#' + this.requestor.id + ' [uk-grid]');
                if (gridelem !== null) {
                    gridelem.setAttribute('uk-sortable', "handle: .uk-card");
                } else {
                    Msg.warn('present', 'Option >arangeable> for >'
                        + this.requestor.id + '< was set to true, but there is no '
                        + 'element in the template that is able to build '
                        + 'arangeable elements.', this.requestor);
                }
            }
            resolve();
        });
    }

    afterAddSet(set, repeateds) {
        // Get repeateds if they are unkown
        if (!repeateds) {
            repeateds = this.requestor.querySelectorAll('[swac_setid="' + set.id + '"][swac_fromName="' + set.swac_fromName + '"]');
        }

        super.afterAddSet(set, repeateds);
        // Check for missing table cells on table template
        if (this.requestor.templateName.includes('table') && repeateds) {
            for (let curRepeated of repeateds) {
                let repForVal = curRepeated.querySelector('.swac_repeatForValue');
                if (repForVal) {
                    for (let [curSource, attrs] of this.getAvailableAttributes()) {
                        let lastAttrElem = null;
                        for (let curAttr of attrs) {
                            let repAttrElem = curRepeated.querySelector('.swac_repeatedForValue[swac_attrname="' + curAttr + '"]');
                            if (!repAttrElem) {
                                // Create missing cell
                                repAttrElem = repForVal.cloneNode(true);
                                repAttrElem.classList.remove('swac_repeatForValue');
                                repAttrElem.classList.add('swac_repeatedForValue');
                                repAttrElem.innerHTML = '';
                                if (repAttrElem) {
                                    // Add cell behind last cell
                                    lastAttrElem.after(repAttrElem);
                                } else {
                                    // Add at the begining
                                    lastAttrElem.after(repForVal);
                                }
                            }
                            lastAttrElem = repAttrElem;
                        }
                    }
                }
            }
        }
    }
}