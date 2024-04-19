import { Utils } from "../utils/utils.js"

export class AdvancedVariable { 

    static LIST_OF_LOGGED_ERROR = []

    static computeAdvancedVariables(advancedVariable){
        if(!advancedVariable) return

        const staticAdvancedVariables = Utils.getObjectRandomValueFrom(advancedVariable)

        let inKey = Object.keys(staticAdvancedVariables)
        const result = []

        for (const key of inKey) {
            result.push(new AdvancedVariable(key, staticAdvancedVariables[key]));
        }

        result.sort(AdvancedVariable._compare)

        return result.reduce((acc, item) => {
            item.generate(acc)
            acc[item.key] = item
            return acc
        }, 
        {});
    }

    static _doLog(key){
        if(! AdvancedVariable.LIST_OF_LOGGED_ERROR.includes(key)){
            AdvancedVariable.LIST_OF_LOGGED_ERROR.push(key)
            return true
        } else {
            return false
        }
    }

    static _getParam(variableKey, inputFunction){
        const regex = /\(\{.*?\}\)/g; //Regex to find ({...})
        const found = inputFunction.toString().match(regex);

        if(!found?.length){

            if(AdvancedVariable._doLog(`badFormatParameters_${variableKey}`)){
                ui.notifications.warn(game.i18n.format('PARTICULE-FX.advancedMode.badFormatInput', {variableKey} ))
            }
            return []
        }

        const result = found[0] //First result for param
            .replace(/(\(\{|\}\))/g, '') // Remove "({" and "})""
            .replace(/\s/g, '') //Remove space
            .split(',')

        return result
    }

    static _compare(a, b) {
        if(a.requiredParam.length === 0 && b.requiredParam.length === 0){
            return 0
        }

        if(a.requiredParam.length === 0){
            return -1
        }

        if(b.requiredParam.length === 0){
            return 1
        }

        if(a.requiredParam.indexOf(b.key) > -1){
            return 1 //a need b
        }

        if(b.requiredParam.indexOf(a.key) > -1){
            return -1 //b need a
        }

        return 0
    }

    constructor(key, input){
        this.key = key
        this.input = input;

        if(input instanceof Function){
            this.requiredParam = AdvancedVariable._getParam(this.key, input)
            this.isFinish = false
        }else{
            this.value = input
            this.isFinish = true
            this.requiredParam = []
        }
    }

    generate(advancedVariables){
        if(this.isFinish || !this.input instanceof Function) return

        if(!this._isSecuredFunction()){
            if(AdvancedVariable._doLog(`badFormatFunction_${this.key}`)){
                ui.notifications.warn(game.i18n.format('PARTICULE-FX.advancedMode.badFormatFunction', {variableKey: this.key} ))
            }
            this.value = 1
            this.isFinish = true
            return
        }
        
        const missingParameters = []

        const requiredParam = this.requiredParam.reduce(
            (acc, key) => {
                acc[key] = advancedVariables[key]?.value

                if(acc[key] === undefined){
                    missingParameters.push(key)
                }

                return acc
            },
            {}
        )

        if(missingParameters?.length > 0 && AdvancedVariable._doLog(`missingParameters_${this.key}`)){
            ui.notifications.warn(game.i18n.format('PARTICULE-FX.advancedMode.missingParameters', {variableKey: this.key, missingParameters : missingParameters.join(', ')}))
        }

        try{
            this.value = this.input(requiredParam)

            if(Number.isNaN(this.value) || Infinity === this.value){
                throw new Error('NaN')
            }
        } catch (e){
        
            this.value = 1

            if(AdvancedVariable._doLog(`computeError${this.key}`)){
                ui.notifications.warn(game.i18n.format('PARTICULE-FX.advancedMode.computeError', {variableKey: this.key}))
            }
        }
        
        this.isFinish = true
    }

    _isSecuredFunction(){
        //check if function have . other than Math.
        if(!this.input instanceof Function) return true

        let stringFunction = this.input.toString()
            .replace('Math.', '') // Remove Math.

        const regex = /\./g; //Regex to find other.
        const found = stringFunction.toString().match(regex);

        if(!found?.length){
            return true
        } 

        return false
    }
}