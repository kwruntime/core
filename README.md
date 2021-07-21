# kwruntime

kwruntime is a custom nodejs runtime inspired by Deno / Babel. Is the best of both worlds, the simplicity of importing urls and typescript, with all nodejs ecosystem. 

- Supports typescript out the box
- Full ES2020 Syntax
- Import from urls with ESM syntax
- Import from npm modules one liner, ESM syntax
- Full nodejs ecosystem 


## Installation

Just now, you can install with node. This generate executable files (.cmd on windows) and sets the **PATH** environment variable. 

```bash 
> git clone https://github.com/kwruntime/core kwruntime
> cd kwruntime
> node index --self-install
```

## Get started

Using the example extracted from deno.

```bash 
> kwrun "https://cdn.deno.land/std/versions/0.102.0/raw/examples/welcome.ts"
[kwruntime] Compiling: https://cdn.deno.land/std/versions/0.102.0/raw/examples/welcome.ts
Welcome to Deno!
``` 

Import npm modules in one line using esm.sh
(Coming soon..., waiting esm.sh add node target)


Import any npm module in one line (internally uses yarn)

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




