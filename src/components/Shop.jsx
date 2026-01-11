import React, { useState, useEffect } from "react";
import { auth, db } from "../firebaseConfig";
import { doc, getDoc, updateDoc, arrayUnion, increment } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import "./Shop.css";

// 👇 LLISTA DE PRODUCTES
const PRODUCTS = [
  {
    id: 1,
    name: "Adidas Performance 750 ml",
    price: 500,
    image: "https://www.misterrunning.com/images/2023-media-10/fm9932_A.jpg",
    desc: "Mantén-te hidratat amb estil."
  },
  {
    id: 2,
    name: "Tovallola Deportiva Negra-BOOMFIT",
    price: 800,
    image: "https://static-content-3.boomfit.com/23975-large_default/toalla-deportiva-negra-boomfit.jpg",
    desc: "Microfibra d'assecat ràpid."
  },
  {
    id: 3,
    name: "Nike DRI-FIT SLIM",
    price: 1500,
    image: "https://owp.klarna.com/product/640x640/3104283594/Nike-Men-s-Pro-Dri-FIT-Slim-Short-Sleeve-Top-Black-White.jpg?ph=true",
    desc: "Teixit tècnic transpirable."
  },
  {
    id: 4,
    name: "Pack gomas entrenament Evergy",
    price: 3000,
    image: "https://shop.entrenavirtual.es/wp-content/uploads/2022/10/22A0713-scaled-1.jpg",
    desc: "Evita lesións escalfant amb la millor qualitat."
  },
  {
    id: 5,
    name: "Bossa Esportiva 300d Valley duffle",
    price: 2500,
    image: "https://www.regalospublicitarios.com/162601-thickbox_default/large-sports-bag-in-300d-rpet.jpg",
    desc: "Porta tot el teu equipament."
  },
  {
    id: 6,
    name: "Pack Nutrició",
    price: 1200,
    image: "https://i.blogs.es/64a414/power-bar/400_300.jpg",
    desc: "Pack de barretes energétiques de qualitat dels nostres patrocinadors durant un més."
  }
];

function Shop() {
  const [userPoints, setUserPoints] = useState(0);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);
  
  // 1. Inicialitzem navigate
  const navigate = useNavigate();
  const user = auth.currentUser;

  // 2. Carregar dades usuari
  useEffect(() => {
    const fetchUserData = async () => {
      // Si no hi ha usuari al moment, esperem o redirigim.
      // Amb la correcció del Home.jsx, això ja no hauria de fallar tant.
      if (!user) {
        navigate("/login");
        return;
      }
      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserPoints(data.points || 0);
          setInventory(data.inventory || []); 
        }
      } catch (error) {
        console.error("Error carregant punts:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [user, navigate]);

  // 3. Funció de Compra
  const handleBuy = async (item) => {
    if (userPoints < item.price) {
      setFeedback({ type: "error", text: "❌ No tens prous VitiPunts!" });
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    try {
      const userRef = doc(db, "users", user.uid);

      await updateDoc(userRef, {
        points: increment(-item.price),
        inventory: arrayUnion(item)
      });

      setUserPoints(prev => prev - item.price);
      setInventory(prev => [...prev, item]);

      setFeedback({ type: "success", text: `🎉 Has comprat: ${item.name}!` });
      setTimeout(() => setFeedback(null), 3000);

    } catch (error) {
      console.error("Error comprant:", error);
      setFeedback({ type: "error", text: "Error en la transacció." });
    }
  };

  if (loading) return <div className="shop-loading">Carregant VitiShop...</div>;

  return (
    <div className="dashboard-layout">
      {/* SIDEBAR */}
      <Sidebar />

      {/* CONTINGUT PRINCIPAL */}
      <div className="shop-container">
        
        {/* CAPÇALERA AMB BOTÓ A LA DRETA */}
        <div className="shop-header">
          {/* 👇 CANVI CLAU: navigate('/home') en lloc de '/' */}
          <button className="back-btn" onClick={() => navigate('/home')}>
            Tornar
          </button>
        </div>

        <div className="shop-title">
          <h1>VITI SHOP</h1>
          <p>El teu esforç té recompenses</p>
        </div>

        {/* FEEDBACK (Alerta flotant) */}
        {feedback && (
          <div className={`feedback-toast ${feedback.type}`}>
            {feedback.text}
          </div>
        )}

        {/* GRID DE PRODUCTES */}
        <div className="products-grid">
          {PRODUCTS.map((item) => (
            <div key={item.id} className="product-card">
              <div className="product-image" style={{ backgroundImage: `url(${item.image})` }}></div>
              <div className="product-info">
                <h3>{item.name}</h3>
                <p className="product-desc">{item.desc}</p>
                <div className="product-footer">
                  <span className="price-tag">{item.price} 💎</span>
                  <button 
                    className="buy-btn" 
                    onClick={() => handleBuy(item)}
                    disabled={userPoints < item.price} 
                  >
                    {userPoints < item.price ? "Falten punts" : "Intercanviar"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* INVENTARI */}
        <div className="inventory-section">
          <h2>🎒 La teva Motxilla (Inventari)</h2>
          {inventory.length === 0 ? (
            <p className="empty-msg">Encara no has comprat res. A entrenar!</p>
          ) : (
            <div className="inventory-list">
              {inventory.map((invItem, index) => (
                <div key={index} className="inventory-item">
                  <img src={invItem.image} alt={invItem.name} />
                  <div className="inv-details">
                    <h4>{invItem.name}</h4>
                    <span>Adquirit ✅</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Shop;