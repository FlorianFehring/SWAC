/**
 * Converts supported MathJSON expressions into safe data formulas.
 */
export default class MathJsonFormula {

    /**
     * Parses a MathJSON value returned by MathLive.
     *
     * @param {String|Object|Array} value MathJSON value
     * @returns {Object|Array|Number|String|null} Parsed MathJSON or null
     */
    static parse(value) {
        if (typeof value !== 'string')
            return value || null;
        try {
            return JSON.parse(value);
        } catch (e) {
            return null;
        }
    }

    /**
     * Converts supported MathJSON into the existing safe formula syntax.
     *
     * @param {Object|Array|Number|String} mathJson MathJSON expression
     * @param {Object} variables Map of MathJSON symbols to attributes
     * @returns {String|null} Formula string or null
     */
    static toFormula(mathJson, variables = {}) {
        return this.toFormulaPart(mathJson, variables);
    }

    /**
     * Checks whether a value can be used as a MathJSON symbol.
     *
     * @param {String} value Symbol candidate
     * @returns {Boolean} True for supported symbols
     */
    static isSymbol(value) {
        return typeof value === 'string' && /^[A-Za-z_][A-Za-z0-9_]*$/.test(value);
    }

    /**
     * Creates unique MathJSON symbols for a set of attributes.
     *
     * @param {Iterable<String>} attributes Attribute names
     * @returns {Object} Symbol map and attribute aliases
     */
    static createVariables(attributes) {
        let variables = {};
        let aliases = [];
        let aliasIndex = 1;
        for (let attr of Array.from(attributes).sort()) {
            let symbol = this.isSymbol(attr) ? attr : null;
            if (!symbol || variables[symbol]) {
                do {
                    symbol = 'value_' + aliasIndex++;
                } while (variables[symbol]);
                aliases.push({symbol: symbol, attr: attr});
            }
            variables[symbol] = attr;
        }
        return {variables: variables, aliases: aliases};
    }

    /**
     * Converts one MathJSON node recursively.
     *
     * @param {Object|Array|Number|String} node MathJSON node
     * @param {Object} variables Map of MathJSON symbols to attributes
     * @returns {String|null} Formula fragment or null
     */
    static toFormulaPart(node, variables) {
        if (typeof node === 'number')
            return Number.isFinite(node) ? String(node) : null;
        if (typeof node === 'string')
            return variables[node] || null;
        if (node && typeof node === 'object' && !Array.isArray(node))
            return this.numberObjectToFormula(node);
        if (!Array.isArray(node) || node.length === 0)
            return null;

        let operator = node[0];
        if (operator === 'Subscript') {
            let symbol = this.getSubscriptSymbol(node);
            return symbol && variables[symbol] ? variables[symbol] : null;
        }
        if (operator === 'Negate') {
            let value = this.toFormulaPart(node[1], variables);
            return value === null ? null : '(-(' + value + '))';
        }

        let opMap = {
            Add: '+',
            Subtract: '-',
            Multiply: '*',
            Divide: '/',
            Power: '**'
        };
        let op = opMap[operator];
        if (!op || node.length < 3)
            return null;
        if (operator === 'Power' && node.length !== 3)
            return null;
        let parts = [];
        for (let i = 1; i < node.length; i++) {
            let part = this.toFormulaPart(node[i], variables);
            if (part === null)
                return null;
            parts.push('(' + part + ')');
        }
        return '(' + parts.join(op) + ')';
    }

    /**
     * Converts a MathJSON numeric object.
     *
     * @param {Object} node MathJSON number object
     * @returns {String|null} Numeric literal or null
     */
    static numberObjectToFormula(node) {
        if (!Object.prototype.hasOwnProperty.call(node, 'num'))
            return null;
        let value = Number(node.num);
        return Number.isFinite(value) ? String(value) : null;
    }

    /**
     * Returns the symbol key for a subscripted MathJSON variable.
     *
     * @param {Array} node MathJSON subscript expression
     * @returns {String|null} Symbol key or null
     */
    static getSubscriptSymbol(node) {
        if (typeof node[1] !== 'string')
            return null;
        let index = typeof node[2] === 'number' ? node[2] : null;
        if (index === null && node[2] && typeof node[2] === 'object' && 'num' in node[2])
            index = Number(node[2].num);
        return Number.isFinite(index) ? node[1] + '_' + index : null;
    }
}
