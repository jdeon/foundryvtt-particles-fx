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
 * Custom Pixi Particle Emitter Behavior managing 3D elevation and perspective scaling.
 * Assigns sprite.elevation for depth sorting in canvas.primary and scales particles with elevation.
 */
export class ElevationBehavior {
    static type = "elevation";
    order = 2; // Late order: applies after base position/scale updates

    /**
     * Constructs an ElevationBehavior instance.
     * @param {Object} config - Behavior configuration parameters.
     * @param {number} [config.elevationStart=0] - Elevation in world units at spawn.
     * @param {number|{list: Array<{time: number, value: number}>}} [config.particleRiseRate=0] - Elevation rise rate keyframes or number.
     * @param {number} [config.velocity=0] - Base particle movement velocity for 3D rise splitting.
     * @param {boolean} [config.isElevationManage=true] - Whether elevation management is enabled.
     */
    constructor(config) {
        this.elevationStart = Number(config.elevationStart) || 0;
        this.particleRiseRate = config.particleRiseRate ?? 0;
        this.velocity = config.velocity ?? 0;
        this.isElevationManage = config.isElevationManage !== false;
    }

    /**
     * Initializes elevation state on newly spawned particles.
     * @param {Object} first - First particle in the spawned batch.
     * @returns {void}
     */
    initParticles(first) {
        let p = first;
        const initialElevationPx = this.elevationStart * Utils.pixelOfDistanceConvertor();

        while (p) {
            p._elevationZ = initialElevationPx;
            p.sortLayer = 950;

            if (this.isElevationManage) {
                p.elevation = this.elevationStart;
            }
            p = p.next;
        }
    }

    /**
     * Updates particle elevation and applies perspective size scaling per tick.
     * @param {Object} particle - Active particle instance.
     * @param {number} deltaSec - Frame delta time in seconds.
     * @returns {void}
     */
    updateParticle(particle, deltaSec) {
        if (!this.isElevationManage) return;

        const progress = particle.maxLife > 0 ? Math.min(1, Math.max(0, particle.age / particle.maxLife)) : 0;
        const currentRiseRate = Utils.handleFraction(interpolateScalar(this.particleRiseRate, progress, 0));
        const currentVelocity = interpolateScalar(this.velocity, progress, 0);

        // Vertical elevation delta in pixels
        const verticalDelta = currentVelocity * currentRiseRate * deltaSec;
        particle._elevationZ = (particle._elevationZ ?? 0) + verticalDelta;

        // Assign canvas elevation for primary group sorting
        particle.elevation = particle._elevationZ / Utils.pixelOfDistanceConvertor();

        // Apply perspective size scaling factor
        const sizeFactor = Utils.handleElevationFactorForSize(particle._elevationZ);
        if (sizeFactor > 0 && isFinite(sizeFactor)) {
            particle.scale.x *= sizeFactor;
            particle.scale.y *= sizeFactor;
        }
    }
}
