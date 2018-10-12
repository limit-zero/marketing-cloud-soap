class ResponseError extends Error {
  constructor({ result, rawResponse, rawRequest } = {}, message, ...args) {
    const formatted = message ? message.replace(/^error: /i, '') : message;
    super(formatted, ...args);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ResponseError);
    }

    this.result = result;
    this.rawResponse = rawResponse;
    this.rawRequest = rawRequest;
  }
}

module.exports = ResponseError;
