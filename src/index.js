const soap = require('soap');
const MarketingCloudAuth = require('marketing-cloud-auth');
const applyAuthHeader = require('./utils/apply-auth-header');
const convertDates = require('./utils/convert-dates');
const ResponseError = require('./objects/response-error');
const defaultProps = require('./default-props');

const { isArray } = Array;

class MarketingCloudSOAP {
  /**
   * For WSDL information visit: https://developer.salesforce.com/docs/atlas.en-us.noversion.mc-apis.meta/mc-apis/wsdl-endpoint-links.htm
   *
   * @param {object} options The SOAP client options.
   * @param {string} options.wsdl The WSDL link to connect to. Must be for your stack.
   * @param {object} options.auth The Authentication options.
   * @param {string} options.auth.clientId The Marketing Cloud API ID
   * @param {string} options.auth.clientSecret The Marketing Cloud API Scecret
   * @param {string} options.auth.authUrl The Marketing Cloud auth URL (optional)
   * @param {object} options.soapOptions Additional options to send to the SOAP client.
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

  retrieveByCustomerKey(type, key, props) {
    const filter = {
      attributes: { 'xsi:type': 'SimpleFilterPart' },
      Property: 'CustomerKey',
      SimpleOperator: 'equals',
      Value: key,
    };
    return this.retrieveOne(type, filter, props);
  }

  async retrieveOne(type, filter, props, options) {
    const response = await this.retrieve(type, props, {
      Filter: filter,
      ...options,
    });
    const result = MarketingCloudSOAP.formatResponse(response, true);
    return result;
  }

  /**
   *
   * @param {string} type
   * @param {string[]} [props]
   */
  async retrieve(type, props, options) {
    const client = await this.client();
    const [result, rawResponse, soapHeader, rawRequest] = await client.RetrieveAsync({
      RetrieveRequest: {
        ObjectType: type,
        Properties: MarketingCloudSOAP.propsFor(type, props),
        ...options,
      },
    });
    return MarketingCloudSOAP.handleResponse({
      result,
      rawResponse,
      rawRequest,
      soapHeader,
    });
  }

  async create(type, payload, options) {
    const client = await this.client();
    const [result, rawResponse, soapHeader, rawRequest] = await client.CreateAsync({
      Objects: [{
        attributes: { 'xsi:type': type },
        ...payload,
      }],
      Options: options || undefined,
    });
    return MarketingCloudSOAP.handleResponse({
      result,
      rawResponse,
      rawRequest,
      soapHeader,
    });
  }

  /**
   * Describes the available SOAP web services.
   */
  async describe() {
    const client = await this.client();
    return client.describe();
  }

  /**
   * Inits and returns the SOAP client using the configured WSDL URL.
   *
   * @private
   * @return {Promise}
   */
  async client() {
    if (!this.clientPromise) {
      this.clientPromise = soap.createClientAsync(this.wsdl, this.soapOptions);
    }
    try {
      const [token, client] = await Promise.all([
        this.auth.retrieve(),
        this.clientPromise,
      ]);
      applyAuthHeader(client, `<fueloauth>${token.value}</fueloauth>`);
      return client;
    } catch (e) {
      this.clientPromise = undefined;
      throw e;
    }
  }

  /**
   *
   * @param {string} type
   * @param {?array} props
   */
  static propsFor(type, props) {
    if (isArray(props) && props.length) return props;
    return defaultProps[type] || ['ObjectId'];
  }

  /**
   *
   * @param {object} res
   * @param {boolean} [asOne=false]
   */
  static formatResponse(res, asOne = false) {
    const results = (res && isArray(res.Results)) ? res.Results.slice() : [];
    if (asOne) return results.shift() || null;
    return results;
  }

  /**
   * @private
   * @param {object} params
   */
  static handleResponse({ result, rawResponse, rawRequest } = {}) {
    if (!result && !result.OverallStatus) {
      throw new ResponseError({ result, rawResponse, rawRequest }, 'Unable to parse response status.');
    }

    const { OverallStatus } = result;
    if (ResponseError.pattern.test(OverallStatus)) {
      throw new ResponseError({ result, rawResponse, rawRequest }, OverallStatus);
    }

    const Results = (isArray(result.Results)) ? result.Results : [];
    return {
      ...result,
      Results: Results.map(obj => convertDates(obj)),
    };
  }
}

module.exports = MarketingCloudSOAP;
