package game;

import java.io.Serializable;

/**
 * A message sent by a ghost (a dead player in an unfinished game).
 * Heckles are heard by everyone; whispers are heard only by their recipient.
 */
public class GhostMessage implements Serializable {

    private final int id;
    private final String ghost;
    private final String recipient;
    private final String text;

    /**
     * @param id        the number of this message in the game, starting at 1.
     *                  Heckles and whispers are numbered separately.
     * @param ghost     the username of the ghost.
     * @param recipient the username of the living player being whispered to, or
     *                  null for a heckle.
     * @param text      the message.
     */
    public GhostMessage(int id, String ghost, String recipient, String text) {
        this.id = id;
        this.ghost = ghost;
        this.recipient = recipient;
        this.text = text;
    }

    public int getId() {
        return id;
    }

    public String getGhost() {
        return ghost;
    }

    /**
     * @return the username of the player being whispered to, or null for a heckle.
     */
    public String getRecipient() {
        return recipient;
    }

    public String getText() {
        return text;
    }

    public boolean isWhisper() {
        return recipient != null;
    }
}
