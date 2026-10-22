import ParticlesEmitter from "./particlesEmitter.js";
import { EmittersPanel } from "./emittersPanel.js";
import { persistEmitters } from "../service/particlesEmitter.service.js";
import { Utils, Vector3 } from "../utils/utils.js";
import { AdvancedVariable } from "./advancedVariable.js";
import { ParticleInput } from "./particleInput.js";

/**
 * Controller class wrapping Foundry VTT v14's native foundry.canvas.animation.ParticleGenerator
 * operating in manual mode to faithfully enforce custom spawn rates, particle limits, and lifetimes.
 */
export class NativeParticlesEmitter {

    /**
     * Constructs a NativeParticlesEmitter instance.
     * @param {string} emitterId - Unique identifier for this emitter.
     * @param {Object} generatorConfig - Compiled ParticleGenerator configuration options.
     * @param {Object} [originalQuery] - Unmerged original user query.
     * @param {Object} [finalQuery] - Merged normalized configuration query.
     * @param {Object} [particleTemplate] - ParticleTemplate instance for workflow references.
     */
    constructor(emitterId, generatorConfig, originalQuery, finalQuery, particleTemplate) {
        this.id = String(emitterId);
        this._isPaused = Boolean(finalQuery?.isPaused);
        this.originalQuery = originalQuery;
        this.finalQuery = finalQuery;
        this.particleTemplate = particleTemplate;
        this.generatorConfig = generatorConfig;
        this.destroyHooks = [];
        this.isNative = true;

        const GeneratorClass = foundry.canvas?.animation?.ParticleGenerator;
        if (!GeneratorClass) {
            throw new Error("Particule FX | foundry.canvas.animation.ParticleGenerator is not available in this Foundry version.");
        }

        // Link emitter instance to strategy options so onParticleUpdate can inspect pause state
        if (generatorConfig.strategyOptions) {
            generatorConfig.strategyOptions.emitter = this;
        }

        // Ensure manual mode is set so we drive spawning ourselves
        generatorConfig.manual = true;
        this.generator = new GeneratorClass(generatorConfig);

        // Start internal generator loop
        this.generator.start();

        // Spawning rate parameters
        this.particleFrequence = generatorConfig.spawningFrequence ?? 16;
        this.spawningNumber = generatorConfig.spawningNumber ?? 1;
        this.maxParticles = generatorConfig.maxParticles ?? 1000;
        this.freezeOnPause = generatorConfig.freezeOnPause ?? false;
        this._remainingTime = (generatorConfig.emissionDuration && !isNaN(generatorConfig.emissionDuration))
            ? Number(generatorConfig.emissionDuration)
            : NaN;

        this.lastUpdate = Date.now();
        this._spawnAccumulator = 0;

        // Manual spawning ticker callback
        this.tickCallback = () => {
            const now = Date.now();
            const dt = now - this.lastUpdate;
            this.lastUpdate = now;

            if (this._isPaused || (this.freezeOnPause && game?.paused)) {
                return;
            }

            if (!isNaN(this._remainingTime)) {
                this._remainingTime -= dt;
            }

            // Generate new particles while emission duration has not expired
            if (isNaN(this._remainingTime) || this._remainingTime > 0) {
                this._spawnAccumulator += dt;
                if (this._spawnAccumulator >= this.particleFrequence) {
                    const cycles = Math.floor(this._spawnAccumulator / this.particleFrequence);
                    this._spawnAccumulator %= this.particleFrequence;

                    const currentCount = this.particleCount;
                    const spaceAvailable = Math.max(0, this.maxParticles - currentCount);
                    let toSpawn = Math.min(cycles * this.spawningNumber, spaceAvailable);

                    // Avoid overload during lag spikes
                    if (toSpawn * 10 > this.maxParticles) {
                        toSpawn = Math.ceil(this.maxParticles / 10);
                    }

                    if (toSpawn > 0 && this.generator) {
                        for (let i = 0; i < toSpawn; i++) {
                            if (!this.generator) break;
                            const spawnOptions = this._getParticleSpawnOptions();
                            this.generator.spawnParticle(spawnOptions);
                        }
                    }
                }
            }

            // Natural termination when duration expired and all particles have faded out
            if (!isNaN(this._remainingTime) && this._remainingTime <= 0 && this.particleCount === 0) {
                this.destroy();
            }
        };

        canvas.app.ticker.add(this.tickCallback);

        // Register in global emitters registry
        ParticlesEmitter.emitters.push(this);
        EmittersPanel.refresh();

        persistEmitters();
    }

    /**
     * Active particle count getter.
     * @returns {number} Current number of active particles.
     */
    get particleCount() {
        if (!this.generator) return 0;
        return this.generator.particles?.length ?? this.generator._activeParticles?.length ?? 0;
    }

    /**
     * Approximate remaining emission time in milliseconds.
     * @returns {number} Remaining time or Infinity.
     */
    get remainingTime() {
        if (isNaN(this._remainingTime)) return Infinity;
        return this._remainingTime;
    }

    set remainingTime(val) {
        this._remainingTime = Number(val);
        if (this.finalQuery) {
            this.finalQuery.emissionDuration = this._remainingTime;
        }
    }

    /**
     * Array of live particles for inspection/highlighting compatibility.
     * @returns {Array<Object>} List of live particle objects or empty array.
     */
    get particles() {
        if (!this.generator) return [];
        const rawParticles = this.generator.particles || this.generator._activeParticles || [];
        return rawParticles.map((p, idx) => ({
            id: p.id ?? idx,
            sprite: p,
            getPosition: () => (typeof p.getPosition === "function" ? p.getPosition() : { x: p.x, y: p.y, z: p.elevation ?? 0 })
        }));
    }

    /**
     * Paused state getter.
     * @returns {boolean} Whether emission is currently paused.
     */
    get isPaused() {
        return this._isPaused;
    }

    /**
     * Paused state setter.
     * @param {boolean} val - New paused state.
     */
    set isPaused(val) {
        this._isPaused = Boolean(val);
    }

    /**
     * Toggles the pause state of this emitter.
     * @returns {boolean} New isPaused state.
     */
    togglePause() {
        this.isPaused = !this.isPaused;
        return this.isPaused;
    }

    /**
     * Disables workflow execution.
     * @returns {void}
     */
    disableWorkflow() {
        if (this.particleTemplate) {
            this.particleTemplate.next = [];
        }
    }

    /**
     * Destroys the emitter, tears down the generator and container, and evicts from the global registry.
     * @param {boolean} [shouldEvict=true] - Whether to persist removal.
     * @returns {void}
     */
    destroy(shouldEvict = true) {
        if (this.tickCallback) {
            canvas.app.ticker.remove(this.tickCallback);
            this.tickCallback = null;
        }

        if (this.generator) {
            try {
                this.generator.stop({ hard: true });
            } catch (err) {
                console.warn("Particule FX | Error during ParticleGenerator destroy:", err);
            }
            this.generator = null;
        }

        const emitterIndex = ParticlesEmitter.emitters.findIndex((e) => e.id === this.id);
        if (emitterIndex >= 0) {
            ParticlesEmitter.emitters.splice(emitterIndex, 1);
            if (shouldEvict) {
                persistEmitters();
            }
        }

        if (this.destroyHooks.length > 0) {
            this.destroyHooks.forEach((hook) => hook(this.id));
        }

        EmittersPanel.refresh();
    }

    /**
     * Computes spawn options (anchor and area) for an individual particle spawn.
     * @returns {{anchor: Object|foundry.canvas.placeables.PlaceableObject, area: PIXI.Rectangle|PIXI.Circle|Object}} Particle spawn options.
     * @private
     */
    _getParticleSpawnOptions() {
        const advancedVariables = AdvancedVariable.computeAdvancedVariables(
            this.particleTemplate?.advanced?.variables ?? this.finalQuery?.advanced?.variables
        );

        const anchor = this._resolveAnchor(advancedVariables);

        const type = this.finalQuery.type;

        const isGravitate = (type === "Graviting" || type === "Gravitating" || type === "gravitate"); //TODO use good wording

        const area = isGravitate
            ? this._resolveCircleArea(advancedVariables)
            : this._resolveRectArea(advancedVariables);

        return { position: { x: anchor.x + (anchor.w || anchor.width || 0) / 2, y: anchor.y + (anchor.h || anchor.height || 0) / 2 }, area };
    }

    /**
     * Resolves the anchor object or point for an individual particle spawn.
     * @param {Object} [advancedVariables] - Evaluated advanced variables.
     * @returns {foundry.canvas.placeables.PlaceableObject|{x: number, y: number}} Resolved anchor.
     * @private
     */
    _resolveAnchor(advancedVariables) {
        let rawSource = Utils.getRandomValueFrom(this.finalQuery.source, advancedVariables);

        if (rawSource && (rawSource instanceof foundry.canvas.placeables?.PlaceableObject || (canvas?.tokens && rawSource instanceof canvas.tokens.constructor.placeableClass))) {
            return rawSource;
        }

        if (typeof rawSource === "string") {
            const placeable = Utils.getPlaceableObjectById(rawSource);
            if (placeable) return placeable;
        }

        if (rawSource && typeof rawSource.x === "number" && typeof rawSource.y === "number") {
            return Vector3.build(rawSource);
        }

        //TODO What used ?
        const pos = Utils.getSourcePosition(rawSource, false, false);
        if (pos && typeof pos.x === "number" && typeof pos.y === "number") {
            return Vector3.build(pos);
        }

        return { x: 0, y: 0 };
    }

    /**
     * Resolves circular area for gravitate emission.
     * @param {Object} [advancedVariables] - Evaluated advanced variables.
     * @returns {PIXI.Circle|{x: number, y: number, radius: number}} Circular area object.
     * @private
     */
    _resolveCircleArea(advancedVariables) {
        const rawRadius = Utils.getRandomValueFrom(this.particleTemplate?.particleRadius, advancedVariables);
        const radius = Math.max(0, Number(rawRadius) || 50);

        return (typeof PIXI !== "undefined" && PIXI.Circle)
            ? new PIXI.Circle(0, 0, radius)
            : { x: 0, y: 0, radius };
    }

    /**
     * Resolves rectangular area for spray emission.
     * @param {Object} [advancedVariables] - Evaluated advanced variables.
     * @returns {PIXI.Rectangle|{x: number, y: number, width: number, height: number}} Rectangular area object.
     * @private
     */
    _resolveRectArea(advancedVariables) {
        const explicitArea = Utils.getRandomValueFrom(this.particleTemplate?.positionSpawning, advancedVariables);
        if (explicitArea) {
            const width = Math.max(0, Number(explicitArea.x) || 0);
            const height = Math.max(0, Number(explicitArea.y) || 0);
            return new PIXI.Rectangle(0, 0, width, height)
        }

        return new PIXI.Rectangle(0, 0, 0, 0)
    }
}
