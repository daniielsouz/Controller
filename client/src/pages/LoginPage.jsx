import { Link, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import AuthCard from "../components/AuthCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function LoginPage() {
  const { token, loading, saveAuth, http } = useAuth();
  const [form, setForm] = useState({ email: "", password: "", rememberMe: false });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotStage, setForgotStage] = useState("request");
  const [forgotForm, setForgotForm] = useState({
    email: "",
    token: "",
    password: "",
    confirmPassword: ""
  });
  const [forgotStatus, setForgotStatus] = useState({ type: "", text: "" });
  const [forgotSubmitting, setForgotSubmitting] = useState(false);

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

  const handleForgotRequest = async () => {
    const emailValue = forgotForm.email.trim();

    if (!emailValue) {
      setForgotStatus({ type: "error", text: "Informe o e-mail para receber o código." });
      return;
    }

    setForgotSubmitting(true);
    setForgotStatus({ type: "", text: "" });

    try {
      await http.post("/password/forgot", { email: emailValue });
      setForgotStage("reset");
      setForgotStatus({
        type: "success",
        text: "Código enviado! Verifique seu e-mail e cole o código aqui."
      });
    } catch (requestError) {
      setForgotStatus({
        type: "error",
        text: requestError.response?.data?.message || "Falha ao solicitar o código."
      });
    } finally {
      setForgotSubmitting(false);
    }
  };

  const handleForgotReset = async () => {
    if (!forgotForm.token.trim()) {
      setForgotStatus({ type: "error", text: "Informe o código recebido por e-mail." });
      return;
    }

    if (!forgotForm.password) {
      setForgotStatus({ type: "error", text: "Informe a nova senha." });
      return;
    }

    if (forgotForm.password !== forgotForm.confirmPassword) {
      setForgotStatus({ type: "error", text: "As senhas precisam coincidir." });
      return;
    }

    setForgotSubmitting(true);
    setForgotStatus({ type: "", text: "" });

    try {
      await http.post("/password/reset", {
        token: forgotForm.token.trim(),
        password: forgotForm.password
      });
      setForgotStatus({
        type: "success",
        text: "Senha alterada! Utilize sua nova senha para logar."
      });
      setTimeout(() => {
        setIsForgotOpen(false);
        setForgotStage("request");
        setForgotForm((current) => ({
          ...current,
          token: "",
          password: "",
          confirmPassword: ""
        }));
      }, 1500);
    } catch (requestError) {
      setForgotStatus({
        type: "error",
        text: requestError.response?.data?.message || "Falha ao redefinir a senha."
      });
    } finally {
      setForgotSubmitting(false);
    }
  };

  useEffect(() => {
    if (!isForgotOpen) {
      setForgotStatus({ type: "", text: "" });
      setForgotForm((current) => ({
        ...current,
        token: "",
        password: "",
        confirmPassword: ""
      }));
      setForgotStage("request");
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
        <button
          type="button"
          className="ghost"
          onClick={() => setIsForgotOpen(true)}
          disabled={submitting}
        >
          Esqueci minha senha
        </button>
      </form>

      <p className="muted centered">
        <Link to="/cadastro">Criar conta com nome, e-mail e senha</Link>
      </p>
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
                  setForgotStage("request");
                }}
              >
                Fechar
              </button>
            </div>
            <p>
              Informe o e-mail associado à conta para receber um código válido por 30 minutos ou
              um link seguro para definir uma nova senha.
            </p>
            {forgotStatus.text && (
              <p className={`inline-message ${forgotStatus.type === "error" ? "error" : "success"}`}>
                {forgotStatus.text}
              </p>
            )}
            {forgotStage === "request" ? (
              <>
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
                    {forgotSubmitting ? "Enviando..." : "Enviar código"}
                  </button>
                  <button
                    type="button"
                    className="ghost"
                    onClick={() => setIsForgotOpen(false)}
                    disabled={forgotSubmitting}
                  >
                    Cancelar
                  </button>
                </div>
              </>
            ) : (
              <>
                <label>
                  Código
                  <input
                    value={forgotForm.token}
                    onChange={(event) =>
                      setForgotForm((current) => ({ ...current, token: event.target.value }))
                    }
                    placeholder="Cole o código recebido"
                    disabled={forgotSubmitting}
                  />
                </label>
                <label>
                  Nova senha
                  <input
                    type="password"
                    value={forgotForm.password}
                    onChange={(event) =>
                      setForgotForm((current) => ({ ...current, password: event.target.value }))
                    }
                    disabled={forgotSubmitting}
                  />
                </label>
                <label>
                  Confirme a senha
                  <input
                    type="password"
                    value={forgotForm.confirmPassword}
                    onChange={(event) =>
                      setForgotForm((current) => ({
                        ...current,
                        confirmPassword: event.target.value
                      }))
                    }
                    disabled={forgotSubmitting}
                  />
                </label>
                <div className="form-actions">
                  <button
                    className="primary"
                    type="button"
                    onClick={handleForgotReset}
                    disabled={forgotSubmitting}
                  >
                    {forgotSubmitting ? "Atualizando..." : "Redefinir senha"}
                  </button>
                  <button
                    type="button"
                    className="ghost"
                    onClick={() => {
                      setIsForgotOpen(false);
                      setForgotStage("request");
                    }}
                    disabled={forgotSubmitting}
                  >
                    Cancelar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </AuthCard>
  );
}
