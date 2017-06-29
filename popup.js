"use strict";

(function () {
    const line = "\n"; const tab = "\t";
    var tempUrl = ""; var url = "";

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("DOMContentLoaded", onDomLoaded);
    document.getElementById("save").addEventListener("click", onSaveClicked);
    document.getElementById("plus-style").addEventListener("click", onNewStyleClicked);
    document.getElementById("export").addEventListener("click", onExportClicked);
    document.getElementById("import").addEventListener("click", onImportClicked);
    loop(5000).then(tempSave);

    /**
     * @typedef {Object} Tab
     * @prop {{muted: boolean}} mutedInfo
     * @prop {boolean} autoDiscardable
     * @prop {boolean} highlighted
     * @prop {boolean} discarded
     * @prop {boolean} incognito
     * @prop {boolean} selected
     * @prop {number} windowId
     * @prop {boolean} audible
     * @prop {boolean} pinned
     * @prop {boolean} active
     * @prop {string} status
     * @prop {number} height
     * @prop {number} index
     * @prop {string} title
     * @prop {number} width
     * @prop {string} url
     * @prop {number} id
     */

    /**
     * Sets a timeout that calls a function
     * @param {number} ms 
     * @returns {Promise<number>}
     */
    function delay(ms) {
        return new Promise(function (resolve) {
            return setTimeout(resolve, ms);
        });
    }

    /**
     * Sets a timeout loop that calls a function
     * @param {number} ms 
     * @returns {Promise<number>}
     */
    function loop(ms) {
        return new Promise(function (resolve) {
            return setInterval(resolve, ms);
        });
    }

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
        return new Promise(function (resolve, reject) {
            chrome.tabs.getSelected(null, resolve);
        });
    }

    /**
     * Reads saved data
     * @param {string} name
     * @returns {Promise<string>}
     */
    function getLocal(name) {
        return new Promise(function (resolve, reject) {
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
        return new Promise(function (resolve, reject) {
            getSelectedTab().then(function (tab) {
                chrome.tabs.sendRequest(tab.id, data, resolve);
            });
        });
    }

    /** 
     * Selects all the elemented that can be selected with the input
     * @param {MouseEvent} event
     * @returns {void}
     */
    function select(event) {
        var text = event.srcElement.textContent;
        sendRequest({ action: "select", selector: text });
    }

    /** 
     * Deselects all the elements previously selected
     * @param {MouseEvent} event
     * @returns {void}
     */
    function freeSelect(event) {
        sendRequest({ action: "freeSelect" });
    }

    /**
     * On content fully loaded
     * @param {Event} event 
     * @returns {void}
     */
    function onDomLoaded(event) {
        getSelectedTab().then(function (tab) {
            var pathArray = tab.url.split("/");
            url = `${pathArray[0]}//${pathArray[2]}`;
            tempUrl = `CSS_TEMP${url}`;
            getLocal(tempUrl).then(function (result) {
                var data = result;
                getLocal(url).then(function (result) {
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
        if (event.ctrlKey) {
            var keyCode = event.keyCode || event.which;
            if (keyCode === 83) updateStyle();
        }
    }

    /**
     * On save clicked
     * @param {MouseEvent} event
     * @returns {void} 
     */
    function onSaveClicked(event) {
        updateStyle();
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.tabs.update(tabs[0].id, { url: tabs[0].url });
        });
        tempSave(); window.close();
    }

    /**
     * On new style clicked
     * @param {MouseEvent} event
     * @returns {void} 
     */
    function onNewStyleClicked(event) {
        addStyle();
    }

    /**
     * On export clicked
     * @param {MouseEvent} event
     * @returns {void} 
     */
    function onExportClicked(event) {
        var selector = document.querySelector("#selector");
        var list = document.querySelectorAll(".style");
        selector.style.display = "initial"; var data = "";
        for (var item of list) data += getBlockText(item);
        selector.setAttribute("value", data);
        selector.focus(); selector.select();
        try {
            document.execCommand("copy");
        } catch (err) {
            console.warn("Unable to copy to clipboard");
        } finally {
            selector.style.display = "none";
            selector.value = "";
        }
    }

    /**
     * On Import clicked
     * @param {MouseEvent} event 
     * @returns {void}
     */
    function onImportClicked(event) {
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
                console.warn("Unable to read from clipboard");
            }
        } catch (err) {
            console.warn("Unable to read from clipboard");
        } finally {
            selector.style.display = "none";
        }
    }

    /**
     * On Heading keyboard event
     * @param {KeyboardEvent} event
     * @returns {void} 
     */
    function onHeadingPressed(event) {
        if (event.keyCode === 13) event.preventDefault();
    }

    /**
     * On heading focus out event
     * @param {FocusEvent} event 
     * @returns {void}
     */
    function onHeadingBlur(event) {
        var target = event.target;
        var text = target.innerText;
        target.innerText = text.trim();
    }

    /**
     * On close (x) clicked
     * @param {MouseEvent} event 
     * @returns {void}
     */
    function onCloseClicked(event) {
        var parent = event.srcElement.parentElement; freeSelect();
        if (parent.nextElementSibling || parent.previousElementSibling) {
            if (parent.parentElement) parent.parentElement.removeChild(parent);
        }
    }

    /**
     * On line input blur
     * @param {FocusEvent} event
     * @returns {void} 
     */
    function onInputReleased(event) {
        var hints = document.querySelectorAll(".line .hint");
        for (var hint of hints) hint.remove();
    }

    /**
     * Adds a new style element
     * @param {string} selector 
     * @param {Array<string>} properties 
     * @return {void}
     */
    function addStyle(selector, properties) {
        properties = properties || [""]; selector = selector || "*";
        sendRequest({ action: "getDOM" }).then(function (response) {
            var list = document.querySelectorAll("#container>.title.panel-heading");
            if (response instanceof Object) {
                if (selector == "*" && response.dom) {
                    selector = response.dom;
                }
            }
            for (var item of list) {
                if (item.textContent === selector) {
                    var container = item.parentElement;
                    break;
                }
            }
            if (container === undefined) {
                container = createStyleBlock(selector);
                document.querySelector("#container").appendChild(container);
            }
            var body = container.getElementsByTagName("ol")[0];
            for (var line of properties) {
                body.appendChild(createLine(line));
            }
        });
    }

    /**
     * Creates a new style block element
     * @param {string} selector 
     * @returns {HTMLDivElement}
     */
    function createStyleBlock(selector) {
        var heading = document.createElement("span");
        var close = document.createElement("button");
        var style = document.createElement("div");
        var body = document.createElement("ol");
        var end = document.createElement("span");

        style.className = "style panel panel-default";
        heading.className = "title panel-heading";
        close.className = "close top-right";
        body.className = "panel-body";
        end.className = "end";

        heading.contentEditable = "true";
        heading.textContent = selector;

        style.appendChild(heading);
        style.appendChild(close);
        style.appendChild(body);

        heading.addEventListener("keydown", onHeadingPressed);
        heading.addEventListener("focusout", onHeadingBlur);
        heading.addEventListener("mouseout", freeSelect);
        close.addEventListener("click", onCloseClicked);
        heading.addEventListener("mouseover", select);

        return style;
    }

    /**
     * 
     * @param {string} text 
     */
    function createLine(text) {
        var close = document.createElement("button");
        var input = document.createElement("input");
        var line = document.createElement("li");

        close.className = "close visible-on-hover";
        line.className = "line";

        input.value = text.trim();
        input.spellcheck = false;
        input.type = "text";

        line.appendChild(close);
        line.appendChild(input);

        input.addEventListener("focus", onInputReleased);
        close.addEventListener("click", onCloseClicked);
        input.addEventListener("keydown", onKeyPressed);
        input.addEventListener("keyup", onKeyUp);

        return line;
    }

    /**
     * On key pressed on 
     * @param {KeyboardEvent} event
     * @returns {void} 
     */
    function onKeyPressed(event) {
        var target = event.srcElement;
        var previous = target.parentElement.previousElementSibling;
        var next = target.parentElement.nextElementSibling;
        var parent = target.parentElement.parentElement;
        var selectStart = target.selectionStart;
        var selectEnd = target.selectionEnd;
        var keyCode = event.keyCode;
        var text = target.value;
        var size = text.length;
        ({
            8: function () { // BackSpace
                var other = previous || next;
                if (selectEnd === 0 && other) {
                    var otherInput = other.getElementsByTagName("input")[0];
                    target.parentElement.remove();
                    otherInput.value += text;
                    event.preventDefault();
                    otherInput.focus();
                } else { onInputReleased(event); }
            },
            9: function () { // Tab
                if (selectStart !== selectEnd) {
                    var selected = `${tab}${text.substring(selectStart, selectEnd)}`.replace(line, `${line}${tab}`);
                    target.value = text.substring(0, selectStart) + selected + text.substring(selectEnd);
                    target.selectionEnd = selectStart + selected.length;
                    target.selectionStart = selectStart + 1;
                    event.preventDefault();
                } else {
                    var hint = parent.getElementsByClassName("hint")[0];
                    target.value = hint ? hint.textContent : text;
                    event.preventDefault();
                }
            },
            13: function () { // Enter
                var newLine = createLine(text.substring(selectStart));
                target.value = text.substring(0, selectStart);
                var newInput = newLine.lastElementChild;
                if (next) parent.insertBefore(newLine, next);
                else parent.appendChild(newLine);
                event.preventDefault();
                newInput.focus();
                newInput.selectionEnd = 0;
            },
            37: function () { // Left
                if (selectStart == 0 && previous) {
                    selectEnd = previous.lastElementChild.value.length;
                    previous.lastElementChild.selectionStart = selectEnd;
                    previous.lastElementChild.selectionEnd = selectEnd;
                    previous.lastElementChild.focus();
                    event.preventDefault();
                }
            },
            38: function () { // Up
                if (previous) {
                    previous.lastElementChild.selectionStart = selectEnd;
                    previous.lastElementChild.selectionEnd = selectEnd;
                    previous.lastElementChild.focus();
                    event.preventDefault();
                }
            },
            39: function () { // Right
                if (selectEnd === size && next) {
                    next.lastElementChild.selectionStart = 0;
                    next.lastElementChild.selectionEnd = 0;
                    next.lastElementChild.focus();
                    event.preventDefault();
                }
            },
            40: function () { // Down
                if (next) {
                    next.lastElementChild.selectionStart = selectEnd;
                    next.lastElementChild.selectionEnd = selectEnd;
                    next.lastElementChild.focus();
                    event.preventDefault();
                }
            },
            46: function () { // Delete
                if (selectEnd === size && next) {
                    target.value += next.getElementsByTagName("input")[0].value;
                    target.selectionStart = selectStart;
                    target.selectionEnd = selectEnd;
                    event.preventDefault();
                    next.remove();
                }
            }
        }[keyCode] || (() => { }))();
    }

    /**
     * On key released
     * @param {KeyboardEvent} event
     * @returns {void} 
     */
    function onKeyUp(event) {
        var target = event.srcElement, text = target.value, parent = target.parentElement;
        var hint = parent.getElementsByClassName("hint")[0], original = text;
        if (!hint) {
            hint = document.createElement("span");
            parent.appendChild(hint);
            hint.className = "hint";
        }
        hint.textContent = ""; text = text.trim();
        if (text.length > 0) {
            if (text.includes(":")) {
                var match = text.split(":")[1].trim();
                var before = text.split(":")[0].trim();
                var regex = new RegExp(`^${match}`, "ig");
                var keys = hints[before] || [];
                for (var index = keys.length - 1; index > 0; index--) {
                    var key = keys[index];
                    if (regex.test(key) && match !== key) {
                        var temp = `${before}: ${key}`;
                        hint.textContent = `${original}${temp.substring(text.length)}`;
                        index = 0;
                    }
                }
            } else {
                var match = text.split(":")[0].trim();
                var regex = new RegExp(`^${match}`, "ig");
                var keys = Object.keys(hints);
                for (var index = keys.length - 1; index > 0; index--) {
                    var key = keys[index];
                    if (regex.test(key) && match !== key) {
                        var temp = `${key}`;
                        hint.textContent = `${original}${temp.substring(text.length)}`;
                        index = 0;
                    }
                }
            }
        }
    }

})();