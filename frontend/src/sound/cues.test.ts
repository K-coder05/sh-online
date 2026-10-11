import { electionTrackerSound, policySound, victorySound } from "./cues";
import { SoundEffect } from "./SoundEffect";
import { LobbyState } from "../types";

test.each([
  LobbyState.LIBERAL_VICTORY_POLICY,
  LobbyState.LIBERAL_VICTORY_EXECUTION,
  LobbyState.LIBERAL_VICTORY_AGENT,
])("liberal wins (%s) are celebrated", (state: LobbyState) => {
  expect(victorySound(state)).toBe(SoundEffect.LIBERAL_VICTORY);
});

test.each([
  LobbyState.FASCIST_VICTORY_POLICY,
  LobbyState.FASCIST_VICTORY_ELECTION,
])("fascist wins (%s) are ominous", (state: LobbyState) => {
  expect(victorySound(state)).toBe(SoundEffect.FASCIST_VICTORY);
});

test("states that don't end the game have no victory sound", () => {
  expect(victorySound(LobbyState.CHANCELLOR_VOTING)).toBeUndefined();
});

test("each policy type has its own sound", () => {
  expect(policySound("LIBERAL")).toBe(SoundEffect.LIBERAL_POLICY);
  expect(policySound("FASCIST")).toBe(SoundEffect.FASCIST_POLICY);
});

test("the election tracker reaching three causes chaos", () => {
  expect(electionTrackerSound(1)).toBe(SoundEffect.ELECTION_TRACKER);
  expect(electionTrackerSound(2)).toBe(SoundEffect.ELECTION_TRACKER);
  expect(electionTrackerSound(3)).toBe(SoundEffect.CHAOS);
});
