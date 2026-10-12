package server;

import game.SecretHitlerGame;
import game.datastructures.Identity;
import game.datastructures.Player;
import org.json.JSONArray;
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

    @Test
    public void everyoneHearsHecklesButOnlyTheRecipientHearsAWhisper() {
        SecretHitlerGame game = newGame(7);
        String agent = findFirst(game, Identity.SECRET_AGENT);
        String ghost = findFirst(game, Identity.FASCIST);
        String recipient = findFirst(game, Identity.LIBERAL);
        String hitler = findFirst(game, Identity.HITLER);
        game.agentShoot(agent, ghost);

        game.heckle(ghost, "Boo!");
        game.whisper(ghost, recipient, "Psst.");

        JSONArray heckles = GameToJSONConverter.convert(game, hitler).getJSONArray("heckles");
        assertEquals(1, heckles.length());
        assertEquals(ghost, heckles.getJSONObject(0).getString("ghost"));
        assertEquals("Boo!", heckles.getJSONObject(0).getString("text"));

        JSONArray heard = GameToJSONConverter.convert(game, recipient).getJSONArray("whispers");
        assertEquals(1, heard.length());
        JSONObject whisper = heard.getJSONObject(0);
        assertEquals(ghost, whisper.getString("ghost"));
        assertEquals(recipient, whisper.getString("recipient"));
        assertEquals("Psst.", whisper.getString("text"));
        assertEquals(1, GameToJSONConverter.convert(game, ghost).getJSONArray("whispers").length());
        assertEquals(0, GameToJSONConverter.convert(game, hitler).getJSONArray("whispers").length());
    }

    @Test
    public void ghostsAreToldWhetherTheyCanStillWhisper() {
        SecretHitlerGame game = newGame(7);
        String ghost = findFirst(game, Identity.FASCIST);
        String living = findFirst(game, Identity.LIBERAL);
        game.agentShoot(findFirst(game, Identity.SECRET_AGENT), ghost);

        assertTrue(GameToJSONConverter.convert(game, ghost).getBoolean("canWhisper"));
        assertFalse(GameToJSONConverter.convert(game, living).getBoolean("canWhisper"));
        game.whisper(ghost, living, "Psst.");
        assertFalse(GameToJSONConverter.convert(game, ghost).getBoolean("canWhisper"));
    }

    @Test
    public void everyoneSeesTheLatestEmotes() {
        SecretHitlerGame game = newGame(5);
        assertEquals(0, GameToJSONConverter.convert(game, "0").getJSONArray("emotes").length());

        game.emote("3", "salute");

        for (String viewer : new String[] {"0", "3"}) {
            JSONArray emotes = GameToJSONConverter.convert(game, viewer).getJSONArray("emotes");
            assertEquals(1, emotes.length());
            JSONObject emote = emotes.getJSONObject(0);
            assertEquals(1, emote.getInt("id"));
            assertEquals("3", emote.getString("player"));
            assertEquals("salute", emote.getString("emote"));
        }
    }
}
