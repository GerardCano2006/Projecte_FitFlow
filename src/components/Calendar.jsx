import React, { useState, useEffect } from "react";
import { auth, db } from "../firebaseConfig";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "./Calendar.css";

function Calendar() {
  const [weekClasses, setWeekClasses] = useState({});
  const [daysArray, setDaysArray] = useState([]); 
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      navigate("/login");
      return;
    }
    
    // 1. Generem els 14 dies (DES D'AVUI)
    const days = getWeekDays();
    setDaysArray(days);

    // 2. Carreguem les dades
    loadData(user.uid);
  }, [navigate]);

  const getLocalDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 👇 CANVI: Ara comencem a comptar des d'AVUI (0) fins a 14 dies vista
  const getWeekDays = () => {
    const days = [];
    const today = new Date();
    
    // Bucle simple: d'avui fins d'aquí a 14 dies
    for (let i = 0; i < 14; i++) {
      const nextDay = new Date(today);
      nextDay.setDate(today.getDate() + i);
      days.push(nextDay);
    }
    return days;
  };

  const loadData = async (userId) => {
    setLoading(true);
    try {
      // Carreguem TOTES les classes futures
      const q = query(collection(db, "classes"), orderBy("schedule", "asc"));
      const querySnapshot = await getDocs(q);
      
      const grouped = {};
      const userBookings = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const classDate = new Date(data.schedule);
        const dateKey = getLocalDateString(classDate);

        // Agrupem classes per dia
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push({ id: doc.id, ...data });

        // Mirem si l'usuari hi està apuntat
        if (data.participants && data.participants.includes(userId)) {
          userBookings.push(doc.id);
        }
      });

      setWeekClasses(grouped);
      setMyBookings(userBookings);

    } catch (error) {
      console.error("Error carregant calendari:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDayName = (date) => {
    const options = { weekday: 'long' };
    const name = date.toLocaleDateString('ca-ES', options);
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <h2>El Meu Calendari 📅</h2>
        <button className="btn-back" onClick={() => navigate('/home')}>
          ← Tornar
        </button>
      </div>

      {loading ? (
        <div className="loading-msg">Carregant dies...</div>
      ) : (
        <div className="week-container">
          {daysArray.map((day) => {
            const dateKey = getLocalDateString(day);
            const dayClasses = weekClasses[dateKey] || [];
            
            // Comprovem si és avui (per defecte serà el primer)
            const isToday = getLocalDateString(new Date()) === dateKey;

            return (
              <div className={`day-column ${isToday ? 'today-column' : ''}`} key={dateKey}>
                <div className="column-header">
                  <div className="column-day">{getDayName(day)}</div>
                  <div className="column-date">{day.getDate()}</div>
                </div>

                <div className="column-classes">
                  {dayClasses.length === 0 ? (
                    <div className="no-classes-day">-</div>
                  ) : (
                    dayClasses.map((classItem) => {
                      const isBooked = myBookings.includes(classItem.id);
                      return (
                        <div 
                          key={classItem.id}
                          className={`mini-class-card ${isBooked ? 'booked' : ''}`}
                          onClick={() => navigate('/classes')} 
                          title={classItem.title}
                        >
                          <div className="mini-class-time">{formatTime(classItem.schedule)}</div>
                          <div className="mini-class-title">{classItem.title}</div>
                          {isBooked && <span className="check-icon">✓</span>}
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