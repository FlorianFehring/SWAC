/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


function mathmlparser(input) {
    
    // Search for the mathml node
        var mathmlNode = searchParentNode('MATH', '', inputelement);


        // Inserted content
        var input = inputelement.innerHTML;
        alert('input: ' + input);
        // Get parent node name
        var surroundingElementNodeName = inputelement.parentNode.nodeName;

        // Get contents before and after the insert position
        var symbolisedInsertCode = inputelement.parentNode.innerHTML.replace(inputelement.outerHTML, '<#>');
        var beforeAndAfterInsert = symbolisedInsertCode.split('<#>');

        // Get needed element for input
        var inputElementNodeName = '';
        var inputElementInnerHTML = input;

        //Mathml specific parses
        switch (input.trim()) {
            case '=':
                inputElementNodeName = 'mo';
                break;
            case '+':
                inputElementNodeName = 'mo';
                inputElementInnerHTML = input.replace('+', '&plus;');
                break;
            case '-':
                inputElementNodeName = 'mo';
                inputElementInnerHTML = input.replace('-', '%minus;');
                break;
            case '/':
                inputElementNodeName = 'mo';
                break;
            case '*':
                inputElementNodeName = 'mo';
                break;
            default:
                if (isNumber(input)) {
                    inputElementNodeName = 'mn';
                } else {
                    inputElementNodeName = 'mi';
                }
                break;
        }

        // Check on mathematic input
        if (mathmlNode === false && inputElementNodeName === 'mo') {
            tinyMCE.activeEditor.windowManager.confirm("MATHML_CREATEMATHML", function(s) {
                if (s) {
                    // Split content in formular parts
                    var inputParts = tinyMCE.activeEditor.getContent().split(' ');
                    // First attribute
                    var firstAttributeContent = inputParts[inputParts.length - 2].replace('<p>', '');
                    // Operator
                    var operatorContent = inputParts[inputParts.length - 1].replace('<p>', '').replace('</p>', '');
                    //alert(operatorContent);
                    // Create mathml node
                    var mathmlNode = document.createElement('math');
                    // Create first attribute node
                    var firstAttributeNode = document.createElement('mn');
                    firstAttributeNode.innerHTML = firstAttributeContent;
                    mathmlNode.appendChild(firstAttributeNode);
                    // Create operation node
                    var operatorNode = document.createElement('mo');
                    operatorNode.innerHTML = operatorContent;
                    mathmlNode.appendChild(operatorNode);
                    // Create second attribute node
                    var secondNode = document.createElement('mn');
                    secondNode.innerHTML = '<span class="placeholder">&nbsp;&nbsp;&nbsp;</span>';
                    mathmlNode.appendChild(secondNode);

                    // Insert content
                    var newContent = tinyMCE.activeEditor.getContent();
                    //alert(newContent);
                    //alert(firstAttributeContent+' '+operatorContent);
                    newContent = newContent.replace(firstAttributeContent + ' ' + operatorContent, mathmlNode.outerHTML);
                    //alert(newContent);
                    tinyMCE.activeEditor.setContent(newContent);
                } else
                    tinyMCE.activeEditor.windowManager.alert("Cancel");
            });
        }

        // Check if the inserted node is from different type
        if (mathmlNode !== false && inputElementNodeName !== surroundingElementNodeName) {
            //alert('different node names: ' + inputElementNodeName + ' vs ' + surroundingElementNodeName);
            // If there is no before and after node (replace existing node with that one that matches the data type of the input)
            if (beforeAndAfterInsert[0].trim() === '' && beforeAndAfterInsert[1].trim() === '') {
                // Create new node
                var newElement = document.createElement(inputElementNodeName);
                newElement.innerHTML = inputElementInnerHTML;
                // Replace old node
                inputelement.parentNode.parentNode.replaceChild(newElement, inputelement.parentNode);
            } else {
                // Create node for new subpart of mathml
                var rowElement = document.createElement('mrow');

                // Create new node for new content
                var newElement = document.createElement(inputElementNodeName);
                newElement.innerHTML = inputElementInnerHTML;

                // If there is content before the inputElement
                if (beforeAndAfterInsert[0].trim() !== '') {
                    // Create node for first content
                    beforeElement = document.createElement(inputelement.parentNode.nodeName);
                    beforeElement.innerHTML = beforeAndAfterInsert[0].trim();
                    rowElement.appendChild(beforeElement);
                }
                // Add new content
                rowElement.appendChild(newElement);

                // If there is content after the inputElement
                if (beforeAndAfterInsert[1].trim() !== '') {
                    afterElement = document.createElement(surroundingElementNodeName);
                    afterElement.innerHTML = beforeAndAfterInsert[1].trim();
                    rowElement.appendChild(afterElement);
                }

                // Replace old surrounding node with new row
                inputelement.parentNode.parentNode.replaceChild(rowElement, inputelement.parentNode);
            }
            input = '';
        } else {
            // Replace input with new code
            input = input.replace(input, inputElementInnerHTML);
        }
        return input;
}