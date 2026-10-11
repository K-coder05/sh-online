import { SoundEffect } from "./SoundEffect";
import { LobbyState, PolicyType } from "../types";

/** Returns the sound for the end of the game, or undefined if the game hasn't ended. */
export function victorySound(state: LobbyState): SoundEffect | undefined {
  switch (state) {
    case LobbyState.LIBERAL_VICTORY_POLICY:
    case LobbyState.LIBERAL_VICTORY_EXECUTION:
    case LobbyState.LIBERAL_VICTORY_AGENT:
      return SoundEffect.LIBERAL_VICTORY;
    case LobbyState.FASCIST_VICTORY_POLICY:
    case LobbyState.FASCIST_VICTORY_ELECTION:
      return SoundEffect.FASCIST_VICTORY;
    default:
      return undefined;
  }
}

/** Returns the sound for a policy being enacted. */
export function policySound(policy: string): SoundEffect {
  return policy === PolicyType.LIBERAL
    ? SoundEffect.LIBERAL_POLICY
    : SoundEffect.FASCIST_POLICY;
}

/** Returns the sound for the election tracker moving to the given position. */
export function electionTrackerSound(position: number): SoundEffect {
  return position >= 3 ? SoundEffect.CHAOS : SoundEffect.ELECTION_TRACKER;
}
