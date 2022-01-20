## 1.1.15

- Fix bug on installation as root on Linux



## 1.1.14

- Allow select between ```yarn``` and ```pnpm``` as package resolver

```typescript
Kawix.packageLoaders = {
	"yarn": "github://kwruntime/std@1.1.14/package/yarn.ts",
	"pnpm": "github://kwruntime/std@69ec386/package/pnpm.ts"
}
```

```typescript
// you can change the loader in any moment of your code:
import {Kawix, kwruntime} from 'gh+/kwruntime/core@1.1.14/src/kwruntime.ts'

kwruntime.packageLoader = Kawix.packageLoaders["yarn"] // YARN
kwruntime.packageLoader = Kawix.packageLoaders["pnpm"] // PNPM

// also you can specify a custom package resolver
// you can check how works a package resolver on: 
// https://github.com/kwruntime/std/blob/main/package/pnpm.ts

```


- Changed ```yarn``` to ```pnpm``` as default package resolver

- Allow files can be **reloaded** at runtime 

```typescript
// exporting a var kawixDynamic, the runtime check, if file is modified on disk
// is reloaded when called again import
export var kawixDynamic = true 

// or 
export var kawixDynamic = {
	time: 15000 // time in ms when cache is considered up to date
}
```

- Experimental ```esbuild``` transpiler. No ready to use. Can be used instead of internal Babel, using parameter: ```--transpiler=esbuild``` 

	**NOTE:** If you use and have problems, please remove folder: ```~/.kawi/genv2``` on unix systems, or ```%userprofile%\.kawi\genv2``` on windows.