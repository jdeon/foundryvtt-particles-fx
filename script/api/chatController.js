import { writeMessageForEmissionById } from "../service/particlesEmitter.service.js"
import { s_MODULE_ID, Utils } from "../utils/utils.js"
import emitController from "./emitController.js"

const EXISTING_CHAT_COMMAND = {
    'stopAll': (args) => handleStopAll(args),
    'stopById': (args) => handleStopById(args),
    'stopWorkflow': (args) => handleStopWorkflow(args),
    'spray' : (args) => handleEmission(args, emitController.spray),
    'missile': (args) => handleEmission(args, emitController.missile),
    'gravitate': (args) => handleEmission(args, emitController.gravit),
    'help': () => game.i18n.localize("PARTICULE-FX.Chat-Command.help.return") + EXISTING_CHAT_COMMAND.keys.join(',')
}

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
	    if (messageArgs.length < 2) {
	        return
	    }

	    const functionName = messageArgs[1];
	    const handler = EXISTING_CHAT_COMMAND[functionName];

	    if(handler){
	    	messageArgs.splice(0, 2);
	    	const returnMessage = handler(messageArgs);
	    	if (returnMessage) {
	        	ui.chat.processMessage("/w gm " + returnMessage);
	    	}
	    } else {
	    	 ui.notifications.error(game.i18n.localize("PARTICULE-FX.Chat-Command.Unrecognized"));
	    }

	    //To not display the empty message of the commands
	    return false;
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

function handleEmission (args, emmissionMethod){
	const source = Utils.getSelectedSource();
    if (source) {
        const idEmitter = emmissionMethod({ source: source.id, target: Utils.getTargetId() }, ...args);
        writeMessageForEmissionById(idEmitter);
    }
}

function handleStopById(args){
	const isImmediate = hasOption(args, ['--instant', '-i']);
	const stoppedEmitters = emitController.stop(args, isImmediate);
    return game.i18n.localize("PARTICULE-FX.Chat-Command.Stop-Id.return") + JSON.stringify(stoppedEmitters);
}

function handleStopWorkflow(args){
	const isImmediate = hasOption(args, ['--instant', '-i']);
	const all = hasOption(args, ['--all', '-a']);
	const stoppedEmitters = emitController.stopWorkflow(args, isImmediate, all);
    return game.i18n.localize("PARTICULE-FX.Chat-Command.Stop-Id.return") + JSON.stringify(stoppedEmitters);
}

function handleStopAll(args){
	const isImmediate = hasOption(args, ['--instant', '-i']);
	const stoppedEmitters = emitController.stopAll(isImmediate);
    return game.i18n.localize("PARTICULE-FX.Chat-Command.Stop-All.return") + JSON.stringify(stoppedEmitters);      
}

function hasOption(givenOptions, matchOptions){
	const intersections = givenOptions.filter(x => matchOptions.includes(x));
	return intersections.length > 0;
}