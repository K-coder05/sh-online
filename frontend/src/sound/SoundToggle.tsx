import React, { ReactElement, useEffect, useState } from "react";
import "./SoundToggle.css";
import { soundBoard } from "./index";

/** A small corner button that mutes or unmutes the game's music and sound effects. */
export default function SoundToggle(): ReactElement {
  const [muted, setMuted] = useState(soundBoard.isMuted());
  useEffect(() => soundBoard.subscribe(setMuted), []);

  return (
    <button
      id="sound-toggle"
      onClick={() => soundBoard.toggleMuted()}
      aria-label={muted ? "Unmute sound" : "Mute sound"}
      title={muted ? "Unmute sound" : "Mute sound"}
    >
      {muted ? "🔇" : "🔊"}
    </button>
  );
}
