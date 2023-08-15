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
            }
        }

        if(preventMessage !== true && deprecatedParam.length > 0){
            CompatibiltyV2Manager.compatibiltyParamMessage(deprecatedParam)
        }

        return deprecatedParam
    }
}