import { Particule, SprayingParticule, GravitingParticule } from './particule.js'
import { Utils, Vector3 } from "./utils.js"
import { generatePrefillTemplateForMeasured } from './prefillMeasuredTemplate.js'


export class ParticuleTemplate { 

    static _translatePlaceableObject(source){
        let result

        if(Array.isArray(source)){
            result = []
            for(item of source){
                result.push(ParticuleTemplate._translatePlaceableObject(item))
            }
        } else if (typeof source === 'string' && isNaN(source) && !source.includes('_')){
            result = Utils.getPlaceableObjectById(source)
        } else {
            result = source
        }

        return result
    }

    constructor(source, sizeStart, sizeEnd, particuleRotationStart, particuleRotationEnd,  
        particuleLifetime, particuleTexture,  colorStart, colorEnd, alphaStart, alphaEnd, 
        vibrationAmplitudeStart, vibrationAmplitudeEnd, vibrationFrequencyStart, vibrationFrequencyEnd){
        this.source = ParticuleTemplate._translatePlaceableObject(source)                        
        this.sizeStart = sizeStart;                 
        this.sizeEnd = sizeEnd;  
        this.particuleRotationStart = particuleRotationStart;                 
        this.particuleRotationEnd = particuleRotationEnd;                     
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

        let startSize = Vector3.build(Utils.getRandomValueFrom(this.sizeStart))
        sprite.width = startSize.x;
        sprite.height = startSize.y;

        let angleStart = Utils.getRandomValueFrom(this.particuleRotationStart)
        sprite.angle = angleStart

        let colorStart = Utils.getRandomValueFrom(this.colorStart)
        sprite.tint = Color.fromRGB([Math.floor(colorStart.x)/255,Math.floor(colorStart.y)/255, Math.floor(colorStart.z)/255])

        return new Particule(
            sprite,
            Utils.getRandomValueFrom(this.particuleLifetime),
            startSize,
            Vector3.build(Utils.getRandomValueFrom(this.sizeEnd)),
            angleStart,
            Utils.getRandomValueFrom(this.particuleRotationEnd),    
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

    constructor(source, target, positionSpawning, velocityStart, velocityEnd, angleStart, angleEnd, 
        sizeStart, sizeEnd, particuleRotationStart, particuleRotationEnd, particuleLifetime, particuleTexture, colorStart, colorEnd, alphaStart, alphaEnd, 
        vibrationAmplitudeStart, vibrationAmplitudeEnd, vibrationFrequencyStart, vibrationFrequencyEnd){
        super(source, sizeStart, sizeEnd, particuleRotationStart, particuleRotationEnd, particuleLifetime, particuleTexture, colorStart, colorEnd, alphaStart, alphaEnd, vibrationAmplitudeStart, vibrationAmplitudeEnd, vibrationFrequencyStart, vibrationFrequencyEnd)
        this.target = ParticuleTemplate._translatePlaceableObject(target);   
        this.positionSpawning = positionSpawning;   
        this.velocityStart = velocityStart;         //Array of Number      
        this.velocityEnd = velocityEnd;             //Array of Number
        this.angleStart = angleStart;               //Array of Number      
        this.angleEnd = angleEnd;                   //Array of Number
    }

    generateParticules(){
        let particuleProperties = Utils.getObjectRandomValueFrom(this)

        let sourcePosition = Utils.getSourcePosition(particuleProperties.source)
        let target = particuleProperties.target
        let targetAngleDirection
        if(target && (sourcePosition.x !== target.x || sourcePosition.y !== target.y)){
            //Target exist and is different than source
            let targetPosition = Utils.getSourcePosition(target)
            targetAngleDirection = Math.atan2(targetPosition.y - sourcePosition.y, targetPosition.x - sourcePosition.x)
            let oldPositionSpawning = {...particuleProperties.positionSpawning}
            particuleProperties.positionSpawning = {
                x: oldPositionSpawning.x * Math.cos(targetAngleDirection) - oldPositionSpawning.y * Math.sin(targetAngleDirection),
                y: - oldPositionSpawning.x * Math.sin(targetAngleDirection) + oldPositionSpawning.y * Math.cos(targetAngleDirection)
            }

            //Upgrade particule lifetime if the target is longer than 500px
            let targetDistance = Math.sqrt(Math.pow(targetPosition.x - sourcePosition.x,2) + Math.pow(targetPosition.y - sourcePosition.y,2))
            if(targetDistance > 500){
                particuleProperties.lifetime *= (targetDistance/500)
            }
        } else if (this.source instanceof MeasuredTemplate){
            sourcePosition={x:this.source.x, y:this.source.y}//Don t use width and length
            let measuredOverride = generatePrefillTemplateForMeasured(this.source.document, particuleProperties.velocityStart, particuleProperties.velocityEnd)
            particuleProperties = {...particuleProperties , ...measuredOverride}
            targetAngleDirection = 0
        } else {
            targetAngleDirection = 0
        }

        let sprite = new PIXI.Sprite(this.particuleTexture)
        sprite.x = sourcePosition.x + particuleProperties.positionSpawning.x;
        sprite.y = sourcePosition.y + particuleProperties.positionSpawning.y;
        sprite.anchor.set(0.5);

        let startSize = Vector3.build(particuleProperties.sizeStart)
        sprite.width = startSize.x;
        sprite.height = startSize.y;
        sprite.angle = particuleProperties.particuleRotationStart

        let colorStart = Vector3.build(particuleProperties.colorStart)
        sprite.tint = Color.fromRGB([Math.floor(colorStart.x)/255,Math.floor(colorStart.y)/255, Math.floor(colorStart.z)/255])

        return new SprayingParticule(
            sprite,
            particuleProperties.particuleLifetime,
            particuleProperties.velocityStart,
            particuleProperties.velocityEnd,
            particuleProperties.angleStart + targetAngleDirection * 180 / Math.PI,
            particuleProperties.angleEnd + targetAngleDirection * 180 / Math.PI,
            startSize,
            Vector3.build(particuleProperties.sizeEnd),
            particuleProperties.particuleRotationStart,
            particuleProperties.particuleRotationEnd,
            colorStart,
            particuleProperties.colorEnd,
            particuleProperties.alphaStart,
            particuleProperties.alphaEnd,
            particuleProperties.vibrationAmplitudeStart,
            particuleProperties.vibrationAmplitudeEnd,
            particuleProperties.vibrationFrequencyStart,
            particuleProperties.vibrationFrequencyEnd
        )
    }
}


export class MissileParticuleTemplate extends SprayingParticuleTemplate { 

    constructor(source, target, positionSpawning, velocityStart, velocityEnd, angleStart, angleEnd, 
        sizeStart, sizeEnd, particuleRotationStart, particuleRotationEnd, particuleLifetime, particuleTexture, colorStart, colorEnd, alphaStart, alphaEnd, 
        vibrationAmplitudeStart, vibrationAmplitudeEnd, vibrationFrequencyStart, vibrationFrequencyEnd,
        subParticuleSizeStart, subParticuleSizeEnd, subParticuleLifetime, subParticuleColorStart, subParticuleColorEnd,
        subParticulePositionSpawning, subParticuleAngleStart, subParticuleAngleEnd, subParticuleVelocityStart, subParticuleVelocityEnd){
        super(source, target, positionSpawning, velocityStart, velocityEnd, angleStart, angleEnd, 
            sizeStart, sizeEnd, particuleRotationStart, particuleRotationEnd, particuleLifetime, particuleTexture, colorStart, colorEnd, alphaStart, alphaEnd, 
            vibrationAmplitudeStart, vibrationAmplitudeEnd, vibrationFrequencyStart, vibrationFrequencyEnd)
        
        this.mainParticule = super.generateParticules()
        this.initGenerate = false

        this.subParticuleTemplate = new SprayingParticuleTemplate(this.mainParticule, undefined, subParticulePositionSpawning, subParticuleVelocityStart, subParticuleVelocityEnd, 
            subParticuleAngleStart, subParticuleAngleEnd, subParticuleSizeStart, subParticuleSizeEnd, 0, 0,
            subParticuleLifetime, particuleTexture, subParticuleColorStart, subParticuleColorEnd, 1, 0, 0, 0, 0, 0)
    }

    generateParticules(){
        if( !this.initGenerate ) {
            this.initGenerate = true
            return this.mainParticule
        }

        let subParticuleProperties = Utils.getObjectRandomValueFrom(this.subParticuleTemplate)

        if(subParticuleProperties.source === undefined){
            return
        }

        let sourcePosition = new Vector3(subParticuleProperties.source.sprite.x, subParticuleProperties.source.sprite.y, 0)

        let sourceDirection = subParticuleProperties.source.getDirection()
        //The x axis is the backward direction of the main particule
        const dircetionXFactor = {
            x : - Math.cos(sourceDirection),
            y : - Math.sin(sourceDirection)
        }

        const dircetionYFactor = {
            x : - Math.sin(sourceDirection),
            y : Math.cos(sourceDirection)
        }

        let sprite = new PIXI.Sprite(this.particuleTexture)
        sprite.x = sourcePosition.x + dircetionXFactor.x * subParticuleProperties.positionSpawning.x + dircetionYFactor.x * subParticuleProperties.positionSpawning.y;
        sprite.y = sourcePosition.y + dircetionXFactor.y * subParticuleProperties.positionSpawning.x + dircetionYFactor.y * subParticuleProperties.positionSpawning.y;
        sprite.anchor.set(0.5);

        let startSize = Vector3.build(subParticuleProperties.sizeStart)
        sprite.width = startSize.x;
        sprite.height = startSize.y;
        sprite.angle = subParticuleProperties.particuleRotationStart

        let colorStart = Vector3.build(subParticuleProperties.colorStart)
        sprite.tint = Color.fromRGB([Math.floor(colorStart.x)/255,Math.floor(colorStart.y)/255, Math.floor(colorStart.z)/255])

        return new SprayingParticule(
            sprite,
            subParticuleProperties.particuleLifetime,
            subParticuleProperties.velocityStart,
            subParticuleProperties.velocityEnd,
            subParticuleProperties.angleStart + sourceDirection + 180,
            subParticuleProperties.angleEnd + sourceDirection + 180,
            startSize,
            Vector3.build(subParticuleProperties.sizeEnd),
            subParticuleProperties.particuleRotationStart,
            subParticuleProperties.particuleRotationEnd,
            colorStart,
            subParticuleProperties.colorEnd,
            subParticuleProperties.alphaStart,
            subParticuleProperties.alphaEnd,
            subParticuleProperties.vibrationAmplitudeStart,
            subParticuleProperties.vibrationAmplitudeEnd,
            subParticuleProperties.vibrationFrequencyStart,
            subParticuleProperties.vibrationFrequencyEnd
        )
    }
}

export class GravitingParticuleTemplate extends ParticuleTemplate { 

    constructor(source, angleStart, angularVelocityStart, angularVelocityEnd, radiusStart, radiusEnd, 
        sizeStart, sizeEnd, particuleRotationStart, particuleRotationEnd, particuleLifetime, particuleTexture, colorStart, colorEnd, alphaStart, alphaEnd,
        vibrationAmplitudeStart, vibrationAmplitudeEnd, vibrationFrequencyStart, vibrationFrequencyEnd, onlyEmitterFollow){
        super(source, sizeStart, sizeEnd, particuleRotationStart, particuleRotationEnd, particuleLifetime, particuleTexture, colorStart, colorEnd, alphaStart, alphaEnd, vibrationAmplitudeStart, vibrationAmplitudeEnd, vibrationFrequencyStart, vibrationFrequencyEnd)
        
        this.angleStart = angleStart;                        //Array of Number
        this.angularVelocityStart = angularVelocityStart;  //Number      
        this.angularVelocityEnd = angularVelocityEnd;      //Number
        this.radiusStart = radiusStart;                     //Number      
        this.radiusEnd = radiusEnd;                         //Number
        this.onlyEmitterFollow = onlyEmitterFollow;         //Boolean
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

        let startSize = Vector3.build(Utils.getRandomValueFrom(this.sizeStart))
        sprite.width = startSize.x;
        sprite.height = startSize.y;

        let rotationStart = Utils.getRandomValueFrom(this.particuleRotationStart)
        sprite.angle = rotationStart

        let colorStart = Utils.getRandomValueFrom(this.colorStart)
        sprite.tint = Color.fromRGB([Math.floor(colorStart.x)/255,Math.floor(colorStart.y)/255, Math.floor(colorStart.z)/255])

        return new GravitingParticule(
            sprite,
            this.onlyEmitterFollow? sourcePosition : source,
            Utils.getRandomValueFrom(this.particuleLifetime),
            angleStart,
            Utils.getRandomValueFrom(this.angularVelocityStart),
            Utils.getRandomValueFrom(this.angularVelocityEnd),
            radiusStart,
            Utils.getRandomValueFrom(this.radiusEnd),
            startSize,
            Vector3.build(Utils.getRandomValueFrom(this.sizeEnd)),
            rotationStart,
            Utils.getRandomValueFrom(this.particuleRotationEnd),  
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