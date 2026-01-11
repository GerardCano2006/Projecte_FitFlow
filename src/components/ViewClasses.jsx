import React, { useState, useEffect } from "react";
import { auth, db } from "../firebaseConfig";
import { 
  collection, getDocs, query, orderBy, doc, updateDoc, 
  arrayUnion, arrayRemove, getDoc, deleteDoc, 
  increment // 👈 IMPRESCINDIBLE PER SUMAR ELS PUNTS
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import "./ViewClasses.css"; 

function ViewClasses() {
  const [classes, setClasses] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [userRole, setUserRole] = useState('client');
  
  const navigate = useNavigate();
  const user = auth.currentUser;

  // --- CARREGAR DADES ---
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
          // Unifiquem bookedClasses i myBookings per si de cas
          setMyBookings(data.bookedClasses || data.myBookings || []);
          setUserRole(data.role || 'client');
        }
      }
      const q = query(collection(db, "classes"), orderBy("schedule", "asc"));
      const querySnapshot = await getDocs(q);
      const classesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClasses(classesData);
    } catch (error) {
      console.error("Error carregant dades:", error);
    }
    setLoading(false);
  };

  // --- GOOGLE CALENDAR ---
  const addToGoogleCalendar = (classItem) => {
    const startDate = new Date(classItem.schedule);
    const duration = classItem.duration || 60;
    const endDate = new Date(startDate.getTime() + duration * 60000);
    const formatGoogleDate = (date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");
    
    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(classItem.title)}&dates=${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}&details=${encodeURIComponent(classItem.description)}&location=${encodeURIComponent(classItem.location)}&sf=true&output=xml`;
    window.open(googleUrl, '_blank');
  };

  // --- RESERVAR (SUMANT PUNTS) ---
  const handleBook = async (classItem) => {
    if (processing) return;
    setProcessing(true);
    try {
      const classRef = doc(db, "classes", classItem.id);
      const userRef = doc(db, "users", user.uid);
      
      // Si la classe no té punts definits, per defecte 100
      const pointsToAward = Number(classItem.vitiPoints) || 100;

      // 1. Afegim usuari a la classe
      await updateDoc(classRef, { participants: arrayUnion(user.uid) });
      
      // 2. Afegim reserva a l'usuari I SUMEM ELS PUNTS
      await updateDoc(userRef, { 
        bookedClasses: arrayUnion(classItem.id),
        points: increment(pointsToAward) // 👈 Aquesta és la funció clau
      });

      setMyBookings(prev => [...prev, classItem.id]);
      
      // Actualitzem estat local
      const updatedClasses = classes.map(c => {
        if (c.id === classItem.id) {
          const parts = c.participants || [];
          return { ...c, participants: [...parts, user.uid] };
        }
        return c;
      });
      setClasses(updatedClasses);
      if (selectedClass?.id === classItem.id) {
        setSelectedClass(updatedClasses.find(c => c.id === classItem.id));
      }

      setTimeout(() => {
        const wantCalendar = window.confirm(`Reserva feta! Has guanyat ${pointsToAward} Viti Punts! 💎\nVols afegir-ho al Google Calendar?`);
        if (wantCalendar) addToGoogleCalendar(classItem);
      }, 100);

    } catch (error) {
      console.error("Error reservant:", error);
      alert("Error al realitzar la reserva.");
    }
    setProcessing(false);
  };

  // --- CANCEL·LAR (RESTANT PUNTS) ---
  const handleCancel = async (classItem) => {
    if (processing) return;
    setProcessing(true);
    try {
      const classRef = doc(db, "classes", classItem.id);
      const userRef = doc(db, "users", user.uid);
      
      const pointsToRemove = Number(classItem.vitiPoints) || 100;

      await updateDoc(classRef, { participants: arrayRemove(user.uid) });
      
      // Restem els punts si cancel·la
      await updateDoc(userRef, { 
        bookedClasses: arrayRemove(classItem.id),
        points: increment(-pointsToRemove) 
      });

      setMyBookings(prev => prev.filter(id => id !== classItem.id));

      const updatedClasses = classes.map(c => {
        if (c.id === classItem.id) {
          const parts = c.participants || [];
          return { ...c, participants: parts.filter(uid => uid !== user.uid) };
        }
        return c;
      });
      setClasses(updatedClasses);
      if (selectedClass?.id === classItem.id) {
        setSelectedClass(updatedClasses.find(c => c.id === classItem.id));
      }

      alert(`Reserva cancel·lada. S'han restat ${pointsToRemove} punts.`);
    } catch (error) {
      console.error("Error cancel·lant:", error);
    }
    setProcessing(false);
  };

  const handleDelete = async (classId) => {
    if(!window.confirm("ELIMINAR CLASSE?")) return;
    try {
      await deleteDoc(doc(db, "classes", classId));
      setClasses(classes.filter(c => c.id !== classId));
      setSelectedClass(null); 
    } catch (error) { console.error(error); }
  };

  const formatDate = (iso) => new Date(iso).toLocaleDateString("ca-ES", { weekday: 'short', day: 'numeric', month: 'short' });
  const formatTime = (iso) => new Date(iso).toLocaleTimeString("ca-ES", { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <div className="view-classes-container">
        
        {selectedClass ? (
          <div className="detail-view">
            <div className="detail-header">
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

            {/* BANNER DE PUNTS */}
            <div className="viti-points-banner">
               <span className="diamond-icon">💎</span>
               <span className="points-val">Guanya {selectedClass.vitiPoints || 100} Viti Punts</span>
               <span className="points-desc">reservant aquesta classe!</span>
            </div>

            <div className="detail-section">
              <h4>Descripció</h4>
              <p>{selectedClass.description || "Sense descripció."}</p>
            </div>

            {/* --- SECCIÓ ETIQUETES (Tags) --- */}
            {selectedClass.tags && selectedClass.tags.length > 0 && (
              <div className="detail-section">
                <h4>Etiquetes</h4>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {Array.isArray(selectedClass.tags) 
                    ? selectedClass.tags.map((tag, i) => (
                        <span key={i} style={{ 
                          background: 'rgba(255,255,255,0.1)', 
                          color: '#c0c0e0', 
                          padding: '5px 12px', 
                          borderRadius: '15px', 
                          fontSize: '13px' 
                        }}>
                          #{tag}
                        </span>
                      ))
                    : <span style={{ color: '#888' }}>{selectedClass.tags}</span>
                  }
                </div>
              </div>
            )}

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
                {/* --- AFORAMENT --- */}
                <div className="info-item">
                  <span className="info-label">Aforament</span>
                  <span className="info-value">
                    {(selectedClass.participants || []).length} / {selectedClass.maxParticipants || selectedClass.capacity || 20}
                  </span>
                </div>
                {/* --- UBICACIÓ --- */}
                <div className="info-item">
                  <span className="info-label">Ubicació</span>
                  <span className="info-value">{selectedClass.location || "Sala Principal"}</span>
                </div>
              </div>
            </div>

            <div className="detail-actions">
              {myBookings.includes(selectedClass.id) ? (
                <button 
                  className="btn-cancel-large" 
                  onClick={() => handleCancel(selectedClass)}
                  disabled={processing}
                >
                  {processing ? "..." : "Cancel·lar Reserva"}
                </button>
              ) : (
                <button 
                  className="btn-book-large"
                  onClick={() => handleBook(selectedClass)}
                  disabled={processing || (selectedClass.participants || []).length >= (selectedClass.capacity || 20)}
                >
                  {processing ? "..." : 
                  (selectedClass.participants || []).length >= (selectedClass.capacity || 20) ? "Classe Plena" : "Reservar Plaça"}
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="view-header">
              <h2>Classes Disponibles</h2>
              {/* --- AQUEST ÉS L'ÚNIC CANVI AFEGIT --- */}
              <button className="btn-back-home" onClick={() => navigate('/home')}>
                Tornar al Home
              </button>
            </div>
            
            {/* LLISTA DE CLASSES (Sense canvis, igual que abans) */}
            {classes.length === 0 ? (
              <p>No hi ha classes.</p>
            ) : (
              <div className="classes-grid">
                 {classes.map(c => {
                    const isBooked = myBookings.includes(c.id);
                    return (
                        <div key={c.id} className="class-card" onClick={() => setSelectedClass(c)}>
                            <div className="class-card-image">
                                <img src={c.imageUrl || "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=500&q=60"} alt={c.title} />
                                {isBooked && <div className="booked-badge">Reservat</div>}
                            </div>
                            <div className="class-card-content">
                                <h3>{c.title}</h3>
                                <div className="quick-stats">
                                    <span>📅 {formatDate(c.schedule)}</span>
                                    <span>⏰ {formatTime(c.schedule)}</span>
                                </div>
                            </div>
                        </div>
                    )
                 })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default ViewClasses;