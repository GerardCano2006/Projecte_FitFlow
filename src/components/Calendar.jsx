import React, { useState, useEffect } from "react";
import { auth, db } from "../firebaseConfig";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore"; // Assegura't que getDoc estigui importat
import { useNavigate } from "react-router-dom";
import "./Calendar.css";

function Calendar() {
  const [weekClasses, setWeekClasses] = useState({});
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  // Hem eliminat selectedDay perquè no s'estava utilitzant al codi original
  const navigate = useNavigate();

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      navigate("/login");
      return;
    }
    loadWeekClasses();
    loadMyBookings(user.uid); // Passem el UID de l'usuari
  }, [navigate]);

  const getWeekDays = () => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

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
      endDate.setHours(23, 59, 59, 999); // Assegura't que agafa fins al final del dia

      const classesRef = collection(db, "classes");
      const q = query(
        classesRef,
        where("schedule", ">=", startDate.toISOString()),
        where("schedule", "<=", endDate.toISOString())
      );

      const querySnapshot = await getDocs(q);
      const classesByDay = {};
      weekDays.forEach(day => {
        classesByDay[day.toISOString().split('T')[0]] = [];
      });

      querySnapshot.forEach((doc) => {
        const classData = { id: doc.id, ...doc.data() };
        const classDateStr = new Date(classData.schedule).toISOString().split('T')[0];
        if (classesByDay[classDateStr]) {
          classesByDay[classDateStr].push(classData);
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
      // Accedeix directament a les reserves de l'usuari
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

  const formatTime = (isoString) => {
    return new Date(isoString).toLocaleTimeString('ca-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const getDayName = (date) => {
    const days = ['DIU', 'DIL', 'DIM', 'DIM', 'DIJ', 'DIV', 'DIS'];
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
            const dayKey = day.toISOString().split('T')[0];
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

                      // S'HA ELIMINAT: const backgroundColor = getClassColor(classItem.title);
                      // S'HA ELIMINAT: style={{ backgroundColor }}
                      // Ara el CSS controlarà el fons fosc.

                      return (
                        <div 
                          key={classItem.id}
                          className={`mini-class-card ${booked ? 'booked' : ''}`}
                          onClick={() => navigate('/classes')} // Envia a la pàgina de classes per gestionar
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