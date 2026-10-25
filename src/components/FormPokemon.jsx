import { useState } from "react";
import { getApiErrorMessage } from "../api/errors.js";
import { createPokemon, updatePokemon } from "../api/pokemon.js";

const types = [
  "water",
  "fire",
  "wind",
  "light",
  "darkness",
  "lightning",
  "rock",
  "nature",
];

function FormPokemon({ pokemon, onSaved, onCancel }) {
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSaving(true);

    const form = new FormData(event.currentTarget);
    for (const imageField of ["avatar", "background"]) {
      if (!form.get(imageField)?.size) {
        form.delete(imageField);
      }
    }

    try {
      if (pokemon) {
        await updatePokemon(pokemon.id, form);
      } else {
        await createPokemon(form);
      }
      onSaved();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="pokemon-form" onSubmit={handleSubmit}>
      <div className="form-heading">
        <div>
          <span className="eyebrow">{pokemon ? "UPDATE ENTRY" : "NEW ENTRY"}</span>
          <h2>{pokemon ? "Edit Pokemon" : "Add a Pokemon"}</h2>
        </div>
        <button
          className="icon-button"
          type="button"
          aria-label="Close form"
          onClick={onCancel}
        >
          ×
        </button>
      </div>

      {error && <p className="message message--error">{error}</p>}

      <div className="form-grid">
        <label className="field field--wide">
          Name
          <input name="name" maxLength="50" defaultValue={pokemon?.name || ""} required />
        </label>
        <label className="field">
          Type
          <select name="type" defaultValue={pokemon?.type || "nature"} required>
            {types.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </label>
        <label className="field">
          Level
          <input name="level" type="number" min="1" defaultValue={pokemon?.level ?? 1} required />
        </label>
        <label className="field field--wide">
          Description
          <textarea name="description" rows="3" defaultValue={pokemon?.description || ""} />
        </label>
        <label className="field">
          Health (minimum 100)
          <input name="health" type="number" min="100" defaultValue={pokemon?.health ?? 100} required />
        </label>
        <label className="field">
          Attack (minimum 10)
          <input name="attack" type="number" min="10" defaultValue={pokemon?.attack ?? 10} required />
        </label>
        <label className="field">
          Defense (minimum 5)
          <input name="defense" type="number" min="5" defaultValue={pokemon?.defense ?? 5} required />
        </label>
        <label className="field">
          Speed (minimum 15)
          <input name="speed" type="number" min="15" defaultValue={pokemon?.speed ?? 15} required />
        </label>
        <label className="field">
          Avatar image
          <input name="avatar" type="file" accept="image/*" />
        </label>
        <label className="field">
          Background image
          <input name="background" type="file" accept="image/*" />
        </label>
      </div>

      <div className="form-actions">
        <button className="button button--secondary" type="button" onClick={onCancel}>
          Cancel
        </button>
        <button className="button button--primary" type="submit" disabled={saving}>
          {saving ? "Saving..." : pokemon ? "Save changes" : "Create Pokemon"}
        </button>
      </div>
    </form>
  );
}

export default FormPokemon;
