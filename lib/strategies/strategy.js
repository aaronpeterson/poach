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
 * Get Friend Ids.
 *
 * This function must be overridden by subclasses.  In abstract form, it always
 * throws an exception.
 *
 * @param {Object} options
 * @param {Function} callback return array of oauth provider user ids
 * @api public
 */
Strategy.prototype.getFriendIds = function(options, cb) {
  throw new Error('Strategy#getFollowees must be overridden by subclass');
}

/**
 * Post to the user's stream/feed.
 *
 * Convenience method
 * 
 * @param  {Object}   options the user's provider auth object
 * @param  {Function} cb      called back with object like {id: 12345}, id being the provider's new post id
 * @api public
 */
Strategy.prototype.post = function(options, cb) {
	throw new Error('Strategy#post must be overridden by subclass');
}


/**
 * Expose `Strategy`.
 */
module.exports = Strategy;
