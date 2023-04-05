import { SprayingParticuleTemplate, GravitingParticuleTemplate} from "./particuleTemplate.js"
import { Vector3 } from "./utils.js"

export default class ParticuleEmitter { 
    
    static defaultInput = {
        spawningFrequence: 3, 
        maxParticules: 100,
        positionSpawning: {x:0,y:0},
        particuleVelocityStart: 200,
        particuleVelocityEnd: 50,
        particuleAngleStart: '0_360',
        particuleAngleEnd: undefined,
        particuleRadiusStart: 100,
        particuleRadiusEnd: 50,
        particuleSizeStart: 10,
        particuleSizeEnd: '10_25',
        particuleLifetime: [1000,1500],
        particuleColorStart:new Vector3(250, 250, 50),
        particuleColorEnd:new Vector3(250, '50_100', 0),
        alphaStart:1,
        alphaEnd:0
    }

    static maxId = 1

    static emitters = []

    static sprayParticules(inputObject){
        const particuleTexture = PIXI.Texture.from('/modules/particule-fx/particule.png');

        const position = new Vector3(
            inputObject.positionSpawning.x || ParticuleEmitter.defaultInput.positionSpawning.x, 
            inputObject.positionSpawning.y || ParticuleEmitter.defaultInput.positionSpawning.y, 
            0
            )

        const particuleTemplate = new SprayingParticuleTemplate(
            position, 
            inputObject.particuleVelocityStart || ParticuleEmitter.defaultInput.particuleVelocityStart, 
            inputObject.particuleVelocityEnd || inputObject.particuleVelocityStart || ParticuleEmitter.defaultInput.particuleVelocityEnd, 
            inputObject.particuleAngleStart || ParticuleEmitter.defaultInput.particuleAngleStart, 
            inputObject.particuleAngleEnd || inputObject.particuleAngleStart || ParticuleEmitter.defaultInput.particuleAngleEnd, 
            inputObject.particuleSizeStart || ParticuleEmitter.defaultInput.particuleSizeStart,
            inputObject.particuleSizeEnd || inputObject.particuleSizeStart || ParticuleEmitter.defaultInput.particuleSizeEnd, 
            inputObject.particuleLifetime || ParticuleEmitter.defaultInput.particuleLifetime, 
            particuleTexture, 
            inputObject.particuleColorStart || ParticuleEmitter.defaultInput.particuleColorStart, 
            inputObject.particuleColorEnd || inputObject.particuleColorStart || ParticuleEmitter.defaultInput.particuleColorEnd,
            inputObject.alphaStart || ParticuleEmitter.defaultInput.alphaStart, 
            inputObject.alphaEnd || inputObject.alphaStart || ParticuleEmitter.defaultInput.alphaEnd
            );

        return ParticuleEmitter._abstractInitParticules(inputObject, particuleTemplate)
    }

    static gravitateParticules(inputObject){
        const particuleTexture = PIXI.Texture.from('/modules/particule-fx/particule.png');

        const position = new Vector3(
            inputObject.positionSpawning.x || ParticuleEmitter.defaultInput.positionSpawning.x, 
            inputObject.positionSpawning.y || ParticuleEmitter.defaultInput.positionSpawning.y, 
            0
            )

        const particuleTemplate = new GravitingParticuleTemplate(
            position, 
            inputObject.particuleAngleStart || ParticuleEmitter.defaultInput.particuleAngleStart, 
            inputObject.angularVelocityStart || ParticuleEmitter.defaultInput.particuleVelocityStart, 
            inputObject.angularVelocityEnd || inputObject.angularVelocityStart || ParticuleEmitter.defaultInput.particuleVelocityEnd, 
            inputObject.particuleRadiusStart || ParticuleEmitter.defaultInput.particuleRadiusStart, 
            inputObject.particuleRadiusEnd || inputObject.particuleRadiusStart || ParticuleEmitter.defaultInput.particuleRadiusEnd, 
            inputObject.particuleSizeStart || ParticuleEmitter.defaultInput.particuleSizeStart,
            inputObject.particuleSizeEnd || inputObject.particuleSizeStart || ParticuleEmitter.defaultInput.particuleSizeEnd, 
            inputObject.particuleLifetime || ParticuleEmitter.defaultInput.particuleLifetime, 
            particuleTexture, 
            inputObject.particuleColorStart || ParticuleEmitter.defaultInput.particuleColorStart, 
            inputObject.particuleColorEnd || inputObject.particuleColorStart || ParticuleEmitter.defaultInput.particuleColorEnd,
            inputObject.alphaStart || ParticuleEmitter.defaultInput.alphaStart, 
            inputObject.alphaEnd || inputObject.alphaStart || ParticuleEmitter.defaultInput.alphaEnd
            );

        return ParticuleEmitter._abstractInitParticules(inputObject, particuleTemplate)
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


    static _abstractInitParticules(inputObject, particuleTemplate){
        const particuleEmitter = new ParticuleEmitter(
            particuleTemplate, 
            inputObject.spawningFrequence || ParticuleEmitter.defaultInput.spawningFrequence, 
            inputObject.maxParticules || ParticuleEmitter.defaultInput.maxParticules,
            inputObject.emissionDuration
            );

        // Listen for animate update
        particuleEmitter.callback = particuleEmitter.manageParticules.bind(particuleEmitter)
        particuleEmitter.originalQuery = inputObject
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