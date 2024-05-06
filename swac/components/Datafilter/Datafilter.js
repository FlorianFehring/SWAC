import SWAC from '../../swac.js';
import View from '../../View.js';
import Msg from '../../Msg.js';

export default class Datafilter extends View {

    constructor(options = {}) {
        super(options);
        this.name = 'Datafilter';
        this.desc.text = 'Datafilter component allows definition of a datasource thats sets can be filtered with the GUI. The filtered sets are reflected to another datasources that can be used as input on any other component.';
        this.desc.developers = 'Florian Fehring (FH Bielefeld)';
        this.desc.license = 'GNU Lesser General Public License';

        this.desc.templates[0] = {
            name: 'default',
            style: false,
            desc: 'Default template.'
        };

        this.desc.optPerTpl[0] = {
            selc: '.swac_datafilter_addfilter',
            desc: 'Button to add a new filter.'
        };

        this.desc.reqPerSet[0] = {
            name: 'name',
            desc: 'Filter name'
        };
        this.desc.reqPerSet[1] = {
            name: 'desc',
            desc: 'Filter description'
        };
        this.desc.reqPerSet[2] = {
            name: 'attr',
            desc: 'Filter attributes name'
        };
        this.desc.reqPerSet[3] = {
            name: 'type',
            desc: 'Filter type (eq,lt,gt)'
        };
        this.desc.reqPerSet[4] = {
            name: 'values',
            desc: 'Filter compare value'
        };

        this.desc.opts[0] = {
            name: "originalDataRequestor",
            desc: "A data requestor that access the original data.",
            example: {
                fromName: 'mytablename', // Name of the datatable
                fromWheres: {
                    filter: 'id,lt,10', // Filter datasets (when use TreeQL / SmartData)
                    // Note: When you need to use two or more filters, add them in the filter attribute: id,gt,5&filter=id,lt,10
                    other: 'This is another attribute to send with request'
                },
                idAttr: 'id', // Name of sets attribute that contains the id
                attributeDefaults: new Map(), // Map of attributname / value for default values when the attribute is missing
                attributeRenames: new Map(), // Map of set attributename / wished attributename for renameing attributes
                reloadInterval: 10000, // Time in milliseconds after that the data should be refetched from source
            }
        };
        if (!options.originalDataRequestor)
            this.options.originalDataRequestor;

        this.desc.opts[1] = {
            name: "filteredDataSource",
            desc: "Name of the datasource created for the filtered data. Use the same name at the FROM clause of requestors that will work with the data. Initilise the source as empty array if needed.",
            example: 'my_filtered_data'
        };
        if (!options.filteredDataSource)
            this.options.filteredDataSource = 'filtered_data';

        this.desc.events[0] = {
            name: 'swac_REQUESTOR_ID_datafilter_originalloaded',
            desc: 'Event fired when the data from the original datasource is loaded.',
            data: 'Delivers the loaded datasets in the details attribute.'
        }

        // internal attributes
        this.fSource;       // Source for filtered datastes
        this.posAttrs = []; // List of possible attributes
    }

    init() {
        return new Promise((resolve, reject) => {
            if (!this.options.originalDataRequestor) {
                Msg.error('Datafilter', 'The option originalDataRequestor is not specified.', this.requestor);
                reject();
                return;
            }

            // Wait until all components that want to use the filtered data are build up
            let reqs = document.querySelectorAll('[swa*="FROM ' + this.options.filteredDataSource + '"]');
            if (reqs.length > 0) {
                let reqids = [];
                for (let curReq of reqs) {
                    reqids.push(curReq.id);
                }
                let thisRef = this;
                window.swac.reactions.addReaction(function (requestors) {
                    thisRef.fSource = SWAC.Model.store[thisRef.options.filteredDataSource];
                    thisRef.loadOriginalData();
                    resolve();
                }, reqids);
            } else {
                // Create target datasource
                this.fSource = SWAC.Model.createWatchableSource(this.options.filteredDataSource, SWAC.Model);
                this.loadOriginalData();
                resolve();
            }

            // Add filter button
            let addBtn = this.requestor.querySelector('.swac_datafilter_addfilter');
            if (addBtn)
                addBtn.addEventListener('click', this.onClickAddFilter.bind(this));
        });
    }

    loadOriginalData() {
        // Get data from originalDataRequestor
        let thisRef = this;
        SWAC.Model.load(this.options.originalDataRequestor).then(function (data) {
            // Get list of possible attributes
            for (let curSet of data) {
                if (curSet) {
                    for (let curAttr in curSet) {
                        if (!curAttr.startsWith('swac_') && !thisRef.posAttrs.includes(curAttr)) {
                            thisRef.posAttrs.push(curAttr);
                        }
                    }
                }
            }

            // Register this component as listener (also causes that every pre existing set is once sent to notifyAddSet())
            SWAC.Model.store[thisRef.options.originalDataRequestor.fromName].addObserver(thisRef);
            // Inform about loaded original data
            document.dispatchEvent(new CustomEvent('swac_' + thisRef.requestor.id + '_datafilter_originalloaded', {detail: {data: data}}))
        }).catch(function (e) {
            Msg.error('Datafilter', 'Error while loading original data: ' + e, thisRef.requestor);
        });
    }

    afterAddSet(set, repeateds) {
        for (let curRep of repeateds) {
            // Create options at attribute selection field
            let attrSelcElem = curRep.querySelector('[name="attr"]');
            if (attrSelcElem) {
                for (let curAttr of this.posAttrs) {
                    let optElem = document.createElement('option');
                    optElem.value = curAttr;
                    optElem.innerHTML = curAttr;
                    if (set.attr == curAttr)
                        optElem.selected = 'selected';
                    attrSelcElem.appendChild(optElem);
                }
                attrSelcElem.addEventListener('change', this.onChangeFilter.bind(this));
            }
            // Set selected type
            let typeSelcElem = curRep.querySelector('[name="type"]');
            if (typeSelcElem) {
                let optElem = typeSelcElem.querySelector('[value="' + set.type + '"]');
                if (optElem) {
                    optElem.selected = 'selected';
                } else {
                    Msg.error('Datafilter', 'Could not find option to select for >' + set.type + '< in template.', this.requestor);
                }
                typeSelcElem.addEventListener('change', this.onChangeFilter.bind(this));
            }
            // Register value change
            let valuesElem = curRep.querySelector('[name="values"]');
            valuesElem.addEventListener('change', this.onChangeFilter.bind(this));
        }
        // Call Components afterAddSet and plugins afterAddSet
        super.afterAddSet(set, repeateds);

        // Redo filtering
        this.refilterSets();
        return;
    }

    /**
     * Called when user changes a filter option
     */
    onChangeFilter(evt) {
        Msg.flow('Datafilter', 'onChangeFilter()', this.requestor);
        
        // Find set
        let setElem = evt.target;
        while(!setElem.classList.contains('swac_repeatedForSet') && setElem.parentElement) {
            setElem = setElem.parentElement;
        }
        let set = setElem.swac_dataset;
        // Get value from input element
        set[evt.target.name] = evt.target.value;
        
        this.refilterSets();
    }

    checkFilter(set) {
        Msg.flow('Datafilter', 'checkFilter(' + set.swac_fromName + '[' + set.id + '])', this.requestor);
        // Check if set passes filter
        for (let curSource in this.data) {
            for (let curFilter of this.data[curSource].sets) {
                if (!curFilter)
                    continue;
                switch (curFilter.type) {
                    case "eq":
                        if (set[curFilter.attr] !== curFilter.values)
                            return false;
                        break;
                    case "gt":
                        if (set[curFilter.attr] <= curFilter.values)
                            return false;
                        break;
                    case "lt":
                        if (set[curFilter.attr] >= curFilter.values)
                            return false;
                        break;
                }
            }
        }
        return true;
    }

    refilterSets() {
        Msg.flow('Datafilter', 'refilterSets()', this.requestor);
        // Look at each existing set if it should be removed
        let checkedSets = [];
        for (let curSet of this.fSource.getSets()) {
            if (!curSet)
                continue;
            if (!this.checkFilter(curSet)) {
                this.fSource.delSet(curSet);
            }
            checkedSets.push(curSet.id);
        }

        // Look at sets on original source if it should be added
        for (let curSet of SWAC.Model.store[this.options.originalDataRequestor.fromName].getSets()) {
            if (curSet && !checkedSets.includes(curSet.id) && this.checkFilter(curSet)) {
                this.addFilteredSet(curSet);
            }
        }
    }

    /**
     * Checks the given set if it passes the filter and adds it to the source
     * 
     * @param {WatchableSet} set Set to add
     */
    addFilteredSet(set) {
        Msg.flow('Datafilter', 'addFilteredSet(' + set.swac_fromName + '[' + set.id + '])', this.requestor);
        // Check set
        if (!this.checkFilter(set)) {
            Msg.info('Datafilter', 'Set >' + set.swac_fromName + '[' + set.id + ']< was outsorted by filter.', this.requestor);
            return;
        }

        // Create set copy
        let newset = {};
        newset.swac_fromName = this.options.filteredDataSource;
        for (var attr in set) {
            if (set.hasOwnProperty(attr) && !attr.startsWith('swac_'))
                newset[attr] = set[attr];
        }
        newset = SWAC.Model.createWatchableSet(newset);

        // Add set to managed source
        this.fSource.addSet(newset);
    }

    notifyAddSet(source, set) {
        Msg.flow('Datafilter', 'NOTIFY about added set >' + set.swac_fromName + '[' + set.id + ']< recived', this.requestor);
        // If added set is from the managed source
        if (set.swac_fromName === this.options.originalDataRequestor.fromName) {
            this.addFilteredSet(set);
        } else {
            super.notifyAddSet(source, set);
        }
    }

    onClickAddFilter(evt) {
        evt.preventDefault();
        let sourcename;
        for (let curSource in this.data) {
            sourcename = curSource;
        }
        this.addSet(sourcename, {});
    }
}


