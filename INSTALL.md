## Installation

There are many options for installing kwruntime. You can install in any nodejs supported platform: Linux, Windows, Mac, Android, etc.

In Android you can install using Termux  (recommended Termux from F-Droid).

This ways include file associations. 

* **Using node.js** for all platforms supported: (Linux, Mac OS, Windows, Android)

1. Install [nodejs](https://nodejs.org/en/download/) version 14 or superior.

2. From cmd/terminal:
 
```bash
npx @kwruntime/installer
``` 

You can use `pnpx` if you prefer.


* **Linux** (supported: ```x64, armv7, arm64```)

```bash
curl https://cdn.jsdelivr.net/gh/kwruntime/core@2bd3f1c/install/linux.sh | bash
``` 

* **Mac OS** (supported: ```x64, arm64```)

```bash
curl https://cdn.jsdelivr.net/gh/kwruntime/core@9b00f0a/install/mac.sh | bash
``` 

* **Windows** 

If you use Windows 8 or superior, it's recommended install using `npx` command (included with nodejs).
Instaler: [Go to downloads](https://github.com/kwruntime/installer/releases).

The installer automatically download latest version.


* **Android** (with Termux)

```bash 
curl https://cdn.jsdelivr.net/gh/kwruntime/core@2bd3f1c/install/android.sh | bash
```

## Installer project

If you are interested on see the source code of installer see here: [kwruntime/installer](https://github.com/kwruntime/installer)