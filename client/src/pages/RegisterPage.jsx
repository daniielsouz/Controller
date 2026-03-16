import { Navigate } from "react-router-dom";
import { useState } from "react";
import AuthCard from "../components/AuthCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function RegisterPage() {
  const { token, saveAuth, http } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const { data } = await http.post("/auth/register", form);
      saveAuth(data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Falha no cadastro.");
    }
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
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            required
          />
        </label>
        <label>
          E-mail
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            required
          />
        </label>
        <label>
          Senha
          <input
            type="password"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            required
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="primary" type="submit">
          Cadastrar
        </button>
      </form>
    </AuthCard>
  );
}
