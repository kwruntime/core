module.exports = require("./dist/kwruntime.js")


// if required from node, no execute based on argv
if(module.exports.programTimer)
	clearImmediate(module.exports.programTimer)