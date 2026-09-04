/**
 * Describes optional user interface functions for data views.
 */
export const guiFunctions = [
    {
        name: 'filter',
        option: 'guiFilter',
        desc: 'Shows filter controls in the component settings menu.',
        example: true,
        sections: ['filters']
    },
    {
        name: 'aggregation',
        option: 'guiAggregation',
        desc: 'Shows aggregation controls in the component settings menu.',
        example: true,
        sections: ['aggregation']
    },
    {
        name: 'series',
        option: 'guiSeries',
        desc: 'Shows data series controls in the component settings menu.',
        example: true,
        sections: ['series']
    },
    {
        name: 'computedColumns',
        option: 'guiComputedColumns',
        desc: 'Shows calculated column controls in the component settings menu.',
        example: true,
        sections: ['computed']
    },
    {
        name: 'datasource',
        option: 'guiDatasource',
        desc: 'Shows controls for loading an additional datasource.',
        example: true,
        sections: ['datasource']
    },
    {
        name: 'tableExport',
        option: 'guiTableExport',
        desc: 'Shows table export controls in the component settings menu.',
        example: true,
        sections: ['tableexport']
    },
    {
        name: 'settings',
        option: 'guiSettings',
        desc: 'Shows controls for importing and exporting component settings.',
        example: true,
        sections: ['settings']
    },
    {
        name: 'requestor',
        option: 'guiRequestor',
        desc: 'Shows the resulting data request in the component settings menu.',
        example: true,
        sections: ['requestor']
    }
];

/**
 * Gets enabled GUI functions from component options.
 *
 * @param {Object} options Component options
 * @param {Array<String>|null} supportedFunctions Supported function names
 * @returns {Array<Object>} Enabled GUI functions
 */
export function getEnabledGuiFunctions(options = {}, supportedFunctions = null) {
    return guiFunctions.filter(function (func) {
        return (options[func.option] === true || options[func.option] === 'true')
                && (!supportedFunctions || supportedFunctions.includes(func.name));
    });
}

/**
 * Gets menu sections configured through GUI functions.
 *
 * @param {Object} options Component options
 * @param {Array<String>|null} supportedFunctions Supported function names
 * @returns {Array<String>|null} Configured sections or null for legacy configuration
 */
export function getConfiguredGuiSections(options = {}, supportedFunctions = null) {
    let functions = supportedFunctions
            ? guiFunctions.filter(func => supportedFunctions.includes(func.name))
            : guiFunctions;
    let configured = functions.some(func => Object.prototype.hasOwnProperty.call(options, func.option));
    if (!configured)
        return null;

    let sections = new Set();
    for (let func of getEnabledGuiFunctions(options, supportedFunctions)) {
        for (let section of func.sections)
            sections.add(section);
    }
    return [...sections];
}
