import { Emote } from "../types";

/**
 * Picks out the emotes sent since the last one seen.
 * @param emotes the most recent emotes, oldest first.
 * @param latestSeenId the id of the latest emote already shown.
 * @return maps each player who sent a new emote to their newest one.
 */
export function newEmotesByPlayer(
  emotes: Emote[] | undefined,
  latestSeenId: number
): Record<string, Emote> {
  const out: Record<string, Emote> = {};
  (emotes || [])
    .filter((emote) => emote.id > latestSeenId)
    .forEach((emote) => {
      out[emote.player] = emote;
    });
  return out;
}
