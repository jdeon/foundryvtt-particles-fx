import { ParticleInput } from "../object/particleInput.js";

/**
 * Module identifier string.
 * @type {string}
 */
export const s_MODULE_ID = 'particule-fx';


/**
 * Defines the event name to send all messages to over `game.socket`.
 * @type {string}
 */
export const s_EVENT_NAME = `module.${s_MODULE_ID}`;

/**
 * Mapping of particle shape identifiers to PIXI.Texture instances.
 * @type {Record<string, PIXI.Texture>}
 */
export const SPRITE_TEXTURE_MAPPING = {
    CIRCLE: PIXI.Texture.from(`/modules/${s_MODULE_ID}/sprite/circle-sprite-particle.png`),
    TOR: PIXI.Texture.from(`/modules/${s_MODULE_ID}/sprite/tor-sprite-particle.png`),
    STAR: PIXI.Texture.from(`/modules/${s_MODULE_ID}/sprite/star-sprite-particle.png`),
    DIAMOND: PIXI.Texture.from(`/modules/${s_MODULE_ID}/sprite/diamond-sprite-particle.png`)

}

/** Key constant indicating value should be copied from start property. */
export const sameStartKey = 'sameStart'

/**
 * Representation of a 3D vector containing x, y, z coordinates and vector math operations.
 */
export class Vector3 {

    /**
     * Constructs or converts a number, string, array, or object into a Vector3 instance.
     * @param {number|string|Array|{x?: number, y?: number, z?: number}|ParticleInput} object - Source data.
     * @returns {Vector3|Array<Vector3>|undefined} Constructed Vector3 instance or array of instances.
     */
    static build(object) {
        if (!object) {
            return undefined
        }

        let result
        if (Array.isArray(object)) {
            result = []
            for (let item of object) {
                result.push(Vector3.build(item))
            }
        } else if (!isNaN(object) || typeof object === "string") {
            result = new Vector3(
                object,
                object,
                object,
            )
        } else if (object instanceof ParticleInput) {
            result = Vector3.build(object.getValue())
        } else {
            result = new Vector3(
                object.x || 0,
                object.y || 0,
                object.z || 0,
            )
        }

        return result
    }

    /**
     * Replaces sameStartKey sentinel strings in endVector with corresponding values from startVector.
     * @param {Vector3} startVector - Reference start vector.
     * @param {Vector3} endVector - Target end vector.
     * @returns {Vector3} Updated end vector.
     */
    static replaceSameAsStart(startVector, endVector) {
        if (endVector.x === sameStartKey && endVector.y === sameStartKey && endVector.z === sameStartKey) {
            return Vector3.build(startVector);
        }

        for (let coord of ['x', 'y', 'z']) {
            if (endVector[coord] === sameStartKey) {
                endVector[coord] = startVector[coord]
            }
        }

        return endVector
    }

    /**
     * Constructs a Vector3 instance.
     * @param {number|string} x - X coordinate or expression.
     * @param {number|string} y - Y coordinate or expression.
     * @param {number|string} z - Z coordinate or expression.
     */
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    /**
     * Adds scalar or Vector3 term to this vector.
     * @param {number|Vector3} other - Scalar or vector to add.
     * @returns {Vector3} New Vector3 result.
     */
    add(other) {
        if (!isNaN(other)) {
            return new Vector3(this.x + other, this.y + other, this.z + other)
        } else if (other instanceof Vector3) {
            return new Vector3(this.x + other.x, this.y + other.y, this.z + other.z)
        }

        return this
    }

    /**
     * Subtracts scalar or Vector3 term from this vector.
     * @param {number|Vector3} other - Scalar or vector to subtract.
     * @returns {Vector3} New Vector3 result.
     */
    minus(other) {
        if (!isNaN(other)) {
            return new Vector3(this.x - other, this.y - other, this.z - other)
        } else if (other instanceof Vector3) {
            return new Vector3(this.x - other.x, this.y - other.y, this.z - other.z)
        }

        return this
    }

    /**
     * Multiplies vector by scalar or vector component-wise.
     * @param {number|Vector3} other - Scalar or vector factor.
     * @returns {Vector3} New Vector3 result.
     */
    multiply(other) {
        if (!isNaN(other)) {
            return new Vector3(this.x * other, this.y * other, this.z * other)
        } else if (other instanceof Vector3) {
            return new Vector3(this.x * other.x, this.y * other.y, this.z * other.z)
        }

        return this
    }

    /**
     * Divides vector by scalar or vector component-wise.
     * @param {number|Vector3} other - Scalar divisor or vector divisor.
     * @returns {Vector3} New Vector3 result.
     */
    divide(other) {
        if (!isNaN(other) && other !== 0) {
            return new Vector3(this.x / other, this.y / other, this.z / other)
        } else if (other instanceof Vector3) {
            let x = other === 0 ? this.x : this.x / other.x
            let y = other === 0 ? this.y : this.y / other.y
            let z = other === 0 ? this.z : this.z / other.z

            return new Vector3(x, y, z)
        }

        return this
    }

    /**
     * Rotates vector coordinates around Z axis by angle in radians.
     * @param {number} zAngleRadiant - Angle in radians.
     * @returns {{x: number, y: number, z: number}} Rotated coordinates object.
     */
    rotateZVector(zAngleRadiant) {
        return {
            x: this.x * Math.cos(zAngleRadiant) - this.y * Math.sin(zAngleRadiant),
            y: this.x * Math.sin(zAngleRadiant) + this.y * Math.cos(zAngleRadiant),
            z: this.z
        }
    }

    /**
     * Evaluates percent expressions on coordinates.
     * @returns {boolean} True if all coordinates evaluated to valid numbers.
     */
    computeVariable() {
        this.x = Utils._managePercent(this.x)
        this.y = Utils._managePercent(this.y)
        this.z = Utils._managePercent(this.z)

        return !(isNaN(this.x) || isNaN(this.y) || isNaN(this.z))
    }

    /**
     * Computes cross product with another vector.
     * @param {Vector3} other - Other vector.
     * @returns {Vector3} Cross product Vector3.
     */
    cross(other) {
        if (other instanceof Vector3) {
            return new Vector3(
                (this.y * other.z) - (this.z * other.y),
                (this.z * other.x) - (this.x * other.z),
                (this.x * other.y) - (this.y * other.x)
            )
        }

        return this
    }

    /**
     * Computes 3D magnitude (length) of vector.
     * @returns {number} Vector length.
     */
    magnitude() {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2) + Math.pow(this.z, 2));
    }

    /**
     * Returns unit vector in same direction.
     * @returns {Vector3} Normalized Vector3.
     */
    normalized() {
        return this.divide(this.magnitude());
    }
}

/**
 * Utility class providing math, canvas grid conversion, and object resolution helpers.
 */
export class Utils {

    /** Global elevation scaling factor setting value. */
    static doubleSizeElevation;

    /**
     * Calculates pixel-to-grid-distance conversion ratio.
     * @returns {number} Pixels per grid unit.
     */
    static pixelOfDistanceConvertor() {
        return canvas.scene.grid.size / canvas.scene.grid.distance
    }

    /**
     * Measures grid distance between two canvas points or placeable objects.
     * @param {foundry.canvas.placeables.PlaceableObject|Vector3} source - Source point or object.
     * @param {foundry.canvas.placeables.PlaceableObject|Vector3} target - Target point or object.
     * @returns {number} Distance in grid units.
     */
    static getGridDistanceBetweenPoint(source, target) {
        const distance = canvas.grid.measurePath([source, target])?.distance

        if (distance) {
            return distance / canvas.scene.grid.distance
        }

        return 1
    }

    /**
     * Retrieves a random element from an array.
     * @param {Array<T>} array - Array of elements.
     * @returns {T} Selected element or undefined.
     */
    static retrieveRandomElementFromArray(array) {
        if (array === undefined || !Array.isArray(array)) return undefined;

        const indexToRetrieve = Math.floor(Math.random() * array.length);
        return array[indexToRetrieve]
    }

    /**
     * Evaluates random numbers, ranges (e.g. "10_25"), percentages, and advanced variables.
     * @param {number|string|Vector3|Object|Array} inValue - Raw input value or range expression.
     * @param {Record<string, number|string|Vector3|Object|Array|Function>|undefined} [advancedVariables] - Active advanced variables.
     * @returns {number|string|Vector3|Object|Array|foundry.canvas.placeables.PlaceableObject} Resolved random or evaluated value.
     */
    static getRandomValueFrom(inValue, advancedVariables) {
        if (!isNaN(inValue)) {
            return Number(inValue);
        } else if (typeof inValue === 'string') {
            inValue = Utils._replaceWithAdvanceVariable(inValue, advancedVariables)

            const valueBoundary = inValue.split('_')
            if (valueBoundary.length === 1) {
                if (!isNaN(valueBoundary[0])) {
                    return Number(valueBoundary[0]);
                } else if (valueBoundary[0].endsWith('%')) {
                    return Utils._managePercent(valueBoundary[0])
                } else if (valueBoundary[0] === sameStartKey) {
                    return sameStartKey
                } else {
                    //Placeable onject value
                    return Utils.getPlaceableObjectById(valueBoundary[0]);
                }
            } else if (valueBoundary.length === 2) {
                let minValue = Utils._managePercent(valueBoundary[0])
                let maxValue = Utils._managePercent(valueBoundary[1])

                return minValue + (maxValue - minValue) * Utils.includingRandom();
            }
        } else if (inValue instanceof Vector3) {
            let x = Utils.getRandomValueFrom(inValue.x, advancedVariables)
            let y = Utils.getRandomValueFrom(inValue.y, advancedVariables)
            let z = Utils.getRandomValueFrom(inValue.z, advancedVariables)

            return new Vector3(x, y, z);

        } else if (Array.isArray(inValue) && inValue.length > 0) {
            const inElement = Utils.retrieveRandomElementFromArray(inValue);
            return Utils.getRandomValueFrom(inElement, advancedVariables);
        } else {
            return inValue
        }
    }

    /**
     * Evaluates random input and wraps it in a ParticleInput instance.
     * @param {number|string|Object|Array} inValue - Raw input property.
     * @param {Record<string, number|string|Vector3|Object|Array|Function>|undefined>} advancedVariables - Active advanced variables.
     * @returns {ParticleInput} Built ParticleInput instance.
     */
    static getRandomParticuleInputFrom(inValue, advancedVariables) {
        const computeValue = Utils.getRandomValueFrom(inValue, advancedVariables)

        return ParticleInput.build(computeValue, inValue, advancedVariables)
    }

    /**
     * Replaces variable mustache tags `{{varName}}` in strings with calculated values.
     * @param {string|Object} inValue - String or object containing variable tags.
     * @param {Record<string, number|string|Vector3|Object|Array|Function>|undefined>} advancedVariables - Map of evaluated advanced variables.
     * @returns {string|Object} Replaced string or object.
     */
    static _replaceWithAdvanceVariable(inValue, advancedVariables) {
        if (!advancedVariables) {
            return inValue
        }

        if (inValue instanceof Object) {
            const result = {}
            for (let key of Object.keys(inValue)) {
                result[key] = Utils._replaceWithAdvanceVariable(inValue[key], advancedVariables)
            }
            return result
        }

        if (typeof inValue !== "string") return inValue

        let valueAdvancedSplit = inValue.split(/{{|}}/)

        if (valueAdvancedSplit.length === 1) {
            return inValue
        }

        let result = ""
        for (let i = 0; i < valueAdvancedSplit.length + 1; i += 2) {
            result += valueAdvancedSplit[i]
            const variableKey = valueAdvancedSplit[i + 1]

            if (advancedVariables[variableKey]?.value) {
                result += advancedVariables[variableKey].value
            }
        }

        return result
    }

    /**
     * Evaluates random property values for all fields in an object.
     * @param {Object} inValue - Raw configuration object.
     * @param {Record<string, number|string|Vector3|Object|Array|Function>|undefined} advancedVariables - Active advanced variables map.
     * @param {boolean} [inputMode] - If true, wraps values into ParticleInput instances.
     * @returns {Record<string, number|string|Vector3|ParticleInput<number|string|Vector3>} Resolved object.
     */
    static getObjectRandomValueFrom(inValue, advancedVariables, inputMode) {
        if (!inValue) return

        let result = {}
        let inKey = Object.keys(inValue).filter((key) => key !== 'advanced')

        for (const key of inKey) {
            result[key] = Utils.getRandomValueFrom(inValue[key], advancedVariables);
        }

        if (inputMode) {
            for (const key of inKey) {
                result[key] = ParticleInput.build(result[key], inValue[key], advancedVariables);
            }
        }

        return result
    }

    /**
     * Handles nested array selection and resolves random element values.
     * @param {Array<number|string|Vector3|Object|Array>} inArray - Array of values or sub-arrays.
     * @param {Record<string, number|string|Vector3|Object|Array|Function>|undefined} advancedVariables - Advanced variables map.
     * @param {boolean} [inputMode] - If true, wraps values in ParticleInputs.
     * @returns {Array<number|string|Vector3|Object>} Resolved array of values.
     */
    static getArrayRandomValueFrom(inArray, advancedVariables, inputMode) {
        if (!Array.isArray(inArray)) return

        const containSubArray = inArray.filter((item) => Array.isArray(item));
        let arrayToHandle

        if (containSubArray.length) {
            const randomItem = Utils.retrieveRandomElementFromArray(inArray);
            if (Array.isArray(randomItem)) {
                arrayToHandle = randomItem;
            } else {
                arrayToHandle = [randomItem]
            }
        } else {
            arrayToHandle = inArray;
        }

        let result = arrayToHandle.map((item) => Utils.getRandomValueFrom(item, advancedVariables));

        if (inputMode) {
            for (let i = 0; i < result.length; i++) {
                result[i] = ParticleInput.build(result[i], arrayToHandle[i], advancedVariables);
            }
        }

        return result
    }


    /**
     * Generates a random number in range (0, 1] inclusive of 1.
     * @returns {number} Pseudo-random float between 0 (exclusive) and 1 (inclusive).
     */
    static includingRandom() {
        if (Math.random() == 0) {
            return 1;
        } else {
            return Math.random();
        }
    }

    /**
     * Deep-merges input property templates with fallback default templates.
     * @param {Object} prioritizeInput - Primary input object.
     * @param {Object} defaultInput - Fallback default object.
     * @returns {Object} Merged result object.
     */
    static mergeInputTemplate(prioritizeInput, defaultInput) {

        if (!defaultInput) {
            return prioritizeInput
        } else if (!prioritizeInput) {
            return defaultInput
        }

        let result = { ...prioritizeInput }

        let defaultPropertyKey = Object.keys(defaultInput)

        for (const key of defaultPropertyKey) {
            let prioritizeProperty = prioritizeInput[key]

            if (prioritizeProperty === undefined) {
                //for end suffix value override by start value before default one
                if (typeof key === 'string' && key.endsWith('End')) {
                    //removve end from key and add start
                    let startSuffixKey = key.substring(0, key.length - 3) + 'Start'
                    result[key] = prioritizeInput[startSuffixKey] !== undefined ? sameStartKey : defaultInput[key]
                } else {
                    result[key] = defaultInput[key]
                }
            } else if (Array.isArray(prioritizeProperty) || prioritizeProperty.length > 0) {
                if (prioritizeProperty.length > 0) {
                    result[key] = prioritizeProperty
                } else {
                    result[key] = defaultInput[key]
                }
            } else if (prioritizeProperty instanceof Object) {
                result[key] = Utils.mergeInputTemplate(prioritizeProperty, defaultInput[key])
            } else {
                result[key] = prioritizeProperty
            }

        }

        return result;
    }

    /**
     * Returns currently controlled token/placeable object on active canvas layer.
     * @returns {foundry.canvas.placeables.PlaceableObject|undefined} Selected token placeable object.
     */
    static getSelectedSource() {
        if (canvas.activeLayer.controlled.length === 0) {
            ui.notifications.error(game.i18n.localize("PARTICULE-FX.No-Token-selected"));
            return
        }

        return canvas.activeLayer.controlled[0];
    }

    /**
     * Returns target token ID currently targeted by the active user.
     * @returns {string|undefined} First targeted token ID or undefined.
     */
    static getTargetId() {
        return game.user.targets.ids.length > 0 ? game.user.targets.ids[0] : undefined
    }

    /**
     * Calculates 3D center position vector `{x, y, z, r}` for a placeable object or coordinate point.
     * @param {foundry.canvas.placeables.PlaceableObject|Vector3} source - Placeable token/template object or position object.
     * @param {boolean} [isElevationManage=true] - Whether to incorporate elevation into Z coordinate.
     * @returns {{x: number, y: number, z: number, r: number}|undefined} Center position object.
     */
    static getSourcePosition(source, isElevationManage = true) {
        if (source === undefined || source === null || source.destroyed || source.x === undefined || source.y === undefined) {
            return
        }

        let sourceElevation = 0
        if (isElevationManage) {
            if (source.document?.elevation) {
                sourceElevation = source.document.elevation * Utils.pixelOfDistanceConvertor()
            } else if (source.z) {
                sourceElevation = source.z
            }
        }

        let result = {
            x: source.x,
            y: source.y,
            z: sourceElevation,
            r: 0
        }

        if (!(source instanceof PIXI.Sprite || source instanceof foundry.canvas.placeables.MeasuredTemplate)) {
            //Don t use width and length) for Sprite because of anchor
            result.x += (source.w || source.width || 0) / 2
            result.y += (source.h || source.height || 0) / 2
        }

        let rotation = source?.document?.rotation
        if (rotation) {
            result.r = rotation
        }

        return result
    }

    /**
     * Computes sprite size multiplier based on elevation height.
     * @param {number} elevation - Elevation height in pixels.
     * @returns {number} Scale factor for width and height.
     */
    static handleElevationFactorForSize(elevation) {
        if (!elevation || Number.isNaN(elevation)) {
            return 1
        }

        if (!Utils.doubleSizeElevation) {
            return 1
        }

        const factor = elevation / canvas.scene.grid.size / Utils.doubleSizeElevation //Size double every doubleSizeElevation grid space

        return Math.pow(2, factor)
    }

    /**
     * Searches all active canvas layers for a placeable object matching the given ID.
     * @param {string} id - Placeable object ID.
     * @returns {foundry.canvas.placeables.PlaceableObject|undefined} Matching placeable object or undefined.
     */
    static getPlaceableObjectById(id) {
        if (!id) {
            return
        }

        let result
        for (let layer of canvas.layers) {
            if (typeof layer.get === "function") {
                result = layer.get(id)
            }

            if (result) {
                break
            }
        }

        return result
    }

    /**
     * Converts grid percentage string (e.g. "50%") into pixel value, or parses number.
     * @param {number|string} input - Percentage string or number.
     * @returns {number|undefined} Converted value in pixels or undefined.
     */
    static _managePercent(input) {
        if (input === undefined) {
            return
        }

        if (!isNaN(input)) {
            return Number(input)
        }

        if (typeof input === 'string' && input.endsWith('%')) {
            let inputPercent = input.substring(0, input.length - 1)
            if (!isNaN(inputPercent)) {
                let inputPixel = Number(inputPercent) * canvas.scene.grid.size / 100
                return inputPixel
            }
        }
    }

    /**
     * Computes array intersection between two arrays.
     * @param {Array} array1 - First array.
     * @param {Array} array2 - Second array.
     * @returns {Array} Intersection array of elements present in both.
     */
    static intersectionArray(array1, array2) {
        if (Array.isArray(array1) && array1?.length && Array.isArray(array2) && array2?.length) {
            return array1.filter(value => array2.includes(value));
        }

        return []
    }

    /**
     * Clamps a fraction value between -1 and 1.
     * @param {number} input - Value to clamp.
     * @returns {number} Clamped value between -1 and 1.
     */
    static handleFraction(input) {
        if (input > 1) {
            return 1 //Fraction can t be more than 1
        } else if (input < -1) {
            return -1 //Fraction can t be more than -1
        }

        return input
    }

    /**
     * Retrieves PIXI.Texture matching a shape identifier or array of shape identifiers.
     * @param {string|Array<string>} id - Shape key name or array of keys.
     * @returns {PIXI.Texture} Corresponding PIXI.Texture instance.
     */
    static getSpriteTextureFromId(id) {
        let result

        if (id) {
            if (typeof id === "string") {
                result = SPRITE_TEXTURE_MAPPING[id]
            } else if (Array.isArray(id) && id.length > 0) {
                const randomId = Utils.retrieveRandomElementFromArray(id);
                result = SPRITE_TEXTURE_MAPPING[randomId]
            }
        }

        if (result) {
            return result
        }

        return SPRITE_TEXTURE_MAPPING.CIRCLE
    }

    /**
     * Replaces sameStartKey with start input value clone if present.
     * @param {ParticleInput} particleInputStart - Reference start input.
     * @param {ParticleInput} particleInputEnd - End input to check.
     * @returns {ParticleInput} Final ParticleInput instance.
     */
    static computeSameAsStart(particleInputStart, particleInputEnd) {
        return particleInputEnd.getValue() === sameStartKey ? particleInputStart.clone() : particleInputEnd;
    }
}