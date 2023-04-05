export class Particule { 

    constructor(sprite, particuleLifetime, sizeStart, sizeEnd, colorStart, colorEnd, alphaStart, alphaEnd,
        vibrationAmplitudeStart, vibrationAmplitudeEnd, vibrationFrequencyStart, vibrationFrequencyEnd){
        this.sprite = sprite;                       //PIXI.Sprite
        this.positionVibrationLess = {x : sprite.x, y : sprite.y};  
        this.remainingTime = particuleLifetime;     //Number
        this.particuleLifetime = particuleLifetime; //Number
        this.sizeStart = sizeStart;                 //Number
        this.sizeEnd = sizeEnd;                     //Number
        this.colorStart = colorStart;               //Vector3
        this.colorEnd = colorEnd;                   //Vector3
        this.alphaStart = alphaStart;               //Number
        this.alphaEnd = alphaEnd;                   //Number
        this.vibrationAmplitudeStart = vibrationAmplitudeStart
        this.vibrationAmplitudeEnd = vibrationAmplitudeEnd
        this.vibrationFrequencyStart = vibrationFrequencyStart
        this.vibrationFrequencyEnd = vibrationFrequencyEnd
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

        let vibrationAmplitudeCurrent = this.vibrationAmplitudeEnd ? ((this.vibrationAmplitudeStart - this.vibrationAmplitudeEnd) * lifetimeProportion) + this.vibrationAmplitudeEnd : this.vibrationAmplitudeStart;
        let vibrationFrequencyCurrent = this.vibrationFrequencyEnd ? ((this.vibrationFrequencyStart - this.vibrationFrequencyEnd) * lifetimeProportion) + this.vibrationFrequencyEnd : this.vibrationFrequencyStart;
        if(vibrationAmplitudeCurrent && vibrationFrequencyCurrent){
            let timeFromStart = (this.particuleLifetime - this.remainingTime)
            this.vibrationCurrent = vibrationAmplitudeCurrent * Math.sin(2*Math.PI*(timeFromStart/vibrationFrequencyCurrent))
        }

        this.remainingTime -= dt;
    }
}

export class SprayingParticule  extends Particule { 

    constructor(sprite, particuleLifetime, velocityStart, velocityEnd, angleStart, angleEnd, 
        sizeStart, sizeEnd, colorStart, colorEnd, alphaStart, alphaEnd,
        vibrationAmplitudeStart, vibrationAmplitudeEnd, vibrationFrequencyStart, vibrationFrequencyEnd){
        super(sprite, particuleLifetime, sizeStart, sizeEnd, colorStart, colorEnd, alphaStart, alphaEnd,vibrationAmplitudeStart, vibrationAmplitudeEnd, vibrationFrequencyStart, vibrationFrequencyEnd)

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
}


export class GravitingParticule  extends Particule { 

    constructor(sprite, source, particuleLifetime, angleStart, angularVelocityStart, angularVelocityEnd, radiusStart, radiusEnd, 
        sizeStart, sizeEnd, colorStart, colorEnd, alphaStart, alphaEnd,
        vibrationAmplitudeStart, vibrationAmplitudeEnd, vibrationFrequencyStart, vibrationFrequencyEnd){
        super(sprite, particuleLifetime, sizeStart, sizeEnd, colorStart, colorEnd, alphaStart, alphaEnd, vibrationAmplitudeStart, vibrationAmplitudeEnd, vibrationFrequencyStart, vibrationFrequencyEnd)

        this.source = {x: source.x, y: source.y};
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

        this.positionVibrationLess.x = this.source.x + Math.cos(angleRadiant) * updatedRadius;
        this.positionVibrationLess.y = this.source.y + Math.sin(angleRadiant) * updatedRadius;

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