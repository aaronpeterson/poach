/**
 * Module dependencies.
 */
var util = require('util'),
	OAuth = require('oauth').OAuth,
	error = require('../error.js'),
	qs = require('qs'),
	multipart = require('../multipart');

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
  this.friendsURL = options.friendsURL || 'http://api.twitter.com/1.1/friends/ids.json';
  // https://developers.facebook.com/docs/reference/api/post/
  this.postURL = options.postURL || 'http://api.twitter.com/1.1/statuses/update.json'

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
 * @param  {Object}   options { type: 'oauth2', token: accessToken, attributes: { refreshToken: refreshToken } }
 * @param {Object} post the generic post {body:'', images:['file1.jpg', 'file2.jpg'], link: 'http://blah/', linkTitle: 'A link!', linkDescription: 'This is a link!', linkImage: 'http://blah/file.jpg'}
 * @param  {Function} cb      function (err, results) {}
 */
Strategy.prototype.post = function(options, post, cb) {
	var self = this;

	var twitterPost = {
		status: post.body
	};

	if (post.images) {
		twitterPost.media = {file: post.images[0]};
		return multipart.build(twitterPost, defaultBoundary, function(err, postData) {
			if (err) return cb(err);

			options.contentType = 'multipart/form-data; boundary=' + defaultBoundary;
			self.oauthPost(postData, options, cb);
		});
	}

	// twitterPost = qs.stringify(twitterPost);
	this.oauthPost(twitterPost, options, cb);
}

Strategy.prototype.oauthPost = function(data, options, cb) {
	if (!options.contentType) options.contentType = "application/x-www-form-urlencoded";

	var extraParams = null;
	if( typeof data != "string" ) {
    extraParams = data;
    data = null;
  }

	this.oauth._performSecureRequest( options.token, options.attributes.tokenSecret, "POST", this.postURL, extraParams, data, options.contentType,  function(err, results) {
		console.log("_performSecureRequest callback", err, results);
		// standardize results
		if (err) {
			// { statusCode: response.statusCode, data: result }
			var oauthError;
			if (err.statusCode && err.statusCode === 403) {
				oauthError = new error.OAuthScopeError("Cannot post to facebook without permission.");
			} else if (err.statusCode && err.statusCode === 401) {
				oauthError = new error.OAuthError("No twitter access token.  Please authorize app.");
			} else {
				oauthError = new error.PoachError("Unknown error");
			}
			return cb(oauthError);
		}

		results = JSON.parse(results);

		// twitter results already happen to be in our {id: new_post_id} format
		cb(null, {id: results.id_str});
	});
	/*
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
	*/
}

/**
 * Expose `Strategy`.
 */
module.exports = Strategy;