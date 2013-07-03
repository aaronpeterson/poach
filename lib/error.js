var util = require('util')

var AbstractError = function (msg, constr) {
  Error.captureStackTrace(this, constr || this)
  this.message = msg || 'Error'
}
util.inherits(AbstractError, Error)
AbstractError.prototype.name = 'Abstract Error'

// OAuth Error
var OAuthError = function (msg) {
  OAuthError.super_.call(this, msg, this.constructor)
}
util.inherits(OAuthError, AbstractError)
OAuthError.prototype.name = 'OAuth Error'

// Poach Error
var PoachError = function (msg) {
  PoachError.super_.call(this, msg, this.constructor)
}
util.inherits(PoachError, AbstractError)
PoachError.prototype.name = 'Poach Error'

module.exports = {
  OAuthError: OAuthError,
  PoachError: PoachError
}