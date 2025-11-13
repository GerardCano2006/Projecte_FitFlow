import React, { useState, useEffect } from 'react'; // Ja no importem 'useContext'
import { auth, db } from '../firebaseConfig'; // 👈 Importem 'auth' i 'db'
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";

// ... (Els teus 'styles' es queden exactament igual)
const styles = {
  profileContainer: {
    padding: '40px',
    maxWidth: '900px',
    margin: '30px auto',
    backgroundColor: '#1E1E2E', // Color fosc
    color: '#E0E0E0', // Color de text clar
    borderRadius: '10px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)'
  },
  header: {
    borderBottom: '2px solid #4E4E6E',
    paddingBottom: '20px',
    marginBottom: '20px'
  },
  stravaSection: {
    marginTop: '30px',
    padding: '20px',
    backgroundColor: '#2A2A4A',
    borderRadius: '8px'
  },
  stravaButton: {
    backgroundColor: '#FC4C02', // Color taronja de Strava
    color: 'white',
    border: 'none',
    padding: '12px 20px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold'
  },
  activityList: {
    listStyle: 'none',
    padding: 0,
    marginTop: '20px'
  },
  activityItem: {
    backgroundColor: '#3A3A5A',
    padding: '15px',
    borderRadius: '5px',
    marginBottom: '10px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  loadingText: {
    color: '#FFD700' // Groc
  },
  errorText: {
    color: '#FF6B6B' // Vermell
  }
};

function Profile() {
  // 👇 --- NOU ESTAT PER LES DADES D'USUARI --- 👇
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // ESTAT PER A STRAVA (com abans)
  const [stravaActivities, setStravaActivities] = useState([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [stravaError, setStravaError] = useState(null);

  // 👇 --- NOU EFECTE PER BUSCAR L'USUARI --- 👇
  useEffect(() => {
    // Escutem canvis en l'autenticació
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Tenim l'usuari (de Auth)
        setCurrentUser(user);
        
        // Ara busquem les seves dades a Firestore
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          setUserData(userDocSnap.data());
        } else {
          console.error("Error: No s'ha trobat el document de l'usuari a Firestore.");
          setStravaError("Error al carregar les dades de l'usuari.");
        }
      } else {
        // No hi ha usuari (ha tancat sessió)
        setCurrentUser(null);
        setUserData(null);
        // Aquí podries redirigir a /login
      }
      setIsLoadingUser(false);
    });

    return () => unsubscribe(); // Netegem l'oient
  }, []); // S'executa només un cop


  // Comprovem si l'usuari JA està connectat a Strava
  const isStravaConnected = userData && userData.strava;

  // 👇 --- EFECTE PER DEMANAR DADES DE STRAVA (com abans) --- 👇
  useEffect(() => {
    // Només executem si l'usuari ESTÀ connectat i NO hem carregat dades
    if (isStravaConnected && stravaActivities.length === 0) {
      
      const fetchActivities = async () => {
        setIsLoadingActivities(true);
        setStravaError(null);
        try {
          const functions = getFunctions();
          const getActivities = httpsCallable(functions, 'getStravaActivities');
          const result = await getActivities();
          
          if (result.data.success) {
            setStravaActivities(result.data.activities);
          } else {
            throw new Error("Error de la funció en retornar dades");
          }
        } catch (error) {
          console.error("Error al trucar a getStravaActivities:", error);
          if (error.code === 'unauthenticated') {
             setStravaError("La teva connexió amb Strava ha caducat. Si us plau, torna a connectar.");
          } else {
             setStravaError("No s'han pogut carregar les activitats.");
          }
        }
        setIsLoadingActivities(false);
      };

      fetchActivities();
    }
  }, [isStravaConnected, stravaActivities.length]); // Dependències de l'efecte


  // Lògica per al botó (aquesta ja la teníem)
  const handleStravaConnect = () => {
    const STRAVA_CLIENT_ID = "184885"; 
    const REDIRECT_URI = "http://localhost:3000/strava-redirect"; 
    const STRAVA_SCOPES = "read,activity:read_all"; 
    
    const url = `https://www.strava.com/oauth/authorize?client_id=${STRAVA_CLIENT_ID}&response_type=code&redirect_uri=${REDIRECT_URI}&approval_prompt=force&scope=${STRAVA_SCOPES}`;
    
    window.location.href = url;
  };

  // Funcions per formatar (com abans)
  const formatDistance = (distanceInMeters) => {
    return (distanceInMeters / 1000).toFixed(2) + " km";
  };
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  // --- RENDERITZAT ---

  // Mentre comprovem l'usuari
  if (isLoadingUser) {
    return (
      <div style={styles.profileContainer}>
        <p style={styles.loadingText}>Carregant perfil...</p>
      </div>
    );
  }

  // Si no hi ha usuari (ha tancat sessió)
  if (!currentUser) {
     return (
      <div style={styles.profileContainer}>
        <p style={styles.errorText}>No has iniciat sessió. Redirigint...</p>
        {/* Aquí hauries de redirigir a /login */}
      </div>
    );
  }

  // Si hi ha usuari, mostrem el perfil
  return (
    <div style={styles.profileContainer}>
      <div style={styles.header}>
        <h2>El Meu Perfil</h2>
        <p>Hola, <strong>{userData ? userData.name : '...'}</strong>!</p>
        <p>Email: {currentUser.email}</p>
      </div>

      {/* SECCIÓ DE STRAVA */}
      <div style={styles.stravaSection}>
        <h3>La teva Activitat de Strava</h3>
        
        {!isStravaConnected ? (
          // CAS 1: L'usuari NO està connectat
          <>
            <p>Connecta el teu compte de Strava per veure les teves activitats aquí.</p>
            <button onClick={handleStravaConnect} style={styles.stravaButton}>
              Integrar amb Strava
            </button>
          </>
        ) : (
          // CAS 2: L'usuari SÍ que està connectat
          <div>
            <p style={{ color: '#70E094' }}>Connexió amb Strava activa! ✅</p>
            
            {isLoadingActivities && <p style={styles.loadingText}>Carregant activitats recents...</p>}
            
            {stravaError && <p style={styles.errorText}>{stravaError}</p>}
            
            <ul style={styles.activityList}>
              {stravaActivities.map(activity => (
                <li key={activity.id} style={styles.activityItem}>
                  <span>
                    <strong>{activity.name}</strong>
                    <br />
                    <small>{formatDate(activity.start_date)}</small>
                  </span>
                  <strong>{formatDistance(activity.distance)}</strong>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
    </div>
  );
}

export default Profile;