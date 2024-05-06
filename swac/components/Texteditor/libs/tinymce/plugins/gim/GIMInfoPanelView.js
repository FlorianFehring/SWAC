/* 
 * This file contains javascript for useing the infopanel
 */

/**
 * Marks an information or dimension in infoPanel. Calls the same function as
 * executed on klick on the information within the RelationTreeView.
 *
 * @param set_name	Name of the information type
 * @param set_id        Id of the information to show
 * @param dim_id        Id of a dimension to highlight
 */
function showInformation(set_name, set_id, dim_id) {
    // Show relations
    //updateInfoPanel([{name:'infoPanel', value:'informationRelationTreeView'},{name:'set_name', value:set_name},{name:'set_id', value:set_id}]);
    // If information or dimension should be shown
    var infoNodeId = set_name+"_"+set_id;
    // Add dimension id, if dimension selected
    if(dim_id!==null && dim_id!=="") {
        infoNodeId = infoNodeId+"_"+dim_id;
    }
    // Check if infoNode exists
    infoNode = document.getElementById(infoNodeId);
    if(infoNode!==null) {
        // Simulate click on info node
        toggleHighlightStickyInformation(infoNode);
    } else {
        alert("Selected Information "+ infoNodeId +" is not referenced!");
    }
}

/**
 * Updates the document statistic releiing on the currently active editor instance
 * 
 * @returns {undefined}
 */
function showDocumentStatistic() {
    // Change panel
    //updateInfoPanel([{name:'infoPanel', value:'infoPanelInformationView'},{name:'set_name', value:set_name},{name:'set_id', value:set_id}]);

    // Get content
    var content = tinyMCE.activeEditor.getContent();
    // Remove all markup from content
    var markupfreeContent = content.replace(/(<([^>]+)>)/ig, "");
    markupfreeContent = html_entity_decode(markupfreeContent);

    // Set chars counter
    document.getElementById("chars_count").innerHTML = markupfreeContent.length;

    // Count sentences
    var sentences = markupfreeContent.split('.');
    // Set sentences counter
    document.getElementById("sentences_count").innerHTML = sentences.length;

    // Count words
    var wordsContent = markupfreeContent.split(' ');
    var words = [];
    var countWords = 0;
    for (var i = 0; i < wordsContent.length; i++) {
        var currentWord = wordsContent[i].trim();
        if (currentWord !== '' && currentWord !== ' ') {
            countWords++;
            var index = words.indexOf(currentWord);
            if (index === -1) {
                var newWord = [];
                newWord[0] = currentWord;
                newWord[1] = 1;
                words.push(newWord);
            } else {
                words[index][1]++;
            }
        }
    }
    document.getElementById("words_count").innerHTML = words.length;

    // Most used words

    // Most used stop words

    // Count information nodes
    var infoNodes = tinyMCE.activeEditor.dom.select('span.information')
    document.getElementById("informations_count").innerHTML = infoNodes.length;

    // Different informations
    var differentNodes = [];
    var enclosedChars = 0;
    for (var i = 0; i < infoNodes.length; i++) {
        // Count distinct class nodes
        if (differentNodes.indexOf(infoNodes[i].className) === -1) {
            differentNodes.push(infoNodes[i].className);
        }
        // Count enclosed chars
        var innerContent = infoNodes[i].innerHTML.replace(/(<([^>]+)>)/ig, "");
        innerContent = html_entity_decode(innerContent);
        enclosedChars += innerContent.length;
    }
    document.getElementById("diffinformations_count").innerHTML = differentNodes.length;

    // Information density
    var density = (enclosedChars / markupfreeContent.length) * 100;
    document.getElementById("informationdensity").innerHTML = density;

}