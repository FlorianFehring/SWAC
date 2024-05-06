/* 
 * This is an plugin for SWAC mediaeditor. It allows to set references between
 * differned medias
 */

let mediareferenceSPL = {}; // EPL = EditorPLugin
window['mediareferenceSPL'] = mediareferenceSPL;

mediareferenceSPL.mode = 'editor';
mediareferenceSPL.editorElem = null;
mediareferenceSPL.editedMedia = null;
mediareferenceSPL.mediaJoiner = {};

/**
 * Gets the referenced medias and displayes them
 * 
 * @param {object} mediaeditor Mediaeditor html element
 * @param {object} pluginarea HTML element containing the area for the plugin
 * @param {object} set Set with data of the current loaded media
 * @returns {undefined}
 */
mediareferenceSPL.init = function (mediaeditor, pluginarea, set) {
    // Get editor modal
    let searchElem = mediaeditor;
    while (mediareferenceSPL.editorElem === null && searchElem.parentNode !== null) {
        if (searchElem.hasAttribute('swac_mediaid')) {
            mediareferenceSPL.editorElem = searchElem;
            break;
        }
        searchElem = searchElem.parentNode;
    }

    mediareferenceSPL.editedMedia = set;

    // Request mediajoiner
    var querydata = {
        id: set.id
    };
    remoteHandler.fetchGet("mediajoinmedia/listByMedia", querydata, false).then(
            function (data) {
                for (let curJoiner of data.list) {
                    mediareferenceSPL.mediaJoiner[curJoiner.id] = curJoiner;
                    mediareferenceSPL.createListElemFromJoiner(curJoiner, pluginarea);
                }
            });
    // Bind add function on add button
    let bindButtonElem = pluginarea.querySelector('#swac_mediareference_add');
    bindButtonElem.addEventListener('click', mediareferenceSPL.switchToSelectOneMediaMode);
};

/**
 * Creates and adds an list entry for a joiner.
 * 
 * @param {type} joiner     Joiner for which a list entry
 * @param {type} pluginarea Area where to add the list entry
 * @returns {undefined}
 */
mediareferenceSPL.createListElemFromJoiner = function (joiner, pluginarea) {
    // Get list entry template
    let liTempl = pluginarea.querySelector('.swac_repeatForSet');

    // Create clone of template
    let curJoinerLi = liTempl.cloneNode(true);
    curJoinerLi.classList.remove('swac_repeatForSet');
    curJoinerLi.classList.add('swac_repeatedForSet');
    curJoinerLi.setAttribute('swac_setid', joiner.id);

    // Get id of joined media
    let joinedIdStr = null;
    if (joiner.media_right.indexOf('/' + mediareferenceSPL.editedMedia.id) > 0) {
        joinedIdStr = joiner.media_left;
    } else {
        joinedIdStr = joiner.media_right;
    }
    let lastSlashPos = joinedIdStr.lastIndexOf("/");
    let joinedId = parseInt(joinedIdStr.substring(lastSlashPos + 1));

    // Get joined media
    let curJoinedSet = null;
    for (let curMedia of window["mediapreviews"]) {
        if (curMedia.id === joinedId) {
            curJoinedSet = curMedia;
            break;
        }
    }

    // Create code for list joined media
    let curMediaCode = mediareferenceSPL.createMediaCode(curJoinedSet);
    // Add new created media code element
    curJoinerLi.insertBefore(curMediaCode, curJoinerLi.firstChild);

    // Register function for deleteing joiner
    let delButton = curJoinerLi.querySelector('.swac_mediareference_delete');
    delButton.addEventListener('click', mediareferenceSPL.performDeleteLink);

    liTempl.parentNode.appendChild(curJoinerLi);
};

/**
 * Brings the galery to an select media mode, in which medias could be selected by clicking.
 * 
 * @param {object} evt Event that called the select mode
 */
mediareferenceSPL.switchToSelectOneMediaMode = function (evt) {
    mediareferenceSPL.mode = 'selectOne';

    // Add information to mediapreview
    let infobox = document.querySelector('#swac_mediapreview_msg');
    let infotxt = document.createTextNode(SWAC_lang.de.mediaeditor.mediareference.selectMediaForLinking);
    infobox.insertBefore(infotxt, infobox.firstChild);
    infobox.classList.remove('swac_dontdisplay');
    // Show cancle button
    let cbutton = infobox.querySelector('a');
    cbutton.addEventListener('click', mediareferenceSPL.switchToEditorMode);
    cbutton.classList.remove('swac_dontdisplay');

    // get mediapreview element
    let mediapreviewElem = document.querySelector('.swac_mediapreview');

    // get media divs
    let mediadivElems = mediapreviewElem.querySelectorAll('.swac_repeatedForSet');

    for (let curMediaDiv of mediadivElems) {
        curMediaDiv.removeEventListener('click', SWAC_mediapreview.onClickToOpenEditor, false);
        curMediaDiv.addEventListener('click', mediareferenceSPL.performCreateLink);
    }

    // Hide editor modal
    var modal = UIkit.modal(mediareferenceSPL.editorElem);
    modal.hide();
};

/**
 * Leves the select mode without selecting anything
 * 
 * @param {type} evt
 * @returns {undefined}
 */
mediareferenceSPL.switchToEditorMode = function (evt) {
    mediareferenceSPL.mode = 'editor';
    // Add information to mediapreview
    let infobox = document.querySelector('#swac_mediapreview_msg');
    infobox.removeChild(infobox.firstChild);
    infobox.classList.add('swac_dontdisplay');
    // Show cancle button
    let cbutton = infobox.querySelector('a');
    cbutton.removeEventListener('click', mediareferenceSPL.switchToEditorMode);
    cbutton.classList.add('swac_dontdisplay');

    // get mediapreview element
    let mediapreviewElem = document.querySelector('.swac_mediapreview');
    // get media divs
    let mediadivElems = mediapreviewElem.querySelectorAll('.swac_repeatedForSet');

    for (let curMediaDiv of mediadivElems) {
        curMediaDiv.removeEventListener('click', mediareferenceSPL.performCreateLink);
        curMediaDiv.addEventListener('click', SWAC_mediapreview.onClickToOpenEditor, false);
    }
};

/**
 * Creates an link beteen two medias from the clicked media
 * 
 * @param {type} evt Event that called the create action
 * @returns {undefined}
 */
mediareferenceSPL.performCreateLink = function (evt) {
    // Prevent adding one more link at the same time
    mediareferenceSPL.switchToEditorMode(evt);
    // Reopen editor window
    var modal = UIkit.modal(mediareferenceSPL.editorElem);
    modal.show();

    // Get ids of referenced medias
    let media_right_id = mediareferenceSPL.editedMedia.id;
    let setElem = null;
    let searchElem = evt.target;
    while (setElem === null && searchElem.parentNode !== null) {
        if (searchElem.classList.contains('swac_repeatedForSet')) {
            setElem = searchElem;
            break;
        }
        searchElem = searchElem.parentNode;
    }
    let media_left_id = parseInt(setElem.getAttribute('swac_setid'));

    // Check if it's a try to self itself
    if (media_right_id === media_left_id) {
        UIkit.notification({
            message: 'Ein Medium kann nicht mit sich selbst verlinkt werden.',
            status: 'primary',
            pos: 'top-center',
            timeout: 5000
        });
        return;
    }

    // Get pluginarea
    let pluginarea = document.getElementById('swac_epl_mediareference');

    let querydata = {
        media_right: 'ref://' + media_right_id,
        media_left: 'ref://' + media_left_id
    };
    remoteHandler.fetchCreate("mediajoinmedia/create", querydata, false).then(
            function (joiner) {
                mediareferenceSPL.mediaJoiner[joiner.id] = joiner;
                mediareferenceSPL.createListElemFromJoiner(joiner, pluginarea);
            });
};

/**
 * Deleteing an joiner between medias
 * 
 * @param {type} evt
 * @returns {undefined}
 */
mediareferenceSPL.performDeleteLink = function (evt) {
    // Search for elem with swac_id
    let listElem = null;
    let searchElem = evt.target;
    while (listElem === null && searchElem.parentNode !== null) {
        if (searchElem.hasAttribute('swac_setid')) {
            listElem = searchElem;
            break;
        }
        searchElem = searchElem.parentNode;
    }
    let joinerid = parseInt(listElem.getAttribute('swac_setid'));

    let querydata = {
        id: joinerid
    };
    remoteHandler.fetchDelete("mediajoinmedia/delete", querydata, false).then(
            function (response) {
                // Remove list element
                listElem.parentNode.removeChild(listElem);
            });
};

/**
 * Function for createing media code
 * 
 * @param {type} set Set with media information
 * @returns {undefined}
 */
mediareferenceSPL.createMediaCode = function (set) {
    let mediacode;
    // Call type depending preview insertion methods
    if (set.mimetype.indexOf('image/') !== -1) {
        mediacode = mediareferenceSPL.createImageCode(set);
    } else if (set.mimetype.indexOf('video/') !== -1) {
        mediacode = mediareferenceSPL.createVideoCode(set);
    } else {
        console.log("SWAC: Error: Mimetype >" + set.mimetype + "< is not supported.");
    }
    return mediacode;
};

/**
 * Creates code for display an related image preview with functions for
 * overlay.
 * 
 * @param {type} set Set which is linked
 * @returns {Element|mediareferenceSPL.createImageCode.codeElem}
 */
mediareferenceSPL.createImageCode = function (set) {
    let codeElem = document.createElement('span');

    // create image element
    let imgElem = document.createElement('img');
    imgElem.setAttribute('src', set.preview);
    if (typeof set.title !== 'undefined') {
        imgElem.setAtttibute('title', set.title);
    } else {
        imgElem.setAttribute('title', 'Bild ohne Titel');
    }
    // Add onClick handler
    imgElem.addEventListener('click', mediareferenceSPL.linkedClicked);
    codeElem.appendChild(imgElem);

    // Create slider element
    let sliderElem = document.createElement('input');
    sliderElem.setAttribute('type', 'range');
    sliderElem.setAttribute('min', 0);
    sliderElem.setAttribute('max', 100);
    sliderElem.setAttribute('value', 50);
    sliderElem.setAttribute('disabled', 'disabled');
    sliderElem.id = 'alpha_' + set.id;
    // Add onChange handler
    sliderElem.addEventListener('change', mediareferenceSPL.changeCanvasAlpha);
    codeElem.appendChild(sliderElem);

    return codeElem;
};

mediareferenceSPL.createVideoCode = function (set) {
    console.error('SWAC EPL mediareference: createVideoCode not implemented yet.');
};

/**
 * Executed when an linked media was clicked
 * 
 * @param {event} evt Event that called the linkedClicked function
 */
mediareferenceSPL.linkedClicked = function (evt) {
    // Get id of joined media
    let joinedId = mediareferenceSPL.getJoinedId(evt);

    // get canvas layer if exists
    let canvasLayer = document.querySelector('.swac_medialayer_' + joinedId);

    // Search setArea (for referenced set)
    let setArea = null;
    let searchElem = evt.target;
    while (setArea === null && searchElem.parentNode !== null) {
        if (searchElem.classList.contains('swac_repeatedForSet')) {
            setArea = searchElem;
            break;
        }
        searchElem = searchElem.parentNode;
    }
    
    // Check if layer is allready displayed
    if (canvasLayer === null) {
        // Get media in full resolution
        
        let mediaPromise = SWAC_mediaeditor.getMedia(joinedId);
        mediaPromise.then(function (media) {
            // create media layer
            return SWAC_mediaeditor.createImageLayer(media);
        }).then(function(canvasLayer) {
            return SWAC_mediaeditor.showCanvasLayer(canvasLayer);
        }).then(function (canvasLayer) {
            mediareferenceSPL.addAlphaOptionsToLayer(canvasLayer);
        });

        // Remove disables state of reference controls
        let refControls = setArea.querySelectorAll('input');
        for (let curControl of refControls) {
            curControl.removeAttribute('disabled');
        }
    } else {
        let layer = SWAC_mediaeditor.getCanvasLayerForMedia({id: joinedId});
        // Remove canvas layer
        SWAC_mediaeditor.hideCanvasLayer(layer);
        // Disable state of reference controls
        let refControls = setArea.querySelectorAll('input');
        for (let curControl of refControls) {
            curControl.setAttribute('disabled', 'disabled');
        }
    }
};

/**
 * Adds alpha transperency to canvas layer
 * 
 * @param {type} canvaslayer
 * @returns {undefined}
 */
mediareferenceSPL.addAlphaOptionsToLayer = function (canvaslayer) {
    //TODO start with opacity that is currently set in scale input
    canvaslayer.style.opacity = '0.5';
};

/**
 * Changes the opacity of the canvas layer where the slider is changed.
 * 
 * @param {type} evt Change event calling an opacity change
 * @returns {undefined}
 */
mediareferenceSPL.changeCanvasAlpha = function (evt) {
    // Get id of joined media
    let joinedId = mediareferenceSPL.getJoinedId(evt);
    // Get cavans for joined media
    let canvasLayer = SWAC_mediaeditor.getCanvasLayerForMedia({id: joinedId});

    let opaval = parseInt(evt.target.value);
    opaval = opaval / 100;
    canvasLayer.style.opacity = opaval;
};

mediareferenceSPL.getJoinerId = function (evt) {
    // Search for elem with swac_id
    let listElem = null;
    let searchElem = evt.target;
    while (listElem === null && searchElem.parentNode !== null) {
        if (searchElem.hasAttribute('swac_setid')) {
            listElem = searchElem;
            break;
        }
        searchElem = searchElem.parentNode;
    }
    return parseInt(listElem.getAttribute('swac_setid'));
};

mediareferenceSPL.getJoinedId = function (evt) {
    let joinerId = mediareferenceSPL.getJoinerId(evt);
    // Get mediaid
    let joiner = mediareferenceSPL.mediaJoiner[joinerId];
    // Get id of joined media
    let joinedIdStr = null;
    if (joiner.media_right.indexOf('/' + mediareferenceSPL.editedMedia.id) > 0) {
        joinedIdStr = joiner.media_left;
    } else {
        joinedIdStr = joiner.media_right;
    }
    let lastSlashPos = joinedIdStr.lastIndexOf("/");
    return parseInt(joinedIdStr.substring(lastSlashPos + 1));
};