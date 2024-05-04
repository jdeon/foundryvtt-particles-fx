import { Utils } from "../utils/utils.js"

const OperationType = {
    Add : (a,b) => a + b,
    Multiply : (a, b) => a * b
  }

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
            return new TimedParticleInput (inputValue, inputCmd)
         } else {
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
        if(isNaN(value)) return this

        this.value = this.value * value

        return this
    }

    add(value){
        if(isNaN(value)) return this

        this.value = this.value + value

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
        if(isNaN(value)) return this

        this._valueOperations.push({value, operation:OperationType.Multiply})

        return this
    }

    add(value){
        if(isNaN(value)) return this

        this._valueOperations.push({value, operation:OperationType.Add})

        return this
    }

    _computeTimeValue(advancedVariables){
        //TODO vector ?
        let result = Number(Utils._replaceWithAdvanceVariable(this.inputCmd, advancedVariables))

        if(isNaN(result)) return this.inputValue

        for(let valueOperation of this._valueOperations){
            result = valueOperation.operation(result, valueOperation.value)
        }

        return result
    }
}