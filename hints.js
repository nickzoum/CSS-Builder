var hints = (function () {
    var colors = [
        "rgba(0, 0, 0, 0)", "rgb(0, 0, 0)",
        "LightGoldenRodYellow",
        "MediumSpringGreen",
        "MediumAquaMarine",
        "MediumSlateBlue",
        "MediumTurquoise",
        "MediumVioletRed",
        "CornflowerBlue",
        "BlanchedAlmond",
        "DarkOliveGreen",
        "LightSlateGray",
        "LightSlateGrey",
        "LightSteelBlue",
        "MediumSeaGreen",
        "DarkGoldenRod",
        "DarkSlateBlue",
        "DarkSlateGray",
        "DarkSlateGrey",
        "DarkTurquoise",
        "LavenderBlush",
        "LightSeaGreen",
        "PaleGoldenRod",
        "PaleTurquoise",
        "PaleVioletRed",
        "RebeccaPurple",
        "AntiqueWhite",
        "DarkSeaGreen",
        "LemonChiffon",
        "LightSkyBlue",
        "MediumOrchid",
        "MediumPurple",
        "MidnightBlue",
        "DarkMagenta",
        "DeepSkyBlue",
        "FloralWhite",
        "ForestGreen",
        "GreenYellow",
        "LightSalmon",
        "LightYellow",
        "NavajoWhite",
        "SaddleBrown",
        "SpringGreen",
        "YellowGreen",
        "Aquamarine",
        "BlueViolet",
        "Chartreuse",
        "DarkOrange",
        "DarkOrchid",
        "DarkSalmon",
        "DarkViolet",
        "DodgerBlue",
        "GhostWhite",
        "LightCoral",
        "LightGreen",
        "MediumBlue",
        "PapayaWhip",
        "PowderBlue",
        "SandyBrown",
        "WhiteSmoke",
        "BurlyWood",
        "AliceBlue",
        "CadetBlue",
        "Chocolate",
        "DarkGreen",
        "DarkKhaki",
        "FireBrick",
        "Gainsboro",
        "GoldenRod",
        "IndianRed",
        "LawnGreen",
        "LightBlue",
        "LightCyan",
        "LightGray",
        "LightGrey",
        "LightPink",
        "LimeGreen",
        "MintCream",
        "MistyRose",
        "OliveDrab",
        "OrangeRed",
        "PaleGreen",
        "PeachPuff",
        "RosyBrown",
        "RoyalBlue",
        "SlateBlue",
        "SlateGray",
        "SlateGrey",
        "SteelBlue",
        "Turquoise",
        "Cornsilk",
        "DarkBlue",
        "DarkCyan",
        "DarkGray",
        "DarkGrey",
        "DeepPink",
        "HoneyDew",
        "Lavender",
        "Moccasin",
        "SeaGreen",
        "SeaShell",
        "Crimson",
        "DarkRed",
        "DimGray",
        "DimGrey",
        "Fuchsia",
        "HotPink",
        "Magenta",
        "OldLace",
        "SkyBlue",
        "Thistle",
        "Bisque",
        "Indigo",
        "Maroon",
        "Orange",
        "Orchid",
        "Purple",
        "Salmon",
        "Sienna",
        "Silver",
        "Tomato",
        "Yellow",
        "Violet",
        "Coral",
        "Brown",
        "Black",
        "Beige",
        "Azure",
        "Green",
        "Ivory",
        "Khaki",
        "Linen",
        "Olive",
        "Wheat",
        "White",
        "Aqua",
        "Blue",
        "Cyan",
        "Gold",
        "Gray",
        "Grey",
        "Lime",
        "Navy",
        "Peru",
        "Pink",
        "Plum",
        "Snow",
        "Teal",
        "Red",
        "Tan"
    ];

    var multiNumber = [
        "0px",
        "0%",
        "0",
        "0px 0px",
        "0% 0%",
        "0 0",
        "0px 0px 0px",
        "0% 0% 0%",
        "0 0 0",
        "0px 0px 0px 0px",
        "0% 0% 0% 0%",
        "0 0 0 0"
    ];

    var defaultList = [
        "inherit",
        "initial",
        "unset"
    ];

    var display = [
        "table-column-group",
        "table-footer-group",
        "table-header-group",
        "table-row-group",
        "table-caption",
        "inline-block",
        "inline-table",
        "table-column",
        "inline-flex",
        "table-cell",
        "list-item",
        "table-row",
        "inherit",
        "initial",
        "inline",
        "run-in",
        "block",
        "table",
        "flex",
        "none"
    ];

    var position = [
        "absolute",
        "relative",
        "static",
        "sticky",
        "fixed"
    ];

    var borderWidth = [
        "medium",
        "thick",
        "thin"
    ];

    var auto = [
        "auto"
    ];

    var size = [
        "-webkit-fill-available",
        "fit-content",
        "max-content",
        "min-content"
    ];

    var combinations = {
        colorBorderWidth: [...colors, ...borderWidth]
    };

    var template = {
        "background": colors,
        "background-color": colors,
        "border": combinations.colorBorderWidth,
        "border-radius": multiNumber,
        "border-top-radius": multiNumber,
        "border-bottom-radius": multiNumber,
        "border-left-radius": multiNumber,
        "border-right-radius": multiNumber,
        "border-bottom": combinations.colorBorderWidth,
        "border-color": colors,
        "border-left": combinations.colorBorderWidth,
        "border-right": combinations.colorBorderWidth,
        "border-top": combinations.colorBorderWidth,
        "border-width": borderWidth,
        "bottom": auto,
        "color": colors,
        "display": display,
        "height": size,
        "left": auto,
        "margin": auto,
        "margin-bottom": auto,
        "margin-left": auto,
        "margin-right": auto,
        "margin-top": auto,
        "opacity": undefined,
        "outline": colors,
        "padding": undefined,
        "padding-bottom": undefined,
        "padding-left": undefined,
        "padding-right": undefined,
        "padding-top": undefined,
        "position": position,
        "right": auto,
        "top": auto,
        "width": size
    };


    Object.keys(template).forEach(property => template[property] = [...(template[property] || []), ...defaultList]);

    return template;
})();