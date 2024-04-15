import { Particle, SprayingParticle, GravitingParticle } from './particle.js'
import { Utils, Vector3 } from "../utils/utils.js"
import { generatePrefillTemplateForMeasured } from '../service/measuredTemplate.service.js'


export class ParticleTemplate { 

    static _translatePlaceableObject(source){
        let result

        if(Array.isArray(source)){
            result = []
            for(item of source){
                result.push(ParticleTemplate._translatePlaceableObject(item))
            }
        } else if (typeof source === 'string' && isNaN(source) && !source.includes('_')){
            result = Utils.getPlaceableObjectById(source)
        } else {
            result = source
        }

        return result
    }

    constructor(source, sizeStart, sizeEnd, particleRotationStart, particleRotationEnd,  
        particleLifetime, particleTexture,  colorStart, colorEnd, alphaStart, alphaEnd, 
        vibrationAmplitudeStart, vibrationAmplitudeEnd, vibrationFrequencyStart, vibrationFrequencyEnd, 
        advanced
        ){
        this.source = ParticleTemplate._translatePlaceableObject(source)                        
        this.sizeStart = Vector3.build(sizeStart);                 
        this.sizeEnd = Vector3.build(sizeEnd);  
        this.particleRotationStart = particleRotationStart;                 
        this.particleRotationEnd = particleRotationEnd;                     
        this.particleLifetime = particleLifetime; 
        this.particleTexture = particleTexture;   
        this.colorStart = Vector3.build(colorStart);               
        this.colorEnd = Vector3.build(colorEnd);                   
        this.alphaStart = alphaStart;               
        this.alphaEnd = alphaEnd;                   
        this.vibrationAmplitudeStart = vibrationAmplitudeStart
        this.vibrationAmplitudeEnd = vibrationAmplitudeEnd
        this.vibrationFrequencyStart = vibrationFrequencyStart
        this.vibrationFrequencyEnd = vibrationFrequencyEnd
        this.advanced = advanced
    }

    generateParticles(){
        let advancedVariable = Utils.getObjectRandomValueFrom(this.advanced?.variables)

        let sourcePosition = Utils.getSourcePosition(Utils.getRandomValueFrom(this.source, advancedVariable))

        let sprite = new PIXI.Sprite(this.particleTexture)
        sprite.x = sourcePosition.x;
        sprite.y = sourcePosition.y;
        sprite.anchor.set(0.5);

        let startSize = Vector3.build(Utils.getRandomValueFrom(this.sizeStart, advancedVariable))
        sprite.width = startSize.x;
        sprite.height = startSize.y;

        let angleStart = Utils.getRandomValueFrom(this.particleRotationStart, advancedVariable)
        sprite.angle = angleStart + sourcePosition.r

        let colorStart = Utils.getRandomValueFrom(this.colorStart, advancedVariable)
        sprite.tint = Color.fromRGB([Math.floor(colorStart.x)/255,Math.floor(colorStart.y)/255, Math.floor(colorStart.z)/255])

        return new Particle(
            sprite,
            Utils.getRandomValueFrom(this.particleLifetime, advancedVariable),
            startSize,
            Vector3.build(Utils.getRandomValueFrom(this.sizeEnd, advancedVariable)),
            angleStart + sourcePosition.r,
            Utils.getRandomValueFrom(this.particleRotationEnd, advancedVariable) + sourcePosition.r,    
            colorStart,
            Utils.getRandomValueFrom(this.colorEnd, advancedVariable),
            Utils.getRandomValueFrom(this.alphaStart, advancedVariable),
            Utils.getRandomValueFrom(this.alphaEnd, advancedVariable),
            Utils.getRandomValueFrom(this.vibrationAmplitudeStart, advancedVariable),
            Utils.getRandomValueFrom(this.vibrationAmplitudeEnd, advancedVariable),
            Utils.getRandomValueFrom(this.vibrationFrequencyStart, advancedVariable),
            Utils.getRandomValueFrom(this.vibrationFrequencyEnd, advancedVariable)
        )
    }
}

export class SprayingParticleTemplate extends ParticleTemplate{ 

    static getType(){
        return "Spraying"
    }

    static build(input, particleTexture){
        return new SprayingParticleTemplate(
            input.source,
            input.target,
            input.positionSpawning, 
            input.particleVelocityStart, 
            input.particleVelocityEnd, 
            input.particleAngleStart, 
            input.particleAngleEnd, 
            input.particleSizeStart,
            input.particleSizeEnd,
            input.particleRotationStart,
            input.particleRotationEnd,  
            input.particleLifetime, 
            particleTexture, 
            input.particleColorStart, 
            input.particleColorEnd,
            input.alphaStart, 
            input.alphaEnd,
            input.vibrationAmplitudeStart, 
            input.vibrationAmplitudeEnd,
            input.vibrationFrequencyStart, 
            input.vibrationFrequencyEnd,
            input.advanced,
            );
    }

    constructor(source, target, positionSpawning, velocityStart, velocityEnd, angleStart, angleEnd, 
        sizeStart, sizeEnd, particleRotationStart, particleRotationEnd, particleLifetime, particleTexture, colorStart, colorEnd, alphaStart, alphaEnd, 
        vibrationAmplitudeStart, vibrationAmplitudeEnd, vibrationFrequencyStart, vibrationFrequencyEnd, advanced){
        super(source, sizeStart, sizeEnd, particleRotationStart, particleRotationEnd, particleLifetime, particleTexture, colorStart, colorEnd, alphaStart, alphaEnd, vibrationAmplitudeStart, vibrationAmplitudeEnd, vibrationFrequencyStart, vibrationFrequencyEnd, advanced)
        this.target = ParticleTemplate._translatePlaceableObject(target);   
        this.positionSpawning = Vector3.build(positionSpawning);   
        this.velocityStart = velocityStart;         //Array of Number      
        this.velocityEnd = velocityEnd;             //Array of Number
        this.angleStart = angleStart;               //Array of Number      
        this.angleEnd = angleEnd;                   //Array of Number
    }

    generateParticles(){
        let advancedVariable = Utils.getObjectRandomValueFrom(this.advanced?.variables)

        let particleProperties = Utils.getObjectRandomValueFrom(this, advancedVariable)

        let sourcePosition = Utils.getSourcePosition(particleProperties.source)
        let target = particleProperties.target
        let targetAngleDirection
        if(target && (sourcePosition.x !== target.x || sourcePosition.y !== target.y)){
            //Target exist and is different than source
            let targetPosition = Utils.getSourcePosition(target)
            targetAngleDirection = Math.atan2(targetPosition.y - sourcePosition.y, targetPosition.x - sourcePosition.x)
            const oldPositionSpawning = new Vector3(particleProperties.positionSpawning.x, particleProperties.positionSpawning.y, 0);
            particleProperties.positionSpawning = oldPositionSpawning.rotateZVector(targetAngleDirection)

            //Upgrade particle lifetime if the target is longer than 5 grid
            let targetDistance = Math.sqrt(Math.pow(targetPosition.x - sourcePosition.x,2) + Math.pow(targetPosition.y - sourcePosition.y,2))
            if(targetDistance > 5 * canvas.scene.grid.size){
                particleProperties.particleLifetime *= (targetDistance/(5 * canvas.scene.grid.size))
            }
        } else if (this.source instanceof MeasuredTemplate){
            sourcePosition={x:this.source.x, y:this.source.y}//Don t use width and length
            let measuredOverride = generatePrefillTemplateForMeasured(this.source.document, particleProperties.velocityStart, particleProperties.velocityEnd)
            particleProperties = {...particleProperties , ...measuredOverride}
            targetAngleDirection = 0
        } else {
            targetAngleDirection = sourcePosition.r  * Math.PI / 180
            const oldPositionSpawning = new Vector3(particleProperties.positionSpawning.x, particleProperties.positionSpawning.y, 0);
            particleProperties.positionSpawning = oldPositionSpawning.rotateZVector(targetAngleDirection)
        }

        let sprite = new PIXI.Sprite(this.particleTexture)
        sprite.x = sourcePosition.x + particleProperties.positionSpawning.x;
        sprite.y = sourcePosition.y + particleProperties.positionSpawning.y;
        sprite.anchor.set(0.5);

        let startSize = particleProperties.sizeStart
        sprite.width = startSize.x;
        sprite.height = startSize.y;
        sprite.angle = particleProperties.particleRotationStart +  targetAngleDirection * 180 / Math.PI

        let colorStart = Vector3.build(particleProperties.colorStart)
        sprite.tint = Color.fromRGB([Math.floor(colorStart.x)/255,Math.floor(colorStart.y)/255, Math.floor(colorStart.z)/255])

        return new SprayingParticle(
            sprite,
            target,
            particleProperties.particleLifetime,
            particleProperties.velocityStart,
            particleProperties.velocityEnd,
            particleProperties.angleStart + targetAngleDirection * 180 / Math.PI,
            particleProperties.angleEnd + targetAngleDirection * 180 / Math.PI,
            startSize,
            particleProperties.sizeEnd,
            particleProperties.particleRotationStart + targetAngleDirection * 180 / Math.PI,
            particleProperties.particleRotationEnd + targetAngleDirection * 180 / Math.PI,
            colorStart,
            particleProperties.colorEnd,
            particleProperties.alphaStart,
            particleProperties.alphaEnd,
            particleProperties.vibrationAmplitudeStart,
            particleProperties.vibrationAmplitudeEnd,
            particleProperties.vibrationFrequencyStart,
            particleProperties.vibrationFrequencyEnd,
        )
    }
}


export class MissileParticleTemplate extends SprayingParticleTemplate { 

    static getType(){
        return "Missile"
    }

    constructor(source, target, positionSpawning, velocityStart, velocityEnd, angleStart, angleEnd, 
        sizeStart, sizeEnd, particleRotationStart, particleRotationEnd, particleLifetime, particleTexture, colorStart, colorEnd, alphaStart, alphaEnd, 
        vibrationAmplitudeStart, vibrationAmplitudeEnd, vibrationFrequencyStart, vibrationFrequencyEnd, advanced, subParticleTemplate){
        super(source, target, positionSpawning, velocityStart, velocityEnd, angleStart, angleEnd, 
            sizeStart, sizeEnd, particleRotationStart, particleRotationEnd, particleLifetime, particleTexture, colorStart, colorEnd, alphaStart, alphaEnd, 
            vibrationAmplitudeStart, vibrationAmplitudeEnd, vibrationFrequencyStart, vibrationFrequencyEnd, advanced)
        
        this.mainParticle = this.generateMainParticles()
        this.initGenerate = false

        this.subParticleTemplate = subParticleTemplate

        if(this.subParticleTemplate){
            this.subParticleTemplate.source = this.mainParticle.sprite
            this.subParticleTemplate.target = undefined
        }
    }

    generateMainParticles(){
        const mainParticle = super.generateParticles();

        if(mainParticle.target){
            const sourcePosition = {x:mainParticle.sprite.x, y:mainParticle.sprite.y}
            const targetPosition = Utils.getSourcePosition(mainParticle.target)

            if((sourcePosition.x === targetPosition.x && sourcePosition.y === targetPosition.y)){
                //Target and source is at the same place
                return mainParticle
            }

            //Missile must go to the target
            const targetAngleDirection = Math.atan2(targetPosition.y - sourcePosition.y, targetPosition.x - sourcePosition.x)
            mainParticle.angleStart = targetAngleDirection * 180 / Math.PI
            mainParticle.angleEnd = targetAngleDirection * 180 / Math.PI

            //The missile must stop at the target
            const targetDistance = Math.sqrt(Math.pow(targetPosition.x - sourcePosition.x,2) + Math.pow(targetPosition.y - sourcePosition.y,2))
            const averageVelocity = mainParticle.velocityEnd !== undefined ? (mainParticle.velocityStart + mainParticle.velocityEnd) /2 : mainParticle.velocityStart
            
            if(averageVelocity !== 0){
                const lifetime = 1000 * targetDistance/averageVelocity
                mainParticle.particleLifetime = lifetime
                mainParticle.remainingTime = lifetime
            }
        }


        return mainParticle;
    }

    generateParticles(){
        if( !this.initGenerate ) {
            //First init the main particles
            this.initGenerate = true
            return this.mainParticle
        }

        if(!this.subParticleTemplate){
            //No template for sub particles
            return
        }

        if(this.mainParticle === undefined){
            //Stop generating if main particle disapeared
            return
        }

        const sourcePosition = new Vector3(this.mainParticle.sprite.x, this.mainParticle.sprite.y, 0)

        const sourceDirection = this.mainParticle.getDirection()
        const sourceDirectionRadian = sourceDirection * Math.PI / 180

        let generatedParticle

        if(this.subParticleTemplate instanceof SprayingParticleTemplate){
            generatedParticle = this.subParticleTemplate.generateParticles()
       
            //The x axis is the backward direction of the main particle
            const dircetionXFactor = {
                x : - Math.cos(sourceDirectionRadian),
                y : - Math.sin(sourceDirectionRadian)
            }

            const dircetionYFactor = {
                x : - Math.sin(sourceDirectionRadian),
                y : Math.cos(sourceDirectionRadian)
            }

            //We change the spawning replacing the one without direction inside to a new one
            const generatedSprite = generatedParticle.sprite
            const oldPositionSpawning = {x: generatedSprite.x - sourcePosition.x, y: generatedSprite.y - sourcePosition.y}
            generatedSprite.x = sourcePosition.x + dircetionXFactor.x * oldPositionSpawning.x + dircetionYFactor.x * oldPositionSpawning.y;
            generatedSprite.y = sourcePosition.y + dircetionXFactor.y * oldPositionSpawning.x + dircetionYFactor.y * oldPositionSpawning.y;
            generatedParticle.positionVibrationLess = {x : generatedSprite.x, y : generatedSprite.y}; 

            //We change the angle to be the trail of the direction by default
            generatedParticle.angleStart += sourceDirection + 180
            generatedParticle.angleEnd += sourceDirection + 180
        } else if (this.subParticleTemplate instanceof GravitingParticleTemplate){
            generatedParticle = this.subParticleTemplate.generateParticles()
            generatedParticle.angle += sourceDirection + 180
        }

        return generatedParticle
    }
}

export class GravitingParticleTemplate extends ParticleTemplate { 

    static getType(){
        return "Graviting"
    }

    static build(input, particleTexture){
        return new GravitingParticleTemplate(
            input.source,
            input.particleAngleStart, 
            input.particleVelocityStart, 
            input.particleVelocityEnd, 
            input.particleRadiusStart, 
            input.particleRadiusEnd, 
            input.particleSizeStart,
            input.particleSizeEnd,
            input.particleRotationStart,
            input.particleRotationEnd,   
            input.particleLifetime, 
            particleTexture, 
            input.particleColorStart, 
            input.particleColorEnd,
            input.alphaStart, 
            input.alphaEnd,
            input.vibrationAmplitudeStart, 
            input.vibrationAmplitudeEnd,
            input.vibrationFrequencyStart, 
            input.vibrationFrequencyEnd,
            input.onlyEmitterFollow,
            input.advanced
            );
    }

    constructor(source, angleStart, angularVelocityStart, angularVelocityEnd, radiusStart, radiusEnd, 
        sizeStart, sizeEnd, particleRotationStart, particleRotationEnd, particleLifetime, particleTexture, colorStart, colorEnd, alphaStart, alphaEnd,
        vibrationAmplitudeStart, vibrationAmplitudeEnd, vibrationFrequencyStart, vibrationFrequencyEnd, onlyEmitterFollow, advanced){
        super(source, sizeStart, sizeEnd, particleRotationStart, particleRotationEnd, particleLifetime, particleTexture, colorStart, colorEnd, alphaStart, alphaEnd, vibrationAmplitudeStart, vibrationAmplitudeEnd, vibrationFrequencyStart, vibrationFrequencyEnd, advanced)
        
        this.angleStart = angleStart;                        //Array of Number
        this.angularVelocityStart = angularVelocityStart;  //Number      
        this.angularVelocityEnd = angularVelocityEnd;      //Number
        this.radiusStart = radiusStart;                     //Number      
        this.radiusEnd = radiusEnd;                         //Number
        this.onlyEmitterFollow = onlyEmitterFollow;         //Boolean
    }

    generateParticles(){
        let advancedVariable = Utils.getObjectRandomValueFrom(this.advanced?.variables)

        let source = Utils.getRandomValueFrom(this.source, advancedVariable)
        let sourcePosition = Utils.getSourcePosition(source, advancedVariable)

        let angleStart = Utils.getRandomValueFrom(this.angleStart, advancedVariable) + sourcePosition.r
        let radiusStart = Utils.getRandomValueFrom(this.radiusStart, advancedVariable)
        
        let sprite = new PIXI.Sprite(this.particleTexture)
        sprite.anchor.set(0.5);
        sprite.x = sourcePosition.x + Math.cos(angleStart * (Math.PI / 180)) * radiusStart;
        sprite.y = sourcePosition.y + Math.sin(angleStart * (Math.PI / 180)) * radiusStart;

        let startSize = Utils.getRandomValueFrom(this.sizeStart, advancedVariable)
        sprite.width = startSize.x;
        sprite.height = startSize.y;

        let rotationStart = Utils.getRandomValueFrom(this.particleRotationStart, advancedVariable)
        sprite.angle = rotationStart + sourcePosition.r

        let colorStart = Utils.getRandomValueFrom(this.colorStart, advancedVariable)
        sprite.tint = Color.fromRGB([Math.floor(colorStart.x)/255,Math.floor(colorStart.y)/255, Math.floor(colorStart.z)/255])

        return new GravitingParticle(
            sprite,
            this.onlyEmitterFollow? sourcePosition : source,
            Utils.getRandomValueFrom(this.particleLifetime, advancedVariable),
            angleStart,
            Utils.getRandomValueFrom(this.angularVelocityStart, advancedVariable),
            Utils.getRandomValueFrom(this.angularVelocityEnd, advancedVariable),
            radiusStart,
            Utils.getRandomValueFrom(this.radiusEnd, advancedVariable),
            startSize,
            Utils.getRandomValueFrom(this.sizeEnd, advancedVariable),
            rotationStart + sourcePosition.r,
            Utils.getRandomValueFrom(this.particleRotationEnd, advancedVariable) + sourcePosition.r,  
            colorStart,
            Utils.getRandomValueFrom(this.colorEnd, advancedVariable),
            Utils.getRandomValueFrom(this.alphaStart, advancedVariable),
            Utils.getRandomValueFrom(this.alphaEnd, advancedVariable),
            Utils.getRandomValueFrom(this.vibrationAmplitudeStart, advancedVariable),
            Utils.getRandomValueFrom(this.vibrationAmplitudeEnd, advancedVariable),
            Utils.getRandomValueFrom(this.vibrationFrequencyStart, advancedVariable),
            Utils.getRandomValueFrom(this.vibrationFrequencyEnd, advancedVariable)
        )
    }
}