import SWAC from '../../../../swac.js';
import Msg from '../../../../Msg.js';
import Plugin from '../../../../Plugin.js'

export default class ModelmenueSPL extends Plugin {

    constructor(pluginconf) {
        super(pluginconf);
        this.name = 'cesium/plugins/Modelmenue';

        this.desc.templates[0] = {
            name: 'modelmenue',
            style: 'modelmenue',
            desc: 'Default template createing gui elements for 3d object navigation'
        };

        this.desc.opts[0] = {
            name: 'annimationspeed',
            desc: 'Speed in miliseconds in which the camera moves a step around the model.'
        };
        this.options.annimationspeed = 350;
        this.desc.opts[1] = {
            name: 'annimationstepsize',
            desc: 'Size of a step in degrees with that the animation moves around the model.'
        };
        this.options.annimationstepsize = 2;
        this.desc.opts[2] = {
            name: 'onShowDetail',
            desc: 'Definition for action when loading a detail model.\n\
                    Must contain attribute url, maybe with placeholder {filename} which will be replaces by the filename (without ending) of the not detailed model.\n\
                    Also can contain visoptions.'
        };
        this.options.onShowDetail = null;

        // Attributes for internal useage
        this.moveAroundIntv = null; // Interval of the move around animation
    }

    init() {
        return new Promise((resolve, reject) => {
            // Register special functions for this plugin
            // Register function to execute when go to model (click on search result)
            //TODO what does this?
            this.requestor.parent.swac_comp.options.onGoToModelFunctions.push(this.show.bind(this));
            // Register handler for camera moves
            this.requestor.parent.swac_comp.viewer.camera.changed.addEventListener(this.onCameraChanged.bind(this));

            // Register event handler for picking
            var handler = new Cesium.ScreenSpaceEventHandler(this.requestor.parent.swac_comp.viewer.scene.canvas);
            // Register handler for picking
            handler.setInputAction(
                    this.onPicked.bind(this),
                    Cesium.ScreenSpaceEventType.LEFT_CLICK
                    );

            window.addEventListener("resize", function (evt) {
                // Get requestor for modelmenue
                let cesiumRequestors = document.querySelectorAll('[swa|="swac_worldmap3d"]');
                for (let curRequestor of cesiumRequestors) {
                    // Get modelmenue plugin
                    let curPlug = curRequestor.swac_comp.pluginHandler.plugins.get('modelmenue');
                    curPlug.positionMenueElements(curRequestor);
                }
            });
            resolve();
        });
    }

    /**
     * Method for dynamically position the menue elements
     * 
     * @param {SWACRequestor} requestor Requestor whos elements should be positioned
     * @returns {undefined}
     */
    positionMenueElements(requestor) {
        let rect = requestor.getBoundingClientRect();
        let contHeight = rect.bottom - rect.top; // Height of the container
        let contWidth = rect.right - rect.left;

        // Get modelmenue element
        let modelElem = requestor.querySelector('.swac_worldmap3d_modelmenue');
        modelElem.style.position = "absolute";
        modelElem.style.top = rect.top + contHeight - 100 + "px";
        let modelRect = modelElem.getBoundingClientRect();
        let modelWidth = modelRect.right - modelRect.left;
        modelElem.style.left = rect.left + (contWidth / 2) - (modelWidth / 2) + "px";

        let modelRightElem = requestor.querySelector('.swac_worldmap3d_modelmenue_right');
        modelRightElem.style.position = "absolute";
        modelRightElem.style.left = rect.right - 10 - 50 + "px";
        modelRightElem.style.top = rect.top + (contHeight / 2) + "px";

        let modelLeftElem = requestor.querySelector('.swac_worldmap3d_modelmenue_left');
        modelLeftElem.style.position = "absolute";
        modelLeftElem.style.left = rect.left + 10 + "px";
        modelLeftElem.style.top = rect.top + (contHeight / 2) + "px";
    }

    /*************************
     * Event handlers for changing camera orientation
     *************************/

    /**
     * Function for executing when the camera was changed.
     * 
     * @param {Number} unkonwnparameter A not documented parameter in cesium
     * @returns {undefined}
     */
    onCameraChanged(unkonwnparameter) {
        // Update heading information to the current value of the cam
        this.requestor.parent.swac_comp.view.heading = Math.round(Cesium.Math.toDegrees(this.requestor.parent.swac_comp.viewer.camera.heading));
        // Update pitch information to the current value of the cam
        this.requestor.parent.swac_comp.view.pitch = Math.round(Cesium.Math.toDegrees(this.requestor.parent.swac_comp.viewer.camera.pitch));
        // Update menue
//        this.update();
    }

    /********************
     * Event handlers for picking models
     ********************/

    /**
     * Executed when a model is picked.
     * 
     * @param {Cesium movement} movement Movement with informations about the picked model
     * @returns {undefined}
     */
    onPicked(movement) {
//        // Get cesium requestor
//        let requestor = document.querySelector('[swa|="swac_worldmap3d"]');
//        // Get modelmenue plugin
//        let thisPlug = requestor.swac_comp.pluginHandler.plugins.get('modelmenue');

        var pick = this.requestor.parent.swac_comp.viewer.scene.pick(movement.position);

        if (pick && (pick.primitive || pick.mesh)) {
            // If a model was picked
            this.onModelPicked(pick);
        } else {
            // If nothing was picked
            this.onNothingPicked();
        }
    }

    /**
     * Action to perform when a model is picked
     * Actual actions:
     * - goto model
     * - show model menue
     *
     * @param {type} pick Cesium.Pick with information about picked object
     * @returns {undefined}
     */
    onModelPicked(pick) {
        let pickedSwacModel = pick.primitive._swacmodel;
        if (!pickedSwacModel && pick.id && pick.id.groundmodel) {
            pickedSwacModel = pick.id.groundmodel;
        } else if (!pickedSwacModel) {
            Msg.warn('ModelmenueSPL', 'Could not determine picked model.');
        }

        // Check if menue is allready shown
        let navElem = document.querySelector('.swac_worldmap3d_modelmenue');
        // Check if model menue is shown for the picked model or for another or no one
        if (!navElem.model || pickedSwacModel !== navElem.model) {
            this.requestor.parent.swac_comp.cesiumnavigation.gotoModel(pickedSwacModel);
            this.show(pickedSwacModel);
        }
    }

    /**
     * Executed, when nothing is selected. Hides model menue, if model was selected before.
     *
     * @returns {undefined}
     */
    onNothingPicked() {
        this.hide();
    }

    /**
     * Builds up and shows the menue
     *
     * @param {Model} model Model object to show menue for
     * @param {Integer} loc Id of the location to show
     * @returns {undefined}
     */
    show(model, loc) {
        // Get menue area
        let menueArea = document.querySelector('[id*="_modelmenue_cont"]');
        let navElem = menueArea.querySelector('.swac_worldmap3d_modelmenue');
        let thisPlug = menueArea.swac_comp;

        navElem.classList.remove('swac_dontdisplay');
        navElem.forModel = model;
        if (loc) {
            navElem.setAttribute('loc', loc);
        }

        var rightNavElem = document.querySelector('.swac_worldmap3d_modelmenue_right');
        rightNavElem.classList.remove('swac_dontdisplay');

        var leftNavElem = document.querySelector('.swac_worldmap3d_modelmenue_left');
        leftNavElem.classList.remove('swac_dontdisplay');

        // Show up model menue
        let menElem = document.querySelector('.swac_worldmap3d_modelmenue');
        menElem.classList.remove('swac_dontdisplay');

        // Place the gui elements with respect to swac_component element
        thisPlug.positionMenueElements(this.requestor.parent);

        this.requestor.parent.swac_comp.view.heading = 0;
        thisPlug.moveCam();

        document.querySelector('.swac_worldmap3d_modelmenue_addtofavs').addEventListener('click', thisPlug.onClickAddToFavs);
        document.querySelector('.swac_worldmap3d_modelmenue_close').addEventListener('click', thisPlug.hide);
        document.querySelector('.swac_worldmap3d_modelmenue_right').addEventListener('click', thisPlug.moveStepRight);
        document.querySelector('.swac_worldmap3d_modelmenue_left').addEventListener('click', thisPlug.moveStepLeft);
        document.querySelector('.swac_worldmap3d_modelmenue_heading').addEventListener('change', thisPlug.moveToHeading);
        document.querySelector('.swac_worldmap3d_modelmenue_tostartview').addEventListener('click', thisPlug.moveToStartView);
        document.querySelector('.swac_worldmap3d_modelmenue_anicontrol').addEventListener('click', thisPlug.startMoveAround);

        // Detail model button
        if (thisPlug.options.onShowDetail != null) {
            document.querySelector('.swac_worldmap3d_modelmenue_showdetail').addEventListener('click', thisPlug.onClickShowDetail);
        } else {
            document.querySelector('.swac_worldmap3d_modelmenue_showdetail').classList.add('swac_dontdisplay');
        }
    }

    /**
     * Updates the information displayed in the menue.
     * 
     * @returns {undefined}
     */
    update() {

//    var deg = Math.round(Cesium.Math.toDegrees(SAFE_globe.viewer.camera.pitch));
//    console.log('Pitch:', deg);

        // Update information about orientation
        let selectElem = document.querySelector('.swac_worldmap3d_modelmenue_heading');
        if ((this.requestor.parent.swac_comp.view.heading >= 337.5 && this.requestor.parent.swac_comp.view.heading <= 360)
                || (this.requestor.parent.swac_comp.view.heading >= 0 && this.requestor.parent.swac_comp.view.heading < 22.5)) {
            selectElem.value = 0;
        } else if (this.requestor.parent.swac_comp.view.heading >= 22.5 && this.requestor.parent.swac_comp.view.heading < 67.5) {

        } else if (this.requestor.parent.swac_comp.view.heading >= 67.5 && this.requestor.parent.swac_comp.view.heading < 112.5) {
            selectElem.value = 90;
        } else if (this.requestor.parent.swac_comp.view.heading >= 112.5 && this.requestor.parent.swac_comp.view.heading < 157.5) {

        } else if (this.requestor.parent.swac_comp.view.heading >= 157.5 && this.requestor.parent.swac_comp.view.heading < 202.5) {
            selectElem.value = 180;
        } else if (this.requestor.parent.swac_comp.view.heading >= 202.5 && this.requestor.parent.swac_comp.view.heading < 247.5) {

        } else if (this.requestor.parent.swac_comp.view.heading >= 247.5 && this.requestor.parent.swac_comp.view.heading < 292.5) {
            selectElem.value = 270;
        } else if (this.requestor.parent.swac_comp.view.heading >= 292.5 && this.requestor.parent.swac_comp.view.heading < 337.5) {

        }
    }

    /**
     * Hides the manue and the navigation
     *
     * @param {type} evt Event from button that requests the hide
     * @returns {undefined}
     */
    hide(evt) {
        var navElem = document.querySelector('.swac_worldmap3d_modelmenue');
        navElem.classList.add('swac_dontdisplay');
        navElem.removeAttribute('hid');
        navElem.removeAttribute('loc');

        var rightNavElem = document.querySelector('.swac_worldmap3d_modelmenue_right');
        rightNavElem.classList.add('swac_dontdisplay');

        var leftNavElem = document.querySelector('.swac_worldmap3d_modelmenue_left');
        leftNavElem.classList.add('swac_dontdisplay');

        let menElem = document.querySelector('.swac_worldmap3d_modelmenue');
        menElem.classList.add('swac_dontdisplay');

        var canvas = this.requestor.parent.swac_comp.viewer.canvas;
        canvas.setAttribute('tabindex', '0'); // needed to put focus on the canvas
        canvas.onclick = function () {
            canvas.focus();
        };

// Reset view, so that users can move over map instead of rotating arount an point
        this.requestor.parent.swac_comp.viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
    }

    /**
     * Creates an link to the current viewed model
     *
     * @param {type} evt
     * @returns {undefined}
     */
    onClickAddToFavs(evt) {
        // Get hid and loc
        let navElem = document.querySelector('.swac_worldmap3d_modelmenue');
        let hid = navElem.getAttribute('hid');
        let loc = navElem.getAttribute('loc');

        // Buildup url
        let url = window.location;
        url += '';
        // Add current model file to fav link
        if (hid && url.indexOf('hid=') === -1) {
            url = url + '?hid=' + hid;
        } else {
            url = url + '?file=' + navElem.forModel._filepath;
        }

        // Add current location to fav link
        if (loc !== null && loc !== 0 && url.indexOf('loc=') === -1) {
            url = url + '&loc=' + loc;
        }
        // Add current heading to fav link
        if (this.requestor.parent.swac_comp.view.heading !== 0) {
            url = url + '&heading=' + this.requestor.parent.swac_comp.view.heading;
        }
        // Add current pith to fav link
        if (this.requestor.parent.swac_comp.view.pitch !== 0.0) {
            url = url + '&pitch=' + this.requestor.parent.swac_comp.view.pitch;
        }

        // Remove hash
        url = url.replace('#', '');
        let infotxt = SWAC.lang.dict.cesium.modelmenue.favlink.replace(new RegExp('%url%', 'g'), url);

        UIkit.modal.alert(infotxt);
    }

    /**
     * Calls registed functions to execute when the user press the show detail button
     * 
     * @param {type} evt
     * @returns {undefined}
     */
    onClickShowDetail(evt) {
        let menueArea = document.querySelector('[id*="_modelmenue_cont"]');
        let navElem = menueArea.querySelector('.swac_worldmap3d_modelmenue');
        let thisPlug = menueArea.swac_comp;
        let loc = navElem.getAttribute('loc');

        // Get filename
        let lastSlashPos = navElem.forModel.file.url.lastIndexOf('/');
        let lastDotPos = navElem.forModel.file.url.lastIndexOf('.');
        let filename = navElem.forModel.file.url.substring(lastSlashPos, lastDotPos);

        this.requestor.parent.showCoverMsg('loadmenue');

        // Get Model
        //TODO make this configurable
        let hdurl = thisPlug.options.onShowDetail.url.replace('{filename}', filename);

        modelFactory.loadModel(hdurl, thisPlug.requestor, thisPlug.options.onShowDetail).then(function (model) {
            this.requestor.parent.swac_comp.models.push(model);
            // Draw model
            model.draw(this.requestor.parent.swac_comp.viewer).then(function (entityref) {
                this.requestor.parent.swac_comp.cesiumnavigation.gotoModel(model, loc);
                console.log(entityref);
                // Remove loading element
                this.requestor.parent.removeLoadingElem('loadmenue');
            });
        });
    }

    /**
     * Starts the animation that moves around a model
     *
     * @param {type} evt Event that calls the start
     * @returns {undefined}
     */
    startMoveAround(evt) {
        let menueArea = document.querySelector('[id*="_modelmenue_cont"]');
        let thisPlug = menueArea.swac_comp;

        thisPlug.moveAroundIntv = setInterval(thisPlug.moveLittleStepRight, thisPlug.options.annimationspeed);
        let moveButton = document.querySelector('.swac_worldmap3d_modelmenue_anicontrol');
        moveButton.setAttribute('uk-icon', 'ban');
        moveButton.setAttribute('uk-tooltip', 'title: ' + SWAC.lang.dict.cesium.modelmenue.stopanimation);
        moveButton.removeEventListener('click', thisPlug.startMoveAround);
        moveButton.addEventListener('click', thisPlug.stopMoveAround);
    }

    /**
     * Stop the animation that moves around a model
     *
     * @param {type} evt Event that calls the stop
     * @returns {undefined}
     */
    stopMoveAround(evt) {
        let menueArea = document.querySelector('[id*="_modelmenue_cont"]');
        let thisPlug = menueArea.swac_comp;

        clearInterval(thisPlug.moveAroundIntv);
        let moveButton = document.querySelector('.swac_worldmap3d_modelmenue_anicontrol');
        moveButton.setAttribute('uk-icon', 'play');
        moveButton.setAttribute('uk-tooltip', 'title: ' + SWAC.lang.dict.cesium.modelmenue.startanimation);
        moveButton.removeEventListener('click', thisPlug.stopMoveAround);
        moveButton.addEventListener('click', thisPlug.startMoveAround);
    }

    /**
     * Moves the cam a little step arround the model
     *
     * @returns {undefined}
     */
    moveLittleStepRight() {
        let menueArea = document.querySelector('[id*="_modelmenue_cont"]');
        let thisPlug = menueArea.swac_comp;

        if (this.requestor.parent.swac_comp.view.heading < 0) {
            this.requestor.parent.swac_comp.view.heading = 360;
        }
        if (isNaN(thisPlug.options.annimationstepsize)) {
            Msg.error('ModelmenueSPL', 'Option >annimationstepsize< is not a number. Useing stepsize 2');
            this.requestor.parent.swac_comp.view.heading = this.requestor.parent.swac_comp.view.heading - 2;
        } else {
            this.requestor.parent.swac_comp.view.heading = this.requestor.parent.swac_comp.view.heading - thisPlug.options.annimationstepsize;
        }
        thisPlug.moveCam();
    }

    /**
     * Moves the cam back to the models standard view (normaly view from south)
     *
     * @param {type} evt Event that requests the go back
     * @returns {undefined}
     */
    moveToStartView(evt) {
        let menueArea = document.querySelector('[id*="_modelmenue_cont"]');
        let thisPlug = menueArea.swac_comp;

        this.requestor.parent.swac_comp.view.heading = 0.0;
        this.requestor.parent.swac_comp.view.pitch = -33.0;
        thisPlug.moveCam();
    }

    /**
     * Moves the camera 90 degress counter clockwise
     *
     * @param {type} evt Event that wants to move the cam
     * @returns {undefined}
     */
    moveStepRight(evt) {
        // Get menue area
        let menueArea = document.querySelector('[id*="_modelmenue_cont"]');
        let thisPlug = menueArea.swac_comp;

        if (this.requestor.parent.swac_comp.view.heading < 90) {
            this.requestor.parent.swac_comp.view.heading = 360;
        }
        this.requestor.parent.swac_comp.view.heading = this.requestor.parent.swac_comp.view.heading - 90;
        thisPlug.moveCam();
    }

    /**
     * Moves the camera 90 degress clockwise
     *
     * @param {type} evt Event that wants to move the cam
     * @returns {undefined}
     */
    moveStepLeft(evt) {
        // Get menue area
        let menueArea = document.querySelector('[id*="_modelmenue_cont"]');
        let thisPlug = menueArea.swac_comp;

        if (this.requestor.parent.swac_comp.view.heading >= 360) {
            this.requestor.parent.swac_comp.view.heading = 0;
        }
        this.requestor.parent.swac_comp.view.heading = this.requestor.parent.swac_comp.view.heading + 90;
        thisPlug.moveCam();
    }

    /**
     * Moves the cam to the selected heading
     *
     * @param {type} evt Event that wants to move and should occured on the selectbox
     * @returns {undefined}
     */
    moveToHeading(evt) {
        // Get menue area
        let menueArea = document.querySelector('[id*="_modelmenue_cont"]');
        let thisPlug = menueArea.swac_comp;

        this.requestor.parent.swac_comp.view.heading = evt.target.value;
        thisPlug.moveCam();
    }

    /**
     * Moves the cam that is currently focused on the active model around that model
     *
     * @returns {undefined}
     */
    moveCam() {
        // Get menue area
        let menueArea = document.querySelector('[id*="_modelmenue_cont"]');
        let navElem = menueArea.querySelector('.swac_worldmap3d_modelmenue');
        let thisPlug = menueArea.swac_comp;
        // Get hid
        let loc = navElem.getAttribute('loc');

        if (loc || loc === 'undefined' || loc === null) {
            loc = 0;
        }

        // Check if model has a location
        if (!navElem.forModel.locations) {
            Msg.error('ModelmenueSPL', 'Model has no location. Cant move to model.');
            return;
        }
        if (!navElem.forModel.locations[loc]) {
            Msg.warn('ModelmenueSPL', 'Model has no location >' + loc + '<. Cant move to model.');
            return;
        }
        let lon;
        let lat;
        let height;
        if (navElem.forModel.locations[loc].centre) {
            // Use centre from requested location if available
            lon = navElem.forModel.locations[loc].centre.lon;
            lat = navElem.forModel.locations[loc].centre.lat;
            height = navElem.forModel.locations[loc].centre.height;
        }
        if (!lon || !lat) {
            // If location has no centre use the next available centre
            for (let i in navElem.forModel.locations) {
                if (navElem.forModel.locations[i].centre) {
                    lon = navElem.forModel.locations[i].centre.lon;
                    lat = navElem.forModel.locations[i].centre.lat;
                    height = navElem.forModel.locations[i].centre.height;
                }
            }
        }

        // Move camera
        let center = Cesium.Cartesian3.fromDegrees(lon, lat);
        let heading = Cesium.Math.toRadians(this.requestor.parent.swac_comp.view.heading);
        let pitch = Cesium.Math.toRadians(this.requestor.parent.swac_comp.view.pitch);
        let distance = this.requestor.parent.swac_comp.view.optdistances[navElem.forModel.file.url];

        this.requestor.parent.swac_comp.viewer.camera.lookAt(center, new Cesium.HeadingPitchRange(heading, pitch, distance));

        // Change display and selection field
        thisPlug.update();
    }
}