export  interface DesktopConfig{
	id?: string 
	appName: string 
	types: string[]
	title: string
	terminal?: boolean
	
	nodisplay?: boolean
}

export interface ExtensionConfig{
	id?: string 
	type: string
	description: string
	extensions: string[]
	terminal?: boolean
	appName?: string
}



export interface ModuleInfo{
	name: string,
	version: string,
	main?: string,
	folder?: string,
	packageJson?: any,
	dependencies?: ModuleInfo[]
}


export interface ModuleImportInfo{
	mode?: string,
	filename?: string
	module?: any,
	exports?:any,
	builtin?: boolean
	request?: string 
	items?: Array<ModuleInfo>,
	moduleLoader?: any,
	load?(): any,
	vars?: {
		names: string[]
		values: any[]
	}

	content?: string,
	result?: {
		code: string
		ast?: any
	}

	location?: {
		folder: string,
		main: string
	}

	executed?: boolean
	requires?: string[]
	preloadedModules?: ModuleImportInfo[]
}

export interface Loader{
	compile(filename:string, module: any, options: any): Promise<CompiledResult>
	preload?(module: any, filename: string, defaultPreload: Function): void
}

export interface CompiledResult{
	content?: string,
	requires: string[],
	result: {
		code: string,
		ast?: any
	},
	stat?: {
		mtimeMs: number
	}
}


export interface Kawix{
	filename: string
	appArguments: string[]
	mainFilename: string 
	optionsArguments: string[]
	originalArgv: string[]
	customImporter : Array<Function>
	customImportInfo : Array<Function>

	argv?: string[]
	version?: string 
	installer: any 
	executable: {
		cmd: string 
		args: string[]
	}
	packageLoader: string

	getData(filename:string, name: string): any 
	setData(filename: string, name: string, value:any) : void 
	svgIcon?: string
	requireSync?(request: string, parent:any): any 
	getBinary?(filename: string): any 
	importResolve(request: string, parent: any): any 
	importFromInfo(info: ModuleImportInfo)
	import(request: string, parent?: any): Promise<any>
	importInfo(request: string, parent?:any): Promise<ModuleImportInfo>
	compileSource(source: string, options?: any): Promise<CompiledResult>
	defaultExecute(info: ModuleImportInfo, exports:any): Promise<any>
	defaultCompileAndExecute(module:any,meta:any, scope?: Map<string, any>): Promise<any>
	defaultCompile(module:any, meta?:any, scope?: Map<string, any>): Promise<ModuleImportInfo>

}

export interface KawixStatic{
	packageLoaders: {[key:string]: string}
	getData(filename:string, name: string): any 
	setData(filename: string, name: string, value:any) : void 
}



export interface KModuleLoader{
	
	extensions: any 
	extensionCompilers: any 
	injectImport()
	injectImports()
	disableInjectImport()

	getData(name: string):any
	addVirtualFile(name: string, data:any): void
	addExtensionLoader(name: string, loader: any): void 
	import(name: string, parent?: any):Promise<any>
}


function _kawix(): Kawix{
	return global.kawix 
}
function _Kawix(): KawixStatic{
	return global.Kawix
}

function _KModule(): KModuleLoader{
	return this["KModule"]
}

export var kawix = _kawix()
export var Kawix = _Kawix()
export var KModule = _KModule()