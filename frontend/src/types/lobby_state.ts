import { PolicyType, Role } from "./game";

export enum LobbyState {
  SETUP = "SETUP",
  CHANCELLOR_NOMINATION = "CHANCELLOR_NOMINATION",
  CHANCELLOR_VOTING = "CHANCELLOR_VOTING", // Voting on the chancellor is taking place.
  LEGISLATIVE_PRESIDENT = "LEGISLATIVE_PRESIDENT", // In the legislative phase. The president is selecting a card to discard.
  LEGISLATIVE_CHANCELLOR = "LEGISLATIVE_CHANCELLOR", // In the legislative phase. The chancellor is selecting a card to enact.
  LEGISLATIVE_PRESIDENT_VETO = "LEGISLATIVE_PRESIDENT_VETO", // Chancellor decided to initiate veto, President chooses whether to allow.
  PP_PEEK = "PRESIDENTIAL_POWER_PEEK", // President may peek at the next three cards in the deck
  PP_INVESTIGATE = "PRESIDENTIAL_POWER_INVESTIGATE", // President can investigate a party membership
  PP_EXECUTION = "PRESIDENTIAL_POWER_EXECUTION", // President may choose a player to execute
  PP_ELECTION = "PRESIDENTIAL_POWER_ELECTION", // President chooses the next president, seat continues as normal after.
  POST_LEGISLATIVE = "POST_LEGISLATIVE", // Waiting for the President to end their turn.
  LIBERAL_VICTORY_POLICY = "LIBERAL_VICTORY_POLICY", // Liberal Party won through enacting Liberal policies.
  LIBERAL_VICTORY_EXECUTION = "LIBERAL_VICTORY_EXECUTION", // Liberal Party won through executing Hitler.
  LIBERAL_VICTORY_AGENT = "LIBERAL_VICTORY_AGENT", // Liberal Party won through the secret agent shooting Hitler.
  FASCIST_VICTORY_POLICY = "FASCIST_VICTORY_POLICY", // Fascist Party won through enacting Fascist policies.
  FASCIST_VICTORY_ELECTION = "FASCIST_VICTORY_ELECTION", // Fascist Party won by successfully electing Hitler chancellor.
}

export type PlayerState = {
  id?: Role;
  alive: boolean;
  investigated: boolean;
};

export const enum AgentShotOutcome {
  HIT_FASCIST = "HIT_FASCIST", // Target was a fascist. The agent survives and may shoot again.
  HIT_HITLER = "HIT_HITLER", // Target was Hitler. Liberals win.
  HIT_LIBERAL = "HIT_LIBERAL", // Target was a liberal. Both the target and the agent died.
}

/** The most recent shot fired by the secret agent. {@code id} increases with each shot. */
export type AgentShot = {
  id: number;
  shooter: string;
  target: string;
  outcome: AgentShotOutcome;
};

/**
 * A message from a ghost (a dead player). Heckles are heard by everyone;
 * whispers (which have a {@code recipient}) are only sent to the ghost and the
 * recipient. {@code id} increases with each ghost message.
 */
export type GhostMessage = {
  id: number;
  ghost: string;
  text: string;
  recipient?: string;
};

/**
 * A reaction image sent by a player for everyone to see. {@code id} increases
 * with each emote.
 */
export type Emote = {
  id: number;
  player: string;
  emote: string;
};

export type GameState = {
  state: LobbyState;
  lastState: LobbyState;
  playerOrder: string[];
  players: Record<string, PlayerState>;
  chancellor: string;
  president: string;
  lastChancellor: string;
  lastPresident: string;
  electionTracker: number;
  electionTrackerAdvanced: boolean;
  userVotes: Record<string, boolean>;
  liberalPolicies: number;
  fascistPolicies: number;
  drawSize: number;
  discardSize: number;
  // TODO: Make GameState type more complex, correlating
  // these fields with certain LobbyStates.
  // This actually is a little more complicated, since GameState currently represents the
  // the full packet data sent by the server. See `Lobby.java` `updateUser()`
  // for how all of this is packaged.
  presidentChoices?: PolicyType[];
  chancellorChoices?: PolicyType[];
  targetUser?: string;
  lastPolicy: string;
  vetoOccurred: boolean;
  peek?: PolicyType[];
  agentShot?: AgentShot;
  /** The most recent heckles from ghosts, oldest first. */
  heckles?: GhostMessage[];
  /** The whispers this player sent or received, oldest first. */
  whispers?: GhostMessage[];
  /** Whether this player is a ghost who has not yet whispered this round. */
  canWhisper?: boolean;
  /** The most recent emotes, oldest first. */
  emotes?: Emote[];

  usernames?: string[];
  /** Maps from usernames to icon keys */
  icon: Record<string, string>;
};
