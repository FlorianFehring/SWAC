/**
 *	This file contains helper methods for inserting content into the active tinymce editor
 */

/**
 *	Inserts a DOM node at cursors position
 *
 *	@param	event			Event as source for the insert
 *	@param	baseNodeName	Name of the base node. This is the node which contents should be inserted, it can be a parent of the clicked node
 *	@param	noNestedBase	If true nested base nodes are avoided
 *	@param	menuitem		Menuitem to close after operation
 *	@param	defContent		String Content to insert, if no source element exists	//TODO is this really needed?
 *	@return boolean			False if the baseNode of the clicked node was not found
 */
function insertClickedNode(event, baseNodeName, noNestedBase, menuitem, defContent) {
    // Compatibility for IE
    if (event == null) {
        event = window.event;
    }

    var targetElement = event.target;
    // If no node was clicked
    if (targetElement === null) {
        insertHTML(event, defContent, menuitem);
    } else {
        // Get node where to insert
        var insertPositionNode = tinymce.activeEditor.selection.getNode();
        if (insertPositionNode.nodeName === 'SPAN') {
            insertPositionNode = insertPositionNode.parentNode;
            insertPositionNode.innerHTML = '';
        }

        // Get node to insert
        var insertContentNodes = [];
        insertContentNodes[0] = searchParentNode(baseNodeName, '', event.target);
        if (insertContentNodes[0] == false) {
            return false;
        }

        // If history plugin is active, use it
        for (plugin in tinymce.activeEditor.plugins) {
            if (plugin == 'history') {
                // Add complete clicked node to history
                var insertNode = deepCopyNode(insertContentNodes[0]);
                addHistoryMenuItem(insertNode);
            }
        }

        // Search for a parent node
        var insertBaseNode = searchParentNode(baseNodeName, '', insertPositionNode);
        // Avoid nested nodes if activated
        // If base node was found remove base node from insertion
        if (insertBaseNode !== false && noNestedBase === true && insertContentNodes[0].nodeName === baseNodeName) {
            // Set array to child nodes of the baseNode
            insertContentNodes = insertContentNodes[0].childNodes;
        }

        // Add space text nodes to begin and end if not inside
        if (insertBaseNode === false) {
            var beginTextNode = document.createTextNode(' ');
            insertContentNodes.unshift(beginTextNode);
            var endTextNode = document.createTextNode('\u001F ');
            insertContentNodes.push(endTextNode);
        }

        // Insert content nodes
        for (var i = 0; i < insertContentNodes.length; i++) {
            // Copy element nodes, keep text nodes
            if (insertContentNodes[i].nodeName === '#text') {
                insertPositionNode.appendChild(insertContentNodes[i]);
            } else {
                var codeCopy = deepCopyNode(insertContentNodes[i]);
                insertPositionNode.appendChild(codeCopy);
            }
            //tinymce.activeEditor.selection.setNode(insertContentNodes[i]);
        }

        // Remove unnecessary elements
        if (insertPositionNode.nodeName.toLowerCase() === 'mn' || insertPositionNode.nodeName.toLowerCase() === 'mi') {
            // Change parent node (mrow)
            changeNodeKeepChilds(insertPositionNode, 'mrow', true);
        } else {
            // Remove placeholder
            removePlaceholderNode(tinymce.activeEditor.selection.getNode());
        }

        // Close menu
        if (menuitem != null) {
            menuitem.parent().cancel();
        }

        // Render content new (avoid display errors on inserted sub elements)
        tinymce.activeEditor.setContent(tinymce.activeEditor.getContent());
        tinymce.activeEditor.focus();
        tinymce.activeEditor.nodeChanged();
        //tinymce.activeEditor.execCommand("mceRepaint");


        // Add undo to undomanager
        tinymce.activeEditor.undoManager.add();
    }
}

/**
 *	Inserts content into the editor and closes menue.
 *
 *	@param	event		Source event for action
 *	@param	html		Html code to insert
 *	@param	menuitem	Menuitem to close
 */
function insertHtml(event, html, menuitem) {
    // Set content
    tinymce.activeEditor.insertContent(html);
    // Remove placeholder mark
    removePlaceholderNode(tinymce.activeEditor.selection.getNode());
    // Note to recent list
    //TODO reactivate and fix the insertion after klick on element in list
    //addHistoryMenuItem(html);
    // Close menu
    if (menuitem != null) {
        menuitem.parent().cancel();
    }
}


function replaceTextWithNode(search, replaceNode) {

    // Get documents root node
    var documentNode = tinymce.activeEditor.dom.getRoot();
    // Get the surrounding p-tag
    var pNode = documentNode.firstChild;
    // Get the first child of the p-tag
    var siblingNode = pNode.firstChild;
    // Walk trough each node
    while (siblingNode !== null) {
        // Exclude information tags from beeing tagged
        if (siblingNode.nodeType === 1 && siblingNode.className.indexOf('information') !== false) {
            siblingNode = siblingNode.nextSibling;
            continue;
        }
        // Work on text nodes
        if (siblingNode.nodeType === 3) {
            // Create regular expression for search
            var expression = '\\b' + search + '\\b';
            var regEx = new RegExp(expression); //Regulärer Ausdruck: /\bMister\b/

            // Check if data contains the searched word
            var searchPos = siblingNode.data.search(regEx);

//            alert('search: ' + search + ' in: ' + siblingNode.data + ' => ' + siblingNode.data.search(regEx));
            if (searchPos !== false && searchPos !== -1) {
                var clone = replaceNode.cloneNode(true);

//                replaceNode = document.createElement('span');
//                replaceNode.textContent = 'test';

                // Remove searched word from split
                siblingNode.data = siblingNode.data.replace(regEx, '');
                var remainingTextNode = null;
                // Create text node for content before found search
                if (searchPos > 0) {
                    remainingTextNode = siblingNode.splitText(searchPos);
                }

                // Crate text node for content after found search
                if (remainingTextNode === null) {
                    // Prepend marked information if it was the first in text node
                    siblingNode.parentNode.insertBefore(clone, siblingNode);
                } else {
                    // Get next node
                    var nextNode = siblingNode.nextSibling;
                    if (nextNode !== null) {
                        // Insert marked information
                        siblingNode.parentNode.insertBefore(remainingTextNode, siblingNode.nextSibling);
                        siblingNode.parentNode.insertBefore(clone, siblingNode.nextSibling);
                    } else {
                        // If the search was the last child
                        siblingNode.parentNode.appendChild(remainingTextNode);
                        siblingNode.parentNode.appendChild(clone);
                    }
                }
            }
        }

        siblingNode = siblingNode.nextSibling;
    }
}