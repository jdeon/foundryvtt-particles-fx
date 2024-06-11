import { Utils } from "../utils/utils.js"
import emitController from "../api/emitController.js"

export function automationInitialisation(){
    Hooks.on("dnd5e.rollDamage", async (item, rolls) => {
        console.log('Particles FX automation', item, rolls)

        const damages = rolls?.map((roll) => ({
            type : roll.options.type, 
            value : roll.total
        })) ?? []

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

        const mainDamage = damages.reduce((acc, damage) => {
            if(damage.value > acc.value){
                return damage
            }

            return acc
        },
        {value : -100})

        emitDataArray.forEach(emitData => {
            emitController.missile(emitData, DAMAGE_COLOR[mainDamage.type])
        });
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
