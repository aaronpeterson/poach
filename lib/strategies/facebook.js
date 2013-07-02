/**
 * Module dependencies.
 */
var util = require('util'),
	OAuth2 = require('oauth').OAuth2,
	error = require('../error.js');

function Strategy(options, verify) {
  options = options || {};
  options.tokenURL = options.tokenURL || 'https://graph.facebook.com/oauth/access_token';

	this.oauth = new OAuth2(
		options.consumerKey,
		options.consumerSecret);

  this.name = 'facebook';

  this.profileURL = options.profileURL || 'https://graph.facebook.com/me';
  // https://developers.facebook.com/docs/reference/api/user/#friends
  this.friendsURL = options.friendsURL || 'https://graph.facebook.com/me/friends';
  // https://developers.facebook.com/docs/reference/api/post/
  this.postURL = options.postURL || 'https://graph.facebook.com/me/feed'

}

/**
 * Get Followees of authed user
 * 
 * @param  {Object}   options { type: 'oauth2', token: accessToken, attributes: { refreshToken: refreshToken } }
 * @param  {Function} cb      function(err, results) {} results is array of facebook user IDs
 */
Strategy.prototype.getFollowees = function(options, cb) {
	this.oauth.getProtectedResource(this.friendsURL, options.accessToken, function(err, results) {
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
				return cb(new error.OAuthException(results.error.message));
			}
			return cb(new Exception("An unknown error occurred."));
		}

		var output = [];

		if (results.data && results.data.length > 0) {
			for (var i = 0; i < results.data.length; i++) {
				var friend = results.data[i];
				output.push(friend.id);
			}
		}

		cb(null, output);
	});
}

/**
 * Post to facebook
 * 
 * @param {Object} post the generic post {body:'', etc:''}
 * @param  {Object}   options { type: 'oauth2', token: accessToken, attributes: { refreshToken: refreshToken } }
 * @param  {Function} cb      function (err, results) {}
 */
Strategy.prototype.post = function(post, options, cb) {
	var facebookPost = {
		message: post.body
	};
	this.oauth._request("POST", this.postURL, {}, facebookPost, options.token, function(err, results) {
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

		// facebook results already happen to be in our {id: new_post_id} format
		cb(null, results);
	});
}

/**
 * Expose `Strategy`.
 */
module.exports = Strategy;