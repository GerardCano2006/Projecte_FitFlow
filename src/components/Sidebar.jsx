import React, { useState, useEffect } from "react";
import { auth, db } from "../firebaseConfig"; 
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import "./Home.css"; // Aprofitem els estils que ja tens fets!

function Sidebar() {
  const [userData, setUserData] = useState(null);
  const [userRank, setUserRank] = useState("-");
  const navigate = useNavigate();

  useEffect(() => {
    const loadSidebarData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        // 1. Dades de l'usuari
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) setUserData(docSnap.data());

        // 2. Càlcul ràpid del rànquing
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
          <span className="stat-value">{userData?.classesAttended || 0}</span>
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