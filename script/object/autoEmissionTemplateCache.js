import emitController from "../api/emitController.js"
import { Utils } from "../utils/utils.js"
import { computeTemplateForMeasuredDimension } from "../service/measuredTemplate.service.js"

export class AutoEmissionTemplateCache { 

    static _CACHED = {}

    static _INTERVAL_ID

    static findByItem (itemId) {
        let result = AutoEmissionTemplateCache._CACHED[itemId]
        
        if(!result){
            result = new AutoEmissionTemplateCache(itemId)
            AutoEmissionTemplateCache._CACHED[itemId] = result

            if(AutoEmissionTemplateCache._INTERVAL_ID === undefined){
                AutoEmissionTemplateCache._INTERVAL_ID = setInterval(AutoEmissionTemplateCache._removeToOldCache, 30000);
            }
        }

        return result
    }

    static _removeById(itemId){
        delete AutoEmissionTemplateCache._CACHED[itemId]

        if(AutoEmissionTemplateCache._INTERVAL_ID && Object.keys(AutoEmissionTemplateCache._CACHED).length === 0){
            clearInterval(AutoEmissionTemplateCache._INTERVAL_ID)
        }
    }

    static _removeToOldCache(){
        const maxCacheDuration = 5 * 60 * 1000
        const currentTime = Date.now()

        Object.keys(AutoEmissionTemplateCache._CACHED)
            .filter((key) => currentTime - AutoEmissionTemplateCache._CACHED[key]._createdAt > maxCacheDuration)
            .forEach((key) => AutoEmissionTemplateCache._removeById(key))
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
            AutoEmissionTemplateCache._removeById(this._itemId)

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