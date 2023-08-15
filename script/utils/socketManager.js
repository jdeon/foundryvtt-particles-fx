import { s_MODULE_ID, s_EVENT_NAME } from "./utils.js"

/**
 * Defines the different message types that FQL sends over `game.socket`.
 */
export const s_MESSAGE_TYPES = {
    sprayParticles: 'sprayParticles',
    missileParticles: 'missileParticles',
    gravitateParticles: 'gravitateParticles',
    stopAllEmission: 'stopAllEmission',
    stopEmissionById: 'stopEmissionById',
    updateMaxEmitterId: 'updateMaxEmitterId',
    updateCustomPrefillTemplate: 'updateCustomPrefillTemplate'
  };


export function emitForOtherClient(type, payload){
    game.socket.emit(s_EVENT_NAME, {
      type: type,
      payload: payload
   });
  }
  
  /**
  * Provides the main incoming message registration and distribution of socket messages on the receiving side.
  */
export function listen() {
     game.socket.on(s_EVENT_NAME, (data) =>
     {
        if (typeof data !== 'object') { return; }
  
        if(game.settings.get(s_MODULE_ID, "avoidParticule")){ return; }
  
        try
        {
           // Dispatch the incoming message data by the message type.
           switch (data.type)
           {
              case s_MESSAGE_TYPES.sprayParticles: particlesEmitterService.sprayParticles(...data.payload); break;
              case s_MESSAGE_TYPES.missileParticles: particlesEmitterService.missileParticles(...data.payload); break;
              case s_MESSAGE_TYPES.gravitateParticles: particlesEmitterService.gravitateParticles(...data.payload); break;
              case s_MESSAGE_TYPES.stopEmissionById: particlesEmitterService.stopEmissionById(data.payload.emitterId, data.payload.immediate); break;
              case s_MESSAGE_TYPES.stopAllEmission: particlesEmitterService.stopAllEmission(data.payload); break;
              case s_MESSAGE_TYPES.updateMaxEmitterId: updateMaxEmitterId(data.payload); break;
              case s_MESSAGE_TYPES.updateCustomPrefillTemplate: updateCustomPrefillTemplate(data.payload); break;
           }
        }
        catch (err)
        {
           console.error(err);
        }
     });
  }

function updateCustomPrefillTemplate({type, operation, key, customPrefillTemplate}) {
    if(! game.user.isGM) return
  
    const method = customPrefillTemplateDispatchMethod[type][operation]
  
    if(method !== undefined && typeof method === 'function'){
        method(key, customPrefillTemplate)
    }
  
}