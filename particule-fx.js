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
        stopAllEmission: ParticuleEmitter.stopAllEmission,
        stopEmissionById: ParticuleEmitter.stopEmissionById,
        writeMessageForEmissionById: ParticuleEmitter.writeMessageForEmissionById
	}
});

Hooks.on("renderChatMessage", function (chatlog, html, data) {
  console.log('particule-fx | renderChatMessage with particule-fx'); 

  const buttons = html.find('button[name="button.delete-emitter"]');

  if(buttons === undefined || buttons.length === 0){
    return
  }

  buttons.on("click", (event) => {
    let button = event.currentTarget
    if(button.dataset.action === "delete"){
        ParticuleEmitter.stopEmissionById(button.dataset.emitterId);
    }
  })
});


/*
MACRO TO USE

if (canvas.tokens.controlled.length === 0){
  return ui.notifications.error("Please select a token first");
}

for (let target of canvas.tokens.controlled) {
const position = {x:target.x + target.w /2, y:target.position.y + target.h /2}
	let idEmitter = particuleEmitter.emitParticules({positionSpawning:position, particuleVelocityStart : 300})

let message = await particuleEmitter.writeMessageForEmissionById(idEmitter, true)

ui.chat.processMessage("/w gm " + message );
}
 */