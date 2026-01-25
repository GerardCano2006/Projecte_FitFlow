import React, { useState, useEffect } from "react";
import { auth, db } from "../firebaseConfig"; 
// 👇 AFEGIT: 'query' i 'where' per poder filtrar les classes
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import "./Home.css";

function Home() {
  const [userData, setUserData] = useState(null);
  const [userRank, setUserRank] = useState("-");
  // 👇 NOU ESTAT: Per guardar el número real de classes
  const [classesCount, setClassesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // 👇 CÀRREGA DE DADES, CÀLCUL DE RÀNQUING I COMPTADOR DE CLASSES
  useEffect(() => {
    const loadData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          navigate("/login");
          return;
        }

        // 1. Carreguem les dades del teu perfil
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setUserData(docSnap.data());
        }

        // 2. 🔥 CÀLCUL REAL DE CLASSES APUNTADES (Igual que a la Sidebar)
        const classesRef = collection(db, "classes");
        const q = query(classesRef, where("participants", "array-contains", user.uid));
        const classSnap = await getDocs(q);
        setClassesCount(classSnap.size); // Guardem el número real

        // 3. Carreguem TOTS els usuaris per calcular el rànquing
        const usersRef = collection(db, "users");
        const usersSnap = await getDocs(usersRef);

        // Creem una llista amb tots els usuaris i els seus punts
        const allUsers = usersSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Els ordenem de més punts a menys punts
        allUsers.sort((a, b) => (b.points || 0) - (a.points || 0));

        // Busquem en quina posició estàs tu (index + 1)
        const myIndex = allUsers.findIndex((u) => u.id === user.uid);
        
        if (myIndex !== -1) {
            setUserRank(`#${myIndex + 1}`);
        }

      } catch (error) {
        console.error("Error carregant dades:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
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

  // 👇 AQUÍ COMENÇA EL DISSENY
  return (
    <div className="home-container">
      
      {/* ===== BARRA LATERAL (STATS + LOGOUT) ===== */}
      <div className="stats-card">
        
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '70px', paddingTop: '0px' }}>
            <img 
                src="/Logo.png"  
                alt="FitFlow Logo" 
                style={{ width: '200px', height: 'auto', objectFit: 'contain' }} 
            />
        </div>

        <div className="stats-content">
          <div className="stat-item">
            {/* 👇 ARA MOSTREM EL COMPTADOR REAL (classesCount) */}
            <span className="stat-value">{classesCount}</span>
            <span className="stat-label">Classes</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{userData?.points || 0}</span>
            <span className="stat-label">Punts</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{userRank}</span> 
            <span className="stat-label">Rànquing</span>
          </div>
        </div>

        <button className="logout-btn" onClick={handleLogout}>
          Tancar sessió
        </button>
      </div>

      {/* ===== CONTINGUT PRINCIPAL (DRETA) ===== */}
      <div className="main-content">
        
        {/* HEADER */}
        <div className="hero-section">
          <div className="hero-content">
            <h1>HOLA, {userData?.name || "ATLETA"}</h1>
            <span className="hero-subtitle">BENVINGUT A FITFLOW</span> 
          </div>
          <div className="avatar-placeholder">
            {userData?.name ? userData.name.charAt(0) : 'U'}
          </div>
        </div>

        {/* BOTONS */}
        <div className="actions-section">
          <h3>QUÈ VOLS FER AVUI?</h3>
          
          {userData?.role === "entrenador" ? (
             <div className="buttons-grid trainer-grid">
               
               {/* 1. Gestionar Classes */}
               <button className="action-btn btn-manage" onClick={() => navigate("/manage-classes")}>
                  <div className="btn-content">
                    <span className="btn-icon"></span>
                    <span className="btn-text">Gestionar Classes</span>
                  </div>
               </button>

               {/* 2. Calendari */}
               <button className="action-btn btn-calendar" onClick={() => navigate("/calendar")}>
                  <div className="btn-content">
                    <span className="btn-icon"></span>
                    <span className="btn-text">EL MEU CALENDARI</span>
                  </div>
               </button>

               {/* 3. Notificacions */}
               <button className="action-btn btn-notify" onClick={() => navigate("/notifications")}>
                  <div className="btn-content">
                    <span className="btn-icon"></span>
                    <span className="btn-text">Notificacions</span>
                  </div>
               </button>
               
               {/* 4. Perfil */}
               <button className="action-btn btn-profile" onClick={() => navigate("/profile")}>
                  <div className="btn-content">
                    <span className="btn-icon"></span>
                    <span className="btn-text">El meu Perfil</span>
                  </div>
               </button>

             </div>
          ) : (
            <div className="buttons-grid client-grid">
              
              {/* 1. RESERVAR CLASSE */}
              <button className="action-btn btn-reserve" onClick={() => navigate("/classes")}>
                <div className="btn-content">
                  <span className="btn-icon"></span>
                  <span className="btn-text">RESERVAR CLASSE</span>
                </div>
              </button>

              {/* 2. CALENDARI */}
              <button className="action-btn btn-calendar" onClick={() => navigate("/calendar")}>
                  <div className="btn-content">
                  <span className="btn-icon"></span>
                  <span className="btn-text">EL MEU CALENDARI</span>
                </div>
              </button>

              {/* 3. RÀNQUING */}
              <button className="action-btn btn-ranking" onClick={() => navigate("/ranking")}>
                  <div className="btn-content">
                  <span className="btn-icon"></span>
                  <span className="btn-text">RÀNQUING</span>
                </div>
              </button>

              {/* 4. NOU: BESCANVIAR PUNTS (SHOP) */}
              <button className="action-btn btn-shop" onClick={() => navigate("/shop")}>
                  <div className="btn-content">
                  <span className="btn-icon"></span>
                  <span className="btn-text"> Viti Shop</span>
                </div>
              </button>

              {/* 5. PERFIL (Ara és l'últim) */}
              <button className="action-btn btn-profile" onClick={() => navigate("/profile")}>
                  <div className="btn-content">
                  <span className="btn-icon"></span>
                  <span className="btn-text">EL MEU PERFIL</span>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;