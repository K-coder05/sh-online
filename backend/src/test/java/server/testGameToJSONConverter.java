package server;

import game.SecretHitlerGame;
import game.datastructures.Identity;
import game.datastructures.Player;
import org.json.JSONObject;
import org.junit.Test;
import server.util.GameToJSONConverter;

import java.util.ArrayList;

import static junit.framework.TestCase.*;

public class testGameToJSONConverter {

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

    @Test
    public void everyPlayerIsToldAboutTheLatestAgentShot() {
        SecretHitlerGame game = newGame(7);
        String agent = findFirst(game, Identity.SECRET_AGENT);
        String liberal = findFirst(game, Identity.LIBERAL);
        String fascist = findFirst(game, Identity.FASCIST);

        assertFalse(GameToJSONConverter.convert(game, liberal).has("agentShot"));

        game.agentShoot(agent, fascist);
        JSONObject first = GameToJSONConverter.convert(game, liberal).getJSONObject("agentShot");
        assertEquals(agent, first.getString("shooter"));
        assertEquals(fascist, first.getString("target"));
        assertEquals("HIT_FASCIST", first.getString("outcome"));

        game.agentShoot(agent, liberal);
        String hitler = findFirst(game, Identity.HITLER);
        JSONObject second = GameToJSONConverter.convert(game, hitler).getJSONObject("agentShot");
        assertEquals(liberal, second.getString("target"));
        assertEquals("HIT_LIBERAL", second.getString("outcome"));
        // Each shot gets a new id so clients can tell repeated shots apart.
        assertTrue(second.getInt("id") > first.getInt("id"));
    }

    private JSONObject playersSeenBy(SecretHitlerGame game, String viewer) {
        return GameToJSONConverter.convert(game, viewer).getJSONObject("players");
    }

    @Test
    public void fascistsSeeTheSecretAgentButLiberalsDoNot() {
        SecretHitlerGame game = newGame(7);
        String agent = findFirst(game, Identity.SECRET_AGENT);
        String liberal = findFirst(game, Identity.LIBERAL);
        String fascist = findFirst(game, Identity.FASCIST);
        String hitler = findFirst(game, Identity.HITLER);

        assertEquals("SECRET_AGENT", playersSeenBy(game, fascist).getJSONObject(agent).getString("id"));
        assertEquals("SECRET_AGENT", playersSeenBy(game, agent).getJSONObject(agent).getString("id"));
        assertFalse(playersSeenBy(game, liberal).getJSONObject(agent).has("id"));
        assertFalse(playersSeenBy(game, hitler).getJSONObject(agent).has("id")); // 7+ players: Hitler is blind
        assertFalse(playersSeenBy(game, agent).getJSONObject(fascist).has("id"));
    }
}
