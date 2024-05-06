import SWAC from '../../../../swac.js';
import Msg from '../../../../Msg.js';
import Plugin from '../../../../Plugin.js'

export default class VisucreatorSPL extends Plugin {
    constructor(pluginconf) {
        super(pluginconf);
        this.name = 'Visualmodel/plugins/Visucreator';
        this.desc.templates[0] = {
            name: 'visucreator',
            desc: 'Default template for show export buttons'
        };

        // Internal attributes
        this.stage = null;
        this.layer = null;
        this.strings = 1;
    }

    init() {
        return new Promise((resolve, reject) => {
            // Get stage from  requestors component
            this.stage = this.requestor.parent.swac_comp.stage;
            this.layer = this.requestor.parent.swac_comp.layer;
            // Register event handling
            // ... for on stage actions
            this.stage.on("click", this.onFocusElem.bind(this));
            // ... for key press events
            //this.stage.on("click", this.onDragstart.bind(this));
            document.addEventListener('keydown', this.onKeyPress.bind(this));
            // .. for buttons
            let clearBtn = this.requestor.parent.querySelector('.swac_visualmodel_clear');
            clearBtn.addEventListener('click', this.onClear.bind(this));

            let removeBtn = this.requestor.parent.querySelector('.swac_visualmodel_removeelem');
            removeBtn.addEventListener('click', this.onRemoveElem.bind(this));

            let addElemBtn = this.requestor.parent.querySelector('.swac_visualmodel_addelem');
            addElemBtn.addEventListener('click', this.onAddElem.bind(this));

            let copyElemBtn = this.requestor.parent.querySelector('.swac_visualmodel_copyelem');
            copyElemBtn.addEventListener('click', this.onCopyElem.bind(this));

            let addConnectorBtn = this.requestor.parent.querySelector('.swac_visualmodel_addcon');
            addConnectorBtn.addEventListener('click', this.onAddCon.bind(this));
           
            resolve();
        });
    }

    /*************************
     * BUTTON EVENT HANDLER
     *************************/
    /**
     * Removes all visualisation from stage and the visualisatio data from storage
     * 
     * @returns {undefined}
     */
    onClear() {
        let drawings = this.stage.find("Circle");
        drawings.push(...this.stage.find("Rect"));
        drawings.push(...this.stage.find("Transformer"));
        drawings.push(...this.stage.find("Text"));
        drawings.push(...this.stage.find("Arrow"));
        drawings.push(...this.stage.find("Label"));
        for (let curDrawing of drawings) {
            curDrawing.destroy();
        }
        this.requestor.parent.swac_comp.removeAllData();
    }

    /**
     * Removes the selected visualisation element
     * 
     * @returns {undefined}
     */
    onRemoveElem() {
        // Check if an element is selected
        if (!this.visuelemFocus) {
            UIkit.modal.alert(SWAC.lang.dict.Visualmodel_Visucreator.removeelem_nonsel);
            return;
        }

        // Remove the set the element belongs to (also removes the visualisation,
        // this functionality is in the main component)
        let fromName = this.visuelemFocus.attrs.swac_set.swac_fromName;
        let id = this.visuelemFocus.attrs.swac_set.id;
        this.requestor.parent.swac_comp.removeSets(fromName, id);
    }

    /**
     * Adds an element to the visualmodel
     * 
     * @returns {undefined}
     */
    onAddElem() {
        // Create new dataset
        let newset = {
            name: SWAC.lang.dict.Visualmodel_Visucreator.addedelem
        };

        // Check if an element is selected
        if (this.visuelemFocus) {
            // Get set of the focused element
            let fromName = this.visuelemFocus.attrs.swac_fromName;
            let id = this.visuelemFocus.attrs.swac_set.id;
            newset.parent = 'ref://' + fromName + '/' + id;
            // Position at parent element plus margin
            newset.x = this.visuelemFocus.attrs.x + 10;
            newset.y = this.visuelemFocus.attrs.y + 10;
        }
        // Add the set to first datasource, visualisation will be created by the main component
        //TODO remove mainSource param after deprecation resolved
        let mainSource = this.requestor.parent.swac_comp.getMainSourceName();
        this.requestor.parent.swac_comp.addSet(mainSource, newset);
    }

    /**
     * Executed when the element was copied
     */
    onCopyElem() {
        // Check if an element is selected
        if (!this.visuelemFocus) {
            UIkit.modal.alert(SWAC.lang.dict.Visualmodel_Visucreator.copyelem_nonsel);
            return;
        }

        // Copy definition dataset
        let newset = Object.assign({}, this.visuelemFocus.attrs.swac_set);
        console.log("newset.id " + newset.id)
        delete newset.id;
        newset.name = newset.name + '(' + SWAC.lang.dict.Visualmodel_Visucreator.copytitle + ')';
        

        // Add the set to first datasource, visualisation will be created by the main component
        this.requestor.parent.swac_comp.addSet(this.visuelemFocus.attrs.swac_fromName, newset);
    }

    /**
     * Executed when a new connection was added
     */
    onAddCon() {
        // Check if an element is selected
        if (!this.visuelemFocus) {
            UIkit.modal.alert(SWAC.lang.dict.Visualmodel_Visucreator.addcon_nonsel);
            return;
        }

        let part1Id = this.visuelemFocus.attrs.swac_set.id;

        // Add event listener
        let thisRef = this;
        this.stage.on("click.createcon", function (evt) {
            let part2Id = thisRef.visuelemFocus.attrs.swac_set.id;
            let con = {
                type: 'con',
                part1: part1Id,
                part2: part2Id
            };
            thisRef.requestor.swac_comp.addSet(thisRef.visuelemFocus.attrs.swac_fromName, con);
            thisRef.stage.off("click.createcon");
        });

        // Inform user
        UIkit.modal.alert(SWAC.lang.dict.Visualmodel_Visucreator.addcon_selpart2);
    }

     /**
     * Draw an area to add multiple elements
     */
     onAddArea() {
        //this.stage.opacity(0.5);
        //Attribute für die Strings
        var zeilen = 1;
        var spalten;
        var anzahl;
        
        //Attribute für die bordercolor
        var myHex;
        var umwandlungszahl = 1;
        
        let selectionRectangle = new Konva.Rect({
            strokeWidth: 1,
            stroke: 'black',
            visible: false,
        });

        this.layer.add(selectionRectangle);
       
       //Variablen für das SelectionRectangle
        let x1, y1, x2, y2;
        this.stage.on('mousedown', (e) => {
        console.log("Das ist dass Objekt von MIR "+e.x);
        this.stage.draggable(false);
            // do nothing if we mousedown on any shape
           //e.evt.preventDefault();
//            x1 = e.x;
//            y1 = (e.y);
            x1 = this.stage.getRelativePointerPosition().x;
            y1 = (this.stage.getRelativePointerPosition().y-20);       
//              x2 = this.stage.getRelativePointerPosition().x;
//            y2 = this.stage.getRelativePointerPosition().y;

            selectionRectangle.visible(true);
            selectionRectangle.width(0);
            selectionRectangle.height(0);
        });

        this.stage.on('mousemove', (e) => {
            if (!selectionRectangle.visible()) {
                return;
            }
            
            //e.evt.preventDefault();
//            x2 = e.y;
//            y2 = (e.y);
            //console.log("y2 "+ y2+ "und y1 "+y1)
            x2 = this.stage.getRelativePointerPosition().x;
            y2 = (this.stage.getRelativePointerPosition().y-20);

            selectionRectangle.setAttrs({
                x: Math.min(x1, x2),
                y: Math.min(y1, y2),
                width: Math.abs(x2 - x1),
                height: (Math.abs(y2 - y1)),
            });
        });

        this.stage.on('mouseup', (e) => {
            console.log("Der E Wert ist " +e.x);
           console.log(" MOUSE UP y2 "+ y2+ "und y1 "+y1)
//            var eingabe;
//            UIkit.modal.prompt('Modul anzahl angeben:', eingabe);
//            console.log("Ihre Konsoleneingabe "+eingabe);
//            
//            
            // Initial Element erzeugen
            let newSet = {
                id: this.strings,
                name: "String " +this.strings,
                width: selectionRectangle.getClientRect().width,
                height: selectionRectangle.getClientRect().height,
                x: selectionRectangle.getClientRect().x,
                y: selectionRectangle.getClientRect().y
            }
            this.requestor.parent.swac_comp.addSet(null, newSet);

//            UIkit.modal.prompt('Modul anzahl angeben:', eingabe, function(eingabe){
//            console.log("Ihre Konsoleneingabe "+eingabe);
//            });
            
            //Zeilen- und Spaltenabfrage der Strings
            zeilen = prompt("Bitte die Anzahl an Zeilen eingeben", "");
            spalten = prompt("Bitte die Anzahl an Spalten eingeben", "");
            
            console.log("Zeilen " + zeilen)
            console.log("Spalten " + spalten)

            // Abfrage wie viele Elemente
            //let amount = 8;  // wie fragen wir das ab?
//            let rectX = selectionRectangle.getClientRect().x
//            let rectY = selectionRectangle.getClientRect().y
//            let rectWidth = selectionRectangle.getClientRect().width
//            let rectHeight = selectionRectangle.getClientRect().height
//            console.log("X-Koordinate" + rectX);
//            console.log("Y-Koordinate" + rectY);
//            console.log("rectWidth" + rectWidth);
//            console.log("rectHeight" + rectHeight);


            umwandlungszahl = this.strings*1000;
            console.log(umwandlungszahl)
            myHex = umwandlungszahl.toString(16);
            anzahl = zeilen*spalten;
            console.log("Anzahl " + anzahl)
            var anzahlModule;
            var modulbreite = (selectionRectangle.getClientRect().width) / anzahl;
            //Erstellen der einzelnen Panele im String
            if (zeilen <= 1) {
                for (anzahlModule = 0; anzahlModule < anzahl; anzahlModule++) {
                       console.log("Meine Hexer Zahl "+myHex);
                       console.log("Meine Anzahl: "+anzahl)
                    console.log(anzahlModule)
                    let newPanel = {
                        parent: (newSet.id),
                        bordercolor: '#'+myHex,
                        name:  "1-" +this.strings+"-" + anzahlModule,
                        width: (selectionRectangle.getClientRect().width) / anzahl,
                        height: (selectionRectangle.getClientRect().height-20),
                        x: (selectionRectangle.getClientRect().x + anzahlModule * modulbreite),
                        y: selectionRectangle.getClientRect().y+20
                    }
                    console.log("Element " + zeilenzaehler + spaltenzaehler + " die Weite " + (selectionRectangle.getClientRect().width) + " die Höhe " + ((selectionRectangle.getClientRect().width) / spalten));
                    this.requestor.parent.swac_comp.addSet(null, newPanel);
                }
            } else {


                var modulbreite = (selectionRectangle.getClientRect().width) / spalten;
                var modulhoehe = (selectionRectangle.getClientRect().height) / zeilen;
                   anzahlModule = 0;
                for (var zeilenzaehler = 0; zeilenzaehler < zeilen; zeilenzaehler++) {
                    for (var spaltenzaehler = 0; spaltenzaehler < spalten; spaltenzaehler++) {
                        anzahlModule++
                        console.log("Meine Hexer Zahl "+myHex);
                        console.log(anzahlModule);
                        let newPanel = {
                            id: (newSet.id*100+anzahlModule),
                            parent: newSet.id,
                            bordercolor: '#'+myHex,
                            name: "1-"+this.strings+"-" + anzahlModule,//Nr - String- Modulnr
                            width: (selectionRectangle.getClientRect().width) / spalten,
                            height: (selectionRectangle.getClientRect().height-20) / zeilen,
                            x: (selectionRectangle.getClientRect().x + spaltenzaehler * modulbreite),
                            y: (selectionRectangle.getClientRect().y +20+ zeilenzaehler * modulhoehe)
                        }
                        
                        this.requestor.parent.swac_comp.addSet(null, newPanel);
                    }
                }
            }
            this.strings++

            this.stage.draggable(true);
            selectionRectangle.destroy();
            
            this.stage.off('mouseup');

        });
        
        return;
    }

    /**
     * Listen for specfic keys
     */
    onKeyPress(e) {
        if (e.keyCode === 46) {  // Delete
            this.onRemoveElem();
        } else {
            return;
        }
    
                    

    }

    /**
     * Listen for specfic keys
     */
    onKeyPress(e) {
        if (e.keyCode === 46) {  // Delete
            this.onRemoveElem();
        } else {
            return;
        }
    }

    /**
     * Focus a visual element
     * 
     * @param {DOMEvent} evt Event that calls the focus
     * @returns {undefined}
     */
    onFocusElem(evt) {
        // Remove old marks
        let cMarks = this.stage.find("Circle");
        if (cMarks.length > 0) {
            for (let cMark of cMarks)
                cMark.destroy();
        }
        let tMarks = this.stage.find("Transformer");
        if (tMarks.length > 0) {
            for (let tMark of tMarks) {
                tMark.destroy();
            }
        }
        if (evt.target.className === "Rect") {
            // Mark visuelem with fous
            this.visuelemFocus = evt.target;
            // Add drag listener
            evt.target.on('dragend', this.onDragend.bind(this));
            // Make visuelem transformable
            var tr = new Konva.Transformer();
            tr.rotateEnabled(true);
            this.layer.add(tr);
            tr.nodes([evt.target]);
            // Add on change listener
            tr.on('transformend', this.onTransformend.bind(this));
            // Deactivate stage drag
            this.stage.draggable(false);
            this.layer.draw();
        } else if (evt.target.constructor.name === "Arrow") {
            this.visuelemFocus = evt.target;
            let offsetx = evt.target.attrs.x;
            let offsety = evt.target.attrs.y;
            for (i = 0; i < evt.target.attrs.points.length; i = i + 2) {
                let circle = new Konva.Circle({
                    index: i,
                    x: evt.target.attrs.points[i] + offsetx,
                    y: evt.target.attrs.points[i + 1] + offsety,
                    radius: 10,
                    fill: "blue",
                    stroke: "black",
                    strokeWidth: 4,
                    draggable: true
                });
                circle.moveToTop();
                circle.on("dragmove", function () {
                    evt.target.attrs.points[circle.attrs.index] = circle.attrs.x - offsetx;
                    evt.target.attrs.points[circle.attrs.index + 1] =
                            circle.attrs.y - offsety;
                    evt.target.attrs.tooltip.attrs.updatePosition();
                    this.stage.find("Circle").moveToTop();
                    this.stage.batchDraw();
                });
                circle.on("mouseenter", function (e) {
                    if (e.target === circle) {
                        this.stage.draggable(false);
                    }
                });
                circle.on("mouseleave", function (e) {
                    if (e.target === circle) {
                        if (this.focusObject === null) {
                            this.stage.draggable(true);
                        }
                    }
                });
                this.layer.add(circle);
                this.stage.add(this.layer);
                this.layer.draw();
            }
        } else {
            this.layer.draw();
            this.visuelemFocus = null;
            this.stage.draggable(true);
        }
    }

    /**
     * Function to create a device on the canvas
     * @param  device        Object with the necessary data.
     */
    createDevice(device) {
        let ret = false;
        this.o_devices.forEach(function (item, index) {
            if (item.id === device.id) {
                ret = true;
                return true;
            }
        });
        if (ret === true) {
            this.onFocus({target: this.devices[device.id]});
            return;
        }
    }

    /**
     * Function to create multiple rectangles on the canvas
     * @param  x        x coordinate of area.
     * @param  y        y coordinate of area.
     * @param  width    width of parent rectangle(area).
     * @param  height   height of parent rectangle (area).
     * @param  amount   amount of rectangles in area.
     */
    createMultipleRectInArea(x, y, width, height, amount) {

    }

    /**
     * Function to create multiple devices on the canvas
     * @param  devices        Array of objects with the necessary data.
     */
    createDevices(devices) {
        devices.forEach(function (item, index) {
            this.createDevice(item);
        });
    }

    /**
     * Function to create multiple relations on the canvas
     * @param  relations        Array of objects with the necessary data.
     */
    createRelations(relations) {
        relations.forEach(function (item, index) {
            this.createRelation(item);
        });
    }

    /**
     * Function to create multiple devices and relations on the Canvas
     * @param  all        Array of objects with the necessary data.
     */
    createVisualmodel(all) {
        this.clear();
        this.resetZoom();
        this.createDevices(all[0]);
        this.createRelations(all[1]);
    }

    /**
     * Function to create a Relation on the Canvas
     * @param  relation      Object with the necessary data.
     */
    createRelation(relation) {
        let ret = false;
        let de = false;
        this.o_relations.forEach(function (item, index) {
            if (item.id === relation.id) {
                ret = true;
                return;
            }
        });
        if (ret === true) {
            this.onFocus({
                target: this.relations[relation.id]
            });
            return;
        }
        let pointersize = 10;
        let both = false;
        let line = [1];
        if (relation.type === "solid") {
            pointersize = 0;
        } else if (relation.type === "doublesolid") {
            both = true;
        } else if (relation.type === "arrowsolid") {
        } else if (relation.type === "dotted") {
            line = [5, 5];
            de = true;
            pointersize = 0;
        } else if (relation.type === "arrowdotted") {
            line = [5, 5];
            de = true;
        } else if (relation.type === "doubledotted") {
            line = [5, 5];
            de = true;
            both = true;
        }
        var labl = new Konva.Text({
            text:
                    typeof relation.description !== "undefined" ? relation.description : "",
            fontFamily: "Calibri",
            fontSize: 18,
            padding: 5,
            fill: "white"
        });

        var arrow = new Konva.Arrow({
            r_id: relation.id,
            x: 0,
            y: 0,
            points:
                    typeof relation.nodes !== "undefined"
                    ? toArray(relation.nodes.list)
                    : [100, 100, 200, 100],
            pointerLength: pointersize,
            pointerWidth: pointersize,
            pointerAtBeginning: both,
            fill: "black",
            stroke: "black",
            dash: line,
            dashEnabled: de,
            strokeWidth: 6,
            text: labl,
            draggable: true,
            addJunction: function () {
                let len = this.points.length;
                this.points[len] = this.points[len - 2];
                this.points[len + 1] = this.points[len - 1];
                this.onFocus({target: arrow});
                this.stage.batchDraw();
            },
            deleteJunction: function () {
                let len = this.points.length;
                if (len > 4) {
                    this.points.splice(len - 2, 2);
                    this.onFocus({target: arrow});
                    this.stage.batchDraw();
                }
            }
        });
        arrow.on("mouseenter", function (e) {
            if (e.target === arrow) {
                this.stage.draggable(false);
            }
        });
        arrow.on("mouseleave", function (e) {
            if (e.target === arrow) {
                if (this.focusObject === null) {
                    this.stage.draggable(true);
                }
            }
        });
        var tooltip = new Konva.Label({
            x: 170,
            y: 75,
            opacity: 0.75,
            updatePosition: function () {
                let len = 0;
                let halflen = 0;
                let distances = [];
                for (i = 0; i < arrow.attrs.points.length - 2; i += 2) {
                    let dis = Math.sqrt(
                            Math.pow(arrow.attrs.points[i + 2] - arrow.attrs.points[i], 2) +
                            Math.pow(arrow.attrs.points[i + 3] - arrow.attrs.points[i + 1], 2)
                            );
                    distances.push(dis);
                    len += dis;
                }
                halflen = len / 2;
                let count = 0;
                let find;
                for (i = 0; i < distances.length; i++) {
                    if (count + distances[i] >= halflen) {
                        find = i;
                        break;
                    }
                    count += distances[i];
                }
                let remain = halflen - count;
                let offset = find + find;
                let ratio = remain / distances[find];
                let xnew =
                        arrow.attrs.x +
                        (arrow.attrs.points[offset + 2] - arrow.attrs.points[offset]) * ratio +
                        arrow.attrs.points[offset];
                let ynew =
                        arrow.attrs.y +
                        (arrow.attrs.points[offset + 3] - arrow.attrs.points[offset + 1]) *
                        ratio +
                        arrow.attrs.points[offset + 1];
                tooltip.position({
                    x: xnew,
                    y: ynew
                });
                if (labl.attrs.text === "") {
                    tooltip.hide();
                } else {
                    tooltip.show();
                }
                arrow.moveToTop();
                tooltip.moveToTop();
                this.stage.batchDraw();
            }
        });
        arrow.attrs.tooltip = tooltip;
        tooltip.add(
                new Konva.Tag({
                    fill: "black",
                    pointerDirection: "down",
                    pointerWidth: 10,
                    pointerHeight: 10,
                    lineJoin: "round",
                    shadowColor: "black",
                    shadowBlur: 10,
                    shadowOffsetX: 10,
                    shadowOffsetY: 10,
                    shadowOpacity: 0.5
                })
                );
        tooltip.add(labl);
        arrow.on("click", function () {
            arrow.attrs.tooltip.attrs.updatePosition();
        });
        arrow.on("dragmove", function () {
            arrow.attrs.tooltip.attrs.updatePosition();
            this.onFocus({target: arrow});
        });
        arrow.attrs.tooltip.attrs.updatePosition();
        this.o_relations[relation.id] = relation;
        this.relations[relation.id] = arrow;
        this.layer.add(arrow);
        this.layer.add(tooltip);
        this.stage.add(this.layer);
        this.layer.draw();
    }
    /**
     * Function to destroy an object
     */
    destroyObject() {
        if (this.visuelemFocus !== null) {
            if (this.visuelemFocus.constructor.name === "Rect") {
                this.o_devices[this.visuelemFocus.attrs.d_id] =
                        "undefined";
                this.devices[this.visuelemFocus.attrs.d_id] =
                        "undefined";
                this.visuelemFocus.attrs.text.destroy();
                this.visuelemFocus.destroy();
                this.visuelemFocus = null;
                this.stage.find("Transformer").destroy();
                this.stage.batchDraw();
            } else if (this.visuelemFocus.constructor.name === "Arrow") {
                this.o_relations[this.visuelemFocus.attrs.r_id] =
                        "undefined";
                this.relations[this.visuelemFocus.attrs.r_id] =
                        "undefined";
                this.visuelemFocus.attrs.tooltip.destroy();
                this.stage.find("Circle").destroy();
                this.visuelemFocus.destroy();
                this.visuelemFocus = null;
                this.stage.batchDraw();
            }
        }
    }

    /**
     * Updates the dataset if the drawing was transformed
     * 
     * @param {KonvaEvent} evt Event from the konva transform
     */
    onTransformend(evt) {
        // Get set
        let set = evt.target.attrs.swac_set;
        // Update positioning values
        set.rotation = evt.target.attrs.rotation;
        set.x = evt.target.attrs.x;
        set.y = evt.target.attrs.y;
        // Recalculate height
        if (evt.target.attrs.scaleY > 1.01 || evt.target.attrs.scaleY < 0.99) {
            set.height = evt.target.attrs.height * evt.target.attrs.scaleY;
        }
        // Recalculate width
        if (evt.target.attrs.scaleX > 1.01 || evt.target.attrs.scaleX < 0.99)
            set.width = evt.target.attrs.width * evt.target.attrs.scaleX;
    }

    /**
     * Called when the user has dragged an element
     * 
     * @param {KonvaEvent} evt Event from the konva transform
     */
    onDragend(evt) {
        // Get set
        let set = evt.target.attrs.swac_set;
        // Update positioning values
        set.x = evt.target.attrs.x;
        set.y = evt.target.attrs.y;
    }

    /*********
     * Experimental section
     */

    onKeydown(e) {
        // Delete
        if (e.keyCode === 46) {
            this.destroyObject();
            // e for edit
        } else if (e.keyCode === 69) {
            if (this.visuelemFocus.constructor.name === "Arrow") {
                var tex = prompt("Please enter new Lable:");
                this.visuelemFocus.attrs.text.text(tex);
                this.visuelemFocus.attrs.tooltip.attrs.updatePosition();
                this.stage.batchDraw();
            }
            // + and Numpad +
        } else if (e.keyCode === 107 || e.keyCode === 171 || e.keyCode === 187) {
            if (this.visuelemFocus.constructor.name === "Arrow") {
                this.visuelemFocus.attrs.addJunction();
            }
            // - and Numpad -
        } else if (e.keyCode === 109 || e.keyCode === 173 || e.keyCode === 189) {
            if (this.visuelemFocus.constructor.name === "Arrow") {
                this.visuelemFocus.attrs.deleteJunction();
            }
            // Numpad 1
        } else if (e.keyCode === 97) {
            this.changeDeviceColor("black");
            // Numpad 2
        } else if (e.keyCode === 98) {
            this.changeDeviceColor("grey");
            // Numpad 3
        } else if (e.keyCode === 99) {
            this.changeDeviceColor("blue");
            // Numpad 4
        } else if (e.keyCode === 100) {
            this.changeDeviceColor("green");
            // Numpad 5
        } else if (e.keyCode === 101) {
            this.changeDeviceColor("yellow");
            // Numpad 6
        } else if (e.keyCode === 102) {
            this.changeDeviceColor("red");
            // Numpad 7
        } else if (e.keyCode === 103) {
            this.changeDeviceColor("purple");
            // Numpad 8
        } else if (e.keyCode === 104) {
            this.changeDeviceColor("orange");
            // Numpad 9
        } else if (e.keyCode === 105) {
            this.changeDeviceColor("white");
        }
    }

    /**
     * Function to change the color of device that is clicked on)
     * @param  color    color string or color code
     */
    changeDeviceColor(color) {
        if (this.visuelemFocus.constructor.name === "Rect") {
            this.visuelemFocus.fill(color);
            this.stage.batchDraw();
        }
    }

    /**
     * Function to receive an updated array of an array of all devices and an array of all relations
     * @return  An array with the updated devices and relations.
     */
    getVisualmodel() {
        let all = [];
        all[0] = this.getDevices();
        all[1] = this.getRelations();
        return all;
    }

    /**
     * Function to set the visibility of devices by their name
     * @param name      name of the devices
     * @param visible   true if visible, false if hidden
     */
    setVisibilitybyName(name, visible) {
        for (i = 0; i < this.o_devices.length; i++) {
            if (this.o_devices[i] !== "undefined") {
                try {
                    if (this.o_devices[i].name === name) {
                        this.devices[i].visible(visible);
                        this.devices[i].attrs.text.visible(visible);
                        this.onFocus({target: this.stage});
                        this.stage.batchDraw();
                    }
                } catch (e) {
                }
            }
        }
    }

    /**
     * Function to set the visibility of a device by its id
     * @param id      id of the devices
     * @param visible   true if visible, false if hidden
     */
    setVisibilitybyId(id, visible) {
        this.devices[id].visible(visible);
        this.devices[id].attrs.text.visible(visible);
        this.onFocus({target: this.stage});
        this.stage.batchDraw();
    }

    /**
     * Function to set the visibility of all relations
     * @param visible   true if visible, false if hidden
     */
    setVisibilityallRelations(visible) {
        let arr = this.stage.find('Arrow');
        for (i = 0; i < arr.length; i++)
        {
            arr[i].visible(visible);
            if (arr[i].attrs.text.attrs.text === "")
            {
            } else
            {
                arr[i].attrs.tooltip.visible(visible);
            }
        }
        this.onFocus({target: this.stage});
        this.stage.batchDraw();
    }

    /*
     * Function to receive an updated array with all devices
     * @return  An array with the updated devices.
     */
    getDevices() {
        this.o_devices.forEach(function (item, index) {
            if (item !== "undefined") {
                item.xCoordinate = this.devices[index].attrs.x;
                item.yCoordinate = this.devices[index].attrs.y;
                item.width =
                        this.devices[index].attrs.width *
                        this.devices[index].attrs.scaleX;
                item.height =
                        this.devices[index].attrs.height *
                        this.devices[index].attrs.scaleY;
                item.color = this.devices[index].attrs.fill;
            }
        });
        return this.o_devices.filter(word => typeof word !== "undefined");
    }

    /**
     * Function to receive an updated array with all relations
     * @return  An array with the updated relations.
     */
    getRelations() {
        this.o_relations.forEach(function (item, index) {
            if (item !== "undefined") {
                let correctedNodes = [];
                let x = this.relations[index].attrs.x;
                let y = this.relations[index].attrs.y;
                for (
                        i = 0;
                        i < this.relations[index].attrs.points.length;
                        i += 2
                        ) {
                    correctedNodes[i] =
                            this.relations[index].attrs.points[i] + x;
                    correctedNodes[i + 1] =
                            this.relations[index].attrs.points[i + 1] + y;
                }
                let obj = new Object();
                obj.list = correctedNodes;
                item.description = this.relations[index].attrs.text.text();
                item.nodes = JSON.stringify(obj);
            }
        });
        return this.o_relations.filter(
                word => typeof word !== "undefined"
        );
    }

    positioningWires(child) {
        let parent = child.attrs.swac_parent;
        // Calculate addional size
        let childsXPos = 0;
        let childsYPos = this.stage.height() / 2;



    }

    positioningCapsles2(visuelem) {
        // Get childs
        let childsWidth = 0;
        let childsHeight = 0;
        let prevVisuelem;
        for (let curChild of visuelem.attrs.swac_childs) {
            let curVisuelem = this.positioningCaples2(curChild);
            // Note for next sibling
            prevVisuelem = curVisuelem;
        }

        // Return modified visuelem
        return visuelem;
    }

    positioningCapsles(child) {
        let parent = child.attrs.swac_parent;
        // Calculate addional size
        let childsXPos = 0;
        let childsYPos = 0;

        console.log('resize ' + parent.attrs.text.attrs.text + ' for ' + child.attrs.text.attrs.text);

        if (parent.attrs.swac_childs.includes(child)) {
        }
        if (parent.attrs.swac_childs.length > 0) {
            // Get last child
            let lastChild = parent.attrs.swac_childs.slice(-1)[0];
            console.log('== xPos calculation (sibling ' + lastChild.attrs.text.attrs.text + '):');
            // Get lastChilds relative positions
            console.log(lastChild.attrs.text.attrs.text + ' absolute xPos: ' + lastChild.attrs.x);
            console.log('- ' + parent.attrs.text.attrs.text + ' absolute xPos: ' + parent.attrs.x);
            let lastchildsXPos = lastChild.attrs.x - parent.attrs.x;
            console.log('= ' + lastChild.attrs.text.attrs.text + ' relative xPos: ' + lastchildsXPos);
            console.log('+ ' + lastChild.attrs.text.attrs.text + ' left margin: ' + this.options.visuMargin);
            childsXPos = lastchildsXPos + this.options.visuMargin;
            console.log('+ ' + lastChild.attrs.text.attrs.text + ' width: ' + lastChild.attrs.width);
            childsXPos += lastChild.attrs.width;
            console.log('+ ' + lastChild.attrs.text.attrs.text + ' right margin: ' + this.options.visuMargin);
            childsXPos += this.options.visuMargin;
            console.log('= ' + child.attrs.text.attrs.text + ' xPos: ' + childsXPos);

            console.log('== yPos calculation (sibling ' + lastChild.attrs.text.attrs.text + '):');
            console.log(lastChild.attrs.text.attrs.text + ' absolute yPos: ' + lastChild.attrs.y);
            console.log('- ' + parent.attrs.text.attrs.text + ' absolute yPos: ' + parent.attrs.y);
            let lastchildsYPos = lastChild.attrs.y - parent.attrs.y;
            console.log('= ' + lastChild.attrs.text.attrs.text + ' relative yPos: ' + lastchildsYPos);
            childsYPos = lastchildsYPos;
        } else {
            console.log('== xPos calculation (no sibling):');
            console.log(child.attrs.text.attrs.text + ' XPos: 0');
            childsXPos = 0;
            console.log('+ margin left side: ' + this.options.visuMargin);
            childsXPos += this.options.visuMargin;
            console.log('= ' + child.attrs.text.attrs.text + ' xPos: ' + childsXPos);

            console.log('== yPos calculation (no sibling):');
            console.log(child.attrs.text.attrs.text + ' yPos: 0');
            childsYPos = 0;
            console.log('+ margin top side: ' + this.options.visuMargin);
            childsYPos = this.options.visuMargin;

            // Add height of the label plus margin to label
            if (parent.attrs.text) {
                let labelsHeight = parent.attrs.text.textHeight;
                console.log('+ labels height: ' + labelsHeight);
                childsYPos += labelsHeight;
                // Add margin from text
                childsYPos += this.options.visuMargin;
                console.log('+ labels height: ' + this.options.visuMargin);
            }
            console.log('= ' + child.attrs.text.attrs.text + ' yPos: ' + childsYPos);
        }



        console.log('== needed width calculation:');
        console.log(child.attrs.text.attrs.text + ' xPos: ' + childsXPos);
        let parentNeededWidth = childsXPos;
        console.log(' + ' + child.attrs.text.attrs.text + ' margin left: ' + this.options.visuMargin);
        parentNeededWidth += this.options.visuMargin;
        console.log(' + ' + child.attrs.text.attrs.text + ' width: ' + child.attrs.width);
        parentNeededWidth += child.attrs.width;
        console.log(' + ' + child.attrs.text.attrs.text + ' margin right: ' + this.options.visuMargin);
        parentNeededWidth += this.options.visuMargin;
        console.log('= ' + parent.attrs.text.attrs.text + ' needed width: ' + parentNeededWidth);

        console.log('== needed height calculation:');
        console.log(child.attrs.text.attrs.text + ' yPos: ' + childsYPos);
        let parentNeededHeight = childsYPos;
        console.log('+ ' + child.attrs.text.attrs.text + ' height: ' + child.attrs.height);
        parentNeededHeight += child.attrs.height;
        console.log('+ ' + child.attrs.text.attrs.text + ' margin bottom: ' + this.options.visuMargin);
        parentNeededHeight += this.options.visuMargin;
        console.log('= ' + parent.attrs.text.attrs.text + ' neeeded height: ' + parentNeededHeight);

        // Set new parents diemensions
        parent.attrs.width = parentNeededWidth;
        parent.attrs.height = parentNeededHeight;

        // Move child inside parent
        child.attrs.x = parent.attrs.x + childsXPos;
        child.attrs.y = parent.attrs.y + childsYPos;

        // Recursivly resize
        if (parent.attrs.swac_parent) {
            this.positioningCapsles(parent);
        }
    }

    /**
     * Function to create a Relation via an onclick event)
     * @param  type    type of the relation
     */
    spawnRelationHandler(type) {
        let max = 0;
        for (i = 0; i < this.o_relations.length; i++)
        {
            if (typeof this.o_relations[i] !== 'undefined')
            {
                let temp = this.o_relations[i].id;
                if (temp > max)
                {
                    max = temp;
                }
            }
        }
        max++;
        relation = {
            id: max,
            description: "",
            nodes: {list: [30, 30, 200, 30]},
            type: type,
            visualmodel: -1,
            temp: true
        };
        this.createRelation(relation);
    }

    /**
     * Support function to transform a plain Object into a array
     * @param {Object} src  Object that will be converted into an array.
     * @returns {Array} Array created from Object
     */
    toArray(src) {
        if (typeof src === "object") {
            let ret = [];
            for (let prop in src) {
                ret.push(src[prop]);
            }
            return ret;
        }
    }
}