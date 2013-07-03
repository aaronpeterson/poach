/**
 * Module dependencies.
 */
var util = require('util'),
	OAuth2 = require('oauth').OAuth2,
	error = require('../error.js'),
	qs = require('qs'),
	multipart = require('../multipart');

var defaultBoundary = '--------------------NODENEEDLEHTTPCLIENT';

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
Strategy.prototype.getFriendIds = function(options, cb) {
	this.oauth.getProtectedResource(this.friendsURL, options.token, function(err, results) {
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
 * @param  {Object}   options { type: 'oauth2', token: accessToken, attributes: { refreshToken: refreshToken } }
 * @param {Object} post the generic post {body:'', etc:''}
 * @param  {Function} cb      function (err, results) {}
 */
Strategy.prototype.post = function(options, post, cb) {
	var self = this;

	var facebookPost = {
		message: post.body
	};

	if (post.images) {
		return multipart.build(facebookPost, defaultBoundary, function(err, postData) {
			if (err) return cb(err);

			self.oauthPost(facebookPost, options, cb);
		});
	}

	facebookPost = qs.stringify(facebookPost);
	this.oauthPost(facebookPost, options, cb);
}

Strategy.prototype.oauthPost = function(data, options, cb) {
		this.oauth._request("POST", this.postURL, {}, data, options.token, function(err, results) {
		// standardize results
		if (err) {
			// { statusCode: response.statusCode, data: result }
			var oauthError;
			if (err.statusCode && err.statusCode === 403) {
				oauthError = new error.OAuthScopeError("Cannot post to facebook without permission.");
			} else if (err.statusCode && err.statusCode === 400) {
				oauthError = new error.OAuthError("No facebook access token.  Please authorize app.");
			}
			return cb(oauthError);
		}

		results = JSON.parse(results);

		// facebook results already happen to be in our {id: new_post_id} format
		cb(null, results);
	});
}

/**
 * Expose `Strategy`.
 */
module.exports = Strategy;