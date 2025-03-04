import SWAC from '../../swac.js';
import View from '../../View.js';
import Msg from '../../Msg.js';

export default class Coder extends View {

    constructor(options = {}) {
        super(options);
        this.name = 'Coder';
        this.desc.text = 'Component for display code';
        this.desc.developers = 'Florian Fehring (FH Bielefeld)';
        this.desc.license = 'GNU Lesser General Public License';

        this.desc.templates[0] = {
            name: 'default',
            desc: 'Default template.'
        };
        
        this.desc.depends[0] = {
            name: 'highlight.js',
            path: SWAC.config.swac_root + 'libs/highlight/highlight.min.js',
            desc: 'Syntax hightlighting'
        };
        this.desc.depends[1] = {
            name: 'highlight.js style',
            path: SWAC.config.swac_root + 'libs/highlight/styles/default.min.css',
            desc: 'Syntax hightlighting'
        };
    }

    init() {
        return new Promise((resolve, reject) => {

            // Get filename if source is a file
            let source = this.requestor.fromName;
            var pathX = "[?:[a-zA-Z0-9-_\.]+(?:.json|.js)"; /* File validation using extension*/
            // Check if path is pointing to a file
            if (source.match(pathX)) {
                let thisRef = this;
                // Load file
                fetch(source).then(function(cont) {
                    cont.text().then(function(txtcont) {
                        // Insert content into output field
                        let outElem = thisRef.requestor.querySelector('.swac_coder_code');
                        outElem.innerHTML = new Option(txtcont).innerHTML;
                        if(source.includes('.json')) {
                            outElem.classList.add('language-json');
                        }
                        else if(source.includes('.js')) {
                            outElem.classList.add('language-javascript');
                        }
                        outElem.classList.remove('language-undefined');
                        hljs.highlightElement(thisRef.requestor.querySelector('code'));
                        outElem.classList.remove('language-undefined');
                    });
                });
            } else {
                //Nothing todo here
            }

            resolve();
        });
    }

    afterAddSet(set, repeateds) {
        // You can do after adding actions here. At this timepoint the template
        // repeatForSet is also repeated and accessable.
        // e.g. generate a custom view for the data.

        // Call Components afterAddSet and plugins afterAddSet
        super.afterAddSet(set, repeateds);

        return;
    }
}


