var util = require('util')

var AbstractError = function (msg, constr) {
  Error.captureStackTrace(this, constr || this)
  this.message = msg || 'Error'
}
util.inherits(AbstractError, Error)
AbstractError.prototype.name = 'Abstract Error'

// OAuth Exception
var OauthError = function (msg) {
  OauthError.super_.call(this, msg, this.constructor)
}
util.inherits(OauthError, AbstractError)
OauthError.prototype.name = 'OAuth Exception'

module.exports = {
  OauthError: OauthError
}