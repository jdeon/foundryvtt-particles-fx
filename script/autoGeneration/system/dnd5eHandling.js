import { Utils } from "../../utils/utils.js"
import { AutoEmissionTemplateCache } from "../autoEmissionTemplateCache.js"
import { getColorsFromDamageRolls, EmitData, emitParticle, TYPE_EMISSION } from "../automaticGeneration.service.js"

export function automationInitialisation() {
    Hooks.on("dnd5e.rollDamageV2", async (rolls, item) => {
        console.log('Particles FX automation', rolls, item)
        const activity = item?.subject
        const itemRange = activity?.range?.value ? activity.range.value / canvas.scene.grid.distance : 1
        const colors = getColorsFromDamageRolls(rolls)

        const controlledToken = canvas?.activeLayer?.controlled ?? []

        if (activity?.target?.template?.count) {//
            const aetc = AutoEmissionTemplateCache.findByItem(activity.item.id + "_" + activity.id)
            aetc.setSources(controlledToken)
            aetc.setColors(colors)
            return
        }


        const targets = Array.from(game?.user?.targets ?? [])

        const emitDataArray = controlledToken.flatMap((source) =>
            targets.map((target) => {
                const distance = Utils.getGridDistanceBetweenPoint(source, target)
                const type = _findTypeEmission(item, distance < itemRange + 1)
                return new EmitData(type, source, target, distance)
            })
        )
        emitParticle(emitDataArray, colors)
    })

    Hooks.on("dnd5e.useItem", async (item) => {
        if (!item.hasDamage && item.type === "spell" && Object.keys(MAGIC_SPELL_SCHOOL_COLOR).includes(item.system.school)) {
            const controlledToken = canvas?.activeLayer?.controlled?.length ? canvas?.activeLayer?.controlled : [item.parent.token]

            if (item.hasAreaTarget) {
                const aetc = AutoEmissionTemplateCache.findByItem(item.id)
                aetc.setSources(controlledToken)
                aetc.setColors([{
                    id: MAGIC_SPELL_SCHOOL_COLOR[item.system.school],
                    fraction: 1
                }])
            } else {
                const targets = Array.from(game?.user?.targets ?? [])

                const emitDataArray = controlledToken.flatMap((source) =>
                    targets.map((target) => {
                        const distance = Utils.getGridDistanceBetweenPoint(source, target)
                        const type = _findTypeEmission(item, false)
                        return new EmitData(type, source, target, distance)
                    })
                )

                emitParticle(emitDataArray,
                    [{
                        id: MAGIC_SPELL_SCHOOL_COLOR[item.system.school],
                        fraction: 1
                    }]
                )
            }
        }
    })
}

export function getColorFromDamageRolls(roll) {
    return DAMAGE_COLOR[roll.options.type]
}

export function getItemIdFromTemplate(template) {
    const originsTemplate = template?.flags?.dnd5e?.origin?.split('.') ?? []

    const itemIndex = originsTemplate.indexOf('Item') + 1

    if (itemIndex > 0) {
        return originsTemplate[itemIndex]
    } else {
        return
    }
}

function _findTypeEmission(activity, isMelee) {
    let emissionType
    if (activity.type === "attack" && activity.attack?.type?.value === "melee" && isMelee) {
        emissionType = TYPE_EMISSION.meleeAttack
    } else if (["heal", "util"].includes(activity.type)) {
        emissionType = TYPE_EMISSION.bonusEffect
    } else if (activity.type === "save") {
        emissionType = TYPE_EMISSION.penaltyEffect
    } else {
        emissionType = TYPE_EMISSION.rangeAttack
    }

    return emissionType
}

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