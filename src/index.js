


var fs = require("fs")
var Module = require("module")
var Path = require("path")



global.Babel = require("./lib/babel.min.js")
global.BabelPlugins = {
    dynamicImport: require("./lib/babel.dynamic.import.js").default,
    importMeta: require("./lib/babel.import.meta.js").default
    
}

var kawix = require("./Kawix.ts").Kawix
var kwcore = global.kwcore = global.kawix = new kawix()
kwcore.$init()


let program = async function(){
    try{

        //console.info(kwcore.$startParams)
        if(kwcore.$startParams["self-install"] !== undefined){
            await kwcore.installer.selfInstall()
        }
        if(kwcore.$startParams["install"] !== undefined){
            
            let href = kwcore.$startParams["install"]
            let name = kwcore.$startParams["name"]
            let exe = kwcore.$startParams["executable"]
            if(!name  || !href){
                console.error("Parameters: --install, --name are required to be non empty")
                process.exit(1)
            }
            await kwcore.installer.install(href, name, exe)

        }
        else if(kwcore.appArguments[0]){
            
            let fname = global.kwcore.appArguments[0]
            if(fname.startsWith("http:") || fname.startsWith("https:") || fname.startsWith("gh+/")
                || fname.startsWith("github+/") || fname.startsWith("gitlab+/") || fname.startsWith("gh+/")
                || fname.startsWith("github://") || fname.startsWith("gitlab://")){

            }
            else if(!Path.isAbsolute(fname)){
                fname = Path.join(process.cwd(), fname)
                global.kwcore.mainFilename = fname
            }
            

            module.__kawix__compiled = true
            let mod = await global.kwcore.import(fname, module)
            if(mod && mod.Program){
                await mod.Program.main(global.kwcore.appArguments)
            }


        }
    }catch(e){
        console.error(e)
    }
}

program()