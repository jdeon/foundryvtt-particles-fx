import {Particule, ParticuleTemplate} from "./model.js"

export default class ParticuleEmitter { 
    
    static emitParticules(maxParticules, positionSpawning, particuleVelocity, particuleSize, particuleLifetime, particuleFrequence){
        const particuleTexture = PIXI.Texture.from('/modules/particule-fx/particule.png');
        const particuleTemplate = new ParticuleTemplate(positionSpawning, particuleVelocity, particuleSize, particuleLifetime, particuleTexture);
        const particuleEmitter = new ParticuleEmitter(particuleTemplate, particuleFrequence, maxParticules);

        // Listen for animate update
        canvas.app.ticker.add(particuleEmitter.manageSpawning.bind(particuleEmitter))
    }


    constructor(particuleTemplate, particuleFrequence, maxParticules){
        this.spawnedEnable = true;
        this.particules = [];
        this.particuleTemplate = particuleTemplate;
        this.particuleFrequence = particuleFrequence;
        this.maxParticules = maxParticules
    }

    manageSpawning(){
        for (let i = 0; i < this.particules.length; i++) {
            const particule = this.particules[i]
            const dt = canvas.app.ticker.elapsedMS;//85 in average

            //Particule move
            particule.sprite.x += this.particuleTemplate.velocity.x * dt /1000;
            particule.sprite.y += this.particuleTemplate.velocity.y * dt /1000;

            //Particule fade during lifetime
            particule.sprite.alpha = particule.remainingTime / this.particuleLifetime;
            particule.sprite.width = this.particuleTemplate.particuleSize * particule.remainingTime / this.particuleTemplate.particuleLifetime;
            particule.sprite.height = this.particuleTemplate.particuleSize * particule.remainingTime / this.particuleTemplate.particuleLifetime;

            particule.remainingTime -= dt;

            if(particule.remainingTime < 0){
                particule.sprite.destroy()
                this.particules.splice(i, 1)
                //Return to last particule
                i--
            }
        }

        if (this.spawnedEnable && this.particules.length < this.maxParticules){
            let sprite = new PIXI.Sprite(this.particuleTemplate.particuleTexture)
            sprite.x = this.particuleTemplate.positionSpawning.x;
            sprite.y = this.particuleTemplate.positionSpawning.y;
            sprite.anchor.set(0.5);
            sprite.width = this.particuleTemplate.particuleSize;
            sprite.height = this.particuleTemplate.particuleSize;

            canvas.app.stage.addChild(sprite);
            
            
            this.particules.push(new Particule(sprite, this.particuleTemplate.particuleLifetime))

            this.spawnedEnable = false;

            setTimeout(this.enableSpawning.bind(this), this.particuleFrequence)
        }
    }


    enableSpawning() {
        this.spawnedEnable = true;
    }



}
/*TODO
sprite.rotation 
sprite.scale
*/