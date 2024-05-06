/* 
 * This file contains javascript for handling marks within GIM content
 */

/**
 * Removes an mark of information or dimension
 * 
 * @param {type} event  Event that occures bevore the remove command
 * @returns {undefined}
 */
function markRemove(event) {
    var clickNode = event.target;
    var content = '';

    // Check if click is from dimension
    if (clickNode.className.indexOf("dim_") !== -1) {
        content = clickNode.innerHTML;
        var newTextNode = document.createTextNode(content);
        var parentClickNode = clickNode.parentNode;

        // Unhighlight dimension
        var dimid = parentClickNode.className + clickNode.className.replace("dim", "");
        if (highlightstickyInformation !== null && dimid.indexOf(highlightstickyInformation.id) !== -1) {
            toggleHighlightStickyInformation(highlightstickyInformation);
        }

        parentClickNode.replaceChild(newTextNode, clickNode);

        clickNode = parentClickNode;
    }
    if (clickNode.className.indexOf("inf_") !== -1) {
        // Remove highlighting
        if (highlightstickyInformation !== null && clickNode.className.indexOf(highlightstickyInformation.id) !== -1) {
            toggleHighlightStickyInformation(highlightstickyInformation);
        }

        var childs = clickNode.childNodes;
        if (content === '' && childs.length > 0) {
            var innerContent = '';
            for (var i = 0; i < childs.length; i++) {
                if (childs[i].nodeName.toLowerCase() === 'span') {
                    innerContent += childs[i].innerHTML;
                } else if (childs[i].nodeType === 3) {
                    innerContent += childs[i].data;
                } else {
                    alert(childs[i].nodeName + ' else!! ' + childs[i].outerHTML);
                    innerContent += childs[i].outerHTML;
                }
            }
            clickNode.innerHTML = innerContent;
            content = '';
        }
        if (content === '') {
            content = clickNode.innerHTML;
            // New text node
            var newTextNode = document.createTextNode(content);
            clickNode.parentNode.replaceChild(newTextNode, clickNode);
        } else {
            // get childs
            var childs = clickNode.childNodes;
            // Get node to prepend
            for (var i = 0; i < childs.length; i++) {
                //TODO split child nodes into groups for all nodes that are not
                // text nodes.
            }
        }



        // Check if information relation is no longer used
        //showInformationTree(editor.id);
    }
}

function markAdd(set_name, set_id, args) {
    alert("Adding mark " + set_name + " " + set_id);

    var selcontent = top.tinymce.activeEditor.selection.getContent();

    // Create information node
    var informationNode = createInformationNode(set_name, set_id, selcontent);

    // Create dimension nodes
    for (arg in args) {
        alert(arg);
    }

    // Insert changes into editor
    top.tinymce.activeEditor.selection.setContent(informationNode.outerHTML);
}

/**
 * Marks the given content is related to an information and dimension
 * 
 * @param {type} set_name   Name of the informations set
 * @param {type} set_id     Id of the information within set
 * @param {type} dim_name   Name of the related dimension
 * @returns {undefined}
 */
function addDimensionMark(set_name, set_id, dim_name) {
    // Get dimensions value
    var infNode = document.getElementById(set_name + "_" + set_id + "_" + dim_name);
    var dimValue = infNode.childNodes[1].textContent;

    var content = top.tinymce.activeEditor.selection.getContent();
    // Avoid double encoding of html entities
    content = html_entity_decode(content);

    // Check dimension value and selected value
    if (dimValue != content) {
        var r = confirm("The content >" + content + "< does not match the dimensions value >" + dimValue + "<. Do you wish to continue?");
        if (r == false) {
            return;
        }
    }

    var newnode = createInformationWithDimensionNode(set_name, set_id, dim_name, content);
    top.tinymce.activeEditor.selection.setContent(newnode.outerHTML + ' ');
}

/**
 * Replaces an node with an new information reference node
 * 
 * @param {type} node       Node to replace
 * @param {type} set_name   Name of the set to reference
 * @param {type} set_id     Id of the information for reference
 * @param {type} dim_name   Name of the referenced dimension
 * @returns {undefined}
 */
function replaceWithDimensionMark(node, set_name, set_id, dim_name) {
    // Get content
    var content = node.childNodes[0].textContent;
    
    // Create new node
    var newnode = createInformationWithDimensionNode(set_name, set_id, dim_name, content);
    
    // Replace node
    var parent = node.parentNode;
    parent.replaceChild(newnode,node);
}

/**
 * Add an dimension mark to selected content
 * 
 * @param {type} editor Editor to apply on
 * @param {type} event  Event caused the call
 * @returns {undefined}
 */
function markContentWithDimension(editor, event) {
    // Get information identifier from clicked node
    var infId = event.target.id;
    infId = infId.replace("-text", "");
    var infIdParts = infId.split("_");

    // Replace content with mark
    addDimensionMark(infIdParts[0], infIdParts[1], infIdParts[2]);
}

/**
 * Creates an new node marking the content is related to an information
 * 
 * @param {type} set_name   Name of the informations set
 * @param {type} set_id     Id of the information within set
 * @param {type} content    Content to be marked
 * @returns {Element|createInformationNode.informationNode}
 */
function createInformationNode(set_name, set_id, content) {
    // Create information node
    var informationNode = document.createElement("span");
    informationNode.className = 'inf_' + set_name + ' information ' + set_name + '_' + set_id;
    informationNode.innerHTML = content;
    return informationNode;
}

/**
 * Creates an new node marking the content is related to an dimension
 * 
 * @param {type} dim_name   Name of the related dimension
 * @param {type} content    Content to be marked (must not be the dimensions value)
 * @returns {createDimensionNode.dimensionNode|Element}
 */
function createDimensionNode(dim_name, content) {
    var dimensionNode = document.createElement("span");
    dimensionNode.className = 'dim_' + dim_name;
    dimensionNode.textContent = content;
    return dimensionNode;
}

/**
 * Creates an new node marking content related to an dimension and information
 * 
 * @param {type} set_name   Name of the informations set
 * @param {type} set_id     Id of the information within set
 * @param {type} dim_name   Name of the related dimension
 * @param {type} content    Content to be marked (must not be the dimensions value)
 * @returns {Element|createInformationNode.informationNode|createInformationWithDimensionNode.informationNode}
 */
function createInformationWithDimensionNode(set_name, set_id, dim_name, content) {
    var informationNode = createInformationNode(set_name, set_id, '');
    var dimensionNode = createDimensionNode(dim_name, content);
    informationNode.appendChild(dimensionNode);
    return informationNode;
}


function cleanDocument() {
    var spanNodes = tinyMCE.activeEditor.dom.select('span.information');
    for (var i = 0; i < spanNodes.length; i++) {
        var currentSpan = spanNodes[i];
        var withWhitespace = false;
        var prevSibling = currentSpan.previousSibling;
//        alert(currentSpan.innerHTML);
        // Ignore one whitespance
        if (prevSibling !== null && prevSibling.nodeType === 3 && /^\s*$/.test(prevSibling.data)) {
            prevSibling = prevSibling.previousSibling;
            withWhitespace = true;
        }

        if (prevSibling !== null && prevSibling.nodeName === 'SPAN' && prevSibling.className === currentSpan.className) {
            var newInnerHTML = prevSibling.innerHTML;
            if (withWhitespace)
                newInnerHTML += ' ';
            newInnerHTML += currentSpan.innerHTML;
            currentSpan.innerHTML = newInnerHTML;
            currentSpan.parentNode.removeChild(prevSibling);
        }
    }
    // Notify about changes in editor
    //tinyMCE.activeEditor.fire('change');
}


function markExistingInformation(set_name, set_id, parent_name, parent_id) {
    var selcontent = top.tinymce.activeEditor.selection.getContent();
    alert(set_name + set_id);
    // Get xmlhttp for ajax request
    xmlhttp = getXMLHttp();

    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState === 4 && xmlhttp.status === 200)
        {
            var answer = xmlhttp.responseText;
            try {
                var jsonobj = JSON.parse(answer);
            } catch (e) {
                alert(xmlhttp.responseText);
            }

            // If all informations found
            if (jsonobj.stat.infopersentage === 100) {
                // Add information spans to content
                for (var key in jsonobj.values) {
                    var value = jsonobj.values[key];
                    var taggedvalue = '<span class="dim_' + value + '">' + key + '</span>';
                    selcontent = selcontent.replace(key, taggedvalue);
                }
                // Get current surrounding tag
                var surroundtag = top.tinymce.activeEditor.selection.getNode();

                //alert('content before add surrounding: ' + selcontent);
                if (surroundtag.nodeName !== 'SPAN' || surrounttag.id !== set_name + '_' + set_id) {
                    // create surrounding tag
                    var span_infotag = document.createElement('span');
                    span_infotag.className = 'inf_' + set_name + ' information';
                    span_infotag.id = set_name + '_' + set_id;
                    // Add surrouding information tag
                    selcontent = '<span class="inf_' + set_name + ' information ' + set_name + '_' + set_id + '">'
                            + selcontent + '</span>';
                }

                // Insert changes into editor
                top.tinymce.activeEditor.selection.setContent(selcontent);

                // Get all contained spanns
                var spans = surroundtag.getElementsByTagName("span");
                for (var i = 0; i < spans.length; i++) {
                    if (spans[i].className === 'inf_' + set_name + ' information') {
                        var spanschilds = spans[i].childNodes;
                        for (var j = 0; j < spanschilds.length; j++) {
                            if (spanschilds[j].className === 'inf_' + set_name + ' information') {
                                alert('found child!');
                            }

                        }

                        // Get inner html
                        var innercontent = spans[i].childNodes;
                        var lastNode = null;
                        // Work each child node
                        for (var j = innercontent.length - 1; j > 0; j--) {
                            if (j === (innercontent.length - 1)) {
                                // Replace child
                                spans[i].parentNode.replaceChild(innercontent[j], spans[i]);
                                lastNode = innercontent[j];
                            } else {
                                // Add child
                                spans[i].parentNode.insertBefore(innercontent[j], lastNode);
                                lastNode = innercontent[j];
                            }
                        }
                    }
                }

            } else {
                //Open editor window for manual information ordering, if automatic failed
                tinymce.activeEditor.windowManager.open({
                    title: "mark existing information",
                    url: 'http://127.0.0.1/InformationManager/Services/InformationManager/index.php?information_id=' + set_name + '_' + set_id + '&parent_id=' + parent_name + '_' + parent_id + '&dimenson_json=' + escape(answer),
                    width: 700,
                    height: 600
                });
            }
        }
    };
    // Try automatic parse informations from string
    xmlhttp.open("POST", "http://127.0.0.1/InformationManager/Services/InformationManager/ajaxhandler.php", true);
    xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xmlhttp.send('action=getDimensionSuggestions&content=' + escape(selcontent) + '&set_name=' + set_name + '&set_id=' + set_id);


    // Check if selected content is end of whole content
//    var stripedContent = stripHTML(top.tinymce.activeEditor.getContent());
//    var stripedSelection = stripHTML(selcontent);
//    var lastpos = stripedContent.lastIndexOf(stripedSelection);
//    lastpos = lastpos + stripedSelection.length;
//    var contentlength = stripedContent.length;
//
//    selcontent = '<span class="inf_' + set_name + ' information"' +
//                ' id="' + set_name + '_' + set_id + '">' + selcontent + '</span>';
//    // Add space for further editing
//    if(lastpos===contentlength)
//        selcontent += '&nbsp;';
//
//    top.tinymce.activeEditor.selection.setContent(selcontent);
//    top.tinymce.activeEditor.dom.loadCSS('http://127.0.0.1/InformationManager/Services/RTE/tinymce_plugins/informationmanager/informations.css');

}