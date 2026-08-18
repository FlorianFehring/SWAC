import AIDataSourceAdapter from './AIDataSourceAdapter.js?ver=17.08.2026.9';

/**
 * Loads and adapts external json data sources for SWAC components.
 */
export default class ExternalDataSource {

    constructor() {
        this.name = 'ExternalDataSource';
        this.options = {};
        this.desc = {
            text: 'Loads JSON from web addresses or local files and adapts its records.',
            developers: 'Florian Fehring (HSBI)',
            license: 'GNU Lesser General Public License',
            depends: [], reqPerSet: [], optPerSet: [], opts: [], events: [],
            funcs: [], templates: [], styles: [], reqPerTpl: [], optPerTpl: []
        };
        this.desc.funcs[0] = {
            name: 'loadJson',
            desc: 'Loads and parses JSON from a web address.',
            params: [{name: 'url', type: 'String', desc: 'JSON source URL.'}],
            returns: {type: 'Promise', desc: 'Parsed JSON value.'}
        };
        this.desc.funcs[1] = {
            name: 'readJsonFile',
            desc: 'Reads and parses a selected local JSON file.',
            params: [{name: 'file', type: 'File', desc: 'Selected JSON file.'}],
            returns: {type: 'Promise', desc: 'Parsed JSON value.'}
        };
        this.desc.funcs[2] = {
            name: 'adapt',
            desc: 'Applies the selected adaptation method.',
            params: [
                {name: 'data', type: 'Object', desc: 'JSON source data.'},
                {name: 'sourceName', type: 'String', desc: 'Source name.'},
                {name: 'mode', type: 'String', desc: 'Adaptation mode.'}
            ],
            returns: {type: 'Promise', desc: 'Adaptation result.'}
        };
    }

    /**
     * Normalizes a supported external source link.
     *
     * @param {String} link External source link
     * @returns {String|null} Normalized link or null
     */
    static normalizeLink(link) {
        let source = String(link || '').trim();
        let parsed;
        try {
            parsed = new URL(source);
        } catch (e) {
            return null;
        }
        if (!['http:', 'https:'].includes(parsed.protocol))
            return null;
        if (parsed.hostname === 'drive.google.com') {
            let id = parsed.searchParams.get('id');
            let match = parsed.pathname.match(/\/file\/d\/([^\/]+)/);
            if (!id && match)
                id = match[1];
            if (id)
                return 'https://drive.google.com/uc?export=download&id='
                        + encodeURIComponent(id);
        }
        return parsed.href;
    }

    /**
     * Loads json from an external source without SWAC request headers.
     *
     * @param {String} url Json source URL
     * @returns {Promise<*>} Parsed json value
     */
    static loadJson(url) {
        return fetch(url, {
            method: 'GET',
            cache: 'no-cache',
            credentials: 'omit',
            headers: {
                'Accept': 'application/json, text/plain;q=0.9, */*;q=0.8'
            }
        }).then((response) => {
            if (!response.ok)
                throw new Error('HTTP status ' + response.status);
            return response.text();
        }).then((text) => this.parseJson(text));
    }

    /**
     * Reads a local json file.
     *
     * @param {File} file Selected json file
     * @returns {Promise<*>} Parsed json value
     */
    static readJsonFile(file) {
        return new Promise((resolve, reject) => {
            let reader = new FileReader();
            reader.onload = () => {
                try {
                    resolve(this.parseJson(reader.result));
                } catch (e) {
                    reject(e);
                }
            };
            reader.onerror = () => reject(new Error('Could not read selected file.'));
            reader.readAsText(file);
        });
    }

    /**
     * Parses a json response with an optional byte order mark.
     *
     * @param {*} text Json response text
     * @returns {*} Parsed json value
     */
    static parseJson(text) {
        let jsonText = String(text || '').trim().replace(/^\uFEFF/, '');
        try {
            return JSON.parse(jsonText);
        } catch (e) {
            let firstObject = jsonText.indexOf('{');
            let firstArray = jsonText.indexOf('[');
            let start = firstObject >= 0 && (firstArray < 0 || firstObject < firstArray)
                    ? firstObject : firstArray;
            let endObject = jsonText.lastIndexOf('}');
            let endArray = jsonText.lastIndexOf(']');
            let end = Math.max(endObject, endArray);
            if (start >= 0 && end > start)
                return JSON.parse(jsonText.substring(start, end + 1));
            throw new Error('Response is no valid json.');
        }
    }

    /**
     * Adapts source data with the selected method.
     *
     * @param {*} data Source json value
     * @param {String} sourceName Source identifier
     * @param {String} mode Adaptation mode
     * @returns {Promise<Object>} Adaptation result
     */
    static adapt(data, sourceName, mode) {
        return AIDataSourceAdapter.adaptCapsule({
            data: data,
            fromName: sourceName
        }, {
            mode: AIDataSourceAdapter.normalizeMode(mode)
        });
    }
}
