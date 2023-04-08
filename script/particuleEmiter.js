import { SprayingParticuleTemplate, GravitingParticuleTemplate} from "./particuleTemplate.js"
import { Vector3, Utils } from "./utils.js"
import { motionTemplateDictionnary, defaultMotionTemplate } from "./prefillMotionTemplate.js"

export default class ParticuleEmitter { 

    static maxId = 1

    static emitters = []

    static sprayParticules(...args){
        let inputObject
        let motionTemplate

        for(let arg of args){
            if(arg instanceof Object){
                inputObject = arg
            } else if(motionTemplateDictionnary[arg]){
                motionTemplate =  motionTemplateDictionnary[arg]
            }
        }

        ParticuleEmitter._sprayParticules(motionTemplate, inputObject)
    }

    static _sprayParticules(motionTemplate, inputObject){
        const particuleTexture = PIXI.Texture.from('/modules/particule-fx/particule.png');

        const inputMergeTemplate = Utils.mergeInputTemplate(inputObject , motionTemplate)
        const finalInput = Utils.mergeInputTemplate(inputMergeTemplate , defaultMotionTemplate)

        const particuleTemplate = new SprayingParticuleTemplate(
            Vector3.build(finalInput.positionSpawning), 
            finalInput.particuleVelocityStart, 
            finalInput.particuleVelocityEnd, 
            finalInput.particuleAngleStart, 
            finalInput.particuleAngleEnd, 
            finalInput.particuleSizeStart,
            finalInput.particuleSizeEnd, 
            finalInput.particuleLifetime, 
            particuleTexture, 
            Vector3.build(finalInput.particuleColorStart), 
            Vector3.build(finalInput.particuleColorEnd),
            finalInput.alphaStart, 
            finalInput.alphaEnd,
            finalInput.vibrationAmplitudeStart, 
            finalInput.vibrationAmplitudeEnd,
            finalInput.vibrationFrequencyStart, 
            finalInput.vibrationFrequencyEnd,
            );

        return ParticuleEmitter._abstractInitParticules(inputObject, finalInput, particuleTemplate)
    }

    static gravitateParticules(...args){
        let inputObject
        let motionTemplate

        for(let arg of args){
            if(arg instanceof Object){
                inputObject = arg
            } else if(motionTemplateDictionnary[arg]){
                motionTemplate =  motionTemplateDictionnary[arg]
            }
        }

        ParticuleEmitter._gravitateParticules(motionTemplate, inputObject)
    }

    static _gravitateParticules(motionTemplate, inputObject){
        const particuleTexture = PIXI.Texture.from('/modules/particule-fx/particule.png');

        const inputMergeTemplate = Utils.mergeInputTemplate(inputObject , motionTemplate)
        const finalInput = Utils.mergeInputTemplate(inputMergeTemplate , defaultMotionTemplate)

        const particuleTemplate = new GravitingParticuleTemplate(
            Vector3.build(finalInput.positionSpawning), 
            finalInput.particuleAngleStart, 
            finalInput.particuleVelocityStart, 
            finalInput.particuleVelocityEnd, 
            finalInput.particuleRadiusStart, 
            finalInput.particuleRadiusEnd, 
            finalInput.particuleSizeStart,
            finalInput.particuleSizeEnd, 
            finalInput.particuleLifetime, 
            particuleTexture, 
            Vector3.build(finalInput.particuleColorStart), 
            Vector3.build(finalInput.particuleColorEnd),
            finalInput.alphaStart, 
            finalInput.alphaEnd,
            finalInput.vibrationAmplitudeStart, 
            finalInput.vibrationAmplitudeEnd,
            finalInput.vibrationFrequencyStart, 
            finalInput.vibrationFrequencyEnd,
            );

        return ParticuleEmitter._abstractInitParticules(inputObject, finalInput, particuleTemplate)
    }

    static stopAllEmission(immediate){
        let deletedIds = []

        if(immediate){
            while(ParticuleEmitter.emitters.length > 0){
                let emitter = ParticuleEmitter.emitters[0]
                emitter._immediatelyStopEmission()
                deletedIds.push(emitter.id)
            }
        } else {
            ParticuleEmitter.emitters.forEach(emitter => {
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
            emitter = ParticuleEmitter.emitters[ParticuleEmitter.emitters.length - 1]
        } else if (typeof emitterId === 'string' && (emitterId.toLowerCase() === 'f' || emitterId.toLowerCase() === 'first')){
            //Find last emitter
            emitter = ParticuleEmitter.emitters[0]
        } else if(typeof emitterId === 'number'){
            emitter = ParticuleEmitter.emitters.find(emitter => emitter.id === emitterId);
        } else if(!isNaN(emitterId)){
            emitter = ParticuleEmitter.emitters.find(emitter => emitter.id === Number(emitterId));
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


    static async writeMessageForEmissionById(emitterId, verbal){
        let emitter = ParticuleEmitter.emitters.find(emitter => emitter.id === emitterId);

        if(emitter === undefined){
            return 'No emitter found for id : ' + emitterId
        }

        //show originalQuery if verbal
        const dataExport = {
            emittorId: emitterId,
            originalQuery : verbal ? JSON.stringify(emitter.originalQuery) : undefined
        }

        let htmlMessage = await renderTemplate("modules/particule-fx/template/message-particule_state.hbs", dataExport)

        return htmlMessage
    }


    static _abstractInitParticules(inputQuery, finalInput, particuleTemplate){
        const particuleEmitter = new ParticuleEmitter(
            particuleTemplate, 
            finalInput.spawningFrequence, 
            finalInput.maxParticules,
            finalInput.emissionDuration
            );

        // Listen for animate update
        particuleEmitter.callback = particuleEmitter.manageParticules.bind(particuleEmitter)
        particuleEmitter.originalQuery = inputQuery
        particuleEmitter.id = ParticuleEmitter.maxId ++

        canvas.app.ticker.add(particuleEmitter.callback)

        ParticuleEmitter.emitters.push(particuleEmitter)

        return particuleEmitter.id
    }


    constructor(particuleTemplate, particuleFrequence, maxParticules, emissionDuration, isGravitate){
        this.spawnedEnable = true;
        this.particules = [];
        this.particuleTemplate = particuleTemplate;
        this.particuleFrequence = particuleFrequence;
        this.maxParticules = maxParticules
        this.remainingTime = emissionDuration
        this.isGravitate = isGravitate
    }

    manageParticules(){
        const dt = canvas.app.ticker.elapsedMS;//85 in average

        for (let i = 0; i < this.particules.length; i++) {
            const particule = this.particules[i]

            particule.manageLifetime(dt)

            if(particule.remainingTime < 0){
                particule.sprite.destroy()
                this.particules.splice(i, 1)
                //Return to last particule
                i--
            }
        }

        //Decrease remainingTime of emmission if it has one
        if(this.remainingTime !== undefined){
            this.remainingTime -= dt;
        }

        if (this.spawnedEnable && this.particules.length < this.maxParticules && (this.remainingTime === undefined || this.remainingTime > 0)){
            //Spawned new particules
            let numberNewParticules = 1 + Math.floor(dt/this.particuleFrequence)
            let increaseTime = dt%this.particuleFrequence

            //Don t overload the server during low framerate
            if(numberNewParticules * 10 > this.maxParticules){
                numberNewParticules = Math.floor(this.maxParticules / 10) + 1
                increaseTime = 0;
            }

            for(let i = 0; i < numberNewParticules; i++){
                const particule = this.particuleTemplate.generateParticules(this.particuleTemplate);

                canvas.app.stage.addChild(particule.sprite);
                this.particules.push(particule)

                this.spawnedEnable = false;

                setTimeout(this.enableSpawning.bind(this), this.particuleFrequence + increaseTime)
            }

        }  if (this.remainingTime !== undefined && this.remainingTime <= 0 && this.particules.length === 0){
            //delete emission
            canvas.app.ticker.remove(this.callback);
            const emitterIndex =  ParticuleEmitter.emitters.findIndex((emitter) => emitter.id === this.id)
            ParticuleEmitter.emitters.splice(emitterIndex, 1)
        }
    }

    //Delete immediatly emission without waiting for each particule's end
    _immediatelyStopEmission(){
        while(this.particules.length > 0){
            let particule = this.particules[0]
            particule.sprite.destroy()
            this.particules.splice(0, 1)
        }

        canvas.app.ticker.remove(this.callback);
        const emitterIndex =  ParticuleEmitter.emitters.findIndex((emitter) => emitter.id === this.id)
        ParticuleEmitter.emitters.splice(emitterIndex, 1)
    }


    enableSpawning() {
        this.spawnedEnable = true;
    }
}