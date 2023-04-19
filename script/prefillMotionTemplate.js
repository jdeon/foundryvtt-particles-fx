import { Vector3 } from "./utils.js"

export const defaultMotionTemplate = {
    spawningFrequence: 3, 
    spawningNumber: 1, 
    maxParticules: 1000,
    source: {x:0,y:0},
    positionSpawning: {x:0,y:0},
    particuleLifetime: [3500,4500],
    particuleVelocityStart: '200%',
    particuleVelocityEnd: '50%',
    particuleAngleStart: '0_360',
    particuleAngleEnd: 0,
    particuleRadiusStart: 100,
    particuleRadiusEnd: 50,
    particuleSizeStart: 10,
    particuleSizeEnd: '10_25',
    particuleRotationStart:0,               
    particuleRotationEnd:0,
    alphaStart:1,
    alphaEnd:0,
    vibrationAmplitudeStart: 0,
    vibrationAmplitudeEnd: 0,
    vibrationFrequencyStart: 0,
    vibrationFrequencyEnd: 0,
    onlyEmitterFollow: false,
    subParticules : {
        type: "Spraying",
        positionSpawning: {x:0,y:0},
        particuleLifetime: 500,
        particuleVelocityStart: '100%',
        particuleVelocityEnd: 0,
        particuleAngleStart: 0,
        particuleAngleEnd: '-45_45',
        particuleRadiusStart: 10,
        particuleRadiusEnd: 20,
        particuleSizeStart: 5,
        particuleSizeEnd: 2,
        particuleRotationStart:0,               
        particuleRotationEnd:0,
        alphaStart:1,
        alphaEnd:0,
        vibrationAmplitudeStart: 0,
        vibrationAmplitudeEnd: 0,
        vibrationFrequencyStart: 0,
        vibrationFrequencyEnd: 0,
    }
}


/**
 * SPRAY DESIGNED PREFILLED TEMPLATE
 * 
 * velocity multiply by particule lifetime must done an average of 500% (5 grids)
 */

const explosionMotionTemplate = {
    emissionDuration : 250,
    spawningNumber: 10,  
    spawningFrequence: 1, 
    maxParticules: 10000,
    particuleLifetime: 2000,
    particuleVelocityStart: '400%_500%',
    particuleVelocityEnd: '0%_25%',
    particuleAngleStart: '0_360',
    particuleSizeStart: 10,
    particuleSizeEnd: '25_50',
    alphaStart:1,
    alphaEnd:.75
}

const breathMotionTemplate = {
    emissionDuration : 1000,
    spawningFrequence: 2, 
    maxParticules: 1000,
    particuleLifetime: 4000,
    particuleVelocityStart: '200%_300%',
    particuleVelocityEnd: '10%_25%',
    particuleAngleStart: '-30_30',
    particuleSizeStart: 10,
    particuleSizeEnd: '10_25',
    alphaStart:1,
    alphaEnd:0
}

const rayMotionTemplate = {
    positionSpawning: {x:0,y:'-10_10'},
    emissionDuration : 3000,
    spawningFrequence: 1, 
    maxParticules: 10000,
    particuleLifetime: 1000,
    particuleVelocityStart: '400%_500%',
    particuleAngleStart: 0,
    particuleSizeStart: {x:50, y:15},
    alphaStart:.25,
    vibrationAmplitudeStart: '0_10',
    vibrationFrequencyStart: '0_100'
}

const sonarMotionTemplate = {
    spawningFrequence: 1000,
    spawningNumber: 2000,  
    maxParticules: 20000,
    particuleLifetime: 4000,
    particuleSizeStart: 5,
    particuleVelocityStart: '125%',
    alphaStart:.5,
    onlyEmitterFollow: true
}

/**
 * GRAVITATE DESIGNED PREFILLED TEMPLATE
 * 
 */
const vortexMotionTemplate = {
    spawningFrequence: 3, 
    maxParticules: 1000,
    particuleLifetime: [1000,1500],
    particuleVelocityStart: 200,
    particuleVelocityEnd: 50,
    particuleAngleStart: '0_360',
    particuleRadiusStart: 100,
    particuleRadiusEnd: 25,
    particuleSizeStart: 10,
    particuleSizeEnd: '1_10',
    alphaStart:1,
    alphaEnd:0
}

const auraMotionTemplate = {
    spawningFrequence: 2, 
    maxParticules: 10000,
    particuleLifetime: [1000,1500],
    particuleVelocityStart: '25_50',
    particuleVelocityEnd: '0_10',
    particuleAngleStart: '0_360',
    particuleRadiusStart: 50,
    particuleRadiusEnd: '75_150',
    particuleSizeStart: 10,
    particuleSizeEnd: '20_40',
    alphaStart:.5,
    alphaEnd:['0_.25','.1_.25'],
    onlyEmitterFollow: true
}

const satelliteMotionTemplate = {
    spawningFrequence: 1000, 
    maxParticules: 4,
    particuleLifetime: 8000,
    particuleVelocityStart: '90',
    particuleAngleStart: 0,
    particuleRadiusStart: 100,
    particuleSizeStart: 50,
    alphaStart:.9,
}

const slashMotionTemplate = {
    spawningFrequence: .5, 
    maxParticules: 500,
    emissionDuration : 250,
    particuleLifetime: 500,
    particuleVelocityStart: 180,
    particuleAngleStart: -45,
    particuleRadiusStart: [50, 75, 100],
    particuleSizeStart: {x:5, y:25},
    particuleRotationStart:-45,               
    particuleRotationEnd:45,
    alphaStart:.5
}

export const motionTemplateDictionnary = {
    explosion : explosionMotionTemplate,
    breath: breathMotionTemplate,
    ray: rayMotionTemplate,
    vortex: vortexMotionTemplate,
    aura: auraMotionTemplate,
    satellite: satelliteMotionTemplate,
    slash: slashMotionTemplate,
    sonar: sonarMotionTemplate
}