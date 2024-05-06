import SWAC from '../../swac.js';
import View from '../../View.js';
import Msg from '../../Msg.js';

export default class Rotation extends View {

    constructor(options = {}) {
        super(options);
        this.name = 'Rotation';
        this.desc.text = 'Use one of the given datasets a time and roatate each time the user visits the site.';
        this.desc.developers = 'Florian Fehring';
        this.desc.license = '(c) by Florian Fehring';

        this.desc.templates[0] = {
            name: 'rotateset',
            desc: 'Simply display contents of the set'
        };

        this.desc.opts[0] = {
            name: "rotateMode",
            desc: "Mode that is used to rotate"
        };
        if (!options.rotateMode)
            this.options.rotateMode = 10;
        this.desc.opts[1] = {
            name: "rotateTime",
            desc: "Seconds after then the content should be rotated. Use 0 to deactivate time rotationg."
        };
        if (typeof options.rotateTime === 'undefined')
            this.options.rotateTime = 10;
        this.desc.opts[2] = {
            name: "customOnRotate",
            desc: "Function to execute when a rotate occures"
        };
        if (!options.customOnRotate)
            this.options.customOnRotate = function () {};

        this.options.showWhenNoData = true;
        // Internal attributes
        this.currentSet = {id: -1};
        this.timer = null;
    }

    /*
     * This method will be called when the component is complete loaded
     * At this thime the template code is loaded, the data inserted into the 
     * template and even plugins are ready to use.
     */
    init() {
        return new Promise((resolve, reject) => {
            let lastSetId = localStorage.getItem('lastSet_' + this.requestor.id);
            if (lastSetId) {
                this.currentSet = {id: parseInt(lastSetId) + 1};
            }
            this.timer = setInterval(this.onRotate.bind(this), this.options.rotateTime * 1000);
            resolve();
        });
    }

    /**
     * Executet on rotation
     */
    onRotate() {
        // Get next set
        let newset;

        for (let curSource in this.data) {
            let sets = this.data[curSource].getSets();
            if (sets.length < this.currentSet.id)
                return;
            for (let i = this.currentSet.id; i < sets.length; i++) {
                let curSet = sets[i];
                if (!curSet)
                    continue;
                if (curSet.id > this.currentSet.id) {
                    newset = curSet;
                    break;
                }
            }
            // Only use first source
            break;
        }
        // Start again from beginning
        if (!newset) {
            this.currentSet = {id: -1};
            this.onRotate();
            return;
        }
        this.currentSet = newset;
        localStorage.setItem('lastSet_' + this.requestor.id, newset.id);

        this.showSet(newset);

        // Execute custom onRotate
        if (this.options.customOnRotate) {
            try {
                this.options.customOnRotate(this.currentSet, this);
            } catch (e) {
                Msg.error('Rotation', 'Error executing customOnRotate(): ' + e, this.requestor);
            }
        }
    }

    showSet(set) {
        // Hide sets
        let setElems = this.requestor.querySelectorAll('.swac_repeatedForSet');
        for (let curSetElem of setElems) {
            curSetElem.classList.add('swac_dontdisplay');
        }

        // View set
        let curSetElems = this.requestor.querySelectorAll('[swac_setid="' + set.id + '"]');
        for (let curSetElem of curSetElems) {
            curSetElem.classList.remove('swac_dontdisplay');
        }
    }

    afterAddSet(set, repeateds) {
        if (this.currentSet.id === -1 || this.currentSet.id === set.id) {
            this.showSet(set);
        }
        let thisRef = this;
        for (let curRepeated of repeateds) {
            let imgElem = curRepeated.querySelector('img');
            if (imgElem)
                imgElem.addEventListener('error', function (evt) {
                    Msg.error('Rotation', 'Image for set >' + set.id + '< could not be loaded.', thisRef.requestor);
                });
        }
    }
}


