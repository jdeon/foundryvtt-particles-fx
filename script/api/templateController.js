import { s_MODULE_ID } from "../utils/utils.js"
import { s_MESSAGE_TYPES, emitForOtherClient } from "../utils/socketManager.js"

export default {
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

