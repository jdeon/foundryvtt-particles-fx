import {Particule, ParticuleTemplate} from "./model.js"
import {Vector3, Utils} from "./utils.js"

export default class ParticuleEmitter { 
    
    static defaultInput = {
        spawningFrequence: 3, 
        maxParticules: 100,
        positionSpawning: {x:0,y:0},
        particuleVelocityStart: 200,
        particuleVelocityEnd: 50,
        particuleAngleStart: '0_360',
        particuleAngleEnd: undefined,
        particuleSizeStart: 10,
        particuleSizeEnd: '10_25',
        particuleLifetime: [1000,1500],
        particuleColorStart:new Vector3(250, 250, 50),
        particuleColorEnd:new Vector3(250, '50_100', 0),
        alphaStart:1,
        alphaEnd:0
    }

    static emitParticules(inputObject){
        const particuleTexture = PIXI.Texture.from('/modules/particule-fx/particule.png');

        const position = new Vector3(
            inputObject.positionSpawning.x || ParticuleEmitter.defaultInput.positionSpawning.x, 
            inputObject.positionSpawning.y || ParticuleEmitter.defaultInput.positionSpawning.y, 
            0
            )

        const particuleTemplate = new ParticuleTemplate(
            position, 
            inputObject.particuleVelocityStart || ParticuleEmitter.defaultInput.particuleVelocityStart, 
            inputObject.particuleVelocityEnd || inputObject.particuleVelocityStart || ParticuleEmitter.defaultInput.particuleVelocityEnd, 
            inputObject.particuleAngleStart || ParticuleEmitter.defaultInput.particuleAngleStart, 
            inputObject.particuleAngleEnd || inputObject.particuleAngleStart || ParticuleEmitter.defaultInput.particuleAngleEnd, 
            inputObject.particuleSizeStart || ParticuleEmitter.defaultInput.particuleSizeStart,
            inputObject.particuleSizeEnd || inputObject.particuleSizeStart || ParticuleEmitter.defaultInput.particuleSizeEnd, 
            inputObject.particuleLifetime || ParticuleEmitter.defaultInput.particuleLifetime, 
            particuleTexture, 
            inputObject.particuleColorStart || ParticuleEmitter.defaultInput.particuleColorStart, 
            inputObject.particuleColorEnd || inputObject.particuleColorStart || ParticuleEmitter.defaultInput.particuleColorEnd,
            inputObject.alphaStart || ParticuleEmitter.defaultInput.alphaStart, 
            inputObject.alphaEnd || inputObject.alphaStart || ParticuleEmitter.defaultInput.alphaEnd
            );

        const particuleEmitter = new ParticuleEmitter(
            particuleTemplate, 
            inputObject.spawningFrequence || ParticuleEmitter.defaultInput.spawningFrequence, 
            inputObject.maxParticules || ParticuleEmitter.defaultInput.maxParticules
            );

        // Listen for animate update
        canvas.app.ticker.add(particuleEmitter.manageParticules.bind(particuleEmitter))
    }


    constructor(particuleTemplate, particuleFrequence, maxParticules){
        this.spawnedEnable = true;
        this.particules = [];
        this.particuleTemplate = particuleTemplate;
        this.particuleFrequence = particuleFrequence;
        this.maxParticules = maxParticules
    }

    manageParticules(){
        const dt = canvas.app.ticker.elapsedMS;//85 in average

        for (let i = 0; i < this.particules.length; i++) {
            const particule = this.particules[i]

            let lifetimeProportion = particule.remainingTime / particule.particuleLifetime

            //Particule move

            const updatedVelocity = particule.velocityEnd? ((particule.velocityStart - particule.velocityEnd) * lifetimeProportion) + particule.velocityEnd : particule.velocityStart;
            let angleRadiant = particule.angleEnd ? (((particule.angleStart - particule.angleEnd) * lifetimeProportion) + particule.angleEnd) : particule.angleStart;
            angleRadiant *= (Math.PI / 180);

            particule.sprite.x += Math.cos(angleRadiant) * updatedVelocity * dt /1000;
            particule.sprite.y += Math.sin(angleRadiant) * updatedVelocity * dt /1000;

            //Particule change size
            const updatedSize = particule.sizeEnd ? ((particule.sizeStart - particule.sizeEnd) * lifetimeProportion) + particule.sizeEnd : particule.sizeStart;
            particule.sprite.width = updatedSize
            particule.sprite.height = updatedSize

            //Particule change color
            particule.sprite.alpha = particule.alphaEnd ? ((particule.alphaStart - particule.alphaEnd) * lifetimeProportion) + particule.alphaEnd : particule.alphaStart;
 
            const actualColorVector = particule.colorEnd ? particule.colorStart.minus(particule.colorEnd).multiply(lifetimeProportion).add(particule.colorEnd) : particule.colorStart
            particule.sprite.tint = Color.fromRGB([Math.floor(actualColorVector.x)/255,Math.floor(actualColorVector.y)/255, Math.floor(actualColorVector.z)/255])
            particule.remainingTime -= dt;

            if(particule.remainingTime < 0){
                particule.sprite.destroy()
                this.particules.splice(i, 1)
                //Return to last particule
                i--
            }
        }

        if (this.spawnedEnable && this.particules.length < this.maxParticules){
            const numberNewParticules = 1 + Math.floor(dt/this.particuleFrequence)
            const increaseTime = dt%this.particuleFrequence

            for(let i = 0; i < numberNewParticules; i++){
                const particule = this._generateParticules(this.particuleTemplate);

                canvas.app.stage.addChild(particule.sprite);
                this.particules.push(particule)

                this.spawnedEnable = false;

                setTimeout(this.enableSpawning.bind(this), this.particuleFrequence + increaseTime)
            }
        }
    }

    _generateParticules(particuleTemplate){
        let sprite = new PIXI.Sprite(particuleTemplate.particuleTexture)
        sprite.x = Utils.getRandomValueFrom(particuleTemplate.positionSpawning.x);
        sprite.y = Utils.getRandomValueFrom(particuleTemplate.positionSpawning.y);
        sprite.anchor.set(0.5);

        let startSize = Utils.getRandomValueFrom(particuleTemplate.sizeStart)
        sprite.width = startSize;
        sprite.height = startSize;

        let colorStart = Utils.getRandomValueFrom(particuleTemplate.colorStart)
        sprite.tint = Color.fromRGB([Math.floor(colorStart.x)/255,Math.floor(colorStart.y)/255, Math.floor(colorStart.z)/255])

        //constructor(sprite, particuleLifetime, velocityStart, velocityEnd, angleStart, angleEnd, sizeStart, sizeEnd){
        return new Particule(
            sprite,
            Utils.getRandomValueFrom(particuleTemplate.particuleLifetime),
            Utils.getRandomValueFrom(particuleTemplate.velocityStart),
            Utils.getRandomValueFrom(particuleTemplate.velocityEnd),
            Utils.getRandomValueFrom(particuleTemplate.angleStart),
            Utils.getRandomValueFrom(particuleTemplate.angleEnd),
            startSize,
            Utils.getRandomValueFrom(particuleTemplate.sizeEnd),
            colorStart,
            Utils.getRandomValueFrom(particuleTemplate.colorEnd),
            Utils.getRandomValueFrom(particuleTemplate.alphaStart),
            Utils.getRandomValueFrom(particuleTemplate.alphaEnd)
        )
    }


    enableSpawning() {
        this.spawnedEnable = true;
    }



}
/*TODO
sprite.rotation 
sprite.scale
*/