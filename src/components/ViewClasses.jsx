import React, { useState, useEffect } from "react";
import { auth, db } from "../firebaseConfig";
import { 
  collection, 
  getDocs, 
  addDoc, 
  query, 
  where, 
  deleteDoc, 
  doc, 
  updateDoc, 
  serverTimestamp, 
  increment,
  getDoc  // 🔥 AFEGEIX getDoc per debug
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "./ViewClasses.css";

function ViewClasses() {
  const [classes, setClasses] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [bookingCounts, setBookingCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      navigate("/login");
      return;
    }
    loadClasses();
    loadMyBookings();
  }, [navigate]);

  const loadClasses = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "classes"));
      const classesData = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (new Date(data.schedule) > new Date()) {
          classesData.push({ id: doc.id, ...data });
        }
      });
      classesData.sort((a, b) => new Date(a.schedule) - new Date(b.schedule));
      setClasses(classesData);
      
      await loadBookingCounts(classesData);
    } catch (error) {
      console.error("Error carregant classes:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadBookingCounts = async (classesData) => {
    const counts = {};
    for (const classItem of classesData) {
      const count = await getBookingCount(classItem.id);
      counts[classItem.id] = count;
    }
    setBookingCounts(counts);
  };

  const loadMyBookings = async () => {
    try {
      const user = auth.currentUser;
      const q = query(collection(db, "bookings"), where("userId", "==", user.uid));
      const querySnapshot = await getDocs(q);
      
      const bookingsData = [];
      querySnapshot.forEach((doc) => {
        bookingsData.push({ id: doc.id, ...doc.data() });
      });
      setMyBookings(bookingsData);
    } catch (error) {
      console.error("Error carregant reserves:", error);
    }
  };

  const getBookingCount = async (classId) => {
    try {
      const q = query(
        collection(db, "bookings"), 
        where("classId", "==", classId),
        where("status", "==", "confirmed")
      );
      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error("Error comptant reserves:", error);
      return 0;
    }
  };

  const isBooked = (classId) => {
    return myBookings.some(
      booking => booking.classId === classId && booking.status === "confirmed"
    );
  };

  const getBookingId = (classId) => {
    const booking = myBookings.find(
      b => b.classId === classId && b.status === "confirmed"
    );
    return booking ? booking.id : null;
  };

  // 🔥 SISTEMA DE PUNTS AMB DEBUG
  const updateUserStats = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.error("❌ Usuari no autentificat!");
        return;
      }
      
      console.log("🔥 Actualitzant punts per:", user.uid); // DEBUG
      
      const userRef = doc(db, "users", user.uid);
      
      // 🔥 VERIFICA SI EL DOCUMENT EXISTEIX
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        console.error("❌ Document d'usuari NO existeix a Firestore!");
        return;
      }
      
      await updateDoc(userRef, {
        classesAttended: increment(1),
        points: increment(100),
        classesThisWeek: increment(1),
        updatedAt: serverTimestamp()
      });
      
      console.log("✅ PUNTS ACTUALITZATS: +100 pts, +1 classe"); // DEBUG
    } catch (error) {
      console.error("💥 ERROR UPDATE PUNTS:", error.message); // DEBUG
      console.error("Error complet:", error);
    }
  };

  const handleBookClass = async (classItem) => {
    try {
      const user = auth.currentUser;
      const bookingCount = bookingCounts[classItem.id] || 0;

      if (bookingCount >= classItem.capacity) {
        alert("Aquesta classe està completa!");
        return;
      }

      console.log("📅 Reservant classe:", classItem.id); // DEBUG

      await addDoc(collection(db, "bookings"), {
        userId: user.uid,
        classId: classItem.id,
        status: "confirmed",
        bookedAt: new Date().toISOString(),
        attended: false
      });

      // 🔥 ACTUALITZA PUNTS
      await updateUserStats();

      alert("✅ Reserva confirmada! +100 punts! 🎉");
      loadMyBookings();
      loadClasses();
    } catch (error) {
      console.error("Error reservant classe:", error);
      alert("Error: " + error.message);
    }
  };

  const handleCancelBooking = async (classId) => {
    if (!window.confirm("Segur que vols cancel·lar aquesta reserva?")) {
      return;
    }

    try {
      const bookingId = getBookingId(classId);
      if (bookingId) {
        await deleteDoc(doc(db, "bookings", bookingId));
        
        // 🔥 RESTA PUNTS
        const userRef = doc(db, "users", auth.currentUser.uid);
        await updateDoc(userRef, {
          points: increment(-50),
          classesThisWeek: increment(-1),
          updatedAt: serverTimestamp()
        });
        
        console.log("✅ Reserva cancel·lada: -50 punts"); // DEBUG
        alert("✅ Reserva cancel·lada (-50 punts)");
        loadMyBookings();
        loadClasses();
      }
    } catch (error) {
      console.error("Error cancel·lant reserva:", error);
      alert("Error: " + error.message);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Demà";
    } else {
      return date.toLocaleDateString('ca-ES', { weekday: 'short', month: 'short', day: 'numeric' });
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('ca-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) {
    return <div className="loading">Carregant classes...</div>;
  }

  if (selectedClass) {
    const booked = isBooked(selectedClass.id);
    const bookingCount = bookingCounts[selectedClass.id] || 0;
    const availabilityPercentage = (bookingCount / selectedClass.capacity) * 100;

    return (
      <div className="class-detail-container">
        <button className="btn-back-detail" onClick={() => setSelectedClass(null)}>
          ← Tornar
        </button>
        
        <div className="class-detail-card">
          <div className="class-image">
            <img 
              src={selectedClass.imageUrl || "https://source.unsplash.com/800x400/?gym,fitness"} 
              alt={selectedClass.title}
            />
          </div>

          <div className="class-detail-content">
            <h2>{selectedClass.title}</h2>
            
            <div className="trainer-info">
              <span className="trainer-name">with {selectedClass.trainerName || "Instructor"}</span>
              <span className="rating">⭐ {selectedClass.rating || 4.5}</span>
            </div>

            <div className="class-meta">
              <div className="meta-item">
                <span className="icon">📅</span>
                <span>{formatDate(selectedClass.schedule)}, {formatTime(selectedClass.schedule)}</span>
              </div>
              <div className="meta-item">
                <span className="icon">⏱️</span>
                <span>{selectedClass.duration} min</span>
              </div>
              <div className="meta-item">
                <span className="icon">📍</span>
                <span>{selectedClass.location}</span>
              </div>
              <div className="meta-item">
                <span className="icon">👥</span>
                <span>{bookingCount}/{selectedClass.capacity} joined</span>
              </div>
            </div>

            <div className="availability-section">
              <h4>Aforament</h4>
              <div className="availability-bar">
                <div 
                  className="availability-fill" 
                  style={{ width: `${availabilityPercentage}%` }}
                ></div>
              </div>
            </div>

            <div className="about-section">
              <h3>Sobre aquesta sessió:</h3>
              <p>{selectedClass.description}</p>
            </div>

            {selectedClass.tags && selectedClass.tags.length > 0 && (
              <div className="tags-section">
                <h4>Material necessari</h4>
                <div className="tags">
                  {selectedClass.tags.map((tag, index) => (
                    <span key={index} className="tag">{tag}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="action-buttons">
              {booked ? (
                <button className="btn-cancel" onClick={() => handleCancelBooking(selectedClass.id)}>
                  Donar-se de baixa
                </button>
              ) : (
                <button 
                  className="btn-book" 
                  onClick={() => handleBookClass(selectedClass)}
                  disabled={bookingCount >= selectedClass.capacity}
                >
                  {bookingCount >= selectedClass.capacity ? "Class Full" : "Book Now"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="view-classes-container">
      <div className="view-header">
        <h2>Classes Disponibles</h2>
        <button className="btn-back" onClick={() => navigate("/home")}>
          Tornar
        </button>
      </div>

      {classes.length === 0 ? (
        <p className="no-classes">No hi ha classes programades en aquest moment.</p>
      ) : (
        <div className="classes-grid">
          {classes.map((classItem) => {
            const booked = isBooked(classItem.id);
            const bookingCount = bookingCounts[classItem.id] || 0;
            
            return (
              <div 
                key={classItem.id}
                className={`class-card ${booked ? 'booked' : ''}`}
                onClick={() => setSelectedClass(classItem)}
              >
                <div className="class-card-image">
                  <img 
                    src={classItem.imageUrl || "https://source.unsplash.com/800x400/?gym,fitness"} 
                    alt={classItem.title}
                  />
                  {booked && <div className="booked-badge">Reservat</div>}
                </div>

                <div className="class-card-content">
                  <h3>{classItem.title}</h3>
                  
                  <div className="trainer-info-small">
                    <span>amb {classItem.trainerName || "Instructor"}</span>
                    <span className="rating-small">⭐ {classItem.rating || 4.5}</span>
                  </div>

                  <div className="class-quick-info">
                    <span>📅 {formatDate(classItem.schedule)}, {formatTime(classItem.schedule)}</span>
                    <span>⏱️ {classItem.duration} min</span>
                    <span>📍 {classItem.location}</span>
                    <span>👥 {bookingCount}/{classItem.capacity}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ViewClasses;