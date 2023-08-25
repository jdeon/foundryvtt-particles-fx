import * as particlesEmitterService from "../service/particlesEmitter.service.js"
import { s_MESSAGE_TYPES, emitForOtherClient } from "../utils/socketManager.js"

export default {
    spray : sprayParticles,
    gravit : gravitateParticles,
    missile : missileParticles,
    stop : stopEmissionById,
    stopAll : stopAllEmission,
    writeMessage: particlesEmitterService.writeMessageForEmissionById,   //No need to emit to other client
  };

function sprayParticles(...args){
    let emitterId = { emitterId: particlesEmitterService.nextEmitterId() }
    emitForOtherClient(s_MESSAGE_TYPES.sprayParticles, args, emitterId); 
    return particlesEmitterService.sprayParticles(...args, emitterId)
}

function gravitateParticles(...args){
    let emitterId = { emitterId: particlesEmitterService.nextEmitterId() }
    emitForOtherClient(s_MESSAGE_TYPES.gravitateParticles, args, emitterId); 
    return particlesEmitterService.gravitateParticles(...args, emitterId)
}
  
function missileParticles(...args){
    let emitterId = { emitterId: particlesEmitterService.nextEmitterId() }
    emitForOtherClient(s_MESSAGE_TYPES.missileParticles, args, emitterId); 
    return particlesEmitterService.missileParticles(...args, emitterId)
}

function stopEmissionById(emitterId, immediate){
    emitForOtherClient(s_MESSAGE_TYPES.stopEmissionById, {emitterId, immediate}); 
    return particlesEmitterService.stopEmissionById(emitterId, immediate)
}
  
function stopAllEmission(immediate){
    particlesEmitterService.resetEmitterId()
    emitForOtherClient(s_MESSAGE_TYPES.stopAllEmission, immediate); 
    return particlesEmitterService.stopAllEmission(immediate)
}
