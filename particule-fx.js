import ParticuleEmitter from "./script/particuleEmiter.js"
/* ------------------------------------ */
/* When ready							*/
/* ------------------------------------ */
Hooks.once('ready', function () {
    console.log('particule-fx | ready to particule-fx'); 

    if(getProperty(window,'particuleEmitter.emmitParticules')) return;
			
    window.particuleEmitter = {
        ...window.emitParticules, 
        emitParticules: ParticuleEmitter.emitParticules,
	}
});


/*
MACRO TO USE

//position, particuleSize, particuleLifetime, particuleFrequence

if (canvas.tokens.controlled.length === 0){
  return ui.notifications.error("Please select a token first");
}

for (let target of canvas.tokens.controlled) {
  console.log(target)
  debugger
//const position = {x:target.position.x, y:target.position.y }
const position = {x:target.x + target.w /2, y:target.position.y + target.h /2}
  particuleEmitter.emitParticules(10, position, 300,5, 2000, 1) 
}
 */