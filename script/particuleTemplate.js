import { Particule, SprayingParticule, GravitingParticule } from './particule.js'
import { Utils } from "./utils.js"


export class ParticuleTemplate { 

    constructor(source, sizeStart, sizeEnd, particuleLifetime, particuleTexture, 
        colorStart, colorEnd, alphaStart, alphaEnd, 
        vibrationAmplitudeStart, vibrationAmplitudeEnd, vibrationFrequencyStart, vibrationFrequencyEnd){
        this.source = source                        
        this.sizeStart = sizeStart;                 
        this.sizeEnd = sizeEnd;                     
        this.particuleLifetime = particuleLifetime; 
        this.particuleTexture = particuleTexture;   
        this.colorStart = colorStart;               
        this.colorEnd = colorEnd;                   
        this.alphaStart = alphaStart;               
        this.alphaEnd = alphaEnd;                   
        this.vibrationAmplitudeStart = vibrationAmplitudeStart
        this.vibrationAmplitudeEnd = vibrationAmplitudeEnd
        this.vibrationFrequencyStart = vibrationFrequencyStart
        this.vibrationFrequencyEnd = vibrationFrequencyEnd
    }

    generateParticules(){

        let sourcePosition = Utils.getSourcePosition(Utils.getRandomValueFrom(this.source))

        let sprite = new PIXI.Sprite(this.particuleTexture)
        sprite.x = sourcePosition.x;
        sprite.y = sourcePosition.y;
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
            Utils.getRandomValueFrom(this.alphaEnd),
            Utils.getRandomValueFrom(this.vibrationAmplitudeStart),
            Utils.getRandomValueFrom(this.vibrationAmplitudeEnd),
            Utils.getRandomValueFrom(this.vibrationFrequencyStart),
            Utils.getRandomValueFrom(this.vibrationFrequencyEnd)
        )
    }
}

export class SprayingParticuleTemplate extends ParticuleTemplate{ 

    constructor(source, positionSpawning, velocityStart, velocityEnd, angleStart, angleEnd, 
        sizeStart, sizeEnd, particuleLifetime, particuleTexture, colorStart, colorEnd, alphaStart, alphaEnd, 
        vibrationAmplitudeStart, vibrationAmplitudeEnd, vibrationFrequencyStart, vibrationFrequencyEnd){
        super(source, sizeStart, sizeEnd, particuleLifetime, particuleTexture, colorStart, colorEnd, alphaStart, alphaEnd, vibrationAmplitudeStart, vibrationAmplitudeEnd, vibrationFrequencyStart, vibrationFrequencyEnd)
        this.positionSpawning = positionSpawning;   
        this.velocityStart = velocityStart;         //Array of Number      
        this.velocityEnd = velocityEnd;             //Array of Number
        this.angleStart = angleStart;               //Array of Number      
        this.angleEnd = angleEnd;                   //Array of Number
    }

    generateParticules(){
        let sourcePosition = Utils.getSourcePosition(Utils.getRandomValueFrom(this.source))
        let positionSpawning = Utils.getRandomValueFrom(this.positionSpawning)

        let sprite = new PIXI.Sprite(this.particuleTexture)
        sprite.x = sourcePosition.x + positionSpawning.x;
        sprite.y = sourcePosition.y + positionSpawning.y;
        sprite.anchor.set(0.5);

        let startSize = Utils.getRandomValueFrom(this.sizeStart)
        sprite.width = startSize;
        sprite.height = startSize;

        let colorStart = Utils.getRandomValueFrom(this.colorStart)
        sprite.tint = Color.fromRGB([Math.floor(colorStart.x)/255,Math.floor(colorStart.y)/255, Math.floor(colorStart.z)/255])

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
            Utils.getRandomValueFrom(this.alphaEnd),
            Utils.getRandomValueFrom(this.vibrationAmplitudeStart),
            Utils.getRandomValueFrom(this.vibrationAmplitudeEnd),
            Utils.getRandomValueFrom(this.vibrationFrequencyStart),
            Utils.getRandomValueFrom(this.vibrationFrequencyEnd)
        )
    }
}

export class GravitingParticuleTemplate extends ParticuleTemplate { 

    constructor(source, angleStart, angularVelocityStart, angularVelocityEnd, radiusStart, radiusEnd, 
        sizeStart, sizeEnd, particuleLifetime, particuleTexture, colorStart, colorEnd, alphaStart, alphaEnd,
        vibrationAmplitudeStart, vibrationAmplitudeEnd, vibrationFrequencyStart, vibrationFrequencyEnd){
        super(source, sizeStart, sizeEnd, particuleLifetime, particuleTexture, colorStart, colorEnd, alphaStart, alphaEnd, vibrationAmplitudeStart, vibrationAmplitudeEnd, vibrationFrequencyStart, vibrationFrequencyEnd)
        
        this.angleStart = angleStart;                        //Array of Number
        this.angularVelocityStart = angularVelocityStart;  //Number      
        this.angularVelocityEnd = angularVelocityEnd;      //Number
        this.radiusStart = radiusStart;                     //Number      
        this.radiusEnd = radiusEnd;                         //Number
    }

    generateParticules(){
        let source = Utils.getRandomValueFrom(this.source)
        let sourcePosition = Utils.getSourcePosition(source)

        let angleStart = Utils.getRandomValueFrom(this.angleStart)
        let radiusStart = Utils.getRandomValueFrom(this.radiusStart)
        
        let sprite = new PIXI.Sprite(this.particuleTexture)
        sprite.anchor.set(0.5);
        sprite.x = sourcePosition.x + Math.cos(angleStart * (Math.PI / 180)) * radiusStart;
        sprite.y = sourcePosition.y + Math.sin(angleStart * (Math.PI / 180)) * radiusStart;

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
            Utils.getRandomValueFrom(this.alphaEnd),
            Utils.getRandomValueFrom(this.vibrationAmplitudeStart),
            Utils.getRandomValueFrom(this.vibrationAmplitudeEnd),
            Utils.getRandomValueFrom(this.vibrationFrequencyStart),
            Utils.getRandomValueFrom(this.vibrationFrequencyEnd)
        )
    }
}