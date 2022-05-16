// @flow
import { getLocalVideoTrack } from "../base/tracks";
import {
    getLocalParticipant,
    getParticipantById,
    getRemoteParticipants,
} from "../base/participants";
import { getCurrentConference } from "../base/conference";
// import "image-capture";
import {
    ADD_EMOTION,
    SET_DETECTION_TIME_INTERVAL,
    START_EMOTION_RECOGNITION,
    STOP_EMOTION_RECOGNITION,
    DELETE_EMOTION,
    KEEP_SENDING,
    INIT_EMOTION,
} from "./actionTypes";
import { takePhoto, sendKeepAliveMessage } from "./functions";
import logger from "./logger";
import { io } from "socket.io-client";

/* Object containing  a image capture of the local track. */

let imageCapture;

/* Variable that keeps the interval for sending expressions to socket.io. */

let socketSendInterval;

/* Checks if any physicians still want the patient to send emotions. */

let shouldSendInterval;

/* Notifies subscribed patients that their emotions are still wanted. */

let keepAliveInterval;

let patientsSocket;

let physiciansSocket;

let jwtIdToId = {};

export function subscribeToAllEmotions() {
    return function (dispatch: Function, getState: Function) {
        const state = getState();
        const remoteParticipants = getRemoteParticipants(state);
        for (const participant of remoteParticipants) {
            console.assert(
                typeof participant[1].isPhysician === "boolean",
                "isPhysician is not boolean."
            );
            if (!participant[1].isPhysician) {
                enableParticipantEmotions(participant[1]);
            }
        }
    };
}

export function unsubscribeAllEmotions() {
    return function (dispatch: Function, getState: Function) {
        const state = getState();
        const { emotions } = state["features/emotion-recognition"];
        for (const jwtId in emotions) {
            const patient = getParticipantById(state, jwtIdToId[jwtId]);

            disableParticipantEmotions(patient);
        }
    };
}

/* Notifies Patient to connect to socketIO and subscribes to the results. */

export function enableParticipantEmotions(participant) {
    return function (dispatch: Function, getState: Function) {
        const state = getState();
        const conference = getCurrentConference(state);
        const jwtId = participant.jwtId;
        const patientId = participant.id;
        console.assert(jwtId, "Participant has no jwtId.");
        if (!physiciansSocket.connected) {
            physiciansSocket.connect();
        }

        if (jwtId) {
            physiciansSocket.emit("subscribe", jwtId);
            // dispatch(addEmotion(jwtId, ""));
            dispatch({
                type: INIT_EMOTION,
                patientId: jwtId,

            });
            jwtIdToId[jwtId] = patientId;
            sendKeepAliveMessage(conference, patientId);
        }
    };
}

/* Notifies Patient to disconnect from socketIO and unsubscribes from results. */

export function disableParticipantEmotions(participant) {
    return function (dispatch: Function, getState: Function) {
        const state = getState();
        const conference = getCurrentConference(state);
        const { emotions } = state["features/emotion-recognition"];
        console.assert(participant.jwtId, "Participant has no jwtId.");
        dispatch(deleteEmotion(participant.jwtId));
        if (Object.keys(emotions).length === 0) {
            physiciansSocket.disconnect();
        } else if (participant.jwtId) {
            physiciansSocket.emit("unsubscribe", participant.jwtId);
        }
    };
}

/* Starts the recognition and detection of emotions. */

export function startEmotionRecognition() {
    return async function (dispatch: Function, getState: Function) {
        const state = getState();
        const { recognitionActive } =
            state["features/emotion-recognition"];
        const { emotionUrl } = state["features/base/config"];
        // const jwt = state["features/base/jwt"];
        // const isPhysician = jwt?.isPhysician;
        const { isPhysician, jwtId } = getLocalParticipant(state);

        if (recognitionActive) {
            return;
        }

        if (typeof isPhysician !== "boolean") {
            logger.warn(
                "Failed to start emotion-recognition feature. User is not a patient or a physician"
            );
            return;
        }

        dispatch({ type: START_EMOTION_RECOGNITION });
        logger.log("Start emotion recognition feature");

        if (isPhysician) {
            physiciansSocket = io(`${emotionUrl}/physicians`, {
                autoConnect: false,
            });

            /* Listens to subscribed emotions on socketIO and adds them to state. */

            physiciansSocket.on("emotion", function (msg) {
                const { emotions } = getState()["features/emotion-recognition"];
                const emotion = JSON.parse(msg);
                const emotionIsSubscribed = emotions.hasOwnProperty(
                    emotion.userId
                );
                if (emotionIsSubscribed) {
                    dispatch(
                        addEmotion(emotion.userId, emotion.emotions.dominant)
                    );
                } else {
                    logger.warn(
                        "Reveived unwanted emotion. Should not happen regularly."
                    );
                }
            });

            /* Rejoins patient's socketIO-rooms when a socket disconnect was not explicit.
        This will continue the reception of their emotions.  */

            physiciansSocket.on("disconnect", (reason) => {
                const { emotions } = getState()["features/emotion-recognition"];

                if (
                    reason !== "io server disconnect" &&
                    reason !== "io client disconnect"
                ) {
                    for (const patientJwtId in emotions) {
                        physiciansSocket.emit("subscribe", patientJwtId);
                    }
                }
            });

            /* Orders every 50 seconds all subscribed patients to keep sending to socketIO. */

            keepAliveInterval = setInterval(() => {
                const state = getState();
                const { emotions } = state["features/emotion-recognition"];
                const { conference } = state["features/base/conference"];

                for (const jwtId in emotions) {
                    sendKeepAliveMessage(conference, jwtIdToId[jwtId]);
                }
            }, 50000);
        } else {
            patientsSocket = io(`${emotionUrl}/patients`, {
                autoConnect: false,
            });
            const localVideoTrack = getLocalVideoTrack(
                state["features/base/tracks"]
            );

            if (localVideoTrack !== undefined) {
                const stream = localVideoTrack.jitsiTrack.getOriginalStream();
                if (stream !== null) {
                    const firstVideoTrack = stream.getVideoTracks()[0];
                    // $FlowFixMe
                    imageCapture = new ImageCapture(firstVideoTrack);
                }
            }
        }
    };
}

/* Stops the recognition and detection of emotions by closing the socket and resetting variables. */

export function stopEmotionRecognition() {
    return function (dispatch: Function, getState: Function) {
        const state = getState();
        const { recognitionActive } = state["features/emotion-recognition"];

        if (!recognitionActive) {
            imageCapture = null;

            return;
        }
        imageCapture = null;
        jwtIdToId = {};
        if (patientsSocket) {
            patientsSocket.disconnect();
        }
        if (physiciansSocket) {
            physiciansSocket.off();
            physiciansSocket.sendBuffer = [];
            physiciansSocket.disconnect();
        }

        if (socketSendInterval) {
            clearInterval(socketSendInterval);
            socketSendInterval = null;
        }
        if (shouldSendInterval) {
            clearInterval(shouldSendInterval);
            shouldSendInterval = null;
        }
        if (keepAliveInterval) {
            clearInterval(keepAliveInterval);
            keepAliveInterval = null;
        }
        dispatch({ type: STOP_EMOTION_RECOGNITION });
        logger.log("Stop emotion recognition feature");
    };
}

/* Makes sure photos are sent to socketIO as long as at least one physician
showed interested in them within the last minute. */

export function keepSending() {
    return function (dispatch: Function, getState: Function) {
        const state = getState();
        const { conference } = state["features/base/conference"];
        const localParticipant = getLocalParticipant(state);

        if (!imageCapture || !conference || !localParticipant) {
            return;
        }

        if (!patientsSocket.connected) {
            patientsSocket.connect();
        }
        if (!socketSendInterval) {
            const state = getState();
            const { detectionTimeInterval } =
                state["features/emotion-recognition"];
            socketSendInterval = setInterval(async () => {
                if (imageCapture) {
                    const photo = await takePhoto(imageCapture);
                    patientsSocket.volatile.emit("image", {
                        userId: localParticipant.jwtId,
                        room: conference.sessionId,
                        image: photo,
                    });
                }
            }, detectionTimeInterval);
        }
        if (!shouldSendInterval) {
            shouldSendInterval = setInterval(() => {
                const state = getState();
                const { lastRequestTimestamp } =
                    state["features/emotion-recognition"];
                const lastRequestAge = Date.now() - lastRequestTimestamp;
                if (lastRequestAge > 60000) {
                    if (socketSendInterval) {
                        clearInterval(socketSendInterval);
                        socketSendInterval = null;
                    }
                    if (patientsSocket) {
                        patientsSocket.disconnect();
                    }
                }
            }, 60000);
        }
        dispatch({ type: KEEP_SENDING, timestamp: Date.now() });
    };
}

/* Resets the track in the image capture. */

export function resetTrack() {
    return function (dispatch: Function, getState: Function) {
        const state = getState();
        const { jitsiTrack: localVideoTrack } = getLocalVideoTrack(
            state["features/base/tracks"]
        );
        const stream = localVideoTrack.getOriginalStream();
        const firstVideoTrack = stream.getVideoTracks()[0];

        // $FlowFixMe
        imageCapture = new ImageCapture(firstVideoTrack);
    };
}

/* Changes the track from the image capture with a given one. */

export function changeTrack(track: Object) {
    const { jitsiTrack } = track;
    const stream = jitsiTrack.getOriginalStream();
    const firstVideoTrack = stream.getVideoTracks()[0];

    // $FlowFixMe
    imageCapture = new ImageCapture(firstVideoTrack);
}

/* Clears the interval for sending photos to socketIO so that a new sending frequency will be used. */

function setDetectionTimeInterval(time: number) {
    if (socketSendInterval) {
        clearInterval(socketSendInterval);
        socketSendInterval = null;
    }
    return {
        type: SET_DETECTION_TIME_INTERVAL,
        time,
    };
}

/* Effectively subscribes to a patient by adding his token userId (jwtId) to state. */

function addEmotion(patientId, emotion) {
    return function (dispatch: Function, getState: Function) {
        const timestamp = Date.now();
        dispatch({
            type: ADD_EMOTION,
            patientId,
            emotion,
            timestamp
        });
    };
}

/* Effectively unsubscribes from a patient by removing his token userId (jwtId)  from state. */

export function deleteEmotion(patientId) {
    return function (dispatch: Function, getState: Function) {
        dispatch({
            type: DELETE_EMOTION,
            patientId,
        });
    };
}
