import { Utils } from "./utils.js"

function generateTemplateForCircle(radius, velocity){
    let result
    const angle = Utils.getRandomValueFrom('0_360')

    if(velocity>0){
        result = {
            positionSpawning: {x:0,y:0},
            particuleLifetime:radius*Utils.pixelOfDistanceConvertor()*1000/velocity,
            particuleAngleStart: angle,
        }
    } else if (velocity<0){
        result = {
            positionSpawning: {
                x:radius*Math.cos(angle*Math.PI/180),
                y:radius*Math.sin(angle*Math.PI/180)
            },
            particuleLifetime:-1*radius*Utils.pixelOfDistanceConvertor()*1000/velocity,
            particuleAngleStart: angle,
        }
    } else {
        const radiusFinal = Utils.getRandomValueFrom('0_'+radius)

        result = {
            positionSpawning: {
                x:radiusFinal*Math.cos(angle*Math.PI/180),
                y:radiusFinal*Math.sin(angle*Math.PI/180)
            },
        }
    }

    return result
}

function generateTemplateForCone(radius, openingAngle, directionAngle, velocity){
    let result

    const angleMin = directionAngle - openingAngle/2
    const angleMax = directionAngle + openingAngle/2

    const angle = Utils.getRandomValueFrom(angleMin + '_' + angleMax)

    if(velocity>0){
        result = {
            positionSpawning: {x:0,y:0},
            particuleLifetime:radius*Utils.pixelOfDistanceConvertor()*1000/velocity,
            particuleAngleStart: angle,
        }
    } else if (velocity<0){
        result = {
            positionSpawning: {
                x:radius*Math.cos(angle*Math.PI/180),
                y:radius*Math.sin(angle*Math.PI/180)
            },
            particuleLifetime:-1*radius*Utils.pixelOfDistanceConvertor()*1000/velocity,
            particuleAngleStart: angle,
        }
    } else {
        let radiusFinal = Utils.getRandomValueFrom('0_'+radius)

        result = {
            positionSpawning: {
                x:radiusFinal*Math.cos(angle*Math.PI/180),
                y:radiusFinal*Math.sin(angle*Math.PI/180)
            },
        }
    }

    return result
}

function generateTemplateForRect(diagonalLength, diagonalAngle, velocity){
    let result

    const rectX = diagonalLength*Math.cos(diagonalAngle*Math.PI/180)
    const rectY = diagonalLength*Math.sin(diagonalAngle*Math.PI/180)

    if(velocity>0){
        //Source particule is at the center
        const angle = Utils.getRandomValueFrom('0_360')
        //Real velocity on diagonal, slow down the vertical and horisontal
        const teta = angle%180 > 90 ? angle%180 - 2* (angle%180 -90 ) : angle%180

        //Generate a lineare factor to slow down velocity in relation od edge
        const distanceOfPerimeter = teta < 45 ? rectX + (diagonalLength-rectX) * teta/45 : diagonalLength + (rectY-diagonalLength) *(teta-45)/45
        const updatedVelocity = velocity * distanceOfPerimeter/diagonalLength

        result = {
            positionSpawning: {
                x: rectX/2,
                y: rectY/2
            },
            particuleLifetime:diagonalLength*Utils.pixelOfDistanceConvertor()*1000/(2*velocity),
            particuleVelocityStart:updatedVelocity,
            particuleAngleStart: angle,
        }
    } else if (velocity<0){
        const perimeterLength = 2*rectX + 2*rectY
        const perimeterPoint = Utils.getRandomValueFrom('0_'+perimeterLength)
        let spawnPosition

        if(perimeterPoint<rectX){
            spawnPosition = {x:perimeterPoint, y:0}
        } else if(perimeterPoint<rectX+rectY){
            spawnPosition = {x:rectX, y:perimeterPoint-rectX}
        } else if(perimeterPoint<2*rectX+rectY){
            spawnPosition = {x:2*rectX+rectY-perimeterPoint, y:rectY}
        } else {
            spawnPosition = {x:0, y: 2*rectX+2*rectY-perimeterPoint}
        }

        result = {
            positionSpawning: {
                x: spawnPosition.x,
                y: spawnPosition.y
            },
            particuleLifetime: -1 * diagonalLength*Utils.pixelOfDistanceConvertor()*1000/(2*velocity),
            particuleAngleStart: Math.atan2(spawnPosition.y - rectY/2, spawnPosition.x - rectX/2)
        }
    } else {
        result = {
            positionSpawning: {
                x: Utils.getRandomValueFrom('0_'+rectX),
                y: Utils.getRandomValueFrom('0_'+rectY)
            },
        }
    }

    return result
}

function generateTemplateForRay(length, width, directionAngle, velocity){
    let result

    const midWidth = width/2
    const widthPosition = Utils.getRandomValueFrom('-'+midWidth+'_'+midWidth)

    if(velocity>0){
        result = {
            positionSpawning: {
                x: widthPosition * Math.sin(directionAngle * Math.PI / 180),
                y: widthPosition * Math.cos(directionAngle * Math.PI / 180)
            },
            particuleLifetime:length*Utils.pixelOfDistanceConvertor()*1000/velocity,
            particuleAngleStart: directionAngle,
        }
    } else if (velocity<0){
        const targetX = length * Math.cos(directionAngle * Math.PI / 180)
        const targetY = - length * Math.sin(directionAngle * Math.PI / 180)

        result = {
            positionSpawning: {
                x: targetX + widthPosition * Math.sin(directionAngle * Math.PI / 180),
                y: targetY + widthPosition * Math.cos(directionAngle * Math.PI / 180)
            },
            particuleLifetime: -1 * length*Utils.pixelOfDistanceConvertor()*1000/velocity,
            particuleAngleStart: directionAngle
        }
    } else {
        const lengthPosition = Utils.getRandomValueFrom('0_'+length)
        const targetX = lengthPosition * Math.cos(directionAngle * Math.PI / 180)
        const targetY = - lengthPosition * Math.sin(directionAngle * Math.PI / 180)

        result = {
            positionSpawning: {
                x: targetX + widthPosition * Math.sin(directionAngle * Math.PI / 180),
                y: targetY + widthPosition * Math.cos(directionAngle * Math.PI / 180)
            },
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
        result = generateTemplateForRect(measuredTemplate.distance, measuredTemplate.direction, velocity)
    } else if (measuredTemplate.t === "ray") {
        result = generateTemplateForRay(measuredTemplate.distance, measuredTemplate.width, measuredTemplate.direction, velocity)
    }

    return result
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