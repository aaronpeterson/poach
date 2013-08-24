/**
 * Module dependencies.
 */
var util = require('util'),
	OAuth2 = require('oauth').OAuth2,
	error = require('../error.js'),
	qs = require('qs'),
	async = require('async'),
	HttpFileGet = require('../http-file-get'),
	https = require('https'),
	fs = require('fs'),
	FormData = require('form-data');

function Strategy(options, verify) {
	options = options || {};

	this.oauth = new OAuth2(
		options.clientID,
		options.clientSecret);

	this.name = 'facebook';

	this.profileURL = options.profileURL || 'https://graph.facebook.com/me';
	// https://developers.facebook.com/docs/reference/api/user/#friends
	this.friendsURL = options.friendsURL || 'https://graph.facebook.com/me/friends';
	// https://developers.facebook.com/docs/reference/api/post/
	this.postURL = options.postURL || 'https://graph.facebook.com/me/feed';

	this.postPhotoURL = options.postPhotoURL || 'https://graph.facebook.com/me/photos';

}

/**
 * Get my provider profile
 * 
 * @param  {Object}   options { type: 'oauth2', token: accessToken, attributes: { refreshToken: refreshToken } }
 * @param  {Function} cb      function(err, results) {} results is array of facebook user IDs
 */
Strategy.prototype.me = function(options, cb) {
	var self = this;

	async.parallel([
		function(callback) {
			self.oauth.getProtectedResource(self.profileURL, options.token, function(err, results) {
				// standardize results
				if (err) return callback(err);

				results = JSON.parse(results);
				// API explorer says errors are sent with 200?
				if (results.error){
					if (results.error.type === 'OAuthException') {
						return callback(new error.OAuthError(results.error.message));
					}
					return callback(new Error("An unknown error occurred"));
				}

				callback(null, results);
			});
		},
		function(callback) {
			self.oauth.getProtectedResource(self.profileURL + '/permissions', options.token, function(err, results) {
				// standardize results
				if (err) return callback(err);

				results = JSON.parse(results);
				// API explorer says errors are sent with 200?
				if (results.error){
					if (results.error.type === 'OAuthException') {
						return callback(new error.OAuthError(results.error.message));
					}
					return callback(new Error("An unknown error occurred"));
				}

				callback(null, results);
			});
		}
	], function(err, results) {
		if (err) {
			// { statusCode: response.statusCode, data: result }
			// probably a 400, 403?
			return callback(err);
		}

		var returnResults = results[0];

		returnResults.permissions = results[1];
		returnResults.writePermission = true;
		if (!results[1] || !results[1].data[0] || !results[1].data[0].publish_actions ) {
			returnResults.writePermission = false;
		}

		cb(null, returnResults);
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
 * @param {Object} post the generic post {body:'', link:'', title:'', description:''}
 * @param  {Function} cb      function (err, results) {}
 */
Strategy.prototype.post = function(options, post, cb) {
	var self = this;

	// facebookargs : message, picture, link, name, caption, description, source, place, tags
	var facebookPost = {
		message: post.body,
		link: post.link,
		name: post.title,
		description: post.description
	};

	facebookPost = qs.stringify(facebookPost);
	this.oauthPost(this.postURL, facebookPost, options, cb);
}

/**
 * Post to facebook
 * 
 * @param  {Object}   options { type: 'oauth2', token: accessToken, attributes: { refreshToken: refreshToken } }
 * @param {Object} post the generic post {body:'', file:{file:(filepath), content_type:(content-type)} OR string URL}
 * @param  {Function} cb      function (err, results) {}
 */
Strategy.prototype.postPhoto = function(options, post, cb) {
	var self = this;

	var facebookPost = {
		message: post.body,
		link: post.link,
		name: post.title,
		description: post.description
	};

	if (!post.file) {
		// just post?
		facebookPost = qs.stringify(facebookPost);
		return this.oauthPost(this.postURL, facebookPost, options, cb);
	}

	if (typeof post.file === 'String') {
		console.log('post.file is a string');
		facebookPost.url = post.file;
		return this.oauthPost(this.postPhotoURL, facebookPost, options, cb);
	} else if (!post.file.file || !post.file.content_type) {
		cb(new Error("Cannot post files without file and content_type keys."));
	}

	facebookPost.source = post.file.file;

	var form = new FormData();
	form.append('file', fs.createReadStream(facebookPost.source));
	form.append('message', facebookPost.message);

	var httpOptions = {
		method: 'post',
		host: 'graph.facebook.com',
		path: '/me/photos?access_token=' + options.token,
		headers: form.getHeaders()
	}

	var request = https.request(httpOptions, function(res) {
		// console.log(res);
		cb(null, {message:'posted'});
	});

	form.pipe(request);

	request.on('error', function(error) {
		console.log(error);
	});

}

Strategy.prototype.oauthPost = function(endpoint, data, options, cb) {
	var headers = {};
	if (options.headers) {
		headers = options.headers;
	}

	// method, url, headers, post_body, access_token, callback
	this.oauth._request("POST", endpoint, headers, data, options.token, function(err, results) {
		// standardize results
		if (err) {
			console.log("Facebook Post error: ", err);
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