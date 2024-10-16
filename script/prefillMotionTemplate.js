import { sameStartKey } from "./utils/utils.js";

export const defaultMotionTemplate = () => {
    return {
        spawningFrequence: 3,
        spawningNumber: 1,
        maxParticles: 1000,
        source: { x: 0, y: 0, z: 0 },
        positionSpawning: { x: 0, y: 0, z: 0 },
        particleLifetime: [3500, 4500],
        particleVelocityStart: '200%',
        particleVelocityEnd: '50%',
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
        onlyEmitterFollow: false,
        subParticles: {
            type: "Spraying",
            positionSpawning: { x: 0, y: 0, z: 0 },
            particleLifetime: 500,
            particleVelocityStart: '100%',
            particleVelocityEnd: 0,
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
            vibrationFrequencyEnd: 0,
        }
    }
}


/**
 * SPRAY DESIGNED PREFILLED TEMPLATE
 * 
 * velocity multiply by particle lifetime must done an average of 500% (5 grids)
 */

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

const waveMissileMotionTemlate = {
    subParticles: {
        type: "Spraying",
        particleLifetime: 2000,
        particleAngleStart: '0_360'
    }
}

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

export const motionTemplateDictionnary = {
    explosion: explosionMotionTemplate,
    breath: breathMotionTemplate,
    ray: rayMotionTemplate,
    trail: trailMissileMotionTemlate,
    wave: waveMissileMotionTemlate,
    grow: growingMissileMotionTemlate,
    vortex: vortexMotionTemplate,
    aura: auraMotionTemplate,
    satellite: satelliteMotionTemplate,
    slash: slashMotionTemplate,
    sonar: sonarMotionTemplate
}