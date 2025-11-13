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
// Important: Ara utilitzarem Login.css, que tindrà els estils foscos
import "./Login.css"; 

function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState("client");
  
  // Estats del formulari (es mantenen tots)
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

  // La lògica de handleLogin i handleAuth es manté intacta
  const handleAuth = async () => {
    setLoading(true);
    setError("");

    if (password.length < 6) {
      setError("La contrasenya ha de tenir almenys 6 caràcters.");
      setLoading(false);
      return;
    }

    if (!isLogin) {
      // --- Procés de Registre (el detallat d'aquest component) ---
      if (password !== confirmPassword) {
        setError("Les contrasenyes no coincideixen.");
        setLoading(false);
        return;
      }
      if (!acceptTerms) {
        setError("Has d'acceptar els termes i condicions.");
        setLoading(false);
        return;
      }
      
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Actualitza el perfil de Firebase Auth
        await updateProfile(user, { displayName: `${name} ${surname}` });
        
        // Crea el document a Firestore
        await setDoc(doc(db, "users", user.uid), {
          name: name,
          surname: surname,
          email: email,
          phone: phone,
          age: age,
          role: role,
          fitnessLevel: fitnessLevel,
          goals: goals,
          points: 0,
          classesAttended: 0,
          createdAt: new Date().toISOString()
        });
        
        navigate("/home");

      } catch (error) {
        setError(error.message);
      }

    } else {
      // --- Procés de Login ---
      try {
        await signInWithEmailAndPassword(auth, email, password);
        navigate("/home");
      } catch (error) {
        setError("Email o contrasenya incorrectes.");
      }
    }
    setLoading(false);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    handleAuth();
  };

  // Funció per netejar el formulari en canviar de mode
  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError("");
    setName("");
    setSurname("");
    setEmail("");
    setPhone("");
    setAge("");
    setFitnessLevel("");
    setGoals("");
    setPassword("");
    setConfirmPassword("");
    setAcceptTerms(false);
  };


  return (
    // Nova estructura de classes CSS per al tema fosc
    <div className="auth-page">
      <div className="auth-container">
        <h1 className="auth-title">FitFlow</h1>

        <div className="auth-card">
          <h2>{isLogin ? "Inicia Sessió" : "Crear Compte"}</h2>
          
          <p className="auth-subtitle">
            {isLogin ? "Benvingut a FitFlow!" : "Uneix-te a la comunitat FitFlow."}
          </p>

          {/* Selector de Rol (estils actualitzats) */}
          {!isLogin && (
            <div className="role-selector">
              <button
                className={`role-btn ${role === 'client' ? 'active' : ''}`}
                onClick={() => setRole('client')}
              >
                👤 Sóc Client
              </button>
              <button
                className={`role-btn ${role === 'entrenador' ? 'active' : ''}`}
                onClick={() => setRole('entrenador')}
              >
                👟 Sóc Entrenador
              </button>
            </div>
          )}
          
          <form onSubmit={handleLogin}>
            
            {/* --- FORMULARI DE LOGIN --- */}
            {isLogin && (
              <>
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
                  <div className="password-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="form-input"
                      placeholder="La teva contrasenya"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="toggle-password"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? "Ocultar" : "Mostrar"}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* --- FORMULARI DE REGISTRE (DETALLAT) --- */}
            {!isLogin && (
              <>
                <div className="form-grid">
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
                    <label>Cognoms</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Els teus cognoms"
                      value={surname}
                      onChange={(e) => setSurname(e.target.value)}
                      required
                    />
                  </div>
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

                <div className="form-grid">
                  <div className="form-group">
                    <label>Telèfon</label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="Opcional"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Edat</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="Opcional"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                    />
                  </div>
                </div>

                {role === 'client' && (
                  <>
                    <div className="form-group">
                      <label>Nivell de Fitness</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Ex: Principiant, Intermedi..."
                        value={fitnessLevel}
                        onChange={(e) => setFitnessLevel(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Objectius</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Ex: Perdre pes, Guanyar força..."
                        value={goals}
                        onChange={(e) => setGoals(e.target.value)}
                      />
                    </div>
                  </>
                )}
                
                <div className="form-group">
                  <label>Contrasenya</label>
                  <div className="password-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="form-input"
                      placeholder="Mínim 6 caràcters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="toggle-password"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? "Ocultar" : "Mostrar"}
                    </button>
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Confirmar Contrasenya</label>
                  <div className="password-wrapper">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      className="form-input"
                      placeholder="Repeteix la contrasenya"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="toggle-password"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? "Ocultar" : "Mostrar"}
                    </button>
                  </div>
                </div>

                <div className="terms-section">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      className="checkbox-input"
                    />
                    <span>
                      Accepto els <a href="#" className="link">termes i condicions</a>
                    </span>
                  </label>
                </div>
              </>
            )}

            {error && <div className="error-alert">{error}</div>}

            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? "Carregant..." : (
                isLogin ? "Iniciar Sessió" : `Crear Compte`
              )}
            </button>
          </form>
        </div>

        {/* Canviador (Login / Register) */}
        <div className="toggle-auth">
          <p onClick={toggleMode} className="link">
            {isLogin
              ? "No tens un compte? Registra't"
              : "Ja tens un compte? Inicia sessió"}
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;