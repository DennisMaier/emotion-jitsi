/* @flow */

import { makeStyles } from "@material-ui/styles";
import React from "react";
import { useSelector } from "react-redux";
import { COLORS } from "../../../base/label/constants";
import { getParticipantById } from "../../../base/participants";
import { BaseIndicator } from "../../../base/react";
import BaseTheme from "../../../base/ui/components/BaseTheme";
import { emotionToIcon } from "../../functions";

/**
 * The type of the React {@code Component} props of {@link RaisedHandIndicator}.
 */
type Props = {
    /**
     * The font-size for the icon.
     */
    iconSize: number,

    /**
     * The participant id who we want to render the raised hand indicator
     * for.
     */
    participantId: string,

    /**
     * From which side of the indicator the tooltip should appear from.
     */
    tooltipPosition: string,
};

const useStyles = makeStyles((theme) => {
    return {
        EmotionIndicatorIcon: {
            // backgroundColor: COLORS.white,
            padding: "2px",
            zIndex: 3,
            display: "inline-block",
            borderRadius: "4px",
            boxSizing: "border-box",
        },
    };
});

/**
 * Thumbnail badge showing that the participant would like to speak.
 *
 * @returns {ReactElement}
 */
const EmotionIndicatorIcon = ({
    iconSize,
    participantId,
    tooltipPosition,
}: Props) => {

    const participantJwtId = 
        useSelector((state) => getParticipantById(state, participantId))?.jwtId;
    
    const participantEmotion = useSelector(
        (state) =>
            state["features/emotion-recognition"].emotions[participantJwtId]
    );
    const emotionIcon = emotionToIcon(participantEmotion);
    
    const styles = useStyles();

   

    if(emotionIcon){return (
        <div className={styles.EmotionIndicatorIcon}>
            <BaseIndicator
                icon={emotionIcon}
                iconColor={BaseTheme.palette.uiBackground}
                iconSize={`${iconSize}px`}
                tooltipKey="raisedHand"
                tooltipPosition={tooltipPosition}
            />
        </div>
    );} else {return null;}
};

export default EmotionIndicatorIcon;
