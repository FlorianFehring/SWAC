import SWAC from '../../swac.js';
import Msg from '../../Msg.js';
import Algorithm from '../../Algorithm.js';

/**
 * Contains methods for detection of datatypes.
 */
export default class DatatypeReflection extends Algorithm {

    /*
     * Constructs a new algorithm and transfers the config to the
     * object
     */
    constructor(options) {
        super(options);
        // Component description
        this.name = 'DatatypeReflection';
        this.desc.text = 'DatatypeReflection methods';
        this.desc.depends[0] = {
            name: 'luxon.js',
            path: SWAC.config.swac_root + 'algorithms/DatatypeReflection/libs/luxon.min.js',
            desc: 'Description for what the file is required.'
        };

        // Overwrite default options with given options
        for (let attrname in options) {
            this.options[attrname] = options[attrname];
        }
    }

    /**
     * Initializes the algorithm
     * 
     * @returns {undefined}
     */
    init() {
        return new Promise((resolve, reject) => {
            resolve();
        });
    }

    /**
     * Determines the best matching datatype for the given value
     * 
     * @param {Object} value A value to examine
     * @returns {String} Name of the datatype the value belongs to
     */
    determineDataType(value) {
        if(!value)
            return 'undefined';
        // Check if value is boolean
        if (typeof value === 'boolean')
            return 'bool';
        // Check if value is an number
        let numValue = Number(value);
        if (value !== '' && Number.isInteger(numValue)) {
            if (numValue > -2147483647 && numValue < 2147483647)
                return 'int4';
            else
                return 'int8';
        } else if (value !== '' && !Number.isNaN(numValue)) {
            let numParts = ('' + value).split('.');
            if (numParts[1].length < 7)
                return 'float4';
            else
                return 'float8';
        }
        if (this.isDate(value))
            return 'date';
        if (this.isDateTime(value))
            return 'timestamp';
        if (this.isColor(value))
            return 'color';
        if (this.isEmail(value))
            return 'email';
        if (this.isReference(value))
            return 'reference';
        if (this.isURL(value))
            return 'url';
        // check for long text
        if (value.length > 50) {
            return 'text';
        }
        return 'varchar';
    }

    /**
     * Checks if the given value is an date
     * @param {type} value
     * @returns {undefined}
     */
    isDate(value) {
        if (value === null) {
            return false;
        }
        // Try get date format
        let dt = this.getDateOrDateTime(value);
        if (dt && !dt.hour)
            return true;
        return false;
    }

    /**
     * Checks if the given value is an date
     * @param {type} value
     * @returns {undefined}
     */
    isDateTime(value) {
        if (value === null) {
            return false;
        }
        // Try get date format
        let dt = this.getDateOrDateTime(value);
        if (dt && dt.hour)
            return true;
        return false;
    }
    /**
     * Checks if the given value is an date or a datetime
     * @param {type} value
     * @returns {undefined}
     */
    isDateOrDateTime(value) {
        if (value === null) {
            return false;
        }
        // Try get date format
        let dt = this.getDateOrDateTime(value);
        if (dt)
            return true;
        return false;
    }

    /**
     * Gets the date if possible
     * 
     * @param {type} value
     * @returns {DateTime}
     */
    getDateOrDateTime(value) {
        //TODO how to descide between date and normal int?
        if (typeof value !== 'string')
            return null;
        let dt = luxon.DateTime.fromISO(value);
        if (dt.isValid)
            return dt;
        dt = luxon.DateTime.fromRFC2822(value);
        if (dt.isValid)
            return dt;
        dt = luxon.DateTime.fromHTTP(value);
        if (dt.isValid)
            return dt;
        dt = luxon.DateTime.fromSQL(value);
        if (dt.isValid)
            return dt;
        try {
            dt = luxon.DateTime.fromSeconds(value);
            if (dt.isValid)
                return dt;
        } catch (e) {
        }
        try {
            dt = luxon.DateTime.fromMillis(value);
            if (dt.isValid)
                return dt;
        } catch (e) {
        }
        //29.10.2019 7:48:59
        dt = luxon.DateTime.fromFormat(value, "d.M.y H:m:s");
        if (dt.isValid)
            return dt;
        dt = luxon.DateTime.fromFormat(value, "d.M.y H:m");
        if (dt.isValid)
            return dt;
        
        //29.10.2019
        dt = luxon.DateTime.fromFormat(value, "d.M.y");
        if (dt.isValid)
            return dt;
        
        //Msg.error('DatatypeReflection','Given value >' + value + '< is no supported date / time format.',this.requestor);
        return null;
    }

    /**
     * Gets the data format standard
     * 
     * @param {type} value
     * @returns {String|Boolean} Name of the standard or false
     */
    getDateFormat(value) {
        let dt = luxon.DateTime.fromISO(value);
        if (dt.isValid)
            return 'ISO8601';
        dt = luxon.DateTime.fromRFC2822(value);
        if (dt.isValid)
            return 'RFC2822';
        dt = luxon.DateTime.fromHTTP(value);
        if (dt.isValid)
            return 'HTTP';
        dt = luxon.DateTime.fromSQL(value);
        if (dt.isValid)
            return 'SQL';
        try {
            dt = luxon.DateTime.fromSeconds(value);
            if (dt.isValid)
                return 'UnixSeconds';
        } catch (e) {
        }
        try {
            dt = luxon.DateTime.fromMillis(value);
            if (dt.isValid)
                return 'UnixMillis';
        } catch (e) {
        }
        //29.10.2019T7:48:59
        dt = luxon.DateTime.fromFormat(value, "DD.MM.YYYY HH:mm:ss");
        if (dt.isValid)
            return 'DIN1355-1';
        return false;
    }

    /**
     * Checks if the given value is an color
     * 
     * @param {type} value
     * @returns {boolean} true if value is an color
     */
    isColor(value) {
        if (!value || typeof value.startsWith === 'undefined')
            return false;

        // HEX colors
        if (value.startsWith('#'))
            return true;
        // RGBA colors
        if (value.startsWith('0x')) {
            return true;
        }
        // Color names
        switch (value) {
            case 'red':
            case 'green':
            case 'blue':
            case 'yellow':
                return true;
        }
        return false;
    }

    /**
     * Checks if the given value is a email
     * 
     * @return {boolean} true if the value is email 
     */
    isEmail(value) {
        if (!value || typeof value.startsWith === 'undefined')
            return false;

        const res = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return res.test(String(value).toLowerCase());
    }

    /**
     * Checks if the value is an url
     * 
     * @return {boolean} True if the value is an url
     */
    isURL(value) {
        try {
            new URL(value);
            return true;
        } catch (err) {
            return false;
        }
    }

    /**
     * Checks if the value is a reference
     * 
     * @return {bool} True if value is refernece
     */
    isReference(value) {
        if (!value || typeof value.startsWith === 'undefined')
            return false;

        if (value.startsWith('ref://') && this.isURL(value))
            return true;
        return false;
    }
}