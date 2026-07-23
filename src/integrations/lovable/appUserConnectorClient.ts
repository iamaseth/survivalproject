// Browser-safe App User Connector popup helper — no secrets.

export interface AppUserOAuthResult {
  success: boolean;
  connectorId: string;
  connectionAPIKey?: string;
  offlineAccessAllowed?: boolean;
  error?: string;
}

export interface AppUserOAuthTraceEvent {
  step: string;
  at: string;
  [key: string]: unknown;
}

const OAUTH_MESSAGE_TYPE = "appUserConnectorOAuth";

export async function connectAppUser(opts: {
  connectorId: string;
  gatewayBaseUrl: string;
  start: (targetOrigin: string) => Promise<{ authorizationUrl: string }>;
  onTrace?: (event: AppUserOAuthTraceEvent) => void;
}): Promise<AppUserOAuthResult> {
  const { connectorId, gatewayBaseUrl, start, onTrace } = opts;
  const gatewayOrigin = new URL(gatewayBaseUrl).origin;
  const targetOrigin = window.location.origin;

  const trace = (step: string, details: Record<string, unknown> = {}) => {
    onTrace?.({ step, at: new Date().toISOString(), ...details });
  };

  trace("click-handler-entered", {
    pageUrl: window.location.href,
    targetOrigin,
    appIsInIframe: window.top !== window.self,
    openerExistsOnAppWindow: Boolean(window.opener),
  });

  // Force a real popup window (not an iframe or same-tab navigation). Using
  // `_blank` avoids re-using any existing frame/window that happens to share a
  // name, and `popup=1` hints Chromium/Safari to open a detached window so
  // providers that set X-Frame-Options (Google) don't get framed.
  const popup = window.open(
    "about:blank",
    "_blank",
    "popup=1,width=600,height=720,noopener=no,noreferrer=no",
  );

  trace("window-open-returned", {
    firstUrlOpened: "about:blank",
    target: "_blank",
    features: "popup=1,width=600,height=720,noopener=no,noreferrer=no",
    popupReturned: Boolean(popup),
    popupClosed: popup ? safeRead(() => popup.closed) : null,
    popupHref: popup ? safeRead(() => popup.location.href) : null,
    popupOpenerExists: popup ? safeRead(() => Boolean(popup.opener)) : null,
    popupTopEqualsSelf: popup ? safeRead(() => popup.top === popup.self) : null,
    popupHasFrameElement: popup ? safeRead(() => Boolean(popup.frameElement)) : null,
  });

  if (!popup || popup.closed) {
    return {
      success: false,
      connectorId,
      error: "Popup blocked. Allow popups for this site and try again.",
    };
  }

  let authorizationUrl: string;
  try {
    authorizationUrl = (await start(targetOrigin)).authorizationUrl;
    trace("authorization-url-received", {
      authorizationOrigin: safeUrlOrigin(authorizationUrl),
      authorizationHost: safeUrlHost(authorizationUrl),
      isGoogleAuthorizationUrl: safeUrlHost(authorizationUrl) === "accounts.google.com",
    });
  } catch (e) {
    popup.close();
    trace("oauth-start-failed", { error: e instanceof Error ? e.message : String(e) });
    return { success: false, connectorId, error: e instanceof Error ? e.message : "Failed to start OAuth" };
  }
  popup.location.href = authorizationUrl;
  trace("popup-location-set", {
    navigatedDirectlyToAuthorizationUrl: true,
    destinationOrigin: safeUrlOrigin(authorizationUrl),
    destinationHost: safeUrlHost(authorizationUrl),
    popupHrefAfterSet: safeRead(() => popup.location.href),
    popupOpenerExistsAfterSet: safeRead(() => Boolean(popup.opener)),
    popupTopEqualsSelfAfterSet: safeRead(() => popup.top === popup.self),
    popupHasFrameElementAfterSet: safeRead(() => Boolean(popup.frameElement)),
  });

  return await new Promise<AppUserOAuthResult>((resolve) => {
    const cleanup = () => {
      window.removeEventListener("message", onMessage);
      clearInterval(timer);
    };
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== gatewayOrigin) return;
      const data = event.data as { type?: string; connector_id?: string; success?: boolean; api_key?: string; offline_access_allowed?: boolean; error?: string };
      if (!data || data.type !== OAUTH_MESSAGE_TYPE || data.connector_id !== connectorId) return;
      trace("gateway-message-received", {
        origin: event.origin,
        success: data.success,
        offlineAccessAllowed: data.offline_access_allowed,
        error: data.error,
      });
      cleanup();
      popup.close();
      trace("popup-close-called", { reason: "gateway-message" });
      if (data.success && data.offline_access_allowed === false) {
        resolve({ success: true, connectorId, offlineAccessAllowed: false });
        return;
      }
      if (data.success && data.api_key) {
        resolve({ success: true, connectorId, connectionAPIKey: data.api_key, offlineAccessAllowed: true });
        return;
      }
      resolve({ success: false, connectorId, error: data.error ?? "OAuth failed" });
    };
    window.addEventListener("message", onMessage);
    const timer = setInterval(() => {
      if (popup.closed) {
        cleanup();
        trace("popup-closed-before-message", { reason: "closed-poll" });
        resolve({ success: false, connectorId, error: "Sign in was cancelled" });
      }
    }, 500);
  });
}

function safeRead<T>(read: () => T): T | string {
  try {
    return read();
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

function safeUrlHost(url: string): string | null {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

function safeUrlOrigin(url: string): string | null {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}
