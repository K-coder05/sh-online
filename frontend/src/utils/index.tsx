import { GameState, LobbyState } from "../types";

export const isVictoryState = (lobbyState: LobbyState): boolean => {
  return (
    lobbyState === LobbyState.FASCIST_VICTORY_ELECTION ||
    lobbyState === LobbyState.FASCIST_VICTORY_POLICY ||
    lobbyState === LobbyState.LIBERAL_VICTORY_EXECUTION ||
    lobbyState === LobbyState.LIBERAL_VICTORY_AGENT ||
    lobbyState === LobbyState.LIBERAL_VICTORY_POLICY
  );
};

/**
 * Returns true if the player is a ghost: a dead player in an unfinished game.
 */
export const isGhost = (name: string, gameState: GameState): boolean => {
  const player = gameState.players[name];
  return (
    player !== undefined && !player.alive && !isVictoryState(gameState.state)
  );
};

/**
 * Returns true if players with the Hitler role should know which players have
 * the Fascist role.
 */
export const doesHitlerKnowFascists = (gameState: GameState): boolean => {
  return gameState.playerOrder.length <= 6;
};
