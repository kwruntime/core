var fs = require("fs")
var Path= require("path")

global.Babel = require(__dirname + "/src/lib/babel.min.js")

var content = fs.readFileSync(__dirname + "/src/Kawix.ts", "utf8")
var result = Babel.transform("//KWCORE--STARTING--LINE\n" + content, {
    filename: __dirname + "/main.ts",
    presets: [[Babel.availablePresets["env"], {"targets": {node: 10}}], Babel.availablePresets["typescript"]]
})


let text = `
const $$Modules = {}


$$Modules["./lib/babel.min.js"] = (function(module, exports){
    ${fs.readFileSync(__dirname + "/src/lib/babel.min.js", "utf8")}
})

$$Modules["./lib/babel.dynamic.import.js"] = (function(module, exports){
    ${fs.readFileSync(__dirname + "/src/lib/babel.dynamic.import.js", "utf8")}
})

$$Modules["./lib/babel.import.meta.js"] = (function(module, exports){
    ${fs.readFileSync(__dirname + "/src/lib/babel.import.meta.js", "utf8")}
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

if(!fs.existsSync(__dirname + "/dist")){
    fs.mkdirSync(__dirname + "/dist")
}
fs.writeFileSync(__dirname + "/dist/kwruntime.js", text)
fs.writeFileSync(__dirname + "/dist/Kawix.js", result.code)

let distributionFolder = Path.join(__dirname, "..", "distribution", "core","dist")
if(fs.existsSync(distributionFolder)){
    fs.writeFileSync(distributionFolder + "/kwruntime.js", text)
    fs.writeFileSync(distributionFolder + "/Kawix.js", result.code)
}