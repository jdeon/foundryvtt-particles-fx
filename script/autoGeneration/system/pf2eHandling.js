import { Utils } from "../../utils/utils.js"
import { AutoEmissionTemplateCache } from "../autoEmissionTemplateCache.js"
import { getColorsFromDamageRolls, EmitData, emitParticle, TYPE_EMISSION } from "../automaticGeneration.service.js"

export function automationInitialisation() {
    //Hook dnd5e.rollDamageV2 has too low data
    Hooks.on("renderChatMessage", async (chatMessageData) => {
        console.log('Particles FX automation', chatMessageData)
        if(!chatMessageData?.isDamageRoll) return
        debugger;//pf2e.flags.traits 
        
        let colors;

        if(isHealing){
            colors = [{
                id: undefined, //Default value
                fraction: 1
            }]; 
        } else if (damageRolls) {
            colors = getColorsFromDamageRolls(damageRolls);
        } else if ( isSpell ) {
            const spellTraditions = usedItem?.system?.traits?.traditions ?? [];
            colors = spellTraditions.map((tradition) => ({
                    id:MAGIC_SPELL_TRADITION_COLOR[tradition],
                    fraction: 1 / spellTraditions.length
                })
            );
        } else {
            colors = [];
        }

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

const MAGIC_SPELL_TRADITION_COLOR = {
    arcane: "silver",
    divine: "light",
    occult: "death",
    primal: "poison"
}

//TODO test ok for range attack and area attack