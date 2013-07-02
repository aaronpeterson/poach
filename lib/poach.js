var error = require('./error.js');

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

exports.use = function(strategy, callback) {
	
}