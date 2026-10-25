import { useEffect, useState } from "react";
import { deletePokemon, getPokemon } from "../api/pokemon.js";
import { getApiErrorMessage } from "../api/errors.js";
import Card from "./Card.jsx";

function GalleryPokemon({ refreshKey, onEdit }) {
  const [pokemons, setPokemons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getPokemon();
        if (!cancelled) {
          setPokemons(data);
          setError("");
          setLoading(false);
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(getApiErrorMessage(requestError));
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [refreshKey, retryKey]);

  function retryLoad() {
    setError("");
    setLoading(true);
    setRetryKey((current) => current + 1);
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this Pokemon? This cannot be undone.")) {
      return;
    }

    setDeletingId(id);
    setError("");
    try {
      await deletePokemon(id);
      setPokemons((current) => current.filter((pokemon) => pokemon.id !== id));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return <p className="state-message">Loading your Pokédex...</p>;
  }

  return (
    <section aria-label="Pokemon gallery">
      {error && (
        <div className="message message--error state-error">
          <span>{error}</span>
          <button className="button button--secondary" onClick={retryLoad}>
            Try again
          </button>
        </div>
      )}
      {!error && pokemons.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state__icon" aria-hidden="true">✦</span>
          <h2>Your collection is waiting</h2>
          <p>Add your first Pokemon to start building your gallery.</p>
        </div>
      ) : (
        <div className="pokemon-grid">
          {pokemons.map((pokemon) => (
            <Card
              key={pokemon.id}
              pokemon={pokemon}
              onEdit={onEdit}
              onDelete={handleDelete}
              deleting={deletingId === pokemon.id}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default GalleryPokemon;
