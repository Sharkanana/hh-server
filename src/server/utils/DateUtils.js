
import moment from "moment";

const displayDateFormat = 'MMM Do, YYYY (ddd)';
const saveDateFormat = 'YYYY-MM-DD';

const DateUtils = {

  parseDisplayDate(dateString) {
    return moment(dateString, displayDateFormat);
  },

  formatForDisplay(date) {
    return moment(date).utc().format(displayDateFormat)
  },

  formatForSave(date) {
    return moment(date).format(saveDateFormat);
  },

  areSameDate(date1, date2) {
    return moment(date1).isSame(date2, 'day');
  }

};

export default DateUtils;