import { buildInputForParentEmitter, writeMessageForEmissionById } from "../service/particlesEmitter.service.js"
import { s_MODULE_ID, Utils, Vector3 } from "../utils/utils.js"
import emitController from "./emitController.js"
import ParticlesEmitter from "../object/particlesEmitter.js"

const EXISTING_CHAT_COMMAND = {
	'stopAll': (args) => handleStopAll(args),
	'stopById': (args) => handleStopById(args),
	'stopWorkflow': (args) => handleStopWorkflow(args),
	'spray' : (args) => handleEmission(args, emitController.spray, { type : 'Spraying'}),
	'missile': (args) => handleMissile(args),
	'gravitate': (args) => handleEmission(args, emitController.gravit, { type : 'Graviting'}),
	'help': () => game.i18n.localize("PARTICULE-FX.Chat-Command.help.return") + Object.keys(EXISTING_CHAT_COMMAND).join(', ')
}

const COMMON_OPTIONS = {};

export function initChatController() {

	foundry.applications.sidebar.tabs.ChatLog.MESSAGE_PATTERNS["pfx"] = new RegExp("^(/pfx )([^]*)", "i");

	// pfx is added after invalid so we need to put back invalid at the end
	let invalid = foundry.applications.sidebar.tabs.ChatLog.MESSAGE_PATTERNS["invalid"]
	delete foundry.applications.sidebar.tabs.ChatLog.MESSAGE_PATTERNS["invalid"]
	foundry.applications.sidebar.tabs.ChatLog.MESSAGE_PATTERNS["invalid"] = invalid

	Hooks.on("ready", function () {
		COMMON_OPTIONS.help= game.i18n.localize("PARTICULE-FX.Chat-Command.Options.help");
		COMMON_OPTIONS.instant= game.i18n.localize("PARTICULE-FX.Chat-Command.Options.instant");
		COMMON_OPTIONS.first= game.i18n.localize("PARTICULE-FX.Chat-Command.Options.first");
		COMMON_OPTIONS.last= game.i18n.localize("PARTICULE-FX.Chat-Command.Options.last");
		COMMON_OPTIONS.prefillMotionTemplate = game.i18n.format("PARTICULE-FX.Chat-Command.Options.prefillMotionTemplate" ,{prefillMotionTemplateValues: Object.keys(ParticlesEmitter.prefillMotionTemplate).join(', ')});
	    COMMON_OPTIONS.prefillColorTemplate = game.i18n.format("PARTICULE-FX.Chat-Command.Options.prefillColorTemplate" ,{prefillColorTemplateValues: Object.keys(ParticlesEmitter.prefillColorTemplate).join(', ')});
	    COMMON_OPTIONS.multiple= game.i18n.localize("PARTICULE-FX.Chat-Command.Options.multiple");
	})

	// Chat message hooks
	Hooks.on("chatMessage", function (chatlog, message, chatData) {
		if (!message.startsWith('/pfx')) return;

		let messageArgs = message.split(' ')

		// No function
		if (messageArgs.length < 2) {
			return
		}

		const functionName = messageArgs[1];
		const handler = EXISTING_CHAT_COMMAND[functionName];

		if(handler){
			messageArgs.splice(0, 2);

			if (hasOption(messageArgs, ['--help', '-h'])) {
				const helpKey = `PARTICULE-FX.Chat-Command.${functionName}.help`;
				const helpMessage = game.i18n.format(helpKey, COMMON_OPTIONS);
				
				ui.chat.processMessage(`/w ${game.user.name} ${helpMessage}`);
				return false;
			}

			const returnMessage = handler(messageArgs);
			if (returnMessage) {
				ui.chat.processMessage("/w gm " + returnMessage);
			}
		} else {
			 ui.notifications.error(game.i18n.localize("PARTICULE-FX.Chat-Command.Unrecognized"));
		}

		// To not display the empty message of the commands
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

function handleEmission (args, emmissionMethod, input = {}){
	const multipleEmission = hasOption(args, ['--multiple', '-m']);
	let computedInput;

	if(multipleEmission){
		const subparticleInputs = [];
		canvas.activeLayer.controlled.forEach((source) =>{
			game.user.targets.ids.forEach((targetId) => {
				subparticleInputs.push([{
					source: source.id,
					target: targetId,
					type: input.type
				}, ...args])
			})
		})

		computedInput = buildInputForParentEmitter(subparticleInputs);
		
	} else {
		computedInput = input;

		if(input.target === undefined){
			computedInput.target= Utils.getTargetId();
		}
		if(input.source === undefined){
			computedInput.source = Utils.getSelectedSource()?.id;
		}
		
	}

	if (computedInput.source) {
		const idEmitter = emmissionMethod(computedInput, ...args);
		writeMessageForEmissionById(idEmitter);
	}
}

function handleMissile(args, input = {}){
	input.type = 'Missile';

	if( hasOption(args, ['--curve', '-c'])){
		input.pathType = "CURVE"
	}

	if( ! hasOption(args, ['--multiple', '-m'])){
		input.target= game.user.targets.ids.length > 0 ? game.user.targets.ids : undefined
	}

	handleEmission(args, emitController.missile, input)
}

function handleStopById(args){
	const isImmediate = hasOption(args, ['--instant', '-i']);
	const stoppedEmitters = emitController.stop(getEmittersId(args), isImmediate);
	return game.i18n.localize("PARTICULE-FX.Chat-Command.stopById.return") + JSON.stringify(stoppedEmitters);
}

function handleStopWorkflow(args){
	const isImmediate = hasOption(args, ['--instant', '-i']);
	const all = hasOption(args, ['--all', '-a']);
	const stoppedEmitters = emitController.stopWorkflow(getEmittersId(args), isImmediate, all);
	return game.i18n.localize("PARTICULE-FX.Chat-Command.stopById.return") + JSON.stringify(stoppedEmitters);
}

function handleStopAll(args){
	const isImmediate = hasOption(args, ['--instant', '-i']);
	const stoppedEmitters = emitController.stopAll(isImmediate);
	return game.i18n.localize("PARTICULE-FX.Chat-Command.stopAll.return") + JSON.stringify(stoppedEmitters);	  
}

function hasOption(givenOptions, matchOptions){
	const intersections = givenOptions.filter(x => matchOptions.includes(x));
	return intersections.length > 0;
}

function getEmittersId(args){
	const numbers = args.filter((item) => !Number.isNaN(item));

	if(numbers.length > 0){
		return numbers[0]
	} else if (args.includes("first") || args.includes("f")){
		return "f"
	}

	return "l"
}