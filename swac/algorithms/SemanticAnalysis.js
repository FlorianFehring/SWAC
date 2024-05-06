/* 
 * SemanticAnalysis Algorithms copyright 2020 by Florian Fehring
 */

class SemanticAnalysis {

    /**
     * Constructs a new SemanticAnalysis
     * 
     * @param {Object} options Object with options for text analysis
     * 
     * @returns {TextAnalysis}
     */
    constructor(options = {}) {
        // Set options
        this.setOptions(options);
    }

    init() {
        return new Promise((resolve, reject) => {
            let thisRef = this;
        });
    }

    setOptions(options) {
        if (options.sentenceChars)
            this.sentenceChars = options.sentenceChars;
        else
            this.sentenceChars = [' ', ',', '.', ';', ':', '!', '?', '(', ')', '[', ']', '{', '}', '"', '\''];
    }
    
    
}


