if (undefined) var { chrome } = require("./css-builder");

(function (global, factory) {
    "use strict";
    if (typeof hints === "undefined" && typeof require === "function") hints = require("../hints.js");
    if (typeof exports !== "undefined" && typeof module !== "undefined") module.exports = factory(exports || {});
    else factory(global.Debug = {});
})(this, function (exports) {
    var tempUrl = "", url = "";

    if (!chrome || !chrome.tabs) {
        var chrome = {
            storage: {
                local: {
                    set: function () { },
                    get: function () {
                        arguments[1]("");
                    }
                }
            },
            tabs: {
                getSelected: function () {
                    arguments[1]({ id: 1, url: "" });
                },
                sendRequest: function () {
                    return new Promise(function (res) {
                        res({ dom: "*" });
                    });
                },
                query: function () { }
            }
        };
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("DOMContentLoaded", onDomLoaded);
    document.getElementById("save").addEventListener("click", onSaveClicked);
    document.getElementById("plus-style").addEventListener("click", addStyle);
    document.getElementById("export").addEventListener("click", onExportClicked);
    document.getElementById("import").addEventListener("click", onImportClicked);
    window.addEventListener("blur", tempSave);

    var actions = {
        "backspace": function (style, index, start, end, text) {
            if (start === end && !end && index) {
                dto.styles[style].lines[index - 1] += dto.styles[style].lines.splice(index, 1);
                focus(style, index1 - 1, Infinity, Infinity);
                return true;
            }
        },
        "tab": function (style, index, start, end, text) {
            dto.styles[style].lines[index] = dto.hint ? dto.hint : `${text.substring(0, start)}\t${text.substring(start)}`;
            focus(style, index, start + 1, end + 1);
            return true;
        },
        "enter": function (style, index, start, end, text) {
            dto.styles[style].lines.splice(index, 0, text.substring(start));
            dto.styles[style].lines[index] = dto.styles[style].lines[index].substring(0, start);
            focus(style, index1 + 1, 0, 0);
            return true;
        },
        "left": function (style, index, start, end, text) {
            if (!start && index) {
                focus(style, index - 1, Infinity, Infinity);
                return true;
            }
        },
        "up": function (style, index, start, end, text) {
            if (index) {
                focus(style, index - 1, start, end);
                return true;
            }
        },
        "right": function (style, index, start, end, text) {
            if (end === text.length && dto.styles[style].lines.length > index + 1) {
                focus(style, index + 1, 0, 0);
                return true;
            }
        },
        "down": function (style, index, start, end, text) {
            if (dto.styles[style].lines.length > index + 1) {
                focus(style, index + 1, start, end);
                return true;
            }
        },
        "delete": function (style, index, start, end, text) {
            if (start === end && end === text.length && dto.styles[style].lines.length > index + 1) {
                dto.styles[style].lines[index] += dto.styles[style].lines.splice(index + 1, 1);
                return true;
            }
        },
        "empty": function () { return false; }
    };

    /**
     * 
     * @param {HTMLInputElement} dom 
     * @param {number} styleIndex
     * @param {number} lineIndex
     * @param {number} [start=0]
     * @param {number} [end=0] 
     */
    function focus(styleIndex, lineIndex, start, end) {
        var dom = document.querySelector(`[ez-loop-index="styles[${styleIndex}].lines[${lineIndex}]"]`), size = dom.value.length;
        dom.focus();
        dom.selectionStart = start === Infinity ? size : start || 0;
        dom.selectionEnd = end === Infinity ? size : end || 0;
    }

    var keys = {
        8: "backspace",
        9: "tab",
        13: "enter",
        37: "left",
        38: "up",
        39: "right",
        40: "down",
        46: "delete"
    };

    var dto = {
        styles: [{ query: "*", lines: [""] }],
        hint: ""
    };

    var actor = {
        addStyle: function () {
            sendRequest({ action: "getDOM" }).then(function (response) {
                addStyle(response.dom);
            });
        },
        addLine: function (style, index) {
            style.splice(index, 0, "");
        },
        cancelEnter: function (event) {
            if (event.keyCode === 13) event.preventDefault();
        },
        trimText: function (index) {
            var newText = dto.styles[index].query.trim();
            if (newText === dto.styles[index].query) return;
            dto.styles[index].query = newText;
        },
        freeSelect: function () {
            sendRequest({ action: "freeSelect" });
        },
        select: function (query) {
            sendRequest({ action: "select", selector: query });
        },
        clearHint: function () {
            dto.hint = null;
        },
        showHint: function (style, line) {
            var text = style.lines[line], original = text;
            this.clearHint();
            text = text.trim();
            if (text.length > 0) {
                if (text.includes(":")) {
                    var match = text.split(":")[1].trim();
                    var before = text.split(":")[0].trim();
                    var regex = new RegExp(`^${match}`, "ig");
                    var keys = hints[before] || [];
                    for (var index = keys.length - 1; index > 0; index--) {
                        var key = keys[index];
                        if (regex.test(key) && match !== key) {
                            return dto.hint = `${original}${`${before}: ${key}`.substring(text.length)}`;
                        }
                    }
                } else {
                    match = text.split(":")[0].trim();
                    regex = new RegExp(`^${match}`, "ig");
                    keys = Object.keys(hints);
                    for (index = keys.length - 1; index > 0; index--) {
                        key = keys[index];
                        if (regex.test(key) && match !== key) {
                            return dto.hint = `${original}${`${key}`.substring(text.length)}`;
                        }
                    }
                }
            }
        },
        onKeyDown: function (style, index, event) {
            if (actions[keys[event.keyCode] || "empty"](style, index, event.target.selectionStart, event.target.selectionEnd, event.target.value)) {
                event.preventDefault();
            }
        },
        closeStyle: function (index) {
            dto.styles.splice(index, 1);
        },
        closeLine: function (style, index) {
            if (dto.styles[style].lines.length - 1) dto.styles[style].lines.splice(index, 1);
            else dto.styles[style].lines[0] = "";
        }
    };
    exports.saveLocal = saveLocal;
    exports.getLocal = getLocal;
    exports.dto = dto;
    return exports;

    /**
     * @param {string} name
     * @param {any} data
     * @returns {void}
     */
    function saveLocal(name, data) {
        var result = {}; result[name] = data;
        chrome.storage.local.set(result);
    }

    /**
     * Creates a style text and saves it
     * @returns {void}
     */
    function updateStyle() {
        var list = document.querySelectorAll(".style"), data = "";
        for (var item of list) data += getBlockText(item);
        saveLocal(url, data); tempSave();
    }

    function tempSave() {
        var list = document.querySelectorAll(".style"), data = "";
        for (var item of list) data += getBlockText(item);
        saveLocal(tempUrl, data);
    }

    /**
     * Returns the current tab object
     * @returns {Promise<Tab>}
     */
    function getSelectedTab() {
        return new Promise(function (resolve) {
            chrome.tabs.getSelected(null, resolve);
        });
    }

    /**
     * Reads saved data
     * @param {string} name
     * @returns {Promise<string>}
     */
    function getLocal(name) {
        return new Promise(function (resolve) {
            chrome.storage.local.get(name, function (result) {
                resolve(result[name] || "");
            });
        });
    }

    /**
     * Gets the style block of an element
     * @param {HTMLElement} style 
     * @returns {string}
     */
    function getBlockText(style) {
        var next = style.getElementsByClassName("panel-body")[0].firstElementChild;
        var text = `${style.firstElementChild.innerText}{`;
        while (next) {
            var temp = next.getElementsByTagName("input")[0].value;
            text = `${text}${temp ? `${temp.trim()};` : ""}`;
            text = text.replace(";;", ";");
            next = next.nextElementSibling;
        }
        return text + "}";
    }

    /**
     * Send a request to the content.js
     * @param {object} data 
     * @returns {Promise<any>}
     */
    function sendRequest(data) {
        data = data || { action: undefined };
        return new Promise(function (resolve) {
            getSelectedTab().then(function (tab) {
                chrome.tabs.sendRequest(tab.id, data, resolve);
            });
        });
    }

    /**
     * On content fully loaded
     * @returns {void}
     */
    function onDomLoaded() {
        getSelectedTab().then(function (tab) {
            var pathArray = tab.url.split("/");
            url = `${pathArray[0]}//${pathArray[2]}`;
            tempUrl = `CSS_TEMP${url}`;
            getLocal(tempUrl).then(function (result) {
                var data = result;
                getLocal(url).then(function (result) {
                    View.renderDom(document.body, actor, dto);
                    data = data || result;
                    var list = data.split("}"); list.pop();
                    for (var item of list) {
                        var subList = item.split("{");
                        var properties = subList[1] ? subList[1].split(";") : ["", ""];
                        properties.pop(); addStyle(subList[0], properties);
                    }
                    if (!subList) addStyle();
                });
            });
        });
    }

    /**
     * Save with CTRL + S
     * @param {KeyboardEvent} event 
     * @returns {void}
     */
    function onKeyDown(event) {
        if (event.ctrlKey && event.keyCode === 83) updateStyle();
    }

    /**
     * On save clicked
     * @param {MouseEvent} event
     * @returns {void} 
     */
    function onSaveClicked() {
        updateStyle();
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.tabs.update(tabs[0].id, { url: tabs[0].url });
        });
        tempSave(); window.close();
    }

    /**
     * On export clicked
     * @returns {void} 
     */
    function onExportClicked() {
        var selector = document.querySelector("#selector");
        var list = document.querySelectorAll(".style");
        selector.style.display = "initial"; var data = "";
        for (var item of list) data += getBlockText(item);
        selector.setAttribute("value", data);
        selector.focus(); selector.select();
        try {
            document.execCommand("copy");
        } catch (err) {
            alert("Unable to copy to clipboard");
        } finally {
            selector.style.display = "none";
            selector.value = "";
        }
    }

    /**
     * On Import clicked
     * @returns {void}
     */
    function onImportClicked() {
        var selector = document.querySelector("#selector");
        selector.focus();
        try {
            if (document.execCommand("paste")) {
                var data = selector.value; selector.value = "";
                var list = data.split("}"); list.pop();
                for (var item of list) {
                    var subList = item.split("{");
                    var properties = subList[1] ? subList[1].split(";") : ["", ""];
                    properties.pop(); addStyle(subList[0], properties);
                }
            } else {
                alert("Unable to read from clipboard");
            }
        } catch (err) {
            alert("Unable to read from clipboard");
        } finally {
            selector.style.display = "none";
        }
    }

    /**
     * Adds a new style element
     * @param {string} selector 
     * @param {Array<string>} properties 
     * @return {void}
     */
    function addStyle(selector, properties) {
        dto.styles.push({
            lines: properties || [""],
            query: typeof selector === "string" ? selector : "*"
        });
    }
});