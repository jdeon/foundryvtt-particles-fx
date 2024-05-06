import { Utils, Vector3, sameStartKey } from "../utils/utils.js"

export class ParticleInput {

    static build(inputValue, inputCmd, advancedVariables){
        let isTimedLinked = false

        if(typeof inputCmd === 'string'){
            const usedVariables =  inputCmd.match(/(?<=\{\{).+?(?=\}\})/g) //Get all value inside {{}}
             
            if(usedVariables?.length > 0){
                 for(let key of usedVariables){
                     if(advancedVariables[key]?.isTimedLinked){
                         isTimedLinked = true
                         break
                     }
                 }
            }
         }
         
         
         if(isTimedLinked){
            if(inputValue instanceof Vector3){
                return new TimedParticleVectorInput(inputValue)
            } else {
                return new TimedParticleInput (inputValue, inputCmd)
            }
         } else if(inputValue instanceof Vector3){
            return new ParticleVectorInput(inputValue)
         }else {
            return new ParticleInput(inputValue)
         }
    }

    constructor(inputValue){
        this.inputValue = inputValue
    }

    getValue(){
        return this.inputValue
    }

    multiply(value){
        if(this._isInvalidOperation(value)) return this

        this.inputValue = this.inputValue * value

        return this
    }

    add(value){
        if(this._isInvalidOperation(value)) return this

        this.inputValue = this.inputValue + value

        return this
    }

    _isInvalidOperation(value){
        return isNaN(value) || this.inputValue === sameStartKey
    }
}

export class ParticleVectorInput extends ParticleInput {

    constructor(inputValue){
        super(inputValue)
    }

    getValue(){
        return this.inputValue
    }

    multiply(value){
        this.inputValue = this.inputValue.multiply(value)
        return this
    }

    add(value){
        this.inputValue = this.inputValue.add(value)
        return this
    }
}


export class TimedParticleInput  extends ParticleInput {

    constructor(inputValue, inputCmd){
        super(inputValue)
        this.inputCmd = inputCmd
        this._valueOperations = []
    }

    getValue(advancedVariables){
        
        if( advancedVariables ){
            return this._computeTimeValue(advancedVariables)
        }

        return this.inputValue
    }

    multiply(value){
        if(this._isInvalidOperation(value)) return this

        this._valueOperations.push({value, operation:(a, b) => a * b})

        return this
    }

    add(value){
        if(this._isInvalidOperation(value)) return this

        this._valueOperations.push({value, operation:(a,b) => a + b})

        return this
    }

    _computeTimeValue(advancedVariables){
        let result = Number(Utils._replaceWithAdvanceVariable(this.inputCmd, advancedVariables))

        if(isNaN(result)) return this.inputValue

        for(let valueOperation of this._valueOperations){
            result = valueOperation.operation(result, valueOperation.value)
        }

        return result
    }
}

export class TimedParticleVectorInput  extends TimedParticleInput {

    constructor(inputValue, inputCmd){
        super(inputValue, inputCmd)
    }

    getValue(advancedVariables){
        
        if( advancedVariables ){
            return this._computeTimeValue(advancedVariables)
        }

        return this.inputValue
    }

    multiply(value){
        if(isNaN(value) && !value instanceof Vector3) return this

        this._valueOperations.push({value, operation:(a, b) => a.multiply(b)})

        return this
    }

    add(value){
        if(isNaN(value)  && !value instanceof Vector3) return this

        this._valueOperations.push({value, operation:(a,b) => a.add(b)})

        return this
    }

    _computeTimeValue(advancedVariables){
        let result = Vector3.build(Utils._replaceWithAdvanceVariable(this.inputCmd, advancedVariables))

        if(!result.toNumber()) return this.inputValue

        for(let valueOperation of this._valueOperations){
            result = valueOperation.operation(result, valueOperation.value)
        }

        return result
    }
}