import { Utils } from "../utils/utils.js"

export class AdvancedVariable { 

    static computeAdvancedVariables(advancedVariable){
        if(!advancedVariable) return

        const staticAdvancedVariables = Utils.getObjectRandomValueFrom(advancedVariable)

        let inKey = Object.keys(staticAdvancedVariables)
        const result = []

        for (const key of inKey) {
            result.push(new AdvancedVariable(key, staticAdvancedVariables[key])); //TODO use value in getter
        }

        result.sort(Utils._compare)

        return result.reduce((acc, item) => {
            item.generate(acc)
            acc[item.key] = item
            return acc
        }, 
        {});
    }

    static _getParam(inputFunction){
        const regex = /\(\{.*?\}\)/g; //Regex to find ({...})
        const found = inputFunction.toString().match(regex);

        const result = found[0] //First result for param
            .replace(/(\(\{|\}\))/g, '') // Remove "({" and "})""
            .replace(/\s/g, '') //Remove space
            .split(',')

        return result
    }

    static _compare(a, b) {
        if(a.requiredParam.length === 0 && b.requiredParam.length === 0){
            return 0
        }

        if(a.requiredParam.length === 0){
            return -1
        }

        if(b.requiredParam.length === 0){
            return 1
        }

        if(a.requiredParam.indexOf(b.key) > -1){
            return 1 //a need b
        }

        if(b.requiredParam.indexOf(a.key) > -1){
            return -1 //b need a
        }

        return 0
    }

    constructor(key, input){
        this.key = key
        this.input = input;

        if(input instanceof Function){
            this.requiredParam = AdvancedVariable._getParam(input)
            this.isFinish = false
        }else{
            this.value = input
            this.isFinish = true
            this.requiredParam = []
        }
    }

    generate(advancedVariables){
        if(this.isFinish || !this.input instanceof Function) return

        const requiredParam = this.requiredParam.reduce(
            (acc, key) => {
                acc[key] = advancedVariables[key]?.value
                return acc
            },
            {}
        )

        this.value = this.input(requiredParam)
    }

}