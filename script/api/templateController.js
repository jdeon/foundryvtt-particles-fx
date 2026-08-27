import { s_MODULE_ID } from "../utils/utils.js"
import { s_MESSAGE_TYPES, emitForOtherClient } from "../utils/socketManager.js"

/**
 * Controller API for managing custom prefill motion and color templates.
 */
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

/**
 * Adds a custom prefill motion template to world settings or syncs it via sockets.
 * @param {string} key - Unique key identifier for the motion template.
 * @param {import("../prefillMotionTemplate.js").MotionTemplate} customPrefillMotionTemplate - Motion template configuration.
 * @returns {void}
 */
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
  
/**
 * Removes a custom prefill motion template by its key.
 * @param {string} key - Key of the motion template to remove.
 * @returns {void}
 */
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
  
/**
 * Retrieves a custom prefill motion template by key, or all templates if key is omitted.
 * @param {string} [key] - Optional key of the motion template.
 * @returns {import("../prefillMotionTemplate.js").MotionTemplate|Record<string, import("../prefillMotionTemplate.js").MotionTemplate>} The requested motion template or all templates.
 */
function getCustomPrefillMotionTemplate(key){
    const prefillMotionTemplate = game.settings.get(s_MODULE_ID, "customPrefillMotionTemplate")
  
    if(key !== undefined && typeof key === 'string' ){
      return prefillMotionTemplate[key]
    } else {
      return prefillMotionTemplate
    }
}
  
/**
 * Adds a custom prefill color template to world settings or syncs it via sockets.
 * @param {string} key - Unique key identifier for the color template.
 * @param {import("../prefillColorTemplate.js").ColorTemplateQuery} customPrefillColorTemplate - Color template configuration.
 * @returns {void}
 */
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
  
/**
 * Removes a custom prefill color template by its key.
 * @param {string} key - Key of the color template to remove.
 * @returns {void}
 */
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
  
/**
 * Retrieves a custom prefill color template by key, or all templates if key is omitted.
 * @param {string} [key] - Optional key of the color template.
 * @returns {import("../prefillColorTemplate.js").ColorTemplateQuery|Record<string, import("../prefillColorTemplate.js").ColorTemplateQuery>} The requested color template or all templates.
 */
function getCustomPrefillColorTemplate(key){
    const prefillColorTemplate = game.settings.get(s_MODULE_ID, "customPrefillColorTemplate")
  
    if(key !== undefined && typeof key === 'string' ){
        return prefillColorTemplate[key]
    } else {
        return prefillColorTemplate
    }
}

/**
 * Validates parameters for adding custom prefill templates.
 * @param {string} key - Template key to validate.
 * @param {TODO type} customPrefillTemplate - Template configuration to validate.
 * @returns {boolean} True if key and template are valid.
 */
function isCustomPrefillTemplateParamValid(key, customPrefillTemplate){
    if(!key || ! typeof key === 'string' || !customPrefillTemplate || !customPrefillTemplate instanceof Object){
      ui.notifications.error(game.i18n.localize('PARTICULE-FX.Prefill-Template.Bad-Param'));
      return false
    }
  
    return true
}

