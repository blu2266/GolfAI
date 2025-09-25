import { Capacitor, type PluginListenerHandle } from "@capacitor/core";
import { App, type URLOpenListenerEvent } from "@capacitor/app";
import { Browser } from "@capacitor/browser";

import { resolveApiUrl } from "./api";

const NATIVE_RETURN_URL = "golfai://auth";
let appUrlListener: PluginListenerHandle | undefined;

function resolveReturnPath(url: string): string | undefined {
  try {
    const parsed = new URL(url);
    const explicitPath = parsed.searchParams.get("path");
    if (explicitPath && explicitPath.startsWith("/")) {
      return explicitPath;
    }

    const normalizedPath = parsed.pathname;
    if (normalizedPath && normalizedPath !== "/") {
      return normalizedPath.startsWith("/") ? normalizedPath : `/${normalizedPath}`;
    }
  } catch {
    return undefined;
  }

  return undefined;
}

function defaultReturnHandler(target?: string) {
  if (target) {
    window.location.href = target;
  } else {
    window.location.href = "/";
  }
}

export async function launchLogin(onReturn?: (target?: string) => void) {
  if (!Capacitor.isNativePlatform()) {
    window.location.href = "/api/login";
    return;
  }

  await cleanupNativeAuthListener();

  const listener = await App.addListener("appUrlOpen", async (event: URLOpenListenerEvent) => {
    if (!event.url || !event.url.toLowerCase().startsWith(NATIVE_RETURN_URL)) {
      return;
    }

    await Browser.close();
    await cleanupNativeAuthListener();

    const handler = onReturn ?? defaultReturnHandler;
    const target = resolveReturnPath(event.url) ?? "/";
    handler(target);
  });

  appUrlListener = listener;

  const loginUrl = new URL(resolveApiUrl("/api/login"), window.location.origin);
  loginUrl.searchParams.set("returnTo", NATIVE_RETURN_URL);

  const loginTarget = loginUrl.toString();

  if (!/^https?:\/\//i.test(loginTarget)) {
    console.error(
      "Native login requires VITE_API_BASE_URL to be set to a fully qualified https URL. Falling back to window navigation.",
    );
    window.location.href = loginTarget;
    return;
  }

  await Browser.open({ url: loginTarget, presentationStyle: "popover" });
}

export async function cleanupNativeAuthListener() {
  if (appUrlListener) {
    await appUrlListener.remove();
    appUrlListener = undefined;
  }
}
