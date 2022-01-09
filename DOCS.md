## Get started

- Typescript support out the box

This code runs directly with kwruntime 

```typescript
class Program{
    static hello(name: string){
        console.info(`Hello ${name}, your welcome`)
    }
}
```

- ES2020 Syntax 

```typescript
function show(item?: any){
    console.info(item?.name ?? 'nothing') 
}
function thisPath(){
    return import.meta.url
}


show() // shows nothing 
show({name: 'Admin'}) // show Admin 
show({name: false}) // show false
console.info(thisPath()) // show the url to file (http, https of file protocol)
```

- Dynamic import supported
```typescript
main()
async function main(){
    const Express = await import('npm://express@4.17.1')
    const app = Express() 
    app.get('/', function (req, res) {
        res.send('Hello World')
    })

    app.listen(3000)
    console.info("HTTP Server running on 127.0.0.1:3000")
}   
```

- Import from github/gitlab, typescript support out of the box

```bash 
# Syntax: github://USER/Repo@Tag_or_Commit/path/to/script.ts 
> kwrun "github://kwruntime/std@808cb57/util/hello.ts"
[kwruntime] Compiling: https://raw.githubusercontent.com/kwruntime/std/808cb57/util/hello.ts
Welcome to @kwruntime/core 🥝😉
``` 

You can also import from gitlab.com using ```gitlab://```


- Import any **npm module** in one line (by default uses internally pnpm to install modules)

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


- Import  **npm module** with native addons:

```typescript
import sharp from 'npm://sharp@0.29.3'

main()
async function main(){
    // process.argv[1] is kwruntime main file
    await sharp(process.argv[2])
        .resize(320, 240)
        .toFile('output.webp', (err, info) => { ... });    
}
```


- Import from URLs like deno (you can use esm.sh to import npm modules)

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