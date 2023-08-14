import { SprayingParticleTemplate, GravitingParticleTemplate, MissileParticleTemplate} from "./particleTemplate.js"
import { Vector3, Utils } from "./utils.js"
import { motionTemplateDictionnary, defaultMotionTemplate } from "./prefillMotionTemplate.js"
import { colorTemplateDictionnary, defaultColorTemplate } from "./prefillColorTemplate.js"
import { s_MODULE_ID ,s_EVENT_NAME, s_MESSAGE_TYPES } from "../main.js"
import { CompatibiltyV2Manager } from "./compatibilityManager.js"

export default class ParticlesEmitter { 

    static maxId = 1
    static prefillMotionTemplate = motionTemplateDictionnary
    static prefillColorTemplate = colorTemplateDictionnary

    static newEmitterId(){
        let lastId = game.settings.get(s_MODULE_ID, "maxEmitterId");
        lastId++

        if(game.user.isGM){
            game.settings.set(s_MODULE_ID, "maxEmitterId", lastId);
        } else {
            game.socket.emit(s_EVENT_NAME, {
                type: s_MESSAGE_TYPES.updateMaxEmitterId,
                payload: {maxEmitterId: lastId}
             });
        }


        return lastId
    }

    static resetEmitterId(){
        if(game.user.isGM){
            game.settings.set(s_MODULE_ID, "maxEmitterId", 0);
        } else {
            game.socket.emit(s_EVENT_NAME, {
                type: s_MESSAGE_TYPES.updateMaxEmitterId,
                payload: {maxEmitterId: 0}
             });
        }
    }


    static emitters = []

    static initEmitters(emittersQueries){
        const isSaveAllowed = game.settings.get(s_MODULE_ID, "saveEmitters")
        if(isSaveAllowed && emittersQueries && Array.isArray(emittersQueries)){
            emittersQueries.forEach(query => {
              switch (query.type){
                case SprayingParticleTemplate.getType() :
                  ParticlesEmitter.sprayParticles(query);
                  break;
                case GravitingParticleTemplate.getType() :
                  ParticlesEmitter.gravitateParticles(query);
                  break;
                case MissileParticleTemplate.getType() :
                  ParticlesEmitter.missileParticles(query);
                  break;
                default:
                  ParticlesEmitter.sprayParticles(query);
              }
            });
        }
    }

    static sprayParticles(...args){
        const orderInputArg = ParticlesEmitter._orderInputArg(args);

        return ParticlesEmitter._sprayParticles(orderInputArg.colorTemplate, orderInputArg.motionTemplate, orderInputArg.inputObject, orderInputArg.emitterId)
    }

    static _sprayParticles(colorTemplate, motionTemplate, inputObject, emitterId){
        const particleTexture = PIXI.Texture.from(`/modules/${s_MODULE_ID}/particle.png`);
        CompatibiltyV2Manager.correctDeprecatedParam(inputObject)

        const finalInput = ParticlesEmitter._mergeTemplate(colorTemplate, motionTemplate, inputObject)

        const particleTemplate = SprayingParticleTemplate.build(finalInput, particleTexture)

        return ParticlesEmitter._abstractInitParticles(inputObject, finalInput, particleTemplate, emitterId)
    }

    static missileParticles(...args){
        const orderInputArg = ParticlesEmitter._orderInputArg(args);

        return ParticlesEmitter._missileParticles(orderInputArg.colorTemplate, orderInputArg.motionTemplate, orderInputArg.inputObject, orderInputArg.emitterId)
    }

    static _missileParticles(colorTemplate, motionTemplate, inputObject, emitterId){
        const particleTexture = PIXI.Texture.from(`/modules/${s_MODULE_ID}/particle.png`);

        CompatibiltyV2Manager.correctDeprecatedParam(inputObject)

        const finalInput = ParticlesEmitter._mergeTemplate(colorTemplate, motionTemplate, inputObject)
        
        if(finalInput.subParticles){
            if(! finalInput.subParticles.particleColorStart){
                finalInput.subParticles.particleColorStart = finalInput.particleColorStart
                finalInput.subParticles.particleColorEnd = finalInput.particleColorEnd
            } else if (! finalInput.subParticles.particleColorEnd){
                finalInput.subParticles.particleColorEnd = finalInput.subParticles.particleColorStart
            }
        }

        let subParticleTemplate
        if(finalInput.subParticles){
            if(finalInput.subParticles.type === SprayingParticleTemplate.getType()){
                //this is a spray particle
                subParticleTemplate = SprayingParticleTemplate.build(finalInput.subParticles, particleTexture)
                subParticleTemplate.type = SprayingParticleTemplate.getType()
            } else if (finalInput.subParticles.type === GravitingParticleTemplate.getType()){
                //this is a graviting particle
                subParticleTemplate = GravitingParticleTemplate.build(finalInput.subParticles, particleTexture)
                subParticleTemplate.type = GravitingParticleTemplate.getType()
            }
        }

        const particleTemplate = new MissileParticleTemplate(
            finalInput.source,
            finalInput.target,
            Vector3.build(finalInput.positionSpawning), 
            finalInput.particleVelocityStart, 
            finalInput.particleVelocityEnd, 
            finalInput.particleAngleStart, 
            finalInput.particleAngleEnd, 
            finalInput.particleSizeStart,
            finalInput.particleSizeEnd,
            finalInput.particleRotationStart,
            finalInput.particleRotationEnd,  
            finalInput.particleLifetime, 
            particleTexture, 
            Vector3.build(finalInput.particleColorStart), 
            Vector3.build(finalInput.particleColorEnd),
            finalInput.alphaStart, 
            finalInput.alphaEnd,
            finalInput.vibrationAmplitudeStart, 
            finalInput.vibrationAmplitudeEnd,
            finalInput.vibrationFrequencyStart, 
            finalInput.vibrationFrequencyEnd,
            subParticleTemplate,
            );

            //finalInput.emissionDuration must be the same as mainParticle.particleLifetime
            finalInput.emissionDuration = particleTemplate.mainParticle.particleLifetime

        return ParticlesEmitter._abstractInitParticles(inputObject, finalInput, particleTemplate, emitterId)
    }

    static gravitateParticles(...args){
        const orderInputArg = ParticlesEmitter._orderInputArg(args);

        return ParticlesEmitter._gravitateParticles(orderInputArg.colorTemplate, orderInputArg.motionTemplate, orderInputArg.inputObject, orderInputArg.emitterId)
    }

    static _gravitateParticles(colorTemplate, motionTemplate, inputObject, emitterId){
        const particleTexture = PIXI.Texture.from(`/modules/${s_MODULE_ID}/particle.png`);

        CompatibiltyV2Manager.correctDeprecatedParam(inputObject)

        const finalInput = ParticlesEmitter._mergeTemplate(colorTemplate, motionTemplate, inputObject)

        const particleTemplate = GravitingParticleTemplate.build(finalInput, particleTexture)

        return ParticlesEmitter._abstractInitParticles(inputObject, finalInput, particleTemplate, emitterId)
    }

    static persistEmitters(){
        const isSaveAllowed = game.settings.get(s_MODULE_ID, "saveEmitters")

        if(isSaveAllowed && game.user.isGM){
            const activeEmmittersQuery = ParticlesEmitter.emitters
                .filter(emitter => emitter.remainingTime === undefined || emitter.remainingTime > 0)
                .map(emitter => {
                    const query = emitter.finalQuery
                    query.emissionDuration = emitter.remainingTime
                    query.type = emitter.particleTemplate.constructor.getType()
                    return query
            })
            
            if(activeEmmittersQuery){
                canvas.scene.setFlag(s_MODULE_ID, "emitters", activeEmmittersQuery)
            } else {
                canvas.scene.unsetFlag(s_MODULE_ID, "emitters")
            }
        }
    }

    static stopAllEmission(immediate){
        let deletedIds = []

        if(immediate){
            while(ParticlesEmitter.emitters.length > 0){
                let emitter = ParticlesEmitter.emitters[0]
                emitter._immediatelyStopEmission()
                deletedIds.push(emitter.id)
            }
        } else {
            ParticlesEmitter.emitters.forEach(emitter => {
                emitter.remainingTime = 0
                deletedIds.push(emitter.id)
            })
        }

        return deletedIds
    }

    static stopEmissionById(emitterId, immediate){
        let emitter
        if(emitterId === undefined || (typeof emitterId === 'string' && (emitterId.toLowerCase() === 'l' || emitterId.toLowerCase() === 'last'))){
            //Find last emitter
            emitter = ParticlesEmitter.emitters[ParticlesEmitter.emitters.length - 1]
        } else if (typeof emitterId === 'string' && (emitterId.toLowerCase() === 'f' || emitterId.toLowerCase() === 'first')){
            //Find last emitter
            emitter = ParticlesEmitter.emitters[0]
        } else if(typeof emitterId === 'number'){
            emitter = ParticlesEmitter.emitters.find(emitter => emitter.id === emitterId);
        } else if(!isNaN(emitterId)){
            emitter = ParticlesEmitter.emitters.find(emitter => emitter.id === Number(emitterId));
        }

        if(emitter){
            if(immediate){
                emitter._immediatelyStopEmission()
            } else {
                emitter.remainingTime = 0
            }

            return emitter.id
        }
    }

    static addCustomPrefillMotionTemplate(customPrefillMotionTemplate){
        ParticlesEmitter.prefillMotionTemplate = {...motionTemplateDictionnary, ...customPrefillMotionTemplate}
    }

    static addCustomPrefillColorTemplate(customPrefillColorTemplate){
        ParticlesEmitter.prefillColorTemplate = {...colorTemplateDictionnary, ...customPrefillColorTemplate}
    }


    static async writeMessageForEmissionById(emitterId, verbal){
        let emitter = ParticlesEmitter.emitters.find(emitter => emitter.id === emitterId);

        if(emitter === undefined){
            return game.i18n.localize("PARTICULE-FX.Emission.Not-found") + emitterId
        }

        //show originalQuery if verbal
        const dataExport = {
            emittorId: emitterId,
            originalQuery : verbal ? JSON.stringify(emitter.originalQuery) : undefined
        }

        let htmlMessage = await renderTemplate(`modules/${s_MODULE_ID}/template/message-particle_state.hbs`, dataExport)

        ui.chat.processMessage("/w gm " + htmlMessage );

        return htmlMessage
    }


    static _abstractInitParticles(inputQuery, finalInput, particleTemplate, emitterId){
        const particlesEmitter = new ParticlesEmitter(
            particleTemplate, 
            finalInput.spawningFrequence, 
            finalInput.spawningNumber,
            finalInput.maxParticles,
            finalInput.emissionDuration
            );

        // Listen for animate update
        particlesEmitter.callback = particlesEmitter.manageParticles.bind(particlesEmitter)
        particlesEmitter.originalQuery = inputQuery
        particlesEmitter.finalQuery = finalInput
        particlesEmitter.id = emitterId || ParticlesEmitter.newEmitterId()

        canvas.app.ticker.add(particlesEmitter.callback)

        ParticlesEmitter.emitters.push(particlesEmitter)

        return particlesEmitter.id
    }

    static _orderInputArg(args){
        let inputObject
        let motionTemplate
        let colorTemplate
        let emitterId

        for(let arg of args){
            if(arg.emitterId){
                emitterId = arg.emitterId
            }else if(arg instanceof Object){
                inputObject = arg
            } else if(ParticlesEmitter.prefillMotionTemplate[arg]){
                motionTemplate =  ParticlesEmitter.prefillMotionTemplate[arg]
            } else if(ParticlesEmitter.prefillColorTemplate[arg]){
                colorTemplate =  ParticlesEmitter.prefillColorTemplate[arg]
            }
        }

        return {colorTemplate, motionTemplate, inputObject, emitterId}
    }

    static _mergeTemplate(colorTemplate, motionTemplate, inputObject){
        const inputMergeMotionTemplate = Utils.mergeInputTemplate(inputObject , motionTemplate)
        const inputMergeColorTemplate = Utils.mergeInputTemplate(inputMergeMotionTemplate , colorTemplate)
        const mergeDefaultValue = Utils.mergeInputTemplate(defaultMotionTemplate() , defaultColorTemplate())
        const finalInput = Utils.mergeInputTemplate(inputMergeColorTemplate , mergeDefaultValue)

        return finalInput;
    }


    constructor(particleTemplate, particleFrequence, spawningNumber, maxParticles, emissionDuration, isGravitate){
        this.spawnedEnable = true;
        this.particles = [];
        this.particleTemplate = particleTemplate;
        this.particleFrequence = particleFrequence;
        this.spawningNumber = spawningNumber;
        this.maxParticles = maxParticles
        this.remainingTime = emissionDuration
        this.isGravitate = isGravitate
        this.lastUpdate = Date.now();
    }

    manageParticles(){
        let newDate = Date.now()
        const dt = newDate - this.lastUpdate
        this.lastUpdate = newDate

        for (let i = 0; i < this.particles.length; i++) {
            const particle = this.particles[i]

            particle.manageLifetime(dt)

            if(particle.remainingTime <= 0){
                particle.sprite.destroy()
                this.particles.splice(i, 1)
                //Return to last particle
                i--
            }
        }

        //Decrease remainingTime of emmission if it has one
        if(this.remainingTime !== undefined){
            this.remainingTime -= dt;
        }

        if (this.spawnedEnable && this.particles.length < this.maxParticles && (this.remainingTime === undefined || this.remainingTime > 0)){
            //Spawned new particles
            let numberNewParticles = 1 + Math.floor(this.spawningNumber * dt/this.particleFrequence)
            let increaseTime = (this.spawningNumber * dt)%this.particleFrequence

            //Don t overload the server during low framerate
            if(numberNewParticles * 10 > this.maxParticles){
                numberNewParticles = Math.floor(this.maxParticles / 10) + 1
                increaseTime = 0;
            }

            for(let i = 0; i < numberNewParticles; i++){
                const particle = this.particleTemplate.generateParticles(this.particleTemplate);

                if(particle === undefined) {
                    this.remainingTime = 0
                    break
                }
                canvas.app.stage.addChild(particle.sprite);
                this.particles.push(particle)
            }

            this.spawnedEnable = false;

            setTimeout(this.enableSpawning.bind(this), this.particleFrequence + increaseTime)

        }  if (this.remainingTime !== undefined && this.remainingTime <= 0 && this.particles.length === 0){
            //delete emission
            canvas.app.ticker.remove(this.callback);
            const emitterIndex =  ParticlesEmitter.emitters.findIndex((emitter) => emitter.id === this.id)
            ParticlesEmitter.emitters.splice(emitterIndex, 1)
        }
    }

    //Delete immediatly emission without waiting for each particle's end
    _immediatelyStopEmission(){
        while(this.particles.length > 0){
            let particle = this.particles[0]
            particle.sprite.destroy()
            this.particles.splice(0, 1)
        }

        canvas.app.ticker.remove(this.callback);
        const emitterIndex =  ParticlesEmitter.emitters.findIndex((emitter) => emitter.id === this.id)
        ParticlesEmitter.emitters.splice(emitterIndex, 1)
    }


    enableSpawning() {
        this.spawnedEnable = true;
    }
}