import { Vector3, sameStartKey } from './utils.js'
import { Matrix2D } from './matrix.js'

export class Path {
	static build(pathType, stepPositions, angleStart, angleEnd){
		if(stepPositions === null || stepPositions.length <= 1){
			return
		}
		
		if(pathType === CurvePath.PATH_TYPE && stepPositions.length > 2){
			return new CurvePath(stepPositions, angleStart.getValue(), angleEnd.getValue() === sameStartKey ? angleStart.getValue() : angleEnd.getValue())
		}

		return new LinearPath(stepPositions);
	}
		
	constructor(stepPositions){
		this.stepPositions = stepPositions.map((step) => Vector3.build(step));

		this.stepPath = [];
		for(let i = 0; i < this.stepPositions.length - 1; i++ ){
			this.stepPath.push(this.stepPositions[i + 1].minus(this.stepPositions[i]))
		}

		const magnitudeArray = this.stepPath.map((step) => step.magnitude());
		
		this.totalLenght = magnitudeArray.reduce((acc, magnitude) => acc + magnitude, 0);
		this.stepsProportion = magnitudeArray.map((magnitude) => magnitude / this.totalLenght);
		this.currentStep = 0;
		this.pathProportion = 0;
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
		return 1;
	}

	/*TODO keep this ?
	private void appliquerRotation (float t, Transform target, int etapeEnCours)
	{
		if (etapeEnCours == 0) {
			target.rotation = Quaternion.Slerp (target.rotation, this.listEtapeTransform [etapeEnCours].rotation, t / this.listTempsPourProchaineEtape [etapeEnCours]);
		} else if (this.modeDeBouclage == "Boucle" && etapeEnCours == this.listEtape.Count-1) {
			target.rotation = Quaternion.Slerp (this.listEtapeTransform [etapeEnCours].rotation, this.listEtapeTransform [0].rotation, t/this.listTempsPourProchaineEtape [0]);
		} else if ( etapeEnCours  < this.listEtapeTransform .Count && this.listTempsPourProchaineEtape [etapeEnCours] != 0){
			target.rotation = Quaternion.Slerp (this.listEtapeTransform [etapeEnCours - 1].rotation, this.listEtapeTransform [etapeEnCours].rotation, t/this.listTempsPourProchaineEtape [etapeEnCours]);
		}
	}
	*/
}

export class LinearPath extends Path {
	static PATH_TYPE = "LINEAR";

	constructor(stepArray){
		super(stepArray);
	}

 	getPointAtProportion(pathProportion) {
 		const currentStepProportion = this.computeStepProportion(pathProportion);
		if(currentStepProportion<=0){
			return this.stepPositions[this.currentStep];
 		}
 
 		if (currentStepProportion > 1){
			return this.stepPositions[this.currentStep + 1];
		}

		return this.stepPositions[this.currentStep].multiply((1 - currentStepProportion))
			.add(this.stepPositions[this.currentStep + 1].multiply(currentStepProportion));
	}

	/**
	* Direction in degree at current step
	*/
	getDirection() {
		const vectorDirection = this.stepPath[this.currentStep];

		return Math.atan2(vectorDirection.y, vectorDirection.x) * 180 / Math.PI;
	}
}

export class CurvePath extends Path {
	static PATH_TYPE = "CURVE";

 	/**
	 * Compute the control point by finding the angle of the first or last point 
	 */
	static _computeMissingControlPoint(knownPoint, firstNeighbor, secondNeighbor){
		const vector01 = new Vector3 ((firstNeighbor.x - knownPoint.x), (firstNeighbor.y - knownPoint.y), (firstNeighbor.z - knownPoint.z));
		const vector21 = new Vector3 ((firstNeighbor.x - secondNeighbor.x), (firstNeighbor.y - secondNeighbor.y), (firstNeighbor.z - secondNeighbor.z));
		const perpendicularVector = vector01.cross(vector21);
		const vectorNormal = perpendicularVector.cross(vector01);
		const unitTangeantVector = vector01.normalized();
		const unitNormalVector = vectorNormal.normalized();

		//O2 = a*Normal+b*Tangent
		//b = (O2.y-a*normal.y)/ Tangent.y
		//O2.x = a*normal.x + b * Tangent.x
		const a = ((secondNeighbor.x - knownPoint.x) * unitTangeantVector.y - (secondNeighbor.y - knownPoint.y) * unitTangeantVector.x) / (unitNormalVector.x * unitTangeantVector.y - unitNormalVector.y * unitTangeantVector.x);
		const b = ((secondNeighbor.y - knownPoint.y)- a * unitNormalVector.y)/unitTangeantVector.y;
		const normalizingVector = new Vector3 (a, b, 0);
		//Angle between normal and control pointe
		const alpha = (Math.PI / 8) - normalizingVector.normalized.x * (Math.PI / 8);

		//Calcul of controlPoint
		return knownPoint + (Math.Cos (alpha) * unitNormalVector + Math.Sin (alpha) * unitTangeantVector) * vector01.magnitude();
	}

	static _generateC2CountinuityMatrix (nbPoint) {
		if(nbPoint <= 2) return

		const result = new Matrix2D (nbPoint *2 - 4, nbPoint *2 - 4);
			
		for (let numLig=0; numLig < nbPoint *2 - 4; numLig++) {
			if (numLig % 2 == 0) {
				result.data [numLig][numLig - 1] = 1;
				result.data [numLig][numLig] = 1;
			} else {
				result.data [numLig][numLig - 3] = -2;
				result.data [numLig][numLig - 2] = 4;
				result.data [numLig][numLig - 1] = -4;
				result.data [numLig][numLig] = 2;
			}
		}
		return result;
	}


	constructor(stepPositions, angleStart, angleEnd){
		super(stepPositions);

		const nbPoint = stepPositions.length;
		const firstControlPoint = this.stepPositions[0].add(this._computeEndsControlPoint(this.stepPath[0],  angleStart));
		const lastControlPoint = this.stepPositions[this.stepPositions.length - 1].minus(this._computeEndsControlPoint(this.stepPath[this.stepPath.length - 1],  angleEnd));


		//TODO handle first and lastcontrol point with 10% of pathLengh with the angleStart and angleEnd
		
		//lastControlPoint = CurvePath._computeMissingControlPoint (stepPositions [nbPoint - 1], stepPositions [nbPoint - 2], stepPositions [nbPoint - 3]); //TODO use endAngle ??
	
		/*
			pointPremierControle = (pointPremierControle + 2 * listEtapeTransform [0].position) / 3;

			//Coefficiant 1/3 dans fonction pour bezier cubique
			pointDernierControle = (pointDernierControle + 2 * listEtapeTransform [nbPointParcours - 1].position) / 3;
		*/

		const stepMatrix = this._mapStepsToC2Matrix(this.stepPositions, firstControlPoint, lastControlPoint)
		
		this.curveSteps = this._mapStepMatrixToStepCurve(stepMatrix, this.stepPositions, firstControlPoint, lastControlPoint)
	}

	_computeEndsControlPoint(pathStep, angle){
		const length = pathStep.magnitude() * 0.1;

		return new Vector3(
				length * Math.cos(angle * Math.PI / 180),
				length * Math.sin(angle * Math.PI / 180),
				pathStep.z * -.1
			)
	}

	_mapStepsToC2Matrix (steps, firstControlPoint, lastControlPoint){
		if(steps.length <= 2) return

		const result = new Matrix2D (steps.length *2 - 4,3);
		
		let stepNumber = 1
		for (let rowIdx=0; rowIdx < result.rowCount; rowIdx++) {

			if (rowIdx%2 == 0){
				result.data [rowIdx][0] = 2*steps[stepNumber].x;
				result.data [rowIdx][1] = 2*steps[stepNumber].y;
				result.data [rowIdx][2] = 2*steps[stepNumber].z;
				stepNumber++;
			} else {
				result.data [rowIdx][0] = 0;
				result.data [rowIdx][1] = 0;
				result.data [rowIdx][2] = 0;
			}
		}

		result.data [1][0] = 2 * firstControlPoint.x;
		result.data [1][1] = 2 * firstControlPoint.y;
		result.data [1][2] = 2 * firstControlPoint.z;

		result.data [result.rowCount - 1][0] = -2 * lastControlPoint.x;
		result.data [result.rowCount - 1][1] = -2 * lastControlPoint.y;
		result.data [result.rowCount - 1][2] = -2 * lastControlPoint.z;

		return result;
	}

	_mapStepMatrixToStepCurve(stepMatrix, stepPositions, firstControlPoint, lastControlPoint){
		const c2Matrix = CurvePath._generateC2CountinuityMatrix (stepPositions.length);
		c2Matrix.invert ();
		const controlPointMatrix = c2Matrix.multiply (stepMatrix);

		const result = [];

		//TODO one besier is missing
		//Creation de la liste des courbe de bezier
		for (let rowIdx=0; rowIdx< controlPointMatrix.rowCount; rowIdx++) {
			let controlPoint1, controlPoint2;
			if (rowIdx == 0 ){
				controlPoint1 = firstControlPoint;
				controlPoint2 = new Vector3 (controlPointMatrix.data [rowIdx][0], controlPointMatrix.data [rowIdx][1], controlPointMatrix.data [rowIdx][2]);
				result.push(new BezierCurve(stepPositions[0], firstControlPoint, lastControlPoint, stepPositions[1] ));
			} else if (rowIdx == controlPointMatrix.rowCount - 1){
				controlPoint1 = new Vector3 (controlPointMatrix.data [rowIdx][0], controlPointMatrix.data [rowIdx][1], controlPointMatrix.data [rowIdx][2]);
				controlPoint2 = lastControlPoint;
				result.push(new BezierCurve(stepPositions[stepPositions.length-2], firstControlPoint, lastControlPoint, stepPositions[stepPositions.length-1] ));
			} else {
				controlPoint1 = new Vector3 (controlPointMatrix.data [rowIdx][0], controlPointMatrix.data [rowIdx][1], controlPointMatrix.data [rowIdx][2]);
				controlPoint2 = new Vector3 (controlPointMatrix.data [rowIdx+1][0], controlPointMatrix.data [rowIdx+1][1], controlPointMatrix.data [rowIdx+1][2]);

				const stepIdx = (rowIdx+1)/2;
				result.push(new BezierCurve(stepPositions[stepIdx], firstControlPoint, lastControlPoint, stepPositions[stepIdx+1] ));
				rowIdx++; //We use two point of the matrix
			}
		}

		return result;
	}

	getPointAtProportion(time) {
		const proportion = this.computeStepProportion(time);

		return this.curveSteps[this.currentStep].getPointForProportion(proportion);
	}

	getDirection() {
		//TODO get the point 0.01 proportion before
	}
}

class BezierCurve {
	constructor(startPoint, controlPoint1, controlPoint2, endPoint){
		this.startPoint= startPoint; 		//Vector3
		this.controlPoint1= controlPoint1; 	//Vector3
		this.controlPoint2= controlPoint2; 	//Vector3
		this.endPoint = endPoint; 			//Vector3
	}

	getPointForProportion(p){
		if(p < 0 ){
			return this.startPoint;
		} else if (p > 1){
			return this.endPoint
		}

		return this.startPoint.multiply(Math.pow((1 - p),3))
			.add(this.controlPoint1.multiply(3*p*Math.pow((1 - p),2)))
			.add(this.controlPoint2.multiply(3*Math.pow(p,2)*(1 - p)))
			.add(this.endPoint.multiply(Math.pow(p,3)));
	}
 }