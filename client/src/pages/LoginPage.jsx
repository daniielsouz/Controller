import { GoogleLogin } from "@react-oauth/google";
import { Link, Navigate } from "react-router-dom";
import { useState } from "react";
import AuthCard from "../components/AuthCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function LoginPage() {
  const { token, loading, saveAuth, http } = useAuth();
  const [form, setForm] = useState({ email: "", password: "", rememberMe: false });
  const [error, setError] = useState("");

  if (loading) {
    return null;
  }

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const { data } = await http.post("/auth/login", form);
      saveAuth(data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Falha no login.");
    }
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
        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={form.rememberMe}
            onChange={(event) =>
              setForm((current) => ({ ...current, rememberMe: event.target.checked }))
            }
          />
          <span>Lembre de mim por 30 dias</span>
        </label>
        {error && <p className="error">{error}</p>}
        <button className="primary" type="submit">
          Entrar
        </button>
      </form>

      <div className="divider">ou</div>

      <GoogleLogin
        onSuccess={async (credentialResponse) => {
          try {
            const { data } = await http.post("/auth/google", {
              credential: credentialResponse.credential,
              rememberMe: form.rememberMe
            });
            saveAuth(data);
          } catch (_error) {
            setError("Falha no login com Google.");
          }
        }}
        onError={() => setError("Falha no login com Google.")}
      />

      <p className="muted centered">
        <Link to="/cadastro">Criar conta com nome, e-mail e senha</Link>
      </p>
    </AuthCard>
  );
}
