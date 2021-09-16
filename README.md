![APK Unpack](https://user-images.githubusercontent.com/57605485/133168424-0cae7b07-1e80-454d-b5b3-94a15d73dd23.png)

## INTRO

This package and command-line helps you unpack any APK (get its assets and java sources) and decrypt its manifest.
To install, execute the following on your terminal:

```bash
npm i -g puntorigen/apk_unpack
```

And use it as follows:

```bash
apk_unpack apkfile.apk outputdir
```

As a class, it contains 4 public methods:

### init (config).  
Initializes the component. Accepts an object with keys:<br/>
apk (apkfile to open),<br/>
dir (outputdir),<br/>
java (true if you want the decrypted classes.jar)<br/><br/>

### extract (onReadyCB).  
This does the extraction of assets and sources into the given outputdir.  

### decompile (onReadyCB).
This extracts and decrypts the classes.dex from the given APK, also recovers .java files.

### info (callback(err,data)).  
Retrieves decrypted manifest information about the extracted apkfile from method one.  

## UPDATES
version 1.2.2:
- updated apktool and JADX to latest versions.
- please consider npm java requires python 2.7 to be installed.

version 1.2.1:
- avoided error that hanged the jvm thread sometimes.

version 1.1.9:
- now uses JADX instead of dex2jar and jd-cli. Faster and works better for some apks.
- reduced logging output of java classes.

version 1.1.7-8:
- improved classpath importing

version 1.1.4-6: 
- added ability to decompile classes into .java files

version 1.1.3:
- added ability to extract classes.dex and decode its contents using dex2jar

version 1.1.1:
- Fixed java class location for using command-line as bin

version 1.0.3-9:
- Prettyfied readme.md file
- Add readme.md file
