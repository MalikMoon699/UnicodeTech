importScripts(
  "https://www.gstatic.com/firebasejs/10.3.0/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.3.0/firebase-messaging-compat.js",
);

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
  console.log("[dpn-sw.js] Received background message ", payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon,
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});
