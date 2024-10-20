import { Utils, Vector3, sameStartKey } from "../utils/utils.js";
import { AdvancedVariable } from "./advancedVariable.js";

export class Particle {

    static SORT_LAYER = 950

    static _computeValue(startValue, endValue, lifetimeProportion) {
        if (endValue !== undefined && endValue !== sameStartKey && startValue !== endValue) {
            if (startValue instanceof Vector3) {
                endValue = Vector3.replaceSameAsStart(startValue, endValue)
                if (endValue === startValue) {
                    return startValue
                }
                return startValue.add(endValue.minus(startValue).multiply(lifetimeProportion))

            } else {
                return startValue + (endValue - startValue) * lifetimeProportion
            }
        }

        return startValue
    }

    constructor(advancedVariables, sprite, particleLifetime, elevationStart, riseRateStart, riseRateEnd, sizeStart, sizeEnd, particleRotationStart, particleRotationEnd, colorStart, colorEnd, alphaStart, alphaEnd,
        vibrationAmplitudeStart, vibrationAmplitudeEnd, vibrationFrequencyStart, vibrationFrequencyEnd, isElevationManage) {
        this.advancedVariables = advancedVariables;                                         //Map<key,AdvancedVariable>
        this.sprite = sprite;                                                               //PIXI.Sprite
        this.positionVibrationLess = { x: sprite.x, y: sprite.y, z: isElevationManage ? elevationStart : 0 };
        this.remainingTime = particleLifetime;                                              //Number
        this.particleLifetime = particleLifetime;                                             //Number
        this.riseRateStart = riseRateStart;                                                        //ParticuleInput<Number>
        this.riseRateEnd = riseRateEnd.getValue() === sameStartKey ? riseRateStart : riseRateEnd;   //ParticuleInput<Number>
        this.sizeStart = sizeStart;                                                        //ParticuleInput<Vector3>
        this.sizeEnd = sizeEnd.getValue() === sameStartKey ? sizeStart : sizeEnd;                     //ParticuleInput<Vector3>
        this.particleRotationStart = particleRotationStart;
        this.particleRotationEnd = particleRotationEnd.getValue() === sameStartKey ? particleRotationStart : particleRotationEnd;
        this.colorStart = colorStart;                                                       //ParticuleInput<Vector3>
        this.colorEnd = colorEnd.getValue() === sameStartKey ? colorStart : colorEnd;                 //ParticuleInput<Vector3>
        this.alphaStart = alphaStart;                                                       //ParticuleInput<Number>
        this.alphaEnd = alphaEnd.getValue() === sameStartKey ? alphaStart : alphaEnd;                 //ParticuleInput<Number>
        this.vibrationAmplitudeStart = vibrationAmplitudeStart
        this.vibrationAmplitudeEnd = vibrationAmplitudeEnd.getValue() === sameStartKey ? vibrationAmplitudeStart : vibrationAmplitudeEnd
        this.vibrationFrequencyStart = vibrationFrequencyStart
        this.vibrationFrequencyEnd = vibrationFrequencyEnd.getValue() === sameStartKey ? vibrationFrequencyStart : vibrationFrequencyEnd
        this.timedParticule = this.advancedVariables && !!Object.values(this.advancedVariables).filter((item) => item.isTimedLinked).length
        this.isElevationManage = isElevationManage;

        this.sprite.elevation = isElevationManage ? elevationStart / Utils.pixelOfDistanceConvertor() : undefined
        this.sprite.sortLayer = Particle.SORT_LAYER
    }

    manageLifetime(dt) {
        let lifetimeProportion = this.getLifetimeProportion()

        if (this.timedParticule) {
            const lifetime = this.particleLifetime - this.remainingTime
            AdvancedVariable.generateAll(this.advancedVariables, dt, lifetime, lifetimeProportion);
        }

        this._manageLifetime(dt, lifetimeProportion)
    }

    _manageLifetime(dt, lifetimeProportion) {
        //Particle change size
        const currentSize = Particle._computeValue(this.sizeStart.getValue(this.advancedVariables), this.sizeEnd?.getValue(this.advancedVariables), lifetimeProportion)

        const sizeFactor = Utils.handleElevationFactorForSize(this.isElevationManage ? this.positionVibrationLess.z : undefined)
        this.sprite.width = currentSize.x * sizeFactor
        this.sprite.height = currentSize.y * sizeFactor

        let particleRotation = Particle._computeValue(this.particleRotationStart.getValue(this.advancedVariables), this.particleRotationEnd?.getValue(this.advancedVariables), lifetimeProportion);
        this.sprite.angle = particleRotation

        //Particle change color
        this.sprite.alpha = Particle._computeValue(this.alphaStart.getValue(this.advancedVariables), this.alphaEnd.getValue(this.advancedVariables), lifetimeProportion);

        const actualColorVector = Particle._computeValue(this.colorStart.getValue(this.advancedVariables), this.colorEnd.getValue(this.advancedVariables), lifetimeProportion)
        this.sprite.tint = Color.fromRGB([Math.floor(actualColorVector.x) / 255, Math.floor(actualColorVector.y) / 255, Math.floor(actualColorVector.z) / 255])

        let vibrationAmplitudeCurrent = Particle._computeValue(this.vibrationAmplitudeStart.getValue(this.advancedVariables), this.vibrationAmplitudeEnd.getValue(this.advancedVariables), lifetimeProportion);
        let vibrationFrequencyCurrent = Particle._computeValue(this.vibrationFrequencyStart.getValue(this.advancedVariables), this.vibrationFrequencyEnd.getValue(this.advancedVariables), lifetimeProportion);
        if (vibrationAmplitudeCurrent && vibrationFrequencyCurrent) {
            let timeFromStart = (this.particleLifetime - this.remainingTime)
            this.vibrationCurrent = vibrationAmplitudeCurrent * Math.sin(2 * Math.PI * (timeFromStart / vibrationFrequencyCurrent))
        }

        this.sprite.elevation = this.isElevationManage ? this.positionVibrationLess.z / Utils.pixelOfDistanceConvertor() : 0

        this.remainingTime -= dt;
    }

    _computeRiseRate(lifetimeProportion) {
        if (!this.isElevationManage) {
            return 0
        }

        const currentRiseRate = Particle._computeValue(this.riseRateStart.getValue(this.advancedVariables), this.riseRateEnd.getValue(this.advancedVariables), lifetimeProportion);

        return Utils.handleFraction(currentRiseRate)
    }

    getLifetimeProportion() {
        return 1 - (this.remainingTime / this.particleLifetime)
    }
}

export class SprayingParticle extends Particle {

    constructor(advancedVariables, sprite, target, particleLifetime, elevationStart, riseRateStart, riseRateEnd, velocityStart, velocityEnd, angleStart, angleEnd,
        sizeStart, sizeEnd, particleRotationStart, particleRotationEnd, colorStart, colorEnd, alphaStart, alphaEnd,
        vibrationAmplitudeStart, vibrationAmplitudeEnd, vibrationFrequencyStart, vibrationFrequencyEnd, isElevationManage) {
        super(advancedVariables, sprite, particleLifetime, elevationStart, riseRateStart, riseRateEnd, sizeStart, sizeEnd, particleRotationStart, particleRotationEnd, colorStart, colorEnd, alphaStart, alphaEnd, vibrationAmplitudeStart, vibrationAmplitudeEnd, vibrationFrequencyStart, vibrationFrequencyEnd, isElevationManage)

        this.target = target;
        this.velocityStart = velocityStart;                                                             //ParticleInput<Number>      
        this.velocityEnd = velocityEnd.getValue() === sameStartKey ? velocityStart : velocityEnd;      //ParticleInput<Number>
        this.angleStart = angleStart;                                                                   //ParticleInput<Number>     
        this.angleEnd = angleEnd.getValue() === sameStartKey ? angleStart : angleEnd;                  //ParticleInput<Number>
    }

    manageLifetime(dt) {
        let lifetimeProportion = this.getLifetimeProportion()

        if (this.timedParticule) {
            const lifetime = this.particleLifetime - this.remainingTime
            AdvancedVariable.generateAll(this.advancedVariables, dt, lifetime, lifetimeProportion);
        }

        //Particle move
        const currentVelocity = Particle._computeValue(this.velocityStart.getValue(this.advancedVariables), this.velocityEnd.getValue(this.advancedVariables), lifetimeProportion);
        let angleRadiant = this.getDirection() * (Math.PI / 180)
        if (this.isElevationManage) {
            const currentRiseRate = this._computeRiseRate(lifetimeProportion);
            const horizontalMovement = currentVelocity * Math.pow((1 - Math.pow(currentRiseRate, 2)), 1 / 2) * dt / 1000

            this.positionVibrationLess.x += Math.cos(angleRadiant) * horizontalMovement;
            this.positionVibrationLess.y += Math.sin(angleRadiant) * horizontalMovement;
            this.positionVibrationLess.z += currentVelocity * currentRiseRate * dt / 1000;
        } else {
            this.positionVibrationLess.x += Math.cos(angleRadiant) * currentVelocity;
            this.positionVibrationLess.y += Math.sin(angleRadiant) * currentVelocity;
        }


        super._manageLifetime(dt, lifetimeProportion)

        if (this.vibrationCurrent) {
            this.sprite.x = this.positionVibrationLess.x + this.vibrationCurrent * Math.cos(angleRadiant - (Math.PI / 2))
            this.sprite.y = this.positionVibrationLess.y + this.vibrationCurrent * Math.sin(angleRadiant - (Math.PI / 2))
        } else {
            this.sprite.x = this.positionVibrationLess.x
            this.sprite.y = this.positionVibrationLess.y
        }
    }

    getDirection() {
        return Particle._computeValue(this.angleStart.getValue(this.advancedVariables), this.angleEnd.getValue(this.advancedVariables), this.getLifetimeProportion())
    }
}

export class GravitingParticle extends Particle {

    static computeParticlePosition(source, radius, angleOnTrack, riseRate, trackRotation) {
        const xBeforeRotation = radius * Math.cos(angleOnTrack)
        const yBeforeRotation = radius * Math.sin(angleOnTrack) * Math.sqrt(1 - Math.pow(riseRate, 2))

        if (!trackRotation) {
            return {
                x: source.x + xBeforeRotation,
                y: source.y + yBeforeRotation,
                z: source.z + radius * Math.sin(angleOnTrack) * riseRate
            }
        }

        let radianTrackRotation = trackRotation * (Math.PI / 180)
        return {
            x: source.x + xBeforeRotation * Math.cos(radianTrackRotation) + yBeforeRotation * Math.sin(radianTrackRotation),
            y: source.y - xBeforeRotation * Math.sin(radianTrackRotation) + yBeforeRotation * Math.cos(radianTrackRotation),
            z: source.z + radius * Math.sin(angleOnTrack) * riseRate
        }
    }

    constructor(advancedVariables, sprite, source, particleLifetime, elevationStart, axisElevationAngle, riseRateStart, riseRateEnd, angleStart, angularVelocityStart, angularVelocityEnd, radiusStart, radiusEnd,
        sizeStart, sizeEnd, particleRotationStart, particleRotationEnd, colorStart, colorEnd, alphaStart, alphaEnd,
        vibrationAmplitudeStart, vibrationAmplitudeEnd, vibrationFrequencyStart, vibrationFrequencyEnd, isElevationManage) {
        super(advancedVariables, sprite, particleLifetime, elevationStart, riseRateStart, riseRateEnd, sizeStart, sizeEnd, particleRotationStart, particleRotationEnd, colorStart, colorEnd, alphaStart, alphaEnd, vibrationAmplitudeStart, vibrationAmplitudeEnd, vibrationFrequencyStart, vibrationFrequencyEnd, isElevationManage)

        this.source = source
        this.angle = angleStart                                                     //Number 
        this.axisElevationAngle = axisElevationAngle
        this.angularVelocityStart = angularVelocityStart;                           //ParticleInput<Number>
        this.angularVelocityEnd = angularVelocityEnd.getValue() === sameStartKey ? angularVelocityStart : angularVelocityEnd;                               //ParticleInput<Number>
        this.radiusStart = radiusStart;                                             //ParticleInput<Number>
        this.radiusEnd = radiusEnd.getValue() === sameStartKey ? radiusStart : radiusEnd;      //ParticleInput<Number>
    }

    manageLifetime(dt) {
        let lifetimeProportion = this.getLifetimeProportion()

        if (this.timedParticule) {
            const lifetime = this.particleLifetime - this.remainingTime
            AdvancedVariable.generateAll(this.advancedVariables, dt, lifetime, lifetimeProportion);
        }

        let source = Utils.getSourcePosition(this.source)

        if (source === undefined) {
            //If the source have disapeared, the particles do the same
            this.remainingTime = 0
            return
        }

        //Particle move
        const currentVelocity = Particle._computeValue(this.angularVelocityStart.getValue(this.advancedVariables), this.angularVelocityEnd.getValue(this.advancedVariables), lifetimeProportion);
        this.angle += currentVelocity * dt / 1000
        const angleRadiant = this.angle * (Math.PI / 180);

        const currentRadius = Particle._computeValue(this.radiusStart.getValue(this.advancedVariables), this.radiusEnd.getValue(this.advancedVariables), lifetimeProportion);
        const currentRiseRate = this._computeRiseRate(lifetimeProportion);

        this.positionVibrationLess = GravitingParticle.computeParticlePosition(source, currentRadius, angleRadiant, currentRiseRate, this.isElevationManage ? this.axisElevationAngle : 0)

        super._manageLifetime(dt, lifetimeProportion)

        if (this.vibrationCurrent) {
            this.sprite.x = this.positionVibrationLess.x + this.vibrationCurrent * Math.cos(angleRadiant)
            this.sprite.y = this.positionVibrationLess.y + this.vibrationCurrent * Math.sin(angleRadiant)
        } else {
            this.sprite.x = this.positionVibrationLess.x
            this.sprite.y = this.positionVibrationLess.y
        }
    }
}