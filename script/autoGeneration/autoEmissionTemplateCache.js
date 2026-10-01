import emitController from "../api/emitController.js"
import { Utils } from "../utils/utils.js"
import { computeTemplateForMeasuredDimension } from "../service/measuredTemplate.service.js"

/**
 * Temporary cache for item-based automatic particle emission templates.
 */
export class AutoEmissionTemplateCache { 

    /** Cache dictionary indexed by item ID. */
    static _CACHED = {}

    /** Timer ID for periodic cache cleanup. */
    static _INTERVAL_ID

    /**
     * Finds or creates a cache entry for a given item ID.
     * @param {string|number} itemId - The item identifier.
     * @returns {AutoEmissionTemplateCache} The cached instance.
     */
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

    /**
     * Removes a cache entry by its item ID.
     * @param {string|number} itemId - The item identifier to remove.
     * @returns {void}
     */
    static _removeById(itemId){
        delete AutoEmissionTemplateCache._CACHED[itemId]

        if(AutoEmissionTemplateCache._INTERVAL_ID && Object.keys(AutoEmissionTemplateCache._CACHED).length === 0){
            clearInterval(AutoEmissionTemplateCache._INTERVAL_ID)
        }
    }

    /**
     * Cleans up cache entries older than 5 minutes.
     * @returns {void}
     */
    static _removeToOldCache(){
        const maxCacheDuration = 5 * 60 * 1000
        const currentTime = Date.now()

        Object.keys(AutoEmissionTemplateCache._CACHED)
            /**
             * @param {string} key - Cache key to filter.
             * @returns {boolean} True if entry has expired.
             */
            .filter((key) => currentTime - AutoEmissionTemplateCache._CACHED[key]._createdAt > maxCacheDuration)
            /**
             * @param {string} key - Cache key to remove.
             */
            .forEach((key) => AutoEmissionTemplateCache._removeById(key))
    }

    /**
     * Constructs a new cache entry for an item.
     * @param {string|number} itemId - The item identifier.
     */
    constructor(itemId){
        this._itemId = itemId
        this._sources = []
        this._colors = []
        this._template
        this._createdAt = Date.now() 
    }
    
    /**
     * Sets the damage colors for this cache item and attempts automatic generation.
     * @param {Array<ColorData>} colors - List of ColorData objects.
     * @returns {void}
     */
    setColors(colors){
        this._colors = colors
        this._generateOnReady()
    }

    /**
     * Sets the sources for this cache item and attempts automatic generation.
     * @param {Array<foundry.canvas.placeables.PlaceableObject>} sources - Array of source placeable objects.
     * @returns {void}
     */
    setSources(sources){
        this._sources = sources
        this._generateOnReady()
    }

    /**
     * Sets the measured template for this cache item and attempts automatic generation.
     * @param {Template} template - The measured template.
     * @returns {void}
     */
    setTemplate(template){
        this._template = template
        this._generateOnReady()
    }
    

    /**
     * Checks if all required data is available for triggering emission.
     * @returns {boolean} True if colors are set and template is rendered.
     */
    _checkAllReady(){
        return this._colors?.length > 0 
        && this._template !== undefined && this._template.rendered
    }

    /**
     * Triggers particle emission when all prerequisites are ready.
     * @returns {void}
     */
    _generateOnReady(){
        if(this._checkAllReady()){
            AutoEmissionTemplateCache._removeById(this._itemId)

            const isWithoutSource = this._sources?.filter((source) => !source.destroyed)?.length == 0

            if(isWithoutSource){
                this._generateMeasuredTemplateEmission()
            } else {
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
    }

    /**
     * Generates particle emission over the measured template area.
     * @returns {void}
     */
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
                this._template.t === 'ray' ? 'ray' : 'explosion'
            )
        })
    }
}