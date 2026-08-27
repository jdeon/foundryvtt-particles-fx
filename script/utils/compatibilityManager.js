import { s_MODULE_ID } from "./utils.js"
import emitController from "../api/emitController.js";
import templateController from "../api/templateController.js";

/**
 * Handles backwards compatibility migration and deprecated API mappings for v2.
 */
export class CompatibiltyV2Manager { 

    /**
     * Displays a deprecation warning notification for legacy API access.
     * @returns {void}
     */
    static compatibiltyApiMessage(){
        ui.notifications.warn('Deprecated : use particlesFx.XXX instead of particuleEmitter for api')
    }

    /**
     * Displays a deprecation warning notification for misspelled input parameter keys.
     * @param {string|Array<string>} errorParam - The parameter key(s) with deprecated spelling.
     * @returns {void}
     */
    static compatibiltyParamMessage(errorParam){
        ui.notifications.warn(`Deprecated : use input param with 'particule' replace it by 'particle' : ${errorParam}`)
    }

    /**
     * Registers legacy getter on `window.particuleEmitter` to support backward compatibility with older API callers.
     * @returns {void}
     */
    static manageDeprecatedWindowCall(){
        if(foundry.utils.getProperty(window,'particlesFx.particuleEmitter')) return;

        //On call, we call method localy and share data with other client
        Object.defineProperty(window,'particuleEmitter',{
            get: function(){
                CompatibiltyV2Manager.compatibiltyApiMessage()
                return {
                    sprayParticules: emitController.spray,
                    gravitateParticules: emitController.gravit,
                    missileParticules: emitController.missile,
                    stopEmissionById: emitController.stop,
                    stopAllEmission:  emitController.stopAll,
                    writeMessageForEmissionById: emitController.writeMessage,
                    addCustomPrefillMotionTemplate: templateController.motion.add,
                    removeCustomPrefillMotionTemplate: templateController.motion.remove,
                    getCustomPrefillMotionTemplate: templateController.motion.get,
                    addCustomPrefillColorTemplate: templateController.color.add,
                    removeCustomPrefillColorTemplate: templateController.color.remove,
                    getCustomPrefillColorTemplate: templateController.color.get,
                }
            },
        
            set: function(val){
                console.log('particuleEmitter can t be set');
            },
        
            configurable: true,
        });
    }

    /**
     * Scans and auto-corrects legacy parameter names in input objects (replacing 'particule' with 'particle').
     * @param {Object} input - Input configuration object to correct.
     * @param {boolean} [preventMessage] - If true, suppresses warning notification.
     * @returns {Array<string>} List of corrected parameter keys.
     */
    static correctDeprecatedParam(input, preventMessage){
        const deprecatedParam = []

        const keys = Object.keys(input)
        
        for (const key of keys) {

            if(input[key] instanceof Object){
                const result = CompatibiltyV2Manager.correctDeprecatedParam(input[key], true)
                deprecatedParam.push(...result)
            } 
            
            if (key.includes('articule')){
                deprecatedParam.push(key)
                const fixKey = key.replaceAll('articule', 'article')
                input[fixKey] = input[key]
                delete input[key]
            }
        }

        if(preventMessage !== true && deprecatedParam.length > 0){
            CompatibiltyV2Manager.compatibiltyParamMessage(deprecatedParam)
        }

        return deprecatedParam
    }

    /**
     * Registers settings required for migrating legacy v1 settings to v2.
     * @returns {void}
     */
    static addMigrationSettings(){
        game.settings.register(s_MODULE_ID, "avoidParticule", {
            name: game.i18n.localize("Old settings renamed avoidParticle"),
            hint: game.i18n.localize("Keep it here for migration purpose"),
            scope: "client",
            config: false,
            type: Boolean,
            default: false
        });
        
        game.settings.register(s_MODULE_ID, "migrationV2Done", {
            name: game.i18n.localize("Old settings has been migrate in new one"),
            hint: game.i18n.localize("Keep it here for migration purpose"),
            scope: "client",
            config: false,
            type: Boolean,
            default: false
        });
    }

    /**
     * Performs setting value migration from legacy names to new v2 names once.
     * @returns {void}
     */
    static migrateSettings(){
        if(!game.settings.get(s_MODULE_ID, "migrationV2Done")){
            const oldAvoidParticuleSettings =  game.settings.get(s_MODULE_ID, "avoidParticule")
            game.settings.set(s_MODULE_ID, "avoidParticle", oldAvoidParticuleSettings)
            game.settings.set(s_MODULE_ID, "migrationV2Done", true)
        }
    }
}