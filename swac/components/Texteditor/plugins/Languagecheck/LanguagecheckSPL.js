import SWAC from '../../../../swac.js';
import Msg from '../../../../Msg.js';
import Plugin from '../../../../Plugin.js'

export default class LanguagecheckSPL extends Plugin {

    constructor(pluginconf) {
        super(pluginconf);
        this.name = 'texteditor/plugins/Languagecheck';
        this.desc.depends[0] = {
            name: 'TextAnalysis.js',
            path: SWAC.config.swac_root + 'algorithms/TextAnalysis.js',
            desc: 'Class with algorithms for text analysis'
        };
        this.desc.depends[1] = {
            name: 'he.js',
            path: SWAC.config.swac_root + 'libs/he/he.min.js',
            desc: 'Library for encoding / decoding html'
        };
        this.desc.templates[0] = {
            name: 'languagecheck',
            style: 'languagecheck',
            desc: 'Default template for showing language check results'
        };
        this.desc.optPerTpl[0] = {
            selc: '.swac_texteditor_lang',
            desc: 'Place where to display the language information.'
        };
        this.desc.optPerTpl[0] = {
            selc: '.swac_texteditor_docswitch',
            desc: 'If switching is possible by useing this element the plugin listens for a swith to calculate stats for the actual shown document.'
        };
        this.desc.optPerTpl[1] = {
            selc: '.swac_texteditor_stat_chars',
            desc: 'Place where to show the number of chars in document.'
        };
        this.desc.optPerTpl[2] = {
            selc: '.swac_texteditor_stat_sentences',
            desc: 'Place where to show the number of sentences in document.'
        };
        this.desc.optPerTpl[3] = {
            selc: '.swac_texteditor_stat_words',
            desc: 'Place where to show the number of words in document.'
        };
        this.desc.optPerTpl[4] = {
            selc: '.swac_texteditor_stat_wordspersentence',
            desc: 'Place where to show the average number of words per sentence.'
        };
        this.desc.optPerTpl[5] = {
            selc: '.swac_texteditor_stat_partspersentence',
            desc: 'Place where to show the average number of parts per sentence.'
        };
        this.desc.optPerTpl[6] = {
            selc: '.swac_texteditor_repeatForWord',
            desc: 'Area that should be repeated for every word in the document.'
        };
        this.desc.optPerTpl[7] = {
            selc: '.swac_texteditor_word',
            desc: 'Place where to enter the current word.'
        };
        this.desc.optPerTpl[8] = {
            selc: '.swac_texteditor_used',
            desc: 'Place where to enter how often the current word is used.'
        };
        this.desc.optPerTpl[9] = {
            selc: '.swac_texteditor_quality_readability_fre',
            desc: 'Place where to display the readabilit after Flash-Reading-Ease.'
        };
        this.desc.optPerTpl[10] = {
            selc: '.swac_texteditor_quality_readability_fre',
            desc: 'Place where to display the readabilit after Wiener Sachtext Formel.'
        };
        this.desc.optPerTpl[11] = {
            selc: '.swac_texteditor_quality_intelligibility',
            desc: 'Place where to display the intelligibility.'
        };
        this.desc.optPerTpl[12] = {
            selc: '.swac_texteditor_quality_tqap',
            desc: 'Place where to display the Text Question Answer Propability (TQAP) level.'
        };
        this.desc.optPerTpl[13] = {
            selc: '.swac_texteditor_repeatForKeyword',
            desc: 'Area that should be repeated for every given or calculated keyword.'
        };
        this.desc.optPerTpl[14] = {
            selc: '.swac_texteditor_keyword',
            desc: 'Place where to display a keyword.'
        };

        // Set default options
//        this.desc.opts[0] = {
//            name: 'showdatalabels',
//            desc: 'If true the values of the data points are shown in the diagram'
//        };
//        this.options.showdatalabels = false;

        this.desc.opts[0] = {
            name: 'show_details',
            desc: 'If true details of calculations are shown.'
        };
        if (!pluginconf.show_details)
            this.options.show_details = true;
        this.desc.opts[1] = {
            name: 'show_options',
            desc: 'If true options for calculations are shown.'
        };
        if (!pluginconf.show_options)
            this.options.show_options = true;
        this.desc.opts[2] = {
            name: 'fre_factors',
            desc: 'Defines factors for the FRE calculation (base, asl and asw)'
        };
        if (!pluginconf.fre_factors)
            this.options.fre_factors = null;
        this.desc.opts[3] = {
            name: 'wsf_variant',
            desc: 'Number of the variant of the WSF.'
        };
        if (!pluginconf.wsf_variant)
            this.options.wsf_variant = 1;
        this.desc.opts[4] = {
            name: 'int_factors',
            desc: 'Factors for the calculation of INT.'
        };
        if (!pluginconf.int_factors)
            this.options.int_factors = null;

        // Internal attributes

    }

    init() {
        return new Promise((resolve, reject) => {
            // Check if content area is available
            if (!this.contElements || this.contElements.length === 0) {
                Msg.error('LanguagecheckSPL', 'This plugin needs a contElement to insert the chart.', this.requestor);
            }

            // Register event handlers for updateing displys when changeing tab
            let docSwitcher = this.requestor.parent.querySelector('.swac_texteditor_docswitch');
            if (docSwitcher) {
                docSwitcher.addEventListener('show', function (evt) {
                    thisRef.createStatistic();
                });
            }

            // Register event handlers for updateing displays when typing
            let thisRef = this;
            for (let curEd of tinymce.editors) {
                curEd.on('KeyUp', function (e) {
                    if (e.keyCode !== 17)
                        thisRef.createStatistic();
                });
            }

            // Add functionality to recalc button
            let calcFREBtn = this.requestor.parent.querySelector('.swac_texteditor_quality_fre_recalc');
            if (calcFREBtn) {
                calcFREBtn.addEventListener('click', this.onRecalcFRE.bind(this));
            }
            let calcWSFBtn = this.requestor.parent.querySelector('.swac_texteditor_quality_wsf_recalc');
            if (calcWSFBtn) {
                calcWSFBtn.addEventListener('click', this.onRecalcWSF.bind(this));
            }
            let calcINTBtn = this.requestor.parent.querySelector('.swac_texteditor_quality_int_recalc');
            if (calcINTBtn) {
                calcINTBtn.addEventListener('click', this.onRecalcINT.bind(this));
            }

            // Create initial stats
            this.createStatistic();
            resolve();
        });
    }

    /**
     * Displays statistic data of the content
     * 
     * @returns {undefined}
     */
    createStatistic() {
        // get active tab
        let docSwitcher = this.requestor.parent.querySelector('.swac_texteditor_docswitch');
        if (docSwitcher) {
            let activeTab = docSwitcher.querySelector('.uk-active');
            let tiny = tinymce.get(activeTab.querySelector('.swac_texteditor_area').id);
            tiny.focus();
        }

        let content = tinymce.activeEditor.getContent();

        if (!this.ta && content.length > 0) {
            let thisRef = this;
            this.ta = new TextAnalysis();
            this.ta.init().then(function () {
                thisRef.showStatistic(content);
            });
        } else if (content.length > 0) {
            this.showStatistic(content);
        } else {
            this.resetStatistic();
        }
    }

    /**
     * Shows the statistic of the given text
     * 
     * @param {String} text Text that should be analysed
     * @param {String} lang Languagecode of the texts language
     * @returns {undefined}
     */
    showStatistic(text, lang) {
        this.ta.setText(text);
        if (lang) {
            this.ta.setLang(lang);
        }

        let langElem = this.requestor.parent.querySelector('.swac_texteditor_lang');
        if (langElem)
            langElem.innerHTML = SWAC.lang.dict.Texteditor.languagecheck['lang_' + this.ta.getLang()];

        let stat_charsElem = this.requestor.parent.querySelector('.swac_texteditor_stat_chars');
        if (stat_charsElem)
            stat_charsElem.innerHTML = this.ta.getCharsLength();

        let stat_sentencesElem = this.requestor.parent.querySelector('.swac_texteditor_stat_sentences');
        if (stat_sentencesElem)
            stat_sentencesElem.innerHTML = this.ta.getSentencesLength();

        let words = this.ta.getWordsLength();
        let stat_wordsElem = this.requestor.parent.querySelector('.swac_texteditor_stat_words');
        if (stat_wordsElem)
            stat_wordsElem.innerHTML = words;

        let means = this.ta.getSentencesStatsMeans();

        let stat_wordsPerSentenceElem = this.requestor.parent.querySelector('.swac_texteditor_stat_wordspersentence');
        if (stat_wordsPerSentenceElem)
            stat_wordsPerSentenceElem.innerHTML = means.aMeanWordcount.toFixed(2);

        let stat_partsPerSentenceElem = this.requestor.parent.querySelector('.swac_texteditor_stat_partspersentence');
        if (stat_partsPerSentenceElem)
            stat_partsPerSentenceElem.innerHTML = means.aMeanPartscount.toFixed(2);

        // Remove all existing word statistic
        let repeatedForWordsElems = this.requestor.parent.querySelectorAll('.swac_texteditor_repeatedForWord');
        for (let curRepForWordElem of repeatedForWordsElems) {
            curRepForWordElem.parentNode.removeChild(curRepForWordElem);
        }

        let repeatForWordElem = this.requestor.parent.querySelector('.swac_texteditor_repeatForWord');
        for (let [word, stat] of this.ta.getWordsStats()) {
            let percentage = (stat.occurences / words * 100).toFixed(2);
            let newTd = repeatForWordElem.cloneNode(true);
            newTd.classList.remove('swac_texteditor_repeatForWord');
            newTd.classList.add('swac_texteditor_repeatedForWord');
            newTd.querySelector('.swac_texteditor_word').innerHTML = word;
            newTd.querySelector('.swac_texteditor_used').innerHTML = stat.occurences
                    + ' ~ ' + percentage + '%';
            repeatForWordElem.parentNode.appendChild(newTd);
        }

        // Create readability statistic FRE
        let freElem = this.requestor.parent.querySelector('.swac_texteditor_quality_readability_fre');
        if (freElem)
            freElem.innerHTML = SWAC.lang.dict.Texteditor.languagecheck['fre_level_' + this.ta.calcFRELevel(this.options.fre_factors)];
        let fredetElem = this.requestor.parent.querySelector('.swac_texteditor_quality_fre_details');
        if (fredetElem && this.options.show_details) {
            let fre = this.ta.calcFRE(this.options.fre_factors);
            let aslElem = fredetElem.querySelector('.swac_texteditor_quality_fre_asl');
            aslElem.innerHTML = fre.asl.toFixed(2);
            let aswElem = fredetElem.querySelector('.swac_texteditor_quality_fre_asw');
            aswElem.innerHTML = fre.asw.toFixed(2);
        } else {
            fredetElem.parentNode.removeChild(fredetElem);
        }
        let freoptElem = this.requestor.parent.querySelector('.swac_texteditor_quality_fre_options');
        if (freoptElem && this.options.show_options) {
            let fre = this.ta.calcFRE(this.options.fre_factors);
            let baseElem = freoptElem.querySelector('#swac_texteditor_quality_fre_base');
            baseElem.value = fre.factors.base;
            let aslElem = freoptElem.querySelector('#swac_texteditor_quality_fre_aslfactor');
            aslElem.value = fre.factors.asl;
            let aswElem = freoptElem.querySelector('#swac_texteditor_quality_fre_aswfactor');
            aswElem.value = fre.factors.asw;
        } else {
            freoptElem.parentNode.removeChild(freoptElem);
        }

        // Create readability statistic WSF
        let wsfElem = this.requestor.parent.querySelector('.swac_texteditor_quality_readability_wsf');
        if (wsfElem)
            wsfElem.innerHTML = SWAC.lang.dict.Texteditor.languagecheck['wsf_level_' + this.ta.calcWSFLevel()];
        let wsfdetElem = this.requestor.parent.querySelector('.swac_texteditor_quality_wsf_details');
        if (wsfdetElem && this.options.show_details) {
            let wsf = this.ta.calcWSF(this.options.wsf_variant);
            let msElem = wsfdetElem.querySelector('.swac_texteditor_quality_wsf_ms');
            msElem.innerHTML = wsf.ms.toFixed(2);
            let iwElem = wsfdetElem.querySelector('.swac_texteditor_quality_wsf_iw');
            iwElem.innerHTML = wsf.iw.toFixed(2);
            let slElem = wsfdetElem.querySelector('.swac_texteditor_quality_wsf_sl');
            slElem.innerHTML = wsf.sl.toFixed(2);
            let esElem = wsfdetElem.querySelector('.swac_texteditor_quality_wsf_es');
            esElem.innerHTML = wsf.es.toFixed(2);
        } else {
            wsfdetElem.parentNode.removeChild(wsfdetElem);
        }
        let wsfoptElem = this.requestor.parent.querySelector('.swac_texteditor_quality_wsf_options');
        if (wsfoptElem && this.options.show_options) {
            let variantElem = wsfoptElem.querySelector('#swac_texteditor_quality_wsf_variant [value="' + this.options.wsf_variant + '"]');
            variantElem.setAttribute('selected', 'selected');
        }

        // Create readability statistic intelligibility
        let intliElem = this.requestor.parent.querySelector('.swac_texteditor_quality_intelligibility');
        if (intliElem)
            intliElem.innerHTML = SWAC.lang.dict.Texteditor.languagecheck['wsf_level_' + this.ta.calcIntelligibilityLevel(this.options.int_factors)];
        let intdetElem = this.requestor.parent.querySelector('.swac_texteditor_quality_int_details');
        if (intdetElem && this.options.show_details) {
            let int = this.ta.calcIntelligibility(this.options.int_factors);
            let nwsElem = intdetElem.querySelector('.swac_texteditor_quality_int_nws');
            nwsElem.innerHTML = int.nws.toFixed(2);
            let npsElem = intdetElem.querySelector('.swac_texteditor_quality_int_nps');
            npsElem.innerHTML = int.nps.toFixed(2);
            let ncsElem = intdetElem.querySelector('.swac_texteditor_quality_int_ncs');
            ncsElem.innerHTML = int.ncs.toFixed(2);
            let arwElem = intdetElem.querySelector('.swac_texteditor_quality_int_arw');
            arwElem.innerHTML = int.arw.toFixed(2);
            let afwElem = intdetElem.querySelector('.swac_texteditor_quality_int_afw');
            afwElem.innerHTML = int.afw.toFixed(2);
            let nasElem = intdetElem.querySelector('.swac_texteditor_quality_int_nas');
            nasElem.innerHTML = int.arw.toFixed(2);
        } else {
            intdetElem.parentNode.removeChild(intdetElem);
        }
        let intoptElem = this.requestor.parent.querySelector('.swac_texteditor_quality_int_options');
        if (intoptElem && this.options.show_options) {
            let int = this.ta.calcIntelligibility(this.options.int_factors);

            let nwsElem = intoptElem.querySelector('#swac_texteditor_quality_int_nwsfactor');
            nwsElem.value = int.factors.nws;
            let npsElem = intoptElem.querySelector('#swac_texteditor_quality_int_npsfactor');
            npsElem.value = int.factors.nps;
            let ncsElem = intoptElem.querySelector('#swac_texteditor_quality_int_ncsfactor');
            ncsElem.value = int.factors.ncs;
            let arwElem = intoptElem.querySelector('#swac_texteditor_quality_int_arwfactor');
            arwElem.value = int.factors.arw;
            let afwElem = intoptElem.querySelector('#swac_texteditor_quality_int_afwfactor');
            afwElem.value = int.factors.afw;
            let nasElem = intoptElem.querySelector('#swac_texteditor_quality_int_nasfactor');
            nasElem.value = int.factors.nas;
        } else {
            intoptElem.parentNode.removeChild(intoptElem);
        }


        let tqapElem = this.requestor.parent.querySelector('.swac_texteditor_quality_tqap');
        if (tqapElem)
            tqapElem.innerHTML = SWAC.lang.dict.Texteditor.languagecheck['tqap_level_' + this.ta.calcTQAPLevel()];

        // Create list of keywords
        let repeatForKeywordsElem = this.requestor.parent.querySelector('.swac_texteditor_repeatForKeyword');
        if (repeatForKeywordsElem) {
            // Remove keywords from old calculation
            let repeatedsForKeyElems = this.requestor.parent.querySelectorAll('.swac_texteditor_repeatedForKeyword');
            for (let curElem of repeatedsForKeyElems) {
                curElem.parentNode.removeChild(curElem);
            }
            let sugKeywords = this.ta.getKeywords();
            let keywords = [sugKeywords.mainKeyWord];
            keywords = keywords.concat(sugKeywords.secKeyWords);
            // List secondary keywords
            for (let curKeyword of keywords) {
                let newKeywordElem = repeatForKeywordsElem.cloneNode(true);
                newKeywordElem.classList.remove('swac_texteditor_repeatForKeyword');
                newKeywordElem.classList.add('swac_texteditor_repeatedForKeyword');
                let keynameElem = newKeywordElem.querySelector('.swac_texteditor_keyword');
                keynameElem.innerHTML = curKeyword;
                repeatForKeywordsElem.parentNode.appendChild(newKeywordElem);
            }
        }
    }

    /**
     * Resets the shown statistic to null values
     * 
     * @returns {undefined}
     */
    resetStatistic() {
        let langElem = this.requestor.parent.querySelector('.swac_texteditor_lang');
        if (langElem)
            langElem.innerHTML = SWAC.lang.dict.Texteditor.languagecheck.lang_none;

        let stat_charsElem = this.requestor.parent.querySelector('.swac_texteditor_stat_chars');
        if (stat_charsElem)
            stat_charsElem.innerHTML = 0;

        let stat_sentencesElem = this.requestor.parent.querySelector('.swac_texteditor_stat_sentences');
        if (stat_sentencesElem)
            stat_sentencesElem.innerHTML = 0;

        let stat_wordsElem = this.requestor.parent.querySelector('.swac_texteditor_stat_words');
        if (stat_wordsElem)
            stat_wordsElem.innerHTML = 0;

        let stat_wordsPerSentenceElem = this.requestor.parent.querySelector('.swac_texteditor_stat_wordspersentence');
        if (stat_wordsPerSentenceElem)
            stat_wordsPerSentenceElem.innerHTML = 0;

        let stat_partsPerSentenceElem = this.requestor.parent.querySelector('.swac_texteditor_stat_partspersentence');
        if (stat_partsPerSentenceElem)
            stat_partsPerSentenceElem.innerHTML = 0;

        // Remove all existing word statistic
        let repeatedForWordsElems = this.requestor.parent.querySelectorAll('.swac_texteditor_repeatedForWord');
        for (let curRepForWordElem of repeatedForWordsElems) {
            curRepForWordElem.parentNode.removeChild(curRepForWordElem);
        }

        // Create readability statistic FRE
        let freElem = this.requestor.parent.querySelector('.swac_texteditor_quality_readability_fre');
        if (freElem)
            freElem.innerHTML = SWAC.lang.dict.Texteditor.languagecheck.notcalculated;
        let fredetElem = this.requestor.parent.querySelector('.swac_texteditor_quality_fre_details');
        if (fredetElem && this.options.show_details) {
            let aslElem = fredetElem.querySelector('.swac_texteditor_quality_fre_asl');
            aslElem.innerHTML = SWAC.lang.dict.Texteditor.languagecheck.notcalculated;
            let aswElem = fredetElem.querySelector('.swac_texteditor_quality_fre_asw');
            aswElem.innerHTML = SWAC.lang.dict.Texteditor.languagecheck.notcalculated;
        } else {
            fredetElem.parentNode.removeChild(fredetElem);
        }
        let freoptElem = this.requestor.parent.querySelector('.swac_texteditor_quality_fre_options');
        if (freoptElem && this.options.show_options) {
            let baseElem = freoptElem.querySelector('#swac_texteditor_quality_fre_base');
            baseElem.value = SWAC.lang.dict.Texteditor.languagecheck.notcalculated;
            let aslElem = freoptElem.querySelector('#swac_texteditor_quality_fre_aslfactor');
            aslElem.value = SWAC.lang.dict.Texteditor.languagecheck.notcalculated;
            let aswElem = freoptElem.querySelector('#swac_texteditor_quality_fre_aswfactor');
            aswElem.value = SWAC.lang.dict.Texteditor.languagecheck.notcalculated;
        } else {
            freoptElem.parentNode.removeChild(freoptElem);
        }

        // Create readability statistic WSF
        let wsfElem = this.requestor.parent.querySelector('.swac_texteditor_quality_readability_wsf');
        if (wsfElem)
            wsfElem.innerHTML = SWAC.lang.dict.Texteditor.languagecheck.notcalculated;
        let wsfdetElem = this.requestor.parent.querySelector('.swac_texteditor_quality_wsf_details');
        if (wsfdetElem && this.options.show_details) {
            let msElem = wsfdetElem.querySelector('.swac_texteditor_quality_wsf_ms');
            msElem.innerHTML = SWAC.lang.dict.Texteditor.languagecheck.notcalculated;
            let iwElem = wsfdetElem.querySelector('.swac_texteditor_quality_wsf_iw');
            iwElem.innerHTML = SWAC.lang.dict.Texteditor.languagecheck.notcalculated;
            let slElem = wsfdetElem.querySelector('.swac_texteditor_quality_wsf_sl');
            slElem.innerHTML = SWAC.lang.dict.Texteditor.languagecheck.notcalculated;
            let esElem = wsfdetElem.querySelector('.swac_texteditor_quality_wsf_es');
            esElem.innerHTML = SWAC.lang.dict.Texteditor.languagecheck.notcalculated;
        } else {
            wsfdetElem.parentNode.removeChild(wsfdetElem);
        }
        let wsfoptElem = this.requestor.parent.querySelector('.swac_texteditor_quality_wsf_options');
        if (wsfoptElem && this.options.show_options) {
            let variantElem = wsfoptElem.querySelector('#swac_texteditor_quality_wsf_variant [value="' + this.options.wsf_variant + '"]');
            variantElem.setAttribute('selected', 'selected');
        }

        // Create readability statistic intelligibility
        let intliElem = this.requestor.parent.querySelector('.swac_texteditor_quality_intelligibility');
        if (intliElem)
            intliElem.innerHTML = SWAC.lang.dict.Texteditor.languagecheck.notcalculated;
        let intdetElem = this.requestor.parent.querySelector('.swac_texteditor_quality_int_details');
        if (intdetElem && this.options.show_details) {
            let nwsElem = intdetElem.querySelector('.swac_texteditor_quality_int_nws');
            nwsElem.innerHTML = SWAC.lang.dict.Texteditor.languagecheck.notcalculated;
            let npsElem = intdetElem.querySelector('.swac_texteditor_quality_int_nps');
            npsElem.innerHTML = SWAC.lang.dict.Texteditor.languagecheck.notcalculated;
            let ncsElem = intdetElem.querySelector('.swac_texteditor_quality_int_ncs');
            ncsElem.innerHTML = v.Texteditor.languagecheck.notcalculated;
            let arwElem = intdetElem.querySelector('.swac_texteditor_quality_int_arw');
            arwElem.innerHTML = SWAC.lang.dict.Texteditor.languagecheck.notcalculated;
            let afwElem = intdetElem.querySelector('.swac_texteditor_quality_int_afw');
            afwElem.innerHTML = SWAC.lang.dict.Texteditor.languagecheck.notcalculated;
            let nasElem = intdetElem.querySelector('.swac_texteditor_quality_int_nas');
            nasElem.innerHTML = SWAC.lang.dict.Texteditor.languagecheck.notcalculated;
        } else {
            intdetElem.parentNode.removeChild(intdetElem);
        }

        let intoptElem = this.requestor.parent.querySelector('.swac_texteditor_quality_int_options');
        if (intoptElem && this.options.show_details) {
            let nwsElem = intoptElem.querySelector('#swac_texteditor_quality_int_nwsfactor');
            nwsElem.value = 0.05;
            let npsElem = intoptElem.querySelector('#swac_texteditor_quality_int_npsfactor');
            npsElem.value = 0.50;
            let ncsElem = intoptElem.querySelector('#swac_texteditor_quality_int_ncsfactor');
            ncsElem.value = 0.50;
            let arwElem = intoptElem.querySelector('#swac_texteditor_quality_int_arwfactor');
            arwElem.value = 0.50;
            let afwElem = intoptElem.querySelector('#swac_texteditor_quality_int_afwfactor');
            afwElem.value = 0.25;
            let nasElem = intoptElem.querySelector('#swac_texteditor_quality_int_nasfactor');
            nasElem.value = 0.45;
        } else {
            intoptElem.parentNode.removeChild(intoptElem);
        }

        let tqapElem = this.requestor.parent.querySelector('.swac_texteditor_quality_tqap');
        if (tqapElem)
            tqapElem.innerHTML = SWAC.lang.dict.Texteditor.languagecheck.notcalculated;

        // Create list of keywords
        let repeatForKeywordsElem = this.requestor.parent.querySelector('.swac_texteditor_repeatForKeyword');
        if (repeatForKeywordsElem) {
            // Remove keywords from old calculation
            let repeatedsForKeyElems = this.requestor.parent.querySelectorAll('.swac_texteditor_repeatedForKeyword');
            for (let curElem of repeatedsForKeyElems) {
                curElem.parentNode.removeChild(curElem);
            }
        }
    }

    /**
     * Method for execution after click on recalculation button for FRE
     * 
     * @param {DOMEvent} evt The event that calls the method
     * @returns {undefined}
     */
    onRecalcFRE(evt) {
        evt.preventDefault();
        let freoptElem = this.requestor.parent.querySelector('.swac_texteditor_quality_fre_options');

        let factors = {};
        let baseElem = freoptElem.querySelector('#swac_texteditor_quality_fre_base');
        factors.base = baseElem.value;
        let aslElem = freoptElem.querySelector('#swac_texteditor_quality_fre_aslfactor');
        factors.asl = aslElem.value;
        let aswElem = freoptElem.querySelector('#swac_texteditor_quality_fre_aswfactor');
        factors.asw = aswElem.value;

        this.options.fre_factors = factors;

        this.createStatistic();
    }

    /**
     * Method for execution after click on recalculation button for WSF
     * 
     * @param {DOMEvent} evt The event that calls the method
     * @returns {undefined}
     */
    onRecalcWSF(evt) {
        evt.preventDefault();
        let variantElem = this.requestor.parent.querySelector('#swac_texteditor_quality_wsf_variant');
        let selectedElem = variantElem.options[variantElem.selectedIndex];
        this.options.wsf_variant = selectedElem.value;
        this.createStatistic();
    }

    /**
     * Method for execution after click on recalculation button for INT
     * 
     * @param {DOMEvent} evt The event that calls the method
     * @returns {undefined}
     */
    onRecalcINT(evt) {
        evt.preventDefault();
        let intoptElem = this.requestor.parent.querySelector('.swac_texteditor_quality_int_options');

        let factors = {};
        let nwsElem = intoptElem.querySelector('#swac_texteditor_quality_int_nwsfactor');
        factors.nws = nwsElem.value;
        let npsElem = intoptElem.querySelector('#swac_texteditor_quality_int_npsfactor');
        factors.nps = npsElem.value;
        let ncsElem = intoptElem.querySelector('#swac_texteditor_quality_int_ncsfactor');
        factors.ncs = ncsElem.value;
        let arwElem = intoptElem.querySelector('#swac_texteditor_quality_int_arwfactor');
        factors.arw = arwElem.value;
        let afwElem = intoptElem.querySelector('#swac_texteditor_quality_int_afwfactor');
        factors.afw = afwElem.value;
        let nasElem = intoptElem.querySelector('#swac_texteditor_quality_int_nasfactor');
        factors.nas = nasElem.value;
        this.options.int_factors = factors;

        this.createStatistic();
    }
}
