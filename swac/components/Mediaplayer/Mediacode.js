import SWAC from '../../swac.js';
import Component from '../../View.js';
import Msg from '../../Msg.js';

export default class Mediacode {

    /**
     * Creates a mediacode object from the given dataset
     * 
     * @param {Object[]} data List of datasets where to search for alternative resources
     * @param {Object} set Dataset object with at least mimetype and media attributes.
     * @param {String} pathattr Name of the attribute the media is stored
     * @param {String} typeattr Name of the attribute the mimetype is stored
     * @param {String} basepath Path where to find every media
     * @returns {Mediacode}
     */
    constructor(data, set, pathattr, typeattr, basepath = '') {
        this.data = data;
        this.set = set;
        this.pathattr = pathattr;
        this.typeattr = typeattr;
        this.basepath = basepath;
    }

    /**
     * Creates the DOMElement that is needed to present the media.
     * 
     * @returns {undefined}
     */
    getMediaElement() {
        let mediaElem;
        // Call type depending preview insertion methods
        if (this.set.mimetype.indexOf('image/') > -1) {
            mediaElem = this.createImageCode();
        } else if (this.set.mimetype.indexOf('video/') > -1) {
            mediaElem = this.createVideoCode();
        } else if (this.set.mimetype.indexOf('audio/') > -1) {
            mediaElem = this.createAudioCode();
        } else if (this.set.mimetype.indexOf('text/html') > -1) {
            mediaElem = this.createHtmlCode();
        } else if (this.set.mimetype.indexOf('application/wavefront-obj') !== -1) {
            mediaElem = this.createObjCode();
        } else if (this.set.mimetype.indexOf('application/wavefront-mtl') !== -1) {
            mediaElem = this.createMtlCode();
            // Support for gltf binary format (glb)
        } else if (this.set.mimetype.indexOf('model/gltf+json') !== -1) {
            mediaElem = this.showGltfSingleFile();
        } else if (this.set.mimetype.indexOf('model/gltf+json') !== -1) {
            // Support for gltf format (only in combination with bin)
            mediaElem = this.loadGlTF();
        } else if (this.set.mimetype.indexOf('model/gltf+binary') !== -1) {
            mediaElem = this.loadBin();
        } else {
            Msg.error('Mediapreview',
                    'Mimetype >' + this.set.mimetype + '< is not supported.');
        }
        return mediaElem;
    }

    /**
     * Generates html code for image display
     * 
     * @returns {DOMElement}   DOMElement representing the media
     */
    createImageCode() {
        let title = this.set.title;
        if (!title) {
            title = this.set.filename;
            if (!title) {
                title = SWAC.lang.dict.Mediacode.notitle;
            }
        }

        let imgElem = document.createElement('img');
        imgElem.classList.add(this.set.mimetype);
        imgElem.src = this.basepath + this.set[this.pathattr];
        imgElem.title = title;
        imgElem.alt = title;
        return imgElem;
    }

    /**
     * Generates html code for video display
     * 
     * @returns {DOMElement}   DOMElement representing the media
     */
    createVideoCode() {
        let title = this.set.title;
        if (!title) {
            title = this.set.filename;
            if (!title) {
                title = SWAC.lang.dict.Mediacode.notitle;
            }
        }

        let vidElem = document.createElement('video');
        vidElem.classList.add(this.set.mimetype);
        vidElem.title = title;
        vidElem.setAttribute('controls', 'controls');
        vidElem.setAttribute('preload', 'metadata');
        vidElem.removeAttribute('controls');
        vidElem.classList.add('uk-cover');
        if(this.set.loop) {
            vidElem.setAttribute('loop','loop');
        }
        vidElem.innerHTML = SWAC.lang.dict.Mediacode.novideosupport;
        vidElem.swac_set = this.set;
        this.createMediaSource(vidElem);
        return vidElem;
    }

    /**
     * Generates html code for video display
     * 
     * @returns {DOMElement}   DOMElement representing the media
     */
    createAudioCode() {
        let title = this.set.title;
        if (!title) {
            title = this.set.filename;
            if (!title) {
                title = SWAC.lang.dict.Mediacode.notitle;
            }
        }
        // Create sourrounding div
        let divElem = document.createElement('div');
        // Create cover
        if (this.set.image) {
            let coverElem = document.createElement('img');
            coverElem.classList.add('swac_media_cover');
            coverElem.setAttribute("uk-img", "");
            coverElem.setAttribute("data-src", this.basepath + this.set.image);
            coverElem.height = '100px';
            divElem.appendChild(coverElem);
        }

        let audioElem = document.createElement('audio');
        audioElem.classList.add('swac_media_audio');
        audioElem.classList.add(this.set.mimetype);
        audioElem.title = title;
//        audioElem.setAttribute('controls', 'controls');
        audioElem.setAttribute('preload', 'none');
        if(this.set.loop) {
            audioElem.setAttribute('loop','loop');
        }
        audioElem.innerHTML = SWAC.lang.dict.Mediacode.noaudiosupport;
        audioElem.swac_set = this.set;
        this.createMediaSource(audioElem);
        divElem.appendChild(audioElem);
        return divElem;
    }

    /**
     * Creates a source element and adds it to the media element.
     * 
     * @param {DOMElement} mediaElem Media element
     * @returns {DOMElement} Element created
     */
    createMediaSource(mediaElem) {
        let sourceElem = document.createElement('source');
        if(!this.set[this.pathattr]) {
            Msg.error('mediacode','Source in attribute >' + this.pathattr + '< is missing.',this.requestor);
        }
        sourceElem.src = this.basepath + this.set[this.pathattr];
        sourceElem.type = this.set[this.typeattr];
        mediaElem.appendChild(sourceElem);
        return sourceElem;
    }
    
    createHtmlCode() {
        let iframe = document.createElement('iframe');
        iframe.src = this.basepath + this.set[this.pathattr];
        return iframe;
    }
}