/* 
 * Represents a file stored locally
 */
export default class LocalFile {
    constructor(file) {
        this.file = file;
    }

    get name() {
        return this.file.name;
    }

    get lastModified() {
        return this.file.lastModified;
    }

    get size() {
        return this.file.size;
    }

    get type() {
        return this.file.type;
    }

    get arrayBuffer() {
        return this.read('readAsArrayBuffer');
    }

    get binaryString() {
        return this.read('readAsBinaryString');
    }

    get dataURL() {
        return this.read('readAsDataURL');
    }

    get text() {
        return this.read('readAsText');
    }

    /**
     * Read the contents of the file with given method
     * 
     * @param {String} method One of readAsArrayBuffer, readAsBinaryString, readAsDataURL, readAsText
     */
    read(method) {
        let thisRef = this;
        return new Promise((resolve, reject) => {
            let reader = new FileReader();
            reader.onload = function (evt) {
                resolve(reader.result);
            };
            reader.onabort = function (evt) {
                reject('Reading file ' + thisRef.file.name + ' aborted.');
            };
            reader.onerror = function (evt) {
                reject('Reading file ' + thisRef.file.name + ' failed.');
            };
            reader.onprogress = function (evt) {
            };
            reader[method](this.file);
        });
    }

    /**
     * Transforms the file into a serializable object
     * 
     * @returns {Promise} Promise that resolves with the searializable object
     */
    toObject() {
        let thisRef = this;
        return new Promise((resolve, reject) => {
            let obj = {};
            obj.filename = thisRef.file.name;
            // filter remove file extension
            obj.title = thisRef.file.name.replace(/\.[^/.]+$/, "");
            obj.lastModified = thisRef.file.lastModified;
            obj.size = thisRef.file.size;
            obj.type = thisRef.file.type;
            thisRef.dataURL.then(
                    function (dataURL) {
                        obj.dataURL = dataURL;
                        resolve(obj);
                    }
            ).catch(
                    function (error) {
                        reject(error);
                    }
            );
        });
    }
}
