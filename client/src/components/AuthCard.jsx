import { Link } from "react-router-dom";

export default function AuthCard({ title, subtitle, alternateText, alternateLink, children }) {
  return (
    <div className="auth-shell">
      <div className="auth-panel">
        <div>
          <p className="eyebrow">Controller Financeiro</p>
          <h1>{title}</h1>
          <p className="muted">{subtitle}</p>
        </div>
        {children}
        <p className="auth-switch">
          {alternateText} <Link to={alternateLink.href}>{alternateLink.label}</Link>
        </p>
      </div>
    </div>
  );
}
