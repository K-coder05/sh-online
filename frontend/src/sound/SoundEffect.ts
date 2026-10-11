/** Every sound effect the game can play. */
export enum SoundEffect {
  /** Players see their secret role for the first time. */
  ROLE_REVEAL = "ROLE_REVEAL",
  /** This player is being asked to act (vote, nominate, enact...). */
  PROMPT = "PROMPT",
  /** The ballots are flipped over. */
  VOTES_REVEALED = "VOTES_REVEALED",
  /** The government was elected. */
  VOTE_PASSED = "VOTE_PASSED",
  /** The government was voted down. */
  VOTE_FAILED = "VOTE_FAILED",
  /** The election tracker moved forward. */
  ELECTION_TRACKER = "ELECTION_TRACKER",
  /** Three failed elections: the top policy is enacted in chaos. */
  CHAOS = "CHAOS",
  LIBERAL_POLICY = "LIBERAL_POLICY",
  FASCIST_POLICY = "FASCIST_POLICY",
  /** The chancellor motioned to veto the agenda. */
  VETO = "VETO",
  /** The president investigated someone's party membership. */
  INVESTIGATION = "INVESTIGATION",
  /** A player was executed by the president. */
  EXECUTION = "EXECUTION",
  /** The secret agent fired. */
  GUNSHOT = "GUNSHOT",
  /** A ghost heckled the room. */
  HECKLE = "HECKLE",
  /** A ghost whispered to this player. */
  WHISPER = "WHISPER",
  LIBERAL_VICTORY = "LIBERAL_VICTORY",
  FASCIST_VICTORY = "FASCIST_VICTORY",
}
