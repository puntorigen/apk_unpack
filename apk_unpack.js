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

// apktool
java.classpath.push(__dirname+path.sep+'java/apktool_2.2.2.jar');
// jd-cli
java.classpath.push(__dirname+path.sep+'java/jd-cli.jar');
// add classes for DEX 2 JAR
java.classpath.push(__dirname+path.sep+'java/dex2jar/'+'antlr-runtime-3.5.jar');
java.classpath.push(__dirname+path.sep+'java/dex2jar/'+'asm-debug-all-4.1.jar');
java.classpath.push(__dirname+path.sep+'java/dex2jar/'+'d2j-base-cmd-2.0.jar');
java.classpath.push(__dirname+path.sep+'java/dex2jar/'+'d2j-jasmin-2.0.jar');
java.classpath.push(__dirname+path.sep+'java/dex2jar/'+'d2j-smali-2.0.jar');
java.classpath.push(__dirname+path.sep+'java/dex2jar/'+'dex-tools-2.0.jar');
java.classpath.push(__dirname+path.sep+'java/dex2jar/'+'dex-ir-2.0.jar');
java.classpath.push(__dirname+path.sep+'java/dex2jar/'+'dex-reader-api-2.0.jar');
java.classpath.push(__dirname+path.sep+'java/dex2jar/'+'dex-writer-2.0.jar');
java.classpath.push(__dirname+path.sep+'java/dex2jar/'+'dex-translator-2.0.jar');
java.classpath.push(__dirname+path.sep+'java/dex2jar/'+'dex-reader-2.0.jar');
java.classpath.push(__dirname+path.sep+'java/dex2jar/'+'dx-1.7.jar');

//
var	classes 	= 	{
	ApkDecoder 		: 	java.import('brut.androlib.ApkDecoder'),
	libResources 	: 	java.import('brut.androlib.res.AndrolibResources'),
	ExtFile 		: 	java.import('brut.directory.ExtFile'),
	File 			:	java.import('java.io.File'),
	//dex2jar
	_dex2jar 	 	: 	java.import('com.googlecode.d2j.dex.Dex2jar'),
	_dexFileReader	: 	java.import('com.googlecode.d2j.reader.DexFileReader'),
	_dexZipUtil		: 	java.import('com.googlecode.d2j.reader.zip.ZipUtil'),
	//jd-cli
	_jdCli 					: 	java.import('jd.cli.Main'),
	_jdCli_DirOutput 		: 	java.import('jd.core.output.DirOutput'),
	_jdCli_MultiOutput 		: 	java.import('jd.core.output.MultiOutput'),
	_jdCli_JavaDecompiler 	: 	java.import('jd.ide.intellij.JavaDecompiler')
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
		// decrypt dex into jar, using dex2jar
		dexToJar(function() {
			// get java code using jd-cli
			var _dir = new classes.File(_last.dir + 'src' + path.sep);
			var _dexjar = new classes.File(_last.dir + 'classes.jar');
			console.log('decompiling classes.jar to: ',_last.dir + 'src' + path.sep);
			var outPlugins = java.newInstanceSync("java.util.ArrayList");
			outPlugins.addSync(new classes._jdCli_DirOutput(_dir));
			var outputPlugin = new classes._jdCli_MultiOutput(outPlugins);
			var inOut = classes._jdCli.getInOutPluginsSync(_dexjar, outputPlugin);
			var javaDecompiler = new classes._jdCli_JavaDecompiler();
			inOut.getJdInputSync().decompileSync(javaDecompiler, inOut.getJdOutputSync());
			onReady();
		});
	});
};

var dexToJar = function(onReady) {
	// decrypt dex into jar, using dex2jar
	_last.dex  		=  	_last.dir + 'classes.dex';
	_last.dexjar 	=  	_last.dir + 'classes.jar';
	var _dex 		= 	new classes.File(_last.dex);
	var _dexjar 	= 	new classes.File(_last.dexjar);
	// delay for releaasing classes.dex 
	setTimeout(function(){
		var _reader 	= 	new classes._dexFileReader(_dex);
		classes._dex2jar.fromSync(_reader).toSync(_dexjar.toPathSync());
		onReady();
	}, 300);
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
						onReady();
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