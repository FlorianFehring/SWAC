/**
 * This component is NOT opensource.
 * Copyright by Florian Fehring
 * 
 * @type type
 */

import SWAC from '../../swac.js';
import View from '../../View.js';
import Msg from '../../Msg.js';
import Model from '../../Model.js';
import Mediacode from './Mediacode.js';

export default class Mediaplayer extends View {

    constructor(options = {}) {
        super(options);
        this.name = 'Mediaplayer';
        this.desc.text = 'The Mediaplayer component creates a view for media files with direct play, download and information possibilities.';
        this.desc.developers = 'Florian Fehring';
        this.desc.license = '(c) by Florian Fehring';

        this.desc.templates[0] = {
            name: 'slideplay',
            style: 'slideplay',
            desc: 'Displays the media fullsize with playlist and slide effects.'
        };
        this.desc.templates[1] = {
            name: 'medialist',
            style: 'medialist',
            desc: 'Creates a list of media elements with and downloadlink.'
        };

        this.desc.reqPerTpl[0] = {
            selc: '.swac_mediaplayer_prevtitleBtn',
            desc: 'Button to jump to previous title'
        }
        this.desc.reqPerTpl[1] = {
            selc: '.swac_mediaplayer_nexttitleBtn',
            desc: 'Button to jump to next title'
        }
        this.desc.reqPerTpl[2] = {
            selc: '.swac_mediaplayer_playBtn',
            desc: 'Button to start playback'
        }
        this.desc.reqPerTpl[3] = {
            selc: '.swac_mediaplayer_muteBtn',
            desc: 'Button to mute output'
        }
        this.desc.reqPerTpl[4] = {
            selc: '.swac_mediaplayer_volume',
            desc: 'Button to adjust volume'
        }
        this.desc.reqPerTpl[5] = {
            selc: '.swac_mediaplayer_media',
            desc: 'Element that contains the media display.'
        }
        this.desc.reqPerTpl[6] = {
            selc: '.swac_mediaplayer_control',
            desc: 'Area containing media control buttons.'
        }
        this.desc.reqPerTpl[7] = {
            selc: '.swac_mediaplayer_playlistBtn',
            desc: 'Button toggeling the playlist view.'
        }
        this.desc.reqPerTpl[8] = {
            selc: '.swac_mediaplayer_curlisttime',
            desc: 'Element where to show the current time.'
        }
        this.desc.reqPerTpl[9] = {
            selc: '.swac_mediaplayer_wholelisttime',
            desc: 'Element where to show the overall time.'
        }
        this.desc.reqPerTpl[10] = {
            selc: '.swac_mediaplayer_keymedias',
            desc: 'Area where to place medias that will be played on keypress.'
        }
        this.desc.reqPerTpl[11] = {
            selc: '.swac_repeatForKeymedia',
            desc: 'Area repeated for a media that will be played on keypress.'
        }
        this.desc.reqPerTpl[12] = {
            selc: '.swac_mediaplayer_keymediacard',
            desc: 'Area containing the title and key of a keymedia.'
        }
        this.desc.reqPerTpl[13] = {
            selc: '.swac_mediaplayer_keymediakey',
            desc: 'Element containing the key for a keymedia.'
        }
        this.desc.reqPerTpl[14] = {
            selc: '.swac_mediaplyer_keymediatitle',
            desc: 'Element containing the title for a keymedia.'
        }
        this.desc.reqPerTpl[15] = {
            selc: '.swac_mediaplayer_desc',
            desc: 'Element where to place medias description.'
        }
        this.desc.reqPerTpl[16] = {
            selc: '.swac_mediaplayer_artist',
            desc: 'Element where to place medias artist(s).'
        }
        this.desc.reqPerTpl[17] = {
            selc: '.swac_mediaplayer_album',
            desc: 'Element where to place medias album.'
        }
        this.desc.reqPerTpl[18] = {
            selc: '.swac_mediaplayer_info',
            desc: 'Element where to place medias additional informations.'
        }
        this.desc.reqPerTpl[19] = {
            selc: '.swac_mediaplayer_license',
            desc: 'Element where to place medias license information.'
        }


        this.desc.optPerTpl[0] = {
            selc: '.swac_mediaplayer_fullscreen',
            desc: 'Button to enter fullsceen mode'
        };
        this.desc.optPerTpl[1] = {
            selc: '.swac_mediaplayer_progress',
            desc: 'Elemt to show progress of playback'
        }
        this.desc.optPerTpl[2] = {
            selc: '.swac_mediaplayer_slideshow',
            desc: 'Element where the slideshow resides'
        }
        this.desc.optPerTpl[3] = {
            selc: '.swac_mediaplayer_titleoverlay',
            desc: 'Element to lay over the media. Contains additional information'
        }
        this.desc.optPerTpl[4] = {
            selc: '.swac_mediaplayer_removefromlist',
            desc: 'Element that removes the media where it belongs to from playlist'
        }
        this.desc.optPerTpl[5] = {
            selc: '.swac_mediapalyer_playlistentry',
            desc: 'Element displayed for a entry in the playlist. If user clicks on this the entry starts to play.'
        }
        this.desc.optPerTpl[6] = {
            selc: '.swac_mediaplayer_container',
            desc: 'Element that contains the slides.'
        }
        this.desc.optPerTpl[7] = {
            selc: '.swac_mediaplayer_playslide',
            desc: 'A slide element created for one media.'
        }
        this.desc.optPerTpl[8] = {
            selc: '.swac_mediaplayer_overlay',
            desc: 'Element to show for oeverlay media views.'
        }
        this.desc.optPerTpl[9] = {
            selc: '.swac_mediaplayer_overlaymedia',
            desc: 'Element where to place the media in overlays.'
        }
        this.desc.optPerTpl[10] = {
            selc: '.swac_mediaplayer_closeoverlay',
            desc: 'Button for closeing the overlay.'
        }
        this.desc.optPerTpl[11] = {
            selc: '.swac_mediaplayer_downloadBtn',
            desc: 'Button for downloading the currently played song.'
        }
        this.desc.optPerTpl[12] = {
            selc: '.swac_mediaplayer_commentarea',
            desc: 'Area where to show comments.'
        }
        this.desc.optPerTpl[13] = {
            selc: '.swac_mediaplayer_commentbutton',
            desc: 'Button to add a comment.'
        }
        this.desc.optPerTpl[14] = {
            selc: '.swac_format_mediaplayer_table',
            desc: 'Button to add a comment.'
        }
        this.desc.optPerTpl[15] = {
            selc: '.swac_mediaplayer_title_download',
            desc: 'Button where media could be downloaded.'
        }
        this.desc.optPerTpl[16] = {
            selc: '.swac_mediaplayer_save',
            desc: 'Button where changes to the playlist can be saved.'
        }



        this.desc.reqPerSet[0] = {
            name: 'id',
            desc: 'Dataset id for finding associated files'
        };
        this.desc.reqPerSet[1] = {
            name: 'title',
            desc: 'Title for the media file'
        };
        this.desc.reqPerSet[2] = {
            name: 'path',
            desc: 'Path to media file, absolute or relative'
        };
        this.desc.reqPerSet[3] = {
            name: 'mimetype',
            desc: 'Media files mimetype (e.g. audio/mp3, video/mp4, ...)'
        };

        this.desc.optPerSet[0] = {
            name: 'preview',
            desc: 'Path to a preview file.'
        };
        this.desc.optPerSet[1] = {
            name: 'artist',
            desc: 'Medias artist name'
        };
        this.desc.optPerSet[2] = {
            name: 'album',
            desc: 'Medias album'
        };
        this.desc.optPerSet[3] = {
            name: 'license',
            desc: 'Medias license'
        };
        this.desc.optPerSet[4] = {
            name: 'startonkey',
            desc: 'A key on that the media should start'
        };
        this.desc.optPerSet[5] = {
            name: 'stoponkey',
            desc: 'A key on that the media should stop'
        };
        this.desc.optPerSet[6] = {
            name: 'autoplay',
            desc: 'Automatic start playback if slide comes in view'
        };
        this.desc.optPerSet[7] = {
            name: 'autostop',
            desc: 'Automatic stop playback if media is on its end.'
        };
        this.desc.optPerSet[8] = {
            name: 'info',
            desc: 'Additional informations about the media.'
        };
        this.desc.optPerSet[9] = {
            name: 'skip',
            desc: 'Skip this song, when played in playlist.'
        };
        this.desc.optPerSet[10] = {
            name: 'startAnimationEffect',
            desc: 'Use this effect at start within slideshow. (every uikit slideshow effect)',
            example: 'fade'
        };

        this.desc.opts[0] = {
            name: "defaultDuration",
            desc: "The default length in seconds a media should be displayed, if it has no duration information."
        };
        // Setting a default value, only applying when the options parameter does not contain this option
        if (!options.defaultDuration)
            this.options.defaultDuration = 10;

        this.desc.opts[1] = {
            name: "commentRequestor",
            desc: "Requestor used for showing comments on the media. Comments must contain the mediaid, timepoint and comment attributes.",
            example: {
                fromName: '../../data/media/player/comments.json'
            }
        };
        if (!options.commentRequestor)
            this.options.commentRequestor = null;

        this.desc.opts[2] = {
            name: "stopOnStartComment",
            desc: "If set to true playback is stoped as soon as a user enters the comment textfield."
        };
        if (!options.stopOnStartComment)
            this.options.stopOnStartComment = false;

        this.desc.opts[3] = {
            name: "pathattr",
            desc: "Name of the attribute that contains the path to the data"
        };
        if (!options.pathattr)
            this.options.pathattr = 'path';

        this.desc.opts[4] = {
            name: "overlayclass",
            desc: "Name of the css class to apply as default overlay layout. Can be overwritten by overlay definition useing attribute overlayclass."
        };
        if (!options.overlayclass)
            this.options.overlayclass = 'swac_mediaplayer_overlay_default';

        this.desc.opts[5] = {
            name: "showFullScreenButton",
            desc: "If true a button for go into fullscreen is shown."
        };
        if (!options.showFullScreenButton)
            this.options.showFullScreenButton = true;

        this.desc.opts[6] = {
            name: "showTitles",
            desc: "If true the media titles are shown as overlay on the media"
        };
        if (!options.showTitles)
            this.options.showTitles = false;

        this.desc.opts[7] = {
            name: 'allowDel',
            desc: 'If true tracks can be deleted from list.'
        };
        if (!options.allowDel)
            this.options.allowDel = false;

        this.desc.opts[8] = {
            name: 'allowSave',
            desc: 'If true allows to save changes to the dataset.'
        };
        if (!options.allowSave)
            this.options.allowSave = false;

        this.desc.opts[9] = {
            name: 'mediaBasePath',
            desc: 'Base path where to find media files',
            example: '/mymedia/store/'
        };
        if (!options.mediaBasePath)
            this.options.mediaBasePath = null;

        this.desc.opts[10] = {
            name: 'titleLinkBase',
            desc: 'Base path where to find more information about the title',
            example: 'https://mymedia.server.com'
        };
        if (!options.titleLinkBase)
            this.options.titleLinkBase = null;

        this.desc.opts[11] = {
            name: 'titleDownload',
            desc: 'If true title download is alowed'
        };
        if (typeof options.titleDownload === 'undefined')
            this.options.titleDownload = true;

        this.desc.opts[12] = {
            name: 'titleDownloadBase',
            desc: 'Base path to a title download page',
            example: 'https://mymedia.server.com'
        };
        if (!options.titleDownloadBase)
            this.options.titleDownloadBase = null;

        this.desc.opts[13] = {
            name: 'loop',
            desc: 'If true the titles are looped endlessly.',
            example: true
        };
        if (!options.loop)
            this.options.loop = false;

        this.desc.opts[14] = {
            name: 'pin',
            desc: 'Option for pining the player controls. Can use top: Xpx or bottom: xpx here.',
            example: 'bottom: 0px;'
        };
        if (!options.pin) {
            this.options.pin = null;
        }
        this.desc.opts[15] = {
            name: 'lang',
            desc: 'Language to use for speech output.',
            example: 'en'
        };
        if (!options.lang)
            this.options.lang = null;
        this.desc.opts[16] = {
            name: 'pitch',
            desc: 'The pitch used for speak.'
        };
        if (!options.pitch)
            this.options.pitch = 1.0;
        this.desc.opts[17] = {
            name: 'rate',
            desc: 'The rate used for speak.'
        };
        if (!options.rate)
            this.options.rate = 1.0;
        this.desc.opts[18] = {
            name: 'anounceTitles',
            desc: 'If true titles are automatically anounced.'
        };
        if (typeof this.options.anounceTitles === 'undefined')
            this.options.anounceTitles = false;
        this.desc.opts[19] = {
            name: 'canmakeOffline',
            desc: 'If true titles can be made offline available. (only if ServiceWorker is activated, too)'
        };
        if (typeof this.options.canmakeOffline === 'undefined')
            this.options.canmakeOffline = false;
        this.desc.opts[20] = {
            name: 'artistsAttr',
            desc: 'Attribute that contains artists information'
        };
        if (!this.options.artistsAttr)
            this.options.artistsAttr = 'artists';

        this.desc.events[0] = {
            name: 'swac_REQUESTOR_ID_playstart',
            desc: 'Event fired when a new title begins to play.',
            data: 'Contains set attribute in the details.'
        }
        this.desc.events[1] = {
            name: 'swac_REQUESTOR_ID_playlist_end',
            desc: 'Event fired when all titles of the playlist where played.',
            data: 'Contains no data.'
        }
        this.desc.events[2] = {
            name: 'swac_REQUESTOR_ID_playlist_loop',
            desc: 'Event fired when the playlist starts over.',
            data: 'Contains no data.'
        }
        this.desc.events[3] = {
            name: 'swac_REQUESTOR_ID_playended',
            desc: 'Event fired when user stops playback of a song.',
            data: 'Contains set attribute in the details.'
        }
        this.desc.events[4] = {
            name: 'swac_REQUESTOR_ID_playnext',
            desc: 'Event fired when user stops playback and goes to next title.',
            data: 'Contains set attribute in the details.'
        }
        this.desc.events[5] = {
            name: 'swac_REQUESTOR_ID_playprev',
            desc: 'Event fired when user stops playback and goes to prev title.',
            data: 'Contains set attribute in the details.'
        }

        // Load language file for mediacode
        SWAC.lang.loadTranslationFile('../swac/components/Mediaplayer/langs/mediacode', 'Mediacode');

        // Internal attributes
        this.playlist = new Map();
        this.actTitle;
        this.actMediaElem;
        // Element references for efficent accces
        this.progressElem = null;
        this.curListTimeElems = null;
        this.wholeListTimeElems = null;
        this.curTitleTimeElems = null;
        this.wholeTitleTimeElems = null;
        this.slideshowElem = null;
        this.commentPoint = null;
        this.commentMediaId = null;
        this.comments = new Map(); // Map of comments with second as key
        this.lastoverlayclass = null; // Last used layout for overlay
        this.isfullscreen = false;
        this.keystartmedias = new Map();
        this.keystopmedias = new Map();
        this.loopbtn;
        this.titleEnded = null;
        this.synth = window.speechSynthesis;
        this.clickedTitle; // Title last clicked on
        this.cortryTo = null;
        this.actCopyrightNotice = null;
    }

    init() {
        return new Promise((resolve, reject) => {
            // Pin controls
            if (this.options.pin) {
                let css = '.swac_mediaplayer_control { position: fixed;';
                css += this.options.pin;
                css += 'left: 0px;z-index: 99;}'
                let cssElem = document.createElement('style');
                cssElem.innerHTML = css;
                document.head.appendChild(cssElem);
            }

            // Note time ciritcal elements
            this.progressElem = this.requestor.querySelector('.swac_mediaplayer_progress');
            this.curListTimeElems = this.requestor.querySelectorAll('.swac_mediaplayer_curlisttime');
            this.wholeListTimeElems = this.requestor.querySelectorAll('.swac_mediaplayer_wholelisttime');
            this.curTitleTimeElems = this.requestor.querySelectorAll('.swac_mediaplayer_curtitletime');
            this.wholeTitleTimeElems = this.requestor.querySelectorAll('.swac_mediaplayer_wholetitletime');
            this.slideshowElem = this.requestor.querySelector('.swac_mediaplayer_slideshow');

            // Register functions
            let fullBtn = this.requestor.querySelector('.swac_mediaplayer_fullscreen');
            if (!fullBtn) {
                // Function deactivated nothing todo
            } else if (this.options.showFullScreenButton) {
                fullBtn.addEventListener('click', this.onClickFullBtn.bind(this));
            } else {
                fullBtn.remove();
            }
            let prevBtn = this.requestor.querySelector('.swac_mediaplayer_prevtitleBtn');
            prevBtn.addEventListener('click', this.onClickPrevTitleBtn.bind(this));
            let nextBtn = this.requestor.querySelector('.swac_mediaplayer_nexttitleBtn');
            nextBtn.addEventListener('click', this.onClickNextTitleBtn.bind(this));
            let playBtn = this.requestor.querySelector('.swac_mediaplayer_playBtn');
            playBtn.addEventListener('click', this.togglePlay.bind(this));
            playBtn.focus();
            this.loopBtn = this.requestor.querySelector('.swac_mediaplayer_loopBtn');
            this.loopBtn.addEventListener('click', this.toggleLoop.bind(this));
            if (this.options.loop) {
                this.loopBtn.classList.add('swac_mediaplayer_loopBtn_active');
            }
            let muteButton = this.requestor.querySelector('.swac_mediaplayer_muteBtn');
            muteButton.addEventListener('click', this.toggleMute.bind(this));
            let volumeButton = this.requestor.querySelector('.swac_mediaplayer_volume');
            volumeButton.addEventListener('input', this.adjustVolume.bind(this));
            if (this.progressElem) {
                this.progressElem.addEventListener('click', this.onClickTimeline.bind(this));
            }
            // Key control
            document.addEventListener("keydown", this.onKeydown.bind(this));
            let downloadBtn = this.requestor.querySelector('.swac_mediaplayer_downloadBtn');
            if (downloadBtn) {
                downloadBtn.addEventListener('click', this.onClickDownloadBtn.bind(this));
            }

            // Add comment function or hide comment elements
            if (this.options.commentRequestor) {
                let commentBtn = this.requestor.querySelector('.swac_mediaplayer_commentbutton');
                let commentField = this.requestor.querySelector('[name="media_comment"]');
                if (commentBtn) {
                    commentField.addEventListener('click', this.onEnterCommentField.bind(this));
                    commentBtn.addEventListener('click', this.onComment.bind(this));
                }
            } else {
                let commentArea = this.requestor.querySelector('.swac_mediaplayer_commentarea');
                if (commentArea)
                    commentArea.classList.add('swac_dontdisplay');
            }

            // Add function for continue button in overlay
            let closeoverlayBtn = this.requestor.querySelector('.swac_mediaplayer_closeoverlay');
            if (closeoverlayBtn) {
                closeoverlayBtn.addEventListener('click', this.closeOverlay.bind(this));
            }

            // Add function for make titles offline available
            if (this.options.canmakeOffline && SWAC_config.progressive.active) {
                let makeoffBtn = this.requestor.querySelector('.swac_mediaplayer_makeoffline');
                if (makeoffBtn) {
                    makeoffBtn.classList.remove('swac_dontdisplay');
                    makeoffBtn.addEventListener('click', this.onMakeOffline.bind(this));
                }
                document.addEventListener("swac_serviceworker_msg", (msg) => {
                    // Only use the cached messages and do not look at non media files
                    if (msg.detail.includes('"type":"cached"') && !msg.detail.includes('.css')
                            && !msg.detail.includes('.html') && !msg.detail.includes('.json')
                            && !msg.detail.includes('.js') && !msg.detail.includes('.php')) {
                        let forTitle = JSON.parse(msg.detail);
                        if (!forTitle.setid) {
                            // Search title set
                            for (let curSource in thisRef.data) {
                                for (let curSet of thisRef.data[curSource].getSets()) {
                                    if (!curSet)
                                        continue;
                                    let epath = encodeURI(curSet.path);
                                    if (forTitle.url.includes(epath)) {
                                        forTitle.setid = curSet.id;
                                    }
                                }
                            }
                        }
                        // If it is no media from sets
                        if (!forTitle.setid)
                            return;
                        // Format title
                        let setElem = thisRef.requestor.querySelector('[swac_setid="' + forTitle.setid + '"]');
                        if (setElem) {
                            setElem.querySelector('.swac_mediaplayer_title').setAttribute('style', 'color: green;');
                        }
                    }
                });
            }

            // Add function for save playlist
            let saveBtns = this.requestor.querySelectorAll('.swac_mediaplayer_save');
            if (this.options.allowSave) {
                for (let curBtn of saveBtns) {
                    curBtn.addEventListener('click', this.saveData.bind(this));
                }
            } else {
                for (let curBtn of saveBtns) {
                    curBtn.classList.add('swac_dontdisplay');
                }
            }

            let thisRef = this;
            // Add control over mediaAPI
            const actionHandlers = [
                ['play', (evt) => {
                        thisRef.startPlay()
                    }],
                ['pause', (evt) => {
                        thisRef.stopPlay();
                    }],
                ['previoustrack', (evt) => {
                        thisRef.playPrevTitle()
                    }],
                ['nexttrack', (evt) => {
                        thisRef.playNextTitle()
                    }],
                ['stop', (evt) => {
                        thisRef.stopPlay()
                    }],
//                ['seekbackward',  (details) => { /* ... */ }],
//                ['seekforward',   (details) => { /* ... */ }],
//                ['seekto',        (details) => { /* ... */ }],
            ];

            for (const [action, handler] of actionHandlers) {
                try {
                    navigator.mediaSession.setActionHandler(action, handler);
                } catch (e) {
                    console.log(`The media session action "${action}" is not supported yet.`, e);
                }
            }

            // User browser lang if no lang defined
            if (!this.options.lang) {
                this.options.lang = navigator.language || navigator.userLanguage;
            }
            if (this.options.lang && !this.options.lang.includes('-')) {
                this.options.lang = this.options.lang + '-' + this.options.lang.toUpperCase();
            }

            // Build speech synth
            if (this.synth) {
                let voices = this.synth.getVoices();
                for (let curVoice of voices) {
                    if (curVoice.lang === this.options.lang) {
                        this.voice = curVoice;
                    }
                }
            } else {
                Msg.warn('Mediaplayer', 'No speech synth available.', this.requestor);
            }

            resolve();
        });
    }

    //Inheritted
    afterAddSet(set, repeateds) {
        let setId = set.id;
        // If set is an alternative for another use the setId of the alternative
        if (set.alternative) {
            setId = set.alternative;
            // Check if alternative is not the same
            if (set.id === set.alternative) {
                Msg.error('Mediaplayer', 'Media >' + set.id + '< references himself as alternatie.', this.requestor);
                return;
            }
        }

        // Set artists data
        if (set[this.options.artistsAttr]) {
            let artists = '';
            for (let curArtist of set[this.options.artistsAttr]) {
                if (artists != '')
                    artists += ', ';
                artists += curArtist.name;
            }
            for (let curRepeated of repeateds) {
                let artistsElem = curRepeated.querySelector('.swac_mediaplayer_artist');
                if (artistsElem)
                    artistsElem.innerHTML = artists;
            }
        }

        // Get media path
        let basepath = this.options.mediaBasePath;
        let path = set[this.options.pathattr];
        // Use absolute path if given
        if (path.startsWith('/') || path.startsWith('http') || path.startsWith('.') || path.startsWith('data:'))
            basepath = '';
        else if (!this.options.mediaBasePath) {
            // Use path of index file as root if no basepath is set
            let lastslash = set.swac_fromName.lastIndexOf('/');
            basepath = set.swac_fromName.substring(0, lastslash) + '/';
        }
        // Check if title is in cache
        if (this.options.canmakeOffline && SWAC_config.progressive.active) {
            SWAC.serviceWorker.postMessage('{"action":"checkCacheFile","url": "' + basepath + path + '","setid": "' + set.id + '"}');
            // Mediaplayer gets informed over reciver defined in init()
        }

        // Get set area
        let setAreas = this.requestor.querySelectorAll('[swac_fromname="' + set.swac_fromName + '"][swac_setid="' + setId + '"]');
        let mediaAreaFound = false;
        for (let curSetArea of setAreas) {
            let titlelinkElem = curSetArea.querySelector('.swac_mediaplayer_info');
            if (this.options.titleLinkBase && titlelinkElem) {
                let aText = SWAC.lang.dict.Mediaplayer.titlepage;
                let aElem = document.createElement('a');
                aElem.href = this.options.titleLinkBase + set.id;
                aElem.setAttribute('swac_lang', 'Mediaplayer.titlepage');
                aElem.innerHTML = aText;
                aElem.target = 'titlepage';
                aElem.onclick = function (e) {
                    e.stopPropagation()
                };
                titlelinkElem.appendChild(aElem);
            }

            let titleDownloadLink = curSetArea.querySelector('.swac_mediaplayer_title_download');
            if (!this.options.titleDownload && titleDownloadLink) {
                titleDownloadLink.style = 'display:none;';
            } else if (this.options.titleDownloadBase && titleDownloadLink) {
                // Call download page
                if (!titleDownloadLink.hasGoToDownload) {
                    titleDownloadLink.hasGoToDownload = true;
                    let thisRef = this;
                    titleDownloadLink.addEventListener('click', function (evt) {
                        evt.preventDefault();
                        evt.stopPropagation();
                        window.open(thisRef.options.titleDownloadBase + set.id);
                    });
                }
            } else if (titleDownloadLink) {
                // Direct download link
                titleDownloadLink.href = basepath + path;
                titleDownloadLink.setAttribute('download', set.title);
                if (!titleDownloadLink.hasGoToDownload) {
                    titleDownloadLink.hasGoToDownload = true;
                    titleDownloadLink.addEventListener('click', function (evt) {
                        evt.stopPropagation();
                    });
                }
            }

            let mediaArea = curSetArea.querySelector('.swac_mediaplayer_media');
            if (mediaArea) {
                let slideArea = curSetArea;
                mediaAreaFound = true;

                let mediaCode = new Mediacode(this.data, set, this.options.pathattr, 'mimetype', basepath);
//                console.log('TEST mediaCode:',set.id,mediaCode);
                if (!set.alternative && !set.startonkey && !set.stoponkey) {
                    // Create first element for media
                    let mediaSubArea = mediaCode.getMediaElement();
//                    console.log('TEST mediaSubArea',set.id,mediaSubArea);
                    mediaArea.appendChild(mediaSubArea);
                    // Get media element
                    let mediaElem = mediaArea.querySelector('audio, video');
//                    console.log('TEST mediaElem',set.id, mediaElem);
                    // Get slide no
                    let slideNo = 0;
                    let slideSearchElem = curSetArea;
                    while (slideSearchElem.previousElementSibling) {
                        slideNo++;
                        slideSearchElem = slideSearchElem.previousElementSibling;
                    }
                    set.slideno = slideNo;

                    // Hide title overlay
                    if (!this.options.showTitles) {
                        let titleoverlay = slideArea.querySelector('.swac_mediaplayer_titleoverlay');
                        if (titleoverlay)
                            titleoverlay.classList.add('swac_dontdisplay');
                    }
                    // Get media elems that could contain a length
                    if (mediaElem) {
                        mediaElem.setAttribute('uk-height-viewport', '');
                        let thisRef = this;
                        // Get media duration
                        if (set.duration) {
                            // Use duration from dataset if available
                            thisRef.playlist.set(slideNo, set);
                            // Load comments
                            thisRef.loadComments();
                            thisRef.calculateTimeline();
                        } else {
                            // Try calculate duration from media
                            if (mediaElem.duration) {
                                set.duration = mediaElem.duration;
                            } else {
                                set.duration = this.options.defaultDuration;
                            }
                            thisRef.playlist.set(slideNo, set);
                            mediaElem.load();
                            mediaElem.addEventListener('loadedmetadata', function () {
                                set.duration = mediaElem.duration;
                                // Update set
                                thisRef.playlist.set(slideNo, set);
                                // Load comments
                                thisRef.loadComments();
                                thisRef.calculateTimeline();
                            });
                        }

                        mediaElem.addEventListener('abort', function () {
                            console.log('TEST abort for', mediaElem.title);
                        });
                        mediaElem.addEventListener('emptied', function () {
                            console.log('TEST emptied for', mediaElem.title);
                        });
                        mediaElem.addEventListener('stalled', function () {
                            console.log('TEST stalled for', mediaElem.title);
                        });
                        mediaElem.addEventListener('suspend', function () {
//                            console.log('TEST suspend for', mediaElem.title);
                        });
                        mediaElem.addEventListener('waiting', function () {
                            console.log('TEST waiting for', mediaElem.title);
                        });
                        mediaElem.addEventListener('canplay', function () {
                            console.log('TEST canplay for', mediaElem.title);
                        });

                        // Determine where error events come from
                        let errReportingElem = mediaElem;
                        let sourceElem = mediaElem.querySelector('source');
                        if (sourceElem) {
                            errReportingElem = sourceElem;
                        }

                        // If an error occures while loading try again
                        errReportingElem.addEventListener('error', function () {
                            const err = mediaElem.error;
                            Msg.error('MediaPlayer', 'Error playing title >' + mediaElem.title + '<: ' + err, this.requestor);
                            // Show error in gui
                            for (let curRepeated of repeateds) {
                                let errElem = curRepeated.querySelector('.swac_mediaplayer_error');
                                if (errElem)
                                    errElem.classList.remove('swac_dontdisplay');
                            }

                            thisRef.playNextTitle();
                        });
                        mediaElem.addEventListener('playing', function (evt) {

                        });
                    } else if (set.duration) {
                        Msg.info('Mediaplayer', 'Added media >'
                                + set.id + '< to playlist with duration from dataset of >'
                                + set.duration + '< seconds.', this.requestor);
                        this.playlist.set(slideNo, set);
                        // Load comments
                        this.loadComments();
                        this.calculateTimeline();
                    } else {
                        Msg.info('Mediaplayer', 'Added media >'
                                + set.id + '< to playlist with duration from '
                                + 'default option >' + this.options.defaultDuration
                                + '< seconds.', this.requestor);
                        set.duration = this.options.defaultDuration;
                        this.playlist.set(slideNo, set);
                        // Load comments
                        this.loadComments();
                        this.calculateTimeline();
                    }
                } else if (set.alternative) {
                    let mediaElem = mediaArea.querySelector('audio, video');
                    // Add alternative for media
                    mediaCode.createMediaSource(mediaElem);
                    // Hide original slide
                    let hideAreas = this.requestor.querySelectorAll('[swac_fromname="' + set.swac_fromName + '"][swac_setid="' + set.id + '"]');
                    for (let curHideArea of hideAreas) {
                        curHideArea.parentElement.removeChild(curHideArea);
                    }
                } else {
                    let keymediaArea = this.requestor.querySelector('.swac_mediaplayer_keymedias');
                    let keymediaRepeat = keymediaArea.querySelector('.swac_repeatForKeymedia').cloneNode(true);
                    keymediaRepeat.classList.remove('swac_repeatForKeymedia');
                    keymediaRepeat.classList.add('swac_repeatedForKeymedia');
                    keymediaArea.appendChild(keymediaRepeat);
                    let keymediacard = keymediaRepeat.querySelector('.swac_mediaplayer_keymediacard');
                    let keymediakey = keymediaRepeat.querySelector('.swac_mediaplayer_keymediakey');
                    keymediakey.innerHTML = set.startonkey;
                    if (set.stoponkey)
                        keymediakey.innerHTML += '-' + set.stoponkey;
                    let keymediatitle = keymediaRepeat.querySelector('.swac_mediaplyer_keymediatitle');
                    keymediatitle.innerHTML = set.title;
                    let keymediadesc = keymediaRepeat.querySelector('.swac_mediaplayer_desc');
                    keymediadesc.innerHTML = set.desc;

                    if (set.mimetype.includes('audio')) {
                        let audioElem = document.createElement('audio');
                        audioElem.setAttribute('id', 'keymedia_' + set.id);
                        audioElem.setAttribute('controls', 'controls');
                        let sourceElem = document.createElement('source');
                        sourceElem.setAttribute('src', basepath + set.path);
                        sourceElem.setAttribute('type', set.mimetype);
                        audioElem.appendChild(sourceElem);
                        keymediacard.appendChild(audioElem);
                        // Add to key list
                        if (set.startonkey) {
                            if (!this.keystartmedias.has(set.startonkey)) {
                                this.keystartmedias.set(set.startonkey, []);
                            }
                            this.keystartmedias.get(set.startonkey).push(set);
                        }
                        if (set.stoponkey) {
                            if (!this.keystopmedias.has(set.stoponkey)) {
                                this.keystopmedias.set(set.stoponkey, []);
                            }
                            this.keystopmedias.get(set.stoponkey).push(set);
                        }
                    }
                }
            }
            // Add event listener for media list
            if (!set.alternative && curSetArea.classList.contains('swac_mediapalyer_playlistentry')) {
                curSetArea.addEventListener('click', this.onClickPlaylistEntry.bind(this));
                let removeElem = curSetArea.querySelector('.swac_mediaplayer_removefromlist');
                if (removeElem) {
                    if (this.options.allowDel) {
                        removeElem.addEventListener('click', this.onClickRemove.bind(this));
                    } else {
                        removeElem.classList.add('swac_dontdisplay');
                    }
                }
            }
        }

        if (!mediaAreaFound) {
            Msg.error(
                    'Mediaplayer',
                    'Mediaarea >.swac_mediaplayer_media< could not be found for set >'
                    + set.swac_fromName + '[' + set.id + ']<',
                    this.requestor);
        }
    }

    afterRemoveSet(set) {
        // Search playlist entry for remove
        let found = false;
        for (let curEntry of this.playlist.entries()) {
            let curId = curEntry[0];
            let curVal = curEntry[1];
            if (curVal.id === set.id && curVal.swac_fromName === set.swac_fromName) {
                this.playlist.delete(curId);
                found = true;
            }
        }
        // Return if media is not available
        if (!found)
            return;

        this.calculateTimeline();
        // Reset to first entry
        let firstSlide = this.slideshowElem.querySelector('.swac_repeatedForSet');
        firstSlide.classList.add('uk-active');
        // Reset time
        this.progressElem.value = 0;
        if (this.options.customAfterRemoveSet) {
            this.options.customAfterRemoveSet(set);
        }
    }

    /**
     * Calculates the timeline and displays it.
     * 
     * @returns {undefined}
     */
    calculateTimeline() {
        // Get sum of length
        let lengthSum = 0;
        for (let [key, set] of this.playlist) {
            lengthSum += set.duration;
        }
        let cssrule = 'background: linear-gradient(to right, ';
        let endSec = 0;
        let endPos = 0;
        let colors = ['white', 'black'];
        let i = 0;
        let sortedPlaylist = new Map([...this.playlist.entries()].sort((a, b) => parseInt(a) - parseInt(b)));
        for (let [key, set] of sortedPlaylist) {
            // Set the startpoint to the last endpoint
            set.startsec = Math.round(endSec);
            if (i > 0) {
                cssrule += ', ';
            }
            cssrule += colors[i % 2] + ' ';
            if (endPos > 0) {
                cssrule += endPos + '% ';
            }
            // Get endposition of track in seconds
            endSec = endSec + set.duration;
            // Calculate new endpos
            endPos = Math.round((endSec / lengthSum) * 100);
            cssrule += endPos + '% ';
            i++;
        }
        cssrule += ');';
        // Disable old sheet
        for (let i = 0; i < document.styleSheets.length; i++) {
            let curSheet = document.styleSheets[i];
            if (!curSheet.href) {
                if (curSheet.cssRules[0] && curSheet.cssRules[0].cssText.includes('swac_mediaplayer_progress')) {
//                    console.log('disable sheet:',document.styleSheets[i].cssRules[0].cssText);
                    document.styleSheets[i].disabled = true;
                }
            }
        }

        // Add style for different browsers
        if ('MozBoxSizing' in document.body.style) {
            this.addCSSRule("input[class='swac_mediaplayer_progress']::-moz-range-track", cssrule);
        } else if (window.chrome) {
            this.addCSSRule("input[class='swac_mediaplayer_progress']::-webkit-slider-runnable-track", cssrule);
        } else {
            this.addCSSRule("input[class='swac_mediaplayer_progress']::-ms-track", cssrule);
        }

        let lengthString = this.formatSecondsToReadable(lengthSum);
        // Output sum of length
        for (let curWholeTimeelem of this.wholeListTimeElems) {
            curWholeTimeelem.innerHTML = lengthString;
        }
        // Set current play position
        for (let curTimeElem of this.curListTimeElems) {
            curTimeElem.innerHTML = '0:00';
        }
        // Set max time value
        this.progressElem.setAttribute('max', Math.ceil(lengthSum) + 1);
    }

    /**
     * Formats a time given in seconds to a more human readable format
     * 
     * @param {Double} seconds Seconds
     * @returns {String}
     */
    formatSecondsToReadable(seconds) {
        let minutes = Math.floor(seconds / 60);
        let remainingSeconds = seconds - (minutes * 60);
        let remseconds = Math.round(remainingSeconds);
        if (remseconds < 10) {
            remseconds = '0' + remseconds;
        }
        return minutes + ':' + remseconds;
    }

    /**
     * Starts or pauses the play
     * 
     * @param {DOMEvent} evt Event htat is requestion the start or pause, maybe null
     * @returns {undefined}
     */
    togglePlay(evt) {
        if (evt)
            evt.preventDefault();

        // If play is stopped start
        if (!this.interval) {
            this.startPlay();
        } else {
            // Stop play
            this.stopPlay();
        }
    }

    /**
     * Starts the playback
     * 
     * @returns {undefined}
     */
    startPlay() {
        Msg.flow('Mediaplayer', 'Start playing', this.requestor);
        // Start interval
        if (!this.interval) {
            this.interval = setInterval(this.playNextSecond.bind(this), 1000);
        }

        // Change icon and description of play buttons
        let playBtns = this.requestor.querySelectorAll('.swac_mediaplayer_playBtn');
        for (let curPlayBtn of playBtns) {
            curPlayBtn.setAttribute('uk-icon', 'close');
            curPlayBtn.setAttribute('uk-tooltip', SWAC.lang.dict.Mediaplayer.pause);
        }
    }

    /**
     * Stops the playback
     * 
     * @returns {undefined}
     */
    stopPlay() {
        Msg.flow('MediaPlayer', 'stopPlay()', this.requestor);
        if (this.actMediaElem) {
            this.actMediaElem.pause();
        }
        clearInterval(this.interval);
        this.interval = null;
        // Change icon and description of play buttons
        let playBtns = this.requestor.querySelectorAll('.swac_mediaplayer_playBtn');
        for (let curPlayBtn of playBtns) {
            curPlayBtn.setAttribute('uk-icon', 'play');
            curPlayBtn.setAttribute('uk-tooltip', SWAC.lang.dict.Mediaplayer.play);
        }
        // Remove copyright notice
        let copyrightElem = document.querySelector('.swac_mediaplayer_copynotice');
        if (copyrightElem) {
            // Remove copy notice after end
            copyrightElem.remove();
        }

        // Update media metadata
        if ("mediaSession" in navigator) {
            navigator.mediaSession.playbackState = 'paused';
        }
    }

    /**
     * Starts / restarts the playback with fadein effect
     * 
     * @returns {undefined}
     */
    fadeinPlay() {
        if (!this.interval)
            this.interval = setInterval(this.playNextSecond.bind(this), 1000);
        if (this.actMediaElem) {
            if (this.actTitle.fadein)
                this.fadein(this.actMediaElem, this.actTitle.fadein);
            this.actMediaElem.play();
        }
    }

    /**
     * Stops the playback
     * 
     * @returns {undefined}
     */
    fadeoutPlay() {
        if (this.actMediaElem) {
            if (this.actTitle.fadeout) {
                let thisRef = this;
                this.fadeout(this.actMediaElem, this.actTitle.fadeout);
                setTimeout(function () {
                    thisRef.stopPlay();
                }, this.actTitle.fadeout * 1000);
            } else {
                this.actMediaElem.pause();
                this.stopPlay();
            }
        }
    }

    /**
     * Plays the next second of the playlist. Switches slide if neccwssery.
     * 
     * @returns {undefined}
     */
    async playNextSecond() {
        // Stop if actual second is beyond max
        if (parseInt(this.progressElem.value) >= parseInt(this.progressElem.max)) {
            if (this.options.loop) {
                Msg.info('Mediaplayer', 'All titles on playlist are played. Loop list.', this.requestor);
                this.progressElem.value = 0;
                this.actTitle = null;
                this.actMediaElem = null;
                let completeEvent = new CustomEvent('swac_' + this.requestor.id + '_playlist_loop', {});
                document.dispatchEvent(completeEvent);
            } else {
                Msg.info('Mediaplayer', 'All titles on playlist are played. Playback stoped.', this.requestor);
                clearInterval(this.interval);
                this.interval = null;
                this.progressElem.value = 0;
                this.actTitle = null;
                this.actMediaElem = null;
                let completeEvent = new CustomEvent('swac_' + this.requestor.id + '_playlist_end', {});
                document.dispatchEvent(completeEvent);

                // Change icon and description of play buttons
                let playBtns = this.requestor.querySelectorAll('.swac_mediaplayer_playBtn');
                for (let curPlayBtn of playBtns) {
                    curPlayBtn.setAttribute('uk-icon', 'play');
                    curPlayBtn.setAttribute('uk-tooltip', SWAC.lang.dict.Mediaplayer.play);
                }
                return;
            }
        }

        // Get title at second
        let secTitle = this.getTitleAtSecond(this.progressElem.value);
        if (!secTitle) {
            Msg.info('MediaPlayer', 'No title found for second >' + this.progressElem.value + '<', this.reqeustor);
            clearInterval(this.interval);
            UIkit.modal.alert(SWAC.lang.dict.Mediaplayer.title_none);
        }
        // Get next to play title
        let nextTitle = this.getNextTitle();
        if (secTitle.skip && this.clickedTitle !== secTitle) {
            Msg.info('Mediaplayer', 'Title >' + secTitle.tile + '< skipped.', this.requestor);
            this.progressElem.value = nextTitle.startsec;
            return;
        }
        // Check if title is at end and should be stopped
        if (this.actTitle && this.actTitle.autostop && this.progressElem.value >= nextTitle.startsec - 1) {
            Msg.info('Mediaplayer', 'Title >' + this.actTitle.title + '< ended and playback auto stopped.', this.requestor);
            this.stopPlay();
            return;
        }
        // If title is ended wait until next title should start
        if (this.titleEnded === secTitle) {
            this.progressElem.value++;
            return;
        }
        // Switch to next title
        if (!this.actTitle || this.actTitle !== secTitle) {
            // If title is ended and loop is active reset timeline
            if (this.actTitle?.loop) {
                this.progressElem.value = this.actTitle.startsec;
                return;
            }

            Msg.info(
                    'Mediaplayer',
                    'Switching from >' + (this.actTitle?.title ?? 'none') + '< to title >' + (this.actTitle?.title ?? 'unknown') + '<',
                    this.requestor
                    );
            this.actTitle = secTitle;
            this.titleEnded = null;
            // Get matching slide
            let slide = this.slideshowElem.querySelector('[swac_setid="' + this.actTitle.id + '"]');
            // Pause previous playback
            if (this.actMediaElem) {
                this.actMediaElem.pause();
                this.actMediaElem.currentTime = 0;
            }

            if (this.options.anounceTitles) {
                clearInterval(this.interval);
                this.interval = null;
                await this.anounceTitle();
                this.interval = setInterval(this.playNextSecond.bind(this), 1000);
            }

            // Hide old copyrightnotice
            if (this.actCopyrightNotice) {
                this.actCopyrightNotice.remove();
                this.actCopyrightNotice = null;
            }

            // Create new copyright notice
            if (this.actTitle.copyright) {
                let playerElem = this.requestor.querySelector('.swac_mediaplayer_slideshow');
                let copyNoticeElem = document.createElement('div');
                copyNoticeElem.innerHTML = this.actTitle.copyright;
                copyNoticeElem.classList.add('swac_mediaplayer_copynotice');
                playerElem.appendChild(copyNoticeElem);
                this.actCopyrightNotice = copyNoticeElem;
            }

            // Get actual media element
            this.actMediaElem = slide.querySelector('audio, video');
            if (this.actMediaElem) {
                // Set play timepoint to current timepoint
                if (this.progressElem.value > this.actTitle.startsec) {
                    let runSecs = this.progressElem.value - this.actTitle.startsec;
                    this.actMediaElem.currentTime = runSecs;
                }
                // Fadein if defined
                if (this.actTitle.fadein)
                    this.fadein(this.actMediaElem, this.actTitle.fadein);
                // Set volume
                if (this.actTitle.volume) {
                    this.actMediaElem.volume = this.actTitle.volume / 100;
                    let volumeButton = this.requestor.querySelector('.swac_mediaplayer_volume');
                    volumeButton.value = this.actTitle.volume;
                }
                // Start playing title
                this.actMediaElem.play();

                // Add event listener for waiting on finished playing
                let thisRef = this;
                this.actMediaElem.addEventListener('ended', function (e) {
                    // Send play event
                    let completeEvent = new CustomEvent('swac_' + thisRef.requestor.id + '_playended', {
                        detail: {
                            set: thisRef.actTitle,
                            duration: thisRef.progressElem.value - thisRef.actTitle.startsec
                        }
                    });
                    document.dispatchEvent(completeEvent);
                    thisRef.titleEnded = thisRef.actTitle;
                });
            } else {
                Msg.info('Mediaplayer', 'There is no actual playable media element.', this.requestor);
            }
            // Update playnow information
            this.updateCurrentTitleInformation(this.actTitle);

            // Send play event
            let completeEvent = new CustomEvent('swac_' + this.requestor.id + '_playstart', {
                detail: {
                    set: this.actTitle
                }
            });
            document.dispatchEvent(completeEvent);
        }

        if (this.actMediaElem && this.actMediaElem.paused) {
            Msg.info('Mediaplayer', 'Resume playing >' + this.actMediaElem.title + '<', this.requestor);
            this.actMediaElem.load();
            this.actMediaElem.play().then().catch(error => {
                // Autoplay wurde blockiert
                UIkit.modal.alert(SWAC.lang.dict.Mediaplayer.playnotallowed);
                clearInterval(this.interval);
                this.interval = null;
            });
            if ("mediaSession" in navigator) {
                navigator.mediaSession.playbackState = 'playing';
            }
        }

        if (this.actMediaElem && this.progressElem.value === this.lastProgressElemValue) {
            this.hangingTimes++
            if (this.hangingTimes > 5) {
                this.actMediaElem.load();
                this.actMediaElem.play();
            }
        } else {
            this.hangingTimes = 0;
        }
        this.lastProgressElemValue = this.progressElem.value;

        // Update media playtime if timeline was clicked before
        if (this.timelineclicked) {
            this.actMediaElem.currentTime = this.progressElem.value - this.actTitle.startsec;
            this.timelineclicked = false;
        }
        // Update playlist progress
        if (this.actMediaElem) {
            this.progressElem.value = this.actTitle.startsec + this.actMediaElem.currentTime;
        } else {
            this.progressElem.value++;
        }
        let listPlayTime = this.formatSecondsToReadable(this.progressElem.value);
        for (let curCurTimeElem of this.curListTimeElems)
            curCurTimeElem.innerHTML = listPlayTime;
        // update playtime for title
        if (this.actMediaElem) {
            let titlePlayTime = this.formatSecondsToReadable(this.actMediaElem.currentTime);
            for (let curTimeElem of this.curTitleTimeElems) {
                curTimeElem.innerHTML = titlePlayTime;
            }
        }

        // Start fadeout if title has reached position of fadeout
        if (this.actMediaElem && this.actTitle.fadeout) {
            let leftseconds = this.actMediaElem.duration - this.actMediaElem.currentTime;
            if (this.actTitle.fadeout === leftseconds)
                this.fadeout(this.actMediaElem, this.actTitle.fadeout);
        }

        // Search if there is a comment to show up
        let curComments = this.comments.get(this.progressElem.value);
        if (curComments) {
            for (let curComment of curComments) {
                // Simple comment handling
                if (curComment.comment) {
                    UIkit.notification({
                        message: curComment.comment,
                        pos: 'top-center',
                        timeout: 5000
                    });
                } else if (curComment.media) {
                    // Stop if should stopped
                    if (curComment.stop) {
                        this.stopPlay();
                    }
                    // Register resume
                    if (curComment.resumeafter) {
                        let thisRef = this;
                        thisRef.pausetime = 0;
                        let resumeInterval = setInterval(function () {
                            thisRef.pausetime += 1;
                            if (thisRef.pausetime > curComment.resumeafter) {
                                thisRef.closeOverlay();
                                clearInterval(resumeInterval);
                            }
                        }, 1000);
                    }
                    // Open overlay content
                    this.openOverlay(this.comments.values(), curComment);
                }
            }
        }
        this.progressElem.value++;
    }

    /**
     * Gets the tilte that should be played on the given second
     * 
     * @param {int} sec Second
     * 
     * @returns {WatchableSet} Title set
     */
    getTitleAtSecond(sec) {
        Msg.flow('Mediaplayer', 'getTitleAtSecond(' + sec + ')', this.requestor);
        for (let [key, set] of this.playlist) {
            if (sec >= set.startsec && sec <= (set.startsec + set.duration)) {
                return set;
            }
        }
    }

    /**
     * Get the next title from playlist
     * 
     * @returns {WatchableSet} Next title
     */
    getNextTitle() {
        let curTitle = this.getTitleAtSecond(this.progressElem.value);
        if (!curTitle) {
            return this.playlist.get(1);
        }
        let nextTitle;
        let nextId = curTitle.slideno + 1;
        const sortedIds = Array.from(this.playlist.keys()).sort((a, b) => a - b);
        const startIndex = sortedIds.findIndex(id => id >= nextId);

        for (let i = startIndex; i < sortedIds.length; i++) {
            const id = sortedIds[i];
            const title = this.playlist.get(id);
            if (!title || title.startonkey || title.skip) {
                continue;
            }
            nextTitle = title;
            break;
        }
        if (!nextTitle)
            nextTitle = this.playlist.get(1);
        return nextTitle;
    }

    /**
     * Get previous title from playlist
     * 
     * @returns {WatschableSet} Prev title
     */
    getPrevTitle() {
        const curTitle = this.getTitleAtSecond(this.progressElem.value);
        if (!curTitle) {
            // Fallback: letzter Eintrag in der Map
            const sortedIds = Array.from(this.playlist.keys()).sort((a, b) => b - a);
            return this.playlist.get(sortedIds[0]);
        }

        const sortedIds = Array.from(this.playlist.keys()).sort((a, b) => b - a);
        const curIndex = sortedIds.findIndex(id => id === curTitle.slideno);

        for (let i = curIndex + 1; i < sortedIds.length; i++) {
            const id = sortedIds[i];
            const title = this.playlist.get(id);
            if (!title || title.startonkey || title.skip) {
                continue;
            }
            return title;
        }

        // Fallback: falls kein gültiger vorheriger Titel gefunden wurde
        return this.playlist.get(sortedIds[0]);
    }

    /**
     * Jumps to the previous title from playlist
     * 
     * @param {DOMEvent} evt Event that triggers this jump
     * @returns {undefined}
     */
    onClickPrevTitleBtn(evt) {
        evt.preventDefault();
        this.playPrevTitle();
    }

    /**
     * Jump to prev title
     */
    playPrevTitle() {
        if (this.actTitle) {
            // Send play prev event
            let completeEvent = new CustomEvent('swac_' + this.requestor.id + '_toprev', {
                detail: {
                    set: this.actTitle,
                    duration: this.progressElem.value - this.actTitle.startsec
                }
            });
            document.dispatchEvent(completeEvent);
            // Stop playback
            if (this.actTitle.autostop) {
                this.stopPlay();
            }
        }
        let prevTitle = this.getPrevTitle();
        this.progressElem.value = Math.round(prevTitle.startsec + 0.5);
        this.actTitle = null;
        if (prevTitle.autoplay) {
            this.startPlay();
        }
        if (!this.interval) {
            this.updateCurrentTitleInformation();
        }
    }

    /**
     * Jumps to the next title from playlist
     * 
     * @param {DOMEvent} evt Event that triggers this jump
     * @returns {undefined}
     */
    onClickNextTitleBtn(evt) {
        evt.preventDefault();
        this.playNextTitle();
    }

    /**
     * Jump to next title
     */
    playNextTitle() {
        if (this.actTitle) {
            // Send tonext event
            let tonextEvent = new CustomEvent('swac_' + this.requestor.id + '_tonext', {
                detail: {
                    set: this.actTitle,
                    duration: this.progressElem.value - this.actTitle.startsec
                }
            });
            document.dispatchEvent(tonextEvent);
            // Stop playback
            if (this.actTitle.autostop) {
                this.stopPlay();
            }
        }
        let nextTitle = this.getNextTitle();
        // Set time on starttime for next title
        this.progressElem.value = Math.round(nextTitle.startsec + 0.5);
        this.actTitle = null;
        // Start playback when autoplay is active
        if (nextTitle.autoplay) {
            this.startPlay();
        }
        if (!this.interval)
            this.updateCurrentTitleInformation();
    }

    /**
     * Called when clicking the remove media button in a playlist. Removes the 
     * medie from playlist and playback.
     * 
     * @param {DOMEvent} evt Event that calls the method
     */
    onClickRemove(evt) {
        evt.preventDefault();
        evt.stopPropagation();
        // Stop playback
        this.stopPlay();
        let repElem = this.findRepeatedForSet(evt.target);
        this.removeSet(repElem.getAttribute('swac_fromname'), repElem.getAttribute('swac_setid'));
    }

    /**
     * Triggers the download of the file that is related to the acutal shown slide
     * 
     * @param {DOMElement} evt Click event that calls this function
     * @returns {undefined}
     */
    onClickDownloadBtn(evt) {
        evt.preventDefault();
        // Get actual slide
        let mediaArea = this.requestor.querySelector('.uk-active > .swac_mediaplayer_media');
        let mediaElems = mediaArea.querySelectorAll('audio, video, picture, img');
        let downloadLink;
        // Look at each media element
        for (let curMediaElem of mediaElems) {
            // Exclude cover medias
            if (!curMediaElem.classList.contains('swac_media_cover')) {
                // If there is an direct src
                if (curMediaElem.src) {
                    downloadLink = curMediaElem.src;
                } else {
                    // Get source elements
                    let sourceElems = curMediaElem.querySelectorAll('source');
                    for (let curSourceElem of sourceElems) {
                        //TODO deside which to download
                        downloadLink = curSourceElem.src;
                        break;
                    }
                }
                break;
            }
        }

        // Get filename
        let lastSlashPos = downloadLink.lastIndexOf('/');
        let filename = downloadLink.substring(lastSlashPos);

        // Create downloadlink and click it
        let aElem = document.createElement('a');
        aElem.setAttribute('href', downloadLink);
        aElem.setAttribute('download', filename);
        aElem.style.display = 'none';
        document.body.appendChild(aElem);
        aElem.click();
        document.body.removeChild(aElem);
    }

    /**
     * Function to execute when an playlist entry is clicked. Opens the slider 
     * belongign to the clicked media.
     * 
     * @param {DOMEvent} evt Event calling the method
     * @returns {undefined}
     */
    onClickPlaylistEntry(evt) {
        evt.preventDefault();
        let setElem = this.findRepeatedForSet(evt.target);
        if (typeof setElem.swac_dataset.startsec === 'undefined') {
            UIkit.modal.alert(SWAC.lang.dict.Mediaplayer.title_problem);
            return;
        }
        this.progressElem.value = Math.round(setElem.swac_dataset.startsec + 0.5);
        this.clickedTitle = setElem.swac_dataset;
        // Autostart at title if its not playing
        if (!this.interval) {
            this.startPlay();
        }
    }

    updateCurrentTitleInformation() {
        let nowSec = parseInt(this.progressElem.value);
        Msg.flow('Mediaplayer', 'updateCurrentTitleInformation nowSec: ' + nowSec, this.requestor);
        let title = this.getTitleAtSecond(nowSec);
        let curTimeStr = this.formatSecondsToReadable(this.progressElem.value);
        for (let curListTimeElem of this.curListTimeElems) {
            curListTimeElem.innerHTML = curTimeStr;
        }

        for (let curWholeTitleElem of this.wholeTitleTimeElems) {
            curWholeTitleElem.innerHTML = this.formatSecondsToReadable(title.duration);
        }

        for (let curTitleTimeElem of this.curTitleTimeElems) {
            let pastSecs = this.progressElem.value - title.startsec;
            curTitleTimeElem.innerHTML = this.formatSecondsToReadable(pastSecs);
        }

        // Remove old playing marker
        let playElem = this.requestor.querySelector('.swac_mediaplayer_playing');
        if (playElem)
            playElem.classList.remove('swac_mediaplayer_playing');
        // Mark playlist entry
        let playlistElem = this.requestor.querySelector('#swac_mediaplayer_playlist [swac_setid="' + title.id + '"]');
        playlistElem.classList.add('swac_mediaplayer_playing');
        playlistElem.scrollIntoView({
            behavior: "smooth",
            block: "center",
            inline: "nearest"
        });

        // Apply title slide effect
        if (title.startAnimationEffect) {
            this.updateSlideshowAnimation(title.startAnimationEffect);
        }

        // Show matching slide
        UIkit.slideshow(this.slideshowElem).show(title.slideno);

        // Update media session
        if ("mediaSession" in navigator) {
            let mediainfo = {
                title: title.title,
                artist: title.artist,
                album: title.album
            }
            if (title.image)
                mediainfo.artwork = [
                    {src: this.options.mediaBasePath + title.image, sizes: 'any', type: 'image/jpg'}
                ]
            navigator.mediaSession.metadata = new MediaMetadata(mediainfo);
            navigator.mediaSession.playbackState = 'playing';
        }
    }

    onClickTimeline(evt) {
        if (!this.interval) {
            // Get play title
            let title = this.getTitleAtSecond(this.progressElem.value);
            this.updateCurrentTitleInformation(title);
        } else {
            this.timelineclicked = true;
        }
    }

    /**
     * When the fullscreen button is clicked
     */
    onClickFullBtn(evt) {
        evt.preventDefault();
        let playerElem = this.requestor; //.querySelector('.swac_mediaplayer_container');
        if (playerElem.requestFullscreen) {
            playerElem.requestFullscreen();
        } else if (playerElem.webkitRequestFullscreen) { /* Safari */
            playerElem.webkitRequestFullscreen();
        } else if (playerElem.msRequestFullscreen) { /* IE11 */
            playerElem.msRequestFullscreen();
        }
//        let prevElem = this.requestor.querySelector('[uk-slidenav-previous]');
//        prevElem.classList.add('swac_dontdisplay');
//        prevElem.setAttribute('style', 'display: none;');
//        let nextElem = this.requestor.querySelector('[uk-slidenav-next]');
//        nextElem.classList.add('swac_dontdisplay');
//        nextElem.setAttribute('style', 'display: none;');
        document.addEventListener('fullscreenchange', this.onFullscreenchange.bind(this), false);
        document.addEventListener('MSFullscreenChange', this.onFullscreenchange.bind(this), false);
    }

    /**
     * When fullscreen mode is left
     */
    onFullscreenchange(evt) {
        if (this.isfullscreen) {
//            let prevElem = this.requestor.querySelector('[uk-slidenav-previous]');
//            prevElem.classList.remove('swac_dontdisplay');
//            prevElem.setAttribute('style', 'display: block;');
//            let nextElem = this.requestor.querySelector('[uk-slidenav-next]');
//            nextElem.classList.remove('swac_dontdisplay');
//            nextElem.setAttribute('style', 'display: block;');
            this.isfullscreen = false;
        } else {
            this.isfullscreen = true;
        }
    }

    /**
     * Toggles mute of the current played media
     * 
     * @param {DOMEvent} evt Event that calls the mute toggle, can be null
     * @returns {undefined}
     */
    toggleMute(evt) {
        if (evt)
            evt.preventDefault();
        if (!this.actMediaElem)
            return;
        if (this.actMediaElem.muted) {
            this.actMediaElem.muted = false;
        } else {
            this.actMediaElem.muted = true;
        }
    }

    /**
     * Adjusts the volume of the current media according to the slide element
     * 
     * @param {DOMEvent} evt Event that calls the adjustment
     * @returns {undefined}
     */
    adjustVolume(evt) {
        if (evt)
            evt.preventDefault();
        let volumeButton = this.requestor.querySelector('.swac_mediaplayer_volume');
        let volume = volumeButton.value / 100;
        // Adjust let volumeButton = this.requestor.querySelector('.swac_mediaplayer_volume');volume at all medias
        let mediaElems = this.requestor.querySelectorAll('audio, video');
        for (let curMediaElem of mediaElems) {
            curMediaElem.volume = volume;
        }
    }

    /**
     * Starts the media and fades in
     * 
     * @param {DOMElement} mediaElem Media element that should be faded out
     * @param {int} seconds Seconds to fade out
     */
    fadein(mediaElem, seconds) {
        mediaElem.volume = 0;
        let fadepercentage = (100 / seconds / 4) / 100;
        let fadeintval = setInterval(function () {
            mediaElem.volume += fadepercentage;
        }, 250);
        setTimeout(function () {
            clearInterval(fadeintval);
        }, seconds * 1000);
    }

    /**
     * Fades the media out and jumps to next title
     * 
     * @param {DOMElement} media Media element that should be faded out
     * @param {int} seconds Seconds to fade out
     */
    fadeout(mediaElem, seconds) {
        let fadepercentage = (100 / seconds / 4) / 100;
        let fadeouttval = setInterval(function () {
            if (mediaElem.volume - fadepercentage > 0)
                mediaElem.volume -= fadepercentage;
            else {
                clearInterval(fadeouttval);
                mediaElem.pause();
            }
        }, 250);
    }

    /**
     * Loads the comments
     * 
     * @returns {undefined}
     */
    loadComments() {
        // Delete prev loaded comments
        this.comments = new Map();
        if (!this.options.commentRequestor) {
            return;
        }
        // Load comments
        let thisRef = this;
        this.options.commentRequestor.requestor = this.requestor;
        Model.load(this.options.commentRequestor).then(
                function (data) {
                    for (let curComment of data) {
                        // Jump over empty sets
                        if (!curComment)
                            continue;
                        // Get media
                        let media;
                        for (let curMedia of thisRef.playlist.values()) {
                            if (curMedia.id === curComment.mediaid) {
                                media = curMedia;
                                break;
                            }
                        }
                        if (!media) {
                            Msg.warn('Mediaplayer',
                                    'Media with id >' + curComment.mediaid
                                    + '< was not found.');
                            break;
                        }
                        let showpoint = media.startsec + curComment.timepoint;
                        // Create commentlist for timepoint
                        if (!thisRef.comments.get(showpoint)) {
                            thisRef.comments.set(showpoint, []);
                        }
                        let commentlist = thisRef.comments.get(showpoint);
                        commentlist.push(curComment);
                        thisRef.comments.set(showpoint, commentlist);
                    }
                }
        ).catch(
                function (error) {
                    Msg.error('Mediaplayer', 'Could not load comments >' + error + '<');
                }
        );
    }

    /*
     * Function executet when a user clicks the comment field. Pauses the playback.
     * 
     * @param {DOMEvent} evt Event that calls the function.
     * @returns {undefined}
     */
    onEnterCommentField(evt) {
        if (evt)
            evt.preventDefault();
        this.commentPoint = this.progressElem.value;
        // Get lengths of previous titles
        // Find slide that should be active at this time
        let sortedPlaylist = new Map([...this.playlist.entries()].sort((a, b) => parseInt(a) - parseInt(b)));
        let prevTitleLength = 0;
        let lastTitleLength = 0;
        for (let [key, set] of sortedPlaylist.entries()) {
            if (set.startsec > this.progressElem.value) {
                break;
            }
            prevTitleLength += set.duration;
            lastTitleLength = set.duration;
        }
        // Subtract previous title length because the clicked time is somewhere in the title
        prevTitleLength -= lastTitleLength;

        this.commentPoint = this.commentPoint - prevTitleLength;

        // Get actual slide
        let slider = this.slideshowElem.querySelector('.uk-active');
        this.commentMediaId = slider.getAttribute('swac_setid');
        // If play is stopped start
        if (this.options.stopOnStartComment && this.interval) {
            // Find media element and stop if available
            let mediaElem = slider.querySelector('audio, video');
            // Stop play
            if (mediaElem) {
                mediaElem.pause();
            }
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    /**
     * Function to execute if the send comment button is pressed. Sends the
     * comment.
     * 
     * @param {DOMEvent} evt Event that calls the function
     * @returns {undefined}
     */
    onComment(evt) {
        evt.preventDefault();
        let commentField = this.requestor.querySelector('[name="media_comment"]');

        // Create data capsle for storing data
        let dataCapsle = {
            data: [],
            fromName: Model.getSetnameFromRefernece(this.options.commentRequestor.fromName)
        };
        let dataset = {
            mediaid: this.commentMediaId,
            timepoint: this.commentPoint,
            comment: commentField.innerHTML
        };
        dataCapsle.data.push(dataset);

        // Save data with model
        Model.save(dataCapsle).then(function (dataCaps) {
            commentField.innerHTML = '';
            this.commentPoint = null;
            this.commentMediaId = null;
        }
        ).catch(
                function (error) {

                }
        );
    }

    /**
     * Opens an overlay over the media player
     * 
     * @param {Object[]} overlaydata Array containing overlays data
     * @param {Object} overlayset Set with data about the current overlay
     * @returns {undefined}
     */
    openOverlay(overlaydata, overlayset) {
        // Get overlay element
        let overlayElem = this.requestor.querySelector('.swac_mediaplayer_overlay');
        overlayElem.classList.remove('swac_dontdisplay');
        if (overlayset.overlayclass) {
            overlayElem.classList.remove(this.options.overlayclass);
            overlayElem.classList.add(overlayset.overlayclass);
            this.lastoverlayclass = overlayset.overlayclass;
        }
        // Generate media
        let mediaCode = new Mediacode(overlaydata, overlayset, 'media', 'mimetype');
        let contElem = overlayElem.querySelector('.swac_mediaplayer_overlaymedia');
        contElem.appendChild(mediaCode.getMediaElement());
    }

    /**
     * Closes the displayed overlay
     * 
     * @param {DOMEvent} evt Event that calls this method
     * @returns {undefined}
     */
    closeOverlay(evt) {
        if (evt)
            evt.preventDefault();
        // Get overlay element
        let overlayElem = this.requestor.querySelector('.swac_mediaplayer_overlay');
        overlayElem.classList.add('swac_dontdisplay');
        if (this.lastoverlayclass)
            overlayElem.classList.remove(this.lastoverlayclass);
        overlayElem.classList.add(this.options.overlayclass);
        // Remove content
        let contElem = overlayElem.querySelector('.swac_mediaplayer_overlaymedia');
        contElem.innerHTML = '';

        // Get actual slide
        let slider = this.slideshowElem.querySelector('.uk-active');
        // Find media element and stop if available
        let mediaElem = slider.querySelector('audio, video');
        // If play is stopped start
        if (!this.interval) {
            this.interval = setInterval(this.playNextSecond.bind(this), 1000);
            if (mediaElem) {
                mediaElem.play();
            }
        }
    }

    /**
     * Performed when a key was pressed.
     */
    onKeydown(evt) {
        evt.preventDefault();
//        console.log('keycode:', evt.keyCode, evt.key);
        let baseKeyPressed = true;
        switch (evt.key) {
            case ' ':
                // If play is stopped start
                if (!this.interval) {
                    this.startPlay();
                } else {
                    // Stop play
                    this.stopPlay();
                }
                break;
            case 'ArrowLeft':
                // Jump to prev title
                this.playPrevTitle();
                break;
            case 'ArrowRight':
                // Jump to next title
                this.playNextTitle();
                break;
            case 'ArrowUp':
                // Fade in
                this.fadeinPlay();
                break;
            case 'ArrowDown':
                // Fade out
                this.fadeoutPlay();
                break;
            case 'Escape':
                this.onClickFullBtn(evt);
                break;
            default:
                Msg.warn('Mediaplayer', 'Unknown key >' + evt.key + '< pressed.', this.requestor);
                baseKeyPressed = false;
        }

        if (!baseKeyPressed) {
            // Get medias to start
            let startms = this.keystartmedias.get(evt.key);
            if (startms) {
                for (let curSet of startms) {
                    let curElem = this.requestor.querySelector('#keymedia_' + curSet.id);
                    if (!curElem)
                        Msg.error('Mediaplayer', 'Could not find keymedia for >' + curSet.swac_fromName + '[' + curSet.id + ']<', this.requestor);
                    if (curSet.fadein)
                        this.fadein(curElem, curSet.fadein);
                    curElem.play();
                    // Display copyright notice
                    if (curSet.copyright) {
                        let playerElem = this.requestor.querySelector('.swac_mediaplayer_slideshow');
                        let copyNoticeElem = document.createElement('div');
                        copyNoticeElem.innerHTML = curSet.copyright;
                        copyNoticeElem.classList.add('swac_mediaplayer_copynotice');
                        playerElem.appendChild(copyNoticeElem);
                        curElem.addEventListener('ended', () => {
                            let copyrightElem = document.querySelector('.swac_mediaplayer_copynotice');
                            // Remove copy notice after end
                            copyrightElem.remove();
                        });
                        curElem.addEventListener('pause', () => {
                            let copyrightElem = document.querySelector('.swac_mediaplayer_copynotice');
                            // Remove copy notice after end
                            copyrightElem.remove();
                        });
                    }
                }
            }

            // Get medias to stop
            let stopms = this.keystopmedias.get(evt.key);
            if (stopms) {
                for (let curSet of stopms) {
                    let curElem = this.requestor.querySelector('#keymedia_' + curSet.id);
                    if (!curElem)
                        Msg.error('Mediaplayer', 'Could not find keymedia for >' + curSet.swac_fromName + '[' + curSet.id + ']<', this.requestor);
                    if (curSet.fadeout) {
                        this.fadeout(curElem, curSet.fadeout);
                    } else {
                        curElem.pause();
                    }
                }
            }
        }
    }

    /**
     * Toogles title looping
     * 
     * @param {DOMEvent} evt Click Event on button
     */
    toggleLoop(evt) {
        evt.preventDefault();
        if (this.options.loop) {
            this.options.loop = false;
            this.loopBtn.classList.remove('swac_mediaplayer_loopBtn_active');
        } else {
            this.options.loop = true;
            this.loopBtn.classList.add('swac_mediaplayer_loopBtn_active');
        }
    }

    /**
     * Ananouces the actual title
     */
    anounceTitle() {
        return new Promise((resolve, reject) => {
            let txt = window.swac.lang.dict.Mediaplayer.anounce;
            txt = window.swac.lang.replacePlaceholders(txt, 'title', this.actTitle.title);
            let artist = this.actTitle.artist;
            if (artist && artist.includes(','))
                artist = artist.split(',')[0];
            txt = window.swac.lang.replacePlaceholders(txt, 'artist', artist);

            var utterThis = new SpeechSynthesisUtterance(txt);
            utterThis.voice = this.voice;
            utterThis.pitch = this.options.pitch;
            utterThis.rate = this.options.rate;
            this.synth.speak(utterThis);
            utterThis.onend = function (e) {
                resolve();
            };
        });
    }

    /**
     * Should be executed when the user clicks the make offline button. Downloads
     * all Songs of the playlist to cache.
     */
    async onMakeOffline() {
        // iterate over media files
        for (let curSource in this.data) {
            // iterate over titles
            for (let curSet of this.data[curSource].getSets()) {
                if (!curSet)
                    continue;
                // Get media path
                let basepath = this.options.mediaBasePath;
                let path = curSet[this.options.pathattr];
                // Use absolute path if given
                if (path.startsWith('/') || path.startsWith('http') || path.startsWith('.') || path.startsWith('data:'))
                    basepath = '';
                else if (!this.options.mediaBasePath) {
                    // Use path of index file as root if no basepath is set
                    let lastslash = curSet.swac_fromName.lastIndexOf('/');
                    basepath = curSet.swac_fromName.substring(0, lastslash) + '/';
                }
                SWAC.serviceWorker.postMessage('{"action":"cacheFile","value": "' + basepath + path + '"}');
            }
        }
    }

    updateSlideshowAnimation(newAnimation) {
        if (!newAnimation)
            return;

        const showElem = this.requestor.querySelector('[uk-slideshow]');
        if (!showElem)
            return;

        const slideshow = UIkit.getComponent(showElem, 'slideshow');
        if (!slideshow)
            return;

        const currentOptions = {...slideshow.$options};
        const currentIndex = slideshow.index;

        slideshow.$destroy();

        UIkit.slideshow(showElem, {
            ...currentOptions,
            animation: newAnimation
        });

        const newSlideshow = UIkit.getComponent(showElem, 'slideshow');
        if (newSlideshow) {
            newSlideshow.show(currentIndex);
        }
    }
}