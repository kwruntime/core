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
		Fs.writeFileSync(iconPath, this.$kawix.pngCompressedIcons)

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
		var file  = Path.join(Os.homedir(), 'KwRuntime/src/kwruntime.js')
		
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

	let npm = `#!/usr/bin/env node
		const {Runner} = require(${JSON.stringify(runfile)})
		Runner.execute("npm", "npm")
		`;
	let npx = `#!/usr/bin/env node
		const {Runner} = require(${JSON.stringify(runfile)})
		Runner.execute("npm", "npx")
		`;
	let nodegyp = `#!/usr/bin/env node
		const {Runner} = require(${JSON.stringify(runfile)})
		Runner.execute("node-gyp")
		`;
	let yarn = `#!/usr/bin/env node
		const {Runner} = require(${JSON.stringify(runfile)})
		Runner.execute("yarn", "yarn")
		`;
	let yarnpkg = `#!/usr/bin/env node
		const {Runner} = require(${JSON.stringify(runfile)})
		Runner.execute("yarn", "yarnpkg")
		`;
	let pnpm = `#!/usr/bin/env node
		const {Runner} = require(${JSON.stringify(runfile)})
		Runner.execute("pnpm", "pnpm")
		`;
	let pnpx = `#!/usr/bin/env node
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
		return "1.1.33"
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

