export class Matrix2D {

	/**
	 * return identity matrix [n][n]
	 * */
	static getIdentite(n){
		const identityMatrix = new Matrix2D(n,n);
		for(let idxL = 0;idxL<n; idxL++){
			for(let idxC =0; idxC<n;idxC++){
				identityMatrix.data[idxL][idxC] = (idxC == idxL ? 1 : 0);
			}
		}
		return identityMatrix;
	}

	constructor (rowCount, columnCount){
		this.rowCount = rowCount;
		this.columnCount = columnCount;
		this.data = [[]];

		for (let lineIndex = 0; lineIndex<this.rowCount; lineIndex++) {
			this.data[lineIndex] = [];
			for (let columnIndex = 0; columnIndex<this.columnCount; columnIndex++) {
				this.data [lineIndex][columnIndex] = 0;
			}
		}
	}

	copy (){
		const copy = new Matrix2D(this.rowCount, this.columnCount);
		for (let lineIndex = 0; lineIndex<this.rowCount; lineIndex++) {
			for (let columnIndex = 0; columnIndex<this.columnCount; columnIndex++) {
				copy.data[lineIndex][columnIndex] = this.data [lineIndex][columnIndex];
			}
		}
		return copy;
	}
		
	/**
	 * Returns the determinant of a square matrix and returns 0 if it is not square
	 * source http://codes-sources.commentcamarche.net/source/view/53708/1261417#browser
	 * */
	getDeterminant(){
		let determinant = 1;
		let nbC = this.columnCount;
		let nbL = this.rowCount;
		let matrix = this.copy().data;
		let columnIndexValueMaxOfRow = -1;
		let standardDeviation, caseValue, caseMaxValeur;

		//Check that matrix is square
		if (nbC != nbL){
			return 0;
		}

		for (let idxL=nbL-1;idxL>0;idxL--) {
			caseMaxValeur=0;
			for (let idxC=0;idxC<=nbC;idxC++) {
				standardDeviation=Math.abs(matrix[idxL][idxC]);
				if (standardDeviation>caseMaxValeur) {
					columnIndexValueMaxOfRow=idxC; 
					caseMaxValeur=standardDeviation;
				}
			}

			// permut of h and k line
			if (columnIndexValueMaxOfRow!=idxL) {
				// get opposit determinant;
				determinant=-determinant; 
				
				for (let idxC=0;idxC<=idxL;idxC++) {
					caseValue=matrix[idxC][columnIndexValueMaxOfRow];
					matrix[idxC][columnIndexValueMaxOfRow]=matrix[idxC][idxL];
					matrix[idxC][idxL]=caseValue;
				}
			}

			caseValue = matrix[idxL][idxL];
			determinant*=caseValue;

			if ((!Number.isFinite(determinant)|| !Number.IsNaN(determinant))||(determinant==0)) {
				return determinant;
			}


		// for each line (except last)
			for (let j=0;j<=idxL;j++){
				let f=matrix[idxL][j]/caseValue;
				for (let i=0; i<idxL; i++){
					matrix[i][j] -= f*matrix[i][idxL];
				}
			}
		}
		return determinant*matrix[0][0];
	}

	/**
	 * invert the actual matrix and return it determinant or 0 if not square
	 * source http://codes-sources.commentcamarche.net/source/view/53708/1261417#browser
	 * */
	invert(){
		let determinant =1;
		let nbL = this.rowCount;
		let nbC = this.columnCount;
		let caseValue, maxValueOfRow;
		let h = -1; // h : index of the column with the max value of the row
		
		let matrix = this.data;	
		let identity = new Array(nbL);
		
		// Seulement pour matrix carrée
		if (nbL !=nbC ){
			return 0;
		}
		
		for (let idxL=0;idxL<nbL; idxL++) {
			maxValueOfRow=0 ;
			for (let idxC=idxL ;idxC<nbC ;idxC++){;
				caseValue=matrix[idxL][idxC];
				if(Math.abs(caseValue)>maxValueOfRow){
					maxValueOfRow = Math.abs(caseValue);
					h=idxC;
				}
			}
			
			// best pivot = 0 ==> déterminant = 0
			if (maxValueOfRow == 0) {
				return 0;	
			}
			
			identity [idxL] = h;
			maxValueOfRow = matrix [idxL][h];
			determinant *= (h==idxL)? maxValueOfRow: -maxValueOfRow;
			matrix [idxL][h] = matrix [idxL][idxL];
			matrix [idxL][idxL] = 1;
			for(let idxC=0;idxC< nbC; idxC++){
				matrix [idxL][idxC]/= maxValueOfRow;
			}
			
			for (let j=0;j<nbC;j++) {
				if(idxL != j){
					caseValue =matrix [j][h];
					matrix [j][h]=matrix [j][idxL];
					matrix [j][idxL]=0;
					if(caseValue !=0){
						for(let i=0; i < nbC; i++){	
							matrix [j][i] -= caseValue *matrix [idxL][i];
						}
					}
				}
			}
		}
		
		// we reorder columns
		for ( let idxL=nbL-1; idxL>=0 ; idxL--) {
			h=identity[idxL];
			for (let i = 0; i <nbC;i ++) {
				caseValue = matrix [h][i];
				matrix [h][i] = matrix [idxL][i];
				matrix [idxL][i] = caseValue ;	
			}
		}
		
		return determinant ;
	}

	/**
	 * return sum of the two matrix
	 * */
	add(otherMatrix){
		if(!otherMatrix instanceof Matrix2D){
			return null;
		}

		if (this.columnCount != otherMatrix.columnCount || this.rowCount != otherMatrix.rowCount) {
			return null;
		}

		const result = new Matrix2D (this.rowCount, this.columnCount);
		for (let idxC = 0; idxC<this.columnCount; idxC++) {
			for (let idxL = 0; idxL<this.rowCount; idxL++) {
				result.data[idxL][idxC] = this.data[idxL][idxC] + otherMatrix.data[idxL][idxC];
			}
		}
		return result;
	}

	/**
	 * Multiply the matrix case with a constant
	 * */
	multiplyWithConstant(k){
		let result = new Matrix2D (this.rowCount, this.columnCount);

		for (let idxC = 0; idxC<this.columnCount; idxC++) {
			for (let idxL = 0; idxL<this.rowCount; idxL++) {
				result [idxL][idxC] = k*this.data [idxL][idxC];
			}
		}

		return result;
	}

	/**
	 * Multiply the current matrix with an otheractuel avec une autre 
	 * Renvoi null si le nbCollone de la matrix actuel est différent du nb ligne de la seconde
	 * */
	multiply(otherMatrix){

		let currentMatrix = this.data;
		let tC = this.columnCount;
		let tL = this.rowCount;
		let rC = otherMatrix.columnCount;
		let rL = otherMatrix.rowCount;
		let result = new Matrix2D (tL, rC);

		if(tC != rL){
			return null;
		}

		for (let numLig1 = 0; numLig1< tL; numLig1++) {
			for (let numCol2 = 0; numCol2< rC; numCol2++) {
				let s = 0;
				for (let i = 0; i<tC; i++) {
					s += currentMatrix [numLig1][i] * otherMatrix.data [i][numCol2];
				}
				result.data [numLig1][numCol2] = s;
			}
		}
		return result;
	}

	/**
	 * Return transversal matrix
	 * */
	getTransversal (){
		let transversalMatrix = new Matrix2D (this.columnCount, this.rowCount);
		for (let idxC = 0; idxC<this.columnCount; idxC++) {
			for (let idxL = 0; idxL<this.rowCount; idxL++) {
				transversalMatrix.data[idxC][idxL] = this.data[idxL][idxC];
			}
		}
		
		return transversalMatrix;
	}

	/**
	 * return inverted matrix
	 * */
	getInverse (){
		const result = this.copy();
		const determinant = result.inverse();
		return determinant != 0? result : null;
	} 


	toString(separator, lineBreaker){
		
		let matriceStr ="";
		
		for(let numLigne = 0; numLigne <this.rowCount;numLigne ++){
			for(let idxC = 0; idxC <this.columnCount;idxC ++){
				matriceStr += this.data[numLigne][idxC ] + (idxC ==this.columnCount -1 ? lineBreaker : separator);	
			}		
		}
		return matriceStr;	
	}
}