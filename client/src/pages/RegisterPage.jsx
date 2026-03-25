import { Navigate } from "react-router-dom";
import { useState } from "react";
import AuthCard from "../components/AuthCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function RegisterPage() {
  const { token, saveAuth, http } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) {
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      const { data } = await http.post("/auth/register", form);
      saveAuth(data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Falha no cadastro.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field) => (event) => {
    setError("");
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  return (
    <AuthCard
      title="Criar conta"
      subtitle=""
      alternateText="Ja possui conta?"
      alternateLink={{ href: "/login", label: "Entrar" }}
    >
      <form className="form-grid" onSubmit={handleSubmit}>
        <label>
          Nome
          <input
            value={form.name}
            onChange={handleChange("name")}
            required
            autoComplete="name"
            disabled={submitting}
          />
        </label>
        <label>
          E-mail
          <input
            type="email"
            value={form.email}
            onChange={handleChange("email")}
            required
            autoComplete="email"
            disabled={submitting}
          />
        </label>
        <label>
          Senha
          <div className="password-field">
            <input
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={handleChange("password")}
              required
              autoComplete="new-password"
              disabled={submitting}
            />
            <button
              type="button"
              className="toggle-visibility"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m15 18-.722-3.25" />
                  <path d="M2 8a10.645 10.645 0 0 0 20 0" />
                  <path d="m20 15-1.726-2.05" />
                  <path d="m4 15 1.726-2.05" />
                  <path d="m9 18 .722-3.25" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </label>
        {error && <p className="error">{error}</p>}
        <button className="primary" type="submit" disabled={submitting}>
          {submitting ? "Cadastrando..." : "Cadastrar"}
        </button>
      </form>
    </AuthCard>
  );
}
