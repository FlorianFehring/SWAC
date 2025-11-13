// SPDX-License-Identifier: LicenseRef-Proprietary

import SWAC from '../../swac.js';
import View from '../../View.js';
import Msg from '../../Msg.js';

export default class Communicator extends View {

    constructor(options = {}) {
        super(options);
        this.name = 'Communicator';
        this.desc.text = 'This component allow the integration of a chat onto the page.';
        this.desc.developers = 'Florian Fehring';
        this.desc.license = '(c) by Florian Fehring';

        this.desc.text = 'Component allowing per to per communication.';
        this.desc.depends[0] = {
            name: 'adapter.js',
            path: SWAC.config.swac_root + 'components/Communicator/libs/adapter.js',
            desc: 'Adapter for WebRTC.'
        };
        this.desc.depends[1] = {
            name: 'peerjs.js',
            path: SWAC.config.swac_root + 'components/Communicator/libs/peerjs.min.js',
            desc: 'Peerjs lib for creating peer to peer connections.'
        };
        this.desc.templates[0] = {
            name: 'standard',
            style: 'standard',
            desc: 'Standard layout for per to per communication'
        };
        this.desc.reqPerTpl[0] = {
            selc: 'cssSelectorForRequiredElement',
            desc: 'Description why the element is expected in the template'
        };
        this.desc.optPerTpl[0] = {
            selc: 'cssSelectorForOptionalElement',
            desc: 'Description what is the expected effect, when this element is in the template.'
        };
        this.desc.optPerPage[0] = {
            selc: 'cssSelectorForOptionalElement',
            desc: 'Description what the component does with the element if its there.'
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
            desc: "This is the description of an option"
        };
        // Setting a default value, only applying when the options parameter does not contain this option
        if (!options.capturewidth)
            this.options.capturewidth = '100%';
        if (!options.captureheight)
            this.options.captureheight = '100%';
        // Sample for useing the general option showWhenNoData
        if (!options.showWhenNoData)
            this.options.showWhenNoData = true;

        // Internal attributes
        this.peer = null;
        this.connections = new Map();
        this.mediastream = new MediaStream();
    }

    /*
     * This method will be called when the component is complete loaded
     * At this thime the template code is loaded, the data inserted into the 
     * template and even plugins are ready to use.
     */
    init() {
        return new Promise((resolve, reject) => {
            let thisRef = this;
            navigator.mediaDevices.enumerateDevices().then(function (mediaDevices) {
                // Get template for mediaDevice
                let devTpl = thisRef.requestor.querySelector('.swac_communicator_repeatForDev');
                for (let curMediaDevice of mediaDevices) {
                    // Exclude non supported media devices
                    if (curMediaDevice.kind !== 'videoinput' && curMediaDevice.kind !== 'audioinput') {
                        continue;
                    }
                    let devArea = devTpl.cloneNode(true);
                    devArea.classList.remove('swac_communicator_repeatForDev');
                    let devSelectElem = devArea.querySelector('input');
                    devSelectElem.setAttribute('name', curMediaDevice.deviceId);
                    devSelectElem.setAttribute('kind', curMediaDevice.kind);
                    devSelectElem.addEventListener('change', thisRef.onChangeDeviceState.bind(thisRef));
                    let devIconElem = devArea.querySelector('[uk-icon]');
                    if (devIconElem) {
                        let icondef = '';
                        switch (curMediaDevice.kind) {
                            case 'videoinput':
                                icondef = 'icon: camera;';
                                break;
                            case 'audioinput':
                                icondef = 'icon: microphone;';
                                break;
                            default:
                                icondef = 'icon: ban;';
                        }
                        devIconElem.setAttribute('uk-icon', icondef);
                        devArea.setAttribute('title', curMediaDevice.label + '(' + curMediaDevice.kind + ')');
                    }
                    devTpl.parentElement.appendChild(devArea);
                }

            }).catch(function (error) {
                console.log(error);
            });

            // Add screencapture functionality
            let screencapBtn = this.requestor.querySelector('.swac_communicator_screencap');
            screencapBtn.addEventListener('change', this.onChangeScreencapState.bind(this));

            // Online / Offline buttons
            let onlineBtn = this.requestor.querySelector('.swac_communicator_goonline');
            onlineBtn.addEventListener('click', this.onGoOnline.bind(this));
            let offlineBtn = this.requestor.querySelector('.swac_communicator_gooffline');
            offlineBtn.addEventListener('click', this.onGoOffline.bind(this));

            // Chat functions
            let sendBtn = this.requestor.querySelector('.swac_communicator_chatsend');
            sendBtn.addEventListener('click', this.onSendChat.bind(this));

            // Add toroom functionality
            let connectBtn = this.requestor.querySelector('.swac_communicator_connect');
            connectBtn.addEventListener('click', this.onConnectToUser.bind(this));

            resolve();
        });
    }

    onChangeDeviceState(evt) {
        console.log(evt.target);
        let devId = evt.target.name;

        // Get media element
        let mediaArea = document.querySelector('[id="' + devId + '"]');
        // Create mediaarea if not exists
        if (!mediaArea) {
            let medConstriants = {};
            // Get kind of device
            if (evt.target.getAttribute('kind') === 'videoinput') {
                medConstriants = {
                    video: {
                        deviceId: devId
                    }
                };
                let thisRef = this;
                navigator.mediaDevices.getUserMedia(medConstriants).then(function (stream) {
                    thisRef.createMediaArea(devId, 'Cam', stream);
                    // Adding to connection
                    thisRef.addStreamToConnection(stream);
                });

            } else if (evt.target.getAttribute('kind') === 'audioinput') {
                medConstriants = {
                    audio: {
                        deviceId: devId
                    }
                };
                let thisRef = this;
                navigator.mediaDevices.getUserMedia(medConstriants).then(function (stream) {
                    thisRef.createMediaArea(devId, 'Mic', stream);
                    // Adding to connection
                    thisRef.addStreamToConnection(stream);
                });
            }

        }
//        videoelem.srcObject = mediaStream;
    }

    /**
     * Executed when the user clicks the start screencaption button.
     * 
     * @param {DOMEvent} evt Event calling this method
     * @returns {undefined}
     */
    onChangeScreencapState(evt) {
        let displayMediaOptions = {};
        let thisRef = this;
        let devId = 'screenCapture';
        navigator.mediaDevices.getDisplayMedia(displayMediaOptions).then(
                function (stream) {
                    thisRef.createMediaArea(devId, 'Cam', stream);
                    // Adding to connection
                    thisRef.addStreamToConnection(stream);
                }).catch(
                function (error) {
                    Msg.error('Communicator', 'Could not start screencapture: ' + error, thisRef.requestor);
                });
    }

    createMediaArea(devId, devKind, stream) {
        // Add eventlistener for ended stream
        stream.addEventListener('ended', this.onStreamEnded.bind(this));
        // Get template
        let mediaAreaElemTpl = this.requestor.querySelector('.swac_communicator_repeatFor' + devKind);
        let mediaAreaElem = mediaAreaElemTpl.cloneNode(true);
        mediaAreaElem.classList.remove('swac_communicator_repeatFor' + devKind);
        mediaAreaElem.id = devId;
        // Set options for video
        if (devKind === 'Cam') {
            let videoElem = mediaAreaElem.querySelector('video');
            videoElem.srcObject = stream;
            videoElem.setAttribute('width', this.options.capturewidth);
            videoElem.setAttribute('height', this.options.captureheight);
        } else if (devKind === 'Mic') {
            let audioElem = mediaAreaElem.querySelector('audio');
            audioElem.srcObject = stream;
        }
        mediaAreaElemTpl.parentElement.appendChild(mediaAreaElem);
    }

    onStreamEnded(evt) {
        console.log('Stream ended!');
        console.log(evt);
    }

    /**
     * Method to execute when goong online
     * 
     * @param {DOMEvent} evt Event that calls the method
     * @returns {undefined}
     */
    onGoOnline(evt) {
        evt.preventDefault();
        let thisRef = this;
        // Get username
        let usernameElem = this.requestor.querySelector('input[name="username"]');
        // Look username element
        usernameElem.setAttribute('readonly', 'readonly');
        let username = usernameElem.value;
        if (username === '') {
            UIkit.modal.alert(SWAC.lang.dict.Communicator.missingusername);
            return;
        }
        this.peer = new Peer(
                username,
                {
                    config: {'iceServers': [
                            {url: 'stun:stun.l.google.com:19302'},
//                            {
//                                url: 'turn:numb.viagenie.ca',
//                                credential: 'muazkh',
//                                username: 'webrtc@live.com'
//                            },
                            {
                                url: 'turn:192.158.29.39:3478?transport=udp',
                                credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
                                username: '28224511:1379330808'
                            },
//                            {
//                                url: 'turn:192.158.29.39:3478?transport=tcp',
//                                credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
//                                username: '28224511:1379330808'
//                            },
//                            {
//                                url: 'turn:turn.bistri.com:80',
//                                credential: 'homeo',
//                                username: 'homeo'
//                            },
//                            {
//                                url: 'turn:turn.anyfirewall.com:443?transport=tcp',
//                                credential: 'webrtc',
//                                username: 'webrtc'
//                            }
                        ]}
                }
        );
        this.peer.on('open', function (id) {
            // Show message
            let msg = SWAC.lang.dict.replacePlaceholders(SWAC.lang.dict.Communicator.youreonlinenow, 'id', id);
            UIkit.modal.alert(msg);
            // Hide goonline button
            let onlineBtn = thisRef.requestor.querySelector('.swac_communicator_goonline');
            onlineBtn.classList.add('swac_dontdisplay');
            // Show gooffline button
            let offlineBtn = thisRef.requestor.querySelector('.swac_communicator_gooffline');
            offlineBtn.classList.remove('swac_dontdisplay');
        });
        this.peer.on('error', function (error) {
            thisRef.requestor.remCoverMsg();
            usernameElem.removeAttribute('readonly');
            if (error.type === 'unavailable-id') {
                let msg = SWAC.lang.dict.replacePlaceholders(SWAC.lang.dict.Communicator.usernametaken, 'username', username);
                UIkit.modal.alert(msg);
            } else {
                UIkit.modal.alert(SWAC.lang.dict.Communicator.unkownerror);
                Msg.error('Communicator', 'An >' + error.type + '< error occured.', thisRef.requestor);
            }
        });
    }

    /**
     * Method to execute when going offline
     * 
     * @param {DOMEvent} evt Event that calls the gooffline
     * @returns {undefined}
     */
    onGoOffline(evt) {
        evt.preventDefault();
        // Destroy connection
        this.peer.destroy();
        this.peer = null;
        // Make username editable
        let usernameElem = this.requestor.querySelector('input[name="username"]');
        usernameElem.removeAttribute('readonly');
        // Show goonline button
        let onlineBtn = this.requestor.querySelector('.swac_communicator_goonline');
        onlineBtn.classList.remove('swac_dontdisplay');
        // Hide gooffline button
        let offlineBtn = this.requestor.querySelector('.swac_communicator_gooffline');
        offlineBtn.classList.add('swac_dontdisplay');
    }

    onConnectToUser(evt) {
        evt.preventDefault();
        console.log('connectToUser');
        if (!this.peer) {
            UIkit.modal.alert(SWAC.lang.dict.Communicator.notonline);
            return;
        }

        let comRemoteuserElem = this.requestor.querySelector('[name="com_remoteuser"]');
        if (comRemoteuserElem.value === '') {
            UIkit.modal.alert(SWAC.lang.dict.Communicator.noremoteuser);
            return;
        }
        let uname = comRemoteuserElem.value;
        console.log('connect to: ' + uname);
        // Add chat connection
        let chatconnection = this.peer.connect(uname);
        chatconnection.on('open', function () {
            console.log('connection to ' + uname + ' opend.');
            // Receive messages
            chatconnection.on('data', function (data) {
                console.log('Received', data);
            });
        });
        chatconnection.on('error', function (error) {
            Msg.error('Communicator', 'Error in connection to ' + uname + ': ' + error);
        });
        chatconnection.on('close', function () {
            console.log('close connection to ' + uname);
        });
        this.connections.set(uname + '_chat', chatconnection);

        // Add media connection
//        var call = this.peer.call(uname, this.mediastream);
//        call.on('stream', function (stream) {
//            // `stream` is the MediaStream of the remote peer.
//            // Here you'd add it to an HTML video/canvas element.
//            console.log('reciving stream from called');
//        });
    }

    onSendChat(evt) {
        evt.preventDefault();
        if (!this.peer) {
            UIkit.modal.alert(SWAC.lang.dict.Communicator.notonline);
            return;
        }
        if (this.connections.size === 0) {
            UIkit.modal.alert(SWAC.lang.dict.Communicator.noconnection);
            return;
        }
        // Get message
        let msgElem = this.requestor.querySelector('.swac_communicator_chatbox');

        // Send message to all chat connections
        this.connections.forEach(function (value, key, map) {
            // Check if chat connection
            if (key.endsWith('_chat')) {
                value.send(msgElem.innerHTML);
            }
        });
    }

    onToRoom(evt) {

        // Check if a com_token is given
        let comTokenElem = this.requestor.querySelector('[name="com_token"]');
        if (comTokenElem.value !== '') {
            let thisRef = this;
            this.peer = new Peer({
                config: {'iceServers': [
                        {url: 'stun:stun.l.google.com:19302'},
                        {url: 'turn:numb.viagenie.ca',
                            credential: 'muazkh',
                            username: 'webrtc@live.com'}
                    ]}
            });
            this.peer.on('open', function (id) {
                console.log('My peer ID is: ' + id);
                let roomDesc = comTokenElem.value;
                let constraints = {audio: true, video: {width: 1280, height: 720}};

                navigator.mediaDevices.getUserMedia(constraints).then(function (mediaStream) {
                    console.log('got media');
                    console.log(mediaStream);
                    var call = thisRef.peer.call(roomDesc, mediaStream);
                    console.log('called: ' + roomDesc);
                    call.on('stream', function (stream) {
                        // `stream` is the MediaStream of the remote peer.
                        // Here you'd add it to an HTML video/canvas element.
                        console.log('reciving stream from called');
                    });
                });
            });


        } else {
            this.createPeerConnection();
        }
    }

    createPeerConnection() {
        console.log('createPeerConnection');
//        this.peer = new Peer({key: 'lwjd5qra8257b9'});
        this.peer = new Peer(
                'testid', {
                    config: {'iceServers': [
                            {url: 'stun:stun.l.google.com:19302'}
                        ]}
                });
        this.peer.on('open', function (id) {
            console.log('My peer ID is: ' + id);
        });
        let thisRef = this;
        this.peer.on('call', function (call) {
            console.log('i was called!');
            // Answer the call, providing our mediaStream
            call.answer();
            call.on('stream', function (stream) {
                thisRef.onReciveStream(stream);
            });
        });
        console.log(this.peer);
        try {
//            this.connection = new RTCPeerConnection({
//                iceServers: [
//                    {
//                        urls: "stun:stun.l.google.com:19302" // Google's public STUN server
//                    }
//                ]
//            });

            //        this.connection.onicecandidate = handleICECandidateEvent;
//        this.connection.ontrack = handleTrackEvent;
//            this.connection.onnegotiationneeded = this.handleNegotiationNeededEvent.bind(this);
//        this.connection.onremovetrack = handleRemoveTrackEvent;
//        this.connection.oniceconnectionstatechange = handleICEConnectionStateChangeEvent;
//        this.connection.onicegatheringstatechange = handleICEGatheringStateChangeEvent;
//        this.connection.onsignalingstatechange = handleSignalingStateChangeEvent;

            console.log('connection created');
            console.log(this.connection);

        } catch (error) {
            Msg.error('Communicator', "Can't establish connection: " + error, this.requestor);
        }
    }

    addStreamToConnection(stream) {
        if (this.connection) {
            stream.getTracks().forEach(track => this.connection.addTrack(track, stream));
        }
    }

    handleNegotiationNeededEvent() {
        let thisRef = this;
        console.log('create offer:');
        this.connection.createOffer().then(
                function (offer) {
                    console.log('after create offer');
                    console.log(offer);
                    return thisRef.connection.setLocalDescription(offer);
                }
        ).then(
                function () {
                    // Offer was set so it is correct
                    console.log('after setLocalDescription');
                    console.log(JSON.stringify(thisRef.connection.localDescription));
                }
        ).catch(
                function (error) {
                    console.log(error);
                }
        );
    }

    connectToRoom(roomDesc) {
        var desc = new RTCSessionDescription(roomDesc);

        let thisRef = this;
        this.connection.setRemoteDescription(desc).then(
                function () {
                    console.log('after setRemoteDescription');
//                    return navigator.mediaDevices.getUserMedia(mediaConstraints);
                }
        ).then(function () {
            return thisRef.connection.createAnswer();
        }).then(function (answer) {
            console.log('after createAnswer');
            console.log(answer);
            return thisRef.connection.setLocalDescription(answer);
        }).catch(function (error) {
            console.log('error: ' + error);
        });
    }

    onReciveStream(stream) {
        console.log('recived stream');
        console.log(stream);
        this.createMediaArea('sampleDevId', 'Cam', stream);
    }
}


