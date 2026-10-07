import { Vector3 } from "./utils/utils.js"

/**
 * @typedef {Object} ColorTemplateQuery
 * @property {Vector3|Array<Vector3>|{x: number|string, y: number|string, z: number|string}|Array<Vector3|{x: number|string, y: number|string, z: number|string}>} [particleColorStart] Starting particle color (RGB vector or array of vectors).
 * @property {Vector3|Array<Vector3>|{x: number|string, y: number|string, z: number|string}|Array<Vector3|{x: number|string, y: number|string, z: number|string}>} [particleColorEnd] Ending particle color (RGB vector or array of vectors).
 */

/**
 * Returns default color template configuration.
 * @returns {ColorTemplateQuery} Object containing default particle color properties.
 */
export const defaultColorTemplate = () =>  {
    return {
        particleColorStart: new Vector3('150_240', 250, '150_230'),
        particleColorEnd: new Vector3(150, '35_150', 250)
    }
}

/** Fire color template. */
const fireColorTemplate = {
    particleColorStart:new Vector3(250, 250, 50),
    particleColorEnd:new Vector3(250, '50_100', 0),
}

/** Ice color template. */
const iceColorTemplate = {
    particleColorStart:new Vector3('100_150', '200_225', 250),
    particleColorEnd:new Vector3('150_220', '220_250', 250),
}

/** Death/necrotic color template. */
const deathColorTemplate = {
    particleColorStart:new Vector3(0, 0, 0),
    particleColorEnd:new Vector3('0_90', '0_40', '50_140'),
}

/** Light/radiant color template. */
const lightColorTemplate = {
    particleColorStart:new Vector3('250_255', '200_250', '0_200'),
    particleColorEnd:new Vector3(255, 255, '220_255'),
}

/** Poison color template. */
const poisonColorTemplate = {
    particleColorStart:new Vector3([75,'50_200'], '200_250', [75,'50_200']),
    particleColorEnd:new Vector3('10_50', '50_100', '10_50'),
}

/** Silver/physical color template. */
const silverColorTemplate = {
    particleColorStart:[new Vector3(50,50,50),new Vector3(100,100,100),new Vector3(150,150,150),new Vector3(200,200,200)],
    particleColorStart:[new Vector3(100,100,100),new Vector3(150,150,150),new Vector3(200,200,200),new Vector3(250,250,250)]
}

/** Cyber color template. */
const cyberColorTemplate = {
    particleColorStart: new Vector3(0,'200_255',0),
    particleColorEnd: new Vector3(0,'175_225',0)
}

/** Charm/force color template. */
const charmColorTemplate = {
    particleColorStart: [new Vector3(255,'175_255','200_255'),  new Vector3(255, '175', '200')],
    particleColorEnd: [new Vector3('100_255','50_175', '140_200'), new Vector3('100','50', '140')]
}

/**
 * Dictionary of built-in color templates.
 * @type {Record<string, ColorTemplateQuery>}
 */
export const colorTemplateDictionnary = {
    charm: charmColorTemplate,
    cyber: cyberColorTemplate,
    death: deathColorTemplate,
    fire : fireColorTemplate,
    ice: iceColorTemplate,
    light: lightColorTemplate,
    poison: poisonColorTemplate,
    silver: silverColorTemplate,
}