import React, { useState, useEffect } from "react";
import { auth, db } from "../firebaseConfig"; 
// 👇 AFEGIT: 'query' i 'where' per poder filtrar les classes
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import "./Home.css"; 

function Sidebar() {
  const [userData, setUserData] = useState(null);
  const [userRank, setUserRank] = useState("-");
  // 👇 NOU ESTAT: Per guardar el número real de classes
  const [classesCount, setClassesCount] = useState(0);
  
  const navigate = useNavigate();

  useEffect(() => {
    const loadSidebarData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        // 1. Dades de l'usuari (Punts, Nom, etc.)
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) setUserData(docSnap.data());

        // 2. 🔥 CÀLCUL REAL DE CLASSES APUNTADES
        // Busquem a la col·lecció 'classes' totes les que tinguin el teu ID a 'participants'
        const classesRef = collection(db, "classes");
        const q = query(classesRef, where("participants", "array-contains", user.uid));
        const classSnap = await getDocs(q);
        
        // Guardem la quantitat trobada (.size ens diu quants documents hi ha)
        setClassesCount(classSnap.size);

        // 3. Càlcul ràpid del rànquing
        const usersRef = collection(db, "users");
        const usersSnap = await getDocs(usersRef);
        const allUsers = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        allUsers.sort((a, b) => (b.points || 0) - (a.points || 0));
        const myIndex = allUsers.findIndex(u => u.id === user.uid);
        if (myIndex !== -1) setUserRank(`#${myIndex + 1}`);

      } catch (error) {
        console.error("Error sidebar:", error);
      }
    };
    loadSidebarData();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  return (
    <div className="stats-card">
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '70px', paddingTop: '0px' }}>
          <img 
              src="/Logo.png"  
              alt="FitFlow Logo" 
              style={{ width: '200px', height: 'auto', objectFit: 'contain', cursor: 'pointer' }} 
              onClick={() => navigate('/home')}
          />
      </div>

      <div className="stats-content">
        <div className="stat-item">
          {/* 👇 AQUÍ MOSTREM EL COMPTADOR REAL */}
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
  );
}

export default Sidebar;