/**
 * Module dependencies.
 */
var util = require('util'),
	OAuth = require('oauth').OAuth,
	error = require('../error.js'),
	qs = require('qs'),
	fs = require('fs'),
	https = require('https'),
	FormData = require('form-data');

function Strategy(options, verify) {
  options = options || {};
  options.tokenURL = options.tokenURL || 'https://api.twitter.com/oauth/access_token';

	this.oauth = new OAuth(
		"http://twitter.com/oauth/request_token",
		"http://twitter.com/oauth/access_token",
		options.clientID,
		options.clientSecret,
		"1.0A", null, "HMAC-SHA1");

  this.name = 'twitter';

  this.profileURL = options.profileURL || 'https://api.twitter.com/1.1/account/settings.json';
  // https://developers.facebook.com/docs/reference/api/user/#friends
  this.friendsURL = options.friendsURL || 'http://api.twitter.com/1.1/friends/ids.json';
  // https://developers.facebook.com/docs/reference/api/post/
  this.postURL = options.postURL || 'http://api.twitter.com/1.1/statuses/update.json'

  this.postPhotoURL = options.postPhotoURL || 'http://api.twitter.com/1.1/statuses/update_with_media.json'
}

/**
 * Get Friends of oauth provider user
 * 
 * @param  {Object}   options { type: 'oauth', token: accessToken, attributes: { tokenSecret: tokenSecret } }
 * @param  {Function} cb      function(err, results) {} results is array of facebook user IDs
 */
Strategy.prototype.me = function(options, cb) {
	this.oauth.get(this.profileURL, options.token, options.attributes.tokenSecret, function(err, results, response) {
		// standardize results
		if (err) {
			// { statusCode: response.statusCode, data: result }
			// probably a 400, 403?
			console.log('twitter error:', err);
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

		delete results.status;

		var headers = response.headers;
		results.writePermissions = false;
		if (headers['x-access-level'] && headers['x-access-level'] === 'read-write') {
			results.writePermissions = true;
		}

		cb(null, results);
	});
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
 * @param  {Object}   options { type: 'oauth2', token: accessToken, attributes: { tokenSecret: tokenSecret } }
 * @param {Object} post the generic post {body:'', images:['file1.jpg', 'file2.jpg'], link: 'http://blah/', linkTitle: 'A link!', linkDescription: 'This is a link!', linkImage: 'http://blah/file.jpg'}
 * @param  {Function} cb      function (err, results) {}
 */
Strategy.prototype.post = function(options, post, cb) {
	var self = this;

	var twitterPost = {
		status: post.body
	};

	this.oauthPost(twitterPost, options, cb);
}

/**
 * Post photo to twitter
 * 
 * @param  {Object}   options { type: 'oauth', token: accessToken, attributes: { tokenSecret: tokenSecret } }
 * @param {Object} post the generic post {body:'', file:{file:(filepath), content_type:(content-type)} OR string URL}
 * @param  {Function} cb      function (err, results) {}
 */
Strategy.prototype.postPhoto = function(options, post, cb) {
	var self = this;

	var twitterPost = {
		status: post.body
	};

	if (!post.file) {
		// just post?
		return this.oauthPost(this.postURL, twitterPost, options, cb);
	}

	if (typeof post.file === 'String') {
		return cb(new Error('You have not implemented string to file conversion in twitter strategy!'));
		//return this.oauthPost(this.postPhotoURL, facebookPost, options, cb);
	} else if (!post.file.file || !post.file.content_type) {
		cb(new Error("Cannot post files without file and content_type keys."));
	}

	twitterPost.media = post.file.file;

	var form = new FormData();
	form.append('media', fs.createReadStream(twitterPost.media));
	form.append('status', twitterPost.status);

	var httpOptions = {
		method: 'post',
		host: 'api.twitter.com',
		path: '/1.1/statuses/update_with_media.json',
		headers: form.getHeaders()
	}

	httpOptions.headers.Authorization = this.oauth.authHeader(
		'https://api.twitter.com/1.1/statuses/update_with_media.json',
		options.token, options.attributes.tokenSecret, 'POST'
	);

	var request = https.request(httpOptions, function(res) {
		res.on('data', function(d) {
			var result = JSON.parse(d);
			// error data: { errors: [ { message: 'Could not authenticate you', code: 32 } ] }
			if (res.statusCode !== 200) {
				return cb(new Error('Twitter API failed.  Says: ' + result.errors[0].message));
			}
			cb(null, { id:result.id_str });
		});
	});

	form.pipe(request);

	request.on('error', function(error) {
		cb(new Error('Connection to twitter api failed'));
	});

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
}

Strategy.prototype.normalizedProfileWithProfileData = function(profileData) {
	var profileImageURL = profileData.profile_image_url;
    if (profileImageURL) {
		profileImageURL = profileImageURL.replace('_normal.', '.');
    }

	return {
		provider: 'twitter',
		id: profileData.id_str,
		username: profileData.screen_name,
		displayName: profileData.name,
		email: null,
		avatarURL: profileImageURL,

		// Passport compatibility
		emails: [],
		photos: [profileImageURL]
	}
}

/**
 * Expose `Strategy`.
 */
module.exports = Strategy;