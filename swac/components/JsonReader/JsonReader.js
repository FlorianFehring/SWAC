import SWAC from '../../swac.js';
import View from '../../View.js';
import Msg from '../../Msg.js';
import Model from '../../Model.js'

export default class JsonReader extends View {

    constructor(options = {}) {
        super(options);
        this.name = 'JsonReader';
        this.desc.text = 'Component for reading contents from json files for useing them in other components or save them to database.';
        this.desc.developers = 'Florian Fehring (HSBI)';
        this.desc.license = 'GNU Lesser General Public License';

        this.desc.templates[0] = {
            name: 'default',
            style: 'default',
            desc: 'Default template.'
        };

        this.desc.reqPerTpl[0] = {
            selc: '.swac_jsonreader_fileselectstep',
            desc: 'Dialog div to show in file select step.'
        };
        this.desc.reqPerTpl[1] = {
            selc: '.swac_jsonreader_fileurl',
            desc: 'Element where to input a url to a json file.'
        };
        this.desc.reqPerTpl[2] = {
            selc: '.swac_jsonreader_fileselect',
            desc: 'Element where to select a json file.'
        };
        this.desc.reqPerTpl[3] = {
            selc: '.swac_jsonreader_jsontext',
            desc: 'Element where to input json text.'
        };
        this.desc.reqPerTpl[4] = {
            selc: '.swac_jsonreader_toconfig',
            desc: 'Button to go to config step.'
        };
        this.desc.reqPerTpl[5] = {
            selc: '.swac_jsonreader_configstep',
            desc: 'Element that contains the configuration step form.'
        };
        this.desc.reqPerTpl[6] = {
            selc: '.swac_jsonreader_configurl',
            desc: 'Input element for an url to the configuration file.'
        };
        this.desc.reqPerTpl[7] = {
            selc: '.swac_jsonreader_configselect',
            desc: 'Input element for file selection for configuration file.'
        };
        this.desc.reqPerTpl[8] = {
            selc: '.swac_jsonreader_repeatForKey',
            desc: 'Element repeated for every json attribute in file.'
        };
        this.desc.reqPerTpl[9] = {
            selc: '.swac_jsonreader_keyname',
            desc: 'Element where to place the keyname for json attribute.'
        };
        this.desc.reqPerTpl[10] = {
            selc: '.swac_jsonreader_keycolection',
            desc: 'Select element where to chose the target collection of that attribute.'
        };
        this.desc.reqPerTpl[11] = {
            selc: '.swac_jsonreader_keycolumn',
            desc: 'Select element where to chose the target column of that attribute.'
        };
        this.desc.reqPerTpl[12] = {
            selc: '.swac_jsonreader_configtext',
            desc: 'Textarea where to show the configuration json.'
        };
        this.desc.reqPerTpl[13] = {
            selc: '.swac_jsonreader_saveconf',
            desc: 'Button to save the configuration.'
        };
        this.desc.reqPerTpl[14] = {
            selc: '.swac_jsonreader_backtofileselect',
            desc: 'Button to go back to fileselect.'
        };
        this.desc.reqPerTpl[15] = {
            selc: '.swac_jsonreader_topreview',
            desc: 'Button to go forward to preview.'
        };
        this.desc.reqPerTpl[16] = {
            selc: '.swac_jsonreader_topreview',
            desc: 'Button to go forward to preview.'
        };
        this.desc.reqPerTpl[17] = {
            selc: '.swac_jsonreader_previewstep',
            desc: 'Element that contains content of preview step.'
        };
        this.desc.reqPerTpl[18] = {
            selc: '.swac_jsonreader_preview',
            desc: 'Element that contains preview.'
        };
        this.desc.reqPerTpl[19] = {
            selc: '.swac_jsonreader_repeatForCollection',
            desc: 'Element that should be repeated for every collection.'
        };
        this.desc.reqPerTpl[20] = {
            selc: '.swac_jsonreader_colcaption',
            desc: 'Element that contains the caption for a collection.'
        };
        this.desc.reqPerTpl[21] = {
            selc: '.swac_jsonreader_repeatForDataKey',
            desc: 'Element repeated for every data key.'
        };
        this.desc.reqPerTpl[22] = {
            selc: '.swac_jsonreader_repeatForDataset',
            desc: 'Element repeated for every dataset.'
        };
        this.desc.reqPerTpl[23] = {
            selc: '.swac_jsonreader_repeatForDataValue',
            desc: 'Element repeated for every data value.'
        };
        this.desc.reqPerTpl[24] = {
            selc: '.swac_jsonreader_backtoconfig',
            desc: 'Button for going back to config setp.'
        };
        this.desc.reqPerTpl[25] = {
            selc: '.swac_jsonreader_tosave',
            desc: 'Button for going to save step.'
        };
        this.desc.reqPerTpl[26] = {
            selc: '.swac_jsonreader_savestep',
            desc: 'Element contianting content for save step.'
        };
        this.desc.reqPerTpl[27] = {
            selc: '.swac_jsonreader_startsavebtn',
            desc: 'Button to perform save.'
        };
        this.desc.reqPerTpl[28] = {
            selc: '.swac_jsonreader_backtopreview',
            desc: 'Button to go back to preview step.'
        };
        this.desc.reqPerTpl[29] = {
            selc: '.swac_jsonreader_restart',
            desc: 'Button to restart import process.'
        };

        this.desc.opts[0] = {
            name: "collectionsRequestor",
            desc: "Requestor specifying source of collections that where allowed targets. Requires the name of the collection to be in attribute 'name'",
        };
        if (!options.collectionsRequestor)
            this.options.collectionsRequestor = {
                fromName: '/SmartDataTest/smartdata/storage/getCollections?name=smartmonitoring'
            };

        this.desc.opts[1] = {
            name: "columnsRequestor",
            desc: "Requestor specifying source of columns that where allowed targets. Requires the name of the collection to be in attribute 'name'",
        };
        // Setting a default value, only applying when the options parameter does not contain this option
        if (!options.columnsRequestor)
            this.options.columnsRequestor = {
                fromName: '/SmartDataTest/smartdata/collection/[collection]?storage=smartmonitoring'
            };

        if (!options.showWhenNoData)
            this.options.showWhenNoData = true;

        // Internal attributes
        this.availableCollections = [];
        this.availableColumns = new Map();
        this.jsondata = null;
        this.datasets = {}; // Store import datasets
    }

    init() {
        return new Promise((resolve, reject) => {
            // Register function for when file selected
            let jsonfileElem = this.requestor.querySelector('.swac_jsonreader_fileselect');
            jsonfileElem.addEventListener('change', this.loadJSONFile.bind(this));
            // Register function for when inserting url
            let jsonurlElem = this.requestor.querySelector('.swac_jsonreader_fileurl');
            jsonurlElem.addEventListener('change', this.loadJSONURL.bind(this));

            // Register function for go to configuration step
            let toconfigElem = this.requestor.querySelector('.swac_jsonreader_toconfig');
            toconfigElem.addEventListener('click', this.onToConfig.bind(this));
            // Register function for go back to fileselect step
            let toFileselectElem = this.requestor.querySelector('.swac_jsonreader_backtofileselect');
            toFileselectElem.addEventListener('click', this.onBackToFileselect.bind(this));
            // Register function for go to preview
            let toPreviewElem = this.requestor.querySelector('.swac_jsonreader_topreview');
            toPreviewElem.addEventListener('click', this.onToPreview.bind(this));
            // Register function for go back to configuration
            let backToConfigElem = this.requestor.querySelector('.swac_jsonreader_backtoconfig');
            backToConfigElem.addEventListener('click', this.onBackToConfig.bind(this));
            // Register function for go to save
            let toSaveElem = this.requestor.querySelector('.swac_jsonreader_tosave');
            toSaveElem.addEventListener('click', this.onToSave.bind(this));
            // Register function for go back to preview
            let backToPrevieElem = this.requestor.querySelector('.swac_jsonreader_backtopreview');
            backToPrevieElem.addEventListener('click', this.onBackToPreview.bind(this));
            // Register function for restart
            let restartElem = this.requestor.querySelector('.swac_jsonreader_restart');
            restartElem.addEventListener('click', this.onRestart.bind(this));
            // Register function for import start
            let savestartElem = this.requestor.querySelector('.swac_jsonreader_startsavebtn');
            savestartElem.addEventListener('click', this.onSaveStart.bind(this));

            this.loadAvailableCollections();

            resolve();
        });
    }

    /**
     * Loads the available collections for later selection
     */
    loadAvailableCollections() {
        let thisRef = this;
        let dataPromise = Model.load(this.options.collectionsRequestor);
        dataPromise.then(function (data) {
            for (let curSet of data) {
                if (!curSet)
                    continue;
                thisRef.availableCollections.push(curSet.name);
            }
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
        // You can do after adding actions here. At this timepoint the template
        // repeatForSet is also repeated and accessable.
        // e.g. generate a custom view for the data.

        // Call Components afterAddSet and plugins afterAddSet
        super.afterAddSet(set, repeateds);

        return;
    }

    /**
     * Called when a json source file was selected
     * 
     * @param {DOMEvent} evt File select event
     */
    loadJSONFile(evt) {
        Msg.flow('JsonReader', 'JSON source file was selected', this.requestor);
        let jsonfileElem = this.requestor.querySelector('.swac_jsonreader_fileselect');
        let jsontxtElem = this.requestor.querySelector('.swac_jsonreader_jsontext');

        // Read file content and add to textarea
        let files = jsonfileElem.files;
        if (files.length == 0)
            return;
        const file = files[0];
        let reader = new FileReader();
        reader.onload = (e) => {
            const file = e.target.result;
            const obj = JSON.parse(file);
            jsontxtElem.value = JSON.stringify(obj, null, 2);
        };
        reader.onerror = function (e) {
            Msg.error('JsonReader', 'Could not load json from selected file: ' + e, this.requestor);
        };
        reader.readAsText(file);
    }

    /**
     * Called when a url is entered into the jsonurl field.
     * Loads the file and puts the content into the text field.
     * 
     * @param {DOMEvent} evt Event for inserting url
     */
    loadJSONURL(evt) {
        var url = this.requestor.querySelector('.swac_jsonreader_fileurl').value;
        let jsontxtElem = this.requestor.querySelector('.swac_jsonreader_jsontext');
        if (url == "") {
            jsontxtElem.value = "";
        } else {
            let thisRef = this;
            fetch(url, {
                method: 'GET'
            }).then(function (res) {
                response.json().then(function (json) {
                    jsontxtElem.value = JSON.stringify(data);
                });
            }).catch(function (e) {
                Msg.error('JsonReader', 'Could not load json from >' + url + '<: ' + e, thisRef.requestor);
                if (e.toString().indexOf('NetworkError') > 0) {
                    UIkit.modal.alert(SWAC.lang.dict.JsonReader.fileurl_error_cors);
                } else {
                    UIkit.modal.alert(SWAC.lang.dict.JsonReader.fileurl_error);
                }
            });
        }
    }

    /**
     * Perfomed when user clicks on gotoconfig
     * 
     * @param {DOMEvent} evt Click event
     */
    onToConfig(evt) {
        evt.preventDefault();
        // Check if json is there
        let jsontxtElem = this.requestor.querySelector('.swac_jsonreader_jsontext');
        if (!jsontxtElem.value) {
            UIkit.modal.alert(SWAC.lang.dict.JsonReader.toconfig_missingjson);
            return;
        }
        // Hide step 1 show step 2
        let firstStepElem = this.requestor.querySelector('.swac_jsonreader_fileselectstep');
        firstStepElem.classList.add('swac_dontdisplay');
        let secondStepElem = this.requestor.querySelector('.swac_jsonreader_configstep');
        secondStepElem.classList.remove('swac_dontdisplay');

        // Read jsonstructure
        let uniqueKeys = this.readJSONStructure();
        this.createKeyOrdering(uniqueKeys);
    }

    /**
     * Reads all keys that are in the JSON data file and filters out multiple instances of one key, so keys are only unique.
     * 
     * This function first reads the file from the textbox and then starts to go recursively into the branches of the JSON file to find all keys.
     * If a key is an object or an array, the function recursively calls itself again and goes deeper into the branch to look for keys.
     * The function only adds keys, that contain only premitive values. No Arrays or Objects are added, except for Arrays, which only contain values.
     */
    readJSONStructure() {
        let jsontxtElem = this.requestor.querySelector('.swac_jsonreader_jsontext');
        let data = JSON.parse(jsontxtElem.value);
        this.jsondata = data;

        //TODO wurde zum Vorschauerstellen verwendet
        //jsontopars = data;

        // Find ALL keys, even multiple instances
        const getNestedKeys = (data, resultKeys, path = "") => {
            if (!(data instanceof Array) && typeof data === 'object') {
                Object.keys(data).forEach(key => {
                    if (!(data[key] instanceof Object)) {
                        // Don't push Objects and Arrays (Arrays are Objects)
                        resultKeys.push(path + key);
                    } else if (data[key] instanceof Array) {
                        var arr = data[key];
                        if (!(arr[0] instanceof Object)) {
                            // Only push arrays that only contain values, no more nested attributes (Arrays or Objects)
                            resultKeys.push(path + key); // These arrays containing only values are pushed as a key
                        }
                    }
                    var value = data[key];
                    if (typeof value === 'object' && value != null) {
                        getNestedKeys(value, resultKeys, path + key + "/");
                    }
                });
            } else {
                Object.keys(data).forEach(key => {
                    if (data instanceof Array) {
                        getNestedKeys(data[key], resultKeys, path + "/");
                    }
                });
            }

            return resultKeys;
        };
        var keys = getNestedKeys(data, []);
        let uniqueKeys = [...new Set(keys)]; // Filter out multiple instances of all keys, only unique keys remain

        let pattern = /\/\//g;
        for (let i = 0; i < uniqueKeys.length; i++) {
            uniqueKeys[i] = "/" + uniqueKeys[i]; // Add front slashes
            uniqueKeys[i] = uniqueKeys[i].replace(pattern, "/"); // Remove double slashes
        }

        return uniqueKeys;

        // User input, reads all collections the user puts in
//        var collectionc = document.getElementById("collection").value;
//        collectionc.split(",").forEach(function (item) {
//            collections.push(item);
//        });
//        generatecheckbox(uniqueKeys, collections);


    }

    /**
     * Creates the ordering table for keys to collections and columns
     */
    createKeyOrdering(uniqueKeys) {
        let configStepElem = this.requestor.querySelector('.swac_jsonreader_configstep');
        let repeatForKeyElem = configStepElem.querySelector('.swac_jsonreader_repeatForKey');

        // Delete old key orderings if existend
        let oldOrderings = this.requestor.querySelectorAll('.jsonreader_repeatedForKey');
        for (let curOrd of oldOrderings) {
            curOrd.remove();
        }

        for (let curKey of uniqueKeys) {
            let curKeyElem = repeatForKeyElem.cloneNode(true);
            curKeyElem.classList.remove('swac_jsonreader_repeatForKey');
            curKeyElem.classList.add('jsonreader_repeatedForKey');
            curKeyElem.setAttribute('forKey', curKey);
            // Set name
            curKeyElem.querySelector('.swac_jsonreader_keyname').innerHTML = curKey;
            // Set available collections
            let curColsElem = curKeyElem.querySelector('.swac_jsonreader_keycolection');
            for (let curCol of this.availableCollections) {
                let curOption = document.createElement('option');
                curOption.value = curCol;
                curOption.innerHTML = curCol;
                curColsElem.appendChild(curOption);
            }
            curColsElem.addEventListener('change', this.onSelectCollection.bind(this));

            repeatForKeyElem.parentNode.appendChild(curKeyElem);

            // Create listener for column change
            let keyColumnElem = curKeyElem.querySelector('.swac_jsonreader_keycolumn');
            keyColumnElem.addEventListener('change', this.onSelectColumn.bind(this));
        }
    }

    /**
     * Executed to go back to fileselect
     * 
     * @param {DOMEvent} evt Event when clicking back button
     */
    onBackToFileselect(evt) {
        evt.preventDefault();

        // Hide step 2 show step 1
        let secondStepElem = this.requestor.querySelector('.swac_jsonreader_configstep');
        secondStepElem.classList.add('swac_dontdisplay');
        let firstStepElem = this.requestor.querySelector('.swac_jsonreader_fileselectstep');
        firstStepElem.classList.remove('swac_dontdisplay');
    }

    /**
     * Executed to go to preview
     * 
     * @param {DOMEvent} evt Event when clicking on button to go to preview
     */
    onToPreview(evt) {
        evt.preventDefault();

        // Hide step 2 show step 3
        let secondStepElem = this.requestor.querySelector('.swac_jsonreader_configstep');
        secondStepElem.classList.add('swac_dontdisplay');
        let thirdStepElem = this.requestor.querySelector('.swac_jsonreader_previewstep');
        thirdStepElem.classList.remove('swac_dontdisplay');

        this.createPreview();
    }

    /** Creates the preview from the import configuration and the data **/
    createPreview() {
        // Reset datasets
        this.datasets = {};
        // Get config json
        let cjsonElem = this.requestor.querySelector('.swac_jsonreader_configtext');
        let cjson;
        cjson = JSON.parse(cjsonElem.innerHTML);

        let preElem = this.requestor.querySelector('.swac_jsonreader_preview');
        let tabElem = preElem.querySelector('.swac_jsonreader_repeatForCollection');

        // Remove prev created tables
        let prevTables = preElem.querySelectorAll('.jsonreader_repeatedForCollection');
        for (let curTable of prevTables) {
            curTable.remove();
        }

        // Build header
        let repForKeyElem = this.requestor.querySelector('.swac_jsonreader_repeatForDataKey');
        for (let curKeySet of cjson) {
            // Check if table allready exists
            let tableElem = preElem.querySelector('.jsonreader_col_' + curKeySet.collection);
            if (!tableElem) {
                // Create table
                tableElem = tabElem.cloneNode(true);
                tableElem.classList.remove('swac_jsonreader_repeatForCollection');
                tableElem.classList.add('jsonreader_col_' + curKeySet.collection);
                tableElem.classList.add('jsonreader_repeatedForCollection');
                tableElem.setAttribute('collection', curKeySet.collection);
                tabElem.parentElement.appendChild(tableElem);
                let captElem = tableElem.querySelector('.swac_jsonreader_colcaption');
                captElem.innerHTML = curKeySet.collection;
            }
            // Add header
            let hElem = tableElem.querySelector('.swac_jsonreader_repeatForDataKey');
            let headerElem = hElem.cloneNode(true);
            headerElem.classList.remove('swac_jsonreader_repeatForDataKey');
            headerElem.innerHTML = curKeySet.dbcolumn;
            hElem.parentElement.appendChild(headerElem);

            // Get level of sets
            let lvls = curKeySet.path.split('/');
            let dataset = this.jsondata;
            console.log('TEST DBcol1', curKeySet.dbcolumn);
            this.diveData(dataset, lvls, tableElem, null, curKeySet.dbcolumn);
        }
    }

    /**
     * Dive into the import configuration, find the matching data and create table cels for each data
     * 
     * @param {Object} dataset Dataset (object or array) to get data from
     * @param {String[]} lvls List of path parts to the value
     * @param {DOMElement} tableElem Element of the datatable
     * @param {int} setid No of the set to work on
     * @param {String} dbcolumn Name of the target column
     */
    diveData(dataset, lvls, tableElem, setid = null, dbcolumn) {
        for (let i = 0; i < lvls.length; i++) {
            let curLvl = lvls[i];
            if (curLvl !== '') {
                dataset = dataset[curLvl];

                if (i === lvls.length - 1) {
                    // Get row for set
                    let rowElem = tableElem.querySelector('.jsonreader_repeatedForDataset_' + setid);
                    if (!rowElem) {
                        let rElem = tableElem.querySelector('.swac_jsonreader_repeatForDataset');
                        rowElem = rElem.cloneNode(true);
                        rowElem.classList.remove('swac_jsonreader_repeatForDataset');
                        rowElem.classList.add('jsonreader_repeatedForDataset_' + setid);
                        rElem.parentElement.appendChild(rowElem);
                    }
                    // Create column for value
                    let cElem = rowElem.querySelector('.swac_jsonreader_repeatForDataValue');
                    let colElem = cElem.cloneNode(true);
                    colElem.classList.remove('swac_jsonreader_repeatForDataValue');
                    colElem.classList.add('jsonreader_repeatedForDataValue');
                    colElem.innerHTML = dataset;
                    cElem.parentElement.appendChild(colElem);
                    // Save dataset
                    let sets = this.datasets[tableElem.getAttribute('collection')];
                    if (!sets)
                        sets = [];
                    if (!sets[setid])
                        sets[setid] = {};
                    console.log('TEST dbcol2', dbcolumn);
                    sets[setid][dbcolumn] = dataset;
                    this.datasets[tableElem.getAttribute('collection')] = sets;

                } else if (Array.isArray(dataset)) {
                    for (let j = 0; j < dataset.length; j++) {
                        this.diveData(dataset[j], lvls.slice(i + 1), tableElem, j, dbcolumn);
                    }
                    break;
                }


            }
    }
    }

    /**
     * Executed on click on go back butto
     * 
     * @param {DOMEvent} evt Event for click
     */
    onBackToConfig(evt) {
        evt.preventDefault();

        // Hide step "preview" shos step "config"
        let secondStepElem = this.requestor.querySelector('.swac_jsonreader_previewstep');
        secondStepElem.classList.add('swac_dontdisplay');
        let thirdStepElem = this.requestor.querySelector('.swac_jsonreader_configstep');
        thirdStepElem.classList.remove('swac_dontdisplay');
    }

    /**
     * Executed to go to save
     * 
     * @param {DOMEvent} evt Event when clicking on button to save
     */
    onToSave(evt) {
        evt.preventDefault();

        // Hide step 2 show step 3
        let secondStepElem = this.requestor.querySelector('.swac_jsonreader_previewstep');
        secondStepElem.classList.add('swac_dontdisplay');
        let thirdStepElem = this.requestor.querySelector('.swac_jsonreader_savestep');
        thirdStepElem.classList.remove('swac_dontdisplay');

        console.log('TEST data', this.datasets);
    }

    /**
     * Executed on click on back to preview button
     * 
     * @param {DOMEvent} evt Click event
     */
    onBackToPreview(evt) {
        evt.preventDefault();

        // Hide step "save" and show step "preview"
        let secondStepElem = this.requestor.querySelector('.swac_jsonreader_savestep');
        secondStepElem.classList.add('swac_dontdisplay');
        let thirdStepElem = this.requestor.querySelector('.swac_jsonreader_previewstep');
        thirdStepElem.classList.remove('swac_dontdisplay');
    }

    /**
     * Executed on click on restart button
     * 
     * @param {DOMEvent} evt Click event
     */
    onRestart(evt) {
        evt.preventDefault();

        // Hide step "save" and show step "preview"
        let secondStepElem = this.requestor.querySelector('.swac_jsonreader_savestep');
        secondStepElem.classList.add('swac_dontdisplay');
        let thirdStepElem = this.requestor.querySelector('.swac_jsonreader_fileselectstep');
        thirdStepElem.classList.remove('swac_dontdisplay');
    }

    /**
     * Called when a collection is selected as target. Loads the available columns
     * and insert them as option.
     */
    onSelectCollection(evt) {
        evt.preventDefault();
        // Find repeated element
        let repeatedElem = evt.target;
        while (!repeatedElem.classList.contains('jsonreader_repeatedForKey') && repeatedElem.parentElement) {
            repeatedElem = repeatedElem.parentElement;
        }
        let colsElem = repeatedElem.querySelector('.swac_jsonreader_keycolection');
        let collection = colsElem.value;
        let columnsElem = repeatedElem.querySelector('.swac_jsonreader_keycolumn');
        // Remove old options
        let oldopts = columnsElem.querySelectorAll('option');
        for (let curOpt of oldopts) {
            if (curOpt.value !== 'noselection')
                curOpt.remove();
        }

        if (collection === 'noimport') {
            return;
        }

        // Get available columns for collection
        let curColRequestor = Object.assign({}, this.options.columnsRequestor);
        curColRequestor.fromName = curColRequestor.fromName.replace('[collection]', collection);

        let dataPromise = Model.load(curColRequestor);
        //TODO perfomance+ cache one time fetched columns
        dataPromise.then(function (data) {
            for (let curSet of data) {
                if (!curSet)
                    continue;
                for (let curAttr of curSet.attributes) {
                    let optElem = document.createElement('option');
                    optElem.value = curAttr.name;
                    optElem.innerHTML = curAttr.name;
                    columnsElem.appendChild(optElem);
                }
            }
        });
    }

    /**
     * Executed, when user changes the selection of a column
     */
    onSelectColumn(evt) {
        evt.preventDefault();
        let repElem = evt.target;
        while (!repElem.classList.contains('jsonreader_repeatedForKey') && repElem.parentElement) {
            repElem = repElem.parentElement;
        }

        let jpath = repElem.querySelector('.swac_jsonreader_keyname').innerHTML;
        let collection = repElem.querySelector('.swac_jsonreader_keycolection').value;
        let column = repElem.querySelector('.swac_jsonreader_keycolumn').value;

        // Get config json
        let cjsonElem = this.requestor.querySelector('.swac_jsonreader_configtext');
        let cjson;
        if (cjsonElem.innerHTML !== '') {
            cjson = JSON.parse(cjsonElem.innerHTML);
        } else {
            cjson = [];
        }

        // Search if a entry exists
        let found = false;
        for (let curEntry of cjson) {
            if (curEntry.path && curEntry.path === jpath) {
                curEntry.collection = collection;
                curEntry.dbcolumn = column;
                found = true;
            }
        }
        // If not existend create
        if (!found) {
            cjson.push({
                path: jpath,
                collection: collection,
                dbcolumn: column
            });
        }

        cjsonElem.innerHTML = JSON.stringify(cjson, null, 2);

        // Update code in save button
        let saveconfBtn = this.requestor.querySelector('.swac_jsonreader_saveconf');
        saveconfBtn.setAttribute('href', 'data:text/csv;charset=utf-8,' + escape(cjsonElem.innerHTML));
    }

    /**
     * Executed when the user clicks the save start button
     * 
     * @param {DOMEvent} evt Click event
     */
    onSaveStart(evt) {
        evt.preventDefault();

        // Get the model
        let Model = window.swac.Model;

        let saveproms = [];
        // Save to datasources
        for (let curSource in this.datasets) {
            // Build dataCapsule
            let dataCapsule = {
                fromName: curSource
            };
            dataCapsule.data = this.datasets[curSource];

            // Request save (returns promise)
            saveproms.push(Model.save(dataCapsule, true));
        }

        Promise.all(saveproms).then(function () {
            console.log('TEST suc', SWAC.lang.dict);
            UIkit.modal.alert(SWAC.lang.dict.JsonReader.save_succsessfull);
        }).catch(function (e) {
            console.log('TEST error', SWAC.lang.dict);
            UIkit.modal.alert(SWAC.lang.dict.JsonReader.save_failed);
        });

    }
}


