import ParticuleEmitter from "./script/particuleEmiter.js"
/* ------------------------------------ */
/* When ready							*/
/* ------------------------------------ */
Hooks.once('ready', function () {
    console.log('particule-fx | ready to particule-fx'); 

    if(getProperty(window,'particuleEmitter.emmitParticules')) return;
			
    window.particuleEmitter = {
        ...window.particuleEmitter, 
        sprayParticules: ParticuleEmitter.sprayParticules,
        gravitateParticules: ParticuleEmitter.gravitateParticules,
        stopAllEmission: ParticuleEmitter.stopAllEmission,
        stopEmissionById: ParticuleEmitter.stopEmissionById,
        writeMessageForEmissionById: ParticuleEmitter.writeMessageForEmissionById
	}
});

Hooks.on("init", () => {
  ChatLog.MESSAGE_PATTERNS["pfx"] = new RegExp("^(/pfx )([^]*)", "i");

  //pfx is added after invalid
  let invalid = ChatLog.MESSAGE_PATTERNS["invalid"]
  delete ChatLog.MESSAGE_PATTERNS["invalid"]
  ChatLog.MESSAGE_PATTERNS["invalid"] = invalid
});

Hooks.on("chatMessage", function(chatlog, message, chatData){
  if(message.startsWith('/pfx')){
    let messageArgs = message.split(' ')

    //No function
    if(messageArgs.length <= 1){
      return
    }

    let functionName = messageArgs[1]
    let functionParam
    let isImmediate = false

    for(let i = 2; i < messageArgs.length; i++){
      if(functionParam === undefined && !isNaN(messageArgs[i])){
        functionParam = messageArgs[i];
      } else if (!isImmediate && messageArgs[i] === '--instant'){
        isImmediate = true
      }
    }
    
    let resumeMessage
    let response

    switch (functionName){
      case 'stopAll':
        response = ParticuleEmitter.stopAllEmission(isImmediate)
        resumeMessage = 'Stop all emissions ' + JSON.stringify(response)
        break
      case 'stopById' :
        response = ParticuleEmitter.stopEmissionById(functionParam, isImmediate)
        resumeMessage = 'Stop emission ' + JSON.stringify(response)
        break
    }

    if(resumeMessage){
      ui.chat.processMessage("/w gm " + resumeMessage )
    }

  }
})

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