// @flow

import {
    CONFERENCE_JOINED,
    CONFERENCE_WILL_LEAVE,
    getCurrentConference,
} from "../base/conference";
import {
    getLocalParticipant,
    getParticipantById,
    PARTICIPANT_LEFT,
} from "../base/participants";
import { MiddlewareRegistry } from "../base/redux";
import { TRACK_UPDATED, TRACK_ADDED, TRACK_REMOVED } from "../base/tracks";
import { VIRTUAL_BACKGROUND_TRACK_CHANGED } from "../virtual-background/actionTypes";

import {
    changeTrack,
    resetTrack,
    stopEmotionRecognition,
    startEmotionRecognition,
    keepSending,
    deleteEmotion,
} from "./actions";
import { KEEP_SENDING } from "./actionTypes";
import { ENDPOINT_MESSAGE_RECEIVED } from "../subtitles/actionTypes";

MiddlewareRegistry.register(({ dispatch, getState }) => (next) => (action) => {
    const state = getState();
    const { enableEmotionRecognition, emotionUrl } =
        state["features/base/config"];
    // const jwt = state["features/base/jwt"];
    // const isPhysician = jwt?.isPhysician;

    if (!enableEmotionRecognition || !emotionUrl) {
        return next(action);
    }
    if (action.type === CONFERENCE_JOINED) {
        dispatch(startEmotionRecognition());

        return next(action);
    }
    if (!getCurrentConference(getState())) {
        return next(action);
    }

    switch (action.type) {
        case CONFERENCE_WILL_LEAVE: {
            dispatch(stopEmotionRecognition());

            return next(action);
        }
        case ENDPOINT_MESSAGE_RECEIVED: {
            return _endpointMessageReceived(
                { dispatch, getState },
                next,
                action
            );
        }

        case TRACK_UPDATED: {
            const state = getState();
            const { isPhysician } = getLocalParticipant(state);
            const { videoType, type } = action.track.jitsiTrack;

            if (videoType === "camera" && isPhysician === false) {
                const { muted, videoStarted } = action.track;

                if (videoStarted === true) {
                    dispatch(startEmotionRecognition());
                }
                if (muted !== undefined) {
                    if (muted) {
                        dispatch(stopEmotionRecognition());
                    } else {
                        dispatch(startEmotionRecognition());
                        type === "presenter" && changeTrack(action.track);
                    }
                }
            }

            return next(action);
        }
        case TRACK_ADDED: {
            const { mediaType, videoType } = action.track;
            const state = getState();
            const { isPhysician } = getLocalParticipant(state);
            if (
                mediaType === "presenter" &&
                videoType === "camera" &&
                isPhysician === false
            ) {
                dispatch(startEmotionRecognition());
                changeTrack(action.track);
            }

            return next(action);
        }
        case TRACK_REMOVED: {
            const { videoType } = action.track.jitsiTrack;
            const state = getState();
            const { isPhysician } = getLocalParticipant(state);
            if (
                ["camera", "desktop"].includes(videoType) &&
                isPhysician === false
            ) {
                dispatch(stopEmotionRecognition());
            }

            return next(action);
        }
        case PARTICIPANT_LEFT: {
            if (!action.participant.local) {
                const { isPhysician, jwtId } = getParticipantById(
                    getState(),
                    action.participant.id
                );

                if (!isPhysician) {
                    dispatch(deleteEmotion(jwtId));
                }
            }
            return next(action);
        }
        case VIRTUAL_BACKGROUND_TRACK_CHANGED: {
            const state = getState();
            const { isPhysician } = getLocalParticipant(state);
            if (isPhysician === false) {
                dispatch(resetTrack());
            }

            return next(action);
        }
    }

    return next(action);
});

/**
 * Notifies the feature emotion-recognition that the action
 * {@code ENDPOINT_MESSAGE_RECEIVED} is being dispatched within a specific redux
 * store.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The redux {@code dispatch} function to
 * dispatch the specified {@code action} to the specified {@code store}.
 * @param {Action} action - The redux action {@code ENDPOINT_MESSAGE_RECEIVED}
 * which is being dispatched in the specified {@code store}.
 * @private
 * @returns {Object} The value returned by {@code next(action)}.
 */
function _endpointMessageReceived({ dispatch, getState }, next, action) {
    const { json } = action;
    if (!(json && json.type === KEEP_SENDING)) {
        return next(action);
    }
    console.log("Received keep-sending message.");

    dispatch(keepSending());

    return next(action);
}
