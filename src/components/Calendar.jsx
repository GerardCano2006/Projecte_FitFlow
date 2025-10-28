import React, { useState, useEffect } from "react";
import { auth, db } from "../firebaseConfig";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "./Calendar.css";

function Calendar() {
  const [weekClasses, setWeekClasses] = useState({});
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      navigate("/login");
      return;
    }
    loadWeekClasses();
    loadMyBookings();
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
      endDate.setHours(23, 59, 59, 999);

      const querySnapshot = await getDocs(collection(db, "classes"));
      const classesData = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const classDate = new Date(data.schedule);
        if (classDate >= startDate && classDate <= endDate) {
          classesData.push({ id: doc.id, ...data });
        }
      });

      const classesGrouped = {};
      weekDays.forEach(day => {
        const dayKey = day.toISOString().split('T')[0];
        classesGrouped[dayKey] = classesData
          .filter(c => {
            const cDate = new Date(c.schedule);
            return cDate.toISOString().split('T')[0] === dayKey;
          })
          .sort((a, b) => new Date(a.schedule) - new Date(b.schedule));
      });

      setWeekClasses(classesGrouped);
    } catch (error) {
      console.error("Error carregant classes de la setmana:", error);
    } finally {
      setLoading(false);
    }
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

  const isBooked = (classId) => {
    return myBookings.some(
      booking => booking.classId === classId && booking.status === "confirmed"
    );
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('ca-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getDayName = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);

    if (compareDate.getTime() === today.getTime()) {
      return "Avui";
    }

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    if (compareDate.getTime() === tomorrow.getTime()) {
      return "Demà";
    }

    return date.toLocaleDateString('ca-ES', { weekday: 'long' });
  };

  const getClassColor = (title) => {
    const colors = {
      'yoga': '#e8f5e9',
      'spinning': '#fff3e0',
      'fitness': '#e3f2fd',
      'pilates': '#f3e5f5',
      'aerobic': '#ffe0e0',
      'zumba': '#fff9c4',
      'hiit': '#ffebee',
      'crossfit': '#e0f2f1'
    };

    const titleLower = title.toLowerCase();
    for (const key in colors) {
      if (titleLower.includes(key)) {
        return colors[key];
      }
    }
    return '#f5f5f5';
  };

  if (loading) {
    return <div className="loading">Carregant calendari...</div>;
  }

  const weekDays = getWeekDays();
  const classesForSelectedDay = selectedDay ? weekClasses[selectedDay] || [] : [];

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <h2>Calendari Setmanal</h2>
        <button className="btn-back" onClick={() => navigate("/home")}>
          Tornar
        </button>
      </div>

      <div className="week-navigation">
        {weekDays.map((day, index) => {
          const dayKey = day.toISOString().split('T')[0];
          const dayClasses = weekClasses[dayKey] || [];
          const isSelected = selectedDay === dayKey;
          const isToday = day.toDateString() === new Date().toDateString();

          return (
            <div 
              key={index}
              className={`day-card ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
              onClick={() => setSelectedDay(isSelected ? null : dayKey)}
            >
              <div className="day-name">{getDayName(day)}</div>
              <div className="day-number">{day.getDate()}</div>
              <div className="day-classes-count">{dayClasses.length} classes</div>
            </div>
          );
        })}
      </div>

      {selectedDay && (
        <div className="day-classes">
          <h3>Classes del {new Date(selectedDay).toLocaleDateString('ca-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</h3>
          
          {classesForSelectedDay.length === 0 ? (
            <p className="no-classes">No hi ha classes programades aquest dia.</p>
          ) : (
            <div className="classes-timeline">
              {classesForSelectedDay.map((classItem) => {
                const booked = isBooked(classItem.id);
                const backgroundColor = getClassColor(classItem.title);

                return (
                  <div 
                    key={classItem.id}
                    className={`timeline-class ${booked ? 'booked' : ''}`}
                    style={{ backgroundColor }}
                    onClick={() => navigate('/classes')}
                  >
                    <div className="timeline-time">{formatTime(classItem.schedule)}</div>
                    <div className="timeline-content">
                      <h4>{classItem.title}</h4>
                      <p className="timeline-trainer">amb {classItem.trainerName || "Instructor"}</p>
                      <div className="timeline-meta">
                        <span>⏱️ {classItem.duration} min</span>
                        <span>📍 {classItem.location}</span>
                        {booked && <span className="booked-label">✓ Reservat</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {!selectedDay && (
        <div className="calendar-grid">
          {weekDays.map((day, dayIndex) => {
            const dayKey = day.toISOString().split('T')[0];
            const dayClasses = weekClasses[dayKey] || [];

            return (
              <div key={dayIndex} className="calendar-day-column">
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
                      const backgroundColor = getClassColor(classItem.title);

                      return (
                        <div 
                          key={classItem.id}
                          className={`mini-class-card ${booked ? 'booked' : ''}`}
                          style={{ backgroundColor }}
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