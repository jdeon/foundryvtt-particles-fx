import ParticlesEmitter from "../object/particlesEmitter.js";
import { s_MODULE_ID } from "../utils/utils.js";

/**
 * ApplicationV2 UI Panel listing active particle emitter IDs in Foundry VTT v13.
 * Styled to match the Region Legend panel aesthetic.
 */
export class EmittersPanel extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {

    /** @override */
    static DEFAULT_OPTIONS = {
        id: "particles-fx-emitters-panel",
        classes: ["particles-fx-emitters-panel"],
        tag: "aside",
        window: {
            frame: true,
            title: "PARTICULE-FX.EmittersPanel.Title",
            icon: "fas fa-layer-group",
            resizable: false,
            minimizable: true
        },
        position: {
            width: 220,
            height: "auto",
            left: 120,
            top: 70
        }
    };

    /** @override */
    static PARTS = {
        legend: {
            template: `modules/${s_MODULE_ID}/template/emitters-panel.hbs`
        }
    };

    /** @type {EmittersPanel|null} */
    static _instance = null;

    /**
     * Singleton instance of the EmittersPanel.
     * @returns {EmittersPanel}
     */
    static get instance() {
        if (!this._instance) {
            this._instance = new EmittersPanel();
        }
        return this._instance;
    }

    /**
     * Shows the emitters panel on screen.
     */
    static show() {
        if (!game?.ready) return;
        this.instance.render({ force: true });
    }

    /**
     * Refreshes the panel if rendered.
     */
    static refresh() {
        if (this._instance && this._instance.rendered) {
            this._instance.render({ force: false });
        }
    }

    /** @override */
    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        const emitters = ParticlesEmitter.emitters || [];
        context.emitters = emitters.map(emitter => ({
            id: String(emitter.id),
            particleCount: emitter.particles?.length || 0
        }));
        context.hasEmitters = context.emitters.length > 0;
        return context;
    }
}
