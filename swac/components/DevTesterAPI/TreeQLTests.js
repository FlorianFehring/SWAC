class TreeQLTests {

    constructor(component) {
        this.comp = component;
    }

    /**
     * Test get the first dataset
     * 
     * @param {String} url to test
     * @returns {Promise}
     */
    testGetOneTreeQL(url) {
        return new Promise((resolve, reject) => {
            // Create requestor
            let req = {
                fromName: url + '/1',
                fromWheres: {
                    id: 1
                }
            };
            let thisRef = this;
            Model.load(req).then(function (result) {
                let i = 0;
                for (let curSet in result.data) {
                    i++;
                }
                if (i !== 1) {
                    thisRef.comp.showTestresult(url, 'testGetOneTreeQL', false, result.data);
                    resolve(false);
                } else {
                    thisRef.comp.showTestresult(url, 'testGetOneTreeQL', true, result.data);
                    resolve(true);
                }
            }).catch(function (error) {
                thisRef.comp.showTestresult(url, 'testGetOneTreeQL', false, error);
            });
        });
    }

    /**
     * Test listing datasets
     * 
     * @param {String} url to test
     * @returns {Promise}
     */
    testListTreeQL(url) {
        return new Promise((resolve, reject) => {
            // Create requestor
            let req = {
                fromName: url,
                fromWheres: {
                    id: 1
                }
            };
            let thisRef = this;
            Model.load(req).then(function (result) {
                if (result.data.length > 1) {
                    thisRef.comp.showTestresult(url, 'testListTreeQL', true, result.data);
                    resolve(true);
                } else {
                    thisRef.comp.showTestresult(url, 'testListTreeQL', false, result.data);
                    resolve(false);
                }
            }).catch(function (error) {
                thisRef.comp.showTestresult(url, 'testListTreeQL', false, error);
                resolve(false);
            });
        });
    }
    
    /**
     * Test create single dataset
     * 
     * @param {String} url to test
     * @returns {Promise}
     */
    testListTreeQL(url) {
        return new Promise((resolve, reject) => {
            // Create requestor
            let req = {
                fromName: url
            };
            let thisRef = this;
            Model.load(req).then(function (result) {
                if (result.data.length > 1) {
                    thisRef.comp.showTestresult(url, 'testListTreeQL', true, result.data);
                    resolve(true);
                } else {
                    thisRef.comp.showTestresult(url, 'testListTreeQL', false, result.data);
                    resolve(false);
                }
            }).catch(function (error) {
                thisRef.comp.showTestresult(url, 'testListTreeQL', false, error);
                resolve(false);
            });
        });
    }
}