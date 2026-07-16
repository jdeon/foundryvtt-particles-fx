import { Utils } from "../../utils/utils.js"
import { AutoEmissionTemplateCache } from "../autoEmissionTemplateCache.js"
import { getColorsFromDamageRolls, EmitData, emitParticle, TYPE_EMISSION } from "../automaticGeneration.service.js"

export function automationInitialisation() {
    //Hook dnd5e.rollDamageV2 has too low data
    Hooks.on("renderChatMessage", async (chatMessageData) => {
        console.log('Particles FX automation', chatMessageData)
        if(!chatMessageData?.isDamageRoll) return
        debugger;//pf2e.flags.traits 
        
        const usedItem = chatMessageData.item;
        const itemRange = usedItem?.range?.max ? usedItem.range.value / canvas.scene.grid.distance : 1
        const colors = getColorsFromDamageRolls(chatMessageData.rolls[0].terms[0].rolls) //TODO confirm how to have multiple terms

        const controlledToken = canvas?.activeLayer?.controlled ?? []

        if (chatMessageData.item.area) {
            const aetc = AutoEmissionTemplateCache.findByItem(getItemIdFromTemplate(chatMessageData))
            aetc.setSources(controlledToken)
            aetc.setColors(colors)
            return
        }

        const targets = Array.from(game?.user?.targets ?? [])

        const emitDataArray = controlledToken.flatMap((source) =>
            targets.map((target) => {
                const distance = Utils.getGridDistanceBetweenPoint(source, target)
                const type = _findTypeEmission(usedItem, distance < itemRange + 1)
                return new EmitData(type, source, target, distance)
            })
        )
        emitParticle(emitDataArray, colors)
    })

//TODO how to handle undamage things
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

export function getColorFromDamageRolls(roll) {
    return DAMAGE_COLOR[roll.type]
}

export function getItemIdFromTemplate(template) {
    const originsTemplate = template?.flags?.pf2e?.origin?.uuid?.split('.') ?? []


    const actorIndex = originsTemplate.indexOf('Actor') + 1
    const itemIndex = originsTemplate.indexOf('Item') + 1

    if (actorIndex > 0 && itemIndex > 0) {
        return originsTemplate[actorIndex] + "_" + originsTemplate[itemIndex]
    } else {
        return
    }
}

//TODO
function _findTypeEmission(item, isMelee) {
    let emissionType
    if (item.isAttack && item.isMelee && isMelee) {
        emissionType = TYPE_EMISSION.meleeAttack
    } else if (["heal", "utility"].includes(item.type)) {
        emissionType = TYPE_EMISSION.bonusEffect
    } else if (item.type === "save") {
        emissionType = TYPE_EMISSION.penaltyEffect
    } else {
        emissionType = TYPE_EMISSION.rangeAttack
    }

    return emissionType
}

const DAMAGE_COLOR = {
    //Energy
    acid: "cyber",
    cold: "ice",
    electricity: "ice",
    fire: "fire",
    healing: undefined,
    sonic: "silver",
    force: "charm",
    vitality: "light",
    void: "death",
    //Physic
    bludgeoning: "silver",
    piercing: "silver",
    slashing: "silver",
    bleed: "fire",
    //Other
    mental:"death",
    poison: "poison",
    spirit: "charm"
}

//TODO
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

//TODO test ok for range attack and area attack