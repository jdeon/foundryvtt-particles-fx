import emitController from "./emitController.js";
import templateController from "./templateController.js";
import { CompatibiltyV2Manager } from "../utils/compatibilityManager.js"

export function subscribeApiToWindow(){
    if(getProperty(window,'particlesFx.isInit')) return;
            
    //On call, we call method localy and share data with other client
    window.particlesFx = {
        ...window.particlesFx, 
        isInit: true,
        sprayParticles: emitController.spray,
        gravitateParticles: emitController.gravit,
        missileParticles: emitController.missile,
        stopEmissionById: emitController.stop,
        stopAllEmission:  emitController.stopAll,
        writeMessageForEmissionById: emitController.writeMessage,   //No need to emit to other client
        addCustomPrefillMotionTemplate : templateController.motion.add,
        removeCustomPrefillMotionTemplate : templateController.motion.remove,
        getCustomPrefillMotionTemplate : templateController.motion.get,
        addCustomPrefillColorTemplate : templateController.color.add,
        removeCustomPrefillColorTemplate : templateController.color.remove,
        getCustomPrefillColorTemplate : templateController.color.get,
    }

    CompatibiltyV2Manager.manageDeprecatedWindowCall()
}