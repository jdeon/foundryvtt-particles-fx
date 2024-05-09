# foundryVTT-particles FX

The module contains several methods to generate particles without needing premade video files. The particles are simple sprite textures managed by script. You can use or add some prefill templates for the emitter or customize it with a JSON input.

![Spray animation](doc/pfx-spray-breath-Animation.gif)
*particlesFx.sprayParticles('breath', {source: token.id, target: target.id})*

## What's New
- **v2.1.0**: We added advanced mode to link multiple inputs together and change the static value with dynamic functions.

## Settings
1. Avoid showing particle from other client (useful for minimal configuration) (Client setting)
2. Save emitters when changing scene and retrieve when returning (World setting)
3. Define minimal user role to manage the custom prefill templates (World setting)

## Emission Methods
The emission methods are used to interpret the input and manage the particles during their lifetime. The method returns its ID.

### Spray Particles
Spray particles are emitted from a source and move with a velocity in a direction defined by an angle.

![Spray animation](pfx-spray-Animation.gif)

### Graviting Particles
Gravitating particles turn around the source with a velocity at a distance defined by a radius.

![Gravitate animation](pfx-gravitate-Animation.gif)

### Missile Particles
The missile method emits spray particles that are used to emit sub-particles.

![Missile animation](pfx-missile-Animation.gif)

### Stop All Emissions
To stop all emissions in the scene and reset the particle emitter's IDs index.

### Stop a Specific Emission
To stop a specific emission, you need to use a macro to call the method `particlesFx.stopEmissionById` with an ID parameter:
- ID of the emission (returned by the method)
- 'l' or 'last' for newest emission
- 'f' or 'first' for oldest emission
And a boolean parameter, `true` for instant deletion of particles already emitted, `false` to stop only the emission (living particles are not killed).

## How to Call It

### Call by Chat
You can start or stop emission by chat with the command "/pfx".
It adds a message response in the chat.

Commands:
- `/pfx stopAll`
- `/pfx stopById *id*`
- `/pfx spray *prefillMotionTemplate* *prefillColorTemplate*`
- `/pfx gravitate *prefillMotionTemplate* *prefillColorTemplate*`
- `/pfx missile *prefillMotionTemplate* *prefillColorTemplate*`
- `/pfx help`

```/pfx spray ray death```

> To stop a command, you can add the param *--instant* to not have to wait the end of the particles lifetime.

### Call by Script

- To emit spray particles, you need to use a macro to call the method `particlesFx.sprayParticles(prefillMotionTemplateName, prefillColorTemplate, {Advanced options})`
- To emit gravitating particles, you need to use a macro to call the method `particlesFx.gravitateParticles(prefillMotionTemplateName, prefillColorTemplate, {Advanced options})`
- To emit missile particles, you need to use a macro to call the method `particlesFx.missileParticles(prefillMotionTemplateName, prefillColorTemplate, {Advanced options})`. Advanced options have the same input as Spray particles with a nested object `subParticles` containing another input (spray or gravitating) and type (equals to "Spraying" or "Graviting").
- Write a message to describe the emitter and a button to stop it `particlesFx.writeMessageForEmissionById(emitterId, isVerbal)`. The `isVerbal` parameter also writes advanced input in the message.
- To stop all emissions, you need to use a macro to call the method `particlesFx.stopAllEmission(instantDelete)`. `instantDelete` is a boolean parameter, if true, it deletes all particles already emitted, false to stop only the emission (living particles are not killed).
- To stop a specific emission, you need to use a macro to call the method `particlesFx.stopEmissionById(id)`. ID is a number or a string:
  - ID of the emission (returned by the method)
  - 'l' or 'last' for the newest emission
  - 'f' or 'first' for the oldest emission

> **Example**
> To emit missile particles with gravitating sub particles that form a trail 
> `particlesFx.missileParticles({source: {x:200, y:250}, target: token.id, subParticles: {type: "Gravitating", particleLifetime: 1000, onlyEmitterFollow: true, particleAngleStart: '0_360'}})`

#### APIs Methods

All these methods can also be called with the module's API `game.modules.get("particule-fx").api` with the same parameters and behavior:
- `xxx.api.emit.spray(xxx)`
- `xxx.api.emit.gravit(xxx)`
- `xxx.api.emit.missile(xxx)`
- `xxx.api.emit.writeMessage(xxx)`
- `xxx.api.emit.stopAll(xxx)`
- `xxx.api.emit.stop(xxx)

## Prefill Template

The method emitting particles can be called with a prefill template. There are two kinds of templates: **prefillMotionTemplate** and **prefillColorTemplate**, which can be combined. You can add an input to override some attributes of the prefill template. The order of the parameters is not important.

**Prefill Motion Template:**
- explosion (designed for spray)
- breath (designed for spray)
- ray (designed for spray)
- sonar (designed for spray)
- trail (designed for missile)
- wave (designed for missile)
- grow (designed for missile)
- vortex (designed for gravitate)
- aura (designed for gravitate)
- satellite (designed for gravitate)
- slash (designed for gravitate)

*Example*
```particlesFx.missileParticles('wave', {source: token.id, target: target.id})```

![Wave Animation](pfx-missile-wave-Animation.gif)

**Prefill Color Template:**
- ice
- fire
- light
- death
- poison
- silver
- cyber

*Example*
```/pfx spray breath fire```

![Fire Animation](pfx-fire-Animation.gif)

## More Details in the Readme
For more advanced functionality, please read the [WIKI](https://github.com/jdeon/foundryvtt-particles-fx/wiki) for more details:
- More examples of how to use the module
- Add and manage custom prefill templates
- Particular behavior of measured templates as a source
- Customize all the parameters of the emitter to get exactly the animation you want

## V2 Breaking Change

With the v2.0.0, all words containing particle have been renamed particle. And the object exposing the module's methods (particleEmitter) has been renamed particlesFx.

A compatibility management has been added with warnings to show the bad names.
