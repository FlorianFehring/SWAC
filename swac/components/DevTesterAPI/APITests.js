import SWAC from '../../swac.js';
import View from '../../View.js';
import Msg from '../../Msg.js';

export default class APITests extends View {

    constructor(options = {}) {
        super(options);
        this.name = 'APITests';
        this.desc.text = 'This component gives the possibility to simply check if a REST-API ist compatible to SWAC.';
        this.desc.developers = 'Florian Fehring (HSBI)';
        this.desc.license = 'GNU Lesser General Public License';

        this.desc.text = 'Component for testing data APIs';
        this.desc.depends[0] = {
            name: 'TreeQLTests.js',
            path: SWAC.config.swac_root + 'components/APITests/TreeQLTests.js',
            desc: 'Description for what the file is required.'
        };
        this.desc.templates[0] = {
            name: 'testing',
            style: 'testing',
            desc: 'Template for showing the tests and their results.'
        };
        this.desc.reqPerTpl[0] = {
            selc: 'cssSelectorForRequiredElement',
            desc: 'Description why the element is expected in the template'
        };
        this.desc.optPerTpl[0] = {
            selc: 'cssSelectorForOptionalElement',
            desc: 'Description what is the expected effect, when this element is in the template.'
        };
        this.desc.optPerPage[0] = {
            selc: 'cssSelectorForOptionalElement',
            desc: 'Description what the component does with the element if its there.'
        };
        this.desc.reqPerSet[0] = {
            name: 'id',
            desc: 'The attribute id is required for the component to work properly.'
        };
        this.desc.reqPerSet[1] = {
            name: 'url',
            desc: 'APIs URL.'
        };

        if (!options.showWhenNoData)
            this.options.showWhenNoData = true;
        this.desc.opts[0] = {
            name: "TestSuites",
            desc: "Names of the test suites to use. ClassName separated by comma."
        };
        // Setting a default value, only applying when the options parameter does not contain this option
        if (!options.TestSuites)
            this.options.TestSuites = 'TreeQLTests';
    }

    /*
     * This method will be called when the component is complete loaded
     * At this thime the template code is loaded, the data inserted into the 
     * template and even plugins are ready to use.
     */
    init() {
        return new Promise((resolve, reject) => {
            // Run tests for every api
            for (let curSource in this.data) {
                for (let curSet of this.data[curSource].getSets()) {
                    if (curSet)
                        this.afterAddSet(curSet);
                }
            }

            // Register event handler for test
            let startElems = this.requestor.querySelectorAll('.swac_apitests_start');
            for (let curStartElem of startElems) {
                curStartElem.addEventListener('click', this.onTest.bind(this));
            }

            resolve();
        });
    }

    /**
     * Method thats called before adding a dataset
     * This overrides the method from View.js
     * 
     * @param {Object} set Object with attributes to add
     * @returns {Object} (modified) set
     */
    beforeAddSet(set) {
        // You can check or transform the dataset here
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

        // Execute tests
//        if(this.testGetTreeQL(set.url)) {
//            
//        } else {
//            
//        }

        return;
    }

    /**
     * Method executed when the test (single) button is clicked
     * 
     * @param {DOMEvent} evt Event calling the method
     * @returns {undefined}
     */
    onTest(evt) {
        let setElem = this.findRepeatedForSet(evt.target);
        let url = setElem.querySelector('.swac_apitests_url').value;
        this.testAll(url);
    }

    /**
     * Runs all tests for an url
     * 
     * @param {type} url
     * @returns {undefined}
     */
    testAll(url) {
        let suites = this.options.TestSuites.split(',');
        let promises = [];
        //TODO replace this by build by reflection when available in javascript
        if (suites.includes('TreeQLTests')) {
            let tsuite = new TreeQLTests(this);
            for (let test of this.getMethods(tsuite)) {
                if (test.startsWith('test')) {
                    promises.push(tsuite[test](url));
                }
            }
        }
        // Check if one failed is included
        let urlinputElem = this.requestor.querySelector('[value="' + url + '"]');
        let setElem = this.findRepeatedForSet(urlinputElem);
        let teststateElem = setElem.querySelector('.swac_apitest_urlstate circle');
        Promise.all(promises).then(function (results) {
            if (results.includes(false)) {
                teststateElem.setAttribute("fill", "rgba(255,0,0,1)");
            } else {
                teststateElem.setAttribute("fill", "rgba(0,255,0,1)");
            }
        });
    }

    getMethods(obj) {
        let properties = new Set();
        let currentObj = obj;
        do {
            Object.getOwnPropertyNames(currentObj).map(item => properties.add(item));
        } while ((currentObj = Object.getPrototypeOf(currentObj)))
        return [...properties.keys()].filter(item => typeof obj[item] === 'function');
    }

    /**
     * Show the testresult
     * 
     * @param {String} url URL wich was tested
     * @param {String} testname Name of the test
     * @param {boolean} state If true test was succsessfull
     * @param {Object} result Data object or message from test
     * @returns {undefined}
     */
    showTestresult(url, testname, state, result) {
        let urlinputElem = this.requestor.querySelector('[value="' + url + '"]');
        let setElem = this.findRepeatedForSet(urlinputElem);
        let resultTpl = setElem.querySelector('.swac_apitests_repeatForTest');
        let resultElem = resultTpl.cloneNode(true);
        resultElem.classList.remove('swac_apitests_repeatForTest');
        resultElem.classList.add('swac_apitests_repeatedForTest');
        let teststateElem = resultElem.querySelector('.swac_apitest_teststate circle');
        if (state) {
            teststateElem.setAttribute("fill", "rgba(0,255,0,1)");
        } else {
            teststateElem.setAttribute("fill", "rgba(255,0,0,1)");
        }

        let testnameElem = resultElem.querySelector('.swac_apitests_testname');
        testnameElem.innerHTML = testname;
        let testresultElem = resultElem.querySelector('.swac_apitests_testresult');
        if (typeof result.json === 'function') {
            result.json().then(function (json) {
                let rtext = SWAC.lang.dict.APITests.restapierr;
                if (json.errors) {
                    for (let curError of json.errors) {
                        rtext += '<br>' + curError;
                    }
                }
                testresultElem.innerHTML = rtext + '<br>' + ' <a href="'
                        + url + '" target="_blank">' +
                        SWAC.lang.dict.APITests.showinbrowser
                        + '</a>';
            }).catch(function () {
                let rtext = result.status + ' ' + result.statusText + ' <a href="'
                        + result.url + '" target="_blank">' +
                        SWAC.lang.dict.APITests.showinbrowser
                        + '</a>';
                testresultElem.innerHTML = rtext;
            });
        } else if (result.status) {
            let rtext = result.status + ' ' + result.statusText + ' <a href="'
                    + result.url + '" target="_blank">' +
                    SWAC.lang.dict.APITests.showinbrowser
                    + '</a>';
            testresultElem.innerHTML = rtext;
        } else {
            testresultElem.innerHTML = '<pre>' + JSON.stringify(result, null, 2) + '</pre>';
        }
        // Add result
        resultTpl.parentNode.appendChild(resultElem);
    }

    /**
     * Removes all testresults from page
     * 
     * @returns {undefined}
     */
    removeTestResults() {

    }
}


