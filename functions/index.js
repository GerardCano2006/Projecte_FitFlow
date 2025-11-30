const functions = require("firebase-functions/v1"); // Important: v1
const admin = require("firebase-admin");

admin.initializeApp();

// 1. Notificar a l'Entrenador quan hi ha una nova reserva (o baixa)
exports.notifyTrainerOnBooking = functions.firestore
  .document("booking_logs/{logId}")
  .onCreate(async (snap, context) => {
    const logData = snap.data();
    const { action, classTitle, trainerName, userName } = logData;

    console.log(`Nou log detectat: ${action} de ${userName} per a ${trainerName}`);

    // Busquem l'entrenador per nom
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

    // Creem una llista de promeses per enviar tots els missatges
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
        // Capturem l'error individual per no parar tot el procés
        return admin.messaging().send(message).catch(error => {
            console.log(`Error enviant a l'usuari ${userId}:`, error);
        });
      }
    });

    await Promise.all(promises);
  });