import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import { useNavigate, Link } from "react-router-dom";
import "./Register.css"; // Aquest fitxer serà el nou

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("client");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      setError("La contrasenya ha de tenir almenys 6 caràcters.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // La teva lògica original per crear l'usuari a Firestore
      await setDoc(doc(db, "users", user.uid), {
        name: name,
        email: email,
        role: role,
        points: 0,
        classesAttended: 0,
        classesThisWeek: 0,
        createdAt: new Date().toISOString()
      });

      console.log("Usuari registrat i dades guardades!");
      navigate("/home");
    } catch (error) {
      console.error("Error de registre:", error.message);
      setError("Error de registre: " + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* Títol/Logo */}
        <h1 className="auth-title">FitFlow</h1>

        {/* Targeta del formulari */}
        <div className="auth-card">
          <h2>Crear un compte</h2>
          <p className="auth-subtitle">Comença el teu viatge fitness amb nosaltres.</p>
          
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label>Nom</label>
              <input
                type="text"
                className="form-input"
                placeholder="El teu nom"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Correu electrònic</label>
              <input
                type="email"
                className="form-input"
                placeholder="el_teu@correu.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Contrasenya</label>
              <input
                type="password"
                className="form-input"
                placeholder="Mínim 6 caràcters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Tipus de compte</label>
              <select 
                value={role} 
                onChange={(e) => setRole(e.target.value)}
                className="form-select"
              >
                <option value="client">Client</option>
                <option value="entrenador">Entrenador</option>
              </select>
            </div>

            {error && <div className="error-alert">{error}</div>}

            <button type="submit" className="btn-submit-register" disabled={loading}>
              {loading ? "Registrant..." : "Crear Compte"}
            </button>
          </form>
        </div>

        {/* Enllaç a Login */}
        <div className="toggle-auth">
          <p>
            Ja tens un compte?{" "}
            <Link to="/login" className="link">
              Inicia sessió
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}

export default Register;