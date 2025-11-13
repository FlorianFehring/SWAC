import SWAC from '../../swac.js';
import View from '../../View.js';
import Msg from '../../Msg.js';
import WatchableSet from '../../WatchableSet.js';
import ViewHandler from '../../ViewHandler.js';

export default class TestComponents extends View {

    constructor(options = {}) {
        super(options);
        this.name = 'TestComponents';
        this.desc.text = 'Component for testing components.';
        this.desc.developers = 'Florian Fehring (HSBI)';
        this.desc.license = 'GNU Lesser General Public License';
        
        this.desc.templates[0] = {
            name: 'testview',
            style: 'testview',
            desc: 'Views tests execute button and results.'
        };
        this.desc.reqPerTpl[0] = {
            selc: 'cssSelectorForRequiredElement',
            desc: 'Description why the element is expected in the template'
        };

        this.options.showWhenNoData = true;

        this.desc.opts[0] = {
            name: 'componentName',
            desc: 'Name of the component that should be explained.'
        };
        if (!this.options.componentName)
            this.options.componentName = null;

        this.desc.opts[1] = {
            name: 'functionTestOrder',
            desc: 'Order of test to execute'
        };
        if (!this.options.functionTestOrder)
            this.options.functionTestOrder = null;

        this.desc.opts[2] = {
            name: 'typeTestObjects',
            desc: 'Map of test objects for use on functions'
        };
        if (!this.options.typeTestObjects)
            this.options.typeTestObjects = new Map();

        this.desc.opts[3] = {
            name: 'expectedresults',
            desc: 'Map of test name and expected result'
        };
        if (!this.options.expectedresults)
            this.options.expectedresults = new Map();

        // Internal variables
        this.runningTestNo = 0;
        this.msgs = [];
    }

    /*
     * This method will be called when the component is complete loaded
     * At this thime the template code is loaded, the data inserted into the 
     * template and even plugins are ready to use.
     */
    init() {
        return new Promise((resolve, reject) => {
            let componentName = this.options.componentName;
            if (!componentName) {
                let msgElem = document.createTextNode(SWAC.lang.dict.ExplainComponents.noComponentSelected);
                this.requestor.appendChild(msgElem);
                resolve();
                return;
            }

            // Register event listener for new messages
            document.addEventListener('swac_msg', this.onMsg.bind(this));

            // Add test component to page
            let testRequestor = document.createElement('div');
            testRequestor.id = 'swac_test';
            testRequestor.setAttribute('swa', componentName);
            this.requestor.parentNode.appendChild(testRequestor);
            let vh = new ViewHandler();
            let thisRef = this;
            vh.load(testRequestor).then(function () {
                thisRef.createTypeTestObjects();
                thisRef.buildTestInterface(testRequestor.swac_comp);
                resolve();
            });
        });
    }

    /**
     * Create default type test objects
     */
    createTypeTestObjects() {
        if (!this.options.typeTestObjects.has('SourceName'))
            this.options.typeTestObjects.set('SourceName', []);
        this.options.typeTestObjects.get('SourceName').push('variabletestsource');

        var variabletestsource = SWAC.Model.createWatchableSource({fromName: 'variabletestsource', requestId: 'variabletestsource?filter=id,lt,10'});
        window.variabletestsource = variabletestsource;

        if (!this.options.typeTestObjects.has('WatchableSource'))
            this.options.typeTestObjects.set('WatchableSource', []);
        this.options.typeTestObjects.get('WatchableSource').push(variabletestsource);

        if (!this.options.typeTestObjects.has('SourceReference'))
            this.options.typeTestObjects.set('SourceReference', []);
        this.options.typeTestObjects.get('SourceReference').push('ref://variabletestsource?filter=id,lt,10');

        if (!this.options.typeTestObjects.has('WatchableSet'))
            this.options.typeTestObjects.set('WatchableSet', []);
        let set1 = {
            id: 1,
            intval: 1,
            doubeval: 1.0,
            boolval: true
        };
        this.options.typeTestObjects.get('WatchableSet').push(new WatchableSet(set1));
        let set2 = {
            id: 2,
            intval: 2,
            doubeval: 2.0,
            boolval: true
        };
        this.options.typeTestObjects.get('WatchableSet').push(new WatchableSet(set2));

        if (!this.options.typeTestObjects.has('SourceAttribute'))
            this.options.typeTestObjects.set('SourceAttribute', []);
        this.options.typeTestObjects.get('SourceAttribute').push('intvalue');

        if (!this.options.typeTestObjects.has('SetId'))
            this.options.typeTestObjects.set('SetId', []);
        this.options.typeTestObjects.get('SetId').push(1);

        if (!this.options.typeTestObjects.has('int'))
            this.options.typeTestObjects.set('int', []);
        this.options.typeTestObjects.get('int').push(2);

        if (!this.options.typeTestObjects.has('bool'))
            this.options.typeTestObjects.set('bool', []);
        this.options.typeTestObjects.get('bool').push(true);
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

    afterAddSet(set, repeateds) {
        return;
    }

    /**
     * Build a testinterface for the given component.
     * 
     * @param {SWACComponent} compObj Component object to test 
     */
    buildTestInterface(compObj) {
        // Build for function tests
        this.buildFunctionTests(compObj);
    }

    /**
     * Build a testinterface for the functions.
     * 
     * @param {SWACComponent} compObj Component object to test 
     */
    buildFunctionTests(compObj) {
        // Auto order of function tests
        if (!this.options.functionTestOrder) {
            this.options.functionTestOrder = [];
            for (let i in compObj.desc.funcs) {
                if (compObj.desc.funcs[i])
                    this.options.functionTestOrder.push(i);
            }
        }

        this.runningTestNo = 0;

        // Default expected outcomes
        this.options.expectedresults.set('addDataFromReference - empty params', {
            msgs: ['No reference given to get data from.']
        });
        this.options.expectedresults.set('addSet - empty params', {
            msgs: ['No set given']
        });

        // Get funcTestTpl
        let funcDescTpl = this.requestor.querySelector('.swac_testcomponents_repForFuncTestDesc');
        for (let curI of this.options.functionTestOrder) {
            let desc = compObj.desc.funcs[curI];
            let fdesc = funcDescTpl.cloneNode(true);
            fdesc.classList.remove('swac_testcomponents_repForFuncTestDesc');
            fdesc.querySelector('.swac_testcomponents_funcname').innerHTML = desc.name;
            fdesc.querySelector('.swac_testcomponents_funcname').setAttribute('uk-tooltip', desc.desc);
            let funcDescPtbl = fdesc.querySelector('.swac_testcomponents_param');
            let testcombis = [];
            if (desc.params) {
                let paramNo = 0;
                for (let curParam of desc.params) {
                    let pdesc = funcDescPtbl.cloneNode(true);
                    pdesc.classList.remove('swac_testcomponents_param');
                    pdesc.innerHTML = curParam.name + ' (' + curParam.type + '), ';
                    pdesc.setAttribute('uk-tooltip', curParam.desc);
                    funcDescPtbl.parentElement.appendChild(pdesc);

                    // Get actual test params
                    let testvalues = this.options.typeTestObjects.get(curParam.type);
                    if (!testvalues) {
                        Msg.warn('TestComponents', 'There are no values for param >' + curParam.name + '< of type >' + curParam.type + '< for testing.');
                    } else {
                        let i = 0;
                        for (let curTestVal of testvalues) {
                            // Create testcombi if not exists
                            if (!testcombis[i]) {
                                testcombis[i] = {};
                                testcombis[i].name = 'auto params ' + i;
                                testcombis[i].params = [];
                                if (desc.returns)
                                    testcombis[i].restype = desc.returns.type;
                            }
                            testcombis[i].params[paramNo] = curTestVal;
                            // Test if prev params are missing
                            for (let prevParamNo = paramNo - 1; prevParamNo >= 0; prevParamNo--) {
                                if (typeof testcombis[i].params[prevParamNo] === 'undefined') {
                                    // Fill it from prev combi
                                    testcombis[i].params[prevParamNo] = testcombis[i - 1].params[prevParamNo];
                                }
                            }
                            i++;
                        }
                    }
                    paramNo++;
                }
            }

            // Add empty params
            testcombis.push({
                func: desc.name,
                name: 'empty params',
                params: []
            });

            let funcTestTpl = this.requestor.querySelector('.swac_testcomponents_repForFuncTest');
            funcTestTpl.parentElement.appendChild(fdesc);
            // Execute test combis
            for (let curCombi of testcombis) {
                this.runningTestNo++;
                this.msgs[this.runningTestNo] = [];
                let testout = funcTestTpl.cloneNode(true);
                testout.classList.remove('swac_testcomponents_repForFuncTest');
                let nameout = testout.querySelector('.swac_testcomponents_testname');
                nameout.innerHTML = '<a href="' + window.location.pathname + '?runtest=' + this.runningTestNo + '">' + this.runningTestNo + ': - ' + curCombi.name + '</a>';
                let valtpl = testout.querySelector('.swac_testcomponents_value');
                for (let curVal of curCombi.params) {
                    let valout = valtpl.cloneNode(true);
                    if (typeof curVal !== 'undefined')
                        valout.innerHTML = curVal.toString();
                    else
                        valout.innerHTML = 'undefined';
                    valtpl.parentElement.appendChild(valout);
                    valtpl.parentElement.appendChild(document.createTextNode(' '));
                }
                funcTestTpl.parentElement.appendChild(testout);

                let resout = testout.querySelector('.swac_testcomponents_testresult');
                let resico = document.createElement('img');
                let msgout = testout.querySelector('.swac_testcomponents_testmessages');
                resico.setAttribute('height', 25);
                resico.setAttribute('width', 25);
                let resdrop = document.createElement('div');
                resdrop.setAttribute('uk-drop', 'pos: left-center');
                let runtest = SWAC.getParameterFromURL('runtest', window.location);
                if (!runtest || runtest == this.runningTestNo) {
                    try {
                        let result = compObj[desc.name](curCombi.params[0], curCombi.params[1], curCombi.params[2], curCombi.params[3], curCombi.params[4]);
                        // Wait for promises
                        if (result && result.constructor.name === 'Promise') {
                            let thisRef = this;
                            let testid = this.runningTestNo;
                            result.then(function (promresult) {
                                thisRef.checkResult(promresult, curCombi, resico, resdrop, testid);
                            }).catch(function (err) {
                                if (!err || typeof err === 'string' || err instanceof String) {
                                    // Maybe error message is expected
                                    thisRef.checkResult(err, curCombi, resico, resdrop, testid);
                                } else {
                                    //TypeError newer can be expexted result
                                    resico.setAttribute('src', '/SWAC/swac/components/Icon/imgs/error.svg');
                                    resico.setAttribute('alt', 'failed');
                                    resdrop.appendChild(document.createTextNode(err));
                                    thisRef.showMessages(msgout);
                                }
                            }).finally(function () {
                                thisRef.showMessages(msgout, testid);
                            });
                        } else {
                            this.checkResult(result, curCombi, resico, resdrop);
                            this.showMessages(msgout);
                        }
                    } catch (err) {
                        resico.setAttribute('src', '/SWAC/swac/components/Icon/imgs/error.svg');
                        resico.setAttribute('alt', 'failed');
                        resdrop.appendChild(document.createTextNode(err));
                        console.trace(err);
                        this.showMessages(msgout);
                    }
                }
                resout.appendChild(resico);
                resout.appendChild(resdrop);
            }
        }
    }

    /**
     * Check the recived result on errors
     */
    checkResult(result, combi, resico, resdrop, testid = this.runningTestNo) {
        // Get expected result
        let expres = this.options.expectedresults.get(combi.func + ' - ' + combi.name);
        if (expres) {
            // Check if messages occure
            let msgfound = true;
            let resfound = true;
            if (expres.msgs) {
                for (let curExMsg of expres.msgs) {
                    for (let curMsg of this.msgs[testid]) {
                        if (curMsg.msg.localeCompare(curExMsg) >= 0) {
                            msgfound = true;
                            break;
                        } else {
                            msgfound = false;
                        }
                    }
                }
            }

            if (expres.results) {
                for (let curExRes of expres.results) {
                    if (result === curExRes) {
                        resfound = true;
                        break;
                    } else {
                        resfound = false;
                    }
                }
            }

            if (msgfound && resfound) {
                resico.setAttribute('src', '/SWAC/swac/components/Icon/imgs/true.svg');
                resico.setAttribute('alt', 'succsed');
                resdrop.appendChild(document.createTextNode('function returned expected >' + result + '< and / or messages.'));
            } else if (!resfound) {
                resico.setAttribute('src', '/SWAC/swac/components/Icon/imgs/error.svg');
                resico.setAttribute('alt', 'failed');
                resdrop.appendChild(document.createTextNode('Result should return one of >' + expres.results + '< but is >' + result + '<'));
            } else {
                resico.setAttribute('src', '/SWAC/swac/components/Icon/imgs/error.svg');
                resico.setAttribute('alt', 'failed');
                resdrop.appendChild(document.createTextNode('There should be one of the following messages >' + expres.msgs + '<'));
            }
            return;
        }

        // Check return type
        if (combi.restype && typeof result === 'undefined') {
            resico.setAttribute('src', '/SWAC/swac/components/Icon/imgs/error.svg');
            resico.setAttribute('alt', 'failed');
            resdrop.appendChild(document.createTextNode('Got no result, but should be of type >' + combi.restype + '<'));
        } else if (combi.restype && combi.restype !== result.constructor.name) {
            resico.setAttribute('src', '/SWAC/swac/components/Icon/imgs/error.svg');
            resico.setAttribute('alt', 'failed');
            resdrop.appendChild(document.createTextNode('Result should be of type >' + combi.restype + '< but is >' + result.constructor.name + '<'));

        } else if (result) {
            resico.setAttribute('src', '/SWAC/swac/components/Icon/imgs/true.svg');
            resico.setAttribute('alt', 'succsed');
            resdrop.appendChild(document.createTextNode('result was: ' + result.toString()));
        } else {
            resico.setAttribute('src', '/SWAC/swac/components/Icon/imgs/true.svg');
            resico.setAttribute('alt', 'succsed');
            resdrop.appendChild(document.createTextNode('function returned without result'));
    }
    }

    /**
     * Shows messages of the last executed test in the webinterface
     * 
     * @param {DOMElement} msgout Element where to place messages
     * @param {int} testid Id of the test to show messages
     */
    showMessages(msgout, testid = this.runningTestNo) {
        let errelem = msgout.querySelector('.swac_testcomponents_errmsgs');
        let warnelem = msgout.querySelector('.swac_testcomponents_warnmsgs');
        // Create badage
        if (this.msgs[testid].length > 0) {
            let badage = document.createElement('div');
            badage.classList.add('uk-badge');
            badage.innerHTML = this.msgs[testid].length;
            msgout.appendChild(badage);
        }
        // Crreate messages
        for (let curMsg of this.msgs[testid]) {
            let msgelem = document.createElement('div');
            msgelem.innerHTML = curMsg.msg;
            if (curMsg.level === 'error') {
                errelem.appendChild(msgelem);
            } else {
                warnelem.appendChild(msgelem);
            }
    }
    }

    /**
     * Recives notification about occured messages
     */
    onMsg(evt) {
        if (this.runningTestNo > 0 && (evt.detail.level === 'error' || evt.detail.level === 'warning')) {
            this.msgs[this.runningTestNo].push(evt.detail);
        }
    }
}