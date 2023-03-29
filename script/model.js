export class Particule { 

    constructor(sprite, remainingTime){
        this.sprite = sprite;
        this.remainingTime = remainingTime;
    }

}


export class ParticuleTemplate { 

    constructor(positionSpawning, velocityStart, velocityEnd, sizeStart, sizeEnd, particuleLifetime, particuleTexture){
        this.positionSpawning = positionSpawning;
        this.velocityStart = velocityStart;
        this.velocityEnd = velocityEnd;
        this.sizeStart = sizeStart;
        this.sizeEnd = sizeEnd;
        this.particuleLifetime = particuleLifetime;
        this.particuleTexture = particuleTexture;
    }
}