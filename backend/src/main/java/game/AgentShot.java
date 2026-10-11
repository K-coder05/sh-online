package game;

import java.io.Serializable;

/**
 * Records a shot fired by the secret agent.
 */
public class AgentShot implements Serializable {

    public enum Outcome {
        HIT_FASCIST, // Target was a fascist and died. The agent survives and may shoot again.
        HIT_HITLER,  // Target was Hitler and died. Liberals win.
        HIT_LIBERAL  // Target was a liberal. Both the target and the agent died.
    }

    private final int id;
    private final String shooter;
    private final String target;
    private final Outcome outcome;

    /**
     * @param id      the number of this shot in the game, starting at 1.
     * @param shooter the username of the secret agent.
     * @param target  the username of the player that was shot.
     * @param outcome the result of the shot.
     */
    public AgentShot(int id, String shooter, String target, Outcome outcome) {
        this.id = id;
        this.shooter = shooter;
        this.target = target;
        this.outcome = outcome;
    }

    public int getId() {
        return id;
    }

    public String getShooter() {
        return shooter;
    }

    public String getTarget() {
        return target;
    }

    public Outcome getOutcome() {
        return outcome;
    }
}
