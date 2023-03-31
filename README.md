# foundryVTT-particule FX

Generate particule by script without needing video files.

To do it, you need to use a macro to call the function ```particuleEmitter.emitParticules``` with an input object of th parameter

## Input Parameter
This is all the input possible to use. If they are not provide a default value is use.
> If the value XXXend is not given, we use take the start value instead.

| Parameter name  | accepted value          | Default value |
| :--------------- |:---------------:| -----:|

|        spawningFrequence         |             Default pattern of number                                                              |    3        |
|        maxParticules             |             Default pattern of number                                                              |   100         |
|        positionSpawning          |             Object with x and y attributes with default pattern of number inside                   |   {x:0,y:0}   |
|        particuleVelocityStart    |             Default pattern of number                                                              |   200         |
|       particuleVelocityEnd       |             Default pattern of number                                                              |   50          |
|        particuleAngleStart       |             Default pattern of number                                                              |   '0_360'     |
|        particuleAngleEnd         |             Default pattern of number                                                              |   undefined   |
|        particuleSizeStart        |             Default pattern of number                                                              |   10          |
|        particuleSizeEnd          |             Default pattern of number                                                              |   '10_25'     |
|        particuleLifetime         |             Default pattern of number                                                              |    [1000,1500]    |
|        particuleColorStart       |             Object with x, y and z attributes with default pattern of number between 0 and 255     |   {x:250,y:250, z: 50}    |
|        particuleColorEnd         |             Object with x, y and z attributes with default pattern of number between 0 and 255     |   {x:250,y:'50_100', z: 0}    |
|        alphaStart                |             Default pattern of number between 0 and 1                                              |   1           |
|        alphaEnd                  |             Default pattern of number between 0 and 1                                              |   0           |


## Default pattern
For the majority of the parameter with can use multiple pattern
* Number (ex:9)                   : The direct value that are going to be used
* String (ex:'9')                 : The value is converted to Number before going to be used
* Array  (ex:[9,8,12])            : A random value of the array is going to be choosed, the value can be of default pattern too (ex: [9,'8','12_15'])
* Undescored String (ex:'9_14')   : A random value between the two inclusive boundary is going to be used