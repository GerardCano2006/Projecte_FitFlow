import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebaseConfig';
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
// Importem useNavigate per moure'ns entre pàgines
import { useNavigate } from 'react-router-dom';

const styles = {
  profileContainer: {
    padding: '40px',
    maxWidth: '900px',
    margin: '30px auto',
    backgroundColor: '#1E1E2E',
    color: '#E0E0E0',
    borderRadius: '10px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)'
  },
  // --- BARRA DE NAVEGACIÓ ---
  navBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    paddingBottom: '20px',
    borderBottom: '1px solid #4E4E6E'
  },
  navButton: {
    backgroundColor: 'transparent',
    color: '#E0E0E0',
    border: '1px solid #4E4E6E',
    padding: '8px 15px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '0.9em',
    display: 'flex',
    alignItems: 'center',
    gap: '5px'
  },
  editButton: {
    backgroundColor: '#3A3A5A',
    color: '#ffffff',
    border: 'none',
    padding: '8px 15px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '0.9em',
    fontWeight: 'bold'
  },
  // --------------------------
  header: {
    marginBottom: '20px',
    textAlign: 'center'
  },
  stravaSection: {
    marginTop: '30px',
    padding: '20px',
    backgroundColor: '#2A2A4A',
    borderRadius: '8px'
  },
  stravaButton: {
    backgroundColor: '#FC4C02',
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
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '15px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  activityTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #4E4E6E',
    paddingBottom: '10px',
    marginBottom: '5px'
  },
  activityName: {
    fontWeight: 'bold',
    fontSize: '1.1em',
    color: '#ffffff'
  },
  activityDate: {
    fontSize: '0.85em',
    color: '#d0d0d0'
  },
  mainStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '10px',
    textAlign: 'center'
  },
  statBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  // NÚMEROS EN BLANC
  statValue: {
    fontSize: '1.2em',
    fontWeight: 'bold',
    color: '#FFFFFF'
  },
  // LLETRES EN BLANC
  statLabel: {
    fontSize: '0.8em',
    textTransform: 'uppercase',
    color: '#FFFFFF',
    marginTop: '4px',
    fontWeight: '500'
  },
  secondaryStats: {
    display: 'flex',
    gap: '20px',
    fontSize: '0.9em',
    color: '#e0e0e0',
    marginTop: '5px',
    justifyContent: 'flex-start'
  },
  loadingText: { color: '#FFD700', textAlign: 'center' },
  errorText: { color: '#FF6B6B', textAlign: 'center' }
};

function Profile() {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  const [stravaActivities, setStravaActivities] = useState([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [stravaError, setStravaError] = useState(null);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);

  const navigate = useNavigate();

  // --- GESTIÓ D'USUARI ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setUserData(userDocSnap.data());
        }
      } else {
        setCurrentUser(null);
        setUserData(null);
        navigate('/login');
      }
      setIsLoadingUser(false);
    });
    return () => unsubscribe();
  }, [navigate]);

  const isStravaConnected = userData && userData.strava;

  // --- GESTIÓ DE STRAVA ---
  useEffect(() => {
    if (isStravaConnected && !hasAttemptedFetch && !isLoadingActivities) {
      const fetchActivities = async () => {
        setIsLoadingActivities(true);
        setHasAttemptedFetch(true);
        setStravaError(null);
        try {
          const functions = getFunctions();
          const getActivities = httpsCallable(functions, 'getStravaActivities');
          const result = await getActivities();
          
          if (result.data.success) {
            setStravaActivities(result.data.activities);
          } else {
            throw new Error("Error retornant dades");
          }
        } catch (error) {
          console.error("Error Strava:", error);
          if (error.code === 'unauthenticated') {
             setStravaError("La teva connexió ha caducat. Torna a connectar.");
          } else {
             setStravaError("No s'han pogut carregar les activitats.");
          }
        }
        setIsLoadingActivities(false);
      };
      fetchActivities();
    }
  }, [isStravaConnected, hasAttemptedFetch, isLoadingActivities]);

  const handleStravaConnect = () => {
    const STRAVA_CLIENT_ID = "184885"; 
    const REDIRECT_URI = "http://localhost:3000/strava-redirect"; 
    const STRAVA_SCOPES = "read,activity:read_all"; 
    window.location.href = `https://www.strava.com/oauth/authorize?client_id=${STRAVA_CLIENT_ID}&response_type=code&redirect_uri=${REDIRECT_URI}&approval_prompt=force&scope=${STRAVA_SCOPES}`;
  };

  // --- FUNCIONS DE FORMAT ---
  const formatDistance = (distanceInMeters) => {
    return (distanceInMeters / 1000).toFixed(2) + " km";
  };

  const formatTime = (timeInSeconds) => {
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = timeInSeconds % 60;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m ${seconds}s`;
  };

  const formatPace = (speedInMetersPerSecond) => {
    if (!speedInMetersPerSecond || speedInMetersPerSecond === 0) return "-";
    const secondsPerKm = 1000 / speedInMetersPerSecond;
    const minutes = Math.floor(secondsPerKm / 60);
    const seconds = Math.floor(secondsPerKm % 60);
    const formattedSeconds = seconds < 10 ? `0${seconds}` : seconds;
    return `${minutes}:${formattedSeconds} /km`;
  };
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("ca-ES", {
      weekday: 'short', 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric', // 👈 HEM AFEGIT L'ANY AQUÍ
      hour: '2-digit', 
      minute:'2-digit'
    });
  };

  // --- RENDER ---
  if (isLoadingUser) return <div style={styles.profileContainer}><p style={styles.loadingText}>Carregant...</p></div>;
  if (!currentUser) return <div style={styles.profileContainer}><p style={styles.errorText}>No has iniciat sessió.</p></div>;

  return (
    <div style={styles.profileContainer}>
      
      {/* BARRA DE NAVEGACIÓ */}
      <div style={styles.navBar}>
        <button 
          onClick={() => navigate('/home')} 
          style={styles.navButton}
        >
          ⬅ Inici
        </button>
        
        <button 
          onClick={() => navigate('/edit-profile')} 
          style={styles.editButton}
        >
          Editar Perfil ✏️
        </button>
      </div>

      <div style={styles.header}>
        <h2>El Meu Perfil</h2>
        <p>Hola, <strong>{userData ? userData.name : '...'}</strong>!</p>
      </div>

      <div style={styles.stravaSection}>
        <h3>Les teves Activitats</h3>
        
        {stravaError && (
          <>
            <p style={styles.errorText}>{stravaError}</p>
            <button onClick={handleStravaConnect} style={styles.stravaButton}>Tornar a connectar amb Strava</button>
          </>
        )}

        {isStravaConnected && !stravaError && (
          <div>
            <p style={{ color: '#FFFFFF', marginBottom: '20px' }}>Strava Connectat ✅</p>
            
            {isLoadingActivities && <p style={styles.loadingText}>Carregant activitats...</p>}
            
            <ul style={styles.activityList}>
              {stravaActivities.map(activity => (
                <li key={activity.id} style={styles.activityItem}>
                  
                  {/* Data amb ANY */}
                  <div style={styles.activityTop}>
                    <span style={styles.activityName}>{activity.name}</span>
                    <span style={styles.activityDate}>{formatDate(activity.start_date)}</span>
                  </div>

                  <div style={styles.mainStats}>
                    {/* Distància */}
                    {activity.distance > 0 ? (
                      <div style={styles.statBox}>
                        <span style={styles.statValue}>{formatDistance(activity.distance)}</span>
                        <span style={styles.statLabel}>Distància</span>
                      </div>
                    ) : (
                       <div style={styles.statBox}><span style={styles.statLabel}>-</span></div>
                    )}

                    {/* Ritme */}
                    {activity.average_speed > 0 ? (
                      <div style={styles.statBox}>
                        <span style={styles.statValue}>{formatPace(activity.average_speed)}</span>
                        <span style={styles.statLabel}>Ritme</span>
                      </div>
                    ) : (
                      <div style={styles.statBox}><span style={styles.statLabel}>-</span></div>
                    )}

                    {/* Temps */}
                    {activity.moving_time > 0 ? (
                      <div style={styles.statBox}>
                        <span style={styles.statValue}>{formatTime(activity.moving_time)}</span>
                        <span style={styles.statLabel}>Temps</span>
                      </div>
                    ) : (
                      <div style={styles.statBox}><span style={styles.statLabel}>-</span></div>
                    )}
                  </div>

                  {(activity.average_heartrate || activity.suffer_score) && (
                    <div style={styles.secondaryStats}>
                      {activity.average_heartrate && <span>❤️ {activity.average_heartrate.toFixed(0)} bpm</span>}
                      {activity.suffer_score && <span>🔥 Esforç: {activity.suffer_score}</span>}
                    </div>
                  )}

                </li>
              ))}
            </ul>
          </div>
        )}

        {!isStravaConnected && !stravaError && (
          <button onClick={handleStravaConnect} style={styles.stravaButton}>Integrar amb Strava</button>
        )}
      </div>
    </div>
  );
}

export default Profile;