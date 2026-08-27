import { s_MODULE_ID, s_EVENT_NAME } from "./utils.js"
import customPrefillTemplateApi from "../api/templateController.js"
import * as particlesEmitterService from "../service/particlesEmitter.service.js"


/**
 * Defines the different message types that FQL sends over `game.socket`.
 * @type {Record<string, string>}
 */
export const s_MESSAGE_TYPES = {
    sprayParticles: 'sprayParticles',
    missileParticles: 'missileParticles',
    gravitateParticles: 'gravitateParticles',
    stopAllEmission: 'stopAllEmission',
    stopEmissionById: 'stopEmissionById',
    stopWorkflow: 'stopWorkflow',
    updateMaxEmitterId: 'updateMaxEmitterId',
    updateCustomPrefillTemplate: 'updateCustomPrefillTemplate'
  };


/**
 * Emits a socket message event to other connected clients.
 * @param {string} type - Socket message type from s_MESSAGE_TYPES.
 * @param {Object} payload - Message payload data.
 * @returns {void}
 */
export function emitForOtherClient(type, payload){
    game.socket.emit(s_EVENT_NAME, {
      type: type,
      payload: payload
   });
  }
  
  /**
  * Provides the main incoming message registration and distribution of socket messages on the receiving side.
  * @returns {void}
  */
export function listen() {
     game.socket.on(s_EVENT_NAME, (data) =>
     {
        if (typeof data !== 'object') { return; }
  
        if(game.settings.get(s_MODULE_ID, "avoidParticle")){ return; }
  
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
              case s_MESSAGE_TYPES.stopWorkflow: particlesEmitterService.stopWorkflow(data.payload); break;
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

/**
 * Handles incoming socket request for GM to update custom prefill template settings.
 * @param {{type: "motion" | "color", operation: "add" | "remove" | "get", key: string, customPrefillTemplate: import("../prefillMotionTemplate.js").MotionTemplateQuery | import("../prefillColorTemplate.js").ColorTemplateQuery}} options - Object containing type, operation, key, and template data.
 * @returns {void}
 */
function updateCustomPrefillTemplate({type, operation, key, customPrefillTemplate}) {
    if(! game.user.isGM) return
  
    const method = customPrefillTemplateApi[type][operation]
  
    if(method !== undefined && typeof method === 'function'){
        method(key, customPrefillTemplate)
    }
  
}