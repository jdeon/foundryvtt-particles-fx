import { Utils } from "../utils/utils.js"
import emitController from "../api/emitController.js"

export function automationInitialisation(){
    Hooks.on("dnd5e.rollDamage", async (item, rolls) => {
        console.log('Particles FX automation', item, rolls)

        const damageData = rolls?.reduce((acc, roll) => {
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

        const damageResumed = damageData.resume
        if(damageResumed.total === 0) return //No damage no particles
        delete damageData.resume

        const damages = Object.keys(damageData).map((key) => ({
            colorDamage: key , value: damageData[key].value
        }))

        const controlledToken = canvas?.activeLayer?.controlled ?? []

        const targets = Array.from(game?.user?.targets ?? [])

        const emitDataArray = controlledToken.flatMap((source) => 
            targets.map((target) => {
                const distance = Utils.getGridDistanceBetweenPoint(source, target)

                return { 
                    source: source.id,
                    target: target.id,
                    distance,
                    particleVelocityStart: (distance * 100) + '%'
                }
            })
        )

        emitDataArray.forEach((emitData) => damages.forEach(
            (damage) => {
                if(emitData.distance < 2 ){
                    emitController.gravit(
                        {...emitData, spawningFrequence: (10*(damageResumed.total/damage.value))}, 
                        damage.colorDamage,
                        'slash'
                    )
                } else {
                    emitController.missile(
                        {...emitData, spawningFrequence: (10*(damageResumed.total/damage.value))}, 
                        damage.colorDamage
                    )
                }
            })
        );
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
