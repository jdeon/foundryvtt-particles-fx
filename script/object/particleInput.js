import { Utils, Vector3 } from "../utils/utils.js"

/**
 * ParticleInput class managing keyframe list particle configuration input values and operations.
 */
export class ParticleInput {

    /**
     * Factory method creating appropriate ParticleInput instance based on input command and variables.
     * @param {{list:Array<{time:number,value:number|Vector3|string}>}} inputValues - Keyframe list property object { list: [...] }
     * @param {{list:Array<{time:number,value:Vector3|string}>}} inputQueries - String to extract the value from the input
     * @param {Record<string, number|string|Vector3|Object|Array|Function>} [advancedVariables] - Active advanced variables.
     * @returns {ParticleInput} Instantiated ParticleInput instance.
     */
    static build(inputValues, inputQueries, advancedVariables) {
        if (inputValues instanceof ParticleInput) {
            return inputValues;
        }

        if (!inputValues?.list) {
            return new ParticleInput(inputValues)
        }

        let isTimedLinked = (inputQueries?.list ?? []).some(item => {
            if (typeof item.value === 'string') {
                return ParticleInput._checkIsTimedLinked(item.value, advancedVariables)
            } else if (item.value instanceof Vector3) {
                for (let key of Object.keys(item.value)) {
                    if (ParticleInput._checkIsTimedLinked(item.value[key], advancedVariables)) {
                        return true;
                    }
                }
            }
            return false;
        })


        if (isTimedLinked) {
            //TODO inputValue should have only one item for timed particle input

            const initialValue = inputValues.list[0].value;
            if (initialValue instanceof Vector3) {
                return new TimedParticleVectorInput(initialValue, inputQueries.list[0].value)
            }
            return new TimedParticleInput(initialValue, inputQueries.list[0].value)
        } else {
            return new FrameParticleInput(inputValues.list)
        }
    }

    /**
     * Checks if input command string references any time-dependent advanced variable.
     * @param {string} inputQuery - Command string containing template tags.
     * @param {Record<string, AdvancedVariable>} advancedVariables - Active advanced variables map.
     * @returns {boolean} True if linked to timed variables.
     */
    static _checkIsTimedLinked(inputQuery, advancedVariables) {
        if (typeof inputQuery !== "string") return false;

        let isTimedLinked = false;
        const usedVariables = inputQuery.match(/(?<=\{\{).+?(?=\}\})/g); //Get all value inside {{}}

        if (usedVariables?.length > 0) {
            for (let key of usedVariables) {
                if (advancedVariables[key]?.isTimedLinked) {
                    isTimedLinked = true;
                    break;
                }
            }
        }

        return isTimedLinked;
    }

    /**
     * Constructs a ParticleInput instance managing a keyframe list.
     * @param {number|Vector3|string} value
    */
    constructor(value) {
        this.currentValue = value;
    }

    /**
     * Interpolates time-value keyframes over lifetime proportion.
     * @param {number} [lifetimeProportion=0] - Ratio of elapsed lifetime (0 to 1).
     * @param {Record<string, Object>} [advancedVariables] - Map of active advanced variables.
     * @returns {number|Vector3} Interpolated frame result.
     */
    computeValue(_lifetimeProportion = 0, _advancedVariables) {
        return this.currentValue;
    }

    /**
     * Adds scalar or vector value to all keyframe values in this list.
     * @param {number|Vector3} value - Term to add.
     * @returns {ParticleInput} Reference to this instance.
     */
    add(value) {
        if (this.currentValue && typeof this.currentValue.add === 'function') {
            this.currentValue.add(value);
        } else if (typeof this.currentValue === 'number') {
            this.currentValue += value;
        }

        return this;
    }

    /**
     * Multiplies all keyframe values by factor.
     * @param {number|Vector3} value - Multiplier factor.
     * @returns {ParticleInput} Reference to this instance.
     */
    multiply(value) {

        if (this.currentValue && typeof this.currentValue.multiply === 'function') {
            this.currentValue.multiply(value);
        } else if (typeof this.currentValue === 'number') {
            this.currentValue *= value;
        }

        return this;
    }

    /**
     * Clones this ParticleInput instance.
     * @returns {ParticleInput} Cloned instance.
     */
    clone() {
        return new ParticleInput(this.currentValue);
    }
}


export class FrameParticleInput extends ParticleInput {
    /**
     * Constructs a ParticleInput instance managing a keyframe list.
     * @param {Array<{time:number,value:number|Vector3|string>}} values - Keyframes list array or object.
    */
    constructor(values) {
        const orderedValues = values.sort((a, b) => a.time - b.time);
        super(orderedValues[0].value);
        this.values = orderedValues;
        this.lifetimeProportion = 0;
    }

    /**
     * Interpolates time-value keyframes over lifetime proportion.
     * @param {number} [lifetimeProportion=0] - Ratio of elapsed lifetime (0 to 1).
     * @param {Record<string, Object>} [advancedVariables] - Map of active advanced variables.
     * @returns {number|Vector3} Interpolated frame result.
     */
    computeValue(lifetimeProportion = 0, _advancedVariables) {
        this.lifetimeProportion = lifetimeProportion;

        if (!this.values || this.values.length === 0) return undefined;

        if (this.values.length === 1 || lifetimeProportion <= this.values[0].time) {
            this.currentValue = this.values[0].value;
            return this.currentValue;
        }

        if (lifetimeProportion >= this.values[this.values.length - 1].time) {
            this.currentValue = this.values[this.values.length - 1].value;
            return this.currentValue;
        }

        const nextIndex = this.values.findIndex((item) => item.time > lifetimeProportion); //find the first keyframe time greater than the current lifetime proportion
        const currentIndex = nextIndex - 1

        const timeDiff = this.values[nextIndex].time - this.values[currentIndex].time;
        const segmentProportion = timeDiff > 0 ? (lifetimeProportion - this.values[currentIndex].time) / timeDiff : 0;

        const v0 = this.values[currentIndex].value;
        const v1 = this.values[nextIndex].value;

        if (v0 instanceof Vector3) {
            if (!v1 instanceof Vector3) {
                //TODO throw an error, the list is not composed of Vector3
            }
            this.currentValue = v0.add(v1.minus(v0).multiply(segmentProportion));
        } else if (typeof v0 === 'number' && typeof v1 === 'number') {
            this.currentValue = v0 + (v1 - v0) * segmentProportion;
        } else {
            this.currentValue = v0
        }

        return this.currentValue;
    }

    /**
     * Adds scalar or vector value to all keyframe values in this list.
     * @param {number|Vector3} value - Term to add.
     * @returns {FrameParticleInput} Reference to this instance.
     */
    add(value) {
        if (!this.values) return this;
        for (const item of this.values) {
            if (item.value && typeof item.value.add === 'function') {
                item.value.add(value);
            } else if (typeof item.value === 'number') {
                item.value += value;
            }
        }
        return this;
    }

    /**
     * Multiplies all keyframe values by factor.
     * @param {number|Vector3} value - Multiplier factor.
     * @returns {FrameParticleInput} Reference to this instance.
     */
    multiply(value) {
        if (!this.values) return this;
        for (const item of this.values) {
            if (item.value && typeof item.value.multiply === 'function') {
                item.value.multiply(value);
            } else if (typeof item.value === 'number') {
                item.value *= value;
            }
        }
        return this;
    }

    /**
     * Clones this ParticleInput instance.
     * @returns {FrameParticleInput} Cloned instance.
     */
    clone() {
        const newValues = this.values.map(item => ({
            time: item.time,
            value: item.value && typeof item.value.clone === 'function' ? item.value.clone() : item.value
        }));
        return new FrameParticleInput(newValues);
    }
}


/**
 * Subclass handling dynamic, time-linked scalar particle value inputs.
 */
export class TimedParticleInput extends ParticleInput {

    /**
     * Constructs a TimedParticleValueInput instance.
     * @param {number|string} value - Initial value.
     * @param {string} inputQuery - Input query string.
     */
    constructor(value, inputQuery) {
        super(value);
        this.initialValue = value
        this.inputQuery = inputQuery
        this._valueOperations = []
    }

    /**
     * Evaluates dynamic timed value using active advanced variables.
     * @param {number} _lifetimeProportion - Lifetime proportion, unused.
     * @param {Object} advancedVariables - Active advanced variables.
     * @returns {number|string|symbol} Calculated timed scalar value.
     */
    computeValue(_lifetimeProportion, advancedVariables) {
        if (advancedVariables) {
            this.currentValue = this._computeTimeValue(advancedVariables);
        } else {
            this.currentValue = this.initialValue;
        }
        return this.currentValue;
    }

    /**
     * Registers multiplication operation on computed timed value.
     * @param {number} value - Multiplier.
     * @returns {TimedParticleInput} Reference to this instance.
     */
    multiply(value) {
        if (isNaN(value)) return this;
        this._valueOperations.push({ value, operation: (a, b) => a * b });
        return this;
    }

    /**
     * Registers addition operation on computed timed value.
     * @param {number} value - Term to add.
     * @returns {TimedParticleInput} Reference to this instance.
     */
    add(value) {
        if (isNaN(value)) return this;
        this._valueOperations.push({ value, operation: (a, b) => a + b });
        return this;
    }

    /**
     * Clones this TimedParticleValueInput instance.
     * @returns {TimedParticleInput} Cloned instance.
     */
    clone() {
        const result = new TimedParticleValueInput(this.values);
        result._valueOperations.push(...this._valueOperations);
        return result;
    }

    /**
     * Evaluates timed value expression for current frame.
     * @param {Record<string, Object>} advancedVariables - Active advanced variables map.
     * @returns {number} Evaluated frame result.
     */
    _computeTimeValue(advancedVariables) {
        let result = Utils._managePercent(Utils._replaceWithAdvanceVariable(this.inputQuery, advancedVariables));
        if (isNaN(result)) return this.currentValue;

        for (let valueOperation of this._valueOperations) {
            result = valueOperation.operation(result, valueOperation.value);
        }
        return result;
    }
}

/**
 * Subclass handling dynamic, time-linked Vector3 particle value inputs.
 */
export class TimedParticleVectorInput extends TimedParticleInput {

    /**
     * Constructs a TimedParticleVectorInput instance.     
     * @param {Vector3} value - Initial value.
     * @param {string|Vector3} inputQuery - Input query string.
     */
    constructor(value, inputQuery) {
        super(value, inputQuery);
    }

    /**
     * Registers multiplication operation on computed timed Vector3.
     * @param {number|Vector3} value - Multiplier.
     * @returns {TimedParticleVectorInput} Reference to this instance.
     */
    multiply(value) {
        if (isNaN(value) && !(value instanceof Vector3)) return this;
        this._valueOperations.push({ value, operation: (a, b) => a.multiply(b) });
        return this;
    }

    /**
     * Registers addition operation on computed timed Vector3.
     * @param {number|Vector3} value - Term to add.
     * @returns {TimedParticleVectorInput} Reference to this instance.
     */
    add(value) {
        if (isNaN(value) && !(value instanceof Vector3)) return this;
        this._valueOperations.push({ value, operation: (a, b) => a.add(b) });
        return this;
    }

    /**
     * Clones this TimedParticleVectorInput instance.
     * @returns {TimedParticleVectorInput} Cloned instance.
     */
    clone() {
        const result = new TimedParticleVectorInput(Vector3.build(this.inputValue), this.inputQuery);
        result._valueOperations.push(...this._valueOperations)
        return result;
    }

    /**
     * Evaluates timed Vector3 expression for current frame.
     * @param {Record<string, Object>} advancedVariables - Active advanced variables map.
     * @returns {Vector3} Computed Vector3 result.
     */
    _computeTimeValue(advancedVariables) {
        let result = Vector3.build(Utils._replaceWithAdvanceVariable(this.inputQuery, advancedVariables));
        if (!result.computeVariable()) return this.inputValue;

        for (let valueOperation of this._valueOperations) {
            result = valueOperation.operation(result, valueOperation.value);
        }
        return result;
    }
}