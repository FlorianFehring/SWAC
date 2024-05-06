/* 
 * File with tastecases (testdata) for chart component
 */

let test_chart = {};

/**
 * This data should render an scatter chart with the linechart plugin
 * This is that every point is displayed in grid with values shown on
 * y and x axis
 * 
 * @param {type} requestor
 * @returns {undefined}
 */
test_chart.scatterChart = function (requestor) {
    let set = {
        id: 1,
        valx: 0,
        valy: 1
    };

    requestor.swac_comp.addSet('exampledata', set);

    let set2 = {
        id: 2,
        valx: 1,
        valy: 1.5
    };

    requestor.swac_comp.addSet('exampledata', set2);

    let set3 = {
        id: 3,
        valx: 2,
        valy: 1.0
    };

    requestor.swac_comp.addSet('exampledata', set3);

    let set4 = {
        id: 4,
        valx: 3,
        valy: 1.6
    };

    requestor.swac_comp.addSet('exampledata', set4);

    requestor.swac_comp.drawCharts();
};

/**
 * This data should render an linechart with the valx values used as labels
 * for the x axis.
 * 
 * @param {type} requestor
 * @returns {undefined}
 */
test_chart.labelChart = function (requestor) {
    let set = {
        id: 1,
        valx: 'a',
        valy: 1
    };

    requestor.swac_comp.addSet('exampledata', set);

    let set2 = {
        id: 2,
        valx: 'b',
        valy: 1.5
    };

    requestor.swac_comp.addSet('exampledata', set2);

    let set3 = {
        id: 3,
        valx: 'c',
        valy: 1.0
    };

    requestor.swac_comp.addSet('exampledata', set3);

    let set4 = {
        id: 4,
        valx: 'd',
        valy: 1.6
    };

    requestor.swac_comp.addSet('exampledata', set4);

    requestor.swac_comp.drawCharts();
};

/**
 * Creates an linechart with optimized display for dates on x-axis
 * 
 * @param {type} requestor
 * @returns {undefined}
 */
test_chart.dateChart = function (requestor) {
    let date = new Date();
    let set = {
        id: 1,
        ts: date,
        valy: 1
    };

    requestor.swac_comp.addSet('exampledata', set);

    let date2 = new Date();
    date2.setDate(date.getDate() + 1);
    let set2 = {
        id: 2,
        ts: date2,
        valy: 1.5
    };

    requestor.swac_comp.addSet('exampledata', set2);

    let date3 = new Date();
    date3.setDate(date2.getDate() + 1);
    let set3 = {
        id: 3,
        ts: date3,
        valy: 1.0
    };

    requestor.swac_comp.addSet('exampledata', set3);

    let date4 = new Date();
    date4.setDate(date3.getDate() + 1);
    let set4 = {
        id: 4,
        ts: date4,
        valy: 1.6
    };

    requestor.swac_comp.addSet('exampledata', set4);

    requestor.swac_comp.drawCharts();
};

/**
 * Creates an linechart with splitted values, so that each value is
 * shown as one line, but the ts attribute is x-axis (because its the first 
 * attribute after the per default ignored id)
 * 
 * @param {type} requestor
 * @returns {undefined}
 */
test_chart.dateChart = function (requestor) {
    
    let date = new Date();
    let set = {
        id: 1,
        ts: date,
        valy: 1,
        valz: 2.0,
        testv: 1.74
    };

    requestor.swac_comp.addSet('exampledata', set);

    let date2 = new Date();
    date2.setDate(date.getDate() + 1);
    let set2 = {
        id: 2,
        ts: date2,
        valy: 1.5,
        valz: 2.0,
        testv: 1.24
    };

    requestor.swac_comp.addSet('exampledata', set2);

    let date3 = new Date();
    date3.setDate(date2.getDate() + 1);
    let set3 = {
        id: 3,
        ts: date3,
        valy: 1.0,
        valz: 2.0,
        testv: 1.14
    };

    requestor.swac_comp.addSet('exampledata', set3);

    let date4 = new Date();
    date4.setDate(date3.getDate() + 1);
    let set4 = {
        id: 4,
        ts: date4,
        valy: 1.6,
        valz: 2.0,
        testv: 1.74
    };

    requestor.swac_comp.addSet('exampledata', set4);

    requestor.swac_comp.drawCharts();
};