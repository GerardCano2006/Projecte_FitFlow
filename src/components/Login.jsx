import React, { useState } from "react";
import { auth } from "../firebaseConfig";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile 
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";
import "./Login.css";

function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState("client");
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [fitnessLevel, setFitnessLevel] = useState("");
  const [goals, setGoals] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/home");
    } catch (err) {
      setError("Email o contrasenya incorrectes");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    if (password !== confirmPassword) {
      setError("Les contrasenyes no coincideixen");
      setLoading(false);
      return;
    }

    if (!acceptTerms) {
      setError("Has d'acceptar els termes i condicions");
      setLoading(false);
      return;
    }
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const fullName = `${name} ${surname}`;
      
      await updateProfile(user, { displayName: fullName });
      
      await setDoc(doc(db, "users", user.uid), {
        name: fullName,
        email: email,
        role: role,
        phone: phone,
        age: age,
        fitnessLevel: fitnessLevel,
        goals: goals,
        points: 0,
        createdAt: new Date().toISOString()
      });
      
      navigate("/home");
    } catch (err) {
      setError("Error al crear compte: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="role-selector">
          <button 
            type="button"
            className={`role-btn ${role === 'client' ? 'active' : ''}`}
            onClick={() => setRole('client')}
          >
            Alumne
          </button>
          <button 
            type="button"
            className={`role-btn ${role === 'entrenador' ? 'active' : ''}`}
            onClick={() => setRole('entrenador')}
          >
            Entrenador
          </button>
        </div>

        <div className="auth-card">
          <div className="auth-tabs">
            <button 
              type="button"
              className={`tab-btn ${isLogin ? 'active' : ''}`}
              onClick={() => setIsLogin(true)}
            >
              Iniciar Sessió
            </button>
            <button 
              type="button"
              className={`tab-btn ${!isLogin ? 'active' : ''}`}
              onClick={() => setIsLogin(false)}
            >
              Registrar-se
            </button>
          </div>

          <form onSubmit={isLogin ? handleLogin : handleRegister} className="auth-form">
            {!isLogin && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label>Nom</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Joan"
                      required
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Cognoms</label>
                    <input
                      type="text"
                      value={surname}
                      onChange={(e) => setSurname(e.target.value)}
                      placeholder="Garcia López"
                      required
                      className="form-input"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="form-group">
              <label>Correu electrònic</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="joan.garcia@example.com"
                required
                className="form-input"
              />
            </div>

            {!isLogin && (
              <div className="form-row">
                <div className="form-group">
                  <label>Telèfon</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="612 345 678"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Edat</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="25"
                    min="16"
                    max="99"
                    className="form-input"
                  />
                </div>
              </div>
            )}

            {!isLogin && role === "client" && (
              <div className="preferences-section">
                <h3 className="section-title">Preferències d'Entrenament</h3>
                
                <div className="form-group">
                  <label>Nivell de fitness</label>
                  <select
                    value={fitnessLevel}
                    onChange={(e) => setFitnessLevel(e.target.value)}
                    className="form-select"
                  >
                    <option value="">Selecciona el teu nivell</option>
                    <option value="principiant">Principiant</option>
                    <option value="intermedi">Intermedi</option>
                    <option value="avançat">Avançat</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Objectius principals</label>
                  <select
                    value={goals}
                    onChange={(e) => setGoals(e.target.value)}
                    className="form-select"
                  >
                    <option value="">Què vols aconseguir?</option>
                    <option value="perdre-pes">Perdre pes</option>
                    <option value="guanyar-muscul">Guanyar múscul</option>
                    <option value="resistencia">Millorar resistència</option>
                    <option value="flexibilitat">Flexibilitat</option>
                  </select>
                </div>
              </div>
            )}

            <div className="form-group">
              <label>Contrasenya</label>
              <div className="password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínim 6 caràcters"
                  required
                  minLength="6"
                  className="form-input"
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Mostrar" : "Ocultar"}
                </button>
              </div>
              {!isLogin && (
                <small className="form-hint">Ha de contenir almenys 6 caràcters amb lletres i números</small>
              )}
            </div>

            {!isLogin && (
              <div className="form-group">
                <label>Confirmar contrasenya</label>
                <div className="password-wrapper">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeteix la contrasenya"
                    required
                    className="form-input"
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? "Mostrar" : "Ocultar"}
                  </button>
                </div>
              </div>
            )}

            {!isLogin && (
              <div className="terms-section">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="checkbox-input"
                  />
                  <span>
                    Accepto els <a href="#" className="link">termes i condicions</a> i la <a href="#" className="link">política de privacitat</a>
                  </span>
                </label>
              </div>
            )}

            {error && <div className="error-alert">{error}</div>}

            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? "Carregant..." : (
                isLogin ? "Iniciar Sessió" : `Crear Compte com a ${role === 'client' ? 'Alumne' : 'Entrenador'}`
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
