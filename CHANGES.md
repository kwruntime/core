## 1.1.18 

- Npm import: Allow import of ES6 modules
- Add ```kawix.filename``` property with the fullpath to entry point
- Minor bug fixes.
 

## 1.1.17 

- Revert loader to ```pnpm``` but enable URI params for specify loader: 

```typescript
// use yarn
import "npm://luxon@2.3.0?loader=yarn"
// use pnpm
import "npm://luxon@2.3.0?loader=pnpm"
// use default: pnpm
import "npm://luxon@2.3.0"
```

- Enable ENV_VARIABLES in npm imports: 

```typescript 
// Add env PUPPETEER_SKIP_CHROMIUM_DOWNLOAD = 1
import "npm://puppeteer@13.3.2?ENV_PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=1"
```

- Improve Mac OS support
- Added Mac OS installer

## 1.1.16

- Update the ```yarn``` loader to be always auto-updated
- Update the ```pnpm``` loader to be always auto-updated
- Fixed bug on install 
- Installer now add utils to PATH (downloaded only on first time or updated): ```npm```, ```npx```, ```node-gyp```, ```yarn```, ```yarnpkg```, ```pnpm```, ```pnpx```. This allow compatibility for more modules. For example: 

```typescript
// this module 'beamcoder-prebuild' require 'npx'
// before kwruntime 1.1.16 this line fails:
import beamcoder from 'npm://beamcoder-prebuild@0.6.15-rc.6' 
```


- Rollback default package loader to ```yarn``` . pnpm is not enough mature, has some problems with native modules.



## 1.1.15

- Fix bug on installation as root on Linux



## 1.1.14

- ```Binary typescript``` format (```.kwb``` and ```.kwc``` extension). It's an special format with source code in typescript and binary content, that can be accesed programatically.
The advantage: only source code is loaded, all binary content is only readed when required. No need to convert to base64 the binary content. Good for package app into one file.


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


## 1.1.22

- Fix bug on ```import``` npm modules starting with ```@```