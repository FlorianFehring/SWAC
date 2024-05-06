import SWAC from '../../swac.js';
import View from '../../View.js';
import Msg from '../../Msg.js';

export default class Forwarding extends View {

    constructor(options) {
        super(options);
        this.name = 'Forwarding';
        this.desc.text = 'The forwarding component allows automatic forwarding to another page depending on data.';
        this.desc.developers = 'Florian Fehring (FH Bielefeld)';
        this.desc.license = 'GNU Lesser General Public License';

        this.desc.reqPerSet[0] = {
            name: 'displayDuration',
            desc: 'Duration in second until the forwarding should occur'
        };
        this.desc.reqPerSet[1] = {
            name: 'hyperlink',
            desc: 'Target of the forwarding'
        };
    }

    init() {
        return new Promise((resolve, reject) => {
            resolve();
        });
    }

    beforeAddDataset(fromName, set) {
        if (typeof set.displayDuration !== 'number' && (set.displayDuration > -1)) {
            Msg.warn('Forwarding', 'Given displayDuration >'
                    + set.displayDuration + '< is not a positive seconds duration.',
                    this.requestor);
            return;
        }

        if (set.hyperlink === '') {
            Msg.warn('Forwarding', 'Given url >'
                    + set.hyperlink + '< is not a valid url.',
                    this.requestor);
            reject();
            return;
        }
        return set;
    }

    afterAddDataset(fromName, set) {
        setTimeout(() => {
            window.location.assign(set.hyperlink);
        }, set.displayDuration * 1000);

        Msg.warn('Forwarding', 'Created forwarding to >'
                + set.hyperlink + '< in >'
                + set.displayDuration + ' seconds');

        return;
    }
}