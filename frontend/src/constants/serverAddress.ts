export interface ServerAddressEnv {
  REACT_APP_SAME_ORIGIN?: string;
  REACT_APP_SERVER_ADDRESS?: string;
  REACT_APP_SERVER_ADDRESS_HTTP?: string;
  REACT_APP_WEBSOCKET_HEADER?: string;
}

export interface PageLocation {
  protocol: string;
  host: string;
}

export interface ServerAddress {
  address: string; // host[:port], used to build the websocket URL.
  http: string; // base URL for HTTP requests.
  websocketHeader: string; // "ws://" or "wss://".
  siteUrl: string; // public URL of this website, used for lobby invite links.
}

/**
 * Works out where the game server lives.
 * In same-origin mode (self-hosting, where the backend also serves this page),
 * the server is whatever host the page was loaded from.
 */
export function resolveServerAddress(
  env: ServerAddressEnv,
  location: PageLocation
): ServerAddress {
  if (env.REACT_APP_SAME_ORIGIN === "true") {
    const origin = location.protocol + "//" + location.host;
    return {
      address: location.host,
      http: origin,
      websocketHeader: location.protocol === "https:" ? "wss://" : "ws://",
      siteUrl: origin,
    };
  }
  const address =
    env.REACT_APP_SERVER_ADDRESS || "secret-hitler-online.fly.dev";
  return {
    address,
    http: env.REACT_APP_SERVER_ADDRESS_HTTP || "https://" + address,
    websocketHeader: env.REACT_APP_WEBSOCKET_HEADER || "wss://",
    siteUrl: "https://secret-hitler.online",
  };
}
