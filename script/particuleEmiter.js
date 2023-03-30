import {Particule, ParticuleTemplate} from "./model.js"
import {Vector3, Utils} from "./utils.js"

export default class ParticuleEmitter { 
    
    static emitParticules(maxParticules, positionSpawning, particuleVelocity, particuleSize, particuleLifetime, particuleFrequence){
        const particuleTexture = PIXI.Texture.from('/modules/particule-fx/particule.png');

        const position = new Vector3(positionSpawning.x, positionSpawning.y, 0)

        const particuleTemplate = new ParticuleTemplate(position, particuleVelocity, 50, 0, ['-45_45'], [10,particuleSize], [15,10], [1000,particuleLifetime], particuleTexture, new Color(250, 0, 0));
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
        for (let i = 0; i < this.particules.length; i++) {
            const particule = this.particules[i]
            const dt = canvas.app.ticker.elapsedMS;//85 in average

            //Particule move
            const updatedVelocity = ((particule.velocityStart - particule.velocityEnd) * particule.remainingTime / particule.particuleLifetime) + particule.velocityEnd;
            const angleRadiant = (Math.PI / 180) * (((particule.angleStart - particule.angleEnd) * particule.remainingTime / particule.particuleLifetime) + particule.angleEnd);
            
            particule.sprite.x += Math.cos(angleRadiant) * updatedVelocity * dt /1000;
            particule.sprite.y += Math.sin(angleRadiant) * updatedVelocity * dt /1000;

            //Particule fade during lifetime
            particule.sprite.alpha = particule.remainingTime / particule.particuleLifetime;
            const updatedSize = ((particule.sizeStart - particule.sizeEnd) * particule.remainingTime / particule.particuleLifetime) + particule.sizeEnd;
            particule.sprite.width = updatedSize
            particule.sprite.height = updatedSize

            particule.remainingTime -= dt;

            if(particule.remainingTime < 0){
                particule.sprite.destroy()
                this.particules.splice(i, 1)
                //Return to last particule
                i--
            }
        }

        if (this.spawnedEnable && this.particules.length < this.maxParticules){
            const particule = this._generateParticules(this.particuleTemplate);

            canvas.app.stage.addChild(particule.sprite);
            this.particules.push(particule)

            this.spawnedEnable = false;

            setTimeout(this.enableSpawning.bind(this), this.particuleFrequence)
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
        sprite.tint = particuleTemplate.color;

        //constructor(sprite, particuleLifetime, velocityStart, velocityEnd, angleStart, angleEnd, sizeStart, sizeEnd){
        return new Particule(
            sprite,
            Utils.getRandomValueFrom(particuleTemplate.particuleLifetime),
            Utils.getRandomValueFrom(particuleTemplate.velocityStart),
            Utils.getRandomValueFrom(particuleTemplate.velocityEnd),
            Utils.getRandomValueFrom(particuleTemplate.angleStart),
            Utils.getRandomValueFrom(particuleTemplate.angleEnd),
            Utils.getRandomValueFrom(particuleTemplate.sizeStart),
            Utils.getRandomValueFrom(particuleTemplate.sizeEnd)
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