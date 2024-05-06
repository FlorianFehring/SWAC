/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


var texteditor = {};
texteditor.textare;
texteditor.requestparameter = [];
texteditor.requesturl = "Servlet/ChatServlet";
texteditor.keydowncode = 0; // Last pressend key for input descitions
texteditor.lastcursorpos = 0;
texteditor.lastinserted;

/**
 * Create textarea for input within an by selector given element
 */
texteditor.create = function (selector) {
    let editorelem = document.querySelector(selector);
    texteditor.textare = document.createElement('textarea');

    editorelem.appendChild(texteditor.textare);
    editorelem.addEventListener("keydown", texteditor.evtHandlerKeydown);
    editorelem.addEventListener("keypress", texteditor.evtHandlerInput);
    editorelem.addEventListener("keyup", texteditor.evtHandlerKeyup);

    // Register on backend
    let querydata = {
        content: "<register/>",
        contpos: -1
    };
    // Add request params
    for (let i in texteditor.requestparameter) {
        var param = texteditor.requestparameter[i];
        querydata[i] = texteditor.requestparameter[i];
    }
    remoteHandler.apiCallCreate(texteditor.requesturl, querydata, texteditor.evtReciveMessage);
}

/**
 * Sets an variable and value, that should be send with every request
 */
texteditor.setRequestParameter = function (key, value) {
    texteditor.requestparameter[key] = value;
};

/**
 * Gets an value from an requestparameter
 */
texteditor.getRequestParameter = function (key) {
    return texteditor.requestparameter[key];
};

/**
 * Handles an input event and sends the data to the server
 */
texteditor.evtHandlerInput = function (evt) {
    let keycode = evt.which || evt.keyCode;

    let keystr = texteditor.getPrintableKey(evt)

    texteditor.lastinserted = keystr;
    texteditor.lastcursorpos = texteditor.getCursorPos();

    // Special handling for ctrl+v
    if (evt.ctrlKey && keycode == 118) {
        texteditor.lastinserted = "<paste/>";
        return;
    }

    let querydata = {
        content: texteditor.lastinserted,
        contpos: texteditor.lastcursorpos
    };
    // Add request params
    for (let i in texteditor.requestparameter) {
        var param = texteditor.requestparameter[i];
        querydata[i] = texteditor.requestparameter[i];
    }
    remoteHandler.apiCallCreate(texteditor.requesturl, querydata, texteditor.evtReciveMessage);
}

/**
 * Notice for detection of printable keys
 */
texteditor.evtHandlerKeydown = function (evt) {
    var keycode = evt.which || evt.keyCode;
    texteditor.keydowncode = keycode;
}

/**
 * Executed onkeyup to send insertion to backend
 */
texteditor.evtHandlerKeyup = function (evt) {
    let keycode = evt.which || evt.keyCode;
    let curpos = texteditor.getCursorPos();

    // Only do something here if it was an ctrl+v press
    if (texteditor.lastinserted == "<paste/>" && keycode == 86) {
        let insertionstr = texteditor.textare.value;
        texteditor.lastinserted = insertionstr.substring(texteditor.lastcursorpos, curpos);

        let querydata = {
            content: texteditor.lastinserted,
            contpos: texteditor.lastcursorpos
        };
        // Add request params
        for (let i in texteditor.requestparameter) {
            var param = texteditor.requestparameter[i];
            querydata[i] = texteditor.requestparameter[i];
        }
        remoteHandler.apiCallCreate(texteditor.requesturl, querydata, texteditor.evtReciveMessage);
    }

    // Update cursorpos to end of insertion
    texteditor.lastcursorpos = curpos;
}

/**
 * Handles incoming message and adds the message to the textarea
 */
texteditor.evtReciveMessage = function (message) {
    console.log("Message recived!");
}

/**
 * Returns the current position of the cursor
 */
texteditor.getCursorPos = function () {
    let selection = texteditor.getSelection();
    return selection.end;
}

/**
 * Get the selected range in an textarea
 */
texteditor.getSelection = function () {
    if ("selectionStart" in texteditor.textare && document.activeElement == texteditor.textare) {
        return {
            start: texteditor.textare.selectionStart,
            end: texteditor.textare.selectionEnd
        };
    } else if (texteditor.textare.createTextRange) {
        var sel = document.selection.createRange();
        if (sel.parentElement() === texteditor.textare) {
            var rng = texteditor.textare.createTextRange();
            rng.moveToBookmark(sel.getBookmark());
            for (var len = 0;
                    rng.compareEndPoints("EndToStart", rng) > 0;
                    rng.moveEnd("character", -1)) {
                len++;
            }
            rng.setEndPoint("StartToStart", texteditor.textare.createTextRange());
            for (var pos = {start: 0, end: len};
                    rng.compareEndPoints("EndToStart", rng) > 0;
                    rng.moveEnd("character", -1)) {
                pos.start++;
                pos.end++;
            }
            return pos;
        }
    }
    return -1;
}

texteditor.setCursorPos = function (input, start, end) {
    if (arguments.length < 3)
        end = start;
    if ("selectionStart" in input) {
        setTimeout(function () {
            input.selectionStart = start;
            input.selectionEnd = end;
        }, 1);
    } else if (input.createTextRange) {
        var rng = input.createTextRange();
        rng.moveStart("character", start);
        rng.collapse();
        rng.moveEnd("character", end - start);
        rng.select();
    }
}

/**
 * Returns the printable charakter from the given event,
 * if there is one. Otherwise false will be returned
 */
texteditor.getPrintableKey = function (evt) {
    var keycode = evt.which || evt.keyCode;

    // Filter reactions on special keys
    if (keycode === texteditor.keydowncode
            && keycode != 46 // , on numpad
            && keycode != 45 // - on numpad
            && keycode != 60 // <
            && keycode != 8  // backspace
            && keycode != 32 // space
            && keycode != 13 // enter
            && keycode < 48 // Exclude numbers
            && keycode > 57 // Exclude numbers
            ) {
        return false;
    }
    // Filter ctrl- and alt-press
    if (evt.ctrlKey || evt.altKey) {
        return false;
    }
    // Convert to char
    let keystr = String.fromCharCode(keycode);

    // Special handling for backspace
    if (keycode == 8) {
        keystr = "<del/>";
    }

    return keystr;
}