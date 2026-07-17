import { Utils } from "../../utils/utils.js"
import { AutoEmissionTemplateCache } from "../autoEmissionTemplateCache.js"
import { getColorsFromDamageRolls, EmitData, emitParticle, TYPE_EMISSION } from "../automaticGeneration.service.js"

export function automationInitialisation() {
    //Hook pf2e.rollDamageV2 has too low data
    Hooks.on("renderChatMessage", async (chatMessageData) => {
        const usedItem = chatMessageData.item;
        const isSpell = usedItem?.type === 'spell';
        const isHealing = usedItem?.traits?.has('healing') ?? false;
        
        if(!( isHealing || isSpell || chatMessageData?.isDamageRoll)) return

        const damageRolls = chatMessageData?.rolls.flatMap((roll) => 
            roll?.terms?.flatMap((term) => term?.rolls)
        ).filter((roll) => roll !== undefined)
    
        if((usedItem?.system?.damage && Object.keys(usedItem.system.damage).length > 0) && ! damageRolls.length) return //Damage item but without damage rolls
        
        console.log('Particles FX automation', chatMessageData)

        const itemRange = usedItem?.range?.max ? usedItem.range.value / canvas.scene.grid.distance : 1;
        
        let colors;

        if(isHealing){
            colors = [{
                id: undefined, //Default value
                fraction: 1
            }]; 
        } else if (!! damageRolls?.length) {
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
                const type = _findTypeEmission(usedItem, isHealing, distance < itemRange + 1)
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

function _findTypeEmission(item, isHealing, isMeleeRange) {
    let emissionType
    if( isHealing ) {
        emissionType = TYPE_EMISSION.bonusEffect
    } else if (item.isAttack && item.isMelee && isMelee) {
        emissionType = TYPE_EMISSION.meleeAttack
    } else if (item.isAttack) {
        emissionType = TYPE_EMISSION.rangeAttack
    } else if (item.system.defense) {
        emissionType = TYPE_EMISSION.penaltyEffect
    } else {
        emissionType = TYPE_EMISSION.bonusEffect
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

//TODO test ok for range attack, area attack and save (still need bonus)