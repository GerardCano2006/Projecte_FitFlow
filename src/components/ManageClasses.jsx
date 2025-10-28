import React, { useState, useEffect } from "react";
import { auth, db } from "../firebaseConfig";
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "./ManageClasses.css";

function ManageClasses() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [isTrainer, setIsTrainer] = useState(false);
  const [trainerName, setTrainerName] = useState("");
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    schedule: "",
    duration: 60,
    capacity: 20,
    location: "Studio A",
    imageUrl: "",
    tags: ""
  });

  useEffect(() => {
    checkUserRole();
    loadClasses();
  }, []);

  const checkUserRole = async () => {
    const user = auth.currentUser;
    if (!user) {
      navigate("/login");
      return;
    }

    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists() && userDoc.data().role === "entrenador") {
      setIsTrainer(true);
      setTrainerName(userDoc.data().name);
    } else {
      navigate("/home");
    }
  };

  const loadClasses = async () => {
    try {
      const user = auth.currentUser;
      const q = query(collection(db, "classes"), where("trainerId", "==", user.uid));
      const querySnapshot = await getDocs(q);
      
      const classesData = [];
      querySnapshot.forEach((doc) => {
        classesData.push({ id: doc.id, ...doc.data() });
      });
      
      setClasses(classesData);
    } catch (error) {
      console.error("Error carregant classes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = auth.currentUser;
      const tagsArray = formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [];
      
      const classData = {
        ...formData,
        tags: tagsArray,
        trainerId: user.uid,
        trainerName: trainerName,
        rating: 4.5
      };

      if (editingClass) {
        await updateDoc(doc(db, "classes", editingClass.id), {
          ...classData,
          updatedAt: new Date().toISOString()
        });
        alert("Classe actualitzada!");
      } else {
        await addDoc(collection(db, "classes"), {
          ...classData,
          createdAt: new Date().toISOString()
        });
        alert("Classe creada!");
      }
      
      resetForm();
      loadClasses();
    } catch (error) {
      console.error("Error guardant classe:", error);
      alert("Error: " + error.message);
    }
  };

  const handleEdit = (classItem) => {
    setEditingClass(classItem);
    setFormData({
      title: classItem.title,
      description: classItem.description,
      schedule: classItem.schedule,
      duration: classItem.duration,
      capacity: classItem.capacity,
      location: classItem.location || "Studio A",
      imageUrl: classItem.imageUrl || "",
      tags: Array.isArray(classItem.tags) ? classItem.tags.join(', ') : ""
    });
    setShowForm(true);
  };

  const handleDelete = async (classId) => {
    if (window.confirm("Segur que vols eliminar aquesta classe?")) {
      try {
        await deleteDoc(doc(db, "classes", classId));
        alert("Classe eliminada!");
        loadClasses();
      } catch (error) {
        console.error("Error eliminant classe:", error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      schedule: "",
      duration: 60,
      capacity: 20,
      location: "Studio A",
      imageUrl: "",
      tags: ""
    });
    setEditingClass(null);
    setShowForm(false);
  };

  if (loading) {
    return <div className="loading">Carregant...</div>;
  }

  if (!isTrainer) {
    return null;
  }

  return (
    <div className="manage-container">
      <div className="manage-header">
        <h2>Gestionar Classes</h2>
        <button className="btn-back" onClick={() => navigate("/home")}>
          Tornar
        </button>
      </div>

      <button className="btn-new-class" onClick={() => setShowForm(!showForm)}>
        {showForm ? "Cancel·lar" : "Nova Classe"}
      </button>

      {showForm && (
        <form className="class-form" onSubmit={handleSubmit}>
          <h3>{editingClass ? "Editar Classe" : "Crear Nova Classe"}</h3>
          
          <div className="form-group">
            <label htmlFor="title">Títol de la classe *</label>
            <input
              id="title"
              type="text"
              placeholder="Ex: Yoga Matinal, Spinning Intens..."
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Descripció *</label>
            <textarea
              id="description"
              placeholder="Explica de què tracta la classe, nivell, objectius..."
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              required
              rows="3"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="imageUrl">URL de la imatge (opcional)</label>
            <input
              id="imageUrl"
              type="text"
              placeholder="https://example.com/imatge.jpg"
              value={formData.imageUrl}
              onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
            />
            <small className="hint">
              Pots usar imatges d'Unsplash: https://source.unsplash.com/800x400/?yoga,fitness,gym
            </small>
          </div>
          
          <div className="form-group">
            <label htmlFor="schedule">Data i hora *</label>
            <input
              id="schedule"
              type="datetime-local"
              value={formData.schedule}
              onChange={(e) => setFormData({...formData, schedule: e.target.value})}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="duration">Duració (minuts) *</label>
            <input
              id="duration"
              type="number"
              placeholder="60"
              value={formData.duration}
              onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})}
              required
              min="15"
            />
            <small className="hint">La duració mínima és de 15 minuts</small>
          </div>
          
          <div className="form-group">
            <label htmlFor="capacity">Aforament màxim *</label>
            <input
              id="capacity"
              type="number"
              placeholder="20"
              value={formData.capacity}
              onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value)})}
              required
              min="1"
            />
            <small className="hint">Nombre màxim de persones que poden assistir</small>
          </div>
          
          <div className="form-group">
            <label htmlFor="location">Ubicació *</label>
            <select
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
            >
              <option value="Sala A">Sala A</option>
              <option value="Sala B">Sala B</option>
              <option value="Sala C">Sala C</option>
              <option value="Piscina">Piscina</option>
              <option value="Sala de Spinning">Sala de Spinning</option>
              <option value="Sala 5">Sala 5</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="tags">Material necessari (opcional)</label>
            <input
              id="tags"
              type="text"
              placeholder="Estora de Yoga, Peses, Gomes elàstiques..."
              value={formData.tags}
              onChange={(e) => setFormData({...formData, tags: e.target.value})}
            />
            <small className="hint">Separa els elements amb comes</small>
          </div>
          
          <button type="submit" className="btn-submit">
            {editingClass ? "Actualitzar Classe" : "Crear Classe"}
          </button>
        </form>
      )}

      <div className="classes-list">
        <h3>Les meves classes</h3>
        {classes.length === 0 ? (
          <p>No tens classes creades encara.</p>
        ) : (
          classes.map((classItem) => (
            <div key={classItem.id} className="class-item">
              <h4>{classItem.title}</h4>
              <p>{classItem.description}</p>
              <p><strong>Data:</strong> {new Date(classItem.schedule).toLocaleString('ca-ES')}</p>
              <p><strong>Duració:</strong> {classItem.duration} min | <strong>Aforament:</strong> {classItem.capacity} places | <strong>Ubicació:</strong> {classItem.location}</p>
              
              <div className="class-actions">
                <button className="btn-edit" onClick={() => handleEdit(classItem)}>
                  Editar
                </button>
                <button className="btn-delete" onClick={() => handleDelete(classItem.id)}>
                  Eliminar
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ManageClasses;