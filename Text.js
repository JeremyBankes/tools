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

}