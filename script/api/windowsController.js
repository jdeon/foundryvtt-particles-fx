import * as particlesEmitterService from "../service/particlesEmitter.service.js"
import { s_MESSAGE_TYPES, emitForOtherClient } from "../utils/socketManager.js"
import { CompatibiltyV2Manager } from "../utils/compatibilityManager.js"

export function subscribeApiToWindow(){
    if(getProperty(window,'particlesFx.sprayParticles')) return;
            
    //On call, we call method localy and share data with other client
    window.particlesFx = {
        ...window.particlesFx, 
        sprayParticles: sprayParticles,
        missileParticles: missileParticles,
        gravitateParticles: gravitateParticles,
        stopAllEmission:  stopAllEmission,
        stopEmissionById: stopEmissionById,
        writeMessageForEmissionById: particlesEmitterService.writeMessageForEmissionById,   //No need to emit to other client
        addCustomPrefillMotionTemplate,
        removeCustomPrefillMotionTemplate,
        getCustomPrefillMotionTemplate,
        addCustomPrefillColorTemplate,
        removeCustomPrefillColorTemplate,
        getCustomPrefillColorTemplate,
    }

    CompatibiltyV2Manager.manageDeprecatedWindowCall()
}

export function sprayParticles(...args){
    let emitterId = { emitterId: particlesEmitterService.nextEmitterId() }
    emitForOtherClient(s_MESSAGE_TYPES.sprayParticles, args, emitterId); 
    return particlesEmitterService.sprayParticles(...args, emitterId)
}
  
export function missileParticles(...args){
    let emitterId = { emitterId: particlesEmitterService.nextEmitterId() }
    emitForOtherClient(s_MESSAGE_TYPES.missileParticles, args, emitterId); 
    return particlesEmitterService.missileParticles(...args, emitterId)
}
  
export function gravitateParticles(...args){
    let emitterId = { emitterId: particlesEmitterService.nextEmitterId() }
    emitForOtherClient(s_MESSAGE_TYPES.gravitateParticles, args, emitterId); 
    return particlesEmitterService.gravitateParticles(...args, emitterId)
}
  
export function stopAllEmission(immediate){
    particlesEmitterService.resetEmitterId()
    emitForOtherClient(s_MESSAGE_TYPES.stopAllEmission, immediate); 
    return particlesEmitterService.stopAllEmission(immediate)
}
  
export function stopEmissionById(emitterId, immediate){
    emitForOtherClient(s_MESSAGE_TYPES.stopEmissionById, {emitterId, immediate}); 
    return particlesEmitterService.stopEmissionById(emitterId, immediate)
}
  
function addCustomPrefillMotionTemplate(key, customPrefillMotionTemplate){
    if(! isCustomPrefillTemplateParamValid(key, customPrefillMotionTemplate)) return;
  
    if(game.user.isGM){
      let actualPrefillMotionTemplate = game.settings.get(s_MODULE_ID, "customPrefillMotionTemplate")
  
      if(actualPrefillMotionTemplate === undefined){
        actualPrefillMotionTemplate = {}
      }
  
      actualPrefillMotionTemplate[key] = customPrefillMotionTemplate
      game.settings.set(s_MODULE_ID, "customPrefillMotionTemplate", actualPrefillMotionTemplate)
    } else if(game.user.role >= game.settings.get(s_MODULE_ID, "minimalRole")){
      emitForOtherClient(s_MESSAGE_TYPES.updateCustomPrefillTemplate, {type:'motion', operation:'add', key, customPrefillTemplate: customPrefillMotionTemplate})
    } else {
      ui.notifications.error(game.i18n.localize('PARTICULE-FX.Prefill-Template.Bad-Role'))
    }
}
  
function removeCustomPrefillMotionTemplate(key){
    if(game.user.isGM){
      let actualPrefillMotionTemplate = game.settings.get(s_MODULE_ID, "customPrefillMotionTemplate")
  
      if(actualPrefillMotionTemplate === undefined){
        actualPrefillMotionTemplate = {}
      } 
      
      if (actualPrefillMotionTemplate[key] === undefined){
        ui.notifications.warn(game.i18n.localize('PARTICULE-FX.Prefill-Template.Bad-Key') + key);
        return
      }
  
      delete actualPrefillMotionTemplate[key]
  
      game.settings.set(s_MODULE_ID, "customPrefillMotionTemplate", actualPrefillMotionTemplate)
    } else if(game.user.role >= game.settings.get(s_MODULE_ID, "minimalRole")){
      emitForOtherClient(s_MESSAGE_TYPES.updateCustomPrefillTemplate, {type:'motion', operation:'remove', key})
    } else {
      ui.notifications.error(game.i18n.localize('PARTICULE-FX.Prefill-Template.Bad-Role'))
    }
}
  
function getCustomPrefillMotionTemplate(key){
    const prefillMotionTemplate = game.settings.get(s_MODULE_ID, "customPrefillMotionTemplate")
  
    if(key !== undefined && typeof key === 'string' ){
      return prefillMotionTemplate[key]
    } else {
      return prefillMotionTemplate
    }
}
  
function addCustomPrefillColorTemplate(key, customPrefillColorTemplate){
    if(! isCustomPrefillTemplateParamValid(key, customPrefillColorTemplate)) return;
  
    if(game.user.isGM){
      let actualPrefillColorTemplate = game.settings.get(s_MODULE_ID, "customPrefillColorTemplate")
  
      if(actualPrefillColorTemplate === undefined){
        actualPrefillColorTemplate = {}
      }
  
      actualPrefillColorTemplate[key] = customPrefillColorTemplate
      game.settings.set(s_MODULE_ID, "customPrefillColorTemplate", actualPrefillColorTemplate)
    } else if(game.user.role >= game.settings.get(s_MODULE_ID, "minimalRole")){
      emitForOtherClient(s_MESSAGE_TYPES.updateCustomPrefillTemplate, {type:'color', operation:'add', key, customPrefillTemplate: customPrefillColorTemplate})
    } else {
      ui.notifications.error(game.i18n.localize('PARTICULE-FX.Prefill-Template.Bad-Role'))
    }
}
  
function removeCustomPrefillColorTemplate(key){
    if(game.user.isGM){
      let actualPrefillColorTemplate = game.settings.get(s_MODULE_ID, "customPrefillColorTemplate")
  
      if(actualPrefillColorTemplate === undefined){
        actualPrefillColorTemplate = {}
      } 
      
      if (actualPrefillColorTemplate[key] === undefined){
        ui.notifications.warn(game.i18n.localize('PARTICULE-FX.Prefill-Template.Bad-Key') + key);
        return
      }
  
      delete actualPrefillColorTemplate[key]
  
      game.settings.set(s_MODULE_ID, "customPrefillColorTemplate", actualPrefillColorTemplate)
    } else if(game.user.role >= game.settings.get(s_MODULE_ID, "minimalRole")){
      emitForOtherClient(s_MESSAGE_TYPES.updateCustomPrefillTemplate, {type:'color', operation:'remove', key})
    } else {
      ui.notifications.error(game.i18n.localize('PARTICULE-FX.Prefill-Template.Bad-Role'))
    }
}
  
function getCustomPrefillColorTemplate(key){
    const prefillColorTemplate = game.settings.get(s_MODULE_ID, "customPrefillColorTemplate")
  
    if(key !== undefined && typeof key === 'string' ){
        return prefillColorTemplate[key]
    } else {
        return prefillColorTemplate
    }
}

  
function isCustomPrefillTemplateParamValid(key, customPrefillTemplate){
    if(!key || ! typeof key === 'string' || !customPrefillTemplate || !customPrefillTemplate instanceof Object){
      ui.notifications.error(game.i18n.localize('PARTICULE-FX.Prefill-Template.Bad-Param'));
      return false
    }
  
    return true
}

export const customPrefillTemplateDispatchMethod = {
    motion : {
      add : addCustomPrefillMotionTemplate,
      remove : removeCustomPrefillMotionTemplate,
      get : getCustomPrefillMotionTemplate,
    },
    color : {
      add : addCustomPrefillColorTemplate,
      remove : removeCustomPrefillColorTemplate,
      get : getCustomPrefillColorTemplate,
    }
}