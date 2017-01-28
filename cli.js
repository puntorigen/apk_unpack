/*
ti_unpack CLI
Commandline utility to unpack Appcelerator Titanium resources from a compiled APK
Usage:
node cli.js apkfile.apk outputdirectory 
*/
var apk			=	require('./apk_unpack'),		// extract(apkfile, outputdir, onReadyCB)
	args 		= 	process.argv.slice(2),
	fs 			=	require('fs'),
	path 		=	require('path'),
	cur_dir 	= 	process.cwd();
var _apk, _dir;

console.log('Appcelerator Titanium - APK unpacker');
if (args.length==2) {
	_apk = args[0], 
	_dir = path.join(cur_dir,args[1]); // assume output dir is subdir of current one.
	if (args[1].charAt(0)==path.sep) {
		_dir = args[1];	// if directory starts with a path separator, then we assume its an absolute directory.
	}
	console.log('Unpacking '+_apk+' into '+_dir);
	apk.extract(_apk,_dir, 
		function(err1) { 
			if (!err1) {
				console.log('Ready!');
			}
		}
	);
} else {

	console.log('Usage: cli apkfile.apk outputdirectory');
}