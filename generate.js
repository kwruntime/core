/*import 'npm://esbuild@0.12.15'
import * as esbuild from "esbuild"

main()
async function main(){

    esbuild.buildSync({
        entryPoints: [__dirname + '/src/index.js'],
        bundle: true,
        platform: 'node',
        target: ['node10.4'],
        outfile: __dirname + '/dist/kwruntime.js'
    })
}*/

var fs = require("fs")
global.Babel = require("./src/lib/babel.min.js")

var content = fs.readFileSync(__dirname + "/src/Kawix.ts", "utf8")
var result = Babel.transform("//KWCORE--STARTING--LINE\n" + content, {
    filename: __dirname + "/main.ts",
    presets: [[Babel.availablePresets["env"], {"targets": {node: 10}}], Babel.availablePresets["typescript"]]
})


let text = `
const $$Modules = {}


$$Modules["./lib/babel.min.js"] = (function(module, exports){
    ${fs.readFileSync("./src/lib/babel.min.js", "utf8")}
})

$$Modules["./lib/babel.dynamic.import.js"] = (function(module, exports){
    ${fs.readFileSync("./src/lib/babel.dynamic.import.js", "utf8")}
})

$$Modules["./lib/babel.import.meta.js"] = (function(module, exports){
    ${fs.readFileSync("./src/lib/babel.import.meta.js", "utf8")}
})

const $$realRequire = require 
const $$cache = {}
require = function(name){
    if($$cache[name]) return $$cache[name]
    if($$Modules[name]){
        var mod = {
            exports: {},
            parent: {
                __kawix__compiled : true
            }
        }
        $$Modules[name](mod, mod.exports)
        $$cache[name] = mod.exports 
        return mod.exports
    }
    return $$realRequire.apply(null, arguments)
}

${fs.readFileSync(__dirname + "/src/index.js", "utf8")}
`
fs.writeFileSync(__dirname + "/dist/kwruntime.js", text)
fs.writeFileSync(__dirname + "/dist/Kawix.js", result.code)