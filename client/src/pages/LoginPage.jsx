import { Link, Navigate, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import AuthCard from "../components/AuthCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function LoginPage() {
  const { token, loading, saveAuth, http } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", rememberMe: false });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotForm, setForgotForm] = useState({ email: "" });
  const [forgotStatus, setForgotStatus] = useState({ type: "", text: "" });
  const [forgotSubmitting, setForgotSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
      navigate("/dashboard", { replace: true });
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

  const handleForgotRequest = async () => {
    const emailValue = forgotForm.email.trim();

    if (!emailValue) {
      setForgotStatus({ type: "error", text: "Informe o e-mail para receber o codigo." });
      return;
    }

    setForgotSubmitting(true);
    setForgotStatus({ type: "", text: "" });

    try {
      await http.post("/password/forgot", { email: emailValue });
      setForgotStatus({
        type: "success",
        text: "Codigo enviado."
      });
    } catch (requestError) {
      setForgotStatus({
        type: "error",
        text: requestError.response?.data?.message || "Falha ao solicitar o link."
      });
    } finally {
      setForgotSubmitting(false);
    }
  };
  useEffect(() => {
    if (!isForgotOpen) {
      setForgotStatus({ type: "", text: "" });
      setForgotForm((current) => ({
        email: ""
      }));
    }
  }, [isForgotOpen]);

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
          <div className="password-field">
            <input
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={handleChange("password")}
              required
              autoComplete="current-password"
              disabled={submitting}
            />
            <button
              type="button"
              className="toggle-visibility"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPassword ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m15 18-.722-3.25" />
                  <path d="M2 8a10.645 10.645 0 0 0 20 0" />
                  <path d="m20 15-1.726-2.05" />
                  <path d="m4 15 1.726-2.05" />
                  <path d="m9 18 .722-3.25" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </label>
        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={form.rememberMe}
            onChange={handleChange("rememberMe")}
            disabled={submitting}
          />
          <span>Lembre de mim</span>
        </label>
        {error && <p className="error">{error}</p>}
        <button className="primary" type="submit" disabled={submitting}>
          {submitting ? "Entrando..." : "Entrar"}
        </button>
        <button
          type="button"
          className="ghost forgot"
          onClick={() => setIsForgotOpen(true)}
          disabled={submitting}
        >
          Esqueci minha senha
        </button>
      </form>

      {isForgotOpen && (
        <div className="forgot-modal">
          <div className="forgot-card card">
            <div className="forgot-header">
              <h3>Redefinir senha</h3>
              <button
                type="button"
                className="ghost mini-button"
                onClick={() => {
                  setIsForgotOpen(false);
                }}
              >
                Fechar
              </button>
            </div>
            <p>Digite seu e-mail para receber o código de redefinição.</p>
            {forgotStatus.text && (
              <p className={`inline-message ${forgotStatus.type === "error" ? "error" : "success"}`}>
                {forgotStatus.text}
              </p>
            )}
            <label>
              E-mail
              <input
                type="email"
                value={forgotForm.email}
                onChange={(event) => {
                  setForgotForm((current) => ({ ...current, email: event.target.value }));
                  setForgotStatus({ type: "", text: "" });
                }}
                placeholder="nome@empresa.com"
                disabled={forgotSubmitting}
              />
            </label>
            <div className="form-actions">
              <button
                className="primary"
                type="button"
                onClick={handleForgotRequest}
                disabled={forgotSubmitting}
              >
                {forgotSubmitting ? "Enviando..." : "Enviar link"}
              </button>
              <button
                type="button"
                className="danger outline"
                onClick={() => setIsForgotOpen(false)}
                disabled={forgotSubmitting}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthCard>
  );
}
