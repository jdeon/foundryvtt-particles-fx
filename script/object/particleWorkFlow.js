import { SprayingParticleTemplate, GravitingParticleTemplate, MissileParticleTemplate } from "./particleTemplate.js"
import { Utils } from "../utils/utils.js"
import * as particlesEmitterService from "../service/particlesEmitter.service.js"

const ENUM_CHAT_COMMAND_TEMPLATE_TYPE = {
	'spray': SprayingParticleTemplate.getType(),
    'missile': MissileParticleTemplate.getType(),
    'gravitate': GravitingParticleTemplate.getType()
}

export class ParticleWorkflow {

	static  NEXT_WORKFLOW_TYPES = {
	    AT_EMISSION_START: "atEmissionStart",
	    AT_PARTICLE_START: "atParticleStart",
	    AT_EMISSION_END: "atEmissionEnd",
	    AT_PARTICLE_END: "atParticleEnd"
	}

	static generateWorkflow (workflowType, delay, particleInputs, freezeOnPause) {
		if(!particleInputs) return


		const particleWorkflow = new ParticleWorkflow (workflowType, delay, particleInputs);
		particleWorkflow.handleWorkflow()
	}

	constructor (workflowType, delay, particleInputs, freezeOnPause) {
		this.workflowType = workflowType;
		this.delay = delay;
		this.particleInputs = particleInputs;
		this.freezeOnPause = freezeOnPause;
		this.lastUpdate = Date.now();
		this.delayCallback = this.handleDelay.bind(this)
	}

    handleWorkflow () {
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
    	this.particleInputs.forEach( (particleInput ) => {
    		let { args, type } = this.buildEmissionArgsAndType(particleInput)
    		let emitterId = { emitterId: particlesEmitterService.nextEmitterId() } //TODO does it need to be done only by GM ? Emitter id should be generated at start ?
    
    		if (type === SprayingParticleTemplate.getType()) {
	            particlesEmitterService.sprayParticles(...args, emitterId)
	        } else if (type === GravitingParticleTemplate.getType()) {
	            particlesEmitterService.gravitateParticles(...args, emitterId)
	        } else if (type === MissileParticleTemplate.getType()){
	        	particlesEmitterService.missileParticles(...args, emitterId)
	        }
    	})
    }

    buildEmissionArgsAndType (particleInput) {
    	if (typeof particleInput === "string"){
    		//Handle as a chat command
    		const commandArgs = particleInput.split(' ');
    		return {
    			type: ENUM_CHAT_COMMAND_TEMPLATE_TYPE[commandArgs[0]], //Get type by command
    			args: [...commandArgs.toSpliced(0,1), { source:  Utils.getSelectedSource()?.id, target: Utils.getTargetId() }]
    		}

    	} else if (Array.isArray(particleInput)){
    		let type = ENUM_CHAT_COMMAND_TEMPLATE_TYPE[particleInput[0]];
    		if( type ) {
    			particleInput.splice(0,1);
    		} else {
    			type = particleInput.find((item) => item.type)?.type;
    		}
    		return {
    			type,
    			args: particleInput
    		}

    	} else if (particleInput.type){
    		return {
    			type: particleInput.type,
    			args: [particleInput]
    		}

    	}

    	return {
    		type: SprayingParticleTemplate.getType(),
    		args: []
    	}
    }
	

}