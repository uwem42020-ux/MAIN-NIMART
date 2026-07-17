// Firebase service worker for background push notifications
// Version bump to force refresh when you deploy
const CACHE_VERSION = 'nimart-v2';

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

// Background push notification handler
messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {};
  self.registration.showNotification(title || "Nimart", {
    body: body || "You have a new notification",
    icon: "/logo.png",
    badge: "/logo.png",
    tag: payload.data?.tag || "default",
  });
});

// Force the waiting service worker to activate immediately and take over all pages
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});