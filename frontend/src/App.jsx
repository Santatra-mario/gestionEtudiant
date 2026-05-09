import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import Layout from "./components/layout/Layout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import EtudiantsPage from "./pages/EtudiantsPage";
import EtudiantDetailPage from "./pages/EtudiantDetailPage";
import InscriptionsPage from "./pages/InscriptionsPage";
import NotesPage from "./pages/NotesPage";
import NotesSaisiePage from "./pages/NotesSaisiePage";
import FilieresPage from "./pages/FilieresPage";
import UtilisateursPage from "./pages/UtilisateursPage";

function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <span className="spinner" />
      </div>
    );
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="etudiants" element={<EtudiantsPage />} />
        <Route path="etudiants/:id" element={<EtudiantDetailPage />} />
        <Route path="inscriptions" element={<InscriptionsPage />} />
        <Route path="notes" element={<NotesPage />} />
        <Route path="notes/saisie" element={
          <PrivateRoute roles={["administrateur", "secretaire", "enseignant"]}>
            <NotesSaisiePage />
          </PrivateRoute>
        } />
        <Route path="filieres" element={
          <PrivateRoute roles={["administrateur", "secretaire"]}>
            <FilieresPage />
          </PrivateRoute>
        } />
        <Route path="utilisateurs" element={
          <PrivateRoute roles={["administrateur"]}>
            <UtilisateursPage />
          </PrivateRoute>
        } />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
