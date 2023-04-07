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

export const explosionMotionTemplate = {
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
    particuleColorStart:new Vector3(250, 250, 50),
    particuleColorEnd:new Vector3(250, '50_100', 0),
    alphaStart:1,
    alphaEnd:0,
    vibrationAmplitudeStart: 0,
    vibrationAmplitudeEnd: 0,
    vibrationFrequencyStart: 0,
    vibrationFrequencyEnd: 0,
}

export const motionTemplateDictionnary = {
    explosion : explosionMotionTemplate
}