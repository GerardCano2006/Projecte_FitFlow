import React, { useState, useEffect } from "react";
import { auth, db } from "../firebaseConfig";
import { collection, query, where, orderBy, getDocs, getDoc, doc, writeBatch } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "./TrainerNotifications.css"; // 👈 Canviem al nou CSS específic

function TrainerNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false); // Estat pel loading de l'esborrat
  const navigate = useNavigate();
  const user = auth.currentUser;

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const trainerName = userDoc.data().name;

        const q = query(
          collection(db, "booking_logs"),
          where("trainerName", "==", trainerName),
          orderBy("timestamp", "desc")
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

  // --- FUNCIÓ PER NETEJAR ANTIGUES ---
  const handleCleanOld = async () => {
    // Si en tenim 3 o menys, no fem res (encara que el botó hauria d'estar disabled)
    if (notifications.length <= 3) return;

    const confirm = window.confirm("Això esborrarà totes les notificacions antigues i deixarà només les 3 més recents. Continuar?");
    if (!confirm) return;

    setClearing(true);
    try {
      const batch = writeBatch(db);
      
      // Mantenim les primeres 3 (0, 1, 2) i agafem la resta per esborrar
      const toDelete = notifications.slice(3);

      toDelete.forEach((notif) => {
        const docRef = doc(db, "booking_logs", notif.id);
        batch.delete(docRef);
      });

      await batch.commit();
      
      // Actualitzem l'estat visualment sense recarregar
      setNotifications(notifications.slice(0, 3));
      
    } catch (error) {
      console.error("Error netejant:", error);
      alert("No s'ha pogut netejar l'historial.");
    } finally {
      setClearing(false);
    }
  };

  const getActionStyle = (action) => {
    if (action === 'book') return { color: '#4ade80', fontWeight: 'bold' }; 
    if (action === 'cancel') return { color: '#f87171', fontWeight: 'bold' }; 
    return { color: 'white' };
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate(); 
    return date.toLocaleString('ca-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit' });
  };

  return (
    <div className="manage-container">
      <div className="manage-content" style={{ maxWidth: '700px' }}>
        
        <div className="manage-header">
          <h2>La Meva Bústia 📬</h2>
          
          <div className="header-actions">
            {/* BOTÓ NETEJAR: Visible sempre, desactivat si no cal */}
            <button 
              className="btn-clean" 
              onClick={handleCleanOld}
              disabled={notifications.length <= 3 || clearing}
              title={notifications.length <= 3 ? "Necessites més de 3 notificacions per netejar" : "Esborrar antigues"}
            >
              {clearing ? "..." : "🗑 Netejar Antigues"}
            </button>

            <button className="btn-back" onClick={() => navigate("/home")}>
              ⬅ Tornar
            </button>
          </div>
        </div>

        <div className="classes-list">
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <h3>Activitat Recent</h3>
            <span style={{fontSize: '12px', color: '#666'}}>
                Total: {notifications.length}
            </span>
          </div>
          
          {loading ? (
            <p style={{textAlign: 'center', color: '#888'}}>Carregant...</p>
          ) : notifications.length === 0 ? (
            <p style={{textAlign: 'center', color: '#888', padding: '20px'}}>No tens cap notificació recent.</p>
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