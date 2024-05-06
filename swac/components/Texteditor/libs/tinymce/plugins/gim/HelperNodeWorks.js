/**
 *	This file contains functions for work with nodes in dom documents
 */

/**
 * Creates a deep copy of an xml node
 * 
 * @param {node} nodeToCopy Node to copy
 * @returns {Element}   Copy of the node
 */
function deepCopyNode(nodeToCopy) {
    // New node
    var nodeCopy = document.createElement(nodeToCopy.nodeName);
    nodeCopy.innerHTML = nodeToCopy.innerHTML;
    return nodeCopy;
}

/**
 *	Searches for a node with the given name and class in DOM tree. Beginning at the given rootNode.
 *
 *	@param	nodeName	nodeName of the searched node (e.g. div, a, etc.)
 *	@param	nodeClass	class of the searched node. (Can be ''. Finds a node with more than the given class, too.)
 *	@param	rootNode	DOM node to start search from.
 *	@return	searched node if found, false otherwise
 */
function searchParentNode(nodeName, nodeClass, rootNode) {
    if (rootNode === null)
        return false;

    var rootName = rootNode.nodeName;
    rootName = rootName.toLowerCase();
    var searchedName = nodeName;
    searchedName = searchedName.toLowerCase();

    if (rootName === searchedName && nodeClass === '') {
        return rootNode;
    } else if (rootName === searchedName && rootNode.className.indexOf(nodeClass) !== -1) {
        return rootNode;
    } else if (typeof rootNode.parentNode !== 'undefined') {
        return searchParentNode(searchedName, nodeClass, rootNode.parentNode);
    } else {
        return false;
    }
}

/**
 *	Removes the given node and replaces it with all of its childs.
 *
 *	@param nodeToRemove	DOM Node to remove from document
 *	@param moveToEnd	boolean true if cursor should move to the end of the nodes after operation
 *	@return targetNode	Node which now contains the child elements
 */
function removeNodeKeepChilds(nodeToRemove, moveToEnd) {
    var lastnode = null;
    // Parent node
    var targetNode = nodeToRemove.parentNode;
    // If there is no parent do not remove
    if (typeof targetNode === 'undefined') {
        return null;
    }

    // Temporary node to collect all childs from the node that will be removed
    foo = document.createElement('foo');
    foo.innerHTML = nodeToRemove.innerHTML;
    while (foo.firstChild) {
        // Also removes child nodes from 'foo'
        lastnode = foo.firstChild;
        // Add child direct before the node that will be removed
        targetNode.insertBefore(foo.firstChild, nodeToRemove);
    }
    // Remove now empty source node
    targetNode.removeChild(nodeToRemove);

    if (moveToEnd === true) {
        var lastnode = lastnode;
        while (lastnode.lastChild !== null) {
            lastnode = lastnode.lastChild;
        }

        // select the new inserted node
        tinymce.activeEditor.selection.select(lastnode);
        // colapse selection to move carret to its end
        tinymce.activeEditor.selection.collapse(false);
    }

    // Return last node of the moved childs
    return targetNode;
}

/**
 *	Changes a node into an element with the given name
 *
 *	@param 	nodeToChange	Node to change
 *	@param	newNodeName	Destination element name
 *	@param	moveToEnd	If true cursor is moved to end after operation
 *	@return newNode		New generated node
 */
function changeNodeKeepChilds(nodeToChange, newNodeName, moveToEnd) {
    // Temporary node to collect all childs from the node that will be removed
    newNode = document.createElement(newNodeName);
    newNode.innerHTML = nodeToChange.innerHTML;
    nodeToChange.parentNode.replaceChild(newNode, nodeToChange);
    // Return last node of the moved childs
    return newNode;
}

/**
 *	Removes the parent node and keeps all of his child nodes. This will move to the level of the parent node
 *
 *	@param nodeName		Name of the parent node which should be removed.
 *	@param nodeClass	Class of the parent node, which should be removed.
 *	@param rootNode		DOM node to start search from.
 *	@param moveToEnd	boolean true if cursor should move to the end of the nodes after operation
 *	@return targetNode	Node which now contains the child elements
 */
function removeParentNodeKeepChilds(nodeName, nodeClass, rootNode, moveToEnd) {
    // Search the node to remove
    var nodeToRemove = searchParentNode(nodeName, nodeClass, rootNode);

    return removeNodeKeepChilds(nodeToRemove, moveToEnd);
}

/**
 *	Removes a placeholder node.
 *
 *	@param selectedNode Node which is contained in a placeholder
 *	@return	 targetNode	Node which now contains the child elements
 */
function removePlaceholderNode(selectedNode) {
    var targetNode = null;
    // Remove placeholder mark if entered into a placeholder
    var placeholderNode = searchParentNode('SPAN', 'placeholder', selectedNode);
    if (placeholderNode !== false) {
        // remove marking placeholder node
        targetNode = removeParentNodeKeepChilds('SPAN', 'placeholder', selectedNode, false);

        selectedNode = tinymce.activeEditor.selection.getNode();
        // remove no longer needed spaces
        selectedNode.innerHTML = selectedNode.innerHTML.replace(/&nbsp;/g, '').replace(/^\s+|\s+$/g, "");
        // add needed spaces
        var replacer = new RegExp('<span class="placeholder"></span>', "g");
        selectedNode.innerHTML = selectedNode.innerHTML.replace(replacer, '<span class="placeholder">&nbsp;&nbsp;</span>');

        // Move selected node to the inserted-mark-span
        if (selectedNode.lastChild !== null) {
            selectedNode = selectedNode.lastChild;
            // Select content of the insert-mark-span
            tinymce.activeEditor.selection.select(selectedNode.lastChild);
            // colapse selection to move carret to its end
            tinymce.activeEditor.selection.collapse(false);
        }
    }
    return targetNode;
}