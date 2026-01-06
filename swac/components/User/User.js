import SWAC from '../../swac.js';
import View from '../../View.js';
import Msg from '../../Msg.js';
import Remote from '../../Remote.js';

export default class User extends View {

    constructor(options = {}) {
        super(options);
        this.name = 'User';
        this.desc.text = 'This component offers user login and site protection';
        this.desc.developers = 'Florian Fehring (HSBI)';
        this.desc.license = 'GNU Lesser General Public License';

        this.desc.templates[0] = {
            name: 'user',
            style: 'user',
            desc: 'Shows a user symbol. When not logged in with login form. When logged in with user options.'
        };
        this.desc.templates[1] = {
            name: 'user_form',
            desc: 'Shows a user login form.'
        };
        this.desc.templates[2] = {
            name: 'user_modal',
            desc: 'Opens an overlay about the whole page when the user is not logged in and gives the screen free when user is confirmed.'
        };

        this.desc.reqPerTpl[0] = {
            selc: '.swac_user_username',
            desc: 'Input element which provides the username from the loginform.'
        };
        this.desc.reqPerTpl[1] = {
            selc: '.swac_user_password',
            desc: 'Input element which provides the password from the loginform.'
        };
        this.desc.reqPerTpl[2] = {
            selc: '.swac_user_logining',
            desc: 'Area to display, when the login is in progress.'
        };
        this.desc.reqPerTpl[3] = {
            selc: '.swac_user_loginButtons',
            desc: 'Button that starts the login process.'
        };
        this.desc.reqPerTpl[4] = {
            selc: '.swac_user_loginForms',
            desc: 'Forms that starts the login process when submitted.'
        };
        this.desc.reqPerTpl[5] = {
            selc: '.swac_user_userarea',
            desc: 'Element that should be displayed for a logged in user.'
        };
        this.desc.reqPerTpl[6] = {
            selc: '.swac_user_logout',
            desc: 'Element that loggs the user out, if clicked on.'
        };
        this.desc.reqPerTpl[7] = {
            selc: '.swac_user_register',
            desc: 'Links where to click to be redirected to registration page.'
        }
        this.desc.reqPerTpl[8] = {
            selc: '.message-placeholder',
            desc: 'Element where to place info and error messages.'
        }

        this.desc.optPerTpl[0] = {
            selc: '.user_username',
            desc: 'Elements where the username should be shown.'
        };
        this.desc.optPerTpl[1] = {
            selc: '.swac_user_pwdlost',
            desc: 'A-Elements where a link to the password lost page should be placed.'
        };
        this.desc.optPerTpl[2] = {
            selc: '.swac_user_usraccount',
            desc: 'Elemente where informations about the user account are displayed. If it contains a link element there is a link placed to the account page.'
        };



        this.desc.optPerPage[0] = {
            selc: '.swac_userRegconfirmInput',
            desc: 'Input element where the user should input the registration confirmation code.'
        }
        this.desc.optPerPage[1] = {
            selc: '.swac_userRegconfirmButton',
            desc: 'Button that starts the user confirmation.'
        }
        this.desc.optPerPage[2] = {
            selc: '.swac_userMailloginUsernameMail',
            desc: 'Input element where the user should input his email or username to request a one time login per mail.'
        }
        this.desc.optPerPage[3] = {
            selc: '.swac_userRequestMailloginButton',
            desc: 'Button that sends the user a mail for one time login.'
        }

        this.options.showWhenNoData = true;
        this.desc.opts[2] = {
            name: 'loginURL',
            desc: 'URL on which the login should be performed. URLs to other webservers have to include the protocol (e.g. https://)',
            example: '/SmartUser/smartuser/performLogin'
        };
        if (!options.loginURL)
            this.options.loginURL = null;
        this.desc.opts[3] = {
            name: "loginURLUsernameAttribute",
            desc: "Name of the attribute where the username can be found."
        };
        if (!options.loginURLUsernameAttribute)
            this.options.loginURLUsernameAttribute = 'username';
        this.desc.opts[4] = {
            name: "loginURLPasswordAttribute",
            desc: "Name of the attribute where the password should be send in."
        };
        if (!options.loginURLPasswordAttribute)
            this.options.loginURLPasswordAttribute = 'password';
        this.desc.opts[5] = {
            name: "afterLoginFunc",
            desc: "A function that should be executed after login."
        };
        if (!options.afterLoginFunc)
            this.options.afterLoginFunc = function () {};

        this.desc.opts[6] = {
            name: "afterLoginLoc",
            desc: "URL to which the user should be redirected after login. Appended to the docroot.",
            example: '../mywelcomepage.html'
        };
        if (!options.afterLoginLoc)
            this.options.afterLoginLoc = null;

        this.desc.opts[7] = {
            name: 'logoutURL',
            desc: 'URL on which the logout should be performed. If not given only the local login information will be deleted.',
            example: '/SmartUser/smartuser/performLogout'
        };
        if (!options.logoutURL)
            this.options.logoutURL = null;
        this.desc.opts[8] = {
            name: "afterLogoutLoc",
            desc: "URL to which the user should be redirected after logout. Apended to the docroot.",
            example: "../mybyebyepage.html"
        };
        if (!options.afterLogoutLoc)
            this.options.afterLogoutLoc = null;
        this.desc.opts[9] = {
            name: "loggedinRedirects",
            desc: "Map of sites (key) and urls (value). If a site is called"
                    + " when the user is logged in, he will be redirected to the given url."
        };
        if (!options.loggedinRedirects)
            this.options.loggedinRedirects = new Map();
        this.desc.opts[10] = {
            name: "loggedinFunc",
            desc: "Function to execute every time a user is identified as logged in. Becomes the userdata as parameter."
        };
        if (!options.loggedinFunc)
            this.options.loggedinFunc = function () {};
        this.desc.opts[11] = {
            name: "loggedoutFunc",
            desc: "Function to execute every time a user is identified as logged out."
        };
        if (!options.loggedoutFunc)
            this.options.loggedoutFunc = function () {};
        this.desc.opts[12] = {
            name: "registrationLink",
            desc: "Link to the page where new users can register.",
            example: "/SmartUser/sites/register.html"
        };
        if (!options.registrationLink)
            this.options.registrationLink = null;
        this.desc.opts[13] = {
            name: "confirmURL",
            desc: "Link to the page where the confirm request should be send.",
            example: "/SmartUser/smartuser/user/confirm"
        };
        if (!options.confirmURL)
            this.options.confirmURL = null;
        this.desc.opts[14] = {
            name: "loginPageURL",
            desc: "Link to the page where the user can login",
            example: "../myloginpage.html"
        };
        if (!options.loginPageURL)
            this.options.loginPageURL = null;
        this.desc.opts[15] = {
            name: "accountURL",
            desc: "Link to the page where the user can edit the account",
            example: "../myaccountpage.html"
        };
        if (!options.accountURL)
            this.options.accountURL = null;
        this.desc.opts[16] = {
            name: "pwdlostURL",
            desc: "Link to the page where the user can retrive a lost password",
            example: "../mylostpwd.html"
        };
        if (!options.pwdlostURL)
            this.options.pwdlostURL = null;
        this.desc.opts[17] = {
            name: "privacyURL",
            desc: "Link where the user can find the privacy statement.",
            example: "../privacy.html"
        };
        if (!options.privacyURL)
            this.options.privacyURL = null;
        this.desc.opts[18] = {
            name: "termsURL",
            desc: "Link whre the user can find the terms of use.",
            example: "../terms.html"
        };
        if (!options.termsURL)
            this.options.termsURL = null;
        this.desc.opts[19] = {
            name: "saveURL",
            desc: "URL where to send users data to create or update users",
            example: "/SmartUser/smartuser/create"
        };
        if (!options.saveURL)
            this.options.saveURL = null;
        this.desc.opts[20] = {
            name: "requestMailloginURL",
            desc: "URL where to request the send of a one time login mail",
            example: "/SmartUser/smartuser/onetimelogin"
        };
        if (!options.requestMailloginURL)
            this.options.requestMailloginURL = '/SmartUser/smartuser/user/requestmaillogin';
        this.desc.opts[21] = {
            name: "performMailloginURL",
            desc: "URL where to request the login with a one time token",
            example: "/SmartUser/smartuser/onetimelogin"
        };
        if (!options.performMailloginURL)
            this.options.performMailloginURL = '/SmartUser/smartuser/user/performmaillogin';

        // Internal values
        this.userData = {};
    }

    init() {
        return new Promise((resolve, reject) => {
            // Do login per one time logik token (maillogin)
            let cred = SWAC.getParameterFromURL('onetimetoken', window.location);
            if (cred) {
                this.performMailLogin(cred);
            }
            // Listen for HTTP401 event (logout on server side)
            document.addEventListener("swac_fetchfail_401", this.onFetchfail.bind(this));

            // Get current user
            let user = this.getCurrentUser();
            if (!user || !user.id) {
                this.showLogin();
                let usrelem = document.querySelector('.swac_user_userarea .user_username');
                if (usrelem)
                    usrelem.innerText = SWAC.lang.dict.User.login;
                if (this.options.loggedoutFunc)
                    this.options.loggedoutFunc();
            } else {
                if (this.options.loggedinFunc)
                    this.options.loggedinFunc(user);
                if (this.options.loggedinRedirects
                        && this.options.loggedinRedirects.size > 0) {
                    let urlparts = window.location.pathname.split('/');
                    let filename = urlparts[urlparts.length - 1];
                    let redirectTarget = this.options.loggedinRedirects.get(filename);
                    if (redirectTarget) {
                        window.location = redirectTarget;
                    } else {
                        Msg.info('User', 'No redirect target found for page >' + filename + '<. Configure them with option >loggedinRedirects<', this.requestor);
                    }
                } else {
                    Msg.info('User', 'There are no redirects for login. Configure them with option >loggedinRedirects<', this.requestor);
                }
                this.showUser();
            }

            let navElem = document.querySelector('[swa^="Navigation"]');
            if (navElem) {
                window.swac.reactions.addReaction(function () {
                    let userArea = document.querySelector('.swac_user_userarea');
                    if (userArea) {
                        let adonPlace = document.querySelector('.swac_nav_addons');
                        if (adonPlace)
                            adonPlace.appendChild(userArea);
                        // Make user area visible
                        userArea.classList.remove('swac_dontdisplay');
                    }
                }, navElem.id, this.requestor.id);
            } else {
                // Make user area visible
                let userArea = document.querySelector('.swac_user_userarea');
                if (userArea)
                    userArea.classList.remove('swac_dontdisplay');
            }

            let regElems = document.querySelectorAll('.swac_user_register');
            for (let regElem of regElems) {
                // Check if registration is open
                if (this.options.registrationLink) {
                    regElem.setAttribute('href', SWAC_config.app_root + this.options.registrationLink);
                } else {
                    regElem.classList.add('swac_dontdisplay');
                }
            }

            // Password lost link
            let pwdElems = document.querySelectorAll('.swac_user_pwdlost');
            for (let pwdElem of pwdElems) {
                // Check if pwd lost page defined
                if (this.options.pwdlostURL) {
                    pwdElem.setAttribute('href', this.options.pwdlostURL);
                } else {
                    pwdElem.classList.add('swac_dontdisplay');
                    Msg.warn('User', 'Users have no possibility to get a lost password.', this.requestor);
                }
            }

            // Check if login is possible
            if (!this.options.loginURL) {
                this.showLoginMessage('User.nologinpossible');
                Msg.warn('User',
                        'You must set the loginURL option to allow login.',
                        this.requestor);
                let loginForms = document.querySelectorAll('.swac_user_loginForms');
                for (let curLoginForm of loginForms) {
                    curLoginForm.classList.add('swac_dontdisplay');
                }
                resolve();
                return;
            }

            // Add action for login buttons
            let loginButtons = document.querySelectorAll('.swac_user_loginButtons');
            for (let curLoginButton of loginButtons) {
                curLoginButton.onclick = this.performLogin.bind(this);
            }
            let loginForms = document.querySelectorAll('.swac_user_loginForms');
            for (let curLoginForm of loginForms) {
                curLoginForm.onkeydown = this.onKeydown.bind(this);
            }

            // Check if registration confirmation is on page
            let regconfElem = document.querySelector('.swac_userRegconfirmButton');
            if (regconfElem) {
                regconfElem.addEventListener('click', this.onRegistrationConfirmation.bind(this));
                this.hideLogin();
            }

            // Check if registration confirmation is on page
            let reqmailloginElem = document.querySelector('.swac_userRequestMailloginButton');
            if (reqmailloginElem) {
                reqmailloginElem.addEventListener('click', this.onRequestMaillogin.bind(this));
                this.hideLogin();
            }

            resolve();
        });
    }

    /**
     * Executed when a fetch atempt failed with status 401
     */
    onFetchfail(evt) {
        // If user is logged in notify user
        let user = this.getCurrentUser();
        if (user.username) {
            UIkit.modal.alert(SWAC.lang.dict.User.autologout);
            let thisRef = this;
            window.setTimeout(function () {
                // Local logout
                thisRef.localLogout();
            }, 5000);
        }
    }

    /**
     * Gets the current active user. If there is no user it returns null.
     * 
     * @returns {Object} Object with userdata or null
     */
    getCurrentUser() {
        let userDataStr = localStorage.getItem("swac_currentUser");
        if (userDataStr !== null) {
            this.userData = JSON.parse(userDataStr);
        }
        return this.userData;
    }

    /**
     * Shows up the login form or modal
     * 
     * @returns {undefined}
     */
    showLogin() {
        let dia = document.getElementById('swac_user_logindialog');
        dia.classList.remove('swac_dontdisplay');
        if (dia.hasAttribute('uk-modal'))
            UIkit.modal(dia).show();
    }

    /**
     * When key is pressed check if it was the enter key and perform login
     */
    onKeydown(evt) {
        if (evt.keyCode === 13) {
            evt.preventDefault();
            this.performLogin(evt);
        }
    }

    /**
     * Loggt den Benutzer mit den eingegebenen Daten ein.
     * 
     * @param {DOMEvent} evt Event that calles the login function
     * @returns {undefined}
     */
    performLogin(evt) {
        // Get applicable form
        let formElem = evt.target
        while (!formElem.classList.contains('swac_user_loginForms') && formElem.parentElement != null) {
            formElem = formElem.parentElement;
        }
        if (!formElem.classList.contains('swac_user_loginForms')) {
            return;
        }

        // Check if form was filled
        let datathere = formElem.reportValidity();
        if (!datathere) {
            return;
        }

        // Hide login dialog
        this.hideLogin();
        this.showLoginProgress();

        // Get logindata
        let logindata = {};
        logindata[this.options.loginURLUsernameAttribute] =
                formElem.querySelector('.swac_user_username').value;
        logindata[this.options.loginURLPasswordAttribute] =
                formElem.querySelector('.swac_user_password').value;

        // Perform login with post
        let thisRef = this;
        Remote.clearDatasourceStates();
        // Use create here because it uses POST method
        Remote.fetchCreate(this.options.loginURL, null, true, logindata).then(function (userdata) {
            try {
                window.localStorage.setItem("USERID", userdata.data.id);

                // Hide login loading info
                thisRef.hideLoginProgress();

                let acceptText = null;
                // Get state of accepted privacy statement and terms
                if (thisRef.options.privacyURL && !userdata.data.privacy_accepted && !thisRef.options.termsURL) {
                    acceptText = SWAC.lang.replacePlaceholders(SWAC.lang.dict.User.accept_privacy, 'privacy_url', thisRef.options.privacyURL);
                } else if (thisRef.options.termsURL && !userdata.data.terms_accepted && !thisRef.options.privacyURL) {
                    acceptText = SWAC.lang.replacePlaceholders(SWAC.lang.dict.User.accept_terms, 'terms_url', thisRef.options.termsURL);
                } else if (thisRef.options.privacyURL && thisRef.options.termsURL && !userdata.data.privacy_accepted && !userdata.data.terms_accepted) {
                    acceptText = SWAC.lang.dict.User.accept_privacy_terms;
                    acceptText = SWAC.lang.replacePlaceholders(acceptText, 'privacy_url', thisRef.options.privacyURL);
                    acceptText = SWAC.lang.replacePlaceholders(acceptText, 'terms_url', thisRef.options.termsURL);
                }

                if (!acceptText) {
                    thisRef.saveLogin(userdata);
                } else {
                    let confirm = UIkit.modal.confirm(acceptText);
                    let dialog = confirm.dialog;
                    let modalClose = dialog.$el.querySelector('.uk-modal-close');
                    modalClose.innerHTML = SWAC.lang.dict.User.dontaccept;
                    let modalOk = dialog.$el.querySelector('.uk-button-primary');
                    modalOk.innerHTML = SWAC.lang.dict.User.accept;
                    confirm.then(function () {
                        // Save confirmation to database
                        userdata.data.privacy_accepted = true;
                        userdata.data.terms_accepted = true;
                        // If terms state can not be saved into database
                        if (!thisRef.options.saveURL) {
                            Msg.warn('User', 'There is no options.saveURL, so state of acceppting terms can not be saved.');
                            thisRef.saveLogin(userdata);
                            return;
                        }

                        // Save terms state in database
                        Remote.fetchUpdate(thisRef.options.saveURL, null, true, userdata.data).then(function () {
                            thisRef.saveLogin(userdata);
                        }).catch(function (e) {
                            Msg.error('User', 'Could not save accepted privacy and terms state: ' + e, thisRef.requestor);
                        })
                    }, function () {
                        UIkit.modal.alert(SWAC.lang.dict.User.notaccepted_terms).then(function () {
                            thisRef.performLogout();
                        },
                                function () {
                                    thisRef.performLogout();
                                });
                    });
                }
            } catch (error) {
                thisRef.showUser();
                Msg.error('User', 'Error occured after login: ' + error, thisRef.requestor);
            }
        }).catch(function (response) {
            thisRef.hideLoginProgress();
            thisRef.showLogin();
            let mphs = document.querySelectorAll('.message-placeholder');

            response.json().then(function (erg) {
                // Get and translate messages
                let errmsg;
                for (let curErr of erg.errors) {
                    if (SWAC.lang.dict.App && SWAC.lang.dict.User[curErr])
                        errmsg += SWAC.lang.dict.User[curErr];
                    else
                        errmsg += curErr;
                }
                // Default err message
                if (!errmsg)
                    errmsg = SWAC.lang.dict.User.nologinpossible;

                // Show messages
                if (mphs.length === 0) {
                    UIkit.modal.alert(errmsg);
                } else {
                    for (let placeholder of mphs) {
                        placeholder.innerHTML = erg.errors[0];
                    }
                }
            }).catch(function (e) {
                if (mphs.length === 0) {
                    UIkit.modal.alert(response);
                } else {
                    for (let placeholder of mphs) {
                        placeholder.innerHTML = response;
                    }
                }
            });
        });
    }

    saveLogin(userdata) {
        // Cookie setting not needed, cookies will be set by User Service (SmartUser)
//        let cok = "authtoken=" + userdata.data.authtoken + "; path=/;";
//        if(location.protocol === 'HTTPS')
//            cok += " SameSite=None; Secure";
//        // Set authtoken as cookie
//        document.cookie = cok;
        localStorage.setItem('swac_currentUser', JSON.stringify(userdata.data));
        this.afterPerformLogin(userdata);
    }

    /**
     * Setting userdata, cookie etc. after login
     */
    afterPerformLogin(userdata) {
        Msg.flow('User', 'afterPerformLogin', this.requestor);
        // Run user defined afterlogin function
        if (this.options.afterLoginFunc) {
            this.options.afterLoginFunc(userdata.data);
        }
        // Run user identified again function
        if (this.options.loggedinFunc)
            this.options.loggedinFunc(userdata.data);
        // Redirect after login
        if (this.options.afterLoginLoc) {
            window.location = SWAC_config.app_root + this.options.afterLoginLoc;
        } else {
            this.showUser();
        }
    }

    /**
     * Hides the login form or modal
     * 
     * @returns {undefined}
     */
    hideLogin() {
        let dia = document.getElementById('swac_user_logindialog');
        dia.classList.remove('swac_dontdisplay');
        if (dia.hasAttribute('uk-modal'))
            UIkit.modal(dia).hide();
    }

    /**
     * Shows the information about performing login.
     * 
     * @returns {undefined}
     */
    showLoginProgress() {
        let loginElem = document.querySelector('.swac_user_logining');
        loginElem.classList.remove('swac_dontdisplay');
    }

    /**
     * Hides the information about performing login.
     * 
     * @returns {undefined}
     */
    hideLoginProgress() {
        let loginElem = document.querySelector('.swac_user_logining');
        loginElem.classList.add('swac_dontdisplay');
    }

    /**
     * Shows an message on the login place
     * 
     * @param {String} msg message to show
     * @returns {undefined}
     */
    showLoginMessage(msg) {
        let msgElems = document.querySelectorAll('.message-placeholder');
        for (let curMsgElem of msgElems) {
            curMsgElem.setAttribute('swac_lang', msg);
        }
    }

    /**
     * Shows the user area and its menue
     * 
     * @returns {undefined}
     */
    showUser() {
        Msg.flow('User', 'showUser() called', this.requestor);
        // Make userarea visible
        let userarea = document.querySelector('.swac_user_userarea');
        userarea.classList.remove('swac_dontdisplay');
        let usrlogin = document.querySelector('#swac_user_logindialog');
        usrlogin.classList.add('swac_dontdisplay');
        let useracc = document.querySelector('.swac_user_usraccount');
        if (this.options.accountURL && useracc) {
            useracc.classList.remove('swac_dontdisplay');
            useracc.querySelector('a').href = this.options.accountURL;
        }

        let user = this.getCurrentUser();
        Msg.flow('User', 'User >' + user.id + '< logged in. Showing users data on page', this.requestor);
        // Get users attributes
        for (let curUserAttr in user) {
            let usernameElems = document.querySelectorAll(".user_" + curUserAttr);
            for (let elem of usernameElems) {
                elem.innerHTML = user[curUserAttr];
            }
        }
        let navElem = document.querySelector('[SWA^="Navigation"]');
        if (navElem) {
            // Add users id to urls in links
            document.addEventListener('swac_' + navElem.id + '_repeatedForSet', function (evt) {
                let useridElems = evt.detail.requestor.querySelectorAll('[href$="user_id="]');
                for (let curUseridElem of useridElems) {
                    curUseridElem.href = curUseridElem.href + user.id;
                }
            });
        }

        // Register logout function
        let logoutElems = document.querySelectorAll('.swac_user_logout');
        for (let curLogoutElem of logoutElems) {
            curLogoutElem.onclick = this.performLogout.bind(this);
            // Make logout elements
            let curElem = curLogoutElem;
            while (curElem.parentElement !== null) {
                if (curElem.classList.contains('swac_dontdisplay'))
                    curElem.classList.remove('swac_dontdisplay');
                curElem = curElem.parentElement;
            }
        }
    }

    /**
     * Redirect to login page
     */
    redirectToLogin() {
        if (this.options.loginPageURL) {

            window.location = this.options.loginPageURL
        }
    }

    /**
     * Hides the users menue and informations
     * 
     * @returns {undefined}
     */
    hideUser() {
        // Make userarea visible
        let userarea = document.querySelector('.swac_user_userarea');
        userarea.classList.add('swac_dontdisplay');
        let useracc = document.querySelector('.swac_user_usraccount');
        if (useracc)
            useracc.classList.add('swac_dontdisplay');
    }

    /**
     * Checks if someone is logged in
     * 
     * @returns {boolean} true if there is someone logged in
     */
    isLoggedIn() {
        if (this.userData.data.username)
            return true;
        return false;
    }

    /**
     * Loggout the currently active user
     * 
     * @param {DOMEvent} evt Event that requests the logout
     * @returns {undefined}
     */
    performLogout(evt) {
        // Get user
        let user = this.getCurrentUser();
        if (user) {
            // Build up logout data
            let logoutdata = {};
            logoutdata.id = user.id;
            logoutdata[this.options.loginURLUsernameAttribute] = user[this.options.loginURLUsernameAttribute];

            if (this.options.logoutURL) {
                let thisRef = this;
                Remote.fetchGet(this.options.logoutURL, logoutdata).then(function (response) {
                    thisRef.localLogout();
                }).catch(function (error) {
                    Msg.error('User', 'Could not logout user on backend: ' + error, thisRef.requestor);
                    thisRef.localLogout();
                });
            } else {
                Msg.warn('User', 'User was locally logged out but no logout request was send', this.requestor);
                this.localLogout();
            }
        }
    }

    /**
     * Removes the local users data
     * 
     * @returns {undefined}
     */
    localLogout() {
        localStorage.removeItem("swac_currentUser");
        // Delete cookies
        let user = this.getCurrentUser();
        var cookies = document.cookie.split(";");
        for (var i = 0; i < cookies.length; i++) {
            var cookie = cookies[i];
            var eqPos = cookie.indexOf("=");
            var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
            document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
        }
        document.cookie = "authtoken=" + user.authtoken + "; path=/; SameSite=None; Secure; max-age=0";
        // When useing SmartUser
        document.cookie = "authtoken=loggedout; path=/SmartUser/smartuser/user; SameSite=None; Secure; max-age=0";
        if (this.options.afterLogoutLoc)
            window.location.href = SWAC_config.app_root + this.options.afterLogoutLoc;
        else {
            this.hideUser();
            this.showLogin();
        }
        if (this.options.loggedoutFunc)
            this.options.loggedoutFunc();
    }

    /**
     * Method executed when the confirmation button is clicked
     */
    onRegistrationConfirmation(evt) {
        evt.preventDefault();
        Remote.clearDatasourceStates();

        let codeElem = document.querySelector('.swac_userRegconfirmInput');
        let confurl = this.options.confirmURL;
        if (!this.options.confirmURL) {
            Msg.error('User', 'Confirmation could not be done. The option confirmURL is not set.', this.requestor);
            return;
        }
        // Build up logout data
        let confdata = {
            confirmToken: codeElem.value
        };

        let thisRef = this;
        Remote.fetchGet(confurl, confdata).then(function (response) {
            UIkit.modal.alert(SWAC.lang.dict.User.regconfirmed);
            thisRef.showLogin();
        }).catch(function (error) {
            Msg.error('User', 'Could not confirm user: ' + error, thisRef.requestor);
        });
    }

    /**
     * Method executed when the maillogin button is clicked
     */
    onRequestMaillogin(evt) {
        evt.preventDefault();
        let codeElem = document.querySelector('.swac_userMailloginUsernameMail');
        let confurl = this.options.requestMailloginURL;
        // Build up logout data
        let confdata = {
            usernamemail: codeElem.value
        };
        let thisRef = this;
        Remote.fetchGet(confurl, confdata).then(function (response) {
            if (thisRef.options.afterLogoutLoc) {
                UIkit.modal.alert(SWAC.lang.dict.User.mailloginsend).then(function () {
                    window.location.href = thisRef.options.afterLogoutLoc;
                })
            } else {
                UIkit.modal.alert(SWAC.lang.dict.User.mailloginsend);
            }
        }).catch(function (error) {
            Msg.error('User', 'Could not confirm user: ' + error, thisRef.requestor);
        });
    }

    /**
     * Performs a mail login if possible with onetimetoken
     */
    performMailLogin(onetimetoken) {
        Remote.clearDatasourceStates();
        let confurl = this.options.performMailloginURL;
        // Build up logout data
        let confdata = {
            onetimetoken: onetimetoken
        };

        let thisRef = this;
        Remote.fetchGet(confurl, confdata).then(function (response) {
            if (response.data.id) {
                // Hide login dialog
                thisRef.hideLogin();
                localStorage.setItem('swac_currentUser', JSON.stringify(response.data));
                // Run user defined afterlogin function
                if (thisRef.options.afterLoginFunc) {
                    thisRef.options.afterLoginFunc(response.data);
                }
                if (thisRef.options.afterLoginLoc) {
                    window.location = thisRef.options.afterLoginLoc;
                } else {
                    thisRef.showUser();
                }
            } else {
                UIkit.modal.alert(SWAC.lang.dict.User.mailloginfail);
            }
        }).catch(function (error) {
            UIkit.modal.alert(SWAC.lang.dict.User.mailloginfail);
            Msg.error('User', 'Could not create maillogin for user: ' + error, thisRef.requestor);
        });
    }
}
