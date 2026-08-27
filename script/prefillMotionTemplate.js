import { sameStartKey } from "./utils/utils.js";

/**
 * @typedef {Object} MotionTemplateQuery
 * @property {string|Array<string>} [particleShape] Particle shape identifier (e.g., "CIRCLE", "STAR", "TOR", "DIAMOND").
 * @property {number|string|Array<number|string>} [spawningFrequence] Frequency of particle spawning.
 * @property {number|string|Array<number|string>} [spawningNumber] Number of particles spawned per cycle.
 * @property {number} [maxParticles] Maximum allowable active particles for this emitter.
 * @property {number|string} [emissionDuration] Duration of particle emission in milliseconds.
 * @property {{x: number|string, y: number|string, z: number|string}} [source] Emission source coordinate offset.
 * @property {{x: number|string, y: number|string, z: number|string}} [positionSpawning] Spawning position offset.
 * @property {number|string|Array<number|string>} [particleLifetime] Particle lifetime range or fixed value in milliseconds.
 * @property {number|string|Array<number|string>} [particleVelocityStart] Starting velocity percentage or value.
 * @property {number|string|Array<number|string>} [particleVelocityEnd] Ending velocity percentage or value.
 * @property {number|string|Array<number|string>} [particleAxisElevationAngle] Axis elevation angle in degrees.
 * @property {number|string|Array<number|string>} [particleRiseRateStart] Starting elevation rise rate.
 * @property {number|string|Array<number|string>} [particleRiseRateEnd] Ending elevation rise rate.
 * @property {number|string|Array<number|string>} [particleAngleStart] Starting emission angle in degrees.
 * @property {number|string|Array<number|string>} [particleAngleEnd] Ending emission angle in degrees or sameStartKey.
 * @property {number|string|Array<number|string>} [particleRadiusStart] Starting orbital radius.
 * @property {number|string|Array<number|string>} [particleRadiusEnd] Ending orbital radius.
 * @property {number|string|{x: number|string, y: number|string}|Array} [particleSizeStart] Starting particle size.
 * @property {number|string|{x: number|string, y: number|string}|Array} [particleSizeEnd] Ending particle size.
 * @property {number|string|Array<number|string>} [particleRotationStart] Starting particle rotation angle in degrees.
 * @property {number|string|Array<number|string>} [particleRotationEnd] Ending particle rotation angle in degrees.
 * @property {number|string|Array<number|string>} [alphaStart] Starting opacity alpha value (0 to 1).
 * @property {number|string|Array<number|string>} [alphaEnd] Ending opacity alpha value (0 to 1).
 * @property {number|string|Array<number|string>} [vibrationAmplitudeStart] Starting vibration amplitude.
 * @property {number|string|Array<number|string>} [vibrationAmplitudeEnd] Ending vibration amplitude.
 * @property {number|string|Array<number|string>} [vibrationFrequencyStart] Starting vibration frequency.
 * @property {number|string|Array<number|string>} [vibrationFrequencyEnd] Ending vibration frequency.
 * @property {string} [pathType] Trajectory path type (e.g., "LINEAR", "CURVE").
 * @property {boolean} [onlyEmitterFollow] Whether particles only follow the emitter object.
 * @property {boolean} [freezeOnPause] Whether particle motion freezes when the game is paused.
 * @property {MotionTemplateQuery} [subParticles] Configuration options for trailing sub-particles.
 * @property {Array<MotionTemplateQuery|string>} [next] Chained motion template definitions.
 */

/**
 * Returns default motion template configuration.
 * @returns {MotionTemplateQuery} Object containing default particle motion properties.
 */
export const defaultMotionTemplate = () => {
    return {
        particleShape: "CIRCLE",
        spawningFrequence: 3,
        spawningNumber: 1,
        maxParticles: 1000,
        source: { x: 0, y: 0, z: 0 },
        positionSpawning: { x: 0, y: 0, z: 0 },
        particleLifetime: [3500, 4500],
        particleVelocityStart: '200%',
        particleVelocityEnd: '50%',
        particleAxisElevationAngle: 0,
        particleRiseRateStart: 0,
        particleRiseRateEnd: 0,
        particleAngleStart: '0_360',
        particleAngleEnd: sameStartKey,
        particleRadiusStart: '100%',
        particleRadiusEnd: '50%',
        particleSizeStart: 10,
        particleSizeEnd: '10_25',
        particleRotationStart: 0,
        particleRotationEnd: 0,
        alphaStart: 1,
        alphaEnd: 0,
        vibrationAmplitudeStart: 0,
        vibrationAmplitudeEnd: 0,
        vibrationFrequencyStart: 0,
        vibrationFrequencyEnd: 0,
        pathType: "LINEAR",
        onlyEmitterFollow: false,
        freezeOnPause: true,
        subParticles: {
            type: "Spraying",
            positionSpawning: { x: 0, y: 0, z: 0 },
            particleLifetime: 500,
            particleVelocityStart: '100%',
            particleVelocityEnd: 0,
            particleAxisElevationAngle: 0,
            particleRiseRateStart: 0,
            particleRiseRateEnd: 0,
            particleAngleStart: 0,
            particleAngleEnd: '-45_45',
            particleRadiusStart: 10,
            particleRadiusEnd: 20,
            particleSizeStart: 5,
            particleSizeEnd: 2,
            particleRotationStart: 0,
            particleRotationEnd: 0,
            alphaStart: 1,
            alphaEnd: 0,
            vibrationAmplitudeStart: 0,
            vibrationAmplitudeEnd: 0,
            vibrationFrequencyStart: 0,
            vibrationFrequencyEnd: 0
        },
        next: []
    }
}


/**
 * SPRAY DESIGNED PREFILLED TEMPLATE
 * 
 * velocity multiply by particle lifetime must done an average of 500% (5 grids)
 */

/** Motion template for explosion effect. */
const explosionMotionTemplate = {
    emissionDuration: 250,
    spawningNumber: 10,
    spawningFrequence: 1,
    maxParticles: 10000,
    particleLifetime: 2000,
    particleVelocityStart: '400%_500%',
    particleVelocityEnd: '0%_25%',
    particleAngleStart: '0_360',
    particleSizeStart: 10,
    particleSizeEnd: '25_50',
    alphaStart: 1,
    alphaEnd: .75
}

/** Motion template for breath / cone effect. */
const breathMotionTemplate = {
    emissionDuration: 1000,
    spawningFrequence: 2,
    maxParticles: 1000,
    particleLifetime: 4000,
    particleVelocityStart: '200%_300%',
    particleVelocityEnd: '10%_25%',
    particleAngleStart: '-30_30',
    particleSizeStart: 10,
    particleSizeEnd: '10_25',
    alphaStart: 1,
    alphaEnd: 0
}

/** Motion template for ray / beam effect. */
const rayMotionTemplate = {
    positionSpawning: { x: '50%', y: '-10%_10%', z: 0 },
    emissionDuration: 3000,
    spawningFrequence: 1,
    maxParticles: 10000,
    particleLifetime: 1000,
    particleVelocityStart: '400%_500%',
    particleAngleStart: 0,
    particleSizeStart: { x: '50%', y: '15%' },
    alphaStart: .25,
    vibrationAmplitudeStart: '0_10',
    vibrationFrequencyStart: '0_100'
}

/** Motion template for sonar / wave effect. */
const sonarMotionTemplate = {
    spawningFrequence: 1000,
    spawningNumber: 2000,
    maxParticles: 20000,
    particleLifetime: 4000,
    particleSizeStart: 5,
    particleVelocityStart: '125%',
    alphaStart: .5,
    onlyEmitterFollow: true
}

/**
 * MISSILE DESIGNED PREFILLED TEMPLATE
 * 
 */
/** Motion template for trailing missile effect. */
const trailMissileMotionTemlate = {
    spawningFrequence: 5,
    spawningNumber: 1,
    maxParticles: 1000,
    particleSizeStart: { x: '50%', y: '15%' },
    alphaStart: 1,
    subParticles: {
        type: "Spraying",
        positionSpawning: { x: 0, y: '-5%_5%', z: 0 },
        particleLifetime: 2000,
        alphaStart: .5,
        particleVelocityStart: '0_10%',
        particleVelocityEnd: 0,
        particleAngleStart: 0,
        particleSizeStart: 2,
        particleSizeStart: 5,
        vibrationAmplitudeStart: '1%',
        vibrationFrequencyStart: 1000,
    }
}

/** Motion template for wave missile effect. */
const waveMissileMotionTemlate = {
    subParticles: {
        type: "Spraying",
        particleLifetime: 2000,
        particleAngleStart: '0_360'
    }
}

/** Motion template for growing missile effect. */
const growingMissileMotionTemlate = {
    subParticles: {
        type: "Graviting",
        particleLifetime: 2000,
        particleAngleStart: '0_360',
        particleRadiusStart: '10%',
        particleRadiusEnd: '50%',
    }
}


/**
 * GRAVITATE DESIGNED PREFILLED TEMPLATE
 * 
 */
/** Motion template for vortex effect. */
const vortexMotionTemplate = {
    spawningFrequence: 3,
    maxParticles: 1000,
    particleLifetime: [1000, 1500],
    particleVelocityStart: 150,
    particleVelocityEnd: 50,
    particleAngleStart: '0_360',
    particleRadiusStart: '100%',
    particleRadiusEnd: '25%',
    particleSizeStart: 10,
    particleSizeEnd: '1_10',
    alphaStart: 1,
    alphaEnd: 0
}

/** Motion template for aura effect. */
const auraMotionTemplate = {
    spawningFrequence: 2,
    maxParticles: 10000,
    particleLifetime: [1000, 1500],
    particleVelocityStart: '25_50',
    particleVelocityEnd: '0_10',
    particleAngleStart: '0_360',
    particleRadiusStart: '50%',
    particleRadiusEnd: '75%_150%',
    particleSizeStart: 10,
    particleSizeEnd: '20_40',
    alphaStart: .5,
    alphaEnd: ['0_.25', '.1_.25'],
    onlyEmitterFollow: true
}

/** Motion template for satellite / orbiting effect. */
const satelliteMotionTemplate = {
    spawningFrequence: 1000,
    maxParticles: 4,
    particleLifetime: 8000,
    particleVelocityStart: '90',
    particleAngleStart: 0,
    particleRadiusStart: '100%',
    particleSizeStart: 50,
    alphaStart: .9,
}

/** Motion template for slash effect. */
const slashMotionTemplate = {
    spawningFrequence: .5,
    maxParticles: 500,
    emissionDuration: 250,
    particleLifetime: 500,
    particleVelocityStart: 180,
    particleAngleStart: -45,
    particleRadiusStart: ['50%', '75%', '100%'],
    particleSizeStart: { x: 5, y: 25 },
    particleRotationStart: -45,
    particleRotationEnd: 45,
    alphaStart: .5
}

/** Motion template for atom / orbital effect. */
const atomMotionTemplate = {
    spawningFrequence: 25,
    maxParticles: 250,
    particleLifetime: 60000,
    particleVelocityStart: 120,
    particleRiseRateStart: [-Math.sqrt(2.75 / 4), 0, Math.sqrt(3.25 / 4)],
    particleAngleStart: 0,
    particleRadiusStart: '75%',
    particleSizeStart: [2, 2, 2, 2, 2, [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 10]],
    alphaStart: .9,
}

/** Motion template for flash / starburst effect. */
const flashMotionTemplate = {
    particleShape: "STAR",
    particleLifetime: [100, 250, 500],
    positionSpawning: { x: "-200%_200%", y: "-200%_200%", z: 0 },
    particleVelocityStart: '0',
    particleAngleStart: "0_360",
    particleRadiusStart: '0%_200%'
}

/**
 * Dictionary of built-in motion templates.
 * @type {Record<string, MotionTemplate>}
 */
export const motionTemplateDictionnary = {
    breath: breathMotionTemplate,
    explosion: explosionMotionTemplate,
    ray: rayMotionTemplate,
    sonar: sonarMotionTemplate,
    grow: growingMissileMotionTemlate,
    trail: trailMissileMotionTemlate,
    wave: waveMissileMotionTemlate,
    atom: atomMotionTemplate,
    aura: auraMotionTemplate,
    satellite: satelliteMotionTemplate,
    slash: slashMotionTemplate,
    vortex: vortexMotionTemplate,
    flash: flashMotionTemplate
}