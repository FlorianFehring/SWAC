import SWAC from '../../../../swac.js';
import Msg from '../../../../Msg.js';
import Plugin from '../../../../Plugin.js'
import Model from '../../../../Model.js'

export default class DataSPL extends Plugin {

    constructor(opts = {}) {
        super(opts);
        this.name = 'Visualmodel/plugins/Data';
        this.desc.templates[0] = {
            name: 'data',
            style: 'data',
            desc: 'Default template for showing data'
        };
        this.desc.opts[0] = {
            name: "datasouceattr",
            desc: "Name of the attribute that contains a reference to the datasource"
        };
        if (!opts.datasouceattr)
            this.options.datasouceattr;
        this.desc.opts[1] = {
            name: "attrsShown",
            desc: "List of attribute names that should be shown. Give the attribute names in the order, they should appear.",
        };
        if (!opts.attrsShown)
            this.options.attrsShown = null;

        this.desc.opts[2] = {
            name: "attrsFormat",
            desc: "Map of swac_lang_format instructions for attribute names",
        };
        if (!opts.attrsFormat)
            this.options.attrsFormat = new Map();
        this.desc.opts[3] = {
            name: "datareload",
            desc: "Time in seconds to reload data for each set after from datasource."
        };
        if (!opts.datareload)
            this.options.datareload = 0;
        else
            this.timer = setInterval(this.onDataTimer.bind(this), this.options.datareload * 1000);
        this.desc.opts[4] = {
            name: "datadescription",
            desc: "CSS selector for the datadescription component used to color values."
        };
        if (!opts.datadescription)
            this.options.datadescription;
        else {
            let ddElem = document.querySelector(this.options.datadescription);
            if (ddElem)
                this.datadescription = ddElem.swac_comp;
            else
                Msg.error('DataSPL', 'Datadescription component >' + this.options.datadescription + '< not found.');
        }
        this.desc.opts[5] = {
            name: "animations",
            desc: "Activate animations on changed values (change)"
        };
        if (!opts.animations)
            this.options.animations = 'change';
        // Internal attributes
        this.stage = null;
        this.layer = null;
        this.tabid = 0;
    }

    init() {
        return new Promise((resolve, reject) => {
            // Get stage from  requestors component
            this.stage = this.requestor.parent.swac_comp.stage;
            this.layer = this.requestor.parent.swac_comp.layer;
            // Register event handling for on stage actions
            this.stage.on("click", this.onFocusElem.bind(this));

            resolve();
        });
    }

    afterAddSet(set, repeateds) {
        let thisRef = this;
        // Nothing todo here
        this.getData(set).then(function (data) {
            thisRef.visualiseData(set, data);
        });
    }

    onDataTimer() {
        let thisRef = this;
        for (let curSource in this.data) {
            for (let curSet of this.data[curSource].getSets()) {
                if (!curSet || !curSet[this.options.datasouceattr])
                    continue;
                this.getData(curSet).then(function (data) {
                    thisRef.visualiseData(curSet, data);
                });
            }
        }
    }

    async getData(set) {
        if (!set[this.options.datasouceattr]) {
            Msg.warn('DataSPL', 'Set >' + set.swac_fromName + '[' + set.id + '] does not contain datasourceattr >' + this.options.datasouceattr + '<', this.requestor.parent);
            return [];
        }
        
        let request = {
            fromName: set[this.options.datasouceattr]
        }
        if(this.options.attributeDefaults) {
            request.attributeDefaults = this.options.attributeDefaults;
        }
        
        const data = await Model.load(request);
        return data;
    }

    /**
     * Visualises data for a given set in the schema
     * 
     * @param {WatchableSet} set Set that exists in schema to visualise data at
     * @param {Object[]} data Array of datasets to visualise
     */
    visualiseData(set, data) {
        let visus = this.requestor.parent.swac_comp.drawns.get(set.swac_fromName);
        let visu = visus[set.id];
        if(!visu) {
            Msg.warn('DataSPL','Visualisation for Set >' + set.swac_fromName + "["+ set.id + "]< not found.",this.requestor.parent);
            return;
        }

        for (let curSet of data) {
            if (!curSet)
                continue;
            // Check if data is currently displayed
            let contElems = this.requestor.parent.querySelectorAll('.visualmodel_data_repeatedForValue[swac_fromname="' + curSet.swac_fromName + '"]');
            if (contElems.length > 0) {
                for (let curElem of contElems)
                    curElem.remove();
                // Update displayed data
                this.showSet(curSet);
            }

            // Get attributes to visualise (can be differend for each set)
            let showAttrs = this.options.attrsShown;
            if (!showAttrs) {
                showAttrs = Object.keys(curSet);
            }
            // Visualise attributes
            for (let curAttr of showAttrs) {
                if (curAttr.startsWith('swac_') || !curSet[curAttr])
                    continue;
                // Check if Datadescription component is used
                let dd = this.datadescription;
                if (dd) {
                    let col = dd.getValueColor(curSet, null, curAttr);
                    if(col === '#808080') {
                        continue;
                    }
                    if (visu.stroke() !== col && this.options.animations === 'change') {
                        let tween = new Konva.Tween({
                            node: visu,
                            scaleX: 2,
                            scaleY: 1.5,
                            easing: Konva.Easings.EaseOut,
                            duration: 1,
                        });
                        tween.play();
                        setTimeout(function() {
                            tween.reverse();
                        }, 1000);
                    }
                    visu.stroke(col);
                    break;
                }
            }
        }

    }

    /**
     * When an element in schema is focused, show data in tab
     * 
     * @param {KonvaEvent} evt Event for focus
     */
    onFocusElem(evt) {
        let thisRef = this;

        // Delete old shown data
        let olds = this.requestor.parent.querySelectorAll('.visualmodel_data_repeatedForValue');
        for (let curOld of olds) {
            curOld.remove();
        }

        // Show data from datasource if given
        if (this.options.datasouceattr) {
            this.getData(evt.target.attrs.swac_set).then(function (data) {
                thisRef.showData(data);
            });
        }
    }

    /**
     * Shows all data
     * 
     * @param {Object[]} data An array of datasets
     */
    showData(data) {
        for (let curSet of data) {
            if (!curSet)
                continue;
            this.showSet(curSet);
        }
    }

    /**
     * Shows sets data in table
     * 
     * @param {Object} set A dataset
     */
    showSet(set) {
        // Get nothing to show elem
        let msgElem = this.requestor.parent.querySelector('.swac_visualmodel_nofocusmsg');
        msgElem.classList.add('swac_dontdisplay');

        let showAttrs = this.options.attrsShown;
        if (!showAttrs)
            showAttrs = Object.keys(set);

        // Show new data
        for (let curAttr of showAttrs) {
            if (curAttr.startsWith('swac_') || !set[curAttr])
                continue;
            let contElem = this.requestor.parent.querySelector('.visualmodel_data_repeatForValue');
            // Create modal content
            let contCopy = contElem.cloneNode(true);
            let attrElem = contCopy.querySelector('.visualmodel_data_attr');
            // Get language entry for attribute
            let attrTr = SWAC.lang.getTranslationForId(curAttr);
            if (attrTr)
                attrElem.innerHTML = attrTr;
            else
                attrElem.innerHTML = curAttr;
            attrElem.setAttribute('swac_lang', curAttr);
            let valElem = contCopy.querySelector('.visualmodel_data_val');
            valElem.innerHTML = set[curAttr];
            valElem.setAttribute('swac_attrname',curAttr);
            if (this.options.attrsFormat.has(curAttr))
                valElem.setAttribute('swac_lang_format', this.options.attrsFormat.get(curAttr));
            contCopy.classList.remove('visualmodel_data_repeatForValue');
            contCopy.classList.add('visualmodel_data_repeatedForValue');
            contCopy.setAttribute('swac_fromname', set.swac_fromName);
            contCopy.setAttribute('swac_setid', set.id);
            contElem.parentNode.appendChild(contCopy);

            // Check if Datadescription component is used
            let dd = this.datadescription;
            if (dd) {
                let col = dd.getValueColor(set, null, curAttr);
                valElem.setAttribute('style', 'color:' + col);
            }
        }
    }
}