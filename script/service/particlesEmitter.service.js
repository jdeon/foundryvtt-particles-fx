import { s_MODULE_ID, s_EVENT_NAME, Vector3, Utils, SPRITE_TEXTURE_MAPPING } from "../utils/utils.js"
import { s_MESSAGE_TYPES } from "../utils/socketManager.js"
import ParticlesEmitter from "../object/particlesEmitter.js"
import { SprayingParticleTemplate, GravitingParticleTemplate, MissileParticleTemplate } from "../object/particleTemplate.js"
import { ParticleWorkFlowManager } from "../object/particleWorkFlow.js"
import { defaultMotionTemplate } from "../prefillMotionTemplate.js"
import { defaultColorTemplate } from "../prefillColorTemplate.js"
import { CompatibiltyV2Manager } from "../utils/compatibilityManager.js"


export function nextEmitterId() {
    let lastId = game.settings.get(s_MODULE_ID, "maxEmitterId");
    lastId++

    if (game.user.isGM) {
        game.settings.set(s_MODULE_ID, "maxEmitterId", lastId);
    } else {
        game.socket.emit(s_EVENT_NAME, {
            type: s_MESSAGE_TYPES.updateMaxEmitterId,
            payload: { maxEmitterId: lastId }
        });
    }


    return lastId
}

export function resetEmitterId() {
    if (game.user.isGM) {
        game.settings.set(s_MODULE_ID, "maxEmitterId", 0);
    } else {
        game.socket.emit(s_EVENT_NAME, {
            type: s_MESSAGE_TYPES.updateMaxEmitterId,
            payload: { maxEmitterId: 0 }
        });
    }
}


export function initEmitters(emittersQueries) {
    const isSaveAllowed = game.settings.get(s_MODULE_ID, "saveEmitters")
    if (isSaveAllowed && emittersQueries && Array.isArray(emittersQueries)) {
        emittersQueries.forEach(query => {
            switch (query.type) {
                case SprayingParticleTemplate.getType():
                    sprayParticles(query);
                    break;
                case GravitingParticleTemplate.getType():
                    gravitateParticles(query);
                    break;
                case MissileParticleTemplate.getType():
                    missileParticles(query);
                    break;
                default:
                    sprayParticles(query);
            }
        });
    }
}

export function sprayParticles(...args) {
    return _orderInputArg([...args, { type : 'Spraying'}], _sprayParticles);
}

function _sprayParticles(colorTemplate, motionTemplate, inputObject, emitterId) {
    CompatibiltyV2Manager.correctDeprecatedParam(inputObject)

    const finalInput = _mergeTemplate(colorTemplate, motionTemplate, inputObject)

    const particleTemplate = SprayingParticleTemplate.build(finalInput)

    return _abstractInitParticles(inputObject, finalInput, particleTemplate, emitterId)
}

export function missileParticles(...args) {
    return _orderInputArg([...args, { type : 'Missile'}], _missileParticles);
}

function _missileParticles(colorTemplate, motionTemplate, inputObject, emitterId) {
    CompatibiltyV2Manager.correctDeprecatedParam(inputObject)

    const finalInput = _mergeTemplate(colorTemplate, motionTemplate, inputObject)

    if (finalInput.subParticles) {
        if (!finalInput.subParticles.particleColorStart) {
            finalInput.subParticles.particleColorStart = finalInput.particleColorStart
            finalInput.subParticles.particleColorEnd = finalInput.particleColorEnd
        } else if (!finalInput.subParticles.particleColorEnd) {
            finalInput.subParticles.particleColorEnd = finalInput.subParticles.particleColorStart
        }
    }

    let subParticleTemplate
    if (finalInput.subParticles) {
        if (finalInput.subParticles.type === SprayingParticleTemplate.getType()) {
            //this is a spray particle
            subParticleTemplate = SprayingParticleTemplate.build(finalInput.subParticles)
            subParticleTemplate.type = SprayingParticleTemplate.getType()
        } else if (finalInput.subParticles.type === GravitingParticleTemplate.getType()) {
            //this is a graviting particle
            subParticleTemplate = GravitingParticleTemplate.build(finalInput.subParticles)
            subParticleTemplate.type = GravitingParticleTemplate.getType()
        }
    }

    const particleTemplate = new MissileParticleTemplate(
        finalInput.source,
        finalInput.target,
        finalInput.pathType,
        Vector3.build(finalInput.positionSpawning),
        finalInput.particleVelocityStart,
        finalInput.particleVelocityEnd,
        finalInput.particleRiseRateStart,
        finalInput.particleRiseRateEnd,
        finalInput.particleAngleStart,
        finalInput.particleAngleEnd,
        finalInput.particleSizeStart,
        finalInput.particleSizeEnd,
        finalInput.particleRotationStart,
        finalInput.particleRotationEnd,
        finalInput.particleLifetime,
        finalInput.particleShape,
        Vector3.build(finalInput.particleColorStart),
        Vector3.build(finalInput.particleColorEnd),
        finalInput.alphaStart,
        finalInput.alphaEnd,
        finalInput.vibrationAmplitudeStart,
        finalInput.vibrationAmplitudeEnd,
        finalInput.vibrationFrequencyStart,
        finalInput.vibrationFrequencyEnd,
        finalInput.freezeOnPause,
        finalInput.next,
        finalInput.advanced,
        subParticleTemplate,
    );

    //finalInput.emissionDuration must be the same as mainParticle.particleLifetime
    finalInput.emissionDuration = particleTemplate.mainParticle.particleLifetime

    return _abstractInitParticles(inputObject, finalInput, particleTemplate, emitterId)
}

export function gravitateParticles(...args) {
    return _orderInputArg([...args, {type : 'Graviting'}], _gravitateParticles);
}

function _gravitateParticles(colorTemplate, motionTemplate, inputObject, emitterId) {
    CompatibiltyV2Manager.correctDeprecatedParam(inputObject)

    const finalInput = _mergeTemplate(colorTemplate, motionTemplate, inputObject)

    const particleTemplate = GravitingParticleTemplate.build(finalInput)

    return _abstractInitParticles(inputObject, finalInput, particleTemplate, emitterId)
}

export function buildInputForParentEmitter(childsInputs) {
    return {
            source: new Vector3(0,0,0),
            maxParticles: 0,
            emissionDuration: ParticlesEmitter.UNTIL_CHILD_END_DURATION,
            next: [{
                type: "atEmissionStart",
                delay: 0,
                particleInputs: childsInputs
            }]
        }
}

export function persistEmitters() {
    const isSaveAllowed = game.settings.get(s_MODULE_ID, "saveEmitters")

    if (isSaveAllowed && game.user.isGM) {
        const activeEmmittersQuery = ParticlesEmitter.emitters
            .filter(emitter => emitter.remainingTime === undefined || emitter.remainingTime > 0)
            .map(emitter => {
                const query = emitter.finalQuery
                query.emissionDuration = emitter.remainingTime
                query.type = emitter.particleTemplate.constructor.getType()
                return query
            })

        if (activeEmmittersQuery) {
            canvas.scene.setFlag(s_MODULE_ID, "emitters", activeEmmittersQuery)
        } else {
            canvas.scene.unsetFlag(s_MODULE_ID, "emitters")
        }
    }
}

export function stopAllEmission(immediate) {
    let deletedIds = []

    ParticleWorkFlowManager.stopAll(immediate);

    if (immediate) {
        while (ParticlesEmitter.emitters.length > 0) {
            let emitter = ParticlesEmitter.emitters[0]
            emitter.disableWorkflow()
            emitter.destroy()
            deletedIds.push(emitter.id)
        }
    } else {
        ParticlesEmitter.emitters.forEach(emitter => {
            emitter.remainingTime = 0
            emitter.disableWorkflow()
            deletedIds.push(emitter.id)
        })
    }

    return deletedIds
}

export function stopEmissionById(emitterId, immediate) {

    const emitter = findEmitterById(emitterId)

    if (emitter) {
        const workflows = ParticleWorkFlowManager.getWorkflowsByEmitterId(emitter.id)
        workflows.forEach((workflow) => workflow.destroy(immediate))

        emitter.disableWorkflow()
        if (immediate) {
            emitter.destroy()
        } else {
            emitter.remainingTime = 0
        }

        return emitter.id
    }
}

export function stopWorkflow(emitterId, immediate, all){
    if(all) {
        ParticleWorkFlowManager.stopAll(immediate);

        ParticlesEmitter.emitters.forEach(emitter => {
            emitter.disableWorkflow()
        })

        return
    }

    const emitter = findEmitterById(emitterId)

    if (emitter) {
        const workflows = ParticleWorkFlowManager.getWorkflowsByEmitterId(emitter.id)
        workflows.forEach((workflow) => workflow.destroy(immediate))

        emitter.disableWorkflow()

        return emitter.id
    }
}

function findEmitterById(emitterId){
    if (emitterId === undefined || (typeof emitterId === 'string' && (emitterId.toLowerCase() === 'l' || emitterId.toLowerCase() === 'last'))) {
        //Find last emitter
        return ParticlesEmitter.emitters[ParticlesEmitter.emitters.length - 1]
    } else if (typeof emitterId === 'string' && (emitterId.toLowerCase() === 'f' || emitterId.toLowerCase() === 'first')) {
        //Find last emitter
        return ParticlesEmitter.emitters[0]
    } else {
        return ParticlesEmitter.emitters.find(emitter => emitter.id === String(emitterId));
    } 
}

export async function writeMessageForEmissionById(emitterId, verbal) {
    let emitter = ParticlesEmitter.emitters.find(emitter => emitter.id === emitterId);

    if (emitter === undefined) {
        return game.i18n.localize("PARTICULE-FX.Emission.Not-found") + emitterId
    }

    //show originalQuery if verbal
    const dataExport = {
        emitterId,
        originalQuery: verbal ? JSON.stringify(emitter.originalQuery) : undefined
    }

    let htmlMessage = await renderTemplate(`modules/${s_MODULE_ID}/template/message-particle_state.hbs`, dataExport)

    ui.chat.processMessage("/w gm " + htmlMessage);

    return htmlMessage
}


function _abstractInitParticles(inputQuery, finalInput, particleTemplate, emitterId) {
    const particlesEmitter = new ParticlesEmitter(
        emitterId || nextEmitterId(),
        particleTemplate,
        {
            spawningFrequence: finalInput.spawningFrequence,
            spawningNumber:  finalInput.spawningNumber,
            maxParticles: finalInput.maxParticles,
            emissionDuration: finalInput.emissionDuration,
        },
        finalInput._nbEmitterSibling
    );

    // Listen for animate update
    particlesEmitter.callback = particlesEmitter.manageParticles.bind(particlesEmitter)
    particlesEmitter.originalQuery = inputQuery
    particlesEmitter.finalQuery = finalInput

    canvas.app.ticker.add(particlesEmitter.callback)

    ParticlesEmitter.emitters.push(particlesEmitter)

    return particlesEmitter
}

function _orderInputArg(args, callback) {
    let inputObject = {}
    let motionTemplates = []
    let colorTemplates = []
    let particleShapes = []
    let emitterId

    for (let arg of args) {
        if (arg.emitterId) {
            emitterId = arg.emitterId
        } else if (arg instanceof Object) {
            inputObject = {...inputObject, ...arg}
        } else if (ParticlesEmitter.prefillMotionTemplate[arg]) {
            motionTemplates.push(arg)
        } else if (ParticlesEmitter.prefillColorTemplate[arg]) {
            colorTemplates.push(arg)
        } else if (Object.keys(SPRITE_TEXTURE_MAPPING).includes(arg.toUpperCase())){
            particleShapes.push(arg.toUpperCase());
        }
    }

    let computedInput, motionTemplate, colorTemplate
    if(motionTemplates.length > 1 || colorTemplates.length > 1 || particleShapes.length > 1 ){
        const motionSafeArray = motionTemplates.length > 0 ? motionTemplates : [null];
        const colorSafeArray = colorTemplates.length > 0 ? colorTemplates : [null];
        const shapeSafeArray = particleShapes.length > 0 ? particleShapes : [null];
        const particleInputs = [];

        const nbEmitterSibling = colorSafeArray.length * shapeSafeArray.length //Lower generated particles number depending of the number of emmitter generated

        for(let motion of motionSafeArray){
            for(let color of colorSafeArray){
                for(let shape of shapeSafeArray){
                    particleInputs.push([{...inputObject, _nbEmitterSibling: nbEmitterSibling}, motion, color, shape].filter((item) => item !== null)); //TODO divide particleMax and particles spawning use advanced variable ?
                }
            }
        }

        computedInput = buildInputForParentEmitter(particleInputs);
    } else {
        motionTemplate = motionTemplates.length === 1 ? ParticlesEmitter.prefillMotionTemplate[motionTemplates[0]] : undefined;
        colorTemplate = colorTemplates.length === 1 ? ParticlesEmitter.prefillColorTemplate[colorTemplates[0]] : undefined;
        computedInput = inputObject;
        
        if (particleShapes.length === 1){
            computedInput.particleShape = particleShapes[0]
        }
    }

    return callback(colorTemplate, motionTemplate, computedInput, emitterId)
}

function _mergeTemplate(colorTemplate, motionTemplate, inputObject) {
    const inputMergeMotionTemplate = Utils.mergeInputTemplate(inputObject, motionTemplate)
    const inputMergeColorTemplate = Utils.mergeInputTemplate(inputMergeMotionTemplate, colorTemplate)
    const mergeDefaultValue = Utils.mergeInputTemplate(defaultMotionTemplate(), defaultColorTemplate())
    const finalInput = Utils.mergeInputTemplate(inputMergeColorTemplate, mergeDefaultValue)

    return finalInput;
}