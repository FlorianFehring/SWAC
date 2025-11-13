import SWAC from '../../swac.js';
import View from '../../View.js';
import Msg from '../../Msg.js';

export default class Selectdatetime extends View {

    constructor(options = {}) {
        super(options);
        this.name = 'Selectdatetime';
        this.desc.text = 'Creates a selectbox for selection of date and / or time values.';
        this.desc.developers = 'Florian Fehring (HSBI)';
        this.desc.license = 'GNU Lesser General Public License';

        this.desc.depends[0] = {
            name: 'DatatypeReflection',
            algorithm: 'DatatypeReflection',
            desc: 'Algorithm with methods to determine date and time values'
        };
        this.desc.depends[1] = {
            name: 'luxon.js',
            path: SWAC.config.swac_root + 'algorithms/DatatypeReflection/libs/luxon.min.js',
            desc: 'Description for what the file is required.'
        };
        this.desc.templates[0] = {
            name: 'selectdatetime',
            style: false,
            desc: 'Shows a select element for date and time.'
        };
        this.desc.reqPerTpl[0] = {
            selc: '.swac_selectdatetime_date',
            desc: 'Input element for display and input the date'
        };
        this.desc.reqPerTpl[1] = {
            selc: '.swac_selectdatetime_time',
            desc: 'Input element for display and input the time'
        };
        this.desc.reqPerSet[0] = {
            name: 'id',
            desc: 'The attribute id is required for the component to work properly.'
        };
        this.desc.reqPerSet[1] = {
            name: 'datetime',
            desc: 'Date and / or time value in format dd.MM.yyyy[ hh:mm]'
        };

        this.options.showWhenNoData = true;
        this.desc.opts[0] = {
            name: "datepicker",
            desc: "If set to true, date picking is allowed"
        };
        if (typeof this.options.datepicker === 'undefined')
            this.options.datepicker = true;
        this.desc.opts[1] = {
            name: "timepicker",
            desc: "If set to true, time picking is allowed"
        };
        if (typeof this.options.timepicker === 'undefined')
            this.options.timepicker = true;

        this.desc.opts[2] = {
            name: "timepickerseconds",
            desc: "Show sconds in time picker. Note: seconds are allways shown when data has seconds."
        };
        if (typeof this.options.timepickerseconds === 'undefined')
            this.options.timepickerseconds = false;

        this.desc.opts[3] = {
            name: "actualTimeForEmpty",
            desc: "Use the acutal time for datasets where no date / time is set."
        };
        if (typeof this.options.actualTimeForEmpty === 'undefined')
            this.options.actualTimeForEmpty = false;
    }

    init() {
        return new Promise((resolve, reject) => {
            // Hide datepicker
            if (this.options.datepicker === false) {
                let delems = this.requestor.querySelectorAll('.swac_selectdatetime_date');
                for (let curDelem of delems) {
                    curDelem.classList.add('swac_dontdisplay');
                }
            }
            // Hide timepicker
            if (this.options.timepicker === false) {
                let telems = this.requestor.querySelectorAll('.swac_selectdatetime_time');
                for (let curTelem of telems) {
                    curTelem.classList.add('swac_dontdisplay');
                }
            }
            // Show timepicerseconds
            if (this.options.timepickerseconds === true) {
                let telems = this.requestor.querySelectorAll('.swac_selectdatetime_time');
                for (let curTelem of telems) {
                    curTelem.setAttribute('step', 1);
                }
            }
            resolve();
        });
    }

    beforeAddSet(set) {
        Msg.flow('Selectdatetime', 'beforeAddSet(' + set.swac_fromName + '[' + set.id + ']', this.requestor);
        // Set actual time if there is no time in dataset
        if (!set.datetime && this.options.actualTimeForEmpty) {
            set.datetime = new Date().toISOString();
            set.is_autoactual = true;
        } else if(set.is_autoactual) {
            // Update object value when automatic
            set.datetime = new Date().toISOString();
        }
        return set;
    }

    afterAddSet(set, repeateds) {
        Msg.flow('Selectdatetime', 'afterAddSet(' + set.swac_fromName + '[' + set.id + ']', this.requestor);
        let dtr = SWAC.loadedAlgorithms['DatatypeReflection'];
        let dateObj = dtr.getDateOrDateTime(set.datetime);
        console.log('TEST afterAddSet',dateObj,set);

console.log('[swac_fromname="' + set.swac_fromName + '"][swac_setid="' + set.id + '"]');
        let repForSetElem = this.requestor.querySelector('[swac_fromname="' + set.swac_fromName + '"][swac_setid="' + set.id + '"]');
        if(!repForSetElem) {
            this.stopReloadInterval();
            console.log('TEST no repeatedForSEt found stopping reloadInterval');
            return;
        }
        let dateElem = repForSetElem.querySelector('.swac_selectdatetime_date');
        dateElem.setAttribute('value', dateObj.toISODate());
        dateElem.addEventListener('change', this.onChangeDate.bind(this));

        let time = dateObj.toISOTime();
        // Remove fractions of seconds because they are not supported by browsers
        time = time.split('.')[0];
        let timeElem = repForSetElem.querySelector('.swac_selectdatetime_time');
        timeElem.setAttribute('value', time);
        timeElem.addEventListener('change', this.onChangeTime.bind(this));
    }

    /*
     * Update dataset on change date. This is only needed because there are two input elements for one value.
     * If there are only one input element for one value, updates are handled by the data binding mechanism.
     */
    onChangeDate(evt) {
        // Stop automatic reload to prevend newload while changeing dataset
        this.stopReloadInterval();
        // Get repeated for set
        let repForSet = this.findRepeatedForSet(evt.target);
        let set = repForSet.swac_dataset;
        let timeElem = repForSet.querySelector('.swac_selectdatetime_time');
        set.datetime = evt.target.value + 'T' + timeElem.value;
        // Restart automatic reload (if configured)
//        this.startReloadInterval();
    }

    /**
     * Update dataset on change time. This is only needed because there are two input elements for one value.
     * If there are only one input element for one value, updates are handled by the data binding mechanism.
     */
    onChangeTime(evt) {
        // Stop automatic reload to prvend newload while changeing dataset
        this.stopReloadInterval();
        // Get repeated for set
        let repForSet = this.findRepeatedForSet(evt.target);
        let set = repForSet.swac_dataset;
        let dateElem = repForSet.querySelector('.swac_selectdatetime_date');
        set.datetime = dateElem.value + 'T' + evt.target.value;
        // Restart automatic reload (if configured)
//        this.startReloadInterval();
    }
}