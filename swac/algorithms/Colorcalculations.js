/**
 * Collection of algorithms for calculating with colors.
 * 
 * @type type
 */
class Colorcalculations {

    /**
     * Calculates the brightness for a color
     * @param {String} color hex, rgba or colorname
     * @returns {Number} Colors brightness
     */
    static calculateBrightness(color) {
        let rgbs = color;
        if(typeof color.r === 'undefined') {
            rgbs = Colorcalculations.getRGBValues(color);
        }
        return Math.sqrt(
                rgbs.r * rgbs.r * .241 +
                rgbs.g * rgbs.g * .691 +
                rgbs.b * rgbs.b * .068);
    }

    /**
     * Calculates the contrast color for a given color.
     * @param {String} color Hex, RGBA or colorname
     * @returns {String} hex expression for the contrast color
     */
    static calculateContrastColor(color) {
        let brightness = Colorcalculations.calculateBrightness(color);
        if (brightness > 130) {
            return '#000000';
        }
        if (brightness <= 130) {
            return '#ffffff';
        }
    }

    /**
     * Transforms a RGBA hexstring (0xABGR) into his hex expression (#RGB).
     * @param {type} rgbacol
     * @returns {String}
     */
    static rgbaToHex(rgbacol) {
        let hexcol;
        // Check clolor
        if (rgbacol.startsWith('0x')
                && rgbacol.length === 10) {
            hexcol = rgbacol.substring(4);
            let red = rgbacol.substring(4);
            let green = rgbacol.substring(2, 4);
            let blue = rgbacol.substring(0, 2);
            hexcol = '#' + red + green + blue;
        } else {
            Msg.rgbaToHex('Colorcalculation', 'The given color >' + rgbacol + '< is no RGBA color.');
        }
        return hexcol;
    }

    /**
     * Converts a hex color (e.g. #ffffff) to his rgb expression (e.g. rgb(255,255,255))
     * @param {String} hexcol Color in hexadecimal notation
     * @returns {String}
     */
    static hexToRGB(hexcol) {
        let rgbcol;
        if (hexcol.startsWith('#')) {
            let digitcol = hexcol.substring(1, 7);
            rgbcol = 'rgb(';
            rgbcol += parseInt(digitcol.substring(0, 2), 16);
            rgbcol += parseInt(digitcol.substring(2, 4), 16);
            rgbcol += parseInt(digitcol.substring(4, 6), 16);
            rgbcol += ')';
        } else {
            Msg.rgbaToHex('Colorcalculation', 'The given color >' + hexcol + '< is no hexadecimal color.');
        }
        return rgbcol;
    }

    /**
     * Gets the r, g and b values from a color
     * @param {String} color hex, rgba or name
     * @returns {Colorcalculations.getRGBValues.rgb}
     */
    static getRGBValues(color) {
        let rgb = {};
        // Convert rgba to hex if necessery
        if (color.startsWith('0x')) {
            color = Colorcalculations.rgbaToHex(color);
        } else if(!color.startsWith('#')) {
            // Convert colorname to hex
            let col = Colorcalculations.colornameToHex(color);
            if(col)
                color = col;
        }
        if (color.startsWith('#')) {
            let digitcol = color.substring(1, 7);
            rgb.r = parseInt(digitcol.substring(0, 2), 16);
            rgb.g = parseInt(digitcol.substring(2, 4), 16);
            rgb.b = parseInt(digitcol.substring(4, 6), 16);
        }
        return rgb;
    }

    /**
     * Calculate hex value from rgb
     * 
     * @param {Object} rgb RGB object
     * @returns {String} Hex value
     */
    static rgbToHex(rgb) {
        let hex = '#';
        let hexr = Math.round(rgb.r).toString(16);
        hex += hexr.length < 2 ? '0' + hexr : hexr;
        let hexg = Math.round(rgb.g).toString(16);
        hex += hexg.length < 2 ? '0' + hexg : hexg;
        let hexb = Math.round(rgb.b).toString(16);
        hex += hexb.length < 2 ? '0' + hexb : hexb;
        return hex;
    }

    /**
     * Converts a given colorname to its hexcolor expression
     * @param {String} color Name of a color
     * @returns {Colorcalculations.colornameToHex.colors|colours|Bocolors     */
    static colornameToHex(color) {
        var colors = {"aliceblue": "#f0f8ff", "antiquewhite": "#faebd7", "aqua": "#00ffff", "aquamarine": "#7fffd4", "azure": "#f0ffff",
            "beige": "#f5f5dc", "bisque": "#ffe4c4", "black": "#000000", "blanchedalmond": "#ffebcd", "blue": "#0000ff", "blueviolet": "#8a2be2", "brown": "#a52a2a", "burlywood": "#deb887",
            "cadetblue": "#5f9ea0", "chartreuse": "#7fff00", "chocolate": "#d2691e", "coral": "#ff7f50", "cornflowerblue": "#6495ed", "cornsilk": "#fff8dc", "crimson": "#dc143c", "cyan": "#00ffff",
            "darkblue": "#00008b", "darkcyan": "#008b8b", "darkgoldenrod": "#b8860b", "darkgray": "#a9a9a9", "darkgreen": "#006400", "darkkhaki": "#bdb76b", "darkmagenta": "#8b008b", "darkolivegreen": "#556b2f",
            "darkorange": "#ff8c00", "darkorchid": "#9932cc", "darkred": "#8b0000", "darksalmon": "#e9967a", "darkseagreen": "#8fbc8f", "darkslateblue": "#483d8b", "darkslategray": "#2f4f4f", "darkturquoise": "#00ced1",
            "darkviolet": "#9400d3", "deeppink": "#ff1493", "deepskyblue": "#00bfff", "dimgray": "#696969", "dodgerblue": "#1e90ff",
            "firebrick": "#b22222", "floralwhite": "#fffaf0", "forestgreen": "#228b22", "fuchsia": "#ff00ff",
            "gainsboro": "#dcdcdc", "ghostwhite": "#f8f8ff", "gold": "#ffd700", "goldenrod": "#daa520", "gray": "#808080", "green": "#008000", "greenyellow": "#adff2f",
            "honeydew": "#f0fff0", "hotpink": "#ff69b4",
            "indianred ": "#cd5c5c", "indigo": "#4b0082", "ivory": "#fffff0", "khaki": "#f0e68c",
            "lavender": "#e6e6fa", "lavenderblush": "#fff0f5", "lawngreen": "#7cfc00", "lemonchiffon": "#fffacd", "lightblue": "#add8e6", "lightcoral": "#f08080", "lightcyan": "#e0ffff", "lightgoldenrodyellow": "#fafad2",
            "lightgrey": "#d3d3d3", "lightgreen": "#90ee90", "lightpink": "#ffb6c1", "lightsalmon": "#ffa07a", "lightseagreen": "#20b2aa", "lightskyblue": "#87cefa", "lightslategray": "#778899", "lightsteelblue": "#b0c4de",
            "lightyellow": "#ffffe0", "lime": "#00ff00", "limegreen": "#32cd32", "linen": "#faf0e6",
            "magenta": "#ff00ff", "maroon": "#800000", "mediumaquamarine": "#66cdaa", "mediumblue": "#0000cd", "mediumorchid": "#ba55d3", "mediumpurple": "#9370d8", "mediumseagreen": "#3cb371", "mediumslateblue": "#7b68ee",
            "mediumspringgreen": "#00fa9a", "mediumturquoise": "#48d1cc", "mediumvioletred": "#c71585", "midnightblue": "#191970", "mintcream": "#f5fffa", "mistyrose": "#ffe4e1", "moccasin": "#ffe4b5",
            "navajowhite": "#ffdead", "navy": "#000080",
            "oldlace": "#fdf5e6", "olive": "#808000", "olivedrab": "#6b8e23", "orange": "#ffa500", "orangered": "#ff4500", "orchid": "#da70d6",
            "palegoldenrod": "#eee8aa", "palegreen": "#98fb98", "paleturquoise": "#afeeee", "palevioletred": "#d87093", "papayawhip": "#ffefd5", "peachpuff": "#ffdab9", "peru": "#cd853f", "pink": "#ffc0cb", "plum": "#dda0dd", "powderblue": "#b0e0e6", "purple": "#800080",
            "rebeccapurple": "#663399", "red": "#ff0000", "rosybrown": "#bc8f8f", "royalblue": "#4169e1",
            "saddlebrown": "#8b4513", "salmon": "#fa8072", "sandybrown": "#f4a460", "seagreen": "#2e8b57", "seashell": "#fff5ee", "sienna": "#a0522d", "silver": "#c0c0c0", "skyblue": "#87ceeb", "slateblue": "#6a5acd", "slategray": "#708090", "snow": "#fffafa", "springgreen": "#00ff7f", "steelblue": "#4682b4",
            "tan": "#d2b48c", "teal": "#008080", "thistle": "#d8bfd8", "tomato": "#ff6347", "turquoise": "#40e0d0",
            "violet": "#ee82ee",
            "wheat": "#f5deb3", "white": "#ffffff", "whitesmoke": "#f5f5f5",
            "yellow": "#ffff00", "yellowgreen": "#9acd32"};

        if (typeof colors[color.toLowerCase()] !== 'undefined')
            return colors[color.toLowerCase()];

        return false;
    }

    /**
     * Calculates a colorcode (rgb) for a given value, like a hash
     * 
     * @param {String} value A value for that a color should be calculated
     * @returns {Colorcalculations.valueToColor.colorcode}
     */
    static valueToColor(value) {
        var colorcode = {
            r: (value.charCodeAt(0) % 11),
            g: (value.length % 123),
            b: (value.charCodeAt(value.length - 1) % 13)
        };
        for (var chr in value) {
            var chrcode = chr.charCodeAt(0);
            if (chrcode % 2 > 0) {
                colorcode.r = colorcode.r - (chrcode % 30);
            } else {
                colorcode.r = colorcode.r + (chrcode % 30);
            }
        }
        return colorcode;
    }

    /**
     * Detects different string color formats and returns the hex value
     * Detected String formats:
     * - hex: #ffffff
     * - rgb: 0x00ffff
     * - rbga: 0x00ffffff (ignores alpha channel)
     * - colorname: white
     * @param {string} color
     * @throws {Error} If the color can not be transformed into a hex value
     */
    static stringToHex(color) {
        if (color.startsWith('0x') && (color.length === 8 || color.length === 10)) {
            color = color.substring(4);
            let red = color.substring(4);
            let green = color.substring(2, 4);
            let blue = color.substring(0, 2);
            return '#' + red + green + blue;
        } 
        if (color.startsWith('#') && color.length === 7) {
            return color;
        }
        let tempcol;
        if (tempcol = Colorcalculations.colornameToHex(color)) {
            return tempcol;
        }
        throw new Error('Colorcalculation: The given color >' + color + '< string can not be transfored into hex value.');
    }
}


