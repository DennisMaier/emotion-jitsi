# emotion-jitsi

## Quickinstall

Visit [docker-jitsi-meet_emotion](https://github.com/ThomasFen/docker-jitsi-meet_emotion) and follow the instruction.

## From source
Execute the following commands in the corresponding folders.

Sample patient login:
name:patient 
password: patient

Sample physician login:
name:physician
password:physician

keycloak admin login:
name:admin
password:admin

**[Optional] cd ./jitsi-meet_emotion folder**

Starts a webpack dev server. 

1. `npm install` 

2. `make dev`

**cd ./docker-jitsi_emotion**


3. Adjust `PUBLIC_URL` and `DOCKER_HOST_ADDRESS` in `.env` and set `JITSI_PUB_URL` in docker-compose to `JITSI_PUB_URL` in case the last step (webpack dev server) was omitted.

Start all backend docker containers; except for Redis and socket.IO (for now).

4. Adjust environment variables in rebuild_backend.sh and run ``./rebuild_backend.sh``


**cd ./redis_emotion**

Required (for now): `redis-cli` and `gears-cli`. 

Run the Redis docker image.

5. `docker run -p 6379:6379 --name <container-name>   redislabs/redismod`

Load BlazeFace into Redis.

6. `cat face_detection_back.tflite | redis-cli -x AI.MODELSTORE blazeface_back TFLITE CPU BLOB`


Load the Emotion model into Redis (has been converted to ONNX before).

7. `cat emotion.onnx | redis-cli -x AI.MODELSTORE emotion ONNX CPU BLOB`

Load the gear into Redis.

8. `gears-cli run gear.py --requirements requirements.txt`

**cd ./socketio_emotion**

Starts socket.IO server.

9. `node index.js`

Emotion-Jitsi can be accessed at `PUBLIC_URL` or `127.0.0.1:8081` (webpack dev server). 

## Usage
