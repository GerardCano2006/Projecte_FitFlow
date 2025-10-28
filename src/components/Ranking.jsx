import React, { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";  // Afegeix aquesta importació
import "./Ranking.css";

const Ranking = () => {  // Elimina la prop onBack, ja no la necessitem
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();  // Afegeix el hook per navegar

  // 🔹 Carrega els usuaris de Firestore ordenats per punts (descendent)
  useEffect(() => {
    const fetchRanking = async () => {
      try {
        const q = query(collection(db, "users"), orderBy("points", "desc"));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        // Filtra només clients (opcional, però recomanat per evitar entrenadors al ranking)
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

  const handleBack = () => {
    navigate("/home");  // Navega de tornada a Home
  };

  if (loading) return <p className="loading">Carregant rànquing...</p>;

  return (
    <div className="ranking-container">
      <button className="btn-back" onClick={handleBack}>  {/* Canvia onBack per handleBack */}
        ⬅ Tornar
      </button>
      <h2>🏆 Rànquing FitFlow</h2>

      {ranking.length === 0 ? (
        <p className="no-data">Encara no hi ha usuaris al rànquing.</p>
      ) : (
        <table className="ranking-table">
          <thead>
            <tr>
              <th>Posició</th>
              <th>Nom</th>
              <th>Email</th>
              <th>Punts</th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((user, index) => (
              <tr
                key={user.id}
                className={
                  index === 0
                    ? "gold"
                    : index === 1
                    ? "silver"
                    : index === 2
                    ? "bronze"
                    : ""
                }
              >
                <td>{index + 1}</td>
                <td>{user.name || "Sense nom"}</td>
                <td>{user.email}</td>
                <td>{user.points || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Ranking;