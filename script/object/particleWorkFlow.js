import { SprayingParticleTemplate, GravitingParticleTemplate, MissileParticleTemplate } from "./particleTemplate.js"
import { Utils } from "../utils/utils.js"
import * as particlesEmitterService from "../service/particlesEmitter.service.js"

/**
 * Mapping of chat command names to particle template type strings.
 * @type {Record<string, string>}
 */
const ENUM_CHAT_COMMAND_TEMPLATE_TYPE = {
	'spray': SprayingParticleTemplate.getType(),
    'missile': MissileParticleTemplate.getType(),
    'gravitate': GravitingParticleTemplate.getType()
}

/**
 * Manager class responsible for managing lifecycle and execution of chained particle workflows.
 */
export class ParticleWorkFlowManager {

	/** Constants defining workflow trigger events. */
	static NEXT_WORKFLOW_TYPES = {
	    AT_EMISSION_START: "atEmissionStart",
	    AT_PARTICLE_START: "atParticleStart",
	    AT_EMISSION_END: "atEmissionEnd",
	    AT_PARTICLE_END: "atParticleEnd"
	}

	/** Shortened workflow type codes used in emitter ID prefixes. */
	static _minimizeType = {
	    [ParticleWorkFlowManager.NEXT_WORKFLOW_TYPES.AT_EMISSION_START]: "ES",
	    [ParticleWorkFlowManager.NEXT_WORKFLOW_TYPES.AT_PARTICLE_START]: "PS",
	    [ParticleWorkFlowManager.NEXT_WORKFLOW_TYPES.AT_EMISSION_END]: "EE",
	    [ParticleWorkFlowManager.NEXT_WORKFLOW_TYPES.AT_PARTICLE_END]: "PE"
	}

	/** Global registry list of active workflow steps. */
	static WORKFLOWS_LIST = []

	/**
	 * Triggers matching workflow steps attached to a particle template.
	 * @param {string} workflowType - Event type triggering the workflow.
	 * @param {string} sourceEmitterId - Identifier of parent emitter.
	 * @param {ParticleTemplate} particleTemplate - Source particle template instance.
	 * @param {Particle} [particle] - Specific particle instance triggering event.
	 * @returns {void}
	 */
	static triggerWorkflows (workflowType, sourceEmitterId, particleTemplate, particle) {
		const workflowsToTrigger = particleTemplate.next.filter(( workflow ) => workflow.type === workflowType )

         workflowsToTrigger.forEach(( workflow, index ) => ParticleWorkFlowManager.generateWorkflow ( workflow.type , workflow.delay, workflow.particleInputs, sourceEmitterId, particleTemplate, particle, index ))
	}

	/**
	 * Instantiates and computes a single workflow step.
	 * @param {string} workflowType - Event type.
	 * @param {number} delay - Delay in seconds before execution.
	 * @param {Array<Object>} particleInputs - Array of input definitions for child emissions.
	 * @param {string} sourceEmitterId - Source emitter ID.
	 * @param {ParticleTemplate} particleTemplate - Template instance.
	 * @param {Particle} particle - Triggering particle.
	 * @param {number} workflowIndex - Index of workflow in template list.
	 * @returns {void}
	 */
	static generateWorkflow (workflowType, delay, particleInputs, sourceEmitterId, particleTemplate, particle, workflowIndex) {
		if(!particleInputs) return

		const particleWorkFlowStep = new ParticleWorkFlowStep (workflowType, delay, particleInputs, sourceEmitterId, particleTemplate, particle, workflowIndex);
		ParticleWorkFlowManager.WORKFLOWS_LIST.push(particleWorkFlowStep)
		particleWorkFlowStep.computeStep()
	}

	/**
	 * Retrieves active workflow steps belonging to a specific emitter ID.
	 * @param {string} emitterId - Target emitter ID prefix.
	 * @returns {Array<ParticleWorkFlowStep>} Matching workflow step instances.
	 */
	static getWorkflowsByEmitterId ( emitterId ) {
		return ParticleWorkFlowManager.WORKFLOWS_LIST.filter(( workflow ) => workflow.id.split(":")[0] === emitterId)
	}

	/**
	 * Stops and destroys all active workflow steps.
	 * @param {boolean} immediate - Whether to terminate immediately without fade.
	 * @returns {void}
	 */
	static stopAll( immediate ) {
		let deletedIds = []
		while (ParticleWorkFlowManager.WORKFLOWS_LIST.length > 0) {
            let workflow = ParticleWorkFlowManager.WORKFLOWS_LIST[0]
            deletedIds.push(workflow.id)

  			workflow.destroy(immediate)
        }
	}
}

/**
 * Individual workflow execution step managing delayed execution and child particle emissions.
 */
class ParticleWorkFlowStep {

	/**
	 * Constructs a ParticleWorkFlowStep instance.
	 * @param {string} workflowType - Event type.
	 * @param {number} delay - Delay in seconds.
	 * @param {Array<Object>} particleInputs - Array of particle emission input configs.
	 * @param {string} sourceEmitterId - Source emitter ID.
	 * @param {ParticleTemplate} particleTemplate - Source particle template.
	 * @param {Particle} particle - Associated particle instance.
	 * @param {number} workflowIndex - Index in list.
	 */
	constructor (workflowType, delay, particleInputs, sourceEmitterId, particleTemplate, particle, workflowIndex) {
		this.id = `${sourceEmitterId}:${foundry.utils.randomID()}`
		this.prefixEmitterId = this.generatePrefixId(sourceEmitterId, workflowType, workflowIndex, particle)
		this.workflowType = workflowType;
		this.delay = delay ? delay * 1000 : 0;
		this.particleInputs = JSON.parse(JSON.stringify(particleInputs));//Deep copy to not modify source and target for all
		this.freezeOnPause = particleTemplate.freezeOnPause;
		this.particle = particle;
		this.lastUpdate = Date.now();
		this.delayCallback = this.handleDelay.bind(this)
		this.source = this.particle ? this.getPosition() : particleTemplate.currentSourcePosition;
		this.handleEmitters = [];
	}

	//Format : {orginalEmitterId}-step{nestedNextNumber}-{minimizeWorkflowType}{worflowTriggerIndex}(-particleId)-{particleInputIndex}
	/**
	 * Generates unique prefix ID for child emitters produced by this workflow step.
	 * @param {string} sourceEmitterId - Source emitter ID.
	 * @param {string} workflowType - Event type.
	 * @param {number} workflowIndex - Index of workflow.
	 * @param {Particle} particle - Associated particle.
	 * @returns {string} Generated prefix string.
	 */
	generatePrefixId(sourceEmitterId, workflowType, workflowIndex, particle) {

		const sourceEmitterIdPart = sourceEmitterId.split('-') //incrise step
		const stepNumber = sourceEmitterIdPart.length > 1 && sourceEmitterIdPart[1].startsWith('step') ? Number(sourceEmitterIdPart[1].replace('step', '')) : 0;

		let prefix = `${sourceEmitterIdPart[0]}-step${stepNumber+1}-${ParticleWorkFlowManager._minimizeType[workflowType]}${workflowIndex}`

		if(particle?.id){
			prefix += `-${particle.id}`
		}

		return prefix
	}

	/**
	 * Gets current 3D position vector of triggering particle or source.
	 * @returns {Vector3} Position vector or coordinates.
	 */
	getPosition () {
		return this.particle?.getPosition() || this.source;
	}

	/**
	 * Starts delay timer or directly executes child emissions if delay is zero.
	 * @returns {void}
	 */
    computeStep () {
		// Listen for animate update

		if(this.delay > 0) {
	    	canvas.app.ticker.add(this.delayCallback)
		} else {
			this.executeEmissions();
		}
    }

    /**
     * Ticker callback decrementing delay time per frame.
     * @returns {void}
     */
    handleDelay () {
    	let newDate = Date.now();
        const dt = newDate - this.lastUpdate
        this.lastUpdate = newDate

        if(this.freezeOnPause && game.paused){
            return
        }

        this.delay -= dt

        if(this.delay <= 0){
        	canvas.app.ticker.remove(this.delayCallback);
        	this.executeEmissions();
        }
    }

    /**
     * Spawns child emitters defined in particleInputs.
     * @returns {void}
     */
    executeEmissions(){
    	this.particleInputs.forEach( (particleInput, index ) => {
    		const { args, type } = this.buildEmissionArgsAndType(particleInput)
    		const emitterId = { emitterId: `${this.prefixEmitterId }-${index}`, parentWorkflowId: this.id }
    		let emitter 
    
    		if (type === SprayingParticleTemplate.getType()) {
	            emitter= particlesEmitterService.sprayParticles(...args, emitterId)
	        } else if (type === GravitingParticleTemplate.getType()) {
	            emitter = particlesEmitterService.gravitateParticles(...args, emitterId)
	        } else if (type === MissileParticleTemplate.getType()){
	        	emitter = particlesEmitterService.missileParticles(...args, emitterId)
	        }

	        if(emitter){
	        	this.handleEmitters.push(emitter)
	        	emitter.destroyHooks.push(this.emitterEnded.bind(this))
	        }
    	})
    }

    /**
     * Parses arguments and determines template type for a child emission definition.
     * @param {string|Object|Array} particleInput - String, array, or object input config.
     * @returns {{type: string, args: Array<Object>}} Object containing emission type and arguments array.
     */
    buildEmissionArgsAndType (particleInput) {
    	let result

    	if (typeof particleInput === "string"){
    		//Handle as a chat command
    		const commandArgs = particleInput.split(' ');
    		result = {
    			type: ENUM_CHAT_COMMAND_TEMPLATE_TYPE[commandArgs[0]], //Get type by command
    			args: [...commandArgs.toSpliced(0,1)]
    		}

    	} else if (Array.isArray(particleInput)){
    		let type = ENUM_CHAT_COMMAND_TEMPLATE_TYPE[particleInput[0]];
    		if( type ) {
    			particleInput.splice(0,1);
    		} else {
    			type = particleInput.find((item) => item.type)?.type;
    		}
    		result = {
    			type,
    			args: particleInput
    		}

    	} else if (particleInput.type){
    		result = {
    			type: particleInput.type,
    			args: [particleInput]
    		}

    	} else {
    		result = {
    			type: SprayingParticleTemplate.getType(),
    			args: []
    		}
    	}

    	const inputObject = result.args.find((item) => item instanceof Object)

    	if( inputObject ) {
    		
    		if(! inputObject.source){
    			inputObject.source = this.getPosition();
    		}

    		if(! inputObject.target){
    			inputObject.target = Utils.getTargetId();
    		}
    	} else {
			result.args.push({ source: this.getPosition(), target: Utils.getTargetId() })
    	}

    	return result;
    }

    /**
     * Callback triggered when a child emitter finishes emission.
     * @param {string|number} emitterID - Identifier of completed child emitter.
     * @returns {void}
     */
    emitterEnded(emitterID){
    	const emitterIndex = this.handleEmitters.findIndex((item) => item.id === emitterID);

    	if( emitterIndex >= 0 ){
        	this.handleEmitters.splice(emitterIndex, 1);
        }

        if(this.handleEmitters.length === 0){
        	this.destroy (true)
        }
    }

    /**
     * Destroys this workflow step and cleans up child emitters.
     * @param {boolean} withEmmiter - If true, destroys child emitters immediately.
     * @returns {void}
     */
    destroy (withEmmiter) {
    	if(this.delay !== undefined){
        	canvas.app.ticker.remove(this.delayCallback);
        }

        if(withEmmiter){
        	for (let i = this.handleEmitters.length - 1; i >= 0; i--) {
        		//We look througt the list backward to avoid error from deleting an item that shift the whole array
        		this.handleEmitters[i].destroy();
        	}
        } else {
        	for (let i = this.handleEmitters.length - 1; i >= 0; i--) {
        		const emitter = this.handleEmitters[i];
        		emitter.remainingTime = -1;
	    		emitter.disableWorkflow();
	    		ParticleWorkFlowManager.getWorkflowsByEmitterId(emitter.id)
	    			.forEach((workflow) => workflow.destroy(false));
        	}
		}

		const workflowIndex = ParticleWorkFlowManager.WORKFLOWS_LIST.findIndex((workflow) => workflow.id === this.id);
		if( workflowIndex >= 0 ){
        	ParticleWorkFlowManager.WORKFLOWS_LIST.splice(workflowIndex, 1);
    	}
    }
}