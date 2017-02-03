// APK Asset unpack - uses apktool.
// helper for cli.js
var	fs 			=	require('fs'),
	lineReader 	=	require('line-reader'),
	java 		= 	require('java'),
	path 		= 	require('path'),
	_last		= 	{ dir:'' },
	cwd 		= 	process.cwd(),
	_config 	= 	{
		apk 		: 	'',
		java 		: 	true,
		dir 		: 	''
	};

// capture console out
/*var access = fs.createWriteStream(cwd + path.sep + 'apk_unpack.log');
process.stdout.write = process.stderr.write = access.write.bind(access);*/

// add classes for JADX and apktool
java.classpath.pushDir(__dirname+path.sep+'java/jadx/');
java.classpath.pushDir(__dirname+path.sep+'java/');
java.options.push('-Xrs'); // reduce signal os signals 
//

var	classes 	= 	{
	ApkDecoder 		: 	java.import('brut.androlib.ApkDecoder'),
	libResources 	: 	java.import('brut.androlib.res.AndrolibResources'),
	ExtFile 		: 	java.import('brut.directory.ExtFile'),
	File 			:	java.import('java.io.File'),
	//jadx
	_jadx 			: 	java.import('jadx.api.JadxDecompiler'),
	_jadx_args		: 	java.import('jadx.cli.JadxCLIArgs'),
	_javalog 		: 	java.import('java.util.logging.LogManager'),
	_jadx_javaclass	: 	java.import('jadx.api.JavaClass'),
	_jadx_classnode	: 	java.import('jadx.core.dex.nodes.ClassNode'),
};

var init = function(config) {
	for (var i in config) {
		_config[i] = config[i];
	}
	// prepare apk and outputdir location
	var _apk = _config.apk, _outd = _config.dir;
	if (_config.apk.charAt(0)!=path.sep && _config.apk.charAt(0)!='~') {
		_config.full_apk = path.join(cwd,_config.apk);
	}
	if (_config.dir.charAt(_config.dir.length-1)!=path.sep) {
		// if outputdir doesn't end in / or path separator, add it.
		_config.full_dir = _config.dir+''+path.sep;
	}
	// turn standard java logger off
	classes._javalog.getLogManagerSync().resetSync();
};

var extractAPK = function(cb) {
	if (fileExists(_config.apk)) {
		_last.dir = _config.full_dir;
		var decoder = new classes.ApkDecoder();
		var _apkfile = new classes.File(_config.full_apk);
		decoder.setForceDeleteSync(true);
		decoder.setDecodeResourcesSync(java.newShort(256));	// exclude resources
		decoder.setOutDirSync(new classes.File(_config.full_dir));
		decoder.setApkFileSync(_apkfile);
		decoder.decodeSync();
		// try to decrypt manifest
		// get Resources Table
		var _res = decoder.getResTableSync();
		var _ext = new classes.ExtFile(_apkfile);
		var _lib = new classes.libResources();
		_lib.decodeManifest(_res, _ext, new classes.File(_config.full_dir), function() {
			cb(true);
		});
	} else {
		cb(false);
	}
};

var decompile = function(onReady) {
	// extract classes.dex into output
	extract_dex(function() {
		// decrypt dex into src, using jadx
		var _dir = new classes.File(_last.dir + 'src' + path.sep);
		var _dex = new classes.File(_last.dir + 'classes.dex');
		var _dexs = java.newInstanceSync("java.util.ArrayList");
		_dexs.addSync(_dex);
		var _args = new classes._jadx_args();
		_args.setOutputDir(_dir);
		var jadx = new classes._jadx(_args);
		jadx.setOutputDir(_dir);
		//get sources manually, to avoid threads
		/*jadx.loadFiles(_dexs, function() {
			console.log('requesting classes:');
			var _j_classes = jadx.getClassesSync();
			console.log('got classes:',_j_classes);
			for (var _o in _j_classes) {
				//var _cl_node = new classes._jadx_classnode();
				var cls = new classes._jadx_javaclass(_j_classes[_o], jadx);
				console.log(cls);
				//.decompile(function(){
				//	console.log('decompiling class:'+_o);
				//});
			}
		});*/
		/**/
		jadx.loadFiles(_dexs, function() {
			jadx.save(function() {
				onReady();
			});
		});/**/
	});
};

var extract_dex = function(onReady) {
	// extract classes.dex from apk into outputdir.
	var yauzl = require('yauzl');
	yauzl.open(_config.apk, { lazyEntries: false }, function(err,zipfile) {
		if (err) throw err;
		//  zipfile.readEntry();
		zipfile.on('entry', function(entry) {
			if (!/\/$/.test(entry.fileName)) {
				// file
				zipfile.openReadStream(entry, function(err2, readStream) {
					//if (err2) throw err2;
					if (entry.fileName=='classes.dex') {
						readStream.pipe(fs.createWriteStream(_last.dir + entry.fileName));
						zipfile.close();
						setTimeout(function(){
							onReady();	
						}, 350); // delay for zip to release lock on dex
					}
				});
			}
		});
	});
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

exports.init = init;
exports.extract = extractAPK;
exports.decompile = decompile;
exports.info = info;