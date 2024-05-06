/**
 *	This file contains helper functions for pasing inputs from tinyMCE
 */

/** Core parse function called, if an event calls the parse content
 *
 * @param inputelement	element surrounding the new inserted content
 * @return                  Modified content
 */
function parseInput(inputelement) {

    // Call special parser here
    var input = inputelement.textContent.trim();
    input = gimInputParser(input);

    return input;
}

/**	Checks if the given keycode starts the parsing process
 * @param keycode           Keycode to check
 * @param isShift           Boolen if shift is pressed
 * @param autoParse         if true special keycodes will start parsing process
 * @return			true if the keycode starts the parsing process, false otherwise
 */
function keyCodeStartsParse(keycode, isShift, autoParse) {
    // If enter=13, space=32 or dot=190, comma=188
    // (tested with firefox, opera 12.15, ie 10.0, chrome 28.0)
    if (autoParse === true && (keycode === 13 || keycode === 32 || keycode === 190 || keycode === 188 || (isShift && keycode===49) || (isShift && keycode===63)))
        return true;
    else if (keycode === 17)
        return true;
    return false;
}

/** Checks if the given keycode is printable
 * @param keycode           Keycode to check
 * @param isShift           Boolen if shift is pressed
 * @param autoParse         Avoids printable status on keys that starts parse
 * @return			true if the keycode is printable, false otherweise
 */
function keyCodeIsPrintable(keycode, isShift, autoParse) {
    if (keyCodeStartsParse(keycode, isShift, autoParse))
        return false;

    // Allow numbers and chars (same on all browsers)
    if (keycode >= 48 && keycode <= 90)
        return true;
    // Allow number on numpad (same on all browsers)
    if (keycode >= 96 && keycode <= 105)
        return true;
    // Allow operations on numpad (tested with firefox, opera 12.15, ie 10.0, chrome 28.0)
    // Note: keycode 108 is not assigned to a key
    if (keycode >= 106 && keycode <= 111)
        return true;

    // ^ and � (firefox)
    if (keycode === 160)
        return true;
    // ^ and � (opera 12.15, ie 10.0, chrome 28.0)
    if (keycode === 220)
        return true;
    // � and ` (firefox)
    if (keycode === 192)
        return true;
    // � and ` (opera 12.15, ie 10.0, chrome 28.0)
    if (keycode === 221)
        return true;
    // + and * (firefox)
    if (keycode === 171)
        return true;
    // + and * (opera 12.15, ie 10.0, chrome 28.0)
    if (keycode === 187)
        return true;
    // # and ' (firefox)
    if (keycode === 163)
        return true;
    // # and ' (opera 12.15, ie 10.0, chrome 28.0)
    if (keycode === 191)
        return true;
    // , and ; (firefox, opera 12.15, ie 10.0, chrome 28.0)
    if (keycode === 188)
        return true;
    // . and : (firefox, opera 12.15, ie 10.0, chrome 28.0)
    if (keycode === 190)
        return true;
    // - and  _ (firefox)
    if (keycode === 173)
        return true;
    // - and  _ (opera 12.15, ie 10.0, chrome 28.0)
    if (keycode === 189)
        return true;

    return false;
}