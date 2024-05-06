/**
 *	This file contains functions for checks of data like type checks or complex content checks
 */

/** Checks if a given variable contains a number
 *
 * @param num	Variable to check
 * @return true if variable contains a number, false otherwise
 */
function isNumber(num) {
    return (typeof num === 'string' || typeof num === 'number') && !isNaN(num - 0) && num !== '';
}

/** Strips all HTML tags from an string
 *
 * @param String		String where to remove HTML from
 * @return String	Content without HTML tags
 */
function stripHTML(string) {
    // remove all string within tags
    var tmp = string.replace(/(<.*['"])([^'"]*)(['"]>)/g,
            function (x, p1, p2, p3) {
                return  p1 + p3;
            }
    );
    // now remove the tags
    return tmp.replace(/<\/?[^>]+>/gi, '');
}
/**
 * Replaces all special chars with HTML entities
 * 
 * @param {type} str    HTML Code where to replace special chars with entities
 * @returns             HTML Code with entities for special chars
 */
function html_entity_decode(str) {
 var ta=document.createElement("textarea");
 ta.innerHTML=str.replace(/</g,"&lt;").replace(/>/g,"&gt;");
 return ta.value;
}