import SWAC from '../../../../swac.js';
import Msg from '../../../../Msg.js';
import Plugin from '../../../../Plugin.js'

export default class FilterSortSPL extends Plugin {

    constructor(options = {}) {
        super(options);
        this.name = 'Present/plugins/FilterSort';
        this.desc.text = 'This plugin allows filtering and sorting in presented data.';
        this.desc.developers = 'Florian Fehring (HSBI)';
        this.desc.license = 'GNU Lesser General Public License';

        this.desc.reqPerTpl[0] = {
            selc: '[uk-filter]',
            desc: 'Div container where the filter and sort elements and the repeatedForSets are placed.'
        };
        this.desc.reqPerTpl[1] = {
            selc: '.swac_present_fitlersort_btnarea',
            desc: 'Container where the filter and sort buttons are placed.'
        };
        this.desc.reqPerTpl[2] = {
            selc: '.swac_present_filtersort_sets',
            desc: 'Container where the sets are displayed.'
        };

        this.desc.optPerTpl[0] = {
            selc: '.swac_present_fitlersort_filterarea',
            desc: 'Element that contains the filter options.'
        };
        this.desc.optPerTpl[1] = {
            selc: '.swac_present_filtersort_filter',
            desc: 'Element where to place the filter options.'
        };
        this.desc.optPerTpl[2] = {
            selc: '.swac_present_filtersort_filtername',
            desc: 'Element where to insert filters name.'
        };
        this.desc.optPerTpl[3] = {
            selc: '.swac_present_fitlersort_sortarea',
            desc: 'Element that contains the sort options.'
        };
        
        this.desc.optPerTpl[4] = {
            selc: '.swac_present_filtersort_sortselect',
            desc: 'Element where to place the sort options.'
        };

        this.desc.opts[0] = {
            name: 'filterable',
            desc: 'If true makes the presented data filterable'
        };
        if (typeof options.filterable === 'undefined')
            this.options.filterable = true;

        this.desc.opts[1] = {
            name: 'sortable',
            desc: 'If true makes the presented data sortable'
        };
        if (typeof options.sortable === 'undefined')
            this.options.sortable = true;

        // internal attributes
        this.sortvalues = new Map();
    }

    init() {
        return new Promise((resolve, reject) => {

            if (this.options.filterable) {
                let filterArea = this.requestor.parent.querySelector('.swac_present_fitlersort_filterarea');
                if (filterArea)
                    filterArea.classList.remove('swac_dontdisplay');
            }
            if (this.options.sortable) {
                let sortArea = this.requestor.parent.querySelector('.swac_present_fitlersort_sortarea');
                if (sortArea)
                    sortArea.classList.remove('swac_dontdisplay');
            }

            let sortselectElem = this.requestor.parent.querySelector('.swac_present_filtersort_sortselect');
            if (sortselectElem) {
                sortselectElem.addEventListener('change', this.onChangeSort.bind(this));
            }

            resolve();
        });
    }

    afterAddSet(set, repeateds) {
        let filterElem = this.requestor.parent.querySelector('.swac_present_filtersort_filter');
        let sortselectElem = this.requestor.parent.querySelector('.swac_present_filtersort_sortselect');

        // Add data attributes to repeateds
        for (let curAttr in set) {
            // Exclude swac internal attributes
            if (curAttr.startsWith('swac_'))
                continue;

            // Add data ttribute to repeateds
            for (let curRep of repeateds) {
                curRep.setAttribute('data-' + curAttr, set[curAttr]);
            }

            // Add map entry for filterable / sortable
            if (!this.sortvalues.has(curAttr))
                this.sortvalues.set(curAttr, []);
            // Add current value
            if (this.sortvalues.get(curAttr).includes(set[curAttr]))
                continue;

            this.sortvalues.get(curAttr).push(set[curAttr]);

            // Create sort option
            if (this.options.sortable && sortselectElem) {
                if (this.sortvalues.get(curAttr).length == 2) {
                    // Create sort options
                    let sortAscOpt = document.createElement('option');
                    sortAscOpt.setAttribute('value', curAttr + '.asc');
                    let asctxt = SWAC.lang.dict.Present_FilterSort.ascending;
                    sortAscOpt.innerHTML = curAttr + ' (' + asctxt + ')';
                    sortselectElem.appendChild(sortAscOpt);
                    let sortDescOpt = document.createElement('option');
                    let desctxt = SWAC.lang.dict.Present_FilterSort.descending;
                    sortDescOpt.innerHTML = curAttr + ' (' + desctxt + ')';
                    sortDescOpt.setAttribute('value', curAttr + '.desc');
                    sortselectElem.appendChild(sortDescOpt);
                }
            } else if (!this.options.sortable) {
                Msg.warn('FilterSortSPL', 'Sort function is deactivated', this.requestor.parent);
            } else if (!sortselectElem) {
                Msg.error('FlterSortSPL', 'Sort is enabled, but there is no >swac_present_filtersort_sortselect< element in template.', this.requestor.parent);
            }

            // Create filter option
            if (this.options.filterable) {
                let curFilterElem = this.requestor.parent.querySelector('[filterattr=' + curAttr + ']');
                if (!curFilterElem) {
                    curFilterElem = filterElem.cloneNode(true);
                    curFilterElem.classList.remove('swac_present_filtersort_filter');
                    curFilterElem.setAttribute('filterattr', curAttr);
                    filterElem.parentElement.appendChild(curFilterElem);
                    let nameElem = curFilterElem.querySelector('.swac_present_filtersort_filtername');
                    nameElem.setAttribute('swac_lang', curAttr);
                    nameElem.innerHTML = curAttr;
                }
                if (this.sortvalues.get(curAttr).length >= 2)
                    curFilterElem.classList.remove('swac_dontdisplay');

                let filterOpt = document.createElement('li');
                filterOpt.setAttribute('uk-filter-control', "[data-" + curAttr + "='" + set[curAttr] + "']");
                let filterOptA = document.createElement('a');
                filterOptA.setAttribute('href', '#');
                filterOptA.innerHTML = set[curAttr];
                filterOpt.appendChild(filterOptA);
                curFilterElem.appendChild(filterOpt);
            }
        }
    }

    onChangeSort(evt) {
        evt.preventDefault();
        let sortParts = evt.target.value.split('.');

        var wrapper = this.requestor.parent;
        var elements = wrapper.querySelectorAll('.swac_repeatedForSet');
        var sortedElements;
        if (sortParts[1] === 'asc') {
            sortedElements = Array.prototype.slice.call(elements).sort(function (a, b) {
                return a.getAttribute('data-' + sortParts[0]).localeCompare(b.getAttribute('data-' + sortParts[0]));
            });
        } else {
            sortedElements = Array.prototype.slice.call(elements).sort(function (a, b) {
                return b.getAttribute('data-' + sortParts[0]).localeCompare(a.getAttribute('data-' + sortParts[0]));
            });
        }
        sortedElements.forEach(function (element) {
            wrapper.appendChild(element);
        });
    }
}