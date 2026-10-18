import { getPixiEmitterClass } from "../behaviors/behaviorRegistry.js";
import ParticlesEmitter from "./particlesEmitter.js";
import { EmittersPanel } from "./emittersPanel.js";
import { persistEmitters } from "../service/particlesEmitter.service.js";

/**
 * Controller class wrapping a native @pixi/particle-emitter Emitter (or foundry.canvas.ParticleEffect)
 * to maintain complete polymorphic interface parity with custom ParticlesEmitter instances.
 */
export class NativeParticlesEmitter {

    /**
     * Constructs a NativeParticlesEmitter instance.
     * @param {string} emitterId - Unique identifier for this emitter.
     * @param {Object} emitterConfig - Compiled EmitterConfigV3 object.
     * @param {PIXI.Container} [parentContainer] - Target rendering container on canvas.
     * @param {Object} [originalQuery] - Unmerged original user query.
     * @param {Object} [finalQuery] - Merged normalized configuration query.
     */
    constructor(emitterId, emitterConfig, parentContainer, originalQuery, finalQuery) {
        this.id = String(emitterId);
        this._isPaused = Boolean(finalQuery?.isPaused);
        this.originalQuery = originalQuery;
        this.finalQuery = finalQuery;
        this.destroyHooks = [];
        this.isNative = true;

        const isElevationManage = Boolean(finalQuery?.isElevationManage ?? game.settings?.get("particule-fx", "activateElevation"));

        // Determine target container (canvas.primary for 3D elevation sorting, else module emission canvas)
        const container = parentContainer || (isElevationManage && canvas?.primary ? canvas.primary : ParticlesEmitter._EMISSION_CANVAS);

        if (typeof foundry !== "undefined" && foundry.canvas?.ParticleEffect) {
            this.particleEffect = new ParticleEffect(container);
            this.emitter = this.particleEffect.createEmitter(emitterConfig);
        } else {
            const EmitterClass = getPixiEmitterClass();
            if (!EmitterClass) {
                throw new Error("Particule FX | Neither foundry.canvas.ParticleEffect nor PIXI.particles.Emitter was found.");
            }
            this.emitter = new EmitterClass(container, emitterConfig);
        }

        // Ticker update callback if autoUpdate is not attached
        if (!this.emitter.autoUpdate) {
            this.callback = (ticker) => {
                if (this._isPaused) return;
                const deltaSec = (ticker.deltaMS || 16.666) / 1000;
                this.emitter.update(deltaSec);

                if (!this.emitter.emit && this.emitter.particleCount === 0) {
                    this.destroy();
                }
            };
            canvas.app.ticker.add(this.callback);
        } else {
            // Monitor natural expiration
            this._checkEndInterval = setInterval(() => {
                if (!this.emitter.emit && this.emitter.particleCount === 0) {
                    this.destroy();
                }
            }, 500);
        }

        if (this._isPaused) {
            this.emitter.emit = false;
        }

        // Register in global emitters list
        ParticlesEmitter.emitters.push(this);
        EmittersPanel.refresh();

        persistEmitters();
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
        if (this.emitter) {
            this.emitter.emit = !this._isPaused;
        }
    }

    /**
     * Active particle count getter.
     * @returns {number} Current number of alive particles.
     */
    get particleCount() {
        return this.emitter?.particleCount ?? 0;
    }

    /**
     * Approximate remaining emission time.
     * @returns {number} Remaining time or NaN.
     */
    get remainingTime() {
        if (!this.emitter) return 0;
        return this.emitter.emitterLifetime > 0 ? this.emitter.emitterLifetime * 1000 : Infinity;
    }

    set remainingTime(val) {
        if (this.emitter) {
            if (val <= 0) {
                this.emitter.emit = false;
            } else if (!isNaN(val)) {
                this.emitter.emitterLifetime = val / 1000;
            }
        }
    }

    /**
     * Array of live particles for inspection/highlighting compatibility.
     * @returns {Array<Object>} List of live particle objects or empty array.
     */
    get particles() {
        // Collect active particles from emitter's linked list or internal array
        const list = [];
        let p = this.emitter?._activeParticlesFirst;
        while (p) {
            list.push({
                id: p.id ?? 0,
                sprite: p,
                getPosition: () => ({ x: p.x, y: p.y, z: p.elevation ?? 0 })
            });
            p = p.next;
        }
        return list;
    }

    /**
     * Toggles the pause state of this emitter.
     * @returns {boolean} New isPaused state.
     */
    togglePause() {
        this.isPaused = !this.isPaused;
        if (this.emitter) {
            this.emitter.emit = !this.isPaused;
        }
        return this.isPaused;
    }

    /**
     * Disables workflow execution (native emitters do not chain workflows).
     * @returns {void}
     */
    disableWorkflow() {
        // No-op for native emitters
    }

    /**
     * Destroys the emitter, tears down sprites, and removes from the global registry.
     * @param {boolean} [shouldEvict=true] - Whether to persist removal.
     * @returns {void}
     */
    destroy(shouldEvict = true) {
        if (this._checkEndInterval) {
            clearInterval(this._checkEndInterval);
            this._checkEndInterval = null;
        }

        if (this.callback) {
            canvas.app.ticker.remove(this.callback);
            this.callback = null;
        }

        if (this.emitter) {
            this.emitter.destroy();
            this.emitter = null;
        }

        if (this.particleEffect) {
            this.particleEffect.destroy();
            this.particleEffect = null;
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
}
