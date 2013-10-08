/**
 * Module dependencies.
 */
var util = require('util'),
	OAuth2 = require('oauth').OAuth2,
	error = require('../error.js'),
	qs = require('qs'),
	async = require('async'),
	HttpFileGet = require('../http-file-get')
	https = require('https'),
	fs = require('fs'),
	FormData = require('form-data');

function Strategy(options, verify) {
	options = options || {};
	options.tokenURL = options.tokenURL || 'https://api.instagram.com/v1/users/access_token';

	this.oauth = new OAuth2(
		options.clientID,
		options.clientSecret);

	this.name = 'instagram';

	this.profileURL = options.profileURL || 'https://api.instagram.com/v1/users/self';
	// https://developers.facebook.com/docs/reference/api/user/#friends
	this.friendsURL = options.friendsURL || 'https://api.instagram.com/v1/users/self/follows';
	this.postURL = null
}

/**
 * Get my provider profile
 * 
 * @param  {Object}   options { type: 'oauth2', token: accessToken, attributes: { refreshToken: refreshToken } }
 * @param  {Function} cb      function(err, results) {} results is array of facebook user IDs
 */
Strategy.prototype.me = function(options, cb) {
	var self = this;

	self.oauth.getProtectedResource(self.profileURL, options.token, function(err, results) {
		if (err) return cb(err);

		results = JSON.parse(results);

		if (results.meta && results.meta.code && results.meta.code !== 200) {
			return cb(new error.OAuthError('Failed to get my profile on Instagram.  Code: '+results.meta.code));
		}

		if (!results.data) {
			results.data = [];
		}

		cb(null, results.data);
	});
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

		if (results.meta && results.meta.code && results.meta.code !== 200) {
			return cb(new error.OAuthError('Failed to get follows on Instagram.  Code: '+results.meta.code));
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
 * @param {Object} post the generic post {body:'', link:'', title:'', description:''}
 * @param  {Function} cb      function (err, results) {}
 */
Strategy.prototype.post = function(options, post, cb) {
	cb(new Error('You cannot post to instagram.'));
}

/**
 * Post to facebook
 * 
 * @param  {Object}   options { type: 'oauth2', token: accessToken, attributes: { refreshToken: refreshToken } }
 * @param {Object} post the generic post {body:'', file:{file:(filepath), content_type:(content-type)} OR string URL}
 * @param  {Function} cb      function (err, results) {}
 */
Strategy.prototype.postPhoto = function(options, post, cb) {
	cb(new Error('You cannot post to instagram.'));
}

Strategy.prototype.normalizedProfileWithProfileData = function(profileData) {
	return {
		provider: 'instagram',
		id: profileData.id,
		username: profileData.username,
		displayName: profileData.full_name,
		email: null,
		avatarURL: profileData.profile_picture,

		// Passport compatibility
		emails: [],
		photos: [profileData.profile_picture]
	}
}

/**
 * Expose `Strategy`.
 */
module.exports = Strategy;