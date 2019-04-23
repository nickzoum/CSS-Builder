if (undefined) var { View } = require("../ez");

(function (global, factory) {
    "use strict";
    if (typeof View === "undefined" && typeof require === "function") View = require("./view.js");
    if (typeof exports !== "undefined" && typeof module !== "undefined") module.exports = factory(exports || {});
    else factory(global.ViewDebug = {});
})(this, function (exports) {
    "use strict";
    View.registerTag("debug", onChange);
    var utlityDebug = document.createElement("debug");
    return exports;

    /**
     * Function triggered when the view is changed
     * @param {HTMLElement} dom the debug html element
     * @param {{}} actor unused object
     * @param {{}} values unused object
     * @param  {...*} params list of parameters passed from ez-pass-properties
     * @returns {void}
     */
    function onChange(dom, actor, values, ...params) {
        utlityDebug.innerHTML = "";
        for (let param of params) {
            let ul = utlityDebug.appendChild(document.createElement("ul"));
            if (typeof param !== "object") ul.appendChild(document.createElement("li")).textContent = param;
            else for (let key in param) ul.appendChild(document.createElement("li")).textContent = `${key}: ${JSON.stringify(param[key])}`;
        }
        checkDifferences(dom, utlityDebug);
        dom.innerHTML = utlityDebug.innerHTML;
    }

    /**
     * Checks for differences between two html elements
     * @param {HTMLElement} oldDom old element
     * @param {HTMLElement} newDom new element
     * @returns {void}
     */
    function checkDifferences(oldDom, newDom) {
        for (let index in newDom.childNodes) {
            if (isNaN(index - 0)) continue;
            let newChild = newDom.childNodes[index];
            let oldChild = oldDom.childNodes[index];
            if (newChild.nodeType === 3) { if (newChild.textContent !== oldChild.textContent) newChild.parentElement.style = "color: red"; }
            else if (oldChild && newChild) { checkDifferences(oldChild, newChild); }
        }
    }

});