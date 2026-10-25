import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { getApiErrorMessage } from "../api/errors.js";
import { loginUser } from "../api/auth.js";
import { useAuth } from "../context/useAuth.js";

function Login() {
  const { token, saveLogin } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (token) {
    return <Navigate to="/gallery" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    const formData = new FormData(event.currentTarget);

    try {
      const tokens = await loginUser({
        username: formData.get("username"),
        password: formData.get("password"),
      });
      saveLogin(tokens.access, tokens.refresh);
      navigate("/gallery", { replace: true });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <Link className="brand" to="/login" aria-label="Pokedex home">
          <span className="brand__mark">P</span>
          <span>POKÉDEX</span>
        </Link>
        <span className="eyebrow">TRAINER ACCESS</span>
        <h1>Welcome back.</h1>
        <p className="auth-copy">Sign in to explore and manage your collection.</p>
        {error && <p className="message message--error">{error}</p>}
        <form className="stack-form" onSubmit={handleSubmit}>
          <label className="field">
            Username
            <input name="username" autoComplete="username" required />
          </label>
          <label className="field">
            Password
            <input name="password" type="password" autoComplete="current-password" required />
          </label>
          <button className="button button--primary button--full" disabled={submitting}>
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <p className="auth-switch">
          New trainer? <Link to="/register">Create an account</Link>
        </p>
      </section>
      <aside className="auth-art">
        <span className="eyebrow">YOUR NEXT ADVENTURE</span>
        <h2>Every great journey starts with a first catch.</h2>
        <p>Build a collection that is uniquely yours.</p>
      </aside>
    </main>
  );
}

export default Login;
