import ParticlesEmitter from "./particlesEmitter.js";
import { Particle } from "./particle.js";
import { Utils } from "../utils/utils.js";

/**
 * High-performance global manager for particle highlight rendering.
 * Renders hundreds or thousands of particle halos in a single batched PIXI container pass.
 */
export class ParticleHighlightManager {
    static _haloContainer = null;
    static _haloSprites = [];
    static _tickerAdded = false;

    /**
     * Initializes the shared halo container layer on the emission canvas.
     */
    static init() {
        if (this._haloContainer && !this._haloContainer.destroyed) return;

        const container = new PIXI.Container();
        container.zIndex = Particle.SORT_LAYER - 1;
        if (typeof PIXI !== "undefined" && PIXI.BLEND_MODES?.ADD !== undefined) {
            container.blendMode = PIXI.BLEND_MODES.ADD;
        }

        if (ParticlesEmitter._EMISSION_CANVAS) {
            ParticlesEmitter._EMISSION_CANVAS.addChild(container);
        }

        this._haloContainer = container;
    }

    /**
     * Updates and renders halo highlights for all particles in highlighted emitters per frame.
     */
    static update() {
        if (!ParticlesEmitter.highlightedEmitterId) {
            this.clear();
            return;
        }

        this.init();
        if (!this._haloContainer) return;

        const highlightedId = ParticlesEmitter.highlightedEmitterId;
        const targetParticles = [];

        for (const emitter of ParticlesEmitter.emitters) {
            if (ParticlesEmitter.isEmitterMatchingId(emitter, highlightedId)) {
                for (let i = 0; i < emitter.particles.length; i++) {
                    const p = emitter.particles[i];
                    if (p.sprite && !p.sprite.destroyed && p.sprite.visible !== false) {
                        targetParticles.push(p);
                    }
                }
            }
        }

        const count = targetParticles.length;
        const haloTexture = Utils.getSpriteTextureFromId("TOR") || Utils.getSpriteTextureFromId("CIRCLE");
        if (!haloTexture) return;

        // Object pool expansion
        while (this._haloSprites.length < count) {
            const halo = new PIXI.Sprite(haloTexture);
            halo.anchor.set(0.5);
            halo.tint = 0xc9593f;
            this._haloContainer.addChild(halo);
            this._haloSprites.push(halo);
        }

        // Dynamic pulsing luminescence factor
        const pulse = 0.75 + 0.25 * Math.sin(Date.now() * 0.008);

        for (let i = 0; i < count; i++) {
            const p = targetParticles[i];
            const halo = this._haloSprites[i];
            halo.visible = true;

            halo.x = p.sprite.x;
            halo.y = p.sprite.y;
            halo.rotation = p.sprite.rotation;

            const parentTexWidth = p.sprite.texture?.width || 64;
            const haloTexWidth = haloTexture.width || 64;
            const baseScale = (parentTexWidth / haloTexWidth) * 1.6;

            halo.scale.x = p.sprite.scale.x * baseScale;
            halo.scale.y = p.sprite.scale.y * baseScale;
            halo.alpha = (p.sprite.alpha || 1.0) * pulse;
        }

        for (let i = count; i < this._haloSprites.length; i++) {
            this._haloSprites[i].visible = false;
        }

        if (!this._tickerAdded && canvas?.app?.ticker) {
            canvas.app.ticker.add(this._onTick);
            this._tickerAdded = true;
        }
    }

    static _onTick = () => {
        ParticleHighlightManager.update();
    };

    /**
     * Clears all active halos and stops the ticker update loop.
     */
    static clear() {
        if (this._tickerAdded && canvas?.app?.ticker) {
            canvas.app.ticker.remove(this._onTick);
            this._tickerAdded = false;
        }

        for (let i = 0; i < this._haloSprites.length; i++) {
            this._haloSprites[i].visible = false;
        }
    }
}
