import { motionTemplateDictionnary } from "../prefillMotionTemplate.js"
import { colorTemplateDictionnary } from "../prefillColorTemplate.js"
import { Particle } from "./particle.js"
import { ParticleWorkFlowManager } from"./particleWorkFlow.js"

/**
 * Controller class managing a group of particles spawned by a particle template.
 */
export default class ParticlesEmitter {

    /** Default dictionary of motion prefill templates. */
    static prefillMotionTemplate = motionTemplateDictionnary
    /** Default dictionary of color prefill templates. */
    static prefillColorTemplate = colorTemplateDictionnary

    /** Global registry array of active ParticlesEmitter instances. */
    static emitters = []

    /** PIXI.Container serving as the emission canvas container layer. */
    static _EMISSION_CANVAS

    /**
     * Initializes or resets the PIXI container for particle emissions on canvas.
     * @returns {void}
     */
    static INIT_EMISSION_CANVAS = () => {
        let effectsCanvas
        
        if(canvas?.environment?.effects) {
            effectsCanvas = canvas.environment.effects;
        } else {
            //Before v14
            effectsCanvas = canvas.app.stage.rendered.environment.effects;
        };

        if (effectsCanvas.moduleParticlesFx) {
            effectsCanvas.moduleParticlesFx.destroy();
        }

        const particleFxCanvas = new PIXI.Container();
        particleFxCanvas.zIndex = Particle.SORT_LAYER;
        effectsCanvas.addChild(particleFxCanvas);
        effectsCanvas.moduleParticlesFx = particleFxCanvas;
        ParticlesEmitter._EMISSION_CANVAS = particleFxCanvas
    }

    /** Constant key specifying duration until child workflow emissions complete. */
    static UNTIL_CHILD_END_DURATION = 'untilChildEnd'

    /**
     * Constructs a ParticlesEmitter instance.
     * @param {number|string} emitterId - Unique identifier for the emitter.
     * @param {ParticleTemplate} particleTemplate - Template defining particle generation rules.
     * @param {{spawningFrequence: number, spawningNumber: number, maxParticles: number, emissionDuration: number}} emitterProperty - Emission frequency, max count, and duration settings.
     * @param {string} [parentWorkflowId] - ID of parent workflow step if spawned from workflow.
     * @param {number} [nbSibling=1] - Number of sibling emitters sharing particle quota.
     */
    constructor(emitterId, particleTemplate, emitterProperty, parentWorkflowId, nbSibling = 1) {
        this.id = String(emitterId);
        this.parentWorkflowId = parentWorkflowId;
        this.spawnedEnable = true;
        this.particles = [];
        this.particleTemplate = particleTemplate;

        if(nbSibling === 1 ){
            this.particleFrequence = emitterProperty.spawningFrequence;
            this.spawningNumber = emitterProperty.spawningNumber;
            this.maxParticles = emitterProperty.maxParticles;
        } else {
            //TODO mix this.spawningFrequence and this.spawningNumber with nbSibling division to handle low particle tempate (ex: satellite)
            this.particleFrequence = emitterProperty.spawningFrequence * nbSibling;
            this.spawningNumber = emitterProperty.spawningNumber;
            this.maxParticles = Math.ceil(emitterProperty.maxParticles / nbSibling);
        }
        
        this.remainingTime = emitterProperty.emissionDuration
        this.isGravitate = emitterProperty.isGravitate
        this.lastUpdate = Date.now();
        this.destroyHooks = [];
        this.maxParticleId = 0;

        if (!ParticlesEmitter._EMISSION_CANVAS) {
            ParticlesEmitter.INIT_EMISSION_CANVAS()
        }

        ParticleWorkFlowManager.triggerWorkflows ( ParticleWorkFlowManager.NEXT_WORKFLOW_TYPES.AT_EMISSION_START, this.id, this.particleTemplate )
    }

    /**
     * Per-frame ticker callback updating particle positions and spawning new particles.
     * @returns {void}
     */
    manageParticles() {
        let newDate = Date.now()
        const dt = newDate - this.lastUpdate
        this.lastUpdate = newDate

        if(this.particleTemplate.freezeOnPause && game.paused){
            return
        }


        //Handle existing particle
        for (let i = 0; i < this.particles.length; i++) {
            const particle = this.particles[i]

            particle.manageLifetime(dt)

            if (particle.remainingTime <= 0) {
                ParticleWorkFlowManager.triggerWorkflows ( ParticleWorkFlowManager.NEXT_WORKFLOW_TYPES.AT_PARTICLE_END, this.id, this.particleTemplate, particle )
                particle.sprite.destroy()
                this.particles.splice(i, 1)
                //Return to last particle
                i--
            }
        }

        if (this.particleTemplate?.isElevationManage) {
            canvas.primary.sortChildren()
        }

        //Decrease remainingTime of emmission if it has one and it s a number
        if (! isNaN(this.remainingTime)) {
            this.remainingTime -= dt;
        }

        //Handle generation of new particles
        if (
            this.spawnedEnable 
            && this.particles.length < this.maxParticles 
            && (isNaN(this.remainingTime) || this.remainingTime > 0)
            ) {
            //Spawned new particles
            let numberNewParticles = Math.ceil(this.spawningNumber * dt / this.particleFrequence)
            let increaseTime = (this.spawningNumber * dt) % this.particleFrequence

            //Don t overload the server during low framerate
            if (numberNewParticles * 10 > this.maxParticles) {
                numberNewParticles = Math.ceil(this.maxParticles / 10);
                increaseTime = 0;
            }

            for (let i = 0; i < numberNewParticles; i++) {
                const particle = this.particleTemplate.generateParticles(this.particleTemplate);

                if (particle === undefined) {
                    this.remainingTime = 0;
                    break
                }

                particle.id = this.maxParticleId ++;

                ParticlesEmitter._EMISSION_CANVAS.addChild(particle.sprite);
                if (this.particleTemplate?.isElevationManage) {
                    canvas.primary.addChild(particle.sprite);
                }
                this.particles.push(particle);
                ParticleWorkFlowManager.triggerWorkflows ( ParticleWorkFlowManager.NEXT_WORKFLOW_TYPES.AT_PARTICLE_START, this.id, this.particleTemplate, particle );
            }

            this.spawnedEnable = false;

            setTimeout(this.enableSpawning.bind(this), this.particleFrequence + increaseTime);

        }

        //Delete emission
        if (this._shouldEnd()) {
           this.destroy()
        }
    }

    //Delete immediatly emission without waiting for each particle's end
    /**
     * Immediately destroys this emitter, destroys all active particles, and triggers end hooks.
     * @returns {void}
     */
    destroy(){
        canvas.app.ticker.remove(this.callback);

        while (this.particles.length > 0) {
            let particle = this.particles[0]
            particle.sprite.destroy()
            this.particles.splice(0, 1)
        }

        const emitterIndex = ParticlesEmitter.emitters.findIndex((emitter) => emitter.id === this.id);
        if( emitterIndex >= 0 ){
            ParticlesEmitter.emitters.splice(emitterIndex, 1);
        }
        
        ParticleWorkFlowManager.triggerWorkflows ( ParticleWorkFlowManager.NEXT_WORKFLOW_TYPES.AT_EMISSION_END, this.id, this.particleTemplate )

        if(this.destroyHooks.length > 0){
            this.destroyHooks.forEach((destroyHook) => destroyHook(this.id) )
        }
    }

    /**
     * Enables spawning flag after cooldown delay.
     * @returns {void}
     */
    enableSpawning() {
        this.spawnedEnable = true;
    }

    /**
     * Disables chained workflow steps for this emitter.
     * @returns {void}
     */
    disableWorkflow(){
        this.particleTemplate.next = [];
    }

    /**
     * Evaluates whether this emitter has completed its active lifetime and should be destroyed.
     * @returns {boolean} True if emitter should terminate.
     */
    _shouldEnd(){
        if (! isNaN(this.remainingTime) ){
            if( this.remainingTime <= 0 && this.particles.length === 0 ) {
                return true
            }
        } else if (this.remainingTime === ParticlesEmitter.UNTIL_CHILD_END_DURATION ) {
            const childsEmission = ParticleWorkFlowManager.getWorkflowsByEmitterId(this.id) ?? []
            return childsEmission.length === 0;
        }
    }
}