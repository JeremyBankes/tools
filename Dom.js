import Data from './Data.js';

export default class Dom {

    /**
     * @callback OnDomReadyCallback
     * @param {ElementMapping} mapping
     * @returns {void|Promise<void>}
     * 
     * Called when the DOM content is loaded
     * @type {OnDomReadyCallback[]}
     */
    static _onReadyListeners = [];

    /**
     * @callback OnDomErrorCallback
     * @param {Error} error
     * @param {ElementMapping} mapping
     * @returns {void}
     * 
     * Called if an error occurs while executing the {@link Network.onReady} callback.
     * @type {OnDomErrorCallback[]}
     */
    static _onErrorListeners = [];

    /**
     * Registers a callback to be run when the DOM content loads.
     * @param {OnDomReadyCallback} listener
     */
    static onReady(listener) {
        Dom._onReadyListeners.push(listener);
    }

    /**
     * Registers a callback to be run if an error occurs while executing onReady callbacks.
     * @param {OnDomErrorCallback} listener
     */
    static onError(listener) {
        Dom._onErrorListeners.push(listener);
    }

    /**
     * Returns an ElementMapping of all elements in 'root'.
     * @param {Document|DocumentFragment} root
     * @returns {ElementMapping}
     */
    static getMapping(root = document) {
        return new ElementMapping(root);
    }

    /**
     * Creates an HTML element
     * @template {keyof HTMLElementTagNameMap} TagName
     * @param {object} options
     * @param {TagName} options.tagName
     * @param {string[]} [options.classList]
     * @param {string} [options.textContent]
     * @param {string} [options.innerHTML]
     * @param {string} [options.outerHTML]
     * @param {Object.<string, string>} [options.attributes]
     * @param {Object.<string, EventListenerOrEventListenerObject>} [options.eventListeners]
     * @param {Node[]} [options.childNodes]
     * @returns {HTMLElementTagNameMap[TagName]}
     */
    static create(options) {
        const element = document.createElement(options.tagName);
        element.classList.add(...Data.get(options, 'classList', []));
        element.textContent = Data.get(options, 'textContent', '');
        if ('innerHTML' in options) {
            element.innerHTML = Data.get(options, 'innerHTML');
        }
        if ('outerHTML' in options) {
            element.outerHTML = Data.get(options, 'outerHTML');
        }
        if ('attributes' in options) {
            for (const name in options.attributes) {
                element.setAttribute(name, options.attributes[name]);
            }
        }
        if ('eventListeners' in options) {
            for (const type in options.eventListeners) {
                element.addEventListener(type, options.eventListeners[type]);
            }
        }
        if ('childNodes' in options) {
            element.append(...Data.get(options, 'childNodes', []));
        }
        return element;
    }

    /**
     * Removes all children from a node
     * @param {Node} node 
     */
    static clear(node) {
        while (node.lastChild !== null) {
            node.lastChild.remove();
        }
        return node;
    }

    /**
     * Retrieves form data for inputs within a certain section in a form
     * @param {HTMLElement} section 
     */
    static getFormData(section) {
        const form = section.closest('form');
        if (form === null) {
            throw new Error('Section not in form.');
        }
        const formData = new FormData(form);
        for (const element of form.elements) {
            if (!section.contains(element)) {
                if (element instanceof HTMLInputElement) {
                    formData.delete(element.name);
                }
            }
        }
        return formData;
    }

    /**
     * Populates a form's inputs with data
     * @param {HTMLFormElement} form 
     * @param {FormData|object} data 
     */
    static setFormData(form, data) {
        /** @type {FormData} */
        let formData;
        if (data instanceof FormData) {
            formData = data;
        } else {
            formData = new FormData();
            Data.walk(data, (value, path) => formData.append(path, value), true);
        }
        for (const [key, value] of formData) {
            if (key in form.elements) {
                const input = form.elements[key];
                switch (input.type) {
                    case 'checkbox':
                        input.checked = !!value;
                        break;
                    default:
                        input.value = value;
                        break;
                }
            } else {
                console.warn(`Could not populate form value ${key}. No matching input.`);
            }
        }
    }

    /**
     * Retrieves form data for inputs within a certain section in a form
     * @param {HTMLElement} section 
     */
    static clearFormSection(section) {
        const form = section.closest('form');
        if (form === null) {
            throw new Error('Section not in form.');
        }
        for (const element of form.elements) {
            if (section.contains(element)) {
                if (element instanceof HTMLInputElement) {
                    if (element.type === 'checkbox' || element.type === 'radio') {
                        element.checked = false;
                    } else {
                        element.value = '';
                    }
                } else if (element instanceof HTMLTextAreaElement) {
                    element.value = '';
                } else if (element instanceof HTMLSelectElement) {
                    element.selectedIndex = 0;
                }
            }
        }
    }

    /**
     * @callback SlowedInputCallback
     * @param {Event} event
     * @param {boolean} slowed
     * @returns
     * 
     * Attaches a input listener that only fires a given amount of time after the user has stopped inputting.
     * This is useful to reducing the amount of API requests for suggestions-as-you-type search boxes.
     * 
     * @param {HTMLInputElement} input The element to attach the listener to
     * @param {SlowedInputCallback} callback The callback to be run after inputting
     * @param {number} delay The time in milliseconds to wait after the user has inputted until firing the callback 
     */
    static setSlowedInputListener(input, callback, delay = 500) {
        if (callback) {
            let timeout = null;
            input.oninput = event => {
                if (timeout) {
                    clearTimeout(timeout);
                }
                timeout = setTimeout(() => callback(event, true), delay);
                callback(event, false);
            };
        } else {
            input.oninput = null;
        }
    }

    /**
     * Creates a client-side form submission handler
     * 
     * @callback FormSuccessCallback
     * @param {object} data
     * @returns {Promise<boolean>|boolean} Returns true to clear the form, false otherwise
     * 
     * @callback FormErrorCallback
     * @param {Error} error
     * @returns {void}
     * 
     * @callback FormFinallyCallback
     * @returns {void}
     * 
     * @param {HTMLFormElement} form
     * @param {FormSuccessCallback} [successCallback]
     * @param {FormErrorCallback} [errorCallback]
     * @param {FormFinallyCallback} [finallyCallback]
     */
    static setFormSubmitListener(form, successCallback, errorCallback = null, finallyCallback = null) {
        form.onsubmit = (event) => {
            if (event instanceof SubmitEvent) {
                const form = event.target;
                if (form instanceof HTMLFormElement) {
                    const inputs = form.querySelectorAll('input[name]:not(:disabled),textarea[name]:not(:disabled),select[name]:not(:disabled),button[name]:not(:disabled)');
                    const data = {};
                    for (const input of inputs) {
                        if (
                            input instanceof HTMLInputElement
                            || input instanceof HTMLTextAreaElement
                            || input instanceof HTMLSelectElement
                            || input instanceof HTMLButtonElement
                        ) {
                            let value = null;
                            switch (input.type) {
                                case 'checkbox':
                                    if (input instanceof HTMLInputElement) {
                                        if (input.hasAttribute('value')) {
                                            if (input.checked) {
                                                value = input.value;
                                            }
                                        } else {
                                            value = input.checked;
                                        }
                                    }
                                    break;
                                case 'number':
                                    value = parseFloat(input.value);
                                    break;
                                default:
                                    value = input.value;
                                    break;
                            }
                            if (value !== null) {
                                Data.set(data, input.name, value);
                            }
                        }
                    }
                    form.classList.add('loading');
                    Promise.resolve(successCallback(data)).then(result => {
                        if (result) {
                            form.reset();
                        }
                    }).catch((error) => {
                        console.warn(error);
                        if (errorCallback !== null) {
                            errorCallback(error);
                        }
                    }).finally(() => {
                        if (finallyCallback !== null) {
                            finallyCallback();
                        }
                        form.classList.remove('loading');
                    });
                }
            }
            return false;
        };
        return {};
    }

    /**
     * Controls the existance of 'templateElement's content in the DOM based on the value of 'controlInput'
     * @param {HTMLTemplateElement} templateElement The element whoes existance is dictated by 'controlInput'
     * @param {HTMLInputElement} controlInput The element whoes value controls the existance of 'templateElement'
     * @param {function(HTMLInputElement):boolean} valueEvaluationCallback The callback to assess 'controlInput's value. Returns true for templateElement to exists, false otherwise
     */
    static existanceControlledBy(templateElement, controlInput, valueEvaluationCallback = (controlInput) => controlInput.checked) {
        const puppetElements = [...templateElement.content.childNodes];
        const update = () => {
            if (valueEvaluationCallback(controlInput)) {
                templateElement.after(...puppetElements);
            } else {
                templateElement.content.append(...puppetElements);
            }
        };
        controlInput.onchange = update;
        update();
    }

    /**
     * @returns True if the current runtime is a browser, false otherwise.
     */
    static isBrowser() {
        return 'window' in globalThis;
    }

    static {
        if (Dom.isBrowser()) {
            addEventListener('DOMContentLoaded', () => {
                const mapping = Dom.getMapping();
                Promise.all(Dom._onReadyListeners.map(readyListener => {
                    return readyListener(mapping);
                })).catch(error => {
                    for (const errorListner of Dom._onErrorListeners) {
                        errorListner(error, mapping);
                    }
                });
            });
        }
    }

}

/**
 * Holds a mapping of IDs to their corresponding elements
 * An easy-to-use typed, wrapping of documnet.getElementById()
 */
export class ElementMapping {

    /**
     * @param {Document|DocumentFragment} root 
     */
    constructor(root = document) {
        this._rootView = new Proxy({}, {
            get(target, key) {
                const id = typeof key === 'symbol' ? key.description : key;
                if (id === undefined) {
                    throw new Error('Invalid key.');
                }
                return root.getElementById(id);
            }
        });
    }

    get elements() { return /** @type {Object.<string, HTMLElement>} */ (this._rootView); }
    get anchors() { return /** @type {Object.<string, HTMLAnchorElement>} */ (this._rootView); }
    get bases() { return /** @type {Object.<string, HTMLBaseElement>} */ (this._rootView); }
    get bodies() { return /** @type {Object.<string, HTMLBodyElement>} */ (this._rootView); }
    get brs() { return /** @type {Object.<string, HTMLBRElement>} */ (this._rootView); }
    get buttons() { return /** @type {Object.<string, HTMLButtonElement>} */ (this._rootView); }
    get canvases() { return /** @type {Object.<string, HTMLCanvasElement>} */ (this._rootView); }
    get divs() { return /** @type {Object.<string, HTMLDivElement>} */ (this._rootView); }
    get dlists() { return /** @type {Object.<string, HTMLDListElement>} */ (this._rootView); }
    get embeds() { return /** @type {Object.<string, HTMLEmbedElement>} */ (this._rootView); }
    get forms() { return /** @type {Object.<string, HTMLFormElement>} */ (this._rootView); }
    get heads() { return /** @type {Object.<string, HTMLHeadElement>} */ (this._rootView); }
    get headings() { return /** @type {Object.<string, HTMLHeadingElement>} */ (this._rootView); }
    get hrs() { return /** @type {Object.<string, HTMLHRElement>} */ (this._rootView); }
    get htmls() { return /** @type {Object.<string, HTMLHtmlElement>} */ (this._rootView); }
    get iframes() { return /** @type {Object.<string, HTMLIFrameElement>} */ (this._rootView); }
    get images() { return /** @type {Object.<string, HTMLImageElement>} */ (this._rootView); }
    get inputs() { return /** @type {Object.<string, HTMLInputElement>} */ (this._rootView); }
    get lis() { return /** @type {Object.<string, HTMLLIElement>} */ (this._rootView); }
    get links() { return /** @type {Object.<string, HTMLLinkElement>} */ (this._rootView); }
    get menus() { return /** @type {Object.<string, HTMLMenuElement>} */ (this._rootView); }
    get metas() { return /** @type {Object.<string, HTMLMetaElement>} */ (this._rootView); }
    get mods() { return /** @type {Object.<string, HTMLModElement>} */ (this._rootView); }
    get olists() { return /** @type {Object.<string, HTMLOListElement>} */ (this._rootView); }
    get optgroups() { return /** @type {Object.<string, HTMLOptGroupElement>} */ (this._rootView); }
    get options() { return /** @type {Object.<string, HTMLOptionElement>} */ (this._rootView); }
    get paragraphs() { return /** @type {Object.<string, HTMLParagraphElement>} */ (this._rootView); }
    get pres() { return /** @type {Object.<string, HTMLPreElement>} */ (this._rootView); }
    get quotes() { return /** @type {Object.<string, HTMLQuoteElement>} */ (this._rootView); }
    get scripts() { return /** @type {Object.<string, HTMLScriptElement>} */ (this._rootView); }
    get selects() { return /** @type {Object.<string, HTMLSelectElement>} */ (this._rootView); }
    get slots() { return /** @type {Object.<string, HTMLSlotElement>} */ (this._rootView); }
    get spans() { return /** @type {Object.<string, HTMLSpanElement>} */ (this._rootView); }
    get styles() { return /** @type {Object.<string, HTMLStyleElement>} */ (this._rootView); }
    get tablecells() { return /** @type {Object.<string, HTMLTableCellElement>} */ (this._rootView); }
    get tables() { return /** @type {Object.<string, HTMLTableElement>} */ (this._rootView); }
    get tablerows() { return /** @type {Object.<string, HTMLTableRowElement>} */ (this._rootView); }
    get tablesections() { return /** @type {Object.<string, HTMLTableSectionElement>} */ (this._rootView); }
    get templates() { return /** @type {Object.<string, HTMLTemplateElement>} */ (this._rootView); }
    get times() { return /** @type {Object.<string, HTMLTimeElement>} */ (this._rootView); }
    get titles() { return /** @type {Object.<string, HTMLTitleElement>} */ (this._rootView); }
    get ulists() { return /** @type {Object.<string, HTMLUListElement>} */ (this._rootView); }

}