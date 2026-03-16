import { createContext, useContext, useEffect, useState } from "react";
import { http, setAuthToken } from "../api/http.js";

const AuthContext = createContext(null);
const STORAGE_KEY = "controller_financeiro_auth";
const SESSION_KEY = "controller_financeiro_auth_session";

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedAuth =
      localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(SESSION_KEY);

    if (!savedAuth) {
      setLoading(false);
      return;
    }

    const restoreSession = async () => {
      try {
        const parsedAuth = JSON.parse(savedAuth);
        setAuthToken(parsedAuth.token);

        if (parsedAuth.rememberMe) {
          const { data } = await http.get("/auth/me");
          setToken(data.token);
          setUser(data.user);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } else {
          setToken(parsedAuth.token);
          setUser(parsedAuth.user);
        }
      } catch (_error) {
        localStorage.removeItem(STORAGE_KEY);
        sessionStorage.removeItem(SESSION_KEY);
        setAuthToken("");
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const saveAuth = (auth) => {
    setToken(auth.token);
    setUser(auth.user);
    setAuthToken(auth.token);
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(SESSION_KEY);

    if (auth.rememberMe) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
    } else {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(auth));
    }
  };

  const logout = () => {
    setToken("");
    setUser(null);
    setAuthToken("");
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(SESSION_KEY);
  };

  return (
    <AuthContext.Provider value={{ token, user, loading, saveAuth, logout, http }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
