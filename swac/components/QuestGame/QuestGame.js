import SWAC from '../../swac.js';
import View from '../../View.js';
import Msg from '../../Msg.js';

/**
 * Sample component for development of own components
 */
export default class QuestGame extends View {

    /*
     * Constructs a new component object and transfers the config to the
     * object
     */
    constructor(options = {}) {
        super(options);
        this.name = 'QuestGame';
        this.desc.text = 'Component for creating quest games.';
        this.desc.developers = 'Florian Fehring';
        this.desc.license = 'Closed License';

        // Include an external library that does not use export
        // Include files that use export by import statement at start of the file

//        this.desc.depends[1] = {
//            name: 'NameOfTheAlgorithmComponent',
//            algorithm: 'NameOfTheAlgorithmComponent',
//            desc: 'Description why this algorithm is needed.'
//        };
        this.desc.templates[0] = {
            name: 'default',
            style: 'urban-fantasy',
            desc: 'Default template.'
        };
//        this.desc.reqPerTpl[0] = {
//            selc: 'cssSelectorForRequiredElement',
//            desc: 'Description why the element is expected in the template'
//        };
        this.desc.optPerTpl[0] = {
            selc: 'cssSelectorForOptionalElement',
            desc: 'Description what is the expected effect, when this element is in the template.'
        };
        this.desc.reqPerSet[0] = {
            name: 'id',
            desc: 'The attribute id is required for the component to work properly.'
        };
        this.desc.optPerSet[0] = {
            name: 'nameOfTheAttributeOptionalInEachSet',
            desc: 'Description what is the expected effect, when this attribute is in the set.'
        };
        // opts ids over 1000 are reserved for Component independend options
        this.desc.opts[0] = {
            name: "OptionsName",
            desc: "This is the description of an option",
            example: {
                some1: "This is an example config for configuration",
                some2: "It can be any object / string / value",
                func1: function (t) {
                    t.do();
                }
            }
        };
        // Setting a default value, only applying when the options parameter does not contain this option
        if (!options.OptionsName)
            this.options.OptionsName = 'defaultvalue';
        // Sample for useing the general option showWhenNoData
        if (!options.showWhenNoData)
            this.options.showWhenNoData = true;

        // Internal attrtibutes
        this.currentStation = 1;
    }

    /*
     * This method will be called when the component is complete loaded
     * At this thime the template code is loaded, the data inserted into the 
     * template and even plugins are ready to use.
     */
    async init() {
        // here we can do what we want with the data and template.
    }

    /**
     * Method thats called before adding a dataset
     * This overrides the method from View.js
     * 
     * @param {Object} set Object with attributes to add
     * @returns {Object} (modified) set
     */
    beforeAddSet(set) {
        // You can check or transform the dataset here
        return set;
    }

    /**
     * Method thats called after a dataset was added.
     * This overrides the method from View.js
     * 
     * @param {Object} set Object with attributes to add
     * @param {DOMElement[]} repeateds Elements that where created as representation for the set
     * @returns {undefined}
     */
    afterAddSet(set, repeateds) {
        // Call Components afterAddSet and plugins afterAddSet
        super.afterAddSet(set, repeateds);

        // There should be only one repeated
        let repeatedElem = repeateds[0];

        if (set.id === 1) {
            repeatedElem.classList.remove('swac_dontdisplay');
        }

        // Get elements that change by type
        let nextBtn = repeatedElem.querySelector('.qg-next-btn');
        // Jump over button
        let jumpOverBtn = repeatedElem.querySelector('.qg-overjump-btn');
        jumpOverBtn.classList.add('swac_dontdisplay');

        // Change things depending on type
        if (set.type == 'intro') {
            nextBtn.innerHTML = 'Starten';
            nextBtn.setAttribute('swac_lang', 'start');
            nextBtn.addEventListener('click', () => {
                this.scrollUp();
                this.showStation(set.nextstation);
            });
        }
        if (set.type === 'way') {


            nextBtn.innerHTML = 'Wir sind angekommen';
            nextBtn.setAttribute('swac_lang', 'way_arrived');
            nextBtn.addEventListener('click', () => {
                this.scrollUp();
                this.showStation(set.nextstation);
            });
        }
        if (set.type === 'story') {


            nextBtn.innerHTML = 'Weiter';
            nextBtn.setAttribute('swac_lang', 'story_gofurther');
            nextBtn.addEventListener('click', () => {
                this.scrollUp();
                this.showStation(set.nextstation);
            });
        }
        if (set.type === 'npc-virtual') {


            nextBtn.innerHTML = 'Weiter';
            nextBtn.setAttribute('swac_lang', 'story_gofurther');
            nextBtn.addEventListener('click', () => {
                this.scrollUp();
                this.showStation(set.nextstation);
            });
        }
        if (set.type === 'npc-real') {


            nextBtn.innerHTML = 'Weiter';
            nextBtn.setAttribute('swac_lang', 'story_gofurther');
            nextBtn.addEventListener('click', () => {
                this.scrollUp();
                this.showStation(set.nextstation);
            });
        }


        if (set.type === 'question') {
            // Hints
            if (set.hints && Array.isArray(set.hints) && set.hints.length > 0) {
                let hintBlock = repeatedElem.querySelector('.qg-hints');
                let hintBtn = repeatedElem.querySelector('.qg-hint-btn');
                let hintList = repeatedElem.querySelector('.qg-hint-list');

                hintBlock.classList.remove('swac_dontdisplay');

                let hintIndex = 0;

                hintBtn.addEventListener('click', () => {

                    // nächsten Hinweis holen
                    let nextHint = set.hints[hintIndex];

                    // neuen Listeneintrag erzeugen
                    let li = document.createElement('li');
                    li.innerHTML = nextHint;
                    hintList.appendChild(li);

                    // Index erhöhen
                    hintIndex++;

                    // Button-Text anpassen
                    if (hintIndex < set.hints.length) {
                        hintBtn.innerText = "Weiterer Hinweis";
                    } else {
                        hintBtn.innerText = "Alle Hinweise angezeigt";
                        hintBtn.disabled = true;
                    }
                });
            }

            // Create selection
            if (set.answertype === 'choice') {
                let answerTpl = repeatedElem.querySelector('.qg-repeat_for_answer-option');
                let answertype;
                if (Array.isArray(set.correctanswers) && set.correctanswers.length === 1) {
                    answertype = "radio";
                } else {
                    answertype = "checkbox";
                }
                // Go trough possible answers
                for (let curPosAnswer of set.possibleanswers) {
                    let curAnswerElem = answerTpl.cloneNode(true);
                    curAnswerElem.classList.remove('qg-repeat_for_answer-option');
                    // Set input attributes
                    let curAnswerInputElem = curAnswerElem.querySelector('input');
                    curAnswerInputElem.setAttribute('type', answertype);
                    curAnswerInputElem.setAttribute('value', curPosAnswer);
                    // Set option text
                    let curAnswerTxtElem = curAnswerElem.querySelector('.qg-choiseanswer-option');
                    curAnswerTxtElem.innerHTML = curPosAnswer;
                    // Add answer option
                    answerTpl.parentElement.appendChild(curAnswerElem);

                    // If single choice add direct check
                    if (answertype === 'radio') {
                        curAnswerElem.addEventListener('click', () => {
                            const isCorrect = set.correctanswers.includes(curPosAnswer);

                            if (!isCorrect) {
                                // Hinweis anzeigen
                                let feedbackElem = repeatedElem.querySelector('.qg-feedback');
                                if (feedbackElem)
                                    feedbackElem.innerText = 'Leider falsch!';
                                return;
                            }

                            // richtige Antwort → weiter zur nächsten Station
                            this.showStation(set.nextstation);
                        });
                    }
                }

            } else if (set.answertype === 'text') {
                let answerInputElem = repeatedElem.querySelector('.qg-textanswer');
                answerInputElem.classList.remove('swac_dontdisplay');

            }

            // Configure 'check' button
            nextBtn.innerHTML = 'Antwort prüfen';
            nextBtn.setAttribute('swac_lang', 'question_check');

            if (set.answertype === 'text') {
                nextBtn.addEventListener('click', () => {
                    let inputElem = repeatedElem.querySelector('.qg-textanswer input');
                    let userAnswer = inputElem.value.trim().toLowerCase();

                    // mehrere korrekte Antworten möglich
                    let correctAnswers = set.correctanswers.map(a => a.trim().toLowerCase());

                    let isCorrect = correctAnswers.includes(userAnswer);

                    if (!isCorrect) {
                        let feedbackElem = repeatedElem.querySelector('.qg-feedback');
                        if (feedbackElem)
                            feedbackElem.innerText = 'Leider falsch!';
                        return; // nicht weitergehen
                    }

                    // Wenn keine Textfrage oder Antwort korrekt → weiter
                    this.showStation(set.nextstation);
                });
            }

            // Configure jump over button
            jumpOverBtn.classList.remove('swac_dontdisplay');
            jumpOverBtn.addEventListener('click', () => {
                this.scrollUp();
                this.showStation(set.nextstation);
            });
        }

        if (set.type === 'afterinfos') {


            nextBtn.innerHTML = 'Weiter';
            nextBtn.setAttribute('swac_lang', 'afterinfo_gofurther');
            nextBtn.addEventListener('click', () => {
                this.scrollUp();
                this.showStation(set.nextstation);
            });
        }

        return;
    }

    showStation(newStationId) {
        if (newStationId == 0) {
            UIkit.modal('#spende-modal').show();
            return;
        }

        let oldElems = this.requestor.querySelectorAll('.swac_repeatedForSet');
        for (let curElem of oldElems)
            curElem.classList.add('swac_dontdisplay');
        let newElem = this.requestor.querySelector('[swac_id="' + newStationId + '"]');
        newElem.classList.remove('swac_dontdisplay');
        this.currentStation = newStationId;
    }

    scrollUp() {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }

}


