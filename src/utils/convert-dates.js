const moment = require('moment-timezone');

const { keys } = Object;

module.exports = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  return keys(obj).reduce((o, key) => {
    const value = obj[key] instanceof Date
      ? moment.tz(moment(obj[key]).format('YYYY-MM-DDTHH:mm:ss'), 'America/Chicago').toDate()
      : obj[key];
    return { ...o, [key]: value };
  }, {});
};
