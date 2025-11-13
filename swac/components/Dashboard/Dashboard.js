import SWAC from '../../swac.js';
import View from '../../View.js';
import ViewHandler from '../../ViewHandler.js';
import Msg from '../../Msg.js';

export default class Dashboard extends View {

    constructor(options = {}) {
        super(options);

        this.name = 'Dashboard';
        this.desc.text = 'General dashboard node component';
        this.desc.developers = 'Florian Fehring (HSBI)';
        this.desc.license = 'GNU Lesser General Public License';

        this.desc.templates[0] = {
            name: 'default',
            desc: 'Default dashboard with mansory grid'
        };
        this.desc.reqPerTpl[0] = {
            selc: '.swac_dashboard_visibility',
            desc: 'Toggle menue entry for hiding cards.'
        };
        this.desc.reqPerTpl[1] = {
            selc: '.swac_dashboard_hiddencards',
            desc: 'Area where to place info about hidden cards.'
        };
        this.desc.reqPerTpl[2] = {
            selc: '.swac_dashboard_admopts',
            desc: 'Area containing the admin options.'
        };
        
        this.desc.optPerTpl[0] = {
            selc: '.swac_dashboard_data',
            desc: 'Elements that should only be displayed if the card is a data containing card.'
        };
        this.desc.optPerTpl[1] = {
            selc: '.swac_dashboard_datafrom',
            desc: 'Input element where user can select the date data is shown from.'
        };
        this.desc.optPerTpl[2] = {
            selc: '.swac_dashboard_datauntil',
            desc: 'Input element where user can select the date data is shown until.'
        };
        this.desc.optPerTpl[3] = {
            selc: '.swac_dashboard_advoptslink',
            desc: 'Link that shows the advanced options dialog for a card.'
        };
        this.desc.optPerTpl[4] = {
            selc: '.swac_dashbord_advopts',
            desc: 'Area where to show the advanced options.'
        };
        this.desc.optPerTpl[5] = {
            selc: '.swac_dashboard_cardcont',
            desc: 'Area where to show cards content.'
        };
        this.desc.optPerTpl[6] = {
            selc: '.swac_advopts_save',
            desc: 'Button to save advanced options'
        };
        
        this.desc.reqPerSet[0] = {
            name: 'id',
            desc: 'The attribute id is required for the component to work properly.',
            example: 1
        };
        this.desc.reqPerSet[1] = {
            name: 'title',
            desc: 'Dashboard cards title',
            example: 'Weather card'
        };
        this.desc.reqPerSet[2] = {
            name: 'desc',
            desc: 'Dashboard cards description',
            example: 'Displays the current weather.'
        };
        
        this.desc.optPerSet[0] = {
            name: 'parent',
            desc: 'Id of the parent dataset for ordering.',
            example: 1
        };

        this.desc.opts[0] = {
            name: "usersettingsRequestor",
            desc: "DataRequestor for getting the usersettings."
        };
        if (!options.usersettingsRequestor)
            this.options.usersettingsRequestor = {
                fromName: 'dashboard_cards_usersettings',
                fromWheres: {
                    filter: 'user_id,eq,{user_id}'
                }
            };

        if (!options.showWhenNoData)
            this.options.showWhenNoData = true;
        
        if (!options.ecoMode)
            this.options.ecoMode = {ecoColumn: 'ecomode'};

        // internal attributes
        this.usersettings = [];
    }

    /*
     * This method will be called when the component is complete loaded
     * At this thime the template code is loaded, the data inserted into the 
     * template and even plugins are ready to use.
     */
    init() {
        return new Promise((resolve, reject) => {
            // Check if user is logged in
            let userElem = document.querySelector('[swa^="User"]');
            let thisRef = this;
            if (userElem) {
                window.swac.reactions.addReaction(function () {
                    if (userElem.swac_comp.userData?.id) {
                        let userid = userElem.swac_comp.userData.id;
                        // Modify requestor
                        thisRef.options.usersettingsRequestor.fromWheres.filter = thisRef.options.usersettingsRequestor.fromWheres.filter.replace('{user_id}', userid);
                        // Load usersettings
                        let Model = window.swac.Model;
                        Model.load(thisRef.options.usersettingsRequestor).then(function (data) {
                            // Sort user settings after card id
                            for (let curSetting of data) {
                                if (!curSetting)
                                    continue;
                                thisRef.usersettings[curSetting.card_id] = curSetting;
                            }
                        }).catch(function (e) {
                            Msg.error('Dashbard', 'Could not load userdata: ' + e, thisRef.requestor);
                        });

                        // Check if user is admin
                        if (userElem.swac_comp.userData.isadmin) {
                            let admFieldset = document.querySelector('.swac_dashboard_admopts');
                            admFieldset.classList.remove('swac_dontdisplay');
                        }
                    }
                }, userElem.id);
            }
            // Register click for advOptsSave Button
            let advOptsSaveBtn = this.requestor.querySelector('.swac_advopts_save');
            advOptsSaveBtn.addEventListener('click', this.onClickAdvOptsSaveBtn.bind(this));
            // Register date change events for advOpts
            let advOptsElem = document.querySelector('.swac_dashbord_advopts');
            let datafromElem = advOptsElem.querySelector('[name="data_from"');
            datafromElem.addEventListener('blur', this.onChgDate.bind(this));
            let datauntilElem = advOptsElem.querySelector('[name="data_until"');
            datauntilElem.addEventListener('blur', this.onChgDate.bind(this));

            resolve();
        });
    }

    /**
     * Method thats called before adding a dataset
     * This overrides the method from View.js
     * 
     * @param {String} fromName Name of the resource, where the set comes from
     * @param {Object} set Object with attributes to add
     * @returns {Object} (modified) set
     */
    beforeAddSet(set) {
        if (!set.avail)
            return null;
        return set;
    }

    /**
     * Method thats called after a dataset was added.
     * This overrides the method from View.js
     * 
     * @param {Object} set Object with attributes to add
     * @param {DOMElement[]} repeateds Elements that where created as representation for the set
     * @returns {undefined}
     */
    afterAddSet(set, repeateds) {
        // Get ts column
        let tscol = 'ts';
        if (set.data_ts_col)
            tscol = set.data_ts_col;

        // Register functions
        for (let curRep of repeateds) {
            let visElem = curRep.querySelector('.swac_dashboard_visibility');
            visElem.addEventListener('click', this.onClickVisibility.bind(this));

            // Register event handler for advanced options
            let advOptsLink = curRep.querySelector('.swac_dashboard_advoptslink');
            if (advOptsLink) {
                advOptsLink.addEventListener('click', this.onClickAdvOptsLink.bind(this));
            }

            // Create content
            let contElem = curRep.querySelector('.swac_dashboard_cardcont');
            if (contElem) {
                // Create options script
                let optsName;
                if (set.data_comp_opts) {
                    optsName = 'set' + set.id + 'dash_options';
                    let scrElem = document.createElement('script');
                    scrElem.innerHTML = 'var ' + optsName + ' = ' + set.data_comp_opts;
                    contElem.appendChild(scrElem);
                }

                if (set.type && set.type === 'HTML') {
                    let htmlElem = document.createElement('div');
                    htmlElem.innerHTML = set.content;
                    contElem.appendChild(htmlElem);
                    // Hide elements for data cards
                    let dataElems = curRep.querySelectorAll('.swac_dashboard_data');
                    for (let curDataElem of dataElems) {
                        curDataElem.classList.add('swac_dontdisplay');
                    }
                } else {
                    // Create requestor statement
                    let reqState = set.data_comp;
                    // Load date if a source is given
                    if (set.data_source) {
                        reqState += ' FROM ' + set.data_source;
                        if (set.data_from_selectable || set.data_until_selectable) {
                            reqState += ' WHERE ';
                        }
                        if (set.data_from_selectable) {
                            reqState += 'filter=' + tscol + ',gt,';
                            if (this.usersettings[set.id]?.data_from)
                                reqState += this.usersettings[set.id].data_from;
                            else
                                reqState += set.data_from_default;
                        }
                        if (set.data_until_selectable) {
                            if (set.data_from_selectable)
                                reqState += 'AND';
                            reqState += ' filter=' + tscol + ',lt,';
                            if (this.usersettings[set.id]?.data_until)
                                reqState += this.usersettings[set.id].data_until;
                            else
                                reqState += set.data_until_default;
                        }
                    }
                    // Set options
                    if (optsName)
                        reqState += ' OPTIONS ' + optsName;

                    // Set template
                    if (set.data_comp_tpl)
                        reqState += ' TEMPLATE ' + set.data_comp_tpl;

                    // Create requestor element
                    let reqElem = document.createElement('div');
                    reqElem.setAttribute('id', 'set' + set.id + 'dash');
                    reqElem.setAttribute('swa', reqState);
                    contElem.appendChild(reqElem);

                    // Build component
                    let viewHandler = new ViewHandler();
                    viewHandler.load(reqElem);
                }
            }

            // Set data from and until
            let datafromElem = curRep.querySelector('.swac_dashboard_datafrom');
            let datauntilElem = curRep.querySelector('.swac_dashboard_datauntil');
            if (datafromElem && datauntilElem) {
                datafromElem.addEventListener('blur', this.onChgDate.bind(this));
                datauntilElem.addEventListener('blur', this.onChgDate.bind(this));
                if (this.usersettings[set.id]) {
                    datafromElem.value = this.usersettings[set.id].data_from;
                    datauntilElem.value = this.usersettings[set.id].data_until;
                } else {
                    datafromElem.value = set.data_from_default;
                    datauntilElem.value = set.data_until_default;
                }
            }
        }
        return;
    }

    /**
     * When user clicks on visibility menue entry or button
     * 
     * @param {DOMEvent} evt Event of click
     */
    onClickVisibility(evt) {
        evt.preventDefault();
        let repForSet = this.findRepeatedForSet(evt.target);
        let set = repForSet.swac_dataset;
        this.toggleVisibility(set);
    }

    /**
     * Toggles the visibility of the given set
     * 
     * @param {type} set Dataset
     */
    toggleVisibility(set) {
        let cardElem = this.requestor.querySelector('[swac_fromname="' + set.swac_fromName + '"][swac_setid="' + set.id + '"]');
        let hideElem = this.requestor.querySelector('.swac_dashboard_hiddencards [swac_fromname="' + set.swac_fromName + '"][swac_setid="' + set.id + '"]');
        if (cardElem.classList.contains('swac_dontdisplay')) {
            cardElem.classList.remove('swac_dontdisplay');
            hideElem.classList.add('swac_dontdisplay');
        } else {
            cardElem.classList.add('swac_dontdisplay');
            hideElem.classList.remove('swac_dontdisplay');
        }
    }

    /**
     * Executed on click of the advance options link
     * 
     * @param {DOMEvent} evt Event when clicking
     */
    onClickAdvOptsLink(evt) {
        evt.preventDefault();

        let repForSet = this.findRepeatedForSet(evt.target);
        let set = repForSet.swac_dataset;

        let advOptsElem = document.querySelector('.swac_dashbord_advopts');
        advOptsElem.setAttribute('swac_setid', set.id);
        advOptsElem.setAttribute('swac_fromName', set.swac_fromName);

        // Hide data options if type is non data
        if (set.type === 'HTML') {
            // Hide elements for data cards
            let dataElems = advOptsElem.querySelectorAll('.swac_dashboard_data');
            for (let curDataElem of dataElems) {
                curDataElem.classList.add('swac_dontdisplay');
            }
        } else {
            let dataElems = advOptsElem.querySelectorAll('.swac_dashboard_data');
            for (let curDataElem of dataElems) {
                curDataElem.classList.remove('swac_dontdisplay');
            }
        }

        // User options
        let datafromElem = advOptsElem.querySelector('[name="data_from"');
        if (this.usersettings[set.id]?.data_from) {
            datafromElem.value = this.usersettings[set.id].data_from;
        } else {
            datafromElem.value = set.data_from_default;
        }
        let datauntilElem = advOptsElem.querySelector('[name="data_until"');
        if (this.usersettings[set.id]?.data_until) {
            datauntilElem.value = this.usersettings[set.id].data_until;
        } else {
            datauntilElem.value = set.data_until_default;
        }

        // Admin options
        let titleElem = advOptsElem.querySelector('[name="card_title"');
        titleElem.value = set.title;
        let descElem = advOptsElem.querySelector('[name="card_desc"');
        descElem.value = set.desc;
        let cardAvailElem = advOptsElem.querySelector('[name="card_avail"]');
        cardAvailElem.checked = set.avail;
        let cardVisElem = advOptsElem.querySelector('[name="card_visible_default"]');
        cardVisElem.checked = set.card_visible_default;
        let datasourceElem = advOptsElem.querySelector('[name="card_datasource"');
        datasourceElem.value = set.data_source;
        let datafromdefElem = advOptsElem.querySelector('[name="data_from_default"');
        datafromdefElem.value = set.data_from_default;
        let datauntildefElem = advOptsElem.querySelector('[name="data_until_default"');
        datauntildefElem.value = set.data_until_default;
        let datafromminElem = advOptsElem.querySelector('[name="data_from_min"');
        datafromminElem.value = set.data_from_min;
        let datauntilmaxElem = advOptsElem.querySelector('[name="data_until_max"');
        datauntilmaxElem.value = set.data_until_max;

        let datacompElem = advOptsElem.querySelector('[name="data_comp"');
        // Add available options for comp
        let presentOpt = document.createElement('option');
        presentOpt.value = 'Present';
        presentOpt.innerHTML = 'Present';
        datacompElem.appendChild(presentOpt);
        let chartsOpt = document.createElement('option');
        chartsOpt.value = 'Charts';
        chartsOpt.innerHTML = 'Charts';
        datacompElem.appendChild(chartsOpt);
        datacompElem.value = set.data_comp;
        let visuOpt = document.createElement('option');
        visuOpt.value = 'Visualise';
        visuOpt.innerHTML = 'Visualise';
        datacompElem.appendChild(visuOpt);
        datacompElem.value = set.data_comp;

        UIkit.modal(advOptsElem).show();
    }

    /**
     * Proceed when user clicks on the save button in the advanced options dialog
     * 
     * @param {DOMEvent} evt Click event
     */
    onClickAdvOptsSaveBtn(evt) {
        evt.preventDefault();
        let advOptsElem = document.querySelector('.swac_dashbord_advopts');
        let fromname = advOptsElem.getAttribute('swac_fromName');
        let setid = advOptsElem.getAttribute('swac_setid');
        let set = this.data[fromname].sets[setid];

        // user options
        let datafromElem = advOptsElem.querySelector('[name="data_from"');
        this.usersettings[set.id].data_from = datafromElem.value;
        let datauntilElem = advOptsElem.querySelector('[name="data_until"');
        this.usersettings[set.id].data_until = datauntilElem.value;

        // Admin options        
        let titleElem = advOptsElem.querySelector('[name="card_title"');
        set.title = titleElem.value;
        let descElem = advOptsElem.querySelector('[name="card_desc"');
        set.desc = descElem.value;
        let cardAvailElem = advOptsElem.querySelector('[name="card_avail"]');
        set.avail = cardAvailElem.checked;
        let cardVisElem = advOptsElem.querySelector('[name="card_visible_default"]');
        set.card_visible_default = cardVisElem.checked;
        let datasourceElem = advOptsElem.querySelector('[name="card_datasource"');
        set.data_source = datasourceElem.value;
        let datafromdefElem = advOptsElem.querySelector('[name="data_from_default"');
        set.data_from_default = datafromdefElem.value;
        let datauntildefElem = advOptsElem.querySelector('[name="data_until_default"');
        set.data_until_default = datauntildefElem.value;
        let datafromminElem = advOptsElem.querySelector('[name="data_from_min"');
        set.data_from_min = datafromminElem.value;
        let datauntilmaxElem = advOptsElem.querySelector('[name="data_until_max"');
        set.data_until_max = datauntilmaxElem.value;

        let datacompElem = advOptsElem.querySelector('[name="data_comp"');
        set.data_comp = datacompElem.value;
        let datacompoptsElem = advOptsElem.querySelector('[name="data_comp_opts"');
        set.data_comp = datacompoptsElem.value;
        UIkit.modal(advOptsElem).hide();

        // Save set to source
        let dataCapsule = {
            fromName: set.swac_fromName,
            data: [set]
        };
        let Model = window.swac.Model;
        Model.save(dataCapsule).then(function (dataCaps) {}).catch(function (err) {
            UIkit.modal.alert(SWAC.lang.dict.Dashboard.advoptssaveerr);
        });
        // Save user options
        if (this.options.usersettingsRequestor) {
            let dataCapsuleUser = {
                fromName: this.options.usersettingsRequestor.fromName,
                data: [this.usersettings[set.id]]
            };
            Model.save(dataCapsuleUser).then(function (dataCaps) {}).catch(function (err) {
                UIkit.modal.alert(SWAC.lang.dict.Dashboard.advoptssaveerr);
            });
        }
    }

    /**
     * Performed when a date has changed.
     * 
     * @param {DOMEvent} evt Event indicateing the date change
     */
    onChgDate(evt) {
        evt.preventDefault();
        // Search set information
        let setidElem = evt.target;
        while (!setidElem.hasAttribute('swac_setid') && setidElem.parentElement) {
            setidElem = setidElem.parentElement;
        }
        let setid = setidElem.getAttribute('swac_setid');
        let setElem = this.requestor.querySelector('[swac_setid="' + setid + '"]');
        let swaElem = this.requestor.querySelector('[swac_setid="' + setid + '"] [swa]');

        let reference = 'ref://' + swaElem.fromName + '?filter=' + swaElem.fromWheres.filter;

        if (!this.usersettings[setid])
            this.usersettings[setid] = {};

        if (evt.target.classList.contains('swac_dashboard_datafrom')) {
            let gtStartPos = reference.indexOf(',gt,');
            let gtEndPos = reference.indexOf('&filter=');
            let gtDate = reference.substring(gtStartPos + 4, gtEndPos);
            reference = reference.replace(gtDate, evt.target.value);
            this.usersettings[setid].data_from = evt.target.value;
            let datafromElem = setElem.querySelector('.swac_repeatedForSet[swac_setid="' + setid + '"] .swac_dashboard_datafrom');
            datafromElem.value = evt.target.value;
        }

        if (evt.target.classList.contains('swac_dashboard_datauntil')) {
            let ltStartPos = reference.indexOf(',lt,');
            let ltDate = reference.substring(ltStartPos + 4);
            reference = reference.replace(ltDate, evt.target.value);
            this.usersettings[setid].data_until = evt.target.value;
            let datauntilElem = setElem.querySelector('.swac_repeatedForSet[swac_setid="' + setid + '"] .swac_dashboard_datauntil');
            datauntilElem.value = evt.target.value;
        }

        // update component filter info
        let filterStartPos = reference.indexOf('?filter=');
        swaElem.fromWheres.filter = reference.substring(filterStartPos + 8);

        // Remove components data
        swaElem.swac_comp.removeAllData();

        // Add data of new timespan
        swaElem.swac_comp.addDataFromReference(reference);
    }
}