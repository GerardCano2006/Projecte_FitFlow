// AQUEST ÉS EL TEU functions/index.js COMPLET I FINAL

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const axios = require("axios");

initializeApp();
const db = getFirestore();

// ===================================================================
// FUNCIÓ 1: INTERCANVIAR EL TOKEN (Aquesta ja la teníem i funciona)
// ===================================================================
exports.exchangeStravaToken = onCall(
  {
    enforceAppCheck: false,
    secrets: ["STRAVA_CLIENT_ID", "STRAVA_CLIENT_SECRET"],
  },
  async (request) => {
    // ... (El codi d'aquesta funció no canvia)
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Només els usuaris autenticats poden connectar Strava.");
    }
    const code = request.data.code;
    const uid = request.auth.uid;
    if (!code) {
      throw new HttpsError("invalid-argument", "No s'ha proporcionat cap codi d'autorització.");
    }
    const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID;
    const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET;
    try {
      const response = await axios.post("https://www.strava.com/api/v3/oauth/token", null, {
        params: {
          client_id: STRAVA_CLIENT_ID,
          client_secret: STRAVA_CLIENT_SECRET,
          code: code,
          grant_type: "authorization_code",
        },
      });
      const stravaData = response.data;
      await db.collection("users").doc(uid).set(
        {
          strava: {
            accessToken: stravaData.access_token,
            refreshToken: stravaData.refresh_token,
            expiresAt: stravaData.expires_at,
            athleteId: stravaData.athlete.id,
          },
        },
        { merge: true }
      );
      return { success: true, message: "Strava connectat correctament." };
    } catch (error) {
      console.error("Error en l'intercanvi de token de Strava:", error.response ? error.response.data : error.message);
      throw new HttpsError("internal", "No s'ha pogut completar l'intercanvi de token amb Strava.");
    }
  }
);

// ===================================================================
// FUNCIÓ 2: DEMANAR ACTIVITATS (ARA AMB MÉS POTÈNCIA)
// ===================================================================
exports.getStravaActivities = onCall(
  {
    enforceAppCheck: false,
    secrets: ["STRAVA_CLIENT_ID", "STRAVA_CLIENT_SECRET"],
    
    // 👇 --- AQUÍ ESTÀ L'ACTUALITZACIÓ DE POTÈNCIA --- 👇
    timeoutSeconds: 300,  // Li donem 5 minuts (abans 120)
    memory: "1GiB",       // Li donem 1GB de RAM (abans 256MB)
    cpu: 1                // Li donem 1 CPU sencera (abans molt menys)
  },
  async (request) => {
    // 1. Verificar usuari
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Només els usuaris autenticats poden veure les activitats.");
    }
    const uid = request.auth.uid;

    try {
      // 2. Anar a Firestore a buscar la "clau"
      const userDocRef = db.collection("users").doc(uid);
      const userDoc = await userDocRef.get();
      
      if (!userDoc.exists || !userDoc.data().strava) {
        throw new HttpsError("not-found", "No s'ha trobat la connexió de Strava per a aquest usuari.");
      }

      let stravaData = userDoc.data().strava;
      let accessToken = stravaData.accessToken;
      const nowInSeconds = Math.floor(Date.now() / 1000);

      // 3. LÒGICA DE REFRESC
      if (stravaData.expiresAt < nowInSeconds) {
        console.log("Token de Strava caducat. Refrescant...");
        
        const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID;
        const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET;

        const response = await axios.post(
          "https://www.strava.com/api/v3/oauth/token",
          null,
          {
            params: {
              client_id: STRAVA_CLIENT_ID,
              client_secret: STRAVA_CLIENT_SECRET,
              grant_type: "refresh_token",
              refresh_token: stravaData.refreshToken,
            },
          }
        );

        const newStravaData = response.data;
        const newTokens = {
          accessToken: newStravaData.access_token,
          refreshToken: newStravaData.refresh_token,
          expiresAt: newStravaData.expires_at,
        };

        // 4. Desem les claus NOVES
        await userDocRef.set(
          { strava: { ...stravaData, ...newTokens } },
          { merge: true }
        );

        accessToken = newStravaData.access_token;
        console.log("Token refrescat i desat correctament!");
      }
      // --- FI DE LA LÒGICA DE REFRESC ---

      // 5. Fer la trucada a l'API de Strava
      const response = await axios.get(
        "https://www.strava.com/api/v3/athlete/activities",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: { per_page: 5, page: 1 },
        }
      );

      // 6. Retornar les activitats
      return { success: true, activities: response.data };

    } catch (error) {
      console.error("Error al buscar activitats de Strava:", error.response ? error.response.data : error.message);
      
      if (error.response && error.response.status === 401) {
         throw new HttpsError("unauthenticated", "El token de Strava ha caducat. Si us plau, torna't a connectar.");
      }
      
      throw new HttpsError("internal", "No s'han pogut obtenir les activitats de Strava.");
    }
  }
);