"use strict";
(function () {
    var baseUrl = document.location.origin, component;
    chrome.storage.local.get(baseUrl, onStyleLoaded);
    document.body.addEventListener("click", onNewTarget);
    chrome.extension.onRequest.addListener(chromeListener);

    /**
     * On document click function
     * @param {MouseEvent} event 
     * @returns {void}
     */
    function onNewTarget(event) {
        component = event.target;
    }

    /**
     * On style loaded
     * @param {{baseUrl: string}} result
     * @returns {void} 
     */
    function onStyleLoaded(result) {
        var data = result[baseUrl];
        if (data) {
            document.head.appendChild(newStyle(data));
            document.addEventListener("DOMContentLoaded", function () {
                console.log(`CSS needed: ${data}`);
            });
        }
    }

    /**
     * On new event from app
     * @param {{action: string}} request 
     * @param {object} sender 
     * @param {function(any): any} sendResponse 
     * @returns {void}
     */
    function chromeListener(request, sender, sendResponse) {
        if (request.action === "getDOM") sendResponse({ dom: elemToStyle(component || document.activeElement) });
        else if (request.action === "select") { freeSelect(); select(request.selector); }
        else if (request.action === "freeSelect") freeSelect();
        else sendResponse({});
    }

    /**
     * Accepts an HTMLElement and returns a css selector for it
     * @param {HTMLElement} component - HTMLElement to determine its selector
     * @returns {string} - computed selector
     */
    function elemToStyle(component) {
        if (component instanceof HTMLElement) {
            var id = component.id || component.name;
            var tagName = component.tagName.toLowerCase();
            var classList = component.className.replace(/[ ]/g, '.');
            `${tagName}${(id ? `#${id}` : classList ? `.${classList}` : "")}`
            var selector = tagName + (id ? ("#" + id) : (classList ? ('.' + classList) : ''));
            return selector;
        } else { return "*"; }
    }

    /**
     * Inspects all elements that can be selected by text
     * @param {string} text - css selector
     * @returns {void}
     */
    function select(text) {
        if (typeof text !== "string") return;
        if (text.trim() === "*") return;
        var list = document.querySelectorAll(text);
        for (var index = 0; index < Math.min(list.length, 5); index++) {
            var item = list[index];
            var computedStyle = window.getComputedStyle(item);
            var clientRect = item.getBoundingClientRect();
            var newItem = document.createElement("div");
            var innerNewItem = document.createElement("div");
            newItem.className = "css-builder-selected-elements";
            innerNewItem.className = "css-builder-selected-elements-inner";
            newItem.style.padding = computedStyle.margin;
            innerNewItem.style.padding = computedStyle.padding;
            newItem.style.height = `${item.offsetHeight}px`;
            newItem.style.width = `${item.offsetWidth}px`;
            newItem.style.left = `${clientRect.left}px`;
            newItem.style.top = `${clientRect.top}px`;
            document.body.appendChild(newItem);
            newItem.appendChild(innerNewItem);
        }
    }

    /**
     * DeInspects all previously selected elements
     * @returns {void}
     */
    function freeSelect() {
        var list = document.querySelectorAll(".css-builder-selected-elements");
        for (var item of list) item.parentElement.removeChild(item);
    }

    /**
     * Creates a HTMLStyleElement
     * @param {string} data - CSS Text
     * @returns {HTMLStyleElement}
     */
    function newStyle(data) {
        var style = document.createElement("style");
        style.innerHTML = data;
        return style;
    }

})();