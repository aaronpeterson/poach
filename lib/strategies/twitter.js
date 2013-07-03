/**
 * Module dependencies.
 */
var util = require('util'),
	OAuth = require('oauth').OAuth,
	error = require('../error.js');

function Strategy(options, verify) {
  options = options || {};
  options.tokenURL = options.tokenURL || 'https://api.twitter.com/oauth/access_token';

	this.oauth = new OAuth(
		"http://twitter.com/oauth/request_token",
		"http://twitter.com/oauth/access_token",
		options.consumerKey,
		options.consumerSecret,
		"1.0A", null, "HMAC-SHA1");

  this.name = 'twitter';

  this.profileURL = options.profileURL || 'https://api.twitter.com/1.1/users/show.json';
  // https://developers.facebook.com/docs/reference/api/user/#friends
  this.friendsURL = options.friendsURL || 'http://api.twitter.com/1/friends/ids.json';
  // https://developers.facebook.com/docs/reference/api/post/
  this.postURL = options.postURL || 'http://api.twitter.com/1/statuses/update.json'

}

/**
 * Get Friends of oauth provider user
 * 
 * @param  {Object}   options { type: 'oauth2', token: accessToken, attributes: { tokenSecret: tokenSecret } }
 * @param  {Function} cb      function(err, results) {} results is array of facebook user IDs
 */
Strategy.prototype.getFriendIds = function(options, cb) {
	this.oauth.get(this.friendsURL, options.token, options.attributes.tokenSecret, function(err, results) {
		// standardize results
		if (err) {
			// { statusCode: response.statusCode, data: result }
			// probably a 400, 403?
			return cb(err);
		}

		results = JSON.parse(results);

		// API explorer says errors are sent with 200?
		if (results.error){
			if (results.error.type === 'OAuthException') {
				return cb(new error.OAuthError(results.error.message));
			}
			return cb(new Exception("An unknown error occurred."));
		}

		var output = [];

		if (results.ids && results.ids.length > 0) {
			for (var i = 0; i < results.ids.length; i++) {
				output.push(results.ids[i]);
			}
		}

		cb(null, output);
	});
}

/**
 * Post to twitter
 * 
 * @param {Object} post the generic post {body:'', etc:''}
 * @param  {Object}   options { type: 'oauth2', token: accessToken, attributes: { tokenSecret: tokenSecret } }
 * @param  {Function} cb      function (err, results) {}
 */
Strategy.prototype.post = function(post, options, cb) {
	var twitterPost = {
		status: post.body
	};
	this.oauth.post(this.postURL, options.token, options.attributes.tokenSecret, twitterPost, function(err, results) {
		// standardize results
		if (err) {
			// { statusCode: response.statusCode, data: result }
			// probably a 400, 403?
			return cb(err);
		}

		results = JSON.parse(results);

		if (results.error){
			if (results.error.type === 'OAuthException') {
				return cb(new error.OAuthError(results.error.message));
			}
			return cb(new Error("An unknown error occurred."));
		}

		cb(null, {id:results.id_str});
	});
}

/**
 * Expose `Strategy`.
 */
module.exports = Strategy;