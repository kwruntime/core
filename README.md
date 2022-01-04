# kwruntime

kwruntime is a custom nodejs runtime inspired by Deno / Babel. Is the best of both worlds, the simplicity of importing urls and typescript, with all nodejs ecosystem. 

- Supports typescript out the box
- Full ES2020 Syntax
- Import from urls with ESM syntax
- Import from npm modules one liner, ESM syntax
- Full nodejs ecosystem 


## Installation

Here the options for install. In Android you can install using Termux  (please download Termux from F-Droid)



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

Installer autoupdated 32/64 bits: [https://github.com/kwruntime/core/releases/tag/win32-installer](https://github.com/kwruntime/core/releases/tag/win32-installer)

* Install from git in any node supported platform (Linux, Mac, Windows, Android, etc)

```bash 
> git clone https://github.com/kwruntime/core kwruntime
> cd kwruntime
> node index --self-install
```

## Get started

- Using the example extracted from deno (import url, typescript file).

```bash 
> kwrun "https://cdn.deno.land/std/versions/0.102.0/raw/examples/welcome.ts"
[kwruntime] Compiling: https://cdn.deno.land/std/versions/0.102.0/raw/examples/welcome.ts
Welcome to Deno!
``` 

- Import **npm modules** in one line using [esm.sh](https://esm.sh)

Use ```target=node```

```typescript
import * as Luxon from "https://esm.sh/luxon?target=node"
const date = Luxon.DateTime.now().toFormat("yyyy-MM-dd")
``` 



- Import any **npm module** in one line (internally uses yarn)

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


- Import from URLs (like deno)

```typescript
import {DateTime} from 'https://esm.sh/luxon'
console.info(DateTime.fromMillis(Date.now()).toFormat("yyyy-MM-dd"))
```

   you will get a output like this:

```bash 
> kwrun luxon_test.ts
[kwruntime] Compiling: /home/ubuntu/scripts/luxon_test.ts
[kwruntime] Compiling: https://esm.sh/luxon
[kwruntime] Compiling: https://cdn.esm.sh/v43/luxon@2.0.1/es2020/luxon.js
2021-07-21
```

