import { Utils, sameStartKey } from "./utils.js";

export class Particule { 

    constructor(sprite, particuleLifetime, sizeStart, sizeEnd, particuleRotationStart, particuleRotationEnd, colorStart, colorEnd, alphaStart, alphaEnd,
        vibrationAmplitudeStart, vibrationAmplitudeEnd, vibrationFrequencyStart, vibrationFrequencyEnd){
        this.sprite = sprite;                                                               //PIXI.Sprite
        this.positionVibrationLess = {x : sprite.x, y : sprite.y};  
        this.remainingTime = particuleLifetime;                                             //Number
        this.particuleLifetime = particuleLifetime;                                         //Number
        this.sizeStart = sizeStart;                                                         //Vector3
        this.sizeEnd = sizeEnd === sameStartKey ? sizeStart : sizeEnd;                      //Vector3
        this.particuleRotationStart = particuleRotationStart;                 
        this.particuleRotationEnd = particuleRotationEnd === sameStartKey ? particuleRotationStart : particuleRotationEnd;     
        this.colorStart = colorStart;                                                       //Vector3
        this.colorEnd = colorEnd  === sameStartKey ? colorStart : colorEnd;                 //Vector3
        this.alphaStart = alphaStart;                                                       //Number
        this.alphaEnd = alphaEnd  === sameStartKey ? alphaStart : alphaEnd;                 //Number
        this.vibrationAmplitudeStart = vibrationAmplitudeStart
        this.vibrationAmplitudeEnd = vibrationAmplitudeEnd  === sameStartKey ? vibrationAmplitudeStart : vibrationAmplitudeEnd
        this.vibrationFrequencyStart = vibrationFrequencyStart
        this.vibrationFrequencyEnd = vibrationFrequencyEnd  === sameStartKey ? vibrationFrequencyStart : sameStartKey
    }

    manageLifetime(dt){
        let lifetimeProportion = this.getLifetimeProportion()

        //Particule change size
        const updatedSize = this.sizeEnd ? this.sizeStart.minus(this.sizeEnd).multiply(lifetimeProportion).add(this.sizeEnd) : this.sizeStart
        this.sprite.width = updatedSize.x
        this.sprite.height = updatedSize.y

        let particuleRotation = this.particuleRotationEnd ? ((this.particuleRotationStart - this.particuleRotationEnd) * lifetimeProportion) + this.particuleRotationEnd : this.particuleRotationStart;
        this.sprite.angle = particuleRotation

        //Particule change color
        this.sprite.alpha = this.alphaEnd ? ((this.alphaStart - this.alphaEnd) * lifetimeProportion) + this.alphaEnd : this.alphaStart;

        const actualColorVector = this.colorEnd ? this.colorStart.minus(this.colorEnd).multiply(lifetimeProportion).add(this.colorEnd) : this.colorStart
        this.sprite.tint = Color.fromRGB([Math.floor(actualColorVector.x)/255,Math.floor(actualColorVector.y)/255, Math.floor(actualColorVector.z)/255])

        let vibrationAmplitudeCurrent = this.vibrationAmplitudeEnd ? ((this.vibrationAmplitudeStart - this.vibrationAmplitudeEnd) * lifetimeProportion) + this.vibrationAmplitudeEnd : this.vibrationAmplitudeStart;
        let vibrationFrequencyCurrent = this.vibrationFrequencyEnd ? ((this.vibrationFrequencyStart - this.vibrationFrequencyEnd) * lifetimeProportion) + this.vibrationFrequencyEnd : this.vibrationFrequencyStart;
        if(vibrationAmplitudeCurrent && vibrationFrequencyCurrent){
            let timeFromStart = (this.particuleLifetime - this.remainingTime)
            this.vibrationCurrent = vibrationAmplitudeCurrent * Math.sin(2*Math.PI*(timeFromStart/vibrationFrequencyCurrent))
        }

        this.remainingTime -= dt;
    }

    getLifetimeProportion(){
        return this.remainingTime / this.particuleLifetime
    }
}

export class SprayingParticule  extends Particule { 

    constructor(sprite, target, particuleLifetime, velocityStart, velocityEnd, angleStart, angleEnd, 
        sizeStart, sizeEnd, particuleRotationStart, particuleRotationEnd, colorStart, colorEnd, alphaStart, alphaEnd,
        vibrationAmplitudeStart, vibrationAmplitudeEnd, vibrationFrequencyStart, vibrationFrequencyEnd){
        super(sprite, particuleLifetime, sizeStart, sizeEnd, particuleRotationStart, particuleRotationEnd, colorStart, colorEnd, alphaStart, alphaEnd,vibrationAmplitudeStart, vibrationAmplitudeEnd, vibrationFrequencyStart, vibrationFrequencyEnd)

        this.target = target;
        this.velocityStart = velocityStart;                                                 //Number      
        this.velocityEnd = velocityEnd === sameStartKey ? velocityStart : velocityEnd;      //Number
        this.angleStart = angleStart;                                                       //Number      
        this.angleEnd = angleEnd === sameStartKey ? angleStart : angleEnd;                  //Number
    }

    manageLifetime(dt){
        let lifetimeProportion = this.getLifetimeProportion()

        //Particule move
        const updatedVelocity = this.velocityEnd? ((this.velocityStart - this.velocityEnd) * lifetimeProportion) + this.velocityEnd : this.velocityStart;
        let angleRadiant = this.getDirection() * (Math.PI / 180)

        this.positionVibrationLess.x += Math.cos(angleRadiant) * updatedVelocity * dt /1000;
        this.positionVibrationLess.y += Math.sin(angleRadiant) * updatedVelocity * dt /1000;

        super.manageLifetime(dt)

        if(this.vibrationCurrent) {
            this.sprite.x = this.positionVibrationLess.x + this.vibrationCurrent * Math.cos(angleRadiant - (Math.PI/2))
            this.sprite.y = this.positionVibrationLess.y + this.vibrationCurrent * Math.sin(angleRadiant - (Math.PI/2))
        } else {
            this.sprite.x = this.positionVibrationLess.x
            this.sprite.y = this.positionVibrationLess.y
        }
    }

    getDirection(){
        return this.angleEnd ? (((this.angleStart - this.angleEnd) * this.getLifetimeProportion()) + this.angleEnd) : this.angleStart;
    }
}

export class GravitingParticule  extends Particule { 

    constructor(sprite, source, particuleLifetime, angleStart, angularVelocityStart, angularVelocityEnd, radiusStart, radiusEnd, 
        sizeStart, sizeEnd, particuleRotationStart, particuleRotationEnd, colorStart, colorEnd, alphaStart, alphaEnd,
        vibrationAmplitudeStart, vibrationAmplitudeEnd, vibrationFrequencyStart, vibrationFrequencyEnd){
        super(sprite, particuleLifetime, sizeStart, sizeEnd, particuleRotationStart, particuleRotationEnd, colorStart, colorEnd, alphaStart, alphaEnd, vibrationAmplitudeStart, vibrationAmplitudeEnd, vibrationFrequencyStart, vibrationFrequencyEnd)

        this.source = source
        this.angle = angleStart                                                     //Number 
        this.angularVelocityStart = angularVelocityStart;                           //Number      
        this.angularVelocityEnd = angularVelocityEnd === sameStartKey ? angularVelocityStart : angularVelocityEnd;                               //Number
        this.radiusStart = radiusStart;                                             //Number      
        this.radiusEnd = radiusEnd === sameStartKey ? radiusStart : radiusEnd;                                                 //Number
    }

    manageLifetime(dt){
        let lifetimeProportion = this.getLifetimeProportion()

        let source = Utils.getSourcePosition(this.source)

        if(source === undefined){
            //If the source have disapeared, the particules do the same
            this.remainingTime = 0
            return
        }

        //Particule move
        const updatedVelocity = this.angularVelocityEnd? ((this.angularVelocityStart - this.angularVelocityEnd) * lifetimeProportion) + this.angularVelocityEnd : this.angularVelocityStart;
        this.angle += updatedVelocity * dt /1000
        let angleRadiant = this.angle * (Math.PI / 180);
        
        const updatedRadius = this.radiusEnd ? (((this.radiusStart - this.radiusEnd) * lifetimeProportion) + this.radiusEnd) : this.radiusStart;

        

        this.positionVibrationLess.x = source.x + Math.cos(angleRadiant) * updatedRadius;
        this.positionVibrationLess.y = source.y + Math.sin(angleRadiant) * updatedRadius;

        super.manageLifetime(dt)

        if(this.vibrationCurrent) {
            this.sprite.x = this.positionVibrationLess.x + this.vibrationCurrent* Math.cos(angleRadiant)
            this.sprite.y = this.positionVibrationLess.y + this.vibrationCurrent* Math.sin(angleRadiant)
        } else {
            this.sprite.x = this.positionVibrationLess.x
            this.sprite.y = this.positionVibrationLess.y
        }
    }
}