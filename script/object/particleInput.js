import { Utils } from "../utils/utils.js"

const OperationType = {
    Add : (a,b) => a + b,
    Multiply : (a, b) => a * b
  }

export class ParticleInput {

    constructor(inputValue, inputCmd, advancedVariables){
        this.inputCmd = inputCmd
        this.inputValue = inputValue
        this.isTimedLinked = false //Default
        this._valueOperations = []

        if(typeof inputCmd === 'string'){
           const usedVariables =  this.inputCmd.match(/(?<=\{\{).+?(?=\}\})/g) //Get all value inside {{}}
            
           if(usedVariables?.length > 0){
                for(let key in usedVariables){
                    if(advancedVariables[key]?.isTimedLinked){
                        this.isTimedLinked = true
                        break
                    }
                }
           }
        } 
    }

    getValue(advancedVariables){
        
        if( this.isTimedLinked && advancedVariables){
            return this._computeTimeValue(advancedVariables)
        }

        return this.inputValue
    }

    multiply(value){
        if(isNaN(value)) return this

        if(this.isTimedLinked){
            this._valueOperations.push({value, operation:OperationType.Multiply})
        } else {
            this.value * value
        }

        return this
    }

    add(value){
        if(isNaN(value)) return this

        if(this.isTimedLinked){
            this._valueOperations.push({value, operation:OperationType.Add})
        } else {
            this.value + value
        }

        return this
    }

    _computeTimeValue(advancedVariables){
        //TODO vector ?
        const result = Number(Utils._replaceWithAdvanceVariable(this.inputCmd, advancedVariables))

        if(isNaN(result)) return this.inputValue

        for(let valueOperation in this._valueOperations){
            result = valueOperation.operationType(result, valueOperation.value)
        }

        return result
    }
}