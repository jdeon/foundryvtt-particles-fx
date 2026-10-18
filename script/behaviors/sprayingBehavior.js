import { Utils } from "../utils/utils.js";

/**
 * Helper to interpolate scalar or keyframed properties across particle lifetime progress [0..1].
 * @param {number|{list: Array<{time: number, value: number}>}} prop - Property value or keyframe list.
 * @param {number} progress - Lifetime progress from 0 to 1.
 * @param {number} [defaultValue=0] - Default value if property is missing.
 * @returns {number} Interpolated value.
 */
function interpolateScalar(prop, progress, defaultValue = 0) {
    if (prop === undefined || prop === null) return defaultValue;
    if (typeof prop === "number") return prop;
    const list = prop.list ?? (Array.isArray(prop) ? prop : null);
    if (!list || list.length === 0) return defaultValue;
    if (list.length === 1 || progress <= list[0].time) return list[0].value;
    if (progress >= list[list.length - 1].time) return list[list.length - 1].value;

    const nextIndex = list.findIndex(item => item.time > progress);
    const prevIndex = nextIndex - 1;
    const timeDiff = list[nextIndex].time - list[prevIndex].time;
    const segmentProportion = timeDiff > 0 ? (progress - list[prevIndex].time) / timeDiff : 0;
    const v0 = list[prevIndex].value;
    const v1 = list[nextIndex].value;
    return v0 + (v1 - v0) * segmentProportion;
}

/**
 * Custom Pixi Particle Emitter Behavior handling directional linear spray motion with 3D elevation splitting.
 */
export class SprayingBehavior {
    static type = "spraying";
    order = 1; // Standard movement order

    /**
     * Constructs a SprayingBehavior instance.
     * @param {Object} config - Behavior configuration parameters.
     * @param {number|{list: Array<{time: number, value: number}>}} [config.velocity=100] - Velocity in pixels/sec.
     * @param {number|string|{list: Array<{time: number, value: number}>}} [config.angle=0] - Direction angle in degrees or range string (e.g. '0_360').
     * @param {number|{list: Array<{time: number, value: number}>}} [config.riseRate=0] - Elevation rise rate factor.
     * @param {*} [config.source] - Emitter source position or token.
     * @param {*} [config.target] - Target position or token for aimed sprays.
     * @param {boolean} [config.isElevationManage=false] - Whether elevation tracking is enabled.
     */
    constructor(config) {
        this.velocity = config.velocity ?? 100;
        this.angle = config.angle ?? 0;
        this.riseRate = config.riseRate ?? 0;
        this.source = config.source;
        this.target = config.target;
        this.isElevationManage = Boolean(config.isElevationManage);

        // Precalculate target angle offset if target is defined
        if (this.target && this.source) {
            const srcPos = Utils.getSourcePosition(this.source, this.isElevationManage);
            const tgtPos = Utils.getSourcePosition(this.target, this.isElevationManage);
            if (srcPos && tgtPos && (srcPos.x !== tgtPos.x || srcPos.y !== tgtPos.y)) {
                this._targetAngleOffset = Math.atan2(tgtPos.y - srcPos.y, tgtPos.x - srcPos.x) * (180 / Math.PI);
            }
        }
    }

    /**
     * Initializes base directional angle on newly spawned particles.
     * @param {Object} first - First particle in the spawned batch.
     * @returns {void}
     */
    initParticles(first) {
        let p = first;
        while (p) {
            if (typeof this.angle === "string" && this.angle.includes("_")) {
                const [min, max] = this.angle.split("_").map(Number);
                p._sprayBaseAngle = min + Math.random() * (max - min);
            } else {
                p._sprayBaseAngle = 0;
            }
            p = p.next;
        }
    }

    /**
     * Updates particle position per tick based on velocity, angle, and elevation rise rate.
     * @param {Object} particle - Active particle instance.
     * @param {number} deltaSec - Frame delta time in seconds.
     * @returns {void}
     */
    updateParticle(particle, deltaSec) {
        const progress = particle.maxLife > 0 ? Math.min(1, Math.max(0, particle.age / particle.maxLife)) : 0;
        const currentVelocity = interpolateScalar(this.velocity, progress, 100);
        let angleDeg = interpolateScalar(this.angle, progress, 0) + (particle._sprayBaseAngle ?? 0);

        if (this._targetAngleOffset !== undefined) {
            angleDeg += this._targetAngleOffset;
        }

        const angleRad = angleDeg * (Math.PI / 180);
        const currentRiseRate = Utils.handleFraction(interpolateScalar(this.riseRate, progress, 0));

        let horizontalMove;
        let verticalMove = 0;

        if (this.isElevationManage && currentRiseRate !== 0) {
            const horizontalFactor = Math.sqrt(Math.max(0, 1 - Math.pow(currentRiseRate, 2)));
            horizontalMove = currentVelocity * horizontalFactor * deltaSec;
            verticalMove = currentVelocity * currentRiseRate * deltaSec;
        } else {
            horizontalMove = currentVelocity * deltaSec;
        }

        particle.x += Math.cos(angleRad) * horizontalMove;
        particle.y += Math.sin(angleRad) * horizontalMove;

        if (this.isElevationManage) {
            particle._elevationZ = (particle._elevationZ ?? 0) + verticalMove;
            particle.elevation = particle._elevationZ / Utils.pixelOfDistanceConvertor();
            particle.sortLayer = 950;
        }
    }
}
