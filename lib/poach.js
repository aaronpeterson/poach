exports.user = function(usernameSeed, isAvailable, cb) {
	var username = usernameSeed.replace(/\s/g, '');

	if (!username) {
		return cb(new Error('Username is required'));
	}

	usernameAvailable(username, isAvailable, 0, cb);
}

function usernameAvailable(username, isAvailable, attempt, cb) {
	isAvailable(username, function(err, available) {
		if (err) return cb(err);

		if (available === false) {
			attempt++;
			username = username + attempt;
			return usernameAvailable(username, isAvailable, attempt, cb);
		}

		cb(null, username);
	});
}