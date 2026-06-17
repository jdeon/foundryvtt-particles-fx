import { Vector3, sameStartKey, Utils } from './utils.js'

export class Path {
	static build(pathType, stepPositions, angleStart, angleEnd){
		if(stepPositions === null || stepPositions.length <= 1){
			return
		}
		
		if(pathType === CurvePath.PATH_TYPE){
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

	//TODO what to do with rotation during path
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

 	constructor(stepPositions, angleStart, angleEnd){
		super(stepPositions);

		const nbPoint = stepPositions.length;
		const firstControlPoint = this.stepPositions[0].add(this._computeEndsControlPoint(this.stepPath[0],  angleStart));
		const lastControlPoint = this.stepPositions[this.stepPositions.length - 1].minus(this._computeEndsControlPoint(this.stepPath[this.stepPath.length - 1],  angleEnd));
		
		this.curveSteps = this.positionToCurves(this.stepPositions, firstControlPoint, lastControlPoint);
		this.direction = this.curveSteps[0].getDirectionForProportion(0);
	}

	positionToCurves(points, startCtrl, endCtrl) {
	    if (!points || points.length < 2) {
	        return [];
	    }

	    const cps = this._computeControlPoints3D(points, startCtrl, endCtrl);

	    const curveSteps = []
	    for (let i = 0; i < points.length - 1; i++) {
	        curveSteps.push(
	        	new BezierCurve(
		        	points[i],
		            Vector3.build(cps.p1[i]),
		            Vector3.build(cps.p2[i]),
		            points[i + 1]  
	            )          
	        );
	    }

	    return curveSteps;
	}

	getPointAtProportion(pathProportion) {
		const currentStepProportion = this.computeStepProportion(pathProportion);

		this.direction = this.curveSteps[this.currentStep].getDirectionForProportion(currentStepProportion);

		return this.curveSteps[this.currentStep].getPointForProportion(currentStepProportion);
	}

	getDirection() {
		return Math.atan2(this.direction.y, this.direction.x) * 180 / Math.PI;
	}

	/**
	* Calculates the control points to have a C2 continuity curve on position.
	* Using Thomas algorithm.
	*/
	_computeControlPoints3D(K, p1_start, p2_end) {
	    const S = K.length - 1; // Number of segments
	    const p1 = new Array(S);
	    const p2 = new Array(S);

	    // Special case: only 1 segment (2 points)
	    if (S === 1) {
	        p1[0] = Vector3.build(p1_start);
	        p2[0] = Vector3.build(p2_end);
	        return { p1, p2 };
	    }

	    const M = S - 1; 
	    
	    // b and c are scalars (matrix coefficients)
	    const b = new Array(M); 
	    const c = new Array(M); 
	    
	    // r and X are 3D vectors
	    const r = new Array(M); 
	    const X = new Array(M); 

	    // 1. Construction of the simplified system of equations
	    for (let i = 0; i < M; i++) {
	        let knotIdx = i + 1; 
	        r[i] = new Vector3(0, 0, 0);
	        
	        if (M === 1) { 
	            b[0] = 4;
	            c[0] = 0;
            	r[0] = K[1].multiply(4).minus(p1_start).add(p2_end);
	        } else {
	            if (i === 0) {
	                b[i] = 4;
	                c[i] = 1;
	                r[i] = K[1].multiply(4).add(K[2].multiply(2)).minus(p1_start);
	            } else if (i === M - 1) {
	                b[i] = 4;
	                c[i] = 0;
	                r[i] = K[knotIdx].multiply(4).add(p2_end);
	            } else {
	                b[i] = 4;
	                c[i] = 1;
	                r[i] = K[knotIdx].multiply(4).add(K[knotIdx + 1].multiply(2));
	            }
	        }
	    }

	    // 2. Forward sweep (matrix elimination)
	    for (let i = 1; i < M; i++) {
	        let m = 1 / b[i - 1]; // m is a scalar
	        b[i] = b[i] - m * c[i - 1];
	        
	        // r[i] - m * r[i - 1]
	        r[i] = r[i].minus(r[i - 1].multiply(m));
	    }

	    // 3. Back substitution
	    X[M - 1] = r[M - 1].divide(b[M - 1]);

	    
	    for (let i = M - 2; i >= 0; i--) {
	    	//(r[i] - c[i] * X[i + 1]) / b[i]
	    	X[i] = r[i].minus(X[i + 1].multiply(c[i])).divide(b[i]);
	    }

	    // 4. Final assembly of control points
	    p1[0] = Vector3.build(p1_start);
	    for (let i = 1; i < S; i++) {
	        p1[i] = X[i - 1];
	    }

	    // P2 is derived from P1 due to C2 continuity
	    for (let i = 0; i < S - 1; i++) {
	        //2 * K[i + 1] - p1[i + 1]
	        p2[i] = K[i + 1].multiply(2).minus(p1[i + 1]);
	    }
	    p2[S - 1] = Vector3.build(p2_end);

	    return { p1, p2 };
	}

	_computeEndsControlPoint(pathStep, angle){
		const length = pathStep.magnitude() * .4;

		return new Vector3(
				length * Math.cos(angle * Math.PI / 180),
				length * Math.sin(angle * Math.PI / 180),
				pathStep.z * .4
			)
	}
}

class BezierCurve {
	constructor(startPoint, controlPoint1, controlPoint2, endPoint){
		this.startPoint= startPoint; 		//Vector3
		this.controlPoint1= controlPoint1; 	//Vector3
		this.controlPoint2= controlPoint2; 	//Vector3
		this.endPoint = endPoint; 			//Vector3

		//this._showControlPoint();
	}

	getPointForProportion(p){
		if(p < 0 ){
			return this.startPoint;
		} else if (p > 1){
			return this.endPoint
		}
		//Start * (1-p)^3 + p1 * 3 * p * (1-p)^2 + p2 * 3 * p^2 * (1-p) + end * p^3
		return this.startPoint.multiply(Math.pow((1 - p),3))
			.add(this.controlPoint1.multiply(3*p*Math.pow((1 - p),2)))
			.add(this.controlPoint2.multiply(3*Math.pow(p,2)*(1 - p)))
			.add(this.endPoint.multiply(Math.pow(p,3)));
	}

	getDirectionForProportion(p){
		if(p < 0 ){
			p = 0;
		} else if (p > 1){
			p = 1;
		}

		return this.startPoint.multiply(-3*Math.pow((1 - p),2))
			.add(this.controlPoint1.multiply(3*(1-p)*(1 - 3*p)))
			.add(this.controlPoint2.multiply(3*p*(2-3*p)))
			.add(this.endPoint.multiply(3*Math.pow(p,2)));
	}

	_showControlPoint(){
		let spriteFcp = new PIXI.Sprite(Utils.getSpriteTextureFromId("CIRCLE"))
        spriteFcp.x = this.controlPoint1.x;
        spriteFcp.y = this.controlPoint1.y;
        spriteFcp.anchor.set(0.5);
        spriteFcp.width = 25
        spriteFcp.height = 25
        spriteFcp.tint = Color.fromRGB([0, 1, 0])
        spriteFcp.layer = 950
        canvas.primary.addChild(spriteFcp);

        let spriteLcp = new PIXI.Sprite(Utils.getSpriteTextureFromId("CIRCLE"))
        spriteLcp.x = this.controlPoint2.x;
        spriteLcp.y = this.controlPoint2.y;
        spriteLcp.anchor.set(0.5);
        spriteLcp.width = 25
        spriteLcp.height = 25
        spriteLcp.tint = Color.fromRGB([1, 0, 0])
        spriteLcp.layer = 950
        canvas.primary.addChild(spriteLcp);
	}
 }