import { Utils, Vector3 } from "../utils/utils.js";
import { AdvancedVariable } from "./advancedVariable.js";
import { ParticleInput } from "./particleInput.js";

/**
 * Base particle representation handling position, lifetime, size, color, rotation, and rendering updates.
 */
export class Particle {

    /** Sort layer for PixiJS rendering hierarchy. */
    static SORT_LAYER = 950

    //TODO separate advancedVariables from option
    /**
     * Constructs a base Particle instance.
     * @param {Object} options - Options object containing computed particle properties.
     * @param {Record<string, AdvancedVariable>} [options.advancedVariables] - Active advanced variables.
     * @param {PIXI.Sprite} options.sprite - Particle PIXI Sprite instance.
     * @param {number} options.particleLifetime - Lifetime in milliseconds.
     * @param {number} options.elevationStart - Elevation at spawning.
     * @param {ParticleInput} options.particleRiseRate - Elevation rise rate keyframe list.
     * @param {ParticleInput} options.particleSize - Particle size keyframe list.
     * @param {ParticleInput} options.particleRotation - Particle rotation keyframe list.
     * @param {ParticleInput} options.particleColor - Particle color keyframe list.
     * @param {ParticleInput} options.alpha - Opacity alpha keyframe list.
     * @param {ParticleInput} options.vibrationAmplitude - Vibration amplitude keyframe list.
     * @param {ParticleInput} options.vibrationFrequency - Vibration frequency keyframe list.
     * @param {boolean} options.isElevationManage - Whether elevation management is enabled.
     */
    constructor(options) {
        this.advancedVariables = options.advancedVariables;
        this.sprite = options.sprite;
        this.positionVibrationLess = { x: options.sprite.x, y: options.sprite.y, z: options.isElevationManage ? options.elevationStart : 0 };
        this.remainingTime = options.particleLifetime;
        this.particleLifetime = options.particleLifetime;
        this.particleRiseRate = options.particleRiseRate;
        this.particleSize = options.particleSize;
        this.particleRotation = options.particleRotation;
        this.particleColor = options.particleColor;
        this.alpha = options.alpha;
        this.vibrationAmplitude = options.vibrationAmplitude;
        this.vibrationFrequency = options.vibrationFrequency;
        this.timedParticule = this.advancedVariables && !!Object.values(this.advancedVariables).filter((item) => item.isTimedLinked).length
        this.isElevationManage = options.isElevationManage;

        this.sprite.elevation = options.isElevationManage ? options.elevationStart / Utils.pixelOfDistanceConvertor() : undefined
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
        this.sprite.tint = Color.fromRGB([Math.floor(actualColorVector.x) / 255, Math.floor(actualColorVector.y) / 255, Math.floor(actualColorVector.z) / 255])

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
     * @param {Object} options - Computed spraying particle options object.
     * @param {Object} [options.target] - Target position object.
     * @param {ParticleInput} options.particleVelocity - Velocity keyframe list.
     * @param {ParticleInput} options.particleAngle - Angle keyframe list.
     */
    constructor(options) {
        super(options);
        this.target = options.target;
        this.particleVelocity = options.particleVelocity;
        this.particleAngle = options.particleAngle;
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
     * @param {Object} options - Computed path particle options object.
     * @param {Path} options.path - Trajectory path instance.
     * @param {ParticleInput} options.particleVelocity - Velocity keyframe list.
     */
    constructor(options) {
        super(options);
        this.path = options.path;
        this.particleVelocity = options.particleVelocity;
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
     * @param {Object} options - Computed gravitating particle options object.
     * @param {Vector3|Object} [options.center] - Source center position.
     * @param {number} [options.angle] - Current angle on track.
     * @param {number} [options.axisElevationAngle] - Track elevation angle.
     * @param {ParticleInput} [options.angularVelocity] - Angular velocity keyframe list.
     * @param {ParticleInput} [options.particleRadius] - Radius keyframe list.
     */
    constructor(options) {
        super(options);
        this.source = options.center ?? options.source;
        this.angle = options.angle ?? options.angleStart;
        this.axisElevationAngle = options.axisElevationAngle;
        this.particleVelocity = options.angularVelocity ?? options.particleVelocity;
        this.particleRadius = options.particleRadius;
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