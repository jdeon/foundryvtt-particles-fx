import {Particule, ParticuleTemplate} from "./model.js"
import {Vector3, Utils} from "./utils.js"

export default class ParticuleEmitter { 
    
    static emitParticules(maxParticules, positionSpawning, particuleVelocity, particuleSize, particuleLifetime, particuleFrequence){
        const particuleTexture = PIXI.Texture.from('/modules/particule-fx/particule.png');

        const position = new Vector3(positionSpawning.x, positionSpawning.y, 0)

        const particuleTemplate = new ParticuleTemplate(position, particuleVelocity, 50, 0, ['-45_45'], [10,particuleSize], [15,10], [1000,particuleLifetime], particuleTexture, new Vector3(250, 0, 0), new Vector3(0, [0,250], [0,250]));
        const particuleEmitter = new ParticuleEmitter(particuleTemplate, particuleFrequence, maxParticules);

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
            const updatedVelocity = ((particule.velocityStart - particule.velocityEnd) * lifetimeProportion) + particule.velocityEnd;
            const angleRadiant = (Math.PI / 180) * (((particule.angleStart - particule.angleEnd) * lifetimeProportion) + particule.angleEnd);
            
            particule.sprite.x += Math.cos(angleRadiant) * updatedVelocity * dt /1000;
            particule.sprite.y += Math.sin(angleRadiant) * updatedVelocity * dt /1000;

            const updatedSize = ((particule.sizeStart - particule.sizeEnd) * lifetimeProportion) + particule.sizeEnd;
            particule.sprite.width = updatedSize
            particule.sprite.height = updatedSize

            //Particule fade during lifetime
            particule.sprite.alpha = lifetimeProportion;
 
            const actualColorVector = particule.colorStart.minus(particule.colorEnd).multiply(lifetimeProportion).add(particule.colorEnd)
            particule.sprite.tint = Color.fromRGB([Math.floor(actualColorVector.x),Math.floor(actualColorVector.y), Math.floor(actualColorVector.z)])
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
        sprite.tint = Color.fromRGB([Math.floor(colorStart.x),Math.floor(colorStart.y), Math.floor(colorStart.z)])

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
            Utils.getRandomValueFrom(particuleTemplate.colorEnd)
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