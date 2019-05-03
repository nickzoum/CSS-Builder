
/**
 * A Promise-like class that can be resolved and rejected multiple times
 * @template T type result of resolve
 */
export class Observable<T> {
    /**
     * Constructor of the Observable Class
     * @param {(resolve: (result: T) => void, reject: (error: string) => void) => void} callBack
     * @param {boolean} [async=false]
     */
    constructor(callBack: (resolve: (result: T) => void, reject: (error: string) => void) => void, async?: boolean);

    /**
     * Adds a function to the resolve queue
     * @param {(result: T) => void} callBack function to be called whenever resolve is called
     * @returns {Observable<T>} returns the observable to chain calls
     */
    yield(callBack: (result: T) => void): Observable<T>;

    /**
     * Adds a function to the reject queue
     * @param {(error: Error | string) => void} callBack function to be called whenever reject is called
     * @returns {Observable<T>} returns the observable to chain calls
     */
    catch(callBack: (error: Error | string) => void): Observable<T>;

    /**
     * Adds a function to both queues
     * @param {() => void} callBack function to be called whenever reject is called
     * @returns {Observable<T>} returns the observable to chain calls
     */
    finally(callBack: () => void): Observable<T>;
}

export namespace MutationListener {
    /**
 * @param {{}} values
 * @returns {Observable<{isGet: boolean, isSet: boolean, path: string, value: *}>}
 */
    export function manageObject(values: object): Observable<{ isGet: boolean, isSet: boolean, path: string, value: * }>;
}

export namespace View {
    /**
     * Renders an html string
     * @param {string} element text of html 
     * @param {{}} actor object to be called on actions
     * @param {{}} values values to be replaced on render
     * @param {string} saveAs name to store html as
     * @param {boolean} cachePage if true the html will be stored in cache (needs @saveAs)
     * @returns {View} view managing html
     */
    export function render(element: string, actor: Object, values: Object, saveAs, cachePage): HTMLElement;
    /**
     * Renders an html by url
     * @param {string} url url of html     
     * @param {{}} actor object to be called on actions
     * @param {{}} values values to be replaced on render
     * @param {boolean} cachePage if true the html will be stored in cache
     * @returns {Promise<View>} Promise with view managing html
     */
    export function renderURL(url: string, actor: Object, values: Object, cachePage: boolean): Promise<HTMLElement>;
    /**
     * Renders an html string
     * @param {HTMLElement} dom the dom to be managed
     * @param {{}} actor object to be called on actions
     * @param {{}} values values to be replaced on render
     * @returns {HTMLElement} the container element of the view
     */
    export function renderDom(dom: HTMLElement, actor: Object, values: Object): HTMLElement;
    /**
     * Registers a new tag used by a plugin
     * @param {string} name name of new attribute used by plugin 
     * @param {Function} callBack function that handles that attribute
     * @returns {void}
     */
    export function registerTag(name: string, callBack: (dom: HTMLElement, actor: Object, values: Object, ...params: Array<any>) => void): void;
    /**
     * Registers a new attribute that can contain a ternary
     * @param {string} name attribute used by view
     * @param {string} attributeName attribute used by html
     * @returns {void}
     */
    export function registerCustomAttribute(name: string, attributeName: string): void;
    /**
     * Registers a custom event
     * @param {string} name attribute used by view
     * @param {string} eventName name of javascript event
     * @returns {void}
     */
    export function registerCustomEvent(name: string, eventName: string): void;
}

export namespace Functions {
    /** Object used for mass replace */
    interface RegexItem {
        /** regular expression to search for */
        regex: RegExp;
        /** text to replace the expression with */
        text: string;
    }
    /**
     * Creates a new html comment element
     * @param {string} text the text of the comment
     * @returns {Comment} the new html element
     */
    export function createHtmlCommentElement(text: string): Comment;
    /**
     * Extracts a boolean equation from text
     * @param {string} text text containing equation
     * @returns {Array<Array<string>>} extracted equation
     */
    export function extractBooleanEquation(text: string): Array<Array<string>>;
    /**
     * Checks a simple boolean operation
     * @param {*} a a variable
     * @param {*} b a variable
     * @param {string} operation operation in text form
     * @returns {boolean} result as a boolean
     */
    export function checkBooleanOperation(a, b, operation: string): boolean;
    /**
     * Returns the value of the first property that exists in both the object and the list
     * @param {Object} json object to be searched
     * @param {Array<string>} properties list of possible property keys
     * @returns {string | number} first property key found
     */
    export function getFirstProperty(json: Object, ...properties: Array<string>): string | number;
    /**
     * Creates a wrapper for a function that manages its arguments
     * @param {() => T} callBack function to be wrapped
     * @template T return type of function
     * @param {Function} [argumentDealer] argument manager, if undefined no arguments will be passed
     * @returns {() => T} wrapper function created
     */
    export function functionWrapper<T>(callBack: () => T, argumentDealer: Function): () => T;
    /**
     * Converts number? to number
     * @param {number} [number] Nullable number
     * @param {number} [defaultValue=0] DefaultValue to repalce number
     * @returns {number} value of number or value of defaultValue or 0
     */
    export function numberOrDefault(number: number, defaultValue: number): number;
    /**
     * Escapes every special character
     * @param {string} text text to be escaped
     * @returns {string} escaped text
     */
    export function addEscapeToText(text: string): string;
    /**
     * Creates functions that can be safely called from loops
     * @param {() => void)} callBack callback function
     * @param {Array<*>} params list of parameters
     * @returns {Function} created function
     */
    export function createFunction(callBack: () => void, ...params: Array<any>): Function;
    /**
     * Creates functions, that will run on a different thread, that can be safely called from loops
     * @param {() => void)} callBack callback function
     * @param {Array<*>} params list of parameters
     * @returns {Function} created function
     */
    export function createFunctionBubble(callBack: () => void, ...params: Array<any>): Function;
    /**
     * Creates a function that calls many functions at once
     * @param  {Array<()=>void>} params list of child functions
     * @returns {()=>void} created function
     */
    export function createMultiFunction(...params: Array<() => void>): Function;
    /**
     * Converts function? to function
     * @param {Function} [callBack] Nullable function
     * @returns {Function} value of function or empty function
     */
    export function functionOrEmpty(callBack: Function): Function;
    /**
     * Accepts a number, converts it to binary and returns a grid of booleans
     * @param {number} input Inserted number to be converted 
     * @param {number} [width=1] Width of grid
     * @param {number} [height=1] Height of grid
     * @returns {Array<Array<boolean>>} Grid of booleans
     */
    export function binaryToArray(input: number, width?: number, height?: number): Array<Array<boolean>>;
    /**
     * Accepts a list, converts it to a number
     * @param {Array<Array<boolean>>} input Grid of booleans
     * @returns {number} number converted from booleans
     */
    export function arrayToBinary(input: Array<Array<boolean>>): number;
    /**
     * Checks if a map containts a value
     * @param {Object} map map in object form
     * @param {string} value value searched for
     * @returns {boolean} if value exists
     */
    export function containsValue(map: Object, value: string): boolean;
    /**
     * Checks if a list contains an element
     * @param {Array<T>} list list to be searched
     * @param {(listItem: T) => boolean} callBack function that checks each element
     * @template T generic of list and fucntion
     * @returns {boolean} true if item was found
     */
    export function listContains<T>(list: Array<T>, callBack: (listItem: T) => boolean): boolean;
    /**
     * Creates a new instance of a function or prototype object
     * @param {T} prototype prototype object or function
     * @template T prototype object or function
     * @returns {T} an instance of the requested prototype
     */
    export function createObject<T>(prototype: T): T;
    /**
     * Creates a new instance of a function or prototype object and initiates it
     * @param {T} prototype prototype object or function
     * @param {Array} params array of arguments
     * @template T prototype object or function
     * @returns {T} an instance of the requested prototype
     */
    export function initObject<T>(prototype: T, ...params: Array<any>): T;
    /**
     * Safely deepclones an object
     * @param {{}} object object to be cloned
     * @returns {{}} cloned object
     */
    export function cloneObject(object: Object): Object;
    /**
     * Safely deepclones an object
     * @param {{}} object object to be cloned
     * @param {number} amount how many cloned items should be returned
     * @returns {{}} cloned object
     */
    export function cloneObject(object: Object, amount: number): Array<Object>;
    /**
     * Custom toString method for dates
     * @param {Date} date date object
     * @param {string} format string format
     * @returns {string} string form of requested date
     */
    export function dateToString(date: Date, format: string): string;
    /**
     * Returns a promise to be executed in 50 ms
     * @param {(resolve: (result: T) => void) => void} callBack function to be executed in 50 ms
     * @template T prototype object or function
     * @returns {Promise<T>} promise that will activate in 50ms
     */
    export function autoPromise<T>(callBack: (resolve: (result: T) => void) => void): Promise<T>;
    /**
	 * Adds anchor elements to all the links inside a string
	 * @param {string} text text to be converted
	 * @returns {string} converted text 
	 */
    export function setLinks(text: string): string;
    /**
     * Parses a JSON string into an Object
     * @param {string} json JSON string
     * @returns {Object} Parsed JSON
     */
    export function fromJson(json: string): Object;
    /**
     * Gets a specified object from a json
     * @param {T} prototype specified object prototype
     * @param {string | T} json json string
     * @template T prototype object or function
     * @returns {T} parsed json as prototype object
     */
    export function getModel<T>(prototype: T, json: string): T;
    /**
     * Checks if text contains an invalid value
     * @param {string} json json as string
     * @returns {boolean} true if json is deemed valid
     */
    export function isValid(json: string): boolean;
    /**
     * Returns a promise than will be executed a certain period of time
     * @param {number} ms period of time
     * @returns {Promise<void>} Promise that is called after the period passes
     */
    export function delay(ms: number): Promise<void>;
    /**
     * Casts a value as a prototype object
     * @param {T} prototype prototype object
     * @param {*} value random value to be casted
     * @template T prototype object or function
     * @returns {T} original value casted as prototype
     */
    export function cast<T>(prototype: T, value): T;
    /**
     * Gets the largest number from a list of object
     * @param {Array<T>} list list of objects
     * @template T type of object
     * @param {(item: T) => number} callback function that gets the number from the object
     * @returns {number} largest number found
     */
    export function getLargestNumber<T>(list: Array<T>, callback: (item: T) => number): number;
    /**
     * Gets all the properties of an object, including non-enumerable and inherited ones
     * @param {{}} obj object to search
     * @returns {Array<string>} list of properties
     */
    export function getAllProperties(obj: Object): Array<string>;
    /**
     * Does complex regex replacements
     * @param {string} text original text
     * @param {Array<RegexItem>} regexList list of expressions and replacements
     * @returns {string} replaced string
     */
    export function massReplace(text: string, regexList: Array<RegexItem>): string;
    /**
     * Maps an iteratable to an array
     * @param {{forEach: (item: T) => void}} iteratable any object that can be iterated using the foreach function
     * @template T prototype object or function
     * @returns {Array<T>} created array
     */
    export function toList<T>(iteratable: (item: T) => void): Array<T>;
    /**
     * An upgrade on the normal querySelectorAll command with the addition that it can also include the parent element
     * @param {HTMLElement} dom parent element
     * @param {string} query query to search for
     * @returns {Array<HTMLElement>} list of found elements
     */
    export function querySelectorAll(dom: HTMLElement, query: string): Array<HTMLElement>;
    /**
     * The equivelant function of C# string.format
     * @param {string} text string to be formatted
     * @param {Array<string>} params list of replace parameters
     * @returns {string} formatted string
     */
    export function formatString(text: string, ...params: Array<string>): string;
    /**
     * Replaces all regex in a string with  {0}, {1} ... {n}
     * @param {string} text string to be formatted
     * @returns {string} formatted string
     */
    export function reverseRegex(text: string): string;
}

export namespace Http {
    /**
     * Deletes a cookie
     * @param {string} name name of cookie
     * @returns {void}
     */
    export function deleteCookieByName(name: string): void;
    /**
     * Gets the value of a cookie
     * @param {string} name name of cookie
     * @returns {string} value of cookie
     */
    export function getCookieByName(name: string): string;
    /**
     * Creates/Updates a cookie
     * @param {string} name name of cookie
     * @param {string} value value of cookie
     * @returns {void}
     */
    export function setCookie(name: string, value: string): void;
    /**
     * Creates a socket
     * @param {string} url where the socket is going to connect
     * @param {() => void} [onopen] On open event
     * @param {(message: string) => void} [onmessage] On message event
     * @param {() => void} [onerror] On error event
     * @param {() => void} [onclose] On close event
     * @returns {WebSocket} The created socket
     */
    export function socket(url: string, onopen?: () => void, onmessage?: (message: string) => void, onerror?: () => void, onclose?: () => void): WebSocket;
    /**
     * Sends a post request
     * @param {string} url Where the request is going to be sent
     * @param {object} [data] The data that are going to be sent
     * @param {string} [contentType="application/json"] The content type of the request
     * @returns {Promise<string>} Promise that is activated when the request is loaded
     */
    export function post(url: string, data?: Object, contentType?: string): Promise<string>;
    /**
     * Sends a get request
     * @param {string} url Where the request is going to be sent
     * @returns {Promise<string>} Promise that is activated when the request is loaded
     */
    export function get(url: string): Promise<string>;
}