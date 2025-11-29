import React, { useState, useEffect } from "react";
import { auth, db } from "../firebaseConfig";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "./Calendar.css";

function Calendar() {
  const [weekClasses, setWeekClasses] = useState({});
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      navigate("/login");
      return;
    }
    loadWeekClasses();
    loadMyBookings(user.uid);
  }, [navigate]);

  // 👇 --- NOVA FUNCIÓ D'AJUDA --- 👇
  /**
   * Converteix un objecte Date a un string local YYYY-MM-DD
   * Evita problemes de zona horària de .toISOString()
   */
  const getLocalDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // +1 perquè els mesos són 0-11
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getWeekDays = () => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Mitjanit, hora local

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const loadWeekClasses = async () => {
    try {
      const weekDays = getWeekDays();
      const startDate = weekDays[0];
      const endDate = new Date(weekDays[6]);
      endDate.setHours(23, 59, 59, 999);

      const classesRef = collection(db, "classes");
      // La consulta de Firestore ja gestiona bé els objectes Date i els strings ISO
      const q = query(
        classesRef,
        where("schedule", ">=", startDate.toISOString()),
        where("schedule", "<=", endDate.toISOString())
      );

      const querySnapshot = await getDocs(q);
      const classesByDay = {};

      // 👇 --- CANVI 1: Creem els 'buckets' (columnes) amb la data local --- 👇
      weekDays.forEach(day => {
        // Abans: classesByDay[day.toISOString().split('T')[0]] = [];
        classesByDay[getLocalDateString(day)] = [];
      });

      querySnapshot.forEach((doc) => {
        const classData = { id: doc.id, ...doc.data() };
        // Creem un objecte Date a partir del text de Firestore (que és 'datetime-local')
        // Ex: "2025-11-20T11:00" -> esdevé un objecte Date local
        const classDate = new Date(classData.schedule); 
        
        // 👇 --- CANVI 2: Busquem el 'bucket' amb la data local de la classe --- 👇
        // Abans: const classDateStr = new Date(classData.schedule).toISOString().split('T')[0];
        const classDateStr = getLocalDateString(classDate);
        
        if (classesByDay[classDateStr]) {
          classesByDay[classDateStr].push(classData);
        } else {
          // Debug: si una classe no troba el seu 'bucket'
          console.warn("Classe sense 'bucket' trobada:", classData.title, classDateStr);
        }
      });

      // Ordena les classes per hora dins de cada dia
      for (const day in classesByDay) {
        classesByDay[day].sort((a, b) => new Date(a.schedule) - new Date(b.schedule));
      }

      setWeekClasses(classesByDay);
    } catch (error) {
      console.error("Error carregant classes:", error);
    }
  };

  const loadMyBookings = async (userId) => {
    try {
      const userDocRef = doc(db, "users", userId);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        setMyBookings(userData.bookedClasses || []);
      }
    } catch (error) {
      console.error("Error carregant reserves:", error);
    } finally {
      setLoading(false);
    }
  };

  const isBooked = (classId) => {
    return myBookings.includes(classId);
  };

  // Aquesta funció ja funciona bé (mostra l'hora local)
  const formatTime = (isoString) => {
    return new Date(isoString).toLocaleTimeString('ca-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const getDayName = (date) => {
    // Corregit: DIM (Dimarts) i DIM (Dimecres) eren iguals
    const days = ['DIU', 'DIL', 'DIM', 'DC', 'DIJ', 'DIV', 'DIS'];
    return days[date.getDay()];
  };

  const weekDays = getWeekDays();

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <h2>El Meu Calendari</h2>
        <button className="btn-back" onClick={() => navigate("/home")}>
          ⬅ Tornar a Home
        </button>
      </div>

      {loading ? (
        <div className="loading">Carregant calendari...</div>
      ) : (
        <div className="calendar-grid">
          {weekDays.map((day) => {

            const dayKey = getLocalDateString(day);
            const dayClasses = weekClasses[dayKey] || [];

            return (
              <div className="day-column" key={dayKey}>
                <div className="column-header">
                  <div className="column-day">{getDayName(day)}</div>
                  <div className="column-date">{day.getDate()}</div>
                </div>

                <div className="column-classes">
                  {dayClasses.length === 0 ? (
                    <div className="no-classes-day">No hi ha classes</div>
                  ) : (
                    dayClasses.map((classItem) => {
                      const booked = isBooked(classItem.id);

                      return (
                        <div 
                          key={classItem.id}
                          className={`mini-class-card ${booked ? 'booked' : ''}`}
                          onClick={() => navigate('/classes')}
                        >
                          <div className="mini-class-time">{formatTime(classItem.schedule)}</div>
                          <div className="mini-class-title">{classItem.title}</div>
                          <div className="mini-class-location">{classItem.location}</div>
                          {booked && <div className="mini-booked-badge">✓</div>}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Calendar;