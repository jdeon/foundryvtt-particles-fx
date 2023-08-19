import { s_MODULE_ID } from "./utils.js"

export class CompatibiltyV2Manager { 

    static compatibiltyApiMessage(){
        ui.notifications.warn('Deprecated : use particuleFx.XXX instead of particuleEmitter for api')
    }

    static compatibiltyParamMessage(errorParam){
        ui.notifications.warn(`Deprecated : use input param with particule replace it by particle : ${errorParam}`)
    }

    static manageDeprecatedWindowCall(){
        //On call, we call method localy and share data with other client
        Object.defineProperty(window,'particuleEmitter',{
            get: function(){
                CompatibiltyV2Manager.compatibiltyApiMessage()
                return {
                    sprayParticules: window.particlesFx.sprayParticles,
                    missileParticules: window.particlesFx.missileParticles,
                    gravitateParticules: window.particlesFx.gravitateParticles,
                    stopAllEmission:  window.particlesFx.stopAllEmission,
                    stopEmissionById: window.particlesFx.stopEmissionById,
                    writeMessageForEmissionById: window.particlesFx.writeMessageForEmissionById,
                    addCustomPrefillMotionTemplate:window.particlesFx.addCustomPrefillMotionTemplate,
                    removeCustomPrefillMotionTemplate:window.particlesFx.removeCustomPrefillMotionTemplate,
                    getCustomPrefillMotionTemplate:window.particlesFx.getCustomPrefillMotionTemplate,
                    addCustomPrefillColorTemplate:window.particlesFx.addCustomPrefillColorTemplate,
                    removeCustomPrefillColorTemplate:window.particlesFx.removeCustomPrefillColorTemplate,
                    getCustomPrefillColorTemplate:window.particlesFx.getCustomPrefillColorTemplate,
                }
            },
        
            set: function(val){
                console.log('particuleEmitter can t be set');
            },
        
            configurable: true,
        });
    }

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

    static migrateSettings(){
        if(!game.settings.get(s_MODULE_ID, "migrationV2Done")){
            const oldAvoidParticuleSettings =  game.settings.get(s_MODULE_ID, "avoidParticule")
            game.settings.set(s_MODULE_ID, "avoidParticle", oldAvoidParticuleSettings)
            game.settings.get(s_MODULE_ID, "migrationV2Done", true)
        }
    }
}