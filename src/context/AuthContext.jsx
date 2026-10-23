import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("access"));

  const saveLogin = (access, refresh) => {
    localStorage.setItem("access", access);
    localStorage.setItem("refresh", refresh);
    setToken(access);
  };

  const logout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    setToken(null);
  };

  return (
  <AuthContext.Provider value=({ token, saveLogin, logout})>
    {children}
  </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
