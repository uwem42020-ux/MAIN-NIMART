// public/firebase-messaging-sw.js

// Firebase service worker for background push notifications (no fetch handler)
importScripts("https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.9.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyCCSOq11ORgRJ2978hOUaQ6bsAHNWNyC2g",
  authDomain: "nimart-9ccb9.firebaseapp.com",
  projectId: "nimart-9ccb9",
  storageBucket: "nimart-9ccb9.firebasestorage.app",
  messagingSenderId: "813664294734",
  appId: "1:813664294734:web:abda56291a587157bef01f",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {};
  self.registration.showNotification(title || "Nimart", {
    body: body || "You have a new notification",
    icon: "/logo.png",
    badge: "/logo.png",
    tag: payload.data?.tag || "default",
  });
});

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// No fetch listener — all network requests go straight to the server/network