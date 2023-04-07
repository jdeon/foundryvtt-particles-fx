import ParticuleEmitter from "./script/particuleEmiter.js"

/**
 * Defines the event name to send all messages to over  `game.socket`.
 *
 * @type {string}
 */
const s_EVENT_NAME = 'module.particule-fx';

/**
 * Defines the different message types that FQL sends over `game.socket`.
 */
const s_MESSAGE_TYPES = {
  sprayParticules: 'sprayParticules',
  gravitateParticules: 'gravitateParticules',
  stopAllEmission: 'stopAllEmission',
  stopEmissionById: 'stopEmissionById'
};

Hooks.once('ready', function () {
    console.log('particule-fx | ready to particule-fx'); 

    if(getProperty(window,'particuleEmitter.emmitParticules')) return;
		
    //On call, we call method localy and share data with other client
    window.particuleEmitter = {
        ...window.particuleEmitter, 
        sprayParticules: (...args) => {emitForOtherClient(s_MESSAGE_TYPES.sprayParticules, args); return ParticuleEmitter.sprayParticules(...args)},
        gravitateParticules: (...args) => {emitForOtherClient(s_MESSAGE_TYPES.gravitateParticules, args); return ParticuleEmitter.gravitateParticules(...args)},
        stopAllEmission:  (immediate) => {emitForOtherClient(s_MESSAGE_TYPES.stopAllEmission, immediate); return ParticuleEmitter.stopAllEmission(immediate)},
        stopEmissionById: (emitterId, immediate) => {emitForOtherClient(s_MESSAGE_TYPES.stopEmissionById, {emitterId, immediate}); return ParticuleEmitter.stopEmissionById(emitterId, immediate)},
        writeMessageForEmissionById: ParticuleEmitter.writeMessageForEmissionById   //No need to emit to other client
	}

  listen()

  game.settings.register("particule-fx", "avoidParticule", {
		name: "Avoid particule emission",
		hint: "Don't show particule from other client (useful for lower config)",
		scope: "client",
        config: true,
        type: Boolean,
        default: false
	});
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
        emitForOtherClient(s_MESSAGE_TYPES.stopAllEmission, immediate)
        resumeMessage = 'Stop all emissions ' + JSON.stringify(response)
        break
      case 'stopById' :
        response = ParticuleEmitter.stopEmissionById(functionParam, isImmediate)
        emitForOtherClient(s_MESSAGE_TYPES.stopEmissionById, {emitterId, immediate})
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
        emitForOtherClient(s_MESSAGE_TYPES.stopEmissionById, {emitterId, immediate})
    }
  })
});

function emitForOtherClient(type, payload){
  game.socket.emit(s_EVENT_NAME, {
    type: type,
    payload: payload
 });
}

/**
* Provides the main incoming message registration and distribution of socket messages on the receiving side.
*/
function listen()
{
   game.socket.on(s_EVENT_NAME, (data) =>
   {
      if (typeof data !== 'object') { return; }

      if(game.settings.get("particule-fx", "avoidParticule")){ return; }

      try
      {
         // Dispatch the incoming message data by the message type.
         switch (data.type)
         {
            case s_MESSAGE_TYPES.sprayParticules: ParticuleEmitter.sprayParticules(...data.payload); break;
            case s_MESSAGE_TYPES.gravitateParticules: ParticuleEmitter.gravitateParticules(...data.payload); break;
            case s_MESSAGE_TYPES.stopEmissionById: ParticuleEmitter.stopEmissionById(data.payload.emitterId, data.payload.immediate); break;
            case s_MESSAGE_TYPES.stopAllEmission: ParticuleEmitter.stopAllEmission(data.payload); break;
         }
      }
      catch (err)
      {
         console.error(err);
      }
   });
}

/*
Hooks.callAll(`particulefx-sprayParticules`, query)

Hooks.on("particulefx-sprayParticules", function (query) {
  ParticuleEmitter.sprayParticules(query);
});
*/



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