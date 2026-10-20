import { Particle, SprayingParticle, PathParticle, GravitingParticle } from './particle.js'
import { s_MODULE_ID, Utils, Vector3 } from "../utils/utils.js"
import { Path } from "../utils/path.js"
import { generatePrefillTemplateForMeasured } from '../service/measuredTemplate.service.js'
import { AdvancedVariable } from './advancedVariable.js'

/**
 * Base template class responsible for constructing Particle instances based on configuration parameters.
 */
export class ParticleTemplate {

    /**
     * Resolves source/target references to canvas placeable objects.
     * @param {Array<string|foundry.canvas.placeables.PlaceableObject>|string|foundry.canvas.placeables.PlaceableObject} source - Source string ID, array, or object.
     * @returns {Array<foundry.canvas.placeables.PlaceableObject>|foundry.canvas.placeables.PlaceableObject|undefined} Resolved placeable object or original input.
     */
    static _translatePlaceableObject(source) {
        let result

        if (Array.isArray(source)) {
            result = []
            for (let item of source) {
                result.push(ParticleTemplate._translatePlaceableObject(item))
            }
        } else if (typeof source === 'string' && isNaN(source) && !source.includes('_')) {
            result = Utils.getPlaceableObjectById(source)
        } else if (source instanceof Vector3 || source instanceof foundry.canvas.placeables.PlaceableObject) {
            result = source
        } else {
            result = undefined
        }

        return result
    }

    /**
     * Constructs a base ParticleTemplate instance.
     * @param {Object|foundry.canvas.placeables.PlaceableObject|string} source - Source object/ID or configuration options object.
     * @param {foundry.canvas.placeables.PlaceableObject|string} [target] - Target object/ID.
     * @param {{list: Array<{time: number, value: number | string | Vector3 | Array<number|string|Vector3>}>}} [particleSize] - Size keyframe list configuration.
     * @param {{list: Array<{time: number, value: number | string | Array<number|string>}>}} [particleRotation] - Rotation keyframe list configuration.
     * @param {number|string|Array<number|string>} [particleLifetime] - Particle lifetime.
     * @param {string} [particleShape] - Shape key name.
     * @param {{list: Array<{time: number, value: number | string | Vector3 | Array<number|string|Vector3>}>}} [particleColor] - Color keyframe list configuration.
     * @param {{list: Array<{time: number, value: number | string | Array<number|string>}>}} [alpha] - Alpha keyframe list configuration.
     * @param {{list: Array<{time: number, value: number | string | Vector3 | Array<number|string|Vector3>}>}} [particleRiseRate] - Rise rate keyframe list configuration.
     * @param {{list: Array<{time: number, value: number | string | Array<number|string>}>}} [vibrationAmplitude] - Vibration amplitude keyframe list configuration.
     * @param {{list: Array<{time: number, value: number | string | Array<number|string>}>}} [vibrationFrequency] - Vibration frequency keyframe list configuration.
     * @param {boolean} [freezeOnPause] - Freeze state on game pause.
     * @param {Array<Object>} [next] - Array of chained template definitions.
     * @param {Object} [advanced] - Advanced variables configuration object.
     */
    constructor(source, target, particleSize, particleRotation, particleLifetime, particleShape,
        particleColor, alpha, particleRiseRate, vibrationAmplitude, vibrationFrequency, freezeOnPause, next, advanced
    ) {
        const isElevationManage = game.settings.get(s_MODULE_ID, "activateElevation");

        this.source = ParticleTemplate._translatePlaceableObject(source);
        this.target = ParticleTemplate._translatePlaceableObject(target);

        this.particleSize = particleSize;
        if (this.particleSize?.list) {
            this.particleSize.list = this.particleSize.list.map(i => ({ time: i.time, value: Vector3.build(i.value) }));
        }
        this.particleRotation = particleRotation;
        this.particleLifetime = particleLifetime;
        this.particleShape = particleShape;

        this.particleColor = particleColor;
        if (this.particleColor?.list) {
            this.particleColor.list = this.particleColor.list.map(i => ({ time: i.time, value: Vector3.build(i.value) }));
        }
        this.alpha = alpha;

        if (isElevationManage) {
            this.particleRiseRate = particleRiseRate;
        } else {
            this.particleRiseRate = { list: [{ time: 0, value: 0 }, { time: 1, value: 0 }] };
        }

        this.vibrationAmplitude = vibrationAmplitude;
        this.vibrationFrequency = vibrationFrequency;
        this.isElevationManage = isElevationManage;
        this.freezeOnPause = freezeOnPause;
        this.next = next ?? [];
        this.advanced = advanced;

        const advancedVariable = AdvancedVariable.computeAdvancedVariables(this.advanced?.variables);
        this.currentSourcePosition = Utils.getSourcePosition(Utils.getRandomValueFrom(this.source, advancedVariable), this.isElevationManage);
    }

    /**
     * Generates a new Particle instance configured by this template.
     * @returns {Particle} Newly created Particle instance.
     */
    generateParticles() {
        let advancedVariable = AdvancedVariable.computeAdvancedVariables(this.advanced?.variables);

        this.currentSourcePosition = Utils.getSourcePosition(Utils.getRandomValueFrom(this.source, advancedVariable), this.isElevationManage);

        let particleProperties = Utils.getObjectRandomValueFrom(this, advancedVariable, true);

        const startSizeInput = particleProperties.particleSize.computeValue(0, advancedVariable);
        const angleStartInput = particleProperties.particleRotation.computeValue(0, advancedVariable);
        const colorStartInput = particleProperties.particleColor.computeValue(0, advancedVariable);

        const sprite = this.initSprite(this.currentSourcePosition, startSizeInput, angleStartInput, colorStartInput);

        return new Particle({
            sprite,
            particleLifetime: Utils.getRandomValueFrom(this.particleLifetime, advancedVariable),
            elevationStart: this.currentSourcePosition.z,
            particleRiseRate: particleProperties.particleRiseRate,
            particleSize: particleProperties.particleSize,
            particleRotation: particleProperties.particleRotation.add(this.currentSourcePosition.r),
            particleColor: particleProperties.particleColor,
            alpha: particleProperties.alpha,
            vibrationAmplitude: particleProperties.vibrationAmplitude,
            vibrationFrequency: particleProperties.vibrationFrequency
        },
            advancedVariable,
            this.isElevationManage);
    }

    /**
     * Initializes the PIXI.Sprite instance for a new particle.
     * @param {Vector3} position - Particle starting position vector.
     * @param {Vector3} startSizeInput - Initial size input.
     * @param {number} angleStartInput - Initial angle input.
     * @param {Vector3} colorStartInput - Initial color input.
     * @returns {PIXI.Sprite} Created PIXI.Sprite instance.
     */
    initSprite(position, startSizeInput, angleStartInput, colorStartInput) {
        let sprite = new PIXI.Sprite(Utils.getSpriteTextureFromId(this.particleShape))
        sprite.x = position.x;
        sprite.y = position.y;
        sprite.anchor.set(0.5);

        let startSize = Vector3.build(startSizeInput)
        const sizeFactor = Utils.handleElevationFactorForSize(this.isElevationManage ? position.z : undefined)
        sprite.width = startSize.x * sizeFactor
        sprite.height = startSize.y * sizeFactor

        sprite.angle = angleStartInput + position.r;

        sprite.tint = Utils.fromRGB(colorStartInput)

        return sprite;
    }
}

/**
 * Subclass template producing SprayingParticle instances.
 */
export class SprayingParticleTemplate extends ParticleTemplate {

    /**
     * Returns type name string.
     * @returns {string} Type identifier "Spraying".
     */
    static getType() {
        return "Spraying"
    }

    /**
     * Factory builder for SprayingParticleTemplate from input config.
     * @param {Object} input - Input configuration object.
     * @returns {SprayingParticleTemplate} Constructed template instance.
     */
    static build(input) {
        return new SprayingParticleTemplate(
            input.source,
            input.target,
            input.positionSpawning,
            input.particleVelocity,
            input.particleRiseRate,
            input.particleAngle,
            input.particleSize,
            input.particleRotation,
            input.particleLifetime,
            input.particleShape,
            input.particleColor,
            input.alpha,
            input.vibrationAmplitude,
            input.vibrationFrequency,
            input.freezeOnPause,
            input.next,
            input.advanced,
        );
    }

    /**
     * Constructs a SprayingParticleTemplate.
     * @param {Object|foundry.canvas.placeables.PlaceableObject|string} source - Source object/ID or configuration options object.
     * @param {foundry.canvas.placeables.PlaceableObject|string} [target] - Target object/ID.
     * @param {Vector3|Object} [positionSpawning] - Spawning position offset.
     * @param {{list: Array<{time: number, value: number | string | Array<number|string>}>}} [particleVelocity] - Velocity keyframe list.
     * @param {{list: Array<{time: number, value: number | string | Vector3 | Array<number|string|Vector3>}>}} [particleRiseRate] - Rise rate keyframe list.
     * @param {{list: Array<{time: number, value: number | string | Array<number|string>}>}} [particleAngle] - Emission angle keyframe list.
     * @param {{list: Array<{time: number, value: number | string | Vector3 | Array<number|string|Vector3>}>}} [particleSize] - Size keyframe list.
     * @param {{list: Array<{time: number, value: number | string | Array<number|string>}>}} [particleRotation] - Rotation angle keyframe list.
     * @param {number|string|Array<number|string>} [particleLifetime] - Particle lifetime.
     * @param {string} [particleShape] - Shape key name.
     * @param {{list: Array<{time: number, value: number | string | Vector3 | Array<number|string|Vector3>}>}} [particleColor] - Color keyframe list.
     * @param {{list: Array<{time: number, value: number | string | Array<number|string>}>}} [alpha] - Alpha keyframe list.
     * @param {{list: Array<{time: number, value: number | string | Array<number|string>}>}} [vibrationAmplitude] - Vibration amplitude keyframe list.
     * @param {{list: Array<{time: number, value: number | string | Array<number|string>}>}} [vibrationFrequency] - Vibration frequency keyframe list.
     * @param {boolean} [freezeOnPause] - Freeze state on game pause.
     * @param {Array<Object>} [next] - Array of next template steps.
     * @param {Object} [advanced] - Advanced variables configuration.
     */
    constructor(source, target, positionSpawning, particleVelocity, particleRiseRate, particleAngle, particleSize, particleRotation,
        particleLifetime, particleShape, particleColor, alpha, vibrationAmplitude, vibrationFrequency, freezeOnPause, next, advanced) {

        super(source, target, particleSize, particleRotation, particleLifetime, particleShape, particleColor, alpha, particleRiseRate, vibrationAmplitude, vibrationFrequency, freezeOnPause, next, advanced);

        this.positionSpawning = Vector3.build(positionSpawning);
        this.particleVelocity = particleVelocity;
        this.particleAngle = particleAngle;
    }

    /**
     * Generates a SprayingParticle instance based on configured properties.
     * @returns {SprayingParticle} Newly created SprayingParticle.
     */
    generateParticles() {
        let advancedVariable = AdvancedVariable.computeAdvancedVariables(this.advanced?.variables)

        let particleProperties = Utils.getObjectRandomValueFrom(this, advancedVariable, true)

        this.currentSourcePosition = Utils.getSourcePosition(particleProperties.source.currentValue, this.isElevationManage)

        if (this.currentSourcePosition === undefined) return

        let target = particleProperties.target.currentValue
        let particleLifetime = particleProperties.particleLifetime.currentValue
        let positionSpawning = particleProperties.positionSpawning.currentValue

        let targetAngleDirection
        if (target && (this.currentSourcePosition.x !== target.x || this.currentSourcePosition.y !== target.y)) {
            let targetPosition = Utils.getSourcePosition(target, this.isElevationManage)
            targetAngleDirection = Math.atan2(targetPosition.y - this.currentSourcePosition.y, targetPosition.x - this.currentSourcePosition.x)
            const oldPositionSpawning = new Vector3(positionSpawning.x, positionSpawning.y, positionSpawning.z);
            positionSpawning = oldPositionSpawning.rotateZVector(targetAngleDirection)

            const targetDistance = Math.sqrt(Math.pow(targetPosition.x - this.currentSourcePosition.x, 2) + Math.pow(targetPosition.y - this.currentSourcePosition.y, 2) + Math.pow(targetPosition.z - this.currentSourcePosition.z, 2))
            if (targetDistance > 5 * canvas.scene.grid.size) {
                particleLifetime *= (targetDistance / (5 * canvas.scene.grid.size))
            }
            const targetRiseRate = (targetPosition.z - this.currentSourcePosition.z) / targetDistance
            particleProperties.particleRiseRate.add(targetRiseRate);

        } else if (this.source instanceof foundry.canvas.placeables.MeasuredTemplate) {
            this.currentSourcePosition = Utils.getSourcePosition(this.source, this.isElevationManage)
            const velocityStart = particleProperties.particleVelocity.computeValue(0, advancedVariable);
            const velocityEnd = particleProperties.particleVelocity.computeValue(1, advancedVariable);
            let measuredOverride = generatePrefillTemplateForMeasured(this.source.document, velocityStart, velocityEnd)
            if (measuredOverride.particleAngleStart || measuredOverride.particleVelocityStart) {
                measuredOverride = Utils.normalizeStartEndProperties(measuredOverride);
            }
            particleProperties = { ...particleProperties, ...measuredOverride }
            particleLifetime = particleProperties.particleLifetime.currentValue
            positionSpawning = particleProperties.positionSpawning.currentValue
            targetAngleDirection = 0
        } else {
            targetAngleDirection = this.currentSourcePosition.r * Math.PI / 180
            const oldPositionSpawning = new Vector3(positionSpawning.x, positionSpawning.y, positionSpawning.z);
            positionSpawning = oldPositionSpawning.rotateZVector(targetAngleDirection)
        }

        const startSizeInput = particleProperties.particleSize.computeValue(0, advancedVariable);
        const startAngleInput = particleProperties.particleRotation.computeValue(0, advancedVariable);
        const startColorInput = particleProperties.particleColor.computeValue(0, advancedVariable);

        let sprite = this.initSprite(
            { ...Vector3.build(this.currentSourcePosition).add(positionSpawning), r: this.currentSourcePosition.r },
            startSizeInput,
            startAngleInput,
            startColorInput
        )

        const targetAngleDeg = targetAngleDirection * 180 / Math.PI;

        return new SprayingParticle({
            sprite,
            target,
            particleLifetime,
            elevationStart: this.currentSourcePosition.z + positionSpawning.z,
            particleRiseRate: particleProperties.particleRiseRate,
            particleVelocity: particleProperties.particleVelocity,
            particleAngle: particleProperties.particleAngle.add(targetAngleDeg),
            particleSize: particleProperties.particleSize,
            particleRotation: particleProperties.particleRotation.add(targetAngleDeg),
            particleColor: particleProperties.particleColor,
            alpha: particleProperties.alpha,
            vibrationAmplitude: particleProperties.vibrationAmplitude,
            vibrationFrequency: particleProperties.vibrationFrequency
        },
            advancedVariable,
            this.isElevationManage
        );
    }
}


/**
 * Subclass template producing Missile/PathParticle instances with trailing sub-particles.
 */
export class MissileParticleTemplate extends SprayingParticleTemplate {

    /**
     * Returns type name string.
     * @returns {string} Type identifier "Missile".
     */
    static getType() {
        return "Missile"
    }

    /**
     * Factory builder for MissileParticleTemplate.
     * @param {Object} input - Configuration input object.
     * @param {Array<ParticleTemplate>} subParticleTemplates - Sub particle templates.
     * @returns {MissileParticleTemplate} Constructed instance.
     */
    static build(input, subParticleTemplates) {
        return new MissileParticleTemplate(
            input.source,
            input.target,
            input.pathType,
            input.positionSpawning,
            input.particleVelocity,
            input.particleRiseRate,
            input.particleAngle,
            input.particleSize,
            input.particleRotation,
            input.particleLifetime,
            input.particleShape,
            input.particleColor,
            input.alpha,
            input.vibrationAmplitude,
            input.vibrationFrequency,
            input.freezeOnPause,
            input.next,
            input.advanced,
            subParticleTemplates
        );
    }

    /**
     * Constructs a MissileParticleTemplate.
     * @param {Object|foundry.canvas.placeables.PlaceableObject|string} source - Source position/object or options.
     * @param {Array<foundry.canvas.placeables.PlaceableObject|string>|foundry.canvas.placeables.PlaceableObject|string} [targets] - Target object(s).
     * @param {string} [pathType] - Trajectory path type (LINEAR, CURVE).
     * @param {Vector3|Object} [positionSpawning] - Spawning position offset.
     * @param {{list: Array<{time: number, value: number | string  | Array<number|string>}>}} [particleVelocity] - Velocity keyframe list.
     * @param {{list: Array<{time: number, value: number | string | Vector3 | Array<number|string|Vector3>}>}} [particleRiseRate] - Rise rate keyframe list.
     * @param {{list: Array<{time: number, value: number | string | Array<number|string>}>}} [particleAngle] - Angle keyframe list.
     * @param {{list: Array<{time: number, value: number | string | Vector3 | Array<number|string|Vector3>}>}} [particleSize] - Size keyframe list.
     * @param {{list: Array<{time: number, value: number | string | Array<number|string>}>}} [particleRotation] - Rotation angle keyframe list.
     * @param {number|string|Array<number|string>} [particleLifetime] - Lifetime in ms.
     * @param {string} [particleShape] - Shape key name.
     * @param {{list: Array<{time: number, value: number | string | Vector3 | Array<number|string|Vector3>}>}} [particleColor] - Color keyframe list.
     * @param {{list: Array<{time: number, value: number | string | Array<number|string>}>}} [alpha] - Alpha keyframe list.
     * @param {{list: Array<{time: number, value: number | string | Array<number|string>}>}} [vibrationAmplitude] - Vibration amplitude keyframe list.
     * @param {{list: Array<{time: number, value: number | string | Array<number|string>}>}} [vibrationFrequency] - Vibration frequency keyframe list.
     * @param {boolean} [freezeOnPause] - Freeze state on game pause.
     * @param {Array<Object>} [next] - Array of next steps.
     * @param {Object} [advanced] - Advanced variables.
     * @param {Array<ParticleTemplate>} [subParticleTemplates] - Templates for sub-particles trailing the missile.
     */
    constructor(source, targets, pathType, positionSpawning, particleVelocity, particleRiseRate, particleAngle, particleSize, particleRotation,
        particleLifetime, particleShape, particleColor, alpha, vibrationAmplitude, vibrationFrequency, freezeOnPause, next, advanced, subParticleTemplates) {

        super(source, targets?.[0], positionSpawning, particleVelocity, particleRiseRate, particleAngle, particleSize, particleRotation,
            particleLifetime, particleShape, particleColor, alpha, vibrationAmplitude, vibrationFrequency, freezeOnPause, next, advanced);

        if (targets === undefined || Array.isArray(targets)) {
            this.targets = targets;
        } else {
            this.targets = [targets];
        }

        this.pathType = pathType;
        this.mainParticle = this.generateMainParticles()
        this.initGenerate = false

        this.subParticleTemplates = subParticleTemplates ?? []

        this.subParticleTemplates.forEach((item) => {
            item.source = this.mainParticle.sprite
            item.target = undefined
        })
    }

    /**
     * Generates the leading main missile particle.
     * @returns {Particle} Main missile particle instance.
     */
    generateMainParticles() {
        if (this.targets === undefined) {
            const mainParticle = super.generateParticles();
            mainParticle.particleRotation.add(mainParticle.particleAngle.currentValue)
            return mainParticle
        }

        let advancedVariable = AdvancedVariable.computeAdvancedVariables(this.advanced?.variables)

        let particleProperties = Utils.getObjectRandomValueFrom(this, advancedVariable, true)

        this.currentSourcePosition = Utils.getSourcePosition(particleProperties.source.currentValue, this.isElevationManage)

        if (this.currentSourcePosition === undefined) return

        let targetsPosition = Utils.getArrayRandomValueFrom('targets', this.targets)
            .map((item) => Utils.getSourcePosition(item, this.isElevationManage));

        const pathPositions = [this.currentSourcePosition, ...targetsPosition];
        const angleStartVal = particleProperties.particleAngle.computeValue(0, advancedVariable);
        const angleEndVal = particleProperties.particleAngle.computeValue(1, advancedVariable);

        const path = Path.build(
            this.pathType,
            pathPositions,
            angleStartVal,
            angleEndVal
        );

        if (path === undefined || path.totalLenght === 0) {
            return super.generateParticles();
        }

        let particleLifetime = particleProperties.particleLifetime.currentValue
        let positionSpawning = particleProperties.positionSpawning.currentValue

        const startSizeInput = particleProperties.particleSize.computeValue(0, advancedVariable);
        const startAngleInput = particleProperties.particleRotation.computeValue(0, advancedVariable);
        const startColorInput = particleProperties.particleColor.computeValue(0, advancedVariable);

        const sprite = this.initSprite(
            { ...Vector3.build(this.currentSourcePosition).add(positionSpawning), r: this.currentSourcePosition.r },
            startSizeInput,
            startAngleInput,
            startColorInput
        );

        const mainParticle = new PathParticle({
            sprite,
            path,
            particleLifetime,
            elevationStart: this.currentSourcePosition.z + positionSpawning.z,
            particleRiseRate: particleProperties.particleRiseRate,
            particleVelocity: particleProperties.particleVelocity,
            particleSize: particleProperties.particleSize,
            particleRotation: particleProperties.particleRotation,
            particleColor: particleProperties.particleColor,
            alpha: particleProperties.alpha,
            vibrationAmplitude: particleProperties.vibrationAmplitude,
            vibrationFrequency: particleProperties.vibrationFrequency
        },
            advancedVariable,
            this.isElevationManage
        );

        this.computeVelocity(mainParticle, path.totalLenght)

        return mainParticle
    }

    /**
     * Adjusts velocity and lifetime of the main particle to match trajectory distance.
     * @param {PathParticle} mainParticle - Main particle instance.
     * @param {number} distance - Trajectory path distance.
     * @returns {void}
     */
    computeVelocity(mainParticle, distance) {
        const velStart = mainParticle.particleVelocity.computeValue(0, this.advanced)
        const velEnd = mainParticle.particleVelocity.computeValue(1, this.advanced)
        const averageVelocity = (velStart + velEnd) / 2;
        const lifetimeVelocity = 1000 * distance / mainParticle.particleLifetime;

        if (lifetimeVelocity > averageVelocity) {
            const velocityDifference = lifetimeVelocity - averageVelocity;
            mainParticle.particleVelocity.add(velocityDifference);
        } else if (averageVelocity !== 0 && averageVelocity !== undefined) {
            const updatedLifetime = 1000 * distance / averageVelocity
            mainParticle.particleLifetime = updatedLifetime
            mainParticle.remainingTime = updatedLifetime
        }
    }

    /**
     * Generates main or trailing sub-particles for missile emission.
     * @returns {Particle|undefined} Generated particle instance or undefined.
     */
    generateParticles() {
        if (!this.initGenerate) {
            this.initGenerate = true
            return this.mainParticle
        }

        if (this.subParticleTemplates.length === 0) {
            return
        }

        if (this.mainParticle === undefined) {
            return
        }

        const sourcePosition = new Vector3(this.mainParticle.sprite.x, this.mainParticle.sprite.y, this.mainParticle.positionVibrationLess.z)

        const sourceDirection = this.mainParticle.getDirection()
        const sourceDirectionRadian = sourceDirection * Math.PI / 180

        const usedSubParticleTemplate = Utils.retrieveRandomElementFromArray(this.subParticleTemplates)

        let generatedParticle
        if (usedSubParticleTemplate instanceof SprayingParticleTemplate) {
            generatedParticle = usedSubParticleTemplate.generateParticles()

            const dircetionXFactor = {
                x: - Math.cos(sourceDirectionRadian),
                y: - Math.sin(sourceDirectionRadian)
            }

            const dircetionYFactor = {
                x: - Math.sin(sourceDirectionRadian),
                y: Math.cos(sourceDirectionRadian)
            }

            const generatedSprite = generatedParticle.sprite
            const oldPositionHorizontalSpawning = { x: generatedSprite.x - sourcePosition.x, y: generatedSprite.y - sourcePosition.y }
            generatedSprite.x = sourcePosition.x + dircetionXFactor.x * oldPositionHorizontalSpawning.x + dircetionYFactor.x * oldPositionHorizontalSpawning.y;
            generatedSprite.y = sourcePosition.y + dircetionXFactor.y * oldPositionHorizontalSpawning.x + dircetionYFactor.y * oldPositionHorizontalSpawning.y;
            generatedParticle.positionVibrationLess = { x: generatedSprite.x, y: generatedSprite.y, z: sourcePosition.z };

            const sizeFactor = Utils.handleElevationFactorForSize(generatedParticle.positionVibrationLess.z)
            generatedParticle.sprite.width *= sizeFactor
            generatedParticle.sprite.height *= sizeFactor

            generatedParticle.particleAngle.add(sourceDirection + 180);
        } else if (usedSubParticleTemplate instanceof GravitingParticleTemplate) {
            generatedParticle = usedSubParticleTemplate.generateParticles()
            generatedParticle.angle += sourceDirection + 180
        }

        return generatedParticle
    }
}

/**
 * Subclass template producing GravitingParticle instances orbiting a center.
 */
export class GravitingParticleTemplate extends ParticleTemplate {

    /**
     * Returns type name string.
     * @returns {string} Type identifier "Graviting".
     */
    static getType() {
        return "Graviting"
    }

    /**
     * Factory builder for GravitingParticleTemplate from input config.
     * @param {Object} input - Configuration parameters object.
     * @returns {GravitingParticleTemplate} Constructed template instance.
     */
    static build(input) {
        return new GravitingParticleTemplate(input.source, input.target, input.particleAngle,
            input.particleAxisElevationAngle, input.particleVelocity, input.particleRiseRate,
            input.particleRadius, input.particleSize, input.particleRotation, input.particleLifetime,
            input.particleShape, input.particleColor, input.alpha,
            input.vibrationAmplitude, input.vibrationFrequency, input.onlyEmitterFollow,
            input.freezeOnPause, input.next, input.advanced, input.subParticleTemplates);
    }

    /**
     * Constructs a GravitingParticleTemplate.
     * @param {Object|foundry.canvas.placeables.PlaceableObject|string} source - Center source object/position or options.
     * @param {foundry.canvas.placeables.PlaceableObject|string} [target] - Target object/position.
     * @param {{list: Array<{time: number, value: number | string | Array<number|string>}>}} [particleAngle] - Angle keyframe list.
     * @param {number} [particleAxisElevationAngle] - Track elevation angle.
     * @param {{list: Array<{time: number, value: number | string | Array<number|string>}>}} [angularVelocity] - Angular velocity keyframe list.
     * @param {{list: Array<{time: number, value: number | string | Vector3 | Array<number|string|Vector3>}>}} [particleRiseRate] - Rise rate keyframe list.
     * @param {{list: Array<{time: number, value: number | string | Array<number|string>}>}} [particleRadius] - Radius keyframe list.
     * @param {{list: Array<{time: number, value: number | string | Vector3 | Array<number|string|Vector3>}>}} [particleSize] - Size keyframe list.
     * @param {{list: Array<{time: number, value: number | string | Array<number|string>}>}} [particleRotation] - Rotation keyframe list.
     * @param {number|string|Array<number|string>} [particleLifetime] - Particle lifetime.
     * @param {string} [particleShape] - Shape key name.
     * @param {{list: Array<{time: number, value: number | string | Vector3 | Array<number|string|Vector3>}>}} [particleColor] - Color keyframe list.
     * @param {{list: Array<{time: number, value: number | string | Array<number|string>}>}} [alpha] - Alpha keyframe list.
     * @param {{list: Array<{time: number, value: number | string | Array<number|string>}>}} [vibrationAmplitude] - Vibration amplitude keyframe list.
     * @param {{list: Array<{time: number, value: number | string | Array<number|string>}>}} [vibrationFrequency] - Vibration frequency keyframe list.
     * @param {boolean} [onlyEmitterFollow] - Whether particle only follows emitter.
     * @param {boolean} [freezeOnPause] - Freeze state on game pause.
     * @param {Array<Object>} [next] - Array of next steps.
     * @param {Object} [advanced] - Advanced variables.
     */
    constructor(source, target, particleAngle, particleAxisElevationAngle, angularVelocity, particleRiseRate, particleRadius, particleSize, particleRotation,
        particleLifetime, particleShape, particleColor, alpha, vibrationAmplitude, vibrationFrequency, onlyEmitterFollow, freezeOnPause, next, advanced) {

        super(source, target, particleSize, particleRotation, particleLifetime, particleShape, particleColor,
            alpha, particleRiseRate, vibrationAmplitude, vibrationFrequency, freezeOnPause, next, advanced);

        this.particleAngle = particleAngle;
        this.axisElevationAngle = this.isElevationManage ? particleAxisElevationAngle : undefined;
        this.angularVelocity = angularVelocity;
        this.particleRadius = particleRadius;
        this.onlyEmitterFollow = onlyEmitterFollow;
    }

    /**
     * Generates a GravitingParticle instance configured by this template.
     * @returns {GravitingParticle} Newly created GravitingParticle instance.
     */
    generateParticles() {
        const advancedVariable = AdvancedVariable.computeAdvancedVariables(this.advanced?.variables)
        const particleProperties = Utils.getObjectRandomValueFrom(this, advancedVariable, true)

        const source = particleProperties.source.computeValue(0, advancedVariable)
        this.currentSourcePosition = Utils.getSourcePosition(source, this.isElevationManage)

        const target = particleProperties.target.computeValue(0, advancedVariable)
        const targetPosition = Utils.getSourcePosition(target, this.isElevationManage)


        let angleOriginValue
        let axisElevationAngle
        if (targetPosition) {
            if (this.currentSourcePosition.x !== targetPosition.x || this.currentSourcePosition.y !== targetPosition.y) {
                angleOriginValue = Math.atan2(targetPosition.y - this.currentSourcePosition.y, targetPosition.x - this.currentSourcePosition.x) * 180 / Math.PI

                if (this.axisElevationAngle !== undefined) {
                    axisElevationAngle = this.axisElevationAngle - angleOriginValue + 90
                    angleOriginValue = 90
                }
            }

            if (targetPosition.z !== undefined && targetPosition.z - this.currentSourcePosition.z !== 0) {
                const targetDistance = Math.sqrt(Math.pow(targetPosition.x - this.currentSourcePosition.x, 2) + Math.pow(targetPosition.y - this.currentSourcePosition.y, 2) + Math.pow(targetPosition.z - this.currentSourcePosition.z, 2))
                particleProperties.particleRiseRate.add((targetPosition.z - this.currentSourcePosition.z) / targetDistance);
            }

        } else {
            angleOriginValue = this.currentSourcePosition.r
            axisElevationAngle = this.axisElevationAngle
        }

        const angleStartVal = particleProperties.particleAngle.computeValue(0, advancedVariable)
        const angleStart = angleStartVal + angleOriginValue;
        const radiusStart = particleProperties.particleRadius.computeValue(0, advancedVariable)

        const riseRateStartVal = particleProperties.particleRiseRate.computeValue(0, advancedVariable)
        const riseRate = Utils.handleFraction(riseRateStartVal);

        const particlePosition = GravitingParticle.computeParticlePosition(this.currentSourcePosition, radiusStart, angleStart * (Math.PI / 180), riseRate, axisElevationAngle);
        const startSizeInput = particleProperties.particleSize.computeValue(0, advancedVariable)
        const rotationStartInput = particleProperties.particleRotation.computeValue(0, advancedVariable)
        const colorStartInput = particleProperties.particleColor.computeValue(0, advancedVariable)

        if (rotationStartInput && typeof rotationStartInput.add === 'function') {
            rotationStartInput.add(angleOriginValue);
        }

        const sprite = this.initSprite(
            particlePosition,
            startSizeInput,
            rotationStartInput,
            colorStartInput
        )

        return new GravitingParticle({
            sprite,
            center: this.onlyEmitterFollow ? this.currentSourcePosition : source,
            particleLifetime: Utils.getRandomValueFrom(this.particleLifetime, advancedVariable),
            elevationStart: particlePosition.z,
            axisElevationAngle,
            particleRiseRate: particleProperties.particleRiseRate,
            angle: angleStart,
            angularVelocity: particleProperties.angularVelocity ?? particleProperties.particleVelocity,
            particleRadius: particleProperties.particleRadius,
            particleSize: particleProperties.particleSize,
            particleRotation: particleProperties.particleRotation.add(angleOriginValue),
            particleColor: particleProperties.particleColor,
            alpha: particleProperties.alpha,
            vibrationAmplitude: particleProperties.vibrationAmplitude,
            vibrationFrequency: particleProperties.vibrationFrequency
        },
            advancedVariable,
            this.isElevationManage
        );
    }
}