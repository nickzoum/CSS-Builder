(function (global, factory) {
    "use strict";
    if (typeof exports !== "undefined" && typeof module !== "undefined") module.exports = factory(exports || {});
    else factory(global.Functions = {});
})(this, function (exports) {
    "use strict";
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const weekDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const operations = {
        "!==": function (a, b) { return a !== b; },
        "===": function (a, b) { return a === b; },
        "!=": function (a, b) { return a != b; },
        "==": function (a, b) { return a == b; },
        ">=": function (a, b) { return a >= b; },
        "<=": function (a, b) { return a <= b; },
        "&&": function (a, b) { return a && b; },
        "||": function (a, b) { return a || b; },
        ">": function (a, b) { return a > b; },
        "<": function (a, b) { return a < b; }
    };
    var utilityContainer = document.createElement("div");

    exports.extractBooleanEquation = extractBooleanEquation;
    exports.checkBooleanOperation = checkBooleanOperation;
    exports.createFunctionBubble = createFunctionBubble;
    exports.getFirstProperty = getFirstProperty;
    exports.getLargestNumber = getLargestNumber;
    exports.querySelectorAll = querySelectorAll;
    exports.addEscapeToText = addEscapeToText;
    exports.functionWrapper = functionWrapper;
    exports.numberOrDefault = numberOrDefault;
    exports.functionOrEmpty = functionOrEmpty;
    exports.createFunction = createFunction;
    exports.binaryToArray = binaryToArray;
    exports.arrayToBinary = arrayToBinary;
    exports.containsValue = containsValue;
    exports.listContains = listContains;
    exports.createObject = createObject;
    exports.dateToString = dateToString;
    exports.autoPromise = autoPromise;
    exports.massReplace = massReplace;
    exports.cloneObject = cloneObject;
    exports.initObject = initObject;
    exports.setLinks = setLinks;
    exports.fromJson = fromJson;
    exports.getModel = getModel;
    exports.isValid = isValid;
    exports.toList = toList;
    exports.delay = delay;
    exports.cast = cast;
    return exports;

    /**
     * Creates a new instance of a function or prototype object
     * @param {T} prototype prototype object or function
     * @template T prototype object or function
     * @returns {T} an instance of the requested prototype
     */
    function createObject(prototype) {
        if (typeof prototype === "function") return Object.create(new prototype());
        else if (typeof prototype === "object") {
            var result = Object.create(prototype);
            result.prototype = prototype;
            return result;
        }
        else return null;
    }

    /**
     * Creates a new instance of a function or prototype object and initiates it
     * @param {T} prototype prototype object or function
     * @param {Array} params array of arguments
     * @template T prototype object or function
     * @returns {T} an instance of the requested prototype
     */
    function initObject(prototype, ...params) {
        if (typeof prototype === "function") return Object.create(new prototype(...params));
        else if (typeof prototype === "object") {
            var result = Object.create(prototype);
            result.prototype = prototype;
            result.init(...params);
            return result;
        }
        else return null;
    }

    /**
     * Safely deepclones an object
     * @param {{}} object object to be cloned
     * @returns {{} | Array<{}>} cloned object
     */
    function cloneObject(object, amount) {
        var json = JSON.stringify(object);
        amount = Math.floor(numberOrDefault(amount, 1));
        return amount > 1 ? new Array(amount).forEach(() => JSON.parse(json)) : JSON.parse(json);
    }

    /**
     * Casts a value as a prototype object
     * @param {T} prototype prototype object
     * @param {*} value random value to be casted
     * @template T prototype object or function
     * @returns {T} original value casted as prototype
     */
    function cast(prototype, value) {
        return value;
    }

    /**
     * Returns a promise than will be executed a certain period of time
     * @param {number} ms period of time
     * @returns {Promise<void>} Promise that is called after the period passes
     */
    function delay(ms) {
        /** @param {function(): void} resolve
         *  @returns {number} */
        function sleep(resolve) { return setTimeout(resolve, ms); }
        return new Promise(sleep);
    }

    /**
     * Parses a JSON string into an Object
     * @param {string} json JSON string
     * @returns {Object} Parsed JSON
     */
    function fromJson(json) {
        if (typeof json !== "string") return null;
        try { return JSON.parse(json); }
        catch (err) { return /^\[*\]$/.test(json) || /^{*}$/.test(json) || /^"*"$/.test(json) || /^'*'$/.test(json) ? json : null; }
    }


    /**
     * Gets a specified object from a json
     * @param {T} prototype specified object prototype
     * @param {string | T} json json string
     * @template T prototype object or function
     * @returns {T} parsed json as prototype object
     */
    function getModel(prototype, json) {
        var object = typeof json === "string" ? fromJson(json) : json;
        switch (typeof prototype) {
            case "function":
                return prototype;
            case "symbol":
                return prototype;
            case "string":
                return typeof object === "string" ? object : json;
            case "boolean":
                return !!object;
            case "number":
                return numberOrDefault(object, 0);
            case "undefined":
                return undefined;
            case "object":
                switch (prototype ? prototype.constructor : undefined) {
                    case undefined:
                        return undefined;
                    case Array:
                        if (!object || object.constructor !== Array) return []; var list = [];
                        for (var item of object) list.push(getModel(prototype[0], item));
                        return list;
                    case Date:
                        var date = new Date(object);
                        return isNaN(date.valueOf()) ? new Date() : date;
                    case Object:
                        if (!object) return null;
                        for (var key in prototype) {
                            var objectKey = object[key];
                            var prototypeKey = prototype[key];
                            object[key] = getModel(prototypeKey, objectKey);
                        }
                        return object;
                }
                break;
        }
        return undefined;
    }


    /**
     * Checks if text contains an invalid value
     * @param {string} json json as string
     * @returns {boolean} true if json is deemed valid
     */
    function isValid(json) {
        if (typeof json !== "string") return false;
        json = json.toLowerCase().trim();
        return json == "undefined" || json == "null" || json == "";
    }

    /**
     * Accepts a number, converts it to binary and returns a grid of booleans
     * @param {number} input Inserted number to be converted 
     * @param {number} [width=1] Width of grid
     * @param {number} [height=1] Height of grid
     * @returns {Array<Array<boolean>>} Grid of booleans
     */
    function binaryToArray(input, width, height) {
        var list = cast([[true]], []);
        var text = (input || 0).toString(2);
        var totalSize = (width || 1) * (height || 1);
        if (text.length <= totalSize) text = "0".repeat(totalSize - text.length) + text;
        else text = text.substring(text.length - totalSize);
        for (var x = 0; x < width; x++) {
            var reverseX = width - x - 1;
            list[reverseX] = [];
            for (var y = 0; y < height; y++) {
                var reverseY = height - y - 1;
                list[reverseX][reverseY] = text[totalSize - (y * width + x) - 1] == 1;
            }
        }
        return list;
    }

    /**
     * Accepts a list, converts it to a number
     * @param {Array<Array<boolean>>} input Grid of booleans
     * @returns {number} number converted from booleans
     */
    function arrayToBinary(input) {
        var result = 0;
        for (var list of input) {
            for (var bit of list) {
                result = (result << 1) + bit;
            }
        }
        return result;
    }

    /**
     * Custom toString method for dates
     * @param {Date} date date object
     * @param {string} format string format
     * @returns {string} string form of requested date
     */
    function dateToString(date, format) {
        date = isNullDate(date);
        format = format && (typeof format == "string") ? format : "HH:mm dd/MM/yy";
        var year = String(date.getFullYear());
        var month = String(date.getMonth() + 1);
        var monthDate = String(date.getDate());
        var day = String(date.getDay());
        var weekDay = weekDays[day];
        var fullMonth = months[month - 1];
        var hour = date.getHours();
        var hour12 = String(hour % 12);
        var hour24 = String(hour);
        var min = String(date.getMinutes());
        var sec = String(date.getSeconds());
        var fs = (sec - 0) + min * 60;
        return massReplace(format,
            [
                { regex: /EEEE/g, text: weekDay },
                { regex: /FME/g, text: fullMonth },
                { regex: /EEE/g, text: weekDay.substring(0, 3) },
                { regex: /FMS/g, text: fullMonth.substring(0, 3) },
                { regex: /yy/g, text: shortenText(year, 2, 2) },
                { regex: /MM/g, text: shortenText(month, 2, 2) },
                { regex: /dd/g, text: shortenText(monthDate, 2, 2) },
                { regex: /hh/g, text: shortenText(hour12, 2) },
                { regex: /HH/g, text: shortenText(hour24, 2) },
                { regex: /mm/g, text: shortenText(min, 2, 2) },
                { regex: /ss/g, text: shortenText(sec, 2) },
                { regex: /M/g, text: month },
                { regex: /d/g, text: monthDate },
                { regex: /E/g, text: shortenText(day, -1, 1) },
                { regex: /y/g, text: year },
                { regex: /h/g, text: hour12 },
                { regex: /H/g, text: hour24 },
                { regex: /fs/g, text: fs },
                { regex: /m/g, text: min },
                { regex: /s/g, text: sec }
            ]
        );
    }

    /**
     * Does complex regex replacements
     * @param {string} text original text
     * @param {Array<{regex: RegExp, text: string}>} regexList list of expressions and replacements
     * @returns {string} replaced string
     */
    function massReplace(text, regexList) {
        for (var index = 0; index < regexList.length; index++) {
            text = text.replace(regexList[index].regex, `{${index}}`);
        }
        for (index = 0; index < regexList.length; index++) {
            text = text.replace(new RegExp(`\\{${index}\\}`, "g"), regexList[index].text);
        }
        return text;
    }


    /**
     * Controls the size of a text
     * @param {string} text - text
     * @param {number} [min=-1] - min size
     * @param {number} [max=-1] - max size
     * @returns {string}
     */
    function shortenText(text, min, max) {
        min = numberOrDefault(min, -1);
        max = numberOrDefault(max, -1);
        if (min != -1) {
            var diff = min - text.length;
            if (diff > 0) {
                var extra = "0".repeat(diff);
                text = extra + text;
            }
        }
        if (max != -1) {
            if (max > text.length) {
                text = text.substring(0, max - 1);
            }
        }
        return text;
    }

    /**
     * Accepts a date parameter, if its valid it returns it, otherwise the current date is returned
     * @param {Date} date - Input date
     * @returns {Date} - Valid date
     */
    function isNullDate(date) {
        if (date instanceof Date && date.valueOf() >= 0) return date;
        else return new Date();
    }

    /**
     * Returns a promise to be executed in 50 ms
     * @param {(resolve: (result: T) => void) => void} callBack function to be executed in 50 ms
     * @template T prototype object or function
     * @returns {Promise<T>} promise that will activate in 50ms
     */
    function autoPromise(callBack) {
        return new Promise(function (resolve) {
            setTimeout(function () { callBack(resolve); }, 50);
        });
    }

    /**
     * Checks if a list contains an element
     * @param {Array<T>} list list to be searched
     * @param {(listItem: T) => boolean)} callBack function that checks each element
     * @template T generic of list and fucntion
     * @returns {boolean} true if item was found
     */
    function listContains(list, callBack) {
        return list.findIndex(callBack) !== -1;
    }

    /**
     * Adds anchor elements to all the links inside a string
     * @param {string} text text to be converted
     * @returns {string} converted text 
     */
    function setLinks(text) {
        var regex = /(https?:[/]{0,2}|[w]{3}[.])[^ "'>]{1,}/g;
        text = text.replace(/</g, "&lt;");
        text = text.replace(/>/g, "&gt;");
        return text.replace(regex, addLink);
    }

    /**
     * Surrounds string in an anchor tag
     * @param {string} link - link url
     * @returns {string} 
     */
    function addLink(link) {
        var descr = String(link).replace(/^(https?:[/]{0,2}|[w]{3}[.])/, "www.");
        if (!/^https?:[/]{2}/.test(link)) link = `http://${link}`;
        return `<a href=${link} target="_blank">${descr}</a>`;
    }

    /**
     * Returns the value of the first property that exists in both the object and the list
     * @param {Object} json object to be searched
     * @param {Array<string>} properties list of possible property keys
     * @returns {string | number} first property key found
     */
    function getFirstProperty(json, ...properties) {
        for (var property of properties) {
            if (json.hasOwnProperty(property)) {
                var value = json[property];
                if (typeof value === "string" || typeof value === "number") {
                    return value;
                }
            }
        }
        return undefined;
    }

    /**
     * Converts number? to number
     * @param {number} [number] Nullable number
     * @param {number} [defaultValue=0] DefaultValue to repalce number
     * @returns {number} value of number or value of defaultValue or 0
     */
    function numberOrDefault(number, defaultValue) {
        return typeof number === "number" ? number : numberOrDefault(defaultValue, 0);
    }

    /**
     * Converts function? to function
     * @param {Function} [callBack] Nullable function
     * @returns {Function} value of function or empty function
     */
    function functionOrEmpty(callBack) {
        return typeof callBack === "function" ? callBack : function () { };
    }

    /**
     * Creates a wrapper for a function that manages its arguments
     * @param {() => T} callBack function to be wrapped
     * @template T return type of function
     * @param {Function} [argumentDealer] argument manager, if undefined no arguments will be passed
     * @returns {() => T} wrapper function created
     */
    function functionWrapper(callBack, argumentDealer) {
        callBack = functionOrEmpty(callBack);
        return typeof argumentDealer !== "function" ?
            function () { return callBack(); } :
            function () { return callBack(...argumentDealer(...arguments)); };
    }

    /**
     * Checks if a map containts a value
     * @param {Object} map map in object form
     * @param {string} value value searched for
     * @returns {boolean} if value exists
     */
    function containsValue(map, value) {
        return Object.values(map).findIndex(val => val === value) !== -1;
    }

    /**
     * Creates functions that can be safely called from loops
     * @param {() => void)} callBack callback function
     * @param {Array<*>} params list of parameters
     * @returns {Function} created function
     */
    function createFunction(callBack, ...params) {
        return function () {
            return callBack(...arguments, ...params);
        };
    }

    /**
     * Creates functions, that will run on a different thread, that can be safely called from loops
     * @param {() => void)} callBack callback function
     * @param {Array<*>} params list of parameters
     * @returns {Function} created function
     */
    function createFunctionBubble(callBack, ...params) {
        return function () {
            var list = arguments;
            setTimeout(function () {
                return callBack(...list, ...params);
            }, 0);
        };
    }

    /**
     * Gets the largest number from a list of object
     * @param {Array<T>} list list of objects
     * @template T type of object
     * @param {(item: T) => number} callback function that gets the number from the object
     * @returns {number} largest number found
     */
    function getLargestNumber(list, callback) {
        return Math.max(...list.map(callback));
    }

    /**
     * Escapes every special character
     * @param {string} text text to be escaped
     * @returns {string} escaped text
     */
    function addEscapeToText(text) {
        return text.replace(/\\|\.|\[|\]/g, function (res) { return `\\${res[0]}`; });
    }

    /**
     * Maps an iteratable to an array
     * @param {{forEach: (item: T) => void}} iteratable any object that can be iterated using the foreach function
     * @template T prototype object or function
     * @returns {Array<T>} created array
     */
    function toList(iteratable) {
        var list = [];
        for (var item of iteratable) list.push(item);
        return list;
    }

    /**
     * Extracts a boolean equation from text
     * @param {string} text text containing equation
     * @returns {Array<Array<string>>} extracted equation
     */
    function extractBooleanEquation(text) {
        if (/^\(.{0,}\)$/.test(text)) text.replace(/^\(|\)$/g, "").trim();
        var booleanList = text.trim().split(/(\|\||&&)/);
        if (booleanList.length !== 1) {
            var object = [];
            var temp = null;
            var negate = false;
            for (var item of booleanList) {
                if (!item) continue;
                item = item.trim();
                negate = false;
                while (item.startsWith("!")) {
                    negate = !negate;
                    item = item.substring(1).trim();
                }
                if (temp) object.push("!");
                if (/^\(.{0,}\)$/.test(item)) {
                    if (negate) object.push("!");
                    negate = false;
                    while (/^\(.{0,}\)$/.test(item)) {
                        item = item.replace(/^\(|\)$/g, "").trim();
                    }
                    while (item.startsWith("!")) {
                        negate = !negate;
                        item = item.substring(1).trim();
                    }
                    if (item.startsWith("(")) {
                        temp = object;
                        object = [];
                        object.parent = temp;
                        if (negate) object.push("!");
                        object.push(extractBooleanEquation(item.substr(1)));
                        temp.push(object);
                        temp = null;
                    } else if (item.endsWith(")")) {
                        object.push(extractBooleanEquation((negate ? "!" : "") + item.substr(0, item.length - 1)));
                        temp = object;
                        object = temp.parent;
                        delete temp.parent;
                        temp = null;
                    } else {
                        object.push(extractBooleanEquation((negate ? "!" : "") + item));
                    }
                } else if (item.startsWith("(")) {
                    if (negate) object.push("!");
                    temp = object;
                    object = [];
                    object.parent = temp;
                    object.push(extractBooleanEquation(item.substr(1)));
                    temp.push(object);
                    temp = null;
                } else if (item.endsWith(")")) {
                    object.push(extractBooleanEquation((negate ? "!" : "") + item.substr(0, item.length - 1)));
                    temp = object;
                    object = temp.parent;
                    delete temp.parent;
                    temp = null;
                } else if (/(\|\||&&)/.test(item)) {
                    object.push(item);
                } else {
                    object.push(extractBooleanEquation((negate ? "!" : "") + item));
                }
            }
            if (object.parent) throw new SyntaxError("Boolean expression incorrect format");
            return object;
        } else {
            return text.split(/(!==|===|!=|==|>=|<=|>|<)/).map(textItem => textItem.trim());
        }
    }

    /**
     * Checks a simple boolean operation
     * @param {*} a a variable
     * @param {*} b a variable
     * @param {string} operation operation in text form
     * @returns {boolean} result as a boolean
     */
    function checkBooleanOperation(a, b, operation) {
        return operations[operation](a, b);
    }

    /**
     * An upgrade on the normal querySelectorAll command with the addition that it can also include the parent element
     * @param {HTMLElement} dom parent element
     * @param {string} query query to search for
     * @returns {Array<HTMLElement>} list of found elements
     */
    function querySelectorAll(dom, query) {
        var needToRemoveParent = !dom.parentElement;
        if (needToRemoveParent) utilityContainer.appendChild(dom);
        var passedQuery = toList(dom.parentElement.querySelectorAll(query)).find(found => found === dom);
        if (needToRemoveParent) utilityContainer.removeChild(dom);
        return toList(dom.querySelectorAll(query)).concat(passedQuery ? [dom] : []);
    }
});