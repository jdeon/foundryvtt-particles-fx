let spawnedEnable = true;

/* ------------------------------------ */
/* When ready							*/
/* ------------------------------------ */
Hooks.once('ready', function () {
    console.log('particule-fx | ready to particule-fx'); 

        const particuleTexture = PIXI.Texture.from('/modules/particule-fx/particule.png');
        const particuleLifetime = 2000;
        const particuleFrequence = 50;
        const particuleSize = 100;

        const particules = [];
        
        let mouseposition = null;
        canvas.app.stage.interactive = true;
        canvas.app.stage.hitArea = canvas.app.screen;
        canvas.app.stage.on('mousemove', (event) => {
            mouseposition = mouseposition || { x: 0, y: 0 };
            mouseposition.x = event.data.global.x;
            mouseposition.y = event.data.global.y;
        });
        
        // Listen for animate update
        canvas.app.ticker.add(() => {

            for (let i = 0; i < particules.length; i++) {
                const particule = particules[i]
                particule.sprite.alpha = particule.lifetime / particuleLifetime;
                particule.sprite.width = particuleSize * particule.lifetime / particuleLifetime;
                particule.sprite.height = particuleSize * particule.lifetime / particuleLifetime;
                particule.lifetime -= canvas.app.ticker.elapsedMS;//85 in average

                if(particule.lifetime < 0){
                    particule.sprite.destroy()
                    particules.splice(i, 1)
                    //Return to last particule
                    i--
                }
            }

            if (mouseposition && spawnedEnable){
                let sprite = new PIXI.Sprite(particuleTexture)
                sprite.x = mouseposition.x;
                sprite.y = mouseposition.y;
                sprite.anchor.set(0.5);
                sprite.width = particuleSize;
                sprite.height = particuleSize;

                canvas.app.stage.addChild(sprite);
                
                particules.push({sprite:sprite, lifetime : particuleLifetime})

                spawnedEnable = false;

                setTimeout(enableSpawning, particuleFrequence)
            }
        });
    
});

function enableSpawning() {
    spawnedEnable = true;
}
  

/*TODO
sprite.rotation 
sprite.scale
*/