import SWAC from '../../swac.js';
import View from '../../View.js';
import Msg from '../../Msg.js';

export default class Comments extends View {

    constructor(options = {}) {
        super(options);
        this.name = 'Comments';
        this.desc.text = "Component to show and add comments on page.";
        this.desc.developers = 'Florian Fehring (FH Bielefeld)';
        this.desc.license = 'GNU Lesser General Public License';
        
        this.desc.templates[0] = {
            name: 'comments',
            style: 'comments',
            desc: 'Basic template to create a commentsection on a certain page with a comment depth of two.'
        };
        this.desc.reqPerTpl[0] = {
            selc: '.swac_comments_form',
            desc: 'Formular where the comments are written.'
        };
        this.desc.reqPerTpl[1] = {
            selc: '.swac_comments_save',
            desc: 'Button in \'.swac_comments_form\' to send the comment.'
        };
        this.desc.reqPerTpl[2] = {
            selc: 'textarea[name="message"]',
            desc: 'Textarea in \'.swac_comments_form\' for the comment.'
        };
        this.desc.reqPerTpl[3] = {
            selc: '.swac_comments_new',
            desc: 'Button to create a new comment.'
        };
        this.desc.reqPerTpl[4] = {
            selc: '.swac_comments_reply',
            desc: 'Button to create a reply on a comment.'
        };
        this.desc.reqPerTpl[5] = {
            selc: '.swac_comment_reply_{id}',
            desc: 'Form that contains the input elements for reply on comments.'
        };
        this.desc.reqPerTpl[6] = {
            selc: '.swac_comment_replyes_{id}',
            desc: 'Element that contains a list of replyes.'
        };
        
        this.desc.reqPerSet[0] = {
            name: 'id',
            desc: 'The comments id. Used for replys.'
        };
        this.desc.reqPerSet[1] = {
            name: 'ts',
            desc: 'Timestamp when the comment was given.'
        };
        this.desc.reqPerSet[2] = {
            name: 'user_name',
            desc: 'Name of the user who made the comment'
        };
        this.desc.reqPerSet[3] = {
            name: 'message',
            desc: 'The comments message'
        };
        this.desc.optPerSet[0] = {
            name: 'parent_id',
            desc: 'Path to the dataset the comment is a answer to'
        };
        this.options.showWhenNoData = true;

        this.desc.opts[0] = {
            name: "disallowNew",
            desc: "Deactivates the possibility to add new comments."
        };
        if (!this.options.disallowNew)
            this.options.disallowNew = false;
    }

    init() {
        return new Promise((resolve, reject) => {
            this.registerCommentfunctions(this.requestor);
            resolve();
        });
    }

    /**
     * Registers the comment functions on the elem thats given, including all
     * subelems.
     * 
     * @param {DOMElement} elem Element on wich the functions should be registered
     * @returns {undefined}
     */
    registerCommentfunctions(elem) {
        let editorForms = this.requestor.querySelectorAll('.swac_comments_form');

        if (this.options.disallowNew) {
            // Remove not applicable elements
            let newCommentElem = this.requestor.querySelector('.swac_comments_new');
            newCommentElem.remove();
            let replyElems = elem.querySelectorAll('.swac_comments_reply');
            for (let replyElem of replyElems) {
                replyElem.parentNode.removeChild(replyElem);
            }
        } else {
            for (let editorForm of editorForms) {
                let saveButton = editorForm.querySelector('.swac_comments_save');
                saveButton.addEventListener('click', this.onClickSave.bind(this));
            }
        }
    }

    /**
     * Function that should be executed when the save button of a comment is pressed.
     * 
     * @param {DOMEvent} evt Click event
     * @returns {undefined}
     */
    onClickSave(evt) {
        evt.preventDefault();
        // Search the saveform
        let formElem = evt.target;
        while (formElem.parentNode !== null) {
            formElem = formElem.parentNode;
            if (formElem.nodeName === 'FORM') {
                break;
            }
        }
        // Check validity
        if (formElem.reportValidity()) {
            this.saveComment(formElem);
        } else {
            UIkit.modal.alert(SWAC.lang.dict.Comments.forgotteninput);
        }
    }

    /**
     * Save the new comment
     * 
     * @param {DOMElement} formElem FORM element that contains the new comment
     * @returns {undefined}
     */
    saveComment(formElem) {
        // Create dataCapsle for comment
        let dataCapsle = {
            data: [],
            fromName: this.requestor.fromName,
            fromWheres: this.requestor.fromWheres
        };
        // Add data
        dataCapsle.data[0] = {};
        dataCapsle.data[0]['message'] = formElem.elements['message'].value;
        // Get user information
        let userJson = localStorage.getItem('swac_currentUser');
        if (userJson) {
            let userid = JSON.parse(userJson)['id'];
            dataCapsle.data[0]['userid'] = userid;
        }
        // Get parent information
        let parentElem = formElem;
        let parentId = null;
        while (parentId === null && parentElem.parentNode !== null) {
            parentElem = parentElem.parentNode;
            if (parentElem.getAttribute && parentElem.hasAttribute('swac_setid')) {
                parentId = parentElem.getAttribute('swac_setid');
                break;
            }
        }
        if (parentId !== null) {
            dataCapsle.data[0]['parent_id'] = parentId;
        }

        let thisRef = this;
        let savePromise = Model.save(dataCapsle);
        savePromise.then(function (dataCaps) {
            for (let curResult of dataCaps) {
                thisRef.addSet(dataCapsle.fromName, curResult);
            }
        }).catch(function (error) {
            Msg.error('Comments', 'Could not save comment: ' + error);
            UIkit.notification({
                message: SWAC.lang.dict.Comments.couldnotsave,
                status: 'error',
                timeout: SWAC.config.notifyDuration,
                pos: 'top-center'
            });
        });
    }
}