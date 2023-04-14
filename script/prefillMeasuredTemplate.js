
function generateTemplateForCircle(radius, velocity){
    let result
    if(velocity>0){
        result = {
            positionSpawning: {x:0,y:0},
            particuleLifetime:radius/velocity,
            particuleAngleStart: '0_360',
        }
    } else if (velocity<0){
        result = {
            positionSpawning: {r:radius, a:'0_360'},
            particuleLifetime:-1*radius/velocity,
            particuleAngleStart: '0_360',
        }
    } else {
        result = {
            positionSpawning: {r:'0_' + radius, a:'0_360'},
        }
    }

    return result
}

function generateTemplateForCone(radius, openingAngle, directionAngle, velocity){
    let result

    const angleMin = directionAngle - openingAngle/2
    const angleMax = directionAngle + openingAngle/2

    if(velocity>0){
        result = {
            positionSpawning: {x:0,y:0},
            particuleLifetime:radius/velocity,
            particuleAngleStart: angleMin + '_' + angleMax,
        }
    } else if (velocity<0){
        result = {
            positionSpawning: {r:radius, a: angleMin + '_' + angleMax},
            particuleLifetime:-1*radius/velocity,
            particuleAngleStart: angleMin + '_' + angleMax,
        }
    } else {
        result = {
            positionSpawning: {r:'0_' + radius, a: angleMin + '_' + angleMax},
        }
    }

    return result
}

//TODO
function generateTemplateForRay(source, length, width, directionAngle, velocity){
    let result

    const midWidth = width/2
    const targetX = source.x + length * Math.cos(directionAngle * Math.PI / 180)
    const targetY = source.y - length * Math.sin(directionAngle * Math.PI / 180)

    if(velocity>0){
        result = {
            positionSpawning: {x:0,y:'-'+midWidth+'_'+midWidth},
            particuleLifetime:length/velocity,
            particuleAngleStart: directionAngle,
            target:{
                x: targetX,
                y: targetY
            }
        }
    } else if (velocity<0){
        let targetYMin = targetY - midWidth
        let targetYMax = targetY + midWidth

        result = {
            positionSpawning: {
                x: targetX,
                y: targetYMin + '_' + targetYMax
            },
            particuleLifetime: -1 * length/velocity,
            particuleAngleStart: directionAngle,
            target:{
                x: source.x,
                x: source.y
            }
        }
    } else {
        result = {
            positionSpawning: {x:0 + '_' + length,y:'-'+midWidth+'_'+midWidth},
            particuleAngleStart: directionAngle,
            target:{
                x: targetX,
                y: targetY
            }
        }
    }

    return result
}


export function generatePrefillTemplateForMeasured(measuredTemplate, velocity){
    let result

    if(measuredTemplate.t === "circle"){
        result = generateTemplateForCircle(measuredTemplate.distance, velocity)
    } else if (measuredTemplate.t === "cone") {
        result = generateTemplateForCone(measuredTemplate.distance, measuredTemplate.angle, measuredTemplate.direction, velocity)
    } else if (measuredTemplate.t === "rect") {
        //TODO result = generateTemplateForRect(measuredTemplate.distance, measuredTemplate.direction, velocity)
    } else if (measuredTemplate.t === "ray") {
        result = generateTemplateForRay({x:measuredTemplate.x,y:measuredTemplate.y}, measuredTemplate.distance, measuredTemplate.width, measuredTemplate.direction, velocity)
    }
}


export const defaultMotionTemplate = {
    spawningFrequence: 3, 
    spawningNumber: 1, 
    maxParticules: 1000,
    source: {x:0,y:0},
    positionSpawning: {x:0,y:0},
    particuleLifetime: [3500,4500],
    particuleVelocityStart: 200,
    particuleVelocityEnd: 50,
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
    onlyEmitterFollow: false
}

/**
 * [
    {
        "key": "6muyDtqdbHfT7oc8",
        "value": {
            "_id": "6muyDtqdbHfT7oc8",
            "user": "GbqHPYzg1VzJn1ff",
*            "t": "circle",
*            "x": 477,
*            "y": 319,
*            "distance": 2.9846463070935547,
            "direction": 25.003713474531654,
            "angle": 0,
            "width": null,
            "borderColor": "#000000",
            "fillColor": "#34b3c0",
            "texture": null,
            "hidden": false,
            "flags": {}
        }
    },
    {
        "key": "9Bm5RIeiHuBpORmG",
        "value": {
            "_id": "9Bm5RIeiHuBpORmG",
            "user": "GbqHPYzg1VzJn1ff",
*            "t": "cone",
*            "x": 713,
*            "y": 338,
*            "distance": 4.635290120949922,
*            "direction": 59.66266683736779,
*            "angle": 53.13,
            "width": null,
            "borderColor": "#000000",
            "fillColor": "#34b3c0",
            "texture": null,
            "hidden": false,
            "flags": {}
        }
    },
    {
        "key": "L8m2bCMnB89BZYNr",
        "value": {
            "_id": "L8m2bCMnB89BZYNr",
            "user": "GbqHPYzg1VzJn1ff",
*            "t": "rect",
*            "x": 97,
*            "y": 430,
*            "distance": 3.8657352305288177,    //distance diagonale
*            "direction": 44.40443032826531,     //rotation diagonale
            "angle": 0,
            "width": null,
            "borderColor": "#000000",
            "fillColor": "#34b3c0",
            "texture": null,
            "hidden": false,
            "flags": {}
        }
    },
    {
        "key": "2RxpEHRS2tyR5jgB",
        "value": {
            "_id": "2RxpEHRS2tyR5jgB",
            "user": "GbqHPYzg1VzJn1ff",
*            "t": "ray",
*            "x": 396,
*            "y": 569,
*           "distance": 4.96666123791471,
*           "direction": 359.7377825744759,
            "angle": 0,
*            "width": 2,
            "borderColor": "#000000",
            "fillColor": "#34b3c0",
            "texture": null,
            "hidden": false,
            "flags": {}
        }
    }
]
 */