import { Utils } from "./utils.js"

export class Particule { 

    constructor(sprite, particuleLifetime, sizeStart, sizeEnd, colorStart, colorEnd, alphaStart, alphaEnd){
        this.sprite = sprite;                       //PIXI.Sprite
        this.remainingTime = particuleLifetime;     //Number
        this.particuleLifetime = particuleLifetime; //Number
        this.sizeStart = sizeStart;                 //Number
        this.sizeEnd = sizeEnd;                     //Number
        this.colorStart = colorStart;               //Vector3
        this.colorEnd = colorEnd;                   //Vector3
        this.alphaStart = alphaStart;               //Number
        this.alphaEnd = alphaEnd;                   //Number
    }

    manageLifetime(dt){
        let lifetimeProportion = this.remainingTime / this.particuleLifetime

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

export class SprayingParticule  extends Particule { 

    constructor(sprite, particuleLifetime, velocityStart, velocityEnd, angleStart, angleEnd, sizeStart, sizeEnd, colorStart, colorEnd, alphaStart, alphaEnd){
        super(sprite, particuleLifetime, sizeStart, sizeEnd, colorStart, colorEnd, alphaStart, alphaEnd)

        this.velocityStart = velocityStart;         //Number      
        this.velocityEnd = velocityEnd;             //Number
        this.angleStart = angleStart;               //Number      
        this.angleEnd = angleEnd;                   //Number
    }

    manageLifetime(dt){
        let lifetimeProportion = this.remainingTime / this.particuleLifetime

        //Particule move
        const updatedVelocity = this.velocityEnd? ((this.velocityStart - this.velocityEnd) * lifetimeProportion) + this.velocityEnd : this.velocityStart;
        let angleRadiant = this.angleEnd ? (((this.angleStart - this.angleEnd) * lifetimeProportion) + this.angleEnd) : this.angleStart;
        angleRadiant *= (Math.PI / 180);

        this.sprite.x += Math.cos(angleRadiant) * updatedVelocity * dt /1000;
        this.sprite.y += Math.sin(angleRadiant) * updatedVelocity * dt /1000;

        super.manageLifetime(dt)
    }
}


export class GravitingParticule  extends Particule { 

    constructor(sprite, particuleLifetime, angleStart, angularVelocityStart, angularVelocityEnd, radiusStart, radiusEnd, sizeStart, sizeEnd, colorStart, colorEnd, alphaStart, alphaEnd){
        super(sprite, particuleLifetime, sizeStart, sizeEnd, colorStart, colorEnd, alphaStart, alphaEnd)

        this.source = {x: sprite.x, y: sprite.y};
        this.angle = angleStart                             //Number 
        this.angularVelocityStart = angularVelocityStart;  //Number      
        this.angularVelocityEnd = angularVelocityEnd;      //Number
        this.radiusStart = radiusStart;                     //Number      
        this.radiusEnd = radiusEnd;                         //Number
    }

    manageLifetime(dt){
        let lifetimeProportion = this.remainingTime / this.particuleLifetime

        //Particule move
        const updatedVelocity = this.angularVelocityEnd? ((this.angularVelocityStart - this.angularVelocityEnd) * lifetimeProportion) + this.angularVelocityEnd : this.angularVelocityStart;
        this.angle += updatedVelocity * dt /1000
        let angleRadiant = this.angle * (Math.PI / 180);
        
        const updatedRadius = this.radiusEnd ? (((this.radiusStart - this.radiusEnd) * lifetimeProportion) + this.radiusEnd) : this.radiusStart;

        this.sprite.x = Math.cos(angleRadiant) * updatedRadius;
        this.sprite.y = Math.sin(angleRadiant) * updatedRadius;

        super.manageLifetime(dt)
    }
}


export class ParticuleTemplate { 

    constructor(positionSpawning, sizeStart, sizeEnd, particuleLifetime, particuleTexture, colorStart, colorEnd, alphaStart, alphaEnd){
        this.positionSpawning = positionSpawning;   //Vector 3 of Array
        this.sizeStart = sizeStart;                 //Array of Number
        this.sizeEnd = sizeEnd;                     //Array of Number
        this.particuleLifetime = particuleLifetime; //Array of Number
        this.particuleTexture = particuleTexture;   //PIXI.Texture
        this.colorStart = colorStart;               //Vector3 with array
        this.colorEnd = colorEnd;                   //Vector3 with array
        this.alphaStart = alphaStart;               //Array of Number
        this.alphaEnd = alphaEnd;                   //Array of Number
    }

    generateParticules(){
        let sprite = new PIXI.Sprite(this.particuleTexture)
        sprite.x = Utils.getRandomValueFrom(this.positionSpawning.x);
        sprite.y = Utils.getRandomValueFrom(this.positionSpawning.y);
        sprite.anchor.set(0.5);

        let startSize = Utils.getRandomValueFrom(this.sizeStart)
        sprite.width = startSize;
        sprite.height = startSize;

        let colorStart = Utils.getRandomValueFrom(this.colorStart)
        sprite.tint = Color.fromRGB([Math.floor(colorStart.x)/255,Math.floor(colorStart.y)/255, Math.floor(colorStart.z)/255])

        return new Particule(
            sprite,
            Utils.getRandomValueFrom(this.particuleLifetime),
            startSize,
            Utils.getRandomValueFrom(this.sizeEnd),
            colorStart,
            Utils.getRandomValueFrom(this.colorEnd),
            Utils.getRandomValueFrom(this.alphaStart),
            Utils.getRandomValueFrom(this.alphaEnd)
        )
    }
}

export class SprayingParticuleTemplate extends ParticuleTemplate{ 

    constructor(positionSpawning, velocityStart, velocityEnd, angleStart, angleEnd, sizeStart, sizeEnd, particuleLifetime, particuleTexture, colorStart, colorEnd, alphaStart, alphaEnd){
        super(positionSpawning, sizeStart, sizeEnd, particuleLifetime, particuleTexture, colorStart, colorEnd, alphaStart, alphaEnd)
        
        this.velocityStart = velocityStart;         //Array of Number      
        this.velocityEnd = velocityEnd;             //Array of Number
        this.angleStart = angleStart;               //Array of Number      
        this.angleEnd = angleEnd;                   //Array of Number
    }

    generateParticules(){
        let sprite = new PIXI.Sprite(this.particuleTexture)
        sprite.x = Utils.getRandomValueFrom(this.positionSpawning.x);
        sprite.y = Utils.getRandomValueFrom(this.positionSpawning.y);
        sprite.anchor.set(0.5);

        let startSize = Utils.getRandomValueFrom(this.sizeStart)
        sprite.width = startSize;
        sprite.height = startSize;

        let colorStart = Utils.getRandomValueFrom(this.colorStart)
        sprite.tint = Color.fromRGB([Math.floor(colorStart.x)/255,Math.floor(colorStart.y)/255, Math.floor(colorStart.z)/255])

        //constructor(sprite, particuleLifetime, velocityStart, velocityEnd, angleStart, angleEnd, sizeStart, sizeEnd){
        return new SprayingParticule(
            sprite,
            Utils.getRandomValueFrom(this.particuleLifetime),
            Utils.getRandomValueFrom(this.velocityStart),
            Utils.getRandomValueFrom(this.velocityEnd),
            Utils.getRandomValueFrom(this.angleStart),
            Utils.getRandomValueFrom(this.angleEnd),
            startSize,
            Utils.getRandomValueFrom(this.sizeEnd),
            colorStart,
            Utils.getRandomValueFrom(this.colorEnd),
            Utils.getRandomValueFrom(this.alphaStart),
            Utils.getRandomValueFrom(this.alphaEnd)
        )
    }
}

export class GravitingParticuleTemplate extends ParticuleTemplate { 

    constructor(positionSpawning, angleStart, angularVelocityStart, angularVelocityEnd, radiusStart, radiusEnd, sizeStart, sizeEnd, particuleLifetime, particuleTexture, colorStart, colorEnd, alphaStart, alphaEnd){
        super(positionSpawning, sizeStart, sizeEnd, particuleLifetime, particuleTexture, colorStart, colorEnd, alphaStart, alphaEnd)
        
        this.angleStart = angleStart;                        //Array of Number
        this.angularVelocityStart = angularVelocityStart;  //Number      
        this.angularVelocityEnd = angularVelocityEnd;      //Number
        this.radiusStart = radiusStart;                     //Number      
        this.radiusEnd = radiusEnd;                         //Number
    }

    generateParticules(){
        let sprite = new PIXI.Sprite(this.particuleTexture)
        sprite.x = Utils.getRandomValueFrom(this.positionSpawning.x);
        sprite.y = Utils.getRandomValueFrom(this.positionSpawning.y);
        sprite.anchor.set(0.5);

        let startSize = Utils.getRandomValueFrom(this.sizeStart)
        sprite.width = startSize;
        sprite.height = startSize;

        let colorStart = Utils.getRandomValueFrom(this.colorStart)
        sprite.tint = Color.fromRGB([Math.floor(colorStart.x)/255,Math.floor(colorStart.y)/255, Math.floor(colorStart.z)/255])

        return new GravitingParticule(
            sprite,
            Utils.getRandomValueFrom(this.particuleLifetime),
            Utils.getRandomValueFrom(this.angleStart),
            Utils.getRandomValueFrom(this.angularVelocityStart),
            Utils.getRandomValueFrom(this.angularVelocityEnd),
            Utils.getRandomValueFrom(this.radiusStart),
            Utils.getRandomValueFrom(this.radiusEnd),
            startSize,
            Utils.getRandomValueFrom(this.sizeEnd),
            colorStart,
            Utils.getRandomValueFrom(this.colorEnd),
            Utils.getRandomValueFrom(this.alphaStart),
            Utils.getRandomValueFrom(this.alphaEnd)
        )
    }
}