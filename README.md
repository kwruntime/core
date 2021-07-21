# kwruntime

kwruntime is a custom nodejs runtime inspired by Deno / Babel. Is the best of both worlds, the simplicity of importing urls and typescript, with all nodejs ecosystem. 

- Supports typescript out the box
- Full ES2020 Syntax
- Import from urls with ESM syntax
- Import from npm modules one liner, ESM syntax
- Full nodejs ecosystem 


## Installation

Just now, you can install with node. This generate executable files (.cmd on windows) and set the PATH. 

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




