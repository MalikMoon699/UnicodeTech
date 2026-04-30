importScripts(
  "https://www.gstatic.com/firebasejs/10.3.0/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.3.0/firebase-messaging-compat.js",
);

const API_LINK = "https://unicodetech-two.vercel.app";

const decodeConfig = (encoded) => {
  return atob(encoded);
};

const encodeConfig = {
  apiKey: "QUl6YVN5QWJkTXZLcWx0dV9tTjRtUHJQVUstTVlJTEZsSjhudW04",
  authDomain: "cHVzaG5vdGlmaWNhdGlvbi1hOTkwNS5maXJlYmFzZWFwcC5jb20=",
  projectId: "cHVzaG5vdGlmaWNhdGlvbi1hOTkwNQ==",
  storageBucket: "cHVzaG5vdGlmaWNhdGlvbi1hOTkwNS5maXJlYmFzZXN0b3JhZ2UuYXBw",
  messagingSenderId: "NzkyMjkyNDUxOTU5",
  appId: "MTo3OTIyOTI0NTE5NTk6d2ViOjQ4ZGM5OGU0ODA0YzIwMGE5ZWM4NzI=",
  measurementId: "Ry0wNTMwQ1NMOUw5TA==",
};

firebase.initializeApp({
  apiKey: decodeConfig(encodeConfig.apiKey),
  authDomain: decodeConfig(encodeConfig.authDomain),
  projectId: decodeConfig(encodeConfig.projectId),
  storageBucket: decodeConfig(encodeConfig.storageBucket),
  messagingSenderId: decodeConfig(encodeConfig.messagingSenderId),
  appId: decodeConfig(encodeConfig.appId),
  measurementId: decodeConfig(encodeConfig.measurementId),
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon,
    data: payload.data,
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  let clickUrl = event.notification.data?.clickUrl || "/";
  if (!clickUrl.startsWith("http")) {
    clickUrl = new URL(clickUrl, API_LINK).href;
  }

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (let client of windowClients) {
          if (client.url === clickUrl && "focus" in client) {
            return client.focus();
          }
        }
        return clients.openWindow(clickUrl).catch((err) => {
          console.error("Failed to open window:", err);
          if (clickUrl !== self.location.origin + "/") {
            return clients.openWindow(self.location.origin + "/");
          }
          throw err;
        });
      }),
  );
});