import SWAC from '../../swac.js';
import Msg from '../../Msg.js';

/* 
 * Class for uploading files to a specific target
 */
export default class FileUploader {
    /**
     * Creates a fileUploader
     * 
     * @param {Component} component Component that uses the FileUploader
     * @param {String} targetURL URL where to send the data
     * @param {String} targetVar Name of the variable the file content should be send to
     * @returns {FileUploader}
     */
    constructor(component, targetURL, targetVar) {
        if(!component) {
            throw 'FileUploader called without giving a useing component.';
        }
        this.component = component;
        this.targetURL = targetURL;
        this.targetVar = targetVar;
    }

    /**
     * Uploads a list of files
     * 
     * @param {Object[]} files Array of file objects with at least name and content attributes
     * @param {String} targetURL URL where to send the data
     * @param {String} targetVar Name of the variable the file content should be send to
     * @returns {undefined}
     */
    uploadFiles(files, targetURL, targetVar) {
        let thisRef = this;
        return new Promise((resolve, reject) => {
            let uploadPromises = [];
            Msg.flow('FileUploader', 'Uploading ' + files.length + ' files.', thisRef.component.requestor);
            for (let curFile of files) {
                if (curFile.state === 'local') {
                    uploadPromises.push(this.uploadFile(curFile, targetURL, targetVar));
                }
            }
            Promise.all(uploadPromises).then(
                    function (allData) {
                        Msg.flow('FileUploader', 'All files succsessfully uploaded.', thisRef.component.requestor);
                        resolve(allData);
                    }).catch(
                    function (error) {
                        Msg.error('FileUploader', 'Could not upload files: ' + error, thisRef.component.requestor);
                        reject(error);
                    }
            );
        });
    }

    /**
     * Uploads a single file to the configured target.
     * 
     * @param {Object} file File object with at least name and content attributes
     * @param {String} targetURL URL where to send the data
     * @param {String} targetVar Name of the variable the file content should be send to
     * @returns {Promise} Resolves when the file was uploaded succsessfully
     */
    uploadFile(file, targetURL, targetVar) {
        let thisRef = this;
        return new Promise((resolve, reject) => {
            if (file.state !== 'local') {
                resolve(file);
                return;
            }
            if (!targetURL)
                targetURL = thisRef.targetURL;
            if (file.targetURL)
                targetURL = file.targetURL;
            if (!targetVar)
                targetVar = thisRef.targetVar;
            if (file.targetVar)
                targetVar = file.targetVar;
            Msg.flow('FileUploader', 'Now uploading file >'
                    + file.filename + '< to >' + targetURL + '<', thisRef.component.requestor);
            // Create form data
            let formData = new FormData();
            // Get file contents as blob           
            let tmpblob = this.dataURItoBlob(file.dataURL);
            // Create file object (to send metadata along)
            let tmpfile = new File([tmpblob], file.filename, {
                type: file.type,
                lastModified: file.lastModified
            });
            file.uploadStart = Date.now();

            // Show tmpfile
            if (SWAC.config.debugmode) {
                let tmpfileElem = document.createElement('a');
                tmpfileElem.innerHTML = 'Download (dataURL fromDB)';
                tmpfileElem.setAttribute('href', file.dataURL);

                let reader1 = new FileReader();
                reader1.addEventListener("load", function () {
                    let tmpfileElem = document.createElement('a');
                    tmpfileElem.innerHTML = 'Download (converted to blob and back to dataurl)';
                    tmpfileElem.setAttribute('href', reader1.result);
                }, false);

                reader1.readAsDataURL(tmpfile);
            }

            formData.append(targetVar, tmpfile);

            // Exculde file content
            const jsonData = (({dataURL, ...file}) => file)(file);
            // Add sendalong data
            formData.append('data', JSON.stringify(jsonData));

            fetch(targetURL, {
                method: 'POST',
                body: formData
            }).then(function(response) {
                if(response.status === 404) {
                    UIkit.modal.alert(SWAC.lang.dict.Upload.upload_errnotfound);
                    reject();
                    return;
                } else if(response.status >= 400) {
                    UIkit.modal.alert(SWAC.lang.dict.Upload.upload_errother);
                    reject();
                    return;
                } else {
                    response.json().then(data => {
                        Msg.flow('FileUploader',
                                'File >' + file.filename + '< upload successful.', thisRef.component.requestor);
                        const onResolve = () => {
                            let resolveObj = Object.assign(file, data);
                            resolveObj.state = 'uploaded';
                            resolve(resolveObj);
                        }

                        let smartDataPorter = thisRef.component.options.smartDataPorter;
                        if(smartDataPorter)
                        {
                            // Error checking ...
                            let requiredAttributes = ["smartDataPorterURL", "filespaceURL", "config"];
                            for (const attr of requiredAttributes)
                            {
                                if(!smartDataPorter[attr])
                                {
                                    let errMsg = 'Failed to upload to SmartDataPorter. Option >smartDataPorter< is missing attribute >' + attr + '<.';
                                    reject(errMsg);
                                    return;
                                }
                            }
                            let porterConfig = smartDataPorter.config;
                            porterConfig.url = smartDataPorter.filespaceURL + (smartDataPorter.filespaceURL.endsWith("/") ? "" : "/") + file.filename;
                            
                            fetch(smartDataPorter.smartDataPorterURL, {
                                method: 'POST',
                                headers: {
                                    'Accept': 'application/json',
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify(porterConfig)
                            })
                            .then(res => {
                                if(res.status == 200) {
                                    onResolve();
                                    return;
                                }
                                else {
                                    let errMsg = 'Failed to upload to SmartDataPorter. SmartDataPorter responded with status ' + res.status + '.' ;
                                    res.text().then(data1 => console.error(data1));
                                    reject(errMsg);
                                    return;
                                }
                            })
                            .catch(err =>{
                                let errMsg = 'Failed to upload to SmartDataPorter: ' + err;
                                reject(errMsg);
                                return;
                            });
                        }
                        else{
                            onResolve();
                        }
                        
                    })
                    .catch(error => {
                        Msg.error('FileUploader',
                                'Could not upload file to SmartDataPorter >' + file.filename + '>: ' + error, thisRef.component.requestor);
                        reject(error);
                    });
                }
            })
        });
    }

    /**
     * Converts a dataURL to a blob
     * 
     * @param {String} dataURI
     * @returns {Blob}
     */
    dataURItoBlob(dataURI) {
        // convert base64/URLEncoded data component to raw binary data held in a string
        var byteString;
        if (dataURI.split(',')[0].indexOf('base64') >= 0)
            byteString = atob(dataURI.split(',')[1]);
        else
            byteString = unescape(dataURI.split(',')[1]);

        // separate out the mime component
        var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

        // write the bytes of the string to a typed array
        var ia = new Uint8Array(byteString.length);
        for (var i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }

        return new Blob([ia], {type: mimeString});
    }
}
