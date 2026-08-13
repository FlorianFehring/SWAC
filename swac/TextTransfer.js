/**
 * Transfers text through the browser clipboard.
 */
export default class TextTransfer {

    constructor() {
        this.name = 'TextTransfer';
        this.options = {};
        this.desc = {
            text: 'Copies text to the browser clipboard with a compatibility fallback.',
            developers: 'Florian Fehring (HSBI)',
            license: 'GNU Lesser General Public License',
            depends: [], reqPerSet: [], optPerSet: [], opts: [], events: [],
            funcs: [], templates: [], styles: [], reqPerTpl: [], optPerTpl: []
        };
        this.desc.funcs[0] = {
            name: 'copy',
            desc: 'Copies text through the browser clipboard.',
            params: [{name: 'text', type: 'String', desc: 'Text to copy.'}],
            returns: {type: 'Promise<Boolean>', desc: 'True when the text was copied.'}
        };
    }

    /**
     * Copies text with a fallback for insecure browser contexts.
     *
     * @param {String} text Text to copy
     * @returns {Promise<Boolean>} True when the text was copied
     */
    static async copy(text) {
        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
            try {
                await navigator.clipboard.writeText(text);
                return true;
            } catch (e) {
                // Use the selection fallback below.
            }
        }

        let input = document.createElement('textarea');
        input.value = text;
        input.setAttribute('readonly', '');
        input.style.position = 'fixed';
        input.style.opacity = '0';
        document.body.appendChild(input);
        input.select();
        let copied = document.execCommand('copy');
        input.remove();
        return copied;
    }
}
