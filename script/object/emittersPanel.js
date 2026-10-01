import ParticlesEmitter from "./particlesEmitter.js";
import emitController from "../api/emitController.js";
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
            width: 300,
            height: "auto",
            left: 120,
            top: 70
        },
        actions: {
            togglePauseEmitter: EmittersPanel._onTogglePauseEmitter,
            stopEmitter: EmittersPanel._onStopEmitter,
            deleteEmitter: EmittersPanel._onDeleteEmitter
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
     * Shows the emitters panel on screen and initializes global hover listeners.
     */
    static show() {
        if (!game?.ready || !game.user?.isGM) return;
        this.setupGlobalEmitterHoverListeners();
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

    /** @type {boolean} */
    static _hoverListenersInitialized = false;

    /**
     * Sets up document-level delegated hover event listeners for emitter ID elements.
     * @returns {void}
     */
    static setupGlobalEmitterHoverListeners() {
        if (this._hoverListenersInitialized) return;
        this._hoverListenersInitialized = true;

        document.body.addEventListener("mouseover", (event) => {
            const target = event.target?.closest?.("[data-emitter-id]");
            if (target) {
                const emitterId = target.dataset.emitterId;
                if (emitterId) {
                    target.classList.add("is-highlighted");
                    ParticlesEmitter.highlightEmitter(emitterId, true);
                }
            }
        });

        document.body.addEventListener("mouseout", (event) => {
            const target = event.target?.closest?.("[data-emitter-id]");
            if (target) {
                const related = event.relatedTarget?.closest?.("[data-emitter-id]");
                if (!related || related.dataset.emitterId !== target.dataset.emitterId) {
                    target.classList.remove("is-highlighted");
                    ParticlesEmitter.highlightEmitter(target.dataset.emitterId, false);
                }
            }
        });

        document.body.addEventListener("click", (event) => {
            if (event.target?.closest?.("button, [data-action]")) return;

            const target = event.target?.closest?.("[data-emitter-id]");
            if (target) {
                const emitterId = target.dataset.emitterId;
                if (emitterId) {
                    if (navigator.clipboard?.writeText) {
                        navigator.clipboard.writeText(emitterId);
                    } else if (game.utils?.copyToClipboard) {
                        game.utils.copyToClipboard({ content: emitterId });
                    }
                    ui.notifications.info(game.i18n.format("PARTICULE-FX.EmittersPanel.CopiedId", { id: emitterId }));
                }
            }
        });
    }

    /** @override */
    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        const emitters = ParticlesEmitter.emitters || [];
        context.emitters = emitters.map(emitter => ({
            id: String(emitter.id),
            isPaused: !!emitter.isPaused,
            particleCount: emitter.particles?.length || 0
        }));
        context.hasEmitters = context.emitters.length > 0;
        return context;
    }

    /**
     * Action handler to toggle play/pause state of an emitter.
     * @param {PointerEvent} event - The click event.
     * @param {HTMLElement} target - The button target element.
     */
    static _onTogglePauseEmitter(event, target) {
        event.stopPropagation();
        const emitterItem = target.closest("[data-emitter-id]");
        const emitterId = emitterItem?.dataset?.emitterId;
        if (emitterId) {
            emitController.togglePause(emitterId);
            EmittersPanel.refresh();
        }
    }

    /**
     * Action handler to stop an emitter when clicking the stop button.
     * @param {PointerEvent} event - The click event.
     * @param {HTMLElement} target - The button target element.
     */
    static _onStopEmitter(event, target) {
        event.stopPropagation();
        const emitterItem = target.closest("[data-emitter-id]");
        const emitterId = emitterItem?.dataset?.emitterId;
        if (emitterId) {
            emitController.stop(emitterId);
            EmittersPanel.refresh();
        }
    }

    /**
     * Action handler to immediately delete/destroy an emitter when clicking the delete button.
     * @param {PointerEvent} event - The click event.
     * @param {HTMLElement} target - The button target element.
     */
    static _onDeleteEmitter(event, target) {
        event.stopPropagation();
        const emitterItem = target.closest("[data-emitter-id]");
        const emitterId = emitterItem?.dataset?.emitterId;
        if (emitterId) {
            emitController.stop(emitterId, true);
            EmittersPanel.refresh();
        }
    }
}
