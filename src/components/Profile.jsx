import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebaseConfig';
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import axios from 'axios'; 
import { useNavigate } from 'react-router-dom';

// Importem el fitxer CSS
import './Profile.css';

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

  const isStravaConnected = userData && userData.strava && userData.strava.accessToken;

  // --- GESTIÓ DE STRAVA (Lògica corregida) ---
  useEffect(() => {
    if (isStravaConnected && !hasAttemptedFetch && !isLoadingActivities) {
      
      const fetchActivities = async () => {
        setIsLoadingActivities(true);
        setHasAttemptedFetch(true);
        setStravaError(null);

        try {
          // URL DE LA FUNCIÓ
          const FUNCTION_URL = "https://us-central1-fitflow-2839c.cloudfunctions.net/getStravaActivities";
          
          const accessToken = userData.strava.accessToken;

          console.log("Demanant activitats amb token:", accessToken ? "Sí" : "No");

          const response = await axios.post(FUNCTION_URL, { 
            accessToken: accessToken 
          });
          
          if (Array.isArray(response.data)) {
            setStravaActivities(response.data);
          } else {
            throw new Error("Format de dades incorrecte");
          }

        } catch (error) {
          console.error("Error Strava:", error);
          if (error.response && error.response.status === 401) {
             setStravaError("La sessió ha caducat. Torna a connectar.");
          } else {
             setStravaError("No s'han pogut carregar les activitats.");
          }
        }
        setIsLoadingActivities(false);
      };

      fetchActivities();
    }
  }, [isStravaConnected, hasAttemptedFetch, isLoadingActivities, userData]);

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
      year: 'numeric',
      hour: '2-digit', 
      minute:'2-digit'
    });
  };

  // --- RENDER ---
  if (isLoadingUser) return <div className="profile-container"><p className="loading-text">Carregant...</p></div>;
  if (!currentUser) return <div className="profile-container"><p className="error-text">No has iniciat sessió.</p></div>;

  return (
    <div className="profile-container">
      
      {/* BARRA DE NAVEGACIÓ */}
      <div className="nav-bar">
        <button 
          onClick={() => navigate('/home')} 
          className="nav-button"
        >
          ⬅ Inici
        </button>
        
        <button 
          onClick={() => navigate('/edit-profile')} 
          className="edit-button"
        >
          Editar Perfil ✏️
        </button>
      </div>

      <div className="profile-header">
        <h2>El Meu Perfil</h2>
        <p>Hola, <strong>{userData ? userData.name : '...'}</strong>!</p>
      </div>

      <div className="strava-section">
        <h3>Les teves Activitats</h3>
        
        {stravaError && (
          <>
            <p className="error-text">{stravaError}</p>
            <button onClick={handleStravaConnect} className="strava-button">Tornar a connectar amb Strava</button>
          </>
        )}

        {isStravaConnected && !stravaError && (
          <div>
            <p className="connected-text">Strava Connectat ✅</p>
            
            {isLoadingActivities && <p className="loading-text">Carregant activitats...</p>}
            
            {!isLoadingActivities && stravaActivities.length === 0 && (
                <p className="no-activities-text">No s'han trobat activitats recents.</p>
            )}

            <ul className="activity-list">
              {stravaActivities.map(activity => (
                <li key={activity.id} className="activity-item">
                  
                  <div className="activity-top">
                    <span className="activity-name">{activity.name}</span>
                    <span className="activity-date">{formatDate(activity.start_date)}</span>
                  </div>

                  <div className="main-stats">
                    {/* Distància */}
                    <div className="stat-box">
                        <span className="stat-value">{formatDistance(activity.distance)}</span>
                        <span className="stat-label">Distància</span>
                    </div>

                    {/* Ritme */}
                    <div className="stat-box">
                        <span className="stat-value">{formatPace(activity.average_speed)}</span>
                        <span className="stat-label">Ritme</span>
                    </div>

                    {/* Temps */}
                    <div className="stat-box">
                        <span className="stat-value">{formatTime(activity.moving_time)}</span>
                        <span className="stat-label">Temps</span>
                    </div>
                  </div>

                  {(activity.average_heartrate || activity.suffer_score) && (
                    <div className="secondary-stats">
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
          <button onClick={handleStravaConnect} className="strava-button">Integrar amb Strava</button>
        )}
      </div>
    </div>
  );
}

export default Profile;