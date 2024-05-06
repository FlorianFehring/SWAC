/* 
 * This file contains javascript functions for menues whithin GIM
 */

/**
 * Menue for existing informations
 *    
 * @param {type} event      Event which was fired to show menue
 * @returns {undefined}     
 */
function renderExistingInformationMenu(event) {
    // Define menu items
    var items = [];
    items.push({
        name: 'mark_remove',
        text: 'MARK_REMOVE',
        tooltip: 'MARK_REMOVE_TOOLTIP',
        onclick: function () {
            markRemove(event);
        }
    });

    // Render menu
    renderContextMenu(items, event);
}

/**
 * Render menue for adding information marks
 * 
 * @param {type} event  Event that caused call of this menue
 * @param {type} editor Editor which was called
 * @returns {undefined}
 */
function renderAddInformationMenu(event, editor) {
    // Get identifier of information that contains the new marked information
    var editorid = editor.id.split("_");
    var set_name = editorid[0];
    var set_id = editorid[1];


    // Define menu items
    var items = [];

    // Add referenced informations menue
    items.push({
        text: 'ADDMARK_REFERENCED',
        menu: getReferencedInformationsMenueItems(editor, markContentWithDimension)
    });

    // Add use referenced information
    items.push({
        text: 'ADDMARK_SEARCH',
        onclick: function () {
            editor.windowManager.open({
                title: "ADDMARK_SEARCH",
                url: 'informationSearchView.xhtml?value=' + escape(editor.selection.getContent()),
                width: 700,
                height: 600
            });
        }
    });

    // Add new information for new set
    items.push({
        text: 'ADDMARK_NEW',
        menu: getSetsMenueItems(editor, callNewInformationWindow)
    });

    // Add new information from existing set
    //items.push({text: 'ADDMARK_NEWFROMSET', menu: items});

    // Render menu
    renderContextMenu(items, event);
}

/**
 * Calls window for creating an new information
 * 
 * @param {type} editor     Editor who called the window
 * @param {type} event      Event called the action
 * @returns {undefined}
 */
function callNewInformationWindow(editor, event) {
    var parent_id_parts = editor.id.split('_');
    // Get set_name from clicked node id
    var set_name = event.target.id;
    set_name = set_name.replace("-text", "");
    // Open new information dialog
    editor.windowManager.open({
        title: 'ADDMARK_NEW',
        url: 'informationCreationView.xhtml?set_name=' + set_name + '&parent_set_name=' + parent_id_parts[0] + '&parent_set_id=' + parent_id_parts[1] + '&create=true&caller=Tiny&value=' + escape(editor.selection.getContent()),
        width: 1000,
        height: 600
    });
}

function saveNewInformationWindow() {
    alert("SAVE!");
    top.tinymce.activeEditor.windowManager.close();
}

/**
 * Renders an menue for displaying selection of dimension
 * 
 * @param {type} event
 * @returns {undefined}
 */
function renderDimSelectionMenu(event) {
    // Define menu items
    var items = [];
    var selectionNode = event.target;
    // Create menu entry for every span contained in clicked node
    var elements = event.target.getElementsByTagName("span");
    var i = 0;
    for (i = 0; i < elements.length; i++) {
        items.push({
            id: elements[i].id,
            text: elements[i].textContent,
            tooltip: 'MARK_DIMSELECT',
            onclick: function (e) {
                var id_parts = e.target.id.split('_');
                id_parts[2] = id_parts[2].replace("-text", "");
                replaceWithDimensionMark(selectionNode,id_parts[0],id_parts[1],id_parts[2]);
            }
        });
    }
    // Render menu
    renderContextMenu(items, event);
}

/**
 * creates an menu displaying all available sets. adds the given function as
 * onlick handler.
 * 
 * @param {type} editor             Editor reference for onclick function
 * @param {type} onclickfunction    Function to execute onclick on menu item.
 *                                  This function gets the editor and the name
 *                                  of the clicked set.
 * @returns {Array|getSetsMenueItems.menuItems} Array with menu items
 */
function getSetsMenueItems(editor, onclickfunction) {
    // Get ajax request handler
    var xmlhttp = getXMLHttp();

    // Define menu items
    var menuItems = [];
    xmlhttp.onreadystatechange = function ()
    {

        if (xmlhttp.readyState === 4 && xmlhttp.status === 200)
        {
            //List with information names
            var menuitems = null;
            try {
                var setsarray = JSON.parse(xmlhttp.responseText);
                for (var set in setsarray) {
                    menuItems.push({
                        id: setsarray[set],
                        text: setsarray[set],
                        tooltip: "Add an new " + setsarray[set] + " information",
                        onclick: function (e) {
                            onclickfunction(editor, e);
                        }
                    });
                }

            } catch (e) {
                alert("error: " + xmlhttp.responseText);
            }
        } else if (xmlhttp.readyState === 4 && xmlhttp.status === 0) {
            alert('Can not get menue from other domain.' + jsonHandlerInformation);
        }
    };
    xmlhttp.open("POST", jsonHandlerInformation, true);
    xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xmlhttp.send("get=sets");

    return menuItems;
}

/**
 * creates an menu displaying all with current open document referenced informations
 * and their dimensions. Adds the given function as onlick handler for dimensions.
 * 
 * @param {type} editor             Editor reference for onclick function
 * @param {type} onclickfunction    Function to execute onclick on menu item.
 *                                  This function gets the editor and the name
 *                                  of the clicked set.
 * @returns {Array|getSetsMenueItems.menuItems} Array with menu items
 */
function getReferencedInformationsMenueItems(editor, onclickfunction) {
    // Get node of area where to search for informations
    var childarea = document.getElementById("informationViewInfoPanelForm\:relationtreeform\:child_informations_tree");

    // Get elements
    var xpath = ".//span[contains(@class,'inf_')]";
    var infSpans = document.evaluate(xpath, childarea, null, XPathResult.ANY_TYPE, null);

    var menuItems = [];
    var curInfSpan = infSpans.iterateNext();
    while (curInfSpan) {
        // Get all dims for information
        var xpath = ".//span[contains(@id,'" + curInfSpan.id + "_')]";
        var dimSpans = document.evaluate(xpath, childarea, null, XPathResult.ANY_TYPE, null);
        var curDimSpan = dimSpans.iterateNext();
        var dimMenuItems = [];
        while (curDimSpan) {
            var dimName = curDimSpan.childNodes[0].nodeValue;
            var dimValue = curDimSpan.childNodes[1].textContent;
            var dimDesc = dimName + " (" + dimValue + ")";

            dimMenuItems.push({
                id: curDimSpan.id,
                name: dimDesc,
                text: dimDesc,
                onclick: function (e) {
                    onclickfunction(editor, e);
                }
            });
            curDimSpan = dimSpans.iterateNext();
        }

        //Add menu entry
        menuItems.push({
            name: curInfSpan.textContent,
            text: curInfSpan.textContent,
            menu: dimMenuItems
        });
        curInfSpan = infSpans.iterateNext();
    }
    return menuItems;
}

/**
 * Creates an menue of possibile dimensions for reference
 * 
 * @param {type} menuetitle
 * @param {type} dimpossibilities
 * @returns {Element|getPossibilitiesMenue.menueNode}
 */
function getPossibilitiesMenue(menuetitle, dimpossibilities) {
    var menueNode = document.createElement("span");
    menueNode.className = 'gim_dimselection';
    menueNode.textContent = menuetitle;
    var key;
    for (key in dimpossibilities) {
        var curSpan = dimpossibilities[key];

        // Build description
        var idParts = curSpan.parentNode.id.split("_");
        // Get informations title (span containing this info has the id from idparts0+1)
        var informationTitle = document.getElementById(idParts[0] + "_" + idParts[1]).childNodes[0].nodeValue.trim();
        var dimensionName = idParts[2];
        var desc = informationTitle + " > " + dimensionName + " (" + curSpan.textContent + ")";

        var curPossibilityMenueEntry = document.createElement("span");
        curPossibilityMenueEntry.id = key;
        curPossibilityMenueEntry.innerHTML = desc;
        menueNode.appendChild(curPossibilityMenueEntry);
    }

    return menueNode;
}







function createMenuItemsFromJson(json_obj, parent_name, parent_id, mode) {
    var menuItems = [];

    // Look at each set
    if (typeof json_obj['set'] !== 'undefined') {
        for (var i in json_obj['set']) {
            var set_name = json_obj['set'][i]['set_name'];
            var setSubItems = [];

            if (typeof json_obj['set'][i]['set'] !== 'undefined') {
//                alert(set_name + 'i1: ' + i);
                setSubItems = createMenuItemsFromJson(json_obj['set'][i], set_name, -1);
//                alert(set_name + 'i2: ' + i);
            }

            //Look at each information
            if (typeof json_obj['set'][i]['infos'] !== 'undefined') {
//                alert(set_name + 'i3: ' + i);
                for (j in json_obj['set'][i]['infos']) {
                    var info = json_obj['set'][i]['infos'][j];
                    var objSubItems = [];
                    // Create sub information
                    if (info['subs']) {
                        objSubItems = createMenuItemsFromJson(info['subs'], set_name, info['set_id'], 'flat');
                    }
                    // Add object information
                    setSubItems.push({
                        name: set_name + '_' + info['set_id'],
                        text: info['shortpres'],
                        tooltip: info['shortdesc'],
                        menu: objSubItems,
                        onclick: function (e) {
                            set_parts = this._name.split('_');
                            markExistingInformation(set_parts[0], set_parts[1], parent_name, parent_id);

                            // Stop event bubbling
                            if (e.stopPropagation) {
                                // W3C-DOM-Standard
                                e.stopPropagation();
                            } else {
                                // for IE < 9
                                e.cancelBubble = true;
                            }
                        }
                    });
                }

            }

            // Add submenue if exists
            if (setSubItems.length > 0 && mode === 'flat') {
                // Add menu without submenu
                menuItems.push({
                    name: set_name,
                    text: set_name,
                    onclick: function (event) {
                        markNewInformation(parent_name, parent_id, this._name, event);
                    }
                });
                // Add separator
                menuItems.push({
                    text: '----'
                });
                // Add subitems
                for (var k = 0; k < setSubItems.length; k++) {
                    menuItems.push(setSubItems[k]);
                }
            } else
            if (setSubItems.length > 0) {
//                alert('i3: ' + i);
                menuItems.push({
                    name: set_name,
                    text: set_name,
                    menu: setSubItems,
                    onclick: function (event) {
                        // Prevent execution on click on sub items
                        // Alternative: this._text===event.target['innerHTML']
                        if (event.target['id'] === this._id || event.target['id'] === this._id + '-text') {
                            markNewInformation(parent_name, parent_id, this._name, event);
                        }
                    }
                });
            } else {
                // Add menu without submenu
                menuItems.push({
                    name: set_name,
                    text: set_name,
                    onclick: function (event) {
                        markNewInformation(parent_name, parent_id, this._name, event);
                    }
                });
            }
        }
    }

    return menuItems;
}

