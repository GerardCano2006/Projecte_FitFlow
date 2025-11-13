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
    // La lògica de checkUserRole i loadClasses es manté idèntica
    const checkUserRole = async () => {
      const user = auth.currentUser;
      if (!user) {
        navigate("/login");
        return;
      }
  
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists() && userDoc.data().role === "entrenador") {
        setIsTrainer(true);
        setTrainerName(userDoc.data().name); // Guardem el nom
        loadClasses(user.uid); // Carreguem classes només DESPRÉS de confirmar
      } else {
        setIsTrainer(false);
        navigate("/home"); // Redirigim si no és entrenador
      }
      setLoading(false);
    };

    checkUserRole();
  }, [navigate]);

  const loadClasses = async (trainerId) => {
    // Aquesta consulta ja filtrava correctament per trainerId, perfecte
    const q = query(collection(db, "classes"), where("trainerId", "==", trainerId));
    const querySnapshot = await getDocs(q);
    const classesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // Ordenem per data
    classesData.sort((a, b) => new Date(a.schedule) - new Date(b.schedule));
    setClasses(classesData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.schedule) {
      alert("El títol i la data són obligatoris.");
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) return;

      const classData = { 
        ...formData, 
        trainerId: user.uid, 
        trainerName: trainerName // Afegim el nom de l'entrenador
      };

      if (editingClass) {
        // Actualitzar
        const classDoc = doc(db, "classes", editingClass.id);
        await updateDoc(classDoc, classData);
        setEditingClass(null);
      } else {
        // Crear
        await addDoc(collection(db, "classes"), classData);
      }
      
      resetForm();
      loadClasses(user.uid); // Recarregar classes
      setShowForm(false);
    } catch (error) {
      console.error("Error guardant la classe:", error);
    }
  };

  const handleEdit = (classItem) => {
    setFormData({
      ...classItem,
      schedule: new Date(classItem.schedule).toISOString().substring(0, 16)
    });
    setEditingClass(classItem);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Estàs segur que vols eliminar aquesta classe?")) {
      try {
        await deleteDoc(doc(db, "classes", id));
        loadClasses(auth.currentUser.uid); // Recarregar
      } catch (error) {
        console.error("Error eliminant la classe:", error);
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
  };

  if (loading) {
    return <div className="loading-screen">Verificant accés...</div>;
  }
  if (!isTrainer) {
    return null; // O un missatge d'accés denegat
  }

  return (
    <div className="manage-container">
      <div className="manage-header">
        <h2>Gestió de Classes</h2>
        <button className="btn-back" onClick={() => navigate("/home")}>
          ⬅ Tornar
        </button>
      </div>

      <button 
        className="btn-new-class" 
        onClick={() => {
          setShowForm(!showForm);
          resetForm();
        }}
      >
        {showForm ? "Tancar Formulari" : "✨ Crear Nova Classe"}
      </button>

      {showForm && (
        <form className="class-form" onSubmit={handleSubmit}>
          <h3>{editingClass ? "Editant Classe" : "Nova Classe"}</h3>
          
          <div className="form-group">
            <label>Títol de la Classe</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Ex: Ioga Vinyasa"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Descripció</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              placeholder="Descriu la classe..."
            />
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Data i Hora</label>
              <input
                type="datetime-local"
                name="schedule"
                value={formData.schedule}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Duració (minuts)</label>
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
              />
            </div>
            
            <div className="form-group">
              <label>Aforament</label>
              <input
                type="number"
                name="capacity"
                value={formData.capacity}
                onChange={handleChange}
              />
            </div>
            
            <div className="form-group">
              <label>Ubicació</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
              />
            </div>
          </div>
          
          <div className="form-group">
            <label>URL de la Imatge (Opcional)</label>
            <input
              type="text"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleChange}
              placeholder="https://exemple.com/imatge.png"
            />
          </div>
          
          <div className="form-group">
            <label>Tags (Opcional)</label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="Ioga, Relax, Principiant"
            />
            <small className="hint">Separa els elements amb comes</small>
          </div>
          
          <button type="submit" className="btn-submit">
            {editingClass ? "Actualitzar Classe" : "Crear Classe"}
          </button>
        </form>
      )}

      <div className="classes-list">
        <h3>Les teves classes creades 📋</h3>
        {classes.length === 0 ? (
          <p className="no-classes">No tens classes creades encara.</p>
        ) : (
          classes.map((classItem) => (
            <div key={classItem.id} className="class-item">
              <h4>{classItem.title}</h4>
              <p className="class-desc">{classItem.description}</p>
              <div className="class-details">
                <span><strong>Data:</strong> {new Date(classItem.schedule).toLocaleString('ca-ES')}</span>
                <span><strong>Duració:</strong> {classItem.duration} min</span>
                <span><strong>Aforament:</strong> {classItem.capacity} places</span>
                <span><strong>Ubicació:</strong> {classItem.location}</span>
              </div>
              
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