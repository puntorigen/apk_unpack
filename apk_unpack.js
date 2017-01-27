// APK Asset unpack - uses apktool.
// helper for cli.js
var	fs 			=	require('fs'),
	lineReader 	=	require('line-reader'),
	java 		= 	require('java'),
	path 		= 	require('path'),
	_last		= 	{ dir:'' },
	cwd 		= 	process.cwd();
	
java.classpath.push('java/apktool_2.2.2.jar');
var	classes 	= 	{
	ApkDecoder 		: 	java.import('brut.androlib.ApkDecoder'),
	libResources 	: 	java.import('brut.androlib.res.AndrolibResources'),
	ExtFile 		: 	java.import('brut.directory.ExtFile'),
	File 			:	java.import('java.io.File')
};

var extractAPK = function(apkfile, outputdir, cb) {
	var _apk = apkfile;
	if (_apk.charAt(0)!=path.sep && _apk.charAt(0)!='~') {
		_apk = path.join(cwd,_apk);
	}
	//console.log('apkfile:'+_apk,outputdir);
	/*if (!dirExists(outputdir)) {
		fs.mkdirSync(outputdir);
	}*/
	if (fileExists(apkfile)) {
		_last.dir = outputdir;
		var decoder = new classes.ApkDecoder();
		var _apkfile = new classes.File(_apk);
		decoder.setForceDeleteSync(true);
		decoder.setDecodeResourcesSync(java.newShort(256));	// exclude resources
		decoder.setOutDirSync(new classes.File(outputdir));
		decoder.setApkFileSync(_apkfile);
		decoder.decodeSync();
		// try to decrypt manifest
		// get Resources Table
		var _res = decoder.getResTableSync();
		var _ext = new classes.ExtFile(_apkfile);
		var _lib = new classes.libResources();
		_lib.decodeManifest(_res, _ext, new classes.File(outputdir), function() {
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

extractAPK('test/tester.apk',path.join(cwd,'out2' + path.sep), 
	function() { 
		console.log('ready!'); 
		info(function(err,meta) {
			console.log('APK info',meta);
		});
	}
);
/*
try {
	export.extract = extractAPK;
	export.info = info;
} catch(_aa) {
}*/