import SWAC from '../../swac.js';
import Component from '../../View.js';
import Msg from '../../Msg.js';
import '../../OnlineReaction.js';
/* 
 * Class with reactions on online / offline change for Upload component
 */
export default class UploadOnReact extends OnlineReaction {
    constructor(config) {
        super(config);
    }

    loadDependencies() {
        let thisRef = this;
        return new Promise((resolve, reject) => {
            // Load needed class files
            let corecomp = {};
            corecomp.name = 'UploadReact';

            let dependencyStack = [];
            dependencyStack.push({path: SWAC.config.swac_root + 'components/Upload/FileUploader.js'});
            dependencyStack.push({path: SWAC.config.swac_root + 'storage/LocalFilesDB.js'});
            dependencyStack.push({path: SWAC.config.swac_root + 'storage/LocalFile.js'});
            SWAC.loadDependenciesStack(dependencyStack, corecomp).then(
                    function () {
                        // Initilize filesDB
                        thisRef.filesdb = new LocalFilesDB('upload');
                        thisRef.fileuploader = new FileUploader(thisRef);
                        resolve();
                    }
            );
        });
    }

    onOnline(evt) {
        Msg.flow('UploadOnReact', 'Starting file uploads.');
        let thisRef = this;
        this.loadDependencies().then(
                function () {
                    // Get files in localDB
                    thisRef.filesdb.searchFiles('state','local').then(function (files) {
                        // Start uploading files that are in database
                        thisRef.fileuploader.uploadFiles(files).then(
                                function(allFiles) {
                                    // Updates every local files state
                                    thisRef.filesdb.updateFiles(allFiles);
                                });
                    });
                }
        );
    }

    onOffline(evt) {
        console.log('Upload onOffline reaction');
    }

    onUnreachable(evt) {
        console.log('Upload onUnreachable action');
    }
}