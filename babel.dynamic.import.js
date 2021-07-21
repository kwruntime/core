function myCustomPlugin() {
    return {
        visitor: {
            CallExpression(path) {
                if(path.node.callee.type == "Import"){
                    path.node.callee.type = "Identifier"
                    path.node.callee.name = "asyncRequire"  
                }
            }
        }
    }
}

exports.default = myCustomPlugin