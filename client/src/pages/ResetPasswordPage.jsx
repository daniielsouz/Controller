import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import AuthCard from "../components/AuthCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const CODE_TTL_MS = 5 * 60 * 1000;

export default function ResetPasswordPage() {
  const { http } = useAuth();
  const location = useLocation();

  const [code, setCode] = useState("");
  const [isCodeVerified, setIsCodeVerified] = useState(false);
  const [codeStatus, setCodeStatus] = useState({ type: "", text: "" });
  const [codeVerifying, setCodeVerifying] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ password: "", confirm: "" });
  const [passwordStatus, setPasswordStatus] = useState({ type: "", text: "" });
  const [submitting, setSubmitting] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resendEmail, setResendEmail] = useState("");
  const [resendStatus, setResendStatus] = useState({ type: "", text: "" });
  const [resendSubmitting, setResendSubmitting] = useState(false);
  const [codeExpiresAt, setCodeExpiresAt] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);

  const verifyCode = async (codeValue) => {
    const trimmed = codeValue.trim();

    if (!trimmed) {
      setCodeStatus({ type: "error", text: "Informe o codigo recebido por e-mail." });
      return;
    }

    setCodeVerifying(true);
    setCodeStatus({ type: "", text: "" });
    setIsCodeVerified(false);

    try {
      const { data } = await http.post("/password/verify", { code: trimmed });
      const serverExpiration = data?.expiresAt ? new Date(data.expiresAt).getTime() : null;
      const remaining = serverExpiration ? Math.max(serverExpiration - Date.now(), 0) : CODE_TTL_MS;
      setIsCodeVerified(remaining > 0);
      setCodeStatus({ type: "success", text: "Codigo validado. Defina a nova senha." });
      setCodeExpiresAt(serverExpiration || Date.now() + CODE_TTL_MS);
      setTimeLeft(remaining);
    } catch (error) {
      setCodeStatus({
        type: "error",
        text: error.response?.data?.message || "Codigo invalido ou expirado."
      });
    } finally {
      setCodeVerifying(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const emailParam = params.get("email");
    if (emailParam && !resendEmail) {
      setResendEmail(emailParam);
    }
  }, [location.search]);

  const handleReset = async (event) => {
    event.preventDefault();

    if (!isCodeVerified) {
      setPasswordStatus({ type: "error", text: "Valide o codigo antes de enviar." });
      return;
    }

    if (!passwordForm.password) {
      setPasswordStatus({ type: "error", text: "Informe a nova senha." });
      return;
    }

    if (passwordForm.password !== passwordForm.confirm) {
      setPasswordStatus({ type: "error", text: "As senhas precisam coincidir." });
      return;
    }

    setSubmitting(true);
    setPasswordStatus({ type: "", text: "" });

    try {
      await http.post("/password/reset", {
        code: code.trim(),
        password: passwordForm.password
      });
      setPasswordStatus({
        type: "success",
        text: "Senha redefinida com sucesso. Use a nova senha para entrar."
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 1400);
    } catch (error) {
      setPasswordStatus({
        type: "error",
        text: error.response?.data?.message || "Falha ao redefinir a senha."
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendLink = async () => {
    if (!resendEmail.trim()) {
      setResendStatus({ type: "error", text: "Informe o e-mail para receber o codigo novamente." });
      return;
    }

    setResendSubmitting(true);
    setResendStatus({ type: "", text: "" });
    setIsCodeVerified(false);

    try {
      const { data } = await http.post("/password/forgot", { email: resendEmail.trim() });
      const serverExpiration = data?.expiresAt ? new Date(data.expiresAt).getTime() : null;
      const remaining = serverExpiration ? Math.max(serverExpiration - Date.now(), 0) : CODE_TTL_MS;
      setCodeExpiresAt(serverExpiration || Date.now() + CODE_TTL_MS);
      setTimeLeft(remaining);
      setResendStatus({ type: "success", text: "Codigo enviado! Verifique sua caixa de entrada." });
    } catch (error) {
      setResendStatus({
        type: "error",
        text: error.response?.data?.message || "Nao foi possivel enviar o codigo."
      });
    } finally {
      setResendSubmitting(false);
    }
  };

  useEffect(() => {
    if (!codeExpiresAt) {
      setTimeLeft(0);
      return undefined;
    }

    const tick = () => {
      const remaining = codeExpiresAt - Date.now();
      if (remaining <= 0) {
        setTimeLeft(0);
        setCodeExpiresAt(null);
        setIsCodeVerified(false);
        setResendSubmitting(false);
        setResendStatus({ type: "", text: "" });
        return;
      }
      setTimeLeft(remaining);
    };

    tick();
    const intervalId = window.setInterval(tick, 1000);
    return () => window.clearInterval(intervalId);
  }, [codeExpiresAt]);

  const formatTime = (milliseconds) => {
    const totalSeconds = Math.ceil(milliseconds / 1000);
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  return (
    <div className="auth-shell">
      <AuthCard
        title="Redefinir senha"
        subtitle="Insira o codigo recebido por e-mail e escolha uma nova senha."
      >
        {codeStatus.text && (
          <p className={`inline-message ${codeStatus.type === "error" ? "error" : "success"}`}>
            {codeStatus.text}
          </p>
        )}
        <div className="form-grid">
          <label>
            Codigo (8 caracteres)
            <input
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              placeholder="Ex: A1B2C3D4"
              disabled={codeVerifying}
            />
          </label>
          <button
            className="primary"
            type="button"
            onClick={() => verifyCode(code)}
            disabled={codeVerifying || !code.trim()}
          >
            {codeVerifying ? "Verificando..." : "Validar codigo"}
          </button>
          {timeLeft > 0 && (
            <p className="muted">
              Codigo valido por {formatTime(timeLeft)} (apos esse tempo, peça outro).
            </p>
          )}
        </div>
        <form className="form-grid" onSubmit={handleReset}>
          <label>
            Nova senha
            <div className="password-field">
              <input
                type={showNewPassword ? "text" : "password"}
                value={passwordForm.password}
                onChange={(event) =>
                  setPasswordForm((current) => ({ ...current, password: event.target.value }))
                }
                disabled={submitting || !isCodeVerified}
              />
              <button
                type="button"
                className="toggle-visibility"
                onClick={() => setShowNewPassword((v) => !v)}
                aria-label={showNewPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showNewPassword ? (
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
          <label>
            Confirme a senha
            <div className="password-field">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={passwordForm.confirm}
                onChange={(event) =>
                  setPasswordForm((current) => ({ ...current, confirm: event.target.value }))
                }
                disabled={submitting || !isCodeVerified}
              />
              <button
                type="button"
                className="toggle-visibility"
                onClick={() => setShowConfirmPassword((v) => !v)}
                aria-label={showConfirmPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showConfirmPassword ? (
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
          <button className="primary" type="submit" disabled={submitting || !isCodeVerified}>
            {submitting ? "Atualizando..." : "Redefinir senha"}
          </button>
        </form>
        {passwordStatus.text && (
          <p className={`inline-message ${passwordStatus.type === "error" ? "error" : "success"}`}>
            {passwordStatus.text}
          </p>
        )}
        <div className="forgot-resend">
          {resendStatus.text && (
            <p className={`inline-message ${resendStatus.type === "error" ? "error" : "success"}`}>
              {resendStatus.text}
            </p>
          )}
          <button
            className="ghost"
            type="button"
            onClick={handleResendLink}
            disabled={resendSubmitting || (timeLeft > 0 && codeExpiresAt) || !resendEmail.trim()}
          >
            {resendSubmitting ? "Enviando..." : "Solicitar novo codigo"}
          </button>
        </div>
      </AuthCard>
    </div>
  );
}
