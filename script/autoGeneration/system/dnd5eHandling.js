import { Utils } from "../../utils/utils.js"
import { AutoEmissionTemplateCache } from "../autoEmissionTemplateCache.js"
import { getColorsFromDamageRolls, EmitData, emitParticle, TYPE_EMISSION } from "../automaticGeneration.service.js"

/**
 * Initializes D&D 5e system hooks for automated particle generation.
 * @returns {void}
 */
export function automationInitialisation() {
    /**
     * Listener for D&D 5e v2 damage rolls.
     * @param {Array<CONFIG.Dice.DamageRoll>} rolls - Array of damage roll instances.
     * @param {Activity} item - Item or activity associated with the roll.
     */
    Hooks.on("dnd5e.rollDamageV2", async (rolls, item) => {
        console.log('Particles FX automation', rolls, item)
        const activity = item?.subject
        const itemRange = activity?.range?.value ? activity.range.value / canvas.scene.grid.distance : 1
        const colors = getColorsFromDamageRolls(rolls)

        const controlledToken = canvas?.activeLayer?.controlled ?? []

        if (activity?.target?.template?.count) {
            const aetc = AutoEmissionTemplateCache.findByItem(activity.item.id + "_" + activity.id)
            aetc.setSources(controlledToken)
            aetc.setColors(colors)
            return
        }


        const targets = Array.from(game?.user?.targets ?? [])

        const emitDataArray = controlledToken.flatMap((source) =>
            targets.map((target) => {
                const distance = Utils.getGridDistanceBetweenPoint(source, target)
                const type = _findTypeEmission(activity, distance < itemRange + 1)
                return new EmitData(type, source, target, distance)
            })
        )
        emitParticle(emitDataArray, colors)
    })

    /**
     * Listener for D&D 5e post-use activity hook.
     * @param {Activity} activity - The activity instance used.
     */
    Hooks.on("dnd5e.postUseActivity", async (activity) => {
        if (
            !(activity.damage?.parts?.length || activity.healing)
            && activity.isSpell && Object.keys(MAGIC_SPELL_SCHOOL_COLOR).includes(activity.item.system.school)
        ) {
            const controlledToken = canvas?.activeLayer?.controlled?.length ? canvas?.activeLayer?.controlled : [item.parent.token]
            activity
            if (activity?.target?.template?.count) {
                const aetc = AutoEmissionTemplateCache.findByItem(activity.item.id + "_" + activity.id)
                aetc.setSources(controlledToken)
                aetc.setColors([{
                    id: MAGIC_SPELL_SCHOOL_COLOR[activity.item.system.school],
                    fraction: 1
                }])
            } else {
                const targets = Array.from(game?.user?.targets ?? [])

                const emitDataArray = controlledToken.flatMap((source) =>
                    targets.map((target) => {
                        const distance = Utils.getGridDistanceBetweenPoint(source, target)
                        const type = _findTypeEmission(activity, false)
                        return new EmitData(type, source, target, distance)
                    })
                )

                emitParticle(emitDataArray,
                    [{
                        id: MAGIC_SPELL_SCHOOL_COLOR[activity.item.system.school],
                        fraction: 1
                    }]
                )
            }
        }
    })
}

/**
 * Maps a D&D 5e damage roll type to a color template identifier.
 * @param {CONFIG.Dice.DamageRoll} roll - D&D 5e damage roll.
 * @returns {string|undefined} Particle color template ID or undefined.
 */
export function getColorFromDamageRolls(roll) {
    return DAMAGE_COLOR[roll.options.type]
}

/**
 * Extracts a composite item ID from a D&D 5e measured template.
 * @param {Template} template - D&D 5e measured template.
 * @returns {string|undefined} Composite ID in the format `itemId_activityId` or undefined.
 */
export function getItemIdFromTemplate(template) {
    const originsTemplate = template?.flags?.dnd5e?.origin?.split('.') ?? []

    const itemIndex = originsTemplate.indexOf('Item') + 1
    const activityIndex = originsTemplate.indexOf('Activity') + 1

    if (itemIndex > 0 && activityIndex > 0) {
        return originsTemplate[itemIndex] + "_" + originsTemplate[activityIndex]
    } else {
        return
    }
}

/**
 * Determines the particle emission type based on D&D 5e activity properties and range.
 * @param {Activity} activity - The activity executed.
 * @param {boolean} isMelee - Whether target is within melee range.
 * @returns {number} Numeric emission type value from TYPE_EMISSION.
 */
function _findTypeEmission(activity, isMelee) {
    let emissionType
    if (activity.type === "attack" && activity.attack?.type?.value === "melee" && isMelee) {
        emissionType = TYPE_EMISSION.meleeAttack
    } else if (["heal", "utility"].includes(activity.type)) {
        emissionType = TYPE_EMISSION.bonusEffect
    } else if (activity.type === "save") {
        emissionType = TYPE_EMISSION.penaltyEffect
    } else {
        emissionType = TYPE_EMISSION.rangeAttack
    }

    return emissionType
}

/** Map of D&D 5e damage types to particle color template keys. */
const DAMAGE_COLOR = {
    acid: "cyber",
    bludgeoning: "silver",
    fire: "fire",
    force: "charm",
    healing: undefined,
    lightning: "ice",
    cold: "ice",
    necrotic: "death",
    piercing: "silver",
    poison: "poison",
    psychic: "death",
    radiant: "light",
    thunder: "silver",
    slashing: "silver"
}

/** Map of D&D 5e magic spell schools to particle color template keys. */
const MAGIC_SPELL_SCHOOL_COLOR = {
    abj: "silver",
    con: "cyber",
    div: "light",
    enc: "charm",
    evo: "fire",
    ill: "ice",
    nec: "death",
    trs: "poison",
}