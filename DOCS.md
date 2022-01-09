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
console.info(date)
``` 

   you will get a output like this:

```bash 
> kwrun luxon_test.ts
[kwruntime] Compiling: /home/ubuntu/scripts/luxon_test.ts
[kwruntime] Compiling: https://esm.sh/luxon
[kwruntime] Compiling: https://cdn.esm.sh/v43/luxon@2.0.1/es2020/luxon.js
2022-01-04
```

**NOTE**: When you import URLs the content is cached on disk. For this reason is preferrable when you import,  specify an URL containing version, tag, or commit. 

## Using from Node.js

```javascript
const {kwruntime} = require("@kwruntime/core")
kwruntime.import("github://kwruntime/std@808cb57/util/hello.ts")
```

```javascript
const {kwruntime} = require("@kwruntime/core")
main()
async function main(){
    const Luxon = await kwruntime.import("https://esm.sh/luxon@2.3.0")
    const date = Luxon.DateTime.now().toFormat("yyyy-MM-dd")
    console.info(date)
}
```