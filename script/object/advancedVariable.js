import { Utils } from "../utils/utils.js"

/**
 * Handles evaluation and dependency sorting of dynamic timed variables in particle configurations.
 */
export class AdvancedVariable { 

    /** List of reserved timed parameter names available to variable functions. */
    static RESERVED_TIMED_PARAM = [
        "dt", //Delta time with last frame
        "lt", //Lifetime (time of existence in millisecond)
        "tp"  //Percentage of living time
    ]
     
    /** Logged error keys to avoid redundant warnings. */
    static LIST_OF_LOGGED_ERROR = []

    /**
     * Parses and resolves dependencies for a set of advanced variable definitions.
     * @param {Record<string, Function|number|string>} advancedVariables - Map of raw variable definitions.
     * @returns {Record<string, AdvancedVariable>|undefined} Resolved map of AdvancedVariable instances.
     */
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

    /**
     * Re-evaluates all advanced variables for a given time tick.
     * @param {Record<string, AdvancedVariable>} advancedVariables - Map of active AdvancedVariable instances.
     * @param {number} deltaTime - Frame delta time in milliseconds.
     * @param {number} lifetime - Current particle lifetime in milliseconds.
     * @param {number} lifetimeProportion - Ratio of elapsed lifetime (0 to 1).
     * @returns {void}
     */
    static generateAll(advancedVariables, deltaTime, lifetime, lifetimeProportion){
        Object.keys(advancedVariables).forEach((key) => advancedVariables[key].generate(advancedVariables, deltaTime, lifetime, lifetimeProportion));
    }

    /**
     * Ensures an error log key is only recorded once.
     * @param {string} key - Error key to check/log.
     * @returns {boolean} True if logged for the first time, false if previously logged.
     */
    static _doLog(key){
        if(! AdvancedVariable.LIST_OF_LOGGED_ERROR.includes(key)){
            AdvancedVariable.LIST_OF_LOGGED_ERROR.push(key)
            return true
        } else {
            return false
        }
    }

    /**
     * Extracts parameter names required by a variable function.
     * @param {string} variableKey - Variable key name.
     * @param {Function} inputFunction - Variable calculation function.
     * @returns {Array<string>} Array of required parameter keys.
     */
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

    /**
     * Comparator for sorting AdvancedVariables by dependency order.
     * @param {AdvancedVariable} a - First instance.
     * @param {AdvancedVariable} b - Second instance.
     * @returns {number} Sorting order (-1, 0, or 1).
     */
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

    /**
     * Constructs an AdvancedVariable instance.
     * @param {string} key - Variable name.
     * @param {Function|number|string} input - Initial constant value or calculation function.
     */
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

    /**
     * Evaluates the variable value for the current tick.
     * @param {Record<string, AdvancedVariable>} advancedVariables - Map of existing AdvancedVariables.
     * @param {number} deltaTime - Frame delta time in ms.
     * @param {number} [lifetime=0] - Elapsed particle lifetime in ms.
     * @param {number} [lifetimeProportion=0] - Proportion of total lifetime (0 to 1).
     * @returns {void}
     */
    generate(advancedVariables, deltaTime, lifetime = 0, lifetimeProportion = 0){
        if(this.isFinish || !this.input instanceof Function) return

        if(!deltaTime){
            deltaTime =  1000/Number(game.settings.get('core',"maxFPS"))
        }

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
            this.value = this.input({...requiredParam, "dt" : deltaTime,  "lt": lifetime, "tp":lifetimeProportion})
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

    /**
     * Validates that the variable function only invokes safe Math methods.
     * @returns {boolean} True if the function is safe to execute.
     */
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