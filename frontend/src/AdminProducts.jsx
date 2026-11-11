import { useCallback, useEffect, useState } from "react";

const ADMIN_TOKEN_KEY = "living_space_admin_token";
const emptyProduct = {
  id: "",
  name: "",
  description: "",
  sku: "",
  price: "",
  category: "",
  stock: "0",
  thumbnail: "",
  image_url: "",
  is_active: true,
};

async function request(path, { token, ...options } = {}) {
  const headers = { Accept: "application/json", ...options.headers };
  if (options.body) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(path, { ...options, headers });
  } catch {
    throw new Error("Could not reach the store API. Check that Django is running.");
  }

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (!response.ok) {
    const detail = data?.detail || (data && typeof data === "object"
      ? Object.values(data).flat().join(" ")
      : "");
    const error = new Error(detail || `Request failed (${response.status}).`);
    error.status = response.status;
    throw error;
  }
  return data;
}

function ProductForm({ product, busy, onCancel, onSave }) {
  return (
    <form className="admin-product-form" onSubmit={onSave}>
      <div className="admin-form-heading">
        <div>
          <p className="admin-eyebrow">{product.id ? "EDIT PRODUCT" : "NEW PRODUCT"}</p>
          <h2>{product.id ? "Update product details" : "Add a product"}</h2>
        </div>
        <button className="admin-quiet-button" onClick={onCancel} type="button">Cancel</button>
      </div>
      <div className="admin-form-grid">
        <label>Product ID<input name="id" defaultValue={product.id} required maxLength={64} readOnly={Boolean(product.id)} /></label>
        <label>SKU<input name="sku" defaultValue={product.sku} required maxLength={64} /></label>
        <label className="admin-form-wide">Product name<input name="name" defaultValue={product.name} required maxLength={200} /></label>
        <label>Category<input name="category" defaultValue={product.category} required maxLength={100} /></label>
        <label>Price (₱)<input name="price" type="number" defaultValue={product.price} required min="0" step="0.01" /></label>
        <label>Stock<input name="stock" type="number" defaultValue={product.stock} required min="0" step="1" /></label>
        <label>Thumbnail URL<input name="thumbnail" type="url" defaultValue={product.thumbnail} maxLength={200} /></label>
        <label className="admin-form-wide">Image URL<input name="image_url" type="url" defaultValue={product.image_url} maxLength={200} /></label>
        <label className="admin-form-wide">Description<textarea name="description" defaultValue={product.description} rows="3" /></label>
        <label className="admin-active-toggle">
          <input name="is_active" type="checkbox" defaultChecked={product.is_active} />
          Visible in the storefront
        </label>
      </div>
      <div className="admin-form-actions">
        <button className="admin-primary-button" disabled={busy} type="submit">{busy ? "Saving…" : "Save product"}</button>
        <button className="admin-quiet-button" disabled={busy} onClick={onCancel} type="button">Cancel</button>
      </div>
    </form>
  );
}

export default function AdminProducts() {
  const [token, setToken] = useState(() => localStorage.getItem(ADMIN_TOKEN_KEY) || "");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const loadProducts = useCallback(async (activeToken) => {
    setLoading(true);
    setError("");
    try {
      const data = await request("/api/admin/products/", { token: activeToken });
      setProducts(Array.isArray(data) ? data : []);
    } catch (loadError) {
      if (loadError.status === 401 || loadError.status === 403) {
        localStorage.removeItem(ADMIN_TOKEN_KEY);
        setToken("");
      }
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) loadProducts(token);
  }, [token, loadProducts]);

  const login = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const result = await request("/api/admin/auth/login/", {
        method: "POST",
        body: JSON.stringify({
          username: String(form.get("username") || "").trim(),
          password: String(form.get("password") || ""),
        }),
      });
      if (!result?.access) throw new Error("The server did not return an admin token.");
      localStorage.setItem(ADMIN_TOKEN_KEY, result.access);
      setToken(result.access);
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setBusy(false);
    }
  };

  const saveProduct = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());
    payload.is_active = formData.has("is_active");
    payload.stock = Number(payload.stock);
    try {
      const isEditing = Boolean(editingProduct?.id);
      const endpoint = isEditing
        ? `/api/admin/products/${encodeURIComponent(editingProduct.id)}/`
        : "/api/admin/products/";
      const saved = await request(endpoint, {
        token,
        method: isEditing ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });
      setProducts((current) => isEditing
        ? current.map((product) => product.id === saved.id ? saved : product)
        : [saved, ...current]);
      setEditingProduct(null);
      setNotice(isEditing ? "Product updated." : "Product added.");
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setBusy(false);
    }
  };

  const archiveProduct = async (product) => {
    if (!window.confirm(`Delete "${product.name}" from the storefront? You can restore it later.`)) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await request(`/api/admin/products/${encodeURIComponent(product.id)}/`, {
        token,
        method: "DELETE",
      });
      setProducts((current) => current.map((entry) => entry.id === product.id
        ? { ...entry, is_active: false }
        : entry));
      setNotice(`${product.name} is no longer visible in the storefront.`);
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setBusy(false);
    }
  };

  const signOut = () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    setToken("");
    setProducts([]);
    setEditingProduct(null);
    setError("");
    setNotice("");
  };

  const visibleProducts = products.filter((product) => {
    const matchesSearch = `${product.name} ${product.id} ${product.sku} ${product.category}`
      .toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (showInactive || product.is_active);
  });

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <a className="admin-brand" href="/">LIVING SPACE<span>.</span></a>
        <a className="admin-store-link" href="/">Back to storefront <span aria-hidden="true">↗</span></a>
      </header>

      {!token ? (
        <section className="admin-login-card">
          <p className="admin-eyebrow">STORE ADMINISTRATION</p>
          <h1>Manage your products.</h1>
          <p className="admin-intro">Sign in with your Django staff or superuser account.</p>
          {error && <p className="admin-alert" role="alert">{error}</p>}
          <form className="admin-login-form" onSubmit={login}>
            <label>Username<input name="username" autoComplete="username" required /></label>
            <label>Password<input name="password" type="password" autoComplete="current-password" required /></label>
            <button className="admin-primary-button" disabled={busy} type="submit">{busy ? "Signing in…" : "Sign in"}</button>
          </form>
          <p className="admin-login-help">Create an admin account in the terminal with <code>python manage.py createsuperuser</code>.</p>
        </section>
      ) : (
        <section className="admin-content">
          <div className="admin-title-row">
            <div>
              <p className="admin-eyebrow">CATALOG CONTROL</p>
              <h1>Products</h1>
              <p className="admin-intro">Add products, update stock and pricing, or hide products from the storefront.</p>
            </div>
            <div className="admin-header-actions">
              <button className="admin-primary-button" onClick={() => setEditingProduct({ ...emptyProduct })} type="button">＋ Add product</button>
              <button className="admin-quiet-button" onClick={signOut} type="button">Sign out</button>
            </div>
          </div>
          {error && <p className="admin-alert" role="alert">{error}</p>}
          {notice && <p className="admin-notice" role="status">{notice}</p>}
          {editingProduct && <ProductForm
            key={editingProduct.id || "new"}
            product={editingProduct}
            busy={busy}
            onCancel={() => setEditingProduct(null)}
            onSave={saveProduct}
          />}
          <div className="admin-toolbar">
            <label className="admin-search">Search products<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, ID, SKU, or category" /></label>
            <label className="admin-inactive-filter"><input type="checkbox" checked={showInactive} onChange={(event) => setShowInactive(event.target.checked)} />Show hidden products</label>
            <span className="admin-count">{visibleProducts.length} product{visibleProducts.length === 1 ? "" : "s"}</span>
          </div>
          {loading ? <p className="admin-empty">Loading products…</p> : error && !products.length ? null : visibleProducts.length ? (
            <div className="admin-product-list">
              {visibleProducts.map((product) => (
                <article className={`admin-product-row ${product.is_active ? "" : "is-inactive"}`} key={product.id}>
                  {product.thumbnail
                    ? <img className="admin-product-image" src={product.thumbnail} alt="" />
                    : <div className="admin-product-placeholder">LS.</div>}
                  <div className="admin-product-info">
                    <h2>{product.name}</h2>
                    <p>{product.category} <span>·</span> ID {product.id} <span>·</span> SKU {product.sku}</p>
                    <div className="admin-product-meta">
                      <strong>₱{Number(product.price).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                      <span>{product.stock} in stock</span>
                      <span className={product.is_active ? "admin-status-active" : "admin-status-hidden"}>{product.is_active ? "Visible" : "Hidden"}</span>
                    </div>
                  </div>
                  <div className="admin-product-actions">
                    <button className="admin-quiet-button" disabled={busy} onClick={() => setEditingProduct({ ...product })} type="button">Edit</button>
                    {product.is_active
                      ? <button className="admin-danger-button" disabled={busy} onClick={() => archiveProduct(product)} type="button">Delete</button>
                      : <button className="admin-quiet-button" disabled={busy} onClick={() => setEditingProduct({ ...product, is_active: true })} type="button">Restore</button>}
                  </div>
                </article>
              ))}
            </div>
          ) : <p className="admin-empty">{search ? "No products match your search." : "No products to show."}</p>}
        </section>
      )}
    </main>
  );
}
