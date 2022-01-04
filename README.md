# kwruntime

kwruntime is a custom nodejs runtime inspired by Deno / Babel. Is the best of both worlds, the simplicity of importing urls and typescript, with all nodejs ecosystem. kwruntime is fast and doesn't have depedencies. Can work as a module for nodejs, or as a runtime. 

- Supports typescript out the box
- Full ES2020 Syntax
- Dynamic import supported
- Import from urls with ESM syntax
- Import from NPM in one line with ESM syntax
- Import from github and gitlab with ESM syntax
- Full nodejs ecosystem 

```kwruntime``` is the replacement of ```@kawix/core```


## Installation

There are many options for installing kwruntime. You can install in any nodejs supported platform: Linux, Windows, Mac, Android, etc.

In Android you can install using Termux  (recommended Termux from F-Droid)


* Linux (supported: ```x64, armv7, arm64```)

```bash
curl https://cdn.jsdelivr.net/gh/kwruntime/core@986e359/install/linux.sh | bash
``` 

* Android (with Termux)

```bash 
curl https://cdn.jsdelivr.net/gh/kwruntime/core@a60e7b8/install/android.sh | bash
```

* Linux, Mac, Android with ```nodejs``` (please version 12 or higher)

Prerequisites:  Install nodejs from [https://nodejs.org/es/download/](https://nodejs.org/es/download/) or using distro package manager.
In Android Termux you can install using: ```pkg install nodejs-lts``` or ```pkg install nodejs```

```bash
curl https://cdn.jsdelivr.net/gh/kwruntime/core@986e359/install/node.sh | bash
``` 

* Windows 

Installer 32/64 bits: [https://github.com/kwruntime/core/releases/tag/win32-installer](https://github.com/kwruntime/core/releases/tag/win32-installer)

Automatically download last version.

* Install from git in any node supported platform (Linux, Mac, Windows, Android, etc)

```bash 
> git clone https://github.com/kwruntime/core kwruntime
> cd kwruntime
> node index --self-install
```

* Install from NPM registry

```bash
npm install -g @kwruntime/core

# or 

yarn global add @kwruntime/core

# or 

pnpm add @kwruntime --global
```

* Execute without install 

```bash 
npx @kwruntime/core github://kwruntime/std@808cb57/util/hello.ts
```



## Get started

- Import from github/gitlab

```bash 
# Syntax: github://USER/Repo@Tag_or_Commit/path/to/script.ts 
> kwrun "github://kwruntime/std@808cb57/util/hello.ts"
[kwruntime] Compiling: https://raw.githubusercontent.com/kwruntime/std/808cb57/util/hello.ts
Welcome to @kwruntime/core 🥝😉
``` 

You can also import from gitlab.com using ```gitlab://```


- Import any **npm module** in one line (internally uses yarn, but maybe will use pnpm in the future)

```typescript
import Express from 'npm://express@4.17.1'

main()
async function main(){
    const app = Express() 
    app.get('/', function (req, res) {
        res.send('Hello World')
    })

    app.listen(3000)
    console.info("HTTP Server running on 127.0.0.1:3000")
}
```



- Import from URLs (like deno), for example import **npm modules** in one line using [esm.sh](https://esm.sh)

```typescript
import * as Luxon from "https://esm.sh/luxon@2.3.0"
const date = Luxon.DateTime.now().toFormat("yyyy-MM-dd")
``` 

   you will get a output like this:

```bash 
> kwrun luxon_test.ts
[kwruntime] Compiling: /home/ubuntu/scripts/luxon_test.ts
[kwruntime] Compiling: https://esm.sh/luxon
[kwruntime] Compiling: https://cdn.esm.sh/v43/luxon@2.0.1/es2020/luxon.js
2022-01-04
```

    NOTE: When you import URLs the content is cached on disk. For this reason is preferrable when you import,  specify an URL containing version, tag, or commit. 




## Plugin for VSCode

You can get intelissense in your editor using: [https://github.com/kwruntime/vscode-plugin](https://github.com/kwruntime/vscode-plugin)


## Contribute

Contributors are welcome. 