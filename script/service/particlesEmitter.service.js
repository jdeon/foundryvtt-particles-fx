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
    const orderedInputs = _orderInputArg([...args, { type : 'Spraying'}]);
    return _handleMultipleEmission(orderedInputs, _sprayParticles)
}

function _sprayParticles(colorTemplate, motionTemplate, inputObject, emitterId) {
    CompatibiltyV2Manager.correctDeprecatedParam(inputObject)

    const finalInput = _mergeTemplate(colorTemplate, motionTemplate, inputObject)

    const particleTemplate = SprayingParticleTemplate.build(finalInput)

    return _abstractInitParticles(inputObject, finalInput, particleTemplate, emitterId)
}

export function missileParticles(...args) {
    const orderedInputs = _orderInputArg([...args, { type : 'Missile'}]);

    if(orderedInputs.motionNameTemplates.length > 1){
        const particleInputs = orderedInputs.motionNameTemplates.map((motionName) => [orderedInputs.inputObject, motionName, ...orderedInputs.colorNameTemplates, ...orderedInputs.particleShapes]);
        const parentInput = buildInputForParentEmitter(particleInputs);
        return _sprayParticles(undefined, undefined, parentInput, orderedInputs.emitterId) //Simpler for a spray to handle a parent workflow
    } else {
        const motionTemplate = ParticlesEmitter.prefillMotionTemplate[orderedInputs.motionNameTemplates[0]];
        const colorTemplates = orderedInputs.colorNameTemplates.map((templateName) => ParticlesEmitter.prefillColorTemplate[templateName]);
        return _missileParticles({
            emitterId: orderedInputs.emitterId, 
            inputObject: orderedInputs.inputObject,
            motionTemplate,
            colorTemplates,
            particleShapes: orderedInputs.particleShapes
        })
    }
}

function _missileParticles({ emitterId, inputObject, motionTemplate, colorTemplates, particleShapes}) {
    CompatibiltyV2Manager.correctDeprecatedParam(inputObject)

    const finalInput = _mergeTemplate(
        Utils.retrieveRandomElementFromArray(colorTemplates),
        motionTemplate,
        inputObject
    )

    if(particleShapes.length > 0){
        inputObject.particleShape = Utils.retrieveRandomElementFromArray(particleShapes);
    }

    const colorNameSafeArray = colorTemplates.length > 0 ? colorTemplates : [undefined];
    const shapeSafeArray = particleShapes.length > 0 ? particleShapes : [undefined];

    const subParticleTemplates = [];
    colorNameSafeArray.forEach((colorTemplate) => {
        shapeSafeArray.forEach((particleShape) => {
            const finalSubParticlesInput = Utils.mergeInputTemplate(finalInput.subParticles, colorTemplate)

            if(colorTemplate === undefined){
                if (!finalSubParticlesInput.particleColorStart) {
                    finalSubParticlesInput.particleColorStart = finalInput.particleColorStart;
                    finalSubParticlesInput.particleColorEnd = finalInput.particleColorEnd;
                } else if (!finalSubParticlesInput.particleColorEnd) {
                    finalSubParticlesInput.particleColorEnd = finalInput.subParticles.particleColorStart;
                }
            }

            if(particleShape){
                finalSubParticlesInput.particleShape = particleShape;
            } else if (!finalInput.subParticles.particleShape) {
                finalSubParticlesInput.particleShape = finalInput.particleShape;
            }

            let subParticleTemplate
            if (finalSubParticlesInput.type === SprayingParticleTemplate.getType()) {
                //this is a spray particle
                subParticleTemplate = SprayingParticleTemplate.build(finalSubParticlesInput);
                subParticleTemplate.type = SprayingParticleTemplate.getType();
            } else if (finalSubParticlesInput.type === GravitingParticleTemplate.getType()) {
                //this is a graviting particle
                subParticleTemplate = GravitingParticleTemplate.build(finalSubParticlesInput);
                subParticleTemplate.type = GravitingParticleTemplate.getType();
            }

            if(subParticleTemplate){
                subParticleTemplates.push(subParticleTemplate)
            }
        })
    })

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
        subParticleTemplates,
    );

    //finalInput.emissionDuration must be the same as mainParticle.particleLifetime
    finalInput.emissionDuration = particleTemplate.mainParticle.particleLifetime

    return _abstractInitParticles(inputObject, finalInput, particleTemplate, emitterId)
}

export function gravitateParticles(...args) {
    const orderedInputs = _orderInputArg([...args, { type : 'Graviting'}]);
    return _handleMultipleEmission(orderedInputs, _gravitateParticles)
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

//if found emitter has parent workflow return it
function findEmitterById(emitterId){
    if (emitterId === undefined || (typeof emitterId === 'string' && (emitterId.toLowerCase() === 'l' || emitterId.toLowerCase() === 'last'))) {
        //Find last emitter
        return findParentEmitterIdAlive(ParticlesEmitter.emitters[ParticlesEmitter.emitters.length - 1])
    } else if (typeof emitterId === 'string' && (emitterId.toLowerCase() === 'f' || emitterId.toLowerCase() === 'first')) {
        //Find first emitter
        return findParentEmitterIdAlive(ParticlesEmitter.emitters[0])
    } else {
        return ParticlesEmitter.emitters.find(emitter => emitter.id === String(emitterId));
    } 
}

function findParentEmitterIdAlive(emitter){
    let parent = emitter;
    let current;
    while (parent){
        current = parent;
        const workflowId = current.parentWorkflowId;

        if(workflowId){
            const workflowEmitterId = workflowId.split(":")[0];
            parent = ParticlesEmitter.emitters.find(emitter => emitter.id === workflowEmitterId);
        } else {
            parent = undefined;
        }
        
    }

    return current
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

    let htmlMessage = await renderTemplate(`modules/${s_MODULE_ID}/template/message-particle_state.hbs`, dataExport) //TODO rename foundry.applications.handlebars.renderTemplate

    ui.chat.processMessage("/w gm " + htmlMessage);

    return htmlMessage
}


function _abstractInitParticles(inputQuery, finalInput, particleTemplate, emitterIds) {
    const particlesEmitter = new ParticlesEmitter(
        emitterIds.emitterId || nextEmitterId(),
        particleTemplate,
        {
            spawningFrequence: finalInput.spawningFrequence,
            spawningNumber:  finalInput.spawningNumber,
            maxParticles: finalInput.maxParticles,
            emissionDuration: finalInput.emissionDuration,
        },
        emitterIds.parentWorkflowId,
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

function _orderInputArg(args) {
    let inputObject = {}
    let motionNameTemplates = []
    let colorNameTemplates = []
    let particleShapes = []
    let emitterId

    for (let arg of args) {
        if (arg.emitterId) {
            emitterId = arg
        } else if (arg instanceof Object) {
            inputObject = {...inputObject, ...arg}
        } else if (ParticlesEmitter.prefillMotionTemplate[arg]) {
            motionNameTemplates.push(arg)
        } else if (ParticlesEmitter.prefillColorTemplate[arg]) {
            colorNameTemplates.push(arg)
        } else if (Object.keys(SPRITE_TEXTURE_MAPPING).includes(arg.toUpperCase())){
            particleShapes.push(arg.toUpperCase());
        }
    }

    return { emitterId, inputObject, motionNameTemplates, colorNameTemplates, particleShapes}
}

function _handleMultipleEmission({ emitterId, inputObject, motionNameTemplates, colorNameTemplates, particleShapes} , callback) {
    let computedInput, motionTemplate, colorTemplate
    if(motionNameTemplates.length > 1 || colorNameTemplates.length > 1 || particleShapes.length > 1 ){
        const motionNameSafeArray = motionNameTemplates.length > 0 ? motionNameTemplates : [null];
        const colorNameSafeArray = colorNameTemplates.length > 0 ? colorNameTemplates : [null];
        const shapeSafeArray = particleShapes.length > 0 ? particleShapes : [null];
        const particleInputs = [];

        const nbEmitterSibling = colorNameSafeArray.length * shapeSafeArray.length //Lower generated particles number depending of the number of emmitter generated

        for(let motion of motionNameSafeArray){
            for(let color of colorNameSafeArray){
                for(let shape of shapeSafeArray){
                    particleInputs.push([{...inputObject, _nbEmitterSibling: nbEmitterSibling}, motion, color, shape].filter((item) => item !== null));
                }
            }
        }

        computedInput = buildInputForParentEmitter(particleInputs);
    } else {
        motionTemplate = motionNameTemplates.length === 1 ? ParticlesEmitter.prefillMotionTemplate[motionNameTemplates[0]] : undefined;
        colorTemplate = colorNameTemplates.length === 1 ? ParticlesEmitter.prefillColorTemplate[colorNameTemplates[0]] : undefined;
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