function myCustomPlugin() {
    return {
        visitor: {
            MetaProperty(path) {
                if(path.node.meta.name == "import"){
                    path.node.meta.name = "importMeta"
                }
            }
        }
    }
}

exports.default = myCustomPlugin