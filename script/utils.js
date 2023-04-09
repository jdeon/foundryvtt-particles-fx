export class Vector3 { 

    static build(object){
        if(!object){
            return undefined
        }

        if(!isNaN(object)){
            return new Vector3 (
                object,
                object,
                object,
            )
        }

        return new Vector3 (
            object.x || 0,
            object.y || 0,
            object.z || 0,
        )
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
} 

export class Utils {

    static getRandomValueFrom(inValue){
        if(!isNaN(inValue)){
            return inValue;
        } else if (typeof inValue === 'string') {
            const valueBoundary = inValue.split('_')
            if(valueBoundary.length === 1){
                returnNumber(valueBoundary[0]);
            } else if (valueBoundary.length === 2){
                let minValue = Number(valueBoundary[0])
                let maxValue = Number(valueBoundary[1])

                return minValue + (maxValue - minValue) * Utils.includingRandom() ;
            }

        } else if (inValue instanceof Vector3) {
            let x = Utils.getRandomValueFrom(inValue.x)
            let y = Utils.getRandomValueFrom(inValue.y)
            let z = Utils.getRandomValueFrom(inValue.z)

            return new Vector3(x,y,z);
        
        } else if (Array.isArray(inValue) && inValue.length > 0) {
            const indexToRetrieve =  Math.floor(Math.random() * inValue.length);
            return Utils.getRandomValueFrom(inValue[indexToRetrieve]);
        }

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
                    result[key] = prioritizeInput[startSuffixKey] || defaultInput[key]
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

    static getSourcePosition(){
        if (canvas.tokens.controlled.length === 0){
            return ui.notifications.error("Please select a token first");
          }
          
          const source = canvas.tokens.controlled[0];

          return {x:source.x + source.w /2, y:source.y + source.h /2}
    }

}