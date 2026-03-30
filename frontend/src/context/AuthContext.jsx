import React, { createContext, useContext, useMemo, useState } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const login = (authData) => {
    const { token, user } = authData;

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));

    setToken(token);
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setToken("");
    setUser(null);
  };

  const value = useMemo(
    () => ({
      token,
      user,
      role: user?.role || null,
      roles: user?.roles || [], // Add all roles array
      isAuthenticated: !!token,
      hasRole: (requiredRole) => {
        // Check if user has a specific role (primary or in roles array)
        if (!user) return false;
        if (user.role === requiredRole) return true;
        return user.roles && user.roles.includes(requiredRole);
      },
      hasAnyRole: (requiredRoles) => {
        // Check if user has any of the required roles
        if (!user) return false;
        return requiredRoles.some(role => 
          user.role === role || (user.roles && user.roles.includes(role))
        );
      },
      login,
      logout,
    }),
    [token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);