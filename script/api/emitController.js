import * as particlesEmitterService from "../service/particlesEmitter.service.js"
import { s_MESSAGE_TYPES, emitForOtherClient } from "../utils/socketManager.js"

export default {
    spray : sprayParticles,
    gravit : gravitateParticles,
    missile : missileParticles,
    stop : stopEmissionById,
    stopAll : stopAllEmission,
    stopWorkflow : stopWorkflow,
    writeMessage: particlesEmitterService.writeMessageForEmissionById,   //No need to emit to other client
  };

/**
 * Triggers a spray particle emission and broadcasts to connected clients via socket.
 * @param {...Object} args - Emission configuration arguments.
 * @returns {number|string|undefined} Created emitter ID.
 */
function sprayParticles(...args){
    let emitterId = { emitterId: particlesEmitterService.nextEmitterId() }
    emitForOtherClient(s_MESSAGE_TYPES.sprayParticles, [...args, emitterId]); 
    return particlesEmitterService.sprayParticles(...args, emitterId)?.id
}

//TODO concentring not work on client
/**
 * Triggers a gravitating particle emission and broadcasts to connected clients.
 * @param {...Object} args - Emission configuration arguments.
 * @returns {number|string|undefined} Created emitter ID.
 */
function gravitateParticles(...args){
    let emitterId = { emitterId: particlesEmitterService.nextEmitterId() }
    emitForOtherClient(s_MESSAGE_TYPES.gravitateParticles, [...args, emitterId]); 
    return particlesEmitterService.gravitateParticles(...args, emitterId)?.id
}
  
/**
 * Triggers a missile particle emission and broadcasts to connected clients.
 * @param {...Object} args - Emission configuration arguments.
 * @returns {number|string|undefined} Created emitter ID.
 */
function missileParticles(...args){
    let emitterId = { emitterId: particlesEmitterService.nextEmitterId() }
    emitForOtherClient(s_MESSAGE_TYPES.missileParticles, [...args, emitterId]); 
    return particlesEmitterService.missileParticles(...args, emitterId)?.id
}

/**
 * Stops an emission by its ID and notifies other clients.
 * @param {number|string} emitterId - Target emitter ID.
 * @param {boolean} [immediate] - If true, stops immediately without fade.
 * @returns {Array<number|string>} List or result of stopped emitters.
 */
function stopEmissionById(emitterId, immediate){
    emitForOtherClient(s_MESSAGE_TYPES.stopEmissionById, {emitterId, immediate}); 
    return particlesEmitterService.stopEmissionById(emitterId, immediate)
}
  
/**
 * Stops all active emissions and resets emitter IDs.
 * @param {boolean} [immediate] - If true, stops immediately.
 * @returns {Array<number|string>} List of stopped emitters.
 */
function stopAllEmission(immediate){
    particlesEmitterService.resetEmitterId()
    emitForOtherClient(s_MESSAGE_TYPES.stopAllEmission, immediate); 
    return particlesEmitterService.stopAllEmission(immediate)
}

/**
 * Stops a specific particle workflow.
 * @param {number|string} emitterId - Emitter or workflow ID.
 * @param {boolean} [immediate] - If true, stops immediately.
 * @param {boolean} [all] - If true, stops all sub-emitters in the workflow.
 * @returns {string|undefined} Result of workflow stop operation.
 */
function stopWorkflow(emitterId, immediate, all) {
    emitForOtherClient(s_MESSAGE_TYPES.stopWorkflow, immediate, all); 
    return particlesEmitterService.stopWorkflow(emitterId, immediate, all)
}
