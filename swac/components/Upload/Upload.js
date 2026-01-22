import SWAC from '../../swac.js';
import View from '../../View.js';
import Msg from '../../Msg.js';
import Model from '../../Model.js';
import FileUploader from './FileUploader.js';
import LocalFilesDB from '../../storage/LocalFilesDB.js';
import LocalFile from '../../storage/LocalFile.js';
import Icon from '../Icon/Icon.js';
import InputElemTransformer from '../../InputElemTransformer.js';
import WatchableSet from '../../WatchableSet.js';

export default class Upload extends View {

    constructor(options = {}) {
        super(options);
        this.name = 'Upload';
        this.desc.text = 'Creates a dialog for uploads including drag and drop possibility, file selection and upload status view.';
        this.desc.developers = 'Florian Fehring (HSBI)';
        this.desc.license = 'GNU Lesser General Public License';

        this.desc.templates[0] = {
            name: 'upload',
            style: 'upload',
            desc: 'Creates an drag and drop able area where you can choose the file to upload and displays the status of upload above.'
        };

        this.desc.templates[1] = {
            name: 'preview',
            style: 'upload',
            desc: 'Addition to the upload template. Displays a preview of the media file to upload.'
        }
        this.desc.templates[2] = {
            name: 'single_upload',
            style: 'upload',
            desc: 'A simpler upload form for single file uploads.'
        }

        this.desc.reqPerTpl[0] = {
            selc: '.swac_upload',
            desc: 'Container where users can drop their files for upload.'
        };
        this.desc.reqPerTpl[1] = {
            selc: '.swac_fileselect',
            desc: 'Input element which allows selecting a file.'
        };
        this.desc.reqPerTpl[2] = {
            selc: '.swac_upload_progressbar',
            desc: 'Progressbar element where to display the upload progress.'
        };
        this.desc.reqPerTpl[3] = {
            selc: '.swac_upload_status',
            desc: 'Table element where status information about uploads are displayed.'
        };

        this.desc.optPerTpl[0] = {
            selc: '.swac_upload_doBtn',
            desc: 'Button to start the upload process manually.'
        };
        this.desc.optPerTpl[1] = {
            selc: '.swac_upload_ClrBtn',
            desc: 'Button to clear all files for upload in queue.'
        };
        this.desc.optPerTpl[2] = {
            selc: '.swac_upload_removeBtn',
            desc: 'Button to remove all files from upload queue.'
        };
        this.desc.optPerTpl[3] = {
            selc: '.swac_upload_preview',
            desc: 'Area where previews of the upload files are displayed.'
        };


        this.desc.reqPerSet[0] = {
            name: 'id',
            desc: 'The id of the upload, maybe positive (for allready uploaded files) or negative (for only local available files)'
        };
        this.desc.reqPerSet[1] = {
            name: 'type',
            desc: 'Mimetype of the file.'
        };
        this.desc.reqPerSet[2] = {
            name: 'state',
            desc: 'State of the file. Either one of local or uploaded.'
        };
        this.desc.reqPerSet[3] = {
            name: 'title',
            desc: 'Upload files title.'
        };


        if (!options.showWhenNoData)
            this.options.showWhenNoData = true;
        this.desc.opts[0] = {
            name: 'multiple',
            desc: 'If true more than one file can be selected at once'
        };
        if (!options.multiple)
            this.options.multiple = true;
        this.desc.opts[1] = {
            name: "uploadTargetURL",
            desc: "Address of the REST-Interface accepting file uploads",
            example: '/SmartFile/smartfile/file/MYFILESPACE'
        };
        if (!options.uploadTargetURL)
            this.options.uploadTargetURL = null;
        this.desc.opts[2] = {
            name: "uploadTargetVar",
            desc: "Name of the variable the file content should be send to"
        };
        if (!options.uploadTargetVar)
            this.options.uploadTargetVar = 'file';
        this.desc.opts[3] = {
            name: "dataComponents",
            desc: "Datacomponents are components (swac components) wich data should be send along with the file upload. To add datacomponents specify objects with selector = a css selector required = true or false if required or not requiredMessage = Message to show when required data is not given requiredGt = Value should be grather then (gt)",
            example: [{
                    selector: '#example2_select',
                    sendAttribute: 'selection',
                    required: true,
                    requiredMessage: 'Please choose a target',
                    requiredGt: 0,
                    requiredGtMessage: 'The target must be greater than 0.'
                }]
        };
        if (!options.dataComponents)
            this.options.dataComponents = [];
        this.desc.opts[4] = {
            name: "processingHandlersApi",
            desc: "Address of the REST-Interface where to find the handlers for files"
        };
        if (!options.processingHandlersApi)
            this.options.processingHandlersApi = 'fileprocessing/getHandlersForFile';
        this.desc.opts[5] = {
            name: "processingExecutionApi",
            desc: "Address of the REST-Interface where to send files for processing"
        };
        if (!options.processingExecutionApi)
            this.options.processingExecutionApi = 'fileprocessing/process';
        this.desc.opts[6] = {
            name: "smartDataPorter",
            desc: "Can be used to send uploaded files to a SmartDataPorter instance after the upload.\n filespaceURL: URL to the filespace where the file will be uploaded.\n config: body that will be sent to the SmartDataPorter instance.",
            example: {
                filespaceURL: '/SmartFile/smartfile/',
                config: {
                    importer: 'FileImporter',
                    parser: 'JSONParser'
                }
            }
        };
        if (!options.smartDataPorter)
            this.options.smartDataPorter = null;
        // =============

        this.desc.opts[7] = {
            name: "autoUpload",
            desc: "Auto upload on page load"
        };
        if (typeof options.autoUpload === 'undefined')
            this.options.autoUpload = false;

        this.desc.opts[8] = {
            name: "dbname",
            desc: "Database name for indexedDB"
        };
        if (typeof options.dbname === 'undefined')
            this.options.dbname = false;

        this.desc.opts[9] = {
            name: "objectstorename",
            desc: "Object store name for indexedDB"
        };
        if (typeof options.objectstorename === 'undefined')
            this.options.objectstorename = false;

        this.desc.opts[10] = {
            name: 'uploadresultview',
            desc: 'Show recived json answer in a table.'
        };
        if (typeof options.uploadresultview === 'undefined')
            this.options.uploadresultview = true;

        this.desc.opts[11] = {
            name: 'uploadresultcollection',
            desc: 'Collection where to save the upload result data. If not given saveing upload result is deactivated.'
        };
        if (!typeof options.uploadresultcollection)
            this.options.uploadresultcollection = null;

        this.desc.opts[12] = {
            name: 'camcapture',
            desc: 'If true users have the possibility to capture photo or video over a dialog.'
        };
        if (typeof options.camcapture === 'undefined')
            this.options.camcapture = false;

        this.desc.events[0] = {
            name: 'swac_REQUESTOR_ID_uploaded',
            desc: 'Event fired when a file was succsessfully uploaded.',
            data: 'Delivers the response recived from upload endpoint (as JSON).'
        }

        // Definition of available plugins
        if (!options.plugins) {
            this.options.plugins = new Map();
        }

        // Internal values
        this.preconditionsGiven = false;
        this.processId = null;
        this.uploadURL = null;
        this.files = [];     // Storage for file informations
        this.uploadFile = 0; // Number fo the file currently uploaded
        this.selectedFile = null;   // Storage for selected files selected with select dialog

        this.filesdb = null; //Storage for all uploadfiles
        this.fileuploader = null;   // Object used for file uploading
        this.newFiles = [];  // Storage for new files
        this.currentDeviceStream = null; // Stream from connected device
        this.deviceRecorder = null; // Object for recording purposes
    }

    init() {
        let thisRef = this;
        return new Promise((resolve, reject) => {
            if (!this.options.uploadTargetURL) {
                Msg.error('upload',
                        'There is no uploadTargetURL specified in options. Upload will not work.',
                        this.requestor);
                resolve();
                return;
            }

            let dbname = this.options.dbname ? this.options.dbname : 'upload';
            let storeobjectname = this.options.storeobjectname ? this.options.storeobjectname : 'files';

            // Initilize filesDB
            this.filesdb = new LocalFilesDB(dbname, storeobjectname);
            this.fileuploader = new FileUploader(thisRef);

            // Activate multiple mode if wanted
            if (this.options.multiple) {
                let inputElem = this.requestor.querySelector('.swac_fileselect');
                inputElem.setAttribute('multiple', '');
            }

            // Add event listener for click on capture mode
            let camcapturelinkElem = this.requestor.querySelector('.swac_upload_camcapture_link');
            if (this.options.camcapture && camcapturelinkElem) {
                camcapturelinkElem.addEventListener('click', this.onCamcaptureStart.bind(this));
                this.updateAvailableDevices();
                let deviceListElem = this.requestor.querySelector('.swac_upload_devicelist');
                deviceListElem.addEventListener('change', this.onDeviceSelect.bind(this));
                let takePhotoElem = this.requestor.querySelector('.swack_upload_takephoto');
                takePhotoElem.addEventListener('click', this.onTakePhoto.bind(this));
                let capVideoElem = this.requestor.querySelector('.swac_upload_capvideo');
                capVideoElem.addEventListener('click', this.onCaptureVideo.bind(this));
            } else if (camcapturelinkElem) {
                camcapturelinkElem.remove();
            }

            // Note new files
            this.newFiles = [];
            console.log('TEST multiple: ' + this.options.multiple);
            const uploader = UIkit.upload('#' + this.requestor.id + ' .swac_upload', {
                allow: "*.*", // Note: Limitations are not working here (user becomes no message)
                url: this.options.uploadTargetURL,
                multiple: this.options.multiple,

                beforeAll: function (p) {
                    // Add file to local storage
                    for (let curFile of arguments[1]) {
                        let curLocalFile = new LocalFile(curFile);
                        try {
                            let sendAlongData = thisRef.getSendAlongData();
                            if (sendAlongData) {
                                thisRef.filesdb.addFile(curLocalFile, sendAlongData).then(
                                        function (fileObj) {
                                            thisRef.newFiles.push(fileObj);
                                            fileObj.id = fileObj.localdb_key * -1;
                                            thisRef.addSet('LocalFilesDB', fileObj);

                                            if (thisRef.options.autoUpload) {
                                                thisRef.uploadFiles();
                                            }
                                        });
                            }
                        } catch (error) {
                            Msg.error('Upload', 'Error before uploading: ' + error);
                            UIkit.notification({
                                message: SWAC.lang.dict.Upload.preuploaderror,
                                status: 'danger',
                                pos: 'top-center',
                                timeout: SWAC.config.notifyDuration
                            });
                        }
                    }

//                    // Reset upload file counter
//                    this.uploadFile = 0;
//                    // Reset data to send along
//                    let sendAlongData = thisRef.getSendAlongData(thisRef.requestor);
//                    this.uploadURL = null;
//                    // Build up url
//                    this.uploadURL = SWAC.config.datasources[0].replace('[fromName]', thisRef.options.uploadtarget);
//                    // add aditional date to request
//                    if (typeof sendAlongData !== 'undefined') {
//                        let i = 0;
//                        for (let alongData of sendAlongData) {
//                            if (i === 0) {
//                                thisRef.uploadURL += "?";
//                            } else {
//                                thisRef.uploadURL += "&";
//                            }
//                            i++;
//                            thisRef.uploadURL += alongData.name + "=" + alongData.value;
//                        }
//                    }
//
//                    thisRef.preconditionsGiven = true;
//                    // If a file was selected by select dialog
//                    if (thisRef.selectedFile !== null) {
//                        thisRef.files.push(thisRef.selectedFile);
//                        thisRef.selectedFile = null;
//                    } else {
//                        thisRef.files = arguments[1];
//                    }

//                    if (!thisRef.options.uploadURL.includes('create?ooid=')) {
//                        return;
//                    }

                    // Create status entry for each file
//                    let uploadid = Date.now();
//                    for (let file of thisRef.files) {
//                        file.uploadid = uploadid++;
//                        thisRef.generateStatusTR(file);
//                    }
                }
                ,
                beforeSend: function (p) {
//                    console.log('beforeSend');
//                    console.log(p);
                },
                loadStart: function (p) {
//                    console.log('loadStart:');
//                    console.log(p);
                },
                load: function (p) {
//                    console.log('load');
//                    console.log(p);
//                    // Add uploadId to uploadURL
//                    let uploadURL;
//                    // Create formdata to send
//                    let fileData = new FormData();
//                    if (this.preconditionsGiven && this.files !== null) {
//                        let uploadFile = this.files[this.uploadFile];
//                        fileData.append('file', uploadFile);
//                        this.uploadFile++;
//
//
//                        if (!this.uploadURL.includes('?')) {
//                            uploadURL = this.uploadURL + "?uploadid=" + uploadFile.uploadid;
//                        } else {
//                            uploadURL = this.uploadURL + "&uploadid=" + uploadFile.uploadid;
//                        }
//                    }
//
//
//
//
//                    if (!this.uploadURL.includes('create?ooid=')) {
//                        return;
//                    }
                },
                complete: function (xhr) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        document.dispatchEvent(new CustomEvent('swac_' + thisRef.requestor.id + '_uploaded', {detail: response}))
                    } catch (e) {
                        console.error('Antwort ist kein gültiges JSON:', xhr.responseText);
                    }
                },

                progress: function (p) {
//                    console.log('progress');
//                    console.log(p);
                },
                loadEnd: function (p) {
//                    console.log('loadEnd');
//                    console.log(p);
                },
                completeAll: function (p) {
//                    console.log('completeAll');
//                    console.log(p);
                    // Empty newFiles
                    this.newFiles = [];
                },
                error: function (error) {
                    Msg.error('Upload', 'Error while uploading: ' + error, thisRef.requestor);
                }
            });

            // Get files in localDB
            this.filesdb.listFiles().then(function (files) {
                // Create status info for each file
                let i = 0;
                for (let curFileObj of files) {
                    i++;
                    curFileObj.swac_setid = i;
                    curFileObj.id = curFileObj.localdb_key * -1;
                    thisRef.addSet('LocalFilesDB', curFileObj);
                }
                // Upload stored local files if there is no OnlineReaction
                if (typeof UploadOnReact !== 'function' && thisRef.options.autoUpload) {
                    thisRef.uploadFiles();
                }
            });

            // Register upload on click function if button is available
            let upDoBtn = this.requestor.querySelector('.swac_upload_doBtn');
            if (upDoBtn) {
                upDoBtn.onclick = (evt) => {
                    evt.preventDefault();
                    thisRef.uploadFiles();
                };
            }

            // Register clear files on click function if button is available
            let upClrBtn = this.requestor.querySelector('.swac_upload_ClrBtn');
            if (upClrBtn) {
                upClrBtn.onclick = (evt) => {
                    evt.preventDefault();
                    this.filesdb.clearFiles().then(() => {
                        let resulttableElem = document.querySelector('.swac_upload_status');
                        while (resulttableElem.children.length > 1) {
                            resulttableElem.removeChild(resulttableElem.lastChild);
                        }
                        let previewElem = document.querySelector('.swac_upload_preview');
                        if (previewElem) {
                            while (previewElem.children.length > 0) {
                                previewElem.removeChild(previewElem.lastChild);
                            }
                        }
                    });
                };
            }

            // DISPLAY HELP IF SET TO SEND TO SmartDataPorter

            let help_container = this.requestor.querySelector('#help_container');
            let sdpOpt = this.options.smartDataPorter;
            if (sdpOpt)
            {
                let elem_p1 = document.createElement('p');
                elem_p1.innerHTML = 'SmartDataPorter';
                elem_p1.classList.add('uk-text-lead');

                let elem_format_table = this.createTableElement([], [
                    ['URL', `<a href="${sdpOpt.smartDataPorterURL}">${sdpOpt.smartDataPorterURL}</a>`],
                    ['Storage (Schema)', sdpOpt.config.storage],
                    ['Collection (Tabelle)', sdpOpt.config.collection],
                    ['Parser', sdpOpt.config.parser]
                ], ['uk-table-hover']);

                help_container.appendChild(elem_p1);
                help_container.appendChild(elem_format_table);

                if (sdpOpt.config.parser === 'CSVParser')
                {
                    let elem_csv_options = document.createElement('p');
                    elem_csv_options.innerHTML = 'CSVParser-Optionen';
                    elem_csv_options.classList.add('uk-text-lead');

                    let elem_csv_p1 = document.createElement('p');
                    elem_csv_p1.innerHTML = 'Beachte, dass die erste Zeile der CSV-Datei ignoriert wird.';

                    help_container.appendChild(elem_csv_options);
                    help_container.appendChild(elem_csv_p1);

                    help_container.appendChild(this.createTableElement([], [
                        ['Trennzeichen', sdpOpt.config['csv.delimiter']]
                    ], ['uk-table-hover'], {
                        rowClasses: [
                            ['uk-table-shrink']
                        ]
                    }));

                    let elem_csv_p2 = document.createElement('p');
                    elem_csv_p2.innerHTML = 'Mapping von CSV zu Datenbank, spaltenweise:';
                    help_container.appendChild(elem_csv_p2);

                    let rows = [
                        ['Datenbankspalte'],
                        ['Datentyp in CSV']
                    ];
                    for (const mapping of sdpOpt.config['csv.mapping']) {
                        rows[0].push(mapping.db_column);
                        rows[1].push(mapping.type);
                    }
                    help_container.appendChild(this.createTableElement([], rows, ['uk-table-hover'], {
                        rowClasses: [
                            ['uk-table-shrink'], ['uk-table-shrink'], ['uk-table-expand']
                        ]
                    }));
                }
            }

            resolve();
        });
    }

    /**
     * Add a file to the upload comp
     * @param {File} file
     */
    addFile(file) {
        const thisRef = this;
        let curLocalFile = new LocalFile(file);
        try {
            let sendAlongData = this.getSendAlongData();
            if (sendAlongData) {
                this.filesdb.addFile(curLocalFile, sendAlongData).then(
                        function (fileObj) {
                            thisRef.newFiles.push(fileObj);
                            fileObj.id = fileObj.localdb_key * -1;
                            thisRef.addSet('LocalFilesDB', fileObj);

                            if (thisRef.options.autoUpload) {
                                thisRef.uploadFiles();
                            }
                        });
            }
        } catch (error) {
            Msg.error('Upload', 'Error before uploading: ' + error);
            UIkit.notification({
                message: SWAC.lang.dict.Upload.preuploaderror,
                status: 'danger',
                pos: 'top-center',
                timeout: SWAC.config.notifyDuration
            });
        }

    }

    /**
     * 
     * @param {string[]} headers
     * @param {string[][]} rows
     * @param {string[]} classes
     * @param {Object} options
     */
    createTableElement(headers, rows, classes, options)
    {
        if (!options)
        {
            options = {};
            if (!options.headerClasses)
                options.headerClasses = [];
            if (!options.rowClasses)
                options.rowClasses = []; // This is user for EVERY row
        }
        const createRow = (row, cellElem, classes) => {
            let elem_row = document.createElement('tr');
            let elem_cell;
            for (const [columnIndex, cellText] of row.entries()) {
                elem_cell = document.createElement(cellElem);
                elem_cell.innerHTML = cellText;
                if (classes[columnIndex])
                {
                    elem_cell.classList.add(...classes[columnIndex]);
                }
                elem_row.appendChild(elem_cell);
            }
            return elem_row;
        };

        let elem_table = document.createElement('table');
        let elem_head = document.createElement('thead');
        let elem_body = document.createElement('tbody');

        elem_head.appendChild(createRow(headers, 'th', options.headerClasses));

        for (const row of rows) {
            elem_body.appendChild(createRow(row, 'td', options.rowClasses));
        }

        elem_table.appendChild(elem_head);
        elem_table.appendChild(elem_body);

        elem_table.classList.add('uk-table', 'uk-table-divider');
        elem_table.classList.add(...classes);

        return elem_table;
    }

    /**
     * Uploads all files from locale database
     * 
     * @returns {undefined}
     */
    uploadFiles() {
        // Disable upload button
        let upDoBtn = this.requestor.querySelector('.swac_upload_doBtn');
        if (upDoBtn) {
            upDoBtn.disabled = true;
        }

        let thisRef = this;
        // Get files in localDB
        this.filesdb.searchFiles('state', 'local').then(function (files) {

            let uploadPromises = [];
            Msg.flow('Upload', 'Uploading ' + files.length + ' files.', thisRef.requestor);
            for (let curFile of files) {
                if (curFile.state === 'local') {
                    let uploadProm = thisRef.fileuploader.uploadFile(curFile);
                    uploadPromises.push(uploadProm);
                    // Set uploading state to file dom elem
                    let fileElem = thisRef.requestor.querySelector('[swac_setid="' + (curFile.localdb_key * -1) + '"]');
                    fileElem.classList.add('swac_upload_uploading');
                    uploadProm.then(function (file) {
                        // Update state to uploaded
                        fileElem.classList.remove('swac_upload_uploading');
                        fileElem.classList.add('swac_upload_uploaded');
                        // Update state text
                        let stateElem = fileElem.querySelector('[attrname="state"]');
                        stateElem.innerHTML = 'uploaded';
                        // Updates local files state
                        thisRef.filesdb.updateFile(file);

                        thisRef.generateUploadResultView(file);
                    });
                }
            }
            Promise.all(uploadPromises).then(
                    function (allFiles) {
                        Msg.flow('Upload', 'All files succsessfully uploaded.', thisRef.requestor);
                        if (upDoBtn) {
                            upDoBtn.disabled = false;
                        }
                    }).catch(
                    function (error) {
                        Msg.error('Upload', 'Could not upload files: ' + error, thisRef.requestor);
                        if (upDoBtn) {
                            upDoBtn.disabled = false;
                        }
                    }
            );
        });
    }

    /** Process the upload result and show json values in table
     * 
     */
    generateUploadResultView(file) {
        if (!this.options.uploadresultview)
            return;
        file.swac_fromName = this.options.uploadresultcollection ? this.options.uploadresultcollection : 'temp';

        let resTplElem = this.requestor.querySelector('.swac_upload_forUpload');
        let resElem = resTplElem.cloneNode(true);
        resTplElem.parentElement.appendChild(resElem);
        resElem.classList.remove('swac_dontdisplay');
        resElem.setAttribute('swac_fromName', file.swac_fromName);
        let fileSet = new WatchableSet(file);
        let transformer = new InputElemTransformer(this, this.options.definitions);
        transformer.modifyInputArea(resElem, fileSet);
        // Add save button action
        let saveBtn = resElem.querySelector('.swac_upload_result_savebtn');
        if (!this.options.uploadresultcollection)
            saveBtn.remove();
        else
            saveBtn.addEventListener('click', this.onClickSaveResult.bind(this));
    }

    onClickSaveResult(evt) {
        // Collect data
        let data = {};
        let fromName = evt.target.parentElement.getAttribute('swac_fromName');
        let inputElems = evt.target.parentElement.querySelectorAll('input');
        let id = null;
        for (let curInputElem of inputElems) {
            if (curInputElem.name === '{attrName}')
                continue;
            data[curInputElem.name] = curInputElem.getValue();
            if (curInputElem.name === 'id')
                id = curInputElem.getValue();
        }

        if (id)
            fromName += "/" + id;

        // Create dataCapsule and save
        let dataCapsule = {
            fromName: fromName,
            data: [data]
        };
        Model.save(dataCapsule, true).then().catch(function (err) {
            console.error('Error saveing stat: ' + err);
        });
    }

    afterAddSet(set, repeateds) {
        for (let curRepeated of repeateds) {
            // Get name bindpoint
            let nameElem = curRepeated.querySelector('[attrname="title"]');
            if (!nameElem)
                continue;

            // Create icon for type
            let icon = new Icon();
            let upFileIco = icon.getIconElement(set.type);
            nameElem.parentNode.insertBefore(upFileIco, nameElem);
            // Create background color for state
            if (set.state === 'uploaded') {
                curRepeated.classList.add('swac_upload_uploaded');
            }
            nameElem.oninput = (evt) => {
                evt.preventDefault()
                this.filesdb.updateFile({
                    id: set.id,
                    filename: set.filename,
                    title: set.title,
                    lastModified: set.lastModified,
                    size: set.size,
                    type: set.type,
                    dataURL: set.dataURL,
                    targetURL: set.targetURL,
                    targetVar: set.targetVar,
                    state: set.state,
                    localdb_key: set.localdb_key,
                });
                // Update preview title
                if (previewElement)
                    previewElement.querySelector('.title').innerHTML = set.title;
            }
        }

        //Preview
        let previewElement = null;
        const parentPreviewElement = this.requestor.querySelector('.swac_upload_preview');
        if (parentPreviewElement) {
            previewElement = this.createPreviewElement(set);
            if (previewElement)
                parentPreviewElement.appendChild(previewElement);
        }

        // register remove button
        let removeBtn = this.requestor.querySelector('[swac_setid="' + set.id + '"] .swac_upload_removeBtn');
        if (removeBtn) {
            removeBtn.onclick = (evt) => {
                evt.preventDefault();
                this.filesdb.deleteFile(set)
                        .then((file) => {
                            this.requestor.querySelector('[swac_setid="' + set.id + '"]').remove();
                            // Remove preview element
                            if (previewElement)
                                previewElement.remove();
                        })
            }
        }
    }

    /**
     * Generates an status table row for the given uploaded file information
     * 
     * @param {String} upFile File informations about uploaded file
     * @returns {undefined}
     */
    generateStatusTR(upFile) {
        Msg.warn('upload', 'Generate statusTR for uploadid: ' + upFile.uploadid);
        let resulttableElem = document.querySelector('.swac_upload_status');
        // Check if a old status exists
        let oldResultTR = resulttableElem.querySelector('#status_' + upFile.uploadid);
        if (oldResultTR !== null) {
            oldResultTR.parentNode.removeChild(oldResultTR);
        }

        // Create new row
        let statusTR = document.createElement("tr");
        statusTR.setAttribute("id", "status_" + upFile.uploadid);
        statusTR.upFile = upFile;
        resulttableElem.appendChild(statusTR);

        // file icon and name
        let upFileTD = document.createElement("td");
        // get mime type
        let mimetype = upFile.mimetype;
        if (typeof mimetype === 'undefined') {
            mimetype = upFile.type;
        }
        // get file icon
        let upFileIco = SWAC_icon.getIconElement(mimetype);
        upFileTD.appendChild(upFileIco);
        // File name
        let filename = upFile.filename;
        if (typeof filename === 'undefined') {
            filename = upFile.name;
        }

        let filenameElem = document.createTextNode(' ' + filename);
        // Add download link if was saved
        if (upFile.saved && typeof upFile.savePath !== 'undefined') {
            let fileLink = document.createElement('a');
            let outFilePath = upFile.savePath.replace('..\\docroot', '') + '\\' + upFile.filename;
            fileLink.setAttribute('href', outFilePath);
            fileLink.appendChild(filenameElem);
            upFileTD.appendChild(fileLink);
        } else {
            upFileTD.appendChild(filenameElem);
        }
        statusTR.appendChild(upFileTD);
        // Get upload status
        let fileUploaded = false;
        if (typeof upFile.filename !== 'undefined') {
            fileUploaded = true;
        }

        // Status cell
        let statusTD = document.createElement('td');
        statusTD.classList.add('statustd');
        // Uploaded icon
        let uploadedIcon = document.createElement("span");
        uploadedIcon.setAttribute("uk-icon", 'cloud-upload');
        if (fileUploaded) {
            uploadedIcon.setAttribute("uk-tooltip", 'title: ' + SWAC.lang.dict.upload.toupload);
            uploadedIcon.setAttribute('style', 'color: green');
        } else {
            uploadedIcon.setAttribute("uk-tooltip", 'title: ' + SWAC.lang.dict.upload.uploaded);
        }
        statusTD.appendChild(uploadedIcon);
        // Saved icon
        if (fileUploaded && upFile.saved) {
            let uploadedIcon = document.createElement("span");
            uploadedIcon.setAttribute("uk-icon", 'download');
            uploadedIcon.setAttribute("uk-tooltip", 'title: ' + SWAC.lang.dict.upload.saved);
            uploadedIcon.setAttribute('style', 'color: green');
            statusTD.appendChild(uploadedIcon);
        } else if (fileUploaded) {
            let uploadedIcon = document.createElement("span");
            uploadedIcon.setAttribute("uk-icon", 'download');
            uploadedIcon.setAttribute("uk-tooltip", 'title: ' + SWAC.lang.dict.upload.notsaved);
            uploadedIcon.setAttribute('style', 'color: red');
            statusTD.appendChild(uploadedIcon);
        }
        statusTR.appendChild(statusTD);

        // Add processing information
        let processingTD = document.createElement('td');
        processingTD.classList.add('processingtd');
        statusTR.appendChild(processingTD);

        if (fileUploaded && upFile.processed) {
            this.generateProcessingResultView(upFile);
        } else if (fileUploaded && upFile.fileHandlers !== null && typeof upFile.error === 'undefined') {
            if (upFile.fileHandlers.length === 0) {
                processingTD.innerHTML = SWAC.lang.dict.upload.noprocessoravailable;
            } else {
                // Create selection for processors
                let newProcessingTD = this.generateProcessingSelection(upFile.fileHandlers);
                processingTD.parentNode.replaceChild(newProcessingTD, processingTD);
            }
        } else if (fileUploaded && upFile.fileHandlers === null && typeof upFile.error === 'undefined') {
            // Request processing possibilities
            let posRequestor = {
                fromName: this.options.processingHandlersApi,
                fromWheres: {
                    savepath: upFile.savePath,
                    filename: upFile.filename
                }
            };
            Model.load(posRequestor).then(function (processors) {
                newProcessingTD = this.generateProcessingSelection(processors);
                processingTD.parentNode.replaceChild(newProcessingTD, processingTD);
            }).catch(function (error) {
                console.log('catched error: ' + error);
            });
        } else if (typeof upFile.error !== 'undefined') {
            // Create error symbol
            // Create error text
            let errTxt = document.createTextNode(SWAC.lang.dict.upload.notprocessed);
            processingTD.appendChild(errTxt);
            processingTD.appendChild(document.createElement('br'));
            let errMsg = document.createTextNode(upFile.error);
            processingTD.appendChild(errMsg);
        } else {
            if (!navigator.onLine)
            {
                //TODO check why this is not displayed and change to us language entry
                let errTxt = document.createTextNode("Die Datei wurde erfolgreich gespeichert und wird automatisch hochgeladen, sobald wieder eine Netzwerkverbindung zur Verfügung steht.");
                processingTD.appendChild(errTxt);
            }
        }

        // Get old status row
        let statusId = 'status_' + upFile.uploadid;
        let oldStatusTR = document.getElementById(statusId);
        if (typeof oldStatusTR !== 'undefined' && oldStatusTR !== null) {
            // Update status
            oldStatusTR.parentElement.replaceChild(statusTR, oldStatusTR);
        }

        // List files got from output of file processor
        if (typeof upFile.outputFiles !== 'undefined') {
            for (let i = 0; i < upFile.outputFiles.length; i++) {
                let outputfile = upFile.outputFiles[i];
                outputfile.uploadid = upFile.uploadid + '_' + i;
                let subStatusTR = this.generateStatusTR(outputfile);
                // Add ident
                let firstTD = subStatusTR.querySelector('td');
                let firstChildOfTD = firstTD.firstChild;
                let identSpan = document.createElement('div');
                identSpan.classList.add('swac_upload_ident');
                firstTD.insertBefore(identSpan, firstChildOfTD);
                statusTR.parentNode.insertBefore(subStatusTR, statusTR.nextSibling);
            }
        }
        return statusTR;
    }

    /**
     * Creates a select box with all possible processors.
     * 
     * @param {type} processors Array of Objects with name and description attribute
     * @returns {Element|this.generateProcessingSelection.processingTD}
     */
    generateProcessingSelection(processors) {
        let processingTD = document.createElement('td');
        processingTD.classList.add('processingtd');
        let selectProcessorInfoElem = document.createTextNode(
                SWAC.lang.dict.upload.canbeprocessedby + " ");
        processingTD.appendChild(selectProcessorInfoElem);
        let selectProcessorElem = document.createElement('select');
        selectProcessorElem.classList.add('uk-select');
        selectProcessorElem.classList.add('uk-form-small');
        selectProcessorElem.classList.add('uk-form-width-small');
        for (let processor of processors) {
            let processorElem = document.createElement('option');
            processorElem.setAttribute('value', processor.name);
            processorElem.innerHTML = processor.name;
            processorElem.setAttribute('uk-tooltip', processor.description);
            selectProcessorElem.appendChild(processorElem);
        }
        processingTD.appendChild(selectProcessorElem);

        // Start processing button
        let startProcessingButton = document.createElement('button');
        startProcessingButton.classList.add('uk-button');
        startProcessingButton.classList.add('uk-button-default');
        startProcessingButton.classList.add('uk-form-small');
        startProcessingButton.setAttribute('uk-tooltip',
                SWAC.lang.dict.upload.startprocessing);
        let startProcessingIco = document.createElement('span');
        startProcessingIco.setAttribute('uk-icon', 'icon: cog');
        startProcessingButton.appendChild(startProcessingIco);
        startProcessingButton.addEventListener('click', this.onStartProcessing);
        processingTD.appendChild(startProcessingButton);
        return processingTD;
    }

    /**
     * Gets the actual data to send along with every request
     * 
     * @returns {Array} Array of dataobject to send with
     */
    getSendAlongData() {
        let sendAlongData = {};
        // Add information about target
        sendAlongData['targetURL'] = this.options.uploadTargetURL;
        sendAlongData['targetVar'] = this.options.uploadTargetVar;

        // Get values of bound SWAC components
        for (let curComp of this.options.dataComponents) {
            Msg.warn('Upload', 'Getting sendAlongData from >' + curComp.selector + '<');
            let curCompElem = document.querySelector(curComp.selector);
            // Check if comp is available
            if (!curCompElem) {
                let msg = 'Could not find component with sendAlongData >'
                        + curComp.selector + '<';
                Msg.error('Upload',
                        msg, this.requestor);
                throw msg;
            }
            // If it is a SWAC component get value
            if (curCompElem.hasAttribute("swa")) {
                let inputs = curCompElem.swac_comp.getInputs();
                if (inputs.length > 0) {
                    // Check if data to send with allowed
                    for (let valueObj in inputs) {
                        if (typeof curComp.requiredGt !== 'undefined'
                                && inputs[valueObj].value <= curComp.requiredGt) {
                            UIkit.modal.alert(curComp.requiredGtMessage);
                            return;
                        } else {
                            // Get name for sending
                            let attrName = curComp.sendAttribute;
                            if (!attrName) {
                                attrName = inputs[valueObj].name;
                            }
                            sendAlongData[attrName] = inputs[valueObj].value;
                        }
                    }
                } else if (curComp.required) {
                    UIkit.modal.alert(curComp.requiredMessage);
                    return;
                }
            } else {
                // Reading data from simple form fields
                let value = curCompElem.value;
                if (curCompElem.required &&
                        (value === "" || value === null)) {
                    let reqMsg = curComp.requiredMessage;
                    if (!reqMsg) {
                        reqMsg = SWAC.lang.dict.Upload.addatamissing;
                    }
                    UIkit.modal.alert(reqMsg);
                    return;
                }
                if (curCompElem.name === 'name') {
                    Msg.warn('Upload', 'You used an imput field >name< for sendAlongData. This will override the filename.');
                }
                sendAlongData[curCompElem.name] = value;
            }
        }
        return sendAlongData;
    }

    /**
     * Starts the processing of one file.
     * 
     * @param {DOMEvent} evt Event that starts the processing
     * @returns {undefined}
     */
    onStartProcessing(evt) {
        evt.preventDefault();

        // Search td element
        let selectParentElem = evt.target.parentElement;
        while (typeof selectParentElem.parentElement !== 'undefined'
                && selectParentElem.tagName.toLowerCase() !== 'td') {
            selectParentElem = selectParentElem.parentElement;
        }

        // Get status TR Element that stores file information
        let statusTRElem = selectParentElem.parentElement;
        let uploadid = statusTRElem.id;
        uploadid = uploadid.replace('status_', '');
        // Show processing icon
        this.generateProessingIcon(uploadid);

        // Get select elemet for processor
        let selectProcessorElem = selectParentElem.querySelector('select');
        let processor = selectProcessorElem.options[selectProcessorElem.selectedIndex].value;
        let sendalongData = this.getSendAlongData(this.requestor);

        // Build up datarequestor
        let dataRequestor = {
            fromName: this.options.processingExecutionApi,
            fromWheres: {
                savepath: statusTRElem.upFile.savePath,
                filename: statusTRElem.upFile.filename,
                filehandler: processor,
                uploadid: uploadid
            }
        };
        for (let sendalongobj of sendalongData) {
            dataRequestor.fromWheres[sendalongobj.name] = sendalongobj.value;
        }

        Model.load(dataRequestor).then(function (json) {
            this.generateProcessingResultView(json.data[0]);
        }).catch(function (error) {
            console.log('error:');
            console.log(error);
        });
    }

    /**
     * Generates a view out of a processing result
     * @param {Object} processedfile Object with fileinformation and processinformation
     * @returns {undefined}
     */
    generateProcessingResultView(processedfile) {
        let uploadid = processedfile.uploadid;
        Msg.warn('upload', 'Create processingResultView for uploadid: ' + uploadid);
        // Insert processed icon
        if (processedfile.processed) {
            this.generateProcessedIcon(uploadid);
        }
        let statusTR = document.getElementById('status_' + uploadid);
        let processingTD = statusTR.querySelector('.processingtd');
        let resultsAcord = document.createElement('ul');
        resultsAcord.setAttribute('uk-accordion', 'true');
        resultsAcord.classList.add('uk-accordion-default');
        // Add information about each fileHandler and its status
        let i = 0;
        for (let curFileHandler of processedfile.fileHandlers) {
            let resLi = document.createElement('li');
            let headA = document.createElement('a');
            headA.classList.add('uk-accordion-title');
            headA.href = '#';
            let sucIco = 'close';
            let sucTxt = SWAC.lang.dict.upload.processingFailed;
            let sucCol = 'red';
            if (curFileHandler.processingSuccseed === true) {
                sucIco = 'check';
                sucTxt = SWAC.lang.dict.upload.processingSuccseed;
                sucCol = 'green';
            }
            let headsymb = document.createElement('span');
            headsymb.setAttribute('uk-icon', sucIco);
            headsymb.setAttribute('uk-tooltip', sucTxt);
            headsymb.setAttribute('style', 'color: ' + sucCol);
            headA.appendChild(headsymb);
            let headline = document.createTextNode(curFileHandler.name);
            headA.appendChild(headline);
            resLi.appendChild(headA);
            let contDiv = document.createElement('div');
            contDiv.classList.add('uk-accordion-content');
            if (i === 1) {
                resLi.classList.add('uk-open');
                i++;
            }
            resLi.appendChild(contDiv);
            let table = document.createElement('table');
            table.classList.add('uk-table');
            for (let j in curFileHandler.processingInformations) {
                let curProcInfo = curFileHandler.processingInformations[j];
                let curProcInfoAttrs = Object.keys(curProcInfo);
                let resultTR = document.createElement('tr');
                let resultNameTD = document.createElement('td');
                resultNameTD.innerHTML = curProcInfoAttrs[0];
                resultTR.appendChild(resultNameTD);
                let resultValTD = document.createElement('td');
                resultValTD.innerHTML = curProcInfo[curProcInfoAttrs[0]];
                resultTR.appendChild(resultValTD);
                table.appendChild(resultTR);
            }
            contDiv.appendChild(table);
            resultsAcord.appendChild(resLi);
        }
        processingTD.appendChild(resultsAcord);
        // Add error message
        if (typeof processedfile.error !== 'undefined') {
            let errImg = document.createElement('img');
            errImg.setAttribute('alt', SWAC.lang.dict.upload.erroroccured);
            errImg.setAttribute('src', '/SWAC/swac/components/icon/error.svg');
            errImg.setAttribute('width', '25');
            errImg.setAttribute('height', '25');
            processingTD.appendChild(errImg);
            let errMsg = document.createTextNode(processedfile.error);
            processingTD.appendChild(errMsg);
        }
    }

    /**
     * Creates a icon to show the user that the processing is going on
     * 
     * @param {String} uploadid ID of the processed file
     * @returns {undefined}
     */
    generateProessingIcon(uploadid) {
        Msg.warn('upload', 'Generate processingIcon for uploadid: ' + uploadid);
        let statusTR = document.getElementById('status_' + uploadid);
        let statusTD = statusTR.querySelector('.statustd');
        // Create icon
        let processingIcon = document.createElement("span");
        processingIcon.classList.add('swac_processing');
        processingIcon.setAttribute("uk-icon", 'cog');
        processingIcon.setAttribute("uk-tooltip", 'title: ' + SWAC.lang.dict.upload.processing);
        statusTD.appendChild(processingIcon);
    }

    /**
     * Generates a icon to show the user that the processing is done
     * 
     * @param {String} uploadid ID of the processed file
     * @returns {undefined}
     */
    generateProcessedIcon(uploadid) {
        Msg.warn('upload', 'Generate processedIcon for uploadid: ' + uploadid);
        let statusTR = document.getElementById('status_' + uploadid);
        let statusTD = statusTR.querySelector('.statustd');
        // Check if there is a processing icon
        let processingIco = statusTD.querySelector('.swac_processing');
        if (processingIco !== null) {
            processingIco.parentNode.removeChild(processingIco);
        }

        let processedIcon = document.createElement("span");
        processedIcon.setAttribute("uk-icon", 'cog');
        processedIcon.setAttribute("uk-tooltip", 'title: ' + SWAC.lang.dict.upload.processed);
        processedIcon.setAttribute('style', 'color: green');
        statusTD.appendChild(processedIcon);
    }

    showErrorMessage(msg) {
        UIkit.notification({
            message: msg,
            status: 'warning',
            pos: 'top-right',
            timeout: SWAC.config.notifyDuration
        });
    }

    /**
     * Creates a preview element to show media files that are added to the upload comp
     * @param {*} set 
     * @returns {HTMLElement}
     */
    createPreviewElement(set) {
        const media_elem = this.getMediaElement(set);
        if (!media_elem)
            return null;
        media_elem.style = 'width: 400px; height: 400px; object-fit: contain;'

        const preview_elem = document.createElement('div');
        preview_elem.style = 'width: 430px; height: 430px;'
        preview_elem.setAttribute('swac_fileid', set.localdb_key);

        const background_elem = document.createElement('div');
        background_elem.style = 'width: 430px; height: 430px; background: #f2f2f2; display: flex; flex-direction: column; justify-content: center; align-items: center; border-radius: 10px;'

        const title_elem = document.createElement('div');
        title_elem.innerText = set.title ? set.title : set.filename;
        title_elem.style = 'padding-top: 20px; text-align: center;'
        title_elem.classList.add('uk-text-bold')
        title_elem.classList.add('title')

        preview_elem.appendChild(title_elem);
        preview_elem.appendChild(background_elem);
        background_elem.appendChild(media_elem);

        return preview_elem;
    }

    /**
     * Creates the HTMLElement that is needed to present the media.
     * 
     * @returns {HTMLElement}
     */
    getMediaElement(set) {
        // Call type depending preview insertion methods
        const title = set.title ? set.title : set.filename;
        if (set.type?.indexOf('image/') > -1) {
            let imgElem = document.createElement('img');
            imgElem.classList.add(set.type);
            imgElem.src = set.dataURL;
            imgElem.title = title;
            imgElem.alt = set.name;
            return imgElem;
        }
        if (set.type?.indexOf('video/') > -1) {
            let vidElem = document.createElement('video');
            vidElem.classList.add(set.type);
            vidElem.title = title;
            vidElem.setAttribute('preload', 'metadata');
            vidElem.setAttribute('controls', 'controls');
            let sourceElem = document.createElement('source');
            sourceElem.src = set.dataURL;
            vidElem.appendChild(sourceElem);
            return vidElem;
        }
        if (set.type?.indexOf('audio/') > -1) {
            let audioElem = document.createElement('audio');
            audioElem.classList.add('swac_media_audio');
            audioElem.classList.add(set.type);
            audioElem.title = title;
            audioElem.setAttribute('preload', 'metadata');
            audioElem.setAttribute('controls', 'controls');
            let sourceElem = document.createElement('source');
            sourceElem.src = set.dataURL;
            audioElem.appendChild(sourceElem);
            return audioElem;
        }
        return null;
    }

    onCamcaptureStart() {
        Msg.flow('Upload', 'Started camcapture dialog.', this.requestor);
    }

    /**
     * Gets the available cams from browser and calls the updateDeviceList()
     */
    updateAvailableDevices() {
        let thisRef = this;
        navigator.mediaDevices.enumerateDevices().then(thisRef.updateDeviceList.bind(thisRef));
    }

    /**
     * Updates the list of known capture devices
     * 
     * @param {DOMMediaDevices} devices List of media devices
     */
    updateDeviceList(devices) {
        let deviceListElem = this.requestor.querySelector('.swac_upload_devicelist');
        // Notice until yet selected device
        let selDevice = deviceListElem.value;
        deviceListElem.innerHTML = '';
        // Create "select none" entry
        deviceListElem.appendChild(document.createElement('option'));
        let count = 1;
        // Add option for each available device
        devices.forEach(device => {
            if (device.kind === 'videoinput') {
                const option_elem = document.createElement('option');
                option_elem.value = device.deviceId;
                option_elem.textContent = device.label || `Camera ${count++}`;
                deviceListElem.appendChild(option_elem);
            }
        })
        // Reactivate prev selected device
        if (selDevice !== '') {
            deviceListElem.value = selDevice;
        }
    }

    /**
     * Executed when the user selects a capture device
     */
    onDeviceSelect() {
        let deviceListElem = this.requestor.querySelector('.swac_upload_devicelist');

        // Stop current device stream if there is one
        if (this.currentDeviceStream) {
            this.currentDeviceStream.getTracks().forEach(track => {
                track.stop();
            });
        }

        // Build media constraints
        let mediaConstr = {
            video: {},
            audio: false
        };
        if (deviceListElem.value == '') {
            // No device selection
            mediaConstr.video.facingMode = 'environment';
        } else {
            // Find device with id
            mediaConstr.video.deviceId = {exact: deviceListElem.value};
        }

        let prevElem = this.requestor.querySelector('.swac_upload_preview');
        // Show connecting symbol
        const spinner = document.createElement('div');
        spinner.setAttribute('uk-spinner', 'ratio: 4.5');
        prevElem.appendChild(spinner);
        // Connect to device
        navigator.mediaDevices.getUserMedia(mediaConstr)
                .then(stream => {
                    spinner.remove();
                    this.currentStream = stream;
                    prevElem.querySelector('video').srcObject = stream;
                    this.deviceRecorder = new MediaRecorder(stream);
                    return navigator.mediaDevices.enumerateDevices();
                })
                .then(this.updateDeviceList.bind(this))
                .catch(err => {
                    Msg.error('Upload', 'Error accessing the media device: ' + err, this.requester)
                    UIkit.notification({
                        message: SWAC.lang.dict.Upload.device_conerror,
                        status: 'error',
                        pos: 'top-center',
                        timeout: 5000
                    });
                })
                .finally(() => {
                    spinner.remove();
                })
    }

    /**
     * Performed when user clicks on the take photo button
     */
    onTakePhoto() {
        Msg.flow('Upload', 'onTakePhoto()', this.requestor);
        let prevElem = this.requestor.querySelector('.swac_upload_preview');
        let canvasElem = prevElem.querySelector('canvas');

        const context = canvasElem.getContext('2d');
        context.drawImage(prevElem.querySelector('video'), 0, 0, canvasElem.width, canvasElem.height);
        const name = Date.now().toString() + '-picture.jpeg';
        const type = 'image/jpeg';
        canvasElem.toBlob((blob) => {
            const file = new File([blob], name, {type: type});
            this.addFile(file);
        }, 'image/jpeg');
    }

    /**
     * Perforemed when user clicks on capture video button
     */
    onCaptureVideo() {
        Msg.flow('Upload', 'onCaptureVideo()', this.requestor);
        let capVideoElem = this.requestor.querySelector('.swac_upload_capvideo');
        this.deviceRecorder.ondataavailable = (e) => {
            const name = Date.now().toString() + '-video.mp4';
            const type = 'video/mp4';
            const file = new File([e.data], name, {type: type})
            this.addFile(file);
        }
        if (this.deviceRecorder.state === 'recording') {
            this.deviceRecorder.stop();
            capVideoElem.textContent = SWAC.lang.dict.Upload.capture_video;
            UIkit.notification({
                message: SWAC.lang.dict.Upload.device_recsaved,
                status: 'sucess',
                pos: 'top-center',
                timeout: 2500
            });
        } else {
            this.deviceRecorder.start();
            capVideoElem.textContent = SWAC.lang.dict.Upload.capture_stop;
            UIkit.notification({
                message: SWAC.lang.dict.Upload.device_recstarted,
                status: 'sucess',
                pos: 'top-center',
                timeout: 2500
            });
        }
    }
}