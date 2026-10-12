package game;

import game.datastructures.Identity;
import game.datastructures.Player;
import org.junit.Test;

import java.util.ArrayList;
import java.util.List;

import static junit.framework.TestCase.*;

public class testEmotes {

    private SecretHitlerGame newGame(int numPlayers) {
        ArrayList<String> names = new ArrayList<>();
        for (int i = 0; i < numPlayers; i++) {
            names.add(Integer.toString(i));
        }
        return new SecretHitlerGame(names);
    }

    @Test
    public void playersCanEmoteForEveryoneToSee() {
        SecretHitlerGame game = newGame(5);

        game.emote("2", "thumbsup");
        game.emote("4", "wave");

        List<Emote> emotes = game.getEmotes();
        assertEquals(2, emotes.size());
        assertEquals(1, emotes.get(0).getId());
        assertEquals("2", emotes.get(0).getPlayer());
        assertEquals("thumbsup", emotes.get(0).getEmote());
        assertEquals(2, emotes.get(1).getId());
        assertEquals("4", emotes.get(1).getPlayer());
        assertEquals("wave", emotes.get(1).getEmote());
    }

    private void assertRejected(Runnable action) {
        try {
            action.run();
            fail("Expected the action to be rejected.");
        } catch (IllegalArgumentException | IllegalStateException expected) {
            // expected
        }
    }

    @Test
    public void onlyKnownEmotesFromPlayersInTheGameAreAllowed() {
        SecretHitlerGame game = newGame(5);

        assertRejected(() -> game.emote("0", "dance"));
        assertRejected(() -> game.emote("0", null));
        assertRejected(() -> game.emote("nobody", "wave"));
        assertTrue(game.getEmotes().isEmpty());
    }

    @Test
    public void onlyTheMostRecentEmotesAreKept() {
        SecretHitlerGame game = newGame(5);
        for (int i = 0; i < SecretHitlerGame.MAX_EMOTES_KEPT + 5; i++) {
            game.emote("1", "wave");
        }

        List<Emote> emotes = game.getEmotes();
        assertEquals(SecretHitlerGame.MAX_EMOTES_KEPT, emotes.size());
        assertEquals(6, emotes.get(0).getId());
        assertEquals(SecretHitlerGame.MAX_EMOTES_KEPT + 5, emotes.get(emotes.size() - 1).getId());
    }

    private String findFirst(SecretHitlerGame game, Identity id) {
        for (Player player : game.getPlayerList()) {
            if (player.getIdentity() == id && player.isAlive()) {
                return player.getUsername();
            }
        }
        throw new AssertionError("No living player with identity " + id);
    }

    @Test
    public void ghostsCanEmoteUntilTheGameEnds() {
        SecretHitlerGame game = newGame(7);
        String agent = findFirst(game, Identity.SECRET_AGENT);
        String ghost = findFirst(game, Identity.FASCIST);
        game.agentShoot(agent, ghost);

        game.emote(ghost, "middlefinger");
        assertEquals(ghost, game.getEmotes().get(0).getPlayer());

        game.agentShoot(agent, findFirst(game, Identity.HITLER));
        assertTrue(game.hasGameFinished());
        assertRejected(() -> game.emote(agent, "salute"));
        assertEquals(1, game.getEmotes().size());
    }
}
