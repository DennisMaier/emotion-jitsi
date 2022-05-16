// @flow

import { withStyles } from "@material-ui/styles";
import clsx from "clsx";
import React, { useState } from "react";
import type { Dispatch } from "redux";

import { Component } from "react";

import { getSourceNameSignalingFeatureFlag } from "../../../base/config";
import { translate } from "../../../base/i18n";
import { MEDIA_TYPE } from "../../../base/media";
import {
    getLocalParticipant,
    getParticipantById,
} from "../../../base/participants";
import { Popover } from "../../../base/popover";
import { connect } from "../../../base/redux";
import { getTrackByMediaTypeAndParticipant } from "../../../base/tracks";
import {
    isParticipantConnectionStatusInactive,
    isParticipantConnectionStatusInterrupted,
    isTrackStreamingStatusInactive,
    isTrackStreamingStatusInterrupted,
} from "../../../connection-indicator/functions";

import EmotionIndicatorContent from "./EmotionIndicatorContent";
import EmotionIndicatorIcon from "./EmotionIndicatorIcon";

const EmotionIndicator = ({
    iconSize,
    participantId,
    tooltipPosition,
    statsPopoverPosition,
}) => {
    const [popoverVisible, setPopoverVisible] = useState(false);

    return (
        <Popover
            // className = { clsx(classes.container) }
            // content = { <EmotionIndicatorContent
            //     inheritedStats = { this.state.stats }
            //     participantId = { participantId } /> }
            content={
                <EmotionIndicatorContent
                    width={240}
                    height={120}
                    participantId={participantId}
                />
            }
            id="participant-emotion-indicator"
            noPaddingContent={true}
            onPopoverClose={() => setPopoverVisible(false)}
            onPopoverOpen={() => setPopoverVisible(true)}
            position={statsPopoverPosition}
            visible={popoverVisible}
        >
            <div>
                <EmotionIndicatorIcon
                    iconSize={iconSize}
                    participantId={participantId}
                    tooltipPosition={tooltipPosition}
                />
            </div>
        </Popover>
    );
};

export default EmotionIndicator;
