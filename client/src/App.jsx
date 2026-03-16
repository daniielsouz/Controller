import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";

const ProtectedRoute = ({ children }) => {
  const { token, loading } = useAuth();
  if (loading) {
    return <div className="auth-shell">Carregando...</div>;
  }
  return token ? children : <Navigate to="/login" replace />;
};

export default function App() {
  const { token, loading } = useAuth();

  if (loading) {
    return <div className="auth-shell">Carregando...</div>;
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to={token ? "/dashboard" : "/login"} replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/cadastro" element={<RegisterPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
