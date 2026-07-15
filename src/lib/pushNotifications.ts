import { getToken, onMessage, deleteToken } from "firebase/messaging";
import { getMessagingInstance } from "./firebase";
import { supabase } from "./supabase";

const VAPID_KEY = "BDZ4uN_no-rSBlF-DOYvTlAnAGJ7wDzorZSiYomvSmzayJgcOqRQy1VmKlNpDK5EutkwqaHi_yGZTpbBcDkyIgc";

// Helper to get messaging instance (returns null if not available)
async function ensureMessaging() {
  const messaging = await getMessagingInstance();
  if (!messaging) {
    console.warn("Firebase messaging is not available in this environment.");
  }
  return messaging;
}

export async function requestPushPermission(userId: string) {
  try {
    const messaging = await ensureMessaging();
    if (!messaging) return null;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: await navigator.serviceWorker.getRegistration(),
    });

    if (!token) return null;

    // Save the token to the user's profile
    await supabase.from("profiles").update({ fcm_token: token }).eq("id", userId);
    return token;
  } catch (error) {
    console.error("Failed to get push permission:", error);
    return null;
  }
}

export async function removePushToken(userId: string) {
  try {
    const messaging = await ensureMessaging();
    if (!messaging) return;

    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    if (token) await deleteToken(messaging);
    await supabase.from("profiles").update({ fcm_token: null }).eq("id", userId);
  } catch (error) {
    console.error("Failed to remove push token:", error);
  }
}

export function onForegroundMessage(callback: (payload: any) => void) {
  // This needs to be handled carefully because it's synchronous.
  // We'll call ensureMessaging inside and attach listener once available.
  (async () => {
    const messaging = await ensureMessaging();
    if (messaging) {
      onMessage(messaging, (payload) => {
        callback(payload);
      });
    }
  })();
}