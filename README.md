# foundryVTT-particule FX

Generate particule by script without needing video files.

## Spray particule
To emit spraying particule, you need to use a macro to call the function ```particuleEmitter.sprayParticules``` with an input object with the following parameters :

### Input Parameter
This is all the input possible to use. If they are not provide a default value is use.
> If the value XXXend is not given, we use take the start value instead.

| Parameter name  | accepted value          | Default value |
| :--------------- |:---------------:| -----:|
|        source                    |             Placeable object id or an object with x and y attributes with default pattern inside                                                                        |    {x:0,y:0}          |
|        target                    |             Placeable object id or an object with x and y attributes with default pattern inside                                                                        |    undefined         |
|        spawningFrequence         |             Number                                                                       |    3          |
|        maxParticules             |             Number                                                                       |   100         |
|        emissionDuration          |             Number                                                                       |   loop infinitely if undefined       |
|        positionSpawning          |             Object with x and y attributes with default pattern inside                   |   {x:0,y:0}   |
|        particuleVelocityStart    |             Default pattern                                                              |   200         |
|       particuleVelocityEnd       |             Default pattern                                                              |   50          |
|        particuleAngleStart       |             Default pattern                                                              |   '0_360'     |
|        particuleAngleEnd         |             Default pattern                                                              |   undefined   |
|        particuleSizeStart        |             Default pattern of number or object with x and y                             |   10          |
|        particuleSizeEnd          |             Default pattern of number or object with x and y                             |   '10_25'     |
|        particuleRotationStart    |             Default pattern                                                              |   0           |
|        particuleRotationEnd      |             Default pattern                                                              |   0           |
|        particuleLifetime         |             Default pattern                                                              |    [1000,1500]    |
|        particuleColorStart       |             Object with x, y and z attributes with default pattern between 0 and 255     |   {x:250,y:250, z: 50}    |
|        particuleColorEnd         |             Object with x, y and z attributes with default pattern between 0 and 255     |   {x:250,y:'50_100', z: 0}    |
|        alphaStart                |             Default pattern between 0 and 1                                              |   1           |
|        alphaEnd                  |             Default pattern between 0 and 1                                              |   0           |
|        vibrationAmplitudeStart   |             Default pattern between 0 and 1                                              |   1           |
|        vibrationAmplitudeEnd     |             Default pattern between 0 and 1                                              |   0           |
|        vibrationFrequencyStart   |             Default pattern between 0 and 1                                              |   1           |
|        vibrationFrequencyEnd     |             Default pattern between 0 and 1                                              |   0           |

### Default pattern
For the majority of the parameter with can use multiple pattern
* Number (ex:9)                   : The direct value that are going to be used
* String (ex:'9')                 : The value is converted to Number before going to be used
* Array  (ex:[9,8,12])            : A random value of the array is going to be choosed, the value can be of default pattern too (ex: [9,'8','12_15'])
* Undescored String (ex:'9_14')   : A random value between the two inclusive boundary is going to be used


## Graviting particule
To emit graviting particule, you need to use a macro to call the function ```particuleEmitter.gravitateParticules``` with an same input as Spray particule exept :
* particuleVelocityStart and particuleVelocityEnd is interpreted as angular velocity in degree
* particuleAngleStart define now the position where the particule appear around positionSpawning
* particuleAngleEnd did not exist
* particuleRadiusStart is a new parameter exclusive to Graviting particule and accept default pattern. It define the distance between the positionSpawning and the particule at the start
* particuleRadiusEnd is a new parameter exclusive to Graviting particule and accept default pattern. It define the distance between the positionSpawning and the particule at the end
* onlyEmitterFollow 


## Stop all emission
To stop all emission, you need to use a macro to call the function ```particuleEmitter.stopAllEmission``` with a boolean parameter for immediate deletion.


## Stop a specific emission
//Id of emission or 'l'/'last' or 'f'/'first'
particuleEmitter.stopEmissionById('l')

To stop all emission, you need to use a macro to call the function ```particuleEmitter.stopEmissionById``` with with a id parameter :
* id of the emission
* 'l' or 'last' for newest emission
* 'f' or 'first' for oldest emission

An other boolean parameter for immediate deletion


## Prefill template
The methods emitting particules can be call with prefill template. It exist two kind of template **prefillMotionTemplate** and **prefillColorTemplate** that can be combine. If you do so, your input are going to override the attribute of the prefills templates but the prefills templates will use as defaults values.
The order of the paramater is not important, ```emit('prefillMotionTemplate', 'prefillColorTemplate', {position: {x:100, y:'50_100'}})``` is the same as ```emit('prefillColorTemplate', {position: {x:100, y:'50_100'}}, 'prefillMotionTemplate')```

### Prefill motion template :
* explosion (designed for spray)
* breath (designed for spray)
* ray (designed for spray)
* vortex (designed for gravitate)
* aura (designed for gravitate)
* satellite (designed for gravitate)
* slash (designed for gravitate)

### Existing color template :
* ice
* fire
* light
* death
* poison
* silver


## Call by chat
You can stop emmission by chat with command "/pfx"
It's result on a message response in the chat

Commands :
* /pfx stopAll
* /pfx stopById *id* 
* /pfx spray *prefillMotionTemplate* *prefillColorTemplate*
* /pfx gravitate *prefillMotionTemplate* *prefillColorTemplate*
* /pfx help


We can add the param *--instant* to not wait the end of the particules lifetime


## Measured template source
If the source is a measured template, it will override some input property (like angle) to match with the measured tools. For each, measured it work differently if the average velocity value
| Measured template  | Positive velocity | Null velocity | Negative Velocity |
| :--------------- |:---------------:| :----------:| :------------:|
| Circle | Emit from the center to the outside of the circle | Emit from the outside to the center of the circle | Appear every where in the circle | 
| Cone | Emit from the center to the outside of the cone | Emit from the outside to the center of the cone | Appear every where in the cone | 
| Rectangle | Emit from the center to the outside of the rectangle | Emit from the outside to the center of the rectangle | Appear every where in the rectangle | 
| Ray | Emit from the source to the opposite of the ray | Emit from the sopposite to the source of the ray | Appear every where in the ray | 