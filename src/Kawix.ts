import Fs from  'fs'
import Module from 'module'
import Os from 'os'
import Path from 'path'
import crypto from 'crypto'

import util from 'util'
import http from 'http'
import https from 'https'
import {DesktopConfig,ExtensionConfig,ModuleInfo,ModuleImportInfo, Loader, CompiledResult} from './kwruntime'
import Url from 'url'



class Deferred<T> {
	private readonly _promise: Promise<T>
	public resolve: (value?: T | PromiseLike<T>) => void
	public reject: (reason?: any) => void
	constructor () {
		this._promise = new Promise<T>((resolve, reject) => {
			this.resolve = resolve
			this.reject = reject
		})
	}
	get promise (): Promise<T> {
		return this._promise
	}
}



export class KModule{

	$module: null 
	static languages = {
		"json": ".json",
		"javascript": ".js",
		"ecmascript": ".js",
		"typescript": ".ts"
	}

	static extensionCompilers:any = {}
	static extensionLoaders:any = {}

	static $files = new Map<string, any>()

	static addVirtualFile(path: string, filedata: any){
		if(typeof filedata == "function"){
			filedata = filedata()
		}
		this.$files.set(Path.posix.join("/virtual", path), filedata)
	}


	static addExtensionLoader(ext: string, loader: Loader){
		Module["_extensions"][ext] = function(module, filename){
			let defaultPreload = function(){
				module._compile("exports.__kawix__compile = true; exports.__local__vars = { module, require, __dirname, __filename, global, Buffer }; exports.__filename = " + JSON.stringify(filename), filename)
			}
			if(loader.preload){
				loader.preload(module, filename, defaultPreload)
			}
			else{
				defaultPreload()
			}            
		}

		this.addExtensionLoader[ext] = loader
		this.extensionCompilers[ext] = loader.compile
	}

	constructor(module){
		this.$module = module 
	}


	get extensions(){
		let item: any = {}
		for(let id in this.extensionCompilers){
			item[id] = true 
		}
		return item 
	}

	get extensionCompilers(){
		return KModule.extensionCompilers
	}

	get languages(){
		return KModule.languages
	}

	/* backward */
	injectImport(){}
	injectImports(){}
	disableInjectImport(){}
	/* backward */


	getData(name: string) {
		return Kawix.getData(this.$module.__kawix__filename, name)
	}

	addVirtualFile(){
		return KModule.addVirtualFile.apply(KModule, arguments) 
	}


	addExtensionLoader(){
		return KModule.addExtensionLoader.apply(KModule, arguments)
	}


	import(request, parent = null){
		if(!parent) parent = this.$module 
		return global.kawix.import(request, parent)
	}


}



export class Installer{
	$kawix: Kawix 
	constructor(kawix: Kawix){
		this.$kawix = kawix 
	}

	getBinFolder(){

		if(Os.platform() == "linux"  || Os.platform() == "darwin" || Os.platform() == "android"){
			if(process.getuid() == 0){
				return "/usr/KwRuntime/bin"
			}
			else{
				return Path.join(Os.homedir(), "KwRuntime", "bin")
			}
		}
		if(Os.platform() == "win32"){
			return Path.join(Os.homedir(), "KwRuntime", "bin")
		}

	}


	install(href:string, name: string, options: any){

		if(href.endsWith(".kwt")){
			
		}

		let exe = options.executable || "kwrun"
		if(Os.platform() == "linux" || Os.platform() == "darwin" || Os.platform() == "android"){
			let bin = this.getBinFolder()
			let cmd = Path.join(bin, exe)
			let out = Path.join(bin, name)
			Fs.writeFileSync(out, [
				`#!${cmd}`,
				`export {default} from ${JSON.stringify(href)}`,
				`export * from ${JSON.stringify(href)}`
			].join("\n"))
			Fs.chmodSync(out,"775")

			if(options.autostart !== undefined){
				// start with computer 
				let folderAutoStart = Path.join(Os.homedir(), ".config", "autostart-scripts")
				if(!Fs.existsSync(folderAutoStart)){
					Fs.mkdirSync(folderAutoStart)
				}
				Fs.symlinkSync(out, Path.join(folderAutoStart, name))
			}

			console.info("Installed!")
		}
		else if(Os.platform() == "win32"){
			let bin = this.getBinFolder()
			let cmd = Path.join(bin, exe)
			let out = Path.join(bin, name + ".cmd")
			Fs.writeFileSync(out, [
				`@echo off`,
				`"${cmd}" "${href}" %*`
			].join("\n"))

			if(options.autostart !== undefined){
				// start with computer 
				
			}

			console.info("Installed!")
		}
	}


	// install in path
	async selfInstall(){

		if(Os.platform() == "linux" || Os.platform() == "darwin" || Os.platform() == "android"){            
			await this.selfInstallUnix()
			// DISABLE AUTO INSTALL OF KAWIX/CORE
			//await this.installKwcore()
		}
		else if(Os.platform() == "win32"){
			await this.selfInstallWin32()
			// DISABLE AUTO INSTALL OF KAWIX/CORE
			//await this.installKwcore()
		}

		// install utils
		await this.installUtils()
	}

	setExtensions(options: ExtensionConfig){
		if(Os.platform() == "win32"){
			return this.setExtensionsWin32(options.type, options.description, options.extensions, options.terminal, options.appName)
		}
		else if(Os.platform() == "linux"){
			return this.setExtensionsLinux(options)
		}
	}

	async update(){

		let id = parseInt(String(Date.now() / (24*3600000))) + ".json"
		let platform = Os.platform()
		let arch = Os.arch()
		if(arch == "ia32") arch = "x86"

		let pkg = await this.$kawix.import("gh+/kwruntime/core/package.json?date=" + id)
		if(pkg.version != this.$kawix.version){
			
			let info = await this.$kawix.import("gh+/kwruntime/core/install.info.json?date=" + id)
			let files = info[platform]?.files
			if(!files){
				console.error(`> No hay una actualización disponible para su plataforma: ${platform}-${arch}`)
			}
			console.info("> Actualizando a una nueva versión:", pkg.version)
			files = files.filter((a) => a.usage.indexOf("node") >= 0)
			// download files?
			

		}

		
		///TODO


	}


	$linuxGuiPaths(){

		let paths:any = {}
		if (process.getuid() == 0) {

			paths.mainIcon = "/usr/share/icons"
			if(!Fs.existsSync(paths.mainIcon)){
				Fs.mkdirSync(paths.mainIcon)
			}
			paths.icon = Path.join(paths.mainIcon, "hicolor")
			if(!Fs.existsSync(paths.icon)){
				Fs.mkdirSync(paths.icon)
			}

			
			paths.icon = Path.join(paths.icon, "scalable")
			if(!Fs.existsSync(paths.icon)){
				Fs.mkdirSync(paths.icon)
			}

			paths.icon = Path.join(paths.icon, "apps")
			if(!Fs.existsSync(paths.icon)){
				Fs.mkdirSync(paths.icon)
			}

			paths.apps = "/usr/share/applications"
			paths.mime = "/usr/share/mime/packages"
			paths.mimeo = "/usr/share/mime"
		}
		else{
			let local = paths.mainIcon = Path.join(Os.homedir(), ".local")
			if(!Fs.existsSync(local)){
				Fs.mkdirSync(local)
			}
			local = Path.join(local, "share")
			if(!Fs.existsSync(local)){
				Fs.mkdirSync(local)
			}

			paths.mainIcon = Path.join(local, "icons")
			if(!Fs.existsSync(paths.mainIcon)){
				Fs.mkdirSync(paths.mainIcon)
			}
			paths.icon = Path.join(paths.mainIcon, "hicolor")
			if(!Fs.existsSync(paths.icon)){
				Fs.mkdirSync(paths.icon)
			}

			paths.icon = Path.join(paths.icon, "scalable")
			if(!Fs.existsSync(paths.icon)){
				Fs.mkdirSync(paths.icon)
			}

			paths.icon = Path.join(paths.icon, "apps")
			if(!Fs.existsSync(paths.icon)){
				Fs.mkdirSync(paths.icon)
			}

			paths.apps = Path.join(Os.homedir(), ".local/share/applications")
			paths.mime = Path.join(Os.homedir(), ".local/share/mime/packages")
			paths.mimeo = Path.join(Os.homedir(), ".local/share/mime")
		}

		if(!Fs.existsSync(paths.apps)){
			Fs.mkdirSync(paths.apps)
		}
		if (!Fs.existsSync(paths.mimeo)) {
			Fs.mkdirSync(paths.mimeo)
		}
		if (!Fs.existsSync(paths.mime)) {
			Fs.mkdirSync(paths.mime)
		}

		return paths 
	}


	async $saveLinuxIcon(){
		let paths = this.$linuxGuiPaths()
		let iconPath = Path.join(paths.mainIcon, "kwruntimeapp.svg")
		let pngcpath = Path.join(paths.mainIcon, "kwruntimeapp.tar.gz")
		let siconPath = Path.join(paths.icon, "kwruntimeapp.svg")
		Fs.writeFileSync(iconPath, this.$kawix.svgIcon)
		Fs.writeFileSync(pngcpath, this.$kawix.pngCompressedIcons)

		// extract compressed icons 
		await new Promise(function(resolve, reject){
			let p = require("child_process").spawn("tar", ["xvf", "kwruntimeapp.tar.gz"],{
				cwd: paths.mainIcon
			})
			p.on("error", reject)
			p.on("exit", resolve)    
		})
		
		if(Fs.existsSync(siconPath)) Fs.unlinkSync(siconPath)
		await Fs.promises.symlink(iconPath, siconPath)
		

		let er = null
		try{
			// this works on ubuntu
			await new Promise(function(resolve, reject){
				let p = require("child_process").spawn("update-icon-caches", [paths.mainIcon, Path.join(paths.icon,"hicolor")])
				p.on("error", reject)
				p.on("exit", resolve)    
			})
		}catch(e){
			er = e 
		}

		if(er){
			try{
				// this works on opensuse and maybe others
				await new Promise(function(resolve, reject){
					let p = require("child_process").spawn("gtk-update-icon-cache", [paths.mainIcon, Path.join(paths.icon,"hicolor")])
					p.on("error", reject)
					p.on("exit", resolve)    
				})
			}catch(e){
			}
		}
	}


	$removeMimetypes(prefix: string){
		if(prefix){
			let paths = this.$linuxGuiPaths()
			let files = Fs.readdirSync(paths.mime)
			let filep = files.filter((a)=> a.startsWith(prefix))
			for(let file of filep){
				try{
					Fs.unlinkSync(Path.join(paths.mime, file))
				}catch(e){}
			}
		}
	}


	async $desktopFile(config: DesktopConfig){
		
		let $paths = this.$runtimePaths()
		
		config.appName = config.appName || "kwrun"
		let appid = config.id || (config.appName  + "app")
		let kwruntime = Path.join($paths.bin, config.appName)
		let desktopContent = `[Desktop Entry]
Terminal=${Boolean(config.terminal)}
NoDisplay=${Boolean(config.nodisplay)}
Icon=kwruntimeapp
Type=Application
Categories=Application;Network;
Exec="${kwruntime}" %F
MimeType=${config.types.join(";")};
Name=${config.title}
Comment= `
	
		let paths = this.$linuxGuiPaths()
		if(!Fs.existsSync(paths.apps)){
			console.info("> Warning: Detected server installation. Omiting desktop files")
		}
		else{
			Fs.writeFileSync(Path.join(paths.apps, appid + ".desktop"), desktopContent)
			
			
			/*desktopContent = desktopContent.replace("Terminal=false", "Terminal=true")
			//desktopContent = desktopContent.replace("NoDisplay=true", "")
			Fs.writeFileSync(Path.join(paths.apps, appid + "-terminal.desktop"), desktopContent)*/

			try{
				// this works on ubuntu
				await new Promise(function(resolve, reject){
					let p = require("child_process").spawn("update-desktop-database", [paths.apps])
					p.on("error", reject)
					p.on("exit", resolve)    
				})
			}catch(e){   
			}
		}

	}

	async setExtensionsLinux(config: ExtensionConfig){

		try{
			await this.$saveLinuxIcon()
		}catch(e){
			console.info("Warning: Failed installing icon")
		}
		
		let $paths = this.$runtimePaths()
		
		config.appName = config.appName || "kwrun"
		let appid = config.id || (config.appName  + "app")
		let kwruntime = Path.join($paths.bin, config.appName)
		let paths = this.$linuxGuiPaths()
		

		let scon = ['<?xml version="1.0" encoding="UTF-8"?>', '<mime-info xmlns="http://www.freedesktop.org/standards/shared-mime-info">']
		scon.push(`<mime-type type="${config.type}">`)
		scon.push(`<comment xml:lang="en">${config.description}</comment>`)
		for(let ext of config.extensions){
			scon.push(`<glob pattern="*${ext}" />`)
		}
		scon.push(`<icon name="kwruntimeapp"/>`)
		scon.push("</mime-type>")
		scon.push("</mime-info>")


		if(!Fs.existsSync(paths.mime)){
			console.info("> Warning: Detected server installation. Omiting mime files")
		}
		else{
			Fs.writeFileSync(Path.join(paths.mime, appid + "_mimes_" + config.type.replace("/", "") + ".xml"), scon.join("\n"))
			try{
				// this works on ubuntu
				await new Promise(function(resolve, reject){
					let p = require("child_process").spawn("update-mime-database", [paths.mimeo])
					p.on("error", reject)
					p.on("exit", resolve)    
				})
			}catch(e){
			}
		}
	}



	async setExtensionsWin32(type: string, description: string, extensions: string[], terminal = true, appName: string = ""){
		let name = "com.kodhe.com-" + type.replace(/\//g, '-') + (terminal ? 'terminal' : '')
		let def = {
			resolve: null,
			reject: null,
			promise: null 
		}
		def.promise= new Promise(function(a,b){
			def.resolve = a 
			def.reject = b
		})
		

		let extnames = []
		for(let ext of extensions){
			extnames.push(`HKCU\\SOFTWARE\\Classes\\${ext}`)
		}
		let WinReg = null 
		try{
			WinReg = require("winreg-vbs")
		}catch(e){
			// read from npm
			WinReg = await this.$kawix.import("npm://winreg-vbs@1.0.0")
		}
		WinReg.createKey([...extnames, `HKCU\\SOFTWARE\\Classes\\${name}`,
			`HKCU\\SOFTWARE\\Classes\\${name}\\DefaultIcon`, `HKCU\\SOFTWARE\\Classes\\${name}\\Shell`, `HKCU\\SOFTWARE\\Classes\\${name}\\Shell\\open`, `HKCU\\SOFTWARE\\Classes\\${name}\\Shell\\open\\command`], function(err) {
			if(err) def.reject(err)
			def.resolve()
		})
		await def.promise

		def = {
			resolve: null,
			reject: null,
			promise: null 
		}
		def.promise= new Promise(function(a,b){
			def.resolve = a 
			def.reject = b
		})

		let param:any = {}
		for(let ext of extensions){
			param[`HKCU\\SOFTWARE\\Classes\\${ext}`] = {
				'default': {
					value: name,
					type: 'REG_DEFAULT'
				},
				'Content Type': {
					value: type,
					type: 'REG_SZ'
				}
			}
		}

		let kwrun = ''
		if(appName){
			kwrun = Os.homedir() + "\\KwRuntime\\bin\\" + appName + ".exe"
		}
		else{
			if(terminal){
				kwrun = Os.homedir() + "\\KwRuntime\\bin\\kwrun.exe"
			}else{
				kwrun = Os.homedir() + "\\KwRuntime\\bin\\kwrun-gui.exe"
			}
		}

		let iconpath = kwrun
		WinReg.putValue(Object.assign(param,{
			[`HKCU\\SOFTWARE\\Classes\\${name}`]: {
				'default': {
					value: description || `Archivo ${type}`,
					type: 'REG_DEFAULT'
				}
			},
			[`HKCU\\SOFTWARE\\Classes\\${name}\\Shell\\open\\command`]: {
				'default': {
					value: `"${kwrun}" "%1"`,
					type: 'REG_DEFAULT'
				}
			},
			[`HKCU\\SOFTWARE\\Classes\\${name}\\DefaultIcon`]: {
				'default': {
					value: `"${iconpath}",0`,
					type: 'REG_DEFAULT'
				}
			}
		}), function(err) {
			if(err) def.reject(err)
			def.resolve()
		})
		await def.promise
	}



	async selfInstallWin32(){
		let kawixFolder = Path.join(Os.homedir(), "KwRuntime")
		if(!Fs.existsSync(kawixFolder)) Fs.mkdirSync(kawixFolder)
		let utils = Path.join(kawixFolder, "utils")
		if(!Fs.existsSync(utils)) Fs.mkdirSync(utils) 
		let bin = Path.join(kawixFolder, "bin")
		if(!Fs.existsSync(bin)) Fs.mkdirSync(bin) 
		let runtimeFolder = Path.join(kawixFolder, "runtime")
		if(!Fs.existsSync(runtimeFolder)) Fs.mkdirSync(runtimeFolder) 

		if(process.env.PATH.indexOf(bin) < 0){

			// setx path
			let child= require("child_process")
			child.execSync(`setx path "${bin};${utils};%path%"`)

		}

		let defaultExes = {
			term: Path.join(runtimeFolder,"default_executable.dll"),
			gui: Path.join(runtimeFolder,"default_gui_executable.dll")
		}
		if(!Fs.existsSync(defaultExes.term)){
			defaultExes.term = Path.join(runtimeFolder,"default_executable.code")
		}
		if(!Fs.existsSync(defaultExes.gui)){
			defaultExes.gui = Path.join(runtimeFolder,"default_gui_executable.code")
		}
		if(!Fs.existsSync(defaultExes.term)) delete defaultExes.term
		if(!Fs.existsSync(defaultExes.gui)) delete defaultExes.gui
		let writeCmd = function(file:string, text:Buffer | string){
			Fs.writeFileSync(file, text)
			if(defaultExes.term){
				let nfile = Path.join(Path.dirname(file), Path.basename(file, Path.extname(file)) + ".exe")
				let cfile = Path.join(Path.dirname(file), Path.basename(file, Path.extname(file)) + ".exe.config")
				try{
					Fs.writeFileSync(nfile, Fs.readFileSync(defaultExes.term))
					Fs.writeFileSync(cfile, `<configuration>
<startup>
	<supportedRuntime version="v4.0"/>
	<supportedRuntime version="v2.0.50727"/>
</startup>
</configuration>
				  `)

				}catch(e){
					console.error("[WARNING] Failed writing executable wrapper:", nfile)
				}
			}
			if(defaultExes.gui){
				let nfile = Path.join(Path.dirname(file), Path.basename(file, Path.extname(file)) + "-gui.exe")
				let cfile = Path.join(Path.dirname(file), Path.basename(file, Path.extname(file)) + "-gui.exe.config")
				try{
					Fs.writeFileSync(nfile, Fs.readFileSync(defaultExes.gui))
					Fs.writeFileSync(cfile, `<configuration>
<startup>
	<supportedRuntime version="v4.0"/>
	<supportedRuntime version="v2.0.50727"/>
</startup>
</configuration>
				  `)
				}catch(e){
					console.error("[WARNING] Failed writing executable wrapper:", nfile)
				}
			}
		}


		let exe = this.$kawix.executable
		let nodev = process.version.split(".")[0].substring(1)
		let content = `@echo off\r\nset NODE_SKIP_PLATFORM_CHECK=1\r\n"${exe.cmd}" "${exe.args.join('" "')}" %*`
		let binFile = Path.join(bin, "kwrun-n" + nodev + ".cmd")
		Fs.writeFileSync(binFile, content)

		content = `@echo off\r\n"${process.execPath}" %*`
		binFile = Path.join(bin, "node-n" + nodev + ".cmd")
		Fs.writeFileSync(binFile, content)

		
		content = `@echo off\r\nset NODE_SKIP_PLATFORM_CHECK=1\r\n"${exe.cmd}" --insecure-http-parser "${exe.args.join('" "')}" %*`
		binFile = Path.join(bin, "kwrun-legacy-n" + nodev + ".cmd")
		Fs.writeFileSync(binFile, content)
		

		let files = Fs.readdirSync(bin)
		let fileinfo = files.filter((a) => a.startsWith("kwrun-") && a.endsWith(".cmd")).map((a)=> ({name: a, v: a.split("-").slice(-1)[0].split(".")[0].substring(1)}))
		fileinfo.sort((a, b)=> Number(a.v) - Number(b.v))
		if(fileinfo.length){

			let v = fileinfo[fileinfo.length-1].v
			writeCmd(Path.join(bin, "kwrun.cmd"), Fs.readFileSync(Path.join(bin, "kwrun-n" + v + ".cmd")))
			writeCmd(Path.join(bin, "kwrun-legacy.cmd"), Fs.readFileSync(Path.join(bin, "kwrun-legacy-n" + v + ".cmd")))
			//writeCmd(Path.join(bin, "node.cmd"), Fs.readFileSync(Path.join(bin, "node-n" + v + ".cmd")))

			Fs.writeFileSync(Path.join(bin, "node.cmd"), Fs.readFileSync(Path.join(bin, "node-n" + v + ".cmd")))
			//Fs.writeFileSync(Path.join(bin, "kwrun-legacy.cmd"), )
		}

		await this.setExtensions({
			type: "application/kwruntime.script",
			description: "KwRuntime Script",
			extensions: [".kws", ".kw.ts", ".kwc"],
			terminal: true
		})
		await this.setExtensions({
			type: "application/kwruntime.app",
			description: "KwRuntime Application",
			extensions: [".kwr", ".kwb"],
			terminal: false
		})
		await this.setExtensions({
			type: "application/kwruntime.package",
			description: "KwRuntime Package",
			extensions: [".kwt"],
			terminal: false
		})


		let Child= require("child_process")
		try{
			Child.execSync("ie4uinit.exe -ClearIconCache")
		}catch(e){}
		try{
			Child.execSync("ie4uinit.exe -show")
		}catch(e){}
	}

	installKwcore(){
		if(Os.platform() == "win32"){
			return this.installKwcoreWin32()   
		}
		else{
			return this.installKwcoreUnix()
		} 
	}


	$runtimePaths(){
		let kawixFolder = Path.join(Os.homedir(), "KwRuntime")
		if(!Fs.existsSync(kawixFolder)) Fs.mkdirSync(kawixFolder)
		let bin = Path.join(kawixFolder, "bin")
		if(!Fs.existsSync(bin)) Fs.mkdirSync(bin) 
		let src = Path.join(kawixFolder, "src")
		if(!Fs.existsSync(src)) Fs.mkdirSync(src) 
		let runtimeFolder = Path.join(kawixFolder, "runtime")
		if(!Fs.existsSync(runtimeFolder)) Fs.mkdirSync(runtimeFolder) 
		return {
			src,
			runtime: runtimeFolder,
			bin,
			folder: kawixFolder
		}
	}


	async installUtils(){
		// what utils? 
		// npx
		// npm
		// node-gyp

		// yarn?
		// pnpm?

		let kawixFolder = Path.join(Os.homedir(), "KwRuntime")
		if(!Fs.existsSync(kawixFolder)) Fs.mkdirSync(kawixFolder)
		
		let utils = Path.join(kawixFolder, "utils")
		if(!Fs.existsSync(utils)) Fs.mkdirSync(utils)


		let executerContentNode = `#!/usr/bin/env node
		var Path = require('path')
		var Os = require('os')
		let oargs = process.argv.slice(2)
		process.argv = [process.argv[0], process.argv[1]]
		var file  = Path.join(Os.homedir(), 'KwRuntime/runtime/kwruntime.js')
		
		require(file)
		if(oargs.length){
			for(let i=0;i<oargs.length;i++) process.argv.push(oargs[i])
		}
		var Runner = function(){}
		Runner.execute = async function(modname, bin, force){
			let mod= await global.kawix.import(__dirname + "/krun.ts")
			return await mod.Runner.execute(modname,bin,force)
		}
		exports.Runner = Runner 
		`;



		let executerContent = `#!/usr/bin/env kwrun
		import Path from 'path'
		import Os from 'os'
		import fs from 'fs'
		import Child from 'child_process'
		
		export class Runner{
		
		
			static async execute(modname: string, bin: string = '', force:boolean = false){
		
				let kawi = Path.join(Os.homedir(), ".kawi")
				let utils = Path.join(kawi, "utils")
				if(!fs.existsSync(utils)){
					fs.mkdirSync(utils)
				}
		
				let file = Path.join(utils,  modname + ".json")
				let data = null, needcheck = false
				if(fs.existsSync(file)){
					let content = await fs.promises.readFile(file,'utf8')
					try{
						data = JSON.parse(content)
					}catch(e){}
		
					if(data){
						if(Date.now() - data.time > (24*3600000)){
							needcheck = true
						}
					}
				}
				
				if(force) data = null
				needcheck = needcheck || (!data)
				// get last version of npm?
				if(needcheck){
					let uid = parseInt(String(Date.now()/24*3600000)).toString() + ".json"
					let nname = modname 
					if(nname == 'npm'){
						nname += "@9.x"
					}
					else if(nname == 'pnpm'){
						nname += "@7.x"
					}
					let pack = await import("https://unpkg.com/"+nname+"/package.json?date=" + uid)
					
					if(pack.version != data?.version){
		
						console.info("> Installing/Updating "+modname+" version:", pack.version)
						let mod = await import(${JSON.stringify(Kawix.packageLoaders.pnpm)})
						let reg = new mod.Registry()
						data = await reg.resolve(modname + "@" + pack.version)
						data.time = Date.now()
						
					}
				}
		
				if(!data){
					console.error("> Failed to get/install " + modname)
					return process.exit(1)
				} 
		
		
				if(needcheck){
					await fs.promises.writeFile(file, JSON.stringify(data))
				}
				let exe = data.packageJson.bin
				if(typeof exe == "object"){
					exe = exe[bin] || exe[Object.keys(exe)[0]]
				}

		
				let cli = Path.join(data.folder, exe)
				if(!fs.existsSync(cli)){
					cli += ".js"
					if(!fs.existsSync(cli)){
						return this.execute(modname, bin, true)
					}
				}
				let p = Child.spawn(process.execPath, [cli, ...process.argv.slice(2)],{
					stdio:'inherit'
				})
				p.on("exit", (code)=> process.exit(code))
				
		
			}
		}
		`;


		let runfile1 = Path.join(utils, "krun.ts");

	await Fs.promises.writeFile(runfile1, executerContent);

	let runfile = Path.join(utils, "run.js");

	await Fs.promises.writeFile(runfile, executerContentNode); // generate files for each 

	let npm = `#!${process.argv[0]}
		const {Runner} = require(${JSON.stringify(runfile)})
		Runner.execute("npm", "npm")
		`;
	let npx = `#!${process.argv[0]}
		const {Runner} = require(${JSON.stringify(runfile)})
		Runner.execute("npm", "npx")
		`;
	let nodegyp = `#!${process.argv[0]}
		const {Runner} = require(${JSON.stringify(runfile)})
		Runner.execute("node-gyp")
		`;
	let yarn = `#!${process.argv[0]}
		const {Runner} = require(${JSON.stringify(runfile)})
		Runner.execute("yarn", "yarn")
		`;
	let yarnpkg = `#!${process.argv[0]}
		const {Runner} = require(${JSON.stringify(runfile)})
		Runner.execute("yarn", "yarnpkg")
		`;
	let pnpm = `#!${process.argv[0]}
		const {Runner} = require(${JSON.stringify(runfile)})
		Runner.execute("pnpm", "pnpm")
		`;
	let pnpx = `#!${process.argv[0]}
		const {Runner} = require(${JSON.stringify(runfile)})
		Runner.execute("pnpm", "pnpx")
		`;


		let ext = ''
		let files = {
			npm,
			npx,
			"node-gyp": nodegyp,
			yarn,
			yarnpkg,
			pnpm,
			pnpx
		}

		if(Os.platform() == "win32") ext = '.ts'

		for(let id in files){
			let file = Path.join(utils, id + ext)
			await Fs.promises.writeFile(file, files[id])
			if(Os.platform() != "win32")
				await Fs.promises.chmod(file, "775")
		}

		if(Os.platform() == "win32"){
			for(let id in files){
				let file = Path.join(utils, id + ".cmd")
				let filets = Path.join(utils, id + ".ts")
				let content = `@echo off\nset NODE_SKIP_PLATFORM_CHECK=1\n"${process.argv[0]}" "${process.argv[1]}" "${filets}" %*`
				await Fs.promises.writeFile(file, content)
			}
		}

	}


	async installKwcoreWin32(){

		let $paths = this.$runtimePaths()
		let kawixFolder = $paths.folder 
		let bin = $paths.bin
		let runtimeFolder = $paths.runtime

		if(process.env.PATH.indexOf(bin) < 0){
			// setx path
			let child= require("child_process")
			child.execSync(`setx path "${bin};%path%"`)
		}

		let defaultExes = {
			term: Path.join(runtimeFolder,"default_executable.dll"),
			gui: Path.join(runtimeFolder,"default_gui_executable.dll")
		}
		if(!Fs.existsSync(defaultExes.term)) delete defaultExes.term
		if(!Fs.existsSync(defaultExes.gui)) delete defaultExes.gui
		let writeCmd = function(file:string, text:Buffer | string){
			Fs.writeFileSync(file, text)
			if(defaultExes.term){
				let nfile = Path.join(Path.dirname(file), Path.basename(file, Path.extname(file)) + ".exe")
				let cfile = Path.join(Path.dirname(file), Path.basename(file, Path.extname(file)) + ".exe.config")
				try{
					Fs.writeFileSync(nfile, Fs.readFileSync(defaultExes.term))
					Fs.writeFileSync(cfile, `<configuration>
<startup>
	<supportedRuntime version="v4.0"/>
	<supportedRuntime version="v2.0.50727"/>
</startup>
</configuration>
				  `)

				}catch(e){
					console.error("[WARNING] Failed writing executable wrapper:", nfile)
				}
			}
			if(defaultExes.gui){
				let nfile = Path.join(Path.dirname(file), Path.basename(file, Path.extname(file)) + "-gui.exe")
				let cfile = Path.join(Path.dirname(file), Path.basename(file, Path.extname(file)) + "-gui.exe.config")
				try{
					Fs.writeFileSync(nfile, Fs.readFileSync(defaultExes.gui))
					Fs.writeFileSync(cfile, `<configuration>
<startup>
	<supportedRuntime version="v4.0"/>
	<supportedRuntime version="v2.0.50727"/>
</startup>
</configuration>
				  `)
				}catch(e){
					console.error("[WARNING] Failed writing executable wrapper:", nfile)
				}
			}
		}


		let src = $paths.src
		let kwcoreFolder = Path.join(Os.homedir(), "Kawix")
		let kwcoreFile = Path.join(src, "kwcore.app.js")
		let kwcoreCli = Path.join(kwcoreFolder, "core", "bin", "cli")


		let exe = this.$kawix.executable
		await this.$downloadKwcore(kwcoreFile)



		let nodev = process.version.split(".")[0].substring(1)
		let content = `@echo off\r\nset NODE_SKIP_PLATFORM_CHECK=1\r\n"${exe.cmd}" "${kwcoreCli}" %*`
		let binFile = Path.join(bin, "kwcore-n" + nodev + ".cmd")
		Fs.writeFileSync(binFile, content)

		content = `@echo off\r\nset NODE_SKIP_PLATFORM_CHECK=1\r\n"${exe.cmd}" --insecure-http-parser "${kwcoreCli}" %*`
		binFile = Path.join(bin, "kwcore-legacy-n" + nodev + ".cmd")
		Fs.writeFileSync(binFile, content)


		let files = Fs.readdirSync(bin)
		let fileinfo = files.filter((a) => a.startsWith("kwcore-") && a.endsWith(".cmd")).map((a)=> ({name: a, v: a.split("-").slice(-1)[0].split(".")[0].substring(1)}))
		fileinfo.sort((a, b)=> Number(a.v) - Number(b.v))
		if(fileinfo.length){
			let v = fileinfo[fileinfo.length-1].v
			writeCmd(Path.join(bin, "kwcore.cmd"), Fs.readFileSync(Path.join(bin, "kwcore-n" + v + ".cmd")))
			writeCmd(Path.join(bin, "kwcore-legacy.cmd"), Fs.readFileSync(Path.join(bin, "kwcore-legacy-n" + v + ".cmd")))
			//Fs.writeFileSync(Path.join(bin, "kwrun.cmd"), )
			//Fs.writeFileSync(Path.join(bin, "kwrun-legacy.cmd"), )
		}

		await this.setExtensions({
			type: "application/kwcore.script",
			description: "Script de KawixCore",
			extensions: [".kwo", ".kwe"],
			terminal: true,
			appName: "kwcore"
		})
		await this.setExtensions({
			type: "application/kwcore.app",
			description: "Aplicación de KawixCore",
			extensions: [".kwa"],
			terminal: false,
			appName: "kwcore-gui"
		})

		let Child= require("child_process")
		try{
			Child.execSync("ie4uinit.exe -ClearIconCache")
		}catch(e){}
		try{
			Child.execSync("ie4uinit.exe -show")
		}catch(e){}
	}


	async $downloadKwcore(kwcoreFile: string){
		// download file 
		let exe = this.$kawix.executable
		let uri = "https://raw.githubusercontent.com/kodhework/kawix/master/core/dist/kwcore.app.js"
		await new Promise(function(resolve, reject){
			https.get(uri, {
				timeout: Number(process.env.REQUEST_TIMEOUT || 8000)
			}, (res)=> {
				try{
					let buffer = []
					res.on("data", function(bytes){
						buffer.push(bytes)
					})
					res.on("end", function(){
						try{
							let data = Buffer.concat(buffer)
							Fs.writeFileSync(kwcoreFile, data)
							resolve(null)
						}catch(e){
							reject(e)
						}
					})
				}catch(e){ reject(e) }
			}).on("error", reject)
		})
		let p = require("child_process").spawn(exe.cmd, [kwcoreFile])
		await new Promise(function(resolve, reject){
			p.on("exit", resolve)
			p.on("error", reject)
		})
	}

	async installKwcoreUnix(){
		let kawixFolder = Path.join(Os.homedir(), "KwRuntime")
		if(process.getuid() == 0){
			if(!Fs.existsSync("/usr/KwRuntime")){
				Fs.mkdirSync("/usr/KwRuntime")
			}
			if(Fs.existsSync(kawixFolder)){
				Fs.unlinkSync(kawixFolder)
			}
			Fs.symlinkSync("/usr/KwRuntime", kawixFolder)
			kawixFolder = "/usr/KwRuntime"
		}
		else{
			if(!Fs.existsSync(kawixFolder)) Fs.mkdirSync(kawixFolder) 
		}
		let bin = Path.join(kawixFolder, "bin")
		let src = Path.join(kawixFolder, "src")
		if(!Fs.existsSync(bin)) Fs.mkdirSync(bin) 
		if(!Fs.existsSync(src)) Fs.mkdirSync(src) 


		let kwcoreFolder = Path.join(Os.homedir(), "Kawix")        


		// download kwcore 
		let exe = this.$kawix.executable
		let nodev = process.version.split(".")[0].substring(1)
		let content: string, binFile: string
		let kwcoreFile = Path.join(src, "kwcore.app.js")
		let kwcoreCli = Path.join(kwcoreFolder, "core", "bin", "cli")


		// download file 
		let uri = "https://raw.githubusercontent.com/kodhework/kawix/master/core/dist/kwcore.app.js"
		await new Promise(function(resolve, reject){
			https.get(uri, (res)=> {
				try{
					let buffer = []
					res.on("data", function(bytes){
						buffer.push(bytes)
					})
					res.on("end", function(){
						try{
							let data = Buffer.concat(buffer)
							Fs.writeFileSync(kwcoreFile, data)
							resolve(null)
						}catch(e){
							reject(e)
						}
					})
				}catch(e){ reject(e) }
			}).on("error", reject)
		})
		let p = require("child_process").spawn(exe.cmd, [kwcoreFile])
		await new Promise(function(resolve, reject){
			p.on("exit", resolve)
			p.on("error", reject)
		})



		content = `#!/usr/bin/env bash\n${exe.cmd} "${kwcoreCli}" "$@"\nexit $?`
		binFile = Path.join(bin, "kwcore-n" + nodev)
		Fs.writeFileSync(binFile, content)
		Fs.chmodSync(binFile, "775")


		content = `#!/usr/bin/env bash\n${exe.cmd} --insecure-http-parser "${kwcoreCli}" "$@"\nexit $?`
		binFile = Path.join(bin, "kwcore-legacy-n" + nodev)
		Fs.writeFileSync(binFile, content)
		Fs.chmodSync(binFile, "775")



		let files = Fs.readdirSync(bin)
		let fileinfo = files.filter((a) => a.startsWith("kwcore-")).map((a)=> ({name: a, v: a.split("-").slice(-1)[0].substring(1)}))
		fileinfo.sort((a, b)=> Number(a.v) - Number(b.v))
		if(fileinfo.length){
			let v = fileinfo[fileinfo.length-1].v
			try{Fs.unlinkSync(Path.join(bin, "kwcore"))}catch(e){}
			try{Fs.unlinkSync(Path.join(bin, "kwcore-legacy"))}catch(e){}

			Fs.symlinkSync(Path.join(bin, "kwcore-n" + v), Path.join(bin, "kwcore"))
			Fs.symlinkSync(Path.join(bin, "kwcore-legacy-n" + v), Path.join(bin, "kwcore-legacy"))
		}

		this.$addPathUnix(bin)


		await this.$desktopFile({
			appName: "kwcore",
			id: "kawixcoreapp-terminal",
			terminal: true,
			title: 'Kawix Core',
			types: ["application/kwcore.script"],
			nodisplay: true
		})
		await this.$desktopFile({
			appName: "kwcore",
			id: "kawixcoreapp",
			terminal: false,
			title: 'Kawix Core',
			types: ["application/kwcore.app"],
			nodisplay: true
		})
		await this.$removeMimetypes("kwcoreapp_")



		await this.setExtensions({
			appName: "kwcore",
			type: "application/kwcore.script",
			description: "Script de KawixCore",
			extensions: [".kwo", ".kwe"],
			terminal: true
		})
		await this.setExtensions({
			appName: "kwcore",
			type: "application/kwcore.app",
			description: "Aplicación de KawixCore",
			extensions: [".kwa"],
			terminal: false
		})


	}


	$addPathUnix(folder: string){

		// ADD TO PATH
		let pathsToWrite = []
		pathsToWrite.push(Path.join(Os.homedir(), ".profile"))
		pathsToWrite.push(Path.join(Os.homedir(), ".bashrc"))
		pathsToWrite.push(Path.join(Os.homedir(), ".zshrc"))
		let config = Path.join(Os.homedir(), ".config")
		if(!Fs.existsSync(config)) Fs.mkdirSync(config)
		config = Path.join(config, "fish")
		if(!Fs.existsSync(config)) Fs.mkdirSync(config)
		config = Path.join(config, "config.fish")
		pathsToWrite.push(config)


		if(process.getuid() == 0){
			// put global 
			pathsToWrite.push("/etc/profile")
			pathsToWrite.push("/etc/bash.bashrc")
			
			pathsToWrite.push("/etc/fish/config.fish")
			if(!Fs.existsSync("/etc/fish")) Fs.mkdirSync("/etc/fish")
		}

		let lines = [
			"# KWRUNTIME PATH #",
			`export "PATH=${folder}:$PATH"`
		]
		for(let i=0;i<pathsToWrite.length;i++){
			let path = pathsToWrite[i]
			if(!Fs.existsSync(path)){
				Fs.writeFileSync(path, lines.join("\n"))
			}else{

				let content = Fs.readFileSync(path, "utf8")
				let lns = content.split("\n")
				let i = lns.indexOf(lines[0])
				if(i < 0){
					lns.push(lines[0])
					lns.push(lines[1])
				}
				else{
					lns[i+1] = lines[1]
				}
				Fs.writeFileSync(path, lns.join("\n"))
			}
		}

	}
	


	async selfInstallUnix(){        
		let kawixFolder = Path.join(Os.homedir(), "KwRuntime")
		if(process.getuid() == 0){
			if(!Fs.existsSync("/usr/KwRuntime")) Fs.mkdirSync("/usr/KwRuntime")
			
			if(Fs.existsSync(kawixFolder)) Fs.unlinkSync(kawixFolder)
			Fs.symlinkSync("/usr/KwRuntime", kawixFolder)
			kawixFolder = "/usr/KwRuntime"
		}
		else{
			if(!Fs.existsSync(kawixFolder)) Fs.mkdirSync(kawixFolder) 
		}
		let bin = Path.join(kawixFolder, "bin")
		if(!Fs.existsSync(bin)) Fs.mkdirSync(bin) 

		let utils = Path.join(kawixFolder, "utils")
		if(!Fs.existsSync(utils)) Fs.mkdirSync(utils) 

		// generate 
		let exe = this.$kawix.executable
		let nodev = process.version.split(".")[0].substring(1)
		let content: string, binFile: string
		content = `#!/usr/bin/env bash\n${exe.cmd} ${exe.args.join(" ")} "$@"\nexit $?`
		binFile = Path.join(bin, "kwrun-n" + nodev)
		Fs.writeFileSync(binFile, content)
		Fs.chmodSync(binFile, "775")
		/*
		let content = `#!${exe.cmd}\nprocess.argv[1] = ${JSON.stringify(exe.args[0])};require(process.argv[1]);`
		let binFile = Path.join(bin, "kwrun-n" + nodev)
		Fs.writeFileSync(binFile, content)
		Fs.chmodSync(binFile, "775")
		*/

		/*
		if(process.getuid() == 0){
			let binFile1 = "/usr/bin/kwrun"
			Fs.symlinkSync(binFile, binFile1)
		}*/
		

		content = `#!/usr/bin/env bash\n${exe.cmd} --insecure-http-parser ${exe.args.join(" ")} "$@"\nexit $?`
		binFile = Path.join(bin, "kwrun-legacy-n" + nodev)
		Fs.writeFileSync(binFile, content)
		Fs.chmodSync(binFile, "775")

		/*
		if(process.getuid() == 0){
			binFile = "/usr/bin/kwrun-legacy-n" 
			Fs.writeFileSync(binFile, content)
			Fs.chmodSync(binFile, "775")
		}*/

		let files = Fs.readdirSync(bin)
		let fileinfo = files.filter((a) => a.startsWith("kwrun-")).map((a)=> ({name: a, v: a.split("-").slice(-1)[0].substring(1)}))
		fileinfo.sort((a, b)=> Number(a.v) - Number(b.v))
		if(fileinfo.length){

			let v = fileinfo[fileinfo.length-1].v

			try{Fs.unlinkSync(Path.join(bin, "kwrun"))}catch(e){}
			try{Fs.unlinkSync(Path.join(bin, "kwrun-legacy"))}catch(e){}
			Fs.symlinkSync(Path.join(bin, "kwrun-n" + v), Path.join(bin, "kwrun"))
			Fs.symlinkSync(Path.join(bin, "kwrun-legacy-n" + v), Path.join(bin, "kwrun-legacy"))

		}
		this.$addPathUnix(bin + ":" + utils)

		await this.$desktopFile({
			appName: "kwrun",
			id: "kwruntimeapp-terminal",
			title: 'Kawix Runtime',
			terminal: true,
			types: ["application/kwruntime.script"],
			nodisplay: true
		})
		await this.$desktopFile({
			appName: "kwrun",
			id: "kwruntimeapp",
			terminal: false,
			title: 'Kawix Runtime',
			types: ["application/kwruntime.app","application/kwruntime.package"],
			nodisplay: true
		})

		await this.$removeMimetypes("kwrunapp_")
		await this.setExtensions({
			type: "application/kwruntime.script",
			description: "Script de Kawix Runtime",
			extensions: [".kws", ".kw.ts", ".kwc"],
			terminal: true
		})
		await this.setExtensions({
			type: "application/kwruntime.app",
			description: "Aplicación de Kawix Runtime",
			extensions: [".kwr", ".kwb"],
			terminal: false
		})
		await this.setExtensions({
			type: "application/kwruntime.package",
			description: "Paquete de Kawix Runtime",
			extensions: [".kwt"],
			terminal: false
		})

		console.info("Application added to PATH. Maybe you need restart shell.")
	}


}

export class BinaryData{

	#kawix: Kawix 
	#filename: string

	constructor(kawix:Kawix, filename: string){
		this.#kawix = kawix
		this.#filename = filename
	}

	async getMetadata(){

		let binary = Kawix.$binaryMetadata.get(this.#filename)
		if(!binary){
			
			let modCache = this.#kawix.$modCache.get(this.#filename) || {}
			//console.info("Here --->", modCache)
			let mod = (modCache.module || {}).exports || {}
			//let mod = await this.#kawix.import(this.#filename)    
			binary = mod.__binary
			if(binary){
				Kawix.$binaryMetadata.set(this.#filename, binary)
			}
		}
		return binary?.metadata
	}


	async getStream(name: string, options:any = {}){
		
		let metadata = await this.getMetadata()
		if(metadata){
			let binary = Kawix.$binaryMetadata.get(this.#filename)
			let meta = metadata[name]
			if(meta){
				//console.info("Binary:", binary)
				let boffset = meta.offset + binary.length +  binary.start
				let start = (options.start || 0) + boffset
				let end = boffset + meta.length - 1
				if(options.length !== undefined){
					end = Math.min(options.length + start - 1, end)
				}
				if(options.end) end = options.end
				return Fs.createReadStream(binary.filename, {
					start,
					end
				})
			}
		}
	}


	async read(name: string, offset: number = 0, count? : number){
		
		
		let metadata = await this.getMetadata()
		if(metadata){
			let binary = Kawix.$binaryMetadata.get(this.#filename)
			let meta = metadata[name]
			if(meta){
				let boffset = meta.offset + binary.start
				let fd = binary.fd || 0, buffer = null
				try{
					if(!fd){
						fd = await new Promise<number>(function(a,b){
							Fs.open(binary.filename, "r", function(er, fd){
								if(er) return b(er)
								return a(fd)
							})
						})
						if(Os.platform() != "win32")
							binary.fd = fd 
					}
					if(count == undefined) count = meta.length
					let len = Math.min(meta.length, count)
					buffer = Buffer.allocUnsafe(len)
					await new Promise(function(a,b){
						Fs.read(fd, buffer, 0, buffer.length, boffset + offset, function(er, fd){
							if(er) return b(er)
							return a(fd)
						})
					})
				}catch(e){
					throw e
				}finally{
					if(fd && (Os.platform() == "win32")){
						await new Promise<void>(function(a,b){
							Fs.close(fd, function(er){
								if(er) return b(er)
								return a()
							})
						})
					}
				}
				return buffer
			}
		}
	}
}



export class Kawix{

	$cacheType = 'json'

	appArguments: string[] = []
	//argv: string[]
	mainFilename: string
	optionsArguments: string[] = []
	originalArgv: string[]
	customImporter = new Array<Function>()
	customImportInfo = new Array<Function>()
	transpiler = 'babel'
	$esbuildTranspiler = null


	static $binaryMetadata = new Map<string, any>()
	static $binaryFiles = new Map<string, any>()
	static $modulesData = new Map<string, Map<string, any>>()
	static packageLoaders = {
		"yarn": "github://kwruntime/std@34542ea/package/yarn.ts",
		//yarn: "/home/james/projects/Kodhe/kwruntime/std/package/yarn.ts",
		"pnpm": "github://kwruntime/std@0f85509/package/pnpm.ts"
		//pnpm: "/home/james/projects/Kodhe/kwruntime/std/package/pnpm.ts"
	}

	$importing = new Map<string, any>() 
	$modCache = new Map<string, any>()
	$mainFolder: string
	$cacheFolder: string
	$networkContentFolder: string 
	$installer: Installer
	$originals = new Map<string, any>()
	$startParams:any = {}

	// now using pnpm as default loader
	packageLoader: string = Kawix.packageLoaders["pnpm"]
	packageLoaderEnv: {[key:string]: string} = {}

	get $class(){
		return Kawix
	}

	get argv():string[]{
		return this.appArguments
	}

	get version(){
		return "1.1.35"
	}

	get installer(){
		if(!this.$installer){
			this.$installer = new Installer(this)
		}
		return this.$installer
	}

	get executable(){
		return {
			cmd: this.originalArgv[0],
			args: [this.originalArgv[1]]
		}
	}


	static getData(filename: string, name: string){
		let data = Kawix.$modulesData.get(filename)
		if(data){
			return data.get(name)
		}
	}
	static setData(filename: string, name: string, value: any){
		let data = Kawix.$modulesData.get(filename)
		if(!data) Kawix.$modulesData.set(filename, data = new Map<string,any>())
		data.set(name, value)
	}


	getData(filename: string, name: string){
		return Kawix.getData(filename, name)
	}

	setData(filename: string, name: string, value: any){
		return Kawix.setData(filename, name, value)
	}


	get pngCompressedIcons(){
		let base64 = `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`;

		return Buffer.from(base64, 'base64')

	}

	get svgIcon(){
		return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
		<!-- Created with Inkscape (http://www.inkscape.org/) -->
		
		<svg
		   width="135.08963mm"
		   height="135.21298mm"
		   viewBox="0 0 135.08963 135.21298"
		   version="1.1"
		   id="svg5"
		   inkscape:version="1.1.1 (3bf5ae0d25, 2021-09-20)"
		   sodipodi:docname="dibujo1.svg"
		   xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"
		   xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd"
		   xmlns="http://www.w3.org/2000/svg"
		   xmlns:svg="http://www.w3.org/2000/svg">
		  <sodipodi:namedview
			 id="namedview7"
			 pagecolor="#ffffff"
			 bordercolor="#666666"
			 borderopacity="1.0"
			 inkscape:pageshadow="2"
			 inkscape:pageopacity="0"
			 inkscape:pagecheckerboard="0"
			 inkscape:document-units="mm"
			 showgrid="false"
			 inkscape:zoom="1.5219183"
			 inkscape:cx="366.97107"
			 inkscape:cy="230.95852"
			 inkscape:window-width="1920"
			 inkscape:window-height="984"
			 inkscape:window-x="0"
			 inkscape:window-y="24"
			 inkscape:window-maximized="1"
			 inkscape:current-layer="layer1"
			 objecttolerance="10000"
			 guidetolerance="10000"
			 fit-margin-top="0"
			 fit-margin-left="0"
			 fit-margin-right="0"
			 fit-margin-bottom="0" />
		  <defs
			 id="defs2" />
		  <g
			 inkscape:label="Capa 1"
			 inkscape:groupmode="layer"
			 id="layer1"
			 transform="translate(-10.895871,-22.224895)">
			<path
			   style="fill:#f6f5d4;stroke-width:0.264583"
			   d="m 76.399094,103.81675 c -4.08651,-0.62626 -7.5722,-2.85581 -9.91237,-6.340242 -2.342689,-3.488172 -2.871165,-8.6302 -1.31199,-12.765532 0.76278,-2.023099 1.55675,-3.225551 3.28509,-4.975209 2.6524,-2.685105 6.01676,-4.056922 9.949545,-4.056922 4.05776,0 7.3397,1.386195 10.13353,4.280096 2.80249,2.902873 4.00664,5.928222 3.96327,9.957461 -0.0315,2.924495 -0.70615,5.232378 -2.17129,7.427417 -1.28578,1.926322 -1.68323,2.372892 -3.19426,3.589041 -2.86293,2.30422 -7.1004,3.4419 -10.741525,2.88389 z"
			   id="path4508" />
			<path
			   id="path4506"
			   style="fill:#e1e1e1;stroke-width:0.999999"
			   transform="scale(0.26458333)"
			   d="m 296.35156,85.279297 v 20.531253 20.53125 h 8.28906 c 2.37435,0 4.77294,0.0679 7.1875,0.18554 0.0353,-0.006 0.0737,-0.01 0.11524,-0.01 0.014,0 0.007,-1e-5 0.0215,0 0.029,-1e-5 0.0568,-1e-5 0.0859,0 0.0434,3e-5 0.0876,-0.002 0.13086,-0.002 0.0392,1e-5 0.078,-6.8e-4 0.11719,0.002 0.0468,-0.003 0.0939,-0.002 0.14062,0.002 -0.0117,0.002 -0.0153,0.003 -0.0195,0.004 0.0387,-0.002 0.22263,-0.0159 0.26563,0.0312 0.0101,-5e-5 0.0219,5e-5 0.0273,0 0.059,-2.9e-4 0.11906,-5.8e-4 0.17773,0.002 0.0735,-0.005 0.14825,-0.0101 0.22071,0.0137 0.0219,0.0233 0.15787,-0.0122 0.20508,0.0215 -0.0758,0.0117 0.11693,-0.001 0.13281,0.006 0.0449,-0.005 0.19135,-0.0185 0.22461,0.0137 0.002,0.002 10e-4,0.003 -0.004,0.004 0.0518,-9.4e-4 0.10473,-0.002 0.15625,0.004 0.008,6.5e-4 0.0291,-0.004 0.0234,0.002 -0.005,0.005 -0.0172,0.01 -0.0273,0.0117 0.0454,-0.005 0.0912,-0.0157 0.13671,-0.0195 0.0676,-0.006 0.13716,0.0271 0.20508,0.0234 0.0874,-7.6e-4 0.17434,0.002 0.26172,0.004 0.01,0 0.0312,-0.0102 0.0312,0 10e-4,0.0202 10e-4,0.0438 -0.004,0.0684 0.0182,0.001 0.0365,0.003 0.0547,0.004 0.0116,-0.0303 0.0282,-0.0532 0.0508,-0.0645 8e-4,-0.007 -2.1e-4,-0.0146 0.002,-0.0215 0.0164,0.003 0.0326,0.008 0.0488,0.01 0.0663,0.008 0.13273,0.0147 0.19921,0.0215 0.0949,0.009 0.19018,0.0187 0.28516,0.0274 0.11806,0.0107 0.20785,0.0455 0.27148,0.0918 2.27919,0.16287 4.57463,0.37784 6.88086,0.64063 0.003,-10e-4 0.006,1e-4 0.01,-0.002 0.0141,-0.003 0.032,-0.001 0.0547,0.008 7.1e-4,8e-5 -10e-5,0.0117 0.002,0.0117 0.51259,0.0586 1.03116,0.14355 1.54492,0.20703 0.0136,0 0.0273,-1e-5 0.041,0 0.0285,-1e-5 0.0576,-4.6e-4 0.0859,0 0.0422,6.1e-4 0.07,-0.009 0.11914,-0.0117 0.008,0.003 0.0155,0.009 0.0234,0.0117 -0.0172,-8.2e-4 -0.0345,0.007 -0.0508,0.0117 -0.004,0.001 -0.015,0.006 -0.0254,0.0117 0.0286,0.004 0.0574,0.008 0.0859,0.0117 0.0126,-0.006 0.0194,-0.007 0.0332,-0.0137 -0.013,-0.005 -0.026,-0.0105 -0.0391,-0.0156 0.0159,0.001 0.0312,0.01 0.0469,0.0117 0.002,1.5e-4 0.004,1e-4 0.006,0 -0.005,0.003 -0.009,0.009 -0.0137,0.0117 0.0288,0.0115 0.058,0.0226 0.0879,0.0312 0.008,9.8e-4 0.0157,5e-5 0.0234,0.002 -0.0131,-0.0103 -0.0621,-0.0336 -0.0918,-0.041 0.01,-0.005 0.0186,-0.008 0.0293,-0.0137 0.048,0.0128 0.0914,0.0335 0.13477,0.0547 h 0.0527 0.27148 c 0.14964,0 0.25772,0.0419 0.32618,0.10156 0.0223,0.002 0.0442,0.008 0.0644,0.0117 10e-4,1.6e-4 0.003,-1.7e-4 0.004,0 1.46626,0.19177 2.95227,0.48638 4.43164,0.74609 0.016,-0.0114 0.0343,-0.0171 0.0527,-0.0176 0.0258,-6.8e-4 0.0534,0.0124 0.082,0.0391 0.13764,0.0243 0.27442,0.0458 0.41211,0.0703 0.0737,-0.007 0.13966,-0.0133 0.16602,-0.006 0.0338,0.0114 0.0654,0.0319 0.0977,0.0488 h 0.002 c 0.0202,0.004 0.0403,0.008 0.0605,0.0117 -0.0294,-0.0146 -0.0634,-0.0308 -0.0801,-0.043 -0.006,-0.004 0.0127,-1.7e-4 0.0195,-0.002 0.0821,-0.011 0.16392,-0.004 0.24609,-0.004 0.0993,-0.009 0.19391,0.003 0.28711,0.0391 0.0254,0.0142 0.0869,0.0532 0.0977,0.0625 -0.0393,-0.0136 -0.0732,-0.0418 -0.11329,-0.0527 -0.0665,-0.0181 -0.11891,0.0119 -0.17382,0.041 0.076,0.009 0.15241,0.0132 0.22851,0.0215 0.0146,-7.4e-4 0.0294,-4.5e-4 0.0488,0 0.0208,4.9e-4 0.0412,0.008 0.0605,0.0156 -0.0363,-0.006 -0.0727,-0.0117 -0.10938,-0.0156 -0.0284,10e-4 -0.0487,0.005 -0.0664,0.0117 0.92945,0.16805 1.85189,0.30154 2.78125,0.46875 0.0628,-0.002 0.11771,0.009 0.1621,0.0273 h 0.002 c 0.33181,0.06 0.66684,0.14235 1,0.21289 0.11326,0.009 0.22488,0.0291 0.33594,0.0547 0.10136,0.0265 0.20311,0.0619 0.30664,0.0781 0.0754,0.009 0.13987,0.0184 0.21289,0.043 0.008,0.003 0.0246,0.009 0.0215,0.0117 h 0.002 c 0.004,9e-4 0.008,0.003 0.0117,0.004 0.0227,-0.003 0.046,-0.006 0.0684,-0.006 0.0293,-4.3e-4 0.10731,0.0283 0.16016,0.0547 0.045,0.0101 0.0897,0.0191 0.13476,0.0293 0.0221,-8.9e-4 0.0426,-0.007 0.0762,-0.008 0.0552,0.0133 0.098,0.0256 0.14453,0.0469 0.0108,-5.9e-4 0.0224,-0.002 0.0332,-0.002 0.007,2.3e-4 0.0376,0.014 0.0664,0.0273 0.0163,0.004 0.0326,0.008 0.0488,0.0117 0.005,-5e-4 0.01,-2.6e-4 0.0156,-0.002 0.0343,-0.004 0.071,0.004 0.10547,0.0137 0.0613,-0.0259 0.1065,-0.0395 0.0488,0.006 0.0352,0.004 0.23163,0.0429 0.27343,0.0781 v 0.002 c 0.0521,0.0114 0.10415,0.0219 0.15625,0.0332 0.001,2.7e-4 0.003,-2.7e-4 0.004,0 0.051,-0.001 0.10483,8.3e-4 0.10938,0.0215 0.006,0.002 0.0116,0.004 0.0176,0.006 0.17713,0.0381 0.35439,0.0775 0.53125,0.11328 0.1001,9.9e-4 0.18144,0.0209 0.24414,0.0527 30.59951,6.23195 62.21383,20.30796 88.9336,40.52539 1.18988,0.90031 2.53306,1.98722 3.98242,3.21094 0.0841,-0.0198 0.13319,-0.0483 0.11914,-0.0937 0.14634,0.15156 0.29541,0.29789 0.45508,0.43555 0.10998,0.13348 0.23634,0.30836 0.31836,0.43554 0.004,0.003 0.006,0.009 0.01,0.0117 0.10596,0.0908 0.22312,0.19692 0.33008,0.28907 0.0216,0.0124 0.0838,0.0533 0.28711,0.20117 0.12643,0.12656 0.2522,0.25431 0.37891,0.38086 0.37999,0.33062 0.76157,0.6624 1.15234,1.00781 0.003,0.002 0.005,0.009 0.006,0.0117 l 0.002,0.002 c 0.1511,0.13357 0.33195,0.32151 0.48438,0.45703 l 0.002,0.002 c 0.0346,0.0273 0.0683,0.0552 0.0996,0.0859 h 0.004 c 0.0239,0.0235 0.0439,0.0467 0.0625,0.0703 l 0.002,0.002 c 1.82514,1.62591 3.8468,3.64584 5.79492,5.48047 0.0229,-0.008 0.0478,-0.0128 0.0742,-0.0137 0.0919,-0.003 0.20367,0.0379 0.31641,0.14453 0.21857,0.20661 0.47584,0.37316 0.64062,0.48828 0.0491,0.0837 0.1225,0.14098 0.19922,0.21484 0.0113,0.011 0.0238,0.0238 0.0352,0.0332 0.0117,0.01 0.0298,0.0101 0.0449,0.0195 0.0752,0.0508 0.12526,0.0968 0.17969,0.16797 0.0144,0.0283 0.0115,0.0131 0.0742,0.0703 0.0431,0.0428 0.0858,0.0863 0.1289,0.1289 0.0419,0.0418 0.0831,0.083 0.125,0.125 0.0401,0.04 0.0791,0.0811 0.11914,0.1211 0.0457,0.0459 0.0929,0.0908 0.13867,0.13672 0.0378,0.038 0.0751,0.0753 0.11329,0.11328 0.0291,0.0321 0.0616,0.065 0.0918,0.082 0.11528,0.0724 0.21877,0.15711 0.3125,0.25586 0.0612,0.0737 0.0473,0.0525 0.1543,0.1582 0.0522,0.0556 0.10636,0.10567 0.16797,0.15039 0.0722,0.0565 0.1303,0.12852 0.19531,0.19336 0.005,0.005 0.0207,0.0234 0.0352,0.043 0.0261,0.0114 0.0515,0.023 0.0762,0.0371 0.028,0.016 0.0476,0.0445 0.0703,0.0664 0.0427,0.0424 0.074,0.0844 0.0937,0.13281 0.0104,0.009 0.0221,0.0228 0.0391,0.0391 0.11755,0.103 0.21921,0.22211 0.31446,0.3457 0.0722,0.0773 0.16149,0.13775 0.23633,0.21485 0.071,0.08 0.14864,0.15318 0.2246,0.22851 0.0745,0.0741 0.14858,0.15041 0.22266,0.22461 0.0854,0.0852 0.17044,0.16865 0.25586,0.25391 0.0949,0.0839 0.19249,0.16361 0.2832,0.25976 0.0484,0.0588 0.0253,0.0292 0.15039,0.1543 0.09,0.0902 0.17972,0.17961 0.26953,0.26953 0.12208,0.12223 0.24511,0.24496 0.36719,0.36719 0.0987,0.0923 0.17737,0.202 0.25977,0.30859 0.0745,0.0893 0.15324,0.17652 0.23828,0.25586 0.0995,0.0927 0.15085,0.18706 0.16602,0.27149 4.42412,4.38713 8.69876,8.83226 12.18945,12.75195 0.12213,0.0819 0.21895,0.20195 0.35742,0.41797 0.18503,0.2092 0.32797,0.38442 0.50781,0.58984 0.004,0.004 0.007,0.008 0.0117,0.0117 0.0144,0.0163 0.0358,0.0434 0.0566,0.0703 0.006,0.008 0.0109,0.0127 0.0176,0.0215 0.0688,0.0787 0.12734,0.14847 0.19531,0.22656 l 0.004,0.004 c 0.0646,0.0644 0.13024,0.12753 0.19336,0.19336 0.0854,0.0919 0.12168,0.12795 0.23242,0.2207 0.15345,0.16387 0.0749,0.0703 0.24609,0.3125 0.0255,0.0253 0.0327,0.0298 0.0352,0.0293 0.002,0.003 0.0172,0.0311 0.0762,0.13086 0.009,0.008 0.008,0.012 0.0195,0.0234 0.004,0.008 0.0134,0.0217 0.0195,0.0312 -0.003,-0.002 -0.007,-0.004 -0.01,-0.006 0.009,0.0109 0.0181,0.0224 0.0273,0.0332 -0.005,-0.008 -0.009,-0.0166 -0.0137,-0.0234 0.005,0.003 0.009,0.005 0.0137,0.008 0.003,0.005 0.0264,0.0251 0.0195,0.0215 -0.007,-0.004 -0.0129,-0.008 -0.0195,-0.0117 0.0153,0.0171 0.0203,0.0264 0.0352,0.0586 7.8e-4,0.002 -3e-4,0.002 0.002,0.004 0.002,9.9e-4 0.002,0.003 0.004,0.004 0.11755,0.0942 0.20536,0.17037 0.25976,0.23438 l 0.01,-0.004 c 0.0174,-0.0182 0.0358,0.0375 0.0547,0.0566 0.24087,0.26202 0.73194,0.80798 0.91601,1.01172 h -0.006 c 0.17382,0.1926 0.29054,0.38174 0.35938,0.56055 0.30513,0.37402 0.77048,0.86926 1.04687,1.2207 1.13868,1.44782 2.16671,2.98273 3.26758,4.46094 0.11916,0.10533 0.23664,0.24019 0.3457,0.41016 0.0204,0.0317 0.055,0.0577 0.0625,0.0937 -0.0494,-0.0362 -0.0639,-0.0468 -0.0801,-0.0586 0.0538,0.0418 0.13799,0.1105 0.16797,0.14258 0.0684,0.0734 0.12633,0.15601 0.17773,0.24219 0.0253,0.0421 0.0836,0.1337 0.10351,0.18164 0.0652,0.089 0.12349,0.18083 0.16797,0.27734 0.0449,0.0612 0.09,0.12231 0.13477,0.1836 l 0.006,0.002 c 0.026,0.0185 0.0558,0.0353 0.0586,0.0644 6.1e-4,0.005 -0.006,0.005 -0.0117,0.004 0.011,0.015 0.0222,0.0299 0.0332,0.0449 0.13328,0.0841 0.28976,0.147 0.37304,0.29102 0.0116,0.0156 0.2815,0.35376 0.5293,0.75195 0.033,0.0375 0.0646,0.0759 0.0977,0.11328 0.19828,0.22286 0.39968,0.44277 0.59961,0.66406 0.31117,0.34423 0.43845,0.67976 0.4375,0.95899 17.82634,25.25962 30.23829,54.47701 35.90625,84.60742 0.0333,0.1014 0.0654,0.20364 0.0937,0.30664 0.0342,0.12453 0.0365,0.22897 0.0117,0.30859 0.24723,1.33653 0.42438,2.68091 0.6543,4.01953 3.1e-4,0.001 0.002,0.003 0.002,0.004 0.005,0.0229 0.0112,0.0458 0.0195,0.0684 0.0334,0.12366 0.0607,0.24202 0.0508,0.36523 2.2e-4,10e-4 -2.1e-4,0.003 0,0.004 l 0.002,0.002 c 0.0404,0.13452 0.0421,0.10557 0.041,0.16797 -2.5e-4,0.0271 2.8e-4,0.0547 0,0.082 0.0155,0.0918 0.0277,0.18363 0.043,0.2754 0.004,0.0214 0.008,0.043 0.0117,0.0645 7.1e-4,0.002 0.0107,0.01 0.0117,0.0117 0.0788,0.25021 0.1034,0.3606 0.17383,0.63086 h 0.01 c 0.0392,0.15012 0.0246,0.26989 -0.0195,0.35156 0.24973,1.54392 0.55181,3.08241 0.75391,4.63086 0.0164,0.12578 0.0251,0.2883 0.0371,0.43359 0.004,0.0182 0.006,0.036 0.01,0.0859 0.006,0.0145 0.003,0.0278 0,0.041 v 0.002 c 0.0297,0.39388 0.0571,0.80016 0.0976,1.14844 0.001,0.004 4.6e-4,0.008 0.002,0.0117 0.0862,0.26121 0.0325,0.0589 0.0586,0.26954 0,0.007 0.0102,0.0104 0.0117,0.0176 0.0196,0.10022 0.0145,0.0801 0.0176,0.16602 -0.01,0.081 -0.01,0.16288 -0.008,0.24414 6.6e-4,0.0267 0.002,0.0534 0.002,0.0801 0.005,0.0172 0.0101,0.0387 0.0176,0.0703 0.0135,0.0484 0.009,0.0984 0,0.14648 0.006,-0.023 0.004,0.0587 0.004,0.0742 -1.4e-4,0.0434 -1.8e-4,0.0874 0,0.13086 v 0.0254 c 1.52999,14.2225 1.53938,35.18967 0.0781,49.1543 0.0285,0.0681 0.0435,0.15514 0.0351,0.26172 -0.008,0.0904 -0.0139,0.17912 -0.0215,0.26953 -0.003,0.0419 -0.008,0.085 -0.0117,0.12695 h -0.002 v 0.008 l 0.002,0.002 c 7.7e-4,0.005 -3e-4,0.0154 0,0.0117 -0.002,0.0404 -0.0351,0.1245 -0.0586,0.17773 -0.004,0.055 6.6e-4,0.0255 -0.0195,0.0996 2.5e-4,0.005 0.002,0.0104 0.002,0.0156 0,0.067 -0.0128,0.11772 -0.0293,0.18554 -0.0942,0.82835 -0.13448,1.89847 -0.24023,2.66602 -0.18605,1.35095 -0.47097,2.67026 -0.68164,4.01367 -10e-4,0.0274 -0.003,0.0542 -0.008,0.084 -0.008,0.0425 -0.0166,0.0872 -0.0273,0.1289 v 0.002 c -0.0584,0.36988 -0.12726,0.73617 -0.1875,1.10547 0.0944,-0.13446 0.0348,0.0155 -0.0234,0.14063 -0.004,0.0255 -0.009,0.0507 -0.0137,0.0762 -4.2e-4,0.0194 -7.7e-4,0.0392 -0.002,0.0566 0.006,0.0277 -0.004,0.0712 -0.0176,0.11328 v 0.002 c 0.012,0.0603 -0.005,0.13074 -0.0215,0.18945 -0.006,0.0414 -0.0152,0.0816 -0.0215,0.12305 -7.8e-4,0.005 -7.7e-4,0.0105 -0.002,0.0156 -5e-4,0.002 -7.7e-4,0.004 -0.002,0.006 -0.0107,0.0422 -0.0213,0.0845 -0.0371,0.125 -9.9e-4,0.003 -0.004,0.007 -0.006,0.01 -0.19568,1.17025 -0.47524,2.31235 -0.68945,3.47656 v 0.002 c 0.004,0.0969 0.001,0.17924 -0.0176,0.27539 0,0.0141 -0.004,0.0297 -0.0117,0.041 -0.004,0.004 -0.0151,-0.0123 -0.0156,-0.008 -0.004,0.0229 0.005,0.0457 0.008,0.0684 -0.007,0.15441 -0.0365,0.31467 -0.0879,0.46094 -0.004,-0.008 -0.004,-0.0329 -0.008,-0.0254 -0.008,0.0159 0.0405,0.25134 -0.0332,0.29102 -0.0136,-0.0159 -0.0647,0.2672 -0.0723,0.25586 -0.008,-0.008 -0.0145,-0.0212 -0.0156,-0.0137 -0.0113,0.0707 0.008,0.14619 -0.0352,0.21875 -0.003,0.0189 -0.0299,0.17617 -0.0488,0.1875 -0.002,0.002 -0.002,2.6e-4 -0.002,-0.004 2.6e-4,0.0142 -8.2e-4,0.0326 -0.004,0.0234 -0.002,-0.004 -0.006,-0.0136 -0.008,-0.0215 -5e-4,0.003 -0.005,0.005 -0.006,0.008 0.008,0.0519 0.0117,0.0577 0.0117,0.0469 6.2e-4,0.007 0.004,0.0206 0.008,0.0605 -0.004,0.0975 10e-4,0.0781 -0.0215,0.19531 -0.004,0.0113 -0.0136,0.0179 -0.0156,0.0293 -0.002,0.0113 0.0113,0.0375 0,0.0351 -0.0162,-0.004 -0.0328,-0.008 -0.0488,-0.0117 -0.004,0.0216 -0.009,0.0429 -0.0137,0.0645 0.0743,0.0264 0.092,0.0488 0.0762,0.0898 -0.001,0.006 -0.003,0.0102 -0.004,0.0156 0.002,-0.004 0.006,-0.008 0.008,-0.0117 -1.9e-4,0.003 -0.005,0.0106 -0.006,0.0156 -0.005,0.008 -0.0112,0.0161 -0.0176,0.0254 0.002,3.2e-4 0.006,-3.2e-4 0.008,0 -0.004,0.006 -0.0123,0.0223 -0.0117,0.006 -0.001,0.002 -0.004,0.004 -0.006,0.006 -0.005,0.0269 -0.0145,0.0989 -0.041,0.27734 -0.0151,0.0987 -0.022,0.19785 -0.0332,0.29688 h -0.01 c -0.0205,0.1752 -0.0915,0.28764 -0.17578,0.3418 -6.79081,33.99927 -21.49876,65.26783 -42.47656,91.65429 -0.002,0.005 -0.004,0.0102 -0.006,0.0156 -0.0472,0.0903 -0.10151,0.18663 -0.16992,0.2539 0.009,-0.0268 -0.0724,0.10377 -0.0762,0.11133 -0.008,0.008 -0.0139,0.0199 -0.0215,0.0312 -0.0608,0.085 -0.13112,0.17083 -0.18555,0.25586 -0.0487,0.11036 -0.1046,0.21442 -0.18359,0.30664 -0.0724,0.0935 -0.0187,0.0277 -0.0742,0.0957 -0.0132,0.0147 -0.0239,0.0337 -0.0391,0.0488 -0.004,0.004 -0.012,0.0167 -0.0117,0.01 -10e-4,0.005 -0.003,0.0101 -0.004,0.0156 -0.0884,0.18354 -0.22759,0.33981 -0.36328,0.49024 -0.0752,0.0729 -0.15865,0.14001 -0.21875,0.22656 -0.0714,0.0869 -0.1511,0.1644 -0.23047,0.24414 -0.0359,0.0348 -0.0772,0.0675 -0.10742,0.10156 -0.0499,0.0741 -0.10163,0.14783 -0.15039,0.22266 -0.0688,0.0843 -0.14473,0.16201 -0.2207,0.24023 -0.059,0.031 -0.12369,0.0532 -0.17774,0.0918 -0.028,0.0217 0.0643,-0.0177 0.0957,-0.0332 -8e-4,10e-4 -8.8e-4,0.003 -0.002,0.004 -0.0181,0.0246 -0.0279,0.0497 -0.043,0.0762 -0.0627,0.10809 -0.12609,0.217 -0.22852,0.29296 -0.0471,0.0889 -0.12632,0.15778 -0.19141,0.23243 -0.10242,0.11376 -0.15879,0.25114 -0.25781,0.36718 L 459.94922,476 c -0.0386,0.0385 -0.0767,0.0771 -0.11524,0.11523 -0.0521,0.0521 -0.10295,0.10329 -0.15625,0.1543 -0.0563,0.0533 -0.13629,0.15009 -0.20507,0.21094 -0.13153,0.12057 -0.27082,0.23182 -0.39063,0.36523 l -0.0195,0.0195 c -0.31871,0.37813 -0.66499,0.73341 -0.98633,1.10938 -0.0394,0.0519 -0.0775,0.10455 -0.11719,0.15625 -0.14116,0.18637 -0.29223,0.3659 -0.42187,0.56055 -0.0843,0.13519 -0.16106,0.27938 -0.28125,0.38671 -0.13773,0.13731 -0.27491,0.27453 -0.41211,0.41211 -0.0813,0.0813 -0.16439,0.16138 -0.24414,0.24415 -0.0971,0.10166 -0.19105,0.20848 -0.30859,0.2871 l -0.16797,0.16797 -0.12696,0.12696 c -0.005,0.006 -0.0108,0.0101 -0.0156,0.0156 -0.26873,0.30526 -0.54006,0.60834 -0.81055,0.91211 -0.0231,0.0413 -0.0496,0.0814 -0.084,0.11524 -0.0613,0.0773 -0.0928,0.17402 -0.16016,0.24609 -0.004,0.007 -0.0125,0.0207 -0.0332,0.0527 -0.0473,0.0729 -0.0991,0.14013 -0.1543,0.20703 -0.0423,0.0575 -0.0352,0.0502 -0.0937,0.11329 -0.002,0.002 -0.005,0.004 -0.008,0.006 0.009,-0.0203 0.0345,-0.075 0.0234,-0.0566 -0.0151,0.0234 -0.0258,0.0497 -0.0371,0.0762 -0.0166,0.0238 -0.0357,0.0496 -0.0508,0.0723 -0.10848,0.12812 -0.22287,0.24996 -0.34571,0.36524 -0.0748,0.0745 -0.14083,0.16023 -0.22851,0.2207 -0.027,0.0177 -0.15282,0.15679 -0.15235,0.125 -0.0386,0.0753 -0.0907,0.15108 -0.14062,0.1875 -0.0707,0.0964 -0.12382,0.20541 -0.2168,0.28516 -0.0741,0.0673 -0.11896,0.1514 -0.18359,0.22851 -0.0722,0.0722 -0.14385,0.14733 -0.2168,0.21875 -0.0752,0.0718 -0.0827,0.0638 -0.10156,0.10156 -0.0272,0.0435 -0.0557,0.0949 -0.0937,0.12891 -0.004,0.003 -0.013,-6e-5 -0.0156,0.004 -0.0306,0.0523 -0.0424,0.0773 -0.0449,0.0859 0.002,-5.4e-4 0.007,-0.004 0.0117,-0.01 -0.0185,0.0254 -0.029,0.0422 -0.0781,0.11133 -0.0744,0.0673 -0.13943,0.13598 -0.19726,0.21875 -0.0416,0.0367 -0.0716,0.0762 -0.10938,0.125 -0.0605,0.0548 -0.0941,0.13837 -0.16406,0.1875 -0.0412,0.0333 -0.0308,0.0171 -0.0742,0.084 -0.0571,0.0915 -0.13075,0.16849 -0.20898,0.24219 -0.0654,0.0654 -0.13031,0.12993 -0.19531,0.19531 -0.0537,0.0544 -0.10964,0.10844 -0.16407,0.16211 -0.0771,0.0775 -0.14738,0.16131 -0.23242,0.23047 -0.0646,0.0484 -0.1703,0.14674 -0.18164,0.1543 -0.0843,0.0782 -0.13106,0.18928 -0.21875,0.26562 -0.0642,0.0786 -0.1177,0.13516 -0.17969,0.2168 -0.054,0.0499 -0.0856,0.12192 -0.14453,0.16992 L 450.57422,486.5 c -0.0484,0.0491 -0.0966,0.0969 -0.14649,0.14453 -0.0638,0.0621 -0.11723,0.13535 -0.19335,0.18359 l -0.0117,0.006 c -0.003,0.002 -0.005,0.004 -0.008,0.006 -0.065,0.0578 -0.12513,0.12079 -0.1875,0.18164 -0.0151,0.0144 -0.0298,0.0298 -0.0449,0.0449 0.0401,-0.0798 0.02,-0.0356 -0.0723,0.0801 -0.0113,0.0151 -0.0298,0.0219 -0.0449,0.0332 -0.16191,0.14249 -0.22281,0.20693 -0.39062,0.36719 l -0.004,0.002 c -0.0956,0.091 -0.19014,0.13609 -0.27343,0.14844 -2.40754,2.49079 -4.88851,4.91551 -7.41797,7.29296 -0.068,0.0726 -0.13655,0.14472 -0.20508,0.2168 -0.0794,0.0775 -0.16338,0.14927 -0.23633,0.23242 0.004,-0.0113 0.0154,-0.0408 0.008,-0.0332 -0.0119,0.01 -0.0118,0.0277 -0.0156,0.0391 -0.008,0.017 -0.0198,0.0358 -0.0274,0.0547 -0.0242,0.0469 -0.05,0.0788 -0.084,0.12109 l -0.0215,0.0234 c -0.11528,0.11565 -0.2305,0.22999 -0.34766,0.34375 -0.0896,0.0903 -0.17133,0.19054 -0.27149,0.26953 -0.12849,0.10621 -0.26092,0.20951 -0.37695,0.33008 -0.0378,0.0193 -0.0754,0.0393 -0.11328,0.0586 0.002,-10e-4 0.008,0.004 0.004,0.004 -0.005,0.002 -0.0126,0.007 -0.0195,0.01 -0.0443,0.0326 -0.0853,0.072 -0.125,0.10937 -0.0763,0.0771 -0.15457,0.15293 -0.23243,0.22852 -0.10582,0.1096 -0.20012,0.23357 -0.33203,0.31445 -0.0287,0.0197 -0.0595,0.034 -0.0859,0.0566 -0.0136,0.0113 -0.0298,0.0316 -0.0449,0.043 -0.0148,0.01 -0.0337,0.0204 -0.0527,0.0312 0.004,-0.004 0.008,-0.007 0.004,-0.006 -0.009,0.005 -0.019,0.0114 -0.0273,0.0195 0.007,-0.004 0.0138,-0.007 0.0215,-0.0117 -0.004,0.003 -0.008,0.006 -0.01,0.008 -0.01,0.005 -0.01,0.005 -0.0156,0.008 -0.0287,0.0301 -0.0524,0.075 -0.0723,0.0976 -0.0868,0.033 -0.1801,0.0525 -0.26172,0.0957 -0.009,0.008 -0.0185,0.0154 -0.0273,0.0234 0.0223,0.004 0.0958,-0.007 0.125,-0.0156 0.0463,-0.0146 0.0823,-0.0484 0.0957,-0.0625 -0.007,0.0101 -0.0231,0.0309 -0.0469,0.0684 -0.1081,0.15194 -0.11798,0.14777 -0.28126,0.26758 -0.008,0.004 0.01,-0.005 0.0176,-0.008 0.0329,-0.017 0.0558,-0.0493 0.0898,-0.0645 -0.005,0.006 -0.0247,0.0267 -0.0332,0.0352 -0.0578,0.0643 -0.11398,0.12797 -0.16992,0.19336 -0.24151,0.29359 -0.55872,0.46349 -0.87695,0.66797 -0.0762,0.0487 -0.14661,0.0758 -0.21094,0.0879 -0.75338,0.67131 -1.4788,1.37 -2.24219,2.03125 -0.0247,0.0605 -0.0659,0.12369 -0.1289,0.1875 -0.008,0.0113 -0.0159,0.0198 -0.0234,0.0273 -0.14751,0.15674 -0.30112,0.30825 -0.43945,0.47266 -0.18373,0.2217 -0.37871,0.43135 -0.64063,0.5625 -0.082,0.0321 -0.0226,-9.7e-4 -0.10156,0.0859 -0.0843,0.0934 -0.18279,0.16415 -0.27539,0.24805 -0.15965,0.12586 -0.33874,0.22161 -0.49219,0.35352 -0.0933,0.0911 -0.1792,0.18713 -0.28125,0.26953 -0.0567,0.0461 -0.12186,0.0804 -0.17969,0.125 -0.0355,0.0272 -0.0695,0.0595 -0.10351,0.0859 -0.12246,0.0956 -0.23736,0.18184 -0.37305,0.25781 -0.0518,0.0291 -0.11216,0.0421 -0.16016,0.0762 -0.0219,0.0166 -0.0416,0.0436 -0.0605,0.0625 -0.12435,0.1251 -0.25148,0.26432 -0.41211,0.3418 -0.0552,0.0215 -0.0178,0.003 -0.082,0.0625 -0.11324,0.10582 -0.23264,0.21794 -0.37891,0.27539 -0.0558,0.0215 -0.10687,0.0368 -0.1582,0.0586 -10e-4,5.7e-4 -0.003,9.5e-4 -0.004,0.002 -13.40409,11.01594 -28.22153,20.54049 -44.37109,28.15821 -25.22748,11.89973 -57.90619,19.78905 -81.97071,19.78906 h -8.27734 v 20.5 l 0.0117,20.51758 11.25,-0.61719 c 16.96198,-0.93033 36.67553,-3.89496 51.89258,-7.80273 61.70689,-15.8465 116.78108,-55.75206 150.65234,-109.16211 28.50765,-44.95238 42.49468,-98.69008 39.19531,-150.5918 -1.06408,-16.73836 -1.39627,-19.44034 -4.1582,-33.86133 C 530.19343,213.05255 479.70534,147.03748 407.85547,111.77734 376.00843,96.14856 344.18842,87.972087 307.10547,85.890625 Z M 439.17188,497.46094 c 0.001,-10e-4 0.003,-0.003 0.004,-0.004 -0.004,0.002 -0.0102,0.006 -0.0137,0.008 0.002,-0.001 0.006,-0.002 0.01,-0.004 z m 0.90039,-0.80078 c 0.005,-0.004 0.01,-0.01 0.0156,-0.0137 -0.0208,0.0106 -0.0423,0.0192 -0.0625,0.0312 0.009,-0.003 0.0294,-0.01 0.0469,-0.0176 z M 331,128.77734 c 0.0123,0.002 0.0249,0.003 0.0371,0.006 0.01,0.002 0.0151,0.0128 0.0215,0.0215 -0.0196,-0.009 -0.0386,-0.019 -0.0586,-0.0273 z m 143.03711,28.42578 c 0.008,0.0106 0.0198,0.0352 0.0273,0.0527 -0.008,-0.0174 -0.016,-0.0326 -0.0273,-0.0527 z m -43.61914,16.25 c 0.0122,0.006 0.0364,0.0159 0.0781,0.0352 0.0281,0.0139 0.0609,0.0325 0.0937,0.0508 -0.0794,-0.0408 -0.14688,-0.0735 -0.17187,-0.0859 z m 12.89062,11.78126 c -0.003,2.2e-4 -0.004,0.002 0,0.004 0.0266,0.0144 0.0542,0.0253 0.082,0.0371 -0.009,-0.01 -0.0188,-0.0186 -0.0293,-0.0273 -0.0102,-0.009 -0.0431,-0.0148 -0.0527,-0.0137 z m 24.92969,28.0039 c -0.004,5.4e-4 -0.008,0.003 -0.0117,0.004 0.0537,0.0738 0.10848,0.14682 0.16211,0.2207 -0.008,-0.0333 -0.0146,-0.0648 -0.0234,-0.0996 -0.0247,-0.0968 -0.0693,-0.133 -0.12695,-0.125 z M 332.34961,299.3418 c -0.0516,0.0516 0.25111,0.45697 0.87305,1.25 0.75484,0.9625 1.5425,1.75 1.75,1.75 0.82303,0 0.29265,-0.82059 -1.37305,-2.12696 -0.79304,-0.62192 -1.19838,-0.92466 -1.25,-0.87304 z m 175.75391,65.16211 c -0.004,0.0411 -0.008,0.0684 -0.01,0.0898 0.003,-0.008 0.006,-0.0113 0.01,-0.0215 -3e-5,-0.0161 2.2e-4,-0.0563 0,-0.0684 z m -1.26954,8.84375 c -0.002,0.006 -0.004,0.0107 -0.006,0.0156 0.002,-0.002 0.004,-0.004 0.006,-0.008 0,-0.002 -1.3e-4,-0.005 0,-0.008 z m -196.1875,220.60156 c 0.0249,-1.1e-4 0.0435,0.003 0.0527,0.004 -0.008,0 -0.0276,-0.002 -0.0527,-0.004 z" />
			<path
			   id="path4504"
			   style="fill:#dadada;stroke-width:0.999999"
			   transform="scale(0.26458333)"
			   d="m 297.26953,84 c -12.549,0.01739 -25.27158,0.605744 -33.41992,1.759766 -48.24051,6.832063 -90.26607,24.704704 -127.5,54.224614 -12.98843,10.29702 -33.53848,31.47644 -43.734376,45.07031 -27.519958,36.69155 -43.454851,75.87746 -49.86914,122.63476 -2.106437,15.35506 -2.081818,48.5029 0.04687,64.15235 7.800775,57.34102 32.641016,107.72394 72.996086,148.05078 20.53827,20.52385 40.98454,35.26293 66.49024,47.93164 33.10178,16.44166 63.48456,24.37439 103.07031,26.91016 27.10566,1.73576 66.68365,-4.04093 94.69336,-13.82227 91.7246,-32.03135 155.87387,-110.58033 169.92579,-208.07031 2.3698,-16.44635 2.38768,-49.46938 0.0273,-66.5 -8.12027,-58.68378 -34.34508,-110.59567 -76.27539,-151 C 434.11418,117.17339 386.94807,94.363411 329.65625,85.667969 322.19539,84.535528 309.81854,83.982622 297.26953,84 Z m -0.91992,1.279297 10.75,0.601562 c 37.08299,2.081462 68.90299,10.25777 100.75,25.886721 27.64913,13.56873 49.98652,29.86107 71.19141,51.92578 34.31202,35.70327 56.86917,79.23925 66.14062,127.64844 2.76193,14.421 3.09415,17.12338 4.1582,33.86132 3.29949,51.90172 -10.68769,105.63942 -39.19531,150.5918 -39.05374,61.58207 -106.03914,104.72383 -177.79492,114.50781 -7.425,1.01243 -18.5625,2.1176 -24.75,2.45704 l -11.25,0.61718 v -20.36328 -20.36523 l -11.7832,-0.63282 C 207.9276,547.89532 138.73275,501.80121 104.92969,432.35352 67.547592,355.55238 79.541511,264.7132 135.62695,199.8418 c 31.1678,-36.0502 74.29275,-60.91827 121.22266,-69.90039 10.09047,-1.93127 25.60353,-3.59961 33.46094,-3.59961 h 6.03906 v -20.53125 z m 17,41.183593 c -0.25061,0 -0.46278,0.0458 -0.69141,0.0742 0.0115,0.005 0.0211,0.0106 0.0273,0.0176 0.0101,-5e-5 0.0219,5e-5 0.0273,0 0.059,-2.9e-4 0.11906,-5.8e-4 0.17773,0.002 0.0735,-0.005 0.14825,-0.0101 0.22071,0.0137 0.0219,0.0233 0.15787,-0.0122 0.20508,0.0215 -0.0758,0.0117 0.11693,-0.001 0.13281,0.006 0.0449,-0.005 0.19135,-0.0185 0.22461,0.0137 0.002,0.002 10e-4,0.003 -0.004,0.004 0.0518,-9.4e-4 0.10473,-0.002 0.15625,0.004 0.008,6.5e-4 0.0291,-0.004 0.0234,0.002 -0.005,0.005 -0.0172,0.01 -0.0273,0.0117 0.0454,-0.005 0.0912,-0.0157 0.13671,-0.0195 0.0676,-0.006 0.13716,0.0271 0.20508,0.0234 0.0874,-7.6e-4 0.17434,0.002 0.26172,0.004 0.01,0 0.0312,-0.0102 0.0312,0 0.005,0.0679 -0.018,0.16468 -0.0391,0.25782 0.0206,10e-4 0.042,0.002 0.0625,0.008 0.005,-0.11867 0.0186,-0.22808 0.0781,-0.25781 8e-4,-0.007 -2.1e-4,-0.0146 0.002,-0.0215 0.0164,0.003 0.0326,0.01 0.0488,0.0117 0.0663,0.008 0.13273,0.0147 0.19921,0.0215 0.0949,0.009 0.19018,0.0186 0.28516,0.0273 0.0515,0.005 0.0976,0.0147 0.13867,0.0273 -0.0552,-0.0199 -0.0534,-0.0378 -0.13281,-0.0586 -0.48125,-0.12574 -1.11563,-0.18945 -1.75,-0.18945 z m 1.99023,0.29688 c 0.0482,0.0294 0.084,0.0647 0.10743,0.10351 0.0104,-0.0324 -0.0381,-0.067 -0.10743,-0.10351 z m 8.00977,0.71093 c -0.18197,0 -0.34026,0.0456 -0.50195,0.084 0.01,0.01 0.0154,0.0141 0.0234,0.0215 0.0358,-1e-4 0.0715,-6.4e-4 0.10743,0 0.0414,-0.001 0.0926,-0.001 0.10546,0.004 -0.0486,1.1e-4 -0.18633,0.0544 -0.13867,0.0449 0.0925,-0.0181 0.13854,-0.053 0.20313,-0.0527 0.0215,1e-4 0.046,0.004 0.0742,0.0137 0.006,0.002 0.0121,-0.001 0.0156,0.006 0.002,0.003 -0.01,0.003 -0.008,0.004 0.0323,0.009 0.0704,-0.007 0.10351,0 h 0.002 c 0.0166,8.5e-4 0.0785,0.006 0.13867,0.01 -0.0359,0.002 -0.086,0.0143 -0.125,0.0273 h 0.0742 0.0684 0.0703 c 0.025,-0.005 0.0508,-0.01 0.0801,-0.0156 0.0102,0.006 0.018,0.0108 0.0254,0.0156 h 0.008 0.0703 c 0.0214,0 0.0433,1e-5 0.0645,0 0.0294,-10e-6 0.0584,-5e-5 0.0879,0 0.0285,-2e-5 0.0576,-4.7e-4 0.0859,0 0.0422,6.1e-4 0.07,0.001 0.11914,-0.002 0.008,0.003 0.0155,0.009 0.0234,0.0117 -0.0172,-8.2e-4 -0.0345,-0.001 -0.0508,0.006 -0.005,0.002 -0.0224,0.0117 -0.0371,0.0195 0.0168,-3.2e-4 0.0338,-0.001 0.0625,0.006 0.005,0.001 0.0148,0.003 0.0234,0.006 0.0139,-0.006 0.0261,-0.0108 0.0449,-0.0195 -0.013,-0.005 -0.026,-0.0105 -0.0391,-0.0156 0.0159,0.001 0.0312,0.01 0.0469,0.0117 0.002,1.5e-4 0.004,1e-4 0.006,0 -0.005,0.003 -0.009,0.009 -0.0137,0.0117 0.0312,0.0125 0.0633,0.0242 0.0957,0.0332 0.001,3.3e-4 0.003,-3.2e-4 0.004,0 0.0123,-2.1e-4 -0.0422,-0.0312 -0.0801,-0.041 0.01,-0.005 0.0186,-0.008 0.0293,-0.0137 0.0426,0.0113 0.0779,0.0371 0.11719,0.0547 h 0.0703 0.20508 c -0.006,-0.003 -0.005,-0.005 -0.0117,-0.008 -0.34375,-0.13871 -0.79687,-0.20899 -1.25,-0.20898 z m 0.15234,0.13672 c 0.0526,0.004 0.10023,0.006 0.11133,0.008 -0.005,2.1e-4 -0.0297,9e-4 -0.0859,-0.004 4.7e-4,2.3e-4 0.007,0.005 0.0137,0.008 -0.0133,-0.003 -0.0257,-0.009 -0.0391,-0.0117 z m 7.84766,0.86328 c -0.39998,0 -0.77877,0.0754 -1.10352,0.1836 0.0573,0.0254 0.11063,0.0639 0.17188,0.0742 0.0461,0.008 -0.0833,-0.0447 -0.12109,-0.0723 -0.006,-0.004 0.0127,-1.5e-4 0.0195,-0.002 0.0821,-0.011 0.16392,-0.004 0.24609,-0.004 0.0993,-0.009 0.19391,0.005 0.28711,0.041 0.0254,0.0142 0.0869,0.0513 0.0977,0.0605 -0.0393,-0.0136 -0.0732,-0.0418 -0.11329,-0.0527 -0.0665,-0.0181 -0.11891,0.0119 -0.17382,0.041 0.076,0.009 0.15241,0.0132 0.22851,0.0215 0.0146,-7.5e-4 0.0294,-4.6e-4 0.0488,0 0.0208,4.9e-4 0.0412,0.008 0.0605,0.0156 -0.0363,-0.006 -0.0727,-0.0117 -0.10938,-0.0156 -0.0804,0.004 -0.10027,0.0279 -0.16015,0.0762 0.0973,-1.5e-4 0.19568,-0.009 0.29296,-0.008 0.0418,-0.007 0.0825,-0.003 0.12305,0.008 0.0527,0.0137 0.10348,0.0382 0.15235,0.0664 0.0104,0.003 0.0215,0.005 0.0312,0.008 0.007,0.002 0.0197,0.007 0.0293,0.0117 h 0.002 c 0.0224,0.004 -0.002,-2.8e-4 0.0566,0.0234 h 0.002 c 0.002,-0.011 0.0222,0.004 0.0332,0.006 -0.004,-0.003 -0.007,-0.006 -0.008,-0.008 0.005,-0.001 0.0446,0.0154 0.0723,0.0254 0.10967,0.008 0.21564,0.042 0.32227,0.0664 0.01,-6.1e-4 0.0261,-0.002 0.0312,-0.002 0.068,0.0148 0.0595,0.0127 0.084,0.0176 0.0513,-0.0184 0.17125,0.004 0.20118,0.01 0.0278,0.005 0.0455,0.0129 0.0586,0.0195 0.006,-9.4e-4 0.007,-0.003 0.0137,-0.004 0.002,-8e-5 0.002,2.6e-4 0.004,0 0.54641,-0.0837 0.82875,-0.21299 0.36914,-0.39843 -0.34375,-0.13871 -0.79687,-0.20899 -1.25,-0.20899 z M 331,128.77734 c 0.0123,0.002 0.0249,0.003 0.0371,0.006 0.01,0.002 0.0151,0.0128 0.0215,0.0215 -0.0196,-0.009 -0.0386,-0.019 -0.0586,-0.0273 z m 0.30469,0.13282 c 0.002,0.001 0.005,0.002 0.008,0.004 0.008,0.002 0.0217,0.005 0.0273,0.006 -0.006,-0.003 -0.011,-0.006 -0.0176,-0.008 -0.006,-0.001 -0.0118,-1.1e-4 -0.0176,-0.002 z m 4.96289,0.55468 c -0.27317,-0.0113 -0.57627,0.0659 -0.86914,0.15235 0.004,6.5e-4 0.008,2.5e-4 0.0117,0.002 0.0754,0.009 0.13987,0.0184 0.21289,0.043 0.008,0.003 0.0318,0.009 0.0234,0.0117 -0.009,0.003 -0.018,0.006 -0.0273,0.008 0.0352,-0.005 0.072,-0.009 0.10742,-0.01 0.0337,-4.9e-4 0.13412,0.0377 0.1836,0.0664 h 0.002 c 0.009,9.6e-4 0.0182,-3.2e-4 0.0273,0.002 0.0185,0.003 0.0365,0.01 0.0547,0.0156 h 0.002 c 0.0285,-0.001 0.0568,-0.002 0.10157,-0.004 0.0552,0.0133 0.098,0.0256 0.14453,0.0469 0.0108,-5.9e-4 0.0224,-0.002 0.0332,-0.002 0.009,1.5e-4 0.0616,0.0222 0.0937,0.0391 0.0114,-0.002 0.0238,-0.003 0.0371,-0.004 0.0343,-0.004 0.071,0.004 0.10547,0.0137 0.0613,-0.0259 0.1065,-0.0395 0.0488,0.006 0.0375,0.005 0.25813,0.0469 0.27929,0.084 0.009,0.0151 -0.0338,-0.009 -0.0508,-0.0137 -0.0619,0.017 -0.24772,0.0349 -0.18554,0.0508 0.0964,0.0249 0.19879,0.001 0.29882,-0.01 -0.008,0.004 0.0101,0.003 0.0371,0.002 -0.003,-10e-4 -0.007,-0.004 -0.0117,-0.006 -0.005,2.9e-4 -0.0103,0.002 -0.0156,0.002 0.003,-8e-4 0.006,-0.003 0.01,-0.004 0.002,9.9e-4 0.004,2.5e-4 0.006,0.002 0.003,-1.4e-4 0.005,1.1e-4 0.008,0 0.008,0.006 0.007,0.006 0.004,0.006 h 0.002 c 0.0182,-8.3e-4 0.0403,-0.002 0.0625,-0.002 0.0646,-0.0689 0.16843,-0.13187 0.0762,-0.22461 -0.16615,-0.16615 -0.46511,-0.25911 -0.8125,-0.27344 z m -0.13086,0.33789 c -0.018,3.8e-4 -0.0256,0.006 -0.0586,0.0195 0.036,-0.004 0.0714,-0.0121 0.10743,-0.0176 -0.0232,-0.001 -0.0385,-0.002 -0.0488,-0.002 z m 137.90039,21.40039 c 0.008,0.0106 0.0198,0.0352 0.0273,0.0527 -0.008,-0.0174 -0.016,-0.0326 -0.0273,-0.0527 z m -44.1875,21.63868 0.89062,1.05273 c 0.13146,-0.0194 0.20924,-0.0517 0.19141,-0.10937 0.14634,0.15157 0.29541,0.29788 0.45508,0.43554 0.10998,0.13349 0.23634,0.30837 0.31836,0.43555 0.0692,0.0724 0.0594,0.0598 0.1289,0.13477 0.012,0.0131 0.0437,0.0397 0.0527,0.0508 v 0.002 h 0.002 c 0.0177,0.0125 0.0333,0.0225 0.0742,0.0527 0.0277,0.0217 0.0362,0.0289 0.0566,0.0449 h 0.002 c -0.006,-0.008 0.0528,0.0293 0.31055,0.21679 0.13228,0.13242 0.26382,0.26616 0.39649,0.39844 0.0782,0.0783 0.15771,0.15603 0.23632,0.23438 0.0954,0.0943 0.18908,0.18808 0.28125,0.28515 0.0522,0.0277 0.0546,0.0342 0.21289,0.1836 0.0257,0.0264 0.0989,0.0513 0.0762,0.0801 -0.002,0.003 -0.007,0.005 -0.01,0.008 0.007,0.003 0.0123,0.006 0.0195,0.01 0.0185,-0.005 0.0361,-0.0108 0.0547,-0.0156 0.1217,0.0909 0.2262,0.2041 0.33203,0.3125 0.034,0.0415 0.0665,0.0915 0.10547,0.1289 0.0935,0.0904 0.20537,0.16187 0.30859,0.24219 8.8e-4,-0.0109 0.004,-0.0168 0.004,-0.0293 0,-0.18977 -1.01255,-1.20224 -2.25,-2.25 z m 0.56836,0.61132 c 0.0122,0.006 0.0364,0.0159 0.0781,0.0352 0.0281,0.0139 0.0609,0.0325 0.0937,0.0508 -0.0794,-0.0408 -0.14688,-0.0735 -0.17187,-0.0859 z m 6.43164,5.38868 3.55469,3.82031 c 0.0901,-1.3e-4 0.19768,0.0415 0.30664,0.14453 0.21857,0.20661 0.47584,0.37316 0.64062,0.48828 0.0491,0.0837 0.1225,0.14099 0.19922,0.21485 0.0113,0.011 0.0238,0.0238 0.0352,0.0332 0.0117,0.01 0.0298,0.0101 0.0449,0.0195 0.0752,0.0508 0.12526,0.0968 0.17969,0.16797 0.0144,0.0283 0.0115,0.0131 0.0742,0.0703 0.0431,0.0428 0.0858,0.0863 0.1289,0.12891 0.0419,0.0418 0.0831,0.083 0.125,0.125 0.0401,0.04 0.0791,0.0811 0.11914,0.12109 0.0457,0.0459 0.0929,0.0908 0.13867,0.13672 0.0378,0.038 0.0751,0.0753 0.11329,0.11328 0.0291,0.0321 0.0616,0.065 0.0918,0.082 0.11528,0.0724 0.21877,0.1571 0.3125,0.25586 0.0612,0.0737 0.0473,0.0525 0.1543,0.15821 0.0522,0.0556 0.10636,0.10567 0.16797,0.15039 0.0722,0.0565 0.1303,0.12864 0.19531,0.19335 0.005,0.005 0.0207,0.0234 0.0352,0.043 0.0261,0.0114 0.0515,0.023 0.0762,0.0371 0.028,0.016 0.0476,0.0445 0.0703,0.0664 0.0427,0.0424 0.074,0.0844 0.0937,0.13281 0.0104,0.009 0.0221,0.0228 0.0391,0.0391 0.11755,0.103 0.21921,0.22212 0.31446,0.34571 0.0722,0.0773 0.16149,0.13774 0.23633,0.21484 0.071,0.08 0.14864,0.15319 0.2246,0.22852 0.0745,0.0741 0.14858,0.15041 0.22266,0.22461 0.0854,0.0852 0.17044,0.16864 0.25586,0.2539 0.0949,0.0839 0.19249,0.16362 0.2832,0.25977 0.005,0.006 0.006,0.005 0.01,0.01 0.0102,-0.0386 0.0566,-0.0205 0.0566,-0.0762 0,-0.16339 -1.91251,-2.07587 -4.25,-4.25 z m 6.45898,6.39258 c -0.003,2.2e-4 -0.004,0.002 0,0.004 0.0266,0.0144 0.0542,0.0253 0.082,0.0371 -0.009,-0.01 -0.0188,-0.0186 -0.0293,-0.0273 -0.0102,-0.009 -0.0431,-0.0148 -0.0527,-0.0137 z m 5.54102,5.60742 3.44727,3.75 c 3.20713,3.49045 4.05273,4.20893 4.05273,3.44531 0,-0.16709 -1.68751,-1.85461 -3.75,-3.75 z m 10.96289,11.66211 c 0.039,0.046 0.099,0.12442 0.14844,0.19336 0.0378,0.0377 0.0757,0.0754 0.11328,0.11328 0.0646,0.0644 0.13024,0.12752 0.19336,0.19336 0.0854,0.0919 0.12168,0.12795 0.23242,0.2207 0.15345,0.16388 0.0749,0.0703 0.24609,0.3125 0.0255,0.0253 0.0327,0.0298 0.0352,0.0293 0.002,0.003 0.0172,0.0311 0.0762,0.13086 0.0332,0.0306 0.10317,0.10219 0.0762,0.0879 -0.007,-0.004 -0.0129,-0.008 -0.0195,-0.0117 0.0161,0.018 0.0203,0.0258 0.0371,0.0625 0.12001,0.096 0.20852,0.17339 0.26367,0.23828 l 0.004,-0.004 c 0.0174,-0.0182 0.0377,0.0374 0.0566,0.0566 0.24087,0.26202 0.73195,0.80797 0.91602,1.01172 h -0.002 c 0.026,0.0289 0.0488,0.0572 0.0723,0.0859 0.21739,-0.25254 -0.44808,-1.02736 -2.16211,-2.47852 z m 1.13867,1.33203 c -0.007,-0.005 -0.0125,-0.01 -0.0195,-0.0156 0.0174,0.0285 0.0308,0.0504 0.0527,0.0859 -0.0172,-0.036 -0.0258,-0.0542 -0.0332,-0.0703 z m -0.0195,-0.0156 c -0.011,-0.0181 -0.0238,-0.0392 -0.0332,-0.0547 -0.0457,-0.0251 -0.0913,-0.0525 -0.13672,-0.0781 0.0624,0.0487 0.11889,0.0922 0.16992,0.13281 z m -0.0332,-0.0547 c 0.005,0.003 0.0105,0.005 0.0156,0.008 -0.008,-0.009 -0.0179,-0.0189 -0.0371,-0.043 0.005,0.009 0.0155,0.0252 0.0215,0.0352 z m 6.58984,8.3711 c 0.0165,0.0248 0.0336,0.0486 0.0488,0.0742 0.0253,0.0421 0.0836,0.1337 0.10351,0.18164 0.0829,0.11315 0.15507,0.23187 0.20118,0.35742 0.0267,0.0284 0.053,0.0579 0.0801,0.0859 0.0272,0.0283 0.0783,0.0452 0.082,0.084 0.003,0.0259 -0.0931,-0.0408 -0.0742,-0.0234 0.14502,0.12881 0.36563,0.18157 0.4707,0.36329 0.0116,0.0156 0.2815,0.35375 0.5293,0.75195 0.033,0.0375 0.0645,0.0759 0.0976,0.11328 0.0589,0.0661 0.11846,0.13153 0.17774,0.19727 0.0924,-0.0431 0.14453,-0.15713 0.14453,-0.35743 0,-0.20764 -0.78751,-0.99515 -1.75,-1.75 -0.0707,-0.0555 -0.0467,-0.0277 -0.11133,-0.0781 z m 0.75,1.10156 c -0.0106,10e-4 -0.0276,0.023 -0.0391,0.0273 0.0136,0.0176 0.028,0.0361 0.041,0.0566 0.0518,0.0816 0.10328,0.16201 0.1543,0.24414 0.007,0.0115 0.0144,0.0234 0.0215,0.0352 0.002,-0.001 0.004,-0.002 0.006,-0.004 -0.017,-0.0749 -0.0358,-0.15242 -0.0566,-0.23438 -0.0247,-0.0968 -0.0693,-0.133 -0.12695,-0.125 z m -176.8887,72.2324 c -0.45312,0 -0.90625,0.0703 -1.25,0.20899 -0.68753,0.27741 -0.12499,0.5039 1.25,0.5039 1.3751,0 1.93753,-0.22651 1.25,-0.5039 -0.34375,-0.13871 -0.79688,-0.20899 -1.25,-0.20899 z m 11,0 c -0.45313,0 -0.90625,0.0703 -1.25,0.20899 -0.6875,0.27741 -0.12499,0.5039 1.25,0.5039 1.3751,0 1.9375,-0.22651 1.25,-0.5039 -0.34375,-0.13871 -0.79687,-0.20899 -1.25,-0.20899 z m -39.18945,10.8711 c -0.275,0 -1.31506,0.9 -2.31055,2 -0.99553,1.09999 -1.58374,2 -1.30859,2 0.27499,0 1.3131,-0.90001 2.30859,-2 0.99553,-1.1 1.5857,-2 1.31055,-2 z m 66.18945,0 c -0.0516,0.0516 0.25111,0.45697 0.87305,1.25 0.75484,0.9625 1.54249,1.75 1.75,1.75 0.82303,0 0.29269,-0.82059 -1.37305,-2.12696 -0.79302,-0.62193 -1.19838,-0.92466 -1.25,-0.87304 z m 176.2793,2.3789 c -0.0283,0.0283 -0.0317,0.2157 -0.0547,0.2793 0.0337,0.1165 0.0639,0.23467 0.0879,0.35352 0,-0.003 -0.009,0.002 -0.008,0.004 0.005,0.01 0.01,0.0181 0.0156,0.0274 v 0.002 c 0.0122,0.0189 0.0271,0.0382 0.0371,0.0586 0.0714,0.15307 0.0895,0.20835 0.0664,0.34766 0.0974,0.29819 0.20977,0.59172 0.29297,0.89453 0.003,0.01 0.006,0.0195 0.008,0.0293 0.15773,-0.41551 0.18526,-0.99782 -0.041,-1.5625 -0.15949,-0.39888 -0.29896,-0.53874 -0.40429,-0.4336 z m -0.084,2.16211 c 0.008,0.023 0.0163,0.0365 0.0254,0.0566 -0.008,-0.018 -0.0182,-0.0364 -0.0254,-0.0566 z m -247.38476,0.45899 c -0.275,0 -1.31506,0.9 -2.31055,2 -0.99553,1.09999 -1.58374,2 -1.30859,2 0.27499,0 1.3131,-0.90001 2.30859,-2 0.99549,-1.1 1.5857,-2 1.31055,-2 z m 76.68945,0.5 1.90625,2.25 c 1.79021,2.11445 2.59375,2.70454 2.59375,1.90429 0,-0.18977 -1.01251,-1.20225 -2.25,-2.25 z m 171.83008,2.93359 c 0.009,0.0253 0.0154,0.0405 0.0137,0.0195 0.0195,0.0985 0.0232,0.19755 0.0586,0.29297 0.0334,0.12366 0.0607,0.24202 0.0508,0.36523 -10e-5,0.001 1.2e-4,0.003 0,0.004 l 0.002,0.002 c 0.0404,0.13452 0.0402,0.10557 0.0391,0.16797 -4.5e-4,0.048 0.004,0.0969 -0.004,0.14453 -0.002,0.007 1e-4,0.017 0,0.0274 -2e-5,0.002 8e-5,0.004 0,0.006 0.005,0.0451 0.0105,0.0869 0.0176,0.14062 h 0.002 c 0.0365,8e-5 0.0277,0.0687 0.0391,0.10352 0.0805,0.25498 0.10472,0.36406 0.17578,0.63672 h 0.006 c 5.3e-4,0.002 5.5e-4,0.004 0.002,0.006 0.1474,-0.41628 0.17291,-0.98362 -0.0488,-1.53711 -0.13941,-0.34867 -0.25414,-0.4167 -0.35351,-0.37891 z m 0.0117,1.26953 c -0.0746,0.0292 -0.14874,0.0563 -0.22461,0.0781 2.2e-4,0.005 0.002,0.008 0.002,0.0137 0.13258,0.004 0.26689,0.0297 0.39844,0.0137 0.0227,-0.003 0.0257,-0.0682 0.004,-0.0742 -0.0588,-0.0149 -0.11941,-0.024 -0.17968,-0.0312 z m 1.125,5.75781 c -0.009,-0.003 -0.008,0.0672 -0.0156,0.0742 0.004,0.006 0.009,0.0123 0.0117,0.0195 0.0258,0.0679 0.0375,0.12468 0.0332,0.17579 0.016,0.0483 0.0132,0.0434 0.0195,0.11914 0.0118,0.0303 -0.005,0.0568 -0.0137,0.084 0.001,-0.005 0.004,-0.009 0.006,-0.0117 0.009,-0.0131 6.5e-4,0.0314 0.002,0.0469 9.3e-4,0.0408 -1e-5,0.0822 0,0.12304 7e-5,0.047 -1e-5,0.0937 0,0.14063 v 0.0625 c 0.004,0.0114 0.007,0.0214 0.01,0.0332 0.004,0.024 0.005,0.05 0.008,0.0742 -0.002,0.024 -0.003,0.0403 -0.004,0.0527 6.4e-4,0.0355 0,0.0719 0,0.10742 7e-5,0.0331 0,0.0663 0,0.0996 v 0.002 c 0.0233,0.057 0.0291,0.11762 0.0215,0.17969 0.003,-0.0152 -7.5e-4,0.0159 0.002,0.006 0.001,0.0404 0.003,0.0806 0.002,0.12109 0.002,0.008 0.0462,0.0239 0.0449,0.0449 0.005,0.005 0.0107,0.0131 0.0176,0.0234 0.0911,0.27708 0.0341,0.0601 0.0605,0.27344 0,0.007 0.0102,0.0104 0.0117,0.0176 0.0196,0.10014 0.0145,0.0801 0.0176,0.16601 -0.01,0.081 -0.01,0.16288 -0.008,0.24414 6.7e-4,0.0267 0.002,0.0534 0.002,0.0801 0.005,0.0172 0.0101,0.0387 0.0176,0.0703 0.003,0.01 0.004,0.0197 0.006,0.0293 0.17723,-0.68377 0.18619,-1.57317 -0.0547,-2.16992 -0.0692,-0.1719 -0.13679,-0.26662 -0.19726,-0.28907 z m 0.96289,9.33399 c -0.12964,0.0698 -0.22266,0.67383 -0.23438,1.70508 -0.0189,1.65001 0.18711,2.44655 0.46094,1.76953 0.27477,-0.67703 0.28836,-2.02703 0.0371,-3 -0.0953,-0.36488 -0.18581,-0.51647 -0.26367,-0.47461 z M 349.62891,331.7207 c -0.10515,0.10515 -0.17522,0.45465 -0.19922,1.03711 -0.0434,1.05417 0.19317,1.6448 0.52539,1.3125 0.33222,-0.33229 0.36803,-1.19414 0.0781,-1.91601 -0.15961,-0.39888 -0.29915,-0.53874 -0.40429,-0.4336 z m -106.8125,1.08203 c -0.18085,-0.0674 -0.3086,0.50782 -0.3086,1.53907 0,1.37499 0.22647,1.9375 0.50391,1.25 0.27742,-0.6875 0.27742,-1.8125 0,-2.5 -0.0693,-0.1719 -0.13499,-0.26662 -0.19531,-0.28907 z m 0,10 c -0.18085,-0.0674 -0.3086,0.50782 -0.3086,1.53907 0,1.37499 0.22647,1.9375 0.50391,1.25 0.27742,-0.6875 0.27742,-1.8125 0,-2.5 -0.0693,-0.1719 -0.13499,-0.26662 -0.19531,-0.28907 z m 107,1 c -0.18085,-0.0674 -0.3086,0.50782 -0.3086,1.53907 0,1.37499 0.22651,1.9375 0.50391,1.25 0.27742,-0.6875 0.27742,-1.8125 0,-2.5 -0.0693,-0.1719 -0.13511,-0.26662 -0.19531,-0.28907 z m 158.99609,9.72461 c -0.11943,0.11887 -0.2018,0.93946 -0.20898,2.31446 -0.0113,2.19997 0.18519,3.2178 0.43554,2.26172 0.24907,-0.9561 0.26305,-2.75609 0.0195,-4 -0.0896,-0.46647 -0.17466,-0.64748 -0.24609,-0.57618 z m -0.71289,11.07618 c -0.002,0.006 -0.006,0.0125 -0.008,0.0176 -0.004,0.055 6.8e-4,0.0255 -0.0195,0.0996 2.5e-4,0.005 0.002,0.0104 0.002,0.0156 0,0.0732 -0.0143,0.12485 -0.0332,0.20312 -0.0113,0.0175 -0.0276,0.0335 -0.0312,0.0527 0.004,-0.006 0.0168,-0.0258 0.0195,-0.0195 0.011,0.0249 -0.0549,0.23406 -0.0625,0.25976 -0.024,0.0883 -0.05,0.17551 -0.0762,0.26367 2.6e-4,-0.006 0.002,-0.01 0.004,-0.008 0.0287,0.0371 -0.0271,0.25895 -0.0195,0.28125 0.004,0.0488 0.007,0.0956 0.008,0.14453 -0.002,0.0417 -2.6e-4,0.0832 0,0.125 v 0.0879 0.004 c -0.008,0.0252 -0.0145,0.0509 -0.0215,0.0762 v 0.002 c 0.002,0.0368 0.004,0.0725 0.004,0.082 1.2e-4,0.0211 0.002,0.038 0.002,0.0645 0.003,0.0387 -0.009,0.0748 -0.0195,0.11133 0.005,0.13788 -0.0574,0.22592 -0.125,0.33008 0.0835,0.0945 0.18061,0.0684 0.29101,-0.20508 0.22063,-0.54677 0.21648,-1.32823 0.0859,-1.98828 z m -0.20899,0.89257 c -0.004,0.0132 -0.008,0.0259 -0.0117,0.0391 -0.004,0.008 0.008,-0.0143 0.0117,-0.0215 5.9e-4,-0.005 -1.8e-4,-0.0113 0,-0.0176 z m -0.0332,0.625 c -2.2e-4,0.005 0.002,0.0396 0.004,0.0762 10e-4,-0.0106 0.003,-0.0228 0.002,-0.0371 -0.003,-0.0337 -0.006,-0.0429 -0.006,-0.0391 z m -0.85937,5.99414 c -0.008,0.0234 -0.0159,0.0469 -0.0234,0.0703 0.002,0.0269 0.002,0.0532 0.004,0.0801 -0.0283,0.13547 -0.0318,0.27395 -0.0469,0.41016 -0.007,0.0223 -0.01,0.0373 -0.0137,0.0508 0.005,-0.01 0.008,-0.0111 0.006,0.0176 -0.004,0.0328 -0.008,0.0651 -0.0117,0.0977 -0.009,0.0485 -0.0103,0.0581 -0.0117,0.0586 l -0.002,-0.002 c 9.1e-4,-0.008 7.5e-4,-0.0188 0.002,-0.0254 -0.004,0.0217 -0.006,0.0445 -0.01,0.0664 0.1223,-0.18095 0.0363,0.0231 -0.0273,0.15625 7.7e-4,0.005 7.5e-4,0.0107 0.002,0.0156 0.003,0.0272 -7.5e-4,0.0595 -0.002,0.0859 0.006,0.0277 -0.004,0.0712 -0.0176,0.11328 v 0.002 c 0.012,0.0603 -0.005,0.13074 -0.0215,0.18945 -0.006,0.0414 -0.0152,0.0816 -0.0215,0.12305 -7.8e-4,0.005 -7.5e-4,0.0105 -0.002,0.0156 -5e-4,0.002 -7.5e-4,0.004 -0.002,0.006 -0.0107,0.0422 -0.0213,0.0845 -0.0371,0.125 -0.007,0.0181 -0.0284,0.0478 -0.0391,0.0625 -1.8e-4,0.001 -0.002,0.002 -0.002,0.004 v 0.002 c -4.1e-4,10e-4 4e-4,0.003 0,0.004 -0.002,0.006 -0.005,0.0113 -0.006,0.0176 -10e-4,0.006 -7.4e-4,0.0133 -0.002,0.0195 0.0135,-0.005 0.005,0.0196 -0.0117,0.0547 3e-5,0.017 -0.002,0.0318 -0.004,0.0469 0.0806,0.067 0.15178,0.19388 0.25781,0.0879 0.33222,-0.33222 0.36784,-1.19416 0.0781,-1.91601 -0.0141,-0.0354 -0.0213,-0.008 -0.0352,-0.0391 z m -0.0254,0.0781 c -0.005,0.0146 -0.009,0.0283 -0.0137,0.043 -0.004,0.0117 0.0119,-0.0192 0.0137,-0.0312 2.4e-4,-0.003 -3e-5,-0.008 0,-0.0117 z m -253.12305,0.64844 1.90625,2.25 c 1.04776,1.23748 2.06027,2.25 2.25,2.25 0.80024,0 0.20818,-0.80546 -1.90625,-2.59571 z m 253.00781,0.21679 c 10e-4,0.006 0.003,0.0131 0.004,0.0195 3.1e-4,-0.003 -1.2e-4,-0.005 0,-0.008 -0.002,-0.007 -0.003,-0.006 -0.004,-0.0117 z m -168.50781,0.28321 c -0.0516,-0.0514 -0.45696,0.25096 -1.25,0.87304 -0.9625,0.75489 -1.75,1.54253 -1.75,1.75 0,0.82303 0.82255,0.29249 2.12891,-1.37304 0.62194,-0.79307 0.92271,-1.19841 0.87109,-1.25 z m 168.48437,0.006 c -0.003,0.009 -0.006,0.0156 -0.01,0.0234 0.003,-0.006 0.006,-0.008 0.01,-0.0156 0,-0.002 -1.3e-4,-0.005 0,-0.008 z m -0.13671,0.50195 c -0.001,0.004 -0.001,0.0163 0.002,0.0352 4e-4,0.004 -3.1e-4,0.008 0,0.0117 0.001,-0.007 0.004,-0.012 0.004,-0.0176 -4e-5,-0.002 -3.5e-4,-0.006 0,-0.01 -3.3e-4,-0.017 -0.004,-0.0259 -0.006,-0.0195 z m -0.74415,4.21875 c -0.003,0.0104 -0.006,0.0214 -0.01,0.0312 -0.004,-0.008 -0.004,-0.0329 -0.008,-0.0254 -0.008,0.0159 0.0405,0.25133 -0.0332,0.29101 -0.0136,-0.0159 -0.0647,0.2672 -0.0723,0.25586 -0.008,-0.008 -0.0145,-0.0212 -0.0156,-0.0137 -0.0113,0.0707 0.008,0.14618 -0.0352,0.21875 -0.003,0.0189 -0.0299,0.17616 -0.0488,0.1875 -0.002,0.002 -0.002,2.8e-4 -0.002,-0.004 2.7e-4,0.0142 0.001,0.0326 -0.002,0.0234 -0.004,-0.008 -0.009,-0.0243 -0.0117,-0.0371 0.0131,0.0899 0.0137,0.0832 0.0137,0.0703 6.2e-4,0.007 0.002,0.0206 0.006,0.0605 -0.004,0.0975 10e-4,0.0781 -0.0215,0.19532 -0.004,0.0113 -0.0136,0.0179 -0.0156,0.0293 -0.002,0.0113 0.0113,0.0375 0,0.0352 -0.07,-0.0152 -0.14026,-0.0349 -0.20899,-0.0566 0.002,0.0233 0.005,0.046 0.008,0.0684 0.18515,0.0511 0.23876,0.0705 0.21485,0.13086 -0.001,0.006 -0.003,0.0102 -0.004,0.0156 0.002,-0.004 0.004,-0.008 0.006,-0.0117 -5.2e-4,0.009 -0.004,0.0287 -0.01,0.0371 0.002,-0.006 0.002,-0.0155 0.004,-0.0234 -0.005,0.008 -0.0109,0.0174 -0.0176,0.0273 0.002,3.2e-4 0.004,-3.3e-4 0.006,0 -0.004,0.006 -0.01,0.0223 -0.01,0.006 -0.001,0.002 -0.002,0.004 -0.004,0.006 -0.005,0.0269 -0.0145,0.0989 -0.041,0.27734 -0.005,0.0318 -0.008,0.0639 -0.0117,0.0957 0.0908,0.13649 0.19201,0.24547 0.32617,0.11133 0.33222,-0.33222 0.36784,-1.19416 0.0781,-1.91601 -0.0316,-0.079 -0.0502,-0.0271 -0.0801,-0.0859 z m -246.60351,0.27344 c -0.0516,0.0518 0.25111,0.45698 0.87305,1.25 1.30633,1.66575 2.12695,2.19607 2.12695,1.37304 0,-0.20749 -0.78751,-0.99515 -1.75,-1.75 -0.79304,-0.62199 -1.19838,-0.92463 -1.25,-0.87304 z m 73.81055,0 c -0.275,0 -1.31506,0.9 -2.31055,2 -0.99553,1.10003 -1.58374,2 -1.30859,2 0.27499,0 1.3131,-0.89997 2.30859,-2 0.99553,-1.1 1.5857,-2 1.31055,-2 z m -41.81055,14.1289 c -0.45312,0 -0.90625,0.0703 -1.25,0.20899 -0.68753,0.27741 -0.12499,0.5039 1.25,0.5039 1.3751,0 1.93753,-0.22641 1.25,-0.5039 -0.34375,-0.13871 -0.79688,-0.20899 -1.25,-0.20899 z m 11,0 c -0.45313,0 -0.90625,0.0703 -1.25,0.20899 -0.6875,0.27741 -0.12499,0.5039 1.25,0.5039 1.3751,0 1.9375,-0.22641 1.25,-0.5039 -0.34375,-0.13871 -0.79687,-0.20899 -1.25,-0.20899 z m 164,75.8711 c -0.0484,-0.0484 -0.47287,0.27123 -1.17773,0.82226 -0.0616,0.10621 -0.10556,0.22375 -0.18165,0.32227 -0.0884,0.14188 -0.17234,0.29154 -0.30273,0.40039 -0.0654,0.0559 -0.0865,0.13396 -0.13867,0.20312 -0.0745,0.10583 -0.13964,0.21965 -0.22656,0.31641 -0.0745,0.0926 -0.11507,0.20509 -0.20313,0.28711 -0.0355,0.0329 -0.0818,0.0963 -0.13281,0.15039 -0.0136,0.0113 -0.18163,0.22334 -0.13477,0.15039 0.005,-0.0149 0.007,-0.0221 0.0156,-0.0449 -0.0382,0.093 -0.0986,0.16393 -0.17578,0.23242 -0.0441,0.0438 -0.0874,0.0884 -0.13086,0.13281 0.31654,0.0463 0.98607,-0.53453 1.91797,-1.72265 0.62192,-0.79302 0.92272,-1.19837 0.87109,-1.25 z m -4.18945,5 c -10e-4,0 -0.007,0.008 -0.008,0.008 -0.007,0.0126 -0.0142,0.0248 -0.0215,0.0371 -0.005,-9e-4 0.0355,-0.0449 0.0293,-0.0449 z m -0.11133,0.16992 c -0.072,0.0987 -0.15327,0.19133 -0.23438,0.28125 -0.0752,0.0729 -0.15865,0.14001 -0.21875,0.22656 -0.0714,0.0869 -0.1511,0.16439 -0.23047,0.24414 -0.0359,0.0348 -0.0772,0.0675 -0.10742,0.10156 -0.0499,0.0741 -0.10163,0.14783 -0.15039,0.22266 -0.0688,0.0843 -0.14473,0.16204 -0.2207,0.24023 -0.059,0.031 -0.12369,0.0532 -0.17774,0.0918 -0.028,0.0217 0.0643,-0.0177 0.0957,-0.0332 -8e-4,0.001 -8.8e-4,0.003 -0.002,0.004 -0.0181,0.0246 -0.0279,0.0497 -0.043,0.0762 -0.0627,0.10809 -0.12609,0.217 -0.22852,0.29297 -0.0471,0.0889 -0.12632,0.15777 -0.19141,0.23242 -0.10242,0.11376 -0.15879,0.25115 -0.25781,0.36719 l -0.13281,0.13476 c -0.0386,0.0385 -0.0767,0.0771 -0.11524,0.11524 -0.0521,0.0521 -0.10295,0.10327 -0.15625,0.15429 -0.0563,0.0533 -0.13629,0.15009 -0.20507,0.21094 -0.13153,0.12057 -0.27082,0.23182 -0.39063,0.36523 l -0.24805,0.24805 c 0.39796,-0.18962 1.14649,-0.78572 2.01563,-1.74609 0.91098,-1.00658 1.3195,-1.69478 1.19922,-1.83008 z m -4.79297,5.83008 c -0.1299,0 -1.35121,1.23357 -2.08008,1.88867 -0.0245,0.0448 -0.0528,0.0885 -0.0898,0.125 -0.0613,0.0773 -0.0928,0.17402 -0.16016,0.24609 -0.004,0.007 -0.0125,0.0207 -0.0332,0.0527 -0.0473,0.0729 -0.0991,0.14013 -0.1543,0.20703 -0.0423,0.0575 -0.0352,0.0502 -0.0937,0.11328 -0.002,0.002 -0.005,0.004 -0.008,0.006 0.009,-0.0203 0.0345,-0.075 0.0234,-0.0566 -0.0151,0.0234 -0.0258,0.0497 -0.0371,0.0762 -0.0166,0.0238 -0.0357,0.0496 -0.0508,0.0723 -0.10848,0.12812 -0.22287,0.24995 -0.34571,0.36523 -0.0748,0.0745 -0.14083,0.16023 -0.22851,0.2207 -0.027,0.0177 -0.15282,0.15679 -0.15235,0.125 -0.0386,0.0753 -0.0907,0.15108 -0.14062,0.1875 -0.0707,0.0964 -0.12382,0.20541 -0.2168,0.28516 -0.0741,0.0673 -0.11896,0.15141 -0.18359,0.22852 -0.0722,0.0722 -0.14385,0.14734 -0.2168,0.21874 -0.0752,0.0718 -0.0827,0.0638 -0.10156,0.10157 -0.0272,0.0435 -0.0557,0.0949 -0.0937,0.1289 -0.004,0.003 -0.013,-5e-5 -0.0156,0.004 -0.0306,0.0523 -0.0424,0.0773 -0.0449,0.0859 0.002,-5.4e-4 0.007,-0.004 0.0117,-0.01 -0.0185,0.0254 -0.029,0.0422 -0.0781,0.11133 -0.0744,0.0673 -0.13943,0.13598 -0.19726,0.21875 -0.0416,0.0367 -0.0716,0.0762 -0.10938,0.125 -0.0605,0.0548 -0.0941,0.13837 -0.16406,0.1875 -0.0412,0.0333 -0.0308,0.0171 -0.0742,0.084 -0.0571,0.0915 -0.13075,0.16849 -0.20898,0.24219 -0.0654,0.0654 -0.13031,0.12993 -0.19531,0.19531 -0.0434,0.044 -0.0885,0.0874 -0.13282,0.13086 0.79253,-0.72192 1.10961,-0.88495 2.16602,-1.96679 2.14821,-2.19999 3.6814,-4 3.40625,-4 z m -13.6582,13.77929 c -0.1451,0.14673 -0.28915,0.29444 -0.44141,0.4336 -0.0612,0.0556 -0.11897,0.14101 -0.17187,0.19922 -0.12208,0.13519 -0.24959,0.26609 -0.37696,0.39648 -0.15337,0.15402 -0.30333,0.31127 -0.46094,0.46094 -0.19846,0.19109 -0.38253,0.39614 -0.57226,0.5957 -0.0794,0.0775 -0.16338,0.14927 -0.23633,0.23242 0.004,-0.0113 0.0154,-0.0408 0.008,-0.0332 -0.0119,0.01 -0.0118,0.0277 -0.0156,0.0391 -0.008,0.017 -0.0198,0.0358 -0.0274,0.0547 -0.0242,0.0469 -0.05,0.0788 -0.084,0.12109 l -0.0215,0.0234 c -0.11528,0.11565 -0.2305,0.22999 -0.34766,0.34375 -0.0896,0.0903 -0.17133,0.19054 -0.27149,0.26953 -0.12849,0.10621 -0.26092,0.20951 -0.37695,0.33008 -0.0378,0.0193 -0.0754,0.0393 -0.11328,0.0586 0.002,-0.001 0.008,0.004 0.004,0.004 -0.005,0.002 -0.0126,0.007 -0.0195,0.01 -0.0443,0.0326 -0.0853,0.072 -0.125,0.10937 -0.0763,0.0771 -0.15457,0.15293 -0.23243,0.22852 -0.10582,0.1096 -0.20012,0.23357 -0.33203,0.31445 -0.0287,0.0197 -0.0595,0.034 -0.0859,0.0566 -0.0136,0.0113 -0.0298,0.0316 -0.0449,0.043 -0.0148,0.01 -0.0337,0.0204 -0.0527,0.0312 0.004,-0.004 0.008,-0.007 0.004,-0.006 -0.009,0.005 -0.019,0.0114 -0.0273,0.0195 0.007,-0.004 0.0138,-0.007 0.0215,-0.0117 -0.004,0.003 -0.008,0.006 -0.01,0.008 -0.01,0.005 -0.01,0.005 -0.0156,0.008 -0.0287,0.0301 -0.0524,0.075 -0.0723,0.0976 -0.0778,0.0296 -0.16107,0.0477 -0.23633,0.082 -0.0106,0.0129 -0.0189,0.0244 -0.0293,0.0371 0.0313,-0.002 0.0786,-0.009 0.10157,-0.0156 0.0463,-0.0146 0.0823,-0.0484 0.0957,-0.0625 -0.007,0.0101 -0.0231,0.0309 -0.0469,0.0684 -0.1081,0.15194 -0.11798,0.14777 -0.28126,0.26758 -0.008,0.004 0.01,-0.005 0.0176,-0.008 0.0329,-0.017 0.0558,-0.0493 0.0898,-0.0645 -0.005,0.006 -0.0247,0.0267 -0.0332,0.0352 -0.0578,0.0643 -0.11398,0.12797 -0.16992,0.19336 -0.12599,0.15316 -0.27309,0.27255 -0.42969,0.38086 -0.11062,0.17566 -0.78711,0.86914 -0.71875,0.86914 0.27515,0 2.02487,-1.57501 3.89063,-3.5 1.45024,-1.49628 1.95494,-2.22262 2.24805,-2.72071 z m -4.42578,4.33985 c 10e-4,-10e-4 0.003,-0.003 0.004,-0.004 -0.004,0.002 -0.0102,0.006 -0.0137,0.008 0.002,-0.001 0.006,-0.002 0.01,-0.004 z m 0.90039,-0.80078 c 0.005,-0.004 0.01,-0.01 0.0156,-0.0137 -0.0208,0.0106 -0.0423,0.0192 -0.0625,0.0312 0.009,-0.003 0.0294,-0.01 0.0469,-0.0176 z m -6.03711,4.79101 c -0.0165,0.004 -0.088,0.0838 -0.10743,0.0918 0.0377,-0.0289 0.0736,-0.0596 0.10743,-0.0918 z m -0.82227,1.33594 c -0.0122,0.01 -0.0251,0.019 -0.0371,0.0293 -0.0933,0.0911 -0.1792,0.18713 -0.28125,0.26953 -0.0567,0.0461 -0.12186,0.0804 -0.17969,0.125 -0.0355,0.0272 -0.0695,0.0595 -0.10351,0.0859 -0.12246,0.0956 -0.23736,0.18184 -0.37305,0.25781 -0.0518,0.0291 -0.11216,0.0421 -0.16016,0.0762 -0.0219,0.0166 -0.0416,0.0436 -0.0605,0.0625 -0.12435,0.1251 -0.25148,0.26432 -0.41211,0.3418 -0.0552,0.0215 -0.0178,0.003 -0.082,0.0625 -0.10167,0.095 -0.20936,0.19482 -0.33594,0.25586 -0.2306,0.35501 -0.78244,0.98828 -0.64648,0.98828 0.27477,0 1.3131,-0.90001 2.30859,-2 0.27604,-0.30504 0.15937,-0.29534 0.36328,-0.55469 z m -96.94531,45.67773 c -0.34742,-0.0151 -0.74453,0.049 -1.10547,0.19336 -0.79771,0.31937 -0.55946,0.55552 0.60547,0.60352 1.05399,0.0435 1.64472,-0.19126 1.3125,-0.52344 -0.16615,-0.1663 -0.46511,-0.2587 -0.8125,-0.27344 z m -62.48438,1.53321 c -4.1e-4,0.0227 0.001,0.0258 -0.002,0.0371 7.3e-4,-0.0113 0.002,-0.022 0.002,-0.0371 z m 49.56641,0.47265 c -0.45313,0 -0.90625,0.0703 -1.25,0.20899 -0.6875,0.27741 -0.12499,0.5039 1.25,0.5039 1.3751,0 1.9375,-0.22641 1.25,-0.5039 -0.34375,-0.13871 -0.79687,-0.20899 -1.25,-0.20899 z m -10,0.99219 c -0.63438,0 -1.26875,0.0636 -1.75,0.18945 -0.9625,0.25134 -0.17499,0.45702 1.75,0.45704 1.92499,0 2.71249,-0.20558 1.75,-0.45704 -0.48125,-0.12585 -1.11563,-0.18945 -1.75,-0.18945 z" />
			<path
			   id="path4502"
			   style="fill:#4bd8b0;stroke-width:0.264583"
			   d="m 78.409167,33.427934 v 8.598958 8.598959 h 1.396296 c 1.67045,0 2.362314,0.421809 3.171383,1.935281 0.553069,1.034532 0.591696,1.436505 0.591696,6.13451 0,4.425479 -0.06079,5.149395 -0.507979,6.050275 -0.66484,1.339421 -1.804567,2.017183 -3.394625,2.018482 l -1.256771,0.0011 v 4.365624 4.365625 l 0.859896,0.0036 c 0.47294,0.0021 1.62306,0.183825 2.555399,0.403593 6.238279,1.470467 10.872205,7.386849 10.872205,13.88029 0,6.476939 -4.649774,12.413039 -10.872205,13.879769 -0.932339,0.21977 -2.082459,0.40159 -2.555399,0.40359 l -0.859896,0.004 v 5.15937 5.15938 h 1.692402 c 1.600351,0 1.736222,0.0499 2.499074,0.9188 1.152319,1.31241 1.361739,2.39301 1.363739,7.03782 0.0016,4.68244 -0.33075,6.15985 -1.630391,7.2533 -0.649579,0.54658 -1.069528,0.66508 -2.357477,0.66508 h -1.567347 v 7.9375 7.9375 h 1.295011 c 5.724551,0 13.676865,-1.66565 19.718176,-4.12999 C 125.02184,131.56707 139.22975,104.69062 133.42183,77.693964 129.16818,57.922072 113.65565,41.335846 94.122419,35.675342 89.8224,34.429244 83.397039,33.427934 79.704178,33.427934 Z m -2.677872,0.02945 c -0.0061,0 -0.01143,0.0011 -0.01757,0.0011 0.01029,5.8e-5 0.02072,1e-5 0.03101,0 -0.0051,-1.9e-5 -0.0084,-0.0011 -0.01344,-0.0011 z m -0.686263,0.03617 c -0.0019,1.72e-4 -0.0039,-1.3e-5 -0.0057,5.3e-4 0.0013,-2.4e-5 0.0033,-8e-6 0.0052,0 z m 1.549776,0.04496 c -7.94e-4,0.005 -0.0016,0.01037 -0.0026,0.01601 0.01479,-0.005 0.0042,-0.01042 0.0026,-0.01601 z m -6.808888,0.5364 c -0.0019,2.23e-4 -0.0034,7.94e-4 -0.0052,0.0011 2.64e-4,2.62e-4 7.93e-4,5.29e-4 0.0011,0.0011 h 5.29e-4 c 0.0021,-5.29e-4 0.0029,-0.0011 0.0036,-0.0016 z m -0.04806,0.07648 c -2.64e-4,0.0024 1.38e-4,0.0044 -5.29e-4,0.0067 5.29e-4,8.2e-5 0.0013,-7.9e-5 0.0021,0 -5.3e-4,-0.0021 -0.0011,-0.0045 -0.0016,-0.0067 z m -1.358572,0.141078 c -0.02498,0.0069 -0.04977,0.0033 -0.0739,0.01291 -0.0071,0.0029 -0.0013,0.0044 -0.0078,0.0072 0.02787,-0.0068 0.05289,-0.01294 0.08165,-0.02016 z m 0.436666,0.04289 c -0.0083,0.0034 -0.01132,0.0039 -0.01963,0.0072 -0.0084,0.0051 -0.01349,0.0088 -0.0067,0.0078 0.0073,-0.0013 0.01469,-0.0028 0.0217,-0.0052 -0.0024,-0.0039 0.0079,-0.0058 0.0047,-0.0098 z m 56.606366,7.257955 c 0.002,0.0028 0.005,0.0093 0.007,0.01394 -0.002,-0.0046 -0.004,-0.0086 -0.007,-0.01394 z m -20.00188,15.911692 c 1.01859,0 1.24821,0.149865 3.14141,2.050521 2.80924,2.820302 2.97395,4.177467 0.83406,6.866763 -1.54378,1.940131 -5.40648,5.532448 -6.6089,6.145879 -0.59923,0.305702 -1.58254,0.547254 -2.22674,0.547254 -0.946597,0 -1.357537,-0.174734 -2.290818,-0.973585 -0.62553,-0.535432 -1.59938,-1.558166 -2.164209,-2.272728 -1.950009,-2.466952 -1.367925,-4.041273 3.125909,-8.454782 3.299048,-3.240201 4.358418,-3.909322 6.189288,-3.909322 z M 76.270797,75.529238 c -0.09192,-0.0038 -0.196991,0.01294 -0.292489,0.05116 -0.211061,0.08446 -0.148035,0.146981 0.160197,0.159681 0.278961,0.01148 0.435163,-0.05057 0.347266,-0.138493 -0.04396,-0.04396 -0.123061,-0.06856 -0.214974,-0.07235 z m 34.452683,8.698696 c 4.54168,0 6.03056,0.296462 7.24658,1.443323 l 0.92036,0.868161 v 3.041677 c 0,3.451325 -0.23815,4.007096 -2.13114,4.972822 -0.90909,0.463786 -1.56039,0.521449 -5.86166,0.516247 -4.12703,-0.0049 -4.9952,-0.07748 -5.89783,-0.491958 -1.90931,-0.876763 -2.10511,-1.290609 -2.20451,-4.654497 l -0.0879,-2.98173 0.84026,-0.957048 c 1.2181,-1.387338 2.7273,-1.756997 7.17579,-1.756997 z m -46.505179,3.001883 c -0.0401,-0.0061 -0.06751,0.09055 -0.07545,0.283186 -0.01148,0.278916 0.05109,0.435186 0.139009,0.347265 0.08791,-0.08792 0.09736,-0.315949 0.02066,-0.506944 -0.03167,-0.07915 -0.06017,-0.119864 -0.08423,-0.123507 z m 0,4.497916 c -0.0401,-0.0061 -0.06751,0.09055 -0.07545,0.283186 -0.01148,0.278916 0.05109,0.435187 0.139009,0.347266 0.08791,-0.08792 0.09736,-0.315952 0.02066,-0.506944 -0.03167,-0.07915 -0.06017,-0.119864 -0.08423,-0.123508 z m 12.052496,12.111917 c -0.09192,-0.004 -0.196991,0.013 -0.292489,0.0512 -0.211061,0.0845 -0.148035,0.14699 0.160197,0.15969 0.278961,0.0115 0.435163,-0.0506 0.347266,-0.1385 -0.04396,-0.044 -0.123061,-0.0685 -0.214974,-0.0724 z m 24.225913,2.35025 c 0.42287,0.003 0.90362,0.12435 1.56218,0.31729 0.82991,0.24306 1.86617,1.07694 4.35632,3.50573 3.52708,3.44005 4.31239,4.60155 4.33979,6.41615 0.0166,1.10065 -0.0906,1.28052 -1.81023,3.02514 -1.00545,1.02007 -2.14953,2.02439 -2.54248,2.2319 -1.0953,0.57839 -2.34056,0.37398 -4.01009,-0.65784 -1.30017,-0.80355 -6.324755,-6.08765 -6.859015,-7.21351 -0.250399,-0.52768 -0.455268,-1.46993 -0.455268,-2.09341 0,-1.06784 0.127735,-1.26101 2.199865,-3.33314 1.639281,-1.63927 2.288621,-2.20524 3.218928,-2.19831 z m -66.537542,18.2547 c -0.0046,0.005 0.0613,0.0851 0.07752,0.1111 0.0083,-0.009 0.01667,-0.0245 0.02532,-0.0393 -0.02262,-0.0136 -0.09859,-0.0761 -0.102835,-0.0718 z m 1.475361,1.69602 c -0.02635,7.9e-4 -0.05271,0.001 -0.07906,0.002 l 0.07958,0.094 c 0.02405,-0.0115 0.04827,-0.0227 0.07235,-0.0341 z m 4.113445,4.34599 c -0.03576,0.0227 -0.07191,0.045 -0.108521,0.0661 0.009,0.008 0.03795,0.0399 0.04651,0.0475 0.03719,-0.0255 0.07046,-0.0504 0.10077,-0.0749 -0.0046,-0.005 -0.03331,-0.0326 -0.03876,-0.0387 z m 1.671215,1.44435 c -0.0055,0.01 -0.0113,0.0192 -0.01654,0.0289 0.01101,-0.005 0.02159,-0.0105 0.03256,-0.0155 z m 0.272851,0.231 c -0.01029,0.0454 -0.02037,0.0908 -0.03255,0.13539 l 0.01085,0.0134 c 0.0614,-0.0308 0.103552,-0.0403 0.137459,-0.046 -0.02043,-0.0175 -0.02021,-0.022 -0.04186,-0.0403 z m 24.450188,12.42508 c -0.0044,-1.2e-4 -0.0095,0.003 -0.01394,0.003 0.0036,0.001 0.0072,0.003 0.01085,0.004 0.0011,-0.002 0.0021,-0.004 0.0031,-0.006 z m 4.908743,0.93328 c -1.08e-4,0.006 2.25e-4,0.007 -5.29e-4,0.01 1.93e-4,-0.003 5.29e-4,-0.006 5.29e-4,-0.01 z" />
			<path
			   id="path4500"
			   style="fill:#46b898;stroke-width:0.999999"
			   transform="scale(0.26458333)"
			   d="m 475.39062,156.32031 c -0.0247,0.0174 -0.0484,0.0343 -0.0723,0.0527 l 0.23242,0.26172 c 0.0517,-0.0152 0.1018,-0.0291 0.14844,-0.0449 z m -1.35351,0.88281 c 0.007,0.0106 0.0207,0.0353 0.0254,0.0527 -0.009,-0.0173 -0.0149,-0.0326 -0.0254,-0.0527 z m -177.6875,34.13868 v 30.5 30.5 l 4.75,-0.004 c 6.00967,-0.005 10.3173,-2.56653 12.83008,-7.62891 1.69016,-3.40515 1.91992,-6.14096 1.91992,-22.86718 0,-17.75624 -0.14614,-19.27355 -2.23633,-23.1836 -3.0579,-5.72021 -5.67282,-7.3164 -11.98633,-7.3164 z m 102.08984,26 c -6.91982,0 -10.92349,2.52896 -23.39257,14.77539 -16.98456,16.68098 -19.18457,22.63118 -11.81446,31.95508 2.13479,2.70072 5.81548,6.56616 8.17969,8.58984 3.52736,3.01928 5.08054,3.67969 8.6582,3.67969 6.19699,0 11.22474,-2.94489 21.02539,-12.31836 14.80422,-14.15895 18.95944,-20.80323 17.54688,-28.04883 -0.4122,-2.11453 -3.1203,-5.65253 -8.33008,-10.88281 -7.1554,-7.18358 -8.02326,-7.75 -11.87305,-7.75 z m 20.04297,101 c -16.81319,0 -22.51725,1.39714 -27.12109,6.64062 l -3.17578,3.61719 0.33203,11.26953 c 0.37553,12.71391 1.1157,14.27805 8.33203,17.5918 3.41144,1.56653 6.69248,1.84085 22.29101,1.85937 16.25666,0.0195 18.71837,-0.19829 22.1543,-1.95117 7.15457,-3.64999 8.05469,-5.75054 8.05469,-18.79492 v -11.4961 l -3.47852,-3.28124 c -4.59602,-4.33458 -10.22326,-5.45508 -27.38867,-5.45508 z m -38.65234,83.00195 c -3.51611,-0.0262 -5.97031,2.11288 -12.16602,8.30859 -7.83167,7.83168 -8.31445,8.56368 -8.31445,12.59961 0,6.52902 2.5108,10.57417 13.84961,22.31055 10.40746,10.77237 14.7771,14.23196 19.91601,15.7793 6.58145,1.98172 9.16215,0.75491 18.64454,-8.86524 6.49931,-6.59384 6.90453,-7.27117 6.84179,-11.43164 -0.10367,-6.85833 -3.07165,-11.24778 -16.40234,-24.25 -9.41159,-9.17968 -13.32798,-12.33089 -16.46484,-13.25 -2.48903,-0.72921 -4.30607,-1.18926 -5.9043,-1.20117 z m -83.48047,30.99414 v 30 30 h 5.92383 c 4.86784,0 6.45505,-0.44786 8.91015,-2.51367 4.91203,-4.13318 6.16967,-9.71665 6.16211,-27.41406 -0.006,-17.55519 -0.79907,-21.63932 -5.15429,-26.59961 -2.88322,-3.28369 -3.39675,-3.47266 -9.44532,-3.47266 z m 14.29687,161.61133 c 0.0248,-1.4e-4 0.0435,0.003 0.0527,0.004 -0.008,0 -0.0277,-0.002 -0.0527,-0.004 z" />
			<path
			   id="path4498"
			   style="fill:#1ece9d;stroke-width:0.264583"
			   d="m 78.409166,33.453771 -2.315104,0.133326 c -8.406389,0.484984 -15.004251,2.161196 -22.125265,5.620329 -4.031568,1.958391 -8.259675,4.629714 -11.172444,7.058999 -11.037133,9.205113 -17.924359,21.442867 -20.098515,35.71255 -0.594167,3.899506 -0.593686,11.66213 0.0016,15.610417 1.777341,11.793908 6.819557,22.254908 14.824935,30.756778 9.602388,10.19793 23.080184,16.59719 36.916093,17.52761 0.15308,0.0103 0.186272,0.0125 0.337962,0.0227 5.3e-4,3e-5 5.3e-4,-3e-5 0.0011,0 h 0.0062 0.01035 0.0052 c 0.01572,0 0.03012,0.001 0.04289,0.004 5.29e-4,3e-5 5.29e-4,5.2e-4 0.0011,5.2e-4 1.327639,0.0892 2.680665,0.1796 2.96881,0.19896 l 0.595312,0.0403 v -7.9375 -7.9375 h -1.481613 c -1.323171,0 -1.574864,-0.0933 -2.353861,-0.8723 -1.229331,-1.22934 -1.453494,-2.36434 -1.44849,-7.32979 0.0037,-3.68864 0.08037,-4.53418 0.497125,-5.45186 0.80141,-1.7647 1.469396,-2.22105 3.249414,-2.22105 h 1.537201 v -5.15938 -5.15937 h -1.130165 c -4.563203,0 -10.004303,-3.79268 -11.966194,-8.340579 -1.927288,-4.467672 -1.467646,-10.153634 1.125514,-13.922663 2.56091,-3.722153 7.026706,-6.31176 10.884606,-6.31176 h 1.086239 v -4.365625 -4.365625 l -1.256771,-0.0011 c -1.590061,-0.0013 -2.729785,-0.679061 -3.394625,-2.018482 -0.422579,-0.851355 -0.522663,-1.734929 -0.596863,-5.256525 -0.107339,-5.091147 0.163385,-6.631778 1.396299,-7.93905 0.795509,-0.843484 1.002408,-0.924491 2.362128,-0.924491 h 1.489832 V 42.039809 Z M 51.565327,57.505017 c 1.789777,0 2.846131,0.699648 6.26215,4.148066 4.533945,4.576945 4.879555,5.794854 2.45463,8.653219 -0.802151,0.945528 -1.802778,1.964264 -2.223638,2.263944 -0.988144,0.70362 -2.732857,0.696762 -4.084505,-0.01601 -1.172342,-0.618432 -5.060786,-4.258625 -6.554636,-6.136058 -1.257523,-1.580417 -1.698509,-3.043152 -1.290363,-4.279841 0.174691,-0.529323 1.089607,-1.644558 2.264463,-2.760557 1.848239,-1.755651 2.046552,-1.872753 3.171899,-1.872753 z m -5.469951,26.722917 c 4.242449,0 5.880444,0.370773 7.056933,1.597834 0.748466,0.780608 0.786929,0.93744 0.872299,3.546554 0.112231,3.429934 -0.192529,4.145 -2.156973,5.059638 -1.286854,0.599152 -1.658877,0.638622 -6.002219,0.635622 -5.116737,-0.0036 -6.219486,-0.260543 -7.362859,-1.714109 -0.513964,-0.653404 -0.574641,-1.051038 -0.574641,-3.772378 v -3.041677 l 0.920356,-0.868161 c 1.216023,-1.146861 2.705412,-1.443323 7.247104,-1.443323 z m 10.221598,21.960416 c 0.930365,0 1.224777,0.20105 3.223577,2.19986 2.062576,2.06257 2.199865,2.26937 2.199865,3.31763 0,0.61527 -0.250896,1.61009 -0.558107,2.21227 -0.694399,1.36113 -5.553429,6.39427 -6.982518,7.23263 -1.092509,0.64091 -2.875261,1.01033 -3.571875,0.74053 -0.66761,-0.25856 -4.262077,-3.88744 -4.53409,-4.5775 -0.172516,-0.4376 -0.151704,-1.08273 0.06408,-1.98438 0.285639,-1.19348 0.672238,-1.69538 3.627168,-4.70617 3.475477,-3.54117 4.792231,-4.43487 6.5319,-4.43487 z m 12.946496,39.33197 c -1.08e-4,0.006 -1.06e-4,0.007 -5.29e-4,0.01 1.93e-4,-0.003 5.29e-4,-0.006 5.29e-4,-0.01 z" />
			<path
			   id="path4496"
			   style="fill:#17a57e;stroke-width:0.999999"
			   transform="scale(0.26458333)"
			   d="m 290.71875,191.3418 c -5.13914,0 -5.92108,0.30618 -8.92773,3.49414 -4.65982,4.94087 -5.68304,10.76373 -5.27735,30.00586 0.37807,17.93176 1.57115,22.14676 7.25586,25.61328 1.86849,1.13943 4.94845,1.88082 7.83008,1.88281 l 4.75,0.004 v -30.5 -30.5 z m -95.82617,26 c -4.25328,0 -5.00281,0.44259 -11.98828,7.07812 -4.4404,4.21795 -7.89835,8.43302 -8.5586,10.4336 -1.5426,4.67411 0.12414,10.20255 4.87696,16.17578 5.64605,7.09581 20.34252,20.85402 24.77343,23.1914 5.10859,2.69487 11.70278,2.71995 15.4375,0.0605 1.59065,-1.13265 5.37255,-4.98299 8.4043,-8.55664 9.16507,-10.80327 7.85883,-15.40639 -9.27734,-32.70508 -12.91094,-13.03339 -16.90346,-15.67773 -23.66797,-15.67773 z m -20.67383,101 c -17.16545,0 -22.79464,1.1205 -27.39063,5.45508 l -3.47851,3.28124 v 11.4961 c 0,13.17921 1.04516,15.52075 8.42187,18.87109 3.46876,1.57543 6.69478,1.85465 21.57813,1.86524 16.41578,0.0114 17.82185,-0.13783 22.68555,-2.40235 7.42467,-3.4569 8.57652,-6.15951 8.15234,-19.12304 -0.32266,-9.86122 -0.46803,-10.45397 -3.29688,-13.4043 -4.44674,-4.63771 -10.63742,-6.03906 -26.67187,-6.03906 z m 38.63281,83 c -6.57513,0 -11.55184,3.37777 -24.6875,16.76172 -11.16824,11.37936 -12.6294,13.2761 -13.70898,17.7871 -0.81555,3.40782 -0.89421,5.84594 -0.24219,7.5 1.02808,2.60811 14.61347,16.32355 17.13672,17.30079 2.63287,1.01971 9.37083,-0.37649 13.5,-2.79883 5.40128,-3.16861 23.76612,-22.19151 26.39062,-27.33594 1.16111,-2.27596 2.10938,-6.0359 2.10938,-8.36133 0,-3.96193 -0.51889,-4.74352 -8.31445,-12.53906 -7.55451,-7.55456 -8.66726,-8.31445 -12.1836,-8.31445 z m 77.6875,31 c -6.72763,0 -9.2523,1.72483 -12.28125,8.39453 -1.57523,3.46843 -1.86379,6.66415 -1.8789,20.60547 -0.0187,18.76705 0.82832,23.05684 5.47461,27.70312 2.94425,2.94429 3.89552,3.29688 8.89648,3.29688 h 5.59961 v -30 -30 z" />
		  </g>
		</svg>
		`
	}

	async main(){
		return 0
	}

	$getCache(path: string){
		let md5 = crypto.createHash('md5').update(path).digest("hex")
		let stat = null, data = null

		let file = Path.posix.join(this.$cacheFolder, md5 + ".json")
		if(this.$cacheType == "javascript"){
			md5 = Path.basename(path) + "-" + md5
			file = Path.posix.join(this.$cacheFolder, md5 + ".js")
		}

		try{
			stat = Fs.statSync(path)
		}
		catch(e){}
		if(!stat) return null 
		if(!Fs.existsSync(file)) return 

		
		if(this.$cacheType == "javascript"){
			/*delete require.cache[file]
			data = require(file).default
			*/
			let content = Fs.readFileSync(file, "utf8")
			let i = content.indexOf("// KAWIX END CACHE\n")
			data= JSON.parse(content.substring(13, i))
			
			i = content.indexOf("// KAWIX RESULT CODE\n")
			let y = content.lastIndexOf("// KAWIX RESULT CODE\n")
			if(data.result){
				data.result.code = content.substring(i+21,y)
			}
		}
		else{
			let content = Fs.readFileSync(file, "utf8")
			data = JSON.parse(content)
		}

		
		let mtimeMs = Math.ceil(stat.mtimeMs / 1000) * 1000
		if(data.mtimeMs == mtimeMs){
			return data
		}
	}



	$saveCache(path: string, cache: any){
		let md5 = crypto.createHash('md5').update(path).digest("hex")
		if(this.$cacheType == "javascript"){
			md5 = Path.basename(path) + "-" + md5

			let ncache = Object.assign({},cache)
			let code = ncache.result.code
			if(code){
				delete ncache.result.code
			}
			let str = []
			str.push("var $_cache = ")
			str.push(JSON.stringify(ncache))
			str.push("// KAWIX END CACHE")
			str.push("")

			str.push("var $_func = function(){")
			str.push("// KAWIX RESULT CODE")
			str.push(code)
			str.push("// KAWIX RESULT CODE")
			str.push("}")
			str.push("")
			str.push("")
			//str.push("var $_cache = // KAWIX RESULT JSON\n" + JSON.stringify(ncache, null, '\t') + "\n// KAWIX RESULT JSON")
			//str.push("var $_cache = { mtimeMs: Number($_vars[0]), requires: $_vars[1].split('$$?'), filename: $_vars[2], time: Number($_vars[3]), result: {}};")

			str.push("if($_cache.result){")
			str.push("\tvar $_lines = $_func.toString().split('\\n')")
			str.push("\t$_cache.result.code = $_lines.slice(2, $_lines.length - 2).join('\\n')")
			str.push("}")
			str.push("exports.default = $_cache")
			let file = Path.join(this.$cacheFolder, md5 + ".js")
			Fs.writeFileSync(file, str.join("\n"))
		}
		else{
			let file = Path.join(this.$cacheFolder, md5 + ".json")
			Fs.writeFileSync(file, JSON.stringify(cache))
		}        
	}


	$addOriginalURL(file:string, url: string){
		this.$originals.set(file, url)
		if(this.$originals.size > 100){
			this.$originals.delete(this.$originals.keys().next().value)
		}
	}

	async $getNetworkContent(url: string){

		let uri = new URL(url)
		let id = crypto.createHash("md5").update(url).digest('hex')
		let ext = Path.extname(uri.pathname)
		let name = Path.basename(uri.pathname)
		if(!ext) name += ".ts"
		if(/^\.\d+$/.test(ext)) name += ".ts"
		if (ext == ".mjs") name += ".ts";

		let file = Path.join(this.$networkContentFolder, id + "-" +  name)
		if(Fs.existsSync(file)){
			this.$addOriginalURL(file, url)
			return {file}
		}     

		// get if exists on $cache Folder
		let vfile = Path.posix.join("/virtual/$app-cache/network", id + "-" + name)
		let virtual = KModule.$files.get(vfile)
		if(virtual){
			Fs.writeFileSync(file, virtual.content)
			this.$addOriginalURL(file, url)
			return {
				file,
				virtual: true
			}
		}


		let getContent = async function(url){
			let def:any = {}, redir = ''
			let promise = new Promise(function(a,b){
				def.resolve = a
				def.reject = b
			})

			let items = {http, https}
			let userAgent = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
			userAgent = "Node/" + process.version
			if(process.env.KW_USER_AGENT)
				userAgent = process.env.KW_USER_AGENT

			
			let req = items[url.startsWith("http:") ? "http": "https"].get(url, {
				timeout: Number(process.env.REQUEST_TIMEOUT || 8000),
				headers: {
					"user-agent": userAgent
				}
			},function(res){
				if(res.statusCode == 302){
					redir = new URL(res.headers.location, url).href                    
					return def.resolve()
				}

				if(res.statusCode != 200){
					def.reject(new Error("Invalid status code from network response: " + String(res.statusCode) + " from " + url))
					return 
				}

				let buffers = []
				res.on("data", function(bytes){
					buffers.push(bytes)
				})
				res.on("end", function(){
					def.resolve(Buffer.concat(buffers))
				})
				res.on("error", def.reject)
			})
			req.on("error", def.reject)
			let c = await promise 
			if(redir){
				return await getContent(redir)
			}
			return c
		}

		let options = {
			[url]: true
		}

		let extSet = new Set<string>()
		for(let id in KModule.extensionCompilers){
			extSet.add(id)
		}
		for(let id in Module["_extensions"]){
			extSet.add(id)
		}
		for(let ext of extSet){
			options[`${uri.protocol}//${uri.host}${uri.pathname}${ext}${uri.search}`] = true
		}


		let urls = Object.keys(options), error = null 
		for(let i=0;i<urls.length;i++){
			try{

				//console.log('\x1b[32m[kwruntime] Downloading:\x1b[0m', urls[i])
				let content = await getContent(urls[i])
				Fs.writeFileSync(file, content)
				let source = Path.join(Path.dirname(file), "sources", Path.basename(file))
				Fs.writeFileSync(source, JSON.stringify({
					file,
					url: urls[i]
				}))
				this.$addOriginalURL(file, urls[i])
				return {
					file,
					content
				}
			}catch(e){
				error = e 
			} 
		}    

		if(error) throw error 

	}


	
	$generateRequireSync(parent){
		let req = (path)=> this.requireSync(path, parent, require)
		for(let id in require){
			Object.defineProperty(req, id, {
				get(){
					return require[id]
				}
			})
		}
		return req
	}

	requireSync(request, parent, originalRequire = null){

		
		if(Module.builtinModules.indexOf(request) >= 0){
			return Module["_load"](request,parent)
		}
		

		let resolv = this.importResolve(request, parent, true)
		let cached = this.$getCachedExports(resolv.request)
		if(cached){
			return cached.data
		}

		

		let getExports = () => {
			if(resolv.from == "virtual"){

				let file = resolv.virtual
				let name = resolv.request

				let exp = this.$modCache.get(name)
				if(exp) return exp

				// module from virtual 
				let mod1 = new Module(name, module)
				mod1.filename = name
				mod1["__kawix__virtual"] = true
				let source = {
					stat: file.stat,
					content: file.content.toString()
				}
				if(file.transpiled){
					mod1["requireSync"] =  this.$generateRequireSync(mod1) // (path)=> this.requireSync(path, mod1)
					let content = `require = module.requireSync;${source.content}`
					mod1["_compile"](content, name)
					cached = {
						module: mod1,
						mode: 'node',
						exports: mod1.exports,
						executed: true,
						content: source.content,
						result: {
							code: source.content
						},
						filename: name
					}
				}
				else{
					throw new Error("Not available for require: " + name)
				}
				return mod1.exports 
			}

			if(resolv.from != "node"){
				throw new Error(`${resolv.request} not available to be required in sync mode`)
			}

			global.kawix.disableCompile  = true
			try{
				let exp = null
				if(originalRequire){
					exp = originalRequire(resolv.request)
				}
				exp= Module["_load"](resolv.request, parent)
				cached = {
					module: Module["_cache"][resolv.request],
					mode: 'node',
					exports: exp,
					executed: true,
					filename: resolv.request
				}
				return exp

			}catch(e){
				throw e 
			}
			finally{
				global.kawix.disableCompile  = false
			}
		}

		
		
		let exports = getExports()
		if(cached){
			if (cached) {
				cached.cacheTime = Date.now();
				cached.atime = Date.now();
				}
			this.$modCache.set(resolv.request, cached)
		}
		return exports
	}

	getBinary(filename: string){
		let bin = Kawix.$binaryFiles.get(filename)
		if(!bin){
			bin = new BinaryData(this, filename)
		}
		return bin
	}


	importResolve(request, parent = null, syncMode = false){

		if(Module.builtinModules.indexOf(request) >= 0){
			return {
				request
			}
		}

		if(request.startsWith("file://")){
			request = Url.fileURLToPath(request)
		}

 

		if(!syncMode){
			if((request.startsWith("./") || request.startsWith("../") || request.startsWith("/")) &&  parent?.__kawix__network){
				if(!request.startsWith("/virtual")){
					
					let isfile = false 
					if(Path.isAbsolute(request)){
						// maybe is a file 
						isfile = Fs.existsSync(request)
					}

					if(!isfile){
						let newUri = new URL(request, parent.__kawix__meta.uri)
						let url = `${newUri.protocol}//${newUri.host}${newUri.pathname}${newUri.search}`
						return {
							from : "network",
							request: url
						}
					}
				}
			}
		}

		

		let possibles = []
		if((request.startsWith("./") || request.startsWith("../")) &&  parent?.__kawix__virtual){
			request = Path.posix.join(Path.posix.dirname(parent.filename), request)
		}

		else if((!Path.isAbsolute(request)) &&  parent?.__kawix__virtual){

			let dirname = Path.posix.dirname(parent.filename)
			while(dirname && (dirname != "/") && (dirname != ".")){
				possibles.push(Path.posix.join(dirname, "node_modules", request))
				dirname = Path.posix.dirname(dirname)
			}


			dirname = Path.posix.dirname(parent.filename)
			while(dirname && (dirname != "/") && (dirname != ".")){
				possibles.push(Path.posix.join(dirname, request))
				dirname = Path.posix.dirname(dirname)
			}
		}


		
		if(request.startsWith("/virtual") || possibles.length){

			
			// read from virtual
			let file = null, name= ''
			possibles.push(request)


			for(let ext in KModule.extensionCompilers){
				possibles.push(request + ext)
			}
			for(let i=0;i<possibles.length;i++){
				name = possibles[i]
				file = KModule.$files.get(name)
				

				if(file){
					if(file.stat?.isdirectory){
						
						let f = Path.posix.join(name, "package.json")
						let psource = KModule.$files.get(f)
						if(psource){
							let pjson = JSON.parse(psource.content.toString())
							if(pjson.main)
								possibles.push(Path.posix.join(name, pjson.main))
						}
						possibles.push(name + "/index.js")
						possibles.push(name + "/main.js")
						file = null 
						continue 
					}
					break 
				}

			}

			if(file){
				return {
					from: "virtual",
					virtual: file,
					request: name
				}
			}

		}

		else if(request.startsWith("http://") || request.startsWith("https://")){
			return {
				from : "network",
				request
			}
		}

		else if(request.startsWith("gh+/") || request.startsWith("github+/") || request.startsWith("github://")){
			
		
			let parts = request.split("/")
			if(request.startsWith("github://"))
				parts.shift()
			let parts1 = parts[2].split("@")
			let name = parts1[0]
			let version = parts1[1] || "master"
			let url = `https://raw.githubusercontent.com/${parts[1]}/${name}/${version}/${parts.slice(3).join("/")}`
			return {
				from : "network",
				request: url
			}
		}
		else if(request.startsWith("gitlab+/") || request.startsWith("gitlab://")){
			let parts = request.split("/")
			if(request.startsWith("gitlab://"))
				parts.shift()
			let parts1 = parts[2].split("@")
			let name = parts1[0]
			let version = parts1[1] || "master"
			let url = `https://gitlab.com/${parts[1]}/${name}/-/raw/${version}/${parts.slice(3).join("/")}`
			return {
				from : "network",
				request: url
			}
		}


		if(request.startsWith("npm://")){
			let uri = new URL(request)
			return {
				from: "npm",
				request,
				uri
			}
		}

		

		request = Module["_resolveFilename"](request, parent)
		return {
			from: "node",
			request
		}
	}


	$getCachedExports(request: string){
		let info = this.$modCache.get(request)
		if(!info) return 

		if(info.builtin){
			return {
				data: info.exports
			}
		}

		if(info.mode == "node"){
			if(info.location){
				return {
					data: require(info.location.main)
				}   
			}
			if(info.exports){
				return {
					data: info.exports
				}
			}
		}

		if(info.executed){
			let hcache = this.$checkExports(info, request)
			if(hcache){
				return null
			}
			return {
				data: info.module.exports
			}
		}
	}

	$checkExports(info, request){        
		if(!info.module) return 
		
		let exports = info.module.exports        
		if(exports?.kawixDynamic){
			let time = exports?.kawixDynamic?.time || 15000
			if(Date.now() > (info.cacheTime + time)){
				// check if file is edited ...
				let stat = Fs.statSync(info.filename)
				if(stat.mtimeMs > info.atime){
					this.$modCache.delete(request)
					delete require.cache[info.filename]
					return true
				}
				else{
					info.cacheTime = Date.now()
				}
			}
		}

	}

	$convertToEsModule(mod){
		if(!mod.__esModule){
			// Babel need objects has __esModule property as true
			let nm = Object.create(mod)
			Object.defineProperty(nm, "__esModule", {
				value: true,
				enumerable: false
			})
			nm[util.inspect.custom] = function(depth, options){
				return util.inspect(mod, options)
			}
			return nm
		}
		return mod
	}

	async importFromInfo(info: ModuleImportInfo){
		if(info.builtin){
			return info.exports
		}

		if(info.mode == "npm"){
			var m = null 

			
			for(let item of info.items){
				if(!m){
					if(info.moduleLoader?.secureRequire){
						let tries = 0
						while(true){
							try{
								m = await info.moduleLoader.secureRequire(item)
								break 
							}
							catch(e){

								if (e.message.indexOf("build/") >= 0 && e.code == "MODULE_NOT_FOUND") {
									// es nativo posiblemente
									tries++;
									if (tries > 1) throw e; // volver a ejecutar node-gyp
				
									console.info("> Trying build module again");
									console.info();
				
									var child = require("child_process");
				
									var p = child.spawn("node-gyp", ["configure"], {
									  cwd: item.folder,
									  stdio: 'inherit'
									});
									await new Promise(function (a, b) {
									  p.once("error", b);
									  p.once("exit", a);
									});
									p = child.spawn("node-gyp", ["build"], {
									  cwd: item.folder,
									  stdio: 'inherit'
									});
									await new Promise(function (a, b) {
									  p.once("error", b);
									  p.once("exit", a);
									});
								} 

								// maybe using nodejs import?
								else if(e.message.indexOf("require() of ES") >= 0){
									m = await global["import"](item.main)
									m = this.$convertToEsModule(m)
								}
								else{
									throw e
								}
							}
						}
					}
					else{
						m = require(item.main)
					}
				}
			}
			return m 
		}

		if(info.mode == "custom"){
			return info.load()
		}

		if(info.mode == "node"){
			if(info.location){
				return require(info.location.main)
			}
			else if(!info.executed){
				// compile 
				info.module["requireSync"] = this.$generateRequireSync(info.module) // (path)=> this.requireSync(path, info.module)
				info.module["_compile"](info.result.code, info.filename)
				return info.exports = info.module.exports
			}
		}


		if(!info.executed){
			let goodPreloadedModules = []
			if(info.preloadedModules){
				for(let i=0;i< info.preloadedModules.length;i++){
					let itemInfo = info.preloadedModules[i]
					let exp = await this.importFromInfo(itemInfo)
					goodPreloadedModules.push(exp)
				}

				let i = info.vars.names.indexOf("preloadedModules")
				info.vars.values[i] = goodPreloadedModules
			}
			await this.defaultExecute(info, info.module.exports)                
			info.executed = true 
			info.exports = info.module.exports
			return info.exports 
		}
		else{
			return info.exports || info.module.exports
		}
	}
   

	async import(request, parent = null, scope : Map<string, any> = null){

		if(this.customImporter?.length){
			for(let importer of this.customImporter){
				try{
					let mod = await importer(request, parent)    
					if(mod) return mod
				}catch(e){
				}
			}
		}

		if (!request.startsWith(".")) {
			let cache = this.$getCachedExports(request)
			if(cache) return cache.data
		}

		let info = await this.importInfo(request, parent, scope)
		return await this.importFromInfo(info)
	}


	
	async importInfo(request, parent = null, scope : Map<string, any> = null, props = {}) : Promise<ModuleImportInfo>{


		if(this.customImportInfo?.length){
			for(let importer of this.customImportInfo){
				try{
					let info = await importer(request, parent)    
					if(info) return info
				}catch(e){
				}
			}
		}

		if((Module.builtinModules.indexOf(request) >= 0) || (request.startsWith("node:"))){
			return {
				builtin: true,
				exports: Module["_load"](request, parent)
			}
		}        
		

		if(!scope){
			scope = new Map<string, any>()
		}

		let resolv = this.importResolve(request, parent)
		let cached = this.$modCache.get(resolv.request)
		if(cached){
			if(!this.$checkExports(cached, resolv.request))
				return cached 
		}

		let item = scope.get(resolv.request)
		if(item) return item 


		// ensure not collapsing importing the same file at time
		let importing = this.$importing.get(resolv.request)        
		if(importing){
			let def = new Deferred<any>()
			importing.defs.push(def)
			return await def.promise
		}
		else{
			let error = null, result = null
			let importing  = {
				defs: [],
				name: resolv.request,
				time: Date.now()
			}
			try{                
				this.$importing.set(importing.name, importing)
				result = await this.$importInfo(resolv, parent, scope, props)
				result.request = resolv.request
			}catch(e){
				error = e 
			}
			if(result){
				result.cacheTime = Date.now()
				result.atime = Date.now()
				this.$modCache.set(resolv.request, result)
				if(result.vars){
					let genname = result.vars.values[3]
					if(genname)
						this.$modCache.set(genname, result)
				}
				if(result.filename)
						this.$modCache.set(result.filename, result)
			}


			let defs = importing.defs
			this.$importing.delete(importing.name)

			if(defs.length){
				setImmediate(()=>{
					for(let i=0;i<defs.length;i++){
						if(error)
							defs[i].reject(error)
						else 
							defs[i].resolve(result)
					}
				})
			}

			if(error) throw error 
			return result 
		}
	}




	async $importInfo(resolv: any, parent, scope: Map<string,any>, props: any){

		let conv = null, meta = null
		if(resolv.virtual){
			let file = resolv.virtual
			let name = resolv.request 


			// module from virtual 
			let mod1 = new Module(name, module)
			mod1.filename = name
			mod1["__kawix__virtual"] = true
			let source = {
				stat: file.stat,
				content: file.content.toString()
			}
			if(file.transpiled){
			 
				return {
					module: mod1,
					mode: 'node',
					filename: name,
					vars: {
						names: [],
						values: []
					},
					content: source.content,
					result: {
						code: `require = module.requireSync;${source.content}`
					},
					preloadedModules: []
				}

			}
			else{
				
				mod1["_compile"]("exports.__source = " + JSON.stringify(source) + ";exports.__kawix__compile = true; exports.__local__vars = { module, require, __dirname, __filename, global, Buffer }; exports.__filename = " + JSON.stringify(name), name)
				let base = {
					module: mod1,
					executed: false,
					filename: name,
					vars: {
						names: [],
						values: []
					},
					content: source.content,
					result: {
						code: `${source.content}`
					},
					requires: [],
					preloadedModules: []
				}
				scope.set(resolv.request, base)

				try{
					
					if(mod1.exports.__kawix__compile){
						let result = await this.defaultCompile(mod1, props, scope)
						Object.assign(base, result)
					}
					else{
						base.executed = true
					}
					return base 

				}catch(e){                    
					scope.delete(resolv.request)
					throw e                         
				}
			}
		}

		else if(resolv.request.startsWith("http://")){
			let uri = new URL(resolv.request)
			let url = `${uri.protocol}//${uri.host}${uri.pathname}`
			meta = {
				url,
				uri
			}
			conv = await this.$getNetworkContent(resolv.request)
		}
		else if(resolv.request.startsWith("https://")){
			let uri = new URL(resolv.request)
			let url = `${uri.protocol}//${uri.host}${uri.pathname}`
			// add ?target=node
			
			meta = {
				url,
				uri 
			}
			let req = resolv.request
			if(!process.env.KW_USER_AGENT){
				if(req.startsWith("https://esm.sh/")){
					if(req.indexOf("?") < 0) req += "?target=node"
				}
			}
			conv = await this.$getNetworkContent(req)
		}
		else if(resolv.request.startsWith("npm://")){

			//let uri = new URL(resolv.request)
			let name = resolv.request.substring(6)
			let pindex = name.indexOf("?")
			let uri:URL =  new URL("http://127.0.0.1")
			if(pindex >= 0){
				let search1 = name.substring(pindex)
				name = name.substring(0, pindex)
				uri = new URL("/index"+search1, "http://127.0.0.1")
			}

			
			//let name = (uri.username ? (uri.username + "@" + uri.host + uri.pathname) :  uri.pathname.substring(2))
			let loader = this.packageLoader
			if(uri?.searchParams){
				let ploader = uri.searchParams.get("loader")
				if(ploader){
					loader = Kawix.packageLoaders[ploader] || loader
				}
			}

			let mod = await this.import(loader, null, scope)
			let reg = new mod.Registry()
			for(let id in this.packageLoaderEnv){
				reg.env[id] = this.packageLoaderEnv[id]
			}
			if(uri?.searchParams && reg.env){
				for(let key of uri.searchParams.keys()){
					if(key.startsWith("ENV_")){
						let envname = key.substring(4)
						let envvalue = uri.searchParams.get(key)
						reg.env[envname] = envvalue
					}
				}
			}
			let items = await reg.resolve(name)
			if(!(items instanceof Array)) items = [items]
			//return await reg.require(name)
			
			return {
				module: null,
				mode: 'npm',
				moduleLoader: reg,
				items,
				uri
			}

		}


		let filename = (conv?.file) || resolv.request        
		try{
			
			let module = Module["_cache"][filename], mod:any = null
			if(!module){
				mod = Module["_load"](filename, parent)
				module = Module["_cache"][filename]
			}


			let base = {
				module,
				filename,
				executed: false,
				vars: {
					names: [],
					values: []
				},
				content: '',
				result: {
					code: ''
				},
				requires: [],
				preloadedModules: []
			}


			scope.set(resolv.request, base)
			if(mod?.__kawix__compile){
				meta = Object.assign(meta|| {}, props)
				let result = await this.defaultCompile(module, meta, scope)
				Object.assign(base, result)
			}
			else{
				base.executed = true
				base.content = Fs.readFileSync(filename,'utf8')
				base.result.code = base.content
			}
			return base 

		}catch(e){
			scope.delete(resolv.request)
			throw e 
		}

	}


	/*
	async $import(resolv:any, parent, scope: Map<string, any>){

		let info = await this.$importInfo(resolv, parent, scope)
		let cached = {
			exports: await getExports(),
			time: Date.now()
		}


		
		this.$modCache.set(resolv.request, cached)
		return cached.exports
	}*/

	async $enableEsbuildTranspiler(){
		let file = Path.join(this.$mainFolder, "esbuild.js")
		if(!Fs.existsSync(file)){
			await this.$installEsbuild()
		}
		this.$esbuildTranspiler = require(file)
		this.transpiler = 'esbuild'
	}


	async $installEsbuild(version: string = 'latest'){
		let id = parseInt(String(Date.now() / (24* 3600000))) + ".json"
		
		
		let pack = await this.import("https://unpkg.com/esbuild@"+(version||'latest')+"/package.json?date=" + id)
		version = pack.version 

		let mod = await this.import(this.packageLoader)
		let reg = new mod.Registry()
		let desc = await reg.resolve("esbuild@" + version) 
		let file = Path.join(this.$mainFolder, "esbuild.js")
		Fs.writeFileSync(file, "module.exports = require("+JSON.stringify(desc.main)+")")
		return file 
	}

	
	async compileSource(source: string, options: any){

		
		let original = this.$originals.get(options.filename)
		console.log('\x1b[32m[kwruntime] Compiling:\x1b[0m', original || options.filename)

		// COMPILE DEFAULT TYPESCRIPT SOURCE 
		let result = null, requires = [], nhead = []

		// STRIP BOM
		source = source.replace(/^\uFEFF/gm, "").replace(/^\u00BB\u00BF/gm,"")
		
		// IF #!....
		if(source.startsWith("#!")){
			let i = source.indexOf("\r") || source.indexOf("\n")
			if(i > 0) source = source.substring(i+1) 
			if(source[0] == "\n") source = source.substring(1)
		}

		//console.info("Using transpiler:", this.transpiler)
		let b = "//KWCORE--STARTING--LINE\n", transpiled = ''
		let fname = options.filename
		if(!fname.endsWith(".ts")){
			fname += ".ts" // for correct transformation
		}
		if(source.indexOf("\n//KWRUNTIME-DISABLE-TRANSPILATION\n") >= 0){
			result =  {
				code: b + source
			}
		}
		else{
			if(this.transpiler == "babel"){
				result = global.Babel.transform(b + source, {
					filename: fname,
					"plugins": Object.values(global.BabelPlugins).concat(options.plugins || []),
					presets: [[global.Babel.availablePresets["env"], {"targets": {node: 12}}], global.Babel.availablePresets["typescript"]],
					compact: false,
				})
				transpiled = 'babel'

			}
			else if(this.transpiler == "esbuild"){

				b = "var $$$n_import = import.meta;" + b
				let file = Path.join(this.$mainFolder, "esbuild.js")
				if(!this.$esbuildTranspiler){
					try{
						this.$esbuildTranspiler = require(file)
					}catch(e){
						throw new Error("Please use 'kwrun --transpiler=esbuild' to enable esbuild transpiler")
					}
				}
				// async or sync??
				//result = this.$esbuildTranspiler.transformSync(b + source, {
				result = await this.$esbuildTranspiler.transform(b + source, {
					loader: 'ts',
					format:'cjs',
					target: 'node12'
				})
				transpiled = 'esbuild'

			}
			else{
				throw new Error("Transpiler "+ this.transpiler + " not supported")
			}
		}

		
		// get imports 
		let aliases = {}
		let head_i = result.code.indexOf(b), z = 0, changed = false 

		/*
		if((head_i < 0) && (transpiled == "babel")){
			head_i = result.code.indexOf("\nfunction _interopRequireDefault(")
			if(head_i < 0)
				head_i = result.code.indexOf("\nfunction _interopRequireWildcard(")
		}*/

		if((head_i < 0) && (transpiled == "esbuild")){
			// some little transformations to match Babel transform code style
			let find = "var $$$n_import = import_meta;"
			head_i = result.code.indexOf(find)
			let h = result.code.substring(0, head_i).replace("const import_meta = {};", "const import_meta = importMeta.meta;")
			let bod = result.code.substring(head_i + find.length)
			while(bod.indexOf("Promise.resolve().then(() => __toModule(require(") >= 0){
				bod = bod.replace("Promise.resolve().then(() => __toModule(require(", "((asyncRequire(")
			}
			while(bod.indexOf("Promise.resolve().then(() => __toESM(require(") >= 0){
				bod = bod.replace("Promise.resolve().then(() => __toESM(require(", "((asyncRequire(")
			}
			result.code = h + bod
		}


		if(head_i < 0){
			head_i = result.code.length
		}
		if(head_i >= 0){
			let head = result.code.substring(0, head_i)
			let lines = head.split(/\n/g)
			for(let i=0;i<lines.length;i++){
				let line = lines[i]
				if(line.indexOf("require(\"") >= 0){
					
					let mod = line.match(/require\(\"([^\"]+)\"\)/)[1], alias = ''
					let i = mod.indexOf("##")
					if(i > 0){
						alias = mod.substring(i+2)
						mod = mod.substring(0, i)
						aliases[alias] = z
					}     
					changed = true

					if(aliases[mod] !== undefined){
						line = line.replace(/require\(\"([^\"]+)\"\)/, "preloadedModules[" + aliases[mod] + "]")
					}
					else{
						
						if(/kwruntime\/core(\@[0-9\.A-Za-z]+)?\/src\/kwruntime(\.ts)?$/.test(mod)){
							// Internal module
							line = line.replace(/require\(\"([^\"]+)\"\)/, "{Kawix: global.kawix.$class, KModule:KModule, kawix: global.kawix}")
						}
						else{
							requires.push(mod)
							line = line.replace(/require\(\"([^\"]+)\"\)/, "preloadedModules[" + String(z++) + "]")
						}
					}
				}
				nhead.push(line)
			}
		}

		
		if(changed){
			result.code = nhead.join("\n") + result.code.substring(head_i)
		}        

		return {
			content: source,
			result,
			requires
		}

	}


	async defaultExecute(info:any, exports: any){
		let code = info.result.code, func:any 
		if(info.filename){
			let vm = require("vm")
			func = new vm.compileFunction(info.result.code, info.vars.names, {
				filename: info.filename
			})
		}
		else{
			func = Function(info.vars.names.join(","), info.result.code)
		}
		await func.apply(func, info.vars.values)
		delete exports.__kawix__compile
		if(exports.kawixPreload){
			await exports.kawixPreload()
		}
		return exports    
	}

	async defaultCompileAndExecute(module, meta, scope = null){

		let info = await this.defaultCompile(module, meta, scope)
		return await this.defaultExecute(info, module.exports)

	}



	async defaultCompile(module, meta = null, scope: Map<string, any> = null) : Promise<ModuleImportInfo>{

		let data = module.exports
		if(!scope) scope = new Map<string,any>()


		module.__kawix__compiled = true

		let filename = data.__filename 
		let cache = data.__cache , savecache = false
		if(!filename.startsWith("/virtual")){
			cache = this.$getCache(filename)
			savecache = true    
		}
		
		
		let content = null, requires = [], nhead = [], result = null
		if(meta?.url){
			module.__kawix__network = true 
			module.__kawix__meta = meta 
			data.__local__vars["__filename"] = `/$NETWORK/${meta.uri.protocol.replace(":","")}${meta.uri.pathname}`
			data.__local__vars["__dirname"] = Path.normalize(Path.join(data.__local__vars["__filename"], ".."))
			data.__local__vars["importMeta"] = {meta}
		}
		else{
			data.__local__vars["importMeta"] = {
				meta: {
					url: "file://" + filename,
					main: meta?.main
				}
			}
		}

		module.__kawix__filename = filename
		let kmodule = data.__local__vars["KModule"] = new KModule(module)
		data.__local__vars["asyncRequire"] = kmodule.import.bind(kmodule)        
		//let originalRequire = data.__local__vars["require"]
		data.__local__vars["require"] = this.$generateRequireSync(module) //(request)=> this.requireSync(request, module) 
		let keys = Object.keys(data.__local__vars)
		let values = Object.values(data.__local__vars)
		values.push(data)
		keys.push("exports")


		if(!cache){
			content = ((data.__source || {}).content)
			if(content){

				if(content.startsWith("// ESBUILD PACKAGE")){
					// esbuild so ignore babel generation
					module._compile(content, filename)
					return 
				}
				else{
					let info = await this.compileSource(content, {
						filename
					})
					result = info.result
					requires = info.requires 
				}

			}
			else{  

				let compiler = null 
				for(let id in KModule.extensionCompilers){
					if(filename.endsWith(id)){
						compiler = KModule.extensionCompilers[id]
						break 
					}
				}

				compiler = compiler || KModule.extensionCompilers[".ts"]
				let info = await compiler(filename, module)
				if(!info) return 
				result = info.result
				requires = info.requires 


			}
			
			let stat = ((data.__source || {}).stat)
			if(!stat) stat = Fs.statSync(filename)            

			cache = {
				mtimeMs: Math.ceil(stat.mtimeMs/1000) * 1000,
				content,
				result: {
					code: result.code
				},
				requires,
				filename,
				time: Date.now()
			}
			// save cache
			if(savecache)
				this.$saveCache(filename, cache)

		}
		else{
			content = cache.content
			requires = cache.requires 
			result = cache.result 
		}        


		let preloadedModules = []
		if(requires.length > 0){
			// resolve first the requires ...
			keys.push("preloadedModules")
			values.push(preloadedModules)

			let kitems = {}
			for(let i=0;i<requires.length;i++){
				let parts = requires[i].split("/")
				if(kitems[parts[0]]){
					let location:any = {}
					if(parts.length == 1){
						location.main = kitems[parts[0]].main
					}
					else{
						location.main = Path.join(kitems[parts[0]].folder, parts.slice(1).join("/"))
					}
					
					preloadedModules.push({
						mode: 'node',
						location
					})
				}
				else{
					let imInfo = await this.importInfo(requires[i], module, scope)
					if(imInfo.mode == "npm"){
						for(let item of imInfo.items){
							kitems[item.name] = item 
						}
					}
					preloadedModules.push(imInfo)
				}
			}
		}
		
		return {
			module,
			filename,
			vars: {
				names: keys,
				values
			},
			content,
			requires,
			result,
			preloadedModules
		}        

	}

	$init(){
		this.originalArgv = process.argv 
		this.appArguments = process.argv.slice(2)
		let offset = 0, yet= false
		for(let i=0;i< this.appArguments.length;i++){
			let arg = this.appArguments[i]
			if(arg.startsWith("--")){
				let vl = arg.split("=")
				let name = vl[0].substring(2)
				let value = (vl[1] || "").trim()
				this.$startParams[name] = value
				this.$startParams[name + "_Array"] = this.$startParams[name + "_Array"] || []
				this.$startParams[name + "_Array"].push(value)

				this.optionsArguments.push(arg)

				if(!yet)
					offset++
			}
			else{
				yet = true 
				this.$startParams[".values"] = this.$startParams[".values"]  || []
				this.$startParams[".values"].push(arg)
			}
		}

		if(offset > 0) this.appArguments = this.appArguments.slice(offset)
		this.mainFilename = this.appArguments[0]

		let folder = process.env.RUNTIME_CACHE_FOLDER || Path.join(Os.homedir(), ".kawi")
		if(!folder.startsWith("/virtual")){
			if(!Fs.existsSync(folder)) Fs.mkdirSync(folder)
			this.$mainFolder = folder

			folder = Path.join(folder, "genv2")
			if(!Fs.existsSync(folder)) Fs.mkdirSync(folder)
			this.$cacheFolder = folder
			if(this.$cacheType == "javascript"){
				this.$cacheFolder = Path.join(this.$mainFolder, "compiled")
				if(!Fs.existsSync(this.$cacheFolder)) Fs.mkdirSync(this.$cacheFolder)
			}
			folder = Path.join(folder, "network")
			if(!Fs.existsSync(folder)) Fs.mkdirSync(folder)
			this.$networkContentFolder = folder 
		}
		else{
			this.$mainFolder = folder
			this.$cacheFolder = Path.posix.join(folder, "genv2")
			this.$networkContentFolder = Path.posix.join(folder, "network")
		}

		let sourceFolder = Path.join(this.$networkContentFolder, "sources")
		if(!Fs.existsSync(sourceFolder)) Fs.mkdirSync(sourceFolder)
		
		let esbuild = Path.join(this.$mainFolder, "esbuild.js")
		if(Fs.existsSync(esbuild)){
			try{
				this.$esbuildTranspiler = require(esbuild)
				this.transpiler = 'esbuild'
			}catch(e){
				console.info("> Failed set transpiler=esbuild")
			}
		}
	}
   


}



// register .ts, .js extension
let Zlib = null
async function BinaryTypescript(filename: string, module: Module, options: any): Promise<CompiledResult>{
	let fd = Fs.openSync(filename, "r")
	let buffer = Buffer.allocUnsafe(500)
	Fs.readSync(fd, buffer, 0, 500, 0)
	let str = buffer.toString('binary')
	let lines = str.split("\n")
	let line = lines[0], offset = 0
	if(line.startsWith("#!")){
		offset += line.length + 1
		line = lines[1]
	}
	offset += line.length + 1

	let bytes = Buffer.from(line, "binary")
	let sourceLen = bytes.readInt32LE(0)
	let binaryMetaLen = bytes.readInt32LE(4)
	
	buffer = Buffer.allocUnsafe(sourceLen)
	Fs.readSync(fd, buffer, 0, buffer.length, offset)
	

	let compressType = bytes.slice(8,9).toString()
	let getString = function(buffer){
		if(compressType == "g"){
			if(!Zlib) Zlib = require("zlib")
			buffer = Zlib.gunzipSync(buffer)
		}
		else if(compressType == "z"){
			if(!Zlib) Zlib = require("zlib")
			buffer = Zlib.inflateSync(buffer)
		}
		else if(compressType == "b"){
			if(!Zlib) Zlib = require("zlib")
			buffer = Zlib.brotliDecompressSync(buffer)
		}
		else{
			buffer = buffer.toString()
		}
		return buffer
	}

	let source = getString(buffer)

	offset += sourceLen + 1
	buffer = Buffer.allocUnsafe(binaryMetaLen)
	Fs.readSync(fd, buffer, 0, buffer.length, offset)

	let metadata = JSON.parse(getString(buffer))
	let binary= {
		metadata,
		start: offset,
		length: binaryMetaLen,
		data: {
			offset: 0,
			length: 0
		},
		filename,
		
	}
	binary.data.offset = binary.start + binaryMetaLen
	let stat = Fs.fstatSync(fd)
	binary.data.length = stat.size - binary.data.offset
	source = `exports.__binary = ${JSON.stringify(binary)};\n${source}`

	let cmeta = Kawix.$binaryMetadata.get(filename)
	if(cmeta?.fd){
		Fs.closeSync(cmeta.fd)
	}
	//console.info(filename, binary)
	Kawix.$binaryMetadata.set(filename, binary)
	return await processTypescript(filename, source, options)
}

async function Typescript(filename:string, module: Module, options: any): Promise<CompiledResult>{
	let content = Fs.readFileSync(filename, "utf8")
	// strip - bom  & bash env
	content = content.replace(/^\uFEFF/gm, "").replace(/^\u00BB\u00BF/gm,"")
	if(content.startsWith("#!")){        
		let i = content.indexOf("\r")
		if(i < 0)  i= content.indexOf("\n")        
		if(i > 0) content = content.substring(i+1) 
		if(content[0] == "\n") content = content.substring(1)
	}
	return await processTypescript(filename, content, options)
}

async function processTypescript(filename: string, source: string, options: any){
	if(source.startsWith("// ESBUILD PACKAGE")){
		module["_compile"](source, filename)
	}
	else{
		let info = await global.kawix.compileSource(source, Object.assign({}, options, {
			filename
		}))
		return info            
	}
}



KModule.addExtensionLoader(".ts", {
	compile: Typescript
})

KModule.addExtensionLoader(".kwb", {
	compile: BinaryTypescript
})

KModule.addExtensionLoader(".kwc", {
	compile: BinaryTypescript
})

let defaultJs = Module["_extensions"][".js"]
KModule.addExtensionLoader(".js", {
	compile: Typescript,
	preload: function(module, filename, defaultPreload){
		if(module.parent?.["__kawix__compiled"] && (!global.kawix.disableCompile)){
			defaultPreload()
		}
		else{
			defaultJs(module, filename)
		}
	}
})

