import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getFunctions, httpsCallable } from "firebase/functions";
import { auth } from "../firebaseConfig"; 
import { onAuthStateChanged } from "firebase/auth";

// ... (El teu objecte 'styles' es queda exactament igual)
const styles = {
  loadingScreen: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: '#1A1A2E',
    color: 'white',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    textAlign: 'center'
  },
  title: {
    fontSize: '24px',
    fontWeight: '600',
    marginBottom: '10px'
  },
  message: {
    fontSize: '18px',
    color: '#c0c0e0'
  },
  error: {
    fontSize: '18px',
    color: '#ff6b6b'
  }
};


function StravaRedirect() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [statusMessage, setStatusMessage] = useState('Verificant sessió...');
  const [errorOccurred, setErrorOccurred] = useState(false);
  
  // 👇 **PAS 1: AFEGIM UN ESTAT DE CÀRREGA PER A L'AUTENTICACIÓ**
  const [authChecked, setAuthChecked] = useState(false);

  // Movem la lògica principal a 'useCallback' per estabilitzar-la
  const handleAuth = useCallback(async (user) => {
    // 👇 **PAS 2: DOBLE VERIFICACIÓ**
    // Si l'usuari és 'null' (perquè la sessió realment no existeix)
    if (!user) {
      setStatusMessage('Sessió no trobada. Redirigint a login...');
      setErrorOccurred(true);
      setTimeout(() => navigate('/login'), 3000);
      return;
    }

    // Ara sabem que 'user' existeix, podem continuar
    const functions = getFunctions();
    const exchangeToken = httpsCallable(functions, 'exchangeStravaToken');

    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      setStatusMessage('Autorització cancel·lada. Redirigint...');
      setErrorOccurred(true);
      setTimeout(() => navigate('/profile'), 3000);
      return;
    }

    if (code) {
      try {
        setStatusMessage('Connectant de forma segura amb Strava...');
        // Aquesta trucada ara SÍ que anirà autenticada
        const result = await exchangeToken({ code: code }); 

        if (result.data.success) {
          setStatusMessage('Connexió completada! Redirigint al perfil...');
          setTimeout(() => navigate('/profile'), 2000);
        } else {
          throw new Error(result.data.message);
        }
      } catch (err) {
        console.error("Error al trucar la Cloud Function:", err);
        // Mirem si l'error és el NOSTRE 'unauthenticated'
        if (err.code === 'unauthenticated') {
           setStatusMessage('Error d\'autenticació. Redirigint...');
        } else {
           setStatusMessage('Hi ha hagut un error en connectar. Intenta-ho de nou.');
        }
        setErrorOccurred(true);
        setTimeout(() => navigate('/profile'), 3000);
      }
    } else {
      setStatusMessage('No s\'ha rebut cap codi. Redirigint...');
      setErrorOccurred(true);
      setTimeout(() => navigate('/profile'), 3000);
    }
  }, [navigate, searchParams]); // Dependències del useCallback


  useEffect(() => {
    // 👇 **PAS 3: L'OIENT CORRECTE**
    // Això s'esperarà que Firebase restauri la sessió
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthChecked(true); // <-- Marquem que la comprovació JA S'HA FET
      handleAuth(user); // <-- Cridem a la lògica amb el resultat (sigui 'user' o 'null')
      unsubscribe(); // <-- Un cop tenim l'estat, ja no cal seguir escoltant
    });

    return () => unsubscribe();
  
  }, [handleAuth]); // L'efecte depèn de la funció 'handleAuth'

  
  // 👇 **PAS 4: RENDERITZAT CONDICIONAL**
  // Mentre Firebase està comprovant, mostrem un missatge d'espera
  if (!authChecked) {
    return (
      <div style={styles.loadingScreen}>
        <h2 style={styles.title}>Connectant amb Strava</h2>
        <p style={styles.message}>Verificant sessió de Firebase...</p>
      </div>
    );
  }

  // Quan la comprovació s'ha fet, mostrem l'estat real
  return (
    <div style={styles.loadingScreen}>
      <h2 style={styles.title}>Connectant amb Strava</h2>
      <p style={errorOccurred ? styles.error : styles.message}>
        {statusMessage}
      </p>
    </div>
  );
}

export default StravaRedirect;