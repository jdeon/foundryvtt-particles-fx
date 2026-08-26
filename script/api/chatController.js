import { buildInputForParentEmitter, writeMessageForEmissionById } from "../service/particlesEmitter.service.js"
import { s_MODULE_ID, Utils, Vector3, SPRITE_TEXTURE_MAPPING } from "../utils/utils.js"
import emitController from "./emitController.js"
import ParticlesEmitter from "../object/particlesEmitter.js"

/**
 * Mapping of '/pfx' chat commands associated with their handler functions.
 * @type {Record<string, Function>}
 */
const EXISTING_CHAT_COMMAND = {
	'stopAll': (args) => handleStopAll(args),
	'stopById': (args) => handleStopById(args),
	'stopWorkflow': (args) => handleStopWorkflow(args),
	'spray' : (args) => handleEmission(args, emitController.spray, { type : 'Spraying'}),
	'missile': (args) => handleMissile(args),
	'gravitate': (args) => handleEmission(args, emitController.gravit, { type : 'Graviting'}),
	'help': () => game.i18n.localize("PARTICULE-FX.Chat-Command.help.return") + Object.keys(EXISTING_CHAT_COMMAND).join(', ')
}

/**
 * Dictionary containing localized option descriptions for chat command help.
 * @type {Record<string, string>}
 */
const COMMON_OPTIONS = {};

/**
 * Initializes the chat controller by registering message patterns and hook listeners.
 * @returns {void}
 */
export function initChatController() {

	foundry.applications.sidebar.tabs.ChatLog.MESSAGE_PATTERNS["pfx"] = new RegExp("^(/pfx )([^]*)", "i");

	// pfx is added after invalid so we need to put back invalid at the end
	let invalid = foundry.applications.sidebar.tabs.ChatLog.MESSAGE_PATTERNS["invalid"]
	delete foundry.applications.sidebar.tabs.ChatLog.MESSAGE_PATTERNS["invalid"]
	foundry.applications.sidebar.tabs.ChatLog.MESSAGE_PATTERNS["invalid"] = invalid

	// Populates common option help messages when Foundry VTT is ready.
	Hooks.on("ready", function () {
		COMMON_OPTIONS.help= game.i18n.localize("PARTICULE-FX.Chat-Command.Options.help");
		COMMON_OPTIONS.instant= game.i18n.localize("PARTICULE-FX.Chat-Command.Options.instant");
		COMMON_OPTIONS.first= game.i18n.localize("PARTICULE-FX.Chat-Command.Options.first");
		COMMON_OPTIONS.last= game.i18n.localize("PARTICULE-FX.Chat-Command.Options.last");
		COMMON_OPTIONS.prefillMotionTemplates = game.i18n.format("PARTICULE-FX.Chat-Command.Options.prefillMotionTemplates" ,{prefillMotionTemplateValues: Object.keys(ParticlesEmitter.prefillMotionTemplate).join(', ')});
	    COMMON_OPTIONS.prefillColorTemplates = game.i18n.format("PARTICULE-FX.Chat-Command.Options.prefillColorTemplates" ,{prefillColorTemplateValues: Object.keys(ParticlesEmitter.prefillColorTemplate).join(', ')});
	    COMMON_OPTIONS.particleShapes = game.i18n.format("PARTICULE-FX.Chat-Command.Options.particleShapes" ,{particleShapeValues: Object.keys(SPRITE_TEXTURE_MAPPING).join(', ')});
	    COMMON_OPTIONS.multiple= game.i18n.localize("PARTICULE-FX.Chat-Command.Options.multiple");
	})

	/**
	 * Hook listener to intercept chat messages starting with /pfx.
	 * @param {ChatLog} chatlog - The ChatLog application instance.
	 * @param {string} message - The raw chat message text.
	 * @param {{ speaker: ChatSpeakerData; user: string }} chatData - Associated chat message data.
	 * @returns {boolean|undefined} Returns false to prevent rendering the command text in chat.
	 */
	Hooks.on("chatMessage", function (chatlog, message, chatData) {
		const tagLessMessage = message.replace(/^<p>|<\/p>$/g, "")
		if (!tagLessMessage.startsWith('/pfx')) return;

		let messageArgs = tagLessMessage.split(' ')

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

	/**
	 * Hook listener to attach click handlers to emitter deletion buttons in rendered chat messages.
	 * @param {Chatlog} chatlog - The ChatLog instance.
	 * @param {JQuery} html - The rendered HTML elements of the chat message.
	 * @param {Object} data - Data associated with the rendered message.
	 */
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

/**
 * Handles particle emission requested via chat command arguments.
 * @param {Array<string>} args - Command line arguments passed in chat.
 * @param {Function} emmissionMethod - The emission method to invoke.
 * @param {TODO type} [input={}] - Input options for the emission.
 * @returns {void}
 */
function handleEmission (args, emmissionMethod, input = {}){
	const multipleEmission = hasOption(args, ['--multiple', '-m']);
	let computedInput, computedArgs;

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
		computedArgs = [];
		
	} else {
		computedInput = input;
		computedArgs = args

		if(input.target === undefined){
			computedInput.target= Utils.getTargetId();
		}
		if(input.source === undefined){
			computedInput.source = Utils.getSelectedSource()?.id;
		}
		
	}

	if (computedInput.source) {
		const idEmitter = emmissionMethod(computedInput, ...computedArgs);
		writeMessageForEmissionById(idEmitter);
	}
}

/**
 * Handles missile particle emission requested via chat arguments.
 * @param {Array<string>} args - Command arguments.
 * @param {TODO type} [input={}] - Input options object.
 * @returns {void}
 */
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

/**
 * Stops an emitter by ID as commanded via chat.
 * @param {Array<string>} args - Chat command arguments containing emitter ID.
 * @returns {string} Formatted localized return message.
 */
function handleStopById(args){
	const isImmediate = hasOption(args, ['--instant', '-i']);
	const stoppedEmitters = emitController.stop(getEmittersId(args), isImmediate);
	return game.i18n.localize("PARTICULE-FX.Chat-Command.stopById.return") + JSON.stringify(stoppedEmitters);
}

/**
 * Stops an emitter workflow as commanded via chat.
 * @param {Array<string>} args - Chat command arguments.
 * @returns {string} Formatted localized return message.
 */
function handleStopWorkflow(args){
	const isImmediate = hasOption(args, ['--instant', '-i']);
	const all = hasOption(args, ['--all', '-a']);
	const stoppedEmitters = emitController.stopWorkflow(getEmittersId(args), isImmediate, all);
	return game.i18n.localize("PARTICULE-FX.Chat-Command.stopById.return") + JSON.stringify(stoppedEmitters);
}

/**
 * Stops all particle emissions as commanded via chat.
 * @param {Array<string>} args - Chat command arguments.
 * @returns {string} Formatted localized return message.
 */
function handleStopAll(args){
	const isImmediate = hasOption(args, ['--instant', '-i']);
	const stoppedEmitters = emitController.stopAll(isImmediate);
	return game.i18n.localize("PARTICULE-FX.Chat-Command.stopAll.return") + JSON.stringify(stoppedEmitters);	  
}

/**
 * Checks whether at least one matching option exists in the given command options.
 * @param {Array<string>} givenOptions - Array of options specified by user.
 * @param {Array<string>} matchOptions - Array of flag options to look for.
 * @returns {boolean} True if a matching option exists.
 */
function hasOption(givenOptions, matchOptions){
	const intersections = givenOptions.filter(x => matchOptions.includes(x));
	return intersections.length > 0;
}

/**
 * Extracts or infers an emitter ID from chat arguments.
 * @param {Array<string>} args - Chat command arguments.
 * @returns {number|string} Emitter ID or indicator string ("f" or "l").
 */
function getEmittersId(args){
	const numbers = args.filter((item) => ! isNaN(item));

	if(numbers.length > 0){
		return numbers[0]
	} else if (args.includes("first") || args.includes("f")){
		return "f"
	}

	return "l"
}