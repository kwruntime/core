try{
    global.import = (mod)=> import(mod)
}catch(e){}

var fs = require("fs")
var Module = require("module")
var Path = require("path")



global.Babel = require("./lib/babel.min.js")
global.BabelPlugins = {
    dynamicImport: require("./lib/babel.dynamic.import.js").default,
    importMeta: require("./lib/babel.import.meta.js").default

}

var Kawix = require("./Kawix.js").Kawix
var kwcore = global.kwcore = global.kawix = new Kawix()
//kwcore.winReg = require("./winreg-vbs1.0.0.js")
kwcore.$init()


let program = async function(){
    try{

        let macArgs = []
        let openTerminalMac = function(){
            // start Terminal.app
            let uiArgs = [
                "-e",
                "tell application \"Terminal\"",
                "-e",
                "Activate",
                "-e",
                "do script \"" + macArgs.join(" ") + ";exit;\"",
                "-e",
                "end tell"
            ]
            require("child_process").spawn("osascript", uiArgs, {
                stdio:'inherit'
            })
            return  
        }

        let useMac =  (kwcore.$startParams["mac"] !== undefined) || (kwcore.$startParams["osx"] !== undefined)
        if(useMac){
            for(let i=0;i<process.argv.length;i++){
                let arg = process.argv[i]
                if(arg == "--mac" || arg == "--osx" || arg.startsWith("--mac") || arg.startsWith("--osx")){
                }
                else{
                    macArgs.push(arg)
                }
            }
            process.argv = macArgs
        }

        if(kwcore.$startParams["transpiler"] == "esbuild"){
            await kwcore.$enableEsbuildTranspiler()
        }
        else if(kwcore.$startParams["transpiler"]){
            kwcore.transpiler = kwcore.$startParams["transpiler"]
        }



        if(kwcore.$startParams["self-install"] !== undefined){
            //if(useMac) return openTerminalMac()
            await kwcore.installer.selfInstall()
        }
        else if(kwcore.$startParams["install-esbuild"] !== undefined){
            //if(useMac) return openTerminalMac()
            await kwcore.$installEsbuild(kwcore.$startParams["install-esbuild"])
            console.info("> Esbuild transpiler installed. Now you can use with --transpiler=esbuild")
        }
        else if(kwcore.$startParams["install-kwcore"] !== undefined){
            //if(useMac) return openTerminalMac()
            await kwcore.installer.installKwcore()
        }
        if(kwcore.$startParams["install"] !== undefined){
            let href = kwcore.$startParams["install"]
            let name = kwcore.$startParams["name"]

            if(!href){
                console.error("Parameter --install is required")
                process.exit(1)
            }

            //let exe = kwcore.$startParams["executable"]
            delete kwcore.$startParams.install
            delete kwcore.$startParams.name

            await kwcore.installer.install(href, name, kwcore.$startParams)
        }

        else if(kwcore.appArguments.length){

            module.__kawix__compiled = true
            let g = function(a){
                //console.info(a)
                let location = undefined
                if(a.location){
                    location = {
                        folder: a.location.folder,
                        main: a.location.main
                    }
                }
                if(a.items && a.items.length ){
                    // from npm
                    location = {
                        folder: a.items[0].folder,
                        main: a.items[0].main
                    }

                    a.filename = location.main
                }
                return {
                    location,
                    filename: a.filename,
                    request: a.request,
                    requires: a.requires,
                    imports: (a.preloadedModules || []).map(g)
                }
            }
            if(kwcore.$startParams.cache !== undefined){
                let res = []
                for(let i=0;i<global.kwcore.appArguments.length;i++){
                    let name = global.kwcore.appArguments[i]
                    try{
                        let info = g(await global.kwcore.importInfo(name))
                        res.push(info)
                    }catch(e){
                        res.push({
                            request: name,
                            error: {
                                code: e.code,
                                stack: e.stack,
                                message: e.message
                            }
                        })
                    }
                }
                console.info("[kwruntime] Cache result =", JSON.stringify(res))
            }
            else{

                let fname = global.kwcore.appArguments[0]
                if(fname.startsWith("http:") || fname.startsWith("https:") || fname.startsWith("gh+/")
                    || fname.startsWith("github+/") || fname.startsWith("gitlab+/") || fname.startsWith("gh+/")
                    || fname.startsWith("github://") || fname.startsWith("gitlab://")){

                }
                else if(!Path.isAbsolute(fname)){
                    fname = Path.join(process.cwd(), fname)
                    global.kwcore.mainFilename = fname
                }
                let info = await global.kwcore.importInfo(fname, module, null, {
                    main: true
                })
                if(useMac){
                    if(info.filename){
                        if(info.filename.endsWith(".kw.ts") || info.filename.endsWith(".kws") || info.filename.endsWith(".kwc")){
                            return openTerminalMac()
                        }
                    }
                }

                let mod = await global.kwcore.importFromInfo(info)
                if(mod && mod.Program){
                    await mod.Program.main(global.kwcore.appArguments)
                }
            }
        }
        else{
            console.info("Welcome to kwruntime/core version "+ kwcore.version)
        }
    }catch(e){
        console.error(e)
    }
}

exports.kwruntime = kwcore 
kwcore.filename = __filename
exports.kawix = kwcore 
exports.Kawix = Kawix 
exports.program = exports.default = program 
exports.programTimer = setImmediate(program)

//program()
