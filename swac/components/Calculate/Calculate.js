import SWAC from '../../swac.js';
import View from '../../View.js';
import Msg from '../../Msg.js';

export default class Calculate extends View {

    constructor(options = {}) {
        super(options);
        this.name = 'Calculate';
        this.desc.text = 'This component allows calculations with values from datasets. Use for forntend side calculations, when persistent results are not neccessery.';
        this.desc.developers = 'Florian Fehring';
        this.desc.license = '(c) by Florian Fehring';

        this.desc.templates[0] = {
            name: 'table',
            desc: 'Default calculate template.'
        };
        this.desc.templates[1] = {
            name: 'sumonly',
            desc: 'Shows only the sums.'
        };
        this.desc.optPerTpl[0] = {
            selc: '.swac_repeatForAttribute',
            desc: 'Area which is replaced for every attribute in dataset. This will also be repeated for calculated attributes. Can contain the {attrName} placeholder.'
        };
        this.desc.optPerTpl[1] = {
            selc: '.swac_calculate_saveasjson',
            desc: 'If present allows the export of the calculated data into a json file.'
        };
        this.desc.reqPerSet[0] = {
            name: 'id',
            desc: 'The attribute id is required for the component to work properly.'
        };

        this.desc.opts[0] = {
            name: "calculations",
            desc: "Definitions of calculations. These are objects with the attributes: formular (formular with names of the dataset attributes) and target (name of the attribute where the result will be stored)",
            example: [
                {formular: "(!voltage) ? 0 : 1", target: "modulecount"},
                {formular: "voltage * current", target: "yield"}
            ]
        };
        if (!options.calculations)
            this.options.calculations = [];
        this.desc.opts[1] = {
            name: "sourceattr",
            desc: "Name of the attribute that contains a url to get a dataset to calculate with. Allows the calculation over multiple datasources.",
            example: 'source'
        };
        if (!options.sourceattr)
            this.options.sourceattr = null;
        this.desc.opts[2] = {
            name: "exportbtn",
            desc: "If true a export button will be shown."
        };
        if (typeof options.exportbtn === 'undefined')
            this.options.exportbtn = false;
        this.desc.opts[3] = {
            name: "roundresults",
            desc: "Digits to round results to."
        };
        if (typeof options.roundresults === 'undefined')
            this.options.roundresults = 2;
        // Internal attributes
        this.calculatedSets = [];
    }

    /*
     * This method will be called when the component is complete loaded
     * At this thime the template code is loaded, the data inserted into the 
     * template and even plugins are ready to use.
     */
    init() {
        return new Promise((resolve, reject) => {
            if (this.options.exportbtn) {
                // Register event handler
                let exportJsonBtn = this.requestor.querySelector('.swac_calculate_saveasjson');
                exportJsonBtn.classList.remove('swac_dontdisplay');
                if (exportJsonBtn)
                    exportJsonBtn.addEventListener('click', this.onExportAsJson.bind(this));
            }
            resolve();
        });
    }

    /**
     * Method thats called before adding a dataset
     * This overrides the method from View.js
     * 
     * @param {Object} set Object with attributes to add
     * @param {DOMElement[]} repeateds Elements that where created as representation for the set
     * @returns {Object} (modified) set
     */
    async afterAddSet(set, repeateds) {
        let dataset = set;

        // Get values to calc with
        if (set[this.options.sourceattr]) {
            const response = await fetch(set[this.options.sourceattr]);
            dataset = await response.json();
            if (dataset['records'])
                dataset = dataset['records'][0];
        }

        // Get calculations
        for (let curCalc of this.options.calculations) {
            let formular = curCalc.formular;
            // Walk trough sets attributes
            for (let curAttr in dataset) {
                formular = formular.replace(curAttr, dataset[curAttr]);
            }
            let result = 0;
            try {
                result = eval(formular);
            } catch (e) {
                Msg.error('Calculate', 'Could not perform calculation for set >' + set.swac_fromName + '[' + set.id + ']<: ' + e, this.requestor);
            }
            // Copy set to calculated data
            let setCopy = Object.assign({}, dataset);
            setCopy.id = set.id
            setCopy[curCalc.target] = result;
            delete setCopy['swac_fromName'];
            this.calculatedSets.push(setCopy);
            // Create th if not exists
            let thCalc = this.requestor.querySelector('.swac_calculate_th_' + curCalc.target);
            if (!thCalc) {
                let thCalcTpl = this.requestor.querySelector('.swac_repeatForAttribute');
                thCalc = thCalcTpl.cloneNode(true);
                thCalc.classList.remove('swac_repeatForAttribute');
                thCalc.classList.add('swac_repeatedForAttribute');
                thCalc.classList.add('swac_calculate_th_' + curCalc.target);
                thCalc.innerHTML = 'f() = ' + curCalc.target;
                thCalc.setAttribute('uk-tooltip', curCalc.formular);
                thCalcTpl.parentNode.appendChild(thCalc);
                // Create foot sum field
                let tfoot = this.requestor.querySelector('tfoot');
                if (tfoot) {
                    if (!tfoot.querySelector('[swac_calculate_sumfor="' + curCalc.target + '"]')) {
                        let tfCalcTpl = tfoot.querySelector('.swac_repeatForAttribute');
                        let tfCalc = tfCalcTpl.cloneNode(true);
                        tfCalc.classList.remove('swac_repeatForAttribute');
                        tfCalc.setAttribute('swac_attrname', curCalc.target);
                        tfCalc.style = "";
                        tfCalc.setAttribute('swac_calculate_sumfor', curCalc.target);
                        tfCalc.innerHTML = '0';
                        tfCalcTpl.parentElement.appendChild(tfCalc);
                    }
                }
            }

            // Get the row that contains the set calculated for
            let calcRow = this.requestor.querySelector('.swac_repeatedForSet[swac_setId="' + set.id + '"]');
            if (!calcRow) {
                Msg.error('Calculate', 'There is no display for data of set >' + set.id + '<', this.requestor);
            }

            // Create repeat for value
            let valueCalcTpl = this.requestor.querySelector('.swac_repeatForValue');
            let valueCalc = valueCalcTpl.cloneNode(true);
            valueCalc.classList.remove('swac_repeatForValue');
            valueCalc.classList.add('swac_repeatedForValue');
            valueCalc.setAttribute('swac_calculate_valuefor', curCalc.target);
            valueCalc.innerHTML = valueCalc.innerHTML.replace('{*}', result.toFixed(this.options.roundresults));
            valueCalc.innerHTML = valueCalc.innerHTML.replace('{attrName}', curCalc.target);
            calcRow.appendChild(valueCalc);

            // Calculate sum
            let sumElem = this.requestor.querySelector('[swac_calculate_sumfor="' + curCalc.target + '"]');
            if (sumElem && !isNaN(result)) {
                let sumVal = parseFloat(sumElem.innerHTML);
                if (!isNaN(sumVal))
                    sumElem.innerHTML = (sumVal + result).toFixed(this.options.roundresults);
            }
        }

        return set;
    }

    /**
     * Correct sum after set was removed
     * 
     * @param {WatchableSet} set Set that was removed
     */
    afterRemoveSet(set) {
        // Find set
        let delset = null;
        for (let i in this.calculatedSets) {
            let curSet = this.calculatedSets[i];
            if (curSet.id === set.id) {
                delset = curSet;
                delete this.calculatedSets[i];
                break;
            }
        }

        for (let curCalc of this.options.calculations) {
            // Find sum element
            let tfoot = this.requestor.querySelector('tfoot');
            if (tfoot) {
                let sumElem = tfoot.querySelector('[swac_calculate_sumfor="' + curCalc.target + '"]');
                if (sumElem) {
                    let sumVal = parseFloat(sumElem.innerHTML);
                    sumElem.innerHTML = sumVal - delset[curCalc.target]
                }
            }
        }
    }

    /**
     * Exports the curent state of the calculated data as json file
     * 
     * @param {type} evt
     * @returns {undefined}
     */
    onExportAsJson(evt) {
        let data = JSON.stringify(this.calculatedSets);
        let dataURL = 'data:application/json,' + data;
        var link = document.createElement('a');
        link.download = 'calculation_result.json';
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}


