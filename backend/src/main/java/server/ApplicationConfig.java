package server;

public class ApplicationConfig {
    private static final String ENV_DEBUG = "DEBUG_MODE";
    private static final String ENV_DATABASE_URL = "DATABASE_URL";
    private static final String ENV_STATIC_FILES_DIR = "STATIC_FILES_DIR";

    public static boolean DEBUG = System.getenv(ENV_DEBUG) != null;
    public static String DATABASE_URI = System.getenv(ENV_DATABASE_URL);
    // When set, the built frontend in this directory is served alongside the API (self-hosting).
    public static String STATIC_FILES_DIR = System.getenv(ENV_STATIC_FILES_DIR);
}
