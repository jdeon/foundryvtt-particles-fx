export class Particule { 

    constructor(sprite, particuleLifetime, velocityStart, velocityEnd, angleStart, angleEnd, sizeStart, sizeEnd, colorStart, colorEnd){
        this.sprite = sprite;                       //PIXI.Sprite
        this.remainingTime = particuleLifetime;     //Number
        this.particuleLifetime = particuleLifetime; //Number
        this.velocityStart = velocityStart;         //Number      
        this.velocityEnd = velocityEnd;             //Number
        this.angleStart = angleStart;               //Number      
        this.angleEnd = angleEnd;                   //Number
        this.sizeStart = sizeStart;                 //Number
        this.sizeEnd = sizeEnd;                     //Number
        this.colorStart = colorStart;               //Vector3
        this.colorEnd = colorEnd;                   //Vector3
    }

}


export class ParticuleTemplate { 

    constructor(positionSpawning, velocityStart, velocityEnd, angleStart, angleEnd, sizeStart, sizeEnd, particuleLifetime, particuleTexture, colorStart, colorEnd){
        this.positionSpawning = positionSpawning;   //Vector 3 of Array
        this.velocityStart = velocityStart;         //Array of Number      
        this.velocityEnd = velocityEnd;             //Array of Number
        this.angleStart = angleStart;               //Array of Number      
        this.angleEnd = angleEnd;                   //Array of Number
        this.sizeStart = sizeStart;                 //Array of Number
        this.sizeEnd = sizeEnd;                     //Array of Number
        this.particuleLifetime = particuleLifetime; //Array of Number
        this.particuleTexture = particuleTexture;   //PIXI.Texture
        this.colorStart = colorStart;               //Vector3 with array
        this.colorEnd = colorEnd;                   //Vector3 with array
    }
}