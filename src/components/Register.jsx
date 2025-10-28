import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import { useNavigate, Link } from "react-router-dom";
import "./Register.css";

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("client");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

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
      alert("Error: " + error.message);
    }
  };

  return (
    <div className="auth-container">
      <h2>Registrar-se</h2>
      <form onSubmit={handleRegister}>
        <input
          type="text"
          placeholder="Nom"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Correu electrònic"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Contrasenya (mín. 6 caràcters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <select 
          value={role} 
          onChange={(e) => setRole(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            marginBottom: "15px",
            borderRadius: "5px",
            border: "1px solid #ccc"
          }}
        >
          <option value="client">Client</option>
          <option value="entrenador">Entrenador</option>
        </select>
        <button type="submit">Registrar-se</button>
      </form>
      <p>
        Ja tens compte? <Link to="/login">Inicia sessió</Link>
      </p>
    </div>
  );
}

export default Register;