# foundryVTT-particule FX

The module allow to generate particules using a json input and a method to define the mode of emission. The particules are a simple sprite texture moving by script, no need of video files.

Note that the emitter neither as the particule is persist. If you reload the page or change scene it disappear.


## Input Parameter
The input is a json file with the following paramater. If the parameter is not define in the input, the script take the default value.
This is all the input possible to use.
> Noticed that if the value XXXend is not given, we use take the start value instead.

| Parameter name  | accepted value          |  Description          | Default value |
| :--------------- |:---------------:|:---------------:| -----:|
|        source                    |             Placeable object id or an object with x and y attributes with default pattern inside   | Source of the emission if it's a placeable object id, the source is the center of the object and it follow the object  |  {x:0,y:0}  |
|        maxParticules             |   Number                | Max particule allow at the same time for the emitter, if exceed we waiting for a particule to end before emitting another one               |   1000         |
|        spawningFrequence         |   Number                | Frequence between each emission                                |    3          |
|        spawningNumber            |   Number                | Number of particule emit at during each frequence              |    1          |
|        emissionDuration          |   Number                | End particule emission at the end of the duration              |   loop infinitely if undefined       |
|        particuleVelocityStart    |   Default pattern       | Velocity of the particule at the spawning (in px/sec)          |   200%        |
|        particuleVelocityEnd      |   Default pattern       | Velocity of the particule at his end (in px/sec)               |   50%         |
|        particuleSizeStart        |   Default pattern of number or object with x and y | Size of the particule at the spawning (in px)       |   10          |
|        particuleSizeEnd          |   Default pattern of number or object with x and y | Size of the particule at his end (in px)            |   '10_25'     |
|        particuleRotationStart    |   Default pattern       | Rotation of the particule at the spawning (in degree)          |   0           |
|        particuleRotationEnd      |   Default pattern       | Rotation of the particule at his end (in degree)               |   0           |
|        particuleLifetime         |   Default pattern       | Duration of each particule (in millisec)                       |  [3500,4500]  |
|        particuleColorStart       |   Object with x, y and z attributes with default pattern between 0 and 255               | Color of the particule at the spawning (in rgb (0 to 255))                |   {x:250,y:250, z: 50}      |
|        particuleColorEnd         |   Object with x, y and z attributes with default pattern between 0 and 255               | Color of the particule at his end (in rgb (0 to 255))                    |   {x:250,y:'50_100', z: 0}  |
|        alphaStart                |   Default pattern between 0 and 1   | Alpha color of the particule at the spawning       |   1           |
|        alphaEnd                  |   Default pattern between 0 and 1   | Alpha color of the particule at his end            |   0           |
|        vibrationAmplitudeStart   |   Default pattern between 0 and 1   | Amplitude of vibration in perpendicular direction of velocity at the spawning (in px)                                |   0           |
|        vibrationAmplitudeEnd     |   Default pattern between 0 and 1   | Amplitude of vibration in perpendicular direction of velocity at his end (in px)                                |   0           |
|        vibrationFrequencyStart   |   Default pattern between 0 and 1   | Frequence of vibration in perpendicular direction of velocity at the spawning (in milli-sec)                         |   0           |
|        vibrationFrequencyEnd     |   Default pattern between 0 and 1   | Frequence of vibration in perpendicular direction of velocity at his end (in milli-sec)                         |   0           |


## Emission method by script
The emission method is use to interpret the input and manage the particule during it lifetime


### Spray particule
The spray particule is emit from a source and move with a velocity in a direction define by an angle
[](doc/pfx-spray-Animation.gif)

To emit spraying particules, you need to use a macro to call the function ```particuleEmitter.sprayParticules``` with an input object with the default input parameter and following one :

| Parameter name  | accepted value          |  Description          | Default value |
| :--------------- |:---------------:|:---------------:| -----:|
|  target               |  Placeable object id or an object with x and y attributes with default pattern inside | The target of the emission, it use to change the angle of the direction and prolonge lifetime of the particules     |    undefined         |
|  positionSpawning     |  Object with x and y attributes with default pattern inside  | Gap coordinate between source and the real position spawning of the particule (in px)                 |  {x:0,y:0}        |
|  particuleAngleStart  |  Default pattern  | Direction of the particule at the spawning (in degree)    |   '0_360'     |
|  particuleAngleEnd    |  Default pattern  | Direction of the particule at his end (in degree)         |   undefined   |


### Graviting particule
The graviting particule turn around the source with a velocity at a distance define by a radius
[](doc/pfx-gravitate-Animation.gif)

To emit graviting particule, you need to use a macro to call the function ```particuleEmitter.gravitateParticules```with an input object with the default input parameter and following one :

> In this methode the particuleVelocityStart and particuleVelocityEnd is an angularVelocity (degree/sec)

| Parameter name  | accepted value          |  Description          | Default value |
| :--------------- |:---------------:|:---------------:| -----:|
|  particuleAngleStart  |  Default pattern  | Angle where the particule spawn (in degree)                                        |   '0_360'     |
|  particuleRadiusStart |  Default pattern  | Distance between particule and source at the spawning (in px)                      |   '100%'      |
|  particuleRadiusEnd   |  Default pattern  | Distance between particule and source at his end (in px)                           |   '50%'       |
|  onlyEmitterFollow    |  boolean          | If true only new particule is emit from the new position of the source if it move  |   false       |


### Missile particule
Missile particule emit a spray particule that is use to emit sub particules
[](doc/pfx-missile-Animation.gif)

To emit missille particule, you need to use a macro to call the function ```particuleEmitter.missileParticules``` with an same input as Spray particule with ```subParticules``` containing another input (spray or Graviting) and type (equal to "Spraying" or "Graviting")


## Default pattern
For the majority of the parameter with can use multiple pattern
* Number (ex:9)                   : The direct value that are going to be used
* String (ex:'9')                 : The value is converted to Number before going to be used
* Percent (ex:'9%')               : The value is multiply by the grid pixel before going to be used (ex: if grid size is 50px, '10%' become 5px )
* Array  (ex:[9,8,12])            : A random value of the array is going to be choosed, the value can be of default pattern too (ex: [9,'8','12_15'])
* Undescored String (ex:'9_14')   : A random value between the two inclusive boundary is going to be used


## Stop all emissions
To stop all emissions, you need to use a macro to call the function ```particuleEmitter.stopAllEmission``` with a boolean parameter for immediate deletion.


## Stop a specific emission
To stop a specific emission, you need to use a macro to call the function ```particuleEmitter.stopEmissionById``` with with a id parameter :
* id of the emission
* 'l' or 'last' for newest emission
* 'f' or 'first' for oldest emission

An other boolean parameter for immediate deletion


## Prefill template
The methods emitting particules can be call with prefill template. It exist two kind of template **prefillMotionTemplate** and **prefillColorTemplate** that can be combine. If you do so, your input are going to override the attribute of the prefills templates but the prefills templates will use as defaults values.
The order of the paramater is not important, ```emit('prefillMotionTemplate', 'prefillColorTemplate', {position: {x:100, y:'50_100'}})``` is the same as ```emit('prefillColorTemplate', {position: {x:100, y:'50_100'}}, 'prefillMotionTemplate')```

### Prefill motion template :
**explosion (designed for spray)**
[](doc/pfx-spray-explosion-Animation.gif)

**breath (designed for spray)**
[](doc/pfx-spray-breath-Animation.gif)

**ray (designed for spray)**
[](doc/pfx-spray-ray-Animation.gif)

**trail (designed for missile)**
[](doc/pfx-missile-trail-Animation.gif)

**wave (designed for missile)**
[](doc/pfx-missile-wave-Animation.gif)

**grow (designed for missile)**
[](doc/pfx-missile-grow-Animation.gif)

**vortex (designed for gravitate)**
[](doc/pfx-gravitate-vortex-Animation.gif)

**aura (designed for gravitate)**
[](doc/pfx-gravitate-aura-Animation.gif)

**satellite (designed for gravitate)**
[](doc/pfx-gravitate-satellite-Animation.gif)

**slash (designed for gravitate)**
[](doc/pfx-gravitate-slash-Animation.gif)


### Existing color template :
**ice**
[](doc/pfx-ice-Animation.gif)

**fire**
[](doc/pfx-fire-Animation.gif)

**light**
[](doc/pfx-light-Animation.gif)

**death**
[](doc/pfx-death-Animation.gif)

**poison**
[](doc/pfx-poison-Animation.gif)

**silver**
[](doc/pfx-silver-Animation.gif)

**cyber**
[](doc/pfx-cyber-Animation.gif)


## Call by chat
You can start orstop emission by chat with command "/pfx"
It's result on a message response in the chat

Commands :
* /pfx stopAll
* /pfx stopById *id* 
* /pfx spray *prefillMotionTemplate* *prefillColorTemplate*
* /pfx gravitate *prefillMotionTemplate* *prefillColorTemplate*
* /pfx missile *prefillMotionTemplate* *prefillColorTemplate*
* /pfx help

> For stop commands, you can add the param *--instant* to not wait the end of the particules lifetime


## Measured template source
If the source is a measured template, it will override some input property (like angle) to match with the measured tools. For each, measured it work differently if the average velocity value
| Measured template  | Positive velocity | Null velocity | Negative Velocity |
| :--------------- |:---------------:| :----------:| :------------:|
| Circle | Emit from the center to the outside of the circle | Emit from the outside to the center of the circle | Appear every where in the circle | 
| Cone | Emit from the center to the outside of the cone | Emit from the outside to the center of the cone | Appear every where in the cone | 
| Rectangle | Emit from the center to the outside of the rectangle | Emit from the outside to the center of the rectangle | Appear every where in the rectangle | 
| Ray | Emit from the source to the opposite of the ray | Emit from the sopposite to the source of the ray | Appear every where in the ray | 
