import { resolveServerAddress } from "./serverAddress";

test("same-origin mode over http talks to the page's own host with ws://", () => {
  const result = resolveServerAddress(
    { REACT_APP_SAME_ORIGIN: "true" },
    { protocol: "http:", host: "192.168.1.20:8080" }
  );
  expect(result).toEqual({
    address: "192.168.1.20:8080",
    http: "http://192.168.1.20:8080",
    websocketHeader: "ws://",
    siteUrl: "http://192.168.1.20:8080",
  });
});

test("same-origin mode over https uses wss:// so browsers allow the socket", () => {
  const result = resolveServerAddress(
    { REACT_APP_SAME_ORIGIN: "true" },
    { protocol: "https:", host: "games.example.com" }
  );
  expect(result).toEqual({
    address: "games.example.com",
    http: "https://games.example.com",
    websocketHeader: "wss://",
    siteUrl: "https://games.example.com",
  });
});

test("without same-origin mode, falls back to the public server", () => {
  const result = resolveServerAddress(
    {},
    { protocol: "http:", host: "localhost:3000" }
  );
  expect(result).toEqual({
    address: "secret-hitler-online.fly.dev",
    http: "https://secret-hitler-online.fly.dev",
    websocketHeader: "wss://",
    siteUrl: "https://secret-hitler.online",
  });
});

test("without same-origin mode, explicit env addresses are used as given", () => {
  const result = resolveServerAddress(
    {
      REACT_APP_SERVER_ADDRESS: "localhost:4040",
      REACT_APP_SERVER_ADDRESS_HTTP: "http://localhost:4040",
      REACT_APP_WEBSOCKET_HEADER: "ws://",
    },
    { protocol: "http:", host: "localhost:3000" }
  );
  expect(result).toEqual({
    address: "localhost:4040",
    http: "http://localhost:4040",
    websocketHeader: "ws://",
    siteUrl: "https://secret-hitler.online",
  });
});

test("invite links point at the self-hosted site in same-origin mode", () => {
  const result = resolveServerAddress(
    { REACT_APP_SAME_ORIGIN: "true" },
    { protocol: "https:", host: "games.example.com" }
  );
  expect(result.siteUrl).toBe("https://games.example.com");
});

test("invite links point at the public site otherwise", () => {
  const result = resolveServerAddress(
    {},
    { protocol: "http:", host: "localhost:3000" }
  );
  expect(result.siteUrl).toBe("https://secret-hitler.online");
});
