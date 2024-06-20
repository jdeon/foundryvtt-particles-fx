import emitController from "../api/emitController.js"
import * as dnd5e from "./system/dnd5eHandling.js"

const SUPPORTED_SYSTEM = {
    dnd5e: dnd5e
}

let systemMethods

export const TYPE_EMISSION = {
    meleeAttack: 1,
    rangeAttack: 2,
    bonusEffect: 3,
    penaltyEffect: 4,
}

export class EmitData {
    constructor (type, source, target, distance){
        this.type = type //TYPE_EMISSION
        this.source = source //Placeable object
        this.target = target //Placeable object
        this.distance = distance //number
    }
}

export class ColorData {
    constructor (id, fraction){
        this.id = id //string
        this.fraction = fraction //number
    }
}

export function automationInitialisation(){
    dnd5e.automationInitialisation()
}

/**
 * 
 * @param {[EmitData]} emitDataArray 
 * @param {[ColorData]} colors 
 */
export function emitParticle (emitDataArray, colors){
    emitDataArray.forEach((emitData) => 
        colors.forEach((color) => {
            let gridSizeSource
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
                    gridSizeSource = (Math.max(emitData.target.w, emitData.target.h) ?? canvas.scene.grid.size)/canvas.scene.grid.size 
                    emitController.gravit(
                        {
                            source: emitData.target.id,
                            emissionDuration: 2000,
                            spawningFrequence: 5*color.fraction,
                            particleRadiusStart: `${gridSizeSource*50}%`,
                            particleRadiusEnd: `${gridSizeSource*50 + 25}%_${gridSizeSource*100 + 50}%`,
                        }, 
                        color.id,
                        "aura"
                    )
                    break
                case TYPE_EMISSION.penaltyEffect :
                    gridSizeSource = (Math.max(emitData.target.w, emitData.target.h) ?? canvas.scene.grid.size)/canvas.scene.grid.size 
                    emitController.gravit(
                        {
                            source: emitData.target.id,
                            emissionDuration: 2000,
                            spawningFrequence: 6*color.fraction,
                            particleRadiusStart: `${gridSizeSource*50}%`,
                            particleRadiusEnd: `${gridSizeSource*50 + 25}%_${gridSizeSource*100 + 50}%`,
                            particleRadiusStart: `${gridSizeSource*50 + 50}%`,
                            particleRadiusEnd: `${gridSizeSource*25}%`,
                        }, 
                        color.id,
                        "vortex"
                    )
                    break
                default :
                console.warn('Automatic emission with unknown type ' + emitData.type)
                break
                    
            }
        })
    );
}