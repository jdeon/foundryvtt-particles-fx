export class Particule { 

    constructor(sprite, remainingTime){
        this.sprite = sprite;
        this.remainingTime = remainingTime;
    }

}


export class ParticuleTemplate { 

    constructor(positionSpawning, particuleSize, particuleLifetime, particuleTexture){
        this.positionSpawning = positionSpawning;
        this.particuleSize = particuleSize;
        this.particuleLifetime = particuleLifetime;
        this.particuleTexture = particuleTexture;
    }

}