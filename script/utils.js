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
        } else if (Array.isArray(inValue) && inValue.length > 0 && !isNaN(inValue[0])) {
            const indexToRetrieve =  Math.floor(Math.random() * inValue.length);
            return inValue[indexToRetrieve];
        }

    }

}