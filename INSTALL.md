## Installation

There are many options for installing kwruntime. You can install in any nodejs supported platform: Linux, Windows, Mac, Android, etc.

In Android you can install using Termux  (recommended Termux from F-Droid).

This ways include file associations. 


* Linux (supported: ```x64, armv7, arm64```)

```bash
curl https://cdn.jsdelivr.net/gh/kwruntime/core@2bd3f1c/install/linux.sh | bash
``` 

* Mac OS (supported: ```x64, arm64```)

```bash
curl https://cdn.jsdelivr.net/gh/kwruntime/core@9b00f0a/install/mac.sh | bash
``` 

* Windows (recommended way)

Installer 32/64 bits: [Go to downloads](https://github.com/kwruntime/win32-installer/releases).

The installer automatically download latest version.


* Android (with Termux)

```bash 
curl https://cdn.jsdelivr.net/gh/kwruntime/core@2bd3f1c/install/android.sh | bash
```



### Using nodejs/package manager

These installations doesn't include file associations.

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


