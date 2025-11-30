import React, { useState, useEffect } from "react";
import { auth, db } from "../firebaseConfig";
import { collection, query, where, orderBy, getDocs, getDoc, doc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "./ManageClasses.css"; // Reutilitzem el CSS fosc que ja tenim

function TrainerNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const user = auth.currentUser;

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;

      try {
        // 1. Primer necessitem saber el nom de l'entrenador actual
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const trainerName = userDoc.data().name;

        // 2. Busquem els logs on l'entrenador és ell
        const q = query(
          collection(db, "booking_logs"),
          where("trainerName", "==", trainerName),
          orderBy("timestamp", "desc") // Les més noves primer
        );

        const querySnapshot = await getDocs(q);
        const logsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setNotifications(logsData);
      } catch (error) {
        console.error("Error carregant notificacions:", error);
      }
      setLoading(false);
    };

    fetchNotifications();
  }, [user]);

  // Funció per posar colors segons l'acció
  const getActionStyle = (action) => {
    if (action === 'book') return { color: '#4ade80', fontWeight: 'bold' }; // Verd
    if (action === 'cancel') return { color: '#f87171', fontWeight: 'bold' }; // Vermell
    return { color: 'white' };
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    // Convertim el timestamp de Firebase a data llegible
    const date = timestamp.toDate(); 
    return date.toLocaleString('ca-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit' });
  };

  return (
    <div className="manage-container">
      <div className="manage-content" style={{ maxWidth: '600px' }}>
        
        <div className="manage-header">
          <h2>La Meva Bústia 📬</h2>
          <button className="btn-back" onClick={() => navigate("/home")}>
            ⬅ Tornar
          </button>
        </div>

        <div className="classes-list">
          <h3>Activitat Recent</h3>
          
          {loading ? (
            <p style={{textAlign: 'center', color: '#888'}}>Carregant...</p>
          ) : notifications.length === 0 ? (
            <p style={{textAlign: 'center', color: '#888'}}>No tens cap notificació recent.</p>
          ) : (
            notifications.map((notif) => (
              <div key={notif.id} className="class-item" style={{ borderLeft: notif.action === 'book' ? '4px solid #4ade80' : '4px solid #f87171' }}>
                <div className="class-header">
                  <span style={{ fontSize: '14px', color: '#a0a0b0' }}>{formatDate(notif.timestamp)}</span>
                </div>
                
                <div className="class-details" style={{ display: 'block', border: 'none', padding: '10px 0 0 0' }}>
                  <p style={{ fontSize: '16px', margin: '0 0 5px 0', color: 'white' }}>
                    <span style={getActionStyle(notif.action)}>
                      {notif.action === 'book' ? "NOVA RESERVA (+)" : "CANCEL·LACIÓ (-)"}
                    </span>
                  </p>
                  <p style={{ margin: 0, color: '#e0e0e0' }}>
                    <strong>{notif.userName}</strong> {notif.action === 'book' ? "s'ha apuntat a" : "s'ha donat de baixa de"} <strong>{notif.classTitle}</strong>.
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}

export default TrainerNotifications;