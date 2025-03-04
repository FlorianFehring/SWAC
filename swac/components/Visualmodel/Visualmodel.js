import SWAC from '../../swac.js';
import View from '../../View.js';
import Msg from '../../Msg.js';
import Model from '../../Model.js';

export default class Visualmodel extends View {

    constructor(options = {}) {
        super(options);
        this.name = 'Visualmodel';
        this.desc.text = "Component to create visual models from data, that shows the dependencies and hierarchie within the data.";
        this.desc.developers = 'Florian Fehring (FH Bielefeld), Timon Buschendorf';
        this.desc.license = 'GNU Lesser General Public License';

        this.desc.depends[0] = {
            name: "Konva libary",
            path: SWAC.config.swac_root + "components/Visualmodel/libs/konva.min.js",
            desc: ""
        };
        this.desc.depends[1] = {
            name: "UTIF libary (MIT licence)",
            path: SWAC.config.swac_root + "components/Visualmodel/libs/UTIF.js",
            desc: ""
        };
        this.desc.depends[2] = {
            name: "Colorcalcultions algorithms",
            path: SWAC.config.swac_root + "algorithms/Colorcalculations.js",
            desc: ""
        };

        this.desc.templates[0] = {
            name: 'visualmodel',
            style: 'visualmodel',
            desc: 'standard visualmodel'
        };

        this.desc.reqPerTpl[0] = {
            selc: '.swac_visualmodel_drawarea',
            desc: "Element where to draw the visualisation"
        };

        this.desc.reqPerTpl[1] = {
            selc: '.swac_visualmodel_scenegraph',
            desc: "Element where to show the scenegraph"
        };

        this.desc.reqPerTpl[2] = {
            selc: '.swac_visualmodel_scenegraph_menue',
            desc: "Element where to show the scenegraph menue"
        };

        this.desc.reqPerSet[0] = {
            name: "id",
            desc: "Id that identifies the dataset."
        };
        this.desc.reqPerSet[1] = {
            name: "name",
            alt: "title",
            desc: "Name or title of the selection."
        };

        this.desc.optPerSet[0] = {
            name: "parent",
            desc: "If present the parent information will be used for layering."
        };
        this.desc.optPerSet[1] = {
            name: "width",
            desc: "Width of the sets visualisation."
        };
        this.desc.optPerSet[2] = {
            name: "height",
            desc: "Height of the sets visualisation."
        };
        this.desc.optPerSet[3] = {
            name: "fillcolor",
            desc: "Color that is the visualisation filled with."
        };
        this.desc.optPerSet[4] = {
            name: "bordercolor",
            desc: "Color of the visualisations border."
        };
        this.desc.optPerSet[5] = {
            name: "desc",
            desc: "Visualisations description."
        };
        this.desc.optPerSet[6] = {
            name: "type",
            desc: "Visualisations type. [dev,con] default: dev"
        };
        this.desc.optPerSet[7] = {
            name: "kind",
            desc: "Visualisations kind. For con: [line,arrow] default: line. For dev: rect, circle, ellipse, wedge, star, ring, arc, regularpolygon"
        };
        this.desc.optPerSet[8] = {
            name: "linecalc",
            desc: "Kind of line calculation. [direct,curve] default: direct"
        };
        this.desc.optPerSet[9] = {
            name: "part1",
            desc: "Id of the dataset representing the first partner of a connection."
        };
        this.desc.optPerSet[10] = {
            name: "part2",
            desc: "Id of the dataset representing the second partner of a connection."
        };
        this.desc.optPerSet[11] = {
            name: "labelX",
            desc: "Additional labels with numbers instead of X."
        };
        this.desc.optPerSet[12] = {
            name: 'strokecolor',
            desc: 'Color of connections.'
        };
        this.desc.optPerSet[13] = {
            name: 'strokewidth',
            desc: 'Width of the connection line'
        };
        this.desc.optPerSet[14] = {
            name: 'stroketension',
            desc: 'Tension of the interpolated connection line'
        };

        this.options.showWhenNoData = true;

        this.desc.opts[0] = {
            name: "defaults",
            desc: "Default values for visualisation datasets. Key = source, Value = object with attributes with default values."
        };
        if (!options.attributeDefaults)
            this.options.attributeDefaults = new Map();
        // Add general default values
        if (!this.options.attributeDefaults.get('VisualmodelGeneral')) {
            this.options.attributeDefaults.set('VisualmodelGeneral', {
                xAttr: null, // Attribute that gives the x value (default: x)
                yAttr: null, // Attribute that gives the y value (default: y)
                xFactor: 1,
                yFactor: 1,
                width: 100,
                widthFactor: 1,
                height: 50,
                heightFactor: 1,
                rotation: 0,
                xRotateAttr: null, // Attribute that gives the z roation (default: none)
                fillcolor: '',
                borderColor: '#000',
                visuMargin: 10,
                onClick: null,
                labelFrontFamily: 'Arial',
                labelFrontStyle: 'Arial',
                labelFrontSize: 12,
                labelPadding: 2,
                labelStrokeWidth: 0.3,
                labelFillColor: '#000',
                labelBorderColor: '#000',
                conLinecalc: 'direct', // direct, curve
                conColor: '#000',
                conWidth: 1,
                conTension: 0.5,
                conOnClick: null,
                dragmode: 'free' // Available dragging: free = everywhere, horizontal, vertical, none
            });
        }

        this.desc.opts[1] = {
            name: "showMenue",
            desc: "If true the menue is show"
        };

        if (options.showMenue === undefined)
            this.options.showMenue = true;
        this.desc.opts[2] = {
            name: "stageWidth",
            desc: "Width of the stage"
        };
        if (!options.stageWidth)
            this.options.stageWidth = 'contElem.clientWidth';

        this.desc.opts[3] = {
            name: "stageHeight",
            desc: "Height of the stage"
        };
        if (!options.stageHeight)
            this.options.stageHeight = window.innerHeight;

        this.desc.opts[4] = {
            name: "stageColor",
            desc: "Color of the stage"
        };
        if (!options.stageColor)
            this.options.stageColor = '#fff';

        this.desc.opts[5] = {
            name: "drawAdditions",
            desc: "Definitions of drawings that should be added to certain elements. Must contain: applyOnAttr, applyOnVal",
            example: {
                applyOnAttr: 'attributeToCheckValueAt',
                applyOnVal: 'expectedValueToDrawAdditions',
                reflectx: true,
                draw: [
                    'List of Konva Objects'
                ],
                textattr: 'attributeToGetTextFrom'
            }
        };
        if (!options.drawAdditions)
            this.options.drawAdditions = [];

        this.desc.opts[18] = {
            name: "autosave",
            desc: "If true changes will be saved automatically"
        };
        if (!options.autosave)
            this.options.autosave = false;

        this.desc.opts[19] = {
            name: "showScenegraph",
            desc: "If true the scenegraph is shown"
        };
        if (typeof options.showScenegraph === 'undefined')
            this.options.showScenegraph = true;

        this.desc.opts[20] = {
            name: "excludeFromScenegraph",
            desc: "Object with attributes and values as search pattern for datasets that should be excluded from scenegraph only.",
            example: {
                name: 'excludeNameOnThisValue'
            }
        };
        if (typeof options.excludeFromScenegraph === 'undefined')
            this.options.excludeFromScenegraph = null;

        this.desc.opts[21] = {
            name: "legendMap",
            desc: "Map with legend entries. Key = Abbrivation, Value = description"
        };
        if (typeof options.legendMap === 'undefined')
            this.options.legendMap = new Map();

        this.desc.opts[22] = {
            name: "calcPosMode",
            desc: "Method for calculation the positioning mode on datasets. \n\
                    Function gets: dataset and component\n\
                    Must return one of: (absolute | relative | relativeX | relativeY | none) Absoulte \n\
                    means every set has its own coordinates. Relative means \n\
                    datasets positioned relative to their prev sibling.\n\
                    relativeX and relativeY only affect x or y coordinates.\n\
                    none says to not position that element."
        };
        if (typeof options.calcPosMode === 'undefined')
            this.options.calcPosMode = function () {
                return 'absolute';
            };

        this.desc.opts[23] = {
            name: "movePosMode",
            desc: "Mode of recalculation of relative positioned siblings.\n\
Only affects siblings that are positioned relative (calcPosMode).\n\
calc: The distance is new calculated, siblings remain on their positions.\n\
move: The siblings are moved along."
        };
        if (!options.movePosMode)
            this.options.movePosMode = 'calc';

        this.desc.opts[24] = {
            name: "allowZoom",
            desc: "Allow users to zoom the visualisation."
        };
        if (typeof options.allowZoom === 'undefined')
            this.options.allowZoom = true;

        this.desc.opts[25] = {
            name: "initialZoom",
            desc: "Initial zoom factor"
        };
        if (!options.initialZoom)
            this.options.initialZoom = 1.0;

        this.desc.opts[26] = {
            name: "scaleX",
            desc: "Factor to scale the whole visualisation in x direction."
        };
        if (!options.scaleX)
            this.options.scaleX = 1.0;

        this.desc.opts[27] = {
            name: "scaleY",
            desc: "Factor to scale the whole visualisation in y direction."
        };
        if (!options.scaleY)
            this.options.scaleY = 1.0;

        this.desc.opts[28] = {
            name: "oddLabelYOffset",
            desc: "Y offset for odd number labels to place heigher."
        };
        if (!options.oddLabelYOffset)
            this.options.oddLabelYOffset = 0;

        this.desc.opts[29] = {
            name: "oddLabelXOffset",
            desc: "X offset for odd number labels to place heigher."
        };
        if (!options.oddLabelXOffset)
            this.options.oddLabelXOffset = 0;

        this.desc.opts[30] = {
            name: "doNotRedrawOn",
            desc: "Array of attributs that, when changed do not start a redraw",
            example: ['count','name']
        };
        if (!options.doNotRedrawOn)
            this.options.doNotRedrawOn = [];

        if (!options.plugins) {
            this.options.plugins = new Map();
            this.options.plugins.set('Propertieseditor', {
                id: 'Propertieseditor',
                active: false
            });
            this.options.plugins.set('Visucreator', {
                id: 'Visucreator',
                active: false
            });
            this.options.plugins.set('Exporter', {
                id: 'Exporter',
                active: false
            });
            this.options.plugins.set('Helplines', {
                id: 'Helplines',
                active: false
            });
            this.options.plugins.set('Hierarchy', {
                id: 'Hierarchy',
                active: false
            });
        }

        // Attributes for internal useage
        this.layer = null;          // Konva layer where the scene is drawn
        this.stage = null;          // Stage to put the layer on
        this.drawns = new Map();    // Map with key=fromName, value = array of set visus with index same index as dataset.id
        this.drawnadds = new Map(); // Map with key=fromName+set.id, value = array of KonvaElem
        this.visuelemFocus = null;  // visuelem that has currently focus
        this.markerinterval = null; // Intervall in which the marker will be animated
        this.markedelement = null;  // Marked element
        this.stopat = 0;
        this.isDragging = false;    // Notes the state of dragging interaction
        this.distancerevalidation = false;  // Notes the state of revalidation distance of relative drawings
        this.labelno = 0;           // No of drawn labels
    }

    init() {
        return new Promise((resolve, reject) => {
            let contElem = this.requestor.querySelector('.swac_visualmodel_drawarea');
            if (!contElem) {
                Msg.warn('Visualmodel', 'Component not correctly loaded. Skipping init.', this.requestor);
                return;
            }

            // Hide menue
            if (!this.options.showMenue) {
                let menueElem = this.requestor.querySelector('.swac_visualmodel_menue');
                menueElem.classList.add('swac_dontdisplay');
            }

            // Create stage
            if (this.options.stageWidth === 'contElem.clientWidth') {
                this.options.stageWidth = contElem.clientWidth;
            }

            let cont = this.requestor.querySelector('.swac_visualmodel_drawarea');
            // Set background color
            if (this.options.stageColor)
                cont.style["background-color"] = this.options.stageColor;

            let stagew = this.options.stageWidth;
            let stageh = this.options.stageHeight

            this.stage = new Konva.Stage({
                container: cont,
                width: stagew,
                height: stageh,
                draggable: true
            });
            Konva.showWarnings = true;
            this.layer = new Konva.Layer();
            this.stage.add(this.layer);
            this.layer.draw();

            // Initial zoom
            if (this.options.initialZoom != 1.0) {
                this.zoom(this.options.initialZoom);
            }

            // Bind event handlers
            if (this.options.allowZoom)
                this.stage.on("wheel", this.zoomMouse.bind(this));

            // Show or hide scenegraph
            if (this.options.showScenegraph) {
                this.drawSceneGraph();
            } else {
                let sgmElem = this.requestor.querySelector('.swac_visualmodel_scenegraph_menue');
                let sgElem = this.requestor.querySelector('.swac_visualmodel_scenegraph');
                sgmElem.parentNode.removeChild(sgmElem);
                sgElem.parentNode.removeChild(sgElem);
            }

            this.createLegend();

            resolve();
        });
    }

    /**
     * Function to reset the zoom to normal
     */
    resetZoom() {
        this.stage.scale({x: 1, y: 1});
        this.stage.position({x: 0, y: 0});
        this.stage.batchDraw();
    }

    zoom(factor) {
        this.stage.scale({x: factor, y: factor});
        this.stage.position({x: 0, y: 0});
        this.stage.batchDraw();
    }

    /**
     * Recalculate drawn elements when user zoom in or out on the stage
     *
     * @param {KonvaEvent} evt Event that calls the zoom
     */
    zoomMouse(evt) {
        var scaleBy = 0.99;
        evt.evt.preventDefault();
        var oldScale = this.stage.scaleX();
        var mousePointTo = {
            x:
                    this.stage.getPointerPosition().x / oldScale -
                    this.stage.x() / oldScale,
            y:
                    this.stage.getPointerPosition().y / oldScale -
                    this.stage.y() / oldScale
        };
        var newScale = evt.evt.deltaY > 0 ? oldScale * scaleBy : oldScale / scaleBy;

        this.stage.scale({x: newScale, y: newScale});
        var newPos = {
            x:
                    -(
                            mousePointTo.x -
                            this.stage.getPointerPosition().x / newScale
                            ) * newScale,
            y:
                    -(
                            mousePointTo.y -
                            this.stage.getPointerPosition().y / newScale
                            ) * newScale
        };
        this.stage.position(newPos);
        this.stage.batchDraw();
    }

    // public function
    afterAddSet(set, repeated) {
        Msg.flow('Visualmodel', 'afterAddSet >' + set.swac_fromName + '[' + set.id + ']<', this.requestor);
        let parentDrawn = null;
        // Check if a child is given
        if (set[this.options.parentIdAttr]) {
            let parentId = set[this.options.parentIdAttr];
            // Check if parent is available in the data
            if (!this.getMainSourceData() || !this.getMainSourceData().getSet(parentId)) {
                Msg.warn('Visualmodel', 'Parent set >' + this.getMainSourceName() + '['
                        + parentId + ']< is not available. Skip drawing child >' + set.swac_fromName + '[' + set.id + ']<', this.requestor);
                return;
            }

            parentDrawn = this.stage.find('#' + this.getMainSourceName() + '_' + parentId)[0];
            if (!parentDrawn) {
                Msg.warn('Visualmodel', 'Parent set >' + this.getMainSourceName() + '['
                        + parentId + ']< is not drawn. Skip drawing child >' + set.swac_fromName + '[' + set.id + ']<', this.requestor);
                return;
            }
        }

        // Draw element
        let drawnElem;
        if (set.type === 'con') {
            drawnElem = this.drawSetAsConnection(set, parentDrawn);
        } else {
            drawnElem = this.drawSetAsElement(set, parentDrawn);
        }

        // Check if element was drawn
        if (!drawnElem)
            return null;

        // Create group on element
        drawnElem.group = new Konva.Group();

        // Fill with image if given
        if (set.image) {
            let layer = this.layer;
            if (set.image.endsWith('.tif') || set.image.endsWith('.tiff')) {
                this.showCoverMsg('loadingtiff');
                // Intermediate img (load step 1: Use UTIFs function to load images to standard img-Tag)
                let img = document.createElement('img');
                img.classList.add('swac_dontdisplay');
                img.src = set.image;
                let thisRef = this;
                img.addEventListener('load', function () {
                    // Intermediate canvas (load step 2: transfare picture data from standard img-tag to canvas)
                    var cnv = document.createElement("CANVAS");
                    cnv.setAttribute('width', img.naturalWidth);
                    // cnv.hight does not do update tag internals, so use setAttribute()
                    cnv.setAttribute('height', img.naturalHeight);
                    var context = cnv.getContext("2d");
                    context.drawImage(img, 0, 0);
                    drawnElem.fillPatternImage(cnv);
                    layer.draw();
                    thisRef.remCoverMsg('loadingtiff');
                    // Notify about insufficent size of element
                    if (set.width < img.naturalWidth || set.height < img.naturalHeight) {
                        Msg.warn('Visualmodel', 'Real size of >' + set.image
                                + '< does not match elements size. Your image is not shown completely. Use width:'
                                + img.naturalWidth + ' and height: ' + img.naturalHeight);
                    }
                });
                this.requestor.appendChild(img);
                UTIF.replaceIMG();
            } else {
                let imageObj = new Image();
                imageObj.onload = function () {
                    drawnElem.fillPatternImage(imageObj);
                    layer.draw();
                };
                imageObj.src = set.image;
            }
        }

        if (parentDrawn && parentDrawn.attrs) {
            // Note created child
            parentDrawn.attrs.swac_childs.push(drawnElem);
            // Calculate relative position
            drawnElem.swac_rel_x = drawnElem.attrs.x - parentDrawn.attrs.x;
            drawnElem.swac_rel_y = drawnElem.attrs.y - parentDrawn.attrs.y;
        }
        this.putOnStage(set, drawnElem, parentDrawn);

        // Get default values
        let defaults = this.options.attributeDefaults.get(set.swac_fromName);
        if (!defaults) {
            defaults = this.options.attributeDefaults.get('VisualmodelGeneral');
        }
        // Get colors
        let fillcolor = set.fillcolor ? set.fillcolor : defaults.fillcolor;

        // Get labels
        let labels = this.createLabelsForSet(set, fillcolor);
        // Draw labels
        this.drawLabelsForSet(set, labels, drawnElem);
        this.layer.draw();

        // If plugins allready loaded call redraw function on each
        if (this.getLoadedPlugins) {
            for (let curPlugin of this.getLoadedPlugins().values()) {
                curPlugin.swac_comp.afterAddSet(set);
//                console.log('redraw for >' + this.requestor.id + '< with plugins parent: > ' + curPlugin.parent.id + '<');
                if (curPlugin.swac_comp.redraw)
                    curPlugin.swac_comp.redraw();
            }
        }
    }

    /**
     * Get notification about changed values
     * 
     * @param {WatchableSet} set Set wichs content has changed
     * @param {String} name Name of the attribute that changed
     * @param {type} value New value
     */
    notifyChangedValue(set, name, value) {
        if (this.requestor.classList.contains('swac_dontdisplay')) {
            Msg.flow('Visualmodel',
                    'Notification do not update drawing because is not visible', this.requestor);
            return;
        }
        Msg.flow('Visualmodel',
                'Notification about new value >' + set.swac_fromName + '[' + set.id + '].' + name + '< =' + value
                + ' recived.', this.requestor);

        // Do not update id. remove old set and add new one instead
        if (name === 'id') {
            return;
        }
        // Exclude attr from redraw
        if (this.options.doNotRedrawOn.includes(name))
            return;
        // No need to calculation on reseted values
        if (this.distancerevalidation) {
            this.distancerevalidation = false;
            return false;
        }
        // Do not redraw when id changed (new set was saved)
        if (set.swac_prev_id === 0) {
            //TODO should not be needed???
            this.afterRemoveSet(set.swac_fromName, set.id, false);
            return;
        }

        //TODO why label0 excluded?
        if (!this.isDragging && name !== 'label0') {
            //TODO complete redraw needed?
            this.copy();
            this.delete();
//            this.requestor.remove();
//            this.requestor.classList.add('swac_dontdisplay');            

            // Redraw dataset
//                Msg.flow('Visualmodel', 'Remove visualisation for set ' + set.swac_fromName + '[' + set.id + ']', this.requestor);
//                this.afterRemoveSet(set.swac_fromName, set.id, false);
//                Msg.flow('Visualmodel', 'Readd visualisation for set ' + set.swac_fromName + '[' + set.id + ']', this.requestor);
//                this.afterAddSet(set);

//            // Redraw
//            let posMode = this.options.calcPosMode(set, this);
//            if (posMode === 'none') {
////                console.log('x for none position mode');
////                // Redraw dataset
////                Msg.flow('Visualmodel', 'Remove set ' + set.swac_fromName + '[' + set.id + ']', this.requestor);
////                this.afterRemoveSet(set.swac_fromName, set.id, false);
////                Msg.flow('Visualmodel', 'Readd set ' + set.swac_fromName + '[' + set.id + ']', this.requestor);
////                this.afterAddSet(set);
//                return;
//            }
//
//            // Get default values
//            let defaults = this.options.attributeDefaults.get(set.swac_fromName);
//            if (!defaults) {
//                defaults = this.options.attributeDefaults.get('VisualmodelGeneral');
//            }
//
//            // Redraw of siblings only needed if relative position changed
//            if (name === defaults.xAttr && posMode.startsWith('relative')) {
//                // Parents defaults
//                let pdefaults = this.options.attributeDefaults.get(this.getMainSourceName());
//                if (!pdefaults) {
//                    pdefaults = this.options.attributeDefaults.get('VisualmodelGeneral');
//                }
//                let parentId = set[this.options.parentIdAttr];
//                let parentSet = this.getMainSourceData().getSet(parentId);
//
//                // Look at affected siblings
//                for (let i = set.id + 1; i < this.data[set.swac_fromName].count(); i++) {
//                    let curSet = this.data[set.swac_fromName].getSet(i);
//                    if (!curSet || curSet[this.options.parentIdAttr] !== set[this.options.parentIdAttr])
//                        continue;
//                    if (curSet[defaults.xAttr] > 0 && curSet[defaults.xAttr] < parentSet[pdefaults.widthAttr]) {
//                        if (this.options.movePosMode === 'move') {
//                            this.afterRemoveSet(curSet.swac_fromName, curSet.id, false);
//                            this.afterAddSet(curSet);
//                        } else {
//                            // Only need to recalculate the distance to the next one
//                            let diff = set['swac_prev_' + name] - set[name];
////                            console.log('check for ' + curSet.swac_fromName + ' ' + curSet.id);
////                            console.log(diff + ' < ' + 0 + ' && ' + Math.abs(diff) + ' > ' + curSet[defaults.xAttr]);
////                            console.log((diff < 0) + ' && ' + (Math.abs(diff) > curSet[defaults.xAttr]));
//                            if (diff < 0 && Math.abs(diff) > curSet[defaults.xAttr]) {
//                                this.distancerevalidation = true;
////                                    curSet[defaults.xAttr] = curSet['swac_prev_' + defaults.xAttr];
//                                set[name] = set['swac_prev_' + name];
//                                UIkit.modal.alert(SWAC.lang.dict.Visualmodel.invalidrelpos);
//                                return false;
//                            }
////                            console.log('set ' + curSet.id + '.' + defaults.xAttr + ' set to ' + (curSet[defaults.xAttr] + diff));
//                            curSet[defaults.xAttr] = curSet[defaults.xAttr] + diff;
//                            break;
//                        }
//                    }
//                }
//            }
//
//            // Redraw dataset
//            Msg.flow('Visualmodel', 'Remove set ' + set.swac_fromName + '[' + set.id + ']', this.requestor);
//            this.afterRemoveSet(set.swac_fromName, set.id, false);
//            Msg.flow('Visualmodel', 'Readd set ' + set.swac_fromName + '[' + set.id + ']', this.requestor);
//            this.afterAddSet(set);
        }
    }

    /**
     * Recive notification after commit change of dataset
     * 
     * @param {WatchableSet} set WatchableSet that was changed by commit
     */
    notifyCommit(set) {
        Msg.flow('Visualmodel', 'Notified about commit for >' + set.swac_fromName + '[' + set.id + ']<');
        if (!this.isDragging) {
            this.afterRemoveSet(set.swac_fromName, set.id);
            this.afterAddSet(set);
        }
    }

    /**
     * Put the drawn element on stage
     * 
     * @param {WatchableSet} set Dataset the drawn belongs to
     * @param {KonvaObject} drawnElem Created drawn to put on stage
     */
    putOnStage(set, drawnElem) {
        // Add visu to layer
        drawnElem.group.add(drawnElem);
        this.layer.add(drawnElem.group);

        // Create drawns storage if not exists
        if (!this.drawns.has(set.swac_fromName)) {
            this.drawns.set(set.swac_fromName, []);
        }
        let drawnStorage = this.drawns.get(set.swac_fromName);
        drawnStorage[set.id] = drawnElem;

        // ***************
        // Register event handlers for visuelem<
        // ***************

        let stage = this.stage;
        // Prevent stage from be dragged when on visuelem
        drawnElem.on("mouseenter", function (e) {
            if (e.target === drawnElem) {
                stage.draggable(false);
            }
        });
        // Set stage to be draggable again so that user can move over whole drawing
        drawnElem.on("mouseleave", function (e) {
            if (e.target === drawnElem) {
                if (this.focusObject === null) {
                    stage.draggable(true);
                }
            }
        });
        //drawnElem.strokeScaleEnabled(false);

        // Get default values
        let defaults = this.options.attributeDefaults.get(set.swac_fromName);
        if (!defaults) {
            defaults = this.options.attributeDefaults.get('VisualmodelGeneral');
        }
        // Get dragmode
        let dragmode = set.dragmode ? set.dragmode : defaults.dragmode;
        // Apply dragmode
        if (dragmode === 'none') {
            drawnElem.draggable(false);
        } else if (set.draggable !== false) {
            // When dragging
            let thisRef = this;
            let originalX = drawnElem.x();
            let originalY = drawnElem.y();
            let xAttr = 'x';
            if (set[defaults.xAttr]) {
                xAttr = defaults.xAttr;
            }
            let yAttr = 'y';
            if (set[defaults.yAttr]) {
                yAttr = defaults.yAttr;
            }

            drawnElem.on("dragstart", function (evt) {
                drawnElem.attrs.swac_set.swac_dragged = true;
            });
            drawnElem.on("dragmove", function (evt) {
                thisRef.isDragging = true;
                thisRef.moveElement(drawnElem, defaults);
                if (dragmode === 'horizontal') {
                    drawnElem.y(originalY);
                } else if (dragmode === 'vertical') {
                    drawnElem.x(originalX);
                }
                // Update dataset
                let x = drawnElem.x();
                if (defaults.xOffset)
                    x = x - defaults.xOffset;
                if (defaults.xFactor)
                    x = x / defaults.xFactor;
                set[xAttr] = x;

                let y = drawnElem.y();
                if (defaults.yOffset)
                    y = y - defaults.yOffset;
                if (defaults.yFactor)
                    y = y / defaults.yFactor;
                set[yAttr] = y;
            });
            drawnElem.on("dragend", function (evt) {
                set.swac_dragged = false;
                set.notifyObservers(xAttr, set[xAttr], set[xAttr]);
                set.notifyObservers(yAttr, set[yAttr], set[yAttr]);
                if (thisRef.options.autosave)
                    thisRef.saveData();
                thisRef.isDragging = false;
            });
            drawnElem.draggable(true);
        }
    }

    /**
     * Draw a dataset as a connection
     *
     * @param {Object} set Dataset with at least part1, part2 attributes
     * @param {KonvaObject} parentDrawn KonvaObject that is parent of the currently to draw object
     * @param {KonvaObject} drawnCon Connection object previous drawn to recalculate line
     * @returns {Visualmodel.drawSetAsConnection.drawnCon|Konva.Line|Konva.Arrow}
     */
    drawSetAsConnection(set, parentDrawn, drawnCon) {
        if (!set.part1 || !set.part2) {
            Msg.error('Visualmodel', 'Dataset >' + set.id
                    + '< is no connection dataset, because part1 or part2 attribute is missing',
                    this.requestor);
            return null;
        }
        // Get sets and their drawn involved in connection
        let startFromName = set.swac_fromName;
        let startSetId;
        if (isNaN(set.part1)) {
            startFromName = Model.getFromnameFromReference(set.part1);
            startSetId = Model.getIdFromReference(set.part1);
            startFromName = 'resources/server/list';
        } else {
            startSetId = set.part1;
        }
        let startVisu = this.stage.find('#' + startFromName + '_' + startSetId)[0];
        if (!startVisu) {
            Msg.error('Visualmodel', 'Start element >' + set.part1
                    + '< for connection not found.',
                    this.requestor);
            return null;
        }
        let endSetFromName = set.swac_fromName;
        let endSetId = set.part2;
        if (isNaN(set.part2)) {
            endSetFromName = Model.getFromnameFromReference(set.part2);
            endSetId = Model.getIdFromReference(set.part2);
            endSetFromName = 'resources/server/list';
        }
        let endVisu = this.stage.find('#' + endSetFromName + '_' + endSetId)[0];
        if (!endVisu) {
            Msg.error('Visualmodel', 'End element >' + set.part1
                    + '< for connection not found.',
                    this.requestor);
            return null;
        }

        // Get docking points of the connection
        let startPoint = this.calculateConPoint(startVisu, endVisu);
        let endPoint = this.calculateConPoint(endVisu, startVisu);

        // Get default values
        let defaults = this.options.attributeDefaults.get(set.swac_fromName);
        if (!defaults) {
            defaults = this.options.attributeDefaults.get('VisualmodelGeneral');
        }

        // Use default line calc mode if no one specified
        if (!set.linecalc) {
            set.linecalc = defaults.conLinecalc;
        }

        // Get position of line points
        let posarray;
        if (set.linecalc === 'curve') {
            // Calculate curve point
            let cp_x = startPoint.x + ((endPoint.x - startPoint.x) / 2);
            let cp_y = startPoint.y + ((endPoint.y - startPoint.y) / 4);
            posarray = [startPoint.x, startPoint.y, cp_x, cp_y, endPoint.x, endPoint.y];
        } else {
            posarray = [startPoint.x, startPoint.y, endPoint.x, endPoint.y];
        }

        let conOpts = {
            id: set.swac_fromName + '_' + set.id,
            swac_fromName: set.swac_fromName,
            swac_set: set,
            swac_childs: [],
            swac_parent: parentDrawn,
            points: posarray,
            lineCap: 'butt',
            lineJoin: 'butt',
            listening: true
        };

        // Get stroke
        conOpts.stroke = set.strokecolor ? set.strokecolor : defaults.conColor;
        conOpts.strokewidth = set.strokewidth ? set.strokewidth : defaults.conWidth;
        conOpts.tension = set.stroketension ? set.stroketension : defaults.conTension;

        // Draw connwction
        if (!drawnCon) {
            if (set.kind === 'arrow') {
                conOpts.pointerLength = 10;
                conOpts.pointerWidth = 10;
                conOpts.pointerAtBeginning = false;
                drawnCon = new Konva.Arrow(conOpts);
            } else {
                drawnCon = new Konva.Line(conOpts);
            }

            startVisu.attrs.swac_connections.push(drawnCon);
            endVisu.attrs.swac_connections.push(drawnCon);

            // Add event handler for clicking onClickOtherDrawn
            if (defaults.conOnClick) {
                drawnCon.on('click', defaults.conOnClick.bind(this));
            }
        } else {
            drawnCon.setPoints(posarray);
        }

        return drawnCon;
    }

    /**
     * Calculate the position of the docking point of connection lines
     *
     * @param {KonvaObject} startVisu Object that ist start point of the connection
     * @param {KonvaObject} endVisu Object that is endpoint of the connection
     * @returns {Visualmodel.calculateConPoint.xypos}
     */
    calculateConPoint(startVisu, endVisu) {
        let xypos = {};

        // Calculate middle points
        let smpointx = startVisu.attrs.x + (startVisu.attrs.width / 2);
        let smpointy = startVisu.attrs.y + (startVisu.attrs.height / 2);
        let empointx = endVisu.attrs.x + (endVisu.attrs.width / 2);
        let empointy = endVisu.attrs.y + (endVisu.attrs.height / 2);

        // Get length of line between points (this is radius of circle around watched element)
        let linelength = Math.sqrt(Math.pow((empointx - smpointx), 2) + Math.pow((empointy - smpointy), 2));

        // Create point where 0 degree is located on the circle
        let nullpointx = smpointx;
        let nullpointy = smpointy - linelength;
        // Create vector from center (watched element) to 0 degree
        let mTnVec = [(nullpointx - smpointx), (nullpointy - smpointy)];
        // Create vector from center (watched element) to second element
        let mTbVec = [(empointx - smpointx), (empointy - smpointy)];
        // Calculate scalar product of vectors
        let skalarprod = (mTnVec[0] * mTbVec[0]) + (mTnVec[1] * mTbVec[1]);
        // Calculate length of vectors (https://de.serlo.org/mathe/1777/l%C3%A4nge-eines-vektors#:~:text=L%C3%A4nge%20eines%20Vektors%201%20Berechnung.%20Der%20Betrag%20eines,vielen%20Aspekten%20des%20realen%20Lebens%20eine%20Rolle.%20)
        let length_nVec = Math.sqrt(Math.pow(mTnVec[0], 2) + Math.pow(mTnVec[1], 2));
        let length_bVec = Math.sqrt(Math.pow(mTbVec[0], 2) + Math.pow(mTbVec[1], 2));
        // Calculate angle in radiant (https://www.mathebibel.de/winkel-zwischen-zwei-vektoren#:~:text=%20Winkel%20zwischen%20zwei%20Vektoren%20berechnen%20-%20Beispiel,betr%C3%A4gt%20etwa%20125%2C26%C2%B0%20Grad.%20Der%20Winkel...%20More%20)
        let rad = Math.acos(skalarprod / (length_nVec * length_bVec));

        // Calculate degree
        let deg = (rad * 180 / Math.PI);
        if (empointx < smpointx) {
            // Calculated angle is allways angle of the "spitze winkel"
            // But we need the angle complete arround the circle
            deg = 360 - deg;
        }

        // Chose connection location
        if (deg >= 45 && deg <= 135) {
            // Right
            xypos.x = startVisu.attrs.x + startVisu.attrs.width;
            xypos.y = startVisu.attrs.y + (startVisu.attrs.height / 2);
        } else if (deg > 135 && deg < 225) {
            // Bottom
            xypos.x = startVisu.attrs.x + (startVisu.attrs.width / 2);
            xypos.y = startVisu.attrs.y + startVisu.attrs.height;
        } else if (deg >= 225 && deg <= 315) {
            // Left
            xypos.x = startVisu.attrs.x;
            xypos.y = startVisu.attrs.y + (startVisu.attrs.height / 2);
        } else {
            // Top
            xypos.x = startVisu.attrs.x + (startVisu.attrs.width / 2);
            xypos.y = startVisu.attrs.y;
        }
        return xypos;
    }

    /** Draw a dataset as element
     *
     * @param {Object} set Dataset to visualise
     * @param {KonvaObject} parentDrawn Parents dataset representation
     * @returns {Konva.Rect|Visualmodel.drawSetAsElement.drawnElem}
     */
    drawSetAsElement(set, parentDrawn) {
        Msg.flow('Visualmodel', 'drawSetAsElement for >' + set.swac_fromName + '[' + set.id + ']<', this.requestor);
        let elementOpts = {
            id: set.swac_fromName + '_' + set.id,
            swac_fromName: set.swac_fromName,
            swac_set: set,
            swac_parent: parentDrawn,
            swac_childs: [],
            swac_connections: [],
            scaleX: 1,
            scaleY: 1,
            strokewidth: 1
        };
        // Try find drawn from previous draw call
        let existingDrawn = this.stage.find('#' + elementOpts.id)[0];
        if (existingDrawn) {
            existingDrawn.destroy();
        }

        // Get default values
        let defaults = this.options.attributeDefaults.get(set.swac_fromName);
        if (!defaults) {
            Msg.info('Visualmodel', 'Defaults for >' + set.swac_fromName + '< not found.', this.requestor);
            defaults = this.options.attributeDefaults.get('VisualmodelGeneral');
        }
        // Get coordinate
        if (defaults.xAttr && typeof set[defaults.xAttr] !== 'undefined') {
            elementOpts.x = set[defaults.xAttr];
        } else {
            elementOpts.x = set.x ? set.x : defaults.x;
        }

        if (typeof elementOpts.x === 'undefined')
            elementOpts.x = this.stage.width() / 2;
        // Calculate with xFactor
        if (defaults.xFactor) {
            elementOpts.x = elementOpts.x * defaults.xFactor;
        }
        // Add offset
        if (defaults.xOffset) {
            elementOpts.x += defaults.xOffset;
        }

        if (defaults.yAttr && typeof set[defaults.yAttr] !== 'undefined') {
            elementOpts.y = set[defaults.yAttr];
        } else {
            elementOpts.y = set.y ? set.y : defaults.y;
        }
        if (!elementOpts.y)
            this.stage.height() / 2;
        // Calculate with yFactor
        if (defaults.yFactor) {
            elementOpts.y = elementOpts.y * defaults.yFactor;
        }
        // Add offset
        if (defaults.yOffset) {
            elementOpts.y += defaults.yOffset;
        }
        let posMode = this.options.calcPosMode(set, this);
        // Calculate relative position
        if (posMode.startsWith('relative')) {
            // Find previous sibling
            let prevSet;
            for (let i = set.id; i--; i > 0) {
                prevSet = this.data[set.swac_fromName].getSet(i);
                if (prevSet) {
                    // If is child and not of same parent it is not a prev
                    if (this.options.mainSource !== set.swac_fromName && prevSet[this.options.parentIdAttr] !== set[this.options.parentIdAttr])
                        continue;
                    // Use custom check function
                    if (this.options.checkPrevSet && !this.options.checkPrevSet(prevSet, set, this))
                        continue;
                    // Prev found
                    break;
                }
            }
            if (prevSet) {
                // Remove double added offset
                if (defaults.xOffset) {
                    elementOpts.x = elementOpts.x - defaults.xOffset;
                }
                // Try find drawn
                let drawnid = set.swac_fromName + '_' + prevSet.id;
                let prevDrawn = this.stage.find('#' + drawnid)[0];
                // Update x and y positions
                if (prevDrawn) {
                    if (posMode == 'relative' || posMode == 'relativeX')
                        elementOpts.x = elementOpts.x + prevDrawn.x();
                    if (posMode == 'relative' || posMode == 'relativeY')
                        elementOpts.y = elementOpts.y + prevDrawn.y();
                }
            }
        }

        // Get height and width
        if (defaults.widthAttr && set[defaults.widthAttr]) {
            elementOpts.width = set[defaults.widthAttr];
        } else {
            elementOpts.width = !isNaN(set.width) ? set.width : defaults.width;
        }
        if (set.widthFactor) {
            elementOpts.width = elementOpts.width * set.widthFactor;
        }
        if (defaults.widthFactor) {
            elementOpts.width = elementOpts.width * defaults.widthFactor;
        }

        if (defaults.heightAttr && set[defaults.heightAttr]) {
            elementOpts.height = set[defaults.heightAttr];
        } else {
            elementOpts.height = !isNaN(set.height) ? set.height : defaults.height;
        }
        if (set.heightFactor) {
            elementOpts.height = elementOpts.height * set.heightFactor;
        }
        if (defaults.heightFactor) {
            elementOpts.height = elementOpts.height * defaults.heightFactor;
        }

        // Check if drawn is connected to parent
        let parentRel = '';
        if (parentDrawn && parentDrawn.attrs) {
            if (elementOpts.x < parentDrawn.attrs.x) {
                parentRel += 'before';
            } else if (elementOpts.x >= parentDrawn.attrs.x + parentDrawn.attrs.width) {
                parentRel += 'after';
            }
            if (elementOpts.y <= parentDrawn.attrs.y) {
                parentRel += 'above';
            } else if (elementOpts.y >= parentDrawn.attrs.y + parentDrawn.attrs.height) {
                parentRel += 'below';
            }
            if (parentRel === '') {
                parentRel += 'mounted';
            }
        }
        if (!defaults.zRotateApplyOn || defaults.zRotateApplyOn.split(',').includes(parentRel)) {
            if (defaults.zRotateAttr && typeof set[defaults.zRotateAttr] !== 'undefined') {
                elementOpts.rotation = set[defaults.zRotateAttr];
//                if (set.rotation) {
//                    elementOpts.rotation = elementOpts.rotation + set.rotation;
////                    elementOpts.y = elementOpts.y + 2;
//                }
            } else {
                elementOpts.rotation = !isNaN(set.rotation) ? set.rotation : defaults.rotation;
            }
            if (elementOpts.rotation >= 180 && elementOpts.rotation <= 360) {
                if (defaults.yOffset) {
                    elementOpts.y += defaults.yOffset;
                }
            }
            if (defaults.zRotateOffset) {
                elementOpts.rotation = elementOpts.rotation + defaults.zRotateOffset;
            }
        }

        if (!defaults.xRotateApplyOn || defaults.xRotateApplyOn.split(',').includes(parentRel)) {
            // Apply x-rotation
            if (defaults.xRotateAttr && set[defaults.xRotateAttr]) {
                let rotate = set[defaults.xRotateAttr];
                let lfactor;
                if (rotate >= 0 && rotate <= 180) {
                    lfactor = (90 - rotate) / 90;
                } else {
                    lfactor = (90 - (rotate - 180)) / -90;
                }
                if (rotate >= 45 && rotate <= 135) {
                    elementOpts.y = elementOpts.y + (parentDrawn.attrs.height / 2);
                } else if (rotate > 135 && rotate <= 225) {
                    elementOpts.y = elementOpts.y + parentDrawn.attrs.height;
                } else if (rotate > 225 && rotate <= 325) {
                    elementOpts.y = elementOpts.y + (parentDrawn.attrs.height / 2);
                } else {
                    // No aditional y shift
                }
                elementOpts.height = elementOpts.height * lfactor;
            }
        }

        // Calculate placement on radius
        if (defaults.placeOnRadius) {
            let r = defaults.placeOnRadius;
            let phi = elementOpts.rotation - 90;
            let phirad = phi * Math.PI / 180;
            let x = r * Math.cos(phirad) + elementOpts.x;
            let y = r * Math.sin(phirad) + elementOpts.y;
            // Correcture for middle of element on radius
            x = x + Math.sin(phirad) * (elementOpts.width / 2);
            y = y - Math.cos(phirad) * (elementOpts.width / 2);
            elementOpts.x = x;
            elementOpts.y = y;
        }

        // Get colors
        if (!set.image)
            elementOpts.fill = set.fillcolor ? set.fillcolor : defaults.fillcolor;
        elementOpts.stroke = set.borderColor ? set.borderColor : defaults.borderColor;

        // Set description
        if (set.desc) {
            elementOpts.desc = set.desc;
        }
        let drawnElem;
        // Decide form
        if (set.kind) {
            if (set.kind === 'rect') {
                drawnElem = new Konva.Rect(elementOpts);
            } else if (set.kind === 'circle') {
                if (set.radius)
                    elementOpts.radius = set.radius;
                else if (defaults.radiusAttr && set[defaults.radiusAttr])
                    elementOpts.radius = set[defaults.radiusAttr];
                else if (defaults.radius)
                    elementOpts.radius = defaults.radius;
                drawnElem = new Konva.Circle(elementOpts);
            } else if (set.kind === 'ellipse') {
                if (set.radiusX)
                    elementOpts.radiusX = set.radiusX;
                if (set.radiusX)
                    elementOpts.radiusY = set.radiusY;
                drawnElem = new Konva.Ellipse(elementOpts);
            } else if (set.kind === 'wedge') {
                if (set.radius)
                    elementOpts.radius = set.radius;
                if (set.angle)
                    elementOpts.angle = set.angle;
                drawnElem = new Konva.Wedge(elementOpts);
            } else if (set.kind === 'star') {
                if (set.innerRadius)
                    elementOpts.innerRadius = set.innerRadius;
                if (set.outerRadius)
                    elementOpts.outerRadius = set.outerRadius;
                if (set.numPoints)
                    elementOpts.numPoints = set.numPoints;
                drawnElem = new Konva.Star(elementOpts);
            } else if (set.kind === 'ring') {
                if (set.innerRadius)
                    elementOpts.innerRadius = set.innerRadius;
                if (set.outerRadius)
                    elementOpts.outerRadius = set.outerRadius;
                drawnElem = new Konva.Ring(elementOpts);
            } else if (set.kind === 'arc') {
                if (set.innerRadius)
                    elementOpts.innerRadius = set.innerRadius;
                if (set.outerRadius)
                    elementOpts.outerRadius = set.outerRadius;
                if (set.angle)
                    elementOpts.angle = set.angle;
                drawnElem = new Konva.Arc(elementOpts);
            } else if (set.kind === 'regularpolygon') {
                if (set.radius)
                    elementOpts.radius = set.radius;
                if (set.sides)
                    elementOpts.sides = set.sides;
                drawnElem = new Konva.RegularPolygon(elementOpts);
            } else {
                Msg.error('Visualmodel', 'Kind >' + set.kind + '< is unkown.', this.requestor);
            }
        } else {
            drawnElem = new Konva.Rect(elementOpts);
        }

        // Add event handler for clicking onClickOtherDrawn
        if (defaults.onClick) {
            drawnElem.on('click', defaults.onClick.bind(this));
        }

        // Draw addition
        this.drawAddition(set, drawnElem);

        return drawnElem;
    }

    /**
     * Draws additions to a main element as they are defined in the drawAdditions option
     *
     * @param {Object} set Dataset that should be drawn
     * @param {KonvaElement} mainElem Main element to which the additions should be added
     */
    drawAddition(set, mainElem) {
        Msg.flow('Visualmodel', 'Draw addition for >' + set.swac_fromName + '[' + set.id + ']<', this.requestor);
        // Search allready drawn additions
        let drawns = this.drawnadds.get(set.swac_fromName + set.id);
        if (drawns) {
            for (let drawn of drawns) {
                drawn.destroy();
            }
        }
        drawns = [];
        this.drawnadds.set(set.swac_fromName + set.id, drawns);
        // Search matching in available additions
        for (let curAddition of this.options.drawAdditions) {
            if (set[curAddition.applyOnAttr] && set[curAddition.applyOnAttr] === curAddition.applyOnVal) {
                const group = new Konva.Group();
                // Draw addition parts
                for (let cdraw of curAddition.draw) {
                    let draw = cdraw.clone();
                    let x = mainElem.getX() + draw.getX();
                    let y = mainElem.getY() + draw.getY();
                    // Use position
                    let xpos = (typeof set.x != 'undefined') ? set.x : 0;
                    x = x + xpos;
                    draw.setX(x);
                    draw.setY(y);
                    group.add(draw);
                    let parentDrawn = this.getParentDrawn(set);
                    if (!parentDrawn) {
                        continue;
                    }
                    // If addition should be added to the right
                    if (mainElem.getX() >= parentDrawn.getX() + parentDrawn.attrs.width) {
                        // Flipp for additions at the right end
                        if (curAddition.reflectx) {
                            let newrot = Math.abs(draw.rotation() - 360);
                            draw.rotation(newrot);
                            this.layer.add(draw);
                            draw.to({
                                scaleX: -draw.scaleX(),
                                duration: 0
                            });
                            // Workaround for not working mirroring on Rect objects
                            if (draw.attrs.swac_name === 'Rect') {
                                draw.x(draw.x() + (-2 * cdraw.x()));
                            }
                        }
                    }
                    // Rotate addition
                    if (curAddition.rotateOnAttr && set[curAddition.rotateOnAttr]) {
                        let rotation = set[curAddition.rotateOnAttr];
                        if (rotation > 90 && rotation < 270) {
                            draw.to({
                                scaleY: -draw.scaleY()
                            });
                            draw.y(draw.y() + 5);
                        }
                    }
                    drawns.push(draw);
                }
                // Draw text addition
                if (curAddition.textattr && set[curAddition.textattr]) {
                    let tex = {
                        text: set[curAddition.textattr],
                        x: mainElem.getX() - 20,
                        y: mainElem.getY() + 35
                    };
                    let addtxt = new Konva.Text(tex);
                    group.add(addtxt);
                    drawns.push(addtxt);
                }
                this.layer.add(group);
                break;
            }
        }
    }

    /**
     * Creates the labels for the set. There could be n labels.
     *
     * @param {Object} set That contains labels (title, name, and labelX - Attributes are recognised)
     * @param {String} fillcolor Color that filles the element the label is placed on
     * @returns {Object[]} List of labels
     */
    createLabelsForSet(set, fillcolor) {
        let defaults = this.options.attributeDefaults.get(set.swac_fromName);
        if (!defaults) {
            Msg.warn('Visualmodel', 'No defaults for >' + set.swac_fromName + '< falling back to VisualmodelGeneral.', this.requestor);
            defaults = this.options.attributeDefaults.get('VisualmodelGeneral');
        }

        // Calculate label
        let label0 = '';
        let labels = [];        // Get label from title
        if (typeof set.title !== 'undefined') {
            label0 = set.title;
        } else if (typeof set.name !== 'undefined') {
            label0 = set.name;
        }
        if (defaults.labelParts) {
            let lparts = defaults.labelParts.split(',');
            let i = 0;
            for (let lpart of lparts) {
                if (lpart && set[lpart]) {
                    if (i > 0)
                        label0 += ' ';
                    // Check if there is a abbrivation
                    if (this.options.legendMap) {
                        let lb = this.options.legendMap.get(set[lpart]);
                        if (lb)
                            label0 += lb;
                    } else {
                        label0 += set[lpart];
                    }
                    i++;
                }
            }
        }
        set.label0 = label0;

        // Get label from labelX attributes
        for (let curAttr in set) {
            if (curAttr.startsWith('label') && curAttr.match(".*\\d$")) {
            } else {
                continue;
            }

            // Create label obj
            let curLabel = {};
            curLabel.setAttr = curAttr;
            // Get label text
            curLabel.text = set[curAttr];
            // Get label font
            curLabel.fontFamily = set[curAttr + 'frontFamily'] ? set[curAttr + 'frontFamily'] : defaults.labelFrontFamily;
            // Get label Style
            curLabel.fontStyle = set[curAttr + 'frontStyle'] ? set[curAttr + 'frontStyle'] : defaults.labelFrontStyle;
            // Get label size
            curLabel.fontSize = set[curAttr + 'frontSize'] ? set[curAttr + 'frontSize'] : defaults.labelFrontSize;
            // Label position
            curLabel.x = set[curAttr + 'x'] ? set[curAttr + 'x'] : defaults.labelX;
            curLabel.y = set[curAttr + 'y'] ? set[curAttr + 'y'] : defaults.labelY;

            // Get label padding
            curLabel.padding = set[curAttr + 'padding'] ? set[curAttr + 'padding'] : defaults.labelPadding;

            // Get label strokeWidth
            curLabel.strokewidth = set[curAttr + 'strokewidth'] ? set[curAttr + 'strokewidth'] : defaults.labelStrokeWidth;
            // Get labelFillcolor
            if (fillcolor) {
                curLabel.fill = set[curAttr + 'fillcolor'] ? set[curAttr + 'fillcolor'] : Colorcalculations.calculateContrastColor(fillcolor);
            } else {
                curLabel.fill = set[curAttr + 'fillcolor'] ? set[curAttr + 'fillcolor'] : defaults.labelFillColor;
            }
            // Get labelBordercolor
            if (set[curAttr + 'borderColor']) {
                curLabel.stroke = set[curAttr + 'borderColor'];
            }
            // Make draggable
            curLabel.draggable = true;
            // Create label
            let label = new Konva.Text(curLabel);
            labels.push(label);
            label.offsetX(curLabel.x);
            if (!curLabel.y)
                curLabel.y = label.width() / 2;

            label.offsetY(curLabel.y);
        }
        return labels;
    }

    /**
     * Draws the labels
     *
     * @param {Object} set Set that has the label (my have xoffset and yoffset values for labels)
     * @param {KonvaObject[]} labels List of created konva elements for the labels
     * @param {KonvaObject} drawnElem The drawn element the labels are for.
     * @returns {undefined}
     */
    drawLabelsForSet(set, labels, drawnElem) {
        let xOffset = 5;
        let yOffset = 2;
        // Offset plus for more labels for same set
        let xOffsetPlus = 0;
        let yOffsetPlus = 15;
        drawnElem.attrs.swac_labels = [];
        for (let curLabel of labels) {
            this.labelno++;
            // Check if dataset has an x-offset
            curLabel.attrs.xoffset = set[curLabel.setAttr + 'xoffset'] ? set[curLabel.setAttr + 'xoffset'] : xOffset;
            curLabel.attrs.x = drawnElem.attrs.x + curLabel.attrs.xoffset;
            curLabel.attrs.yoffset = set[curLabel.setAttr + 'yoffset'] ? set[curLabel.setAttr + 'yoffset'] : yOffset;
            curLabel.attrs.y = drawnElem.attrs.y + curLabel.attrs.yoffset;
            if (((this.labelno) % 2) > 0) {
                curLabel.attrs.y -= this.options.oddLabelYOffset;
                curLabel.attrs.x -= this.options.oddLabelXOffset;
            }

            // Add label to layer
            drawnElem.group.add(curLabel);
            curLabel.zIndex(1);
            // Add label to list of labels for set
            drawnElem.attrs.swac_labels.push(curLabel);

            // Add dragging listener (move element along with label)
            curLabel.on('dragstart', function () {
                curLabel.stopDrag();
                drawnElem.startDrag();
            });

            // Add plus for next label of element
            xOffset += xOffsetPlus;
            yOffset += yOffsetPlus;
        }
    }

    /**
     * Remove drawing from stage after a set was removed
     * 
     * @param {String} fromName Name of the datasource the set was removed from
     * @param {int8} id Id of the dataset that was removed
     * @param {bool} redraw true if the visualisation should be redrawn
     */
    afterRemoveSet(fromName, id, redraw = true) {
        Msg.flow('Visualmodel', 'afterRemoveSet >' + fromName + '[' + id + ']<', this.requestor);
        let drawnid = fromName + '_' + id;
        let drawn = this.stage.find('#' + drawnid)[0];
        // Check if there is a 0-drawn (new set that now is saved)
        if (!drawn) {
            drawnid = fromName + '_0';
            drawn = this.stage.find('#' + drawnid)[0];
        }
        // Return when there is no drawn for dataset
        if (!drawn) {
            Msg.warn('Visualmodel', 'Could not find drawn for >' + fromName + '[' + id + ']<', this.requestor);
            return;
        }
        // Remove references from parent
        if (drawn.attrs.swac_parent && !drawn.attrs.swac_parent.notdrawn) {
            if (SWAC.config.debugmode) {
                console.log('parent to remove from:');
                console.log(drawn.attrs.swac_parent);
                console.log('to remove');
                console.log(drawn);
            }
            let pChilds = drawn.attrs.swac_parent.attrs.swac_childs;
            for (let i in pChilds) {
                if (pChilds[i] === drawn)
                    delete pChilds[i];
            }
        }
        // Also delete labels
        if (drawn.attrs.swac_labels) {
            for (let curLabel of drawn.attrs.swac_labels) {
                curLabel.destroy();
            }
        }
        // Also delete marks if there are some
        //DEVnote: Removed because it removes circle elements from datasets
//        let cMarks = this.stage.find("Circle");
//        if (cMarks.length > 0) {
//            for (let cMark of cMarks)
//                cMark.destroy();
//        }
        let tMarks = this.stage.find("Transformer");
        if (tMarks.length > 0) {
            for (let tMark of tMarks) {
                tMark.destroy();
            }
        }
        delete this.drawns.get(fromName)[id];
        // Delete additions
        let drawns = this.drawnadds.get(fromName + id);
        if (drawns) {
            for (let adddrawn of drawns) {
                adddrawn.destroy();
            }
        }
        this.drawnadds.set(fromName + id, []);
        // Delete child draws
//        for(let curChild of drawn.attrs.swac_childs) {
//            if(!curChild)
//                continue;
//            let curSet = curChild.attrs.swac_set;
//            this.afterRemoveSet(curSet.swac_fromName,curSet.id);
//        }
        drawn.destroy();
        //Do not remove drawn from this.drawns here. Childs may be needet later
        this.layer.draw();

        // If plugins allready loaded call redraw function on each
        if (redraw && this.getLoadedPlugins) {
            for (let curPlugin of this.getLoadedPlugins().values()) {
                if (curPlugin.swac_comp.afterRemoveSet)
                    curPlugin.swac_comp.afterRemoveSet(fromName, id);
                if (curPlugin.swac_comp.redraw)
                    curPlugin.swac_comp.redraw();
            }
    }
    }

    /**
     * Gets the drawn of the parent set
     *
     * @param {WatchableSet} set Childset where to get the parentdrawn for
     * @returns {KonvaObject} Parents drawn object, contains notdrawn=true if not drawn yet. null if there is no parent
     */
    getParentDrawn(set) {
        if (typeof set[this.options.parentIdAttr] === 'undefined') {
            Msg.warn('Visualmodel', 'Set >' + set.swac_fromName + '[' + set.id + '] has no >' + this.options.parentIdAttr + '< so there cant be a parentDrawn');
            return null;
        }
        // Get parent information
        let parent_fromname = set.swac_fromName;
        if (this.options.mainSource) {
            parent_fromname = this.options.mainSource;
        }
        let parent_id;
        if (isNaN(set[this.options.parentIdAttr])) {
            parent_fromname = Model.getFromnameFromReference(set[this.options.parentIdAttr]);
            parent_id = Model.getIdFromReference(set[this.options.parentIdAttr]);
        } else {
            parent_id = set[this.options.parentIdAttr];
        }

        // Check if parent exists in draw storeage
        let parentsStore = this.drawns.get(parent_fromname);
        if (parentsStore) {
            if (parentsStore[parent_id]) {
                return parentsStore[parent_id];
            } else {
                Msg.warn('Visualmodel', 'Drawn for >' + parent_fromname + '[' + parent_id + ']< not found.');
            }
        } else {
            Msg.warn('Visualmodel',
                    'Could not find parent storage >' + parent_fromname + '<',
                    this.requestor);
        }
        // Return not drawn information
        return {
            notdrawn: true,
            fromname: parent_fromname,
            id: parent_id
        };
    }

    /**
     * Moves an element
     *
     * @param {KonvaObject} visuelem Element to move
     * @returns {undefined}
     */
    moveElement(visuelem, defaults) {
        // Update relative position
        if (visuelem.attrs.swac_parent) {
            visuelem.swac_rel_x = visuelem.attrs.x - visuelem.attrs.swac_parent.attrs.x;
            visuelem.swac_rel_y = visuelem.attrs.y - visuelem.attrs.swac_parent.attrs.y;
        }

        this.moveLabelsAndCons(visuelem, defaults);

        // Move childs along
        this.moveChilds(visuelem, defaults);
    }

    /**
     * Positions the child visuelems in relation to their parent visuelem
     *
     * @param {Object} visuelem Visualisation element which childs should be moved
     * @returns {undefined}
     */
    moveChilds(visuelem, defaults) {
        for (let curChild of visuelem.attrs.swac_childs) {
            // Move child
            curChild.position({
                x: visuelem.attrs.x + curChild.swac_rel_x,
                y: visuelem.attrs.y + curChild.swac_rel_y
            });
            this.moveLabelsAndCons(curChild, defaults);
            this.moveChilds(curChild, defaults);
        }
    }

    /**
     * Move labels and connections with the given element
     */
    moveLabelsAndCons(visuelem, defaults) {
        let set = visuelem.attrs.swac_set;
        // Get dragmode
        let dragmode = set.dragmode ? set.dragmode : defaults.dragmode;

        // Move labels along
        for (let curLabel of visuelem.attrs.swac_labels) {
            if (dragmode === 'horizontal') {
                curLabel.x(visuelem.attrs.x + curLabel.attrs.xoffset);
            } else if (dragmode === 'vertical') {
                curLabel.y(visuelem.attrs.y + curLabel.attrs.yoffset);
            } else {
                curLabel.position({
                    x: visuelem.attrs.x + curLabel.attrs.xoffset,
                    y: visuelem.attrs.y + curLabel.attrs.yoffset
                });
            }
        }
        // Move connections
        for (let curDrawn of visuelem.attrs.swac_connections) {
            let curset = curDrawn.attrs.swac_set;
            // Change line points by reusing drawed line object
            this.drawSetAsConnection(curset, null, curDrawn);
        }
    }

    /****************************
     * LEGEND FUNCTIONS
     ****************************/

    /**
     * Creates the legend
     */
    createLegend() {
        if (this.options.legendMap && this.options.legendMap.size > 0) {
            let dlElem = this.requestor.querySelector('.swac_visualmodel_legend dl');
            let dtTpl = dlElem.querySelector('.swac_visualmodel_legenddt');
            let ddTpl = dlElem.querySelector('.swac_visualmodel_legenddd');
            for (let [curDd, curDt] of this.options.legendMap) {
                let newDt = dtTpl.cloneNode();
                newDt.innerHTML = curDt;
                dlElem.appendChild(newDt);
                let newDd = ddTpl.cloneNode();
                newDd.innerHTML = curDd;
                dlElem.appendChild(newDd);
            }
        } else {
            // Remove empty legend
            let dlElem = this.requestor.querySelector('.swac_visualmodel_legend');
            dlElem.remove();
        }
    }

    /****************************
     * SCENE GRAPH FUNCTIONS
     ****************************/

    /**
     * Draws th scene graph
     */
    drawSceneGraph() {
        if (this.options.excludeFromScenegraph) {
            let repeateds = this.requestor.querySelectorAll('.swac_repeatedForSet');
            for (let curAttr in this.options.excludeFromScenegraph) {
                for (let curRepeated of repeateds) {
                    if (curRepeated.swac_dataset[curAttr] === this.options.excludeFromScenegraph[curAttr]) {
                        curRepeated.remove();
                    }
                }
            }
        }
        let sgElem = this.requestor.querySelector('.swac_visualmodel_scenegraph');
        let aElems = sgElem.querySelectorAll('a[swac_id]');
        // Add highlight functions
        for (let curAElem of aElems) {
            curAElem.addEventListener('click', this.onClickScenegraphElem.bind(this));
        }
        // Add menue toggle functions
        let cElems = sgElem.querySelectorAll('.swac_visualmodel_ulhidden a[uk-icon]');
        for (let curCElem of cElems) {
            curCElem.addEventListener('click', this.onClickScenegraphToggle.bind(this));
        }
    }

    /**
     * Function that should be executed, when a element within scene graph is
     * clicked. Selectes the visual element on screen and animates its positon
     * so it can be found easyly.
     *
     * @param {DOMEvent} evt Event calling the function
     * @returns {undefined}
     */
    onClickScenegraphElem(evt) {
        evt.preventDefault();
        // Unselect previous selected
        let tMarks = this.stage.find("Transformer");
        if (tMarks.length > 0) {
            for (let tMark of tMarks) {
                tMark.destroy();
            }
        }

        // Reset marker interval
        if (this.markerinterval) {
            window.clearInterval(this.markerinterval);
            this.markerinterval = null;
        }
        // Get element with swac_id
        let idElem = evt.target;
        while (idElem.parentNode) {
            if (idElem.hasAttribute('swac_setid')) {
                break;
            }
            idElem = idElem.parentNode;
        }
        let id = idElem.getAttribute('swac_setid');
        let setname = idElem.getAttribute('swac_fromname');
        let visuelem = this.stage.findOne('#' + setname + '_' + id);
        if (this.markedelement == visuelem) {
            // Simply end animation
            this.markedelement = null;
            return;
        } else {
            this.markedelement = visuelem;
        }

        var tween;
        if (tween) {
            tween.destroy();
        }

        tween = new Konva.Tween({
            node: visuelem,
            duration: 2,
            scaleX: 1.5,
            scaleY: 1.5,
            easing: Konva.Easings.ElasticEaseOut,
        });
        // Direct animation
        tween.play();
        setTimeout(function () {
            tween.reverse();
        }, 1000);
        // Repeating timed animation
        this.markerinterval = setInterval(function () {
            tween.play();
            setTimeout(function () {
                tween.reverse();
            }, 1000);
        }, 3000);
        // Stop animation on click onto stage
        let thisRef = this;
        this.stage.on("click", function () {
            if (thisRef.markerinterval) {
                window.clearInterval(thisRef.markerinterval);
                thisRef.markerinterval = null;
            }
        });
    }

    /**
     * Executed when a user clicks on the toggle button in front of a scenegraph element
     *
     * @param {DOMEvent} evt Event of the calling action
     */
    onClickScenegraphToggle(evt) {
        evt.preventDefault();

        // Get element with swac_id
        let idElem = evt.target;
        while (idElem.parentNode) {
            if (idElem.hasAttribute('swac_setid')) {
                break;
            }
            idElem = idElem.parentNode;
        }
        // Toggle visibility
        if (idElem.classList.contains('swac_visualmodel_ulhidden'))
            idElem.classList.remove('swac_visualmodel_ulhidden');
        else
            idElem.classList.add('swac_visualmodel_ulhidden');
        // Toggle symbol
        let sElem = idElem.querySelector('span a[uk-icon]');
        if (sElem.getAttribute('uk-icon').includes('icon: plus;')) {
            sElem.setAttribute('uk-icon', 'icon: minus; ratio: 0.5');
        } else {
            sElem.setAttribute('uk-icon', 'icon: plus; ratio: 0.5');
        }
    }
}