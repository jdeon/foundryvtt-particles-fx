import emitController from "../api/emitController.js"
import { s_MODULE_ID } from "../utils/utils.js"
import { AutoEmissionTemplateCache } from "./autoEmissionTemplateCache.js"
import * as dnd5e from "./system/dnd5eHandling.js"
import * as pf2e from "./system/pf2eHandling.js"

//Suported system script need to have automationInitialisation, getColorsFromDamageRolls and getItemIdFromTemplate methods
const SUPPORTED_SYSTEM = {
    dnd5e: dnd5e,
    pf2e: pf2e
}

let systemMethods
let isInit = false

/**
 * Enumeration of automatic particle emission types.
 * @type {Record<string, number>}
 */
export const TYPE_EMISSION = {
    meleeAttack: 1,
    rangeAttack: 2,
    bonusEffect: 3,
    penaltyEffect: 4,
}

/**
 * Data structure holding configuration for an automated particle emission.
 */
export class EmitData {
    /**
     * @param {TYPE_EMISSION} type - Emission type from TYPE_EMISSION.
     * @param {foundry.canvas.placeables.PlaceableObject} source - Source placeable canvas object.
     * @param {foundry.canvas.placeables.PlaceableObject} target - Target placeable canvas object.
     * @param {number} distance - Grid distance between source and target.
     */
    constructor (type, source, target, distance){
        this.type = type
        this.source = source
        this.target = target 
        this.distance = distance
    }
}

/**
 * Data structure holding color ID and fraction proportion for damage rolls.
 */
export class ColorData {
    /**
     * @param {string|undefined} id - Color template key or undefined for default.
     * @param {number} fraction - Proportion ratio between 0 and 1.
     */
    constructor (id, fraction){
        this.id = id //string
        this.fraction = fraction //number
    }
}

/**
 * Sets up module settings for system automation.
 * @returns {void}
 */
export function setupAutomation(){
    systemMethods = SUPPORTED_SYSTEM[game.system.id]

    if(systemMethods){
        game.settings.register(s_MODULE_ID, "autoEmission", {
            name: game.i18n.localize("PARTICULE-FX.Settings.autoEmission.label"),
            hint: game.i18n.localize("PARTICULE-FX.Settings.autoEmission.description"),
            scope: "client",
            config: true,
            type: Boolean,
            default: true,
            onChange: automationInitialisation
        });
    }
}

/**
 * Initializes system-specific automation handlers if enabled in settings.
 * @returns {void}
 */
export function automationInitialisation(){
    if(!isInit && systemMethods && game.settings.get(s_MODULE_ID, "autoEmission")){
        systemMethods.automationInitialisation()
        _initGlobalHooks()
        isInit =true
    }
}

/**
 * Triggers particle emissions for an array of emission data and color specifications.
 * @param {Array<EmitData>} emitDataArray - Array of EmitData instances.
 * @param {Array<ColorData>} colors - Array of ColorData instances.
 * @returns {void}
 */
export function emitParticle (emitDataArray, colors){
    if(! game.settings.get(s_MODULE_ID, "autoEmission")){
        console.log('particles FX | autoEmission is disable')
        return
    }

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

/**
 * Calculates color proportions from system damage rolls.
 * @param {Array<foundry.dice.Roll>|foundry.dice.Roll} rolls - Damage roll(s).
 * @returns {Array<ColorData>} Computed array of ColorData instances.
 */
export function getColorsFromDamageRolls (rolls) {
    if(!Array.isArray(rolls)){
        rolls = [rolls]
    }

    const colorResumed = {
        mainDamage: { colorDamage : undefined, value: 0 },
        total : 0 
    }
    const colorData = rolls?.reduce((acc, roll) => {
        const colorDamage = systemMethods.getColorFromDamageRolls(roll)

        if(acc[colorDamage]){
            acc[colorDamage].value += roll.total
        } else if (roll.total > 0){
            acc[colorDamage] = { value : roll.total }
        }

        colorResumed.total += roll.total

        if(! colorResumed.mainDamage.colorDamage || colorResumed.mainDamage.value < acc[colorDamage].value ){
            colorResumed.mainDamage = { colorDamage , value: acc[colorDamage].value }
        }

        return acc
    },
    {})


    if(colorResumed.total === 0) return []
    delete colorData.resume

    return Object.keys(colorData)
        .map((key) => new ColorData(key, colorData[key].value / colorResumed.total))
        .filter((finalColor) => finalColor.fraction > 0)
}

/**
 * Registers global hooks for measured template creation.
 * @returns {void}
 */
function _initGlobalHooks(){
    /**
     * Hook triggered when a measured template is created.
     * @param {foundry.canvas.placeables.MeasuredTemplate} template - Created measured template.
     * @param {TODO type} data - Template data.
     * @param {string} userId - ID of the creating user.
     */
    Hooks.on("createMeasuredTemplate", async (template, data, userId) => {
        if (userId !== game.user.id && ! systemMethods) return

        const itemId = systemMethods.getItemIdFromTemplate(template)

        if(itemId){
            const aetc = AutoEmissionTemplateCache.findByItem(itemId)
            aetc.setTemplate(template)
        }
    })
}