import SWAC from '../../../../swac.js';
import Msg from '../../../../Msg.js';
import Plugin from '../../../../Plugin.js';
import Model from '../../../../Model.js';

export default class MediatagsSPL extends Plugin {

    constructor(options = {}) {
        super(options);
        this.name = 'Mediaeditor/plugins/Mediatags';
        this.desc.depends[0] = {
            name: 'Line.js',
            path: SWAC.config.swac_root + 'components/Mediaeditor/plugins/Mediatags/Line.js',
            desc: 'Represents a line of a polygon.'
        };
        this.desc.depends[1] = {
            name: 'LineFunction.js',
            path: SWAC.config.swac_root + 'components/Mediaeditor/plugins/Mediatags/LineFunction.js',
            desc: 'Represents a line as a function f(x)=mx+b'
        };
        this.desc.depends[2] = {
            name: 'LineSegment.js',
            path: SWAC.config.swac_root + 'components/Mediaeditor/plugins/Mediatags/LineSegment.js',
            desc: 'Represents a linesegment between two points'
        };
        this.desc.depends[3] = {
            name: 'Polygon.js',
            path: SWAC.config.swac_root + 'components/Mediaeditor/plugins/Mediatags/Polygon.js',
            desc: 'Represents a Polygon as set of vertices.'
        };
        this.desc.depends[4] = {
            name: 'Vertex.js',
            path: SWAC.config.swac_root + 'components/Mediaeditor/plugins/Mediatags/Vertex.js',
            desc: 'Vertex Class, represents a vertex or a point (2-dimensional).'
        };
        this.desc.templates[0] = {
            name: 'mediatags',
            desc: 'Default template createing gui elements for createing media tags'
        };
        this.desc.opts[0] = {
            name: 'tagtypesrequestor',
            desc: 'A datarequestor that specifies where the possible tagtypes can be optained from. A tagtype has id, title, description, tagtype, media and polygons attributes.'
        };
        if (!this.options.tagtypesrequestor)
            this.options.tagtypesrequestor = null;
        this.desc.opts[1] = {
            name: 'tagsrequestor',
            desc: 'A datarequestor that specifies where the existing tags can be optained from. Use the {media.id} placeholder in an attribute to insert the medias id.'
        };
        if (!this.options.tagsrequestor)
            this.options.tagsrequestor = null;

        // internal attributes
        this.currentDrawStartElem = null;
    }

    init() {
        return new Promise((resolve, reject) => {
            // Create lists of possible tagtypes
            this.createPossibleTagtypesList();

            // Get datasets
            let data = this.requestor.parent.swac_comp.data;
            for (let curSource in data) {
                for (let curSet of data[curSource]) {
                    // Create a list of existing tags for each media dataset
                    this.createExistingTags(curSource, curSet);
                }
            }
            resolve();
        });
    }

    /**
     * Creates a list of possible tagtypes for each media thats loaded
     * 
     * @returns {undefined}
     */
    createPossibleTagtypesList() {
        if (!this.options.tagtypesrequestor) {
            Msg.error('MediatagsSPL', 'The option >tagtypesrequestor< is not set. You must specify a requestor where the plugin can get informations about possible tagtypes. Otherwise no new tags can be created.');
            return;
        }

        // Get addTag-Buttons
        let addTagButtons = this.requestor.parent.querySelectorAll('.swac_mediatags_add');
        let selectTypeElems = this.requestor.parent.querySelectorAll('.swac_mediatags_typeselect');

        let thisRef = this;
        // Get available tags
        Model.load(this.options.tagtypesrequestor).then(function (model) {
            if (model.data.length < 1) {
                // Hide buttons
                for (let curAddTagButton of addTagButtons) {
                    curAddTagButton.classList.add('swac_dontdisplay');
                    let msg = document.createTextNode(SWAC.lang.dict.Mediaeditor.mediatags.noadding);
                    curAddTagButton.parentNode.appendChild(msg);
                }
            } else {
                // Add posible tags to selection boxes
                for (let curSelectTypeElem of selectTypeElems) {
                    for (let curTag of model.data) {
                        // Create option
                        let curOpt = document.createElement('option');
                        curOpt.setAttribute('value', curTag.id);
                        curOpt.innerHTML = curTag.name;
                        curSelectTypeElem.appendChild(curOpt);
                    }
                }
                // Bind add function on add button
                for (let curAddTagButton of addTagButtons) {
                    curAddTagButton.addEventListener('click', thisRef.startCreateTag.bind(thisRef));
                }
            }
        }).catch(function (error) {
            Msg.error('MediatagsSPL', 'Could not create tagtype selection box: ' + error);
            // Hide buttons
            for (let curAddTagButton of addTagButtons) {
                curAddTagButton.classList.add('swac_dontdisplay');
                let msg = document.createTextNode(SWAC.lang.dict.Mediaeditor.mediatags.noaddingfailure);
                curAddTagButton.parentNode.appendChild(msg);
            }
        });
    }

    /**
     * Creates list entry and visualisation of existing tags for a given dataset.
     * 
     * @param {String} fromName Name of the source the dataset is from
     * @param {Object} set The media dataset with at least id attribute
     * @returns {undefined}
     */
    createExistingTags(fromName, set) {
        if (!this.options.tagsrequestor) {
            let msg = 'The option >tagsrequestor< is missing. You must specify a source for existing tags.';
            Msg.error('MediatagsSPL', msg);
            throw(msg);
        }
        let requestor = Object.assign({}, this.options.tagsrequestor);
        // Replace placeholder
        for (let curAttr in requestor) {
            if (typeof requestor[curAttr] === 'string') {
                requestor[curAttr] = requestor[curAttr].replace('{media.id}', set.id);
            } else if (typeof requestor[curAttr] === 'object') {
                requestor[curAttr] = Object.assign({}, requestor[curAttr]);
                for (let curSubAttr in requestor[curAttr]) {
                    if (typeof requestor[curAttr][curSubAttr] === 'string') {
                        requestor[curAttr][curSubAttr] = requestor[curAttr][curSubAttr].replace('{media.id}', set.id);
                    }
                }
            }
        }

        // Load existing tags for media
        let thisRef = this;
        Model.load(requestor).then(function (models) {
            // Save existing tags
            if (!thisRef.data[requestor.fromName]) {
                thisRef.data[requestor.fromName] = [];
            }
            thisRef.data[requestor.fromName] = models;
            for (let i in models.data) {
                let curMediaTag = models.data[i];
                if (curMediaTag.polygons) {
                    let layer = thisRef.createMediaTagLayer(curMediaTag, fromName, set);
                    thisRef.createMediaTagListEntry(curMediaTag, set, layer);
                }
            }
            if (models.data.length === 0) {
                // Find all areas for the current set and search the taglist within
                let setElems = thisRef.requestor.querySelectorAll('[swac_setid="' + set.id + '"]');
                for (let curSetElem of setElems) {
                    let tagsElem = curSetElem.querySelector('.swac_mediatags_list');
                    if (tagsElem) {
                        let repeatForElem = tagsElem.querySelector('.swac_repeatForSet');
                        let repeatedElem = repeatForElem.cloneNode(true);
                        repeatedElem.classList.remove('swac_repeatForSet');
                        repeatedElem.classList.add('swac_noSets');
                        repeatedElem.innerHTML = SWAC.lang.dict.Mediaeditor.mediatags.notags;
                        repeatForElem.parentNode.appendChild(repeatedElem);
                    }
                }
            }
        }).catch(function (error) {
            let errorMsg;
            if (error.status === 404) {
                errorMsg = 'No file with tags found.';
            } else {
                errorMsg = 'Other error occured: ' + error.statusText;
            }

            Msg.error('MediatagsSPL',
                    'Could not recive list of tags for >'
                    + fromName + '[' + set.id + ']<: ' + errorMsg);
            let setElems = thisRef.requestor.querySelectorAll('[swac_setid="' + set.id + '"]');
            for (let curSetElem of setElems) {
                let tagsElem = curSetElem.querySelector('.swac_mediatags_list');
                if (tagsElem) {
                    let repeatForElem = tagsElem.querySelector('.swac_repeatForSet');
                    let repeatedElem = repeatForElem.cloneNode(true);
                    repeatedElem.classList.remove('swac_repeatForSet');
                    repeatedElem.classList.add('swac_repeatedForSet');
                    repeatedElem.innerHTML = SWAC.lang.dict.Mediaeditor.mediatags.notagsfailure;
                    repeatForElem.parentNode.appendChild(repeatedElem);
                }
            }
        });
    }

    /**
     * Adds a layer for the given media tag
     * 
     * @param {Object} mediaTag MediaTag object with id, title and description
     * @param {String} fromName Name of the dataset the media belongs to
     * @param {Object} set Dateset with media information the tag belongs to
     * @returns {DOMElement} created drawlayer
     */
    createMediaTagLayer(mediaTag, fromName, set) {
        if (mediaTag.polygons) {
            if (typeof mediaTag.polygons === 'string'
                    ) {
                mediaTag.polygons = JSON.parse(mediaTag.polygons);
                Msg.warn('MediatagSPL', 'mediaTag.polygons are deliverd as string. Please use json array instead.');
            }

            // Search the area containing the media
            let mediaContArea = this.requestor.parent.swac_comp.getMediaContArea(fromName, set.id);
            // Get scaleElem
            let scaleElem = mediaContArea.querySelector('[scale]');
            let scale = scaleElem.getAttribute('scale');
            // Create drawing layer
            let drawlayer = this.requestor.parent.swac_comp.createDrawingLayer(fromName, set.id);
            drawlayer.swac_mediaTag = mediaTag;
            drawlayer.swac_polygons = [];
            let ctx = drawlayer.getContext("2d");
            // Draw polygons
            for (let curPoly of mediaTag.polygons) {
                let poly = new Polygon();
                if (curPoly.vertices) {
                    for (let curPoint of curPoly.vertices) {
                        let vertex = new Vertex(curPoint.x * scale, curPoint.y * scale);
                        poly.addVertex(vertex);
                    }
                    try {
                        poly.draw(ctx);
                    } catch (error) {
                        Msg.error('MediatagsSPL', 'Could not draw polygon: ' + error);
                    }
                    drawlayer.swac_polygons.push(poly);
                } else {
                    Msg.warn('MediatagsSPL', 'A polygon does not contain vertices.');
                }
            }
            return drawlayer;
        }
        return null;
    }

    /**
     * Adds an mediaTag to the tagList in pluginarea
     * 
     * @param {Object} mediaTag MediaTag object with id, title and description
     * @param {Object} mediaSet Dateset with media information the tag belongs to
     * @param {Canvas} layer Layer element the list entry belongs to
     * @returns {undefined}
     */
    createMediaTagListEntry(mediaTag, mediaSet, layer) {
        // Remove no sets info
        let noSetsElem = this.requestor.parent.querySelector('.swac_noSets');
        if (noSetsElem)
            noSetsElem.parentNode.removeChild(noSetsElem);
        // Find all areas for the current set and search the taglist within
        let setElems = this.requestor.parent.querySelectorAll('[swac_setid="' + mediaSet.id + '"]');
        for (let curSetElem of setElems) {
            let tagsElem = curSetElem.querySelector('.swac_mediatags_list');
            if (tagsElem) {
                let repeatForElem = tagsElem.querySelector('.swac_repeatForSet');
                let repeatedElem = repeatForElem.cloneNode(true);
                repeatedElem.classList.remove('swac_repeatForSet');
                repeatedElem.classList.add('swac_repeatedForSet');
                // Replace title and description
                repeatedElem.innerHTML = repeatedElem.innerHTML
                        .replace('{title}', mediaTag.title);
                let tooltiptxt = repeatedElem.getAttribute('uk-tooltip');
                tooltiptxt = tooltiptxt.replace('{description}', mediaTag.description);
                repeatedElem.setAttribute('swac_setid', mediaTag.id);
                repeatedElem.setAttribute('uk-tooltip', tooltiptxt);
                // Register functions
                repeatedElem.addEventListener('mouseover', this.onMouseoverTag.bind(this));
                repeatedElem.addEventListener('mouseleave', this.onMouseleaveTag.bind(this));
                repeatedElem.addEventListener('click', this.onClickTag.bind(this));
                repeatedElem.swac_layer = layer;
                repeatedElem.swac_mediatag = mediaTag;

                // Get edit button
                let editButton = repeatedElem.querySelector('.swac_mediatags_edit');
                editButton.addEventListener('click', this.onEditMediaTag.bind(this), false);
                // Get delete button
                let delButton = repeatedElem.querySelector('.swac_mediatags_delete');
                delButton.addEventListener('click', this.onDeleteMediaTag.bind(this), false);
                // Get warning element
                if (!mediaTag.id) {
                    let warnElem = repeatedElem.querySelector('.swac_mediatags_warning');
                    warnElem.classList.remove('swac_dontdisplay');
                    warnElem.setAttribute('uk-tooltip', SWAC.lang.dict.Mediaeditor.mediatags.notsavedtag);
                }

                repeatForElem.parentNode.appendChild(repeatedElem);
            }
        }
    }

    onMouseoverTag(evt) {
        //TODO highlight tag
    }

    onMouseleaveTag(evt) {
        //TODO unhighlight tag
    }

    /**
     * toggles the visibility of the layer.
     * 
     * @param {DOMEvent} evt
     * @returns {undefined}
     */
    onClickTag(evt) {
        evt.preventDefault();
        // Toggle layer visibility if layer exists (may not exists when deleted right before)
        if (evt.target.swac_layer) {
            if (evt.target.swac_layer.classList.contains('swac_dontdisplay')) {
                evt.target.swac_layer.classList.remove('swac_dontdisplay');
            } else {
                evt.target.swac_layer.classList.add('swac_dontdisplay');
            }
        }
    }

    /**
     * Deletes an mediatag
     * 
     * @param {DOMEvent} evt Event that requests the deletion
     * @returns {undefined}
     */
    onDeleteMediaTag(evt) {
        evt.preventDefault();

        let searchElem = evt.target;
        while (searchElem.parentNode) {
            if (searchElem.hasAttribute('swac_setid')) {
                break;
            }
            searchElem = searchElem.parentNode;
        }
        let setid = searchElem.getAttribute('swac_setid');

        // When unsaved delete by remove
        if (!setid || setid === 'undefined') {
            // Remove layer and list element
            searchElem.swac_layer.parentNode.removeChild(searchElem.swac_layer);
            searchElem.parentNode.removeChild(searchElem);
        } else {
            let deleterequestor = {
                data: [
                    {id: setid}
                ],
                fromName: this.options.tagsrequestor.fromName
            };

            Model.delete(deleterequestor).then(
                    function (response) {
                        // Remove layer and list element
                        searchElem.swac_layer.parentNode.removeChild(searchElem.swac_layer);
                        searchElem.parentNode.removeChild(searchElem);
                    });
        }
    }

    /**
     * Lets the user edit the tag
     * 
     * @param {DOMEvent} evt Event that requests the deletion
     * @returns {undefined}
     */
    onEditMediaTag(evt) {
        evt.preventDefault();

        let tagListElem = evt.target;
        while (tagListElem.parentNode) {
            if (tagListElem.hasAttribute('swac_setid')) {
                break;
            }
            tagListElem = tagListElem.parentNode;
        }

        let tag = tagListElem.swac_mediatag;
        // Get media area
        let tagFromName = Model.getSetnameFromRefernece(tag.media);
        let mediaAreas = this.requestor.parent.querySelectorAll('[swac_fromname="' + tagFromName + '"][swac_setid="' + tag.id + '"]');
        for (let curMediaArea of mediaAreas) {
            // Get wizzard elem
            let wizzElem = curMediaArea.querySelector('.swac_mediatags_wizzard');
            if (wizzElem) {
                // Set data to input elements
                let typeSelectElem = wizzElem.querySelector('.swac_mediatags_typeselect');
                let tagtypeid = Model.getIdFromReference(tag.tagtype);
                let selectedOpt = typeSelectElem.querySelector('[value="' + tagtypeid + '"]');
                selectedOpt.setAttribute('selected', 'selected');

                let titleElem = wizzElem.querySelector('.swac_mediatags_title');
                titleElem.value = tag.title;

                let commentElem = wizzElem.querySelector('.swac_mediatags_description');
                commentElem.innerHTML = tag.description;
            }
        }
        // Move layer to edit on top
        tagListElem.swac_layer.parentElement.appendChild(tagListElem.swac_layer);

        this.startCreateTag(evt, tagListElem.swac_layer);
    }

//******************************
// Taging wizzard
//******************************

    /**
     * Gets the pluginarea from event
     * 
     * @param {type} evt
     * @returns {.evt.target.parentNode|this.getPluginarea.searchElem}
     */
    getPluginarea(evt) {
        let pluginarea = null;
        let searchElem = evt.target;
        while (pluginarea === null && searchElem.parentNode !== null) {
            if (searchElem.classList.contains('swac_plugin_content')) {
                pluginarea = searchElem;
                break;
            }
            searchElem = searchElem.parentNode;
        }
        return pluginarea;
    }

    /**
     * Displays the wizzards steps list and highlights the given stepno
     * 
     * @param {type} pluginarea Area where to find the list
     * @param {type} stepno Step that should be highlited
     * @returns {undefined}
     */
    hightlightListChild(pluginarea, stepno) {
        stepno = parseInt(stepno);
        stepno--;
        // Highligt first entry in steps menue
        let stepsMenue = pluginarea.querySelector('.swac_mediatags_steps');
        for (let i = 0; i < stepsMenue.children.length; i++) {
            if (i === stepno) {
                stepsMenue.children[i].style = 'font-weight: bold;';
            } else {
                // Remove styling if not highlighted
                stepsMenue.children[i].style = '';
            }
        }
    }

    /**
     * Creates all neccessery informations for creating an new tagging
     * 
     * @param {Event} evt Event that called this method
     * @param {DOMElement} layer Layer that should be used for drawing, if no one given, a new one will be created.
     * @returns {undefined}
     */
    startCreateTag(evt, layer) {
        evt.preventDefault();
        // Get pluginarea
        let pluginarea = this.getPluginarea(evt);
        // Get set area
        let setarea = this.requestor.parent.findRepeatedForSet(pluginarea);
        let fromName = setarea.getAttribute('swac_fromname');
        let setid = setarea.getAttribute('swac_setid');
        // Hide add tag button
        let addTagButton = pluginarea.querySelector('.swac_mediatags_add');
        addTagButton.classList.add('swac_dontdisplay');
        // Show wizzard area
        let wizzArea = pluginarea.querySelector('.swac_mediatags_wizzard');
        wizzArea.classList.remove('swac_dontdisplay');

        // Highligt first entry in steps menue
        this.hightlightListChild(pluginarea, 1);

        // Get next button
        let nextButton = pluginarea.querySelector('.swac_mediatags_next');
        nextButton.fn = this.chooseTagtype.bind(this);
        nextButton.addEventListener('click', nextButton.fn);

        if (!layer) {
            // Create draw layer
            wizzArea.drawingLayer = this.requestor.parent.swac_comp.createDrawingLayer(fromName, setid);
        } else {
            wizzArea.drawingLayer = layer;
        }

        // Add event listener
        wizzArea.drawingLayer.fn_drawStart = this.drawStart.bind(this);
        wizzArea.drawingLayer.addEventListener('mousedown', wizzArea.drawingLayer.fn_drawStart, false);
        wizzArea.drawingLayer.fn_drawStop = this.drawStop.bind(this);
        wizzArea.drawingLayer.addEventListener('mouseup', wizzArea.drawingLayer.fn_drawStop, false);
        wizzArea.drawingLayer.fn_drawMove = this.drawMove.bind(this);
        wizzArea.drawingLayer.addEventListener('mousemove', wizzArea.drawingLayer.fn_drawMove, false);
        wizzArea.drawingLayer.fn_drawStopOut = this.onDrawStopOutOfLayer.bind(this);
        window.addEventListener('mouseup', wizzArea.drawingLayer.fn_drawStopOut, false);
    }

    /**
     * Creates elements for choosing a tag for the new tagging
     * 
     * @param {type} evt    Click event on next step button
     * @returns {undefined}
     */
    chooseTagtype(evt) {
        // Get pluginarea
        let pluginarea = this.getPluginarea(evt);
        let wizzardArea = pluginarea.querySelector('.swac_mediatags_wizzard');
        if (!wizzardArea.drawingLayer.swac_polygons
                || wizzardArea.drawingLayer.swac_polygons.length === 0) {
            UIkit.modal.confirm(SWAC.lang.dict.Mediaeditor.mediatags.nopolygoncreated, {stack: true}).then(function () {
                return;
            }, function () {
                return;
            });
            return;
        }

        // Highligt first entry in steps menue
        this.hightlightListChild(pluginarea, 2);

        // Show selection area
        let selElem = pluginarea.querySelector('.swac_mediatags_typeselect');
        selElem.classList.remove('swac_dontdisplay');

        // Get next button
        let nextButton = pluginarea.querySelector('.swac_mediatags_next');
        nextButton.removeEventListener('click', nextButton.fn);
        nextButton.fn = this.chooseTitle.bind(this);
        nextButton.addEventListener('click', nextButton.fn);
    }

    /**
     * Creates elements for choosing a tag title
     * 
     * @param {DOMEvent} evt Event that calls this wizzard step
     * @returns {undefined}
     */
    chooseTitle(evt) {
        // Get pluginarea
        let pluginarea = this.getPluginarea(evt);

        // Get tagtype
        let tagtypeElem = pluginarea.querySelector('.swac_mediatags_typeselect');
        let value = tagtypeElem.options[tagtypeElem.selectedIndex].value;

        if (parseInt(value) === 0) {
            UIkit.modal.confirm(SWAC.lang.dict.Mediaeditor.mediatags.notagtypeselected, {stack: true}).then(function () {
                return;
            }, function () {
                return;
            });
            return;
        }

        // Highligt first entry in steps menue
        this.hightlightListChild(pluginarea, 3);

        // Hide selection area
        tagtypeElem.classList.add('swac_dontdisplay');

        // Show title input
        let titleElem = pluginarea.querySelector('.swac_mediatags_title');
        titleElem.classList.remove('swac_dontdisplay');
        if (!titleElem.value) {
            titleElem.value = tagtypeElem.options[tagtypeElem.selectedIndex].innerHTML;
        }

        // Get next button
        let nextButton = pluginarea.querySelector('.swac_mediatags_next');
        nextButton.removeEventListener('click', nextButton.fn);
        nextButton.fn = this.addChooseDesc.bind(this);
        nextButton.addEventListener('click', nextButton.fn);
    }

    /**
     * Creates all elements that are needed for comment an new tagging
     * 
     * @param {type} evt    Click event on next step button
     * @returns {undefined}
     */
    addChooseDesc(evt) {
        // Get pluginarea
        let pluginarea = this.getPluginarea(evt);

        // Highligt first entry in steps menue
        this.hightlightListChild(pluginarea, 4);

        // Hide title area
        let titleElem = pluginarea.querySelector('.swac_mediatags_title');
        titleElem.classList.add('swac_dontdisplay');

        // Show textarea
        let comElem = pluginarea.querySelector('.swac_mediatags_description');
        comElem.classList.remove('swac_dontdisplay');

        // Get next button
        let nextButton = pluginarea.querySelector('.swac_mediatags_next');
        nextButton.removeEventListener('click', nextButton.fn);
        nextButton.fn = this.saveTag.bind(this);
        nextButton.addEventListener('click', nextButton.fn);
        nextButton.innerHTML = SWAC.lang.dict.Mediaeditor.mediatags.savetag;
    }

    /**
     * Saves the new tagging and hides not longer needed form elements
     * 
     * @param {type} evt    Click event on next step button
     * @returns {undefined}
     */
    saveTag(evt) {
        // Get pluginarea
        let pluginarea = this.getPluginarea(evt);

        // Hide textarea
        let comElem = pluginarea.querySelector('.swac_mediatags_description');
        comElem.classList.add('swac_dontdisplay');
        // Rename next button
        let nextButton = pluginarea.querySelector('.swac_mediatags_next');
        nextButton.innerHTML = SWAC.lang.dict.Mediaeditor.mediatags.wizzardnext;
        nextButton.removeEventListener('click', nextButton.fn);
        // Hide wizzard form
        let wizzArea = pluginarea.querySelector('.swac_mediatags_wizzard');
        wizzArea.classList.add('swac_dontdisplay');
        // Reshow add tag button
        let addTagButton = pluginarea.querySelector('.swac_mediatags_add');
        addTagButton.classList.remove('swac_dontdisplay');
        // Deactivate drawing functions
        wizzArea.drawingLayer.removeEventListener('mousedown', wizzArea.drawingLayer.fn_drawStart, false);
        wizzArea.drawingLayer.removeEventListener('mouseup', wizzArea.drawingLayer.fn_drawStop, false);
        wizzArea.drawingLayer.removeEventListener('mousemove', wizzArea.drawingLayer.fn_drawMove, false);
        window.removeEventListener('mouseup', wizzArea.drawingLayer.fn_drawStopOut, false);

        // Collect data for saveing

        // Get tag
        let tagtypeElem = pluginarea.querySelector('.swac_mediatags_typeselect');
        let tagtypeid = tagtypeElem.options[tagtypeElem.selectedIndex].value;

        // Get title
        let title = pluginarea.querySelector('.swac_mediatags_title').value;

        // Get comment
        let comment = comElem.value;

        // Transform drawed coodinates to picture coordinates
        let picturePolys = [];
        for (let curPoly of wizzArea.drawingLayer.swac_polygons) {
            let picturePoly = {};
            picturePoly.vertices = [];
            for (let curVertex of curPoly.vertices) {
                let pictureVertex = this.requestor.parent.swac_comp.convertDrawPointToMediaPoint(curVertex, wizzArea.drawingLayer);
                picturePoly.vertices.push(pictureVertex);
            }
            picturePolys.push(picturePoly);
        }

        let setid = wizzArea.drawingLayer.getAttribute('swac_setid');

        let dataset = {
            tagtype: 'ref://' + tagtypeid,
            media: 'ref://' + setid,
            polygons: JSON.stringify(picturePolys),
            title: title,
            description: comment
        };

        // Check if existing should be updated
        if (wizzArea.drawingLayer.swac_mediaTag) {
            dataset.id = wizzArea.drawingLayer.swac_mediaTag.id;
        }

        let saverequestor = {
            data: [
                dataset
            ],
            fromName: this.options.tagsrequestor.fromName
        };

        let thisRef = this;
        Model.save(saverequestor).then(function (dataCaps) {
            let resultSet = dataCaps[0];
            let newListEntry = thisRef.requestor.querySelector('[swac_setid="undefined"]');

            if (!dataset.id && newListEntry) {
                dataset.id = resultSet.id;
                wizzArea.drawingLayer.swac_mediaTag = dataset;
                newListEntry.setAttribute('swac_setid', dataset.id);
                let titleElem = newListEntry.querySelector('.swac_mediatags_lititle');
                titleElem.innerHTML = dataset.title;
                let warnElem = newListEntry.querySelector('.swac_mediatags_warning');
                warnElem.parentElement.removeChild(warnElem);
            } else if (!dataset.id) {
                dataset.id = resultSet.id;
                wizzArea.drawingLayer.swac_mediaTag = dataset;
                thisRef.createMediaTagListEntry(dataset, {id: setid}, wizzArea.drawingLayer);
            }
        }).catch(function (error) {
            return;
        });
    }

//*****************************
// Drawing functions
//*****************************

    /**
     * Starts the "drag"-drawing mode. This is when a line is drawn from the
     * last created vertex to the current mouse position.
     * 
     * @param {DOMEvent} evt Event that starts the draw (should be a mousdown-event)
     * @returns {undefined}
     */
    drawStart(evt) {
        // Note current draw elem
        this.currentDrawStartElem = evt.target;
        // activate draw state
        evt.target.swac_drawmode = 'drag';
        Msg.warn('MediatagsSPL', 'Start drag drawing.');

        // Create vertex for actual mouse position
        let mousepos = this.requestor.parent.swac_comp.getMousePositionOnMedia(evt);
        let mousevertex = new Vertex(mousepos.pos_x, mousepos.pos_y);

        let polys = evt.target.swac_polygons;
        if (!polys) {
            evt.target.swac_polygons = [];
            polys = evt.target.swac_polygons;
        }
        if (polys.length === 0 || polys[polys.length - 1].isClosed()) {
            // Create new polygon if the old is closed
            let poly = new Polygon();
            poly.addVertex(mousevertex);
            polys.push(poly);
        }
    }

    /**
     * Draws a line when in drag-draw mode.
     * 
     * @param {DOMEvent} evt Mousemove event
     * @returns {undefined}
     */
    drawMove(evt) {
        if (evt.target.swac_drawmode === 'drag') {
            let ctx = evt.target.getContext("2d");
            // Clear previous drawing
            this.requestor.parent.swac_comp.clearCanvasLayer(evt.target);
            let polys = evt.target.swac_polygons;
            // Redraw existing polygons
            for (let curPoly of polys) {
                curPoly.draw(ctx);
            }
            // Create temporary vertex
            let mousepos = this.requestor.parent.swac_comp.getMousePositionOnMedia(evt);
            let tempvertex = new Vertex(mousepos.pos_x, mousepos.pos_y);
            // Get last polygon
            let poly = polys[polys.length - 1];
            // get last vertex
            let lastvertex = poly.getLastVertex();
            // Create temporary line
            let templine = new Line(lastvertex, tempvertex);
            // Draw temporary line
            templine.draw(ctx);
        }
    }

    /**
     * Stops the "drag"-draw mode. Creates a new vertex at the current mouse position.
     * 
     * @param {DOMEvent} evt Event that stops the draw mode. This should be a mouseup event.
     * @returns {undefined}
     */
    drawStop(evt) {
        this.currentDrawStartElem = null;
        // deactivate draw state
        evt.target.swac_drawmode = null;
        Msg.warn('MediatagsSPL', 'Stop drag drawing.');

        // Create temporary vertex
        let mousepos = this.requestor.parent.swac_comp.getMousePositionOnMedia(evt);
        let mousevertex = new Vertex(mousepos.pos_x, mousepos.pos_y);

        let polys = evt.target.swac_polygons;
        // Get last polygon
        let lastpoly = polys[polys.length - 1];
        // Get the closest existing vertex
        let firstVertex = lastpoly.vertices[0];
        let distance = mousevertex.getDistanceTo(firstVertex);
        if (distance < 7) {
            // Add first vertex as last to close polygon
            lastpoly.addVertex(firstVertex);
            // End dragdraw
            evt.target.swac_drawmode = null;
            // Redraw polygon
            this.requestor.parent.swac_comp.clearCanvasLayer(evt.target);
            let ctx = evt.target.getContext("2d");
            for (let curPoly of polys) {
                curPoly.draw(ctx);
            }
        } else {
            // Create a new vertex at current mouse position
            evt.target.swac_polygons[evt.target.swac_polygons.length - 1].addVertex(mousevertex);
        }
    }

    /**
     * Method to execute when the drawing is stopped outside the drawing layer.
     * Then the begun polygon is removed.
     * 
     * @param {DOMEvent} evt Event that is calling the method
     * @returns {undefined}
     */
    onDrawStopOutOfLayer(evt) {
        // Check if click outside occures when in some draw mode
        if (this.currentDrawStartElem) {

            //Detect if mouse is out of drawlayer
            let mousepos = this.requestor.parent.swac_comp.getMousePositionOnMedia(evt);
            // Mousepos is null if it is out of the drawlayer
            if (!mousepos) {
                // Remove last drawn polygon
                this.currentDrawStartElem.swac_polygons.pop();
                // End draw mode
                this.currentDrawStartElem.swac_drawmode = null;
                // Clear previous drawing
                this.requestor.parent.swac_comp.clearCanvasLayer(this.currentDrawStartElem);
                // Draw polygons
                let ctx = this.currentDrawStartElem.getContext('2d');
                for (let curPoly of this.currentDrawStartElem.swac_polygons) {
                    let poly = new Polygon();
                    if (curPoly.vertices) {
                        poly.addPoints(curPoly.vertices);
                        try {
                            poly.draw(ctx, 1);
                        } catch (error) {
                            Msg.error('MediatagsSPL', 'Could not draw polygon: ' + error);
                        }
                    } else {
                        Msg.warn('MediatagsSPL', 'A polygon does not contain vertices.');
                    }
                }
                this.currentDrawStartElem = null;
            }
        }
    }
}