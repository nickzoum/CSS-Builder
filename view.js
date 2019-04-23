if (undefined) var { Functions, Http } = require("../ez");

(function (global, factory) {
    "use strict";
    if (typeof Functions === "undefined" && typeof require === "function") Functions = require("../Util/functions.js");
    if (typeof Http === "undefined" && typeof require === "function") Http = require("../Util/http.js");
    if (typeof exports !== "undefined" && typeof module !== "undefined") module.exports = factory(exports || {});
    else factory(global.View = {});
})(this, function (exports) {
    "use strict";

    /**
     * Object managing views
     * @typedef {Object} View
     * @property {(element: string, hasBeenSetUp?: boolean) => View} init constructor function that initializes the object
     * @property {(values: {}, actor: {}) => HTMLElement} getView creates an html copy of the view
     * @property {string} textForm text form of the html
     * @property {boolean} hasBeenSetUp whether the textform has been setup and it contains the respective attributes and comments
     */

    /**
     * Object containing useful objects regarding the view
     * @typedef {Object} ViewManager
     * @property {HTMLElement} container the html container of the view
     * @property {{}} actor map of functioncs
     * @property {{}} values map of proxies
     * @property {{}} original map of values
     * @property {{}} scope map of scoped variables
     */

    const attributes = {
        "ez-mouse-over": "mouseover",
        "ez-mouse-out": "mouseout",
        "ez-key-press": "keypress",
        "ez-key-down": "keydown",
        "ez-change": "change",
        "ez-submit": "submit",
        "ez-key-up": "keyup",
        "ez-input": "input",
        "ez-click": "click",
        "ez-focus": "focus",
        "ez-blur": "blur"
    };

    const ignoredAttributes = ["name", "ez-loop", "ez-if"];

    const variableTypes = ["var", "const", "let"];

    const valueTags = ["BUTTON", "INPUT", "PROGRESS"];

    const attributesTernary = {
        "ez-class": "class",
        "ez-src": "src"
    };

    const loopingTypes = {
        "in": function (list) { return Object.keys(list); },
        "of": function (list) { return list; }
    };

    const cleanParameterDefaults = {
        "undefined": undefined,
        "null": null
    };

    var registeredTags = {};
    var pages = {};

    /** @type {View} */
    var View = {
        init: function (element, hasBeenSetUp) {
            this.hasBeenSetUp = !!hasBeenSetUp;
            this.textForm = element;
            return this;
        },
        getView: function (values, actor) {
            if (!this.hasBeenSetUp) {
                var container = setUpText(this.textForm);
                this.textForm = container.innerHTML;
                this.hasBeenSetUp = true;
            } else {
                container = newDiv(this.textForm, "ez-view");
            }
            return initializeDom(validateView({ container: container, actor: actor, values: values, original: Functions.cloneObject(values), scope: {} }));
        }
    };

    loadCachedURLs();

    exports.registerCustomAttribute = registerCustomAttribute;
    exports.registerCustomEvent = registerCustomEvent;
    exports.registerTag = registerTag;
    exports.renderURL = renderURL;
    exports.renderDom = renderDom;
    exports.render = render;
    return exports;

    /**
     * Initializes the text of the view with attributes and comments
     * @param {string|HTMLElement} html text form of the view or existing html (or the container itself)
     * @returns {HTMLElement} the container of the view
     */
    function setUpText(html) {
        var container = html instanceof HTMLElement ? html : newDiv(html, "ez-view");
        // Add ez-has-text
        for (var dom of Functions.querySelectorAll(container, "*")) {
            var matches = [];
            for (var text of Functions.toList(dom.childNodes)) {
                if (text.nodeType === 3) {
                    var match = text.textContent.match(/\{.+\}/g);
                    if (match) {
                        dom.insertBefore(newComment(text), text);
                        matches = matches.concat(match.map(removeSurroundingBrackers).map(removePrefixes));
                    }
                }
            }
            if (matches.length) dom.setAttribute("ez-has-text", matches.join(" "));
        }
        // Sets up bindings in attributes
        for (dom of Functions.querySelectorAll(container, "*")) {
            matches = [];
            for (var attr of dom.attributes) {
                if (!attributes[attr.name] && !attributesTernary[attr.name] && !ignoredAttributes.includes(attr.name)) {
                    if (/\{.+\}/g.test(dom.getAttribute(attr.name))) {
                        matches.push(`${attr.name}=${dom.getAttribute(attr.name)}`);
                    }
                }
            }
            if (matches.length) dom.setAttribute("ez-has-binding", matches.join(";"));
        }
        // Set up loops
        for (dom of Functions.toList(container.querySelectorAll("[ez-loop]")).reverse()) {
            var { 0: itemType, 2: loopType, 3: listName } = dom.getAttribute("ez-loop").split(" ");
            if (!listName) throw Error(`Incorrect ez-loop format: '${dom.getAttribute("ez-loop")}', Proper format is: ${variableTypes.join("|")} [itemName] ${Object.keys(loopingTypes).join("|")} [listName]`);
            if (!variableTypes.includes(itemType)) throw Error(`Unrecognised variable declaration type: '${itemType}', valid types include: ${variableTypes.join(", ")}`);
            if (!loopingTypes[loopType]) throw Error(`Unrecognised looping type: '${loopType}', valid types include: ${Object.keys(loopingTypes).join(", ")}`);
            if (dom.childElementCount !== 1) wrapContent(dom);
            replaceContentWith(dom, newComment(dom));
        }
        return container;
    }

    /**
     * Checks the view for errors
     * @param {ViewManager} manager the view manager
     * @returns {ViewManager} the view manager
     */
    function validateView(manager) {
        // Loop check
        for (var dom of manager.container.querySelectorAll("[ez-loop]")) {
            var { 2: loopType, 3: listName } = dom.getAttribute("ez-loop").split(" ");
            var property = ((property = getPropertyValueContainer(listName, manager.values, manager.scope)).container || {})[property.index];
            if (property === undefined) throw Error(`Property '${listName}' is not defined`);
            if (property instanceof Object === false) throw Error(`Property '${listName}' is not an object`);
            if (loopType === "of" && typeof property[Symbol.iterator] !== "function") throw Error(`Property '${listName}' is not iteratable`);
        }
        return manager;
    }

    /**
     * Sets up the html element for the view or for a list item
     * @param {ViewManager} manager the view manager
     * @param {boolean} skipUpdates whether the item is a list item or not
     * @returns {HTMLElement} the container of the view
     */
    function initializeDom(manager, skipUpdates) {
        var container = manager.container;
        // Add event listeners
        for (var key in attributes) {
            for (var dom of Functions.querySelectorAll(container, `[${key}]`)) {
                var attribute = getAttribute(dom.getAttribute(key));
                var functionName = (dom.hasAttribute("ez-bubble") && dom.getAttribute("ez-bubble") !== "false") ? "createFunctionBubble" : "createFunction";
                dom.addEventListener(attributes[key], Functions[functionName](onEvent, manager.actor, attribute[0], manager, attribute.slice(1)));
            }
        }
        // Add property bindings
        if (!skipUpdates) {
            for (var property in manager.values) {
                Object.defineProperty(manager.values, property, {
                    set: Functions.createFunction(setProperty, property, manager),
                    get: Functions.createFunction(getProperty, property, manager)
                });
                updateProperties(manager.values, manager, "");
            }
        }
        for (dom of Functions.querySelectorAll(manager.container, "[ez-loop]")) {
            if (!isElementParented(dom, manager.container)) loopFor(dom, manager, "length");
        }
        updateDom(manager);
        var propertyListener = Functions.createFunction(htmlUpdateProperty, manager);
        for (dom of container.querySelectorAll("[name]")) {
            dom.addEventListener(dom.tagName === "INPUT" ? "input" : "change", propertyListener);
        }
        // Check if the container needs to be wrapped
        if (!container.classList.contains("ez-view") && !container.hasAttribute("ez-loop-index")) {
            container.classList.add("ez-view");
        } else if (container.childElementCount === 1) {
            manager.container = container.firstElementChild;
            for (var attr of container.attributes) manager.container.setAttribute(attr.name, attr.name === "class" ? `${manager.container.className} ez-view` : attr.value);
            container.removeChild(manager.container);
        }
        return manager.container;
    }

    /**
     * Add property bindings
     * @param {{}} values current values object (could be manager.values or a child object of it)
     * @param {ViewManager} manager the view manager
     * @param {string} propertyPath the path to get the current values from the manager values
     * @param {boolean} [forceUpdate] the path to get the current values from the manager values
     * @returns {void}
     */
    function updateProperties(values, manager, propertyPath, forceUpdate) {
        for (var property in values) {
            if (typeof values[property] === "object" && (!isProxy(values[property]) || forceUpdate)) {
                updateProperty(values, property, manager, propertyPath);
            }
        }
    }

    /**
     * Add property binding
     * @param {{}} values current values object (could be manager.values or a child object of it)
     * @param {string} property the name of the property to be changed to a proxy
     * @param {ViewManager} manager the view manager
     * @param {string} propertyPath the path to get the current values from the manager values
     * @returns {boolean} whether the property was added succesfully
     */
    function updateProperty(values, property, manager, propertyPath) {
        if (typeof values[property] !== "object") return false;
        var path = propertyPath ? `${propertyPath}${/^\d/.test(property) ? `[${property}]` : `.${property}`}` : property;
        values[property] = new Proxy(getTarget(values[property]), {
            set: Functions.createFunction(setProxy, manager, path),
            get: Functions.createFunction(getProxy, manager)
        });
        updateProperties(values[property], manager, path, true);
        return true;
    }

    /**
     * Updates all the bindings of the view
     * @param {ViewManager} manager the view manager
     * @param {string} [property] optional parameter, if not null only properties related to this parameter will be updated
     * @returns {void}
     */
    function updateDom(manager, property) {
        var container = manager.container, querySelectorAll = Functions.querySelectorAll, like = property ? `*="${property}"` : "";
        for (var key in attributesTernary) {
            for (var dom of querySelectorAll(container, `[${key}${like}]`)) {
                if (!isElementParented(dom, container)) {
                    dom.setAttribute(attributesTernary[key], resolveTernary(dom.getAttribute(key), manager));
                }
            }
        }
        for (dom of querySelectorAll(container, `[name${like}]`)) {
            if (!isElementParented(dom, container)) {
                setValue(dom, getPropertyValue(dom.getAttribute("name"), manager.values));
            }
        }
        for (dom of querySelectorAll(container, `[ez-has-binding${like}]`)) {
            if (!isElementParented(dom, container)) {
                for (var attribute of dom.getAttribute("ez-has-binding").split(";")) {
                    var { 0: attributeName, 1: attributeText } = attribute.split("=");
                    dom.setAttribute(attributeName, attributeText);
                    dom.setAttribute(attributeName, getAttributeValue(dom, attributeName, manager));
                }
            }
        }
        for (dom of querySelectorAll(container, `[ez-has-text${like}]`)) {
            if (!isElementParented(dom, container)) {
                for (var text of dom.childNodes) {
                    if (text.nodeType === 8 && !text.nextSibling) {
                        text.parentElement.appendChild(newText(getAttributeValue(text, ":text", manager)));
                    } else if (text.nodeType === 8 && text.nextSibling.nodeType !== 3) {
                        text.parentElement.insertBefore(newText(getAttributeValue(text, ":text", manager)), text.nextSibling);
                    } else if (text.nodeType === 3 && text.previousSibling && text.previousSibling.nodeType === 8 && text.previousSibling.textContent) {
                        text.textContent = getAttributeValue(text.previousSibling, ":text", manager);
                    }
                }
            }
        }
        for (dom of querySelectorAll(container, `[ez-if${like}]`)) {
            if (!isElementParented(dom, container)) {
                showDom(dom, checkBoolean(manager, dom));
            }
        }
        var mapProperty = Functions.createFunction(mapAttributeProperty, manager.values, manager.scope);
        for (key in registeredTags) {
            for (dom of querySelectorAll(container, key)) {
                registeredTags[key](dom, manager.actor, manager.values, ...(dom.getAttribute("ez-pass-properties") || "").split(",").map(mapProperty));
            }
        }
    }

    /**
     * Triggered when a value is changed by the user from an html element
     * @param {Event} event the change event of the element
     * @param {ViewManager} manager the view manager
     * @returns {void}
     */
    function htmlUpdateProperty(event, manager) {
        var propertyPath = event.target.getAttribute("name").trim();
        if (propertyPath.startsWith("!")) var negate = true;
        if (negate) propertyPath = propertyPath.substring(1).trim();
        var container = getPropertyValueContainer(propertyPath, manager.values, {});
        var result = getValue(event.target); result = negate ? !result : result;
        if (container.container[container.index] !== result) container.container[container.index] = result;
    }

    /**
     * Function used as a setter for the properties
     * @param {*} value new value
     * @param {string} property name of property
     * @param {ViewManager} manager the view manager
     * @returns {void}
     */
    function setProperty(value, property, manager) {
        manager.original[property] = value;
        setProxy(manager.original, property, value, manager.original, manager, property);
    }

    /**
     * Function used as a getter for the properties
     * @param {string} property name of property
     * @param {ViewManager} manager the view manager
     * @returns {*} the property of the values
     */
    function getProperty(property, manager) {
        return manager.original[property];
    }

    /**
     * Function used as a setter for the proxy
     * @param {{} | string} target target object
     * @param {string} property name of property
     * @param {string} value new value
     * @param {{}} receiver receiver object (proxy or target)
     * @param {ViewManager} manager the view manager
     * @param {string} propertyPath the absolute path of the property
     * @param {boolean} [skipUpdates] if true will skip the update property segment
     * @returns {boolean} whether the value was set properly
     */
    function setProxy(target, property, value, receiver, manager, propertyPath, skipUpdates) {
        if (property === "hint") return;
        if (!skipUpdates) {
            if (property === Symbol.for("__isProxy")) throw new Error("You cannot set the value of '__isProxy'");
            if (property === Symbol.for("__target")) throw new Error("You cannot set the value of '__target'");
            if (target[property] === value && typeof target[Symbol.iterator] !== "function" && isProxy(target)) {
                return true;
            }
            target[property] = value;
            var path = propertyPath.substring(0, (propertyPath.lastIndexOf(property) + 1 || propertyPath.length + 2) - 2);
            if (value != null && typeof target[Symbol.iterator] === "function") {
                if (updateProperty(target, property, manager, path)) return true;
            }
            if (value != null && !isProxy(getPropertyValue(`${path}${path && property ? "." : ""}${property}`, manager.values))) {
                if (path || typeof manager.values[property] === "object") {
                    if (updateProperty(getPropertyValue(path, manager.values), property, manager, path)) return true;
                }
            }
        }
        var container = manager.container, querySelectorAll = Functions.querySelectorAll;
        for (var dom of querySelectorAll(container, `[ez-loop*="${propertyPath}"]`)) {
            if (!isElementParented(dom, container)) loopFor(dom, manager, property);
        }
        updateDom(manager, property);
        for (dom of querySelectorAll(container, "[ez-loop]")) {
            if (!isElementParented(dom, container)) {
                checkOtherLoopVariables(dom, manager, property, propertyPath);
            }
        }
        return true;
    }

    /**
     * Checks if an element has a different parent element that should manage 
     * @param {HTMLElement} element element to check if it should be changed
     * @param {HTMLElement} container the current container of the view manager
     * @returns {boolean} whether the element is directly parented by the container
     */
    function isElementParented(element, container) {
        if (element === container) return false;
        do element = element.parentElement;
        while (element && element !== container && !element.hasAttribute("ez-loop") && !element.classList.contains("ez-view"));
        return element !== container;
    }

    /**
     * Checks the result a boolean expression in text form
     * @param {ViewManager} manager the view manager
     * @param {Array<string | Array<string>> | HTMLElement} equationList the expression split into smaller parts
     * @returns {boolean} the result of the boolean expression
     */
    function checkBoolean(manager, equationList) {
        if (equationList instanceof HTMLElement) return checkBoolean(manager, Functions.extractBooleanEquation(equationList.getAttribute("ez-if")));
        var equation = null;
        var result = false;
        var negate = false;
        var value = null;
        for (var item of equationList) {
            switch (item) {
                case "!":
                    negate = true;
                    break;
                case (/\|\||&&|!==|===|!=|==|>=|<=|>|</.test(item) ? item : null):
                    if (equation) throw SyntaxError(`Invalid boolean expression: '${equation}' was followed by '${item}'`);
                    if (negate) throw SyntaxError(`Invalid boolean expression: '!' was followed by '${item}'`);
                    equation = item;
                    break;
                default:
                    if (typeof item === "string") {
                        if (!isNaN(item - 0)) value = item - 0;
                        else if (/^("|').*("|')$/g.test(item)) value = item.substring(1, item.length - 1);
                        else value = getTextValue(manager, item);
                    } else {
                        value = checkBoolean(manager, item);
                    }
                    if (negate) value = !value;
                    if (result) {
                        if (!equation) throw SyntaxError(`Invalid boolean expression: expected equation but found '${item}'`);
                        result = Functions.checkBooleanOperation(result, value, equation);
                    } else {
                        if (equation) throw SyntaxError(`Invalid boolean expression: unexpected token '${equation}'`);
                        result = value;
                    }
                    equation = null;
                    negate = false;
                    value = null;
                    break;
            }
        }
        return result;
    }

    /**
     * Gets the troothy of a variable in text form
     * @param {ViewManager} manager the view manager
     * @param {string} text the variable in text form
     * @returns {boolean} the troothy of the value of a property
     */
    function getTextValue(manager, text) {
        text = text.trim();
        var negate = false;
        while (text.startsWith("!")) {
            text = text.substring(1).trim();
            negate = !negate;
        }
        var result = getPropertyValue(text, manager.values, manager.scope);
        return negate ? !result : !!result;
    }

    /**
     * Function used as a getter for the properties
     * @param {{}} target target object
     * @param {string} property name of property
     * @returns {string} returns the value of the property
     */
    function getProxy(target, property) {
        if (property === Symbol.for("__isProxy")) return true;
        if (property === Symbol.for("__target")) return target;
        return target[property];
    }

    /**
     * Updates the value of a property through its path
     * @param {string} value the new value to be replaced
     * @param {string} propertyPath the path of the property
     * @param {{}} values object containing values
     * @returns {void} 
     */
    function setPropertyValue(value, propertyPath, values) {
        var container = getPropertyValueContainer(propertyPath, values);
        container.container[container.index] = value;
    }

    /**
     * Searches for the value of a property through its path
     * @param {string} propertyPath the path of the property
     * @param {{}} values object containing values
     * @param {{}} [scope] object containing values
     * @returns {*} the value of the property 
     */
    function getPropertyValue(propertyPath, values, scope) {
        propertyPath = (propertyPath || "").trim();
        if (propertyPath.startsWith("!")) var negate = true;
        if (negate) propertyPath = propertyPath.substring(1).trim();
        if (propertyPath.startsWith("*")) propertyPath = propertyPath.substring((propertyPath.indexOf("*.") + 1 || 0) + 1).trim();
        if (!propertyPath) return values;
        var container = getPropertyValueContainer(propertyPath, values, scope || {});
        if (!container.container) throw Error(`Invalid property ${propertyPath}`);
        var result = container.container[container.index];
        return negate ? !result : result;
    }

    /**
     * Searches for a property through its path
     * @param {string} propertyPath the path of the property
     * @param {{}} values object containing values
     * @param {{}} scope object containing values
     * @returns {{container: {}, index: string | number}} direct parent of property and its index
     */
    function getPropertyValueContainer(propertyPath, values, scope) {
        var list = propertyPath.split(/\.|(\[\w+\])/).filter(troothy);
        var size = list.length;
        for (var item of list) {
            if (/^\[(\w+)\]$/.test(item)) item = item.replace(/\[|\]/g, "");
            values = typeof scope[item] !== "undefined" ? scope : values;
            if (!--size || typeof values === undefined) return { container: values, index: item };
            values = values[item];
        }
    }

    /**
     * Converts the bindings in the content of an attribute 
     * @param {HTMLElement} element html element containing the attribute
     * @param {string} name name of attribute
     * @param {ViewManager} manager the view manager
     * @returns {string} converted content
     */
    function getAttributeValue(element, name, manager) {
        return getElementAttribute(element, name).replace(/\{(.*)\}/g, Functions.createFunction(replaceAttributeValue, manager));
    }

    /**
     * Gets the value of an attribute (deprecates element.getAttribute)
     * @param {HTMLElement} element the html element
     * @param {string} name the name of the attribute
     * @returns {string} the value of the attribute
     */
    function getElementAttribute(element, name) {
        return name === ":text" ? element.textContent : element.getAttribute(name);
    }

    /**
     * Gets the value of an attribute (deprecates element.getAttribute)
     * @param {HTMLElement} element the html element
     * @param {string} name the name of the attribute
     * @param {value} the new value of the attribute
     * @returns {void}
     */
    function setElementAttribute(element, name, value) {
        if (name === ":text") element.textContent = value;
        else element.setAttribute(name, value);
    }

    /**
     * Extracts the function name and list of parameters from a value of an attribute
     * @param {string} attribute value of an attribute
     * @returns {Array<string>} list of function name and parameters
     */
    function getAttribute(attribute) {
        var result = /(\w+)\((.*)\)/g.exec(attribute);
        return result ? [result[1], ...(result[2].split(","))] : [attribute];
    }

    /**
     * Handles events
     * @param {Event} event event
     * @param {{}} actor map of callbacks
     * @param {string} callBack name of function
     * @param {ViewManager} manager the view manager
     * @param {Array<string>} params names of parameters
     * @returns {void} 
     */
    function onEvent(event, actor, callBack, manager, params) {
        if (event.target.hasAttribute("preventDefault")) event.preventDefault();
        var container = getPropertyValueContainer(callBack, actor, {}), callBack = container.container[container.index];
        callBack.apply(container.container, params.map(Functions.createFunction(getCleanParameter, event, manager)));
    }

    /**
     * Gets value of parameter 
     * @param {string} param name of parameter
     * @param {number} index ignored parameter
     * @param {Array<string>} array ignored parameter
     * @param {Event} event event thrown
     * @param {ViewManager} manager the view manager
     * @returns {string} value of parameter
     */
    function getCleanParameter(param, index, array, event, manager) {
        if (typeof param !== "string" || !(param = param.trim())) return null;
        if (!isNaN(param - 0)) return param - 0;
        var result = param.split(/\.|(\[\w+\])|(\[\{\w+\}\])/).filter(troothy);
        var dom = event.target; var firstItem = result[0];
        switch (firstItem) {
            case cleanParameterDefaults[firstItem] ? firstItem : null:
                return cleanParameterDefaults[firstItem];
            case "$":
                return result.length - 1 ? getPropertyValue(result.splice(1).join("."), event) : event;
            case "this":
                return result[1] ? dom.getAttribute(result[1]) : dom;
            default:
                return getPropertyValue(param, manager.values, manager.scope);
        }
    }

    /**
     * Manages the list item elements
     * @param {HTMLElement} container the parent loop element
     * @param {ViewManager} manager the view manager
     * @param {number | string} index the index of the changed element (if the index is equal to "length" or the name of the list, then a large part or all of the list has been altered)
     * @param {boolean} [forceReplace] if true will replace the current list item
     * @returns {void}
     */
    function loopFor(container, manager, index, retreivedList) {
        var { 1: itemName, 2: loopType, 3: listName } = container.getAttribute("ez-loop").split(" ");
        var list = retreivedList || loopingTypes[loopType](getPropertyValue(listName, manager.values, manager.scope));
        var content = container.firstChild;
        while (content && !content.textContent && content.nodeType === 8) content = content.nextSibling;
        if (!content || content.nodeType !== 8) throw Error("Unexpected Error at Loop For");
        if (!isNaN(index - 0)) {
            var textContent = loopType === "in" ? content.textContent.replace(new RegExp(`{${itemName}}`, "g"), index)
                : content.textContent.replace(new RegExp(`{${itemName}}`, "g"), `${listName}[${index}]`);
            var parentText = container.hasAttribute("ez-has-text") ? container.getAttribute("ez-has-text") : undefined;
            var itemValue = list[index];
            var indexAttribute = `${listName}[${index}]`;
            var childrenFound = container.querySelectorAll(`[ez-loop-index="${indexAttribute}"]`);
            if (childrenFound.length && !retreivedList) return;
            var newScope = getItemManager(manager, itemValue, itemName);
            for (var oldChild of childrenFound.length ? childrenFound : [0]) {
                var newChild = createListItem(textContent, newScope, indexAttribute, parentText);
                if (oldChild) container.replaceChild(newChild, oldChild);
                else container.appendChild(newChild);
                if (newChild.hasAttribute("ez-if") && !checkBoolean(newScope, newChild)) {
                    hideDom(newChild);
                }
                for (var dom of Functions.querySelectorAll(newChild, "[ez-loop]")) {
                    if (!isElementParented(dom, newChild)) {
                        loopFor(dom, newScope, "length");
                    }
                }
            }
        } else { // enters when the whole list is changed
            replaceContentWith(container, content);
            for (index = 0; index < list.length; index++) {
                loopFor(container, manager, index, list);
            }
        }
    }

    /**
     * Checks if an item of an ez-loop needs changing
     * @param {HTMLElement} container the container of the loop
     * @param {ViewManager} manager the view manager
     * @param {string} property the name of the property
     * @param {string} path the full property path
     * @returns {void}
     */
    function checkOtherLoopVariables(container, manager, property, path) {
        var { 1: itemName, 2: loopType, 3: listName } = container.getAttribute("ez-loop").split(" ");
        var list = loopingTypes[loopType](getPropertyValue(listName, manager.values, manager.scope));
        if (path === listName) var propertyFound = property;
        if (typeof propertyFound !== "undefined" && isNaN(propertyFound - 0)) return;
        for (var child of container.children) {
            var index = child.getAttribute("ez-loop-index");
            if (propertyFound && index !== `${listName}[${propertyFound}]`) continue;
            var newScope = getItemManager(manager, list[index], itemName);
            newScope.container = child;
            setProxy(manager.original, property, null, manager.original, newScope, path, true);
            if (propertyFound) return;
        }
    }

    /**
     * Creates a new View Manager for each list item
     * @param {ViewManager} manager the parent view manager
     * @param {*} item the item of the listitem
     * @param {string} name the name of the item of the listitem
     * @returns {ViewManager} the new View Manager
     */
    function getItemManager(manager, item, name) {
        var newScope = Functions.cloneObject(manager.scope);
        newScope[name] = item;
        return { actor: manager.actor, values: manager.values, original: manager.original, scope: newScope };
    }

    /**
     * Creates the respective html element for an item of an ez-loop
     * @param {string} content html form of element
     * @param {ViewManager} manager view manager
     * @param {string} index index of item in ez-loop list
     * @param {boolean} parentText the value of the ez-has-text attribute of the container, assuming it has text
     * @returns {HTMLElement} the container of the list item
     */
    function createListItem(content, manager, index, parentText) {
        var container = newDiv(content);
        container.setAttribute("ez-loop-index", index);
        if (parentText !== undefined) container.setAttribute("ez-has-text", parentText);
        manager.container = container;
        return initializeDom(manager, true);
    }

    /**
     * Sets the text of a dom
     * @param {HTMLElement} dom html element
     * @param {string} value the new text/value of the element
     * @returns {void} 
     */
    function setValue(dom, value) {
        if (typeof value === "undefined") value = null;
        if (!valueTags.includes(dom.tagName)) dom.textContent = value;
        else if (dom.type === "checkbox") dom.checked = !!value;
        else dom.value = value;
    }

    /**
     * Gets the text of a dom
     * @param {HTMLElement} dom html element
     * @returns {string} the text/value of the element
     */
    function getValue(dom) {
        if (!valueTags.includes(dom.tagName)) return dom.textContent;
        else if (dom.type === "checkbox") return dom.checked;
        else return dom.value;
    }

    /**
     * Resolves the result a simple ternary in text form
     * @param {string} expression the ternary expression
     * @param {ViewManager} manager manager object
     * @returns {string} the result of the ternary
     */
    function resolveTernary(expression, manager) {
        var expressions = expression.split(",");
        var mapTernary = Functions.createFunction(resolveTernary, manager);
        if (expressions.length > 1) return expressions.map(mapTernary).join(" ");
        var index = expression.indexOf("?");
        if (index === -1) throw Error(`'?' not found in expression: '${expression}'`);
        var result = checkBoolean(manager, Functions.extractBooleanEquation(expression.substring(0, index)));
        return (expression.substring(index + 1).split(":")[result ? 0 : 1] || "").trim();
    }

    /**
     * Renders an existing html element
     * @param {HTMLElement} dom the dom to be managed
     * @param {{}} actor object to be called on actions
     * @param {{}} values values to be replaced on render
     * @returns {HTMLElement} the container element of the view
     */
    function renderDom(dom, actor, values) {
        return initializeDom(validateView({ container: setUpText(dom), actor: actor, values: values, original: Functions.cloneObject(values), scope: {} }));
    }

    /**
     * Renders an html string
     * @param {string} element text of html 
     * @param {{}} actor object to be called on actions
     * @param {{}} values values to be replaced on render
     * @param {string} saveAs name to store html as
     * @param {boolean} cachePage if true the html will be stored in cache (needs @saveAs)
     * @returns {HTMLElement} view managing html
     */
    function render(element, actor, values, saveAs, cachePage) {
        var newView = Functions.initObject(View, element, false).getView(values, actor);
        if (saveAs && typeof saveAs === "string") {
            if (cachePage) cacheURL(saveAs, newView.innerHTML);
            pages[saveAs] = element;
        }
        return newView;
    }

    /**
     * Renders an html by url
     * @param {string} url url of html
     * @param {{}} actor object to be called on actions
     * @param {{}} values values to be replaced on render
     * @param {boolean} cachePage if true the html will be stored in cache
     * @returns {Promise<HTMLElement>} Promise with view managing html
     */
    function renderURL(url, actor, values, cachePage) {
        return new Promise(function (resolve, reject) {
            try {
                if (pages[url]) resolve(pages[url].getView(values, actor));
                else Http.get(url).then(function (result) {
                    resolve(render(result, actor, values, url, cachePage));
                }).catch(reject);
            } catch (err) { reject(err); }
        });
    }

    /**
     * Registers a new tag used by a plugin
     * @param {string} name name of new attribute used by plugin 
     * @param {function} callBack function that handles that attribute
     * @returns {void}
     */
    function registerTag(name, callBack) {
        if (registeredTags[name]) throw Error(`The tag "${name}" has already been registered`);
        else if (document.createElement(name) instanceof HTMLUnknownElement) registeredTags[name] = callBack;
        else throw Error(`The tag "${name}" cannot be an existing html tag`);
    }

    /**
     * Registers a new attribute that can contain a ternary
     * @param {string} name attribute used by view
     * @param {string} attributeName attribute used by html
     * @returns {void}
     */
    function registerCustomAttribute(name, attributeName) {
        if (attributesTernary[name]) throw Error(`The attribute "${name}" has already been registered`);
        attributesTernary[name] = attributeName;
    }

    /**
     * Registers a custom event
     * @param {string} name attribute used by view
     * @param {string} eventName name of javascript event
     * @returns {void}
     */
    function registerCustomEvent(name, eventName) {
        if (attributes[name]) throw Error(`The event "${name}" has already been registered`);
        attributes[name] = eventName;
    }

    /**
     * Retreives the cached urls from local storage
     * @returns {void}
     */
    function loadCachedURLs() {
        var cachedURLs = JSON.parse(localStorage["ez-view"] || "{}").cachedURLs || {};
        for (var key in cachedURLs) if (!pages[key]) pages[key] = Functions.initObject(View, cachedURLs[key], true);
    }

    /**
     * Stores the content of a url in local storage
     * @param {string} fileName the name of the file or the url
     * @param {string} content the content of the file
     * @returns {void}
     */
    function cacheURL(fileName, content) {
        var ezView = JSON.parse(localStorage["ez-view"] || "{}");
        ezView.cachedURLs = ezView.cachedURLs || {};
        ezView.cachedURLs[fileName] = content;
        localStorage["ez-view"] = JSON.stringify(ezView);
    }

    // DELEGATES

    /**
     * Removes any exlamation marks or other characters that could be infront of a variable
     * @param {string} text unclean variable
     * @returns {string} cleaned variable
     */
    function removePrefixes(text) {
        return text.replace(/^(!\()*/, "");
    }

    /**
     * Removes the any squiggly brackets that exist at the start or end of a string
     * @param {string} text uncleaned text
     * @returns {string} cleaned text 
     */
    function removeSurroundingBrackers(text) {
        return text.replace(/^{|}$/g, "");
    }

    /**
     * Checks if an item is a troothy
     * @param {*} item the item to be checked for troothy
     * @returns {boolean} troothy of parameter
     */
    function troothy(item) {
        return !!item;
    }

    /**
     * Replaces the value of an attribute
     * @param {string} fullMatch unused parameter from regex result
     * @param {string} match matched parameter of regex
     * @param {number} index unused parameter from regex result
     * @param {string} attr unused parameter from regex result
     * @param {ViewManager} manager the view manager
     * @returns {string} the value of the attribute in string form
     */
    function replaceAttributeValue(fullMatch, match, index, attr, manager) {
        var result = /\?/.test(match) ? resolveTernary(match, manager) : getPropertyValue(match, manager.values, manager.scope);
        return typeof result === "object" ? JSON.stringify(result) : result;
    }

    /**
     * Gets the property value from a text found in an attribute
     * @param {string} property name of property
     * @param {number} index unused parameter from regex result
     * @param {Array<string>} list unused parameter from regex result
     * @param {{}} values object containing values 
     * @param {{}} scope object with temporary variables 
     * @returns {*} the value of the property
     */
    function mapAttributeProperty(property, index, list, values, scope) {
        return getPropertyValue(property, values, scope);
    }

    /**
     * Check if a variable is a proxy
     * @param {Proxy} item item to be checked
     * @returns {boolean} whether the variable is a proxy
     */
    function isProxy(proxy) {
        return proxy == null ? false : proxy[Symbol.for("__isProxy")];
    }

    /**
     * Gets the target of a proxy
     * @param {Proxy} proxy the proxy parent of the target
     * @returns {*} the target of the or the variable if not a proxy
     */
    function getTarget(proxy) {
        return isProxy(proxy) ? proxy[Symbol.for("__target")] : proxy;
    }

    // HTML

    /**
     * Creates a new div html element
     * @param {string} [html] inner html of the new element
     * @param {string} [className] class of the new element
     * @returns {HTMLDivElement} the new div element
     */
    function newDiv(html, className) {
        var div = document.createElement("div");
        if (arguments.length > 0) div.innerHTML = html;
        if (arguments.length === 2) div.className = className;
        return div;
    }

    /**
     * Creates a new comment element
     * @param {Node | string} content content of the comment
     * @returns {Comment} the new comment element
     */
    function newComment(content) {
        return document.createComment(content instanceof Node ? content instanceof HTMLElement ? content.innerHTML : content.textContent : content);
    }

    /**
     * Creates a new text node
     * @param {Node | string} content text of element
     * @returns {Text} the new text element
     */
    function newText(content) {
        return document.createTextNode(content instanceof Node ? content instanceof HTMLElement ? content.innerHTML : content.textContent : content);
    }

    /**
     * Renders an element visible
     * @param {HTMLElement} dom Element to be made visible
     * @param {boolean} [flag] whether hideDom should be called instead
     * @returns {void}
     */
    function showDom(dom, flag) {
        if (arguments.length === 2 && !flag) hideDom(dom);
        else if (dom.style.display === "none") dom.style.display = null;
    }

    /**
     * Renders an element invisible
     * @param {HTMLElement} dom Element to be made invisible
     * @returns {void} 
     */
    function hideDom(dom) {
        dom.style.display = "none";
    }

    /**
     * Wraps the content of an Element
     * @param {HTMLElement} dom the element to have its content wrapped
     * @returns {void} 
     */
    function wrapContent(dom) {
        replaceContentWith(dom, extractChildren(dom));
    }

    /**
     * Clears a dom and inserts a new child
     * @param {HTMLElement} dom element to be cleared
     * @param {HTMLElement} newChild element to be added
     * @returns {void}
     */
    function replaceContentWith(dom, newChild) {
        dom.innerHTML = "";
        dom.appendChild(newChild);
    }

    /**
     * Moves all the children from the original dom to a new dom
     * @param {HTMLElement} dom dom element to be cleared
     * @returns {HTMLElement} the new wrapper element
     */
    function extractChildren(dom) {
        var div = newDiv();
        for (var item of dom.childNodes) {
            dom.removeChild(item);
            div.appendChild(item);
        }
        return div;
    }
});