const functions = require("firebase-functions/v1"); // Usem v1 per estabilitat
const admin = require("firebase-admin");
const axios = require("axios");
const cors = require("cors")({ origin: true }); // Permetre connexions des de qualsevol lloc

// Evitem errors si admin ja està inicialitzat
if (admin.apps.length === 0) {
  admin.initializeApp();
}

// ==========================================================
//  PART 1: NOTIFICACIONS (ENTRENADOR I ALUMNES)
// ==========================================================

// 1. Notificar a l'Entrenador quan hi ha una nova reserva (o baixa)
exports.notifyTrainerOnBooking = functions.firestore
  .document("booking_logs/{logId}")
  .onCreate(async (snap, context) => {
    const logData = snap.data();
    const { action, classTitle, trainerName, userName } = logData;

    console.log(`Nou log detectat: ${action} de ${userName} per a ${trainerName}`);

    const trainerQuery = await admin.firestore().collection("users")
      .where("role", "==", "entrenador")
      .where("name", "==", trainerName)
      .limit(1)
      .get();

    if (trainerQuery.empty) {
      console.log("No s'ha trobat l'entrenador:", trainerName);
      return null;
    }

    const trainerDoc = trainerQuery.docs[0];
    const trainerToken = trainerDoc.data().fcmToken;

    if (!trainerToken) {
      console.log("L'entrenador no té notificacions activades.");
      return null;
    }

    const title = action === "book" ? "Nova Reserva! 🎉" : "Baixa a la classe 📉";
    const body = action === "book" 
      ? `${userName} s'ha apuntat a ${classTitle}.`
      : `${userName} s'ha donat de baixa de ${classTitle}.`;

    const message = {
      notification: { title: title, body: body },
      token: trainerToken
    };

    try {
      await admin.messaging().send(message);
      console.log("Notificació enviada.");
    } catch (error) {
      console.error("Error enviant notificació:", error);
    }
  });

// 2. Notificar als Alumnes quan s'elimina una classe
exports.notifyUsersOnClassDelete = functions.firestore
  .document("classes/{classId}")
  .onDelete(async (snap, context) => {
    const classData = snap.data();
    const { title, participants } = classData;

    if (!participants || participants.length === 0) return;

    const promises = participants.map(async (userId) => {
      const userDoc = await admin.firestore().collection("users").doc(userId).get();
      if (!userDoc.exists) return;
      
      const userToken = userDoc.data().fcmToken;
      if (userToken) {
        const message = {
          notification: {
            title: "Classe Cancel·lada ⚠️",
            body: `La sessió de ${title} ha estat cancel·lada.`
          },
          token: userToken
        };
        return admin.messaging().send(message).catch(e => console.error(e));
      }
    });

    await Promise.all(promises);
  });

// ==========================================================
//  PART 2: STRAVA API (INTERCANVI DE TOKENS I ACTIVITATS)
// ==========================================================

// 3. Canviar el codi temporal per un Token permanent (Login)
exports.exchangeStravaToken = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const { code } = req.body;

      if (!code) {
         return res.status(400).json({ error: "No ha arribat el codi d'autorització." });
      }
      
      // ==================================================================
      // ⚠️ ZONA DE CONFIGURACIÓ MANUAL - EDITA AQUESTES 2 LÍNIES ⚠️
      // ==================================================================
      // Substitueix el text entre cometes per les teves claus reals de Strava
      const clientId = "184885";       // Exemple: "123456"
      const clientSecret = "0c606ea8c41256a4c414186c66b61a6c13ac19c5"; // Exemple: "a1b2c3d4e5..."
      // ==================================================================

      console.log(`Intentant intercanviar codi Strava amb ID: ${clientId}`);

      const response = await axios.post("https://www.strava.com/oauth/token", {
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        grant_type: "authorization_code",
      });

      console.log("Èxit! Token rebut de Strava.");
      res.status(200).send(response.data);

    } catch (error) {
      // Millorem el missatge d'error per veure què passa exactament
      const errorMsg = error.response ? error.response.data : error.message;
      console.error("Error CRÍTIC a Strava Exchange:", JSON.stringify(errorMsg));
      
      res.status(500).send({ 
          error: "Error connectant amb Strava", 
          details: errorMsg 
      });
    }
  });
});

// 4. Obtenir les activitats de l'usuari
exports.getStravaActivities = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const { accessToken } = req.body; 

      if (!accessToken) {
        return res.status(400).send({ error: "Falta l'accessToken" });
      }

      console.log("Demanant activitats a Strava...");

      const response = await axios.get("https://www.strava.com/api/v3/athlete/activities", {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { per_page: 30 }
      });

      res.status(200).send(response.data);
    } catch (error) {
      console.error("Error obtenint activitats:", error.response ? error.response.data : error.message);
      res.status(500).send({ error: "Error llegint activitats de Strava" });
    }
  });
});