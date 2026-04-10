import { SprayingParticleTemplate, GravitingParticleTemplate, MissileParticleTemplate } from "./particleTemplate.js"
import { Utils } from "../utils/utils.js"
import * as particlesEmitterService from "../service/particlesEmitter.service.js"

const ENUM_CHAT_COMMAND_TEMPLATE_TYPE = {
	'spray': SprayingParticleTemplate.getType(),
    'missile': MissileParticleTemplate.getType(),
    'gravitate': GravitingParticleTemplate.getType()
}

export class ParticleWorkflow {

	static NEXT_WORKFLOW_TYPES = {
	    AT_EMISSION_START: "atEmissionStart",
	    AT_PARTICLE_START: "atParticleStart",
	    AT_EMISSION_END: "atEmissionEnd",
	    AT_PARTICLE_END: "atParticleEnd"
	}

	static _minimizeType = {
	    [ParticleWorkflow.NEXT_WORKFLOW_TYPES.AT_EMISSION_START]: "ES",
	    [ParticleWorkflow.NEXT_WORKFLOW_TYPES.AT_PARTICLE_START]: "PS",
	    [ParticleWorkflow.NEXT_WORKFLOW_TYPES.AT_EMISSION_END]: "EE",
	    [ParticleWorkflow.NEXT_WORKFLOW_TYPES.AT_PARTICLE_END]: "PE"
	}

	static WORKFLOWS_LIST = []

	static triggerWorkflows (workflowType, sourceEmitterId, particleTemplate, particle) {
		const workflowsToTrigger = particleTemplate.next.filter(( workflow ) => workflow.type === workflowType )

         workflowsToTrigger.forEach(( workflow, index ) => ParticleWorkflow.generateWorkflow ( workflow.type , workflow.delay, workflow.particleInputs, sourceEmitterId, particleTemplate, particle, index ))
	}

	static generateWorkflow (workflowType, delay, particleInputs, sourceEmitterId, particleTemplate, particle, workflowIndex) {
		if(!particleInputs) return

		const particleWorkflow = new ParticleWorkflowStep (workflowType, delay, particleInputs, sourceEmitterId, particleTemplate, particle, workflowIndex);
		ParticleWorkflow.WORKFLOWS_LIST.push(particleWorkflow)
		particleWorkflow.computeStep()
	}

	static getWorkflowsByEmitterId ( emitterId ) {
		return ParticleWorkflow.WORKFLOWS_LIST.filter(( workflow ) => workflow.id.split(":")[0] === emitterId)
	}

	static stopAll( immediate ) {
		let deletedIds = []
		while (ParticleWorkflow.WORKFLOWS_LIST.length > 0) {
            let workflow = ParticleWorkflow.WORKFLOWS_LIST[0]
            deletedIds.push(workflow.id)

  			workflow.destroy(immediate)
        }
	}
}

class ParticleWorkflowStep {

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

	//Format : {orginalEmitterId}-Step{nestedNextNumber}-{minimizeWorkflowType}{worflowTriggerIndex}(-particleId)-{particleInputIndex}
	generatePrefixId(sourceEmitterId, workflowType, workflowIndex, particle) {

		const sourceEmitterIdPart = sourceEmitterId.split('-') //incrise step
		const stepNumber = sourceEmitterIdPart.length > 1 && sourceEmitterIdPart[1].startsWith('step') ? Number(sourceEmitterIdPart[1].replace('step', '')) : 0;

		let prefix = `${sourceEmitterId[0]}-step${stepNumber+1}-${ParticleWorkflow._minimizeType[workflowType]}${workflowIndex}`

		if(particle?.id){
			prefix += `-${particle.id}`
		}

		return prefix
	}

	getPosition () {
		return this.particle?.getPosition() || this.source;
	}

    computeStep () {
		// Listen for animate update

		if(this.delay > 0) {
	    	canvas.app.ticker.add(this.delayCallback)
		} else {
			this.executeEmissions();
		}
    }

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

    executeEmissions(){
    	this.particleInputs.forEach( (particleInput, index ) => {
    		const { args, type } = this.buildEmissionArgsAndType(particleInput)
    		const emitterId = { emitterId: `${this.prefixEmitterId }-${index}` }
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
	        	emitter.destroyHooks.push()
	        }
    	})
    }

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

    emitterEnded(emitterID){
    	const emitterIndex = this.handleEmitters.findIndex((item) => item.id === emitterID);
        this.handleEmitters.splice(emitterIndex, 1);

        if(this.handleEmitters.length === 0){
        	destroy (true)
        }
    }

    destroy (withEmmiter) {
    	if(this.delay !== undefined){
        	canvas.app.ticker.remove(this.delayCallback);
        }

        if(withEmmiter){
        	this.handleEmitters.forEach(( emitter ) => emitter.destroy())
        } else {
	    	this.handleEmitters.forEach(( emitter ) => {
	    		emitter.remainingTime = -1
	    		emitter.disableWorkflow()
	    		ParticleWorkflow.getWorkflowsByEmitterId(emitter.id)
	    			.forEach((workflow) => workflow.destroy(immediate))
	    	})
		}

		const emitterIndex = ParticleWorkflow.WORKFLOWS_LIST.findIndex((workflow) => workflow.id === this.id);
        ParticleWorkflow.WORKFLOWS_LIST.splice(emitterIndex, 1);
    }
}