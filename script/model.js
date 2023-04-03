export class Particule { 

    constructor(sprite, particuleLifetime, velocityStart, velocityEnd, angleStart, angleEnd, sizeStart, sizeEnd, colorStart, colorEnd, alphaStart, alphaEnd){
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
        this.alphaStart = alphaStart;               //Number
        this.alphaEnd = alphaEnd;                   //Number
    }

    manageLifetime(dt){
        let lifetimeProportion = this.remainingTime / this.particuleLifetime

        //Particule move
        const updatedVelocity = this.velocityEnd? ((this.velocityStart - this.velocityEnd) * lifetimeProportion) + this.velocityEnd : this.velocityStart;
        let angleRadiant = this.angleEnd ? (((this.angleStart - this.angleEnd) * lifetimeProportion) + this.angleEnd) : this.angleStart;
        angleRadiant *= (Math.PI / 180);

        this.sprite.x += Math.cos(angleRadiant) * updatedVelocity * dt /1000;
        this.sprite.y += Math.sin(angleRadiant) * updatedVelocity * dt /1000;

        //Particule change size
        const updatedSize = this.sizeEnd ? ((this.sizeStart - this.sizeEnd) * lifetimeProportion) + this.sizeEnd : this.sizeStart;
        this.sprite.width = updatedSize
        this.sprite.height = updatedSize

        //Particule change color
        this.sprite.alpha = this.alphaEnd ? ((this.alphaStart - this.alphaEnd) * lifetimeProportion) + this.alphaEnd : this.alphaStart;

        const actualColorVector = this.colorEnd ? this.colorStart.minus(this.colorEnd).multiply(lifetimeProportion).add(this.colorEnd) : this.colorStart
        this.sprite.tint = Color.fromRGB([Math.floor(actualColorVector.x)/255,Math.floor(actualColorVector.y)/255, Math.floor(actualColorVector.z)/255])
        this.remainingTime -= dt;
    }
}


export class ParticuleTemplate { 

    constructor(positionSpawning, velocityStart, velocityEnd, angleStart, angleEnd, sizeStart, sizeEnd, particuleLifetime, particuleTexture, colorStart, colorEnd, alphaStart, alphaEnd){
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
        this.alphaStart = alphaStart;               //Array of Number
        this.alphaEnd = alphaEnd;                   //Array of Number
    }
}