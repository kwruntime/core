
import * as Types from './types'

function _kawix(): Types.Kawix{
	return global.kawix 
}
function _KModule(): Types.KModuleLoader{
	return this["KModule"]
}

export var kawix = _kawix()
export var KModule = _KModule()