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
 * Custom Pixi Particle Emitter Behavior guiding particles along a mathematical Path instance (Linear or Curve).
 */
export class PathFollowerBehavior {
    static type = "pathFollower";
    order = 2; // Late order: overrides Cartesian position along path geometry

    /**
     * Constructs a PathFollowerBehavior instance.
     * @param {Object} config - Behavior configuration parameters.
     * @param {import("../utils/path.js").Path} config.path - Trajectory Path instance.
     * @param {number|{list: Array<{time: number, value: number}>}} [config.velocity=200] - Velocity along path in pixels/sec.
     * @param {boolean} [config.isElevationManage=false] - Whether elevation tracking is active.
     */
    constructor(config) {
        this.path = config.path;
        this.velocity = config.velocity ?? 200;
        this.isElevationManage = Boolean(config.isElevationManage);
    }

    /**
     * Initializes travel distance on newly spawned particles.
     * @param {Object} first - First particle in the spawned batch.
     * @returns {void}
     */
    initParticles(first) {
        let p = first;
        while (p) {
            p._pathDistance = 0;
            p = p.next;
        }
    }

    /**
     * Updates particle position and orientation along the trajectory path per tick.
     * @param {Object} particle - Active particle instance.
     * @param {number} deltaSec - Frame delta time in seconds.
     * @returns {void}
     */
    updateParticle(particle, deltaSec) {
        if (!this.path || !this.path.totalLenght) return;

        const progress = particle.maxLife > 0 ? Math.min(1, Math.max(0, particle.age / particle.maxLife)) : 0;
        const currentVelocity = interpolateScalar(this.velocity, progress, 200);

        particle._pathDistance = (particle._pathDistance ?? 0) + currentVelocity * deltaSec;
        const proportion = Math.min(1, particle._pathDistance / this.path.totalLenght);

        const point = this.path.getPointAtProportion(proportion);
        if (point) {
            particle.x = point.x;
            particle.y = point.y;

            if (this.isElevationManage && point.z !== undefined) {
                particle.elevation = point.z / Utils.pixelOfDistanceConvertor();
                particle.sortLayer = 950;
            }
        }

        // Align particle rotation to trajectory heading angle
        const headingDeg = this.path.getDirection();
        if (!isNaN(headingDeg)) {
            particle.rotation = headingDeg * (Math.PI / 180);
        }
    }
}
