import * as particlesEmitterService from "../service/particlesEmitter.service.js"
import { s_MESSAGE_TYPES, emitForOtherClient } from "../utils/socketManager.js"
import { EmittersPanel } from "../object/emittersPanel.js";

export default {
    spray: sprayParticles,
    gravit: gravitateParticles,
    missile: missileParticles,
    stop: stopEmissionById,
    togglePause: togglePauseEmissionById,
    pauseAll: setPauseStateToAllEmission,
    stopAll: stopAllEmission,
    stopWorkflow: stopWorkflow,
    showManagerPanel: showEmittersPanel,
    refreshManagerPanel: refreshEmittersPanel,
    writeMessage: particlesEmitterService.writeMessageForEmissionById,   //No need to emit to other client
    getQuery: particlesEmitterService.getQuery,
    duplicate: duplicateParticles,
};

/**
 * Triggers a spray particle emission and broadcasts to connected clients via socket.
 * @param {...Object} args - Emission configuration arguments.
 * @returns {string|undefined} Created emitter ID.
 */
function sprayParticles(...args) {
    let emitterId = { emitterId: particlesEmitterService.nextEmitterId() }
    emitForOtherClient(s_MESSAGE_TYPES.sprayParticles, [...args, emitterId]);
    return particlesEmitterService.sprayParticles(...args, emitterId)?.id
}

//TODO concentring not work on client
/**
 * Triggers a gravitating particle emission and broadcasts to connected clients.
 * @param {...Object} args - Emission configuration arguments.
 * @returns {string|undefined} Created emitter ID.
 */
function gravitateParticles(...args) {
    let emitterId = { emitterId: particlesEmitterService.nextEmitterId() }
    emitForOtherClient(s_MESSAGE_TYPES.gravitateParticles, [...args, emitterId]);
    return particlesEmitterService.gravitateParticles(...args, emitterId)?.id
}

/**
 * Triggers a missile particle emission and broadcasts to connected clients.
 * @param {...Object} args - Emission configuration arguments.
 * @returns {string|undefined} Created emitter ID.
 */
function missileParticles(...args) {
    let emitterId = { emitterId: particlesEmitterService.nextEmitterId() }
    emitForOtherClient(s_MESSAGE_TYPES.missileParticles, [...args, emitterId]);
    return particlesEmitterService.missileParticles(...args, emitterId)?.id
}

/**
 * Duplicates an existing particle emission by ID with optional overrides and broadcasts to connected clients.
 * @param {string} emitterId - Target emitter ID or shortcut ('f'/'l').
 * @param {Object} [overrides={}] - Optional configuration parameters to override.
 * @returns {string|undefined} Created emitter ID.
 */
function duplicateParticles(emitterId, overrides = {}) {
    const newEmitter = particlesEmitterService.duplicateEmitter(emitterId, overrides);
    if (newEmitter) {
        const query = particlesEmitterService.getQuery(newEmitter.id, false);
        if (query) {
            const messageType = query.type === "Missile"
                ? s_MESSAGE_TYPES.missileParticles
                : (query.type === "Graviting" ? s_MESSAGE_TYPES.gravitateParticles : s_MESSAGE_TYPES.sprayParticles);
            emitForOtherClient(messageType, [query, { emitterId: newEmitter.id }]);
        }
    }
    return newEmitter?.id;
}

/**
 * Stops an emission by its ID and notifies other clients.
 * @param {string} emitterId - Target emitter ID.
 * @param {boolean} [immediate] - If true, stops immediately without fade.
 * @returns {Array<string>} List or result of stopped emitters.
 */
function stopEmissionById(emitterId, immediate) {
    emitForOtherClient(s_MESSAGE_TYPES.stopEmissionById, { emitterId, immediate });
    return particlesEmitterService.stopEmissionById(emitterId, immediate)
}

/**
 * Toggles play/pause state for an emitter by ID and notifies connected clients.
 * @param {number|string} emitterId - Target emitter ID.
 * @param {boolean} [isPaused] - Optional state.
 * @returns {boolean} New paused state of the emitter.
 */
function togglePauseEmissionById(emitterId, isPaused) {
    const newState = particlesEmitterService.togglePauseEmissionById(emitterId, isPaused);
    emitForOtherClient(s_MESSAGE_TYPES.togglePauseEmissionById, { emitterId, isPaused: newState });
    return newState;
}

/**
 * Pauses or resumes all active emissions and notifies connected clients.
 * @param {boolean} [isPaused=true] - Optional state (defaults to true).
 * @returns {Array<string>} List of updated emitter IDs.
 */
function setPauseStateToAllEmission(isPaused = true) {
    const targetState = typeof isPaused === "boolean" ? isPaused : true;
    emitForOtherClient(s_MESSAGE_TYPES.pauseAllEmission, targetState);
    return particlesEmitterService.setPauseStateToAllEmission(targetState);
}

/**
 * Stops all active emissions and resets emitter IDs.
 * @param {boolean} [immediate] - If true, stops immediately.
 * @returns {Array<string>} List of stopped emitters.
 */
function stopAllEmission(immediate) {
    emitForOtherClient(s_MESSAGE_TYPES.stopAllEmission, immediate);
    return particlesEmitterService.stopAllEmission(immediate)
}

/**
 * Stops a specific particle workflow.
 * @param {string} emitterId - Emitter or workflow ID.
 * @param {boolean} [immediate] - If true, stops immediately.
 * @param {boolean} [all] - If true, stops all sub-emitters in the workflow.
 * @returns {string|undefined} Result of workflow stop operation.
 */
function stopWorkflow(emitterId, immediate, all) {
    emitForOtherClient(s_MESSAGE_TYPES.stopWorkflow, immediate, all);
    return particlesEmitterService.stopWorkflow(emitterId, immediate, all)
}

/**
 * Shows the emitters panel.
 */
function showEmittersPanel() {
    EmittersPanel.show();
}

/**
 * Refreshes the emitters panel.
 */
function refreshEmittersPanel() {
    EmittersPanel.refresh();
}
