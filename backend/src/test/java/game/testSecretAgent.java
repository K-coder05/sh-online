package game;

import game.datastructures.Identity;
import game.datastructures.Player;
import org.junit.Test;

import java.util.ArrayList;
import java.util.function.Predicate;

import static junit.framework.TestCase.*;

public class testSecretAgent {

    private ArrayList<String> makePlayers(int numPlayers) {
        ArrayList<String> out = new ArrayList<>();
        for (int i = 0; i < numPlayers; i++) {
            out.add(Integer.toString(i));
        }
        return out;
    }

    private int countIdentity(SecretHitlerGame game, Identity id) {
        int count = 0;
        for (Player player : game.getPlayerList()) {
            if (player.getIdentity() == id) {
                count++;
            }
        }
        return count;
    }

    @Test
    public void everyGameHasExactlyOneSecretAgentReplacingALiberal() {
        // # players:   5 6 7 8 9 10
        // # liberals:  2 3 3 4 4 5   (one liberal slot becomes the secret agent)
        int[] expectedLiberals = { -1, -1, -1, -1, -1, 2, 3, 3, 4, 4, 5 };
        for (int n = SecretHitlerGame.MIN_PLAYERS; n <= SecretHitlerGame.MAX_PLAYERS; n++) {
            SecretHitlerGame game = new SecretHitlerGame(makePlayers(n));
            assertEquals(1, countIdentity(game, Identity.SECRET_AGENT));
            assertEquals(1, countIdentity(game, Identity.HITLER));
            assertEquals(SecretHitlerGame.NUM_FASCISTS_FOR_PLAYERS[n], countIdentity(game, Identity.FASCIST));
            assertEquals(expectedLiberals[n], countIdentity(game, Identity.LIBERAL));
        }
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
    public void agentWhoShootsAFascistSurvivesAndCanShootAgain() {
        SecretHitlerGame game = new SecretHitlerGame(makePlayers(7)); // 2 fascists
        String agent = findFirst(game, Identity.SECRET_AGENT);
        String firstFascist = findFirst(game, Identity.FASCIST);

        assertEquals(AgentShot.Outcome.HIT_FASCIST, game.agentShoot(agent, firstFascist).getOutcome());
        assertFalse(game.getPlayer(firstFascist).isAlive());
        assertTrue(game.getPlayer(agent).isAlive());
        assertFalse(game.hasGameFinished());

        String secondFascist = findFirst(game, Identity.FASCIST);
        assertEquals(AgentShot.Outcome.HIT_FASCIST, game.agentShoot(agent, secondFascist).getOutcome());
        assertFalse(game.getPlayer(secondFascist).isAlive());
        assertTrue(game.getPlayer(agent).isAlive());
    }

    @Test
    public void agentWhoShootsHitlerWinsTheGameForLiberals() {
        SecretHitlerGame game = new SecretHitlerGame(makePlayers(5));
        String agent = findFirst(game, Identity.SECRET_AGENT);
        String hitler = findFirst(game, Identity.HITLER);

        assertEquals(AgentShot.Outcome.HIT_HITLER, game.agentShoot(agent, hitler).getOutcome());
        assertFalse(game.getPlayer(hitler).isAlive());
        assertTrue(game.getPlayer(agent).isAlive());
        assertEquals(GameState.LIBERAL_VICTORY_AGENT, game.getState());
        assertTrue(game.hasGameFinished());
    }

    @Test
    public void agentWhoShootsALiberalDiesAlongWithTheTarget() {
        SecretHitlerGame game = new SecretHitlerGame(makePlayers(7));
        String agent = findFirst(game, Identity.SECRET_AGENT);
        String liberal = findFirst(game, Identity.LIBERAL);

        assertEquals(AgentShot.Outcome.HIT_LIBERAL, game.agentShoot(agent, liberal).getOutcome());
        assertFalse(game.getPlayer(liberal).isAlive());
        assertFalse(game.getPlayer(agent).isAlive());
        assertFalse(game.hasGameFinished());
    }

    private void assertShotRejected(SecretHitlerGame game, String shooter, String target) {
        try {
            game.agentShoot(shooter, target);
            fail("Expected shot by " + shooter + " at " + target + " to be rejected.");
        } catch (IllegalArgumentException | IllegalStateException expected) {
            // expected
        }
    }

    @Test
    public void invalidShotsAreRejectedWithoutKillingAnyone() {
        SecretHitlerGame game = new SecretHitlerGame(makePlayers(7));
        String agent = findFirst(game, Identity.SECRET_AGENT);
        String liberal = findFirst(game, Identity.LIBERAL);
        String fascist = findFirst(game, Identity.FASCIST);

        assertShotRejected(game, liberal, fascist);       // only the secret agent may shoot
        assertShotRejected(game, agent, agent);           // cannot shoot yourself
        assertShotRejected(game, agent, "nobody");        // target must exist
        assertEquals(7, game.getLivingPlayerCount());

        game.agentShoot(agent, fascist);
        assertShotRejected(game, agent, fascist);         // target must be alive

        game.agentShoot(agent, liberal);                   // agent dies
        String otherFascist = findFirst(game, Identity.FASCIST);
        assertShotRejected(game, agent, otherFascist);    // dead agents cannot shoot
        assertTrue(game.getPlayer(otherFascist).isAlive());
    }

    @Test
    public void agentCannotShootAfterTheGameHasEnded() {
        SecretHitlerGame game = new SecretHitlerGame(makePlayers(7));
        String agent = findFirst(game, Identity.SECRET_AGENT);
        game.agentShoot(agent, findFirst(game, Identity.HITLER));

        String fascist = findFirst(game, Identity.FASCIST);
        assertShotRejected(game, agent, fascist);
        assertTrue(game.getPlayer(fascist).isAlive());
    }

    /** Roles are random, so deal new games until one satisfies the scenario's requirements. */
    private SecretHitlerGame dealUntil(int numPlayers, Predicate<SecretHitlerGame> requirement) {
        for (int i = 0; i < 10000; i++) {
            SecretHitlerGame game = new SecretHitlerGame(makePlayers(numPlayers));
            if (requirement.test(game)) {
                return game;
            }
        }
        throw new AssertionError("Could not deal a game matching the requirement.");
    }

    private Identity idOf(SecretHitlerGame game, String username) {
        return game.getPlayer(username).getIdentity();
    }

    @Test
    public void shootingThePresidentDuringNominationPassesThePresidency() {
        SecretHitlerGame game = dealUntil(7, g -> idOf(g, "0") == Identity.FASCIST);
        String agent = findFirst(game, Identity.SECRET_AGENT);
        int round = game.getRound();

        game.agentShoot(agent, "0");

        assertEquals(GameState.CHANCELLOR_NOMINATION, game.getState());
        assertEquals("1", game.getCurrentPresident());
        assertEquals(round + 1, game.getRound());
    }

    private void everyoneVotes(SecretHitlerGame game, boolean vote) {
        for (Player player : game.getPlayerList()) {
            if (player.isAlive() && !game.hasPlayerVoted(player.getUsername())) {
                game.registerVote(player.getUsername(), vote);
            }
        }
    }

    @Test
    public void shootingTheChancellorMidLegislationDiscardsTheHandAndPassesThePresidency() {
        // Player "1" is a fascist chancellor candidate; "0" is president.
        SecretHitlerGame game = dealUntil(7, g -> idOf(g, "1") == Identity.FASCIST);
        String agent = findFirst(game, Identity.SECRET_AGENT);
        int totalPolicies = SecretHitlerGame.NUM_FASCIST_POLICIES + SecretHitlerGame.NUM_LIBERAL_POLICIES;

        game.nominateChancellor("1");
        everyoneVotes(game, true);
        game.presidentDiscardPolicy(0);
        assertEquals(GameState.LEGISLATIVE_CHANCELLOR, game.getState());

        game.agentShoot(agent, "1");

        assertEquals(GameState.CHANCELLOR_NOMINATION, game.getState());
        assertEquals("2", game.getCurrentPresident());
        assertNull(game.getCurrentChancellor());
        assertEquals(0, game.getNumFascistPolicies() + game.getNumLiberalPolicies());
        assertEquals(3, game.getDiscardSize());
        assertEquals(totalPolicies, game.getDrawSize() + game.getDiscardSize());
    }

    @Test
    public void shootingTheLastOutstandingVoterResolvesTheVote() {
        // "0" president, "1" chancellor; "2" is a fascist bystander who has not voted yet.
        SecretHitlerGame game = dealUntil(7, g -> idOf(g, "2") == Identity.FASCIST
                && idOf(g, "1") != Identity.HITLER);
        String agent = findFirst(game, Identity.SECRET_AGENT);

        game.nominateChancellor("1");
        for (Player player : game.getPlayerList()) {
            if (!player.getUsername().equals("2")) {
                game.registerVote(player.getUsername(), true);
            }
        }
        assertEquals(GameState.CHANCELLOR_VOTING, game.getState());

        game.agentShoot(agent, "2");

        assertEquals(GameState.LEGISLATIVE_PRESIDENT, game.getState());
        assertEquals("0", game.getCurrentPresident());
        assertEquals("1", game.getCurrentChancellor());
    }
}
