import ParticlesEmitter from "../object/particlesEmitter.js"
import { motionTemplateDictionnary } from "../prefillMotionTemplate.js"
import { colorTemplateDictionnary } from "../prefillColorTemplate.js"

/**
 * Updates the global prefill motion templates dictionary with custom motion template entries.
 * @param {Record<string, Object>} customPrefillMotionTemplate - Custom motion templates map.
 * @returns {void}
 */
export function  addCustomPrefillMotionTemplate(customPrefillMotionTemplate){
    ParticlesEmitter.prefillMotionTemplate = {...motionTemplateDictionnary, ...customPrefillMotionTemplate}
}

/**
 * Updates the global prefill color templates dictionary with custom color template entries.
 * @param {Record<string, Object>} customPrefillColorTemplate - Custom color templates map.
 * @returns {void}
 */
export function  addCustomPrefillColorTemplate(customPrefillColorTemplate){
    ParticlesEmitter.prefillColorTemplate = {...colorTemplateDictionnary, ...customPrefillColorTemplate}
}