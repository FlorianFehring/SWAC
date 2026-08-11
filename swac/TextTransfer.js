/**
 * Transfers text through the browser clipboard.
 */
export default class TextTransfer {

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
