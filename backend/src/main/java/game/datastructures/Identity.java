package game.datastructures;

public enum Identity {
    UNASSIGNED,
    HITLER,
    FASCIST,
    LIBERAL,
    SECRET_AGENT    // Liberal-aligned. May shoot players at any time (see SecretHitlerGame.agentShoot).
}
