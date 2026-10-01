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
   togglePauseEmissionById: 'togglePauseEmissionById',
   pauseAllEmission: 'pauseAllEmission',
   updateCustomPrefillTemplate: 'updateCustomPrefillTemplate'
};


/**
 * Recursively converts function properties in a payload object into serializable objects.
 * @param {any} obj - Data payload to serialize.
 * @param {WeakSet} [visited] - Set of visited objects to prevent circular references.
 * @returns {any} Serialized payload.
 */
export function serializePayload(obj, visited = new WeakSet()) {
   if (obj === null || obj === undefined) return obj;
   if (typeof obj === 'function') {
      return { __isFunction: true, code: obj.toString() };
   }
   if (typeof obj !== 'object') return obj;
   if (visited.has(obj)) return undefined;
   visited.add(obj);

   if (Array.isArray(obj)) {
      return obj.map(item => serializePayload(item, visited));
   }

   const result = {};
   for (const key of Object.keys(obj)) {
      result[key] = serializePayload(obj[key], visited);
   }
   return result;
}

/**
 * Recursively restores serialized function objects back into executable Functions.
 * @param {any} obj - Serialized data payload.
 * @param {WeakSet} [visited] - Set of visited objects.
 * @returns {any} Deserialized payload.
 */
export function deserializePayload(obj, visited = new WeakSet()) {
   if (obj === null || obj === undefined) return obj;
   if (typeof obj === 'object' && obj.__isFunction && typeof obj.code === 'string') {
      try {
         let code = obj.code.trim();
         if (!code.startsWith("function") && !code.startsWith("async") && !code.startsWith("(") && /^[a-zA-Z0-9_$]+\s*\(/.test(code)) {
            code = "function " + code;
         }
         return new Function("return (" + code + ")")();
      } catch (err) {
         console.error("Failed to deserialize function from socket:", obj.code, err);
         return undefined;
      }
   }
   if (typeof obj !== 'object') return obj;
   if (visited.has(obj)) return obj;
   visited.add(obj);

   if (Array.isArray(obj)) {
      return obj.map(item => deserializePayload(item, visited));
   }

   const result = {};
   for (const key of Object.keys(obj)) {
      result[key] = deserializePayload(obj[key], visited);
   }
   return result;
}

/**
 * Emits a socket message event to other connected clients.
 * @param {string} type - Socket message type from s_MESSAGE_TYPES.
 * @param {Object} payload - Message payload data.
 * @returns {void}
 */
export function emitForOtherClient(type, payload) {
   game.socket.emit(s_EVENT_NAME, {
      type: type,
      payload: serializePayload(payload)
   });
}

/**
* Provides the main incoming message registration and distribution of socket messages on the receiving side.
* @returns {void}
*/
export function listen() {
   game.socket.on(s_EVENT_NAME, (data) => {
      if (typeof data !== 'object') { return; }

      if (game.settings.get(s_MODULE_ID, "avoidParticle")) { return; }

      try {
         const payload = deserializePayload(data.payload);
         // Dispatch the incoming message data by the message type.
         switch (data.type) {
            case s_MESSAGE_TYPES.sprayParticles: particlesEmitterService.sprayParticles(...payload); break;
            case s_MESSAGE_TYPES.missileParticles: particlesEmitterService.missileParticles(...payload); break;
            case s_MESSAGE_TYPES.gravitateParticles: particlesEmitterService.gravitateParticles(...payload); break;
            case s_MESSAGE_TYPES.stopEmissionById: particlesEmitterService.stopEmissionById(payload.emitterId, payload.immediate); break;
            case s_MESSAGE_TYPES.stopAllEmission: particlesEmitterService.stopAllEmission(payload); break;
            case s_MESSAGE_TYPES.stopWorkflow: particlesEmitterService.stopWorkflow(payload); break;
            case s_MESSAGE_TYPES.togglePauseEmissionById: particlesEmitterService.togglePauseEmissionById(payload.emitterId, payload.isPaused); break;
            case s_MESSAGE_TYPES.pauseAllEmission: particlesEmitterService.setPauseStateToAllEmission(payload); break;
            case s_MESSAGE_TYPES.updateCustomPrefillTemplate: updateCustomPrefillTemplate(payload); break;
         }
      }
      catch (err) {
         console.error(err);
      }
   });
}

/**
 * Handles incoming socket request for GM to update custom prefill template settings.
 * @param {{type: "motion" | "color", operation: "add" | "remove" | "get", key: string, customPrefillTemplate: import("../prefillMotionTemplate.js").MotionTemplateQuery | import("../prefillColorTemplate.js").ColorTemplateQuery}} options - Object containing type, operation, key, and template data.
 * @returns {void}
 */
function updateCustomPrefillTemplate({ type, operation, key, customPrefillTemplate }) {
   if (!game.user.isGM) return

   const method = customPrefillTemplateApi[type][operation]

   if (method !== undefined && typeof method === 'function') {
      method(key, customPrefillTemplate)
   }

}