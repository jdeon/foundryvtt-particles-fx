# foundryVTT-particles FX

The module contains several methods to generate particles without needing premade video files. The particles are simples sprites textures managed by script, you can use or add some prefill templates for the emitter or customize it with a json input.

<br><img width="30%" src="doc/pfx-spray-breath-Animation.gif"><br>
*particlesFx.sprayParticles('breath', {source :token.id, target: target.id} )*<br>
<br>


## What's new
v2.1.0 : We add advanced mode to link multiple input together and change the static value with dynamic function

## Settings
1. Avoid showing particle from other client (useful for minimal configuration) (Client setting)
2. Save emitters when changing scene and retrieve when returning (World setting)
3. Define minimal user role to manage the custom prefill templates (World setting)

<br>

## Emission methods
The emission methods is used to interpret the input and manage the particles during their lifetime.
The method returns its id.


### Spray particles
The spray particles are emitted from a source and move with a velocity in a direction define by an angle.

![](pfx-spray-Animation.gif)

### Graviting particles
The graviting particles turn around the source with a velocity at a distance defined by a radius.

![](pfx-gravitate-Animation.gif)


### Missile particles
The missile method emits a spray particles that is used to emit sub particles.

![](pfx-missile-Animation.gif)


### Stop all emissions
To stop all emissions in the scene and reset the particle emitters ids index.


### Stop a specific emission
To stop a specific emission, you need to use a macro to call the method ```particlesFx.stopEmissionById``` with an id parameter :
* id of the emission (returned by the method)
* 'l' or 'last' for newest emission
* 'f' or 'first' for oldest emission

And a boolean parameter, true for instant delete of particles already emitted, false to stop only the emission (living particles are not killed).

<br>

## How to call it

### Call by chat
You can start or stop emission by chat with command "/pfx".
It adds a message response in the chat.

Commands :
* /pfx stopAll
* /pfx stopById *id* 
* /pfx spray *prefillMotionTemplate* *prefillColorTemplate*
* /pfx gravitate *prefillMotionTemplate* *prefillColorTemplate*
* /pfx missile *prefillMotionTemplate* *prefillColorTemplate*
* /pfx help

```/pfx spray ray death```

> To stop a command, you can add the param *--instant* to not have to wait the end of the particles lifetime.

### Call by script
* To emit spray particles, you need to use a macro to call the method ```particlesFx.sprayParticles(prefillMotionTemplateName, prefillColorTemplate, {Advanced options})``` 
* To emit graviting particles, you need to use a macro to call the method ```particlesFx.gravitateParticles(prefillMotionTemplateName, prefillColorTemplate, {Advanced options})``` 
* To emit missile particles, you need to use a macro to call the method ```particlesFx.missileParticles(prefillMotionTemplateName, prefillColorTemplate, {Advanced options})```.  Advanced options has the same input as Spray particles with a nested object ```subParticles``` containing another input (spray or graviting) and type (equals to "Spraying" or "Graviting").
* Write a message to describe the emitter and a button to stop it ```particlesFx.writeMessageForEmissionById(emitterId, isVerbal)```. isVerbal parameter also write advanced input in the message
* To stop all emissions, you need to use a macro to call the method ```particlesFx.stopAllEmission(instantDelete)```.  instantDelete is a boolean parameter, if true, it delete all particles already emitted, false to stop only the emission (living particles are not killed).
* To stop a specific emission, you need to use a macro to call the method ```particlesFx.stopEmissionById(id)```. Id is a number or a string :
  * id of the emission (returned by the method)
  * 'l' or 'last' for newest emission
  * 'f' or 'first' for oldest emission

> **Example**
> To emit a missile particles with graviting sub particles that forming a trail 
> ```particlesFx.missileParticles({source : {x:200, y:250} , target: token.id, subParticles : { type: "Graviting", particleLifetime: 1000, onlyEmitterFollow : true, particleAngleStart: '0_360'}})```

#### Apis methods
All this methods can also be calls with the modules API 'game.modules.get("particule-fx").api' with the same parameters and behaviour:
* xxx.api.emit.spray(xxx)
* xxx.api.emit.gravit(xxx)
* xxx.api.emit.missile(xxx)
* xxx.api.emit.writeMessage(xxx)
* xxx.api.emit.stopAll(xxx)
* xxx.api.emit.stop(xxx)


<br>

## Prefill template
The method emitting particles can be called with a prefill template. They are two kinds of template **prefillMotionTemplate** and **prefillColorTemplate** which can be combined. You can add an input to override some attributes of the prefill template.
The order of the paramater is not important, for example ```particlesFx.sprayParticles('prefillMotionTemplate', 'prefillColorTemplate', {position: {x:100, y:'50_100'}})``` is the same as ```particlesFx.sprayParticles('prefillColorTemplate', {position: {x:100, y:'50_100'}}, 'prefillMotionTemplate')```

**Prefill motion template :**
* explosion (designed for spray)
* breath (designed for spray)
* ray (designed for spray)
* sonar (designed for spray)
* trail (designed for missile)
* wave (designed for missile)
* grow (designed for missile)
* vortex (designed for gravitate)
* aura (designed for gravitate)
* satellite (designed for gravitate)
* slash (designed for gravitate)

*Example*
```particlesFx.missileParticles('wave', {source :token.id, target: target.id} )```
<br><img width="30%" src="pfx-missile-wave-Animation.gif"><br>


**Prefill color template :**
* ice
* fire
* light
* death
* poison
* silver
* cyber

*Example*
```/pfx spray breath fire```
<br><img width="30%" src="pfx-fire-Animation.gif"><br>

## More details in the readme
To do more advanced thing please read the ![WIKI](https://github.com/jdeon/foundryvtt-particles-fx/wiki) for more details :
* More example of how to use the module
* Add and manage custom prefill template
* Particular behavior of measured template as source
* Custom all the parameters of the emitter to get exacly the animation you want

## V2 Breaking change
With the v2.0.0, all words containing particule has been rename particle. And the object exposing the modules methods (particuleEmitter) has been renamed particlesFx .

A compatibility management has been add with warning to show the bad names.