import { Routes, Route, BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { ScrollToTop } from "./components/ScrollToTop.js";
import { UserNotRegisteredError } from "./components/UserNotRegisteredError.jsx";
import { Toaster } from "./components/ui/toaster.jsx";
import { AuthProvider, useAuth } from "./lib/AuthContext.jsx";
import { queryClientInstance } from "./lib/query-client.js";
import { GamePage } from "./pages/GamePage.jsx";
import { PageNotFound } from "./pages/PageNotFound.jsx";
const AuthenticatedApp = () => {
  const {
    isLoadingAuth: e,
    isLoadingPublicSettings: t,
    authError: n,
    navigateToLogin: r,
  } = useAuth();
  if (t || e) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }
  if (n) {
    if (n.type === "user_not_registered") {
      return <UserNotRegisteredError />;
    }
    if (n.type === "auth_required") {
      r();
      return null;
    }
  }
  return (
    <Routes>
      <Route path="/" element={<GamePage />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};
export function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <BrowserRouter>
          <ScrollToTop />
          <AuthenticatedApp />
        </BrowserRouter>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}
