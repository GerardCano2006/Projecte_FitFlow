import React, { useState, useEffect } from "react";
import { auth, db } from "../firebaseConfig";
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "./ManageClasses.css";

function ManageClasses() {
  const [classes, setClasses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  
  // Control d'accés
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [currentUserName, setCurrentUserName] = useState("");
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    schedule: "",
    duration: 60,
    capacity: 20,
    location: "Studio A",
    imageUrl: "",
    tags: "",
    vitiPoints: 100 
  });

  // 1. VERIFICACIÓ DE ROL
  useEffect(() => {
    const checkUserRole = async () => {
      const user = auth.currentUser;
      if (!user) {
        navigate("/login");
        return;
      }
  
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        
        if (userDoc.exists()) {
          const data = userDoc.data();
          
          // Només deixem entrar si és "entrenador"
          if (data.role === "entrenador") {
            setIsAuthorized(true);
            setCurrentUserName(data.name || "Entrenador");
            loadClasses(); 
          } else {
            alert(`Accés denegat. El teu rol és: "${data.role}". Necessites ser "entrenador".`);
            navigate("/home");
          }
        } else {
          alert("Error: No s'ha trobat el perfil d'usuari.");
          navigate("/home");
        }
      } catch (error) {
        console.error("Error verificant rol:", error);
        navigate("/home");
      } finally {
        setLoading(false);
      }
    };
    
    checkUserRole();
  }, [navigate]);

  const loadClasses = async () => {
    try {
      const q = query(collection(db, "classes"));
      const querySnapshot = await getDocs(q);
      // Guardem tot l'objecte data() per no perdre cap propietat oculta
      const classesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClasses(classesData);
    } catch (error) {
      console.error("Error carregant classes:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Convertim tags a array de forma segura
      const tagsString = formData.tags || "";
      const tagsArray = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag !== "");

      // PREPAREM L'OBJECTE PER GUARDAR
      const classData = {
        title: formData.title,
        description: formData.description,
        schedule: formData.schedule,
        duration: Number(formData.duration),
        capacity: Number(formData.capacity),
        maxParticipants: Number(formData.capacity), // Mantenim coherència
        location: formData.location,
        imageUrl: formData.imageUrl,
        tags: tagsArray,
        vitiPoints: Number(formData.vitiPoints),
        
        // --- AQUÍ ESTÀ LA CLAU PER CONSERVAR DETALLS ---
        
        // 1. Si editem, mantenim l'entrenador original. Si és nova, posem l'usuari actual.
        trainerName: editingClass ? (editingClass.trainerName || currentUserName) : currentUserName,
        
        // 2. Si editem, mantenim ELS PARTICIPANTS QUE JA HI EREN. Si és nova, array buit.
        participants: editingClass ? (editingClass.participants || []) : [] 
      };

      if (editingClass) {
        await updateDoc(doc(db, "classes", editingClass.id), classData);
        alert("Classe actualitzada correctament! (Dades conservades)");
      } else {
        await addDoc(collection(db, "classes"), classData);
        alert("Classe creada correctament!");
      }
      
      // Reset del formulari
      setShowForm(false);
      setEditingClass(null);
      setFormData({
        title: "", description: "", schedule: "", duration: 60, 
        capacity: 20, location: "Studio A", imageUrl: "", tags: "",
        vitiPoints: 100
      });
      loadClasses();
    } catch (error) {
      console.error("Error:", error);
      alert("Error al guardar la classe.");
    }
  };

  const handleEdit = (classItem) => {
    setEditingClass(classItem);
    
    // Gestió segura dels tags per visualitzar-los al input
    let safeTags = "";
    if (Array.isArray(classItem.tags)) {
      safeTags = classItem.tags.join(", ");
    } else if (typeof classItem.tags === "string") {
      safeTags = classItem.tags;
    }

    setFormData({
      title: classItem.title || "",
      description: classItem.description || "",
      schedule: classItem.schedule || "",
      duration: classItem.duration || 60,
      capacity: classItem.capacity || classItem.maxParticipants || 20,
      location: classItem.location || "Studio A",
      imageUrl: classItem.imageUrl || "",
      tags: safeTags,
      vitiPoints: classItem.vitiPoints || 100
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Segur que vols eliminar aquesta classe?")) {
      await deleteDoc(doc(db, "classes", id));
      loadClasses();
    }
  };

  if (loading) return <div className="manage-container"><p>Verificant permisos...</p></div>;

  if (!isAuthorized) return null;

  return (
    <div className="manage-container">
      <div className="manage-header">
        <h2>Gestió de Classes 🛠️</h2>
        <button className="btn-back" onClick={() => navigate("/home")}>Tornar</button>
      </div>

      <div className="trainer-welcome">
        Benvingut, <strong>{currentUserName}</strong>.
      </div>

      <button className="btn-create" onClick={() => setShowForm(!showForm)}>
        {showForm ? "Tancar Formulari" : "+ Nova Classe"}
      </button>

      {showForm && (
        <form className="class-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Títol de la classe</label>
            <input name="title" value={formData.title} onChange={handleChange} required placeholder="Ex: Yoga Power" />
          </div>
          
          <div className="form-group">
            <label>Descripció</label>
            <textarea name="description" value={formData.description} onChange={handleChange} required rows="3" />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Data i Hora</label>
              <input type="datetime-local" name="schedule" value={formData.schedule} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Duració (min)</label>
              <input type="number" name="duration" value={formData.duration} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Aforament Màxim</label>
              <input type="number" name="capacity" value={formData.capacity} onChange={handleChange} required />
            </div>
            <div className="form-group points-input-group">
              <label>💎 Viti Punts (Recompensa)</label>
              <input type="number" name="vitiPoints" value={formData.vitiPoints} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-group">
            <label>Ubicació</label>
            <input name="location" value={formData.location} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>URL Imatge</label>
            <input name="imageUrl" value={formData.imageUrl} onChange={handleChange} placeholder="https://..." />
          </div>

          <div className="form-group">
            <label>Etiquetes (separades per comes)</label>
            <input name="tags" value={formData.tags} onChange={handleChange} placeholder="Intensitat, Cardio..." />
          </div>

          <button type="submit" className="btn-submit">
            {editingClass ? "Actualitzar Classe" : "Crear Classe"}
          </button>
        </form>
      )}

      <div className="classes-list">
        <h3>Llistat de Classes 📋</h3>
        {classes.length === 0 ? (
          <p className="no-classes">No hi ha classes creades.</p>
        ) : (
          classes.map((classItem) => (
            <div key={classItem.id} className="class-item">
              <div className="class-item-header">
                <h4>{classItem.title}</h4>
                <span className="points-badge">💎 {classItem.vitiPoints || 100} pts</span>
              </div>
              <p className="class-desc">{classItem.description}</p>
              <div className="class-details">
                <span>📅 {new Date(classItem.schedule).toLocaleString('ca-ES')}</span>
                <span>⏱️ {classItem.duration} min</span>
                {/* Mostrem els participants reals per assegurar-nos que es llegeixen bé */}
                <span>👥 {classItem.participants ? classItem.participants.length : 0} / {classItem.capacity}</span>
              </div>
              
              <div className="class-actions">
                <button className="btn-edit" onClick={() => handleEdit(classItem)}>Editar</button>
                <button className="btn-delete" onClick={() => handleDelete(classItem.id)}>Eliminar</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ManageClasses;