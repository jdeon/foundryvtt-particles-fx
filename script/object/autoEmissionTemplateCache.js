import emitController from "../api/emitController.js"
import { Utils } from "../utils/utils.js"
import { computeTemplateForMeasuredDimension } from "../service/measuredTemplate.service.js"

export class AutoEmissionTemplateCache { 

    static _CACHED = {}

    static findByItem (itemId) {
        let result = AutoEmissionTemplateCache._CACHED[itemId]
        
        if(!result){
            result = new AutoEmissionTemplateCache(itemId)
            AutoEmissionTemplateCache._CACHED[itemId] = result
        }

        return result
    }

    constructor(itemId){
        this._itemId = itemId
        this._sources = []
        this._colors = []
        this._template
        this._createdAt = Date.now() 
    }
    
    setColors(colors){
        this._colors = colors
        this._generateOnReady()
    }

    setSources(sources){
        this._sources = sources
        this._generateOnReady()
    }

    setTemplate(template){
        this._template = template
        this._generateOnReady()
    }
    

    _checkAllReady(){
        return this._colors?.length > 0 
        && this._sources?.filter((source) => !source.destroyed).length 
        && this._template !== undefined && this._template.rendered
    }

    _generateOnReady(){
        if(this._checkAllReady()){
            delete AutoEmissionTemplateCache._CACHED[this._itemId]

            this._sources.forEach((source) => 
                this._colors.forEach((color) => {
                    const distance = Utils.getGridDistanceBetweenPoint(source, this._template)

                    emitController.missile(
                        {
                            particleLifetime : 500,
                            source: source.id, 
                            target:  Utils.getSourcePosition(this._template), //No really define with od
                            spawningFrequence: 10*color.fraction,
                            particleVelocityStart: (distance * 100 * 2) + '%',
                        }, 
                        color.id,
                        'grow'
                    )
                })
            );

            setTimeout(this._generateMeasuredTemplateEmission.bind(this), 500)
       }
    }

    _generateMeasuredTemplateEmission () {
        const templateDimension = computeTemplateForMeasuredDimension(this._template)
        const templateGridAverage = this._template.t === 'ray' ? templateDimension.w /2 / canvas.scene.grid.distance : (templateDimension.w + templateDimension.h) /2 / canvas.scene.grid.distance

        this._colors.forEach((color) => {
            emitController.spray(
                {
                    source: this._template.id, 
                    spawningFrequence: 5*color.fraction,
                    emissionDuration : 1500,
                    particleSizeStart: `${10/2*templateGridAverage/2}%`,
                    particleSizeEnd: this._template.t === 'ray' ? undefined : `${25/2*templateGridAverage/2}%_${50/2*templateGridAverage/2}%`,
                }, 
                color.id,
                'explosion'
            )
        })
    }
}