// SPDX-License-Identifier: LicenseRef-Proprietary
/**
 * PREMIUM component
 * 
 * This SWAC component is NOT open source.
 * Copyright by Florian Fehring
 */

import SWAC from '../../swac.js';
import Model from '../../Model.js';
import View from '../../View.js';
import Msg from '../../Msg.js';

/**
 * Component for question users
 * 
 * This is a PREMIUM component
 * It is NOT open source.
 * 
 * Copyright 2020 by Florian Fehring
 */
export default class Question extends View {

    constructor(options = {}) {
        super(options);
        this.name = 'Question';
        this.desc.text = 'Component for questioning users with a nice userinterface.';
        this.desc.developers = 'Florian Fehring';
        this.desc.license = '(c) by Florian Fehring';

        this.desc.templates[0] = {
            name: 'list',
            style: 'list',
            desc: 'Show all questions at once in a list'
        };
        this.desc.reqPerTpl[0] = {
            selc: '.swac_question',
            desc: 'Element containing the question structure'
        };
        this.desc.reqPerTpl[1] = {
            selc: '.swac_question_question',
            desc: 'Element containing the question text'
        };
        this.desc.reqPerTpl[2] = {
            selc: '.swac_question_answerContainer',
            desc: 'Element where the anwer input elements are placed in.'
        };
        this.desc.reqPerTpl[3] = {
            selc: '.swac_question_noty',
            desc: 'Element within the swac_repeatForSet that is used to display messages related to the userinput. (example: error messages)'
        };
        this.desc.reqPerTpl[4] = {
            selc: '.swac_question_msg',
            desc: 'Element where a message after saveing the data is displayed.'
        };
        this.desc.reqPerTpl[5] = {
            selc: '.swac_question_sendbutton',
            desc: 'Button that sends the answers after click.'
        };
        this.desc.optPerTpl[0] = {
            selc: '.swac_question_countdown',
            desc: 'Element where to display a countdown, after thats end the question can be reanswered.'
        };

        this.desc.reqPerSet[0] = {
            name: 'id',
            desc: 'The attribute id is required for the component to work properly.'
        };
        this.desc.reqPerSet[1] = {
            name: 'question',
            desc: 'The question.'
        };
        this.desc.reqPerSet[2] = {
            name: 'type',
            desc: 'The questions type. [group|text|number|range|select|icon|datetime]'
        };
        this.desc.optPerSet[0] = {
            name: 'name',
            desc: 'Questions name. This forms a headline about the question.'
        };
        this.desc.optPerSet[1] = {
            name: 'options',
            desc: 'A list of possible answers. If type = icon, this is a list of icon names.'
        };
        this.desc.optPerSet[2] = {
            name: 'min',
            desc: 'Minimum value for types [number|range]'
        };
        this.desc.optPerSet[3] = {
            name: 'max',
            desc: 'Maximum value for types [number|range]'
        };
        this.desc.optPerSet[4] = {
            name: 'attr',
            desc: 'Name of the attribute the answer will stored in. Required for all types without group.'
        };
        this.desc.optPerSet[5] = {
            name: 'target',
            desc: 'Reference to the interface the data should be send to. If not given at a question it must be given at a group.'
        };
        this.desc.optPerSet[6] = {
            name: 'required',
            desc: 'If set to ture this question must be answerd, otherwise its optional.'
        };
        this.desc.optPerSet[7] = {
            name: 'default',
            desc: 'If set this is the default answer to the question.'
        };
        this.desc.optPerSet[8] = {
            name: 'multiple',
            desc: 'If set to true the selection of more than one option is possible. Works for select and icon type.'
        };
        this.desc.optPerSet[9] = {
            name: 'parent',
            desc: 'Id of the parent dataset, to create an clustering of questions.'
        };

        this.desc.opts[0] = {
            name: "timeToReanswer",
            desc: "The time (in seconds) that should pass before the user can reanswer.",
            example: 180
        };
        if (!options.timeToReanswer)
            this.options.timeToReanswer = null;
        this.desc.opts[1] = {
            name: "afterSaveTxt",
            desc: "Text which sould be displayed to the user after sending data."
        };
        this.desc.opts[2] = {
            name: "afterSaveLoc",
            desc: "URL to wich the user should be redirected after sendin data.",
            example: '../mypage.html',
        };
        if (!options.afterSaveLoc)
            this.options.afterSaveLoc = null;
        this.desc.opts[3] = {
            name: "afterInputFunction",
            desc: "A function that should be executed directly after the user made a input.",
            example: function () {}
        };
        if (!options.afterInputFunction)
            this.options.afterInputFunction = null;
    }

    init() {
        return new Promise((resolve, reject) => {
            // Bind eventlistener to save button
            let sendButtons = this.requestor.querySelectorAll('.swac_question_sendbutton');
            for (let curSendButton of sendButtons) {
                curSendButton.addEventListener('click', this.onSend.bind(this));
            }
            // Set default
            if (!this.options.afterSaveTxt)
                this.options.afterSaveTxt = SWAC.lang.dict.Question.aftersavetxt;
            resolve();
        });
    }

    afterAddSet(set, repeateds) {
        // Get created collectContainer
        let questionAreaElem = this.requestor.querySelector('[swac_setid="' + set.id + '"]');
        let collectContainerElem = questionAreaElem.querySelector('.swac_question_answerContainer');
        let inputElem;
        // Check if set has the attr attribute if not of type group
        if (set.type !== 'group' && !set.attr) {
            Msg.error('Question', 'The needed attribute >attr< is missing at question >' + set.id + '<', this.requestor);
        }

        // Create input element depending on type
        switch (set.type) {
            case 'group':
                break;
            case 'number':
                inputElem = this.createInputForHTMLInput(set);
                break;
            case 'range':
                inputElem = this.createInputForRange(set);
                break;
            case 'text':
                inputElem = this.createInputForText(set);
                break;
            case 'select':
                inputElem = this.createInputForSelect(set);
                break;
            case 'icon':
                inputElem = this.createInputForIcon(set);
                break;
            case 'datetime':
                inputElem = this.createInputForDateTime(set);
                break;
            default:
                Msg.warn('Question', 'Questiontype >' + set.type + '< is not supported.');
        }

//        let questInputElem = this.createQuestionInput(curSet, questionNo);
        if (inputElem)
            collectContainerElem.appendChild(inputElem);
//        questionNo++;
        return;
    }

    /**
     * Creates an input field for values that are directly supported by
     * HTML5
     * 
     * @param {Object} set Dataset defining the input
     * @returns {Element|Question.createInputForNumber.inputElem}
     */
    createInputForHTMLInput(set) {
        let divElem = document.createElement('div');
        divElem.swac_set = set;
        let inputElem = document.createElement('input');
        inputElem.setAttribute('name', set.attr);
        inputElem.setAttribute('type', set.type);
        inputElem.classList.add('uk-input');
        if (set.min) {
            inputElem.setAttribute('min', set.min);
        }
        if (set.max) {
            inputElem.setAttribute('max', set.max);
        }
        if (set.required) {
            inputElem.setAttribute('required', 'required');
        }
        divElem.appendChild(inputElem);
        return divElem;
    }

    /**
     * Create an input element for range selection
     * 
     * @param {Object} set Dataset defining the input
     * @returns {Element|Question.createInputForRange.divElem}
     */
    createInputForRange(set) {
        let divElem = document.createElement('div');
        divElem.swac_set = set;
        divElem.classList.add('swac_question_range');
        let rangeElem = document.createElement('div');
        let minElem = document.createElement('output');
        minElem.classList.add('swac_question_min');
        if (set.min)
            minElem.innerHTML = set.min;
        else
            minElem.innerHTML = 0;
        rangeElem.appendChild(minElem);
        let inputElem = document.createElement('input');
        inputElem.setAttribute('name', set.attr);
        inputElem.setAttribute('type', set.type);
        inputElem.setAttribute('value', 0);
        inputElem.classList.add('uk-input');
        inputElem.classList.add('uk-form-width-medium');
        if (set.min) {
            inputElem.setAttribute('min', set.min);
        }
        if (set.max) {
            inputElem.setAttribute('max', set.max);
        }
        if (set.required) {
            inputElem.setAttribute('required', 'required');
        }
        rangeElem.appendChild(inputElem);
        let maxElem = document.createElement('output');
        maxElem.classList.add('swac_question_max');
        if (set.max) {
            maxElem.innerHTML = set.max;
        } else {
            maxElem.innerHTML = 100 + '';
        }
        rangeElem.appendChild(maxElem);
        divElem.appendChild(rangeElem);
//        divElem.appendChild(document.createElement('br'));
        let valueElem = document.createElement('output');
        valueElem.classList.add('swac_question_rangevalue');
        inputElem.addEventListener('change', this.onChangeRange.bind(this));
        divElem.appendChild(valueElem);
        return divElem;
    }

    /**
     * Create an textarea element
     * 
     * @param {Object} set Dataset defining the input
     * @returns {Element|Question.createInputForRange.divElem}
     */
    createInputForText(set) {
        let divElem = document.createElement('div');
        divElem.swac_set = set;
        let inputElem = document.createElement('textarea');
        inputElem.setAttribute('name', set.attr);
        inputElem.classList.add('uk-textarea');
        if (set.min) {
            inputElem.setAttribute('minlength', set.min);
        }
        if (set.max) {
            inputElem.setAttribute('maxlength', set.max);
        }
        if (set.required) {
            inputElem.setAttribute('required', 'required');
        }
        divElem.appendChild(inputElem);
        return divElem;
    }

    /**
     * Create an select element
     * 
     * @param {Object} set Dataset defining the input
     * @returns {Element|Question.createInputForRange.divElem}
     */
    createInputForSelect(set) {
        let divElem = document.createElement('div');
        divElem.swac_set = set;
        if (!set.multiple) {
            let inputElem = document.createElement('select');
            inputElem.setAttribute('name', set.attr);
            inputElem.classList.add('uk-select');
            // Create not selected option
            let notSelOptElem = document.createElement('option');
            notSelOptElem.setAttribute('value', '');
            notSelOptElem.setAttribute('disabled', 'disabled');
            notSelOptElem.setAttribute('selected', 'selected');
            notSelOptElem.innerHTML = SWAC.lang.dict.Question.pleaseselect;
            inputElem.appendChild(notSelOptElem);
            // Create possible options
            for (let curOption of set.options) {
                let optElem = document.createElement('option');
                if (curOption.value) {
                    optElem.setAttribute('value', curOption.value);
                    optElem.innerHTML = curOption.title;
                } else {
                    optElem.innerHTML = curOption;
                    optElem.setAttribute('value', curOption);
                }
                inputElem.appendChild(optElem);
            }
            if (set.required) {
                inputElem.setAttribute('required', 'required');
            }
            divElem.appendChild(inputElem);
        } else {
            // Multiple select
            let ulElem = document.createElement('ul');
            ulElem.classList.add('uk-list');
            // Checkbox for each option
            for (let curOption of set.options) {
                let liElem = document.createElement('li');
                let lblElem = document.createElement('label');
                lblElem.classList.add('uk-form-label');
                let chkElem = document.createElement('input');
                lblElem.appendChild(chkElem);
                chkElem.setAttribute('name', set.attr);
                chkElem.setAttribute('type', 'checkbox');
                chkElem.classList.add('uk-checkbox');
                if (curOption.value) {
                    chkElem.setAttribute('value', curOption.value);
                    lblElem.appendChild(document.createTextNode(curOption.title));
                } else {
                    chkElem.setAttribute('value', curOption);
                    lblElem.appendChild(document.createTextNode(curOption));
                }

                liElem.appendChild(lblElem);
                ulElem.appendChild(liElem);
            }
            divElem.appendChild(ulElem);
        }
        return divElem;
    }

    /**
     * Create a datetime input element
     * 
     * @param {Object} set Dataset defining the input
     * @returns {Element|Question.createInputForRange.divElem}
     */
    createInputForDateTime(set) {
        let divElem = document.createElement('div');
        divElem.swac_set = set;
        let dateElem = document.createElement('input');
        dateElem.setAttribute('type', 'date');
        dateElem.setAttribute('name', set.attr);
        dateElem.classList.add('uk-input');
        dateElem.classList.add('uk-form-width-medium');
        if (set.required) {
            dateElem.setAttribute('required', 'required');
        }
        divElem.appendChild(dateElem);
        let timeElem = document.createElement('input');
        timeElem.setAttribute('type', 'time');
        timeElem.setAttribute('name', set.attr);
        timeElem.classList.add('uk-input');
        timeElem.classList.add('uk-form-width-small');
        if (set.required) {
            timeElem.setAttribute('required', 'required');
        }
        divElem.appendChild(timeElem);
        return divElem;
    }

    /**
     * Creates an input area for an icon selection 
     * 
     * @param {Object} set Dataobject with question data
     * @returns {this.createSinglechoiceInput.questInputElem|Element}
     */
    createInputForIcon(set) {
        let divElem = document.createElement('div');
        divElem.swac_set = set;
        // Get options
        for (let curOption of set.options) {
            let curOptionValue;
            let curOptionTitle;
            let curOptionSrc;
            // If image choice
            if (curOption.value) {
                curOptionValue = curOption.value;
                curOptionTitle = curOption.title;
                curOptionSrc = curOption.image;
            } else {
                curOptionValue = curOption;
                curOptionTitle = curOption;
                // Defaults to an icon from the Icon component
                curOptionSrc = SWAC.config.swac_root + 'components/Icon/imgs/' + curOption + '.svg';
            }

            // Calculate how many choices there are and how widht the imgs can be
            let maxWidth = 100 / set.options.length;

            let choiceLabel = document.createElement('label');
            choiceLabel.classList.add('swac_question_iconselect');

            let imgChoiceElem = document.createElement('img');
            imgChoiceElem.src = curOptionSrc;
            imgChoiceElem.classList.add('swac_question_icon');
            imgChoiceElem.setAttribute('width', maxWidth + '%');
            imgChoiceElem.setAttribute('uk-tooltip', curOptionTitle);

            let radioChoiceElem = document.createElement('input');
            // Single or multiple select
            if (set.multiple) {
                radioChoiceElem.setAttribute('type', 'checkbox');
            } else {
                radioChoiceElem.setAttribute('type', 'radio');
            }
            radioChoiceElem.setAttribute('value', curOptionValue);
            radioChoiceElem.setAttribute('name', set.attr);
            radioChoiceElem.classList.add('swac_dontdisplay');
            if (set.required) {
                radioChoiceElem.setAttribute('required', 'required');
            }

            choiceLabel.appendChild(radioChoiceElem);
            choiceLabel.appendChild(imgChoiceElem);
            choiceLabel.addEventListener('click', this.onMadeInput.bind(this), false);
            divElem.appendChild(choiceLabel);
        }
        return divElem;
    }

    /**
     * Function executed when an user has made his input. e.g clicked on choice or
     * clicked on next button.
     * 
     * @param {Event} evt Event that triggerd this method
     * @returns {undefined}
     */
    onMadeInput(evt) {
        // Get clicked element
        let clickedElem = evt.target;
        // Filter event thats are not occured at a img elem (click on icon input)
        // this will be delegated to an click on the radiobox elem.
        if (clickedElem.nodeName === 'IMG') {
            // Check if clickedElem holds data
            if (clickedElem.classList.contains('swac_question_icon')) {
                // Get set elem
                let setElem = clickedElem;
                while (!setElem.hasAttribute('swac_setid')) {
                    setElem = setElem.parentElement;
                }
                // Get setid
                let setname = setElem.getAttribute('swac_fromname');
                let setid = setElem.getAttribute('swac_setid');
                let set = this.data[setname].getSet(setid);

                // Get if multi or single select
                if (set.multiple) {
                    if (clickedElem.classList.contains('swac_question_icon_selected')) {
                        clickedElem.classList.remove('swac_question_icon_selected');
                    } else {
                        clickedElem.classList.add('swac_question_icon_selected');
                    }
                } else {
                    // Remove highlight from previous selection
                    let prevSelElem = setElem.querySelector('.swac_question_icon_selected');
                    if (prevSelElem)
                        prevSelElem.classList.remove('swac_question_icon_selected');
                    // Add highlight to actual selected
                    clickedElem.classList.add('swac_question_icon_selected');
                }
            }

            return evt;
        }

        // Execute custom function
        if (this.options.afterInputFunction) {
            this.options.afterInputFunction(evt);
        }
//        this.nextQuestion();
    }

    /**
     * Executed when a range is changed. Updates the displayed current value.
     * 
     * @param {DOMEvent} evt Event calling the method
     * @returns {undefined}
     */
    onChangeRange(evt) {
        let valueElem = evt.target.parentNode.parentNode.querySelector('.swac_question_rangevalue');
        valueElem.innerHTML = evt.target.value;
    }

    /**
     * Shows up the next question or jumps to endCollection
     * 
     * @param {Number} questionNo Id of the last question
     * @param {DOMElement} requestor HTMLRequestor element for the collection
     * @returns {undefined}
     */
    nextQuestion(questionNo, requestor) {
        // End collect
        if (questionNo >= requestor.swac_comp.questions.length - 1) {
            this.endCollection(requestor);
        }
        //TODO implement if collection not at end
    }

    /**
     * Ends the collection and send the data to the server.
     * 
     * @param {DOMEvent} evt Event that calls the send
     * @returns {undefined}
     */
    onSend(evt) {
        let dataCapsles = new Map();
        // Get form element
        let formElem = this.requestor.querySelector('form');
        // Look at each inputelement
        let someInvalid = false;
        for (let curInputElem of formElem.elements) {
            // Search set carriing div
            let setdiv = curInputElem;
            while (!setdiv.hasAttribute('swac_setid')) {
                setdiv = setdiv.parentElement;
            }
            // Get dataset
            let setname = setdiv.getAttribute('swac_fromname');
            let setid = setdiv.getAttribute('swac_setid');
            let set = this.data[setname].getSet(setid);
            // Search noty element
            let notyElem = setdiv.querySelector('.swac_question_noty');

            // Check validity
            if (!curInputElem.checkValidity()) {
                notyElem.classList.remove('swac_dontdisplay');
                if (curInputElem.validity.valueMissing) {
                    notyElem.innerHTML = SWAC.lang.dict.Question.valuemissing;
                } else if (curInputElem.validity.typeMismatch) {
                    notyElem.innerHTML = SWAC.lang.dict.Question.valuetypemismatch;
                } else if (curInputElem.validity.tooShort) {
                    let min = curInputElem.getAttribute('minlength');
                    let msg = SWAC.lang.replacePlaceholders(SWAC.lang.dict.Question.valuetoshort, 'charsmin', min);
                    notyElem.innerHTML = msg;
                } else if (curInputElem.validity.tooLong) {
                    let max = curInputElem.getAttribute('maxlength');
                    notyElem.innerHTML = SWAC.lang.dict.Question.valuetolong;
                    let msg = SWAC.lang.dict.replacePlaceholders(SWAC.lang.dict.Question.valuetolong, 'charsmax', max);
                    notyElem.innerHTML = msg;
                } else if (curInputElem.validity.rangeOverflow) {
                    let max = curInputElem.getAttribute('max');
                    let msg = SWAC.lang.dict.replacePlaceholders(SWAC.lang.dict.Question.valuerangeoverflow, 'maxvalue', max);
                    notyElem.innerHTML = msg;
                } else if (curInputElem.validity.rangeUnderflow) {
                    let min = curInputElem.getAttribute('min');
                    let msg = SWAC.lang.dict.replacePlaceholders(SWAC.lang.dict.Question.valueramgeunderflow, 'minvalue', min);
                    notyElem.innerHTML = msg;
                } else if (curInputElem.validity.patternMismatch) {
                    notyElem.innerHTML = SWAC.lang.dict.Question.valuepatternmismatch;
                }

                someInvalid = true;
                continue;
            }
            notyElem.classList.add('swac_dontdisplay');

            // Continue if input is radio and element is not selected
            let curType = curInputElem.getAttribute('type');
            if ((curType === 'radio' || curType === 'checkbox') && !curInputElem.checked) {
                continue;
            }

            // Get target for data
            let target = set.target;
            let parentSet;
            if (!set.target) {
                for (let curSet of this.data[this.getMainSourceName()].getSets()) {
                    if (!curSet)
                        continue;
                    if (curSet.id === set.parent) {
                        parentSet = curSet;
                        break;
                    }
                }
                if(!parentSet) {
                    let msg = SWAC.lang.dict.Question.wrongparentset;
                    msg = window.swac.lang.replacePlaceholders(msg, 'parentset', set.parent);
                    UIkit.modal.alert(msg);
                    return;
                }
                target = parentSet.target;
            }
            if (!target) {
                Msg.error('Question', 'There is no target defined for >' + set.id + '< data will not be saved.', this.requestor);
                continue;
            }

            // Create dataCapsle if not exists
            if (!dataCapsles.has(target)) {
                // Create data capsle for storing data
                let dataCapsle = {
                    data: [{}],
                    fromName: Model.getFromnameFromReference(target)
                };
                dataCapsles.set(target, dataCapsle);
            }
            // Get capsle and insert data
            let capsle = dataCapsles.get(target);
            // Special handling for checkbox
            if (curType === 'checkbox') {
                // Create array for values if not exists
                if (!capsle.data[0][set.attr]) {
                    capsle.data[0][set.attr] = [];
                }
                capsle.data[0][set.attr].push(curInputElem.value);
            } else if (curType === 'date') {
                capsle.data[0][set.attr + '_date'] = curInputElem.value;
            } else if (curType === 'time') {
                capsle.data[0][set.attr + '_time'] = curInputElem.value;
            } else {
                capsle.data[0][set.attr] = curInputElem.value;
            }
        }

        // Check if all required inputs are made
        if (someInvalid) {
            UIkit.modal.alert(SWAC.lang.dict.Question.forgotteninput);
            return;
        }

        Msg.warn('Question', 'Input in form was validated succsessfully.');

        // Save every datacaplse
        let savePromises = [];
        for (let curName of dataCapsles.keys()) {
            let curDataCapsle = dataCapsles.get(curName);
            // Save data with model
            let savePromise = Model.save(curDataCapsle);
            savePromises.push(savePromise);
        }
        Promise.all(savePromises).then(
                this.afterSaveData.bind(this)
                ).catch(
                function (error) {
                    Msg.error('Question', 'Some dataset could not be saved: ' + error);
                }
        );
    }

    /**
     * Function executed after all datasets are saved succsessfull.
     * 
     * @param {Object} result Result from the save promise
     * @returns {undefined}
     */
    afterSaveData(result) {
        // Direct redirect
        if (this.options.afterSaveLoc && !this.options.afterSaveTxt) {
            window.location.href = this.options.afterSaveLoc;
        }

        // Show text
        let tnxTxt = SWAC.lang.dict.Question.aftersavetxt;
        if (this.options.afterSaveTxt) {
            tnxTxt = this.options.afterSaveTxt;
        }
        // Hide all questions
        let collectContainers = this.requestor.querySelectorAll('.swac_repeatedForSet');
        for (let collectContainer of collectContainers) {
            collectContainer.classList.add('swac_dontdisplay');
        }
        let buttonElem = this.requestor.querySelector('.swac_question_sendbutton');
        buttonElem.classList.add('swac_dontdisplay');
        // Display message
        let msgElem = this.requestor.querySelector('.swac_question_msg');
        msgElem.appendChild(document.createTextNode(tnxTxt));

        // Redirect after timeout
        if (this.options.afterSaveLoc) {
            let thisRef = this;
            msgElem.appendChild(document.createTextNode(' ' + SWAC.lang.dict.Question.redirection));
            setTimeout(function () {
                window.location.href = thisRef.options.afterSaveLoc;
            }, 3000);
        }

        if (this.options.timeToReanswer !== null) {
            let timeInSeconds = this.options.timeToReanswer * 10000;
            // Insert countdown until reanswer
            msgElem.appendChild(document.createTextNode(' ' + SWAC.lang.dict.Question.reanswerText));

            // Get countdown element
            let countdownElem = this.requestor.querySelector('.swac_question_countdown');
            if (countdownElem) {
                countdownElem.classList.remove('swac_dontdisplay');
            }
            // Calculate target time
            let curTime = Date.now();
            let targetDate = new Date(curTime + timeInSeconds);
            countdownElem.setAttribute('uk-countdown', 'date: ' + targetDate.toISOString());

            setTimeout(function () {
                msgElem.innerHTML = '';
                if (countdownElem) {
                    countdownElem.classList.add('swac_dontdisplay');
                }
                for (let collectContainer of collectContainers) {
                    collectContainer.classList.remove('swac_dontdisplay');
                }
            }
            , timeInSeconds);
        }
    }
}