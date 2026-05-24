import { writeMessageForEmissionById } from "./script/service/particlesEmitter.service.js"
import { s_MODULE_ID, Utils } from "./script/utils/utils.js"
import emitController from "./script/api/emitController.js"

const EXISTING_CHAT_COMMAND = [
    'stopAll',
    'stopById',
    'stopWorkflow',
    'spray',
    'missile',
    'gravitate',
    'help'
]

export function initChatController() {

	foundry.applications.sidebar.tabs.ChatLog.MESSAGE_PATTERNS["pfx"] = new RegExp("^(/pfx )([^]*)", "i");

    //pfx is added after invalid so we need to put back invalid at the end
    let invalid = foundry.applications.sidebar.tabs.ChatLog.MESSAGE_PATTERNS["invalid"]
    delete foundry.applications.sidebar.tabs.ChatLog.MESSAGE_PATTERNS["invalid"]
    foundry.applications.sidebar.tabs.ChatLog.MESSAGE_PATTERNS["invalid"] = invalid

    //Chat message hooks
	Hooks.on("chatMessage", function (chatlog, message, chatData) {
	    if (!message.startsWith('/pfx')) return;

	    let messageArgs = message.split(' ')

	    //No function
	    if (messageArgs.length <= 1) {
	        return
	    }

	    let functionName = messageArgs[1]
	    let functionParam
	    let isImmediate, all = false
	    let otherParam = []

	    for (let i = 2; i < messageArgs.length; i++) {
	        if (functionParam === undefined && !isNaN(messageArgs[i])) {
	            functionParam = messageArgs[i];
	        } else if (!isImmediate && messageArgs[i] === '--instant') {
	            isImmediate = true
	        } else if (!all && messageArgs[i] === '--all') {
	            all = true
	        } else {
	            otherParam.push(messageArgs[i])
	        }
	    }

	    let resumeMessage
	    let response
	    let emmissionMethod

	    switch (functionName) {
	        case 'stopAll':
	            response = emitController.stopAll(isImmediate)
	            resumeMessage = game.i18n.localize("PARTICULE-FX.Chat-Command.Stop-All.return") + JSON.stringify(response)
	            break
	        case 'stopById':
	            response = emitController.stop(functionParam, isImmediate)
	            resumeMessage = game.i18n.localize("PARTICULE-FX.Chat-Command.Stop-Id.return") + JSON.stringify(response)
	            break
	        case 'stopWorkflow':
	            response = emitController.stopWorkflow(functionParam, isImmediate, all)
	            resumeMessage = game.i18n.localize("PARTICULE-FX.Chat-Command.Stop-Id.return") + JSON.stringify(response)
	            break  
	        case 'spray':
	            emmissionMethod = emitController.spray
	            break
	        case 'missile':
	            emmissionMethod = emitController.missile
	            break
	        case 'gravitate':
	            emmissionMethod = emitController.gravit
	            break 
	        case 'help':
	            resumeMessage = game.i18n.localize("PARTICULE-FX.Chat-Command.help.return") + EXISTING_CHAT_COMMAND.join(',');
	            break
	        default:
	            ui.notifications.error(game.i18n.localize("PARTICULE-FX.Chat-Command.Unrecognized"));
	    }

	    if (emmissionMethod) {
	        const source = Utils.getSelectedSource()
	        if (source) {
	            const idEmitter = emmissionMethod({ source: source.id, target: Utils.getTargetId() }, ...otherParam)
	            writeMessageForEmissionById(idEmitter)
	        }
	    }

	    //EXISTING_CHAT_COMMAND
	    if (resumeMessage) {
	        ui.chat.processMessage("/w gm " + resumeMessage)
	    }

	    return false
	})


	Hooks.on("renderChatMessage", function (chatlog, html, data) {
	    const buttons = html.find('button[name="button.delete-emitter"]');

	    if (buttons === undefined || buttons.length === 0) return

	    console.log(`main | renderChatMessage with ${s_MODULE_ID}`);

	    buttons.on("click", (event) => {
	        let button = event.currentTarget
	        if (button.dataset.action === "delete") {
	            emitController.stop(button.dataset.emitterId);
	        }
	    })
	});
}