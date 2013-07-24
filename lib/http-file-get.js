var path = require('path'),
	http = require('http'),
	fs = require('fs'),
	os = require('os'),
	crypto = require('crypto'),
	mime = require('mime');

/**
 * Download a file via http, store at temp location on fs, return file info in cb
 * @param  {[type]}   fileUrl [description]
 * @param  {Function} cb      [description]
 * @return {[type]}           [description]
 */
exports.saveTemporaryFileWithUrl = function(fileUrl, cb) {
	var ext = path.extname(fileUrl);
	var basename = path.basename(fileUrl);
	var tempDir = path.normalize(os.tmpDir() + path.sep);
	var dest = tempDir + 'HttpFileGet_' + crypto.randomBytes(4).readUInt32LE(0) + ext;
	var file = fs.createWriteStream(dest);
	var request = http.get(fileUrl, function(response) {
		response.pipe(file);
		file.on('finish', function() {
			file.close();
			getFileInfo(dest, function(err, fileInfo) {
				fileInfo.originalName = basename;
				cb(null, fileInfo);
			});
		});
	});
}

/**
 * Remove file, convenience
 * @param  {String}   file filepath or .path
 * @param  {Function} cb optional, uses unlink vs. unlinkSync
 * @api public
 */
exports.remove = function(file, cb) {

	var filePath;
	if (file.path) {
		filePath = file.path;
	} else {
		filePath = file;
	}
	if (cb && typeof cb === 'function') {
		fs.unlink(filePath, cb);
	} else {
		return fs.unlinkSync(filePath);
	}
}

/**
 * Private
 */

var contentType = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif'
};

/**
 * Get file info
 *
 * @param {String} file
 * @param {Function} cb
 * @api private
 */

function getFileInfo (file, cb) {
  var f = {
    size: fs.statSync(file).size,
    type: mime.lookup(file),
    name: file.split('/')[file.split('/').length - 1],
    path: file
  };
  file = f;
  cb(null, file);
}
