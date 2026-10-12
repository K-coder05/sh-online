import React, { ReactElement, useEffect, useState } from "react";
import "./Emote.css";
import { EMOTE_COOLDOWN_MS, EMOTES } from "./emotes";
import { GameState, SendWSCommand, WSCommandType } from "../types";

type EmoteBarProps = {
  user: string;
  gameState: GameState;
  sendWSCommand: SendWSCommand;
  /** Whether to hide the bar (e.g. once the game's result is shown). */
  hidden: boolean;
};

/**
 * A corner bar of emotes that any player in the game (living or dead) can send
 * at any time until the game ends.
 */
export default function EmoteBar(props: EmoteBarProps): ReactElement {
  const [coolingDown, setCoolingDown] = useState(false);
  useEffect(() => {
    if (!coolingDown) {
      return;
    }
    const timeout = setTimeout(() => setCoolingDown(false), EMOTE_COOLDOWN_MS);
    return () => clearTimeout(timeout);
  }, [coolingDown]);

  const inGame = props.gameState.players[props.user] !== undefined;
  if (!inGame || props.hidden) {
    return <></>;
  }

  const sendEmote = (emote: string) => {
    props.sendWSCommand({ command: WSCommandType.EMOTE, emote });
    setCoolingDown(true);
  };

  return (
    <div id="emote-bar" role="toolbar" aria-label="Emotes">
      {EMOTES.map((emote) => (
        <button
          key={emote.name}
          className="emote-button"
          disabled={coolingDown}
          onClick={() => sendEmote(emote.name)}
          aria-label={emote.label}
          title={emote.label}
        >
          <img src={emote.image} alt="" />
        </button>
      ))}
    </div>
  );
}
