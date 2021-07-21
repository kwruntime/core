// adding ## after URL import make usable as an alias
// in that way VisualStudioCode or any edit can 
// show type definitions
import "https://esm.sh/luxon##luxon" 
import * as Luxon from 'luxon'

console.info(Luxon.DateTime.fromMillis(Date.now()).toFormat("yyyy-MM-dd"))