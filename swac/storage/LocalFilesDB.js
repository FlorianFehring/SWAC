import Msg from '../Msg.js';

/*
 * Scripts for accessing the upload files db
 */
export default class LocalFilesDB {
    /**
     * Creates a new database for files
     *
     * @param {String} dbname Name of the file
     * @returns {undefined}
     */
    constructor(dbname, objectstorename) {
        if (!window.indexedDB) {
            Msg.error('UploadFilesDB', 'The browser does not support indexedDB cant store files.');
            return;
        }
        this.dbname = dbname;
        this.objectstorename = objectstorename;
        this.dbvers = 1; // Update this on structure updates

        // Try access database (and create structure if needed)
        this.open();
    }

    open() {
        let thisRef = this;
        return new Promise((resolve, reject) => {
            let dbOpenReq = window.indexedDB.open(thisRef.dbname, thisRef.dbvers);
            dbOpenReq.onerror = function (error) {
                Msg.error('LocalFilesDB',
                        'Could not open database: ' + error);
            };
            // Executed before onsuccsess when upgrade is needed, changes the database structure
            dbOpenReq.onupgradeneeded = function (event) {
                Msg.flow('LocalFilesDB',
                        'Installing LocalFilesDB version ' + thisRef.dbvers);
                // Save the IDBDatabase interface
                let db = event.target.result;
                db.createObjectStore(thisRef.objectstorename, {autoIncrement: true});
            };
            // Successfull opened the database
            dbOpenReq.onsuccess = function (evt) {
                Msg.flow('LocalFilesDB',
                        'Succsessfully opend LocalFilesDB >' + thisRef.dbname + '< for access.');
                resolve(evt.target.result);
            };
        });
    }

    /**
     * Add an file to the local database.
     *
     * @param {LocalFile} file LocalFile object
     * @param {Object} additionalData Object with aditional data (e.g. metadata)
     * @returns {Promise} Promise that resolves with the dataobject saved, when the file was succsessfull stored
     */
    addFile(file, additionalData) {
        let thisRef = this;
        return new Promise((resolve, reject) => {
            thisRef.open().then(
                    function (db) {
                        // Create simple saveable object
                        file.toObject().then(
                                function (saveableFile) {
                                    // Add additional data
                                    for (let curAttr in additionalData) {
                                        saveableFile[curAttr] = additionalData[curAttr];
                                    }

                                    let transaction = db.transaction([thisRef.objectstorename], "readwrite");
                                    transaction.oncomplete = function (event) {
                                        Msg.flow('LocalFilesDB',
                                                'Transaction for save completed.');
                                    };
                                    transaction.onaboard = function (event) {
                                        Msg.error('LocalFilesDB',
                                                'Could not save file to database.');
                                        reject();
                                    };
                                    let objectStore = transaction.objectStore(thisRef.objectstorename);

                                    saveableFile.state = 'local';
                                    let request = objectStore.add(saveableFile);
                                    request.onsuccess = function (evt) {
                                        saveableFile.localdb_key = evt.target.result;
                                        Msg.flow('LocalFilesDB',
                                                'Saved file >' + file.filename
                                                + '< under localdb_key >' + saveableFile.localdb_key
                                                + '< into database.');
                                        resolve(saveableFile);
                                    };
                                    request.onerror = function (error) {
                                        Msg.error('LocalFilesDB', 'Could not save file into database.');
                                    };
                                });
                    }
            );
        });
    }

    /**
     * Updates all given file objects
     * 
     * @param {Object[]} files Array of file objects
     * @returns {undefined}
     */
    updateFiles(files) {
        for (let curFile of files) {
            this.updateFile(curFile);
        }
    }

    /**
     * Updates the information for a stored file.
     * 
     * @param {Object} file Object with file informations
     * @returns {undefined}
     */
    updateFile(file) {
        let thisRef = this;
        return new Promise((resolve, reject) => {
            if (!file.localdb_key) {
                Msg.error('LocalFilesDB', 'The given file does not contain the localdb_key attribute.');
                reject();
                return;
            }

            thisRef.open().then(
                    function (db) {
                        let transaction = db.transaction([thisRef.objectstorename], "readwrite");
                        transaction.oncomplete = function (event) {
                            Msg.flow('LocalFilesDB',
                                    'Transaction for update completed.');
                        };
                        transaction.onaboard = function (event) {
                            Msg.error('LocalFilesDB',
                                    'Could not update file to database.');
                            reject();
                        };
                        let objectStore = transaction.objectStore(thisRef.objectstorename);

                        let request = objectStore.put(file, file.localdb_key);
                        request.onsuccess = function (evt) {
                            Msg.flow('LocalFilesDB',
                                    'Updated file >' + file.filename
                                    + '< under localdb_key >' + file.localdb_key
                                    + '< into database.');
                            resolve(file);
                        };
                        request.onerror = function (error) {
                            Msg.error('LocalFilesDB', 'Could not save file into database.');
                        };
                    }
            );
        });
    }

    /**
     * Returns a list of all local stored files.
     *
     * @returns {Promise}
     */
    listFiles() {
        let thisRef = this;
        return new Promise((resolve, reject) => {
            thisRef.open().then(
                    function (db) {
                        let transaction = db.transaction([thisRef.objectstorename], "readonly");
                        transaction.onaboard = function (error) {
                            Msg.error('LocalFilesDB', 'Transaction for reading all files aboarded: ' + error);
                        };
                        let objectStore = transaction.objectStore(thisRef.objectstorename);
                        let request = objectStore.openCursor();

                        let results = [];
                        request.onerror = function (event) {
                            Msg.error('LocalFilesDB', 'Could not get datasets: ' + event);
                            reject();
                        };
                        request.onsuccess = function (event) {
                            let cursor = event.target.result;
                            if (cursor) {
                                let key = cursor.primaryKey;
                                let value = cursor.value;
                                let result = value;
                                result.localdb_key = key;
                                results.push(result);
                                cursor.continue();
                            } else {
                                // no more results
                                resolve(results);
                            }
                        };
                    }
            );
        });
    }

    searchFiles(condkey, condvalue) {
        let thisRef = this;
        return new Promise((resolve, reject) => {
            thisRef.open().then(
                    function (db) {
                        let transaction = db.transaction([thisRef.objectstorename], "readonly");
                        transaction.onaboard = function (error) {
                            Msg.error('LocalFilesDB', 'Transaction for reading all files aboarded: ' + error);
                        };
                        let objectStore = transaction.objectStore(thisRef.objectstorename);
                        let request = objectStore.openCursor();

                        let results = [];
                        request.onerror = function (event) {
                            Msg.error('LocalFilesDB', 'Could not get datasets: ' + event);
                            reject();
                        };
                        request.onsuccess = function (event) {
                            let cursor = event.target.result;
                            if (cursor) {
                                let key = cursor.primaryKey;
                                let value = cursor.value;
                                let result = value;
                                result.localdb_key = key;
                                if (value[condkey] && value[condkey] === condvalue) {
                                    results.push(result);
                                }
                                cursor.continue();
                            } else {
                                // no more results
                                resolve(results);
                            }
                        };
                    }
            );
        });
    }


    /**
     * Removes a file from this LocalFilesDB. 
     * 
     * @param {undefined} key of the file
     * @returns {undefined}
     */
    deleteFile(file) {
        let thisRef = this;
        return new Promise((resolve, reject) => {
            if (!file.localdb_key) {
                Msg.error('LocalFilesDB', 'The given file does not contain the localdb_key attribute.');
                reject();
                return;
            }

            thisRef.open().then(
                    function (db) {
                        let transaction = db.transaction([thisRef.objectstorename], "readwrite");
                        transaction.oncomplete = function (event) {
                            Msg.flow('LocalFilesDB',
                                    'Transaction for delete completed.');
                        };
                        transaction.onaboard = function (event) {
                            Msg.error('LocalFilesDB',
                                    'Could not delete file from database.');
                            reject();
                        };
                        let objectStore = transaction.objectStore(thisRef.objectstorename);

                        let request = objectStore.delete(file.localdb_key);
                        request.onsuccess = function (evt) {
                            Msg.flow('LocalFilesDB',
                                    'Remove file >' + file.filename
                                    + '< under localdb_key >' + file.localdb_key
                                    + '< from database.');
                            resolve(file);
                        };
                        request.onerror = function (error) {
                            Msg.error('LocalFilesDB', 'Could not remove file from database.');
                        };
                    }
            );
        });
    }

    /**
     * Removes all files from this LocalFilesDB.
     *
     * @returns {Promise}
     */
    clearFiles()
    {
        let thisRef = this;
        return new Promise((resolve, reject) => {
            thisRef.open().then(db => {
                let transaction = db.transaction([thisRef.objectstorename], "readwrite");
                transaction.onaboard = function (error) {
                    Msg.error('LocalFilesDB', 'Transaction for removing all files aboarded: ' + error);
                };
                let objectStore = transaction.objectStore(thisRef.objectstorename);
                let request = objectStore.clear();
                request.onerror = function (event) {
                    Msg.error('LocalFilesDB', 'Error: ' + event);
                    reject();
                };
                request.onsuccess = function (event) {
                    resolve();
                }
            }).catch(err => reject(err));
        });
    }
}
