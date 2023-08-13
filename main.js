import ParticlesEmitter from "./script/particlesEmitter.js"
import { Utils } from "./script/utils.js"

/**
 * Defines the event name to send all messages to over  `game.socket`.
 *
 * @type {string}
 */
export const s_MODULE_ID = 'particule-fx';


/**
 * Defines the event name to send all messages to over  `game.socket`.
 *
 * @type {string}
 */
export const s_EVENT_NAME = `module.${s_MODULE_ID}`;

/**
 * Defines the different message types that FQL sends over `game.socket`.
 */
export const s_MESSAGE_TYPES = {
  sprayParticles: 'sprayParticles',
  missileParticles: 'missileParticles',
  gravitateParticles: 'gravitateParticles',
  stopAllEmission: 'stopAllEmission',
  stopEmissionById: 'stopEmissionById',
  updateMaxEmitterId: 'updateMaxEmitterId',
  updateCustomPrefillTemplate: 'updateCustomPrefillTemplate'
};

//The first scene emitters is load before the game is ready, we need to wait until the ready hooks
let firstSceneEmittersQueries

const Existing_chat_command = [
    'stopAll',
    'stopById',
    'spray',
    'missile',
    'gravitate',
    'help'
]

Hooks.on("init", () => {
  ChatLog.MESSAGE_PATTERNS["pfx"] = new RegExp("^(/pfx )([^]*)", "i");

  //pfx is added after invalid
  let invalid = ChatLog.MESSAGE_PATTERNS["invalid"]
  delete ChatLog.MESSAGE_PATTERNS["invalid"]
  ChatLog.MESSAGE_PATTERNS["invalid"] = invalid
});

Hooks.on("setup", () => {
  game.settings.register(s_MODULE_ID, "avoidParticule", {
		name: game.i18n.localize("PARTICULE-FX.Settings.Avoid.label"),
		hint: game.i18n.localize("PARTICULE-FX.Settings.Avoid.description"),
		scope: "client",
    config: true,
    type: Boolean,
    default: false
	});

  game.settings.register(s_MODULE_ID, "saveEmitters", {
		name: game.i18n.localize("PARTICULE-FX.Settings.Persist.label"),
		hint: game.i18n.localize("PARTICULE-FX.Settings.Persist.description"),
		scope: "world",
    config: true,
    type: Boolean,
    default: false
	});

  game.settings.register(s_MODULE_ID, "minimalRole", {
		name: game.i18n.localize("PARTICULE-FX.Settings.minRole.label"),
		hint: game.i18n.localize("PARTICULE-FX.Settings.minRole.description"),
    default: CONST.USER_ROLES.GAMEMASTER,
    choices: Object.entries(CONST.USER_ROLES).reduce(
        //Generate object of role with id for value
        (accumulator, [label, id]) => {
            const capLabel = label[0].toUpperCase() + label.slice(1).toLowerCase()
            const localizeLabel = game.i18n.localize(`USER.Role${capLabel}`)
            accumulator[id] = localizeLabel; 
            return accumulator
        },
        {}
    ),
    type: String,
		scope: "world",
    config: true,
	});

  game.settings.register(s_MODULE_ID, "maxEmitterId", {
    name: "Last id emitter",
    hint: "Don't touch this",
    default: 0,
    type: Number,
    scope: 'world',
    config: false
  });

  game.settings.register(s_MODULE_ID, "customPrefillMotionTemplate", {
    name: "Map of custom prefill motion template",
    hint: "Don't touch this",
    default: {},
    type: Object,
    scope: 'world',
    config: false,
    onChange: value => {
      ParticlesEmitter.addCustomPrefillMotionTemplate(value)
    }
  });

  game.settings.register(s_MODULE_ID, "customPrefillColorTemplate", {
    name: "Map of custom prefill color template",
    hint: "Don't touch this",
    default: {},
    type: Object,
    scope: 'world',
    config: false,
    onChange: value => {
      ParticlesEmitter.addCustomPrefillColorTemplate(value)
    }
  });
});


Hooks.on("canvasReady", () => {
  const isSaveAllowed = game.settings.get(s_MODULE_ID, "saveEmitters")

  if(isSaveAllowed){
    const emittersQueries = canvas.scene.getFlag(s_MODULE_ID, "emitters")

    if(game.ready){
      ParticlesEmitter.initEmitters(emittersQueries)
    } else {
      //Waiting the world to be ready at the first launch
      firstSceneEmittersQueries = emittersQueries
    }
  }
});


Hooks.once('ready', function () {
    console.log(`main | ready to ${s_MODULE_ID}`);
    
    if(firstSceneEmittersQueries){
      ParticlesEmitter.initEmitters(firstSceneEmittersQueries)
      firstSceneEmittersQueries = undefined
    }

    ParticlesEmitter.addCustomPrefillMotionTemplate(game.settings.get(s_MODULE_ID, "customPrefillMotionTemplate"))
    ParticlesEmitter.addCustomPrefillColorTemplate(game.settings.get(s_MODULE_ID, "customPrefillColorTemplate"))

    if(getProperty(window,'particuleEmitter.emmitParticules')) return;
		
    //On call, we call method localy and share data with other client
    window.particuleEmitter = {
        ...window.particuleEmitter, 
        sprayParticules: sprayParticules,
        missileParticules: missileParticules,
        gravitateParticules: gravitateParticules,
        stopAllEmission:  stopAllEmission,
        stopEmissionById: stopEmissionById,
        writeMessageForEmissionById: ParticlesEmitter.writeMessageForEmissionById,   //No need to emit to other client
        addCustomPrefillMotionTemplate,
        removeCustomPrefillMotionTemplate,
        getCustomPrefillMotionTemplate,
        addCustomPrefillColorTemplate,
        removeCustomPrefillColorTemplate,
        getCustomPrefillColorTemplate,
	}

  listen()
});


Hooks.on("canvasTearDown", () => {
  ParticlesEmitter.persistEmitters()
  return ParticlesEmitter.stopAllEmission(true)
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
          idEmitter = sprayParticles({source: source.id, target: Utils.getTargetId()}, ...otherParam)
          ParticlesEmitter.writeMessageForEmissionById(idEmitter)
        }
        break
      case 'missile' : 
        source = Utils.getSelectedSource()
        if(source){
          idEmitter = missileParticles({source: source.id, target: Utils.getTargetId()}, ...otherParam)
          ParticlesEmitter.writeMessageForEmissionById(idEmitter)
        }
        break
      case 'gravitate' : 
        source = Utils.getSelectedSource()
        if(source){
          idEmitter = gravitateParticles({source: source.id}, ...otherParam)
          ParticlesEmitter.writeMessageForEmissionById(idEmitter)
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
  console.log(`main | renderChatMessage with ${s_MODULE_ID}`); 

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

      if(game.settings.get(s_MODULE_ID, "avoidParticule")){ return; }

      try
      {
         // Dispatch the incoming message data by the message type.
         switch (data.type)
         {
            case s_MESSAGE_TYPES.sprayParticles: ParticlesEmitter.sprayParticles(...data.payload); break;
            case s_MESSAGE_TYPES.missileParticles: ParticlesEmitter.missileParticles(...data.payload); break;
            case s_MESSAGE_TYPES.gravitateParticles: ParticlesEmitter.gravitateParticles(...data.payload); break;
            case s_MESSAGE_TYPES.stopEmissionById: ParticlesEmitter.stopEmissionById(data.payload.emitterId, data.payload.immediate); break;
            case s_MESSAGE_TYPES.stopAllEmission: ParticlesEmitter.stopAllEmission(data.payload); break;
            case s_MESSAGE_TYPES.updateMaxEmitterId: updateMaxEmitterId(data.payload); break;
            case s_MESSAGE_TYPES.updateCustomPrefillTemplate: updateCustomPrefillTemplate(data.payload); break;
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
    game.settings.set(s_MODULE_ID, "maxEmitterId", payload.maxEmitterId);
  }
}

function sprayParticles(...args){
  let emitterId = { emitterId: ParticlesEmitter.newEmitterId() }
  emitForOtherClient(s_MESSAGE_TYPES.sprayParticles, args, emitterId); 
  return ParticlesEmitter.sprayParticles(...args, emitterId)
}

function missileParticles(...args){
  let emitterId = { emitterId: ParticlesEmitter.newEmitterId() }
  emitForOtherClient(s_MESSAGE_TYPES.missileParticles, args, emitterId); 
  return ParticlesEmitter.missileParticles(...args, emitterId)
}

function gravitateParticles(...args){
  let emitterId = { emitterId: ParticlesEmitter.newEmitterId() }
  emitForOtherClient(s_MESSAGE_TYPES.gravitateParticles, args, emitterId); 
  return ParticlesEmitter.gravitateParticles(...args, emitterId)
}

function stopAllEmission(immediate){
  ParticlesEmitter.resetEmitterId()
  emitForOtherClient(s_MESSAGE_TYPES.stopAllEmission, immediate); 
  return ParticlesEmitter.stopAllEmission(immediate)
}

function stopEmissionById(emitterId, immediate){
  emitForOtherClient(s_MESSAGE_TYPES.stopEmissionById, {emitterId, immediate}); 
  return ParticlesEmitter.stopEmissionById(emitterId, immediate)
}

function addCustomPrefillMotionTemplate(key, customPrefillMotionTemplate){
  if(! isCustomPrellTemplateParamValid(key, customPrefillMotionTemplate)) return;

  if(game.user.isGM){
    let actualPrefillMotionTemplate = game.settings.get(s_MODULE_ID, "customPrefillMotionTemplate")

    if(actualPrefillMotionTemplate === undefined){
      actualPrefillMotionTemplate = {}
    }

    actualPrefillMotionTemplate[key] = customPrefillMotionTemplate
    game.settings.set(s_MODULE_ID, "customPrefillMotionTemplate", actualPrefillMotionTemplate)
  } else if(game.user.role >= game.settings.get(s_MODULE_ID, "minimalRole")){
    emitForOtherClient(s_MESSAGE_TYPES.updateCustomPrefillTemplate, {type:'motion', operation:'add', key, customPrefillTemplate: customPrefillMotionTemplate})
  } else {
    ui.notifications.error(game.i18n.localize('PARTICULE-FX.Prefill-Template.Bad-Role'))
  }
}

function removeCustomPrefillMotionTemplate(key){
  if(game.user.isGM){
    let actualPrefillMotionTemplate = game.settings.get(s_MODULE_ID, "customPrefillMotionTemplate")

    if(actualPrefillMotionTemplate === undefined){
      actualPrefillMotionTemplate = {}
    } 
    
    if (actualPrefillMotionTemplate[key] === undefined){
      ui.notifications.warn(game.i18n.localize('PARTICULE-FX.Prefill-Template.Bad-Key') + key);
      return
    }

    delete actualPrefillMotionTemplate[key]

    game.settings.set(s_MODULE_ID, "customPrefillMotionTemplate", actualPrefillMotionTemplate)
  } else if(game.user.role >= game.settings.get(s_MODULE_ID, "minimalRole")){
    emitForOtherClient(s_MESSAGE_TYPES.updateCustomPrefillTemplate, {type:'motion', operation:'remove', key})
  } else {
    ui.notifications.error(game.i18n.localize('PARTICULE-FX.Prefill-Template.Bad-Role'))
  }
}

function getCustomPrefillMotionTemplate(key){
  const prefillMotionTemplate = game.settings.get(s_MODULE_ID, "customPrefillMotionTemplate")

  if(key !== undefined && typeof key === 'string' ){
    return prefillMotionTemplate[key]
  } else {
    return prefillMotionTemplate
  }
}

function addCustomPrefillColorTemplate(key, customPrefillColorTemplate){
  if(! isCustomPrellTemplateParamValid(key, customPrefillColorTemplate)) return;

  if(game.user.isGM){
    let actualPrefillColorTemplate = game.settings.get(s_MODULE_ID, "customPrefillColorTemplate")

    if(actualPrefillColorTemplate === undefined){
      actualPrefillColorTemplate = {}
    }

    actualPrefillColorTemplate[key] = customPrefillColorTemplate
    game.settings.set(s_MODULE_ID, "customPrefillColorTemplate", actualPrefillColorTemplate)
  } else if(game.user.role >= game.settings.get(s_MODULE_ID, "minimalRole")){
    emitForOtherClient(s_MESSAGE_TYPES.updateCustomPrefillTemplate, {type:'color', operation:'add', key, customPrefillTemplate: customPrefillColorTemplate})
  } else {
    ui.notifications.error(game.i18n.localize('PARTICULE-FX.Prefill-Template.Bad-Role'))
  }
}

function removeCustomPrefillColorTemplate(key){
  if(game.user.isGM){
    let actualPrefillColorTemplate = game.settings.get(s_MODULE_ID, "customPrefillColorTemplate")

    if(actualPrefillColorTemplate === undefined){
      actualPrefillColorTemplate = {}
    } 
    
    if (actualPrefillColorTemplate[key] === undefined){
      ui.notifications.warn(game.i18n.localize('PARTICULE-FX.Prefill-Template.Bad-Key') + key);
      return
    }

    delete actualPrefillColorTemplate[key]

    game.settings.set(s_MODULE_ID, "customPrefillColorTemplate", actualPrefillColorTemplate)
  } else if(game.user.role >= game.settings.get(s_MODULE_ID, "minimalRole")){
    emitForOtherClient(s_MESSAGE_TYPES.updateCustomPrefillTemplate, {type:'color', operation:'remove', key})
  } else {
    ui.notifications.error(game.i18n.localize('PARTICULE-FX.Prefill-Template.Bad-Role'))
  }
}

function getCustomPrefillColorTemplate(key){
  const prefillColorTemplate = game.settings.get(s_MODULE_ID, "customPrefillColorTemplate")

  if(key !== undefined && typeof key === 'string' ){
    return prefillColorTemplate[key]
  } else {
    return prefillColorTemplate
  }
}

const customPrefillTemplateDispatchMethod = {
  motion : {
    add : addCustomPrefillMotionTemplate,
    remove : removeCustomPrefillMotionTemplate,
    get : getCustomPrefillMotionTemplate,
  },
  color : {
    add : addCustomPrefillColorTemplate,
    remove : removeCustomPrefillColorTemplate,
    get : getCustomPrefillColorTemplate,
  }
}

function isCustomPrellTemplateParamValid(key, customPrefillTemplate){
  if(!key || ! typeof key === 'string' || !customPrefillTemplate || !customPrefillTemplate instanceof Object){
    ui.notifications.error(game.i18n.localize('PARTICULE-FX.Prefill-Template.Bad-Param'));
    return false
  }

  return true
}

function updateCustomPrefillTemplate({type, operation, key, customPrefillTemplate}) {
  if(! game.user.isGM) return

  const method = customPrefillTemplateDispatchMethod[type][operation]

  if(method !== undefined && typeof method === 'function'){
    method(key, customPrefillTemplate)
  }

}