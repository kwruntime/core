## Installation

There are many options for installing kwruntime. You can install in any nodejs supported platform: Linux, Windows, Mac, Android, etc.

In Android you can install using Termux  (recommended Termux from F-Droid)


* Linux (supported: ```x64, armv7, arm64```)

```bash
curl https://cdn.jsdelivr.net/gh/kwruntime/core@b4b5450/install/linux.sh | bash
``` 

* Windows (recommended way)

Installer 32/64 bits: [Go to downloads](https://github.com/kwruntime/win32-installer/releases).

The installer automatically download latest version.


* Android (with Termux)

```bash 
curl https://cdn.jsdelivr.net/gh/kwruntime/core@b4b5450/install/android.sh | bash
```

* Linux, Mac, Android with ```nodejs``` (please version 12 or higher)

Prerequisites:  Install nodejs from [https://nodejs.org/es/download/](https://nodejs.org/es/download/) or using distro package manager.
In Android Termux you can install using: ```pkg install nodejs-lts``` or ```pkg install nodejs```

```bash
curl https://cdn.jsdelivr.net/gh/kwruntime/core@b4b5450/install/node.sh | bash
``` 


* Install from git in any node supported platform (Linux, Mac, Android, etc)

```bash 
> git clone https://github.com/kwruntime/core kwruntime
> cd kwruntime
> node generate
> node index --self-install
```

* Install using package manager (any nodejs supported platform, on windows this may not work use the installer)

```bash
npm install -g @kwruntime/core
kwrun --self-install
# or 
yarn global add @kwruntime/core
kwrun --self-install
# or
pnpm add @kwruntime --global
kwrun --self-install
```
