import { Utils, s_MODULE_ID } from "../utils/utils.js";
import { onParticleSpawn, onParticleUpdate, onParticleDeath } from "./particleGeneratorStrategies.js";

export const SPRITE_TEXTURE_PATHS = {
    CIRCLE: `modules/${s_MODULE_ID}/sprite/circle-sprite-particle.png`,
    TOR: `modules/${s_MODULE_ID}/sprite/tor-sprite-particle.png`,
    STAR: `modules/${s_MODULE_ID}/sprite/star-sprite-particle.png`,
    DIAMOND: `modules/${s_MODULE_ID}/sprite/diamond-sprite-particle.png`
};

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

        // 6. Strategy Options bundle passed to lifecycle hooks
        const strategyOptions = {
            type: effectiveType,
            source: finalInput.source ?? finalInput.center,
            target: finalInput.target,
            _targetAngleOffset: targetAngleOffset,
            isElevationManage,
            velocity: finalInput.particleVelocity,
            angle: finalInput.particleAngle,
            angleStart: finalInput.angleStart ?? finalInput.angle,
            angularVelocity: finalInput.angularVelocity ?? finalInput.particleVelocity,
            radius: finalInput.particleRadius,
            riseRate: finalInput.particleRiseRate,
            axisElevationAngle: finalInput.axisElevationAngle ?? 0,
            path: finalInput.path,
            positionSpawning: finalInput.positionSpawning,
            particleRotation: finalInput.particleRotation,
            vibrationAmplitude: finalInput.vibrationAmplitude,
            vibrationFrequency: finalInput.vibrationFrequency,
            particleSize: finalInput.particleSize,
            particleColor: finalInput.particleColor,
            alpha: finalInput.alpha,
            emitterId: context.emitterId,
            particleTemplate: context.particleTemplate,
            advanced: finalInput.advanced,
            freezeOnPause: Boolean(finalInput.freezeOnPause)
        };

        // 7. Emission mode and default area configuration
        const isGravitate = (effectiveType === "Graviting" || effectiveType === "Gravitating" || effectiveType === "gravitate"); //TODO good wording
        const defaultArea = isGravitate
            ? { x: 0, y: 0, radius: Number.isNaN(finalInput.particleRadius) ? finalInput.particleRadius : 50 }
            : { x: 0, y: 0, width: 0, height: 0 };

        return {
            mode: "ambiant",
            manual: true, // Manual mode: spawning is controlled directly by NativeParticlesEmitter based on spawn rate
            count: maxParticles,
            lifetime: 3000,
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
    }
}
