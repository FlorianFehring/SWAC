import Component from './Component.js';
import SWAC from './swac.js';
import Msg from './Msg.js';

/**
 * General class for algorithms
 */
export default class Algorithm extends Component {

    /*
     * Constructs a new algorithm and transfers the config to the
     * object
     */
    constructor(options) {
        super(options);
        // Component description
        this.desc.text = 'An algorithm';

        // Overwrite default options with given options
        for (let attrname in options) {
            this.options[attrname] = options[attrname];
        }
    }

    /**
     * Initializes the algorithm
     * 
     * @returns {undefined}
     */
    init() {
        throw('The concrete implementation has to implement the init() method.')
    }
}