import { Utils } from "../utils/utils.js"

export class AdvancedVariable { 

    static RESERVED_TIMED_PARAM = [
        "dt", //Delta time with last frame
        "lt", //Lifetime (time of existence in millisecond)
        "tp"  //Percentage of living time
    ]
     
    static LIST_OF_LOGGED_ERROR = []

    static computeAdvancedVariables(advancedVariables){
        if(!advancedVariables) return

        const staticAdvancedVariables = Utils.getObjectRandomValueFrom(advancedVariables)

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
        this.isTimedLinked = false

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

        const haveTimedParam = Utils.intersectionArray(AdvancedVariable.RESERVED_TIMED_PARAM, this.requiredParam)
        if(haveTimedParam?.length){
            this.isTimedLinked = true
        }
        
        let missingParameters = []

        const requiredParam = this.requiredParam.reduce(
            (acc, key) => {
                acc[key] = advancedVariables[key]?.value

                if(acc[key] === undefined){
                    missingParameters.push(key)
                } else if(advancedVariables[key].isTimedLinked){
                    this.isTimedLinked = true
                }

                return acc
            },
            {}
        )

        missingParameters = missingParameters.filter((item) => ! AdvancedVariable.RESERVED_TIMED_PARAM.includes(item))

        if(missingParameters?.length > 0 && AdvancedVariable._doLog(`missingParameters_${this.key}`)){
            ui.notifications.warn(game.i18n.format('PARTICULE-FX.advancedMode.missingParameters', {variableKey: this.key, missingParameters : missingParameters.join(', ')}))
        }

        try{
            this.value = this.input({...requiredParam, "dt" : 1000/Number(game.settings.get('core',"maxFPS")),  "lt": 1000, "tp":0})//TODO find lifeTime
            if(Number.isNaN(this.value) || Infinity === this.value){
                throw new Error('NaN')
            }
        } catch (e){
        
            this.value = 1

            if(AdvancedVariable._doLog(`computeError${this.key}`)){
                ui.notifications.warn(game.i18n.format('PARTICULE-FX.advancedMode.computeError', {variableKey: this.key}))
            }
        }
        
        if(! this.isTimedLinked){
            this.isFinish = true
        }
    }

    _isSecuredFunction(){
        //check if function have . other than Math.
        if(!this.input instanceof Function) return true

        let stringFunction = this.input.toString()
            .replaceAll('Math.', '') // Remove Math.

        const regex = /\.|\[|\]|\"|\'/g; //Regex to find other.
        const found = stringFunction.toString().match(regex);

        if(!found?.length){
            return true
        } 

        return false
    }
}