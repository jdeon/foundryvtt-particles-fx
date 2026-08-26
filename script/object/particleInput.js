import { Utils, Vector3, sameStartKey } from "../utils/utils.js"

/**
 * Wrapper class managing scalar particle configuration input values and operations.
 */
export class ParticleInput {

    /**
     * Factory method creating appropriate ParticleInput subclass based on input command and variables.
     * @param {number|Vector3} inputValue - Constant initial scalar or vector value.
     * @param {string|Vector3} inputCmd - Input command string or command vector.
     * @param {Record<string, TODO type>} advancedVariables - Active advanced variables.
     * @returns {ParticleInput} Instantiated ParticleInput instance.
     */
    static build(inputValue, inputCmd, advancedVariables){
        let isTimedLinked = false

        if(typeof inputCmd === 'string'){
            isTimedLinked = ParticleInput._checkIsTimedLinked (inputCmd, advancedVariables)
        } else if (inputCmd instanceof Vector3){
            for(let key of Object.keys(inputCmd)){
                 if(ParticleInput._checkIsTimedLinked (inputCmd[key], advancedVariables)){
                     isTimedLinked = true
                     break
                 }
             }
        }
         
         
         if(isTimedLinked){
            if(inputValue instanceof Vector3){
                return new TimedParticleVectorInput(inputValue, inputCmd)
            } else {
                return new TimedParticleInput (inputValue, inputCmd)
            }
         } else if(inputValue instanceof Vector3){
            return new ParticleVectorInput(inputValue)
         }else {
            return new ParticleInput(inputValue)
         }
    }

    /**
     * Checks if input command string references any time-dependent advanced variable.
     * @param {string} inputCmd - Command string containing template tags.
     * @param {Record<string, AdvancedVariable>} advancedVariables - Active advanced variables map.
     * @returns {boolean} True if linked to timed variables.
     */
    static _checkIsTimedLinked (inputCmd, advancedVariables) {
        if(typeof inputCmd !== "string") return false


        let isTimedLinked = false

        const usedVariables =  inputCmd.match(/(?<=\{\{).+?(?=\}\})/g) //Get all value inside {{}}
             
        if(usedVariables?.length > 0){
             for(let key of usedVariables){
                 if(advancedVariables[key]?.isTimedLinked){
                     isTimedLinked = true
                     break
                 }
             }
        }

        return isTimedLinked
    }

    /**
     * Constructs a ParticleInput instance.
     * @param {number|string|symbol} inputValue - Initial scalar input value.
     */
    constructor(inputValue){
        this.inputValue = inputValue
    }

    /**
     * Retrieves current scalar input value.
     * @returns {number|string|symbol} Current scalar value.
     */
    getValue(){
        return this.inputValue
    }

    /**
     * Multiplies scalar value by factor.
     * @param {number} value - Factor multiplier.
     * @returns {ParticleInput} Reference to this instance.
     */
    multiply(value){
        if(this._isInvalidOperation(value)) return this

        this.inputValue = this.inputValue * value

        return this
    }

    /**
     * Adds scalar value to input value.
     * @param {number} value - Term to add.
     * @returns {ParticleInput} Reference to this instance.
     */
    add(value){
        if(this._isInvalidOperation(value)) return this

        this.inputValue = this.inputValue + value

        return this
    }

    /**
     * Checks if operation is invalid (NaN or sameStartKey).
     * @param {number} value - Operation operand.
     * @returns {boolean} True if operation is invalid.
     */
    _isInvalidOperation(value){
        return isNaN(value) || this.inputValue === sameStartKey
    }

    /**
     * Clones this ParticleInput instance.
     * @returns {ParticleInput} Cloned instance.
     */
    clone(){
        return new ParticleInput(this.inputValue);
    }
}

/**
 * Subclass handling Vector3 particle input values.
 */
export class ParticleVectorInput extends ParticleInput {

    /**
     * Constructs a ParticleVectorInput instance.
     * @param {Vector3} inputValue - Vector3 input value.
     */
    constructor(inputValue){
        super(inputValue)
    }

    /**
     * Retrieves current Vector3 value.
     * @returns {Vector3} Current Vector3 value.
     */
    getValue(){
        return this.inputValue
    }

    /**
     * Multiplies Vector3 value by scalar factor.
     * @param {number} value - Multiplier factor.
     * @returns {ParticleVectorInput} Reference to this instance.
     */
    multiply(value){
        this.inputValue = this.inputValue.multiply(value)
        return this
    }

    /**
     * Adds scalar value to Vector3 value components.
     * @param {number} value - Term to add.
     * @returns {ParticleVectorInput} Reference to this instance.
     */
    add(value){
        this.inputValue = this.inputValue.add(value)
        return this
    }

    /**
     * Clones this ParticleVectorInput instance.
     * @returns {ParticleVectorInput} Cloned instance.
     */
    clone(){
        return new ParticleVectorInput(Vector3.build(this.inputValue));
    }
}


/**
 * Subclass handling dynamic, time-linked scalar particle input values.
 */
export class TimedParticleInput  extends ParticleInput {

    /**
     * Constructs a TimedParticleInput instance.
     * @param {number|string|symbol} inputValue - Initial default input value.
     * @param {string} inputCmd - Command template expression string.
     */
    constructor(inputValue, inputCmd){
        super(inputValue)
        this.inputCmd = inputCmd
        this._valueOperations = []
    }

    /**
     * Evaluates dynamic timed value using active advanced variables.
     * @param {Record<string, TODO type>} [advancedVariables] - Active advanced variables.
     * @returns {number|string|symbol} Calculated timed scalar value.
     */
    getValue(advancedVariables){
        
        if( advancedVariables ){
            return this._computeTimeValue(advancedVariables)
        }

        return this.inputValue
    }

    /**
     * Registers multiplication operation on computed timed value.
     * @param {number} value - Multiplier.
     * @returns {TimedParticleInput} Reference to this instance.
     */
    multiply(value){
        if(this._isInvalidOperation(value)) return this

        this._valueOperations.push({value, operation:(a, b) => a * b})

        return this
    }

    /**
     * Registers addition operation on computed timed value.
     * @param {number} value - Term to add.
     * @returns {TimedParticleInput} Reference to this instance.
     */
    add(value){
        if(this._isInvalidOperation(value)) return this

        this._valueOperations.push({value, operation:(a,b) => a + b})

        return this
    }

    /**
     * Clones this TimedParticleInput instance.
     * @returns {TimedParticleInput} Cloned instance.
     */
    clone(){
        const result = new TimedParticleInput(this.inputValue, this.inputCmd);
        result._valueOperations.push(...this._valueOperations)
        return result;
    }

    /**
     * Evaluates timed value expression for current frame.
     * @param {Record<string, TODO type>} advancedVariables - Active advanced variables map.
     * @returns {number} Evaluated frame result.
     */
    _computeTimeValue(advancedVariables){
        let result = Utils._managePercent(Utils._replaceWithAdvanceVariable(this.inputCmd, advancedVariables));

        if(isNaN(result)) return this.inputValue 

        for(let valueOperation of this._valueOperations){
            result = valueOperation.operation(result, valueOperation.value)
        }

        return result
    }
}

/**
 * Subclass handling dynamic, time-linked Vector3 particle input values.
 */
export class TimedParticleVectorInput  extends TimedParticleInput {

    /**
     * Constructs a TimedParticleVectorInput instance.
     * @param {Vector3} inputValue - Default Vector3 input value.
     * @param {Vector3|string} inputCmd - Vector command expression.
     */
    constructor(inputValue, inputCmd){
        super(inputValue, inputCmd)
    }

    /**
     * Evaluates dynamic timed Vector3 value using active advanced variables.
     * @param {Record<string, TODO type>} [advancedVariables] - Active advanced variables.
     * @returns {Vector3} Calculated Vector3 value.
     */
    getValue(advancedVariables){
        
        if( advancedVariables ){
            return this._computeTimeValue(advancedVariables)
        }

        return this.inputValue
    }

    /**
     * Registers multiplication operation on computed timed Vector3.
     * @param {number|Vector3} value - Multiplier.
     * @returns {TimedParticleVectorInput} Reference to this instance.
     */
    multiply(value){
        if(isNaN(value) && !value instanceof Vector3) return this

        this._valueOperations.push({value, operation:(a, b) => a.multiply(b)})

        return this
    }

    /**
     * Registers addition operation on computed timed Vector3.
     * @param {number|Vector3} value - Term to add.
     * @returns {TimedParticleVectorInput} Reference to this instance.
     */
    add(value){
        if(isNaN(value)  && !value instanceof Vector3) return this

        this._valueOperations.push({value, operation:(a,b) => a.add(b)})

        return this
    }

    /**
     * Clones this TimedParticleVectorInput instance.
     * @returns {TimedParticleVectorInput} Cloned instance.
     */
    clone(){
        const result = new TimedParticleVectorInput(Vector3.build(this.inputValue), this.inputCmd);
        result._valueOperations.push(...this._valueOperations)
        return result;
    }

    /**
     * Evaluates timed Vector3 expression for current frame.
     * @param {Record<string, TODO type>} advancedVariables - Active advanced variables map.
     * @returns {Vector3} Computed Vector3 result.
     */
    _computeTimeValue(advancedVariables){
        let result = Vector3.build(Utils._replaceWithAdvanceVariable(this.inputCmd, advancedVariables))

        if(!result.computeVariable()) return this.inputValue

        for(let valueOperation of this._valueOperations){
            result = valueOperation.operation(result, valueOperation.value)
        }

        return result
    }
}