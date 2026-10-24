import { ConfigCompiler } from "./configCompiler.service.js";
import { NativeParticlesEmitter } from "../object/nativeParticlesEmitter.js";
import { nextEmitterId } from "./particlesEmitter.service.js";

//TODO check all methods in advanced variable to se if some used AdvancedVariable.RESERVED_TIMED_PARAM, in that case, we have to use custom engine
/**
 * Checks if any string property in the query contains dynamic advanced variable template markers {{...}}.
 * @param {*} obj - Object or value to inspect.
 * @returns {boolean} True if timed template syntax was detected.
 */
function hasDynamicTemplateStrings(obj) {
    if (!obj) return false;
    if (typeof obj === "string") {
        return /\{\{.+?\}\}/.test(obj);
    }
    if (typeof obj === "object") {
        for (const key of Object.keys(obj)) {
            if (hasDynamicTemplateStrings(obj[key])) return true;
        }
    }
    return false;
}

/**
 * Routes particle emission requests to either the Native Core Engine or the Custom Simulation Engine.
 */
export class EmitterRouter {

    /**
     * Determines whether an emission configuration requires the specialized Custom Engine.
     * @param {Object} finalInput - Merged normalized configuration object.
     * @param {string} type - Emission type ("Spraying", "Graviting", "Missile").
     * @param {string} [parentWorkflowId] - Parent workflow identifier if spawned from a workflow step.
     * @returns {boolean} True if the custom simulation engine must handle this emission.
     */
    static requiresCustomEngine(finalInput, type, parentWorkflowId) {
        // 1. Chained workflows (atParticleEnd, atParticleStart, etc.)
        if (parentWorkflowId) return true;
        if (finalInput?.next?.length > 0) return true;

        // 2. Custom Advanced Variables
        if (finalInput?.advanced?.variables && Object.keys(finalInput.advanced.variables).length > 0) return true;

        // 3. Dynamic template evaluation {{...}}
        if (hasDynamicTemplateStrings(finalInput)) return true;

        // 4. Missile sub-particles spawning
        if (type.toLowerCase() === "missile") return true;

        return false;
    }

    /**
     * Spawns an emitter using the optimal engine.
     * @param {Object} inputQuery - Raw user query.
     * @param {Object} finalInput - Merged normalized query.
     * @param {string} type - Emission type ("Spraying", "Graviting", "Missile").
     * @param {{emitterId?: string, parentWorkflowId?: string}} [emitterIds] - Identifier object.
     * @param {Object} [particleTemplate] - ParticleTemplate instance.
     * @param {Function} fallbackCustomSpawner - Callback to spawn custom engine if required.
     * @returns {NativeParticlesEmitter|import("../object/particlesEmitter.js").default} Created emitter instance.
     */
    static spawnEmitter(inputQuery, finalInput, type, emitterIds, particleTemplate, fallbackCustomSpawner) {
        const id = emitterIds?.emitterId || nextEmitterId();

        try {
            // Compile to ParticleGenerator configuration
            const generatorConfig = ConfigCompiler.compile(finalInput, type, { emitterId: id, particleTemplate });
            return new NativeParticlesEmitter(id, generatorConfig, inputQuery, finalInput, particleTemplate);
        } catch (err) {
            console.warn("Particule FX | Failed to compile or spawn native ParticleGenerator, falling back to custom engine:", err);
            return fallbackCustomSpawner(id);
        }
    }
}
