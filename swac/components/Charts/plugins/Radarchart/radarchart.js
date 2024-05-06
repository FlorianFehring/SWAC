/* 
 * This is an plugin for SWAC chart. It allows to draw piecharts.
 */
let radarchartSPL = {}; // EPL = EditorPLugin
window['radarchartSPL'] = radarchartSPL; // Make global accessable


// Internal values
radarchartSPL.pluginarea = null;
radarchartSPL.options = {};

////example for counting y-values
radarchartSPL.options.x_axis = 'ursache_2';  // Name of the values to show on x axis


radarchartSPL.options.y_axis = 'Anzahl';  // Name of the values to show on y axis
////--> IMPORTANT! As 'Anzahl' does not exist as name in data, y-component of points in pointArr created by radarchartSPL.transformDataToArrayOfPoints_IFBVisu will be "undefined".


/**
 * Initilises the plugin
 * 
 * @param {HTMLelement} requestor Element requesting the plugin function 
 * @param {object} pluginarea HTML element containing the area for the plugin
 * @param {object} set Set with data
 * @returns {undefined}
 */

radarchartSPL.xAxisChange = function (evt) {
    var x_axis_dd = evt.target;
    //console.log(x_axis_dd);
    //console.log(SWAC_chart.data);
    //radarchartSPL.options.x_axis = xAttr;
    //radarchartSPL.chart.update();
    var requ = this.requestor.parent.findComponentElement(evt.target);
    radarchartSPL.chart.destroy();
    radarchartSPL.options.x_axis = x_axis_dd.options[x_axis_dd.selectedIndex].value;
    
    
    var x_axis_filter_select = document.querySelector('#swac_radarchart_filterOpt');
    curData = SWAC_chart.data;
    //var possibleXVals = [];
    while (x_axis_filter_select.firstChild) {
      x_axis_filter_select.removeChild(x_axis_filter_select.firstChild);
    }
    var map = new Map();
    var options = [];
    for (let objects in curData) {
        //console.log("objects=");
        //console.log(data[objects]);
        //--> array of all possible objects.
        for(let objectNr in curData[objects]) {
            //console.log("ObjectNr=");
            //console.log(objectNr);
            //console.log(data[objects][objectNr]);
            //--> one specific object/dataset.
            let elem = curData[objects][objectNr][radarchartSPL.options.x_axis];
//            console.log(elem);
            if(!map.has(elem)){
                options.push( {name : elem, value: elem, checked:true});
                map.set(elem,'true');
            }
            }
//      console.log(options);
        $('#swac_radarchart_filterOpt').multiselect('loadOptions', options );
            //possibleXVals.append
        }
    
    console.log(x_axis_filter_select);
    radarchartSPL.init(requ, requ.querySelector('#swac_spl_radarchart'), SWAC_chart.data);
};

radarchartSPL.yAxisChange = function (evt) {
    var y_axis_dd = evt.target;
    //console.log(x_axis_dd);
    //console.log(SWAC_chart.data);
    //radarchartSPL.options.x_axis = xAttr;
    //radarchartSPL.chart.update();
    var requ = this.requestor.parent.findComponentElement(evt.target);
    radarchartSPL.chart.destroy();
    radarchartSPL.options.y_axis = y_axis_dd.options[y_axis_dd.selectedIndex].value;
    radarchartSPL.init(requ, requ.querySelector('#swac_spl_radarchart'), SWAC_chart.data);
};

radarchartSPL.applyFilter = function (evt) {
    //var x_axis_dd = evt.target;
    //console.log(x_axis_dd);
    //console.log(SWAC_chart.data);
    //radarchartSPL.options.x_axis = xAttr;
    //radarchartSPL.chart.update();
    var requ = this.requestor.parent.findComponentElement(evt.target);
    radarchartSPL.chart.destroy();
    radarchartSPL.init(requ, requ.querySelector('#swac_spl_radarchart'), SWAC_chart.data);
};


/**
 * Initilises the plugin
 * 
 * @param {HTMLelement} requestor Element requesting the plugin function 
 * @param {object} pluginarea HTML element containing the area for the plugin
 * @param {object} set Set with data
 * @returns {undefined}
 */
radarchartSPL.init = function (requestor, pluginarea, set) {
    var ctx = pluginarea.querySelector('canvas');
    
    var x_axis_dd = pluginarea.querySelector('.swac_radarchart_xaxis');
var y_axis_dd = pluginarea.querySelector('.swac_radarchart_yaxis');
var button_apply_filter = pluginarea.querySelector('#buttonApplyFilterRadarChart');


$('select[multiple]').multiselect({
    columns: 1,
    placeholder: 'X-Werte',
    selectAll: true
});

x_axis_dd.addEventListener('change', radarchartSPL.xAxisChange);
y_axis_dd.addEventListener('change', radarchartSPL.yAxisChange);
button_apply_filter.addEventListener('click', radarchartSPL.applyFilter);

//console.log('Hallo Florian!');
//console.log(set);
for (let objects in set) {
        //console.log("objects=");
        //console.log(data[objects]);
        //--> array of all possible objects.
        for(let objectNr in set[objects]) {
            //console.log("ObjectNr=");
            //console.log(objectNr);
            //console.log(data[objects][objectNr]);
            //--> one specific object/dataset
            let curObject = set[objects][objectNr];
            for(let headers in curObject){
                var opt = document.createElement('option');
                //opt.setAttribute('Text', headers);
                var text = document.createTextNode(headers);
                opt.appendChild(text);
                opt.setAttribute('value', ""+headers);
                //console.log(opt);
                x_axis_dd.appendChild(opt);
                var opt2 = opt.cloneNode();
                var text2 = text.cloneNode();
                opt2.appendChild(text2);
                y_axis_dd.appendChild(opt2);
            }
            break;
        }
        break;
}
  
    
    let pointArr = radarchartSPL.transformDataToArrayOfPoints_IFBVisu(set, radarchartSPL.options.x_axis, radarchartSPL.options.y_axis);
    
    
    var labelArr = [];
    var valueArr = [];
    if($.isNumeric(pointArr[0]['y'])){
        // Var1: y-Achse enthält Integers, die addiert werden sollen.
        for (let point in pointArr){
            var indexInLabelArr = labelArr.indexOf(pointArr[point]['x']);
            if(indexInLabelArr === -1){                  // x-value not in array.           // 2 or 3 equal singns?? 3 seems ok.
                labelArr.push(pointArr[point]['x']);
                valueArr.push(parseInt(pointArr[point]['y']));
            }
            else {                                      // x-value already in array.
                valueArr[indexInLabelArr] += parseInt(pointArr[point]['y']);
            }
        }
    }
    else{
        // TODO: Var 2: y-Achse enthält Strings o.ä., die nicht addiert werden können, sondern gezählt werden sollen.
        for (let point in pointArr){
            var indexInLabelArr = labelArr.indexOf(pointArr[point]['x']);
            if(indexInLabelArr === -1){                  // x-value not in array.           // 2 or 3 equal singns?? 3 seems right.
                labelArr.push(pointArr[point]['x']);
                valueArr.push(1);
            }
            else {                                      // x-value already in array.
                valueArr[indexInLabelArr] += 1;
            }
        }
    }
    
    
    var dataToShow = valueArr; //[10,20,30];
    var labels = labelArr;  //['10', '20', '30'];
    var colors = radarchartSPL.createColorArray(labels.length);
    
    radarchartSPL.chart = new Chart(ctx, {
        type: 'radar',
        data : {
            datasets: [{
                data: dataToShow,
                backgroundColor: colors
            }],

            // These labels appear in the legend and in the tooltips when hovering different arcs
            labels: labels
        }
    });
};



radarchartSPL.transformDataToArrayOfPoints_IFBVisu = function (data, xaxisAttrName, yaxisAttrName) {
// reduces data from IFB Schadensdatenvisualisierung to array containing only xaxisAttrName, yaxisAttrName and id.
    let pointsArr = new Array();

    // Walk through sets
    
    //console.log("Data=");
    //console.log(data);
    //--> all data.
    //console.log("Ausgewählt:");
    //console.log($('#swac_radarchart_filterOpt').val());            
    var checked = $('#swac_radarchart_filterOpt').val();
    //console.log(checked);

    for (let objects in data) {
        //console.log("objects=");
        //console.log(data[objects]);
        //--> array of all possible objects.
        for(let objectNr in data[objects]) {
            //console.log("ObjectNr=");
            //console.log(objectNr);
            //console.log(data[objects][objectNr]);
            //--> one specific object/dataset.
            let curObject = data[objects][objectNr];
            console.log(checked.indexOf(curObject[xaxisAttrName]));
            if(checked.indexOf(curObject[xaxisAttrName])!==-1||checked.length===0){
                let curPoint = {
                    x: curObject[xaxisAttrName],
                    y: curObject[yaxisAttrName],
                    id: curObject.id
                };
                pointsArr.push(curPoint);
            }
        }
    }
    console.log(pointsArr);
    return pointsArr;
};


radarchartSPL.createColorArray = function (numberElements) {
    var steps = 255/(numberElements-1);
    console.log(numberElements);
    var color = new Array();
    for(var i=0;i<numberElements;i++){
        console.log(steps*i);
        color[i] = 'rgba(' + 0 + ',' + 0 + ',' + steps*i + ',0.8)';
        //color[i] = 'rgba(' + steps*i + ',' + steps*i*Math.random(0,1) + ',' + steps*i*Math.random(0,1) + ',0.8)';
        //color[i] = 'rgba(' + 255 + ',' + 0 + ',' + 0 + ',0.3)';
    }
    console.log(color);
    return color;
};



/////* 
// * This is an plugin for SWAC chart. It allows to draw radarcharts.
// */
//
//let radarchartSPL = {};
//window['radarchartSPL'] = radarchartSPL; // Make global accessable
//
//
///**
// * Initilises the plugin
// * 
// * @param {object} pluginarea HTML element containing the area for the plugin
// * @param {object} set Set with data
// * @returns {undefined}
// */
//radarchartSPL.init = function (pluginarea, set) {
//
//};