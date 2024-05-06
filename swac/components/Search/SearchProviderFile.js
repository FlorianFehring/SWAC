import Msg from '../../Msg.js';
import SearchProvider from './SearchProvider.js';
/* 
 * Specialized SearchProvider for searching SEGLTF files.
 */
export default class SearchProviderFile extends SearchProvider {
    constructor(searchsource) {
        super(searchsource);
        this.delay = 0;
    }

    /**
     * @override
     */
    search(searchExpr, searchurl, searchcomp) {
        Msg.flow('SearchProviderFile','Now searching on >' + searchurl + '<',searchcomp.requestor);
        let providerRef = this;
        return new Promise((resolve, reject) => {
            // Do not search for model if something else is searched in meantime
            if (searchcomp.searchFor !== searchExpr) {
                Msg.info('SearchProviderFile', 'SearchProviderFile: >' + searchExpr + '< is no longer searched.',searchcomp.requestor);
                resolve();
                return;
            }
            // Embed search expression into url
            if (typeof searchurl !== 'undefined') {
                searchurl = searchurl.replace('{expression}', searchExpr);
            } else {
                reject('There is no searchurl given.');
                return;
            }

            // Check if model was searched before
            if (typeof window.swac.storage.files[searchurl] === 'undefined') {
                // Create entry in models list
                window.swac.storage.files[searchurl] = {};
                // Check if file exists
                fetch(searchurl, {method: 'HEAD'}).then(
                        function (response) {
                            if (typeof window.swac.storage.files[searchurl].filestatus === 'undefined'
                                    || window.swac.storage.files[searchurl].filestatus >= 400) {
                                // Set found status to filestorage on every found file
                                window.swac.storage.files[searchurl].filestatus = response.status;
                                window.swac.storage.files[searchurl].url = searchurl;
                            }
                            if (response.status < 400 || response.status === 405) {
                                let searchresult = {
                                    name: searchExpr,
                                    url: searchurl,
                                    status: response.status,
                                    provider: providerRef
                                };
                                resolve(searchresult);
                            } else {
                                resolve();
                            }
                        }).catch(function (error) {
                    Msg.error('SearchProviderFile', 'A error occured searching: ' + error,searchcomp.requestor);
                    reject(error);
                });
            }
        });
    }
}
