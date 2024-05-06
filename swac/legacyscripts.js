// Language entries
var errmsgs = {
    "de-DE": {
        noimport: 'Oh, dein Browser ist leider etwas älter und kann diese Seite nicht komplett darstellen. Wechsel nach Möglichkeit zu einem neueren Browser.'
    },
    en: {
        noimport: 'Oh, your browser is to old. Pleace switch to a newer one.'
    }
};

var navElem = document.getElementById('head_navigation');
// Get browser language
let lang = navigator.language || navigator.userLanguage;
// Load swac css
let cssElem = document.createElement('link');
cssElem.setAttribute('rel', "stylesheet");
cssElem.setAttribute('type', "text/css");
cssElem.setAttribute('href', "/SWAC/swac/swac.css");
document.head.appendChild(cssElem);
// Place info messeage
if (navElem) {
    let msg = errmsgs['en'].noimport;
    if (errmsgs[lang]) {
        msg = errmsgs[lang].noimport;
    }
    var legacyElem = document.createElement('div');
    legacyElem.setAttribute('style', 'text-align: center; background: grey; color: #fff; border: 1px solid red;');
    legacyElem.appendChild(document.createTextNode(msg));
    document.body.insertBefore(legacyElem, document.body.childNodes[0]);
}
// Show special areas for legacy browsers
var legElems = document.querySelectorAll('.swac_legacy');
for (let i = 0; i < legElems.length; i++) {
    var curLegElem = legElems[i];
    curLegElem.classList.remove('swac_dontdisplay');
}

var legacysupport = {
    loadRequestors: function () {
        let requestors = document.querySelectorAll("[swa]");
        for (let i = 0; i < requestors.length; i++) {
            var requestor = requestors[i];
            // load component
            if (typeof requestor === 'object' && requestor.id.indexOf('{id}') === -1) {
                if (requestor.innerHTML.length === 0)
                    this.loadTemplate(requestor);
                else
                    this.loadData(requestor);
            }
        }
    },
    loadTemplate: function (requestor) {
        var swa = requestor.getAttribute('swa');
        var from = swa.split(' FROM ');
        var tplfile = swa.split(' TEMPLATE ');
        if (tplfile[1])
            tplfile = tplfile[1];
        else
            tplfile = 'legacy';
        var file = '/SWAC/swac/components/' + from[0] + '/' + tplfile + '.html';
        var xObj = new XMLHttpRequest();
        var thisRef = this;
        xObj.overrideMimeType("text/html");
        xObj.open('GET', file, true);
        xObj.onreadystatechange = function () {
            if (xObj.readyState === 4 && xObj.status === 200) {
                requestor.innerHTML = xObj.responseText;
                thisRef.loadData(requestor);
            } else if (xObj.readyState === 4) {
                console.error('Could not load template from file >' + file + '<: ' + xObj.status);
            }
        };
        xObj.send(null);
    },
    loadData: function (requestor) {
        var swa = requestor.getAttribute('swa');
        var from = swa.split(' FROM ');
        var where = from[1].split(' WHERE ');
        from = where[0];
        if (window[from]) {
            this.insertData(requestor, window[from]);
        } else if (from.indexOf('.json') > 0) {
            this.loadJSON(requestor, from);
        } else if (from.indexOf('.') > 0) {
            console.warn('Data from file >' + from + '< is not supported by legacy support.');
        } else {
            console.error('Data to view >' + from + '< not found.');
        }
    },
    loadJSON: function (requestor, file) {
        let thisRef = this;
        var xObj = new XMLHttpRequest();
        xObj.overrideMimeType("application/json");
        xObj.open('GET', file, true);
        xObj.onreadystatechange = function () {
            if (xObj.readyState === 4 && xObj.status === 200) {
                var json = JSON.parse(xObj.responseText);
                if (json.list)
                    thisRef.insertData(requestor, json.list);
                else
                    thisRef.insertData(requestor, json);
            } else if (xObj.readyState === 4) {
                console.error('Could not load data from file >' + file + '<: ' + xObj.status);
            }
        };
        xObj.send(null);
    },
    insertData: function (requestor, data) {
        var tpls = requestor.querySelectorAll('.swac_repeatForSet');
        let sitebasepath = window.location.pathname.split('/sites/')[0];
        // Each template
        for (var i = 0; i < tpls.length; i++) {
            var curTpl = tpls[i];
            // Each dataset
            for (var j = 0; j < data.length; j++) {
                var set = data[j];
                // Check dates
                if (set['swac_from']) {
                    let fromDate = new Date(set['swac_from']);
                    if ((new Date().getTime() - fromDate.getTime()) < 0) {
                        continue;
                    }
                }
                if (set['swac_until']) {
                    let untilDate = new Date(set['swac_until']);
                    if ((new Date().getTime() - untilDate.getTime()) > 0) {
                        continue;
                    }
                }
                // Special for Navigation component
                if (set.rto && set.rto === '#') {
                    continue;
                }

                // copy template
                var curElem = curTpl.cloneNode(true);
                curElem.classList.remove('swac_repeatForSet');
                curTpl.parentElement.appendChild(curElem);
                // Get repeatForAtrr
                var attrTpl = curElem.querySelector('.swac_repeatForValue');
                // Each attribute
                for (var k in set) {
                    if (attrTpl) {
                        var curAttrElem = attrTpl.cloneNode(true);
                        curAttrElem.classList.remove('swac_repeatForValue');
                        curAttrElem.innerHTML = curAttrElem.innerHTML.replace('{attrName}', k);
                        curAttrElem.innerHTML = curAttrElem.innerHTML.replace('{*}', set[k]);
                        attrTpl.parentNode.appendChild(curAttrElem);
                    } else {
                        // Special for Navigation component
                        if (k === 'rto') {
                            var link = sitebasepath + '/sites/' + set.rto;
                            curElem.innerHTML = curElem.innerHTML.replace('{' + k + '}', link);
                        }
                        curElem.innerHTML = curElem.innerHTML.replace('{' + k + '}', set[k]);
                    }
                }
            }
            // Remove not filled placeholders
            var repnode = curTpl.parentNode;
            var regex = /({.*?})/g;
            var matches = repnode.innerHTML.match(regex);
            for(let i=0; i < matches.length; i++) {
                repnode.innerHTML = repnode.innerHTML.replace(matches[i],'');
            }
        }
    }
};

// Legacy support for requestors (load data and insert placeholders only)
legacysupport.loadRequestors();