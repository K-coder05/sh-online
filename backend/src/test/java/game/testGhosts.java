package game;

import game.datastructures.Identity;
import game.datastructures.Player;
import org.junit.Test;

import java.util.ArrayList;
import java.util.List;

import static junit.framework.TestCase.*;

public class testGhosts {

    private SecretHitlerGame newGame(int numPlayers) {
        ArrayList<String> names = new ArrayList<>();
        for (int i = 0; i < numPlayers; i++) {
            names.add(Integer.toString(i));
        }
        return new SecretHitlerGame(names);
    }

    private String findFirst(SecretHitlerGame game, Identity id) {
        for (Player player : game.getPlayerList()) {
            if (player.getIdentity() == id && player.isAlive()) {
                return player.getUsername();
            }
        }
        throw new AssertionError("No living player with identity " + id);
    }

    /** Kills a fascist (via the secret agent) and returns their name. */
    private String makeGhost(SecretHitlerGame game) {
        String fascist = findFirst(game, Identity.FASCIST);
        game.agentShoot(findFirst(game, Identity.SECRET_AGENT), fascist);
        return fascist;
    }

    @Test
    public void ghostsCanHeckleForEveryoneToHear() {
        SecretHitlerGame game = newGame(7);
        String ghost = makeGhost(game);

        game.heckle(ghost, "  Boo! Don't trust the President!  ");

        List<GhostMessage> heckles = game.getHeckles();
        assertEquals(1, heckles.size());
        assertEquals(ghost, heckles.get(0).getGhost());
        assertEquals("Boo! Don't trust the President!", heckles.get(0).getText());
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
    public void onlyGhostsCanHeckle() {
        SecretHitlerGame game = newGame(7);
        String living = findFirst(game, Identity.LIBERAL);
        makeGhost(game);

        assertRejected(() -> game.heckle(living, "I'm not dead yet!"));
        assertRejected(() -> game.heckle("nobody", "Who am I?"));
        assertTrue(game.getHeckles().isEmpty());
    }

    @Test
    public void hecklesMustBeShortAndNotBlank() {
        SecretHitlerGame game = newGame(7);
        String ghost = makeGhost(game);

        assertRejected(() -> game.heckle(ghost, "   "));
        StringBuilder rant = new StringBuilder();
        for (int i = 0; i <= SecretHitlerGame.MAX_GHOST_MESSAGE_LENGTH; i++) {
            rant.append('a');
        }
        assertRejected(() -> game.heckle(ghost, rant.toString()));
        assertTrue(game.getHeckles().isEmpty());
    }

    @Test
    public void onlyTheMostRecentHecklesAreKept() {
        SecretHitlerGame game = newGame(7);
        String ghost = makeGhost(game);
        int total = SecretHitlerGame.MAX_HECKLES_KEPT + 5;
        for (int i = 1; i <= total; i++) {
            game.heckle(ghost, "Heckle " + i);
        }

        List<GhostMessage> heckles = game.getHeckles();
        assertEquals(SecretHitlerGame.MAX_HECKLES_KEPT, heckles.size());
        assertEquals("Heckle 6", heckles.get(0).getText());
        assertEquals("Heckle " + total, heckles.get(heckles.size() - 1).getText());
        // Ids keep increasing so clients can tell new heckles apart.
        assertTrue(heckles.get(heckles.size() - 1).getId() > heckles.get(heckles.size() - 2).getId());
    }

    /** Fails an election so that the presidency (and the round) moves on. */
    private void advanceRound(SecretHitlerGame game) {
        int round = game.getRound();
        for (Player player : game.getPlayerList()) {
            String name = player.getUsername();
            if (player.isAlive() && !name.equals(game.getCurrentPresident())) {
                game.nominateChancellor(name);
                break;
            }
        }
        for (Player player : game.getPlayerList()) {
            if (player.isAlive()) {
                game.registerVote(player.getUsername(), false);
            }
        }
        game.endPresidentialTerm();
        assertEquals(round + 1, game.getRound());
    }

    @Test
    public void ghostsGetOneWhisperToALivingPlayerEachRound() {
        SecretHitlerGame game = newGame(7);
        String ghost = makeGhost(game);
        String living = findFirst(game, Identity.LIBERAL);
        assertTrue(game.canWhisper(ghost));

        game.whisper(ghost, living, "The President is lying.");

        assertFalse(game.canWhisper(ghost));
        assertRejected(() -> game.whisper(ghost, living, "Also, nice hat."));

        advanceRound(game);
        assertTrue(game.canWhisper(ghost));
        game.whisper(ghost, living, "Told you.");
        assertFalse(game.canWhisper(ghost));
    }

    @Test
    public void whispersAreHeardOnlyByTheGhostAndTheirRecipient() {
        SecretHitlerGame game = newGame(7);
        String ghost = makeGhost(game);
        String recipient = findFirst(game, Identity.LIBERAL);
        String bystander = findFirst(game, Identity.HITLER);

        game.whisper(ghost, recipient, "  Psst. Watch out.  ");

        List<GhostMessage> heard = game.getWhispersFor(recipient);
        assertEquals(1, heard.size());
        assertEquals(ghost, heard.get(0).getGhost());
        assertEquals(recipient, heard.get(0).getRecipient());
        assertEquals("Psst. Watch out.", heard.get(0).getText());
        assertEquals(1, game.getWhispersFor(ghost).size());
        assertTrue(game.getWhispersFor(bystander).isEmpty());
        assertTrue(game.getHeckles().isEmpty()); // Whispers are silent.
    }

    @Test
    public void hecklesDoNotGiveAwayThatAWhisperHappened() {
        SecretHitlerGame game = newGame(7);
        String ghost = makeGhost(game);
        String living = findFirst(game, Identity.LIBERAL);

        game.heckle(ghost, "Boo!");
        game.whisper(ghost, living, "Psst.");
        game.heckle(ghost, "Boo again!");

        // A gap in the (public) heckle ids would reveal the whisper.
        List<GhostMessage> heckles = game.getHeckles();
        assertEquals(heckles.get(0).getId() + 1, heckles.get(1).getId());
    }

    @Test
    public void whispersMustGoFromAGhostToSomeoneLiving() {
        SecretHitlerGame game = newGame(7);
        String living = findFirst(game, Identity.LIBERAL);
        String otherLiving = findFirst(game, Identity.HITLER);
        String ghost = makeGhost(game);
        String otherGhost = makeGhost(game);

        assertFalse(game.canWhisper(living));
        assertRejected(() -> game.whisper(living, otherLiving, "I'm alive!"));
        assertRejected(() -> game.whisper(ghost, otherGhost, "Hello, fellow spirit."));
        assertRejected(() -> game.whisper(ghost, "nobody", "Anyone there?"));
        assertRejected(() -> game.whisper(ghost, living, " "));
        // Rejected whispers do not use up the ghost's whisper for the round.
        assertTrue(game.canWhisper(ghost));
    }

    @Test
    public void ghostsFallSilentOnceTheGameEnds() {
        SecretHitlerGame game = newGame(7);
        String ghost = makeGhost(game);
        String living = findFirst(game, Identity.LIBERAL);
        game.agentShoot(findFirst(game, Identity.SECRET_AGENT), findFirst(game, Identity.HITLER));
        assertTrue(game.hasGameFinished());

        assertFalse(game.canWhisper(ghost));
        assertRejected(() -> game.heckle(ghost, "Good game!"));
        assertRejected(() -> game.whisper(ghost, living, "Good game!"));
    }
}
