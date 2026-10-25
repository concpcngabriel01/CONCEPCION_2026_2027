import { API_BASE_URL } from "../api/client.js";

function getImageUrl(path) {
  if (!path) {
    return "";
  }
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  return new URL(path, API_BASE_URL).toString();
}

function Card({ pokemon, onEdit, onDelete, deleting }) {
  return (
    <article className="pokemon-card">
      <div className="pokemon-card__image-wrap">
        {pokemon.background && (
          <img
            className="pokemon-card__background"
            src={getImageUrl(pokemon.background)}
            alt=""
          />
        )}
        {pokemon.avatar && (
          <img
            className="pokemon-card__avatar"
            src={getImageUrl(pokemon.avatar)}
            alt={`${pokemon.name} avatar`}
          />
        )}
        <span className="type-badge">{pokemon.type}</span>
      </div>
      <div className="pokemon-card__body">
        <div className="pokemon-card__title">
          <div>
            <span className="pokemon-number">
              #{String(pokemon.id).padStart(3, "0")}
            </span>
            <h2>{pokemon.name}</h2>
          </div>
          <span className="level-badge">Lv. {pokemon.level}</span>
        </div>
        {pokemon.description && (
          <p className="pokemon-description">{pokemon.description}</p>
        )}
        <dl className="pokemon-stats">
          <div><dt>HP</dt><dd>{pokemon.health}</dd></div>
          <div><dt>ATK</dt><dd>{pokemon.attack}</dd></div>
          <div><dt>DEF</dt><dd>{pokemon.defense}</dd></div>
          <div><dt>SPD</dt><dd>{pokemon.speed}</dd></div>
        </dl>
        <div className="card-actions">
          <button className="button button--secondary" onClick={() => onEdit(pokemon)}>
            Edit
          </button>
          <button
            className="button button--danger"
            onClick={() => onDelete(pokemon.id)}
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </article>
  );
}

export default Card;
