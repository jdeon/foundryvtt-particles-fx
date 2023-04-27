import ParticuleEmitter from "./script/particuleEmiter.js"
import { Utils } from "./script/utils.js"

/**
 * Defines the event name to send all messages to over  `game.socket`.
 *
 * @type {string}
 */
export const s_EVENT_NAME = 'module.particule-fx';

/**
 * Defines the different message types that FQL sends over `game.socket`.
 */
export const s_MESSAGE_TYPES = {
  sprayParticules: 'sprayParticules',
  missileParticules: 'missileParticules',
  gravitateParticules: 'gravitateParticules',
  stopAllEmission: 'stopAllEmission',
  stopEmissionById: 'stopEmissionById',
  updateMaxEmitterId: 'updateMaxEmitterId'
};

const Existing_chat_command = [
    'stopAll',
    'stopById',
    'spray',
    'missile',
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
        missileParticules: missileParticules,
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

  game.settings.register("particule-fx", "maxEmitterId", {
    name: "Last id emitter",
    hint: "Don't touch this",
    default: 0,
    type: Number,
    scope: 'world',
    config: false
});


});


Hooks.on("init", () => {
  ChatLog.MESSAGE_PATTERNS["pfx"] = new RegExp("^(/pfx )([^]*)", "i");

  //pfx is added after invalid
  let invalid = ChatLog.MESSAGE_PATTERNS["invalid"]
  delete ChatLog.MESSAGE_PATTERNS["invalid"]
  ChatLog.MESSAGE_PATTERNS["invalid"] = invalid
});


Hooks.on("canvasInit", () => {
  return ParticuleEmitter.stopAllEmission(true)
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
    let source
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
        source = Utils.getSelectedSource()
        if(source){
          idEmitter = sprayParticules({source: source.id, target: Utils.getTargetId()}, ...otherParam)
          ParticuleEmitter.writeMessageForEmissionById(idEmitter)
        }
        break
      case 'missile' : 
        source = Utils.getSelectedSource()
        if(source){
          idEmitter = missileParticules({source: source.id, target: Utils.getTargetId()}, ...otherParam)
          ParticuleEmitter.writeMessageForEmissionById(idEmitter)
        }
        break
      case 'gravitate' : 
        source = Utils.getSelectedSource()
        if(source){
          idEmitter = gravitateParticules({source: source.id}, ...otherParam)
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
            case s_MESSAGE_TYPES.missileParticules: ParticuleEmitter.missileParticules(...data.payload); break;
            case s_MESSAGE_TYPES.gravitateParticules: ParticuleEmitter.gravitateParticules(...data.payload); break;
            case s_MESSAGE_TYPES.stopEmissionById: ParticuleEmitter.stopEmissionById(data.payload.emitterId, data.payload.immediate); break;
            case s_MESSAGE_TYPES.stopAllEmission: ParticuleEmitter.stopAllEmission(data.payload); break;
            case s_MESSAGE_TYPES.updateMaxEmitterId: updateMaxEmitterId(data.payload)
         }
      }
      catch (err)
      {
         console.error(err);
      }
   });
}

function updateMaxEmitterId(payload){
  if(game.user.isGM && payload.maxEmitterId !== undefined && !isNaN(payload.maxEmitterId)){
    game.settings.set("particule-fx", "maxEmitterId", payload.maxEmitterId);
  }
}

function sprayParticules(...args){
  let emitterId = { emitterId: ParticuleEmitter.newEmitterId() }
  emitForOtherClient(s_MESSAGE_TYPES.sprayParticules, args, emitterId); 
  return ParticuleEmitter.sprayParticules(...args, emitterId)
}

function missileParticules(...args){
  let emitterId = { emitterId: ParticuleEmitter.newEmitterId() }
  emitForOtherClient(s_MESSAGE_TYPES.missileParticules, args, emitterId); 
  return ParticuleEmitter.missileParticules(...args, emitterId)
}

function gravitateParticules(...args){
  let emitterId = { emitterId: ParticuleEmitter.newEmitterId() }
  emitForOtherClient(s_MESSAGE_TYPES.gravitateParticules, args, emitterId); 
  return ParticuleEmitter.gravitateParticules(...args, emitterId)
}

function stopAllEmission(immediate){
  ParticuleEmitter.resetEmitterId()
  emitForOtherClient(s_MESSAGE_TYPES.stopAllEmission, immediate); 
  return ParticuleEmitter.stopAllEmission(immediate)
}

function stopEmissionById(emitterId, immediate){
  emitForOtherClient(s_MESSAGE_TYPES.stopEmissionById, {emitterId, immediate}); 
  return ParticuleEmitter.stopEmissionById(emitterId, immediate)
        
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