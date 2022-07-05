export default class Text {

    /**
     * @typedef {object} TextDefaults
     * @property {Intl.LocalesArgument} locale The locale to use for date formatting functions
     * @property {Intl.DateTimeFormatOptions} dateFormat The date format to use for formatting functions
     * @property {Intl.DateTimeFormatOptions} timeFormat The time format to use for formatting functions
     */

    /** 
     * The default options for text manipulations and formatting
     * @type {TextDefaults}
     */
    static defaults = {
        locale: 'en-CA',
        dateFormat: { dateStyle: 'long' },
        timeFormat: { timeStyle: 'short' }
    }

    /**
     * Converts a string to a url-slug
     * I.E.
     * Hello There, World! -> hello-there-world
     * @param {string} string
     */
    static toSlug(string) {
        string = string.toLowerCase();
        string = string.replace(/[^a-z0-9]+/g, '-');
        string = string.replace(/^-|-$/g, '');
        return string;
    }

    /**
     * Converts a string to camel case
     * I.E.
     * Hello There, World! -> helloThereWorld
     * @param {string} string
     */
    static toCamel(string) {
        string = string.replace(/[^A-Za-z0-9]+/g, ' ').trim().toLowerCase();
        string = string.split(/ /g).map((piece, index) => {
            if (index > 0) {
                return piece.charAt(0).toUpperCase() + piece.substring(1);
            }
            return piece;
        }).join('');
        return string;
    }

    /**
     * @param {string} singular
     * @param {number} count
     */
    static pluralize(singular, count) {
        if (count == 1) {
            return singular;
        }
        const plural = {
            '(quiz)$': "$1zes", '^(ox)$': "$1en", '([m|l])ouse$': "$1ice", '(matr|vert|ind)ix|ex$': "$1ices", '(x|ch|ss|sh)$': "$1es", '([^aeiouy]|qu)y$': "$1ies",
            '(hive)$': "$1s", '(?:([^f])fe|([lr])f)$': "$1$2ves", '(shea|lea|loa|thie)f$': "$1ves", 'sis$': "ses", '([ti])um$': "$1a", '(tomat|potat|ech|her|vet)o$': "$1oes",
            '(bu)s$': "$1ses", '(alias)$': "$1es", '(octop)us$': "$1i", '(ax|test)is$': "$1es", '(us)$': "$1es", '([^s]+)$': "$1s"
        };
        const irregular = { 'move': 'moves', 'foot': 'feet', 'goose': 'geese', 'sex': 'sexes', 'child': 'children', 'man': 'men', 'tooth': 'teeth', 'person': 'people' };
        const uncountable = ['sheep', 'fish', 'deer', 'moose', 'series', 'species', 'money', 'rice', 'information', 'equipment'];
        if (uncountable.indexOf(singular.toLowerCase()) >= 0) {
            return singular;
        }
        for (const word in irregular) {
            const pattern = new RegExp(word + '$', 'i');
            const replace = irregular[word];
            if (pattern.test(singular)) {
                return singular.replace(pattern, replace);
            }
        }
        for (const expression in plural) {
            const pattern = new RegExp(expression, 'i');
            if (pattern.test(singular)) {
                return singular.replace(pattern, plural[expression]);
            }
        }
        return singular;
    }

    /**
     * Converts a date object into strings of various formats
     * @param {Date} date
     * @param {'iso'|'form'|'pretty'} [format]
     */
    static fromDate(date, format = 'pretty') {
        switch (format) {
            case 'iso': return date.toISOString();
            case 'form': return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().substring(0, 10);
            case 'pretty': return date.toLocaleDateString(Text.defaults.locale, Text.defaults.dateFormat);
        }
    }

    /**
     * Converts a string into a date object
     * @param {string} dateString
     * @param {boolean} [formFormat] If true, parses 'dateString' in the current timezone instead of UTC.
     */
    static toDate(dateString, formFormat) {
        if (formFormat) {
            return new Date(new Date(dateString).getTime() + new Date().getTimezoneOffset() * 60000);
        } else {
            return new Date(dateString);
        }
    }

    /**
     * Converts a date or hours number into time strings of various formats
     * @param {Date|number} hoursOfDayOrDate
     * @param {'form'|'pretty'} [format]
     */
    static toTime(hoursOfDayOrDate, format = 'pretty') {
        switch (format) {
            case 'form':
                let hours, minutes;
                if (typeof hoursOfDayOrDate === 'number') {
                    hours = Math.floor(hoursOfDayOrDate);
                    minutes = Math.round((hoursOfDayOrDate - hours) * 60);
                } else {
                    hours = hoursOfDayOrDate.getHours();
                    minutes = hoursOfDayOrDate.getMinutes();
                }
                return hours.toString().padStart(2, '0') + ':' + minutes.toString().padStart(2, '0');
            case 'pretty':
                if (typeof hoursOfDayOrDate === 'number') {
                    const hours = Math.floor(hoursOfDayOrDate);
                    const minutes = Math.round((hoursOfDayOrDate - hours) * 60);
                    hoursOfDayOrDate = new Date(0, 0, 0, hours, minutes);
                }
                return hoursOfDayOrDate.toLocaleTimeString(Text.defaults.locale, Text.defaults.timeFormat);
        }
    }

    /**
     * Converts a form time string to a number of hours of a day
     * @param {string} formTimeString 
     */
    static fromTime(formTimeString) {
        const hours = parseInt(formTimeString.substring(0, 2));
        const minutes = parseInt(formTimeString.substring(3, 5));
        return hours + minutes / 60;
    }

    /**
     * @param {number} milliseconds
     */
    static toDurationString(milliseconds, showDays = true, showHours = true, showMinutes = true, showSeconds = true, showMilliseconds = false) {
        const secondInMilliseconds = 1000;
        const minuteInMilliseconds = secondInMilliseconds * 60;
        const hourInMilliseconds = minuteInMilliseconds * 60;
        const dayInMilliseconds = hourInMilliseconds * 24;
        let days = 0;
        let hours = 0;
        let minutes = 0;
        let seconds = 0;
        if (showDays) {
            days = Math.floor(milliseconds / dayInMilliseconds);
            milliseconds -= days * dayInMilliseconds;
        }
        if (showHours) {
            hours = Math.floor(milliseconds / hourInMilliseconds);
            milliseconds -= hours * hourInMilliseconds;
        }
        if (showMinutes) {
            minutes = Math.floor(milliseconds / minuteInMilliseconds);
            milliseconds -= minutes * minuteInMilliseconds;
        }
        if (showSeconds) {
            seconds = Math.floor(milliseconds / secondInMilliseconds);
            milliseconds -= seconds * secondInMilliseconds;
        }
        if (!showMilliseconds) {
            seconds += Math.round(milliseconds / secondInMilliseconds);
            milliseconds = 0;
        }
        const line = [];
        if (days > 0) {
            line.push(days + ' ' + Text.pluralize('day', days));
        } else if (hours > 0) {
            line.push(hours + ' ' + Text.pluralize('hour', hours));
        } else if (minutes > 0) {
            line.push(minutes + ' ' + Text.pluralize('minute', minutes));
        } else if (seconds > 0) {
            line.push(seconds + ' ' + Text.pluralize('second', seconds));
        } else if (milliseconds > 0) {
            line.push(milliseconds + ' ' + Text.pluralize('millisecond', milliseconds));
        }
        return line.join(', ');
    }

}