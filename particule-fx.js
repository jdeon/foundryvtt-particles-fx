let spawnedEnable = true;

/* ------------------------------------ */
/* When ready							*/
/* ------------------------------------ */
Hooks.once('ready', function () {
    console.log('particule-fx | ready to particule-fx'); 

        const particuleTexture = PIXI.Texture.from('/modules/particule-fx/particule.png');
        const particuleLifetime = 2;
        const particuleFrequence = .5;
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
            const indexParticuleToDelete = []

            for (let i = 0; i < particules.length; i++) {
                const particule = particules[i]
                //particules.sprite.alpha = (particuleLifetime - particules.lifetime) / particuleLifetime;
                particule.sprite.width = particuleSize * (particuleLifetime - particule.lifetime) / particuleLifetime;;
                particule.sprite.height = particuleSize * (particuleLifetime - particule.lifetime) / particuleLifetime;;
                particule.lifetime += .1;

                /*if((particuleLifetime - particule.lifetime) < 0){
                    particule.sprite.destroy()
                    indexParticuleToDelete.push(i)
                }*/
            }

            for (let i = 0; i < indexParticuleToDelete.length; i++) {
                particules.splice(indexParticuleToDelete[i] - i, 1)
            }

            if (mouseposition && spawnedEnable){
                let sprite = new PIXI.Sprite(particuleTexture)
                sprite.x = mouseposition.x;
                sprite.y = mouseposition.y;
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
  

/*
    for (i = 0; i < 26; i++) {
        const texture = PIXI.Texture.from(`Explosion_Sequence_A ${i + 1}.png`);
        explosionTextures.push(texture);
    }

    for (i = 0; i < 50; i++) {
        // create an explosion AnimatedSprite
        const explosion = new PIXI.AnimatedSprite(explosionTextures);

        explosion.x = Math.random() * app.screen.width;
        explosion.y = Math.random() * app.screen.height;
        explosion.anchor.set(0.5);
        explosion.rotation = Math.random() * Math.PI;
        explosion.scale.set(0.75 + Math.random() * 0.5);
        explosion.gotoAndPlay(Math.random() * 26 | 0);
        app.stage.addChild(explosion);
    }
    */

/*
const app = new PIXI.Application({ background: '#1099bb' });
document.body.appendChild(app.view);

// Get the texture for rope.
const trailTexture = PIXI.Texture.from('examples/assets/trail.png');
const historyX = [];
const historyY = [];
// historySize determines how long the trail will be.
const historySize = 20;
// ropeSize determines how smooth the trail will be.
const ropeSize = 100;
const points = [];

// Create history array.
for (let i = 0; i < historySize; i++) {
    historyX.push(0);
    historyY.push(0);
}
// Create rope points.
for (let i = 0; i < ropeSize; i++) {
    points.push(new PIXI.Point(0, 0));
}

// Create the rope
const rope = new PIXI.SimpleRope(trailTexture, points);

// Set the blendmode
rope.blendmode = PIXI.BLEND_MODES.ADD;

app.stage.addChild(rope);

console.log('HELLO!');

let mouseposition = null;
app.stage.interactive = true;
app.stage.hitArea = app.screen;
app.stage.on('mousemove', (event) => {
    mouseposition = mouseposition || { x: 0, y: 0 };
    mouseposition.x = event.global.x;
    mouseposition.y = event.global.y;
});

// Listen for animate update
app.ticker.add(() => {
    if (!mouseposition) return;

    // Update the mouse values to history
    historyX.pop();
    historyX.unshift(mouseposition.x);
    historyY.pop();
    historyY.unshift(mouseposition.y);
    // Update the points to correspond with history.
    for (let i = 0; i < ropeSize; i++) {
        const p = points[i];

        // Smooth the curve with cubic interpolation to prevent sharp edges.
        const ix = cubicInterpolation(historyX, i / ropeSize * historySize);
        const iy = cubicInterpolation(historyY, i / ropeSize * historySize);

        p.x = ix;
        p.y = iy;
    }
});
*/

/**
 * Cubic interpolation based on https://github.com/osuushi/Smooth.js
 */
function clipInput(k, arr) {
    if (k < 0) k = 0;
    if (k > arr.length - 1) k = arr.length - 1;
    return arr[k];
}

function getTangent(k, factor, array) {
    return factor * (clipInput(k + 1, array) - clipInput(k - 1, array)) / 2;
}

function cubicInterpolation(array, t, tangentFactor) {
    if (tangentFactor == null) tangentFactor = 1;

    const k = Math.floor(t);
    const m = [getTangent(k, tangentFactor, array), getTangent(k + 1, tangentFactor, array)];
    const p = [clipInput(k, array), clipInput(k + 1, array)];
    t -= k;
    const t2 = t * t;
    const t3 = t * t2;
    return (2 * t3 - 3 * t2 + 1) * p[0] + (t3 - 2 * t2 + t) * m[0] + (-2 * t3 + 3 * t2) * p[1] + (t3 - t2) * m[1];
}


/*
//create a shadow
        if (token.hidden && !game.user.isGM) return;

        let shadow = new PIXI.Container();
        canvas.tiles.addChild(shadow);
        let colorMatrix = new PIXI.filters.ColorMatrixFilter();
        colorMatrix.sepia(0.6);
        shadow.filters = [colorMatrix];
        shadow.x = x + (token.w / 2);
        shadow.y = y + (token.h / 2);
        shadow.alpha = 0.5;
        shadow.angle = token.document.rotation;

        let width = token.w * token.document.texture.scaleX;
        let height = token.h * token.document.texture.scaleY;

        let tokenImage = await loadTexture(token.document.texture.src || "icons/svg/mystery-man.svg")
        let sprite = new PIXI.Sprite(tokenImage)
        sprite.x = -(token.w / 2) - (width - token.w) / 2;
        sprite.y = -(token.h / 2) - (height - token.h) / 2;
        if (token.mirrorX) {
            sprite.scale.x = -1;
            sprite.anchor.x = 1;
        }
        if (token.mirrorY) {
            sprite.scale.y = -1;
            sprite.anchor.y = 1;
        }

        sprite.width = width;
        sprite.height = height;
        shadow.addChild(sprite);
        shadow._startX = x;
        shadow._startY = y;

        CombatTurn.shadows[token.id] = shadow;
        */