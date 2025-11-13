import React, { useState, useEffect } from "react";
import "./EditProfileModal.css"; // Crearem aquest CSS

function EditProfileModal({ userData, onClose, onSave }) {
  // Inicialitzem el formulari amb les dades existents
  const [formData, setFormData] = useState({
    name: userData.name || "",
    surname: userData.surname || "",
    phone: userData.phone || "",
    age: userData.age || "",
    fitnessLevel: userData.fitnessLevel || "",
    goals: userData.goals || "",
  });
  
  // Guardem una còpia de les dades originals (que no són editables)
  const originalData = { ...userData };
  delete originalData.name;
  delete originalData.surname;
  delete originalData.phone;
  delete originalData.age;
  delete originalData.fitnessLevel;
  delete originalData.goals;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Combinem les dades originals (email, rol, etc.) amb les dades actualitzades
    const fullUpdatedData = { ...originalData, ...formData };
    onSave(fullUpdatedData);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Editar Perfil</h2>
          <button className="modal-close-btn" onClick={onClose}>✖</button>
        </div>
        
        <form className="modal-form" onSubmit={handleSubmit}>
          
          <div className="form-grid">
            <div className="form-group">
              <label>Nom</label>
              <input
                type="text"
                name="name"
                className="form-input"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Cognoms</label>
              <input
                type="text"
                name="surname"
                className="form-input"
                value={formData.surname}
                onChange={handleChange}
              />
            </div>
          </div>
          
          <div className="form-grid">
            <div className="form-group">
              <label>Telèfon</label>
              <input
                type="tel"
                name="phone"
                className="form-input"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Edat</label>
              <input
                type="number"
                name="age"
                className="form-input"
                value={formData.age}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Només mostrem camps de client si és client */}
          {userData.role === 'client' && (
            <>
              <div className="form-group">
                <label>Nivell de Fitness</label>
                <input
                  type="text"
                  name="fitnessLevel"
                  className="form-input"
                  placeholder="Ex: Principiant, Intermedi..."
                  value={formData.fitnessLevel}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Objectius</label>
                <input
                  type="text"
                  name="goals"
                  className="form-input"
                  placeholder="Ex: Perdre pes, Guanyar força..."
                  value={formData.goals}
                  onChange={handleChange}
                />
              </div>
            </>
          )}

          <button type="submit" className="btn-submit">
            Desar Canvis
          </button>
        </form>
      </div>
    </div>
  );
}

export default EditProfileModal;