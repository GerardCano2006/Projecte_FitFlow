import React, { useState, useEffect } from "react";
import { auth, db } from "../firebaseConfig";
import { 
  collection, getDocs, query, orderBy, doc, updateDoc, 
  arrayUnion, arrayRemove, getDoc, deleteDoc 
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "./ViewClasses.css"; 

function ViewClasses() {
  const [classes, setClasses] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Aquest estat controla si veiem la llista (null) o el detall (objecte)
  const [selectedClass, setSelectedClass] = useState(null);
  
  const [processing, setProcessing] = useState(false);
  const [userRole, setUserRole] = useState('client');
  
  const navigate = useNavigate();
  const user = auth.currentUser;

  // --- 1. CARREGAR DADES (Igual que sempre) ---
  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    loadData();
  }, [user, navigate]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setMyBookings(data.bookedClasses || []);
          setUserRole(data.role || 'client');
        }
      }
      const q = query(collection(db, "classes"), orderBy("schedule", "asc"));
      const querySnapshot = await getDocs(q);
      const classesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClasses(classesData);
    } catch (error) {
      console.error("Error carregant:", error);
    }
    setLoading(false);
  };

  // --- 2. ACCIONS (Igual que sempre) ---
  const handleBook = async (classItem) => {
    if (processing) return;
    setProcessing(true);
    try {
      const classRef = doc(db, "classes", classItem.id);
      const userRef = doc(db, "users", user.uid);
      await updateDoc(classRef, { participants: arrayUnion(user.uid) });
      await updateDoc(userRef, { bookedClasses: arrayUnion(classItem.id) });

      setMyBookings([...myBookings, classItem.id]);
      
      // Actualitzar l'estat local
      const updatedClasses = classes.map(c => {
        if (c.id === classItem.id) {
          const parts = c.participants || [];
          return { ...c, participants: [...parts, user.uid] };
        }
        return c;
      });
      setClasses(updatedClasses);
      // Si estem veient el detall, actualitzem també l'objecte seleccionat
      if (selectedClass && selectedClass.id === classItem.id) {
        const updatedSelected = updatedClasses.find(c => c.id === classItem.id);
        setSelectedClass(updatedSelected);
      }
      
      alert("Reserva confirmada!");
    } catch (error) {
      console.error("Error:", error);
      alert("Error en reservar.");
    }
    setProcessing(false);
  };

  const handleCancel = async (classItem) => {
    if (processing) return;
    setProcessing(true);
    try {
      const classRef = doc(db, "classes", classItem.id);
      const userRef = doc(db, "users", user.uid);
      await updateDoc(classRef, { participants: arrayRemove(user.uid) });
      await updateDoc(userRef, { bookedClasses: arrayRemove(classItem.id) });

      setMyBookings(myBookings.filter(id => id !== classItem.id));

      const updatedClasses = classes.map(c => {
        if (c.id === classItem.id) {
          const parts = c.participants || [];
          return { ...c, participants: parts.filter(uid => uid !== user.uid) };
        }
        return c;
      });
      setClasses(updatedClasses);
      if (selectedClass && selectedClass.id === classItem.id) {
        const updatedSelected = updatedClasses.find(c => c.id === classItem.id);
        setSelectedClass(updatedSelected);
      }

      alert("Reserva cancel·lada.");
    } catch (error) {
      console.error("Error:", error);
    }
    setProcessing(false);
  };

  const handleDelete = async (classId) => {
    if(!window.confirm("Eliminar classe?")) return;
    try {
      await deleteDoc(doc(db, "classes", classId));
      setClasses(classes.filter(c => c.id !== classId));
      setSelectedClass(null); // Tornar a la llista si esborrem la que veiem
    } catch (error) { console.error(error); }
  };

  const formatDate = (iso) => new Date(iso).toLocaleDateString("ca-ES", { weekday: 'short', day: 'numeric', month: 'short' });
  const formatTime = (iso) => new Date(iso).toLocaleTimeString("ca-ES", { hour: '2-digit', minute: '2-digit' });

  // --- RENDERITZAT ---

  return (
    <div className="view-classes-container">
      
      {/* SI TENIM UNA CLASSE SELECCIONADA -> MOSTREM EL DETALL (Pantalla Completa) */}
      {selectedClass ? (
        <div className="detail-view">
          <div className="detail-header">
            {/* Botó per tornar enrere a la llista (tanca el detall) */}
            <button className="btn-back" onClick={() => setSelectedClass(null)}>
              ⬅ Tornar a la llista
            </button>
          </div>

          <div className="detail-image-container">
            <img 
              src={selectedClass.imageUrl || "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80"} 
              alt={selectedClass.title} 
              className="detail-image"
            />
            {myBookings.includes(selectedClass.id) && <div className="booked-badge">Reservat</div>}
          </div>

          <div className="detail-title">
            <h2>{selectedClass.title}</h2>
            <span className="detail-trainer">Amb {selectedClass.trainerName || "Instructor FitFlow"}</span>
          </div>

          {/* Descripció */}
          <div className="detail-section">
            <h4>Descripció</h4>
            <p>{selectedClass.description || "Entrenament d'alta intensitat dissenyat per millorar la resistència i la força."}</p>
          </div>

          {/* Tags */}
          <div className="detail-section">
            <h4>Etiquetes</h4>
            <div className="tags-container">
               {(selectedClass.tags || ["Fitness", "Cardio"]).map((tag, i) => (
                 <span key={i} className="tag-pill">{tag}</span>
               ))}
            </div>
          </div>

          {/* Info Grid */}
          <div className="detail-section">
            <h4>Detalls de la Sessió</h4>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Dia</span>
                <span className="info-value">{formatDate(selectedClass.schedule)}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Hora</span>
                <span className="info-value">{formatTime(selectedClass.schedule)}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Lloc</span>
                <span className="info-value">{selectedClass.location || "Sala 1"}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Aforament</span>
                <span className="info-value">
                  {(selectedClass.participants || []).length} / {selectedClass.maxParticipants || 20}
                </span>
              </div>
            </div>
          </div>

          {/* Material */}
          <div className="detail-section" style={{ borderLeft: '4px solid #667eea' }}>
            <h4>Material Necessari</h4>
            <p>{selectedClass.equipment || "Roba còmoda, tovallola i aigua."}</p>
          </div>

          {/* Botons d'Acció GRANS */}
          <div className="detail-actions">
            {myBookings.includes(selectedClass.id) ? (
              <button 
                className="btn-cancel-large" 
                onClick={() => handleCancel(selectedClass)}
                disabled={processing}
              >
                {processing ? "Processant..." : "Cancel·lar Reserva"}
              </button>
            ) : (
              <button 
                className="btn-book-large"
                onClick={() => handleBook(selectedClass)}
                disabled={processing || (selectedClass.participants || []).length >= (selectedClass.maxParticipants || 20)}
              >
                {processing ? "Processant..." : 
                 (selectedClass.participants || []).length >= (selectedClass.maxParticipants || 20) ? "Classe Plena" : "Reservar Plaça"}
              </button>
            )}

            {(userRole === 'admin' || userRole === 'trainer') && (
              <button className="btn-cancel-large" style={{borderColor:'#ff6b6b', color:'#ff6b6b'}} onClick={() => handleDelete(selectedClass.id)}>
                Eliminar Classe (Admin)
              </button>
            )}
          </div>
        </div>
      ) : (
        /* SI NO TENIM CLASSE SELECCIONADA -> MOSTREM LA LLISTA (GRID) */
        <>
          <div className="view-header">
            <h2>Classes Disponibles</h2>
            <button className="btn-back" onClick={() => navigate("/home")}>
              ⬅ Tornar a Inici
            </button>
          </div>

          {loading ? (
            <div className="loading">Carregant classes...</div>
          ) : classes.length === 0 ? (
            <div className="no-classes">No hi ha classes disponibles.</div>
          ) : (
            <div className="classes-grid">
              {classes.map((classItem) => {
                const isBooked = myBookings.includes(classItem.id);
                const participants = classItem.participants || [];
                
                return (
                  <div key={classItem.id} className="class-card" onClick={() => setSelectedClass(classItem)}>
                    <div className="class-card-image">
                      <img 
                        src={classItem.imageUrl || "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=500&q=60"} 
                        alt={classItem.title} 
                      />
                      {isBooked && <div className="booked-badge">Reservat</div>}
                    </div>
                    <div className="class-card-content">
                      <h3>{classItem.title}</h3>
                      <div className="trainer-info-card">Amb {classItem.trainerName || "Instructor"}</div>
                      <div className="quick-stats">
                        <span>📅 {formatDate(classItem.schedule)}</span>
                        <span>⏰ {formatTime(classItem.schedule)}</span>
                        <span>👥 {participants.length}/{classItem.maxParticipants || 20}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ViewClasses;