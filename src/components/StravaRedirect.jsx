import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { auth, db } from '../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth'; // <--- IMPORTANT: Nova importació
import axios from 'axios';

function StravaRedirect() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("Esperant usuari...");

  useEffect(() => {
    // Aquesta funció "escolta" quan Firebase acaba de carregar l'usuari
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      
      if (!user) {
        // Si després de carregar, realment no hi ha usuari
        setStatus("Error: No s'ha detectat cap sessió d'usuari.");
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      // Si tenim usuari, ara sí que processem Strava
      setStatus("Usuari detectat. Processant Strava...");
      
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      if (error) {
        setStatus("Error: L'usuari ha denegat l'accés.");
        setTimeout(() => navigate('/profile'), 3000);
        return;
      }

      if (!code) {
        setStatus("Error: No ha arribat el codi de Strava.");
        setTimeout(() => navigate('/profile'), 3000);
        return;
      }

      try {
        setStatus("Connectant amb el servidor...");

        // URL del teu Backend (Firebase Functions)
        const FUNCTION_URL = "https://us-central1-fitflow-2839c.cloudfunctions.net/exchangeStravaToken"; 

        const response = await axios.post(FUNCTION_URL, { code });

        const { access_token, refresh_token, expires_at, athlete } = response.data;

        // Guardem els tokens a Firestore
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          strava: {
            accessToken: access_token,
            refreshToken: refresh_token,
            expiresAt: expires_at,
            athleteId: athlete.id,
            connectedAt: new Date()
          }
        });

        setStatus("Èxit! Redirigint...");
        setTimeout(() => navigate('/profile'), 1500);

      } catch (err) {
        console.error("Error intercanviant token:", err);
        // Mostrem l'error real en pantalla per saber què passa si falla el backend
        setStatus(`Error de connexió: ${err.message}`);
      }
    });

    // Neteja l'escoltador quan sortim de la pàgina
    return () => unsubscribe();

  }, [searchParams, navigate]);

  return (
    <div style={{ 
      height: '100vh', 
      backgroundColor: '#1E1E2E', 
      color: 'white', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      flexDirection: 'column'
    }}>
      <h2>🔄 Connectant amb Strava...</h2>
      <p style={{ color: '#aaa', marginTop: '10px' }}>{status}</p>
    </div>
  );
}

export default StravaRedirect;