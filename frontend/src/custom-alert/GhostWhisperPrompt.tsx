import React, { ReactElement, useEffect, useRef, useState } from "react";
import PlayerDisplayPrompt from "./PlayerDisplayPrompt";
import MaxLengthTextField from "../util/MaxLengthTextField";
import { MAX_GHOST_MESSAGE_LENGTH, SERVER_TIMEOUT } from "../constants";
import { DISABLE_EXECUTED_PLAYERS } from "../player/PlayerDisplay";
import { GameState, SendWSCommand, WSCommandType } from "../types";

type GhostWhisperPromptProps = {
  user: string;
  gameState: GameState;
  sendWSCommand: SendWSCommand;
  onCancel: () => void;
};

/**
 * Lets a ghost silently whisper a message to one living player.
 */
export default function GhostWhisperPrompt(
  props: GhostWhisperPromptProps
): ReactElement {
  const timeOutID = useRef<NodeJS.Timeout | undefined>(undefined);
  const [isWaitingForServer, setIsWaitingServer] = useState(false);
  const [message, setMessage] = useState("");

  const onButtonClick = (selectedItem: string) => {
    // Lock the button so that it can't be pressed multiple times.
    setIsWaitingServer(true);
    timeOutID.current = setTimeout(() => {
      setIsWaitingServer(false);
    }, SERVER_TIMEOUT);

    props.sendWSCommand({
      command: WSCommandType.GHOST_WHISPER,
      target: selectedItem,
      message: message.trim(),
    });
  };

  useEffect(() => {
    return () => {
      clearTimeout(timeOutID.current);
    };
  }, []);

  return (
    <PlayerDisplayPrompt
      label={"GHOSTLY WHISPER"}
      renderHeader={() => {
        return (
          <>
            <p className={"left-align"}>
              Choose a living player to whisper to. Only they will hear you,
              and you only get one whisper each round.
            </p>
            <MaxLengthTextField
              label={"Whisper"}
              value={message}
              onChange={setMessage}
              maxLength={MAX_GHOST_MESSAGE_LENGTH}
              placeholder={"Psst..."}
            />
            <button onClick={props.onCancel}>CANCEL</button>
          </>
        );
      }}
      gameState={props.gameState}
      disabledFilter={DISABLE_EXECUTED_PLAYERS}
      buttonText={"WHISPER"}
      buttonOnClick={onButtonClick}
      buttonDisabled={isWaitingForServer || message.trim() === ""}
      user={props.user}
      includeUser={false}
    />
  );
}
