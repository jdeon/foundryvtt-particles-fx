import { Particule, SprayingParticule, GravitingParticule } from './particule.js'
import { Utils } from "./utils.js"


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
        let source = {
            x : Utils.getRandomValueFrom(this.positionSpawning.x),
            y : Utils.getRandomValueFrom(this.positionSpawning.y)
        }

        let angleStart = Utils.getRandomValueFrom(this.angleStart)
        let radiusStart = Utils.getRandomValueFrom(this.radiusStart)
        
        let sprite = new PIXI.Sprite(this.particuleTexture)
        sprite.anchor.set(0.5);
        sprite.x = source.x + Math.cos(angleStart * (Math.PI / 180)) * radiusStart;
        sprite.y = source.y + Math.sin(angleStart * (Math.PI / 180)) * radiusStart;

        let startSize = Utils.getRandomValueFrom(this.sizeStart)
        sprite.width = startSize;
        sprite.height = startSize;

        let colorStart = Utils.getRandomValueFrom(this.colorStart)
        sprite.tint = Color.fromRGB([Math.floor(colorStart.x)/255,Math.floor(colorStart.y)/255, Math.floor(colorStart.z)/255])

        return new GravitingParticule(
            sprite,
            source,
            Utils.getRandomValueFrom(this.particuleLifetime),
            angleStart,
            Utils.getRandomValueFrom(this.angularVelocityStart),
            Utils.getRandomValueFrom(this.angularVelocityEnd),
            radiusStart,
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