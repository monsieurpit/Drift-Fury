import React from "react";
import { base44 } from "../api/base44Client.js";
import { appParams } from "./app-params.js";
const AuthContext = React.createContext();
export const AuthProvider = ({ children: e }) => {
  const [t, n] = React.useState(null);
  const [r, i] = React.useState(false);
  const [a, o] = React.useState(true);
  const [s, c] = React.useState(true);
  const [l, u] = React.useState(null);
  const [d, f] = React.useState(false);
  const [p, m] = React.useState(null);
  React.useEffect(() => {
    h();
  }, []);
  const h = async () => {
    try {
      c(true);
      u(null);
      if (!base44?.app || typeof base44.app.getPublicSettings != "function") {
        console.warn(
          "Base44 app SDK unavailable; continuing without app metadata.",
        );
        m(null);
        o(false);
        i(false);
        f(true);
        c(false);
        return;
      }
      try {
        const e = await base44.app.getPublicSettings();
        m(e);
        if (appParams.token) {
          await g();
        } else {
          (o(false), i(false), f(true));
        }
        c(false);
      } catch (e) {
        const t = e?.status;
        const n = t === 404 || t === 405 || t === 410 || t === 500 || !t;
        if (n) {
          console.warn(
            "Base44 app state unavailable; falling back to local static app mode.",
            e,
          );
          m(null);
          o(false);
          i(false);
          f(true);
          c(false);
          return;
        }
        console.error("App state check failed:", e);
        if (e.status === 403 && e.data?.extra_data?.reason) {
          const t = e.data.extra_data.reason;
          u(
            t === "auth_required"
              ? {
                  type: "auth_required",
                  message: "Authentication required",
                }
              : t === "user_not_registered"
                ? {
                    type: "user_not_registered",
                    message: "User not registered for this app",
                  }
                : {
                    type: t,
                    message: e.message,
                  },
          );
        } else {
          u({
            type: "unknown",
            message: e.message || "Failed to load app",
          });
        }
        c(false);
        o(false);
      }
    } catch (e) {
      console.error("Unexpected error:", e);
      u({
        type: "unknown",
        message: e.message || "An unexpected error occurred",
      });
      c(false);
      o(false);
    }
  };
  const g = async () => {
    try {
      if (!base44?.auth || typeof base44.auth.me != "function") {
        o(false);
        i(false);
        f(true);
        return;
      }
      o(true);
      const e = await base44.auth.me();
      n(e);
      i(true);
      o(false);
      f(true);
    } catch (e) {
      console.warn(
        "User auth check unavailable in local mode; continuing without auth.",
        e,
      );
      o(false);
      i(false);
      f(true);
      if (e.status === 401 || e.status === 403) {
        u({
          type: "auth_required",
          message: "Authentication required",
        });
      }
    }
  };
  return (
    <AuthContext.Provider
      value={{
        user: t,
        isAuthenticated: r,
        isLoadingAuth: a,
        isLoadingPublicSettings: s,
        authError: l,
        appPublicSettings: p,
        authChecked: d,
        logout: (e = true) => {
          n(null);
          i(false);
          if (e) {
            base44.auth.logout(window.location.href);
          } else {
            base44.auth.logout();
          }
        },
        navigateToLogin: () => {
          base44.auth.redirectToLogin(window.location.href);
        },
        checkUserAuth: g,
        checkAppState: h,
      }}
    >
      {e}
    </AuthContext.Provider>
  );
};
export const useAuth = () => {
  const e = React.useContext(AuthContext);
  if (!e) {
    throw Error("useAuth must be used within an AuthProvider");
  }
  return e;
};
