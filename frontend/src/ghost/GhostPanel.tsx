import React, { ReactElement, useState } from "react";
import "./GhostPanel.css";
import MaxLengthTextField from "../util/MaxLengthTextField";
import { MAX_GHOST_MESSAGE_LENGTH } from "../constants";
import { isGhost } from "../utils";
import { GameState, SendWSCommand, WSCommandType } from "../types";

/** The number of recent heckles (and whispers) shown in the feed. */
const MESSAGES_SHOWN = 5;

type GhostPanelProps = {
  user: string;
  gameState: GameState;
  sendWSCommand: SendWSCommand;
  /** Whether heckling should be disabled (e.g. an alert is open). */
  heckleDisabled: boolean;
  /** Whether whispering should be disabled (e.g. an animation is playing). */
  whisperDisabled: boolean;
  onClickWhisper: () => void;
};

/**
 * Shows the latest heckles from ghosts to everyone, and the whispers this
 * player sent or received to them alone. Ghosts also get controls to heckle the
 * room and to silently whisper to a living player.
 */
export default function GhostPanel(props: GhostPanelProps): ReactElement {
  const [heckle, setHeckle] = useState("");
  const ghost = isGhost(props.user, props.gameState);
  const heckles = (props.gameState.heckles || []).slice(-MESSAGES_SHOWN);
  const whispers = (props.gameState.whispers || []).slice(-MESSAGES_SHOWN);

  if (!ghost && heckles.length === 0 && whispers.length === 0) {
    return <></>;
  }

  const onClickHeckle = () => {
    props.sendWSCommand({
      command: WSCommandType.GHOST_HECKLE,
      message: heckle.trim(),
    });
    setHeckle("");
  };

  return (
    <div id="ghost-panel">
      {heckles.length > 0 && (
        <ul id="ghost-heckles">
          {heckles.map((message) => (
            <li key={message.id} className="ghost-heckle">
              <span className="ghost-heckle-name">{message.ghost}</span>{" "}
              {message.text}
            </li>
          ))}
        </ul>
      )}

      {whispers.length > 0 && (
        <ul id="ghost-whispers">
          {whispers.map((message) => (
            <li key={message.id} className="ghost-whisper">
              {message.ghost === props.user
                ? `You whispered to ${message.recipient}: `
                : `${message.ghost} whispered to you: `}
              "{message.text}"
            </li>
          ))}
        </ul>
      )}

      {ghost && (
        <div id="ghost-controls">
          <p className="ghost-hint">
            You are a ghost. Wander the room, heckle everyone, and silently
            whisper to one living player each round.
          </p>
          <MaxLengthTextField
            label={"Heckle"}
            value={heckle}
            onChange={setHeckle}
            maxLength={MAX_GHOST_MESSAGE_LENGTH}
            placeholder={"Boooo!"}
          />
          <button
            disabled={props.heckleDisabled || heckle.trim() === ""}
            onClick={onClickHeckle}
          >
            HECKLE
          </button>
          <button
            disabled={props.whisperDisabled || !props.gameState.canWhisper}
            onClick={props.onClickWhisper}
          >
            {props.gameState.canWhisper ? "WHISPER" : "WHISPERED"}
          </button>
        </div>
      )}
    </div>
  );
}
