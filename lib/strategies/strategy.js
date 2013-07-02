/**
 * Module dependencies.
 */
var util = require('util');


/**
 * `Strategy` constructor.
 *
 * @api public
 */
function Strategy() {
}

/**
 * Get followees.
 *
 * This function must be overridden by subclasses.  In abstract form, it always
 * throws an exception.
 *
 * @param {Object} options
 * @param {Function} callback return array of oauth network ids
 * @api protected
 */
Strategy.prototype.getFollowees = function(options, cb) {
  throw new Error('Strategy#getFollowees must be overridden by subclass');
}

Strategy.prototype.post = function(options, cb) {
	throw new Error('Strategy#post must be overridden by subclass');
}


/**
 * Expose `Strategy`.
 */
module.exports = Strategy;
