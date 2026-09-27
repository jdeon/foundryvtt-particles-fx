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

    static _cachedGlowFilter = null;

    /**
     * Retrieves or creates shared container WebGL GlowFilter for soft glowing aura.
     * @returns {PIXI.Filter|null} Filter instance.
     */
    static getGlowFilter() {
        if (this._cachedGlowFilter) return this._cachedGlowFilter;

        try {
            if (typeof PIXI === "undefined" || !PIXI.Filter) return null;

            const vertexShader = `
                attribute vec2 aVertexPosition;
                attribute vec2 aTextureCoord;
                uniform mat3 projectionMatrix;
                varying vec2 vTextureCoord;
                void main(void) {
                    gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
                    vTextureCoord = aTextureCoord;
                }
            `;

            const fragmentShader = `
                precision mediump float;
                varying vec2 vTextureCoord;
                uniform sampler2D uSampler;
                uniform vec4 uGlowColor;

                void main(void) {
                    vec4 color = texture2D(uSampler, vTextureCoord);
                    vec2 step = vec2(0.002, 0.002);

                    float blurAlpha = 0.0;
                    blurAlpha += texture2D(uSampler, vTextureCoord + vec2(step.x * 1.5, 0.0)).a;
                    blurAlpha += texture2D(uSampler, vTextureCoord + vec2(-step.x * 1.5, 0.0)).a;
                    blurAlpha += texture2D(uSampler, vTextureCoord + vec2(0.0, step.y * 1.5)).a;
                    blurAlpha += texture2D(uSampler, vTextureCoord + vec2(0.0, -step.y * 1.5)).a;
                    blurAlpha += texture2D(uSampler, vTextureCoord + vec2(step.x, step.y)).a;
                    blurAlpha += texture2D(uSampler, vTextureCoord + vec2(-step.x, step.y)).a;
                    blurAlpha += texture2D(uSampler, vTextureCoord + vec2(step.x, -step.y)).a;
                    blurAlpha += texture2D(uSampler, vTextureCoord + vec2(-step.x, -step.y)).a;

                    float softGlow = clamp(blurAlpha * 0.15, 0.0, 1.0);

                    if (color.a < 0.05 && softGlow > 0.0) {
                        gl_FragColor = vec4(uGlowColor.rgb * softGlow * 1.4, softGlow * uGlowColor.a);
                    } else {
                        gl_FragColor = color + vec4(uGlowColor.rgb * softGlow * 0.5, 0.0);
                    }
                }
            `;

            let filter = null;
            if (typeof PIXI.Filter.from === "function") {
                try {
                    filter = PIXI.Filter.from({
                        gl: { vertex: vertexShader, fragment: fragmentShader }
                    });
                } catch (e) {
                    filter = null;
                }
            }
            if (!filter) {
                filter = new PIXI.Filter(vertexShader, fragmentShader, {
                    uGlowColor: [0.788, 0.349, 0.247, 1.0]
                });
            }

            if (filter) {
                filter.padding = 32;
                this._cachedGlowFilter = filter;
            }
        } catch (err) {
            console.warn("ParticlesFX | Could not initialize glow filter", err);
        }

        return this._cachedGlowFilter;
    }

    /**
     * Initializes the shared halo container layer on the emission canvas.
     */
    static init() {
        if (this._haloContainer && !this._haloContainer.destroyed) return;

        this._haloSprites = [];
        this._tickerAdded = false;

        const container = new PIXI.Container();
        container.zIndex = Particle.SORT_LAYER - 1;
        if (typeof PIXI !== "undefined" && PIXI.BLEND_MODES?.ADD !== undefined) {
            container.blendMode = PIXI.BLEND_MODES.ADD;
        }

        const filter = this.getGlowFilter();
        if (filter) {
            container.filters = [filter];
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

        // Filter out any destroyed sprites from pool
        this._haloSprites = this._haloSprites.filter(sprite => sprite && !sprite.destroyed);

        // Object pool expansion
        while (this._haloSprites.length < count) {
            const firstParticle = targetParticles[0];
            const defaultTexture = firstParticle?.sprite?.texture || Utils.getSpriteTextureFromId("CIRCLE");
            const halo = new PIXI.Sprite(defaultTexture);
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

            // Use exact source particle sprite texture
            if (p.sprite?.texture && halo.texture !== p.sprite.texture) {
                halo.texture = p.sprite.texture;
            }

            halo.x = p.sprite.x;
            halo.y = p.sprite.y;
            halo.rotation = p.sprite.rotation;

            // Scale slightly larger than source particle for glowing outline matching source shape
            const baseScale = 1.35;

            halo.scale.x = p.sprite.scale.x * baseScale;
            halo.scale.y = p.sprite.scale.y * baseScale;
            halo.alpha = (p.sprite.alpha || 1.0) * pulse;
        }

        for (let i = count; i < this._haloSprites.length; i++) {
            if (this._haloSprites[i] && !this._haloSprites[i].destroyed) {
                this._haloSprites[i].visible = false;
            }
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
            if (this._haloSprites[i] && !this._haloSprites[i].destroyed) {
                this._haloSprites[i].visible = false;
            }
        }
    }

    /**
     * Completely resets the highlight manager state on canvas teardown/re-init.
     */
    static reset() {
        this.clear();
        if (this._haloContainer && !this._haloContainer.destroyed) {
            this._haloContainer.destroy({ children: true });
        }
        this._haloContainer = null;
        this._haloSprites = [];
        this._tickerAdded = false;
    }
}
