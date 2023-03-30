export class Particule { 

    constructor(sprite, remainingTime){
        this.sprite = sprite;
        this.remainingTime = remainingTime;
    }

}


export class ParticuleTemplate { 

    constructor(positionSpawning, velocityStart, velocityEnd, angleStart, angleEnd, sizeStart, sizeEnd, particuleLifetime, particuleTexture, color){
        this.positionSpawning = positionSpawning;   //Vector 3
        this.velocityStart = velocityStart;         //Number      
        this.velocityEnd = velocityEnd;             //Number
        this.angleStart = angleStart;               //Number      
        this.angleEnd = angleEnd;                   //Number
        this.sizeStart = sizeStart;                 //Number
        this.sizeEnd = sizeEnd;                     //Number
        this.particuleLifetime = particuleLifetime; //Number
        this.particuleTexture = particuleTexture;   //PIXI.Texture
        this.color = color;                         //Color
    }
}