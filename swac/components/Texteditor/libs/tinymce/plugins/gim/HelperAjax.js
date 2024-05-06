/**
 *	This file contains functions for ajax handling
 */

/** Gets an instance of xmlhttp for ajax requests
 *
 * @return xmlHttpObject
 */
function getXMLHttp() {
    var xmlhttp;
    if (window.XMLHttpRequest) {
        // code for IE7+, Firefox, Chrome, Opera, Safari
        xmlhttp = new XMLHttpRequest();
    } else {
        // code for IE6, IE5
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    return xmlhttp;
}