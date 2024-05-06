import Plugin from '../../../../Plugin.js'
import Msg from '../../../../Msg.js'

export default class HierarchySPL extends Plugin {
    constructor(opts = {}) {
        super(opts)
        this.name = 'Visualmodel/plugins/Hierarchy'
        this.desc.opts[0] = {
            name: 'ConnectWithChilds',
            desc: 'Connect Parents with Children, false to deactivate',
        }
        if (!this.options.ConnectWithChilds)
            this.options.ConnectWithChilds = true
        this.stage = null
        this.layer = null
        this.sizelines = new Map()
    }
    init() {
        return new Promise((resolve, reject) => {
            console.log('Hierarchy Init')
            this.stage = this.requestor.parent.swac_comp.stage
            this.layer = new Konva.Layer()
            this.stage.add(this.layer)
            this.draw()
            resolve()
        })
    }
    redraw() {
        this.draw()
    }
    draw() {
        let comp = this.requestor.parent.swac_comp
        Msg.flow('HierarchySPL', 'Draw Hierarchy Lines', this.requestor.parent)
        for (let curSource in comp.data) {
            console.log('Hierarchy draw')
            if (comp.drawns.get(curSource)) {
                for (let curDrawn of comp.drawns.get(curSource)) {
                    if (!curDrawn)
                        continue
                    let thisRef = this
                    this.stage.on('dragend', function (evt) {
                        thisRef.drawLine(evt.target)
                    })
                    if (
                            this.options.ConnectWithChilds &&
                            curDrawn.attrs.swac_childs.length > 0
                            ) {
                        thisRef.drawLine(curDrawn)
                    }
                }
            }
        }
    }

    drawLine(parent) {
        let comp = this.requestor.parent.swac_comp
        let defaults = comp.options.attributeDefaults.get('VisualmodelGeneral')
        defaults.widthAttr = 'width'

        //let maxNoOfDescendants = this.getMaxNoOfDescendants(parent)

        for (let child of parent.attrs.swac_childs) {
            let drawid = child.attrs.id + '_diff'
            let sizeLines = this.sizelines.get(drawid)
            if (sizeLines) {
                for (let curSizeLine of sizeLines) {
                    curSizeLine.destroy()
                }
                this.sizelines.delete(drawid)
            }
            let sizeLineOpts = {
                swac_type: 'sizeLine',
                points: [parent.attrs.x, parent.attrs.y, child.attrs.x, child.attrs.y],
                stroke: '#000000',
                strokeWidth: 1,
            }
            let sizeLine = new Konva.Line(sizeLineOpts)
            sizeLines = []
            this.layer.add(sizeLine)
            sizeLines.push(sizeLine)
            this.sizelines.set(drawid, sizeLines)
        }
    }
}
