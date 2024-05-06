import SWAC from '../../../../swac.js';
import Msg from '../../../../Msg.js';
import Plugin from '../../../../Plugin.js'

export default class GroupwriteSPL extends Plugin {

    constructor(pluginconf) {
        super(pluginconf);
        this.name = 'texteditor/plugins/Groupwrite';
        this.desc.templates[0] = {
            name: 'groupwrite',
            style: false,
            desc: 'Default template for groupwrite controls'
        };
        // Set default options
//        this.desc.opts[0] = {
//            name: 'showdatalabels',
//            desc: 'If true the values of the data points are shown in the diagram'
//        };
//        this.options.showdatalabels = false;

        // Internal attributes
        try {
            this.connection = new RTCPeerConnection();
            this.remoteConnection = new RTCPeerConnection();
        } catch (error) {
            console.log(error);
        }
        this.chanelMap = new Map();
    }

    init() {
        return new Promise((resolve, reject) => {
// Check if content area is available
            if (!this.contElements || this.contElements.length === 0) {
                Msg.error('groupwriteSPL', 'This plugin needs a contElement to insert the chart.', this.requestor);
            }

            for (let contElement of this.contElements) {
                // Register functions to controls
                let openconButtons = contElement.querySelectorAll(".swac_texteditor_groupwrite_opencon");
                for (let openconButton of openconButtons) {
                    openconButton.addEventListener('click', this.openConnectability, false);
                }

                let closeconButtons = contElement.querySelectorAll(".swac_texteditor_groupwrite_closecon");
                for (let closeconButton of closeconButtons) {
                    closeconButton.addEventListener('click', this.closeConnectability, false);
                }

                let sendButtons = contElement.querySelectorAll(".swac_texteditor_groupwrite_send");
                for (let sendButton of sendButtons) {
                    sendButton.addEventListener('click', this.sendMessage, false);
                }
            }

            // Get component where this plugin instance belongs to
            let component = this.requestor.parent.swac_comp;

            resolve();
        });
    }

    openConnectability(evt) {
        let repeatedForSet = this.requestor.parent.findRepeatedForSet(evt.target);
        let thisplugin = this.pluginHandler.plugins.get('groupwrite');
        let chanellistId = 'conectability#' + this.requestor.parent.id + '#' + repeatedForSet.getAttribute('swac_setid');
        // Create chanellist if not exists
        if (!thisplugin.chanelMap.has(chanellistId)) {
            thisplugin.chanelMap.set(chanellistId, []);
        }
        // Create chanel id
        let chanelid = chanellistId + '#' + thisplugin.chanelMap.get(chanellistId).length;

        let sendChannel = thisplugin.connection.createDataChannel(chanelid);
        sendChannel.onopen = thisplugin.handleSendChannelStatusChange;
        sendChannel.onclose = thisplugin.handleSendChannelStatusChange;

        thisplugin.chanelMap.set(chanelid, sendChannel);

        thisplugin.remoteConnection.ondatachannel = thisplugin.receiveChannelCallback;

        thisplugin.connection.onicecandidate = e => !e.candidate
                    || thisplugin.remoteConnection.addIceCandidate(e.candidate)
                    .catch(thisplugin.handleAddCandidateError);

        thisplugin.remoteConnection.onicecandidate = e => !e.candidate
                    || thisplugin.connection.addIceCandidate(e.candidate)
                    .catch(thisplugin.handleAddCandidateError);

        thisplugin.connection.createOffer()
                .then(offer => thisplugin.connection.setLocalDescription(offer))
                .then(() => thisplugin.remoteConnection.setRemoteDescription(thisplugin.connection.localDescription))
                .then(() => thisplugin.remoteConnection.createAnswer())
                .then(answer => thisplugin.remoteConnection.setLocalDescription(answer))
                .then(() => thisplugin.connection.setRemoteDescription(thisplugin.remoteConnection.localDescription))
                .catch(thisplugin.handleCreateDescriptionError);
    }

    closeConnectability(evt) {

    }

    receiveChannelCallback(evt) {
        receiveChannel = evt.channel;
        receiveChannel.onmessage = handleReceiveMessage;
        receiveChannel.onopen = handleReceiveChannelStatusChange;
        receiveChannel.onclose = handleReceiveChannelStatusChange;
    }

    handleSendChannelStatusChange(evt) {
        console.log('handleSendChannelStatusChange');
        console.log(evt);

        let chanelid = evt.target.label;
        console.log(chanelid);
        let elemids = chanelid.split('#');
        console.log(elemids);
        let requestor = document.querySelector('#' + elemids[1]);
        let editorArea = requestor.querySelector('.uk-switcher li[swac_setid="' + elemids[2] + '"]');

        console.log(editorArea);

        if (sendChannel) {
            var state = sendChannel.readyState;

            if (state === "open") {
                messageInputBox.disabled = false;
                messageInputBox.focus();
                sendButton.disabled = false;
                disconnectButton.disabled = false;
                connectButton.disabled = true;
            } else {
                messageInputBox.disabled = true;
                sendButton.disabled = true;
                connectButton.disabled = false;
                disconnectButton.disabled = true;
            }
        }
    }

    sendMessage(evt) {
        var message = messageInputBox.value;
        sendChannel.send(message);

        messageInputBox.value = "";
        messageInputBox.focus();
    }

    handleReceiveMessage(evt) {
        var el = document.createElement("p");
        var txtNode = document.createTextNode(event.data);

        el.appendChild(txtNode);
        receiveBox.appendChild(el);
    }
}