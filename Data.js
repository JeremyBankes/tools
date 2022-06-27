/**
 * A utility class for working with objects and data
 */
export default class Data {

    /**
     * Determines if a property exists in an object hierarchy.
     * @param {object} source Source object.
     * @param {string|string[]} path Path of the property to check the existance of
     * @returns {boolean} True if {@link path} exists, false otherwise
     */
    static has(source, path) {
        if (typeof path === 'string') {
            path = path.split('.');
        }
        const key = path.shift();
        if (key === undefined) {
            return source !== undefined;
        } else {
            if (typeof source === 'object') {
                return Data.has(source[key], path);
            }
            return false;
        }
    }

    /**
     * Gets the value of a property from an object hierarchy.
     * @template {any} Type Data type of the value to be retrieved.
     * @param {object} source Source object.
     * @param {string|string[]} path Path to the value to be retrieved. Hierarchy levels in a string are delineated by '.'.
     * @param {Type?} [fallback] Value to return if no value is present at {@link path}.
     * @returns {Type}
     */
    static get(source, path, fallback = null) {
        if (typeof path === 'string') {
            path = path.split('.');
        }
        const key = path.shift();
        let value;
        if (key === undefined) {
            value = source === undefined ? fallback : source;
        } else {
            if (typeof source === 'object') {
                return Data.get(source[key], path, fallback);
            }
            value = fallback;
        }
        return value;
    }

    /**
     * Sets the value of a property of an object in a hierarchy.
     * @param {object} destination Destination object.
     * @param {string|string[]} path Path of the property to be set. Hierarchy levels in a string are delineated by '.'.
     * @param {any} value The value to be set at {@link path} in {@link destination}
     */
    static set(destination, path, value) {
        if (typeof path === 'string') {
            path = path.match(/[^.\[\]]+/g);
        }
        const key = path.shift();
        if (key === undefined) {
            throw new Error(`Invalid path "${Data.getPathString(path)}".`);
        } else if (path.length === 0) {
            destination[key] = value;
        } else {
            if (!(key in destination)) {
                destination[key] = isNaN(parseInt(path[0])) ? {} : [];
            }
            Data.set(destination[key], path, value);
        }
    }

    /**
     * Deletes a property from an object in a hierarchy.
     * @param {object} source Source object.
     * @param {string|string[]} path Path of the property to be deleted. Hierarchy levels in a string are delineated by '.'.
     * @returns {any} The value that was deleted, or null if no value was present.
     */
    static delete(source, path) {
        if (typeof path === 'string') {
            path = path.split('.');
        }
        const key = path.shift();
        if (key === undefined) {
            throw new Error(`Invalid path "${Data.getPathString(path)}".`);
        } else if (key in source) {
            if (path.length === 0) {
                const value = source[key];
                delete source[key];
                return value;
            } else {
                return Data.delete(source[key], path);
            }
        }
        return null;
    }

    /** 
     * @callback ObjectValueCallback
     * @param {any} value
     * @param {string} path
     * @returns {void}
     * 
     * Calls {@link callback} for every value in {@link source}
     * @param {object} source Source object
     * @param {ObjectValueCallback} callback Called for every value in {@link source}
     * @param {boolean} traverseArray True to traverse into an array, false to treat an array as a ending value
     */
    static walk(source, callback, traverseArray = false) {
        /**
         * @param {Object} source
         * @param {string[]} path
         */
        const walk = (source, path) => {
            for (const key in source) {
                const value = source[key];
                const newPath = [...path, key];
                if (typeof value === 'object' && (traverseArray || !Array.isArray(value))) {
                    walk(value, newPath);
                } else {
                    callback(value, Data.getPathString(newPath));
                }
            }
        };
        walk(source, []);
    }

    /**
     * @param {string[]} path 
     */
    static getPathString(path) {
        const stringPath = [];
        for (const piece of path) {
            if (isNaN(parseInt(piece))) {
                stringPath.push('.');
                stringPath.push(piece);
            } else {
                stringPath.push('[');
                stringPath.push(piece);
                stringPath.push(']');
            }
        }
        return stringPath.join('').substring(1);
    }

    /**
     * Flattens an object's hierarchy.
     * I.E.
     * {
     *     name: {
     *         first: 'Jeremy',
     *         last: 'Bankes'
     *     }
     * } -> {
     *     'name.first': 'Jeremy',
     *     'name.last': 'Bankes
     * } 
     * @param {object} source
     * @returns {object} New object with no hierarchy.
     */
    static flatten(source) {
        const flatObject = {};
        Data.walk(source, (value, path) => flatObject[path] = value);
        return flatObject;
    }

    /**
     * Converts a flattened object back into a hierarchized object.
     * @param {object} flatObject
     * @returns {object} New hierarchized object.
     */
    static hierarchize(flatObject) {
        const object = {};
        for (const key in flatObject) {
            Data.set(object, key, flatObject[key]);
        }
        return object;
    }

    /**
     * Ensures that a given object has 'path'
     * @template {any} T
     * @param {object} destination
     * @param {string|string[]} path
     * @param {T} fallback
     * @returns {T}
     */
    static ensure(destination, path, fallback) {
        if (!this.has(destination, path)) {
            this.set(destination, path, fallback);
        }
        return this.get(destination, path);
    }

}