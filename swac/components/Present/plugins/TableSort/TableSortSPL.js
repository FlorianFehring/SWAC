import SWAC from '../../../../swac.js';
import Msg from '../../../../Msg.js';
import Plugin from '../../../../Plugin.js'

export default class TableSortSPL extends Plugin {

    constructor(pluginconf) {
        super(pluginconf);
        this.name = 'Present/plugins/TableSort';
        this.desc.text = 'This plugin allows a sorting of table based presents.';
        this.desc.developers = 'Florian Fehring (HSBI)';
        this.desc.license = 'GNU Lesser General Public License';
        
        // internal attributes
        this.registered = false;
    }

    init() {
        return new Promise((resolve, reject) => {

            // Add style
            var head = document.getElementsByTagName('HEAD')[0];
            var link = document.createElement('link');
            link.rel = 'stylesheet';
            link.type = 'text/css';
            link.href = SWAC.config.swac_root + '/components/Present/plugins/TableSort/tablesort.css';
            head.appendChild(link);

            resolve();
        });
    }
    
    afterAddSet(set, repeateds) {
        if(!this.registred) {
            // Search table headers
            let ths = this.requestor.parent.querySelectorAll('th');
            for (let curTh of ths) {
                // Exclude empty headers
                if(curTh.innerHTML === '')
                    continue;
                curTh.addEventListener('click', this.onClickTh.bind(this));
                curTh.classList.add('swac_present_sort_un');
            }
            this.registred = true;
        }
    }

    /**
     * Executed, when user clicks on the table headline
     * 
     * @param {DOMEvent} evt Event of the click
     */
    onClickTh(evt) {
        let th = evt.target;
        while (th.nodeName != 'TH' && th.parentNode) {
            th = th.parentNode;
        }
        let tr = th;
        while (tr.nodeName !== 'TR' && tr.parentNode) {
            tr = tr.parentNode;
        }
        let columnIndex = 0; // Start counting after th thats for attribute repeatable
        for (let curTd of tr.children) {
            if (curTd.nodeName === 'TH')
                columnIndex++;
            if (curTd === th)
                break;
        }
        let table = tr.parentElement;
        while (table.nodeName !== 'TABLE' && table.parentNode) {
            table = table.parentNode;
        }

        // Remove old up / down markers
        let markers = table.querySelectorAll('.swac_present_sort_up, .swac_present_sort_dw');
        for (let curth of markers) {
            if (curth !== th) {
                curth.classList.remove('swac_present_sort_up');
                curth.classList.remove('swac_present_sort_dw');
            }
        }

        let values = [];
        let rows = table.querySelectorAll("tbody tr");
        let tdsel = "td:nth-child(" + (columnIndex) + ")";
        let datatype;
        for (let i = 0; i < rows.length; i++) {
            if (rows[i].classList.contains('swac_repeatForSet'))
                continue;
            let td = rows[i].querySelector(tdsel);
            // Ignore if row does not contain this td
            if (!td)
                continue;
            values.push({value: td.innerText, row: rows[i]});

            let nval = new Number(td.innerText);
            if (isNaN(nval)) {
                datatype = 'string';
            } else {
                datatype = 'number';
            }
        }

        // Get order
        let order;
        if (th.classList.contains('swac_present_sort_up')) {
            th.classList.remove('swac_present_sort_up');
            th.classList.add('swac_present_sort_dw');
            order = 'desc';
        } else {
            th.classList.remove('swac_present_sort_dw');
            th.classList.add('swac_present_sort_up');
            order = 'asc';
        }
        // Sort array
        if (datatype === 'number') {
            switch (order) {
                case "desc":
                    values.sort(function (a, b) {
                        return b.value - a.value
                    });
                    break;
                default:
                    values.sort(function (a, b) {
                        return a.value - b.value
                    });
            }
        } else {
            switch (order) {
                case "desc":
                    values.sort(function (a, b) {
                        let x = a.value.toLowerCase();
                          let y = b.value.toLowerCase();
                        if (x < y) {
                            return -1;
                        }
                        if (x > y) {
                            return 1;
                        }
                        return 0;
                    });
                    break;
                default:
                    values.sort(function (a, b) {
                        let x = a.value.toLowerCase();
                          let y = b.value.toLowerCase();
                        if (x < y) {
                            return 1;
                        }
                        if (x > y) {
                            return -1;
                        }
                        return 0;
                    });
            }
        }

        // Move rows
        for (var idx = 0; idx < values.length; idx++) {
            table.querySelector("tbody").appendChild(values[idx].row);
        }
    }
}