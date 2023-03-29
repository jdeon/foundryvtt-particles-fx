export class Particule { 

    constructor(sprite, remainingTime){
        this.sprite = sprite;
        this.remainingTime = remainingTime;
    }

}


export class ParticuleTemplate { 

    constructor(positionSpawning, velocity, particuleSize, particuleLifetime, particuleTexture){
        this.positionSpawning = positionSpawning;
        this.velocity = velocity;
        this.particuleSize = particuleSize;
        this.particuleLifetime = particuleLifetime;
        this.particuleTexture = particuleTexture;
    }

}