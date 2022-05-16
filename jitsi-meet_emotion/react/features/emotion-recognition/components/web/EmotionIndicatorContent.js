import * as React from "react";
import { useMemo } from "react";
import { Bar } from "@visx/shape";
import { Group } from "@visx/group";
import { useSelector } from "react-redux";
import {
    GradientDarkgreenGreen,
    GradientLightgreenGreen,
    GradientOrangeRed,
    GradientPinkBlue,
    GradientPinkRed,
    GradientPurpleOrange,
    GradientPurpleRed,
    GradientTealBlue,
    RadialGradient,
    LinearGradient,
} from "@visx/gradient";
import { scaleBand, scaleLinear, scaleOrdinal } from "@visx/scale";
import { AxisBottom } from "@visx/axis";
import {
    EMOTION_SURPRISE_SHORT,
    EMOTION_NEUTRAL_SHORT,
    EMOTION_SAD_SHORT,
    EMOTION_FEAR_SHORT,
    EMOTION_DISGUST_SHORT,
    EMOTION_CONTEMPT_SHORT,
    EMOTION_ANGER_SHORT,
    EMOTION_HAPPY_SHORT,
    EMOTION_SURPRISE,
    EMOTION_NEUTRAL,
    EMOTION_SAD,
    EMOTION_FEAR,
    EMOTION_DISGUST,
    EMOTION_CONTEMPT,
    EMOTION_ANGER,
    EMOTION_HAPPY,
} from "../../constants";
import { getParticipantById } from "../../../base/participants";


const verticalMargin = 35;

// accessors
const getEmotion = (d) => d.emotion;
const getEmotionFrequency = (d) => d.duration;
const BARCOLOR = "#a9b8cf";
const WHITE = "#ffffff";

export default function EmotionIndicatorContent({
    width,
    height,
    events = true,
    participantId
}) {
    // bounds
    const xMax = width;
    const yMax = height - verticalMargin;

    // participant
    const participantJwtId = 
    useSelector((state) => getParticipantById(state, participantId))?.jwtId;
    const participantEmotionHistory = useSelector(
        (state) =>
            state["features/emotion-recognition"].emotionHistory[
                participantJwtId
            ]
    );
console.log('render');
    // data
    const data = [
        {
            emotion: EMOTION_ANGER_SHORT,
            duration: participantEmotionHistory[EMOTION_ANGER].length,
        },
        {
            emotion: EMOTION_CONTEMPT_SHORT,
            duration: participantEmotionHistory[EMOTION_CONTEMPT].length,
        },
        {
            emotion: EMOTION_DISGUST_SHORT,
            duration: participantEmotionHistory[EMOTION_DISGUST].length,
        },
        {
            emotion: EMOTION_FEAR_SHORT,
            duration: participantEmotionHistory[EMOTION_FEAR].length,
        },
        {
            emotion: EMOTION_HAPPY_SHORT,
            duration: participantEmotionHistory[EMOTION_HAPPY].length,
        },
        {
            emotion: EMOTION_NEUTRAL_SHORT,
            duration: participantEmotionHistory[EMOTION_NEUTRAL].length,
        },
        {
            emotion: EMOTION_SAD_SHORT,
            duration: participantEmotionHistory[EMOTION_SAD].length,
        },
        {
            emotion: EMOTION_SURPRISE_SHORT,
            duration: participantEmotionHistory[EMOTION_SURPRISE].length,
        },
    ];

    // var minutes = Math.floor(time / 60);
    // var seconds = time % 60;

    // scales, memoize for performance
    const xScale = useMemo(
        () =>
            scaleBand({
                range: [0, xMax],
                round: true,
                domain: data.map(getEmotion),
                padding: 0.3,
            }),
        [xMax]
    );

    const yScale = useMemo(
        () =>
            scaleLinear({
                range: [yMax, 0],
                round: true,
                domain: [0, Math.max(...data.map(getEmotionFrequency))],
            }),
        [yMax]
    );

    //   const colorScale = scaleOrdinal<string, string>({
    //     domain: data.map(getEmotion),
    //     range: [blue, green, purple],
    //   });

    return width < 10 ? null : (
        <svg width={width} height={height}>
            <RadialGradient
                id={"jitsiBlue"}
                from="#3f6296"
                to="#122c52"
                r="60%"
            />
            <rect
                width={width}
                height={height}
                fill="url(#jitsiBlue)"
                rx={14}
            />
            <Group top={verticalMargin / 2}>
                {data.map((d, i) => {
                    const letter = getEmotion(d);
                    const barWidth = xScale.bandwidth();
                    const barHeight =
                        yMax - (yScale(getEmotionFrequency(d)) ?? 0);
                    const barX = xScale(letter);
                    const barY = yMax - barHeight;
                    return (
                        <Bar
                            key={`bar-${letter}`}
                            x={barX}
                            y={barY}
                            width={barWidth}
                            height={barHeight}
                            fill={BARCOLOR}
                            onClick={() => {
                                if (events)
                                    alert(
                                        `${JSON.stringify(
                                            Object.values(d)
                                        )} Seconds`
                                    );
                            }}
                        />
                    );
                })}
            </Group>
            <AxisBottom
                top={yMax + verticalMargin / 2}
                tickLength={0}
                hideTicks
                scale={xScale}
                // stroke={green}
                // tickStroke={green}
                hideAxisLine
                tickLabelProps={() => ({
                    fill: WHITE,
                    fontSize: 11,
                    textAnchor: "middle",
                })}
            />
        </svg>
    );
}
