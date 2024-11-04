import { motionTemplateDictionnary } from "../prefillMotionTemplate.js"
import { colorTemplateDictionnary } from "../prefillColorTemplate.js"
import { Particle } from "./particle.js"

export default class ParticlesEmitter {

    static prefillMotionTemplate = motionTemplateDictionnary
    static prefillColorTemplate = colorTemplateDictionnary

    static emitters = []

    static _EMISSION_CANVAS

    static INIT_EMISSION_CANVAS = () => {
        if (canvas.app.stage.rendered.environment.effects.moduleParticlesFx) {
            canvas.app.stage.rendered.environment.effects.moduleParticlesFx.destroy()
        }

        const particleFxCanvas = new PIXI.Container();
        particleFxCanvas.zIndex = Particle.SORT_LAYER;
        canvas.app.stage.rendered.environment.effects.addChild(particleFxCanvas);
        canvas.app.stage.rendered.environment.effects.moduleParticlesFx = particleFxCanvas;
        ParticlesEmitter._EMISSION_CANVAS = particleFxCanvas
    }


    constructor(particleTemplate, particleFrequence, spawningNumber, maxParticles, emissionDuration, isGravitate) {
        this.spawnedEnable = true;
        this.particles = [];
        this.particleTemplate = particleTemplate;
        this.particleFrequence = particleFrequence;
        this.spawningNumber = spawningNumber;
        this.maxParticles = maxParticles;
        this.remainingTime = emissionDuration
        this.isGravitate = isGravitate
        this.lastUpdate = Date.now();

        if (!ParticlesEmitter._EMISSION_CANVAS) {
            ParticlesEmitter.INIT_EMISSION_CANVAS()
        }
    }

    manageParticles() {
        let newDate = Date.now()
        const dt = newDate - this.lastUpdate
        this.lastUpdate = newDate

        for (let i = 0; i < this.particles.length; i++) {
            const particle = this.particles[i]

            particle.manageLifetime(dt)

            if (particle.remainingTime <= 0) {
                particle.sprite.destroy()
                this.particles.splice(i, 1)
                //Return to last particle
                i--
            }
        }

        if (this.particleTemplate?.isElevationManage) {
            canvas.primary.sortChildren()
        }

        //Decrease remainingTime of emmission if it has one
        if (this.remainingTime !== undefined) {
            this.remainingTime -= dt;
        }

        if (this.spawnedEnable && this.particles.length < this.maxParticles && (this.remainingTime === undefined || this.remainingTime > 0)) {
            //Spawned new particles
            let numberNewParticles = 1 + Math.floor(this.spawningNumber * dt / this.particleFrequence)
            let increaseTime = (this.spawningNumber * dt) % this.particleFrequence

            //Don t overload the server during low framerate
            if (numberNewParticles * 10 > this.maxParticles) {
                numberNewParticles = Math.floor(this.maxParticles / 10) + 1
                increaseTime = 0;
            }

            for (let i = 0; i < numberNewParticles; i++) {
                const particle = this.particleTemplate.generateParticles(this.particleTemplate);

                if (particle === undefined) {
                    this.remainingTime = 0
                    break
                }

                ParticlesEmitter._EMISSION_CANVAS.addChild(particle.sprite);
                if (this.particleTemplate?.isElevationManage) {
                    canvas.primary.addChild(particle.sprite)
                }
                this.particles.push(particle)
            }

            this.spawnedEnable = false;

            setTimeout(this.enableSpawning.bind(this), this.particleFrequence + increaseTime)

        }

        if (this.remainingTime !== undefined && this.remainingTime <= 0 && this.particles.length === 0) {
            //delete emission
            canvas.app.ticker.remove(this.callback);
            const emitterIndex = ParticlesEmitter.emitters.findIndex((emitter) => emitter.id === this.id)
            ParticlesEmitter.emitters.splice(emitterIndex, 1)
        }
    }

    //Delete immediatly emission without waiting for each particle's end
    _immediatelyStopEmission() {
        while (this.particles.length > 0) {
            let particle = this.particles[0]
            particle.sprite.destroy()
            this.particles.splice(0, 1)
        }

        canvas.app.ticker.remove(this.callback);
        const emitterIndex = ParticlesEmitter.emitters.findIndex((emitter) => emitter.id === this.id)
        ParticlesEmitter.emitters.splice(emitterIndex, 1)
    }


    enableSpawning() {
        this.spawnedEnable = true;
    }
}