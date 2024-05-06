import SWAC from '../../swac.js';
import View from '../../View.js';
import Msg from '../../Msg.js';

export default class Copy extends View {

    constructor(options = {}) {
        super(options);
        this.name = 'Copy';
        this.desc.text = 'This component copies content from elsewere on the page to a new location. It needs no data and only the option sourceId.';
        this.desc.developers = 'Florian Fehring';
        this.desc.license = '(c) by Florian Fehring';

        this.desc.opts[0] = {
            name: "sourceId",
            desc: "Elemens id thats contents should be copied",
            example: 'myElementId'
        };
        // Setting a default value, only applying when the options parameter does not contain this option
        if (!options.sourceId)
            this.options.sourceId = null;
        if (!options.showWhenNoData)
            this.options.showWhenNoData = true;
    }

    init() {
        return new Promise((resolve, reject) => {
            // Search sourceId on page
            let sourceElem = document.getElementById(this.options.sourceId);
            if(!sourceElem) {
                Msg.error('Copy','There is no element with id >' + this.options.sourceId + '<', this.requestor);
                reject();
            }
            // Insert copy
            let clone = sourceElem.cloneNode(true);
            this.requestor.appendChild(clone);
            
            resolve();
        });
    }

    beforeAddSet(set) {
        return set;
    }

    afterAddSet(set, repeateds) {
        return;
    }
}


