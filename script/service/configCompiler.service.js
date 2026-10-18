import { Utils, SPRITE_TEXTURE_MAPPING, Vector3 } from "../utils/utils.js";

/**
 * Converts color representation (Vector3, RGB array, or object) to a hex color string (#RRGGBB).
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
 * Compiles a normalized Particles FX finalInput configuration into an EmitterConfigV3 object
 * suitable for @pixi/particle-emitter and foundry.canvas.ParticleEffect.
 */
export class ConfigCompiler {

    /**
     * Translates normalized finalInput and emission type into an EmitterConfigV3 JSON object.
     * @param {Object} finalInput - Normalized query configuration from Utils.normalizeStartEndProperties.
     * @param {string} [emissionType="Spraying"] - Emission archetype: "Spraying", "Graviting", or "Missile".
     * @returns {Object} Complete EmitterConfigV3 object.
     */
    static compile(finalInput, emissionType = "Spraying") {
        const isElevationManage = Boolean(finalInput.isElevationManage ?? game.settings.get("particule-fx", "activateElevation"));
        const sourcePos = Utils.getSourcePosition(finalInput.source, isElevationManage) || { x: 0, y: 0, z: 0 };

        // 1. Particle Lifetime
        let lifetime;
        if (Array.isArray(finalInput.particleLifetime)) {
            lifetime = {
                min: Number(finalInput.particleLifetime[0]) / 1000,
                max: Number(finalInput.particleLifetime[1]) / 1000
            };
        } else {
            const ltSec = Math.max(0.05, Number(finalInput.particleLifetime || 3500) / 1000);
            lifetime = { min: ltSec, max: ltSec };
        }

        // 2. Frequency & Spawn Rate
        const frequency = Math.max(0.001, (Number(finalInput.spawningFrequence) || 16) / 1000);
        const particlesPerWave = Math.max(1, Number(finalInput.spawningNumber) || 1);
        const maxParticles = Math.max(1, Number(finalInput.maxParticles) || 1000);

        // 3. Emitter Lifetime (duration)
        const emitterLifetime = (finalInput.emissionDuration && !isNaN(finalInput.emissionDuration))
            ? Math.max(0.01, Number(finalInput.emissionDuration) / 1000)
            : -1;

        // 4. Texture resolution
        const texture = Utils.getSpriteTextureFromId(finalInput.particleShape) || SPRITE_TEXTURE_MAPPING.CIRCLE;
        const baseWidth = (texture?.orig?.width || texture?.width || 32);

        // 5. Build behaviors array
        const behaviors = [];

        // Single Texture Behavior
        behaviors.push({
            type: "textureSingle",
            config: { texture }
        });

        // Alpha Behavior
        if (finalInput.alpha?.list?.length) {
            behaviors.push({
                type: "alpha",
                config: {
                    list: finalInput.alpha.list.map(kf => ({
                        time: kf.time,
                        value: Math.min(1, Math.max(0, Number(kf.value ?? 1)))
                    }))
                }
            });
        }

        // Color Behavior
        if (finalInput.particleColor?.list?.length) {
            behaviors.push({
                type: "color",
                config: {
                    list: finalInput.particleColor.list.map(kf => ({
                        time: kf.time,
                        value: toColorHex(kf.value)
                    }))
                }
            });
        }

        // Scale Behavior
        if (finalInput.particleSize?.list?.length) {
            behaviors.push({
                type: "scale",
                config: {
                    list: finalInput.particleSize.list.map(kf => {
                        const px = (typeof kf.value === "object" && kf.value !== null && kf.value.x !== undefined)
                            ? kf.value.x
                            : Number(kf.value || 10);
                        return {
                            time: kf.time,
                            value: Math.max(0.01, px / baseWidth)
                        };
                    }),
                    minMult: 1
                }
            });
        }

        // 6. Motion Behaviors according to archetype
        const effectiveType = finalInput.type || emissionType;
        if (effectiveType === "Graviting" || effectiveType === "Gravitating") {
            behaviors.push({
                type: "orbit",
                config: {
                    source: finalInput.source ?? finalInput.center,
                    angularVelocity: finalInput.angularVelocity ?? finalInput.particleVelocity,
                    radius: finalInput.particleRadius,
                    riseRate: finalInput.particleRiseRate,
                    axisElevationAngle: finalInput.axisElevationAngle ?? 0,
                    angleStart: finalInput.angleStart ?? finalInput.angle,
                    isElevationManage
                }
            });
        } else if (effectiveType === "Missile" && finalInput.path) {
            behaviors.push({
                type: "pathFollower",
                config: {
                    path: finalInput.path,
                    velocity: finalInput.particleVelocity,
                    isElevationManage
                }
            });
        } else {
            // Default Spraying motion
            behaviors.push({
                type: "spraying",
                config: {
                    velocity: finalInput.particleVelocity,
                    angle: finalInput.particleAngle,
                    riseRate: finalInput.particleRiseRate,
                    source: finalInput.source,
                    target: finalInput.target,
                    isElevationManage
                }
            });
        }

        // Elevation Behavior
        if (isElevationManage) {
            behaviors.push({
                type: "elevation",
                config: {
                    elevationStart: sourcePos.z ?? 0,
                    particleRiseRate: finalInput.particleRiseRate,
                    velocity: finalInput.particleVelocity,
                    isElevationManage: true
                }
            });
        }

        // Lateral Sinusoidal Vibration Behavior
        if (finalInput.vibrationAmplitude) {
            behaviors.push({
                type: "vibration",
                config: {
                    amplitude: finalInput.vibrationAmplitude,
                    frequency: finalInput.vibrationFrequency
                }
            });
        }

        return {
            lifetime,
            frequency,
            particlesPerWave,
            maxParticles,
            emitterLifetime,
            pos: { x: sourcePos.x, y: sourcePos.y },
            addAtBack: false,
            autoUpdate: true,
            behaviors
        };
    }
}
