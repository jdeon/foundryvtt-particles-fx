import { Utils } from "../utils/utils.js";
import { GravitingParticle } from "../object/particle.js";

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
 * Custom Pixi Particle Emitter Behavior for orbital / gravitating particle motion.
 * Orbits a dynamic source (e.g. moving token or coordinate) with 3D tilted track mechanics.
 */
export class OrbitBehavior {
    static type = "orbit";
    order = 2; // Late order: runs after base spawn/movement calculations

    /**
     * Constructs an OrbitBehavior instance.
     * @param {Object} config - Behavior configuration parameters.
     * @param {*} config.source - Source position, token ID, or token object.
     * @param {number|{list: Array<{time: number, value: number}>}} [config.angularVelocity=90] - Orbital velocity in degrees/sec.
     * @param {number|{list: Array<{time: number, value: number}>}} [config.radius=50] - Orbital radius in pixels.
     * @param {number|{list: Array<{time: number, value: number}>}} [config.riseRate=0] - 3D elevation rise rate factor.
     * @param {number} [config.axisElevationAngle=0] - Track rotation angle in degrees.
     * @param {number} [config.angleStart] - Starting angle in degrees, or undefined for random.
     * @param {boolean} [config.isElevationManage=false] - Whether elevation depth management is active.
     */
    constructor(config) {
        this.source = config.source;
        this.angularVelocity = config.angularVelocity ?? 90;
        this.radius = config.radius ?? 50;
        this.riseRate = config.riseRate ?? 0;
        this.axisElevationAngle = config.axisElevationAngle ?? 0;
        this.angleStart = config.angleStart;
        this.isElevationManage = Boolean(config.isElevationManage);
    }

    /**
     * Initializes custom orbit properties on newly spawned particles.
     * @param {Object} first - First particle in the spawned linked list.
     * @returns {void}
     */
    initParticles(first) {
        let p = first;
        while (p) {
            p._orbitAngle = (this.angleStart !== undefined)
                ? this.angleStart
                : (Math.random() * 360);

            p._orbitSource = this.source;
            p = p.next;
        }
    }

    /**
     * Updates orbiting particle position per frame tick.
     * @param {Object} particle - Active particle instance.
     * @param {number} deltaSec - Frame delta time in seconds.
     * @returns {void}
     */
    updateParticle(particle, deltaSec) {
        const sourcePos = Utils.getSourcePosition(this.source);
        if (!sourcePos) {
            // Source no longer exists on canvas: expire the particle immediately
            particle.age = particle.maxLife;
            return;
        }

        const progress = particle.maxLife > 0 ? Math.min(1, Math.max(0, particle.age / particle.maxLife)) : 0;
        const currentAngularVelocity = interpolateScalar(this.angularVelocity, progress, 90);
        const currentRadius = interpolateScalar(this.radius, progress, 50);
        const currentRiseRate = interpolateScalar(this.riseRate, progress, 0);

        particle._orbitAngle = (particle._orbitAngle ?? 0) + currentAngularVelocity * deltaSec;
        const angleRadian = particle._orbitAngle * (Math.PI / 180);

        const pos = GravitingParticle.computeParticlePosition(
            sourcePos,
            currentRadius,
            angleRadian,
            currentRiseRate,
            this.axisElevationAngle
        );

        particle.x = pos.x;
        particle.y = pos.y;

        if (this.isElevationManage) {
            particle.elevation = pos.z / Utils.pixelOfDistanceConvertor();
            particle.sortLayer = 950;
        }
    }
}
