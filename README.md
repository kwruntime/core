# kwruntime

kwruntime is a custom nodejs runtime inspired by Deno / Babel. Is the best of both worlds, the simplicity of importing urls and typescript, with all nodejs ecosystem. 

- Supports typescript out the box
- Full ES2020 Syntax
- Import from urls with ESM syntax
- Import from npm modules one liner, ESM syntax
- Full nodejs ecosystem 


## Installation

Use the script available for install (recommended). 

* Linux 

```bash
curl https://cdn.jsdelivr.net/gh/kwruntime/core@b649707/install/linux.sh | bash
``` 


Alternatively you can install with node. This generate executable files (.cmd on windows) and sets the **PATH** environment variable. 

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

