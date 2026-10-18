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
 * Custom Pixi Particle Emitter Behavior applying lateral sinusoidal vibration jitter.
 * Offsets active particles perpendicular to their heading vector.
 */
export class VibrationBehavior {
    static type = "vibration";
    order = 3; // Late post-movement order

    /**
     * Constructs a VibrationBehavior instance.
     * @param {Object} config - Behavior configuration parameters.
     * @param {number|{list: Array<{time: number, value: number}>}} [config.amplitude=0] - Lateral vibration amplitude in pixels.
     * @param {number|{list: Array<{time: number, value: number}>}} [config.frequency=1000] - Vibration period/frequency in milliseconds.
     */
    constructor(config) {
        this.amplitude = config.amplitude ?? 0;
        this.frequency = config.frequency ?? 1000;
    }

    /**
     * Initializes vibration time on newly spawned particles.
     * @param {Object} first - First particle in the spawned batch.
     * @returns {void}
     */
    initParticles(first) {
        let p = first;
        while (p) {
            p._vibrationElapsed = 0;
            p = p.next;
        }
    }

    /**
     * Updates particle position with perpendicular sinusoidal lateral displacement per tick.
     * @param {Object} particle - Active particle instance.
     * @param {number} deltaSec - Frame delta time in seconds.
     * @returns {void}
     */
    updateParticle(particle, deltaSec) {
        particle._vibrationElapsed = (particle._vibrationElapsed ?? 0) + deltaSec * 1000;

        const progress = particle.maxLife > 0 ? Math.min(1, Math.max(0, particle.age / particle.maxLife)) : 0;
        const currentAmplitude = interpolateScalar(this.amplitude, progress, 0);
        const currentFrequency = interpolateScalar(this.frequency, progress, 1000);

        if (!currentAmplitude || !currentFrequency) return;

        const vibrationCurrent = currentAmplitude * Math.sin(2 * Math.PI * (particle._vibrationElapsed / currentFrequency));
        const headingAngle = particle.rotation ?? 0;

        // Displace perpendicular to direction
        particle.x += vibrationCurrent * Math.cos(headingAngle - (Math.PI / 2));
        particle.y += vibrationCurrent * Math.sin(headingAngle - (Math.PI / 2));
    }
}
