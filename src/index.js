const soap = require('soap');
const MarketingCloudAuth = require('marketing-cloud-auth');

class MarkingCloudSOAP {
  /**
   * For WSDL information visit: https://developer.salesforce.com/docs/atlas.en-us.noversion.mc-apis.meta/mc-apis/wsdl-endpoint-links.htm
   *
   * @param {object} options The SOAP client options.
   * @param {string} options.wsdl The WSDL link to connect to. Must be for your stack.
   * @param {object} options.auth The Authentication options.
   * @param {string} options.auth.clientId The Marketing Cloud API ID
   * @param {string} options.auth.clientSecret The Marketing Cloud API Scecret
   * @param {string} options.auth.authUrl The Marketing Cloud auth URL (optional)
   * @param {string} options.soapOptions Additional options to send to the SOAP client.
   *                                     See https://github.com/vpulim/node-soap#options for more info.
   */
  constructor({
    wsdl = 'https://webservice.exacttarget.com/etframework.wsdl',
    auth = {},
    soapOptions = {},
  } = {}) {
    this.auth = new MarketingCloudAuth(auth);
    this.wsdl = wsdl;
    this.soapOptions = soapOptions;
  }

  /**
   * Inits the SOAP client using the configured WSDL URL.
   *
   * @private
   * @return {Promise}
   */
  async connect() {
    if (!this.clientPromise) {
      this.clientPromise = soap.createClientAsync(this.wsdl, this.soapOptions);
    }
    try {
      const client = await this.clientPromise;
      return client;
    } catch (e) {
      this.clientPromise = undefined;
      throw e;
    }
  }
}

module.exports = MarkingCloudSOAP;
