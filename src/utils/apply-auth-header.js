const once = require('./once');

module.exports = once((client, value) => {
  client.addSoapHeader(value);
});
