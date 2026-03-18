import { Link, Navigate } from "react-router-dom";
import { useState } from "react";
import AuthCard from "../components/AuthCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function LoginPage() {
  const { token, loading, saveAuth, http } = useAuth();
  const [form, setForm] = useState({ email: "", password: "", rememberMe: false });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return null;
  }

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
      const { data } = await http.post("/auth/login", form);
      saveAuth(data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Falha no login.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field) => (event) => {
    const value = field === "rememberMe" ? event.target.checked : event.target.value;
    setError("");
    setForm((current) => ({ ...current, [field]: value }));
  };

  return (
    <AuthCard
      title="Entrar"
      subtitle="Acesse seu controle financeiro mensal."
      alternateText="Ainda nao tem conta?"
      alternateLink={{ href: "/cadastro", label: "Cadastre-se" }}
    >
      <form className="form-grid" onSubmit={handleSubmit}>
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
          <input
            type="password"
            value={form.password}
            onChange={handleChange("password")}
            required
            autoComplete="current-password"
            disabled={submitting}
          />
        </label>
        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={form.rememberMe}
            onChange={handleChange("rememberMe")}
            disabled={submitting}
          />
          <span>Lembre de mim por 30 dias</span>
        </label>
        {error && <p className="error">{error}</p>}
        <button className="primary" type="submit" disabled={submitting}>
          {submitting ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p className="muted centered">
        <Link to="/cadastro">Criar conta com nome, e-mail e senha</Link>
      </p>
    </AuthCard>
  );
}
