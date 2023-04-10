import ParticuleEmitter from "./script/particuleEmiter.js"
import { Utils } from "./script/utils.js"

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

const Existing_chat_command = [
    'stopAll',
    'stopById',
    'spray',
    'gravitate',
    'help'
]

Hooks.once('ready', function () {
    console.log('particule-fx | ready to particule-fx'); 

    if(getProperty(window,'particuleEmitter.emmitParticules')) return;
		
    //On call, we call method localy and share data with other client
    window.particuleEmitter = {
        ...window.particuleEmitter, 
        sprayParticules: sprayParticules,
        gravitateParticules: gravitateParticules,
        stopAllEmission:  stopAllEmission,
        stopEmissionById: stopEmissionById,
        writeMessageForEmissionById: ParticuleEmitter.writeMessageForEmissionById   //No need to emit to other client
	}

  listen()

  game.settings.register("particule-fx", "avoidParticule", {
		name: game.i18n.localize("PARTICULE-FX.Settings.Avoid.label"),
		hint: game.i18n.localize("PARTICULE-FX.Settings.Avoid.description"),
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
    let otherParam = []

    for(let i = 2; i < messageArgs.length; i++){
      if(functionParam === undefined && !isNaN(messageArgs[i])){
        functionParam = messageArgs[i];
      } else if (!isImmediate && messageArgs[i] === '--instant'){
        isImmediate = true
      } else {
        otherParam.push(messageArgs[i])
      }
    }
    
    let resumeMessage
    let response
    let sourcePosition
    let idEmitter

    switch (functionName){
      case 'stopAll':
        response = stopAllEmission(isImmediate)
        resumeMessage = game.i18n.localize("PARTICULE-FX.Chat-Command.Stop-All.return") + JSON.stringify(response)
        break
      case 'stopById' :
        response = stopEmissionById(functionParam, isImmediate)
        resumeMessage = game.i18n.localize("PARTICULE-FX.Chat-Command.Stop-Id.return") + JSON.stringify(response)
        break
      case 'spray' : 
        sourcePosition = Utils.getSourcePosition()
        if(sourcePosition){
          idEmitter = sprayParticules({positionSpawning: sourcePosition}, ...otherParam)
          ParticuleEmitter.writeMessageForEmissionById(idEmitter)
        }
        break
      case 'gravitate' : 
        sourcePosition = Utils.getSourcePosition()
        if(sourcePosition){
          idEmitter = gravitateParticules({positionSpawning: sourcePosition}, ...otherParam)
          ParticuleEmitter.writeMessageForEmissionById(idEmitter)
        }
        break
      case 'help' : 
        resumeMessage = game.i18n.localize("PARTICULE-FX.Chat-Command.help.return") + Existing_chat_command.join(',');
        break
      default :
        ui.notifications.error(game.i18n.localize("PARTICULE-FX.Chat-Command.Unrecognized"));
    }
//Existing_chat_command
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
        stopEmissionById(button.dataset.emitterId);
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

function sprayParticules(...args){
  emitForOtherClient(s_MESSAGE_TYPES.sprayParticules, args); 
  return ParticuleEmitter.sprayParticules(...args)
}

function gravitateParticules(...args){
  emitForOtherClient(s_MESSAGE_TYPES.gravitateParticules, args); 
  return ParticuleEmitter.gravitateParticules(...args)
}

function stopAllEmission(immediate){
  emitForOtherClient(s_MESSAGE_TYPES.stopAllEmission, immediate); 
  return ParticuleEmitter.stopAllEmission(immediate)
}

function stopEmissionById(emitterId, immediate){
  emitForOtherClient(s_MESSAGE_TYPES.stopEmissionById, {emitterId, immediate}); 
  return ParticuleEmitter.stopEmissionById(emitterId, immediate)
}
        
/*
MACRO TO USE

if (canvas.tokens.controlled.length === 0){
  return ui.notifications.error("Please select a token first");
}

for (let target of canvas.tokens.controlled) {
const position = {x:target.x + target.w /2, y:target.position.y + target.h /2}
	particuleEmitter.emitParticules({positionSpawning:position, particuleVelocityStart : 300})
}
 */