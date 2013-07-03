var util = require('util');

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
OAuthError.prototype.name = 'OAuthError'

// OAuth Error
var OAuthScopeError = function (msg) {
  OAuthScopeError.super_.call(this, msg, this.constructor)
}
util.inherits(OAuthScopeError, AbstractError)
OAuthScopeError.prototype.name = 'OAuthScopeError'
OAuthScopeError.prototype.scope = []

// Poach Error
var PoachError = function (msg) {
  PoachError.super_.call(this, msg, this.constructor)
}
util.inherits(PoachError, AbstractError)
PoachError.prototype.name = 'PoachError'

module.exports = {
  OAuthError: OAuthError,
  OAuthScopeError: OAuthScopeError,
  PoachError: PoachError
}