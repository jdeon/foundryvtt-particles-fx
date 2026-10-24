import { Utils, s_MODULE_ID, Vector3 } from "../utils/utils.js";
import { onParticleSpawn, onParticleUpdate, onParticleDeath } from "./particleGeneratorStrategies.js";

export const SPRITE_TEXTURE_PATHS = {
    CIRCLE: `modules/${s_MODULE_ID}/sprite/circle-sprite-particle.png`,
    TOR: `modules/${s_MODULE_ID}/sprite/tor-sprite-particle.png`,
    STAR: `modules/${s_MODULE_ID}/sprite/star-sprite-particle.png`,
    DIAMOND: `modules/${s_MODULE_ID}/sprite/diamond-sprite-particle.png`
};

const BASE_TEXTURE_WIDTH = 32;

/**
 * Converts color representation (Vector3, RGB array, object, or string) to a hex string (#RRGGBB).
 * @param {Vector3|Array<number>|Object|string} val - Source color representation.
 * @returns {string} Hexadecimal color string.
 */
function toColorHex(val) {
    if (typeof val === "string") {
        if (val.startsWith("#")) return val;
        if (val.startsWith("0x")) return `#${val.slice(2)}`;
    }
    if (val instanceof Vector3 || (typeof val === "object" && val !== null && val.x !== undefined)) {
        const r = Math.min(255, Math.max(0, Math.floor(val.x)));
        const g = Math.min(255, Math.max(0, Math.floor(val.y)));
        const b = Math.min(255, Math.max(0, Math.floor(val.z)));
        return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    }
    if (Array.isArray(val) && val.length >= 3) {
        const r = Math.min(255, Math.max(0, Math.floor(val[0])));
        const g = Math.min(255, Math.max(0, Math.floor(val[1])));
        const b = Math.min(255, Math.max(0, Math.floor(val[2])));
        return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    }
    return "#ffffff";
}

/**
 * Converts size value in pixels to engine scale factor relative to 32px base texture width.
 * @param {number|Vector3|Object} val - Size value in pixels.
 * @returns {number} Scale factor.
 */
function toScaleValue(val) {
    if (typeof val === "object" && val !== null && val.x !== undefined) {
        return Math.max(0.001, Number(val.x) / BASE_TEXTURE_WIDTH);
    }
    const num = Number(val);
    return Math.max(0.001, (isNaN(num) ? 10 : num) / BASE_TEXTURE_WIDTH);
}

/**
 * Evaluates whether a property configuration matches engine-compatible patterns:
 * 1. "fixed": one fixed value
 * 2. "range": one value with "_" for a randomized boundary (or [min, max])
 * 3. "curve": begin and end fixed value ({ list: [{ time: 0, value: v0 }, { time: 1, value: v1 }] })
 *
 * @param {*} prop - Property value or { list: [{ time, value }] }
 * @returns {{ type: "fixed"|"range"|"curve", value?: *, min?: number, max?: number, start?: *, end?: *, time0?: number, time1?: number }|null}
 */
export function checkEngineCompatibility(prop) {
    if (prop === undefined || prop === null) return null;

    if (typeof prop === "function") return null;
    if (typeof prop === "string" && /\{\{.+?\}\}/.test(prop)) return null;

    if (typeof prop === "number") {
        return { type: "fixed", value: prop };
    }

    if (typeof prop === "string") {
        if (prop.includes("_")) {
            const parts = prop.split("_");
            if (parts.length === 2) {
                const min = Utils._managePercent ? (Utils._managePercent(parts[0]) ?? Number(parts[0])) : Number(parts[0]);
                const max = Utils._managePercent ? (Utils._managePercent(parts[1]) ?? Number(parts[1])) : Number(parts[1]);
                if (!isNaN(min) && !isNaN(max)) {
                    return { type: "range", min: Math.min(min, max), max: Math.max(min, max) };
                }
            }
        }
        const num = Number(prop);
        if (!isNaN(num)) return { type: "fixed", value: num };
        return { type: "fixed", value: prop };
    }

    if (Array.isArray(prop)) return null;

    if (prop instanceof Vector3) {
        if (!isNaN(prop.x) && !isNaN(prop.y) && !isNaN(prop.z)) {
            return { type: "fixed", value: prop };
        } else {
            return null;
        }
    }

    if (!prop.list) return null;

    if (prop.list.length === 1) {
        const itemVal = prop.list[0].value;
        return checkEngineCompatibility(itemVal);
    }

    if (prop.list.length === 2) {
        const v0 = prop.list[0].value;
        const v1 = prop.list[1].value;

        if (typeof v0 === "function" || typeof v1 === "function") return null;
        if (typeof v0 === "string" && (/\{\{.+?\}\}/.test(v0) || v0.includes("_"))) return null;
        if (typeof v1 === "string" && (/\{\{.+?\}\}/.test(v1) || v1.includes("_"))) return null;
        if ((v0 instanceof Vector3 || v1 instanceof Vector3) && (isNaN(v0.x) || isNaN(v0.y) || isNaN(v0.z) || isNaN(v1.x) || isNaN(v1.y) || isNaN(v1.z))) return null;

        return {
            type: "curve",
            start: v0,
            end: v1,
            time0: Number(prop.list[0].time) || 0,
            time1: Number(prop.list[1].time) || 1
        };
    }

    return null;
}

/**
 * Compiles a normalized Particles FX finalInput configuration into a configuration object
 * suitable for Foundry VTT v14's native foundry.canvas.animation.ParticleGenerator.
 */
export class ConfigCompiler {

    /**
     * Translates normalized finalInput into a ParticleGenerator configuration object.
     * @param {Object} finalInput - Normalized query configuration.
     * @param {string} [emissionType="Spraying"] - Archetype: "Spraying", "Graviting", or "Missile".
     * @param {Object} [context={}] - Context metadata (emitterId, particleTemplate).
     * @returns {Object} Complete ParticleGenerator options object.
     */
    static compile(finalInput, emissionType = "Spraying", context = {}) {
        const isElevationManage = Boolean(finalInput.isElevationManage ?? game.settings?.get(s_MODULE_ID, "activateElevation"));
        const effectiveType = finalInput.type || emissionType;

        // 2. Textures path array
        const shapeKey = (typeof finalInput.particleShape === "string" ? finalInput.particleShape.toUpperCase() : "CIRCLE");
        const texturePath = SPRITE_TEXTURE_PATHS[shapeKey] || SPRITE_TEXTURE_PATHS.CIRCLE;

        // 3. Target particle count and emission duration
        const maxParticles = Math.max(1, Number(finalInput.maxParticles) || 1000);
        const emissionDuration = (finalInput.emissionDuration && !isNaN(finalInput.emissionDuration))
            ? Number(finalInput.emissionDuration)
            : undefined;

        // 5. Pre-calculate target offset if aimed spray
        let targetAngleOffset;
        if (finalInput.target && finalInput.source) {
            const srcPos = Utils.getSourcePosition(finalInput.source, isElevationManage, true);
            const tgtPos = Utils.getSourcePosition(finalInput.target, isElevationManage, true);
            if (srcPos && tgtPos && (srcPos.x !== tgtPos.x || srcPos.y !== tgtPos.y)) {
                targetAngleOffset = Math.atan2(tgtPos.y - srcPos.y, tgtPos.x - srcPos.x) * (180 / Math.PI);
            }
        }

        // 6. Compile engine-compatible properties
        // Lifetime
        let nativeLifetime = 3000;
        const lifetimeComp = checkEngineCompatibility(finalInput.particleLifetime);
        if (lifetimeComp) {
            if (lifetimeComp.type === "fixed") {
                nativeLifetime = Math.max(1, Number(lifetimeComp.value) || 3000);
            } else if (lifetimeComp.type === "range") {
                nativeLifetime = { min: Math.max(1, lifetimeComp.min), max: Math.max(1, lifetimeComp.max) };
            }
        } else if (finalInput.particleLifetime && !isNaN(finalInput.particleLifetime)) {
            nativeLifetime = Math.max(1, Number(finalInput.particleLifetime));
        }

        // Alpha
        let nativeAlpha;
        const alphaComp = checkEngineCompatibility(finalInput.alpha);
        const isAlphaNative = Boolean(alphaComp);
        if (alphaComp) {
            if (alphaComp.type === "fixed") {
                nativeAlpha = Math.min(1, Math.max(0, Number(alphaComp.value)));
            } else if (alphaComp.type === "range") {
                nativeAlpha = { min: Math.min(1, Math.max(0, alphaComp.min)), max: Math.min(1, Math.max(0, alphaComp.max)) };
            } else if (alphaComp.type === "curve") {
                nativeAlpha = {
                    curve: [
                        { time: alphaComp.time0, value: Math.min(1, Math.max(0, Number(alphaComp.start))) },
                        { time: alphaComp.time1, value: Math.min(1, Math.max(0, Number(alphaComp.end))) }
                    ]
                };
            }
        }

        // ParticleSize (Scale)
        let nativeScale;
        const hasElevationRise = isElevationManage && finalInput.particleRiseRate && (
            (typeof finalInput.particleRiseRate === "number" && finalInput.particleRiseRate !== 0) ||
            (finalInput.particleRiseRate.list?.some(k => k.value !== 0))
        );
        const sizeComp = checkEngineCompatibility(finalInput.particleSize);
        const isSizeNative = Boolean(sizeComp && !hasElevationRise);
        if (isSizeNative) {
            if (sizeComp.type === "fixed") {
                nativeScale = toScaleValue(sizeComp.value);
            } else if (sizeComp.type === "range") {
                nativeScale = { min: Math.max(0.001, sizeComp.min / BASE_TEXTURE_WIDTH), max: Math.max(0.001, sizeComp.max / BASE_TEXTURE_WIDTH) };
            } else if (sizeComp.type === "curve") {
                nativeScale = {
                    curve: [
                        { time: sizeComp.time0, value: toScaleValue(sizeComp.start) },
                        { time: sizeComp.time1, value: toScaleValue(sizeComp.end) }
                    ]
                };
            }
        }

        // ParticleColor (Tint)
        let nativeTint;
        const colorComp = checkEngineCompatibility(finalInput.particleColor);
        const isColorNative = Boolean(colorComp);
        if (colorComp) {
            if (colorComp.type === "fixed") {
                nativeTint = toColorHex(colorComp.value);
            } else if (colorComp.type === "curve") {
                nativeTint = {
                    curve: [
                        { time: colorComp.time0, value: toColorHex(colorComp.start) },
                        { time: colorComp.time1, value: toColorHex(colorComp.end) }
                    ]
                };
            }
        }

        // ParticleRotation
        let nativeRotation;
        const isMissileType = (effectiveType.toLowerCase() === "missile");
        const rotComp = !isMissileType && !targetAngleOffset ? checkEngineCompatibility(finalInput.particleRotation) : null;
        const isRotNative = Boolean(rotComp);
        if (rotComp) {
            if (rotComp.type === "fixed") {
                nativeRotation = Number(rotComp.value) || 0;
            } else if (rotComp.type === "range") {
                nativeRotation = { min: rotComp.min, max: rotComp.max };
            } else if (rotComp.type === "curve") {
                nativeRotation = {
                    curve: [
                        { time: rotComp.time0, value: Number(rotComp.start) || 0 },
                        { time: rotComp.time1, value: Number(rotComp.end) || 0 }
                    ]
                };
            }
        }

        // ParticleVelocity & Angle
        let nativeVelocity;
        const isSprayType = (effectiveType === "Spraying" || effectiveType === "spray" || !effectiveType);
        const hasRise = finalInput.particleRiseRate && (
            (typeof finalInput.particleRiseRate === "number" && finalInput.particleRiseRate !== 0) ||
            (finalInput.particleRiseRate.list?.some(k => k.value !== 0))
        );
        const canUseNativeVelocity = isSprayType && !targetAngleOffset && !hasRise && !finalInput.vibrationAmplitude;
        const velComp = canUseNativeVelocity ? checkEngineCompatibility(finalInput.particleVelocity) : null;
        const angleComp = canUseNativeVelocity ? checkEngineCompatibility(finalInput.particleAngle) : null;
        const isVelocityNative = Boolean(velComp && angleComp);

        if (isVelocityNative) {
            let speed;
            if (velComp.type === "fixed") {
                speed = Number(velComp.value) || 0;
            } else if (velComp.type === "range") {
                speed = { min: velComp.min, max: velComp.max };
            } else if (velComp.type === "curve") {
                speed = {
                    curve: [
                        { time: velComp.time0, value: Number(velComp.start) || 0 },
                        { time: velComp.time1, value: Number(velComp.end) || 0 }
                    ]
                };
            }

            let angle;
            if (angleComp.type === "fixed") {
                angle = Number(angleComp.value) || 0;
            } else if (angleComp.type === "range") {
                angle = [angleComp.min, angleComp.max];
            } else if (angleComp.type === "curve") {
                angle = {
                    curve: [
                        { time: angleComp.time0, value: Number(angleComp.start) || 0 },
                        { time: angleComp.time1, value: Number(angleComp.end) || 0 }
                    ]
                };
            }

            nativeVelocity = { polar: { speed, angle } };
        }

        // 7. Strategy Options bundle passed to lifecycle hooks (omit engine-compatible properties)
        const strategyOptions = {
            type: effectiveType,
            source: finalInput.source ?? finalInput.center,
            target: finalInput.target,
            _targetAngleOffset: targetAngleOffset,
            isElevationManage,
            velocity: isVelocityNative ? undefined : finalInput.particleVelocity,
            angle: isVelocityNative ? undefined : finalInput.particleAngle,
            angleStart: isVelocityNative ? undefined : (finalInput.angleStart ?? finalInput.angle),
            angularVelocity: finalInput.angularVelocity ?? finalInput.particleVelocity,
            radius: finalInput.particleRadius,
            riseRate: finalInput.particleRiseRate,
            axisElevationAngle: finalInput.axisElevationAngle ?? 0,
            path: finalInput.path,
            positionSpawning: finalInput.positionSpawning,
            particleRotation: isRotNative ? undefined : finalInput.particleRotation,
            vibrationAmplitude: finalInput.vibrationAmplitude,
            vibrationFrequency: finalInput.vibrationFrequency,
            particleSize: isSizeNative ? undefined : finalInput.particleSize,
            particleColor: isColorNative ? undefined : finalInput.particleColor,
            alpha: isAlphaNative ? undefined : finalInput.alpha,
            emitterId: context.emitterId,
            particleTemplate: context.particleTemplate,
            advanced: finalInput.advanced,
            freezeOnPause: Boolean(finalInput.freezeOnPause)
        };

        const generatorConfig = {
            mode: "ambiant",
            manual: true, // Manual mode: spawning is controlled directly by NativeParticlesEmitter based on spawn rate
            count: maxParticles,
            lifetime: nativeLifetime,
            textures: [texturePath],
            emissionDuration,
            spawningFrequence: Number(finalInput.spawningFrequence) || 16,
            spawningNumber: Number(finalInput.spawningNumber) || 1,
            freezeOnPause: Boolean(finalInput.freezeOnPause),
            strategyOptions,
            onSpawn: (particle) => onParticleSpawn(particle, strategyOptions),
            onUpdate: (particle, context) => onParticleUpdate(particle, context, strategyOptions),
            onDeath: (particle) => onParticleDeath(particle, strategyOptions)
        };

        if (nativeScale !== undefined) generatorConfig.scale = nativeScale;
        if (nativeAlpha !== undefined) generatorConfig.alpha = nativeAlpha;
        if (nativeTint !== undefined) generatorConfig.tint = nativeTint;
        if (nativeRotation !== undefined) generatorConfig.rotation = nativeRotation;
        if (nativeVelocity !== undefined) generatorConfig.velocity = nativeVelocity;

        return generatorConfig;
    }
}
