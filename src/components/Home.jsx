import React, { useState, useEffect } from "react";
import { auth, db } from "../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import "./Home.css"; // Continuem utilitzant el mateix CSS, que modificarem

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
      console.error("Error tancant sessió:", error.message);
    }
  };

  if (loading) {
    return <div className="loading-screen">Carregant FitFlow...</div>;
  }

  return (
    <div className="home-container">
      
      {/* ===== HEADER ===== */}
      <div className="hero-section">
        <div className="hero-content">
          <h1>Hola, {userData?.name || "Usuari"}</h1>
          <p className="hero-subtitle">Benvingut a FitFlow</p> 
        </div>
        <div className="avatar-placeholder">
          {userData?.name ? userData.name.charAt(0) : 'U'}
        </div>
      </div>

      {/* ===== TARGETA D'ESTADÍSTIQUES ===== */}
      <div className="stats-card">
        <div className="stat-item">
          <span className="stat-value">{userData?.classesAttended || 0}</span>
          <span className="stat-label">Classes</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{userData?.points || 0}</span>
          <span className="stat-label">Punts</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">#1</span> 
          <span className="stat-label">Rànquing</span>
        </div>
      </div>

      {/* ===== BOTONS D'ACCIÓ ===== */}
      <div className="actions-section">
        <h3>Què vols fer avui?</h3>
        
        {userData?.role === "entrenador" ? (
          // CORREGIT: Ara és una graella de 2 columnes
          <div className="buttons-grid trainer-grid">
            <button 
              className="action-btn" 
              onClick={() => navigate("/manage-classes")}
            >
              <span className="btn-icon">📋</span>
              Gestionar Classes
            </button>
            {/* 👈 BOTÓ AFEGIT */}
            <button 
              className="action-btn" 
              onClick={() => navigate("/profile")}
            >
              <span className="btn-icon">👤</span>
              El meu Perfil
            </button>
          </div>
        ) : (
          // Graella 2x2 per Clients
          <div className="buttons-grid client-grid">
            <button 
              className="action-btn" 
              onClick={() => navigate("/classes")}
            >
              <span className="btn-icon">🗓️</span>
              Reservar Classe
            </button>
            <button 
              className="action-btn" 
              onClick={() => navigate("/calendar")}
            >
              <span className="btn-icon">📅</span>
              El meu Calendari
            </button>
            <button 
              className="action-btn" 
              onClick={() => navigate("/ranking")}
            >
              <span className="btn-icon">🏆</span>
              Veure Rànquing
            </button>
            <button 
              className="action-btn" 
              onClick={() => navigate("/profile")}
            >
              <span className="btn-icon">👤</span>
              El meu Perfil
            </button>
          </div>
        )}
      </div>

      {/* Botó de Logout */}
      <button className="logout-btn" onClick={handleLogout}>
        Tancar sessió
      </button>
    </div>
  );
}

export default Home;