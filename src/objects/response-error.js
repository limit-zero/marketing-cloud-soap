const pretty = require('pretty');

class ResponseError extends Error {
  /**
   *
   * @param {object} params
   * @param {object} params.result
   * @param {string} params.rawResponse
   * @param {string} params.rawRequest
   * @param {string} message
   * @param  {...any} args
   */
  constructor({ result, rawResponse, rawRequest } = {}, message, ...args) {
    const formatted = message ? message.replace(ResponseError.pattern, '') : message;
    super(formatted, ...args);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ResponseError);
    }
    this.result = result;
    this.rawResponse = pretty(rawResponse || '');
    this.rawRequest = pretty(rawRequest || '');
  }
}

ResponseError.pattern = /^error: /i;

module.exports = ResponseError;
