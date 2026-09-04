/**
 * Exports the visible content of HTML tables.
 */
export default class TableExport {

    constructor() {
        this.name = 'TableExport';
        this.options = {};
        this.desc = {
            text: 'Downloads visible HTML table data in CSV, JSON or XLSX format.',
            developers: 'Florian Fehring (HSBI)',
            license: 'GNU Lesser General Public License',
            depends: [], reqPerSet: [], optPerSet: [], opts: [], events: [],
            funcs: [], templates: [], styles: [], reqPerTpl: [], optPerTpl: []
        };
        this.desc.funcs[0] = {
            name: 'exportTable',
            desc: 'Downloads the visible rows of an HTML table.',
            params: [
                {name: 'table', type: 'HTMLTableElement', desc: 'Table to export.'},
                {name: 'filename', type: 'String', desc: 'Download filename.'},
                {name: 'format', type: 'String', desc: 'CSV, JSON or XLSX format.'}
            ],
            returns: {type: 'Boolean', desc: 'True when a file was created.'}
        };
    }

    /**
     * Downloads the visible table rows in the selected format.
     *
     * @param {HTMLTableElement} table Table to export
     * @param {String} filename Download filename
     * @param {String} format Export format
     * @returns {Boolean} True when a file was created
     */
    static exportTable(table, filename, format = 'csv') {
        let rows = this.getRows(table);
        if (rows.length < 2)
            return false;

        format = this.normalizeFormat(format);
        let blob = this.createBlob(rows, format);
        this.download(blob, this.getFilename(filename, format));
        return true;
    }

    /**
     * Creates the download data for one export format.
     *
     * @param {Array} rows Table rows
     * @param {String} format Export format
     * @returns {Blob} Download data
     */
    static createBlob(rows, format) {
        if (format === 'json') {
            let records = this.getRecords(rows);
            return new Blob([JSON.stringify(records, null, 2)], {
                type: 'application/json;charset=utf-8'
            });
        }
        if (format === 'xlsx') {
            return new Blob([this.createXlsx(rows)], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
        }

        let csv = rows.map(row => row.map(value => this.escape(value)).join(';')).join('\r\n');
        return new Blob(['\uFEFF' + csv], {type: 'text/csv;charset=utf-8'});
    }

    /**
     * Starts a browser download for a blob.
     *
     * @param {Blob} blob Download data
     * @param {String} filename Download filename
     * @returns {undefined}
     */
    static download(blob, filename) {
        let url = URL.createObjectURL(blob);
        let link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    }

    /**
     * Reads the visible table header and data rows.
     *
     * @param {HTMLTableElement} table Table to read
     * @returns {Array} Cell values by row
     */
    static getRows(table) {
        if (!(table instanceof HTMLTableElement))
            return [];

        let swacRows = this.getSwacRows(table);
        if (swacRows.length > 0)
            return this.getSwacTableRows(table, swacRows);

        let header = table.tHead?.rows[0]
                || [...table.rows].find(row => row.querySelector('th'));
        if (!header)
            return [];

        let rows = [this.getCells(header)];
        for (let row of table.rows) {
            if (row === header || !this.isVisibleRow(row) || row.querySelector('th')
                    || this.isFilterRow(row))
                continue;
            rows.push(this.getCells(row));
        }
        return rows;
    }

    /**
     * Checks whether a row only contains filter controls.
     *
     * @param {HTMLTableRowElement} row Table row
     * @returns {Boolean} True when the row is a filter row
     */
    static isFilterRow(row) {
        return row.cells.length > 0 && [...row.cells].every(cell =>
            cell.querySelector('input, select, textarea') && this.getCellText(cell) === '');
    }

    /**
     * Gets rendered SWAC data rows when the table uses a SWAC template.
     *
     * @param {HTMLTableElement} table Table to read
     * @returns {Array} Visible SWAC data rows
     */
    static getSwacRows(table) {
        return [...table.rows].filter(row => this.isVisibleRow(row)
                    && (row.classList.contains('swac_repeatedForSet')
                            || row.classList.contains('swac_datafilterbar_displayrow')));
    }

    /**
     * Reads only attribute cells from rendered SWAC table rows.
     *
     * @param {HTMLTableElement} table Table to read
     * @param {Array} rows Visible SWAC data rows
     * @returns {Array} Headers and data rows
     */
    static getSwacTableRows(table, rows) {
        let attrs = [];
        for (let row of rows) {
            for (let cell of this.getSwacCells(row)) {
                let attr = this.getCellAttribute(cell);
                if (attr && !attrs.includes(attr))
                    attrs.push(attr);
            }
        }
        if (attrs.length === 0)
            return [];

        let headers = attrs.map(attr => this.getSwacHeaderLabel(table, attr));
        let result = [headers];
        for (let row of rows) {
            let cells = this.getSwacCells(row);
            result.push(attrs.map(attr => {
                let cell = cells.find(curCell => this.getCellAttribute(curCell) === attr);
                return cell ? this.getCellText(cell) : '';
            }));
        }
        return result;
    }

    /**
     * Gets data cells that represent one SWAC attribute.
     *
     * @param {HTMLTableRowElement} row Data row
     * @returns {Array} Attribute cells
     */
    static getSwacCells(row) {
        return [...row.cells].filter(cell => this.getCellAttribute(cell));
    }

    /**
     * Gets the data attribute represented by one table cell.
     *
     * @param {HTMLTableCellElement} cell Table cell
     * @returns {String|null} Attribute name
     */
    static getCellAttribute(cell) {
        return cell.getAttribute('swac_datafilterbar_col')
                || cell.getAttribute('swac_attrname')
                || cell.getAttribute('attrname');
    }

    /**
     * Gets the visible label of one SWAC table attribute.
     *
     * @param {HTMLTableElement} table Table to read
     * @param {String} attr Attribute name
     * @returns {String} Visible header label
     */
    static getSwacHeaderLabel(table, attr) {
        for (let head of table.querySelectorAll('th')) {
            if (this.getCellAttribute(head) !== attr)
                continue;
            let label = head.querySelector('.swac_datafilterbar_colname');
            return label ? this.getCellText(label) : this.getCellText(head) || attr;
        }
        return attr;
    }

    /**
     * Checks whether a table row is currently visible.
     *
     * @param {HTMLTableRowElement} row Table row
     * @returns {Boolean} True when the row is visible
     */
    static isVisibleRow(row) {
        return !row.hidden && !row.classList.contains('swac_dontdisplay')
                && row.style.display !== 'none'
                && window.getComputedStyle(row).display !== 'none';
    }

    /**
     * Gets normalized cell text from one table row.
     *
     * @param {HTMLTableRowElement} row Table row
     * @returns {Array} Cell texts
     */
    static getCells(row) {
        return [...row.cells]
                .filter(cell => cell.dataset.tableExportSkip !== 'true')
                .map(cell => this.getCellText(cell));
    }

    /**
     * Gets normalized text from one table cell.
     *
     * @param {HTMLTableCellElement|HTMLElement} cell Table cell
     * @returns {String} Cell text
     */
    static getCellText(cell) {
        return cell.textContent.replace(/\s+/g, ' ').trim();
    }

    /**
     * Escapes one value for semicolon separated CSV.
     *
     * @param {*} value Cell value
     * @returns {String} CSV cell value
     */
    static escape(value) {
        return '"' + String(value ?? '').replace(/"/g, '""') + '"';
    }

    /**
     * Converts table rows into records with unique property names.
     *
     * @param {Array} rows Table rows
     * @returns {Array} JSON records
     */
    static getRecords(rows) {
        let headers = this.getHeaders(rows[0]);
        return rows.slice(1).map(row => {
            let record = {};
            for (let index = 0; index < headers.length; index++)
                record[headers[index]] = row[index] ?? '';
            return record;
        });
    }

    /**
     * Creates unique property names from table headers.
     *
     * @param {Array} headers Table headers
     * @returns {Array} Unique headers
     */
    static getHeaders(headers) {
        let used = new Map();
        return headers.map((header, index) => {
            let name = String(header || 'column_' + (index + 1));
            let count = (used.get(name) || 0) + 1;
            used.set(name, count);
            return count === 1 ? name : name + '_' + count;
        });
    }

    /**
     * Creates a minimal XLSX workbook without external dependencies.
     *
     * @param {Array} rows Table rows
     * @returns {Uint8Array} XLSX data
     */
    static createXlsx(rows) {
        let sheetRows = rows.map((row, rowIndex) => '<row r="' + (rowIndex + 1) + '">' + row.map((value, columnIndex) =>
                    '<c r="' + this.getColumnName(columnIndex + 1) + (rowIndex + 1) + '" t="inlineStr"><is><t>'
                    + this.escapeXml(value) + '</t></is></c>').join('') + '</row>').join('');
        let files = {
            '[Content_Types].xml': '<?xml version="1.0" encoding="UTF-8"?>'
                    + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
                    + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
                    + '<Default Extension="xml" ContentType="application/xml"/>'
                    + '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
                    + '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
                    + '</Types>',
            '_rels/.rels': '<?xml version="1.0" encoding="UTF-8"?>'
                    + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
                    + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
                    + '</Relationships>',
            'xl/workbook.xml': '<?xml version="1.0" encoding="UTF-8"?>'
                    + '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
                    + '<sheets><sheet name="Data" sheetId="1" r:id="rId1"/></sheets></workbook>',
            'xl/_rels/workbook.xml.rels': '<?xml version="1.0" encoding="UTF-8"?>'
                    + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
                    + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>'
                    + '</Relationships>',
            'xl/worksheets/sheet1.xml': '<?xml version="1.0" encoding="UTF-8"?>'
                    + '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>'
                    + sheetRows + '</sheetData></worksheet>'
        };
        return this.createZip(files);
    }

    /**
     * Creates an uncompressed ZIP archive used by the XLSX format.
     *
     * @param {Object} files File contents by path
     * @returns {Uint8Array} ZIP data
     */
    static createZip(files) {
        let encoder = new TextEncoder();
        let entries = Object.entries(files).map(([name, content]) => ({
                name: encoder.encode(name),
                content: encoder.encode(content)
            }));
        let parts = [];
        let centralParts = [];
        let offset = 0;
        for (let entry of entries) {
            let crc = this.getCrc32(entry.content);
            let local = this.joinBytes([
                this.getUint32(0x04034b50), this.getUint16(20), this.getUint16(0),
                this.getUint16(0), this.getUint16(0), this.getUint16(0),
                this.getUint32(crc), this.getUint32(entry.content.length),
                this.getUint32(entry.content.length), this.getUint16(entry.name.length),
                this.getUint16(0), entry.name, entry.content
            ]);
            parts.push(local);
            centralParts.push(this.joinBytes([
                this.getUint32(0x02014b50), this.getUint16(20), this.getUint16(20),
                this.getUint16(0), this.getUint16(0), this.getUint16(0), this.getUint16(0),
                this.getUint32(crc), this.getUint32(entry.content.length),
                this.getUint32(entry.content.length), this.getUint16(entry.name.length),
                this.getUint16(0), this.getUint16(0), this.getUint16(0), this.getUint16(0),
                this.getUint32(0), this.getUint32(offset), entry.name
            ]));
            offset += local.length;
        }
        let central = this.joinBytes(centralParts);
        let end = this.joinBytes([
            this.getUint32(0x06054b50), this.getUint16(0), this.getUint16(0),
            this.getUint16(entries.length), this.getUint16(entries.length),
            this.getUint32(central.length), this.getUint32(offset), this.getUint16(0)
        ]);
        return this.joinBytes([...parts, central, end]);
    }

    /**
     * Calculates the CRC32 checksum of ZIP file content.
     *
     * @param {Uint8Array} bytes File content
     * @returns {Number} CRC32 checksum
     */
    static getCrc32(bytes) {
        let crc = 0xffffffff;
        for (let byte of bytes) {
            crc ^= byte;
            for (let index = 0; index < 8; index++)
                crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
        }
        return (crc ^ 0xffffffff) >>> 0;
    }

    /**
     * Returns the XLSX column name for a one based column index.
     *
     * @param {Number} index One based column index
     * @returns {String} XLSX column name
     */
    static getColumnName(index) {
        let name = '';
        while (index > 0) {
            index--;
            name = String.fromCharCode(65 + (index % 26)) + name;
            index = Math.floor(index / 26);
        }
        return name;
    }

    /**
     * Escapes a value for an XML text node.
     *
     * @param {*} value Text value
     * @returns {String} XML safe text
     */
    static escapeXml(value) {
        return String(value ?? '').replace(/[&<>"']/g, character => ({
                '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'
            })[character]);
    }

    /**
     * Creates a little endian 16 bit value.
     *
     * @param {Number} value Numeric value
     * @returns {Uint8Array} Binary value
     */
    static getUint16(value) {
        return new Uint8Array([value & 0xff, (value >>> 8) & 0xff]);
    }

    /**
     * Creates a little endian 32 bit value.
     *
     * @param {Number} value Numeric value
     * @returns {Uint8Array} Binary value
     */
    static getUint32(value) {
        return new Uint8Array([
            value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff,
            (value >>> 24) & 0xff
        ]);
    }

    /**
     * Joins binary parts into one byte array.
     *
     * @param {Array} parts Binary parts
     * @returns {Uint8Array} Joined bytes
     */
    static joinBytes(parts) {
        let length = parts.reduce((sum, part) => sum + part.length, 0);
        let result = new Uint8Array(length);
        let offset = 0;
        for (let part of parts) {
            result.set(part, offset);
            offset += part.length;
        }
        return result;
    }

    /**
     * Restricts exports to the supported file formats.
     *
     * @param {String} format Requested format
     * @returns {String} Supported format
     */
    static normalizeFormat(format) {
        return ['csv', 'json', 'xlsx'].includes(format) ? format : 'csv';
    }

    /**
     * Creates a portable filename for one export format.
     *
     * @param {String} filename Requested filename
     * @param {String} format Export format
     * @returns {String} Export filename
     */
    static getFilename(filename, format = 'csv') {
        let name = String(filename || 'table')
                .replace(/[^a-z0-9_\-.]+/gi, '_')
                .replace(/^[_\.]+|[_\.]+$/g, '')
                .replace(/\.(csv|json|xlsx)$/i, '');
        return (name || 'table') + '.' + this.normalizeFormat(format);
    }
}
