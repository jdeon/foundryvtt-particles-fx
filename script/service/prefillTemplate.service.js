import ParticlesEmitter from "../object/particlesEmitter.js"
import { motionTemplateDictionnary } from "../prefillMotionTemplate.js"
import { colorTemplateDictionnary } from "../prefillColorTemplate.js"


export function  addCustomPrefillMotionTemplate(customPrefillMotionTemplate){
    ParticlesEmitter.prefillMotionTemplate = {...motionTemplateDictionnary, ...customPrefillMotionTemplate}
}

export function  addCustomPrefillColorTemplate(customPrefillColorTemplate){
    ParticlesEmitter.prefillColorTemplate = {...colorTemplateDictionnary, ...customPrefillColorTemplate}
}