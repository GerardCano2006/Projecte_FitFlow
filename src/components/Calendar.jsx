import React, { useState, useEffect } from "react";
import { auth, db } from "../firebaseConfig";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar"; 
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
    
    const days = getWeekDays();
    setDaysArray(days);
    loadData(user.uid);
  }, [navigate]);

  const getLocalDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getWeekDays = () => {
    const days = [];
    const today = new Date();
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
      const q = query(collection(db, "classes"), orderBy("schedule", "asc"));
      const querySnapshot = await getDocs(q);
      
      const grouped = {};
      const userBookings = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const classDate = new Date(data.schedule);
        const dateKey = getLocalDateString(classDate);

        if (!grouped[dateKey]) grouped[dateKey] = [];
        grouped[dateKey].push({ id: doc.id, ...data });

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
    <div className="dashboard-layout">
      {/* 1. Barra Lateral Fixa */}
      <Sidebar />

      {/* 2. Contingut del Calendari (Scrollable) */}
      <div className="calendar-content-wrapper">
        <div className="calendar-header">
          <h2>El Meu Calendari 📅</h2>
          <button className="btn-back" onClick={() => navigate('/home')}>
             Tornar
          </button>
        </div>

        {loading ? (
          <div className="loading-msg">Carregant dies...</div>
        ) : (
          /* Aquest contenidor manté el Grid de 7 columnes */
          <div className="week-container">
            {daysArray.map((day) => {
              const dateKey = getLocalDateString(day);
              const dayClasses = weekClasses[dateKey] || [];
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
    </div>
  );
}

export default Calendar;