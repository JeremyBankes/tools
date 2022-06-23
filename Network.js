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
     * Sends a post request with optional body data and headers.
     * Uses the fetch API and {@link Network.defaults}
     * @param {string} url
     * @param {object} [body]
     * @param {object} [headers]
     */
    static async post(url, body = {}, headers = {}) {
        if (typeof body === 'object') {
            body = JSON.stringify(body);
        }
        if (Network.defaults.host !== null && url.match(/^[a-zA-Z]+:\/\//) === null) {
            url = Network.defaults.host + url;
        }
        return await fetch(url, {
            method: 'POST',
            body: JSON.stringify(body),
            credentials: 'include',
            headers: {
                ...Network.defaults.headers,
                ...Network.defaults.postHeaders,
                ...headers
            }
        });
    }

}