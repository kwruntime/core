## Installation

There are many options for installing kwruntime. You can install in any nodejs supported platform: Linux, Windows, Mac, Android, etc.

In Android you can install using Termux  (recommended Termux from F-Droid).

Available options for install:

1. **Using node.js** for all platforms supported: (Linux, Mac OS, Windows, Android)

	* Install [nodejs](https://nodejs.org/en/download/) version 14 or superior.

	* From cmd/terminal:
	
	```bash
	npx @kwruntime/installer
	``` 

	You can use `pnpx` if you prefer.


2. **Linux** (supported: ```x64, armv7, arm64```)

	```bash
	curl https://cdn.jsdelivr.net/gh/kwruntime/core@2bd3f1c/install/linux.sh | bash
	``` 

3. **Mac OS** (supported: ```x64, arm64```)

	```bash
	curl https://cdn.jsdelivr.net/gh/kwruntime/core@9b00f0a/install/mac.sh | bash
	``` 

4. **Windows** 

	If windows prompts false virus alert, please disable antivirus, or install using ```NodeJs``` like explained on method 1 here.

	Windows Instalers: [Go to downloads](https://github.com/kwruntime/installer/releases).

	The installer automatically download latest version for 32/64 bits.


5. **Android** (with Termux)

	You can use this way if "using node.js" not working
	```bash 
	curl https://cdn.jsdelivr.net/gh/kwruntime/core@2bd3f1c/install/android.sh | bash
	```

## Installer project

If you are interested on see the source code of installer see here: [kwruntime/installer](https://github.com/kwruntime/installer)