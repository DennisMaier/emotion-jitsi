import { ReducerRegistry } from "../base/redux";

import {
    ADD_EMOTION,
    DELETE_EMOTION,
    SET_DETECTION_TIME_INTERVAL,
    START_EMOTION_RECOGNITION,
    STOP_EMOTION_RECOGNITION,
    KEEP_SENDING,
    INIT_EMOTION
} from "./actionTypes";
import {
    EMOTION_SURPRISE,
    EMOTION_NEUTRAL,
    EMOTION_SAD,
    EMOTION_FEAR,
    EMOTION_DISGUST,
    EMOTION_CONTEMPT,
    EMOTION_ANGER,
    EMOTION_HAPPY,
} from "./constants";
const defaultState = {
    emotions: {},
    emotionHistory: {},
    detectionTimeInterval: 1000,
    recognitionActive: false,
    lastRequestTimestamp: 0,
};

ReducerRegistry.register(
    "features/emotion-recognition",
    (state = defaultState, action) => {
        switch (action.type) {
            case INIT_EMOTION: {
                return {
                    ...state,
                    emotions: {
                        ...state.emotions,
                        [action.patientId]: "",
                    },
                    emotionHistory: {
                        ...state.emotionHistory,
                        [action.patientId]: {
                            [EMOTION_HAPPY]: [],
                            [EMOTION_ANGER]: [],
                            [EMOTION_CONTEMPT]: [],
                            [EMOTION_DISGUST]: [],
                            [EMOTION_FEAR]: [],
                            [EMOTION_SAD]: [],
                            [EMOTION_NEUTRAL]: [],
                            [EMOTION_SURPRISE]: [],
                        },
                    },
                };
            }
            case ADD_EMOTION: {
                return {
                    ...state,
                    emotions: {
                        ...state.emotions,
                        [action.patientId]: action.emotion,
                    },
                    emotionHistory: {
                        ...state.emotionHistory,
                        [action.patientId]: {
                            ...state.emotionHistory[action.patientId],
                            [action.emotion]: [
                                ...state.emotionHistory[action.patientId][
                                    action.emotion
                                ],
                                action.timestamp,
                            ],
                        },
                    },
                };
            }

            case DELETE_EMOTION: {
                const newEmotions = { ...state.emotions };
                delete newEmotions[action.patientId];
                return {
                    ...state,
                    emotions: newEmotions,
                };
            }

            case KEEP_SENDING: {
                return {
                    ...state,
                    lastRequestTimestamp: action.timestamp,
                };
            }

            case SET_DETECTION_TIME_INTERVAL: {
                return {
                    ...state,
                    detectionTimeInterval: action.time,
                };
            }
            case START_EMOTION_RECOGNITION: {
                return {
                    ...state,
                    recognitionActive: true,
                };
            }

            case STOP_EMOTION_RECOGNITION: {
                return {
                    ...state,
                    emotions: {},
                    recognitionActive: false,
                };
            }
        }

        return state;
    }
);
