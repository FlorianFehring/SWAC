import SWAC from '../../../../swac.js';
import Msg from '../../../../Msg.js';
import Plugin from '../../../../Plugin.js'
import ViewHandler from '../../../../ViewHandler.js';

export default class DataShowModalSPL extends Plugin {

    constructor(options = {}) {
        super(options);
        this.name = 'Worldmap2d/plugins/DataShowModal';
        this.desc.text = 'Plugin to show datasets data at the points where the datasets create markers.';
        
        this.desc.templates[0] = {
            name: 'datashowmodal',
            style: 'datashowmodal',
            desc: 'Default modal dialog for showing data'
        };

        this.desc.optPerTpl[0] = {
            selc: 'worldmap2d_datamodal_del',
            desc: 'Button to delete the dataset shown in modal.'
        };

        this.desc.opts[0] = {
            name: "attrsShown",
            desc: "List of attribute names that should be shown. Give the attribute names in the order, they should appear.",
        };
        if (!options.attrsShown)
            this.options.attrsShown = null;

        this.desc.opts[1] = {
            name: "attrsFormat",
            desc: "Map of swac_lang_format instructions for attribute names",
        };
        if (!options.attrsFormat)
            this.options.attrsFormat = new Map();

        this.desc.opts[2] = {
            name: "allowDelete",
            desc: "If true deleteion of datasets is allowed",
        };
        if (!options.allowDelete) {
            this.options.allowDelete = true;
        }

        // Internal attributes
        this.modal = null;
        this.modalset = 0;
    }

    init() {
        return new Promise((resolve, reject) => {
            // add event listener for mapMarkerClick
            document.addEventListener('swac_' + this.requestor.parent.id + '_marker_click',
                    this.onMarkerClick.bind(this));
// Get modal template
            this.modal = this.contElements[0].querySelector('.worldmap2d_datamodal');
            resolve();
        });
    }

    /**
     * Function executed when a click on a marker occured
     */
    onMarkerClick(e) {
        // Get dataset from marker
        let set = e.detail.target.feature.set;
        this.modalset = set;


        // Remove old data
        let olddata = this.modal.querySelectorAll('.worldmap2d_repeatedForValue');
        for (let curData of olddata) {
            curData.remove();
        }
        // Remove old label heading
        let oldLabelHeading = this.modal.querySelector('.labeling-heading')
        if (oldLabelHeading != null)
            oldLabelHeading.remove();

        // Remove old label
        let oldlabel = this.modal.querySelector('.labeling');
        if (oldlabel != null)
            oldlabel.swac_comp.delete();

        // Set setname if available
        if (set.name) {
            this.modal.querySelector('.worldmap2d_setname').innerHTML = set.name;
        }
        // Add new data
        let contElem = this.modal.querySelector('.worldmap2d_repeatForValue');
        if (this.options.attrsShown) {
            for (let curAttr of this.options.attrsShown) {
                this.modifyModalContent(contElem, set, curAttr);
            }
        } else {
            for (let curAttr in set) {
                // Exclude swac_ attributes
                if (curAttr.startsWith('swac_'))
                    continue;
                this.modifyModalContent(contElem, set, curAttr);
            }
        }

        if (this.requestor.parent.swac_comp.plugins.get('Labels')) {
            // Add label
            let labelContElem = this.modal.querySelector('.label-wrapper');
            labelContElem.setAttribute('swac_setid', set.id);
            let labelHeadingElem = document.createElement('p');
            labelHeadingElem.classList.add('uk-text-bold')
            labelHeadingElem.classList.add('uk-text-uppercase')
            labelHeadingElem.classList.add('labeling-heading')
            labelHeadingElem.textContent = 'Labels';
            labelContElem.appendChild(labelHeadingElem);
            let labelElem = document.createElement('div')
            labelElem.id = 'labeling'
            labelElem.classList.add('labeling')
            labelElem.setAttribute('swa', `Labeling FROM label_datasets WHERE filter=set_id,eq,${set.id} AND filter=collection,eq,${set.swac_fromName} OPTIONS labels_options`)
            labelContElem.appendChild(labelElem);
            // check if labels_options is set
            if (!window.labels_options) {
                window.labels_options = {
                    showWhenNoData: true,
                    labeledidAttr: 'set_id',
                    labelSource: {
                        fromName: 'label_labels',
                        fromWheres: {
                            filter: 'isavailfordatasets,eq,true'
                        }
                    },
                    sendAlongData: {collection: window.swac.getParameterFromURL('collection')},
                };
            }
            // render labeling component
            let viewHandler = new ViewHandler()
            viewHandler.load(labelElem);
        }

        // Check if del is allowed
        let delBtn = this.modal.querySelector('.worldmap2d_datamodal_del');
        if (delBtn) {
            if (this.options.allowDelete) {
                delBtn.addEventListener('click', this.onDeleteSet.bind(this));
            } else {
                delBtn.remove();
            }
        }

        // Translate modal
        window.swac.lang.translateAll(this.modal);
        UIkit.modal(this.modal).show();
    }

    onDeleteSet(evt) {
        let dataCapsule = {
            fromName: this.modalset.swac_fromname
        };
        dataCapsule.data = [{
                id: this.modalset.id,
            }];

        SWAC.Model.delete(dataCapsule).then(function () {
            UIkit.modal.alert(SWAC.lang.dict.Worldmap2d_DataShowModal.delsuc)
        }).catch(function (err) {
            UIkit.modal.alert(SWAC.lang.dict.Worldmap2d_DataShowModal.delerr)
        });

    }

    /**
     * Modifies the modals content for each attribute
     * 
     * @param {DOMElement} contElem Element where content is placed
     * @param {WatchableSet} set Set to display data from
     * @param {String} attr Attribute to create entry for
     */
    modifyModalContent(contElem, set, attr) {
        // Create modal content
        let contCopy = contElem.cloneNode(true);
        let attrElem = contCopy.querySelector('.worldmap2d_attr');
        attrElem.innerHTML = attr;
        attrElem.setAttribute('swac_lang', attr);
        let valElem = contCopy.querySelector('.worldmap2d_val');
        valElem.innerHTML = set[attr];
        if (this.options.attrsFormat.has(attr))
            valElem.setAttribute('swac_lang_format', this.options.attrsFormat.get(attr));
        contCopy.classList.remove('worldmap2d_repeatForValue');
        contCopy.classList.add('worldmap2d_repeatedForValue');
        contElem.parentNode.appendChild(contCopy);

        // Check if Datadescription component is used
        let dd = this.requestor.parent.swac_comp.datadescription;
        if (dd) {
            let col = dd.getValueColor(set, null, attr);
            valElem.setAttribute('style', 'color:' + col);
        }
    }

}