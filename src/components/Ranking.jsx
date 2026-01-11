import React, { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useNavigate } from "react-router-dom"; // 👈 Importem el hook de navegació
import Sidebar from "./Sidebar";
import "./Ranking.css";

const Ranking = () => {
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate(); // 👈 Inicialitzem el navigate

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        const q = query(collection(db, "users"), orderBy("points", "desc"));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        
        const clientsOnly = data.filter(user => user.role === "client");
        setRanking(clientsOnly);
      } catch (error) {
        console.error("Error carregant el rànquing:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRanking();
  }, []);

  const topThree = ranking.slice(0, 3);
  const restOfUsers = ranking.slice(3);

  const getInitials = (name) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  };

  return (
    <div className="dashboard-layout">
      
      <Sidebar />

      <div className="ranking-main-container">
        
        {/* 👇 1. CAPÇALERA AMB BOTÓ A LA DRETA */}
        <div className="ranking-top-bar">
           <div className="header-text">
              <h2>🏆 Rànquing FitFlow</h2>
              <p>Competeix amb la comunitat!</p>
           </div>
           
           <button className="btn-close-ranking" onClick={() => navigate('/home')}>
             ✕ Tornar
           </button>
        </div>

        {loading ? (
          <div className="loading-state">Carregant atletes...</div>
        ) : ranking.length === 0 ? (
          <div className="no-data">Encara no hi ha dades al rànquing.</div>
        ) : (
          <>
            {/* --- PODIUM (TOP 3) --- */}
            <div className="podium-container">
              {/* 2n Lloc */}
              {topThree[1] && (
                <div className="podium-item silver">
                  <div className="podium-rank">2</div>
                  <div className="avatar-circle">
                    {topThree[1].photoUrl ? <img src={topThree[1].photoUrl} alt="Avatar"/> : getInitials(topThree[1].name)}
                  </div>
                  <div className="podium-name">{topThree[1].name}</div>
                  <div className="podium-points">{topThree[1].points} pts</div>
                  <div className="podium-bar"></div>
                </div>
              )}

              {/* 1r Lloc */}
              {topThree[0] && (
                <div className="podium-item gold">
                  <div className="crown-icon">👑</div>
                  <div className="avatar-circle">
                     {topThree[0].photoUrl ? <img src={topThree[0].photoUrl} alt="Avatar"/> : getInitials(topThree[0].name)}
                  </div>
                  <div className="podium-name">{topThree[0].name}</div>
                  <div className="podium-points">{topThree[0].points} pts</div>
                  <div className="podium-bar"></div>
                </div>
              )}

              {/* 3r Lloc */}
              {topThree[2] && (
                <div className="podium-item bronze">
                  <div className="podium-rank">3</div>
                  <div className="avatar-circle">
                    {topThree[2].photoUrl ? <img src={topThree[2].photoUrl} alt="Avatar"/> : getInitials(topThree[2].name)}
                  </div>
                  <div className="podium-name">{topThree[2].name}</div>
                  <div className="podium-points">{topThree[2].points} pts</div>
                  <div className="podium-bar"></div>
                </div>
              )}
            </div>

            {/* --- LLISTA RESTANT --- */}
            {restOfUsers.length > 0 && (
              <div className="ranking-list-section">
                <table className="ranking-table">
                  <thead>
                    <tr>
                      <th width="10%">Pos</th>
                      <th width="60%">Atleta</th>
                      <th width="30%" className="text-right">Punts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {restOfUsers.map((user, index) => (
                      <tr key={user.id}>
                        <td><span className="rank-number">#{index + 4}</span></td>
                        <td>
                          <div className="user-cell">
                            <div className="mini-avatar">{getInitials(user.name)}</div>
                            <span>{user.name || "Usuari Sense Nom"}</span>
                          </div>
                        </td>
                        <td className="points-cell">{user.points} pts</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Ranking;