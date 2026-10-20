import { Utils, Vector3 } from "../utils/utils.js";
import { GravitingParticle } from "../object/particle.js";
import { ParticleWorkFlowManager } from "../object/particleWorkFlow.js";

/**
 * Resolves a single numeric value from a number, range string ("min_max"), percentage ("50%"),
 * array of choices, or advanced variables.
 * @param {number|string|Array|Vector3} val - Raw input value or range expression.
 * @param {number} [defaultValue=0] - Fallback default value.
 * @param {Object} [advancedVariables] - Optional advanced variables.
 * @returns {number} Resolved concrete numeric value.
 */
export function resolveNumericValue(val, defaultValue = 0, advancedVariables) {
    if (val === undefined || val === null) return defaultValue;
    if (typeof val === "number" && !isNaN(val)) return val;

    if (val instanceof Vector3 || (typeof val === "object" && val !== null && "x" in val)) {
        return resolveNumericValue(val.x, defaultValue, advancedVariables);
    }

    const resolved = Utils.getRandomValueFrom(val, advancedVariables);
    if (typeof resolved === "number" && !isNaN(resolved)) {
        return resolved;
    }
    const num = Number(resolved);
    return isNaN(num) ? defaultValue : num;
}

/**
 * Resolves a property that can be a scalar (number, range, array) or a keyframe list.
 * Evaluates all random expressions at spawn time so all resulting keyframes/scalars are pure numbers.
 * @param {number|string|Array|{list: Array<{time: number, value: *}>}} prop - Property value or keyframe list.
 * @param {number} [defaultValue=0] - Fallback default value.
 * @param {Object} [advancedVariables] - Optional advanced variables.
 * @returns {number|{list: Array<{time: number, value: number}>}} Resolved number or keyframe list of numbers.
 */
export function resolveScalarOrKeyframes(prop, defaultValue = 0, advancedVariables) {
    if (prop === undefined || prop === null) return defaultValue;

    const list = prop.list ?? (Array.isArray(prop) && prop.length > 0 && typeof prop[0] === "object" && prop[0] !== null && "time" in prop[0] ? prop : null);

    if (list) {
        return {
            list: list.map(item => ({
                time: Number(item.time) || 0,
                value: resolveNumericValue(item.value, defaultValue, advancedVariables)
            }))
        };
    }

    return resolveNumericValue(prop, defaultValue, advancedVariables);
}

/**
 * Resolves an RGB color triplet [r, g, b] (integers 0-255) from various formats:
 * Vector3, {x,y,z}, [r,g,b], hex string "#RRGGBB", or integer.
 * @param {*} val - Input color value.
 * @param {Object} [advancedVariables] - Optional advanced variables.
 * @returns {[number, number, number]} RGB triplet array.
 */
export function resolveRgbColor(val, advancedVariables) {
    if (val === undefined || val === null) return [255, 255, 255];

    if (Array.isArray(val) && val.length > 0 && (typeof val[0] === "string" || val[0] instanceof Vector3 || (typeof val[0] === "object" && val[0] !== null && "x" in val[0]))) {
        const item = Utils.retrieveRandomElementFromArray(val);
        return resolveRgbColor(item, advancedVariables);
    }

    if (val instanceof Vector3 || (typeof val === "object" && val !== null && "x" in val)) {
        const r = Math.min(255, Math.max(0, resolveNumericValue(val.x, 255, advancedVariables)));
        const g = Math.min(255, Math.max(0, resolveNumericValue(val.y, 255, advancedVariables)));
        const b = Math.min(255, Math.max(0, resolveNumericValue(val.z, 255, advancedVariables)));
        return [Math.floor(r), Math.floor(g), Math.floor(b)];
    }

    if (Array.isArray(val) && val.length >= 3 && typeof val[0] === "number") {
        return [
            Math.min(255, Math.max(0, Math.floor(val[0]))),
            Math.min(255, Math.max(0, Math.floor(val[1]))),
            Math.min(255, Math.max(0, Math.floor(val[2])))
        ];
    }

    if (typeof val === "string") {
        const clean = val.startsWith("#") ? val.slice(1) : val;
        if (/^[0-9a-fA-F]{6}$/.test(clean)) {
            const intVal = parseInt(clean, 16);
            return [(intVal >> 16) & 255, (intVal >> 8) & 255, intVal & 255];
        }
        if (/^[0-9a-fA-F]{3}$/.test(clean)) {
            const r = parseInt(clean[0] + clean[0], 16);
            const g = parseInt(clean[1] + clean[1], 16);
            const b = parseInt(clean[2] + clean[2], 16);
            return [r, g, b];
        }
    }

    if (typeof val === "number") {
        return [(val >> 16) & 255, (val >> 8) & 255, val & 255];
    }

    return [255, 255, 255];
}

/**
 * Resolves color property into concrete RGB keyframes or a single RGB triplet.
 * @param {*} colorProp - Input color configuration.
 * @param {Object} [advancedVariables] - Optional advanced variables.
 * @returns {{rgb: [number, number, number]}|{list: Array<{time: number, rgb: [number, number, number]}>}|null}
 */
export function resolveColorProperty(colorProp, advancedVariables) {
    if (!colorProp) return null;

    const list = colorProp.list ?? (Array.isArray(colorProp) && colorProp.length > 0 && typeof colorProp[0] === "object" && colorProp[0] !== null && "time" in colorProp[0] ? colorProp : null);

    if (list) {
        return {
            list: list.map(item => ({
                time: Number(item.time) || 0,
                rgb: resolveRgbColor(item.value, advancedVariables)
            }))
        };
    }

    return {
        rgb: resolveRgbColor(colorProp, advancedVariables)
    };
}

/**
 * Resolves a 3D position vector from Vector3, array, or object with range/percentage strings.
 * @param {*} vec - Input coordinate representation.
 * @param {{x: number, y: number, z: number}} [defaultValue={x: 0, y: 0, z: 0}] - Fallback coordinates.
 * @param {Object} [advancedVariables] - Optional advanced variables.
 * @returns {Vector3} Resolved Vector3 instance.
 */
export function resolveVector3(vec, defaultValue = { x: 0, y: 0, z: 0 }, advancedVariables) {
    if (!vec) return new Vector3(defaultValue.x ?? 0, defaultValue.y ?? 0, defaultValue.z ?? 0);

    if (Array.isArray(vec) && vec.length > 0 && typeof vec[0] !== "number") {
        const item = Utils.retrieveRandomElementFromArray(vec);
        return resolveVector3(item, defaultValue, advancedVariables);
    }

    const list = vec.list ?? (Array.isArray(vec) && typeof vec[0] === "object" && vec[0] !== null && "time" in vec[0] ? vec : null);
    if (list && list.length > 0) {
        return resolveVector3(list[0].value, defaultValue, advancedVariables);
    }

    const x = resolveNumericValue(vec.x ?? (Array.isArray(vec) ? vec[0] : defaultValue.x), 0, advancedVariables);
    const y = resolveNumericValue(vec.y ?? (Array.isArray(vec) ? vec[1] : defaultValue.y), 0, advancedVariables);
    const z = resolveNumericValue(vec.z ?? (Array.isArray(vec) ? vec[2] : defaultValue.z), 0, advancedVariables);

    return new Vector3(x, y, z);
}

/**
 * Helper to interpolate scalar or keyframed properties across particle lifetime progress [0..1].
 * @param {number|{list: Array<{time: number, value: number}>}} prop - Numeric property value or keyframe list.
 * @param {number} progress - Lifetime progress from 0 to 1.
 * @param {number} [defaultValue=0] - Default value if property is missing.
 * @returns {number} Interpolated scalar value.
 */
export function interpolateScalar(prop, progress, defaultValue = 0) {
    if (prop === undefined || prop === null) return defaultValue;
    if (typeof prop === "number") return prop;
    const list = prop.list ?? (Array.isArray(prop) ? prop : null);
    if (!list || list.length === 0) return defaultValue;
    if (list.length === 1 || progress <= list[0].time) return list[0].value;
    if (progress >= list[list.length - 1].time) return list[list.length - 1].value;

    const nextIndex = list.findIndex(item => item.time > progress);
    if (nextIndex <= 0) return list[0].value;
    const prevIndex = nextIndex - 1;
    const timeDiff = list[nextIndex].time - list[prevIndex].time;
    const segmentProportion = timeDiff > 0 ? (progress - list[prevIndex].time) / timeDiff : 0;
    const v0 = list[prevIndex].value;
    const v1 = list[nextIndex].value;
    return v0 + (v1 - v0) * segmentProportion;
}

/**
 * Helper to interpolate pre-resolved color keyframes into an integer tint value.
 * @param {{rgb?: [number, number, number], list?: Array<{time: number, rgb: [number, number, number]}>}} colorProp - Pre-resolved color structure.
 * @param {number} progress - Lifetime progress from 0 to 1.
 * @returns {number} Integer color tint (0xRRGGBB).
 */
export function interpolateColor(colorProp, progress) {
    if (!colorProp) return 0xffffff;
    if (colorProp.rgb) {
        const [r, g, b] = colorProp.rgb;
        return (r << 16) + (g << 8) + b;
    }
    const list = colorProp.list;
    if (!list || list.length === 0) return 0xffffff;
    if (list.length === 1 || progress <= list[0].time) {
        const [r, g, b] = list[0].rgb;
        return (r << 16) + (g << 8) + b;
    }
    if (progress >= list[list.length - 1].time) {
        const [r, g, b] = list[list.length - 1].rgb;
        return (r << 16) + (g << 8) + b;
    }

    const nextIndex = list.findIndex(item => item.time > progress);
    if (nextIndex <= 0) {
        const [r, g, b] = list[0].rgb;
        return (r << 16) + (g << 8) + b;
    }
    const prevIndex = nextIndex - 1;
    const timeDiff = list[nextIndex].time - list[prevIndex].time;
    const seg = timeDiff > 0 ? (progress - list[prevIndex].time) / timeDiff : 0;

    const [r0, g0, b0] = list[prevIndex].rgb;
    const [r1, g1, b1] = list[nextIndex].rgb;

    const r = Math.round(r0 + (r1 - r0) * seg);
    const g = Math.round(g0 + (g1 - g0) * seg);
    const b = Math.round(b0 + (b1 - b0) * seg);

    return (r << 16) + (g << 8) + b;
}

/**
 * Configures particle state upon spawn within ParticleGenerator.
 * Fully computes all random ranges, percentages, string expressions, and keyframes,
 * placing them onto `particle.computedProperties` so `onParticleUpdate` never does raw string parsing.
 * @param {Object} particle - Spawned particle sprite instance.
 * @param {Object} options - Compiled generator strategy options.
 * @returns {void}
 */
export function onParticleSpawn(particle, options) {
    const isElevationManage = Boolean(options.isElevationManage);

    // 1. Resolve source position
    const source = Utils.getRandomValueFrom(options.source, {})
    const sourcePos = Utils.getSourcePosition(source, isElevationManage, true) || { x: 0, y: 0, z: 0 };

    // 2. Resolve spawn position offset (e.g. positionSpawning: { x: '-10%_10%', y: '-10%_10%', z: 0 })
    let spawnOffset = resolveVector3(options.positionSpawning, { x: 0, y: 0, z: 0 });

    // 3. Compute target angle offset and aim if target exists
    let targetAngleDirection = 0;
    let targetRiseRate = 0;

    const target = Utils.getRandomValueFrom(options.target, {})
    if (target) {
        const targetPos = Utils.getSourcePosition(target, isElevationManage, true);
        if (targetPos && (sourcePos.x !== targetPos.x || sourcePos.y !== targetPos.y)) {
            targetAngleDirection = Math.atan2(targetPos.y - sourcePos.y, targetPos.x - sourcePos.x);

            const dx = targetPos.x - sourcePos.x;
            const dy = targetPos.y - sourcePos.y;
            const dz = (targetPos.z ?? 0) - (sourcePos.z ?? 0);
            const targetDistance = Math.sqrt(dx * dx + dy * dy + dz * dz);
            if (targetDistance > 0 && isElevationManage) {
                targetRiseRate = dz / targetDistance;
            }
        }
    } else if (sourcePos.r !== undefined && sourcePos.r !== 0) {
        targetAngleDirection = sourcePos.r * (Math.PI / 180);
    } else if (options._targetAngleOffset !== undefined) {
        targetAngleDirection = options._targetAngleOffset * (Math.PI / 180);
    }

    // Rotate spawn offset if an orientation direction exists
    if (targetAngleDirection !== 0 && (spawnOffset.x !== 0 || spawnOffset.y !== 0)) {
        const rotated = spawnOffset.rotateZVector(targetAngleDirection);
        spawnOffset = new Vector3(rotated.x, rotated.y, rotated.z);
    }

    const startX = sourcePos.x + spawnOffset.x;
    const startY = sourcePos.y + spawnOffset.y;
    const startZ = (sourcePos.z ?? 0) + (spawnOffset.z ?? 0);

    const targetAngleDeg = targetAngleDirection * (180 / Math.PI);

    // 4. Resolve riseRate and incorporate targetRiseRate if aimed
    let riseRate = resolveScalarOrKeyframes(options.riseRate, 0);
    if (targetRiseRate !== 0) {
        if (typeof riseRate === "number") {
            riseRate += targetRiseRate;
        } else if (riseRate?.list) {
            riseRate.list.forEach(item => { item.value += targetRiseRate; });
        }
    }

    // 5. Build computedProperties containing all evaluated per-particle values
    const cp = {
        type: options.type,
        emitter: options.emitter,
        freezeOnPause: options.freezeOnPause,
        isElevationManage,
        baseTextureWidth: options.baseTextureWidth || 32,
        source: source,
        target: target,
        sourcePos,
        elevationZ: startZ,

        // Motion parameters (all resolved: either number or { list: [{time: number, value: number}] })
        velocity: resolveScalarOrKeyframes(options.velocity, 100),
        angle: resolveScalarOrKeyframes(options.angle, 0),
        targetAngleOffset: targetAngleDeg,

        // Orbit parameters (Graviting)
        orbitAngle: (options.angleStart !== undefined)
            ? resolveNumericValue(options.angleStart, Math.random() * 360)
            : (options.angle !== undefined ? resolveNumericValue(options.angle, Math.random() * 360) : Math.random() * 360),
        angularVelocity: resolveScalarOrKeyframes(options.angularVelocity ?? options.velocity, 90),
        radius: resolveScalarOrKeyframes(options.radius, 50),
        riseRate,
        axisElevationAngle: resolveNumericValue(options.axisElevationAngle, 0),

        // Path parameters (Missile)
        path: options.path,
        pathDistance: 0,

        // Vibration
        vibrationAmplitude: options.vibrationAmplitude ? resolveScalarOrKeyframes(options.vibrationAmplitude, 0) : null,
        vibrationFrequency: options.vibrationFrequency ? resolveScalarOrKeyframes(options.vibrationFrequency, 1000) : null,
        vibrationElapsed: 0,

        // Aesthetics
        particleSize: options.particleSize ? resolveScalarOrKeyframes(options.particleSize, 10) : null,
        particleRotation: options.particleRotation ? resolveScalarOrKeyframes(options.particleRotation, 0) : null,
        particleColor: resolveColorProperty(options.particleColor),
        alpha: options.alpha ? resolveScalarOrKeyframes(options.alpha, 1) : null,

        // Lifetime
        lifetimeMs: options.lifetimeMs || 3000,

        // Workflows
        emitterId: options.emitterId,
        particleTemplate: options.particleTemplate
    };

    particle.computedProperties = cp;

    // Apply initial coordinates and sprite state
    particle.x = startX;
    particle.y = startY;
    particle._elevationZ = startZ;
    particle._elapsedSec = 0;

    if (cp.isElevationManage) {
        particle.elevation = startZ / Utils.pixelOfDistanceConvertor();
        particle.sortLayer = 950;
    }

    // Helper for workflows to query particle position
    particle.getPosition = () => new Vector3(particle.x, particle.y, particle.computedProperties.elevationZ);

    // Initial scale at progress = 0
    if (cp.particleSize) {
        const px0 = interpolateScalar(cp.particleSize, 0, 10);
        const baseScale0 = px0 / cp.baseTextureWidth;
        const sizeFactor0 = cp.isElevationManage ? Utils.handleElevationFactorForSize(cp.elevationZ) : 1;
        const finalScale0 = (sizeFactor0 > 0 && isFinite(sizeFactor0)) ? baseScale0 * sizeFactor0 : baseScale0;
        if (particle.scale?.set) {
            particle.scale.set(finalScale0);
        } else {
            particle.scale = finalScale0;
        }
    }

    // Initial tint at progress = 0
    if (cp.particleColor) {
        particle.tint = interpolateColor(cp.particleColor, 0);
    }

    // Initial alpha at progress = 0
    if (cp.alpha) {
        particle.alpha = interpolateScalar(cp.alpha, 0, 1);
    }

    // Initial rotation at progress = 0
    if (cp.type === "Missile" && cp.path) {
        const headingDeg = cp.path.getDirection();
        if (!isNaN(headingDeg)) {
            particle.rotation = headingDeg * (Math.PI / 180);
        }
    } else {
        const angleDeg0 = interpolateScalar(cp.angle, 0, 0) + (cp.targetAngleOffset ?? 0);
        let rot0 = angleDeg0 * (Math.PI / 180);
        if (cp.particleRotation) {
            rot0 += interpolateScalar(cp.particleRotation, 0, 0) * (Math.PI / 180);
        }
        particle.rotation = rot0;
    }

    // Trigger AT_PARTICLE_START chained workflows
    if (cp.emitterId && cp.particleTemplate) {
        ParticleWorkFlowManager.triggerWorkflows(
            ParticleWorkFlowManager.NEXT_WORKFLOW_TYPES.AT_PARTICLE_START,
            cp.emitterId,
            cp.particleTemplate,
            particle
        );
    }
}

/**
 * Updates particle position, rotation, scale, tint, and elevation per frame tick within ParticleGenerator.
 * Consumes strictly from `particle.computedProperties` without using uncomputed options or strings.
 * @param {Object} particle - Active particle instance.
 * @param {number|Object} context - Frame delta time in seconds, milliseconds, or ticker context.
 * @param {Object} [options] - Compiled generator strategy options (fallback only).
 * @returns {void}
 */
export function onParticleUpdate(particle, context, options) {
    let cp = particle.computedProperties;
    if (!cp) return;

    if (cp.emitter?.isPaused || (cp.freezeOnPause && game?.paused)) {
        return;
    }

    // Frame delta time calculation
    let deltaSec;
    if (typeof context === "number") {
        deltaSec = context > 1 ? context / 1000 : context;
    } else if (context && typeof context.delta === "number") {
        deltaSec = context.delta > 1 ? context.delta / 1000 : context.delta;
    } else if (context && typeof context.deltaTime === "number") {
        deltaSec = context.deltaTime / 60;
    } else if (canvas.app?.ticker?.deltaMS) {
        deltaSec = canvas.app.ticker.deltaMS / 1000;
    } else {
        deltaSec = 0.016;
    }
    const deltaMs = deltaSec * 1000;

    particle._elapsedSec = (particle._elapsedSec ?? 0) + deltaSec;
    const totalLifetime = particle.lifetime || (cp.lifetimeMs ? cp.lifetimeMs / 1000 : 3);
    const elapsed = (typeof particle.time === "number") ? particle.time : particle._elapsedSec;
    const progress = totalLifetime > 0 ? Math.min(1, Math.max(0, elapsed / totalLifetime)) : 0;

    // 1. Motion Strategy using exclusively computedProperties
    if (cp.type === "Graviting" || cp.type === "Gravitating") {
        const sourcePos = Utils.getSourcePosition(cp.source, cp.isElevationManage, true);
        if (!sourcePos) {
            particle.life = 0;
            return;
        }

        const currentAngularVel = interpolateScalar(cp.angularVelocity, progress, 90);
        cp.orbitAngle = (cp.orbitAngle ?? 0) + currentAngularVel * deltaSec;

        const currentRadius = interpolateScalar(cp.radius, progress, 50);
        const currentRiseRate = Utils.handleFraction(interpolateScalar(cp.riseRate, progress, 0));

        const pos = GravitingParticle.computeParticlePosition(
            sourcePos,
            currentRadius,
            cp.orbitAngle * (Math.PI / 180),
            currentRiseRate,
            cp.axisElevationAngle ?? 0
        );

        particle.x = pos.x;
        particle.y = pos.y;
        cp.elevationZ = pos.z;

    } else if (cp.type === "Missile" && cp.path) {
        const currentVel = interpolateScalar(cp.velocity, progress, 200);
        cp.pathDistance = (cp.pathDistance ?? 0) + currentVel * deltaSec;

        const prop = cp.path.totalLenght > 0 ? Math.min(1, cp.pathDistance / cp.path.totalLenght) : 0;
        const pt = cp.path.getPointAtProportion(prop);
        if (pt) {
            particle.x = pt.x;
            particle.y = pt.y;
            if (pt.z !== undefined) cp.elevationZ = pt.z;
        }

        const headingDeg = cp.path.getDirection();
        if (!isNaN(headingDeg)) {
            particle.rotation = headingDeg * (Math.PI / 180);
        }

    } else {
        // Spraying Motion
        const currentVel = interpolateScalar(cp.velocity, progress, 100);
        let angleDeg = interpolateScalar(cp.angle, progress, 0) + (cp.targetAngleOffset ?? 0);

        const angleRad = angleDeg * (Math.PI / 180);
        const currentRiseRate = Utils.handleFraction(interpolateScalar(cp.riseRate, progress, 0));

        let horizontalMove;
        let verticalMove = 0;

        if (cp.isElevationManage && currentRiseRate !== 0) {
            const horizFactor = Math.sqrt(Math.max(0, 1 - Math.pow(currentRiseRate, 2)));
            horizontalMove = currentVel * horizFactor * deltaSec;
            verticalMove = currentVel * currentRiseRate * deltaSec;
        } else {
            horizontalMove = currentVel * deltaSec;
        }

        particle.x += Math.cos(angleRad) * horizontalMove;
        particle.y += Math.sin(angleRad) * horizontalMove;
        cp.elevationZ = (cp.elevationZ ?? 0) + verticalMove;

        let finalRotation = angleRad;
        if (cp.particleRotation) {
            finalRotation += interpolateScalar(cp.particleRotation, progress, 0) * (Math.PI / 180);
        }
        particle.rotation = finalRotation;
    }

    // 2. Lateral Sinusoidal Vibration
    if (cp.vibrationAmplitude && cp.vibrationFrequency) {
        cp.vibrationElapsed = (cp.vibrationElapsed ?? 0) + deltaMs;
        const amp = interpolateScalar(cp.vibrationAmplitude, progress, 0);
        const freq = interpolateScalar(cp.vibrationFrequency, progress, 1000);

        if (amp > 0 && freq > 0) {
            const vib = amp * Math.sin(2 * Math.PI * (cp.vibrationElapsed / freq));
            const heading = particle.rotation ?? 0;
            particle.x += vib * Math.cos(heading - (Math.PI / 2));
            particle.y += vib * Math.sin(heading - (Math.PI / 2));
        }
    }

    // 3. Elevation & Depth Sorting
    if (cp.isElevationManage) {
        particle.elevation = cp.elevationZ / Utils.pixelOfDistanceConvertor();
        particle.sortLayer = 950;
    }

    // 4. Scale & Perspective Factor
    if (cp.particleSize) {
        const px = interpolateScalar(cp.particleSize, progress, 10);
        const baseScale = px / cp.baseTextureWidth;

        const sizeFactor = cp.isElevationManage
            ? Utils.handleElevationFactorForSize(cp.elevationZ)
            : 1;

        const finalScale = (sizeFactor > 0 && isFinite(sizeFactor)) ? baseScale * sizeFactor : baseScale;
        if (particle.scale?.set) {
            particle.scale.set(finalScale);
        } else {
            particle.scale = finalScale;
        }
    }

    // 5. Color Tint Keyframes
    if (cp.particleColor) {
        particle.tint = interpolateColor(cp.particleColor, progress);
    }

    // 6. Alpha Keyframes
    if (cp.alpha) {
        particle.alpha = interpolateScalar(cp.alpha, progress, 1);
    }

    // Keep particle._elevationZ synced for external callers
    particle._elevationZ = cp.elevationZ;
}

/**
 * Handles particle expiration callback within ParticleGenerator to trigger chained workflows.
 * @param {Object} particle - Dying particle instance being recycled.
 * @param {Object} [options] - Compiled generator strategy options.
 * @returns {void}
 */
export function onParticleDeath(particle, options) {
    const cp = particle.computedProperties;
    const emitterId = cp?.emitterId ?? options?.emitterId;
    const particleTemplate = cp?.particleTemplate ?? options?.particleTemplate;

    if (emitterId && particleTemplate) {
        // Trigger AT_PARTICLE_END chained workflows at the dying particle's exact coordinate
        ParticleWorkFlowManager.triggerWorkflows(
            ParticleWorkFlowManager.NEXT_WORKFLOW_TYPES.AT_PARTICLE_END,
            emitterId,
            particleTemplate,
            particle
        );
    }
}

