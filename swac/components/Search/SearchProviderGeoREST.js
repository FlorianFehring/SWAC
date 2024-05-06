import Msg from '../../Msg.js';
import SearchProvider from './SearchProvider.js';

/* 
 * Specialized SearchProvider for searching REST interfaces with geojson.
 */
export default class SearchProviderGeoREST extends SearchProvider {
    constructor(searchsource) {
        super(searchsource);
        this.delay = 1000;
    }

    /**
     * @override
     */
    search(searchExpr, searchurl, searchcomp) {
        Msg.flow('SearchProviderGeoREST', 'Now searching on >' + searchurl + '<', searchcomp.requestor);
        let providerRef = this;
        return new Promise((resolve, reject) => {
            if (searchExpr.length < 4) {
                Msg.warn('SearchProviderGeoREST', 'Do not perform search, because there are less than 4 chars', searchcomp.requestor);
                resolve();
                return;
            }

            // Do not search for model if something else is searched in meantime
            if (searchcomp.searchFor !== searchExpr) {
                Msg.info('SearchProviderGeoREST', '>' + searchExpr + '< is no longer searched.',searchcomp.requestor);
                resolve();
                return;
            }


            // Set searchExpr into apipath
            let searchpath = searchurl.replace('{expression}', searchExpr);
            
            // Get location component
            if(providerRef.searchsource.geolocationComp 
                    && providerRef.searchsource.geolocationComp.lastLocation !== null) {
                
                let location = providerRef.searchsource.geolocationComp.lastLocation;
                let x1 = location.coords.longitude - 0.02;
                let y1 = location.coords.latitude - 0.02;
                let x2 = location.coords.longitude + 0.02;
                let y2 = location.coords.latitude + 0.02;
                
                searchpath += '&viewbox='+x1+','+y1+','+x2+','+y2;
            }
            
            // Call rest api
            fetch(searchpath).then(function (response) {
                return response.json();
            }).then(function (responsejson) {
                let searchresults = [];

                for (let i in responsejson.features) {
                    let result = responsejson.features[i];
                    let searchresult = {
                        name: searchExpr,
                        status: 200,
                        url: searchpath,
                        provider: providerRef,
                        result: result
                    };
                    searchresults.push(searchresult);
                }
                resolve(searchresults);
            }).catch(function (error) {
                Msg.error('SearchProviderRest', 'Error getting json response: ' + error,searchcomp.requestor);
                reject(error);
            });
        });
    }
}
