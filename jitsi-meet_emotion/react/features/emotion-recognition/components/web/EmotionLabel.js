// @flow

import Tooltip from "@atlaskit/tooltip";
import React from "react";
import { getParticipantById } from "../../../base/participants";
import { Label } from "../../../base/label";
import { COLORS } from "../../../base/label/constants";
import { useCallback } from "react";
import { useSelector } from "react-redux";
import BaseTheme from "../../../base/ui/components/BaseTheme";
import { emotionToIcon } from "../../functions";



const EmotionsLabel = () => {
    // const conference = useSelector(
    //     (state) => state["features/base/conference"].conference
    // );
    // const { stats: speakerStats } = useSelector(
    //     (state) => state["features/speaker-stats"]
    // );
    const { tileViewEnabled } = useSelector(
        (state) => state["features/video-layout"]
    );
    const largeVideoParticipantId = useSelector(
        (state) => state["features/large-video"].participantId
    );

    const largeVideoParticipant =
        getParticipantById(APP.store.getState(), largeVideoParticipantId);
            

    const largeVideoParticipantJwtId = largeVideoParticipant?.jwtId;
    const largeVideoParticipantIsPhysician = largeVideoParticipant?.isPhysician;

    const largeVideoParticipantEmotion = useSelector(
        (state) =>
            state["features/emotion-recognition"].emotions[largeVideoParticipantJwtId]
    );
    const emotionIcon = emotionToIcon(largeVideoParticipantEmotion);
   

    if (tileViewEnabled) {
        return null;
    }
    return (
        <Tooltip content={"emotion"} position="bottom">
            <Label
                color={COLORS.transparent}
                iconSize={"40"}
                icon={emotionIcon}
                id={"emotionLabel"}
                iconColor={BaseTheme.palette.uiBackground}
            />
        </Tooltip>
    );
};

export default EmotionsLabel;
