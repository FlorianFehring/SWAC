import SWAC from '../../../../swac.js';
import Msg from '../../../../Msg.js';
import Plugin from '../../../../Plugin.js'

export default class LabelsSPL extends Plugin {

    constructor(options) {
        super(options);
        this.name = 'Worldmap2d/plugins/Labels';
        this.desc.templates[0] = {
            name: 'labels',
            style: 'labels',
            desc: 'Shows labels on top of a map pin',
        };

        this.desc.opts[0] = {
            name: 'labelSource',
            desc: 'table name that contains data of the labels',
        };

        this.desc.opts[1] = {
            name: 'label_id',
            desc: 'column name that contains the label id',
        }

        this.desc.opts[2] = {
            name: 'datasets',
            desc: 'if true, the labels are only shown for datasets',
        }

        this.desc.opts[3] = {
            name: 'observedobjects',
            desc: 'if true, the labels are only shown for observed objects',
        }

        if (!options.labelSource)
            this.options.labelSource = 'label_labels';
        
        if (!options.label_id)
            this.options.label_id = 'label_id';
        
        if (options.datasets) {
            this.options.fetchLabelIdTable = 'label_datasets';
            this.options.fetchLabelIdColumn = 'set_id';
            this.options.isavailfor = 'isavailfordatasets';
        }

        if (options.observedobjects) {
            this.options.fetchLabelIdTable = 'label_observedobject';
            this.options.fetchLabelIdColumn = 'oo_id';
            this.options.isavailfor = 'isavailforobjects';
        }

        
    }

    init() {
        return new Promise((resolve, reject) => {
            if (this.options.datasets && this.options.observedobjects) {
                Msg.error('LabelsSPL', 'You can only use one of the options datasets or observedobjects');
                reject();
            } 
            if (!this.options.datasets && !this.options.observedobjects) {
                Msg.error('LabelsSPL', 'You have to use one of the options datasets or observedobjects');
                reject();
            }
            resolve();
        });
    }
    
    async afterAddSet(set, repeateds) {
        let marker = this.requestor.parent.swac_comp.markers[set.swac_fromName][set.id];
        let divElemList = [];
        let labels = await this.fetchLabelId(set.id);
        let setContainsLabels = false
        for (let label of labels) {
            if (!label) continue;
            if (!setContainsLabels)
                setContainsLabels = true;

            let labelData = await this.fetchLabelData(label[this.options.label_id]);
            for (let l of labelData) {
                if (!l) continue;
                if (!marker.feature.labels) {
                    marker.feature.labels = [];
                }
                marker.feature.labels.push(l);
                divElemList.push(`<div style="width: inherit; $$ background: ${l.color}"></div>`)

            }

        }

        if (setContainsLabels) {

            const sizeDivs = divElemList.length;
            let divString = ''
            divElemList.forEach((div) => {
                divString += div.replace('$$', `height: ${100/sizeDivs}%;`)
            })

            let labelIcon = L.divIcon({
                html: '<div class="label-pin">' + divString + '</div>',
                className: 'label-pin',
                iconAnchor: [12, 41],
            })

            marker.setIcon(labelIcon);
        }
    }

    /**
     * fetch label id
     * @param {set_id} id 
     * @returns 
     */
    async fetchLabelId(id) {
        return await window.swac.Model.load({
            fromName: this.options.fetchLabelIdTable,
            fromWheres: {
                filter: `${this.options.fetchLabelIdColumn},eq,${id}`,
            } 
        })
    }

    /**
     * fetch label data
     * @param {label_id} id 
     * @returns 
     */
    async fetchLabelData(id) {
        return await window.swac.Model.load({
            fromName: this.options.labelSource,
            fromWheres: {
                filter: `id,eq,${id}&${this.options.isavailfor},eq,true`,
            }
        })
    }
   
}