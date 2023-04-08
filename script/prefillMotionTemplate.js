import { Vector3 } from "./utils.js"

export const defaultMotionTemplate = {
    spawningFrequence: 3, 
    maxParticules: 100,
    positionSpawning: {x:0,y:0},
    particuleLifetime: [1000,1500],
    particuleVelocityStart: 200,
    particuleVelocityEnd: 50,
    particuleAngleStart: '0_360',
    particuleAngleEnd: 0,
    particuleRadiusStart: 100,
    particuleRadiusEnd: 50,
    particuleSizeStart: 10,
    particuleSizeEnd: '10_25',
    particuleColorStart:new Vector3('150_240', 250, '150_230'),
    particuleColorEnd:new Vector3(150, '35_150', 250),
    alphaStart:1,
    alphaEnd:0,
    vibrationAmplitudeStart: 0,
    vibrationAmplitudeEnd: 0,
    vibrationFrequencyStart: 0,
    vibrationFrequencyEnd: 0,
}

const explosionMotionTemplate = {
    emissionDuration : 250,
    spawningFrequence: .5, 
    maxParticules: 10000,
    particuleLifetime: 500,
    particuleVelocityStart: '400_500',
    particuleVelocityEnd: '0_25',
    particuleAngleStart: '0_360',
    particuleSizeStart: 10,
    particuleSizeEnd: '25_50',
    particuleColorStart:new Vector3(250, 250, 50),
    particuleColorEnd:new Vector3(250, '50_100', 0),
    alphaStart:1,
    alphaEnd:.75
}

const breathMotionTemplate = {
    emissionDuration : 1000,
    spawningFrequence: 2, 
    maxParticules: 1000,
    particuleLifetime: 2000,
    particuleVelocityStart: '200_300',
    particuleVelocityEnd: '10_25',
    particuleAngleStart: '-30_30',
    particuleSizeStart: 10,
    particuleSizeEnd: '10_25',
    particuleColorStart:new Vector3(250, 250, 50),
    particuleColorEnd:new Vector3(250, '50_100', 0),
    alphaStart:1,
    alphaEnd:0
}

const rayMotionTemplate = {
    emissionDuration : 3000,
    spawningFrequence: 1, 
    maxParticules: 10000,
    particuleLifetime: 2000,
    particuleVelocityStart: 200,
    particuleAngleStart: 0,
    particuleSizeStart: 20,
    particuleColorStart:new Vector3(250, 250, 50),
    particuleColorEnd:new Vector3(250, '50_100', 0),
    alphaStart:.1,
    vibrationAmplitudeStart: '0_10',
    vibrationFrequencyStart: '0_100'
}

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
    particuleColorStart:new Vector3('150_240', 250, '150_230'),
    particuleColorEnd:new Vector3(150, '35_150', 250),
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
    particuleColorStart:new Vector3('150_240', 250, '150_230'),
    particuleColorEnd:new Vector3(150, '35_150', 250),
    alphaStart:.5,
    alphaEnd:['0_.25','.1_.25']
}

const satelliteMotionTemplate = {
    spawningFrequence: 1000, 
    maxParticules: 4,
    particuleLifetime: 8000,
    particuleVelocityStart: '90',
    particuleAngleStart: 0,
    particuleRadiusStart: 100,
    particuleSizeStart: 50,
    particuleColorStart:new Vector3('150_240', 250, '150_230'),
    particuleColorEnd:new Vector3(150, '35_150', 250),
    alphaStart:.9,
}

export const motionTemplateDictionnary = {
    explosion : explosionMotionTemplate,
    breath: breathMotionTemplate,
    ray: rayMotionTemplate,
    vortex: vortexMotionTemplate,
    aura: auraMotionTemplate,
    satellite: satelliteMotionTemplate
}