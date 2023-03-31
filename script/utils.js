export class Vector3 { 

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

}