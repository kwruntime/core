
import "https://esm.sh/express##express" // usage as alias
import Express from 'express'

main()
async function main(){

    const app = Express()
 
    app.get('/', function (req, res) {
    res.send('Hello World')
    })
    
    app.listen(3000)


}

