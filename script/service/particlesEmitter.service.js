import { s_MODULE_ID, s_EVENT_NAME, Vector3, Utils } from "../utils/utils.js"
import { s_MESSAGE_TYPES } from "../utils/socketManager.js"
import ParticlesEmitter from "../object/particlesEmitter.js"
import { SprayingParticleTemplate, GravitingParticleTemplate, MissileParticleTemplate } from "../object/particleTemplate.js"
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
    const orderInputArg = _orderInputArg(args);

    return _sprayParticles(orderInputArg.colorTemplate, orderInputArg.motionTemplate, orderInputArg.inputObject, orderInputArg.emitterId)
}

function _sprayParticles(colorTemplate, motionTemplate, inputObject, emitterId) {
    const particleTexture = PIXI.Texture.from(`/modules/${s_MODULE_ID}/particle.png`);
    CompatibiltyV2Manager.correctDeprecatedParam(inputObject)

    const finalInput = _mergeTemplate(colorTemplate, motionTemplate, inputObject)

    const particleTemplate = SprayingParticleTemplate.build(finalInput, particleTexture)

    return _abstractInitParticles(inputObject, finalInput, particleTemplate, emitterId)
}

export function missileParticles(...args) {
    const orderInputArg = _orderInputArg(args);

    return _missileParticles(orderInputArg.colorTemplate, orderInputArg.motionTemplate, orderInputArg.inputObject, orderInputArg.emitterId)
}

function _missileParticles(colorTemplate, motionTemplate, inputObject, emitterId) {
    const particleTexture = PIXI.Texture.from(`/modules/${s_MODULE_ID}/particle.png`);

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
            subParticleTemplate = SprayingParticleTemplate.build(finalInput.subParticles, particleTexture)
            subParticleTemplate.type = SprayingParticleTemplate.getType()
        } else if (finalInput.subParticles.type === GravitingParticleTemplate.getType()) {
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
        finalInput.particleRiseRateStart,
        finalInput.particleRiseRateEnd,
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
        finalInput.advanced,
        subParticleTemplate,
    );

    //finalInput.emissionDuration must be the same as mainParticle.particleLifetime
    finalInput.emissionDuration = particleTemplate.mainParticle.particleLifetime

    return _abstractInitParticles(inputObject, finalInput, particleTemplate, emitterId)
}

export function gravitateParticles(...args) {
    const orderInputArg = _orderInputArg(args);

    return _gravitateParticles(orderInputArg.colorTemplate, orderInputArg.motionTemplate, orderInputArg.inputObject, orderInputArg.emitterId)
}

function _gravitateParticles(colorTemplate, motionTemplate, inputObject, emitterId) {
    const particleTexture = PIXI.Texture.from(`/modules/${s_MODULE_ID}/particle.png`);

    CompatibiltyV2Manager.correctDeprecatedParam(inputObject)

    const finalInput = _mergeTemplate(colorTemplate, motionTemplate, inputObject)

    const particleTemplate = GravitingParticleTemplate.build(finalInput, particleTexture)

    return _abstractInitParticles(inputObject, finalInput, particleTemplate, emitterId)
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

    if (immediate) {
        while (ParticlesEmitter.emitters.length > 0) {
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

export function stopEmissionById(emitterId, immediate) {
    let emitter
    if (emitterId === undefined || (typeof emitterId === 'string' && (emitterId.toLowerCase() === 'l' || emitterId.toLowerCase() === 'last'))) {
        //Find last emitter
        emitter = ParticlesEmitter.emitters[ParticlesEmitter.emitters.length - 1]
    } else if (typeof emitterId === 'string' && (emitterId.toLowerCase() === 'f' || emitterId.toLowerCase() === 'first')) {
        //Find last emitter
        emitter = ParticlesEmitter.emitters[0]
    } else if (typeof emitterId === 'number') {
        emitter = ParticlesEmitter.emitters.find(emitter => emitter.id === emitterId);
    } else if (!isNaN(emitterId)) {
        emitter = ParticlesEmitter.emitters.find(emitter => emitter.id === Number(emitterId));
    }

    if (emitter) {
        if (immediate) {
            emitter._immediatelyStopEmission()
        } else {
            emitter.remainingTime = 0
        }

        return emitter.id
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
    particlesEmitter.id = emitterId || nextEmitterId()

    canvas.app.ticker.add(particlesEmitter.callback)

    ParticlesEmitter.emitters.push(particlesEmitter)

    return particlesEmitter.id
}

function _orderInputArg(args) {
    let inputObject
    let motionTemplate
    let colorTemplate
    let emitterId

    for (let arg of args) {
        if (arg.emitterId) {
            emitterId = arg.emitterId
        } else if (arg instanceof Object) {
            inputObject = arg
        } else if (ParticlesEmitter.prefillMotionTemplate[arg]) {
            motionTemplate = ParticlesEmitter.prefillMotionTemplate[arg]
        } else if (ParticlesEmitter.prefillColorTemplate[arg]) {
            colorTemplate = ParticlesEmitter.prefillColorTemplate[arg]
        }
    }

    return { colorTemplate, motionTemplate, inputObject, emitterId }
}

function _mergeTemplate(colorTemplate, motionTemplate, inputObject) {
    const inputMergeMotionTemplate = Utils.mergeInputTemplate(inputObject, motionTemplate)
    const inputMergeColorTemplate = Utils.mergeInputTemplate(inputMergeMotionTemplate, colorTemplate)
    const mergeDefaultValue = Utils.mergeInputTemplate(defaultMotionTemplate(), defaultColorTemplate())
    const finalInput = Utils.mergeInputTemplate(inputMergeColorTemplate, mergeDefaultValue)

    return finalInput;
}