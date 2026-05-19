import { Vector3 } from './utils.js'

export class Path {
	constructor(stepPosition){
		this.stepPosition = stepPosition.map((step) => Vector3.build(step));

		this.stepPath = [];
		for(let i = 0; i < this.stepPosition.length - 1; i++ ){
			this.stepPath.push(this.stepPosition[i + 1].minus(this.stepPosition[i]))
		}

		const magnitudeArray = this.stepPath.map((step) => step.magnitude());
		
		
		this.totalLenght = magnitudeArray.reduce((acc, magnitude) => acc + magnitude, 0);
		this.stepsProportion = magnitudeArray.map((magnitude) => magnitude / this.totalLenght);
		this.currentStep = 0;
		this.pathProportion = 0;
	}

	getPointAtProportion(pathProportion) {
		const currentStepProportion = this.computeStepProportion(pathProportion);
		if(currentStepProportion<=0){
			return this.stepPosition[this.currentStep];
		}

		if (currentStepProportion > 1){
			return this.stepPosition[this.currentStep + 1];
		}

		return this.stepPosition[this.currentStep].multiply((1 - currentStepProportion))
			.add(this.stepPosition[this.currentStep + 1].multiply(currentStepProportion));
	}

	computeStepProportion(pathProportion) {
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
		return 1;
	}
}