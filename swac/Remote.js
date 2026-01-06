import SWAC from './swac.js';
import Msg from './Msg.js';
import ICAL from './libs/ical/ical.min.js';

/*
 * This object contains all neccessery logic for communication between frontend
 * and backend.
 */
var remoteHandler = new Object();
remoteHandler.datasourceStates = {};
remoteHandler.datasourceTries = {};
remoteHandler.waitlist = [];
remoteHandler.running = 0;

document.addEventListener('uiComplete', function () {
    // Clear syncstates
    if (window.location.search.indexOf('clearstates=true') > 0) {
        localStorage.removeItem('swac_datasourceStates');
        Msg.warn('Remote', 'Cleared datasourceStates');
    }
    // Get synchronisation states
    let datasourcestatesStr = localStorage.getItem('swac_datasourceStates');
    if (datasourcestatesStr !== null) {
        remoteHandler.datasourceStates = JSON.parse(datasourcestatesStr);
    } else {
        remoteHandler.datasourceStates = {};
        localStorage.setItem('swac_datasourceStates', JSON.stringify(remoteHandler.datasourceStates));
    }
});

remoteHandler.clearDatasourceStates = function () {
    remoteHandler.datasourceStates = {};
    localStorage.setItem('swac_datasourceStates', JSON.stringify(remoteHandler.datasourceStates));
};

/**
 * Function for checking reachability of an web ressource
 *
 * @param {string} fromName url where to fetch
 * @param {Object} fromWheres Object with attributes and values that should be send as query
 * @param {boolean} supressErrorMessage if true no errormessages will be generated
 * @param {boolean} corsfetch if true the request will be send over local cors provider (avoiding cors problems)
 * @returns {Promise} Promise that resolves with datacapsle when data was recived
 */
remoteHandler.fetchHead = function (fromName, fromWheres, supressErrorMessage, corsfetch = false) {
    remoteHandler.datasourceTries = {};
    return remoteHandler.fetch(fromName, fromWheres, 'head', supressErrorMessage, undefined, corsfetch);
};

/**
 * Function for getting remote data useing the fetch api
 * This returns an promise that will be fullfilled with the recived data
 * or rejected with the response object
 *
 * @param {string} fromName url where to fetch
 * @param {Object} fromWheres Object with attributes and values that should be send as query
 * @param {boolean} supressErrorMessage if true no errormessages will be generated
 * @returns {Promise} Promise that resolves with datacapsle when data was recived
 */
remoteHandler.fetchGet = function (fromName, fromWheres, supressErrorMessage) {
    remoteHandler.datasourceTries = {};
    return remoteHandler.fetch(fromName, fromWheres, 'get', supressErrorMessage);
};

/**
 * Function for getting definitions of a remote resouce
 *
 * @param {string} fromName url where to fetch
 * @param {Object} fromWheres Object with attributes and values that should be send as query
 * @param {boolean} supressErrorMessage if true no errormessages will be generated
 * @returns {Promise} Promise that resolves with datacapsle when data was recived
 */
remoteHandler.fetchDefs = function (fromName, fromWheres, supressErrorMessage) {
    remoteHandler.datasourceTries = {};
    return remoteHandler.fetch(fromName, fromWheres, 'defs', supressErrorMessage);
};

/**
 * Function for sending an delte over fecht api
 * This returns an promise that will be fullfilled with the recived json data
 * or rejected with the response object
 *
 * @param {string} fromName url where to fetch
 * @param {Object} fromWheres Object with attributes and values that should be send as query
 * @param {boolean} supressErrorMessage if true no errormessages will be generated
 * @returns {Promise} Promise that resolves with datacapsle when data was recived
 */
remoteHandler.fetchDelete = function (fromName, fromWheres, supressErrorMessage) {
    remoteHandler.datasourceTries = {};
    return remoteHandler.fetch(fromName, fromWheres, 'delete', supressErrorMessage);
};

/**
 * Sends an request with data in url (no http body)
 *
 * @param {string} fromName resource from that fetch or delete data (maybe an url, or an REST resource path)
 * @param {Object} fromWheres Object with attributes and values that should be send as query
 * @param [string} mode string with mode (get, list, defs, create, update, delete)
 * @param {boolean} supressErrorMessage if true no errormessages will be generated
 * @param {object} data object with parameters to send along (only on POST and UPDATE)
 * @returns {Promise} Promise that resolves with datacapsle when data was recived
 */
remoteHandler.fetch = function (fromName, fromWheres, mode, supressErrorMessage, data) {
    if (!fromName) {
        Msg.error('Remote', 'fromName is missing for fetch reequest. Check your dataRequestor.');
        return;
    }
    // Detect max requests
    if (remoteHandler.running > 50) {
        return this.addToWaitlist(fromName, fromWheres, mode, supressErrorMessage, data);
    } else {
        remoteHandler.running++;
    }

    return new Promise((resolve, reject) => {
        // Determine matching target url
        let sourceRef = remoteHandler.determineMatchingResource(fromName, mode);
        // If got no url but an error object
        if (!sourceRef) {
            reject("No datasource found for >" + fromName + '<');
            return;
        }
        // Add fromWheres to URL
        let url = sourceRef.url;
        for (let curWhereName in fromWheres) {
            if (url.indexOf("?") === -1) {
                url += '?';
            } else {
                url += "&";
            }
            url = url + curWhereName + "=" + fromWheres[curWhereName];
        }

        // Build request configuration
        let fetchConf = {
            cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
            credentials: 'include', // same-origin, include, *omit
            headers: {
                'user-agent': 'SWAC/1.0 fetch',
                'content-type': 'application/json'
            },
            method: sourceRef.mode, // *GET, DELETE
            mode: 'cors', // no-cors, *same-origin
            redirect: 'follow', // *manual, error
            referrer: 'no-referrer' // *client
        };

        if (typeof data !== 'undefined') {
            try {
                fetchConf.body = JSON.stringify(data); // must match 'Content-Type' header
            } catch (e) {
                Msg.error('Model', 'Could not save data because it was not transformable to JSON: ' + e);
                console.log(data);
                return;
            }
        }
        // Send fetch and handle response here for global error handling
        fetch(url, fetchConf).then(
                function (response) {
                    remoteHandler.running--;
                    remoteHandler.lookAtWaitlist();
                    // Create errormessage if status is not ok
                    if (!response.ok) {
                        if (!supressErrorMessage) {
                            remoteHandler.showFetchError(response);
                        }
                        // Create error event
                        let event = new CustomEvent("swac_fetchfail_" + response.status, {
                            "detail": response
                        });
                        document.dispatchEvent(event);
                        // Note an error to syncstate
                        remoteHandler.datasourceStates[sourceRef.url + '_' + mode] = {
                            status: response.status,
                            date: new Date()
                        };
                        // Note an try in actual request
                        remoteHandler.datasourceTries[sourceRef.url + '_' + mode] = 1;
                        // Save datasourceStates for page reloads
                        localStorage.setItem('swac_datasourceStates', JSON.stringify(remoteHandler.datasourceStates));

                        remoteHandler.fetch(fromName, fromWheres, mode, supressErrorMessage, data).then(
                                function (data) {
                                    // Resolved in child try
                                    resolve(data);
                                }).catch(
                                function (err) {
                                    // Finally nothing found
                                    reject(response);
                                });
                    } else {
                        let ctype = response.headers.get("content-type");
                        if (!ctype)
                            ctype = 'unknown';
                        if (ctype.startsWith("application/json")) {
                            let jsontxt;
                            response.text().then(function (txt) {
                                // Remove content before json
                                let j1Pos = txt.indexOf('{');
                                let j1PosEnd = txt.lastIndexOf('}') + 1;
                                let j2Pos = txt.indexOf('[');
                                let j2PosEnd = txt.lastIndexOf(']') + 1;

                                if (j1Pos >= 0 && j2Pos >= 0 && j1Pos < j2Pos) {
                                    jsontxt = txt.substring(j1Pos, j1PosEnd);
                                } else if (j1Pos >= 0 && j2Pos >= 0 && j2Pos < j1Pos) {
                                    jsontxt = txt.substring(j2Pos, j2PosEnd);
                                } else if (j1Pos >= 0) {
                                    jsontxt = txt.substring(j1Pos, j1PosEnd);
                                } else if (j2Pos >= 0) {
                                    jsontxt = txt.substring(j2Pos, j2PosEnd);
                                }
                                if (jsontxt) {
                                    jsontxt = jsontxt.trim();
                                    let json = JSON.parse(jsontxt);
                                    resolve({
                                        data: json,
                                        fromName: fromName,
                                        fromWheres: fromWheres
                                    });
                                } else {
                                    resolve({
                                        origresponse: txt
                                    });
                                }
                            }).catch(function (err) {
                                reject(err);
                            });
                        } else if (ctype.startsWith('application/csv')) {
                            response.text().then(function (txt) {
                                const lines = txt.trim().split('\n');
                                const headers = lines[0].split(',');

                                const result = lines.slice(1).map(line => {
                                    const values = line.split(',');
                                    return headers.reduce((object, header, index) => {
                                        object[header.trim()] = values[index].trim();
                                        return object;
                                    }, {});
                                });
                                resolve({
                                    data: result,
                                    fromName: fromName,
                                    fromWheres: fromWheres
                                });
                            });
                        } else if (ctype.startsWith('application/xml') || ctype.startsWith('application/rss+xml')) {
                            response.text().then(function (txt) {
                                const parser = new DOMParser();
                                const xmlDoc = parser.parseFromString(txt, "application/xml");

                                const items = xmlDoc.querySelectorAll("item");
                                const rssItems = [];

                                items.forEach((item) => {
                                    const rssItem = {};
                                    item.childNodes.forEach((node) => {
                                        if (node.nodeType === 1) { // Nur Elemente berücksichtigen
                                            rssItem[node.nodeName] = node.textContent;
                                        }
                                    });
                                    rssItems.push(rssItem);
                                });

                                resolve({
                                    data: rssItems,
                                    fromName: fromName,
                                    fromWheres: fromWheres
                                });
                            });
                        } else if (url.includes(".ics")) {
                            response.text().then(function (txt) {
                                const jcalData = ICAL.parse(txt); // iCal-Daten parsen
                                const comp = new ICAL.Component(jcalData); // iCal-Komponente erstellen
                                const events = comp.getAllSubcomponents('vevent'); // VEVENT-Komponenten abrufen

                                const formattedEvents = [];

                                // Date for first posible event
                                let firstPosibleDate = new Date();
                                // Date for last posible event (default 12 month from now)
                                let lastPosibleDate = null;
                                // Get order
                                let orderBy = 'startDate';
                                let orderDir = 'ASC';
                                for (let curWhere in fromWheres) {
                                    // Work on filter
                                    if (curWhere === 'filter') {
                                        // Expand multiple filter
                                        let filters = fromWheres[curWhere].split('&');
                                        for (let curFilter of filters) {
                                            let curFilterStr = curFilter.replace('filter=', '');
                                            // Get first posible startDate for events
                                            if (curFilterStr.startsWith('startDate,gt')) {
                                                let dateStr = curFilterStr.replace('startDate,gt,', '');
                                                firstPosibleDate = new Date(dateStr);
                                            }
                                            // Get last posible endDate for events
                                            if (curFilterStr.startsWith('endDate,lt')) {
                                                let dateStr = curFilterStr.replace('endDate,lt,', '');
                                                lastPosibleDate = new Date(dateStr);
                                            }
                                        }
                                    }

                                    // Get order
                                    if (curWhere.toLowerCase() === 'order') {
                                        orderBy = fromWheres[curWhere].split(',')[0];
                                        orderDir = fromWheres[curWhere].split(',')[1];
                                    }
                                }

                                // Check if dates are valid
                                if (lastPosibleDate === null || isNaN(lastPosibleDate.getTime())) {
                                    Msg.error('Remote','Given lastPosibleDate >' + lastPosibleDate + '< is not a valid date.');
                                    lastPosibleDate = new Date();
                                    lastPosibleDate.setMonth(lastPosibleDate.getMonth() + 12);
                                    lastPosibleDate.setDate(lastPosibleDate.getDate() + 1);
                                }
                                if(firstPosibleDate === null | isNaN(firstPosibleDate.getTime())) {
                                    firstPosibleDate = new Date();
                                }

                                events.forEach(event => {
                                    const vevent = new ICAL.Event(event);
                                    // Get start and endDate
                                    let startDate = vevent.startDate.toJSDate();
                                    let endDate = null;
                                    if (vevent.endDate) {
                                        endDate = vevent.endDate.toJSDate();
                                    }
                                    if (vevent.component.getFirstPropertyValue('rrule')) {
                                        // Wiederholungsregel verarbeiten
                                        const dtstart = vevent.startDate;
                                        const rrule = vevent.component.getFirstProperty('rrule');

                                        const expansion = new ICAL.RecurExpansion({
                                            component: vevent.component,
                                            dtstart: dtstart
                                        });
                                        let next;

                                        while ((next = expansion.next())) {
                                            let nextDate = next.toJSDate();
                                            // Exclute events before first posible date
                                            if (nextDate.getTime() < firstPosibleDate.getTime()) {
                                                Msg.info('Remote', 'Excluded ' + vevent.summary + ' because ' + nextDate + ' is before ' + firstPosibleDate);
                                                continue;
                                            }
                                            // Exclude events after last posible date
                                            if (nextDate.getTime() > lastPosibleDate.getTime()) {
                                                Msg.info('Remote', 'Excluded ' + vevent.summary + ' because ' + nextDate + ' is after ' + lastPosibleDate);
                                                break;
                                            }

                                            let image = 'no_image';
                                            let imagealt = 'Sorry, no image available';
                                            if (vevent.summary) {
                                                let title = vevent.summary.match(/["„](.*?)["“]/)?.[1];
                                                if (title) {
                                                    image = title.replaceAll(' ', '_').replaceAll('?','');
                                                    image = new Date(vevent.startDate.toLocaleString()).getFullYear() + '_' + image;
                                                    imagealt = image;
                                                }
                                            }
                                            let formattedEvent = {
                                                title: vevent.summary || 'Unbekannter Titel',
                                                image: image,
                                                imagealt: imagealt,
                                                startDate: nextDate.toString(),
                                                endDate: vevent.endDate ? endDate.toString() : null,
                                                description: vevent.description || '',
                                                locationName: vevent.location ? vevent.location.split('\n')[0] : '',
                                                locationAddress: vevent.location ? vevent.location.split('\n').slice(1).join(', ') : ''
                                            };
                                            // Check if date is wohle day date
                                            if (vevent.startDate.toString().length === 10) {
                                                formattedEvent.wholeDay = true;
                                            }

                                            formattedEvents.push(formattedEvent);
                                        }
                                    } else {
                                        // Single date event
                                        // Exclute events before first posible date
                                        if (endDate && endDate.getTime() < firstPosibleDate.getTime()) {
                                            Msg.info('Remote', 'Excluded ' + vevent.summary + ' because ' + endDate + ' is before ' + firstPosibleDate);
                                            return;
                                        }
                                        // Exclude events after last posible date
                                        if (endDate.getTime() > lastPosibleDate.getTime()) {
                                            Msg.info('Remote', 'Excluded ' + vevent.summary + ' because ' + endDate + ' is after ' + lastPosibleDate);
                                            return;
                                        }

                                        let image = 'no_image';
                                        let imagealt = 'No image available';
                                        if (vevent.summary) {
                                            let title = vevent.summary.match(/["„](.*?)["“]/)?.[1];
                                            if (title) {
                                                image = title.replaceAll(' ', '_').replaceAll('?','');
                                                image = new Date(vevent.startDate.toLocaleString()).getFullYear() + '_' + image;
                                                imagealt = image;
                                            }
                                        }
                                        let formattedEvent = {
                                            title: vevent.summary || 'Unbekannter Titel',
                                            image: image,
                                            imagealt: imagealt,
                                            startDate: startDate.toString().replace('Z', ''),
                                            endDate: vevent.endDate ? endDate.toString().replace('Z', '') : null,
                                            description: vevent.description || '',
                                            locationName: vevent.location ? vevent.location.split('\n')[0] : '',
                                            locationAddress: vevent.location ? vevent.location.split('\n').slice(1).join(', ') : '',
                                            endNotSameDay: false
                                        };
                                        // Check if date is wohle day date
                                        if (vevent.startDate.toString().length === 10) {
                                            formattedEvent.wholeDay = true;
                                        }
                                        
                                        if (startDate.getFullYear() === endDate.getFullYear() &&
                                                startDate.getMonth() === endDate.getMonth() &&
                                                startDate.getDate() === endDate.getDate()) {

                                        } else {
                                            formattedEvent.endNotSameDay = true;
                                            // Correcture for iCal depending end date is on next date
//                                            endDate.setDate(endDate.getDate() - 1);
                                            formattedEvent.endDate = endDate.toString().replace('Z', '');
                                        }

                                        // Normale Events verarbeiten
                                        formattedEvents.push(formattedEvent);
                                    }
                                });
                                // Order
                                if (orderDir === 'ASC') {
                                    formattedEvents.sort((a, b) => new Date(a[orderBy]) - new Date(b[orderBy]));
                                } else {
                                    formattedEvents.sort((a, b) => new Date(b[orderBy]) - new Date(a[orderBy]));
                                }
                                resolve({
                                    data: formattedEvents,
                                    fromName: fromName,
                                    fromWheres: fromWheres
                                });
                            });
                        } else {
                            response.text().then(function (txt) {
                                // Try as json
                                try {
                                    let obj = JSON.parse(txt);
                                    resolve({
                                        data: obj,
                                        fromName: fromName,
                                        fromWheres: fromWheres
                                    });
                                } catch (err) {
                                    // Secure against CrosSiteScripting attacs
                                    txt = txt.replace(/&/g, '&amp;')
                                            .replace(/</g, '&lt;')
                                            .replace(/>/g, '&gt;')
                                            .replace(/"/g, '&quot;')
                                            .replace(/'/g, '&#39;');
                                    resolve({
                                        data: txt,
                                        fromName: fromName,
                                        fromWheres: fromWheres
                                    });
                                }
                            });
                        }
                    }
                }
        ).catch(function (error) {
            remoteHandler.running--;
            remoteHandler.lookAtWaitlist();
            if (!supressErrorMessage) {
                remoteHandler.showFetchError(error);
            }
            // Note an error to syncstate
            remoteHandler.datasourceStates[sourceRef.url + '_' + mode] = {
                status: 599,
                date: new Date()
            };
            // Save datasourceStates for page reloads
            localStorage.setItem('swac_datasourceStates', JSON.stringify(remoteHandler.datasourceStates));

            reject(error);
        });
    });
};

/**
 * When there are more than 50 requests at one time, the next request goes to waitlist to not overhelm servers
 *
 * @param {string} fromName resource from that fetch or delete data (maybe an url, or an REST resource path)
 * @param {Object} fromWheres Object with attributes and values that should be send as query
 * @param [string} mode string with mode (get, list, defs, create, update, delete)
 * @param {boolean} supressErrorMessage if true no errormessages will be generated
 * @param {object} data object with parameters to send along (only on POST and UPDATE)
 * @param {boolean} corsfetch if true the request will be send over local cors provider (avoiding cors problems)
 * @returns {Promise} Promise that resolves with datacapsle when data was send / recived
 */
remoteHandler.addToWaitlist = function (fromName, fromWheres, mode, supressErrorMessage, data) {
    return new Promise((resolve, reject) => {
        let entry = {
            fromName: fromName,
            fromWheres: fromWheres,
            mode: mode,
            supressErrorMessage: supressErrorMessage,
            data: data,
            callbackResolve: function (res) {
                resolve(res);
            },
            callbackReject: function (err) {
                reject(err);
            }
        };
        this.waitlist.push(entry);
    });
};

/**
 * Look if some request is on waitlist and perform if there are slots free
 *
 * @returns {undefined}
 */
remoteHandler.lookAtWaitlist = function () {
    if (this.waitlist.length < 1)
        return;
    let set;
    for (let i = 0; i < this.waitlist.length; i++) {
        if (this.waitlist[i]) {
            set = this.waitlist.shift();
            break;
        }
    }
    remoteHandler.fetch(set.fromName, set.fromWheres, set.mode, set.supressErrorMessage, set.data, set.corsfetch).then(function (res) {
        set.callbackResolve(res);
    }).catch(function (err) {
        set.callbackReject(err);
    });
};

/**
 * Function for posting data useing the fetch api
 * This returns an promise that will be fullfilled with the recived json data
 * or rejected with the response object
 *
 * @param {string} fromName url where to fetch
 * @param {Object} fromWheres Object with attributes and values that should be send as query
 * @param {boolean} supressErrorMessage if true no errormessages will be generated
 * @param {object} data object with parameters to send along
 * @returns {Promise} Promise that resolves when data was recived
 */
remoteHandler.fetchCreate = function (fromName, fromWheres, supressErrorMessage, data) {
    remoteHandler.datasourceTries = {};
    return remoteHandler.fetch(fromName, fromWheres, 'create', supressErrorMessage, data);
};

/**
 * Function for sending an update over fecht api
 * This returns an promise that will be fullfilled with the recived json data
 * or rejected with the response object
 *
 * @param {string} fromName url where to fetch
 * @param {Object} fromWheres Object with attributes and values that should be send as query
 * @param {boolean} supressErrorMessage if true no errormessages will be generated
 * @param {object} data object with parameters to send along
 * @returns {Promise} Promise that resolves when data was recived
 */
remoteHandler.fetchUpdate = function (fromName, fromWheres, supressErrorMessage, data) {
    remoteHandler.datasourceTries = {};
    return remoteHandler.fetch(fromName, fromWheres, 'update', supressErrorMessage, data);
};

/**
 * Searches an matching ressource for the given url within the configured
 * datasources.
 *
 * @param {String} fromName Name of the data source table or path
 * @param {String} mode Name of the mode that wants to request (get, list, defs, create, update, delete, head)
 * @returns {mode,url} httpmode and url or null, if no one found
 */
remoteHandler.determineMatchingResource = function (fromName, mode) {
    Msg.flow('Remote', 'determineMatchingResource for source >' + fromName + '< with mode >' + mode + '<');
    // Set automatic mode
    let hmode;
    switch (mode) {
        case 'head':
            hmode = 'HEAD';
            break;
        case 'delete':
            hmode = 'DELETE';
            break;
        case 'update':
            hmode = 'PUT';
            break;
        case 'create':
            hmode = 'POST';
            break;
        default:
            hmode = 'GET';
    }

    // If fromName is a concrete url return that url
    let datasources;
    if (fromName.startsWith('http')
            || fromName.startsWith('/')
            || fromName.startsWith("../")) {
        // Do not try other datasources
        datasources = [{
                url: fromName
            }];
    } else {
        datasources = SWAC.config.datasources;
    }

    // Search matching ressource
    for (let i in datasources) {
        let datasource = datasources[i];
        // Check if try is not neccessery
        if (datasource.exclude && datasource.exclude.includes(fromName))
            continue;
        // Create complete url for this datasource
        let sourceRef = {
            url: datasource.url.replace('[fromName]', fromName),
            mode: hmode,
            datasource: i
        };
        // If there is a mode specific interface
        if (datasource.interfaces && datasource.interfaces[mode]) {
            sourceRef.mode = datasource.interfaces[mode][0];
            sourceRef.url = sourceRef.url.replace('[iface]', datasource.interfaces[mode][1]);
        } else {
            sourceRef.url = sourceRef.url.replace('[iface]', '');
            sourceRef.mode = hmode;
        }

        // Check if this url was tried before
        if (typeof remoteHandler.datasourceStates[sourceRef.url + '_' + mode] === 'undefined') {
            // If url was not tried deliver it
            return sourceRef;
        } else if (remoteHandler.datasourceStates[sourceRef.url + '_' + mode].status === 403
                && !remoteHandler.datasourceTries[sourceRef.url + '_' + mode]) {
            return sourceRef;
        } else if (remoteHandler.datasourceStates[sourceRef.url + '_' + mode].status === 403
                && remoteHandler.datasourceTries[sourceRef.url + '_' + mode]) {
            Msg.warn('Remove', 'URL >' + sourceRef.url + '< is known as protected and you dont have access.');
        } else if (remoteHandler.datasourceStates[sourceRef.url + '_' + mode].status >= 400) {
            let link = window.location.href;
            link += link.includes('?') ? '&clearstates=true' : '?clearstates=true';

            Msg.warn('Remote', 'URL >' + sourceRef.url
                    + '< is known as not applicable for operation >' + mode + '<. Last test on: '
                    + remoteHandler.datasourceStates[sourceRef.url + '_' + mode].date
                    + 'to retry without waiting klick here: ' + link);
        }
    }
    return null;
};

/**
 * Generates and shows an errormessage from response
 *
 * @param {Response} response
 * @returns {undefined}
 */
remoteHandler.showFetchError = function (response) {
    // Try to get json from error response (will succseed if this is an server catched error)
    try {
        response.json().then(function (jsonresponse) {
            if (typeof jsonresponse.errors !== 'undefined') {
                let errorMessage = jsonresponse.errors[0];

                UIkit.notification({
                    message: errorMessage,
                    status: 'error',
                    timeout: SWAC.config.notifyDuration,
                    pos: 'top-center'
                });
                if (jsonresponse.errors.length > 1) {
                    let moreMsgs = SWAC.lang.dict.core.moreerrors;
                    moreMsgs = SWAC.lang.dict.replacePlaceholders(moreMsgs, 'number', (jsonresponse.errors.length - 1));
                    UIkit.notification({
                        message: moreMsgs,
                        status: 'error',
                        timeout: SWAC.config.notifyDuration,
                        pos: 'top-center'
                    });
                }
            } else {
                // Show http status text if there is no special message
                UIkit.notification({
                    message: response.statusText,
                    status: 'error',
                    timeout: SWAC.config.notifyDuration,
                    pos: 'top-center'
                });
            }
        });
    } catch (e) {
        // Show http status text if there is no special message
        UIkit.notification({
            message: response.statusText,
            status: 'error',
            timeout: SWAC.config.notifyDuration,
            pos: 'top-center'
        });
    }
};
export default remoteHandler;