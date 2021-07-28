import 'npm://esbuild@0.12.15'
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
}

/*
var fs = require("fs")
global.Babel = require("./lib/babel.min.js")

var content = fs.readFileSync(__dirname + "/Kawix.ts", "utf8")
var result = Babel.transform("//KWCORE--STARTING--LINE\n" + content, {
    filename: __dirname + "/main.ts",
    presets: [[Babel.availablePresets["env"], {"targets": {node: 10}}], Babel.availablePresets["typescript"]]
})



fs.writeFileSync(__dirname + "/T-Kawix.js", result.code)*/