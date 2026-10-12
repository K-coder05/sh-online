package game;

import java.io.Serializable;

/**
 * An emote (a reaction image, such as a thumbs up) sent by a player for everyone
 * to see.
 */
public class Emote implements Serializable {

    private final int id;
    private final String player;
    private final String emote;

    /**
     * @param id     the number of this emote in the game, starting at 1.
     * @param player the username of the player who sent the emote.
     * @param emote  the name of the emote (one of SecretHitlerGame.EMOTES).
     */
    public Emote(int id, String player, String emote) {
        this.id = id;
        this.player = player;
        this.emote = emote;
    }

    public int getId() {
        return id;
    }

    public String getPlayer() {
        return player;
    }

    public String getEmote() {
        return emote;
    }
}
