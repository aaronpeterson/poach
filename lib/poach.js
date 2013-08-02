var error = require('./error.js');

// temporary
exports.FacebookStrategy = require('./strategies/facebook');
exports.TwitterStrategy = require('./strategies/twitter');
exports.InstagramStrategy = require('./strategies/instagram');

var _strategies = {};

exports.user = function(usernameSeed, isAvailable, cb) {
	var username = usernameSeed.replace(/\s/g, '');

	if (!username) {
		return cb(new Error('Username is required'));
	}

	usernameAvailable(username, isAvailable, 1, cb);
}

function usernameAvailable(username, isAvailable, attempt, cb) {
	var appendage = '';
	if (attempt > 1) {
		appendage = attempt;
	}

	isAvailable(username + appendage, function(err, available) {
		if (err) return cb(err);

		if (available === false) {
			attempt++;
			return usernameAvailable(username, isAvailable, attempt, cb);
		}

		cb(null, username + appendage);
	});
}

exports.me = function(provider, auth, post, cb) {
	if (!_strategies[provider]) return cb(new error.PoachError('No strategy for '+ provider));

	_strategies[provider].me(auth, post, cb);
}

exports.getFriendIds = function(provider, auth, cb) {
	if (!_strategies[provider]) return cb(new error.PoachError('No strategy for '+ provider));

	_strategies[provider].getFriendIds(auth, cb);
}

exports.post = function(provider, auth, post, cb) {
	if (!_strategies[provider]) return cb(new error.PoachError('No strategy for '+ provider));

	_strategies[provider].post(auth, post, cb);
}

exports.postPhoto = function(provider, auth, post, cb) {
	if (!_strategies[provider]) return cb(new error.PoachError('No strategy for '+ provider));

	_strategies[provider].postPhoto(auth, post, cb);
}

/**
 * Utilize the given `strategy` with optional `name`, overridding the strategy's
 * default name.
 *
 * Examples:
 *
 *     poach.use(new TwitterStrategy(...));
 *
 * @param {String|Strategy} name, i.e. our provider names
 * @param {Strategy} strategy
 * @return {Passport} for chaining
 * @api public
 */
exports.use = function(name, strategy) {
	if (!strategy) {
		strategy = name;
		name = strategy.name;
	}
	if (!name) throw new Error('Provider strategies must have a name');

	_strategies[name] = strategy;
	return this;
};

/**
 * Un-utilize the `strategy` with given `name`.
 *
 * In typical applications, the necessary authentication strategies are static,
 * configured once and always available.  As such, there is often no need to
 * invoke this function.
 *
 * However, in certain situations, applications may need dynamically configure
 * and de-configure authentication strategies.  The `use()`/`unuse()`
 * combination satisfies these scenarios.
 *
 * Examples:
 *
 *     passport.unuse('legacy-api');
 *
 * @param {String} name
 * @return {Passport} for chaining
 * @api public
 */
exports.unuse = function(name) {
  delete _strategies[name];
  return this;
}