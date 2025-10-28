import React, { useState, useEffect } from "react";
import { auth, db } from "../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import "./Home.css";

function Home() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          navigate("/login");
          return;
        }

        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setUserData(docSnap.data());
        } else {
          console.log("No s'han trobat dades de l'usuari");
        }
      } catch (error) {
        console.error("Error carregant dades:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Error tancant sessió:", error);
    }
  };

  if (loading) {
    return <div className="loading">Carregant...</div>;
  }

  return (
    <div className="home-container">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <h1>Benvingut a FitFlow!</h1>
          <p className="hero-subtitle">La teva millor versió comença aquí</p>
        </div>
      </div>

      {/* User Stats Card */}
      <div className="stats-card">
        <div className="user-avatar">
          {userData?.name?.charAt(0)?.toUpperCase()}
        </div>
        <div className="user-info">
          <h2>{userData?.name || "Usuari"}</h2>
          <p>{userData?.email}</p>
          <span className={`role-badge ${userData?.role === 'entrenador' ? 'trainer' : 'client'}`}>
            {userData?.role === "entrenador" ? "👨‍🏫 Entrenador" : "🏃 Client"}
          </span>
        </div>
        
        {userData?.role === "client" && (
          <div className="points-section">
            <div className="points-circle">
              <span className="points-number">{userData.points || 0}</span>
              <span className="points-label">Punts</span>
            </div>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-number">{userData.classesAttended || 0}</span>
                <span className="stat-label">Classes</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{userData.classesThisWeek || 0}</span>
                <span className="stat-label">Aquesta setm.</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="actions-section">
        <h3>Què vols fer avui?</h3>
        
        {userData?.role === "entrenador" ? (
          <div className="buttons-grid">
            <button 
              className="action-btn primary" 
              onClick={() => navigate("/manage-classes")}
            >
              <span className="btn-icon">📋</span>
              Gestionar Classes
            </button>
          </div>
        ) : (
          <div className="buttons-grid">
            <button 
              className="action-btn primary" 
              onClick={() => navigate("/classes")}
            >
              <span className="btn-icon">🎯</span>
              Veure Classes
            </button>
            <button 
              className="action-btn secondary" 
              onClick={() => navigate("/calendar")}
            >
              <span className="btn-icon">📅</span>
              El meu Calendari
            </button>
            <button 
              className="action-btn gold" 
              onClick={() => navigate("/ranking")}
            >
              <span className="btn-icon">🏆</span>
              Veure Ranking
            </button>
          </div>
        )}
      </div>

      {/* Logout Button */}
      <button className="logout-btn" onClick={handleLogout}>
        🚪 Tancar sessió
      </button>
    </div>
  );
}

export default Home;