import { ParticleInput } from "../object/particleInput.js"
import { Utils, sameStartKey } from "../utils/utils.js"

/**
 * Generates emission properties for a circular measured template.
 * @param {number} radius - Radius in grid distance units.
 * @param {number} velocity - Emission velocity.
 * @returns {{positionSpawning: Vector3, particleLifetime:number|undefined, angleStart: number|undefined, angleEnd: number|undefined}} Generated position, lifetime, and angle properties.
 */
function generateTemplateForCircle(radius, velocity){
    let result
    const angle = Utils.getRandomValueFrom('0_360')

    if(velocity>0){
        result = {
            positionSpawning: {x:0,y:0},
            particleLifetime:radius*Utils.pixelOfDistanceConvertor()*1000/velocity,
            angleStart: angle,
            angleEnd: angle,
        }
    } else if (velocity<0){
        result = {
            positionSpawning: {
                x:radius*Utils.pixelOfDistanceConvertor()*Math.cos(angle*Math.PI/180),
                y:radius*Utils.pixelOfDistanceConvertor()*Math.sin(angle*Math.PI/180)
            },
            particleLifetime:-1*radius*Utils.pixelOfDistanceConvertor()*1000/velocity,
            angleStart: angle,
            angleEnd: angle,
        }
    } else {
        const radiusFinal = Utils.getRandomValueFrom('0_'+radius) * Utils.pixelOfDistanceConvertor()

        result = {
            positionSpawning: {
                x:radiusFinal*Math.cos(angle*Math.PI/180),
                y:radiusFinal*Math.sin(angle*Math.PI/180)
            },
        }
    }

    return result
}

/**
 * Generates emission properties for a cone measured template.
 * @param {number} radius - Cone radius in grid distance units.
 * @param {number} openingAngle - Opening angle of the cone in degrees.
 * @param {number} directionAngle - Center direction angle in degrees.
 * @param {number} velocity - Emission velocity.
 * @returns {{positionSpawning: Vector3, particleLifetime:number|undefined, angleStart: number|undefined, angleEnd: number|undefined}} Generated emission properties.
 */
function generateTemplateForCone(radius, openingAngle, directionAngle, velocity){
    let result

    const angleMin = directionAngle - openingAngle/2
    const angleMax = directionAngle + openingAngle/2

    const angle = Utils.getRandomValueFrom(angleMin + '_' + angleMax)

    if(velocity>0){
        result = {
            positionSpawning: {x:0,y:0},
            particleLifetime:radius*Utils.pixelOfDistanceConvertor()*1000/velocity,
            angleStart: angle,
            angleEnd: angle,
        }
    } else if (velocity<0){
        result = {
            positionSpawning: {
                x:radius*Utils.pixelOfDistanceConvertor()*Math.cos(angle*Math.PI/180),
                y:radius*Utils.pixelOfDistanceConvertor()*Math.sin(angle*Math.PI/180)
            },
            particleLifetime:-1*radius*Utils.pixelOfDistanceConvertor()*1000/velocity,
            angleStart: angle,
            angleEnd: angle,
        }
    } else {
        let radiusFinal = Utils.getRandomValueFrom('0_'+radius)

        result = {
            positionSpawning: {
                x:radiusFinal*Utils.pixelOfDistanceConvertor()*Math.cos(angle*Math.PI/180),
                y:radiusFinal*Utils.pixelOfDistanceConvertor()*Math.sin(angle*Math.PI/180)
            },
        }
    }

    return result
}

/**
 * Generates emission properties for a rectangular measured template.
 * @param {number} diagonalLength - Diagonal length in distance units.
 * @param {number} diagonalAngle - Angle of the diagonal in degrees.
 * @param {number} velocity - Average emission velocity.
 * @param {number} velocityGap - Half difference between start and end velocity.
 * @returns {{positionSpawning: Vector3, particleLifetime:number|undefined, velocityStart:number|undefined, velocityEnd:number|undefined, angleStart: number|undefined, angleEnd: number|undefined}} Generated emission properties.
 */
function generateTemplateForRect(diagonalLength, diagonalAngle, velocity, velocityGap){
    let result

    const rectX = diagonalLength*Utils.pixelOfDistanceConvertor()*Math.cos(diagonalAngle*Math.PI/180)
    const rectY = diagonalLength*Utils.pixelOfDistanceConvertor()*Math.sin(diagonalAngle*Math.PI/180)
    const rectDiagonal =  diagonalLength*Utils.pixelOfDistanceConvertor()

    if(velocity>0){
        //Source particle is at the center
        const angle = Utils.getRandomValueFrom('0_360')
        //Real velocity on diagonal, slow down the vertical and horisontal
        const teta = angle%180 > 90 ? angle%180 - 2* (angle%180 -90 ) : angle%180

        //Use trigonometrie, we want to know the hypothenus of the triangle to slow down velocity in relation od edge
        const distanceOfPerimeter = teta < (Math.atan2(rectY/2, rectX/2) *180 / Math.PI) ? rectX/2 * (1/Math.cos(teta * Math.PI / 180)) : rectY/2 * (1/Math.cos((90-teta) * Math.PI / 180))
        const velocityFactor = distanceOfPerimeter/(rectDiagonal/2)

        result = {
            positionSpawning: {
                x: rectX/2,
                y: rectY/2
            },
            particleLifetime:rectDiagonal*1000/(2*velocity),
            velocityStart: (velocity - velocityGap) * velocityFactor,
            velocityEnd: (velocity + velocityGap) * velocityFactor,
            angleStart: angle,
            angleEnd: angle,
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

        const distanceOfPerimeter = Math.sqrt(Math.pow(spawnPosition.y - rectY/2,2 ) + Math.pow(spawnPosition.x - rectX/2, 2))
        const velocityFactor = distanceOfPerimeter/(rectDiagonal/2)
        const angle = Math.atan2(spawnPosition.y - rectY/2, spawnPosition.x - rectX/2) *180 / Math.PI

        result = {
            positionSpawning: {
                x: spawnPosition.x,
                y: spawnPosition.y
            },
            particleLifetime: -1 * rectDiagonal*1000/(2*velocity),
            velocityStart: (velocity - velocityGap) * velocityFactor,
            velocityEnd: (velocity + velocityGap) * velocityFactor,
            angleStart: angle,
            angleEnd: angle
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

/**
 * Generates emission properties for a ray/beam measured template.
 * @param {number} length - Length of ray in grid distance units.
 * @param {number} width - Width of ray in grid distance units.
 * @param {number} directionAngle - Direction angle of ray in degrees.
 * @param {number} velocity - Emission velocity.
 * @returns {{positionSpawning: Vector3, particleLifetime:number|undefined, angleStart: number|undefined, angleEnd: number|undefined}} Generated emission properties.
 */
function generateTemplateForRay(length, width, directionAngle, velocity){
    let result

    const midWidth = width*Utils.pixelOfDistanceConvertor()/2
    const widthPosition = Utils.getRandomValueFrom('-'+midWidth+'_'+midWidth)

    if(velocity>0){
        result = {
            positionSpawning: {
                x: - widthPosition * Math.sin(directionAngle * Math.PI / 180),
                y: widthPosition * Math.cos(directionAngle * Math.PI / 180)
            },
            particleLifetime:length*Utils.pixelOfDistanceConvertor()*1000/velocity,
            angleStart: directionAngle,
            angleEnd: directionAngle
        }
    } else if (velocity<0){
        const targetX = length * Math.cos(directionAngle * Math.PI / 180) * Utils.pixelOfDistanceConvertor()
        const targetY = length * Math.sin(directionAngle * Math.PI / 180) * Utils.pixelOfDistanceConvertor()

        result = {
            positionSpawning: {
                x: targetX - widthPosition * Math.sin(directionAngle * Math.PI / 180),
                y: targetY + widthPosition * Math.cos(directionAngle * Math.PI / 180)
            },
            particleLifetime: -1 * length*Utils.pixelOfDistanceConvertor()*1000/velocity,
            angleStart: directionAngle,
            angleEnd: directionAngle
        }
    } else {
        const lengthPosition = Utils.getRandomValueFrom('0_'+length) * Utils.pixelOfDistanceConvertor()
        const targetX = lengthPosition * Math.cos(directionAngle * Math.PI / 180)
        const targetY = lengthPosition * Math.sin(directionAngle * Math.PI / 180)

        result = {
            positionSpawning: {
                x: targetX - widthPosition * Math.sin(directionAngle * Math.PI / 180),
                y: targetY + widthPosition * Math.cos(directionAngle * Math.PI / 180)
            },
        }
    }

    return result
}


/**
 * Generates particle template override parameters matching a canvas measured template.
 * @param {TODO find foundry type MeasuredTemplate} measuredTemplate - Target measured template document.
 * @param {number} velocityStart - Starting particle velocity.
 * @param {number} velocityEnd - Ending particle velocity.
 * @returns {{positionSpawning: ParticleInput<Vector3>, particleLifetime:ParticleInput<number>|undefined, velocityStart:ParticleInput<number>|undefined, velocityEnd:ParticleInput<number>|undefined, angleStart: ParticleInput<number>|undefined, angleEnd: ParticleInput<number>|undefined}} Property map converted to ParticleInput instances.
 */
export function generatePrefillTemplateForMeasured(measuredTemplate, velocityStart, velocityEnd){
    let result

    velocityEnd = velocityEnd === sameStartKey ? velocityStart : velocityEnd ;

    const velocity = (velocityStart + velocityEnd)/2

    if(measuredTemplate.t === "circle"){
        result = generateTemplateForCircle(measuredTemplate.distance, velocity)
    } else if (measuredTemplate.t === "cone") {
        result = generateTemplateForCone(measuredTemplate.distance, measuredTemplate.angle, measuredTemplate.direction, velocity)
    } else if (measuredTemplate.t === "rect") {
        result = generateTemplateForRect(measuredTemplate.distance, measuredTemplate.direction, velocity, (velocityEnd - velocityStart)/2 )
    } else if (measuredTemplate.t === "ray") {
        result = generateTemplateForRay(measuredTemplate.distance, measuredTemplate.width, measuredTemplate.direction, velocity)
    }

    return mapToInputParticle(result)
}

/**
 * Computes bounding dimensions (width and height) for a measured template.
 * @param {TODO find foundry type MeasuredTemplate} measuredTemplate - Target measured template.
 * @returns {{w: number, h: number}} Bounding width and height in distance units.
 */
export function computeTemplateForMeasuredDimension(measuredTemplate){
    let result

    if(measuredTemplate.t === "circle"){
        result = { w: measuredTemplate.distance *2, h: measuredTemplate.distance *2 }
    } else if (measuredTemplate.t === "cone") {
        result = { w: measuredTemplate.distance *2, h: measuredTemplate.distance *2 }
    } else if (measuredTemplate.t === "rect") {
        result = { 
            w: measuredTemplate.distance*Math.cos(measuredTemplate.direction*Math.PI/180), 
            h: measuredTemplate.distance*Math.sin(measuredTemplate.direction*Math.PI/180) 
        }
    } else if (measuredTemplate.t === "ray") {
        result = { 
            w: measuredTemplate.distance, 
            h: measuredTemplate.width 
        }
    }

    return result
}

/**
 * Maps raw property values in an object to ParticleInput instances.
 * @param {Record<string, number|string|Vector3>} result - Raw property dictionary.
 * @returns {Record<string, ParticleInput>} Transformed object containing ParticleInputs.
 */
function mapToInputParticle(result){
    const keys = Object.keys(result)

    for(let key of keys){
        result[key] = ParticleInput.build(result[key])
    }

    return result
}