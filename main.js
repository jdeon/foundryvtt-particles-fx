import { listen } from "./script/utils/socketManager.js"
import { initEmitters, persistEmitters, stopAllEmission } from "./script/service/particlesEmitter.service.js"
import { addCustomPrefillMotionTemplate, addCustomPrefillColorTemplate } from "./script/service/prefillTemplate.service.js"
import { s_MODULE_ID, Utils } from "./script/utils/utils.js"
import { CompatibiltyV2Manager } from "./script/utils/compatibilityManager.js"
import apiController from "./script/api/apiController.js"
import { subscribeApiToWindow } from "./script/api/windowsController.js"
import { initChatController } from "./script/api/chatController.js"
import ParticlesEmitter from "./script/object/particlesEmitter.js"
import { setupAutomation, automationInitialisation } from "./script/autoGeneration/automaticGeneration.service.js"

//The first scene emitters is load before the game is ready, we need to wait until the ready hooks
/**
 * Temporarily stores the first scene emitters queries if canvas is ready before game ready hook.
 * @type {Array<TODO type>|undefined}
 */
let firstSceneEmittersQueries

/**
 * Handles the 'init' hook to initialize module chat controller.
 */
Hooks.on("init", () => {
    initChatController();
});

/**
 * Handles the 'setup' hook to register module settings and initialize automation.
 */
Hooks.on("setup", () => {
    game.settings.register(s_MODULE_ID, "avoidParticle", {
        name: game.i18n.localize("PARTICULE-FX.Settings.Avoid.label"),
        hint: game.i18n.localize("PARTICULE-FX.Settings.Avoid.description"),
        scope: "client",
        config: true,
        type: Boolean,
        default: false
    });

    CompatibiltyV2Manager.addMigrationSettings()

    game.settings.register(s_MODULE_ID, "saveEmitters", {
        name: game.i18n.localize("PARTICULE-FX.Settings.Persist.label"),
        hint: game.i18n.localize("PARTICULE-FX.Settings.Persist.description"),
        scope: "world",
        config: true,
        type: Boolean,
        default: false
    });

    game.settings.register(s_MODULE_ID, "minimalRole", {
        name: game.i18n.localize("PARTICULE-FX.Settings.minRole.label"),
        hint: game.i18n.localize("PARTICULE-FX.Settings.minRole.description"),
        default: CONST.USER_ROLES.GAMEMASTER,
        choices: Object.entries(CONST.USER_ROLES).reduce(
            //Generate object of role with id for value
            /**
             * Reducer callback to map role names to localized labels.
             * @param {Record<string, string>} accumulator - Accumulator object for role ID to localized label.
             * @param {[string, number]} entry - Key-value pair of [label, id].
             * @returns {Record<string, string>} Updated accumulator.
             */
            (accumulator, [label, id]) => {
                const capLabel = label[0].toUpperCase() + label.slice(1).toLowerCase()
                const localizeLabel = game.i18n.localize(`USER.Role${capLabel}`)
                accumulator[id] = localizeLabel;
                return accumulator
            },
            {}
        ),
        type: String,
        scope: "world",
        config: true,
    });

    game.settings.register(s_MODULE_ID, "activateElevation", {
        name: game.i18n.localize("PARTICULE-FX.Settings.activateElevation.label"),
        hint: game.i18n.localize("PARTICULE-FX.Settings.activateElevation.description"),
        scope: "client",
        config: true,
        type: Boolean,
        default: true
    });

    game.settings.register(s_MODULE_ID, "doubleSizeElevation", {
        name: game.i18n.localize("PARTICULE-FX.Settings.doubleSizeElevation.label"),
        hint: game.i18n.localize("PARTICULE-FX.Settings.doubleSizeElevation.description"),
        scope: "world",
        config: true,
        type: Number,
        default: 10,
        /**
         * Updates the doubleSizeElevation value when the setting changes.
         * @param {number} value - The new setting value.
         */
        onChange: value => {
            Utils.doubleSizeElevation = value;
        }
    });

    setupAutomation()

    game.settings.register(s_MODULE_ID, "maxEmitterId", {
        name: "Last id emitter",
        hint: "Don't touch this",
        default: 0,
        type: Number,
        scope: 'world',
        config: false
    });

    game.settings.register(s_MODULE_ID, "customPrefillMotionTemplate", {
        name: "Map of custom prefill motion template",
        hint: "Don't touch this",
        default: {},
        type: Object,
        scope: 'world',
        config: false,
        /**
         * Triggers when the custom prefill motion template setting changes.
         * @param {TODO type} value - Map of custom prefill motion templates.
         */
        onChange: value => {
            addCustomPrefillMotionTemplate(value)
        }
    });

    game.settings.register(s_MODULE_ID, "customPrefillColorTemplate", {
        name: "Map of custom prefill color template",
        hint: "Don't touch this",
        default: {},
        type: Object,
        scope: 'world',
        config: false,
        /**
         * Triggers when the custom prefill color template setting changes.
         * @param {TODO type} value - Map of custom prefill color templates.
         */
        onChange: value => {
            addCustomPrefillColorTemplate(value)
        }
    });
});

/**
 * Handles the 'canvasReady' hook to initialize emission canvas and load saved emitters.
 */
Hooks.on("canvasReady", () => {
    ParticlesEmitter.INIT_EMISSION_CANVAS()

    Utils.doubleSizeElevation = game.settings.get(s_MODULE_ID, "doubleSizeElevation")

    const isSaveAllowed = game.settings.get(s_MODULE_ID, "saveEmitters")

    if (isSaveAllowed) {
        const emittersQueries = canvas.scene.getFlag(s_MODULE_ID, "emitters")

        if (game.ready) {
            initEmitters(emittersQueries)
        } else {
            //Waiting the world to be ready at the first launch
            firstSceneEmittersQueries = emittersQueries
        }
    }
});

/**
 * Handles the 'ready' hook for final module initialization once Foundry VTT is ready.
 */
Hooks.once('ready', function () {
    console.log(`main | ready to ${s_MODULE_ID}`);

    CompatibiltyV2Manager.migrateSettings()

    if (firstSceneEmittersQueries) {
        initEmitters(firstSceneEmittersQueries)
        firstSceneEmittersQueries = undefined
    }

    addCustomPrefillMotionTemplate(game.settings.get(s_MODULE_ID, "customPrefillMotionTemplate"))
    addCustomPrefillColorTemplate(game.settings.get(s_MODULE_ID, "customPrefillColorTemplate"))

    game.modules.get(s_MODULE_ID).api = apiController
    subscribeApiToWindow()
    automationInitialisation()

    listen()
});


//Closing canvas hooks
/**
 * Handles the 'canvasTearDown' hook to persist active emitters and stop all particle emissions.
 * @returns {Array<TODO type>} List of stopped emitters.
 */
Hooks.on("canvasTearDown", () => {
    persistEmitters()
    return stopAllEmission(true)
});