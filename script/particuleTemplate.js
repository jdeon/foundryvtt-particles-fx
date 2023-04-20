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
        this.sizeStart = Vector3.build(sizeStart);                 
        this.sizeEnd = Vector3.build(sizeEnd);  
        this.particuleRotationStart = particuleRotationStart;                 
        this.particuleRotationEnd = particuleRotationEnd;                     
        this.particuleLifetime = particuleLifetime; 
        this.particuleTexture = particuleTexture;   
        this.colorStart = Vector3.build(colorStart);               
        this.colorEnd = Vector3.build(colorEnd);                   
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

    static getType(){
        return "Spraying"
    }

    static build(input, particuleTexture){
        return new SprayingParticuleTemplate(
            input.source,
            input.target,
            input.positionSpawning, 
            input.particuleVelocityStart, 
            input.particuleVelocityEnd, 
            input.particuleAngleStart, 
            input.particuleAngleEnd, 
            input.particuleSizeStart,
            input.particuleSizeEnd,
            input.particuleRotationStart,
            input.particuleRotationEnd,  
            input.particuleLifetime, 
            particuleTexture, 
            input.particuleColorStart, 
            input.particuleColorEnd,
            input.alphaStart, 
            input.alphaEnd,
            input.vibrationAmplitudeStart, 
            input.vibrationAmplitudeEnd,
            input.vibrationFrequencyStart, 
            input.vibrationFrequencyEnd,
            );
    }

    constructor(source, target, positionSpawning, velocityStart, velocityEnd, angleStart, angleEnd, 
        sizeStart, sizeEnd, particuleRotationStart, particuleRotationEnd, particuleLifetime, particuleTexture, colorStart, colorEnd, alphaStart, alphaEnd, 
        vibrationAmplitudeStart, vibrationAmplitudeEnd, vibrationFrequencyStart, vibrationFrequencyEnd){
        super(source, sizeStart, sizeEnd, particuleRotationStart, particuleRotationEnd, particuleLifetime, particuleTexture, colorStart, colorEnd, alphaStart, alphaEnd, vibrationAmplitudeStart, vibrationAmplitudeEnd, vibrationFrequencyStart, vibrationFrequencyEnd)
        this.target = ParticuleTemplate._translatePlaceableObject(target);   
        this.positionSpawning = Vector3.build(positionSpawning);   
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
                y: oldPositionSpawning.x * Math.sin(targetAngleDirection) + oldPositionSpawning.y * Math.cos(targetAngleDirection)
            }

            //Upgrade particule lifetime if the target is longer than 5 grid
            let targetDistance = Math.sqrt(Math.pow(targetPosition.x - sourcePosition.x,2) + Math.pow(targetPosition.y - sourcePosition.y,2))
            if(targetDistance > 5 * canvas.scene.grid.size){
                particuleProperties.particuleLifetime *= (targetDistance/(5 * canvas.scene.grid.size))
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

        let startSize = particuleProperties.sizeStart
        sprite.width = startSize.x;
        sprite.height = startSize.y;
        sprite.angle = particuleProperties.particuleRotationStart + targetAngleDirection * 180 / Math.PI

        let colorStart = Vector3.build(particuleProperties.colorStart)
        sprite.tint = Color.fromRGB([Math.floor(colorStart.x)/255,Math.floor(colorStart.y)/255, Math.floor(colorStart.z)/255])

        return new SprayingParticule(
            sprite,
            target,
            particuleProperties.particuleLifetime,
            particuleProperties.velocityStart,
            particuleProperties.velocityEnd,
            particuleProperties.angleStart + targetAngleDirection * 180 / Math.PI,
            particuleProperties.angleEnd + targetAngleDirection * 180 / Math.PI,
            startSize,
            particuleProperties.sizeEnd,
            particuleProperties.particuleRotationStart + targetAngleDirection * 180 / Math.PI,
            particuleProperties.particuleRotationEnd + targetAngleDirection * 180 / Math.PI,
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

    static getType(){
        return "Missile"
    }

    constructor(source, target, positionSpawning, velocityStart, velocityEnd, angleStart, angleEnd, 
        sizeStart, sizeEnd, particuleRotationStart, particuleRotationEnd, particuleLifetime, particuleTexture, colorStart, colorEnd, alphaStart, alphaEnd, 
        vibrationAmplitudeStart, vibrationAmplitudeEnd, vibrationFrequencyStart, vibrationFrequencyEnd, subParticuleTemplate){
        super(source, target, positionSpawning, velocityStart, velocityEnd, angleStart, angleEnd, 
            sizeStart, sizeEnd, particuleRotationStart, particuleRotationEnd, particuleLifetime, particuleTexture, colorStart, colorEnd, alphaStart, alphaEnd, 
            vibrationAmplitudeStart, vibrationAmplitudeEnd, vibrationFrequencyStart, vibrationFrequencyEnd)
        
        this.mainParticule = this.generateMainParticules()
        this.initGenerate = false

        this.subParticuleTemplate = subParticuleTemplate

        if(this.subParticuleTemplate){
            this.subParticuleTemplate.source = this.mainParticule.sprite
            this.subParticuleTemplate.target = undefined
        }
    }

    generateMainParticules(){
        const mainParticule = super.generateParticules();

        if(mainParticule.target){
            const sourcePosition = {x:mainParticule.sprite.x, y:mainParticule.sprite.y}
            const targetPosition = Utils.getSourcePosition(mainParticule.target)

            if((sourcePosition.x === targetPosition.x && sourcePosition.y === targetPosition.y)){
                //Target and source is at the same place
                return mainParticule
            }

            //Missile must go to the target
            const targetAngleDirection = Math.atan2(targetPosition.y - sourcePosition.y, targetPosition.x - sourcePosition.x)
            mainParticule.angleStart = targetAngleDirection * 180 / Math.PI
            mainParticule.angleEnd = targetAngleDirection * 180 / Math.PI

            //The missile must stop at the target
            const targetDistance = Math.sqrt(Math.pow(targetPosition.x - sourcePosition.x,2) + Math.pow(targetPosition.y - sourcePosition.y,2))
            const averageVelocity = mainParticule.velocityEnd !== undefined ? (mainParticule.velocityStart + mainParticule.velocityEnd) /2 : mainParticule.velocityStart
            
            if(averageVelocity !== 0){
                const lifetime = 1000 * targetDistance/averageVelocity
                mainParticule.particuleLifetime = lifetime
                mainParticule.remainingTime = lifetime
            }
        }


        return mainParticule;
    }

    generateParticules(){
        if( !this.initGenerate ) {
            //First init the main particules
            this.initGenerate = true
            return this.mainParticule
        }

        if(!this.subParticuleTemplate){
            //No template for sub particules
            return
        }

        if(this.mainParticule === undefined){
            //Stop generating if main particule disapeared
            return
        }

        const sourcePosition = new Vector3(this.mainParticule.sprite.x, this.mainParticule.sprite.y, 0)

        const sourceDirection = this.mainParticule.getDirection()
        const sourceDirectionRadian = sourceDirection * Math.PI / 180

        let generatedParticule

        if(this.subParticuleTemplate instanceof SprayingParticuleTemplate){
            generatedParticule = this.subParticuleTemplate.generateParticules()
       
            //The x axis is the backward direction of the main particule
            const dircetionXFactor = {
                x : - Math.cos(sourceDirectionRadian),
                y : - Math.sin(sourceDirectionRadian)
            }

            const dircetionYFactor = {
                x : - Math.sin(sourceDirectionRadian),
                y : Math.cos(sourceDirectionRadian)
            }

            //We change the spawning replacing the one without direction inside to a new one
            const generatedSprite = generatedParticule.sprite
            const oldPositionSpawning = {x: generatedSprite.x - sourcePosition.x, y: generatedSprite.y - sourcePosition.y}
            generatedSprite.x = sourcePosition.x + dircetionXFactor.x * oldPositionSpawning.x + dircetionYFactor.x * oldPositionSpawning.y;
            generatedSprite.y = sourcePosition.y + dircetionXFactor.y * oldPositionSpawning.x + dircetionYFactor.y * oldPositionSpawning.y;
            generatedParticule.positionVibrationLess = {x : generatedSprite.x, y : generatedSprite.y}; 

            //We change the angle to be the trail of the direction by default
            generatedParticule.angleStart += sourceDirection + 180
            generatedParticule.angleEnd += sourceDirection + 180
        } else if (this.subParticuleTemplate instanceof GravitingParticuleTemplate){
            generatedParticule = this.subParticuleTemplate.generateParticules()
            generatedParticule.angle += sourceDirection + 180
        }

        return generatedParticule
    }
}

export class GravitingParticuleTemplate extends ParticuleTemplate { 

    static getType(){
        return "Graviting"
    }

    static build(input, particuleTexture){
        return new GravitingParticuleTemplate(
            input.source,
            input.particuleAngleStart, 
            input.particuleVelocityStart, 
            input.particuleVelocityEnd, 
            input.particuleRadiusStart, 
            input.particuleRadiusEnd, 
            input.particuleSizeStart,
            input.particuleSizeEnd,
            input.particuleRotationStart,
            input.particuleRotationEnd,   
            input.particuleLifetime, 
            particuleTexture, 
            input.particuleColorStart, 
            input.particuleColorEnd,
            input.alphaStart, 
            input.alphaEnd,
            input.vibrationAmplitudeStart, 
            input.vibrationAmplitudeEnd,
            input.vibrationFrequencyStart, 
            input.vibrationFrequencyEnd,
            input.onlyEmitterFollow
            );
    }

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

        let startSize = Utils.getRandomValueFrom(this.sizeStart)
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
            Utils.getRandomValueFrom(this.sizeEnd),
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