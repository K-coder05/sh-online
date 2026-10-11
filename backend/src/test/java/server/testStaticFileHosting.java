package server;

import io.javalin.Javalin;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;

import static junit.framework.TestCase.*;

public class testStaticFileHosting {

    private Path siteDir;
    private Javalin app;
    private final HttpClient client = HttpClient.newHttpClient();

    @Before
    public void setUp() throws Exception {
        siteDir = Files.createTempDirectory("sh-site");
        Files.writeString(siteDir.resolve("index.html"), "<html>secret hitler frontend</html>");
        app = SecretHitlerServer.createApp(siteDir.toString()).start(0);
    }

    @After
    public void tearDown() {
        app.stop();
    }

    private HttpResponse<String> get(String path) throws Exception {
        HttpRequest request = HttpRequest.newBuilder(URI.create("http://localhost:" + app.port() + path)).build();
        return client.send(request, HttpResponse.BodyHandlers.ofString());
    }

    @Test
    public void testServesFrontendAtRoot() throws Exception {
        HttpResponse<String> response = get("/");
        assertEquals(200, response.statusCode());
        assertTrue(response.body().contains("secret hitler frontend"));
    }

    @Test
    public void testApiStillAvailableAlongsideFrontend() throws Exception {
        HttpResponse<String> response = get("/ping");
        assertEquals(200, response.statusCode());
        assertEquals("OK", response.body());
    }
}
