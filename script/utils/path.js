import { Vector3 } from './utils.js'

export class Path {
	constructor(stepArray){
		this.pathStep = stepArray.map((step) => Vector3.build(step));

		const magnitudeArray = this.pathStep.map((step) => step.magnitude());
		
		
		this.totalLenght = magnitudeArray.reduce((acc, magnitude) => acc + magnitude, 0);
		this.stepsProportion = magnitudeArray.map((magnitude) => magnitude / this.totalLenght);
		this.currentStep = 0;
		this.pathProportion = 0;
	}

	getPointAtProportion(pathProportion) {
		const currentStepProportion = this.computeStepProportion(pathProportion);
		if(currentStepProportion<=0 || this.currentStep === this.pathStep.length - 1){
			return this.pathStep[this.currentStep];
		}

		if (currentStepProportion > 1){
			return this.pathStep[this.currentStep + 1];
		}

		return this.pathStep[this.currentStep].multiply((1 - currentStepProportion))
			.add(this.pathStep[this.currentStep + 1].multiply(currentStepProportion));
	}

	computeStepProportion(pathProportion){
		this.pathProportion = pathProportion;

		let remainingProportion = pathProportion;
		for(let i = 0; i < this.stepsProportion.length; i++){
			if(this.stepsProportion[i] < remainingProportion){
				remainingProportion -= this.stepsProportion[i];
			} else {
				this.currentStep = i;
				return remainingProportion / this.stepsProportion[i];
			}
		}

		this.currentStep = this.stepsProportion.length - 1;
		return 0;
	}
}