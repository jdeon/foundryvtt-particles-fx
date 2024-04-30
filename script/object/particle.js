import { Utils, Vector3, sameStartKey } from "../utils/utils.js";

export class Particle { 

    static _computeValue(beginValue, endValue, lifetimeProportion){
        if(endValue !== undefined && endValue !== sameStartKey && beginValue !== endValue){
            if(beginValue instanceof Vector3){
                return beginValue.minus(endValue).multiply(lifetimeProportion).add(endValue)
            } else {
                return beginValue - endValue * lifetimeProportion + endValue
            }
        }

        return beginValue
    }

    constructor(advancedVariables, sprite, particleLifetime, sizeStart, sizeEnd, particleRotationStart, particleRotationEnd, colorStart, colorEnd, alphaStart, alphaEnd,
        vibrationAmplitudeStart, vibrationAmplitudeEnd, vibrationFrequencyStart, vibrationFrequencyEnd){
        this.advancedVariables = advancedVariables;
        this.sprite = sprite;                                                               //PIXI.Sprite
        this.positionVibrationLess = {x : sprite.x, y : sprite.y};  
        this.remainingTime = particleLifetime;                                             //Number
        this.particleLifetime = particleLifetime;                                         //Number
        this.sizeStart = sizeStart;                                                         //Vector3
        this.sizeEnd = sizeEnd === sameStartKey ? sizeStart : sizeEnd;                      //Vector3
        this.particleRotationStart = particleRotationStart;                 
        this.particleRotationEnd = particleRotationEnd === sameStartKey ? particleRotationStart : particleRotationEnd;     
        this.colorStart = colorStart;                                                       //Vector3
        this.colorEnd = colorEnd  === sameStartKey ? colorStart : colorEnd;                 //Vector3
        this.alphaStart = alphaStart;                                                       //Number
        this.alphaEnd = alphaEnd  === sameStartKey ? alphaStart : alphaEnd;                 //Number
        this.vibrationAmplitudeStart = vibrationAmplitudeStart
        this.vibrationAmplitudeEnd = vibrationAmplitudeEnd  === sameStartKey ? vibrationAmplitudeStart : vibrationAmplitudeEnd
        this.vibrationFrequencyStart = vibrationFrequencyStart
        this.vibrationFrequencyEnd = vibrationFrequencyEnd  === sameStartKey ? vibrationFrequencyStart : vibrationFrequencyEnd
    }

    manageLifetime(dt){
        let lifetimeProportion = this.getLifetimeProportion()

        //Particle change size
        const updatedSize = Particle._computeValue(this.sizeStart.getValue(), this.sizeEnd?.getValue(), lifetimeProportion)
        this.sprite.width = updatedSize.x
        this.sprite.height = updatedSize.y

        let particleRotation = Particle._computeValue(this.particleRotationStart.getValue(), this.particleRotationEnd?.getValue(), lifetimeProportion);
        this.sprite.angle = particleRotation

        //Particle change color
        this.sprite.alpha = Particle._computeValue(this.alphaStart.getValue(), this.alphaEnd.getValue(), lifetimeProportion);

        const actualColorVector = Particle._computeValue(this.colorStart.getValue(), this.colorEnd.getValue(), lifetimeProportion)
        this.sprite.tint = Color.fromRGB([Math.floor(actualColorVector.x)/255,Math.floor(actualColorVector.y)/255, Math.floor(actualColorVector.z)/255])

        let vibrationAmplitudeCurrent = Particle._computeValue(this.vibrationAmplitudeStart.getValue(), this.vibrationAmplitudeEnd.getValue(), lifetimeProportion);
        let vibrationFrequencyCurrent = Particle._computeValue(this.vibrationFrequencyStart.getValue(), this.vibrationFrequencyEnd.getValue(), lifetimeProportion);
        if(vibrationAmplitudeCurrent && vibrationFrequencyCurrent){
            let timeFromStart = (this.particleLifetime - this.remainingTime)
            this.vibrationCurrent = vibrationAmplitudeCurrent * Math.sin(2*Math.PI*(timeFromStart/vibrationFrequencyCurrent))
        }

        this.remainingTime -= dt;
    }

    getLifetimeProportion(){
        return this.remainingTime / this.particleLifetime
    }
}

export class SprayingParticle  extends Particle { 

    constructor(advancedVariables, sprite, target, particleLifetime, velocityStart, velocityEnd, angleStart, angleEnd, 
        sizeStart, sizeEnd, particleRotationStart, particleRotationEnd, colorStart, colorEnd, alphaStart, alphaEnd,
        vibrationAmplitudeStart, vibrationAmplitudeEnd, vibrationFrequencyStart, vibrationFrequencyEnd){
        super(advancedVariables, sprite, particleLifetime, sizeStart, sizeEnd, particleRotationStart, particleRotationEnd, colorStart, colorEnd, alphaStart, alphaEnd,vibrationAmplitudeStart, vibrationAmplitudeEnd, vibrationFrequencyStart, vibrationFrequencyEnd)

        this.target = target;
        this.velocityStart = velocityStart;                                                 //Number      
        this.velocityEnd = velocityEnd === sameStartKey ? velocityStart : velocityEnd;      //Number
        this.angleStart = angleStart;                                                       //Number      
        this.angleEnd = angleEnd === sameStartKey ? angleStart : angleEnd;                  //Number
    }

    manageLifetime(dt){
        let lifetimeProportion = this.getLifetimeProportion()

        //Particle move
        const updatedVelocity = Particle._computeValue(this.velocityStart.getValue(), this.velocityEnd.getValue(), lifetimeProportion);
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
        return Particle._computeValue(this.angleStart.getValue(), this.angleEnd.getValue(), this.getLifetimeProportion())
    }
}

export class GravitingParticle  extends Particle { 

    constructor(advancedVariables, sprite, source, particleLifetime, angleStart, angularVelocityStart, angularVelocityEnd, radiusStart, radiusEnd, 
        sizeStart, sizeEnd, particleRotationStart, particleRotationEnd, colorStart, colorEnd, alphaStart, alphaEnd,
        vibrationAmplitudeStart, vibrationAmplitudeEnd, vibrationFrequencyStart, vibrationFrequencyEnd){
        super(advancedVariables, sprite, particleLifetime, sizeStart, sizeEnd, particleRotationStart, particleRotationEnd, colorStart, colorEnd, alphaStart, alphaEnd, vibrationAmplitudeStart, vibrationAmplitudeEnd, vibrationFrequencyStart, vibrationFrequencyEnd)

        this.source = source
        this.angle = angleStart.getValue()                                          //Number 
        this.angularVelocityStart = angularVelocityStart;                           //Number      
        this.angularVelocityEnd = angularVelocityEnd === sameStartKey ? angularVelocityStart : angularVelocityEnd;                               //Number
        this.radiusStart = radiusStart;                                             //Number      
        this.radiusEnd = radiusEnd === sameStartKey ? radiusStart : radiusEnd;                                                 //Number
    }

    manageLifetime(dt){
        let lifetimeProportion = this.getLifetimeProportion()

        let source = Utils.getSourcePosition(this.source)

        if(source === undefined){
            //If the source have disapeared, the particles do the same
            this.remainingTime = 0
            return
        }

        //Particle move
        const updatedVelocity = Particle._computeValue(this.angularVelocityStart.getValue(),  this.angularVelocityEnd.getValue(), lifetimeProportion);
        this.angle += updatedVelocity * dt /1000
        let angleRadiant = this.angle * (Math.PI / 180);
        
        const updatedRadius = Particle._computeValue(this.radiusStart.getValue(), this.radiusEnd.getValue(), lifetimeProportion)

        

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