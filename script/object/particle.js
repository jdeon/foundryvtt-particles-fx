import { Utils, Vector3, sameStartKey } from "../utils/utils.js";
import { AdvancedVariable } from "./advancedVariable.js";

/**
 * Base particle representation handling position, lifetime, size, color, rotation, and rendering updates.
 */
export class Particle {

    /** Sort layer for PixiJS rendering hierarchy. */
    static SORT_LAYER = 950

    /**
     * Interpolates value between start and end state over lifetime proportion.
     * @param {number|Vector3} startValue - Value at start of lifetime.
     * @param {number|Vector3|symbol} endValue - Value at end of lifetime.
     * @param {number} lifetimeProportion - Ratio of elapsed lifetime (0 to 1).
     * @returns {number|Vector3} Interpolated value.
     */
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

    /**
     * Constructs a base Particle instance.
     * @param {Record<string, AdvancedVariable>} advancedVariables - Map of active advanced variables.
     * @param {PIXI.Sprite} sprite - PIXI.Sprite for particle rendering.
     * @param {number} particleLifetime - Total lifetime in milliseconds.
     * @param {number} elevationStart - Starting elevation in pixels.
     * @param {ParticuleInput<Number>} riseRateStart - Starting rise rate input.
     * @param {ParticuleInput<Number>} riseRateEnd - Ending rise rate input.
     * @param {ParticuleInput<Vector3>} sizeStart - Starting size input.
     * @param {ParticuleInput<Vector3>} sizeEnd - Ending size input.
     * @param {ParticuleInput<Number>} particleRotationStart - Starting rotation input.
     * @param {ParticuleInput<Number>} particleRotationEnd - Ending rotation input.
     * @param {ParticuleInput<Vector3>} colorStart - Starting color input.
     * @param {ParticuleInput<Vector3>} colorEnd - Ending color input.
     * @param {ParticuleInput<Number>} alphaStart - Starting alpha input.
     * @param {ParticuleInput<Number>} alphaEnd - Ending alpha input.
     * @param {ParticuleInput<Number>} vibrationAmplitudeStart - Starting vibration amplitude.
     * @param ParticuleInput<Number>} vibrationAmplitudeEnd - Ending vibration amplitude.
     * @param {ParticuleInput<Number>} vibrationFrequencyStart - Starting vibration frequency.
     * @param {ParticuleInput<Number>} vibrationFrequencyEnd - Ending vibration frequency.
     * @param {boolean} isElevationManage - Whether 3D elevation is managed.
     */
    constructor(advancedVariables, sprite, particleLifetime, elevationStart, riseRateStart, riseRateEnd, sizeStart, sizeEnd, particleRotationStart, particleRotationEnd, colorStart, colorEnd, alphaStart, alphaEnd,
        vibrationAmplitudeStart, vibrationAmplitudeEnd, vibrationFrequencyStart, vibrationFrequencyEnd, isElevationManage) {
        this.advancedVariables = advancedVariables;
        this.sprite = sprite;
        this.positionVibrationLess = { x: sprite.x, y: sprite.y, z: isElevationManage ? elevationStart : 0 };
        this.remainingTime = particleLifetime;
        this.particleLifetime = particleLifetime;
        this.riseRateStart = riseRateStart;
        this.riseRateEnd = Utils.computeSameAsStart(riseRateStart, riseRateEnd);
        this.sizeStart = sizeStart;
        this.sizeEnd = Utils.computeSameAsStart(sizeStart, sizeEnd);
        this.particleRotationStart = particleRotationStart;
        this.particleRotationEnd = Utils.computeSameAsStart(particleRotationStart, particleRotationEnd);
        this.colorStart = colorStart;
        this.colorEnd = Utils.computeSameAsStart(colorStart, colorEnd);
        this.alphaStart = alphaStart;
        this.alphaEnd = Utils.computeSameAsStart(alphaStart, alphaEnd);
        this.vibrationAmplitudeStart = vibrationAmplitudeStart
        this.vibrationAmplitudeEnd = Utils.computeSameAsStart(vibrationAmplitudeStart, vibrationAmplitudeEnd);
        this.vibrationFrequencyStart = vibrationFrequencyStart
        this.vibrationFrequencyEnd = Utils.computeSameAsStart(vibrationFrequencyStart, vibrationFrequencyEnd);
        this.timedParticule = this.advancedVariables && !!Object.values(this.advancedVariables).filter((item) => item.isTimedLinked).length
        this.isElevationManage = isElevationManage;

        this.sprite.elevation = isElevationManage ? elevationStart / Utils.pixelOfDistanceConvertor() : undefined
        this.sprite.sortLayer = Particle.SORT_LAYER
    }

    /**
     * Updates particle lifetime state and triggers frame update computations.
     * @param {number} dt - Delta time elapsed since last frame in milliseconds.
     * @returns {void}
     */
    manageLifetime(dt) {
        let lifetimeProportion = this.getLifetimeProportion()

        if (this.timedParticule) {
            const lifetime = this.particleLifetime - this.remainingTime
            AdvancedVariable.generateAll(this.advancedVariables, dt, lifetime, lifetimeProportion);
        }

        this._manageLifetime(dt, lifetimeProportion)
    }

    /**
     * Internal lifetime manager updating sprite properties (size, rotation, alpha, tint, vibration, elevation).
     * @param {number} dt - Frame delta time.
     * @param {number} lifetimeProportion - Ratio of elapsed lifetime (0 to 1).
     * @returns {void}
     */
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

    /**
     * Computes the current rise rate factor based on elevation management.
     * @param {number} lifetimeProportion - Ratio of elapsed lifetime (0 to 1).
     * @returns {number} Fraction of rise rate.
     */
    _computeRiseRate(lifetimeProportion) {
        if (!this.isElevationManage) {
            return 0
        }

        const currentRiseRate = Particle._computeValue(this.riseRateStart.getValue(this.advancedVariables), this.riseRateEnd.getValue(this.advancedVariables), lifetimeProportion);

        return Utils.handleFraction(currentRiseRate)
    }

    /**
     * Computes the proportion of lifetime elapsed.
     * @returns {number} Ratio between 0 (start) and 1 (end).
     */
    getLifetimeProportion() {
        return 1 - (this.remainingTime / this.particleLifetime)
    }

    /**
     * Returns current particle 3D position vector.
     * @returns {Vector3} Current position vector.
     */
    getPosition() {
        if (this.sprite?.transform?.position) {
            return new Vector3(this.sprite.transform.position.x, this.sprite.transform.position.y, this.positionVibrationLess.z)
        }

        return new Vector3(this.positionVibrationLess.x, this.positionVibrationLess.y, this.positionVibrationLess.z)
    }
}

/**
 * Particle subclass representing linear or directional spray emission.
 */
export class SprayingParticle extends Particle {

    /**
     * Constructs a SprayingParticle instance.
     * @param {Record<string, AdvancedVariable>} advancedVariables - Map of active advanced variables.
     * @param {PIXI.Sprite} sprite - PIXI.Sprite instance.
     * @param {ParticleInput<Vector3|foundry.canvas.placeables.PlaceableObject>} target - Target object or position.
     * @param {number} particleLifetime - Total lifetime in ms.
     * @param {number} elevationStart - Starting elevation.
     * @param {ParticleInput<Number>} riseRateStart - Starting rise rate input.
     * @param {ParticleInput<Number>} riseRateEnd - Ending rise rate input.
     * @param {ParticleInput<Number>} velocityStart - Starting velocity input.
     * @param {ParticleInput<Number>} velocityEnd - Ending velocity input.
     * @param {ParticleInput<Number>} angleStart - Starting angle input.
     * @param {ParticleInput<Number>} angleEnd - Ending angle input.
     * @param {ParticleInput<Vector3>} sizeStart - Starting size input.
     * @param {ParticleInput<Vector3>} sizeEnd - Ending size input.
     * @param {ParticleInput<Number>} particleRotationStart - Starting rotation input.
     * @param {ParticleInput<Number>} particleRotationEnd - Ending rotation input.
     * @param {ParticleInput<Vector3>} colorStart - Starting color input.
     * @param {ParticleInput<Vector3>} colorEnd - Ending color input.
     * @param {ParticleInput<Number>} alphaStart - Starting alpha input.
     * @param {ParticleInput<Number>} alphaEnd - Ending alpha input.
     * @param {ParticleInput<Number>} vibrationAmplitudeStart - Starting vibration amplitude.
     * @param {ParticleInput<Number>} vibrationAmplitudeEnd - Ending vibration amplitude.
     * @param {ParticleInput<Number>} vibrationFrequencyStart - Starting vibration frequency.
     * @param {ParticleInput<Number>} vibrationFrequencyEnd - Ending vibration frequency.
     * @param {boolean} isElevationManage - Whether 3D elevation is managed.
     */
    constructor(advancedVariables, sprite, target, particleLifetime, elevationStart, riseRateStart, riseRateEnd, velocityStart, velocityEnd, angleStart, angleEnd,
        sizeStart, sizeEnd, particleRotationStart, particleRotationEnd, colorStart, colorEnd, alphaStart, alphaEnd,
        vibrationAmplitudeStart, vibrationAmplitudeEnd, vibrationFrequencyStart, vibrationFrequencyEnd, isElevationManage) {
        super(advancedVariables, sprite, particleLifetime, elevationStart, riseRateStart, riseRateEnd, sizeStart, sizeEnd, particleRotationStart, particleRotationEnd, colorStart, colorEnd, alphaStart, alphaEnd, vibrationAmplitudeStart, vibrationAmplitudeEnd, vibrationFrequencyStart, vibrationFrequencyEnd, isElevationManage)

        this.target = target;
        this.velocityStart = velocityStart;
        this.velocityEnd = Utils.computeSameAsStart(velocityStart, velocityEnd);
        this.angleStart = angleStart;
        this.angleEnd = Utils.computeSameAsStart(angleStart, angleEnd);
    }

    /**
     * Updates spraying particle movement and lifetime per tick.
     * @param {number} dt - Frame delta time in ms.
     * @returns {void}
     */
    manageLifetime(dt) {
        let lifetimeProportion = this.getLifetimeProportion()

        if (this.timedParticule) {
            const lifetime = this.particleLifetime - this.remainingTime
            AdvancedVariable.generateAll(this.advancedVariables, dt, lifetime, lifetimeProportion);
        }

        //Particle move
        const currentVelocity = Particle._computeValue(this.velocityStart.getValue(this.advancedVariables), this.velocityEnd.getValue(this.advancedVariables), lifetimeProportion);
        let angleRadiant = this.getDirection() * (Math.PI / 180)

        let horizontalMovement, verticalMovement
        if (this.isElevationManage) {
            const currentRiseRate = this._computeRiseRate(lifetimeProportion);

            horizontalMovement = currentVelocity * Math.pow((1 - Math.pow(currentRiseRate, 2)), 1 / 2) * dt / 1000
            verticalMovement = currentVelocity * currentRiseRate * dt / 1000

        } else {
            horizontalMovement = currentVelocity * dt / 1000;
            verticalMovement = 0;
        }

        this.positionVibrationLess.x += Math.cos(angleRadiant) * horizontalMovement;
        this.positionVibrationLess.y += Math.sin(angleRadiant) * horizontalMovement;
        this.positionVibrationLess.z += verticalMovement;

        super._manageLifetime(dt, lifetimeProportion)

        if (this.vibrationCurrent) {
            this.sprite.x = this.positionVibrationLess.x + this.vibrationCurrent * Math.cos(angleRadiant - (Math.PI / 2))
            this.sprite.y = this.positionVibrationLess.y + this.vibrationCurrent * Math.sin(angleRadiant - (Math.PI / 2))
        } else {
            this.sprite.x = this.positionVibrationLess.x
            this.sprite.y = this.positionVibrationLess.y
        }
    }

    /**
     * Returns current direction angle of spraying particle.
     * @returns {number} Direction in degrees.
     */
    getDirection() {
        return Particle._computeValue(this.angleStart.getValue(this.advancedVariables), this.angleEnd.getValue(this.advancedVariables), this.getLifetimeProportion())
    }
}

/**
 * Particle subclass representing movement along a defined trajectory path.
 */
export class PathParticle extends Particle {
    /**
     * Constructs a PathParticle instance.
     * @param {Record<string, AdvancedVariable>} advancedVariables - Map of active advanced variables.
     * @param {PIXI.Sprite} sprite - PIXI.Sprite instance.
     * @param {Path} path - Trajectory path object.
     * @param {number} particleLifetime - Lifetime in ms.
     * @param {number} elevationStart - Starting elevation.
     * @param {ParticleInput<Number>} riseRateStart - Starting rise rate input.
     * @param {ParticleInput<Number>} riseRateEnd - Ending rise rate input.
     * @param {ParticleInput<Number>} velocityStart - Starting velocity input.
     * @param {ParticleInput<Number>} velocityEnd - Ending velocity input.
     * @param {ParticleInput<Vector3>} sizeStart - Starting size input.
     * @param {ParticleInput<Vector3>} sizeEnd - Ending size input.
     * @param {ParticleInput<Number>} particleRotationStart - Starting rotation input.
     * @param {ParticleInput<Number>} particleRotationEnd - Ending rotation input.
     * @param {ParticleInput<Vector3>} colorStart - Starting color input.
     * @param {ParticleInput<Vector3>} colorEnd - Ending color input.
     * @param {ParticleInput<Number>} alphaStart - Starting alpha input.
     * @param {ParticleInput<Number>} alphaEnd - Ending alpha input.
     * @param {ParticleInput<Number>} vibrationAmplitudeStart - Starting vibration amplitude.
     * @param {ParticleInput<Number>} vibrationAmplitudeEnd - Ending vibration amplitude.
     * @param {ParticleInput<Number>} vibrationFrequencyStart - Starting vibration frequency.
     * @param {ParticleInput<Number>} vibrationFrequencyEnd - Ending vibration frequency.
     * @param {boolean} isElevationManage - Whether 3D elevation is managed.
     */
    constructor(advancedVariables, sprite, path, particleLifetime, elevationStart, riseRateStart, riseRateEnd, velocityStart, velocityEnd,
        sizeStart, sizeEnd, particleRotationStart, particleRotationEnd, colorStart, colorEnd, alphaStart, alphaEnd,
        vibrationAmplitudeStart, vibrationAmplitudeEnd, vibrationFrequencyStart, vibrationFrequencyEnd, isElevationManage) {
        super(advancedVariables, sprite, particleLifetime, elevationStart, riseRateStart, riseRateEnd, sizeStart, sizeEnd, particleRotationStart, particleRotationEnd, colorStart, colorEnd, alphaStart, alphaEnd, vibrationAmplitudeStart, vibrationAmplitudeEnd, vibrationFrequencyStart, vibrationFrequencyEnd, isElevationManage)

        this.path = path;
        this.velocityStart = velocityStart;
        this.velocityEnd = Utils.computeSameAsStart(velocityStart, velocityEnd);
        this.lengthPosition = 0;
    }

    /**
     * Updates path particle position along trajectory and manages lifetime per tick.
     * @param {number} dt - Frame delta time in ms.
     * @returns {void}
     */
    manageLifetime(dt) {
        let lifetimeProportion = this.getLifetimeProportion();

        if (this.timedParticule) {
            const lifetime = this.particleLifetime - this.remainingTime
            AdvancedVariable.generateAll(this.advancedVariables, dt, lifetime, lifetimeProportion);
        }

        //Particle move
        const currentVelocity = Particle._computeValue(this.velocityStart.getValue(this.advancedVariables), this.velocityEnd.getValue(this.advancedVariables), lifetimeProportion);
        this.lengthPosition += currentVelocity * dt / 1000;
        this.positionVibrationLess = this.path.getPointAtProportion(this.lengthPosition / this.path.totalLenght);

        super._manageLifetime(dt, lifetimeProportion)

        if (this.vibrationCurrent) {
            this.sprite.x = this.positionVibrationLess.x + this.vibrationCurrent * Math.cos(angleRadiant - (Math.PI / 2))
            this.sprite.y = this.positionVibrationLess.y + this.vibrationCurrent * Math.sin(angleRadiant - (Math.PI / 2))
        } else {
            this.sprite.x = this.positionVibrationLess.x
            this.sprite.y = this.positionVibrationLess.y
        }

        this.sprite.angle += this.getDirection()
    }

    /**
     * Returns direction angle along current path position.
     * @returns {number} Direction in degrees.
     */
    getDirection() {
        return this.path.getDirection();
    }
}

/**
 * Particle subclass representing orbital/gravitating motion around a source point.
 */
export class GravitingParticle extends Particle {

    /**
     * Computes 3D coordinates of a gravitating particle around source.
     * @param {{x: number, y: number, z: number}} source - Source center position.
     * @param {number} radius - Current orbital radius.
     * @param {number} angleOnTrack - Angle on orbital track in radians.
     * @param {number} riseRate - Elevation rise rate.
     * @param {number} trackRotation - Rotation angle of the orbital track.
     * @returns {{x: number, y: number, z: number}} Calculated 3D point.
     */
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

    /**
     * Constructs a GravitingParticle instance.
     * @param {Record<string, AdvancedVariable>} advancedVariables - Map of active advanced variables.
     * @param {PIXI.Sprite} sprite - PIXI.Sprite instance.
     * @param {ParticleInput<Vector3|foundry.canvas.placeables.PlaceableObject>} source - Center source object or position.
     * @param {number} particleLifetime - Total lifetime in ms.
     * @param {number} elevationStart - Starting elevation.
     * @param {number} axisElevationAngle - Track elevation angle.
     * @param {ParticleInput<Number>} riseRateStart - Starting rise rate input.
     * @param {ParticleInput<Number>} riseRateEnd - Ending rise rate input.
     * @param {number} angleStart - Starting angle in degrees.
     * @param {ParticleInput<Number>} angularVelocityStart - Starting angular velocity.
     * @param {ParticleInput<Number>} angularVelocityEnd - Ending angular velocity.
     * @param {ParticleInput<Number>} radiusStart - Starting radius input.
     * @param {ParticleInput<Number>} radiusEnd - Ending radius input.
     * @param {ParticleInput<Vector3>} sizeStart - Starting size input.
     * @param {ParticleInput<Vector3>} sizeEnd - Ending size input.
     * @param {ParticleInput<Number>} particleRotationStart - Starting rotation input.
     * @param {ParticleInput<Number>} particleRotationEnd - Ending rotation input.
     * @param {ParticleInput<Vector3>} colorStart - Starting color input.
     * @param {ParticleInput<Vector3>} colorEnd - Ending color input.
     * @param {ParticleInput<Number>} alphaStart - Starting alpha input.
     * @param {ParticleInput<Number>} alphaEnd - Ending alpha input.
     * @param {ParticleInput<Number>} vibrationAmplitudeStart - Starting vibration amplitude.
     * @param {ParticleInput<Number>} vibrationAmplitudeEnd - Ending vibration amplitude.
     * @param {ParticleInput<Number>} vibrationFrequencyStart - Starting vibration frequency.
     * @param {ParticleInput<Number>} vibrationFrequencyEnd - Ending vibration frequency.
     * @param {boolean} isElevationManage - Whether 3D elevation is managed.
     */
    constructor(advancedVariables, sprite, source, particleLifetime, elevationStart, axisElevationAngle, riseRateStart, riseRateEnd, angleStart, angularVelocityStart, angularVelocityEnd, radiusStart, radiusEnd,
        sizeStart, sizeEnd, particleRotationStart, particleRotationEnd, colorStart, colorEnd, alphaStart, alphaEnd,
        vibrationAmplitudeStart, vibrationAmplitudeEnd, vibrationFrequencyStart, vibrationFrequencyEnd, isElevationManage) {
        super(advancedVariables, sprite, particleLifetime, elevationStart, riseRateStart, riseRateEnd, sizeStart, sizeEnd, particleRotationStart, particleRotationEnd, colorStart, colorEnd, alphaStart, alphaEnd, vibrationAmplitudeStart, vibrationAmplitudeEnd, vibrationFrequencyStart, vibrationFrequencyEnd, isElevationManage)

        this.source = source
        this.angle = angleStart                                                                         //Number 
        this.axisElevationAngle = axisElevationAngle
        this.angularVelocityStart = angularVelocityStart;                                               //ParticleInput<Number>
        this.angularVelocityEnd = Utils.computeSameAsStart(angularVelocityStart, angularVelocityEnd);   //ParticleInput<Number>
        this.radiusStart = radiusStart;                                                                 //ParticleInput<Number>
        this.radiusEnd = Utils.computeSameAsStart(radiusStart, radiusEnd);                              //ParticleInput<Number>
    }

    /**
     * Updates orbiting particle position around source center per tick.
     * @param {number} dt - Frame delta time in ms.
     * @returns {void}
     */
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