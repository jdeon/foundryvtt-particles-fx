import { s_MODULE_ID } from "../utils/utils.js";
import { OrbitBehavior } from "./orbitBehavior.js";
import { ElevationBehavior } from "./elevationBehavior.js";
import { VibrationBehavior } from "./vibrationBehavior.js";
import { PathFollowerBehavior } from "./pathFollowerBehavior.js";
import { SprayingBehavior } from "./sprayingBehavior.js";

/**
 * Resolves the underlying Emitter class from PIXI or Foundry canvas namespace.
 * @returns {typeof import("@pixi/particle-emitter").Emitter|undefined} The Emitter constructor if available.
 */
export function getPixiEmitterClass() {
    if (typeof PIXI !== "undefined" && PIXI.particles?.Emitter) {
        return PIXI.particles.Emitter;
    }
    if (typeof foundry !== "undefined" && foundry.canvas?.ParticleEffect?.Emitter) {
        return foundry.canvas.ParticleEffect.Emitter;
    }
    if (typeof globalThis !== "undefined" && globalThis.PIXI?.particles?.Emitter) {
        return globalThis.PIXI.particles.Emitter;
    }
    return undefined;
}

/** Flag tracking whether behaviors have already been registered. */
let behaviorsRegistered = false;

/**
 * Registers all custom Particles FX behaviors into the Pixi particle emitter system.
 * Safe to call multiple times.
 * @returns {boolean} True if behaviors were successfully registered.
 */
export function registerCustomBehaviors() {
    if (behaviorsRegistered) return true;

    const EmitterClass = getPixiEmitterClass();
    if (!EmitterClass || typeof EmitterClass.registerBehavior !== "function") {
        console.warn(`${s_MODULE_ID} | Unable to register custom particle behaviors: Emitter.registerBehavior not found.`);
        return false;
    }

    try {
        EmitterClass.registerBehavior(SprayingBehavior);
        EmitterClass.registerBehavior(OrbitBehavior);
        EmitterClass.registerBehavior(ElevationBehavior);
        EmitterClass.registerBehavior(VibrationBehavior);
        EmitterClass.registerBehavior(PathFollowerBehavior);

        behaviorsRegistered = true;
        console.log(`${s_MODULE_ID} | Successfully registered custom particle behaviors (spraying, orbit, elevation, vibration, pathFollower).`);
        return true;
    } catch (err) {
        console.error(`${s_MODULE_ID} | Error registering custom particle behaviors:`, err);
        return false;
    }
}
