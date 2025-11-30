importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// La teva configuració (la mateixa que firebaseConfig)
const firebaseConfig = {
  apiKey: "AIzaSyDuFHo8CCPui5NZ-TQZVTZq_cHbvF6Ep3M",
  authDomain: "fitflow-2839c.firebaseapp.com",
  projectId: "fitflow-2839c",
  storageBucket: "fitflow-2839c.firebasestorage.app",
  messagingSenderId: "363448656051",
  appId: "1:363448656051:web:24b1b4ab8911b1d03450c6",
  measurementId: "G-5HS77D64RP"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Això gestiona les notificacions quan l'app està en segon pla
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Notificació rebuda en segon pla ', payload);
  // Aquí pots personalitzar com es veu la notificació
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo192.png' // Icona de la teva app (si en tens)
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});