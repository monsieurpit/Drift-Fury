import { createContext, useContext, useEffect, useState } from "react";
import { base44 } from "../api/base44Client.js";
import { appParams } from "./app-params.js";
const AuthContext = createContext();
const AUTH_REQUIRED = {
  type: "auth_required",
  message: "Authentication required",
};
/**
 * Checks the Base44 app settings and the signed-in user. When the Base44 backend is not reachable
 * (the usual case for this static deployment) it falls back to local mode: no user, no error,
 * and the game simply runs.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(null);
  useEffect(() => {
    checkAppState();
  }, []);
  const continueWithoutUser = () => {
    setIsLoadingAuth(false);
    setIsAuthenticated(false);
    setAuthChecked(true);
  };
  const checkAppState = async () => {
    try {
      setIsLoadingPublicSettings(true);
      setAuthError(null);
      if (!base44?.app || typeof base44.app.getPublicSettings != "function") {
        console.warn("Base44 app SDK unavailable; continuing without app metadata.");
        setAppPublicSettings(null);
        continueWithoutUser();
        setIsLoadingPublicSettings(false);
        return;
      }
      try {
        const settings = await base44.app.getPublicSettings();
        setAppPublicSettings(settings);
        if (appParams.token) {
          await checkUserAuth();
        } else {
          continueWithoutUser();
        }
        setIsLoadingPublicSettings(false);
      } catch (error) {
        const status = error?.status;
        const backendUnavailable =
          status === 404 || status === 405 || status === 410 || status === 500 || !status;
        if (backendUnavailable) {
          console.warn("Base44 app state unavailable; falling back to local static app mode.", error);
          setAppPublicSettings(null);
          continueWithoutUser();
          setIsLoadingPublicSettings(false);
          return;
        }
        console.error("App state check failed:", error);
        if (error.status === 403 && error.data?.extra_data?.reason) {
          const reason = error.data.extra_data.reason;
          setAuthError(
            reason === "auth_required"
              ? AUTH_REQUIRED
              : reason === "user_not_registered"
                ? {
                    type: "user_not_registered",
                    message: "User not registered for this app",
                  }
                : {
                    type: reason,
                    message: error.message,
                  },
          );
        } else {
          setAuthError({
            type: "unknown",
            message: error.message || "Failed to load app",
          });
        }
        setIsLoadingPublicSettings(false);
        setIsLoadingAuth(false);
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      setAuthError({
        type: "unknown",
        message: error.message || "An unexpected error occurred",
      });
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
    }
  };
  const checkUserAuth = async () => {
    try {
      if (!base44?.auth || typeof base44.auth.me != "function") {
        continueWithoutUser();
        return;
      }
      setIsLoadingAuth(true);
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
      setIsLoadingAuth(false);
      setAuthChecked(true);
    } catch (error) {
      console.warn("User auth check unavailable in local mode; continuing without auth.", error);
      continueWithoutUser();
      if (error.status === 401 || error.status === 403) setAuthError(AUTH_REQUIRED);
    }
  };
  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    if (shouldRedirect) {
      base44.auth.logout(window.location.href);
    } else {
      base44.auth.logout();
    }
  };
  const navigateToLogin = () => {
    base44.auth.redirectToLogin(window.location.href);
  };
  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings,
        authError,
        appPublicSettings,
        authChecked,
        logout,
        navigateToLogin,
        checkUserAuth,
        checkAppState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw Error("useAuth must be used within an AuthProvider");
  return context;
};
