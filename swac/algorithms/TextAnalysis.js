/* 
 * TextAnalysis Algorithms copyright 2020 by Florian Fehring
 */

class TextAnalysis {

    /**
     * Constructs a new TextAnalysis
     * 
     * @param {Object} options Object with options for text analysis
     * 
     * @returns {TextAnalysis}
     */
    constructor(options = {}) {

        // Set options
        this.setOptions(options);
        // Init internal working attributes
        this.textdom = document.createElement('span'); // DOM node for text interpretation
        this.text = null;                   // Original content
        this.text_markupfree = null;        // Content freed from markup
        this.last_abbrchk = null;           // Text that was last checked for abbrivations
        this.text_abbrfree = null;          // Content with translated abbrivations
        this.usedabbrs = [];                // List of used abbrivations
        this.usedenums = [];                // List of used enumerations
        this.sentences = [];                // Single sentences
        this.sentencesstats = new Map();    // Statistics for sentences
        this.words = [];                    // Single words of the text
        this.wordsstats = new Map();        // Statistics for words
        this.sugKeywords = null;            // Calculates suggested keywords
        this.last_sugkeywords = null;       // Number of words used in last keyword suggestion
        this.fre = null;                    // Calculated FRE
        this.last_frewords = null;          // Number of words used in last fre calculation
        this.last_frefactors = null;        // Last used factors for FRE calculation
        this.wsf = null;                    // Calculated WSF
        this.last_wsfwords = null;          // Number of words used in last wsf calculation
        this.last_wsfvariant = null;        // Variant used in last wsf calculation
        this.last_cfactors = null;          // Last used factors for INT calculation
        this.tqap = null;                   // Text question answer propability
        this.last_tqapwords = null;         // Number of words used in last tqap calculation
        this.headlines = null;              // Found headlines
        this.last_headlines = null;         // Number of headlines used in last headline analysis

        // Load dictionary
        this.dictionary = null;
        this.abbrivations = null;
    }

    init() {
        return new Promise((resolve, reject) => {
            let thisRef = this;
            fetch(SWAC.config.swac_root + 'data/dictionary/' + lang + '.json').then(
                    function (response) {
                        response.json().then(function (json) {
                            thisRef.dictionary = json;
                            Msg.warn('TextAnalysis', 'Loaded dictionary >' + lang + '<');
                            if (thisRef.abbrivations)
                                resolve();
                        }).catch(
                                function (error) {
                                    Msg.error('TextAnalysis', 'Could not parse dictionary: ' + error);
                                    reject();
                                });
                    }
            ).catch(
                    function (error) {
                        Msg.error('TextAnalysis', 'Could not load dictionary for >' + lang + '<');
                        reject();
                    }
            );
            // Load abbrivations
            fetch(SWAC.config.swac_root + 'data/abbrivations/' + lang + '.json').then(
                    function (response) {
                        response.json().then(function (json) {
                            thisRef.abbrivations = json;
                            Msg.warn('TextAnalysis', 'Loaded dictionary >' + lang + '<');
                            if (thisRef.dictionary)
                                resolve();
                        }).catch(
                                function (error) {
                                    Msg.error('TextAnalysis', 'Could not parse dictionary: ' + error);
                                    reject();
                                });
                    }
            ).catch(
                    function (error) {
                        Msg.error('TextAnalysis', 'Could not load dictionary for >' + lang + '<');
                        reject();
                    }
            );
        });
    }

    setOptions(options) {
        if (options.noOfSugKeyWords)
            this.noOfSugKeyWords = options.noOfSugKeyWords;
        else
            this.noOfSugKeyWords = 4;
        if (options.wordBorderChars)
            this.wordBorderChars = options.wordBorderChars;
        else
            this.wordBorderChars = [' ', ',', '.', ';', ':', '!', '?', '(', ')', '[', ']', '{', '}', '"', '\''];
    }

    /**
     * Sets the text that should be analysed
     * 
     * @param {String} text Text that should be analysed
     */
    setText(text) {
        this.textdom.innerHTML = text;
        this.text = text;
        // Reset internal values
        this.text_markupfree = null;
        this.sentences = [];
        this.words = [];
    }

    /**
     * Sets the language of the text
     * 
     * @param {String} lang Languagecode of the texts language
     */
    setLang(lang) {
        this.lang = lang;
    }

    /**
     * Gets the language of the text.
     * 
     * @returns {Promise}
     */
    getLang() {
        if (this.lang)
            return this.lang;

        this.lang = navigator.language || navigator.userLanguage;
        return this.lang;
    }

    /**
     * Returns the text without any markup information.
     * 
     * @returns {String} Text without markups
     */
    getMarkupFree() {
        if (this.text_markupfree)
            return this.text_markupfree;

        this.text_markupfree = this.textdom.textContent;
        return this.text_markupfree;
    }

    /**
     * Gets the text wir resolved abbrivations.
     * Uses the language dependend abbrivations dictionary from swac/data/abrivations/
     * 
     * @returns {String}
     */
    getAbbrivationResolved() {
        let text = this.getMarkupFree();

        // Performance+ check if prev calc
        let oldchkpos = -1;
        if (this.last_abbrchk) {
            oldchkpos = text.indexOf(this.last_abbrchk);
        }

        if (text[text.length - 1] === '.' || oldchkpos !== 0) {
            // Continue with resolveing
        } else {
            // Add allready resolved and new not needed to resolved 
            return this.text_abbrfree + text.replace(this.last_abbrchk, '');
        }
        this.last_abbrchk = text;

        // Find enumerations
        this.usedenums = text.match(/\d+\./g);
        if (this.usedenums) {
            for (let curEnum of this.usedenums) {
                let regx = curEnum.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                let re = new RegExp(regx, 'g');
                text = text.replace(re, curEnum.replace(/\./, 'ens'));
            }
        }

        // Find abbrivations
        this.usedabbrs = [];
        for (let curAbbr in this.abbrivations) {
            let regx = curAbbr.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            let re = new RegExp(regx, 'g');
            while (re.exec(text)) {
                this.usedabbrs.push({
                    abbr: curAbbr,
                    index: re.lastIndex
                });
                text = text.replace(re, this.abbrivations[curAbbr].full);
            }
        }
        this.text_abbrfree = text;
        if (this.usedabbrs.length > 0) {
            Msg.warn('TextAnalysis', 'Text uses >' + this.usedabbrs.length + '< abbrivations.');
            Msg.warn('TextAnalysis', 'Abbrivation resolved text: >' + this.text_abbrfree + '<');
        }

        return this.text_abbrfree;
    }

    /**
     * Decode 
     * 
     * @param {type} text
     * @returns {undefined}
     */
    htmlDecode(text) {
        // If he.js is available use it
        if (he) {
            text = he.decode(text);
        } else {
            // Fallback for not activated he.js
            text = text.replace(/&lt;/g, "<").replace(/&gt;/g, ">");
            text = text.replace(/&ouml;/g, "ö").replace(/&auml;/g, "ä")
                    .replace(/&uuml;/g, "ü").replace(/&szlig;/g, "ß");
        }
        return text;
    }

    /**
     * Returns the length of the markup free text content
     * 
     * @returns {Long} Number of text chars
     */
    getCharsLength() {
        return this.getMarkupFree().length;
    }

    /**
     * Gets the single sentences
     * 
     * @returns {String[]} Array of sentences
     */
    getSentences() {
        if (this.sentences.length > 0) {
            return this.sentences;
        }

        let sentences = this.getAbbrivationResolved().split(/[.!?/\n]+/);
        let thisRef = this;
        sentences.forEach(function (sentence) {
            sentence = sentence.trim();
            if (sentence.length > 0) {
                thisRef.sentences.push(sentence);
            }
        });
        return this.sentences;
    }

    /**
     * Gets the number of sentences in the markup free content
     * 
     * @returns {Long} Number of sentences
     */
    getSentencesLength() {
        return this.getSentences().length;
    }

    /**
     * Get statistics for each sentence.
     * 
     * @param {Object} cfactors Factors with weight of complexity parameters
     * @returns {Object[]} Object with sentence stats (sentence, wordcount, commacount)
     */
    getSentencesStats(cfactors) {
        if (cfactors) {
            let cfactorshash = JSON.stringify(cfactors);
            if (this.last_cfactors && this.last_cfactors !== cfactorshash) {
                this.sentencesstats = new Map();
            }
            this.last_cfactors = cfactorshash;
        }

        let newSentencesstats = new Map();
        for (let curSentence of this.getSentences()) {
            // Check if there is a calculation from actual text analysis
            let curSentenceStats = newSentencesstats.get(curSentence);
            if (curSentenceStats) {
                curSentenceStats.occurences += 1;
                continue;
            }
            // Check if there is a calculation from prev text analysis
            let befSentenceStats = this.sentencesstats.get(curSentence);
            if (befSentenceStats) {
                // Reset counter
                befSentenceStats.occurences = 1;
                newSentencesstats.set(curSentence, befSentenceStats);
                continue;
            }

            // Make new analysis
            let complexity = this.calcSentenceComplexity(curSentence, cfactors);
            newSentencesstats.set(curSentence, {
                sentence: curSentence,
                occurences: 1,
                words: complexity.words,
                parts: complexity.parts,
                complexity: complexity
            });
        }
        this.sentencesstats = newSentencesstats;
        return this.sentencesstats;
    }

    /**
     * Calculates the complexity of a sentence.
     * 
     * @param {String} sentence Sentence to get complexity for
     * @param {Object} factors Factors with weight of complexity parameters
     * @returns {Object} Object with words, parts and (complexity)factor.
     */
    calcSentenceComplexity(sentence, factors) {
        let c = {
            words: this.getWordsFromText(sentence),
            parts: sentence.split(',')
        };
        // Get word statistics
        let noOfConjunctions = 0;
        let frequentlyUsedWords = 0;
        let rarelyUsedWords = 0;
        for (let curWord of c.words) {
            // Search wordstat
            let curWordDict = this.getDictionaryEntry(curWord);
            if (curWordDict) {
                if (curWordDict.type && curWordDict.type.includes('conjunction'))
                    noOfConjunctions++;
                if (curWordDict.used && curWordDict.used >= 7)
                    frequentlyUsedWords++;
                if (curWordDict.used && curWordDict.used < 7)
                    rarelyUsedWords++;
            }
        }

        // Number of words in sentence
        c.nws = c.words.length;
        // Number of parts in sentence
        c.nps = c.parts.length;
        // Number of conjunctions in sentence
        c.ncs = noOfConjunctions;
        // Average of Rarely used Words
        c.arw = rarelyUsedWords / c.words.length;
        // Average of Frequently used Words
        c.afw = frequentlyUsedWords / c.words.length;

        // Find abbrivations used in this sentence
        c.nas = 0;
        for (let curAbbr of this.usedabbrs) {
            let abbrEntry = this.abbrivations[curAbbr.abbr];
            if (sentence.indexOf(abbrEntry.full) >= 0) {
                c.nas++;
            }
        }

        // Default factors
        if (!factors) {
            c.factors = {
                nws: 0.05,
                nps: 0.50,
                ncs: 0.50,
                arw: 0.50,
                afw: 0.25,
                nas: 0.45
            };
        } else {
            c.factors = factors;
        }

        c.score = (c.factors.nws * c.nws + c.factors.nps * c.nps + c.factors.ncs * c.ncs
                + c.factors.arw * c.arw - c.factors.afw * c.afw + c.factors.nas * c.nas);
        // Add explanation
        c.calc = c.factors.nws + ' * ' + c.nws + ' + ' + c.factors.nps + ' * ' + c.nps
                + ' + ' + c.factors.ncs + ' * ' + c.ncs + ' + ' + c.factors.arw + ' * '
                + c.arw + ' - ' + c.factors.afw + ' * ' + c.afw + ' + '
                + c.factors.nas + ' * ' + c.nas + ' = ' + c.score;

        // Maximum words per sentence for inteligility by Reiners, Sturm & Zibrik
        if (c.words.length > 18) {
            c.score += 2;
        }

        return c;
    }

    /**
     * Gets the arithmetic means from the sentences stats
     * 
     * @param {Object} cfactors Factors with weight of complexity parameters
     * @returns {Object} Object with wordcount (mean), commacount (mean)
     */
    getSentencesStatsMeans(cfactors) {
        let stats = this.getSentencesStats(cfactors);

        let means = {
            sumWordcount: 0,
            sumPartscount: 0,
            sumComplexity: {
                nws: 0,
                nps: 0,
                ncs: 0,
                arw: 0,
                afw: 0,
                nas: 0,
                score: 0
            }
        };
        let statobjs = stats.values();
        let noOfStats = 0;
        for (let curStat of statobjs) {
            noOfStats++;
            means.sumWordcount += curStat.words.length;
            means.sumPartscount += curStat.parts.length;
            means.sumComplexity.nws += curStat.complexity.nws;
            means.sumComplexity.nps += curStat.complexity.nps;
            means.sumComplexity.ncs += curStat.complexity.ncs;
            means.sumComplexity.arw += curStat.complexity.arw;
            means.sumComplexity.afw += curStat.complexity.afw;
            means.sumComplexity.nas += curStat.complexity.nas;
            means.sumComplexity.score += curStat.complexity.score;
            means.sumComplexity.factors = curStat.complexity.factors;
        }
        means.aMeanWordcount = means.sumWordcount / noOfStats;
        means.aMeanPartscount = means.sumPartscount / noOfStats;
        means.aMeanComplexity = {
            nws: means.sumComplexity.nws / noOfStats,
            nps: means.sumComplexity.nps / noOfStats,
            ncs: means.sumComplexity.ncs / noOfStats,
            arw: means.sumComplexity.arw / noOfStats,
            afw: means.sumComplexity.afw / noOfStats,
            nas: means.sumComplexity.nas / noOfStats,
            score: means.sumComplexity.score / noOfStats,
            factors: means.sumComplexity.factors
        };
        return means;
    }

    /**
     * Gets the AverageSentenceLength
     * 
     * @returns {Number} Average sentence length
     */
    getASL() {
        return this.getWordsLength() / this.getSentencesLength();
    }

    /**
     * Returns the single words of the text
     * @returns {String[]} Array of words
     */
    getWords() {
        // If words are allready extracted return
        if (this.words.length > 0) {
            return this.words;
        }

        let mfree = this.getMarkupFree();
        this.words = this.getWordsFromText(mfree);
        return this.words;
    }

    /**
     * Gets the words from an text
     * 
     * @param {String} text Text to get words from
     * @returns {String[]} Words in the text
     */
    getWordsFromText(text) {
        // Remove punctuation marks
        let pfree = text.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
        pfree = pfree.replace(/\s{2,}/g, " ");
        pfree = pfree.replace(/(\r\n|\n|\r)/gm, " ");

        // Get single words
        let words = [];
        for (let curWord of pfree.split(' ')) {
            let curWordT = curWord.trim();
            if (curWordT !== '') {
                words.push(curWordT);
            }
        }

        return words;
    }

    /**
     * Returns the number of words in the text
     * 
     * @returns {Long} Number of words in text
     */
    getWordsLength() {
        return this.getWords().length;
    }

    /**
     * Get statistics of words.
     * 
     * @returns {Map} Map with word as key and object containing informations
     */
    getWordsStats() {
        // Return if allready calculated
        if (this.wordsstats.length > 0) {
            return this.wordsstats;
        }

        let newWordsstats = new Map();
        newWordsstats[Symbol.iterator] = function* () {
            yield * [...this.entries()].sort((a, b) => b[1].occurences - a[1].occurences);
        };
        for (let curWord of this.words) {
            // Check if there is a calculation from actual text analysis
            let curWordStats = newWordsstats.get(curWord);
            if (curWordStats) {
                curWordStats.occurences += 1;
                continue;
            }
            // Check if there is a calculation from prev text analysis
            let befWordStats = this.wordsstats.get(curWord);
            if (befWordStats) {
                // Reset counter
                befWordStats.occurences = 1;
                newWordsstats.set(curWord, befWordStats);
                continue;
            }
            // Create new word statistic
            let wordstat = {
                word: curWord,
                occurences: 1,
                chars: curWord.length,
                syllables: this.getSyllables(curWord)
            };
            newWordsstats.set(curWord, wordstat);
        }
        this.wordsstats = newWordsstats;
        return this.wordsstats;
    }

    /**
     * Gets the syllables of a word
     * 
     * @param {String} word Word to get the syllables from
     * @returns {undefined}
     */
    getSyllables(word) {
        let hword = this.getHypend(word);
        return hword.split('-');
    }

    /**
     * Hypen the given word
     * 
     * @param {String} word Word that should be hypend
     * @returns {String} word with added - at syllables borders
     */
    getHypend(word) {
        let hword = '';
        let hypen = false;
        for (let i = 0; i < word.length; i++) {
            hword += word[i];
            if (hypen && i < word.length - 2) {
                hword += '-';
                hypen = false;
            } else if (/A|E|I|O|U|Ä|Ö|Ü|a|e|i|o|u|ä|ö|ü/.test(word[i])) {
                let nx2 = word.substring(i + 1, i + 3);
                if (nx2 === 'ch' || nx2 === 'ck') {
                    // Keep ch and ck
                    hword += '-';
                } else if (word.substring(i + 1, i + 4) === 'sch') {
                    // Keep sch
                    hword += '-';
                } else if (word.substring(i + 2, i + 4) === 'tz') {
                    // Part tz to t-z ( Katze => Kat-ze)
                    hword += word[i + 1] + "t-z";
                    i = i + 3;
                } else if (word.substring(i + 2, i + 4) === 'st') {
                    // Part st to s-t
                    hword += word[i + 1] + "s-t";
                    i = i + 3;
                } else if (word[i + 1] === "'" || word[i + 2] === "'") {
                    // Do not part at apostrophs
                } else {
                    hypen = true;
                }
            }
        }
        return hword;
    }

    /**
     * Gets the dictionary entry for the given word
     * 
     * @param {String} word Word to get dictionary entry for
     * @returns {Object} Object with attributes from dictionary
     * - type: words type (e.g. conjunction, noman, ...)
     * - syl: Syllable string version of the word
     * - syn: Synonyms (seperated by comma)
     */
    getDictionaryEntry(word) {
        return this.dictionary[word];
    }

    /**
     * Gets the texts FRE level
     * 
     * @param {Object} factors Object with factors for calculation, if not given uses language defaults determined by the browser language 
     * @returns {Number}
     */
    calcFRELevel(factors) {
        let fre = this.calcFRE(factors);
        let level;
        if (fre.score < 30) {
            level = 8;
        } else if (fre.score < 50) {
            level = 7;
        } else if (fre.score < 60) {
            level = 6;
        } else if (fre.score < 70) {
            level = 5;
        } else if (fre.score < 80) {
            level = 4;
        } else if (fre.score < 90) {
            level = 3;
        } else if (fre.score < 100) {
            level = 2;
        } else {
            level = 1;
        }
        return level;
    }

    /**
     * Calculates the readability factor after Flash-Reading-Ease
     * 
     * @param {Object} factors Object with factors for calculation, if not given uses language defaults determined by the browser language 
     * @returns {Number}
     */
    calcFRE(factors) {
        let wordslength = this.getWordsLength();
        let factorshash = null;
        if (factors) {
            factorshash = factors.base + '_' + factors.asl + '_' + factors.asw;
        }
        // Performance+ do not calculate on every new char
        if (this.last_frewords === wordslength
                && this.last_frefactors === factorshash)
            return this.fre;
        this.last_frewords = wordslength;
        this.last_frefactors = factorshash;

        let c = {
            asl: this.calcASL(),
            asw: this.calcASW(),
            factors: {},
            score: null
        };

        if (factors) {
            c.factors = factors;
        } else {
            switch (this.getLang()) {
                case "de": // German factors
                    c.factors = {
                        base: 180,
                        asl: 1,
                        asw: 58.5
                    };
                    break;
                default:
                    // Default factors (english language)
                    c.factors = {
                        base: 206.835,
                        asl: 1.015,
                        asw: 84.6
                    };
            }
        }

        // Calculate score
        c.score = c.factors.base - (c.factors.asl * c.asl) - (c.factors.asw * c.asw);
        c.calc = c.factors.base + ' - ( ' + c.factors.asl + ' * ' + c.asl + ' ) - ( ' + c.factors.asw + ' * ' + c.asw + ' )';

        this.fre = c;
        return this.fre;
    }

    /**
     * Average Sentence Length
     * 
     * @returns {Number}
     */
    calcASL() {
        return this.getWordsLength() / this.getSentencesLength();
    }

    /**
     * Average Number of Syllables per Word
     * 
     * @returns {Number}
     */
    calcASW() {
        let syllables = 0;
        for (let curWordStat of this.getWordsStats().values()) {
            syllables += curWordStat.syllables.length * curWordStat.occurences;
        }

        return syllables / this.getWordsLength();
    }

    /**
     * Gets the level of the WSF readability index.
     * 
     * @param {Number} variant WSF variant used to calculate
     * @returns {Number} A number between 1 (easy to read) and 15 (hard to read)
     */
    calcWSFLevel(variant) {
        let wsf_score = Math.round(this.calcWSF(variant).score);
        if (wsf_score < 0)
            wsf_score = 0;
        if (wsf_score > 15)
            wsf_score = 15;
        return wsf_score;
    }

    /**
     * Calculates the readability after the Wiener Sachtextformel
     * 
     * @param {Number} variant WSF variant used to calculate
     * @returns {undefined}
     */
    calcWSF(variant) {
        let wordslength = this.getWordsLength();
        // Performance+ do not calculate on every new char
        if (this.last_wsfwords === wordslength
                && this.last_wsfvariant === variant)
            return this.wsf;
        this.last_wsfwords = wordslength;
        this.last_wsfvariant = variant;

        let stats = this.getWordsStats();
        let more2Syl = 0;
        let more6Char = 0;
        let only1Syl = 0;
        for (let curWord of this.getWords()) {
            if (stats.get(curWord).syllables.length === 1) {
                only1Syl++;
            } else if (stats.get(curWord).syllables.length >= 3) {
                more2Syl++;
            }
            if (curWord.length > 6) {
                more6Char++;
            }
        }

        let c = {
            // Procentual useage of words with more than three syllables
            ms: more2Syl / this.getWordsLength() * 100,
            // Procentual useage of words with more than six chars
            iw: more6Char / this.getWordsLength() * 100,
            // Middle sentences length
            sl: this.getSentencesStatsMeans().aMeanWordcount,
            // Procentual useage of words with only one syllable
            es: only1Syl / this.getWordsLength() * 100,
            factors: {},
            score: null
        };

        if (!variant)
            variant = 1;

        switch (variant) {
            case 1:
                c.factors = {
                    ms: 0.1935,
                    sl: 0.1672,
                    iw: 0.1297,
                    es: 0.0327,
                    base: 0.875
                };
                c.factors.variant = 1;
                break;
            case 2:
                c.factors = {
                    ms: 0.2007,
                    sl: 0.1682,
                    iw: 0.1373,
                    es: 0,
                    base: 2.779
                };
                c.factors.variant = 2;
                break;
            case 3:
                c.factors = {
                    ms: 0.2963,
                    sl: 0.1905,
                    iw: 0,
                    es: 0,
                    base: 1.1144
                };
                c.factors.variant = 3;
                break;
            case 4:
                c.factors = {
                    ms: 0.2744,
                    sl: 0.2656,
                    iw: 0,
                    es: 0,
                    base: 1.693
                };
                c.factors.variant = 4;
                break;
        }

        c.score = (c.factors.ms * c.ms) + (c.factors.sl * c.sl) + (c.factors.iw * c.iw) - (c.factors.es * c.es) - c.factors.base;
        c.calc = '(' + c.factors.ms + ' * ' + c.ms + ' ) + ( ' + c.factors.sl
                + ' * ' + c.sl + ' ) + ( ' + c.factors.iw + ' * ' + c.iw
                + ' ) - ( ' + c.factors.es + ' * ' + c.es + ' ) - '
                + c.factors.base + ' = ' + c.score;
        this.wsf = c;
        return this.wsf;
    }

    /**
     * Calculates the level of interlligibility
     * 
     * @param {Object} cfactors Factors with weight of complexity parameters
     * @returns {Number} Level between 0 (most easiest) and 15 (most difficult)
     */
    calcIntelligibilityLevel(cfactors) {
        let level = Math.round(this.calcIntelligibility(cfactors).score);
        if (level < 0)
            level = 0;
        if (level > 15)
            level = 15;
        return level;
    }

    /**
     * Calculates the intelligibility score
     * 
     * @param {Object} cfactors Factors with weight of complexity parameters
     * @returns {Number}
     */
    calcIntelligibility(cfactors) {
        let meanstats = this.getSentencesStatsMeans(cfactors);
        return meanstats.aMeanComplexity;
    }

    /**
     * Calculates the TQAP level
     * 
     * @param {Object} factors Object with factors for the TQAP calculation
     * @returns {Number} Level from 0 (not TQAP optimised) to 8 (highly TQAP optimised)
     */
    calcTQAPLevel(factors) {
        let tqap = this.calcTQAP(factors);
        let tqaplevel = Math.round(tqap.score);
        if (tqaplevel < 0) {
            tqaplevel = 0;
        } else if (tqaplevel > 8) {
            tqaplevel = 8;
        }
        return tqaplevel;
    }

    /**
     * Calculates the Text Question Answering Propability
     * 
     * @param {Object} factors Object with factors for the TQAP calculation
     * @returns {Number}
     */
    calcTQAP(factors) {
        let wordslength = this.getWordsLength();
        // Performance+ do not calculate on every new char
        if (this.last_tqapwords === wordslength)
            return this.tqap;
        this.last_tqapwords = wordslength;

        let c = {};
        if (factors) {
            c.factors = factors;
        } else {
            c.factors = {
                optWords: 300, // Optimum number of words in text
                mainKeyWord: null, // Main keyword
                mkwmin: 1, // Minimum occurrence of the main keyword
                mkwmax: 5, // Maximum occurrence of the main keyword
                secKeyWords: [], // Secondary keywords
                skwmin: 1, // Minimum occurrence of the sec keywords
                skwmax: 2, // Maximum occurrence of the sec keywords
                hwpmax: 10, // Maximum position for keywords in headline
                dowl: 0.15, // Weight factor for the Distance to Optimized Word Length
                mkwo: 0.50, // Weight factor for the Main KeyWord Occurence
                skwo: 0.50, // Weight factor for the Secondary KeyWord Occurence
                hwpv: 0.50  // Weight factor for the number of max position in headline violations
            };
        }

        c.wop = (this.getWordsLength() * 100) / c.factors.optWords;   // WordOptimumPercentage

        // Distance to Optimized Word Length
        if (c.wop < 100)
            c.dowl = 100 - c.wop;
        else
            c.dowl = c.wop - 100;

        c.sugKeyWords = this.getKeywords();

        // Use suggested mainkeyword if there was no one given
        if (!c.factors.mainKeyWord && c.sugKeyWords.mainKeyWord)
            c.factors.mainKeyWord = c.sugKeyWords.mainKeyWord;
        // Use suggested secondary keywords if there where no given
        if (c.factors.secKeyWords.length === 0)
            c.factors.secKeyWords = c.sugKeyWords.secKeyWords;

        // MainKeyWordOccurens
        c.mkwo = Math.abs(this.getWordTargetOccur(c.factors.mainKeyWord, c.factors.mkwmin, c.factors.mkwmax));
        // SecKeyWordOccourences
        c.skwo = 0;
        for (let curSKW of c.factors.secKeyWords) {
            c.skwo += Math.abs(this.getWordTargetOccur(curSKW, c.factors.skwmin, c.factors.skwmax));
        }
        c.skwo = c.skwo / c.factors.secKeyWords.length;

        // Get headline
        let headlines = this.getHeadlinesList();
        // Calc violations of max position in headline
        c.hwpvio = 0;
        for (let curHeadline of headlines) {
            let windex = curHeadline.indexOf(c.factors.mainKeyWord);
            if (windex > c.factors.hwpmax)
                c.hwpvio++;
        }

        // Calculate overall factor
        c.score = 8 - c.factors.dowl * c.dowl - c.factors.mkwo
                * c.mkwo - c.factors.skwo * c.skwo - c.factors.hwpv * c.hwpvio;
        // Add explaination
        c.calc = '8 - ' + c.factors.dowl + ' * ' + c.dowl + ' - ' + c.factors.mkwo
                + ' * ' + c.mkwo + ' - ' + c.factors.skwo + ' * ' + c.skwo
                + ' - ' + c.factors.hwpv + ' * ' + c.hwpvio
                + ' = ' + c.score;

        this.tqap = c;
        return this.tqap;
    }

    /**
     * Gets the keywords from text.
     * 
     * @returns {Object} Object with mainKeyWord and secKeyWords
     */
    getKeywords() {
        let wordslength = this.getWordsLength();
        // Return last calculation result if there is the same number of words
        if (this.last_sugkeywords === wordslength)
            return this.sugKeywords;
        this.last_sugkeywords = wordslength;

        let sugMainKeyWord = null;
        let sugSecKeyWords = [];
        for (let [word, stat] of this.getWordsStats()) {
            // Get dictionary entry for current word
            let curWordDict = this.getDictionaryEntry(word);
            // Check if the actual word is candidate for MainKeyWord
            if (!sugMainKeyWord || sugSecKeyWords.length < this.noOfSugKeyWords) {
                if (curWordDict && curWordDict.type) {
                    //Exclude conjunctions
                    if (!curWordDict.type.includes('conjunction')
                            && curWordDict.type !== 'article'
                            && !curWordDict.type.includes('pronom')) {
                        if (!sugMainKeyWord)
                            sugMainKeyWord = word;
                        else
                            sugSecKeyWords.push(word);
                    }
                } else {
                    // If there is no word information its candidate
                    if (!sugMainKeyWord)
                        sugMainKeyWord = word;
                    else
                        sugSecKeyWords.push(word);
                }
            } else {
                // Break search if mainkeyword and seckeywords are found
                break;
            }
        }

        this.sugKeywords = {
            mainKeyWord: sugMainKeyWord,
            secKeyWords: sugSecKeyWords
        };

        return this.sugKeywords;
    }

    /**
     * Checks if the given word occures to seldom, right or to much.
     * 
     * @param {String} word that should occure
     * @param {Number} min Minimum wished percentage
     * @param {Number} max Maximum wished percentage
     * @returns {Number} -1 if the word occurs to seldom, 1 if to often, 0 otherwise
     */
    getWordTargetOccur(word, min, max) {
        // Get number of occurences of the main keyword
        let mainKeyWordStat = this.getWordsStats().get(word);
        if (mainKeyWordStat) {
            let mainKeyWordCount = mainKeyWordStat.occurences;
            // Get percentage of mainkeywords within text
            let mkwp = (mainKeyWordCount / this.getWordsLength() * 100);
            if (mkwp < min) {
                return -1;
            } else if (mkwp > max) {
                return 1;
            } else {
                return 0;
            }
        } else {
            return -1;
        }
    }

    /**
     * Get the positions of the given word
     * 
     * @param {String[]} texts Texts where to search the word
     * @param {String} word Word to search
     * @returns {Array|TextAnalysis.getWordTextsPositions.positions}
     */
    getWordTextsPositions(texts, word) {
        let positions = [];
        for (let curText of texts) {
            let textpos = {
                firstpos: curText.indexOf(word)
                        //positions: this.getWordTextOccure(curText, word)
            };
            positions.push(textpos);
        }
        return positions;
    }

    /*
     * Gets the word that is present at a specified position.
     * 
     * @param {int} pos Position where to search
     * @returns {unresolved}
     */
    getWordAtPosition(pos) {
        // Search before word border
        let startPos = 0;
        for (let curPos = pos; curPos > 0; curPos--) {
            if (this.wordBorderChars.includes(this.text.charAt(curPos))) {
                startPos = curPos + 1;
                break;
            }
        }

        // Search after word border
        let endPos = this.text.length;
        for (let curPos = pos; curPos < this.text.length; curPos++) {
            if (this.wordBorderChars.includes(this.text.charAt(curPos))) {
                endPos = curPos;
                break;
            }
        }
        // Get word
        let word = this.text.substring(startPos, endPos);
        return word;
    }

    /**
     * Get the positions where the searched word occure in the given text.
     * 
     * @param {String} text Text where to search
     * @param {String} word Word to search
     * @returns {Number[]} Array of the positions of the word occurence
     */
    getWordTextOccure(text, word) {
        let regx = word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        let re = new RegExp(regx, 'g');
        let founds = text.content.match(re);
        console.log('search word: ' + word);
        console.log(founds);
    }

    /**
     * Get the number of headlines in text
     * 
     * @returns {Number} Number of headlines
     */
    getHeadlinesLength() {
        return (this.text.match(/<[h|H]\d+>/g) || []).length;
    }

    /**
     * Get a list of all headlines in the document
     * 
     * @returns {Array|TextAnalysis.getHeadlinesList.headlines}
     */
    getHeadlinesList() {
        let headlineElems = this.textdom.querySelectorAll('h1, h2, h3, h4, h5, h6');
        let headlines = [];
        for (let curHeadlineElem of headlineElems) {
            let hl = {
                content: curHeadlineElem.textContent,
                elem: curHeadlineElem
            };
            headlines.push(hl);
        }
        return headlines;
    }

    /**
     * Get all headlines with their understanded hierarchy
     * 
     * @returns {Object} Object with headline information (name, elem, childs:[])
     */
    getHeadlinesStructure() {
        let curHeadlines = this.getHeadlinesLength();
        if (this.last_headlines === curHeadlines)
            return this.headlines;

        // Put text into a DOM element
        let textdom = document.createElement('span');
        textdom.innerHTML = this.text;

        // Create new table if not given
        let lastSubTable = {
            name: "root",
            elem: null,
            childs: []
        };
        this.headlines = lastSubTable;

        let lastHSize = 0;
        for (let curHeadline of textdom.childNodes) {
            if (curHeadline.nodeName.match(/^[h|H]/)) {
                let curHSize = parseInt(curHeadline.nodeName.match(/\d+/));
                if (curHSize > lastHSize) {
                    let subTable = {
                        name: curHeadline.innerHTML,
                        elem: curHeadline,
                        parent: lastSubTable,
                        childs: []
                    };
                    // Add to parent
                    lastSubTable.childs.push(subTable);
                    lastSubTable = subTable;
                } else if (curHSize === lastHSize) {
                    let subTable = {
                        name: curHeadline.innerHTML,
                        elem: curHeadline,
                        parent: lastSubTable.parent,
                        childs: []
                    };
                    // Add to parent of sibling
                    lastSubTable.parent.childs.push(subTable);
                    lastSubTable = subTable;
                } else if (curHSize < lastHSize) {
                    let dist = lastHSize - curHSize;
                    let parent = lastSubTable.parent;
                    for (let i = 0; i < dist; i++) {
                        parent = parent.parent;
                    }

                    let subTable = {
                        name: curHeadline.innerHTML,
                        elem: curHeadline,
                        parent: parent,
                        childs: []
                    };
                    // Add to parent of the parent as sibling
                    parent.childs.push(subTable);
                    lastSubTable = parent;
                }
                lastHSize = curHSize;
            }
        }

        return this.headlines;
    }

}
