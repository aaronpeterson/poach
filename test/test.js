var Poach = require('../');

// "current users" fixture
var usernames = ['billy', 'billy2', 'sarah', 'sammy', 'sammy1', 'sammy2', 'michelle', 'CarlWeathers', 'CarlWeathers2'];

// username availability callback
var usernameAvailable = function(username, cb) {
	if (usernames.indexOf(username) > -1) return cb(null, false);

	cb(null, true);
}

exports.testPoach = function (test) {
	Poach.user("billy", usernameAvailable, function(err, newUsername) {
		test.equal(newUsername, 'billy3', 'New username should be billy3');
	});

	Poach.user("Carl Weathers", usernameAvailable, function(err, newUsername) {
		test.equal(newUsername, 'CarlWeathers3', 'New username should be CarlWeathers3');
	});

	Poach.user("Unused Username", usernameAvailable, function(err, newUsername) {
		test.equal(newUsername, 'UnusedUsername', 'New username should be UnusedUsername');
	});
	test.done();
}