import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebaseConfig';
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";

const styles = {
  container: {
    padding: '40px',
    maxWidth: '600px', // Més estret que el perfil, queda millor per formularis
    margin: '30px auto',
    backgroundColor: '#1E1E2E',
    color: '#E0E0E0',
    borderRadius: '10px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)'
  },
  header: {
    borderBottom: '1px solid #4E4E6E',
    paddingBottom: '20px',
    marginBottom: '30px',
    textAlign: 'center'
  },
  title: {
    color: '#FFFFFF',
    margin: 0
  },
  formGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    color: '#A0A0B0',
    fontSize: '0.9em'
  },
  input: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#2A2A4A',
    border: '1px solid #4E4E6E',
    borderRadius: '5px',
    color: '#FFFFFF',
    fontSize: '1em',
    boxSizing: 'border-box' // Important perquè el padding no trenqui l'amplada
  },
  inputDisabled: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#1A1A2A', // Més fosc per indicar desactivat
    border: '1px solid #2E2E3E',
    borderRadius: '5px',
    color: '#606070',
    fontSize: '1em',
    boxSizing: 'border-box',
    cursor: 'not-allowed'
  },
  buttonGroup: {
    display: 'flex',
    gap: '15px',
    marginTop: '30px'
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#70E094', // Verd per guardar
    color: '#1E1E2E',
    border: 'none',
    padding: '12px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '1em',
    fontWeight: 'bold',
    textAlign: 'center'
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'transparent',
    color: '#E0E0E0',
    border: '1px solid #4E4E6E',
    padding: '12px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '1em',
    textAlign: 'center'
  },
  loadingText: { color: '#FFD700', textAlign: 'center' }
};

function EditProfile() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState(''); // L'email no el deixarem editar fàcilment
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const navigate = useNavigate();

  // 1. Carreguem les dades actuals
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setName(data.name || '');
          setEmail(user.email || ''); // L'email ve de Auth
        }
        setLoading(false);
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // 2. Funció per guardar els canvis
  const handleSave = async (e) => {
    e.preventDefault(); // Evita que es recarregui la pàgina
    setSaving(true);

    try {
      const user = auth.currentUser;
      if (user) {
        // Actualitzem només el nom a Firestore
        await updateDoc(doc(db, 'users', user.uid), {
          name: name
        });
        // Tornem al perfil
        navigate('/profile');
      }
    } catch (error) {
      console.error("Error guardant perfil:", error);
      alert("Error al guardar els canvis.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={styles.container}><p style={styles.loadingText}>Carregant dades...</p></div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Editar Perfil</h2>
      </div>

      <form onSubmit={handleSave}>
        
        {/* Camp Nom */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Nom</label>
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={styles.input}
            placeholder="El teu nom"
            required
          />
        </div>

        {/* Camp Email (Desactivat / Només lectura) */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Correu Electrònic (No editable)</label>
          <input 
            type="email" 
            value={email}
            disabled
            style={styles.inputDisabled}
          />
        </div>

        {/* Botons */}
        <div style={styles.buttonGroup}>
          <button 
            type="button" 
            onClick={() => navigate('/profile')} // Torna enrere sense guardar
            style={styles.cancelButton}
          >
            Cancel·lar
          </button>
          
          <button 
            type="submit" 
            style={styles.saveButton}
            disabled={saving}
          >
            {saving ? 'Guardant...' : 'Guardar Canvis'}
          </button>
        </div>

      </form>
    </div>
  );
}

export default EditProfile;