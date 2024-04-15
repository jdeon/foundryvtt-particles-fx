/**
 * Defines the event name to send all messages to over  `game.socket`.
 *
 * @type {string}
 */
export const s_MODULE_ID = 'particule-fx';


/**
 * Defines the event name to send all messages to over  `game.socket`.
 *
 * @type {string}
 */
export const s_EVENT_NAME = `module.${s_MODULE_ID}`;

export const sameStartKey = 'sameStart'

export class Vector3 { 

    static build(object){
        if(!object){
            return undefined
        }

        let result
        if(Array.isArray(object)){
            result = []
            for(let item of object){
                result.push(Vector3.build(item))
            }
        } else if(!isNaN(object) || typeof object === "string"){
            result = new Vector3 (
                object,
                object,
                object,
            )
        } else {
            result = new Vector3 (
                object.x || 0,
                object.y || 0,
                object.z || 0,
            )
        }

        return result
    }

    constructor(x, y, z){
        this.x = x;
        this.y = y;
        this.z = z;
    }

    add(other){
        if(!isNaN(other)){
            return new Vector3(this.x + other, this.y + other, this.z + other)
        } else if (other instanceof Vector3){
            return new Vector3(this.x + other.x, this.y + other.y, this.z + other.z)
        }
    }

    minus(other){
        if(!isNaN(other)){
            return new Vector3(this.x - other, this.y - other, this.z - other)
        } else if (other instanceof Vector3){
            return new Vector3(this.x - other.x, this.y - other.y, this.z - other.z)
        }
    }

    multiply(other){
        if(!isNaN(other)){
            return new Vector3(this.x * other, this.y * other, this.z * other)
        } else if (other instanceof Vector3){
            return new Vector3(this.x * other.x, this.y * other.y, this.z * other.z)
        }
    }

    divide(other){
        if(!isNaN(other) && other !== 0){
            return new Vector3(this.x / other, this.y / other, this.z / other)
        } else if (other instanceof Vector3){
            let x = other === 0 ? this.x : this.x / other.x
            let y = other === 0 ? this.y : this.y / other.y
            let z = other === 0 ? this.z : this.z / other.z

            return new Vector3(x, y, z)
        }
    }

    rotateZVector(zAngleRadiant){
        return {
            x: this.x * Math.cos(zAngleRadiant) - this.y * Math.sin(zAngleRadiant),
            y: this.x * Math.sin(zAngleRadiant) + this.y * Math.cos(zAngleRadiant)
        }
    }
} 

export class Utils {

    static pixelOfDistanceConvertor(){
        return canvas.scene.grid.size/canvas.scene.grid.distance
    }

    static getRandomValueFrom(inValue, advancedVariable){
        if(!isNaN(inValue)){
            return Number(inValue);
        } else if (typeof inValue === 'string') {
            inValue = Utils._replaceWithAdvanceVariable(inValue, advancedVariable)

            const valueBoundary = inValue.split('_')
            if(valueBoundary.length === 1){
                if(!isNaN(valueBoundary[0])){
                    return Number(valueBoundary[0]);
                } else if(valueBoundary[0].endsWith('%')){
                    return Utils._managePercent(valueBoundary[0])
                } else if (valueBoundary[0] === sameStartKey) {
                    return sameStartKey
                } else {
                //Placeable onject value
                return Utils.getPlaceableObjectById(valueBoundary[0]);
                }
            } else if (valueBoundary.length === 2){
                let minValue = Utils._managePercent(valueBoundary[0])
                let maxValue = Utils._managePercent(valueBoundary[1])

                return minValue + (maxValue - minValue) * Utils.includingRandom() ;
            }
        } else if (inValue instanceof Vector3) {
            let x = Utils.getRandomValueFrom(inValue.x, advancedVariable)
            let y = Utils.getRandomValueFrom(inValue.y, advancedVariable)
            let z = Utils.getRandomValueFrom(inValue.z, advancedVariable)

            return new Vector3(x,y,z);
        
        } else if (Array.isArray(inValue) && inValue.length > 0) {
            const indexToRetrieve =  Math.floor(Math.random() * inValue.length);
            return Utils.getRandomValueFrom(inValue[indexToRetrieve], advancedVariable);
        } else {
            return inValue
        }
    }

    static _replaceWithAdvanceVariable(inValue, advancedVariable){
        if(!advancedVariable){
            return inValue
        }

        const valueAdvancedSplit = inValue.split(/{{|}}/)

        if(valueAdvancedSplit.length === 1){
            return inValue
        }

        let result = ""
        for(let i = 0; i < valueAdvancedSplit.length; i += 2){
            result += valueAdvancedSplit[i]
            const variableKey = valueAdvancedSplit[i+1]

            if(advancedVariable[variableKey]){
                result += advancedVariable[variableKey]
            }
        }

        return result
    }

    static getObjectRandomValueFrom(inValue, advancedVariable){
        if(!inValue) return

        let result = {}
        let inKey = Object.keys(inValue).filter((key) => key !== 'advanced')

        for (const key of inKey) {
            result[key] = Utils.getRandomValueFrom(inValue[key], advancedVariable);
        }

        //Check for same as start key
        for (const key of inKey) {
            if(result[key] === sameStartKey){
                const startSuffixKey = key.substring(0,key.length - 3) + 'Start'
                result[key] = result[startSuffixKey]
            }
        }

        return result
    }


    static includingRandom(){
        if(Math.random() == 0){
            return 1;
        } else {
            return Math.random();
        }
    }

    static mergeInputTemplate(prioritizeInput, defaultInput){
        
        if(!defaultInput){
            return prioritizeInput
        } else if (!prioritizeInput){
            return defaultInput
        }

        let result = {...prioritizeInput}

        let defaultPropertyKey = Object.keys(defaultInput)

        for (const key of defaultPropertyKey) {
            let prioritizeProperty = prioritizeInput[key]

            if(prioritizeProperty === undefined){
                //for end suffix value override by start value before default one
                if (typeof key === 'string' && key.endsWith('End')){
                    //removve end from key and add start
                    let startSuffixKey = key.substring(0,key.length - 3) + 'Start'
                    result[key] = prioritizeInput[startSuffixKey] !== undefined ? sameStartKey : defaultInput[key]
                } else {
                    result[key] = defaultInput[key]
                }
            } else if(Array.isArray(prioritizeProperty) || prioritizeProperty.length > 0){
                if(prioritizeProperty.length > 0){
                    result[key] = prioritizeProperty
                } else {
                    result[key] = defaultInput[key]
                }
            } else if(prioritizeProperty instanceof Object){
                result[key] = Utils.mergeInputTemplate(prioritizeProperty, defaultInput[key])
            } else {
                result[key] = prioritizeProperty
            }

        }

        return result;
    }

    static getSelectedSource(){
        if (canvas.activeLayer.controlled.length === 0){
            ui.notifications.error(game.i18n.localize("PARTICULE-FX.No-Token-selected"));
            return 
          }
          
          return canvas.activeLayer.controlled[0];
    }

    static getTargetId(){
        return game.user.targets.ids.length > 0 ? game.user.targets.ids[0] : undefined
    }

    static getSourcePosition(source){
        if(source === undefined || source === null || source.destroyed || source.x === undefined || source.y === undefined){
            return
        }

        let result = {
            x : source.x,
            y : source.y,
            r : 0
        }

        if(! (source instanceof PIXI.Sprite)){
            //Don t use width and length) for Sprite because of anchor
            result.x += (source.w || source.width || 0) /2
            result.y += (source.h || source.height || 0) /2
        }

        let rotation = source?.document?.rotation
        if(rotation){
            result.r = rotation
        }

        return result
    }

    static getPlaceableObjectById(id){
        if(!id){
            return 
        }

        let result
        for(let layer of canvas.layers){
            if(typeof layer.get === "function"){
                result = layer.get(id)
            }

            if(result){
                break
            }
        }

        return result
    }

    static _managePercent(input){
        if(input === undefined){
            return
        }

        if(! isNaN(input)){
            return Number(input)
        }

        if(typeof input === 'string' && input.endsWith('%')){
            let inputPercent = input.substring(0,input.length - 1)
            if(! isNaN(inputPercent)){
                let inputPixel = Number(inputPercent) * canvas.scene.grid.size / 100
                return inputPixel
            }
        }
    }
}