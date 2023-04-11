import { SprayingParticuleTemplate, GravitingParticuleTemplate} from "./particuleTemplate.js"
import { Vector3, Utils } from "./utils.js"
import { motionTemplateDictionnary, defaultMotionTemplate } from "./prefillMotionTemplate.js"
import { colorTemplateDictionnary, defaultColorTemplate } from "./prefillColorTemplate.js"

export default class ParticuleEmitter { 

    static maxId = 1

    static emitters = []

    static sprayParticules(...args){
        const orderInputArg = ParticuleEmitter._orderInputArg(args);

        return ParticuleEmitter._sprayParticules(orderInputArg.colorTemplate, orderInputArg.motionTemplate, orderInputArg.inputObject)
    }

    static _sprayParticules(colorTemplate, motionTemplate, inputObject){
        const particuleTexture = PIXI.Texture.from('/modules/particule-fx/particule.png');

        const finalInput = ParticuleEmitter._mergeTemplate(colorTemplate, motionTemplate, inputObject)

        const particuleTemplate = new SprayingParticuleTemplate(
            finalInput.source,
            finalInput.target,
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
        const orderInputArg = ParticuleEmitter._orderInputArg(args);

        return ParticuleEmitter._gravitateParticules(orderInputArg.colorTemplate, orderInputArg.motionTemplate, orderInputArg.inputObject)
    }

    static _gravitateParticules(colorTemplate, motionTemplate, inputObject){
        const particuleTexture = PIXI.Texture.from('/modules/particule-fx/particule.png');

        const finalInput = ParticuleEmitter._mergeTemplate(colorTemplate, motionTemplate, inputObject)

        const particuleTemplate = new GravitingParticuleTemplate(
            finalInput.source,
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
            finalInput.onlyEmitterFollow
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
            return game.i18n.localize("PARTICULE-FX.Emission.Not-found") + emitterId
        }

        //show originalQuery if verbal
        const dataExport = {
            emittorId: emitterId,
            originalQuery : verbal ? JSON.stringify(emitter.originalQuery) : undefined
        }

        let htmlMessage = await renderTemplate("modules/particule-fx/template/message-particule_state.hbs", dataExport)

        ui.chat.processMessage("/w gm " + htmlMessage );

        return htmlMessage
    }


    static _abstractInitParticules(inputQuery, finalInput, particuleTemplate){
        const particuleEmitter = new ParticuleEmitter(
            particuleTemplate, 
            finalInput.spawningFrequence, 
            finalInput.spawningNumber,
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

    static _orderInputArg(args){
        let inputObject
        let motionTemplate
        let colorTemplate

        for(let arg of args){
            if(arg instanceof Object){
                inputObject = arg
            } else if(motionTemplateDictionnary[arg]){
                motionTemplate =  motionTemplateDictionnary[arg]
            } else if(colorTemplateDictionnary[arg]){
                colorTemplate =  colorTemplateDictionnary[arg]
            }
        }

        return {colorTemplate, motionTemplate, inputObject}
    }

    static _mergeTemplate(colorTemplate, motionTemplate, inputObject){
        const inputMergeMotionTemplate = Utils.mergeInputTemplate(inputObject , motionTemplate)
        const inputMergeColorTemplate = Utils.mergeInputTemplate(inputMergeMotionTemplate , colorTemplate)
        const finalInput = Utils.mergeInputTemplate(inputMergeColorTemplate , {...defaultMotionTemplate, ...defaultColorTemplate})

        return finalInput;
    }


    constructor(particuleTemplate, particuleFrequence, spawningNumber, maxParticules, emissionDuration, isGravitate){
        this.spawnedEnable = true;
        this.particules = [];
        this.particuleTemplate = particuleTemplate;
        this.particuleFrequence = particuleFrequence;
        this.spawningNumber = spawningNumber;
        this.maxParticules = maxParticules
        this.remainingTime = emissionDuration
        this.isGravitate = isGravitate
        this.lastUpdate = Date.now();
    }

    manageParticules(){
        let newDate = Date.now()
        const dt = newDate - this.lastUpdate
        this.lastUpdate = newDate

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
            let numberNewParticules = 1 + Math.floor(this.spawningNumber * dt/this.particuleFrequence)
            let increaseTime = (this.spawningNumber * dt)%this.particuleFrequence

            //Don t overload the server during low framerate
            if(numberNewParticules * 10 > this.maxParticules){
                numberNewParticules = Math.floor(this.maxParticules / 10) + 1
                increaseTime = 0;
            }

            for(let i = 0; i < numberNewParticules; i++){
                const particule = this.particuleTemplate.generateParticules(this.particuleTemplate);

                canvas.app.stage.addChild(particule.sprite);
                this.particules.push(particule)
            }

            this.spawnedEnable = false;

            setTimeout(this.enableSpawning.bind(this), this.particuleFrequence + increaseTime)

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