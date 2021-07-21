
var fs = require("fs")
global.Babel = require("./babel.min.js")

var content = fs.readFileSync(__dirname + "/Kawix.ts", "utf8")
var result = Babel.transform("//KWCORE--STARTING--LINE\n" + content, {
    filename: __dirname + "/main.ts",
    presets: [[Babel.availablePresets["env"], {"targets": {node: 10}}], Babel.availablePresets["typescript"]]
})



fs.writeFileSync(__dirname + "/T-Kawix.js", result.code)