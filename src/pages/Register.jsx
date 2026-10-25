import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getApiErrorMessage } from "../api/errors.js";
import { registerUser } from "../api/auth.js";

function Register() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    const form = new FormData(event.currentTarget);

    try {
      await registerUser({
        username: form.get("username"),
        email: form.get("email"),
        first_name: form.get("first_name"),
        last_name: form.get("last_name"),
        password: form.get("password"),
        confirm_password: form.get("confirm_password"),
      });
      setSuccess("Account created. You can now sign in.");
      window.setTimeout(() => navigate("/login", { replace: true }), 900);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page auth-page--register">
      <section className="auth-panel">
        <Link className="brand" to="/login" aria-label="Pokedex home">
          <span className="brand__mark">P</span>
          <span>POKÉDEX</span>
        </Link>
        <span className="eyebrow">JOIN THE ADVENTURE</span>
        <h1>Create your account.</h1>
        <p className="auth-copy">Set up your trainer profile to begin your collection.</p>
        {error && <p className="message message--error">{error}</p>}
        {success && <p className="message message--success">{success}</p>}
        <form className="stack-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label className="field">
              First name
              <input name="first_name" autoComplete="given-name" />
            </label>
            <label className="field">
              Last name
              <input name="last_name" autoComplete="family-name" />
            </label>
            <label className="field field--wide">
              Username
              <input name="username" autoComplete="username" required />
            </label>
            <label className="field field--wide">
              Email
              <input name="email" type="email" autoComplete="email" />
            </label>
            <label className="field field--wide">
              Password
              <input name="password" type="password" autoComplete="new-password" required />
            </label>
            <label className="field field--wide">
              Confirm password
              <input name="confirm_password" type="password" autoComplete="new-password" required />
            </label>
          </div>
          <button className="button button--primary button--full" disabled={submitting}>
            {submitting ? "Creating account..." : "Create account"}
          </button>
        </form>
        <p className="auth-switch">
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </section>
      <aside className="auth-art auth-art--register">
        <span className="eyebrow">A WORLD TO DISCOVER</span>
        <h2>Meet the wonder. Keep the memories.</h2>
        <p>Your Pokédex is ready when you are.</p>
      </aside>
    </main>
  );
}

export default Register;
