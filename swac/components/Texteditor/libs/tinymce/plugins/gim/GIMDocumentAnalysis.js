/*
 * This file contains javascript for useing the document analysing functions and
 * make suggesstions for informations and relations
 */

// Parser for
function gimInputParser(input) {
    // Clean input from dot
    // Get last char
    var lastchar = input.charAt(input.length-1);
    if(lastchar === '.') {
        input = input.replace(/\./g,'');
    }
    if(lastchar === ',') {
        input = input.replace(/\,/g,'');
    }
    if(lastchar === '!') {
        input = input.replace(/\!/g,'');
    }
        if(lastchar === '?') {
        input = input.replace(/\?/g,'');
    }
    
    var result;
    // Get node of area where to search for informations
    var childarea = document.getElementById("infoPanelInformationViewTabs\:relationtreeform\:child_informations_tree");

    // Count elements
    var xpath_count = 'count(.//span[text()="' + input + '"])';
    var matchingElementsCount = document.evaluate(xpath_count, childarea, null, XPathResult.NUMBER_TYPE, null);
    // Get elements
    var xpath = './/span[text()="' + input + '"]';
    var matchingElements = document.evaluate(xpath, childarea, null, XPathResult.ANY_TYPE, null);

    var possibilities = [];
    var thisSpan = matchingElements.iterateNext();
    while (thisSpan) {
        // Check if found content is an dimension value
        if (thisSpan.className === 'dimension_value') {
            // Note parents id (contains all information to create new tags)
            possibilities[thisSpan.parentNode.id] = thisSpan;
        }
        thisSpan = matchingElements.iterateNext();
    }
//    alert(text);
//
//    var key;
//    for (key in possibilities) {
//        alert("Schlüssel " + key + " mit Wert " + possibilities[key]);
//    }
//
//    alert("found: " + matchingElementsCount.numberValue);
    if (matchingElementsCount.numberValue === 1) {
        var key;
        for (key in possibilities) {
            var curSpan = possibilities[key];
            // Check if found content is an dimension value
            if (curSpan.className === 'dimension_value') {
                // Get parents id (contains all information to create new tags)
                var idParts = key.split("_");
                // Create new element
                var newElement = createInformationWithDimensionNode(idParts[0], idParts[1], idParts[2], input);
                result = newElement.outerHTML;
            }
        }
    } else if(matchingElementsCount.numberValue >= 2) {
        // Create menue for possibilty selection
        result = getPossibilitiesMenue(input, possibilities).outerHTML;
    }

    if(matchingElementsCount.numberValue > 0 && (lastchar === '.' || lastchar === ',' || lastchar === '!' || lastchar === '?')) {
        result = result + lastchar;
    }

    // TODO implement search containing as suggestions
    // var xpath = ".//span[contains(text(),'"+input+"')]";

    return result;
}



function documentCheck() {
    var set_data = tinymce.activeEditor.id.split('_');
    // Show information tree
    showInformationTree(tinymce.activeEditor.id);

    // Get available informations
    // Get xmlHTTPP
    var xmlhttp = getXMLHttp();
    xmlhttp.onreadystatechange = function () {

        if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
            try {
                var childsObj = JSON.parse(xmlhttp.responseText);
            } catch (e) {
                alert(xmlhttp.responseText);
            }
            var usedChilds = [];
            var notUsedChilds = [];
            // Walk trough every child
            for (var set_name_id in childsObj) {
                // Select all spans referncing the child
                var infoNodes = tinyMCE.activeEditor.dom.select('span.' + set_name_id);
                if (infoNodes.length > 0) {
                    // Look at each info node
                    for (var i = 0; i < infoNodes.length; i++) {
                        // Current info node
                        var currentInfoNode = infoNodes[i];
                        // Count used child
                        if (i === 0) {
                            usedChilds.push(set_name_id);
                        }

                        // Get child elements
                        var dimensionSpans = currentInfoNode.getElementsByTagName('SPAN');
                        // Walk through spans
                        for (var j = 0; j < dimensionSpans.length; j++) {
                            var currentDimensionNode = dimensionSpans[j];
                            var currentDimensionName = currentDimensionNode.className.replace('dim_', '');
                            if (currentDimensionNode.innerHTML !== childsObj[set_name_id][currentDimensionName]) {
                                // Add attibute node for found incorrect data
                                //alert('wrong value! found: ' + currentDimensionNode.innerHTML + ' expected: ' + childsObj[set_name_id][currentDimensionName]);
                                // Mark nodes with wrong content
                                currentDimensionNode.className = currentDimensionNode.className + ' dim_inncorrect';
                            }
                        }
                    }
                } else {
                    // Count not used child
                    notUsedChilds.push(set_name_id);
                    // Mark not used child
                    var childLink = document.getElementById(set_name_id);
                    childLink.className = childLink.className + ' unused';
                }
            }

            //alert('not used childs: ' + notUsedChilds.length);

            // Get all spans
            var infoNodes = tinyMCE.activeEditor.dom.select('span.information');

            // Check if nodes are referenced
            for (var i = 0; i < infoNodes.length; i++) {
                var nodeClasses = infoNodes[i].getAttribute('class').split(' ');
                // Get the nodes reference
                var nodeReference = '';
                for (var j = 0; j < nodeClasses.length; j++) {
                    // Search class with id
                    if (nodeClasses[j].indexOf('inf') === -1) {
                        nodeReference = nodeClasses[j];
                        break;
                    }
                }

                // Check if node is one of the used childs
                if (usedChilds.indexOf(nodeReference) === -1) {
                    // Mark not referenced node
                    infoNodes[i].className = infoNodes[i].className + ' inf_notreferenced';
                    //alert(nodeReference + '  not linked!');
                }
            }
        } else if (xmlhttp.readyState === 4 && xmlhttp.status === 0) {
            alert('error in ajax connection');
            // Render error message
            document.getElementById('infopanelLayoutUnit').innerHTML = '<div class="ajaxerror">Cant get information ' + jsonHandlerInformation + '</div>';
        }
    };
    xmlhttp.open("POST", "http://127.0.0.1/InformationManager/Services/InformationManager/ajaxhandler.php", true);
    xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xmlhttp.send("action=getInformationChildsData&set_name=" + set_data[0] + "&set_id=" + set_data[1]);

}

function documentAnalyse() {
    overlay('display');

    var set_data = tinymce.activeEditor.id.split('_');

    //TODO local pre-annalysis to find occurences of allready in document used informations

    var content = tinymce.activeEditor.selection.getContent();
    if (content.length <= 0) {
        content = tinymce.activeEditor.getContent();
    }


    // Get xmlHTTPP
    var xmlhttp = getXMLHttp();
    xmlhttp.onreadystatechange = function () {

        if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
            //alert(xmlhttp.responseText);
            try {
                var suggestions = JSON.parse(xmlhttp.responseText);
            } catch (e) {
                alert(xmlhttp.responseText);
                overlay('hide');
            }

            for (var key in suggestions) {
                // Insert if there is only one suggestion
                if (suggestions[key].length === 1) {
                    var suggestion = suggestions[key][0];
                    // Insert information
                    replaceTextWithNode(key, createInformationNode(suggestion['set_name'], suggestion['set_id'], suggestion['dim_name'], key));
                } else {
                    // Show dialog if there are more than one suggestions
                    var jsonSuggestions = JSON.stringify(suggestions[key]);
                    tinymce.activeEditor.windowManager.open({
                        title: "infoselection_title",
                        url: 'http://127.0.0.1/InformationManager/Services/InformationManager/index.php?suggestion_id=' + editor.id + '&selection=' + key + ' &suggestions=' + escape(jsonSuggestions),
                        width: 700,
                        height: 600
                    });
                }
            }
            overlay('hide');
        } else if (xmlhttp.readyState === 4 && xmlhttp.status === 0) {
            alert('error in ajax connection');
            overlay('hide');
            // Render error message
            //document.getElementById('infopanelLayoutUnit').innerHTML = '<div class="ajaxerror">Cant get information</div>';
        }
    };
    xmlhttp.open("POST", "http://127.0.0.1/InformationManager/Services/InformationManager/ajaxhandler.php", true);
    xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xmlhttp.send("action=getInformationSuggestions&content=" + escape(content) + "&set_name=" + set_data[0] + "&set_id=" + set_data[1]);
}

