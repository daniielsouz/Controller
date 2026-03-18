import { Navigate } from "react-router-dom";
import { useState } from "react";
import AuthCard from "../components/AuthCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function RegisterPage() {
  const { token, saveAuth, http } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
      subtitle="Cadastre nome, e-mail e senha para acessar os lancamentos."
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
          <input
            type="password"
            value={form.password}
            onChange={handleChange("password")}
            required
            autoComplete="new-password"
            disabled={submitting}
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="primary" type="submit" disabled={submitting}>
          {submitting ? "Cadastrando..." : "Cadastrar"}
        </button>
      </form>
    </AuthCard>
  );
}
