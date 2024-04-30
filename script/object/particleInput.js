import { Utils } from "../utils/utils.js"

export class ParticleInput {

    constructor(inputValue, inputCmd, advancedVariables){
        this.inputCmd = inputCmd
        this.inputValue = inputValue
        this.isTimedLinked = false //Default

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
        //TODO vector ?
        if( this.isTimedLinked){
            return Number(Utils._replaceWithAdvanceVariable(this.inputCmd, advancedVariables)?? this.inputValue)
        }

        return this.inputValue
    }
}