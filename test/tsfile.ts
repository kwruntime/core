export class TsFile{

    constructor(){
    }

    static async main(){
        let path = await import("path")
        console.info(path.join.toString())
        console.info(import.meta)

    }
    
}
TsFile.main()
//console.info("AQUÍ")