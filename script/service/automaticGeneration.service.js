import { Utils } from "../utils/utils.js"
import emitController from "../api/emitController.js"

export function automationInitialisation(){
    Hooks.on("dnd5e.rollDamage", async (item, rolls) => {
        console.log('Particles FX automation', item, rolls)
        const itemRange = item?.system?.range?.value ? item?.system?.range?.value / canvas.scene.grid.distance : 1

        const colors = _getColorsFromDamageRolls(rolls)

        const controlledToken = canvas?.activeLayer?.controlled ?? []



        const targets = Array.from(game?.user?.targets ?? [])

        const emitDataArray = controlledToken.flatMap((source) => 
            targets.map((target) => {
                const distance = Utils.getGridDistanceBetweenPoint(source, target) //TODO v12 replace by canvas.grid.measurePath([source, target])
                const isRange = !["mwak", "msak"].includes(item?.system?.actionType) ||  distance >= itemRange + 1
                return { 
                    source: source.id,
                    target: target.id,
                    distance,
                    isRange
                }
            })
        )

        _emitParticle(emitDataArray, colors)
    })

}

function _getColorsFromDamageRolls (rolls) {


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
            if(emitData.isRange){
                emitController.missile(
                    {
                        ...emitData, 
                        spawningFrequence: 10*color.fraction,
                        particleVelocityStart: (emitData.distance * 100) + '%'
                    }, 
                    color.id
                )
            } else {
                emitController.gravit(
                    {
                        ...emitData, 
                        spawningFrequence: color.fraction, 
                        particleRadiusStart: [`${emitData.distance * 50}%`, `${emitData.distance * 75}%`, `${emitData.distance * 100}%`],
                        particleSizeStart: {x: emitData.distance * 5, y:emitData.distance * 25},                        
                    }, 
                    color.id,
                    'slash'
                )
            }
        })
}

const DAMAGE_COLOR = {
    acid: "poison",//TODO
    bludgeoning: "silver",
    fire: "fire",
    force: "cyber",//TODO
    lightning: "ice",//TODO
    cold: "ice",
    necrotic: "death",
    piercing: "silver",
    poison: "poison",
    psychic: "death",//TODO
    radiant: "light",
    thunder: "cyber",//TODO
    slashing: "silver"
}
