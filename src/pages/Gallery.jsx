import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import FormPokemon from "../components/FormPokemon.jsx";
import GalleryPokemon from "../components/GalleryPokemon.jsx";
import { useAuth } from "../context/useAuth.js";

function Gallery() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [editingPokemon, setEditingPokemon] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  function handleSaved() {
    setShowForm(false);
    setEditingPokemon(null);
    setRefreshKey((current) => current + 1);
  }

  function handleEdit(pokemon) {
    setEditingPokemon(pokemon);
    setShowForm(true);
  }

  function handleCancel() {
    setShowForm(false);
    setEditingPokemon(null);
  }

  return (
    <main className="gallery-page">
      <header className="topbar">
        <Link className="brand" to="/gallery">
          <span className="brand__mark">P</span>
          <span>POKÉDEX</span>
        </Link>
        <div className="topbar__right">
          <span className="trainer-label"><span className="status-dot" /> TRAINER ONLINE</span>
          <button className="button button--secondary button--small" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </header>

      <section className="gallery-hero">
        <div>
          <span className="eyebrow">YOUR PERSONAL COLLECTION</span>
          <h1>Discover your <span>Pokemon.</span></h1>
          <p>Every entry tells a story. Keep yours growing.</p>
        </div>
        {!showForm && (
          <button
            className="button button--primary"
            onClick={() => {
              setEditingPokemon(null);
              setShowForm(true);
            }}
          >
            <span aria-hidden="true">＋</span> Add Pokemon
          </button>
        )}
      </section>

      {showForm && (
        <div className="form-overlay" role="dialog" aria-modal="true" aria-label="Pokemon form">
          <FormPokemon
            key={editingPokemon?.id || "new-pokemon"}
            pokemon={editingPokemon}
            onSaved={handleSaved}
            onCancel={handleCancel}
          />
        </div>
      )}

      <div className="collection-heading">
        <h2>Collection</h2>
        <span>LIVE FROM YOUR POKÉDEX API</span>
      </div>
      <GalleryPokemon refreshKey={refreshKey} onEdit={handleEdit} />
    </main>
  );
}

export default Gallery;
