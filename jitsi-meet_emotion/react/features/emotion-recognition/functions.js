// @flow
import logger from "./logger";
import { KEEP_SENDING } from "./actionTypes";
import {
    IconEmotionAnger,
    IconEmotionContempt,
    IconEmotionHappy,
    IconEmotionDisgust,
    IconEmotionFear,
    IconEmotionNeutral,
    IconEmotionSad,
    IconEmotionSursprise,
} from "../base/icons";

export async function takePhoto(imageCapture: Object): Promise<void> {
    if (imageCapture === null || imageCapture === undefined) {
        return;
    }
    let imageBlob;

    try {
        imageBlob = await imageCapture.takePhoto();
    } catch (err) {
        logger.warn(err);

        return;
    }

    return imageBlob;
}

export function sendKeepAliveMessage(conference, patientId) {
    try {
        conference.sendEndpointMessage(patientId, {
            type: KEEP_SENDING,
        });
    } catch (err) {
        logger.warn(
            "Failed to send patient the first keep-sending message.",
            err
        );
    }
}

export function emotionToIcon(emotion) {
    switch (emotion) {
        case "anger":
            return IconEmotionAnger;
        case "contempt":
            return IconEmotionContempt;
        case "disgust":
            return IconEmotionDisgust;
        case "fear":
            return IconEmotionFear;
        case "happy":
            return IconEmotionHappy;
        case "neutral":
            return IconEmotionNeutral;
        case "sad":
            return IconEmotionSad;
        case "surprise":
            return IconEmotionSursprise;

        default:
            return null;
    }
}
