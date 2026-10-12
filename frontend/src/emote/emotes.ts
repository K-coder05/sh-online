import fazeup from "../assets/emotes/fazeup.webp";
import middlefinger from "../assets/emotes/middlefinger.png";
import salute from "../assets/emotes/salute.jpg";
import thumbsdown from "../assets/emotes/thumbsdown.webp";
import thumbsup from "../assets/emotes/thumbsup.webp";
import wave from "../assets/emotes/wave.webp";

/** How long an emote stays over its sender's player tile. */
export const EMOTE_DISPLAY_MS = 3000;

/** The minimum time between emotes sent by this player. */
export const EMOTE_COOLDOWN_MS = 1000;

/**
 * The emotes players can send, in the order shown. The names must match
 * SecretHitlerGame.EMOTES on the server.
 */
export const EMOTES: { name: string; image: string; label: string }[] = [
  { name: "thumbsup", image: thumbsup, label: "Thumbs up" },
  { name: "thumbsdown", image: thumbsdown, label: "Thumbs down" },
  { name: "wave", image: wave, label: "Wave" },
  { name: "salute", image: salute, label: "Salute" },
  { name: "fazeup", image: fazeup, label: "Faze up" },
  { name: "middlefinger", image: middlefinger, label: "Middle finger" },
];

/** Maps emote names to their images. */
export const emoteImages: Record<string, string> = Object.fromEntries(
  EMOTES.map((emote) => [emote.name, emote.image])
);
