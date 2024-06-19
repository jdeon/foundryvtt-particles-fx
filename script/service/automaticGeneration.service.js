import { Utils } from "../utils/utils.js"
import emitController from "../api/emitController.js"
import { AutoEmissionTemplateCache } from "../object/autoEmissionTemplateCache.js"

export const TYPE_EMISSION = {
    meleeAttack: 1,
    rangeAttack: 2,
    bonusEffect: 3,
}

export function automationInitialisation(){
    Hooks.on("dnd5e.rollDamage", async (item, rolls) => {
        console.log('Particles FX automation', item, rolls)
        const itemRange = item?.system?.range?.value ? item?.system?.range?.value / canvas.scene.grid.distance : 1

        const colors = _getColorsFromDamageRolls(rolls)

        const controlledToken = canvas?.activeLayer?.controlled ?? []

        if(item.hasAreaTarget){
            const aetc = AutoEmissionTemplateCache.findByItem(item.id)
            aetc.setSources(controlledToken)
            aetc.setColors(colors)
            return
        }


        const targets = Array.from(game?.user?.targets ?? [])

        const emitDataArray = controlledToken.flatMap((source) => 
            targets.map((target) => {
                const distance = Utils.getGridDistanceBetweenPoint(source, target)
                const type = findTypeEmission(item, distance < itemRange + 1)
                return { 
                    source: source,
                    target: target,
                    distance,
                    type
                }
            })
        )
        _emitParticle(emitDataArray, colors)
    })

    Hooks.on("dnd5e.useItem", async (item) => {
        if(!item.hasDamage && item.type === "spell" && Object.keys(MAGIC_SPELL_SCHOOL_COLOR).includes(item.system.school)){
            const controlledToken = canvas?.activeLayer?.controlled?.length ? canvas?.activeLayer?.controlled : [item.parent.token]
            
            if(item.hasAreaTarget){
                const aetc = AutoEmissionTemplateCache.findByItem(item.id)
                aetc.setSources(controlledToken)
                aetc.setColors([{
                    id: MAGIC_SPELL_SCHOOL_COLOR[item.system.school] , 
                    fraction: 1
                    }])
            } else {
                const targets = Array.from(game?.user?.targets ?? [])

                const emitDataArray = controlledToken.flatMap((source) => 
                    targets.map((target) => {
                        const distance = Utils.getGridDistanceBetweenPoint(source, target)
                        const type = findTypeEmission(item, false)
                        return { 
                            source: source,
                            target: target,
                            distance,
                            type: type
                        }
                    })
                )

                _emitParticle(emitDataArray,
                     [{
                    id: MAGIC_SPELL_SCHOOL_COLOR[item.system.school] , 
                    fraction: 1
                    }]
                )
            }
        }
    })
    
    Hooks.on("createMeasuredTemplate", async (template, data, userId) => {
        if (userId !== game.user.id) { return };

        const originsTemplate = template?.flags?.dnd5e?.origin?.split('.') ?? []

        const itemIndex = originsTemplate.indexOf('Item') + 1

        if(itemIndex>0){
            const aetc = AutoEmissionTemplateCache.findByItem(originsTemplate[itemIndex])
            aetc.setTemplate(template)
        }
    })
}

function findTypeEmission(item, isMelee){
    let emissionType
    if(["mwak", "msak"].includes(item?.system?.actionType) && isMelee){
        emissionType = TYPE_EMISSION.meleeAttack
    } else if (["heal", "util"].includes(item?.system?.actionType)){
        emissionType = TYPE_EMISSION.bonusEffect
    } else {
        emissionType = TYPE_EMISSION.rangeAttack
    }

    return emissionType
}

function _getColorsFromDamageRolls (rolls) {
    if(!Array.isArray(rolls)){
        rolls = [rolls]
    }


    const colorData = rolls?.reduce((acc, roll) => {
        const colorDamage = DAMAGE_COLOR[roll.options.type]

        if(acc[colorDamage]){
            acc[colorDamage].value += roll.total
        } else if (roll.total > 0){
            acc[colorDamage] = { value : roll.total }
        }

        acc.resume.total += roll.total

        if(! acc.resume.mainDamage.colorDamage || acc.resume.mainDamage.value < acc[colorDamage].value ){
            acc.resume.mainDamage = { colorDamage , value: acc[colorDamage].value }
        }

        return acc
    },
    { 
        resume : {
            mainDamage: { colorDamage : undefined, value: 0 },
            total : 0 
        }
    })

    const colorResumed = colorData.resume
    if(colorResumed.total === 0) return []
    delete colorData.resume

    return Object.keys(colorData)
        .map((key) => ({id: key , fraction: colorData[key].value / colorResumed.total}))
        .filter((finalColor) => finalColor.fraction > 0)
}

function _emitParticle (emitDataArray, colors){
    emitDataArray.forEach((emitData) => 
        colors.forEach((color) => {
            switch(emitData.type){
                case TYPE_EMISSION.meleeAttack :
                    emitController.gravit(
                        {
                            source: emitData.source?.id,
                            target: emitData.target?.id, 
                            spawningFrequence: color.fraction, 
                            particleRadiusStart: [`${emitData.distance * 50}%`, `${emitData.distance * 75}%`, `${emitData.distance * 100}%`],
                            particleSizeStart: {x: emitData.distance * 5, y:emitData.distance * 25},                        
                        }, 
                        color.id,
                        'slash'
                    )
                    break
                case TYPE_EMISSION.rangeAttack :
                    emitController.missile(
                        {
                            source: emitData.source?.id,
                            target: emitData.target?.id, 
                            spawningFrequence: 10*color.fraction,
                            particleVelocityStart: (emitData.distance * 100) + '%'
                        }, 
                        color.id
                    )
                    break
                case TYPE_EMISSION.bonusEffect :
                    const gridSizeSource = (Math.max(emitData.target.w, emitData.target.h) ?? canvas.scene.grid.size)/canvas.scene.grid.size 
                    emitController.gravit(
                        {
                            source: emitData.target.id,
                            emissionDuration: 2000,
                            spawningFrequence: 10*color.fraction,
                            particleRadiusStart: `${gridSizeSource*50}%`,
                            particleRadiusEnd: `${gridSizeSource*50 + 25}%_${gridSizeSource*100 + 50}%`,
                        }, 
                        color.id,
                        "aura"
                    )
                    break
            }
        })
    );
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