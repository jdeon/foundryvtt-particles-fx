import { listen } from "./script/utils/socketManager.js"
import { initEmitters, persistEmitters, stopAllEmission, writeMessageForEmissionById } from "./script/service/particlesEmitter.service.js"
import { addCustomPrefillMotionTemplate, addCustomPrefillColorTemplate } from "./script/service/prefillTemplate.service.js"
import { s_MODULE_ID, Utils } from "./script/utils/utils.js"
import { CompatibiltyV2Manager } from "./script/utils/compatibilityManager.js"
import emitController from "./script/api/emitController.js"
import apiController from "./script/api/apiController.js"
import { subscribeApiToWindow } from "./script/api/windowsController.js"
import ParticlesEmitter from "./script/object/particlesEmitter.js"
import { automationInitialisation } from "./script/autoGeneration/automaticGeneration.service.js"

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

  automationInitialisation()
});

Hooks.on("setup", () => {
  game.settings.register(s_MODULE_ID, "avoidParticle", {
      name: game.i18n.localize("PARTICULE-FX.Settings.Avoid.label"),
      hint: game.i18n.localize("PARTICULE-FX.Settings.Avoid.description"),
      scope: "client",
  config: true,
  type: Boolean,
  default: false
  });

  CompatibiltyV2Manager.addMigrationSettings()

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
      addCustomPrefillMotionTemplate(value)
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
      addCustomPrefillColorTemplate(value)
  }
  });
});

Hooks.on("canvasReady", () => {
  ParticlesEmitter.INIT_EMISSION_CANVAS()

  const isSaveAllowed = game.settings.get(s_MODULE_ID, "saveEmitters")

  if(isSaveAllowed){
    const emittersQueries = canvas.scene.getFlag(s_MODULE_ID, "emitters")

    if(game.ready){
        initEmitters(emittersQueries)
    } else {
        //Waiting the world to be ready at the first launch
        firstSceneEmittersQueries = emittersQueries
    }
  }
});

Hooks.once('ready', function () {
  console.log(`main | ready to ${s_MODULE_ID}`);

  CompatibiltyV2Manager.migrateSettings()
  
  if(firstSceneEmittersQueries){
      initEmitters(firstSceneEmittersQueries)
      firstSceneEmittersQueries = undefined
  }

  addCustomPrefillMotionTemplate(game.settings.get(s_MODULE_ID, "customPrefillMotionTemplate"))
  addCustomPrefillColorTemplate(game.settings.get(s_MODULE_ID, "customPrefillColorTemplate"))

  game.modules.get(s_MODULE_ID).api = apiController
  subscribeApiToWindow()

  listen()
});  
    

//Closing canvas hooks
Hooks.on("canvasTearDown", () => {
  persistEmitters()
  return stopAllEmission(true)
});

//Chat message hooks
  Hooks.on("chatMessage", function(chatlog, message, chatData){
      if(!message.startsWith('/pfx')) return;
      
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
      let emmissionMethod
  
      switch (functionName){
          case 'stopAll':
          response = emitController.stopAll(isImmediate)
          resumeMessage = game.i18n.localize("PARTICULE-FX.Chat-Command.Stop-All.return") + JSON.stringify(response)
          break
          case 'stopById' :
          response = emitController.stop(functionParam, isImmediate)
          resumeMessage = game.i18n.localize("PARTICULE-FX.Chat-Command.Stop-Id.return") + JSON.stringify(response)
          break
          case 'spray' : 
          emmissionMethod = emitController.spray
          break
          case 'missile' : 
          emmissionMethod = emitController.missile
          break
          case 'gravitate' : 
          emmissionMethod = emitController.gravit
          break
          case 'help' : 
          resumeMessage = game.i18n.localize("PARTICULE-FX.Chat-Command.help.return") + Existing_chat_command.join(',');
          break
          default :
          ui.notifications.error(game.i18n.localize("PARTICULE-FX.Chat-Command.Unrecognized"));    
      }

      if (emmissionMethod){
            const source = Utils.getSelectedSource()
            if(source){
                const idEmitter = emmissionMethod({source: source.id, target: Utils.getTargetId()}, ...otherParam)
                writeMessageForEmissionById(idEmitter)
            }
      }

        //Existing_chat_command
      if(resumeMessage){
          ui.chat.processMessage("/w gm " + resumeMessage )
      }
  })
  
  
  Hooks.on("renderChatMessage", function (chatlog, html, data) {
    const buttons = html.find('button[name="button.delete-emitter"]');

    if(buttons === undefined || buttons.length === 0) return

    console.log(`main | renderChatMessage with ${s_MODULE_ID}`); 

    buttons.on("click", (event) => {
    let button = event.currentTarget
    if(button.dataset.action === "delete"){
        emitController.stop(button.dataset.emitterId);
    }
  })
});
