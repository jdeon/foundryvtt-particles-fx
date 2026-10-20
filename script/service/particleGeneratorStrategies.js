import { Utils, Vector3 } from "../utils/utils.js";
import { GravitingParticle } from "../object/particle.js";
import { ParticleInput } from "../object/particleInput.js";
import { AdvancedVariable } from "../object/advancedVariable.js";
import { ParticleWorkFlowManager } from "../object/particleWorkFlow.js";

/**
 * Builds a ParticleInput instance (constant ParticleInput or keyframed FrameParticleInput)
 * for a given property key and raw input value or list.
 * Evaluates random expressions at spawn time so the particule holds concrete numeric or Vector3 values.
 * @param {string} key - Property name.
 * @param {*} rawProp - Input value (scalar, range string, Vector3, or { list: [{ time, value }] }).
 * @param {Object} [advancedVariables] - Optional advanced variables map.
 * @param {number|Vector3} [defaultValue=0] - Fallback default value.
 * @param {boolean} [isColor=false] - Whether this property represents an RGB color.
 * @returns {ParticleInput} Instantiated ParticleInput.
 */
export function buildParticleInput(key, rawProp, advancedVariables, defaultValue = 0, isColor = false) {
    if (rawProp === undefined || rawProp === null) {
        return new ParticleInput(key, isColor ? new Vector3(255, 255, 255) : defaultValue);
    }
    if (rawProp instanceof ParticleInput) {
        return rawProp.clone();
    }

    const list = rawProp.list ?? (Array.isArray(rawProp) && rawProp.length > 0 && typeof rawProp[0] === "object" && rawProp[0] !== null && "time" in rawProp[0] ? rawProp : null);

    if (list) {
        const resolvedList = list.map(item => {
            const resolved = Utils.getRandomValueFrom(item.value, advancedVariables);
            return {
                time: Number(item.time) || 0,
                value: resolved
            };
        });
        return ParticleInput.build(key, { list: resolvedList }, rawProp, advancedVariables);
    }

    let resolved = Utils.getRandomValueFrom(rawProp, advancedVariables);
    return ParticleInput.build(key, resolved, rawProp, advancedVariables);
}



/**
 * Configures particle state upon spawn within ParticleGenerator.
 * Fully computes all random ranges, percentages, string expressions, and keyframes,
 * storing them as ParticleInput instances on `particle.computedProperties` to match legacy emitters.
 * @param {Object} particle - Spawned particle sprite instance.
 * @param {Object} options - Compiled generator strategy options.
 * @returns {void}
 */
export function onParticleSpawn(particle, options) {
    const isElevationManage = Boolean(options.isElevationManage);

    // 1. Extract or compute advanced variables
    const advancedVariables = AdvancedVariable.computeAdvancedVariables(
        options.particleTemplate?.advanced?.variables ?? options.advanced?.variables
    );

    // 2. Resolve template properties if template is present
    const template = options.particleTemplate;
    const templateProps = template ? Utils.getObjectRandomValueFrom(template, advancedVariables, true) : null;

    // 3. Resolve source position
    const rawSource = templateProps?.source?.currentValue ?? options.source;
    const source = Utils.getRandomValueFrom(rawSource, advancedVariables);
    const sourcePos = Utils.getSourcePosition(source, isElevationManage, true) || { x: 0, y: 0, z: 0 };

    // 4. Resolve spawn position offset (e.g. positionSpawning: { x: '-10%_10%', y: '-10%_10%', z: 0 })
    let spawnOffset = Utils.getObjectRandomValueFrom(templateProps?.positionSpawning?.currentValue ?? options.positionSpawning, advancedVariables);

    // 5. Compute target angle offset and aim if target exists
    let targetAngleDirection = 0;
    let targetRiseRate = 0;

    const rawTarget = templateProps?.target?.currentValue ?? options.target;
    const target = Utils.getRandomValueFrom(rawTarget, advancedVariables);
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

    // 6. Build ParticleInput instances for all animatable properties
    const particleVelocity = templateProps?.particleVelocity ?? buildParticleInput("particleVelocity", options.velocity ?? options.particleVelocity, advancedVariables, 100);
    const particleAngle = templateProps?.particleAngle ?? buildParticleInput("particleAngle", options.angle ?? options.particleAngle, advancedVariables, 0);
    const particleRiseRate = templateProps?.particleRiseRate ?? buildParticleInput("particleRiseRate", options.riseRate ?? options.particleRiseRate, advancedVariables, 0);
    const particleRotation = templateProps?.particleRotation ?? buildParticleInput("particleRotation", options.particleRotation, advancedVariables, 0);
    const particleSize = templateProps?.particleSize ?? buildParticleInput("particleSize", options.particleSize, advancedVariables, 10);
    const particleColor = templateProps?.particleColor ?? buildParticleInput("particleColor", options.particleColor, advancedVariables, new Vector3(255, 255, 255), true);
    const alpha = templateProps?.alpha ?? buildParticleInput("alpha", options.alpha, advancedVariables, 1);
    const angularVelocity = templateProps?.angularVelocity ?? buildParticleInput("angularVelocity", options.angularVelocity ?? options.velocity, advancedVariables, 90);
    const particleRadius = templateProps?.particleRadius ?? buildParticleInput("particleRadius", options.radius ?? options.particleRadius, advancedVariables, 50);

    const vibrationAmplitude = (templateProps?.vibrationAmplitude || options.vibrationAmplitude)
        ? (templateProps?.vibrationAmplitude ?? buildParticleInput("vibrationAmplitude", options.vibrationAmplitude, advancedVariables, 0))
        : null;
    const vibrationFrequency = (templateProps?.vibrationFrequency || options.vibrationFrequency)
        ? (templateProps?.vibrationFrequency ?? buildParticleInput("vibrationFrequency", options.vibrationFrequency, advancedVariables, 1000))
        : null;

    // 7. Apply target offsets directly to ParticleInput instances
    if (targetRiseRate !== 0) {
        particleRiseRate.add(targetRiseRate);
    }

    if (options.type === "Spraying" || !options.type) {
        if (targetAngleDeg !== 0) {
            particleAngle.add(targetAngleDeg);
            particleRotation.add(targetAngleDeg);
        }
    }

    let orbitAngle = 0;
    if (options.type === "Graviting" || options.type === "Gravitating") {
        orbitAngle = (options.angleStart !== undefined)
            ? Number(Utils.getRandomValueFrom(options.angleStart, advancedVariables)) || (Math.random() * 360)
            : (Number(Utils.getRandomValueFrom(options.angle, advancedVariables)) || (Math.random() * 360));
    }

    // 8. Build computedProperties storing ParticleInput instances
    const cp = {
        type: options.type,
        emitter: options.emitter,
        freezeOnPause: options.freezeOnPause,
        isElevationManage,
        source,
        target,
        sourcePos,
        elevationZ: startZ,
        positionVibrationLess: { x: startX, y: startY, z: startZ },

        // Motion ParticleInput instances & backwards-compatible aliases
        particleVelocity,
        velocity: particleVelocity,
        particleAngle,
        angle: particleAngle,
        targetAngleOffset: targetAngleDeg,

        // Orbit ParticleInput instances & aliases
        orbitAngle,
        angularVelocity,
        particleRadius,
        radius: particleRadius,
        particleRiseRate,
        riseRate: particleRiseRate,
        axisElevationAngle: Number(Utils.getRandomValueFrom(options.axisElevationAngle ?? 0, advancedVariables)) || 0,

        // Path parameters (Missile)
        path: options.path,
        pathDistance: 0,

        // Lateral Sinusoidal Vibration
        vibrationAmplitude,
        vibrationFrequency,
        vibrationElapsed: 0,

        // Aesthetics ParticleInput instances
        particleSize,
        particleRotation,
        particleColor,
        alpha,

        // Lifetime & Workflows
        lifetimeMs: options.lifetimeMs || 3000,
        emitterId: options.emitterId,
        particleTemplate: options.particleTemplate,
        advancedVariables
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
        const baseTextureSize = { x: particle.texture.orig.width, y: particle.texture.orig.height };
        const size0 = cp.particleSize.computeValue(0, advancedVariables);
        const px0 = (typeof size0 === "number") ? size0 : (size0?.x ?? 10);
        const py0 = (typeof size0 === "number") ? size0 : (size0?.y ?? px0);
        const baseScaleX0 = px0 / baseTextureSize.x;
        const baseScaleY0 = py0 / baseTextureSize.y;
        const sizeFactor0 = cp.isElevationManage ? Utils.handleElevationFactorForSize(startZ) : 1;
        const finalScaleX0 = (sizeFactor0 > 0 && isFinite(sizeFactor0)) ? baseScaleX0 * sizeFactor0 : baseScaleX0;
        const finalScaleY0 = (sizeFactor0 > 0 && isFinite(sizeFactor0)) ? baseScaleY0 * sizeFactor0 : baseScaleY0;
        if (particle.scale?.set) {
            particle.scale.set(finalScaleX0, finalScaleY0);
        } else {
            particle.scale = finalScaleX0;
        }
    }

    // Initial tint at progress = 0
    if (cp.particleColor) {
        const currentColor = cp.particleColor.computeValue(0, advancedVariables);
        particle.tint = Utils.fromRGB(currentColor)
    }

    // Initial alpha at progress = 0
    if (cp.alpha) {
        const a0 = cp.alpha.computeValue(0, advancedVariables);
        particle.alpha = Math.min(1, Math.max(0, typeof a0 === "number" ? a0 : 1));
    }

    // Initial rotation at progress = 0
    if (cp.type === "Missile" && cp.path) {
        const headingDeg = cp.path.getDirection();
        if (!isNaN(headingDeg)) {
            particle.rotation = headingDeg * (Math.PI / 180);
        }
    } else {
        const rot0 = cp.particleRotation.computeValue(0, advancedVariables);
        particle.rotation = rot0 * (Math.PI / 180);
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
 * Consumes strictly from `ParticleInput` instances in `particle.computedProperties`.
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

    particle._elapsedSec = (particle._elapsedSec ?? 0) + deltaSec;
    const totalLifetime = particle.lifetime || (cp.lifetimeMs ? cp.lifetimeMs / 1000 : 3);
    const elapsed = (typeof particle.time === "number") ? particle.time : particle._elapsedSec;
    const progress = totalLifetime > 0 ? Math.min(1, Math.max(0, elapsed / totalLifetime)) : 0;

    // 1. Motion Strategy using ParticleInput instances
    if (cp.type === "Graviting" || cp.type === "Gravitating") {
        const sourcePos = Utils.getSourcePosition(cp.source, cp.isElevationManage, true);
        if (!sourcePos) {
            particle.life = 0;
            return;
        }

        const currentAngularVel = cp.angularVelocity.computeValue(progress, cp.advancedVariables);
        cp.orbitAngle = (cp.orbitAngle ?? 0) + currentAngularVel * deltaSec;

        const currentRadius = cp.particleRadius.computeValue(progress, cp.advancedVariables);
        const currentRiseRate = Utils.handleFraction(cp.particleRiseRate.computeValue(progress, cp.advancedVariables));

        const pos = GravitingParticle.computeParticlePosition(
            sourcePos,
            currentRadius,
            cp.orbitAngle * (Math.PI / 180),
            currentRiseRate,
            cp.axisElevationAngle ?? 0
        );

        cp.positionVibrationLess.x = pos.x;
        cp.positionVibrationLess.y = pos.y;
        cp.positionVibrationLess.z = pos.z;
        cp.elevationZ = pos.z;

    } else if (cp.type === "Missile" && cp.path) {
        const currentVel = cp.particleVelocity.computeValue(progress, cp.advancedVariables);
        cp.pathDistance = (cp.pathDistance ?? 0) + currentVel * deltaSec;

        const prop = cp.path.totalLenght > 0 ? Math.min(1, cp.pathDistance / cp.path.totalLenght) : 0;
        const pt = cp.path.getPointAtProportion(prop);
        if (pt) {
            cp.positionVibrationLess.x = pt.x;
            cp.positionVibrationLess.y = pt.y;
            if (pt.z !== undefined) {
                cp.positionVibrationLess.z = pt.z;
                cp.elevationZ = pt.z;
            }
        }

        const headingDeg = cp.path.getDirection();
        if (!isNaN(headingDeg)) {
            particle.rotation = headingDeg * (Math.PI / 180);
        }

    } else {
        // Spraying Motion
        const currentVel = cp.particleVelocity.computeValue(progress, cp.advancedVariables);
        const angleDeg = cp.particleAngle.computeValue(progress, cp.advancedVariables);
        const angleRad = angleDeg * (Math.PI / 180);
        const currentRiseRate = Utils.handleFraction(cp.particleRiseRate.computeValue(progress, cp.advancedVariables));

        let horizontalMove;
        let verticalMove = 0;

        if (cp.isElevationManage && currentRiseRate !== 0) {
            const horizFactor = Math.sqrt(Math.max(0, 1 - Math.pow(currentRiseRate, 2)));
            horizontalMove = currentVel * horizFactor * deltaSec;
            verticalMove = currentVel * currentRiseRate * deltaSec;
        } else {
            horizontalMove = currentVel * deltaSec;
        }

        cp.positionVibrationLess.x += Math.cos(angleRad) * horizontalMove;
        cp.positionVibrationLess.y += Math.sin(angleRad) * horizontalMove;
        cp.positionVibrationLess.z = (cp.positionVibrationLess.z ?? 0) + verticalMove;
        cp.elevationZ = cp.positionVibrationLess.z;

        let rotDeg = angleDeg;
        if (cp.particleRotation) {
            rotDeg += cp.particleRotation.computeValue(progress, cp.advancedVariables);
        }
        particle.rotation = rotDeg * (Math.PI / 180);
    }

    // 2. Lateral Sinusoidal Vibration
    let vib = 0;
    if (cp.vibrationAmplitude && cp.vibrationFrequency) {
        cp.vibrationElapsed = (cp.vibrationElapsed ?? 0) + (deltaSec * 1000);
        const amp = cp.vibrationAmplitude.computeValue(progress, cp.advancedVariables);
        const freq = cp.vibrationFrequency.computeValue(progress, cp.advancedVariables);

        if (amp > 0 && freq > 0) {
            vib = amp * Math.sin(2 * Math.PI * (cp.vibrationElapsed / freq));
        }
    }

    if (vib !== 0) {
        const heading = particle.rotation ?? 0;
        particle.x = cp.positionVibrationLess.x + vib * Math.cos(heading - (Math.PI / 2));
        particle.y = cp.positionVibrationLess.y + vib * Math.sin(heading - (Math.PI / 2));
    } else {
        particle.x = cp.positionVibrationLess.x;
        particle.y = cp.positionVibrationLess.y;
    }

    // 3. Elevation & Depth Sorting
    if (cp.isElevationManage) {
        particle.elevation = cp.elevationZ / Utils.pixelOfDistanceConvertor();
        particle.sortLayer = 950;
    }

    // 4. Scale & Perspective Factor
    if (cp.particleSize) {
        const baseTextureSize = { x: particle.texture.orig.width, y: particle.texture.orig.height };
        const size = cp.particleSize.computeValue(progress, cp.advancedVariables);
        const px = (typeof size === "number") ? size : (size?.x ?? 10);
        const py = (typeof size === "number") ? size : (size?.y ?? px);
        const baseScaleX = px / baseTextureSize.x;
        const baseScaleY = py / baseTextureSize.y;

        const sizeFactor = cp.isElevationManage
            ? Utils.handleElevationFactorForSize(cp.elevationZ)
            : 1;

        const finalScaleX = (sizeFactor > 0 && isFinite(sizeFactor)) ? baseScaleX * sizeFactor : baseScaleX;
        const finalScaleY = (sizeFactor > 0 && isFinite(sizeFactor)) ? baseScaleY * sizeFactor : baseScaleY;
        if (particle.scale?.set) {
            particle.scale.set(finalScaleX, finalScaleY);
        } else {
            particle.scale = finalScaleX;
        }
    }

    // 5. Color Tint Keyframes
    if (cp.particleColor) {
        const currentColor = cp.particleColor.computeValue(progress, cp.advancedVariables);
        particle.tint = Utils.fromRGB(currentColor)
    }

    // 6. Alpha Keyframes
    if (cp.alpha) {
        const a = cp.alpha.computeValue(progress, cp.advancedVariables);
        particle.alpha = Math.min(1, Math.max(0, typeof a === "number" ? a : 1));
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
