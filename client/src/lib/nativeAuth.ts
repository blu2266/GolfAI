import { Capacitor } from "@capacitor/core";
import type { PluginListenerHandle } from "@capacitor/core";
import { App } from "@capacitor/app";
import { Browser } from "@capacitor/browser";

const LOGIN_PATH = "/api/login";
const NATIVE_AUTH_DEEP_LINK = "golfai://auth/callback"; // Stub #1 deep link

function buildNativeLoginUrl() {
  const encodedReturnTo = encodeURIComponent(NATIVE_AUTH_DEEP_LINK);
  return `${LOGIN_PATH}?returnTo=${encodedReturnTo}`;
}

type NavigateHome = () => void;

export async function startNativeAuthFlow(
  navigateHome: NavigateHome
): Promise<(() => void) | void> {
  if (!Capacitor.isNativePlatform()) {
    window.location.href = LOGIN_PATH;
    return;
  }

  let listenerHandle: PluginListenerHandle | undefined;
  const loginUrl = buildNativeLoginUrl();

  try {
    listenerHandle = await App.addListener("appUrlOpen", async (event) => {
      const incomingUrl = event.url ?? "";

      if (!incomingUrl.startsWith(NATIVE_AUTH_DEEP_LINK)) {
        return;
      }

      navigateHome();
      await Browser.close();

      if (listenerHandle) {
        await listenerHandle.remove();
        listenerHandle = undefined;
      }
    });

    await Browser.open({ url: loginUrl });

    return () => {
      if (!listenerHandle) {
        return;
      }

      void listenerHandle.remove();
      listenerHandle = undefined;
    };
  } catch (error) {
    if (listenerHandle) {
      void listenerHandle.remove();
    }

    throw error;
  }
}
