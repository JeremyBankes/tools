import Data from './Data.js';

export default class Network {

    /**
     * @typedef {object} NetworkDefaults
     * @property {string} host Host to use for all outgoing requests
     * @property {Object.<string, any>} headers Headers to use for all outgoing requests
     * @property {Object.<string, any>} getHeaders Headers to use for all outgoing GET requests
     * @property {Object.<string, any>} postHeaders Headers to use for all outgoing POST requests
     */

    /** @type {NetworkDefaults} */
    static defaults = {
        host: null,
        headers: {},
        getHeaders: {},
        postHeaders: {},
    }

    /**
     * Sends a {@link method} request with optional body data and headers.
     * Uses the fetch API and {@link Network.defaults}
     * @param {string} url
     * @param {object} [body]
     * @param {object} [headers]
     */
    static async request(url, method = 'GET', body = {}, headers = {}) {
        if (Network.defaults.host !== null && url.match(/^[a-zA-Z]+:\/\//) === null) {
            url = Network.defaults.host + url;
        }
        const request = {
            method: method,
            credentials: /** @type {RequestCredentials} */ ('include'),
            headers: {
                ...Network.defaults.headers,
                ...Network.defaults.postHeaders,
                ...headers
            }
        };
        if (body !== null && body !== undefined) {
            body = JSON.stringify(body);
        }
        if (typeof body === 'string') {
            request.body = body;
        }
        return await fetch(url, request);
    }

    /**
     * Sends a post request with optional body data and headers.
     * Uses the fetch API and {@link Network.defaults}
     * @param {string} url
     * @param {object} [body]
     * @param {object} [headers]
     */
    static async get(url, body = {}, headers = {}) {
        const parameters = new URLSearchParams(Data.flatten(body));
        url = url + '?' + parameters.toString();
        return await Network.request(url, 'GET', null, headers);
    }

    /**
     * Sends a post request with optional body data and headers.
     * Uses the fetch API and {@link Network.defaults}
     * @param {string} url
     * @param {object} [body]
     * @param {object} [headers]
     */
    static async post(url, body = {}, headers = {}) {
        return await Network.request(url, 'POST', body, headers);
    }

    /**
     * Sends a put request with optional body data and headers.
     * Uses the fetch API and {@link Network.defaults}
     * @param {string} url
     * @param {object} [body]
     * @param {object} [headers]
     */
    static async put(url, body = {}, headers = {}) {
        return await Network.request(url, 'PUT', body, headers);
    }

    /**
     * Sends a patch request with optional body data and headers.
     * Uses the fetch API and {@link Network.defaults}
     * @param {string} url
     * @param {object} [body]
     * @param {object} [headers]
     */
    static async patch(url, body = {}, headers = {}) {
        return await Network.request(url, 'PATCH', body, headers);
    }

    /**
     * Sends a delete request with optional body data and headers.
     * Uses the fetch API and {@link Network.defaults}
     * @param {string} url
     * @param {object} [body]
     * @param {object} [headers]
     */
    static async delete(url, body = {}, headers = {}) {
        return await Network.request(url, 'DELETE', body, headers);
    }

}