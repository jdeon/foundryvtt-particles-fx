import { s_MODULE_ID } from "./utils.js"

/**
 * Handles backwards compatibility migration and validation for v3.
 * Warns when Start or End property suffixes exist without their matching pair.
 */
export class CompatibilityV3Manager {

    /**
     * Displays a deprecation warning notification when a Start suffix exists without a matching End suffix.
     * @param {string|Array<string>} errorParam - The parameter key(s) missing an End suffix.
     * @returns {void}
     */
    static compatibiltyStartMessage(errorParam) {
        const param = Array.isArray(errorParam) ? errorParam.join(', ') : errorParam;
        ui.notifications.warn(`Deprecated : start suffix exists without an end suffix : ${param}`);
    }

    /**
     * Displays a deprecation warning notification when an End suffix exists without a matching Start suffix.
     * @param {string|Array<string>} errorParam - The parameter key(s) missing a Start suffix.
     * @returns {void}
     */
    static compatibiltyEndMessage(errorParam) {
        const param = Array.isArray(errorParam) ? errorParam.join(', ') : errorParam;
        ui.notifications.warn(`Deprecated : end suffix exists without a start suffix : ${param}`);
    }

    /**
     * Registers settings required for migrating legacy v2 settings to v3.
     * @returns {void}
     */
    static addMigrationSettings() {
        game.settings.register(s_MODULE_ID, "migrationV3Done", {
            name: game.i18n.localize("Old settings has been migrate in new one"),
            hint: game.i18n.localize("Keep it here for migration purpose"),
            scope: "world",
            config: false,
            type: Boolean,
            default: false
        });
    }

    /**
     * Handle v3 migration.
     * @returns {void}
     */
    static migrate() {
        if (!game.settings.get(s_MODULE_ID, "migrationV3Done")) {

            CompatibilityV3Manager._fixCustomTemplates('customPrefillMotionTemplate')
            CompatibilityV3Manager._fixCustomTemplates('customPrefillColorTemplate')

            game.settings.set(s_MODULE_ID, "migrationV3Done", true)
        }
    }

    /**
     * Fixes custom templates for v3 migration.
     * @param {string} settingKey - The name of the setting containing the custom templates.
     * @returns {Object} The updated custom templates object.
     */
    static _fixCustomTemplates(settingKey) {
        const customPrefillTemplate = game.settings.get(s_MODULE_ID, settingKey);
        if (!customPrefillTemplate) {
            return;
        }

        const newCustomPrefillTemplate = Object.entries(customPrefillTemplate).map(([key, value]) => {
            const fixedValue = CompatibilityV3Manager._fixStartEndSuffix(value)
            if (fixedValue.startWithoutEnd.length > 0 || fixedValue.endWithoutStart.length > 0) {
                let displayMessage = `Deprecated: your custom template ${key} has been fixed with the version 3 of Particles Fx migration.`
                if (fixedValue.startWithoutEnd.length > 0) {
                    displayMessage += ` Missing end suffix property for : ${fixedValue.startWithoutEnd.join(', ')}.`
                }
                if (fixedValue.endWithoutStart.length > 0) {
                    displayMessage += ` Missing start suffix property for : ${fixedValue.endWithoutStart.join(', ')}.`
                }
                ui.notifications.warn(displayMessage)
            }
            return {
                key,
                value: fixedValue.result
            }
        }).reduce((acc, { key, value }) => {
            acc[key] = value;
            return acc;
        }, {});

        game.settings.set(s_MODULE_ID, settingKey, newCustomPrefillTemplate);
        return newCustomPrefillTemplate;
    }

    /**
     * Scans configuration objects recursively for Start suffixes without matching End suffixes (and vice-versa).
     * Sends UI warnings for any missing matching suffix.
     * @param {Object} input - Input configuration object to inspect.
     * @returns {{startWithoutEnd: Array<string>, endWithoutStart: Array<string>}} List of flagged parameter keys.
     */
    static warningMissingSuffix(input) {
        const { startWithoutEnd, endWithoutStart } = CompatibilityV3Manager.checkStartEndSuffix(input, false);

        if (startWithoutEnd.length > 0) {
            CompatibilityV3Manager.compatibiltyStartMessage(startWithoutEnd);
        }
        if (endWithoutStart.length > 0) {
            CompatibilityV3Manager.compatibiltyEndMessage(endWithoutStart);
        }

        return { startWithoutEnd, endWithoutStart };
    }

    /**
     * Scans configuration objects recursively for Start suffixes without matching End suffixes (and vice-versa).
     * @param {Object} input - Input configuration object to inspect.
     * @param {boolean} [preventMessage=false] - If true, suppresses warning notifications.
     * @returns {{startWithoutEnd: Array<string>, endWithoutStart: Array<string>}} List of flagged parameter keys.
     */
    static checkStartEndSuffix(input, preventMessage = false) {
        const startWithoutEnd = [];
        const endWithoutStart = [];

        if (!input || typeof input !== "object") {
            const empty = {};
            empty.startWithoutEnd = [];
            empty.endWithoutStart = [];
            return empty;
        }

        const keys = Object.keys(input);

        const startKeys = keys.filter(k => k.endsWith('Start'));
        const endKeys = keys.filter(k => k.endsWith('End'));
        const unSuffixKeys = keys.filter(k => !k.endsWith('Start') && !k.endsWith('End'));

        for (const startKey of startKeys) {
            const baseKey = startKey.slice(0, -5);
            if (unSuffixKeys[baseKey] !== undefined) {
                continue;
            }

            if (input[baseKey + 'End'] === undefined) {
                startWithoutEnd.push(startKey);
            }
        }

        for (const endKey of endKeys) {
            const baseKey = endKey.slice(0, -3);
            if (unSuffixKeys[baseKey] !== undefined) {
                continue;
            }

            if (input[baseKey + 'Start'] === undefined) {
                endWithoutStart.push(endKey);
            }
        }

        const subParticlesResult = CompatibilityV3Manager.warningMissingSuffix(input.subParticles, preventMessage)
        startWithoutEnd.push(...subParticlesResult.startWithoutEnd)
        endWithoutStart.push(...subParticlesResult.endWithoutStart)

        return { startWithoutEnd, endWithoutStart };
    }

    /**
     * Fixes Start/End suffix inconsistencies in configuration object.
     * @param {Object} input - Input configuration object.
     * @returns {Object} Fixed configuration object.
     */
    static _fixStartEndSuffix(input) {
        const { startWithoutEnd, endWithoutStart } = CompatibilityV3Manager.checkStartEndSuffix(input, true);

        for (const startKey of startWithoutEnd) {
            const baseKey = startKey.slice(0, -5);
            input[baseKey] = input[startKey];
        }

        for (const endKey of endWithoutStart) {
            const baseKey = endKey.slice(0, -3);
            input[baseKey] = input[endKey];
        }

        return {
            result: input,
            startWithoutEnd,
            endWithoutStart
        };
    }
}
