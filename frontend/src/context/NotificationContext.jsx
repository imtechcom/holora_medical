/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useCallback } from "react";

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState({
    appointments: 0,
    consultations: 0,
    messages: 0,
    alerts: 0,
  });

  const updateNotifications = useCallback((type, count) => {
    setNotifications((prev) => ({
      ...prev,
      [type]: count,
    }));
  }, []);

  const incrementNotification = useCallback((type) => {
    setNotifications((prev) => ({
      ...prev,
      [type]: prev[type] + 1,
    }));
  }, []);

  const clearNotification = useCallback((type) => {
    setNotifications((prev) => ({
      ...prev,
      [type]: 0,
    }));
  }, []);

  const getTotalNotifications = () => {
    return Object.values(notifications).reduce((sum, val) => sum + val, 0);
  };

  const value = {
    notifications,
    updateNotifications,
    incrementNotification,
    clearNotification,
    getTotalNotifications,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return context;
};
