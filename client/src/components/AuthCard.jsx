import { Link } from "react-router-dom";
import logo from "../assets/logo.svg";

export default function AuthCard({
  title,
  subtitle,
  alternateText,
  alternateLink,
  children
}) {
  return (
    <div className="auth-shell">
      <div className="auth-panel">
        <div className="auth-brand">
          <div className="auth-logo">
            <img src={logo} alt="Grano" />
          </div>
          <div>
            <p className="eyebrow">Grano</p>
            <h1>{title}</h1>
            <p className="muted">{subtitle}</p>
            <p className="tagline">Controle financeiro claro, simples e visual.</p>
          </div>
        </div>
        {children}
        {alternateText && alternateLink && (
          <p className="auth-switch">
            {alternateText} <Link to={alternateLink.href}>{alternateLink.label}</Link>
          </p>
        )}
      </div>
    </div>
  );
}
