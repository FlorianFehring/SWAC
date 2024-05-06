import SWAC from '../../../../swac.js';
import Msg from '../../../../Msg.js';
import Plugin from '../../../../Plugin.js'

export default class HelplinesSPL extends Plugin {

    constructor(opts = {}) {
        super(opts);
        this.name = 'Visualmodel/plugins/Helplines';
//        this.desc.templates[0] = {
//            name: 'helplines',
//            desc: 'Shows options for helplines',
//        };

        this.desc.opts[0] = {
            name: 'horizontalGridSize',
            desc: 'Horizontal size of a grid element, false to deactivate'
        };
        if (!this.options.horizontalGridSize)
            this.options.horizontalGridSize = 10;

        this.desc.opts[1] = {
            name: 'verticalGridSize',
            desc: 'Vertical size of a grid element, false to deactivate'
        };
        if (!this.options.verticalGridSize)
            this.options.verticalGridSize = 10;

        this.desc.opts[2] = {
            name: 'sizeLineOffset',
            desc: 'Offset for sizeLines'
        };
        if (!this.options.sizeLineOffset)
            this.options.sizeLineOffset = 20;

        this.desc.opts[3] = {
            name: 'sizeLineUnit',
            desc: 'Unit for sizeLines'
        };
        if (!this.options.sizeLineUnit)
            this.options.sizeLineUnit = '';

        this.desc.opts[4] = {
            name: 'sizeLineUnitFactor',
            desc: 'Factor with that the size in pixel is multiplied for unit display'
        };
        if (!this.options.sizeLineUnitFactor)
            this.options.sizeLineUnitFactor = 1;

        this.desc.opts[5] = {
            name: 'sizeLineMode',
            desc: 'Mode for size line drawing (parents, childs, booth)'
        };
        if (!this.options.sizeLineMode)
            this.options.sizeLineMode = 'booth';

        this.desc.opts[6] = {
            name: 'differenceLineMode',
            desc: 'Mode for differnece line calculation (border, middle)'
        };
        if (!this.options.differenceLineMode)
            this.options.differenceLineMode = 'middle';

        this.desc.opts[7] = {
            name: 'minWidthDraw',
            desc: 'Minimum width an element must have to draw helplines for'
        };
        if (!this.options.minWidthDraw)
            this.options.minWidthDraw = 0;

        this.desc.opts[8] = {
            name: 'fontSize',
            desc: 'Font size for helpline labels'
        };
        if (!this.options.fontSize)
            this.options.fontSize = 8;

        // Internal attributes
        this.stage = null;
        this.layer = null;
        this.sizelines = new Map();
    }

    init() {
        return new Promise((resolve, reject) => {
            // Get stage from  requestors component
            this.stage = this.requestor.parent.swac_comp.stage;
            this.layer = new Konva.Layer();
            this.stage.add(this.layer);

            this.draw();
            resolve();
        });
    }

    redraw() {
        this.draw();
    }

    draw() {
        let comp = this.requestor.parent.swac_comp;
        Msg.flow('HelplinesSPL', 'Draw helplines', this.requestor.parent);
        // Initial handling
        for (let curSource in comp.data) {
            if (comp.drawns.get(curSource)) {
                for (let curDrawn of comp.drawns.get(curSource)) {
                    if (!curDrawn)
                        continue;
                    // Draw sizeLine only for parents
                    this.drawSizeLines(curDrawn);
                    // Register event handler for on change
                    let thisRef = this;
                    curDrawn.on('dragend', function (evt) {
                        thisRef.drawSizeLines(evt.target);
                    });
                }
            }
        }
    }

    /**
     * Draws size lines
     * 
     * @param {Konva.Object} visuelem Element to draw size lines for
     * @returns {undefined}
     */
    drawSizeLines(visuelem) {
        Msg.flow('HelplinesSPL', 'drawSizeLines() for >' + visuelem.attrs.id + '<', this.requestor.parent);
        let comp = this.requestor.parent.swac_comp;
        // Get parent defaults
        let defaults;
        if (comp.options.attributeDefaults.has(visuelem.attrs.swac_set.swac_fromName)) {
            defaults = comp.options.attributeDefaults.get(visuelem.attrs.swac_set.swac_fromName);
        } else {
            defaults = comp.options.attributeDefaults.get('VisualmodelGeneral');
            defaults.widthAttr = 'width';
        }

        // Get number of parents
        let maxNoOfDescendants = this.getMaxNoOfDescendants(visuelem);
        // Create line for element
        if (visuelem.attrs.swac_childs.length > 0 && (this.options.sizeLineMode === 'parents' || this.options.sizeLineMode === 'booth')) {
            let sp_x = visuelem.attrs.x;
            let sp_y = visuelem.attrs.y + visuelem.attrs.height + maxNoOfDescendants * this.options.sizeLineOffset;
            let ep_x = visuelem.attrs.x + visuelem.attrs.width;
            let ep_y = visuelem.attrs.y + visuelem.attrs.height + maxNoOfDescendants * this.options.sizeLineOffset;
            Msg.info('HelplinesSPL', 'Draw element sizeline for >' + visuelem.attrs.id + '< from ' + sp_x + '/' + sp_y + ' to ' + ep_x + '/' + ep_y, this.requestor.parent);
            let label = visuelem.attrs.swac_set[defaults.widthAttr] + ' ' + this.options.sizeLineUnit;
            this.drawSizeLine(sp_x, sp_y, ep_x, ep_y, visuelem.attrs.id, label);
        }

        // Create difference line for parent
        if (visuelem.attrs.swac_childs.length > 0 && (this.options.sizeLineMode === 'childs' || this.options.sizeLineMode === 'booth')) {
            let lastChild;
            let lastChildPosX = visuelem.attrs.x;
            let sumChildPosXLabel = 0;
            let lastChildPosY = visuelem.attrs.y + visuelem.attrs.height + (maxNoOfDescendants - 1) * this.options.sizeLineOffset;
            let childs = this.getChildsSortedByX(visuelem).filter(Boolean);
            Msg.info('HelplinesSPL', 'Found ' + childs.length + ' childs to draw sizelines for.', this.requestor.parent);
            if (childs.length > 0) {
                Msg.info('HelplinesSPL', 'Start draw sizelines at x: ' + lastChildPosX + '/ y: ' + lastChildPosY, this.requestor.parent);
            }
            let childDefaults = comp.options.attributeDefaults.get('VisualmodelGeneral');
            for (let curChild of childs) {
                if (!curChild)
                    continue;
                let set = curChild.attrs.swac_set;
                let drawid = curChild.attrs.id + '_diff';
                let cs_x = lastChildPosX;
                let cs_y = lastChildPosY;
                let ce_x = curChild.attrs.x;
                let ce_y = lastChildPosY;
                let curDefaults = childDefaults;
                if (comp.options.attributeDefaults.has(curChild.attrs.swac_set.swac_fromName)) {
                    curDefaults = comp.options.attributeDefaults.get(curChild.attrs.swac_set.swac_fromName);
                } else {
                    curDefaults.xAttr = 'x';
                }
                let abspos = parseInt(curChild.attrs.swac_set[curDefaults.xAttr]);
                // Calculate absolute position
                if (abspos > 0 && abspos < visuelem.attrs.swac_set[defaults.widthAttr]) {
                    sumChildPosXLabel += abspos;
                } else {
                    abspos = abspos - sumChildPosXLabel;
                }

                let label_x = abspos;
                Msg.info('HelplinesSPL', 'Going to draw sizeline for child >' + set.swac_fromName + '[' + set.id + ']< drawid: ' + curChild.attrs.id + ' from ' + cs_x + '/' + cs_y + ' to ' + ce_x + '/' + ce_y, this.requestor.parent);
                if (ce_x - cs_x < this.options.minWidthDraw) {
                    Msg.info('HelplinesSPL', 'Line to >' + set.swac_fromName + '[' + set.id + ']< not drawn because distance to previos element is to small', this.requestor.parent);
                    // Remove previous drawn if one
                    let sizeLines = this.sizelines.get(drawid);
                    if (sizeLines) {
                        for (let curSizeLine of sizeLines) {
                            curSizeLine.destroy();
                        }
                        this.sizelines.delete(drawid);
                    }
                    //Even when child is not drawn position is important for folowing child
                    if (ce_x >= visuelem.attrs.x) {
                        lastChildPosX = ce_x;
                    }
                    lastChildPosY = ce_y;
                    continue;
                }

                if (this.options.differenceLineMode === 'border' && lastChild) {
                    cs_x = cs_x + lastChild.attrs.width;
                } else if (this.options.differenceLineMode === 'middle') {
                    // Move endpoint to half of curChild
                    ce_x = ce_x + (curChild.attrs.width / 2);
                }

                let label = label_x + ' ' + this.options.sizeLineUnit;
                // Do not draw zero length
                if ((ce_x - cs_x) !== 0) {
                    this.drawSizeLine(cs_x, cs_y, ce_x, ce_y, drawid, label);
                    }
                lastChild = curChild;
                lastChildPosX = ce_x;
            }
        }
        this.layer.draw();
    }

    drawSizeLine(sp_x, sp_y, ep_x, ep_y, forElemId, lblTxt = '') {
        Msg.info('HelplinesSPL', 'drawSizeLine() >' + lblTxt + '< for >' + forElemId + '<.', this.requestor.parent);
        
        // Half from start to endpoint minus half of lengh of text
        let lblPosX = sp_x + ((ep_x - sp_x) / 2) - (lblTxt.length * 2);
        let lblPosY = sp_y + 5; //+ (childNo % 2) * 5;

        // Check if sizeLines exists
        let sizeLines = this.sizelines.get(forElemId);
        if (sizeLines) {
            Msg.info('HelplinesSPL', 'Found previous drawn sizeline.', this.requestor.parent);
            for (let curSizeLine of sizeLines) {
//                console.log('modify existing sizeLines:');
//                console.log(curSizeLine);
                switch (curSizeLine.attrs.swac_type) {
                    case 'sizeLine':
                        curSizeLine.points([sp_x, sp_y, ep_x, ep_y]);
                        break;
                    case 'sizeLineStart':
                        curSizeLine.points([sp_x, sp_y - 4, sp_x, sp_y + 4]);
                        break;
                    case 'sizeLineEnd':
                        curSizeLine.points([ep_x, ep_y - 4, ep_x, ep_y + 4]);
                        break;
                    case 'sizeLineLabel':
                        curSizeLine.position({
                            x: lblPosX,
                            y: lblPosY
                        });
                        curSizeLine.text(lblTxt);
                        break;
                    default:
                        Msg.error('HelplinesSPL', 'Element of unkwon type in sizeLines', this.requestor.parent);
                }
            }
        } else {
            Msg.info('HelplinesSPL', 'Draw new sizelines.', this.requestor.parent);
            sizeLines = [];

            let sizeLineOpts = {
                swac_type: 'sizeLine',
                points: [sp_x, sp_y, ep_x, ep_y],
                stroke: '#000000',
                strokeWidth: 1
            };
            let sizeLine = new Konva.Line(sizeLineOpts);
            this.layer.add(sizeLine);
            sizeLines.push(sizeLine);
            let sizeLineStartOpts = {
                swac_type: 'sizeLineStart',
                points: [sp_x, sp_y - 4, sp_x, sp_y + 4],
                stroke: '#000000',
                strokeWidth: 1
            };
            let sizeLineStart = new Konva.Line(sizeLineStartOpts);
            this.layer.add(sizeLineStart);
            sizeLines.push(sizeLineStart);
            let sizeLineEndOpts = {
                swac_type: 'sizeLineEnd',
                points: [ep_x, ep_y - 4, ep_x, ep_y + 4],
                stroke: '#000000',
                strokeWidth: 1
            };
            let sizeLineEnd = new Konva.Line(sizeLineEndOpts);
            this.layer.add(sizeLineEnd);
            sizeLines.push(sizeLineEnd);

            let labelOpts = {
                swac_type: 'sizeLineLabel',
                text: lblTxt,
                fontSize: this.options.fontSize,
                x: lblPosX,
                y: lblPosY
            };
            let label = new Konva.Text(labelOpts);
            this.layer.add(label);
            sizeLines.push(label);
            this.sizelines.set(forElemId, sizeLines);
    }
    }

    drawGrid() {
        // Horizontal lines
        if (this.options.horizontalGridSize) {

        }

        // Vertical lines
        if (this.options.verticalGridSize) {

        }
    }

    /**
     * Get the max number of nachfahren of a list of visuelems
     * 
     * @param {Konva.Object[]} visuelem Elem to get no of descants for
     * @param {int} level starting level to count
     * @returns {@this;@call;getChildsLevel|Number|@var;level}
     */
    getMaxNoOfDescendants(visuelem, level = 0) {
        level++;
        let newLevel = level;
        for (let curChild of visuelem.attrs.swac_childs) {
            if (curChild) {
                newLevel = this.getMaxNoOfDescendants(curChild, level);
            }
        }
        if (newLevel > level)
            level = newLevel;
        return level;
    }

    getChildsSortedByX(visualelem) {
        let sorted = visualelem.attrs.swac_childs.sort(function (a, b) {
            return a.attrs.x - b.attrs.x;
        });
        return sorted;
    }

    afterRemoveSet(set) {
        let drawid = set.swac_fromName + '_' + set.id;
        let sizelines = this.sizelines.get(drawid);
        if(sizelines) {
            for (let curSizeLine of sizelines) {
                curSizeLine.destroy();
            }
            this.sizelines.delete(sizelines);
        }
        
        let drawdiffid = set.swac_fromName + '_' + set.id + '_diff';
        // Remove previous drawn if one
        let diffLines = this.sizelines.get(drawdiffid);
        if (diffLines) {
            for (let curSizeLine of diffLines) {
                curSizeLine.destroy();
            }
            this.sizelines.delete(drawdiffid);
        }
    }
}