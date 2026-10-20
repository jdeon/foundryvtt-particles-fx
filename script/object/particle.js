import { Utils, Vector3 } from "../utils/utils.js";
import { AdvancedVariable } from "./advancedVariable.js";
import { ParticleInput } from "./particleInput.js";

/**
 * Base particle representation handling position, lifetime, size, color, rotation, and rendering updates.
 */
export class Particle {

    /** Sort layer for PixiJS rendering hierarchy. */
    static SORT_LAYER = 950

    /**
     * Constructs a base Particle instance.
     * @param {Object} particleProperties - particleProperties object containing computed particle properties.
     * @param {PIXI.Sprite} particleProperties.sprite - Particle PIXI Sprite instance.
     * @param {number} particleProperties.particleLifetime - Lifetime in milliseconds.
     * @param {number} particleProperties.elevationStart - Elevation at spawning.
     * @param {ParticleInput} particleProperties.particleRiseRate - Elevation rise rate keyframe list.
     * @param {ParticleInput} particleProperties.particleSize - Particle size keyframe list.
     * @param {ParticleInput} particleProperties.particleRotation - Particle rotation keyframe list.
     * @param {ParticleInput} particleProperties.particleColor - Particle color keyframe list.
     * @param {ParticleInput} particleProperties.alpha - Opacity alpha keyframe list.
     * @param {ParticleInput} particleProperties.vibrationAmplitude - Vibration amplitude keyframe list.
     * @param {ParticleInput} particleProperties.vibrationFrequency - Vibration frequency keyframe list.
     * @param {Record<string, AdvancedVariable>} advancedVariables - Active advanced variables
     * @param {boolean} isElevationManage - Whether elevation management is enabled.
     */
    constructor(particleProperties, advancedVariables, isElevationManage) {
        this.advancedVariables = advancedVariables;
        this.sprite = particleProperties.sprite;
        this.positionVibrationLess = { x: particleProperties.sprite.x, y: particleProperties.sprite.y, z: particleProperties.isElevationManage ? particleProperties.elevationStart : 0 };
        this.remainingTime = particleProperties.particleLifetime;
        this.particleLifetime = particleProperties.particleLifetime;
        this.particleRiseRate = particleProperties.particleRiseRate;
        this.particleSize = particleProperties.particleSize;
        this.particleRotation = particleProperties.particleRotation;
        this.particleColor = particleProperties.particleColor;
        this.alpha = particleProperties.alpha;
        this.vibrationAmplitude = particleProperties.vibrationAmplitude;
        this.vibrationFrequency = particleProperties.vibrationFrequency;
        this.timedParticule = this.advancedVariables && !!Object.values(this.advancedVariables).filter((item) => item.isTimedLinked).length
        this.isElevationManage = isElevationManage;

        this.sprite.elevation = isElevationManage ? particleProperties.elevationStart / Utils.pixelOfDistanceConvertor() : undefined
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
        const currentSize = this.particleSize.computeValue(lifetimeProportion, this.advancedVariables)

        const sizeFactor = Utils.handleElevationFactorForSize(this.isElevationManage ? this.positionVibrationLess.z : undefined)
        this.sprite.width = currentSize.x * sizeFactor
        this.sprite.height = currentSize.y * sizeFactor

        let particleRotation = this.particleRotation.computeValue(lifetimeProportion, this.advancedVariables);
        this.sprite.angle = particleRotation

        //Particle change color
        this.sprite.alpha = this.alpha.computeValue(lifetimeProportion, this.advancedVariables);

        const actualColorVector = this.particleColor.computeValue(lifetimeProportion, this.advancedVariables)
        this.sprite.tint = Utils.fromRGB(actualColorVector)

        let vibrationAmplitudeCurrent = this.vibrationAmplitude.computeValue(lifetimeProportion, this.advancedVariables);
        let vibrationFrequencyCurrent = this.vibrationFrequency.computeValue(lifetimeProportion, this.advancedVariables);
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

        const currentRiseRate = this.particleRiseRate.computeValue(lifetimeProportion, this.advancedVariables);

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
     * @param {Object} particleProperties - Computed spraying particle particleProperties object.
     * @param {Object} [particleProperties.target] - Target position object.
     * @param {ParticleInput} particleProperties.particleVelocity - Velocity keyframe list.
     * @param {ParticleInput} particleProperties.particleAngle - Angle keyframe list.
     * @param {Record<string, AdvancedVariable>} advancedVariables - Active advanced variables
     * @param {boolean} isElevationManage - Whether elevation management is enabled.
     */
    constructor(particleProperties, advancedVariables, isElevationManage) {
        super(particleProperties, advancedVariables, isElevationManage);
        this.target = particleProperties.target;
        this.particleVelocity = particleProperties.particleVelocity;
        this.particleAngle = particleProperties.particleAngle;
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
        const currentVelocity = this.particleVelocity.computeValue(lifetimeProportion, this.advancedVariables);
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
        return this.particleAngle.computeValue(this.getLifetimeProportion(), this.advancedVariables)
    }
}

/**
 * Particle subclass representing movement along a defined trajectory path.
 */
export class PathParticle extends Particle {
    /**
     * Constructs a PathParticle instance.
     * @param {Object} particleProperties - Computed path particle particleProperties object.
     * @param {Path} particleProperties.path - Trajectory path instance.
     * @param {ParticleInput} particleProperties.particleVelocity - Velocity keyframe list.
     * @param {Record<string, AdvancedVariable>} advancedVariables - Active advanced variables
     * @param {boolean} isElevationManage - Whether elevation management is enabled.
     */
    constructor(particleProperties, advancedVariables, isElevationManage) {
        super(particleProperties, advancedVariables, isElevationManage);
        this.path = particleProperties.path;
        this.particleVelocity = particleProperties.particleVelocity;
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
        const currentVelocity = this.particleVelocity.computeValue(lifetimeProportion, this.advancedVariables);
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
     * @param {Object} particleProperties - Computed gravitating particle particleProperties object.
     * @param {Vector3|Object} [particleProperties.center] - Source center position.
     * @param {number} [particleProperties.angle] - Current angle on track.
     * @param {number} [particleProperties.axisElevationAngle] - Track elevation angle.
     * @param {ParticleInput} [particleProperties.angularVelocity] - Angular velocity keyframe list.
     * @param {ParticleInput} [particleProperties.particleRadius] - Radius keyframe list.
     * @param {Record<string, AdvancedVariable>} advancedVariables - Active advanced variables
     * @param {boolean} isElevationManage - Whether elevation management is enabled.
     */
    constructor(particleProperties, advancedVariables, isElevationManage) {
        super(particleProperties, advancedVariables, isElevationManage);
        this.source = particleProperties.center ?? particleProperties.source;
        this.angle = particleProperties.angle ?? particleProperties.angleStart;
        this.axisElevationAngle = particleProperties.axisElevationAngle;
        this.particleVelocity = particleProperties.angularVelocity ?? particleProperties.particleVelocity;
        this.particleRadius = particleProperties.particleRadius;
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
        const currentVelocity = this.particleVelocity.computeValue(lifetimeProportion, this.advancedVariables);
        this.angle += currentVelocity * dt / 1000
        const angleRadiant = this.angle * (Math.PI / 180);

        const currentRadius = this.particleRadius.computeValue(lifetimeProportion, this.advancedVariables);
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