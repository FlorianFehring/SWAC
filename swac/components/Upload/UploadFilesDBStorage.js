/* 
 * This is a unfinished fallback soloution for browsers that don't support indexedDB
 */
class UploadFilesDBStorage {
    constructor() {
        if (!window.indexedDB) {
            Msg.error('UploadFilesDB','The browser does not support indexedDB cant store files.');
            return;
        }
    }
    
    addFile() {
        let reader = new FileReader();
                            let fileobject = {};
                            let counter = 0;
                            if (localStorage.getItem("fileCounter") !== null)
                            {
                                counter = localStorage.getItem("fileCounter");
                            }
                            let strname = "file" + counter;
                            reader.onload = function (file) {
                                let filename = this.files[0].name;
                                fileobject.content = reader.result;
                                fileobject.url = uploadURL;
                                fileobject.name = filename;
                                localStorage.setItem(strname, JSON.stringify(fileobject));
                                localStorage.setItem("fileCounter", (parseInt(counter) + 1));
                            };
                            reader.readAsText(this.files[0]);
    }
    
    listFiles() {
        
    }
    
    
}

