APK Unpack
==============================
## INTRO

This package and command-line helps you unpack any APK (get its smali sources) and decrypt its manifest.  
It contains 4 main methods:

### init (config).  
Initializes the component. Can have the keys:<br/>
apk (apkfile to open),<br/>
dir (outputdir),<br/>
java (true if you want the decrypted classes.jar)<br/><br/>

### extract (onReadyCB).  
This does the extraction of assets and sources into the given outputdir.  

### decompile (onReadyCB).
This extracts and decrypts the classes.dex from the given APK, also recovers .java files.

### info (callback(err,data)).  
Retrieves decrypted manifest information about the extracted apkfile from method one.  

## USAGE
It comes with a commandline that you can use as follows:  

**apk_unpack** `apkfile.apk` `outputdir`

## UPDATES

version 1.1.4-6: 
- added ability to decompile classes into .java files

version 1.1.3:
- added ability to extract classes.dex and decode its contents using dex2jar

version 1.1.1:
- Fixed java class location for using command-line as bin

version 1.0.3-9:
- Prettyfied readme.md file
- Add readme.md file