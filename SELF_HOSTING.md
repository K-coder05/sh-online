# Self-hosting Secret Hitler Online

Run your own copy of the game, including your own modifications, and play with friends.

The self-host setup builds the frontend and backend into **one container**. The Java server serves the website and the game API from the same address, so there is only one URL to share and nothing to configure per address. A Postgres container keeps lobbies alive when the server restarts.

## 1. Run it

You need [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine on Linux).

From the project root:

```bash
docker compose -f docker-compose.selfhost.yml up -d --build
```

Open [http://localhost:8080](http://localhost:8080). To test it, open a few private/incognito windows and join the same lobby.

| Command | What it does |
| --- | --- |
| `docker compose -f docker-compose.selfhost.yml logs -f app` | Follow server logs |
| `docker compose -f docker-compose.selfhost.yml down` | Stop (lobbies are backed up first) |
| `docker compose -f docker-compose.selfhost.yml up -d --build` | Rebuild after changing code |

Optional settings, in a `.env` file next to the compose file or as environment variables:

- `GAME_PORT`: port on your machine (default `8080`).
- `POSTGRES_PASSWORD`: database password (default `secret`). Use only letters and numbers; symbols like `:` `@` `/` break the connection URL. The database isn't reachable from outside Docker, but change it if you're on a shared machine. If you change it after the first run, also run `docker compose -f docker-compose.selfhost.yml down -v` to recreate the database. This deletes saved lobbies.

## 2. Let your friends in

Pick one of these:

### Option A: Cloudflare quick tunnel (easiest, free, no router setup)
Install [`cloudflared`](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/), then run:

```bash
cloudflared tunnel --url http://localhost:8080
```

It prints an `https://<random>.trycloudflare.com` URL. Send that to your friends. The site switches to secure websockets (`wss://`) automatically over https. The URL changes every time you restart the tunnel. For a permanent URL, set up a named tunnel with a domain on your Cloudflare account.

### Option B: Tailscale (private, friends install an app)
Everyone installs [Tailscale](https://tailscale.com/) and joins your tailnet (or you share your machine with them). Friends then open `http://<your-tailscale-ip>:8080`. Nothing is exposed to the public internet.

### Option C: Port forwarding
Forward TCP port 8080 on your router to your PC's local IP, allow it through Windows Firewall, and share `http://<your-public-ip>:8080`. This exposes your machine directly. Prefer A or B.

### Option D: A cloud server (always on)
On a small Linux VPS (any provider; 1 GB RAM is plenty), install Docker, clone your fork, and run the same `docker compose` command. To get https, either run Option A's tunnel on the VPS or put [Caddy](https://caddyserver.com/docs/quick-starts/reverse-proxy) in front of it (`caddy reverse-proxy --from your.domain --to localhost:8080`).

## 3. Making changes

- Game rules and logic: `backend/src/main/java/game/`
- Server, lobbies and websocket handling: `backend/src/main/java/server/`
- Website / UI: `frontend/src/`

For fast iteration, use the dev setup in [DEVELOPMENT.md](DEVELOPMENT.md) (hot-reloading frontend + local backend). When you're happy, rebuild the self-host container with the `up -d --build` command above.

Run the tests with `./gradlew test` in `backend/`, and `npm test` in `frontend/`.

## How it works

- `Dockerfile` (project root) builds the React app with `REACT_APP_SAME_ORIGIN=true`, builds the server jar, and copies both into a Java runtime image.
- With `REACT_APP_SAME_ORIGIN` set, the frontend sends API requests and opens its websocket to the host the page was loaded from (`frontend/src/constants/serverAddress.ts`).
- With `STATIC_FILES_DIR` set, the backend serves that folder at `/` next to the API routes (`/ping`, `/new-lobby`, `/check-login`, `/game`).

The project is licensed under [CC BY-NC-SA 4.0](LICENSE). You can modify it and host it for your friends, but not commercially, and your changes must use the same license.
