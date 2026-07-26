import { Client, type IFrame, type StompConfig, type StompHeaders } from "@stomp/stompjs";
import { getAccessToken, getAccessTokenSnapshot } from "@/lib/auth/accessToken";
import {
  ensureFreshAccessToken,
  isAccessTokenRefreshDue,
} from "@/lib/auth/refreshCoordinator";

const DEFAULT_RECONNECT_DELAY = 5000;
const DEFAULT_HEARTBEAT_INCOMING = 4000;
const DEFAULT_HEARTBEAT_OUTGOING = 4000;

type StompLifecycleHandlers = {
  onBeforeConnect?: (client: Client) => void;
  onConnect?: (frame: IFrame, client: Client) => void;
  onStompError?: (frame: IFrame, client: Client) => void;
  onWebSocketClose?: (event: CloseEvent, client: Client) => void;
};

type StompConnectListener = (frame: IFrame, client: Client) => void;

type PublishStompMessageParams = {
  destination: string;
  body: string;
  headers?: StompHeaders;
};

export type CreateStompClientOptions = StompLifecycleHandlers & {
  brokerURL?: string;
  connectHeaders?: StompHeaders;
  getConnectHeaders?: () => StompHeaders;
  debug?: StompConfig["debug"];
  reconnectDelay?: number;
  heartbeatIncoming?: number;
  heartbeatOutgoing?: number;
};

let stompClient: Client | null = null;
let stompClientOptions: CreateStompClientOptions | null = null;
const stompConnectListeners = new Set<StompConnectListener>();

function getBrokerURL(override?: string) {
  const brokerURL = override ?? process.env.NEXT_PUBLIC_STOMP_BROKER_URL;

  if (!brokerURL) {
    throw new Error("NEXT_PUBLIC_STOMP_BROKER_URL is not configured.");
  }

  return brokerURL;
}

function buildAuthorizationHeaders(accessToken: string | null) {
  const headers: StompHeaders = {};

  if (!accessToken) {
    return headers;
  }

  headers.Authorization = `Bearer ${accessToken}`;

  return headers;
}

function mergeConnectHeaders(baseHeaders: StompHeaders, nextHeaders: StompHeaders) {
  return {
    ...baseHeaders,
    ...nextHeaders,
  } satisfies StompHeaders;
}

function resolveConnectHeadersSync(options: CreateStompClientOptions) {
  const optionHeaders = options.getConnectHeaders?.() ?? options.connectHeaders ?? {};
  const authorizationHeaders = buildAuthorizationHeaders(getAccessToken());

  return mergeConnectHeaders(optionHeaders, authorizationHeaders);
}

async function resolveConnectHeaders(options: CreateStompClientOptions) {
  const tokenSnapshot = getAccessTokenSnapshot();

  if (!tokenSnapshot.token || isAccessTokenRefreshDue(Date.now(), tokenSnapshot)) {
    try {
      await ensureFreshAccessToken({ reason: "stomp" });
    } catch {
      // Keep the original connection flow when refresh preflight fails.
    }
  }

  const optionHeaders = options.getConnectHeaders?.() ?? options.connectHeaders ?? {};
  const authorizationHeaders = buildAuthorizationHeaders(getAccessToken());

  return mergeConnectHeaders(optionHeaders, authorizationHeaders);
}

function buildDebugLogger(debug?: StompConfig["debug"]) {
  if (debug) {
    return debug;
  }

  if (process.env.NODE_ENV !== "development") {
    return () => {};
  }

  return (message: string) => {
    console.log(`[stomp] ${message}`);
  };
}

function attachLifecycleHandlers(client: Client, options: CreateStompClientOptions) {
  client.onConnect = (frame) => {
    stompConnectListeners.forEach((listener) => {
      listener(frame, client);
    });

    options.onConnect?.(frame, client);
  };

  client.onStompError = (frame) => {
    console.error("Broker reported error:", frame.headers.message ?? "Unknown STOMP error");
    console.error("Additional details:", frame.body);
    options.onStompError?.(frame, client);
  };

  client.onWebSocketClose = (event) => {
    options.onWebSocketClose?.(event, client);
  };
}

export function createStompClient(options: CreateStompClientOptions = {}) {
  const client = new Client({
    brokerURL: getBrokerURL(options.brokerURL),
    connectHeaders: resolveConnectHeadersSync(options),
    debug: buildDebugLogger(options.debug),
    reconnectDelay: options.reconnectDelay ?? DEFAULT_RECONNECT_DELAY,
    heartbeatIncoming: options.heartbeatIncoming ?? DEFAULT_HEARTBEAT_INCOMING,
    heartbeatOutgoing: options.heartbeatOutgoing ?? DEFAULT_HEARTBEAT_OUTGOING,
    beforeConnect: async () => {
      options.onBeforeConnect?.(client);
      client.connectHeaders = await resolveConnectHeaders(options);
    },
  });

  attachLifecycleHandlers(client, options);

  return client;
}

export function configureStompClient(options: CreateStompClientOptions = {}) {
  stompClientOptions = options;

  if (!stompClient) {
    stompClient = createStompClient(options);
    return stompClient;
  }

  stompClient.configure({
    brokerURL: getBrokerURL(options.brokerURL),
    connectHeaders: resolveConnectHeadersSync(options),
    debug: buildDebugLogger(options.debug),
    reconnectDelay: options.reconnectDelay ?? DEFAULT_RECONNECT_DELAY,
    heartbeatIncoming: options.heartbeatIncoming ?? DEFAULT_HEARTBEAT_INCOMING,
    heartbeatOutgoing: options.heartbeatOutgoing ?? DEFAULT_HEARTBEAT_OUTGOING,
    beforeConnect: async () => {
      if (stompClient) {
        options.onBeforeConnect?.(stompClient);
        stompClient.connectHeaders = await resolveConnectHeaders(options);
      }
    },
  });

  attachLifecycleHandlers(stompClient, options);

  return stompClient;
}

export function getStompClient() {
  if (!stompClient) {
    return configureStompClient();
  }

  return stompClient;
}

export function activateStompClient(options?: CreateStompClientOptions) {
  const client = options ? configureStompClient(options) : getStompClient();

  if (!client.active) {
    client.activate();
  }

  return client;
}

export async function restartStompClient(
  shouldReactivate: () => boolean = () => true,
) {
  if (!stompClient) {
    return null;
  }

  const client = stompClient;

  if (client.active) {
    await client.deactivate();
  }

  if (stompClient !== client || !shouldReactivate()) {
    return client;
  }

  client.activate();
  return client;
}

export async function deactivateStompClient() {
  if (!stompClient) {
    return;
  }

  const client = stompClient;

  stompClient = null;
  stompClientOptions = null;

  if (client.active) {
    await client.deactivate();
  }
}

export function getStompClientOptions() {
  return stompClientOptions;
}

export function addStompConnectListener(listener: StompConnectListener) {
  stompConnectListeners.add(listener);

  return () => {
    stompConnectListeners.delete(listener);
  };
}

export function publishStompMessage({ destination, body, headers }: PublishStompMessageParams) {
  const client = getStompClient();

  if (!client.connected) {
    throw new Error("STOMP client is not connected.");
  }

  client.publish({
    destination,
    body,
    headers,
  });
}
