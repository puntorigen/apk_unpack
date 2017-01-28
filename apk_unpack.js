// APK Asset unpack - uses apktool.
// helper for cli.js
var	fs 			=	require('fs'),
	lineReader 	=	require('line-reader'),
	java 		= 	require('java'),
	path 		= 	require('path'),
	_last		= 	{ dir:'' },
	cwd 		= 	process.cwd();
	
java.classpath.push(__dirname+path.sep+'java/apktool_2.2.2.jar');
var	classes 	= 	{
	ApkDecoder 		: 	java.import('brut.androlib.ApkDecoder'),
	libResources 	: 	java.import('brut.androlib.res.AndrolibResources'),
	ExtFile 		: 	java.import('brut.directory.ExtFile'),
	File 			:	java.import('java.io.File')
};

var extractAPK = function(apkfile, outputdir, cb) {
	var _apk = apkfile,
		_outd = outputdir;
	if (_apk.charAt(0)!=path.sep && _apk.charAt(0)!='~') {
		_apk = path.join(cwd,_apk);
	}
	if (_outd.charAt(_outd.length-1)!=path.sep) {
		// if outputdir doesn't end in / or path separator, add it.
		_outd = _outd+''+path.sep;
	}
	//console.log('apkfile:'+_apk,outputdir);
	/*if (!dirExists(outputdir)) {
		fs.mkdirSync(outputdir);
	}*/
	if (fileExists(apkfile)) {
		_last.dir = _outd;
		var decoder = new classes.ApkDecoder();
		var _apkfile = new classes.File(_apk);
		decoder.setForceDeleteSync(true);
		decoder.setDecodeResourcesSync(java.newShort(256));	// exclude resources
		decoder.setOutDirSync(new classes.File(_outd));
		decoder.setApkFileSync(_apkfile);
		decoder.decodeSync();
		// try to decrypt manifest
		// get Resources Table
		var _res = decoder.getResTableSync();
		var _ext = new classes.ExtFile(_apkfile);
		var _lib = new classes.libResources();
		_lib.decodeManifest(_res, _ext, new classes.File(_outd), function() {
			cb(true);
		});
	} else {
		cb(false);
	}
};

var info = function(callback) {
	// to be called after 'extractAPK', gets info about APK from decoded AndroidManifest.xml
	var cheerio = require('cheerio');
	var reply = {};
	var _manifest = _last.dir + 'AndroidManifest.xml';
	if (fileExists(_manifest)) {
		fs.readFile(_manifest, function(err,_data) {
			if (err) callback(true,{});
			var $ = cheerio.load(_data, { xmlMode:true });
			reply['package'] = $('manifest[package]').attr('package');
			reply['versionCode'] = $('manifest').attr('android\:versionCode');
			reply['versionName'] = $('manifest').attr('android\:versionName');
			reply['appName'] = $('manifest application').attr('android\:label');
			reply['_dir'] = _last.dir;
			callback(false, reply);
		});
	} else {
		console.log('apk_unpack -> run \'extract\' method before \'info\'.');
		callback(true, {})
	}
};

var fileExists = function(filePath)
{
    try
    {
        return fs.statSync(filePath).isFile();
    }
    catch (err)
    {
        return false;
    }
}

var dirExists = function(filePath)
{
    try
    {
        return fs.statSync(filePath).isDirectory();
    }
    catch (err)
    {
        return false;
    }
}

exports.extract = extractAPK;
exports.info = info;